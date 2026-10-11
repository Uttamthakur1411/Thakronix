(() => {
  'use strict';

  const menuToggle = document.getElementById('developerMenuToggle');
  const nav = document.getElementById('developerNav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
      nav.classList.toggle('open', isOpen);
    });
    nav.addEventListener('click', (event) => {
      if (!event.target.closest('a')) return;
      nav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
    });
  }

  const command = document.getElementById('developerCommand');
  const trigger = document.getElementById('commandTrigger');
  const closeButton = document.getElementById('commandClose');
  const input = document.getElementById('commandInput');
  const results = document.getElementById('commandResults');
  const destinations = [
    ['Projects', 'Selected work and the Thakronix case study', '#projects', 'bi-window-stack'],
    ['Thakronix case study', 'Problem, architecture, features and decisions', '/developer/projects/thakronix', 'bi-journal-richtext'],
    ['Technology stack', 'Tools evidenced in the current build', '#stack', 'bi-code-slash'],
    ['About Uttam', 'Background and development approach', '#about', 'bi-person'],
    ['Development thinking', 'How I plan, build, test and improve', '#thinking', 'bi-lightbulb'],
    ['Journey', 'BCA studies and current project', '#journey', 'bi-signpost-split'],
    ['GitHub profile', 'Public profile link is not connected yet', '#github', 'bi-github'],
    ['Credentials', 'Verified certificates and achievements', '#credentials', 'bi-patch-check'],
    ['Current work', 'Thakronix modules and focus areas', '#lab', 'bi-tools'],
    ['Current focus', 'What I am building and practicing', '#learning', 'bi-arrow-repeat'],
    ['Goals and opportunities', 'Roles and collaboration interests', '#goals', 'bi-bullseye'],
    ['Resume center', 'Print this profile or save it as PDF', '#resume', 'bi-file-earmark-person'],
    ['Contact', 'Send a message to Uttam', '#contact', 'bi-envelope']
  ];
  let activeIndex = 0;
  let previousFocus;

  function renderCommands(query = '') {
    if (!results) return;
    const normalized = query.trim().toLocaleLowerCase();
    const matched = destinations.filter(([title, description]) => `${title} ${description}`.toLocaleLowerCase().includes(normalized));
    results.replaceChildren();
    if (!matched.length) {
      const empty = document.createElement('p');
      empty.className = 'command-empty';
      empty.textContent = 'No matching section. Try “projects”, “stack” or “contact”.';
      results.append(empty);
      activeIndex = -1;
      return;
    }
    activeIndex = Math.min(activeIndex, matched.length - 1);
    matched.forEach(([title, description, href, icon], index) => {
      const link = document.createElement('a');
      link.className = 'command-result';
      link.href = href;
      link.setAttribute('role', 'option');
      link.setAttribute('aria-selected', String(index === activeIndex));
      const glyph = document.createElement('i');
      glyph.className = `bi ${icon}`;
      glyph.setAttribute('aria-hidden', 'true');
      const copy = document.createElement('span');
      const name = document.createElement('strong');
      name.textContent = title;
      const detail = document.createElement('small');
      detail.textContent = description;
      copy.append(name, detail);
      const key = document.createElement('kbd');
      key.textContent = String(index + 1).padStart(2, '0');
      link.append(glyph, copy, key);
      link.addEventListener('mouseenter', () => setActive(index));
      results.append(link);
    });
  }

  function setActive(index) {
    const options = [...(results?.querySelectorAll('[role="option"]') || [])];
    if (!options.length) return;
    activeIndex = (index + options.length) % options.length;
    options.forEach((option, optionIndex) => option.setAttribute('aria-selected', String(optionIndex === activeIndex)));
    options[activeIndex].scrollIntoView({ block: 'nearest' });
  }

  function openCommand() {
    if (!command || !input) return;
    previousFocus = document.activeElement;
    command.hidden = false;
    document.body.classList.add('command-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    activeIndex = 0;
    renderCommands(input.value);
    input.focus();
  }

  function closeCommand() {
    if (!command || command.hidden) return;
    command.hidden = true;
    document.body.classList.remove('command-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    previousFocus?.focus?.();
  }

  trigger?.addEventListener('click', openCommand);
  closeButton?.addEventListener('click', closeCommand);
  command?.addEventListener('click', (event) => { if (event.target === command) closeCommand(); });
  input?.addEventListener('input', () => { activeIndex = 0; renderCommands(input.value); });
  input?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(activeIndex + 1); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive(activeIndex - 1); }
    if (event.key === 'Enter') {
      const option = results?.querySelector('[role="option"][aria-selected="true"]');
      if (option) { event.preventDefault(); option.click(); closeCommand(); }
    }
  });
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      command?.hidden ? openCommand() : closeCommand();
    }
    if (event.key === 'Escape' && command && !command.hidden) closeCommand();
    if (event.key === 'Tab' && command && !command.hidden) {
      const focusable = [...command.querySelectorAll('button, input, a[href]')].filter((element) => !element.disabled);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  document.getElementById('printProfile')?.addEventListener('click', () => window.print());

  const contactForm = document.getElementById('developerContactForm');
  const contactStatus = document.getElementById('contactStatus');
  contactForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());
    submitButton.disabled = true;
    contactStatus.textContent = 'Sending…';
    try {
      const response = await fetch('/api/developer-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Message could not be sent.');
      contactForm.reset();
      contactStatus.textContent = 'Message sent. Thanks for reaching out.';
    } catch (error) {
      contactStatus.textContent = error.message || 'Message could not be sent. Please try again.';
    } finally {
      submitButton.disabled = false;
    }
  });
})();
