const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('#navigation');
if (menuButton && navigation) {
  menuButton.hidden = false;
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) {
      menuButton.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('is-open');
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      menuButton.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('is-open');
      menuButton.focus();
    }
  });
}
document.querySelectorAll('[data-year]').forEach(element => element.textContent = new Date().getFullYear());
const form = document.querySelector('#brief-form');
if (form) {
  const submit = form.querySelector('button[type="submit"]');
  const status = document.querySelector('#brief-status');
  const success = document.querySelector('#brief-success');
  const reference = document.querySelector('#brief-reference');
  const another = document.querySelector('#another-brief');
  const fields = [...form.querySelectorAll('input, select, textarea')];
  let sending = false;
  let sent = false;
  submit.disabled = false;
  const interests = {
    operations: ['AI & workflow automation', ''],
    poker: ['Venture collaboration', 'Poker Mastery'],
    owl: ['Venture collaboration', 'Owl Eyes']
  };
  const interest = interests[new URLSearchParams(location.search).get('interest')];
  if (interest) {
    form.elements.support.value = interest[0];
    form.elements.company.value = interest[1];
  }
  const essentials = ['name', 'email', 'support', 'message'];
  const updateProgress = () => {
    const count = essentials.filter(name => form.elements[name].value.trim() && form.elements[name].checkValidity()).length;
    document.querySelector('#brief-progress').textContent = `${count} of 4 essentials complete`;
  };
  form.addEventListener('input', updateProgress);
  updateProgress();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || sent) return;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const brief = Object.fromEntries(['name', 'email', 'company', 'support', 'timeline', 'message', 'website']
      .map(name => [name, String(data.get(name) || '').trim()]));
    sending = true;
    submit.disabled = true;
    fields.forEach(field => { field.disabled = true; });
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Sending your brief…';
    status.dataset.state = 'sending';
    try {
      const response = await fetch('/api/brief', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: JSON.stringify(brief)
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        if (response.status === 429) throw new Error('rate-limit');
        throw new Error('send-failed');
      }
      sent = true;
      reference.textContent = result.reference ? `REFERENCE / ${result.reference}` : '';
      reference.hidden = !result.reference;
      success.hidden = false;
      status.textContent = 'Your brief was sent to The Noctis Society.';
      status.dataset.state = 'success';
      success.focus();
    } catch (error) {
      status.textContent = error.message === 'rate-limit'
        ? 'Please wait a few minutes before sending another brief. You can also email support@thenoctissociety.com directly.'
        : 'We could not confirm delivery. Please try again, or email support@thenoctissociety.com directly.';
      status.dataset.state = 'error';
      submit.disabled = false;
    } finally {
      sending = false;
      fields.forEach(field => { field.disabled = sent; });
      form.removeAttribute('aria-busy');
    }
  });
  another.addEventListener('click', () => {
    form.reset();
    sent = false;
    success.hidden = true;
    submit.disabled = false;
    status.textContent = '';
    delete status.dataset.state;
    reference.hidden = true;
    reference.textContent = '';
    fields.forEach(field => { field.disabled = false; });
    updateProgress();
    form.elements.name.focus();
  });
}

// Native disclosures keep the dossiers and hidden note usable without JavaScript.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: 0.08});
  document.querySelectorAll('.section-head,.agent-map,.doctrine-heading').forEach(element => observer.observe(element));
}
const progress = document.createElement('div');
progress.className = 'reading-progress';
progress.setAttribute('aria-hidden', 'true');
document.querySelector('.nav')?.append(progress);
let progressPending = false;
const updateReadingProgress = () => {
  const distance = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = `${distance > 0 ? Math.min(100, scrollY / distance * 100) : 0}%`;
  progressPending = false;
};
addEventListener('scroll', () => {
  if (!progressPending) {
    progressPending = true;
    requestAnimationFrame(updateReadingProgress);
  }
}, {passive: true});
addEventListener('resize', updateReadingProgress);
document.addEventListener('visibilitychange', () => document.body.classList.toggle('scroll-paused', document.hidden));

// The public node is a visual identity, not an authentication boundary.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const opening = document.querySelector('.access-opening');
if (opening && !motionPreference.matches && !location.hash) {
  try {
    if (!localStorage.getItem('noctis-node-01-visited')) {
      localStorage.setItem('noctis-node-01-visited', '1');
      opening.hidden = false;
      const dismissOpening = () => { opening.hidden = true; };
      setTimeout(dismissOpening, 1550);
      document.addEventListener('keydown', dismissOpening, {once: true});
      document.addEventListener('pointerdown', dismissOpening, {once: true});
    }
  } catch { /* Storage restrictions must never prevent access. */ }
}
const crest = document.querySelector('.hero-art');
const crestButton = document.querySelector('.crest-reveal');
if (crest && crestButton) {
  crestButton.addEventListener('click', () => {
    const revealed = crestButton.getAttribute('aria-expanded') !== 'true';
    crestButton.setAttribute('aria-expanded', String(revealed));
    crest.classList.toggle('motto-visible', revealed);
  });
  let frame;
  crest.addEventListener('pointermove', event => {
    if (motionPreference.matches || event.pointerType !== 'mouse') return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const bounds = crest.getBoundingClientRect();
      crest.style.setProperty('--tilt-x', `${(event.clientY - bounds.top - bounds.height / 2) / bounds.height * -4}deg`);
      crest.style.setProperty('--tilt-y', `${(event.clientX - bounds.left - bounds.width / 2) / bounds.width * 4}deg`);
    });
  });
  crest.addEventListener('pointerleave', () => {
    cancelAnimationFrame(frame);
    crest.style.removeProperty('--tilt-x');
    crest.style.removeProperty('--tilt-y');
  });
}
if ('IntersectionObserver' in window) {
  const signals = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('signal-seen');
        entry.target.closest('.network')?.classList.add('signal-flow');
        signals.unobserve(entry.target);
      }
    });
  }, {threshold: .25});
  document.querySelectorAll('.network .division').forEach(node => signals.observe(node));
}
document.querySelectorAll('#navigation a').forEach(link => {
  const target = new URL(link.href);
  if (!target.hash && target.pathname === location.pathname) link.setAttribute('aria-current', 'page');
});
// Hash links remain native, while archive focus follows the opened document.
const focusDocument = () => {
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const target = document.getElementById(id);
  if (target?.classList.contains('archive-document')) target.focus({preventScroll: true});
};
addEventListener('hashchange', focusDocument);
focusDocument();
