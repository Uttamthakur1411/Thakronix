(() => {
  'use strict';

  const catalogPaths = [
    '/calculators', '/ai-tools', '/security-tools', '/privacy-dev-tools',
    '/real-world-tools', '/device-lab', '/utility-studio', '/documents',
    '/entertainment', '/finance', '/home-tools', '/student-tools',
    '/travel-tools', '/workflow-studio', '/life-admin', '/media-tools',
    '/media-tools/pdf-tools', '/media-studio', '/audio-tools',
    '/downloader-studio', '/youtube', '/qr-generator', '/tools'
  ];
  const categoryNames = new Map([
    ['/calculators', 'Calculators'], ['/ai-tools', 'AI Tools'], ['/security-tools', 'Security'],
    ['/privacy-dev-tools', 'Privacy & Developer'], ['/real-world-tools', 'Internet & Network'],
    ['/device-lab', 'Device & Hardware'], ['/utility-studio', 'Text & Utilities'],
    ['/documents', 'Documents & Files'], ['/entertainment', 'Entertainment'],
    ['/finance', 'Finance'], ['/home-tools', 'Home & Lifestyle'], ['/student-tools', 'Student Tools'],
    ['/travel-tools', 'Travel & Vehicle'], ['/workflow-studio', 'Workflows'],
    ['/life-admin', 'Life Admin'], ['/media-tools', 'Image & Media'],
    ['/media-tools/pdf-tools', 'Documents & PDF'], ['/media-studio', 'Image & Media Studio'],
    ['/audio-tools', 'Audio'], ['/downloader-studio', 'Downloader'], ['/youtube', 'YouTube'],
    ['/qr-studio', 'QR & Barcode'], ['/qr-generator', 'QR & Barcode']
  ]);
  const cardSelector = '.tool-card, .hub-card[data-tool], .catalog-tool, .media-tool-card, .nav-item[data-tool], .security-nav-item[data-security-tool], .utility-nav-item, .tool-item, .workflow-card[data-workflow], .ai-tool-panel, .tool-tabs [data-tool], .tab[data-tool]';
  const outputSelector = '.tool-result, .tool-output, .result-box, .result-card, .media-output, .media-status, [role="status"], [aria-live="polite"], [id*="result" i], [id*="output" i], .preview-img, canvas';
  const cacheKey = 'Thakronix:next-action-catalog:v3';
  const cacheLifetime = 24 * 60 * 60 * 1000;
  const normalize = (value) => String(value || '').toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const slug = (value) => normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let catalogPromise;
  let activeAction = null;
  let recommendationPanel;
  let lastRenderedKey = '';

  function currentToolTitle() {
    const title = document.querySelector('.workspace-head h2, #toolTitle, #utilityTitle, #workspaceTitle, .tool-title h1, .tool-title h2, .media-page h1, .workspace-heading h2, .panel-title, main h1, h1');
    if (title?.textContent.trim()) return title.textContent.trim().replace(/\s+/g, ' ');
    const active = [...document.querySelectorAll('.nav-item.active, .utility-nav-item.active, .security-nav-item.active, [data-tool].active, [data-utility-tool].active')]
      .find((item) => !item.closest('.tf-global-sidebar'));
    return active?.querySelector('strong, b')?.textContent.trim().replace(/\s+/g, ' ') || document.querySelector('main h1, h1')?.textContent.trim().replace(/\s+/g, ' ') || document.title.replace(/\s*[|·].*$/, '').trim();
  }

  function currentGroups(tool) {
    const text = normalize(`${tool.title} ${tool.category} ${location.pathname}`);
    const groups = [];
    const rules = [
      ['image', /image|photo|picture|passport|watermark|collage|exif/],
      ['document', /pdf|document|word|docx|ocr|file|paper/],
      ['video', /video|youtube|thumbnail|movie|stream/],
      ['audio', /audio|music|mp3|podcast|sound|voice/],
      ['qr', /\bqr\b|barcode/],
      ['security', /security|privacy|password|secret|encrypt|jwt|hash|metadata/],
      ['code', /developer|json|regex|sql|api|base64|html|css|code/],
      ['finance', /finance|budget|invoice|expense|loan|tax|gst|salary|money/],
      ['text', /text|writing|word count|grammar|email|resume|translate|letter/],
      ['travel', /travel|trip|vehicle|fuel|flight|currency|parking/],
      ['student', /student|study|exam|gpa|flashcard|school/],
      ['ai', /\bai\b|artificial intelligence|prompt|generator/]
    ];
    rules.forEach(([group, pattern]) => { if (pattern.test(text)) groups.push(group); });
    return groups;
  }

  function categoryFor(path) {
    const match = [...categoryNames.entries()].sort((a, b) => b[0].length - a[0].length)
      .find(([route]) => path === route || path.startsWith(`${route}/`));
    return match?.[1] || 'Everyday Tools';
  }

  function catalogEntry(card, pageUrl) {
    if (card.classList.contains('planned-card')) return null;
    const name = card.querySelector('strong, b, h2, h3, h4')?.textContent.trim() ||
      (card.matches('[data-tool], [data-security-tool]') ? card.textContent.trim() : '');
    if (!name) return null;
    const description = card.querySelector('small, p')?.textContent.trim() || '';
    const link = card.matches('a[href]') ? card : card.querySelector('a[href]');
    const toolId = card.dataset.tool || card.dataset.utilityTool || card.dataset.securityTool || card.dataset.workflow;
    const target = new URL(pageUrl);
    let href = '';
    try {
      const rawHref = link?.getAttribute('href');
      if (rawHref) href = new URL(rawHref, pageUrl).href;
    } catch { return null; }
    if (!href && target.pathname === '/security-tools' && card.dataset.securityTool) {
      href = `${target.pathname}#tool=${encodeURIComponent(card.dataset.securityTool)}`;
    } else if (!href && ['/qr-studio', '/qr-generator'].includes(target.pathname) && card.dataset.panel) {
      target.searchParams.set('panel', card.dataset.panel);
      if (card.dataset.type) target.searchParams.set('type', card.dataset.type);
      target.searchParams.set('title', name);
      href = target.href;
    } else if (!href && toolId) {
      target.searchParams.set('tool', toolId);
      href = target.href;
    } else if (!href && card.dataset.slug) {
      target.searchParams.set('tool', card.dataset.slug);
      href = target.href;
    }
    let resolvedHref;
    try { resolvedHref = new URL(href, pageUrl); } catch { return null; }
    if (!href || resolvedHref.origin !== location.origin) return null;
    return { name, description, href, category: categoryFor(target.pathname) };
  }

  function collectPage(documentPage, pageUrl, entries) {
    documentPage.querySelectorAll(cardSelector).forEach((card) => {
      const entry = catalogEntry(card, pageUrl);
      if (entry && !entries.some((item) => item.href === entry.href && item.name === entry.name)) entries.push(entry);
    });
  }

  function loadRenderedPage(path, entries) {
    return new Promise((resolve) => {
      const frame = document.createElement('iframe');
      let finished = false;
      frame.hidden = true;
      const finish = () => {
        if (finished) return;
        finished = true;
        try {
          const selector = path === '/privacy-dev-tools' ? '.tool-item' : '.hub-card[data-tool-id]';
          frame.contentDocument?.querySelectorAll(selector).forEach((card) => {
            const name = card.querySelector('strong, h4')?.textContent.trim() || '';
            const description = card.querySelector('small, p')?.textContent.trim() || '';
            const link = card.matches('a[href]') ? card : card.querySelector('a[href]');
            const href = link?.href;
            if (name && href && !entries.some((item) => item.href === href && item.name === name)) {
              entries.push({ name, description, href, category: categoryFor(path) });
            }
          });
        } catch { /* A page may reject iframe access; the rest of the catalog remains usable. */ }
        frame.remove();
        resolve();
      };
      frame.addEventListener('load', finish, { once: true });
      frame.src = path;
      document.body.append(frame);
      window.setTimeout(finish, 7000);
    });
  }

  function loadCatalog() {
    if (catalogPromise) return catalogPromise;
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (cached?.savedAt && Date.now() - cached.savedAt < cacheLifetime && Array.isArray(cached.entries) && cached.entries.length > 40) {
        catalogPromise = Promise.resolve(cached.entries);
        return catalogPromise;
      }
    } catch { /* Rebuild the catalog when local storage is unavailable. */ }

    catalogPromise = Promise.all(catalogPaths.map(async (path) => {
      try {
        const response = await fetch(path, { credentials: 'same-origin' });
        if (!response.ok) return null;
        return { path, html: await response.text() };
      } catch { return null; }
    })).then(async (pages) => {
      const entries = [];
      pages.forEach((page) => {
        if (page) collectPage(new DOMParser().parseFromString(page.html, 'text/html'), new URL(page.path, location.origin).href, entries);
      });
      await Promise.all(['/privacy-dev-tools', '/real-world-tools'].map((path) => loadRenderedPage(path, entries)));
      try { if (entries.length > 40) localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), entries })); } catch { /* The catalog still works for this page. */ }
      return entries;
    });
    return catalogPromise;
  }

  const workflowRules = {
    image: [
      /image.{0,20}(pdf|convert)|(?:pdf|convert).{0,20}image/i,
      /metadata|exif/i, /passport photo/i, /watermark/i, /qr.{0,12}(generator|code)|barcode/i,
      /background remover|remove background/i, /resize|crop|compress image/i
    ],
    document: [
      /pdf.{0,20}(merge|split|compress|rotate|unlock)|(?:merge|split|compress|rotate|unlock).{0,20}pdf/i,
      /ocr|scan.{0,12}text/i, /word.{0,12}pdf|pdf.{0,12}word/i, /pdf.{0,12}(jpg|image)|image.{0,12}pdf/i
    ],
    video: [/thumbnail/i, /youtube.{0,12}(tag|title|description)|(?:tag|title|description).{0,12}youtube/i, /video.{0,12}(download|analy|convert)/i, /mp3|audio/i],
    audio: [/audio.{0,12}(convert|trim|noise|master)|(?:convert|trim|noise|master).{0,12}audio/i, /podcast|voice/i, /youtube.{0,12}mp3|mp3/i],
    qr: [/qr.{0,12}(generator|create)|create.{0,12}qr/i, /qr.{0,12}(scan|reader)|scan.{0,12}qr/i, /barcode/i, /image.{0,12}pdf/i],
    security: [/metadata|exif/i, /password|secret/i, /hash|file integrity/i, /security header|ssl|tls|domain|ip intelligence/i, /secure share|encrypt/i],
    code: [/json|format/i, /regex/i, /base64|encode|decode/i, /hash|encrypt|password/i, /api|http|cors/i],
    finance: [/budget|expense|spending/i, /invoice|bill|receipt/i, /tax|gst|salary/i, /loan|emi|interest/i, /split.{0,12}(bill|expense)|tip/i],
    text: [/word count|character count/i, /grammar|spell|proofread/i, /email|letter|resume|cv/i, /translate|case converter/i, /summar|rewrite|paraphrase|ai writer/i],
    travel: [/trip|travel planner/i, /fuel|mileage|vehicle/i, /currency|exchange/i, /flight|packing|itinerary/i],
    student: [/flashcard|study/i, /gpa|grade|marks|cgpa/i, /quiz|exam|citation/i],
    ai: [/ai.{0,12}(writer|image|prompt|generator)|prompt.{0,12}(builder|generator)/i, /resume|email|content|idea/i, /image|design|logo/i]
  };

  function recommend(source, entries) {
    const groups = currentGroups(source);
    const titleKey = slug(source.title);
    const sourceTerms = new Set(normalize(`${source.title} ${source.description}`).split(/[^a-z0-9]+/).filter((word) => word.length > 3));
    const candidates = entries.filter((entry) => slug(entry.name) !== titleKey && !entry.href.includes(location.pathname + location.search));
    if (groups.includes('image') && /compress.{0,30}image|image.{0,30}compress/i.test(source.title)) {
      const imageWorkflow = [
        /image.{0,20}to pdf|jpg.{0,20}pdf|convert.{0,20}image.{0,20}pdf/i,
        /metadata|exif/i,
        /passport photo/i,
        /watermark/i,
        /qr.{0,12}generator|create.{0,12}qr|generate.{0,12}qr/i
      ];
      const preferred = [];
      imageWorkflow.forEach((pattern) => {
        const available = candidates.filter((entry) => !preferred.some((item) => item.href === entry.href));
        const match = available.find((entry) => pattern.test(entry.name)) || available.find((entry) => pattern.test(`${entry.name} ${entry.description}`));
        if (match) preferred.push(match);
      });
      if (preferred.length >= 3) return preferred.slice(0, 5);
    }
    const ranked = candidates.map((entry) => {
      const searchable = `${entry.name} ${entry.description} ${entry.category}`;
      const entryGroups = currentGroups({ title: entry.name, category: entry.category });
      let score = entryGroups.some((group) => groups.includes(group)) ? 18 : 0;
      if (entry.category === source.category) score += 8;
      groups.forEach((group) => {
        const rules = workflowRules[group] || [];
        const rank = rules.findIndex((pattern) => pattern.test(searchable));
        if (rank >= 0) score += Math.max(score, 130 - rank * 12);
      });
      const overlap = [...sourceTerms].filter((term) => normalize(searchable).includes(term)).length;
      score += Math.min(overlap, 3) * 3;
      return { ...entry, score, groups: entryGroups };
    }).filter((entry) => entry.score >= 18)
      .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
    const result = [];
    const usedGroups = new Set();
    ranked.forEach((entry) => {
      if (result.length >= 5) return;
      const group = entry.groups.find((item) => groups.includes(item)) || entry.groups[0] || entry.category;
      if (result.length > 1 && usedGroups.has(group) && entry.score < 90) return;
      if (!result.some((item) => item.href === entry.href)) {
        result.push(entry);
        usedGroups.add(group);
      }
    });
    return result;
  }

  function ensurePanel() {
    if (recommendationPanel) return recommendationPanel;
    recommendationPanel = document.createElement('aside');
    recommendationPanel.className = 'tf-next-action';
    recommendationPanel.hidden = true;
    recommendationPanel.setAttribute('aria-live', 'polite');
    recommendationPanel.setAttribute('aria-label', 'Recommended next actions');
    return recommendationPanel;
  }

  function readyMessage(title) {
    const noun = currentGroups({ title, category: '' })[0];
    const labels = { image: 'Your image', document: 'Your document', video: 'Your video', audio: 'Your audio', qr: 'Your code', security: 'Your security check', code: 'Your result', finance: 'Your calculation', text: 'Your text', travel: 'Your trip result' };
    return `${labels[noun] || 'Your result'} is ready. What next?`;
  }

  function renderPanel(source, entries) {
    const panel = ensurePanel();
    const key = `${slug(source.title)}:${source.outputText.slice(0, 100)}`;
    if (key === lastRenderedKey && !panel.hidden) return;
    lastRenderedKey = key;
    panel.replaceChildren();
    const heading = document.createElement('h3');
    heading.textContent = readyMessage(source.title);
    const label = document.createElement('p');
    label.className = 'tf-next-action-label';
    label.textContent = 'Recommended next actions';
    const links = document.createElement('div');
    links.className = 'tf-next-action-links';
    const recommendations = recommend(source, entries);
    recommendations.forEach((entry) => {
      const link = document.createElement('a');
      link.href = entry.href;
      link.className = 'tf-next-action-link';
      const name = document.createElement('span');
      name.textContent = entry.name;
      const arrow = document.createElement('span');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.innerHTML = '&rarr;';
      link.append(name, arrow);
      links.append(link);
    });
    if (!recommendations.length) {
      const fallback = document.createElement('a');
      fallback.href = '/tools';
      fallback.className = 'tf-next-action-link';
      fallback.innerHTML = '<span>Explore all tools</span><span aria-hidden="true">&rarr;</span>';
      links.append(fallback);
    }
    panel.append(heading, label, links);
    panel.hidden = false;
  }

  function showForSuccess(outputNode) {
    if (!activeAction || Date.now() - activeAction.startedAt > 120000) return;
    const title = currentToolTitle();
    if (!title) return;
    const outputText = (outputNode?.innerText || outputNode?.textContent || '').trim().slice(0, 1000);
    const source = { title, category: categoryFor(location.pathname), description: outputText, outputText };
    const panel = ensurePanel();
    const host = outputNode?.closest('.tool-card, .tool-panel, .result-card, .media-tool-card') || outputNode || document.querySelector('.media-shell, main') || document.body;
    if (host !== panel && !host.contains(panel)) host.insertAdjacentElement('afterend', panel);
    else if (!panel.isConnected) document.body.append(panel);
    panel.hidden = false;
    panel.innerHTML = `<h3>${readyMessage(title)}</h3><p class="tf-next-action-label">Recommended next actions</p><div class="tf-next-action-links"><span class="tf-next-action-loading">Finding related tools...</span></div>`;
    loadCatalog().then((entries) => renderPanel(source, entries));
  }

  function isSuccessOutput(node) {
    if (!node || node.closest('.tf-next-action, #tool-processing-status, header, nav, .tool-feedback-prompt')) return false;
    if (node.hidden || (node.getClientRects().length === 0 && !node.matches('canvas, img'))) return false;
    const text = (node.innerText || node.textContent || '').trim();
    if (/\b(error|failed|invalid|unable|could not|cannot|not found|choose .* first|select .* first)\b/i.test(text)) return false;
    if (/\b(processing|please wait|loading|working|preparing|starting|uploading|compressing|converting|generating|analyzing|scanning)\b/i.test(text)) return false;
    const success = /\b(ready|success|generated|converted|complete|created|saved|decoded|analyzed|compressed|exported|removed|merged|split|result)\b/i.test(text);
    if (node.matches('[role="status"], [aria-live], .media-status')) return success;
    return success || text.length >= 18;
  }

  function findOutput(node) {
    const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    if (!element || element.closest('.tf-next-action')) return null;
    return element.matches(outputSelector) ? element : element.closest(outputSelector);
  }

  function markAction(event) {
    const control = event.target.closest('button, input[type="submit"], a[download]');
    if (!control || control.closest('.tf-next-action, header, nav, .tool-feedback-prompt, .media-toolbar, .media-global-actions')) return;
    const label = normalize(`${control.textContent} ${control.getAttribute('aria-label') || ''} ${control.title || ''}`);
    if (!/compress|convert|generate|create|process|analy[sz]|scan|merge|split|download|export|remove|apply|render|check|decode|encode|run|start|build|make|clean|enhance|extract|transcrib|summari|calculate|resize|crop/i.test(label) && control.type !== 'submit') return;
    activeAction = { startedAt: Date.now(), title: currentToolTitle(), label };
    lastRenderedKey = '';
    recommendationPanel?.setAttribute('hidden', '');
  }

  document.addEventListener('click', markAction, true);
  document.addEventListener('submit', (event) => {
    activeAction = { startedAt: Date.now(), title: currentToolTitle(), label: 'submit' };
    lastRenderedKey = '';
    recommendationPanel?.setAttribute('hidden', '');
  }, true);
  document.addEventListener('Thakronix:result-ready', () => showForSuccess(null));

  const observer = new MutationObserver((mutations) => {
    if (!activeAction || Date.now() - activeAction.startedAt > 120000) return;
    for (const mutation of mutations) {
      const output = findOutput(mutation.target);
      if (isSuccessOutput(output)) { showForSuccess(output); return; }
      for (const added of mutation.addedNodes) {
        const addedOutput = findOutput(added);
        if (isSuccessOutput(addedOutput)) { showForSuccess(addedOutput); return; }
        if (added.nodeType === Node.ELEMENT_NODE) {
          const nested = added.querySelector(outputSelector);
          if (isSuccessOutput(nested)) { showForSuccess(nested); return; }
        }
      }
    }
  });
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'hidden', 'src', 'href'] });

  const nativeFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await nativeFetch.apply(this, args);
    if (activeAction && Date.now() - activeAction.startedAt < 120000 && response.ok) {
      response.clone().json().then((payload) => {
        if (payload?.success === true || payload?.status === 'success') showForSuccess(null);
      }).catch(() => {});
    }
    return response;
  };
})();