(() => {
  'use strict';

  const storageKey = 'Thakronix:tool-stats:v1';
  const hubPaths = new Set([
    '/', '/tools', '/image-tools', '/media-tools', '/media-tools/pdf-tools',
    '/youtube', '/documents', '/finance', '/entertainment', '/home-tools',
    '/travel-tools', '/student-tools', '/workflow-studio', '/life-admin',
    '/real-world-tools', '/privacy-dev-tools', '/device-lab', '/ai-tools',
    '/calculators', '/utility-studio', '/security-tools', '/media-studio',
    '/audio-tools', '/downloader-studio', '/qr-studio'
  ]);
  const toolTitleSelectors = ['#toolTitle', '#utilityTitle', '#workspaceTitle', '#panel-title', '.workspace-heading h2'];
  const openedThisPage = new Set();
  const usedThisPage = new Set();
  let feedbackPrompt;
  let backButton;
  let activeToolKey = '';

  const slug = (value) => String(value || '').toLocaleLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  function readStats() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return value && typeof value === 'object' && value.tools ? value : { tools: {} };
    } catch {
      return { tools: {} };
    }
  }

  function writeStats(stats) {
    try { localStorage.setItem(storageKey, JSON.stringify(stats)); } catch { /* Storage may be unavailable. */ }
  }

  function selectedId() {
    const params = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    return params.get('tool') || hashParams.get('tool') || document.body.dataset.toolPage ||
      document.querySelector('.real-world-page')?.dataset.toolId || '';
  }

  function activeId() {
    return selectedId() || document.querySelector('.nav-item.active')?.dataset.tool ||
      document.querySelector('.utility-nav-item.active')?.dataset.utilityTool ||
      document.querySelector('.tool-tabs [data-tool].active, .tab[data-tool].active')?.dataset.tool || '';
  }

  function titleForPage() {
    const queryTitle = new URLSearchParams(location.search).get('title');
    if (queryTitle) return queryTitle;
    const requestedAiTool = new URLSearchParams(location.search).get('tool');
    if (location.pathname === '/ai-tools' && requestedAiTool) {
      const button = [...document.querySelectorAll('[data-ai-generate]')].find((item) => item.dataset.aiGenerate === requestedAiTool);
      const title = button?.closest('.ai-tool-panel')?.querySelector('h4')?.textContent.trim();
      if (title) return title;
    }
    for (const selector of toolTitleSelectors) {
      const text = document.querySelector(selector)?.textContent.trim();
      if (text && !/^(choose a tool|loading tool|tool workspace)$/i.test(text)) return text;
    }
    const active = document.querySelector('.nav-item.active, .utility-nav-item.active, .tool-tabs [data-tool].active, .tab[data-tool].active');
    const activeTitle = active?.querySelector('strong, b')?.textContent.trim() || active?.textContent.trim();
    if (activeTitle) return activeTitle;
    return document.querySelector('h1')?.textContent.trim() || document.title.replace(/\s*[|·].*$/, '').trim();
  }

  function activeToolControl() {
    return document.querySelector('.tool-panel.active, .nav-item.active, .utility-nav-item.active, .tool-tabs [data-tool].active, .tab[data-tool].active, .hub-workspace:not([hidden]), .is-focused');
  }

  function isToolPage() {
    const path = location.pathname.replace(/\/$/, '') || '/';
    if (hubPaths.has(path) && !selectedId() && !activeToolControl()) return false;
    return Boolean(titleForPage());
  }

  function currentHref() {
    const params = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (location.pathname === '/qr-generator') return location.pathname + location.search;
    const selected = activeId() || params.get('tool') || hashParams.get('tool');
    const href = new URL(location.pathname, location.origin);
    if (selected) href.searchParams.set('tool', selected);
    return href.pathname + href.search + (hashParams.has('tool') ? `#tool=${encodeURIComponent(hashParams.get('tool'))}` : '');
  }

  function returnHref() {
    const path = location.pathname.replace(/\/$/, '') || '/';
    const params = new URLSearchParams(location.search);
    if (params.has('tool')) return path;
    if (location.hash) return path;
    if (path.startsWith('/youtube/')) return '/youtube';
    if (path.startsWith('/privacy-dev-tools/')) return '/privacy-dev-tools';
    if (path.startsWith('/real-world-tools/')) return '/real-world-tools';
    if (path.startsWith('/media-tools/pdf-')) return '/media-tools/pdf-tools';
    if (path.startsWith('/media-tools/')) return '/media-tools';
    if (document.referrer) {
      try {
        const referrer = new URL(document.referrer);
        if (referrer.origin === location.origin && referrer.href !== location.href) return referrer.href;
      } catch { /* Fall through to the home page. */ }
    }
    return '/';
  }

  function getRecord(stats, context) {
    const key = slug(context.title);
    if (!stats.tools[key]) stats.tools[key] = { name: context.title, href: context.href, opens: 0, uses: 0, rating: 0 };
    Object.assign(stats.tools[key], { name: context.title, href: context.href, id: context.id || '' });
    return stats.tools[key];
  }

  function popularity(record) {
    return (record.uses || 0) * 8 + (record.opens || 0) + (record.rating || 0) * 3;
  }

  function renderTrending() {
    const container = document.getElementById('toolTrending');
    if (!container) return;
    const records = Object.values(readStats().tools).filter((item) => item.href && popularity(item) > 0)
      .sort((left, right) => popularity(right) - popularity(left) || left.name.localeCompare(right.name)).slice(0, 3);
    container.replaceChildren();
    if (!records.length) {
      container.hidden = true;
      return;
    }
    const label = document.createElement('span');
    label.className = 'tool-trending-label';
    label.textContent = 'Trending on this device';
    container.append(label);
    records.forEach((record, index) => {
      const link = document.createElement('a');
      link.className = 'tool-trending-item';
      link.href = record.href;
      const name = document.createElement('strong');
      name.textContent = record.name;
      const detail = document.createElement('small');
      detail.textContent = `${record.uses || 0} uses · ${record.rating ? `${record.rating}/5 rating` : 'not rated yet'}`;
      const rank = document.createElement('span');
      rank.textContent = String(index + 1).padStart(2, '0');
      rank.setAttribute('aria-hidden', 'true');
      link.append(rank, name, detail);
      container.append(link);
    });
    container.hidden = false;
  }

  function createBackButton() {
    const href = returnHref();
    const header = document.querySelector('.tf-app-topbar, header, body > nav.navbar');
    const host = header?.querySelector('.tf-app-actions, .top-actions, .header-actions, nav') || header;
    const existingLink = host && [...host.querySelectorAll('a')].find((link) =>
      link.classList.contains('back-link') || /^(back|back to tools)$/i.test(link.textContent.trim())
    );
    const matchingLink = existingLink || document.querySelector('a.back-button, a.youtube-back, a.qr-back-link, .page-navigation > a');

    if (matchingLink) {
      backButton = matchingLink;
    } else {
      backButton?.remove();
      backButton = document.createElement('a');
      backButton.className = 'tool-back-button';
      backButton.innerHTML = '<span class="tool-back-arrow" aria-hidden="true">←</span><span>Back</span>';
    }

    backButton.classList.add('tool-back-button');
    backButton.href = href;
    backButton.setAttribute('aria-label', 'Back to tools');
    if (!backButton.querySelector('.tool-back-arrow')) {
      backButton.innerHTML = '<span class="tool-back-arrow" aria-hidden="true">←</span><span>Back</span>';
    }
    if (host) host.prepend(backButton);
    else {
      const topNav = document.querySelector('.tool-back-fallback') || document.createElement('nav');
      topNav.className = 'tool-back-fallback';
      topNav.setAttribute('aria-label', 'Tool navigation');
      if (!topNav.isConnected) document.body.prepend(topNav);
      topNav.append(backButton);
    }
  }

  function createFeedbackPrompt(context) {
    feedbackPrompt?.remove();
    feedbackPrompt = document.createElement('aside');
    feedbackPrompt.className = 'tool-feedback-prompt';
    feedbackPrompt.hidden = true;
    feedbackPrompt.setAttribute('aria-label', `Feedback for ${context.title}`);

    const promptHead = document.createElement('div');
    promptHead.className = 'tool-feedback-prompt-head';
    const question = document.createElement('strong');
    question.textContent = `How was ${context.title}?`;
    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'tool-feedback-dismiss';
    dismiss.setAttribute('aria-label', 'Dismiss feedback request');
    dismiss.textContent = '×';
    dismiss.addEventListener('click', () => { feedbackPrompt.hidden = true; });
    promptHead.append(question, dismiss);

    const caption = document.createElement('small');
    caption.className = 'tool-feedback-caption';
    caption.textContent = 'Rate your experience';

    const stars = document.createElement('div');
    stars.className = 'tool-feedback-stars';
    stars.setAttribute('role', 'group');
    stars.setAttribute('aria-label', `Rate ${context.title}`);
    for (let value = 1; value <= 5; value += 1) {
      const star = document.createElement('button');
      star.type = 'button';
      star.className = 'tool-feedback-star';
      star.textContent = '★';
      star.setAttribute('aria-label', `${value} out of 5 stars`);
      star.addEventListener('click', () => {
        const stats = readStats();
        const record = getRecord(stats, context);
        record.rating = value;
        record.ratedAt = new Date().toISOString();
        writeStats(stats);
        feedbackPrompt.replaceChildren();
        const thankYou = document.createElement('strong');
        thankYou.className = 'tool-feedback-thanks';
        thankYou.textContent = 'Thank you for your feedback';
        feedbackPrompt.append(thankYou);
        feedbackPrompt.classList.add('is-thanks');
        const submittedPrompt = feedbackPrompt;
        window.setTimeout(() => { submittedPrompt.hidden = true; }, 1800);
        renderTrending();
      });
      stars.append(star);
    }

    feedbackPrompt.append(promptHead, caption, stars);
    document.body.append(feedbackPrompt);
  }

  function createToolControls(context) {
    createBackButton();
    createFeedbackPrompt(context);
  }

  function activateCurrentTool() {
    const path = location.pathname.replace(/\/$/, '') || '/';
    if (path === '/developer' || path.startsWith('/developer/projects/')) {
      feedbackPrompt?.remove();
      backButton?.remove();
      activeToolKey = '';
      return null;
    }
    const context = { title: titleForPage(), href: currentHref(), id: activeId() };
    if (!context.title || (hubPaths.has(path) && !selectedId() && !activeToolControl())) {
      feedbackPrompt?.remove();
      feedbackPrompt = null;
      backButton?.remove();
      backButton = null;
      activeToolKey = '';
      return null;
    }
    const key = slug(context.title);
    if (key !== activeToolKey) {
      activeToolKey = key;
      createToolControls(context);
    }
    if (!openedThisPage.has(key)) {
      openedThisPage.add(key);
      const stats = readStats();
      const record = getRecord(stats, context);
      record.opens += 1;
      record.lastOpenedAt = Date.now();
      writeStats(stats);
      renderTrending();
    }
    return context;
  }

  function markUsed(event) {
    if (event.target.closest('.tool-feedback-prompt, .tool-back-button, header, nav, .media-toolbar, .media-global-actions, .quick-links, #toolTrending')) return;
    const context = activateCurrentTool();
    if (!context) return;
    const key = slug(context.title);
    if (usedThisPage.has(key)) return;
    usedThisPage.add(key);
    const stats = readStats();
    getRecord(stats, context).uses += 1;
    writeStats(stats);
    if (!(readStats().tools[key]?.rating > 0) && feedbackPrompt) {
      feedbackPrompt.classList.remove('is-thanks');
      feedbackPrompt.hidden = false;
    }
    renderTrending();
  }

  function start() {
    renderTrending();
    const context = activateCurrentTool();
    if (!context) return;
    document.addEventListener('click', markUsed, true);
    document.addEventListener('change', markUsed, true);
    document.addEventListener('submit', markUsed, true);
    document.addEventListener('input', markUsed, true);
    document.addEventListener('click', (event) => {
      if (event.target.closest('.nav-item, .utility-nav-item, .tool-tabs [data-tool], .tab[data-tool]')) {
        window.setTimeout(activateCurrentTool, 0);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();