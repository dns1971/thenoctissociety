import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';

const origin = 'https://thenoctissociety.com';
const brief = {
  name: 'Test Visitor',
  email: 'visitor@example.com',
  company: 'Example Studio',
  support: 'Internal tools & reporting',
  timeline: 'Within three months',
  message: 'We would like to discuss an internal reporting tool for our team.',
  website: '',
};

function setup({send, visitorLimit = true, totalLimit = true} = {}) {
  const sent = [];
  const env = {
    ASSETS: {fetch: async () => new Response('public asset')},
    BRIEF_LIMIT: {limit: async () => ({success: visitorLimit})},
    BRIEF_TOTAL_LIMIT: {limit: async () => ({success: totalLimit})},
    BRIEF_EMAIL: {
      send: async email => {
        sent.push(email);
        return send ? send(email) : {messageId: 'accepted-by-email-service'};
      },
    },
  };
  const submit = (body = brief, headers = {}) => worker.fetch(new Request(`${origin}/api/brief`, {
    method: 'POST',
    headers: {'content-type': 'application/json', origin, ...headers},
    body: JSON.stringify(body),
  }), env);
  return {env, sent, submit};
}

test('sends a valid brief to the verified inbox and confirms acceptance', async () => {
  const {submit, sent} = setup();
  const response = await submit();
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.match(result.reference, /^NS-[A-F0-9]{8}$/);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'support@owleyesdroneservices.com');
  assert.equal(sent[0].from, 'support@thenoctissociety.com');
  assert.equal(sent[0].replyTo, brief.email);
  assert.match(sent[0].text, /Example Studio/);
  assert.match(sent[0].text, new RegExp(result.reference));
});

test('rejects incomplete briefs and wrong-origin submissions without sending', async () => {
  const {submit, sent} = setup();
  assert.equal((await submit({...brief, message: 'Short'})).status, 400);
  assert.equal((await submit(brief, {origin: 'https://other.example'})).status, 403);
  assert.equal(sent.length, 0);
});

test('rejects requests above the payload limit without sending', async () => {
  const {submit, sent} = setup();
  const response = await submit({...brief, message: 'A'.repeat(9000)});
  assert.equal(response.status, 400);
  assert.equal(sent.length, 0);
});

test('limits submission bursts before sending', async () => {
  const {submit, sent} = setup({visitorLimit: false});
  const response = await submit();
  assert.equal(response.status, 429);
  assert.equal(sent.length, 0);
});

test('does not report success when the email service fails', async () => {
  const {submit} = setup({send: async () => {throw new Error('delivery failed');}});
  const response = await submit();
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /could not send/i);
});

test('serves non-API routes from static assets', async () => {
  const {env} = setup();
  const response = await worker.fetch(new Request(`${origin}/contact/`), env);
  assert.equal(await response.text(), 'public asset');
});
