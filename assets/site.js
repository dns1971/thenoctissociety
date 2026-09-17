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
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const brief = `NOCTIS — PROJECT BRIEF\n\nName: ${data.get('name')}\nEmail: ${data.get('email')}\nCompany: ${data.get('company') || 'Not supplied'}\nSupport: ${data.get('support')}\nTimeline: ${data.get('timeline')}\n\nWhat I am building:\n${data.get('message')}\n`;
    const output = document.querySelector('#brief-output');
    output.value = brief;
    document.querySelector('#email-brief').href = 'mailto:support@thenoctissociety.com?subject=' + encodeURIComponent('Noctis project inquiry — ' + data.get('support')) + '&body=' + encodeURIComponent(brief);
    document.querySelector('#brief-result').hidden = false;
    output.focus();
    document.querySelector('#brief-status').textContent = 'Your email is ready below. Open your email app to review and send it. Nothing has been sent yet.';
  });
  document.querySelector('#download-brief').addEventListener('click', () => {
    const blob = new Blob([document.querySelector('#brief-output').value], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'noctis-project-brief.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
