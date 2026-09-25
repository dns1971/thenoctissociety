const FROM = 'support@thenoctissociety.com';
const TO = 'support@owleyesdroneservices.com';
const supports = new Set([
  'AI & workflow automation',
  'Lead & follow-up systems',
  'Internal tools & reporting',
  'Venture collaboration',
  'Something else',
]);
const timelines = new Set([
  'Exploring options',
  'Within a month',
  'Within three months',
  'Longer-term project',
]);

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  },
});

async function readBrief(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return {error: 'Please submit the brief from this page.'};
  }
  const reader = request.body?.getReader();
  if (!reader) return {error: 'The brief is empty.'};
  const chunks = [];
  let size = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) {
      await reader.cancel();
      return {error: 'The brief is too long.'};
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let position = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, position);
    position += chunk.byteLength;
  }
  try {
    const body = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes));
    if (body === null || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid brief');
    return body;
  } catch {
    return {error: 'Please check the brief and try again.'};
  }
}

function validate(body) {
  const fields = ['name', 'email', 'company', 'support', 'timeline', 'message'];
  if (fields.some(field => typeof body[field] !== 'string')) return null;
  const brief = Object.fromEntries(fields.map(field => [field, body[field].trim()]));
  if (brief.name.length < 1 || brief.name.length > 100 ||
      brief.email.length > 200 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(brief.email) ||
      brief.company.length > 150 || !supports.has(brief.support) ||
      !timelines.has(brief.timeline) ||
      brief.message.length < 20 || brief.message.length > 1500) return null;
  return brief;
}

function formatBrief(brief, reference) {
  return `NOCTIS — PROJECT BRIEF\nREFERENCE: ${reference}\n\nName: ${brief.name}\nEmail: ${brief.email}\nCompany or project: ${brief.company || 'Not supplied'}\nSupport: ${brief.support}\nTimeline: ${brief.timeline}\n\nWhat I am building:\n${brief.message}\n`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/brief') return env.ASSETS.fetch(request);
    if (request.method !== 'POST') return json({error: 'Method not allowed.'}, 405);
    if (request.headers.get('origin') !== url.origin) return json({error: 'Please submit the brief from this site.'}, 403);

    let body;
    try {
      body = await readBrief(request);
    } catch {
      return json({error: 'The brief could not be read. Please try again.'}, 400);
    }
    if (body.error) return json({error: body.error}, 400);
    // Quietly drop obvious automated form fills without contacting the inbox.
    if (body.website) return json({ok: true, reference: 'NS-RECEIVED'});
    const brief = validate(body);
    if (!brief) return json({error: 'Please check the required fields and try again.'}, 400);

    try {
      const visitorKey = request.headers.get('cf-connecting-ip') || brief.email.toLowerCase();
      const [visitor, total] = await Promise.all([
        env.BRIEF_LIMIT.limit({key: visitorKey}),
        env.BRIEF_TOTAL_LIMIT.limit({key: 'noctis-brief'}),
      ]);
      if (!visitor.success || !total.success) {
        return json({error: 'Too many briefs were sent recently. Please try again shortly.'}, 429);
      }
      const reference = `NS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const result = await env.BRIEF_EMAIL.send({
        to: TO,
        from: FROM,
        replyTo: brief.email,
        subject: `Noctis brief — ${brief.support}`,
        text: formatBrief(brief, reference),
      });
      if (!result?.messageId) throw new Error('Email service returned no delivery ID');
      return json({ok: true, reference});
    } catch (error) {
      console.error('Brief delivery failed', error?.code || 'unknown');
      return json({error: 'We could not send your brief right now. Please try again or email us directly.'}, 503);
    }
  },
};
