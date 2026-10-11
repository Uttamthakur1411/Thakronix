(() => {
  const $ = (id) => document.getElementById(id);
  const safeCopy = async (value, button) => { try { await navigator.clipboard.writeText(value); if (button) { const original = button.textContent; button.textContent = 'Copied'; setTimeout(() => { button.textContent = original; }, 1200); } } catch { const area = document.createElement('textarea'); area.value = value; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove(); if (button) button.textContent = 'Copied'; } };
  const state = { shareToken: null, domain: null, ip: null, files: [], generated: [] };
  const meta = {
    'image-share': ['PRIVATE SHARING', 'Secure Image Share', 'Encrypt before storage, expire automatically.'],
    'password-generator': ['LOCAL GENERATION', 'Password Security Studio', 'Generate secrets locally with a cryptographically secure source.'],
    entropy: ['LOCAL X-RAY', 'Password Entropy Checker', 'Inspect patterns locally without sending the password anywhere.'],
    'common-passwords': ['LOCAL BLOCKLIST', 'Common Passwords Explorer', 'Understand predictable patterns and risky substitutions.'],
    domain: ['RDAP FIRST', 'Domain Security Snapshot', 'Use structured registration data and label observations clearly.'],
    ip: ['NETWORK INTELLIGENCE', 'IP WHOIS / RDAP Lookup', 'Explore the network behind an IPv4, IPv6 address or domain.'],
    headers: ['WEB HARDENING', 'Security Headers Checker', 'Audit browser security policies and cookie flags.'],
    ssl: ['CERTIFICATE HEALTH', 'SSL / TLS Checker', 'Inspect certificate validity, chain and expiry.'],
    'url-safety': ['PHISHING TRIAGE', 'URL Safety Scanner', 'Classify visible URL risk signals before opening.'],
    'file-integrity': ['LOCAL FORENSICS', 'File Integrity Checker', 'Compare local file digests without uploading data.'],
    metadata: ['PRIVACY SCRUBBER', 'Metadata Cleaner', 'Preview and remove common image metadata locally.'],
    jwt: ['DEVELOPER INSPECTION', 'JWT Inspector', 'Decode claims locally without verifying signatures.'],
    secrets: ['LOCAL CODE SCAN', 'Secret / API Key Scanner', 'Find token-shaped strings before committing code.'],
    hash: ['DIGEST TOOL', 'Hash Generator', 'Generate cryptographic digests locally.'],
    qr: ['LINK PREVIEW', 'QR Security Scanner', 'Decode content before opening an external URL.'],
    http: ['NETWORK RESPONSE', 'HTTP Status Checker', 'Trace statuses, redirects and HTTPS enforcement.'],
    cors: ['API CONFIGURATION', 'CORS Checker', 'Inspect preflight headers and credential signals.'],
    room: ['PURPOSE-BOUND TEMPORARY ACCESS', 'Create Secure Share Room', 'Selected documents, owner recovery, expiry, and access history.']
  };
  const mobileNavToggle = document.createElement('button');
  mobileNavToggle.type = 'button';
  mobileNavToggle.className = 'security-mobile-nav-toggle';
  mobileNavToggle.innerHTML = '<span class="security-mobile-nav-label">Security tools</span><span class="security-mobile-nav-caret">▾</span>';
  const sideNav = document.querySelector('.security-nav');
  if (sideNav && sideNav.parentElement) {
    sideNav.parentElement.insertBefore(mobileNavToggle, sideNav);
    const syncMobileNavLabel = () => {
      const selected = document.querySelector('.security-nav-item.active');
      const label = selected ? selected.querySelector('b')?.textContent || 'Security tools' : 'Security tools';
      const labelNode = mobileNavToggle.querySelector('.security-mobile-nav-label');
      if (labelNode) labelNode.textContent = label;
    };
    const applyMobileNavState = () => {
      const mobile = window.innerWidth <= 760;
      mobileNavToggle.style.display = mobile ? 'flex' : 'none';
      if (!mobile) {
        sideNav.style.display = 'grid';
        sideNav.classList.remove('mobile-open');
        mobileNavToggle.classList.remove('open');
        mobileNavToggle.setAttribute('aria-expanded', 'false');
        return;
      }
      const isOpen = sideNav.classList.contains('mobile-open');
      sideNav.style.display = isOpen ? 'grid' : 'none';
      mobileNavToggle.classList.toggle('open', isOpen);
      mobileNavToggle.setAttribute('aria-expanded', String(isOpen));
    };
    mobileNavToggle.onclick = () => {
      if (window.innerWidth > 760) return;
      const isOpen = sideNav.classList.toggle('mobile-open');
      mobileNavToggle.setAttribute('aria-expanded', String(isOpen));
      mobileNavToggle.classList.toggle('open', isOpen);
      sideNav.style.display = isOpen ? 'grid' : 'none';
    };
    const closeMobileNav = () => {
      sideNav.classList.remove('mobile-open');
      sideNav.style.display = 'none';
      mobileNavToggle.setAttribute('aria-expanded', 'false');
      mobileNavToggle.classList.remove('open');
    };
    document.querySelectorAll('.security-nav-item').forEach((button) => button.onclick = () => { const tool = button.dataset.securityTool; const panelMeta = meta[tool] || ['SECURITY', 'Tool', 'Open this tool to begin.']; document.querySelectorAll('.security-nav-item').forEach((x) => x.classList.toggle('active', x === button)); document.querySelectorAll('.security-panel').forEach((x) => x.classList.toggle('active', x.dataset.securityPanel === tool)); [$('securityKicker'), $('securityTitle'), $('securityDescription')].forEach((x, i) => x.textContent = panelMeta[i] || ''); const workspace = document.querySelector('.security-workspace'); if (workspace) workspace.scrollTo({ top: 0, behavior: 'smooth' }); syncMobileNavLabel(); closeMobileNav(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 760) { sideNav.style.display = 'grid'; sideNav.classList.remove('mobile-open'); mobileNavToggle.classList.remove('open'); mobileNavToggle.setAttribute('aria-expanded', 'false'); } else { applyMobileNavState(); } });
    applyMobileNavState();
    syncMobileNavLabel();
  } else {
    document.querySelectorAll('.security-nav-item').forEach((button) => button.onclick = () => { const tool = button.dataset.securityTool; const panelMeta = meta[tool] || ['SECURITY', 'Tool', 'Open this tool to begin.']; document.querySelectorAll('.security-nav-item').forEach((x) => x.classList.toggle('active', x === button)); document.querySelectorAll('.security-panel').forEach((x) => x.classList.toggle('active', x.dataset.securityPanel === tool)); [$('securityKicker'), $('securityTitle'), $('securityDescription')].forEach((x, i) => x.textContent = panelMeta[i] || ''); const workspace = document.querySelector('.security-workspace'); if (workspace) workspace.scrollTo({ top: 0, behavior: 'smooth' }); });
  }
  $('securityTheme').onclick = () => document.body.classList.toggle('dark-mode');
  $('securityReset').onclick = () => { const panel = document.querySelector('.security-panel.active'); panel.querySelectorAll('input, textarea').forEach((x) => { x.value = x.type === 'file' ? '' : (x.defaultValue || ''); }); panel.querySelectorAll('select').forEach((x) => { x.selectedIndex = 0; }); panel.querySelectorAll('.tool-result').forEach((x) => { x.innerHTML = '<p class="empty-state">Reset. Ready for a new check.</p>'; }); if ($('sharePreviews')) $('sharePreviews').innerHTML = ''; if ($('shareOutput')) $('shareOutput').classList.add('hidden'); if ($('shareDashboard')) $('shareDashboard').textContent = 'Create a share to see its encrypted lifecycle.'; state.files = []; state.shareToken = null; };

  const b64 = (bytes) => { let binary = ''; bytes.forEach((x) => binary += String.fromCharCode(x)); return btoa(binary); };
  const fromB64 = (value) => Uint8Array.from(atob(value), (x) => x.charCodeAt(0));
  async function encryptPayload(files, password, watermark) {
    const payload = [];
    for (const file of files) { const buffer = await file.arrayBuffer(); payload.push({ name: $('shareFilename').value.trim() || file.name, type: file.type, size: file.size, data: b64(new Uint8Array(buffer)) }); }
    const salt = crypto.getRandomValues(new Uint8Array(16)); const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password || b64(crypto.getRandomValues(new Uint8Array(24)))), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify({ watermark, files: payload })));
    return JSON.stringify({ algorithm: 'AES-GCM-256/PBKDF2', salt: b64(salt), iv: b64(iv), ciphertext: b64(new Uint8Array(encrypted)) });
  }
  const renderPreviews = () => { $('sharePreviews').innerHTML = state.files.map((file) => `<div class="share-preview"><img src="${URL.createObjectURL(file)}" alt=""><small>${(file.size / 1024).toFixed(0)} KB</small></div>`).join(''); };
  $('shareDrop').onclick = () => $('shareFiles').click(); $('shareFiles').onchange = (event) => { state.files = [...event.target.files]; renderPreviews(); }; $('shareDrop').ondragover = (event) => { event.preventDefault(); $('shareDrop').style.borderColor = 'var(--green)'; }; $('shareDrop').ondrop = (event) => { event.preventDefault(); state.files = [...event.dataTransfer.files].filter((x) => x.type.startsWith('image/')); renderPreviews(); };
  $('createShare').onclick = async () => { if (!state.files.length) return alert('Choose at least one image.'); const button = $('createShare'); button.disabled = true; button.textContent = 'Encrypting locally...'; try { const key = b64(crypto.getRandomValues(new Uint8Array(32))); const secret = $('sharePassword').value ? `${key}:${$('sharePassword').value}` : key; const payload = await encryptPayload(state.files, secret, $('shareWatermark').value); const response = await fetch('/api/security/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payload, ttl: +$('shareTtl').value, max_views: +$('shareViews').value, burn: $('shareBurn').checked }) }); const result = await response.json(); if (!result.success) throw Error(result.message); state.shareToken = result.token; const link = `${location.origin}/security-tools#share=${result.token}&key=${encodeURIComponent(key)}${$('sharePassword').value ? '&password-required=1' : ''}`; $('shareOutput').classList.remove('hidden'); $('shareOutput').innerHTML = `<strong>Encrypted share ready</strong><code>${link}</code><button class="outline-btn" id="copyShare">Copy secure link</button>`; $('copyShare').onclick = (event) => safeCopy(link, event.currentTarget); $('shareDashboard').innerHTML = `<div class="result-grid"><p><span>Created</span><b>${new Date().toLocaleString()}</b></p><p><span>Status</span><b class="status-ok">Active · encrypted</b></p><p><span>Expires</span><b>${new Date(result.expires).toLocaleString()}</b></p><p><span>Views</span><b>0 / ${$('shareViews').value}</b></p></div><button class="outline-btn" id="revokeShare">Revoke link</button>`; $('revokeShare').onclick = async () => { await fetch(`/api/security/share/${result.token}`, { method: 'DELETE' }); $('shareDashboard').innerHTML = '<p class="status-warn">Share revoked.</p>'; }; } catch (error) { alert(error.message); } finally { button.disabled = false; button.innerHTML = 'Encrypt & generate secure link <span>→</span>'; } };

  async function decryptPayload(payload, secret) { const data = JSON.parse(payload); const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey']); const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: fromB64(data.salt), iterations: 120000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt']); const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(data.iv) }, key, fromB64(data.ciphertext)); return JSON.parse(new TextDecoder().decode(clear)); }
  async function openSharedImage() { const hash = new URLSearchParams(location.hash.slice(1)); const token = hash.get('share'); const key = hash.get('key'); if (!token || !key) return; try { const response = await fetch(`/api/security/share/${token}`); const result = await response.json(); if (!result.success) throw Error(result.message); const password = hash.get('password-required') ? prompt('This share is password protected. Enter the access password:') || '' : ''; const data = await decryptPayload(result.payload, password ? `${key}:${password}` : key); $('shareDashboard').innerHTML = `<h3>Decrypted private view</h3><p class="security-note">Viewed locally. Remaining views: ${result.remaining}</p><div class="share-previews">${data.files.map((file) => `<div class="share-preview"><img src="data:${file.type};base64,${file.data}" alt="${file.name}"><small>${file.name}</small></div>`).join('')}</div>`; document.querySelector('[data-security-tool="image-share"]').click(); } catch (error) { $('shareDashboard').innerHTML = `<p class="status-warn">Unable to open encrypted share: ${error.message}</p>`; } }
  openSharedImage();
  document.querySelectorAll('.security-nav-item').forEach((button) => button.addEventListener('click', () => {
    if (window.innerWidth > 760) return;
    const workspaceHead = document.querySelector('.workspace-head');
    const topbar = document.querySelector('.topbar');
    if (!workspaceHead) return;
    const topbarHeight = topbar?.getBoundingClientRect().height || 0;
    window.scrollTo({
      top: window.scrollY + workspaceHead.getBoundingClientRect().top - topbarHeight - 8,
      behavior: 'smooth'
    });
  }));
  const securityHash = new URLSearchParams(location.hash.slice(1));
  const requestedTool = securityHash.get('tool');
  if (!securityHash.has('share') && meta[requestedTool]) document.querySelector(`[data-security-tool="${requestedTool}"]`)?.click();

  const randomString = (length, chars) => { const values = new Uint32Array(length); crypto.getRandomValues(values); return [...values].map((value) => chars[value % chars.length]).join(''); };
  const words = ['river','coffee','lamp','cloud','meadow','orbit','copper','violet','forest','signal','window','piano','comet','silver','harbor','maple','tulip','canvas','rocket','marble'];
  function generatePasswords() { const mode = document.querySelector('.mode-tab.active').dataset.generatorMode; const count = Math.min(20, Math.max(1, +$('passwordCount').value || 1)); const length = Math.min(256, Math.max(4, +$('passwordLength').value || 24)); const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ', lower = 'abcdefghijkmnopqrstuvwxyz', numbers = '23456789', symbols = '!@#$%^&*_-+=?'; let result = []; for (let i = 0; i < count; i++) { if (mode === 'passphrase') { const phrase = [...crypto.getRandomValues(new Uint32Array(Math.max(3, Math.floor(length / 5))))].map((x) => words[x % words.length]); result.push(phrase.join('-') + ( $('useNumbers').checked ? randomString(2, numbers) : '')); } else if (mode === 'pin') result.push(randomString(length, '0123456789')); else if (mode === 'token') result.push(randomString(length, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_')); else { let chars = ''; if ($('useUpper').checked) chars += upper; if ($('useLower').checked) chars += lower; if ($('useNumbers').checked) chars += numbers; if ($('useSymbols').checked) chars += symbols; if ($('excludeAmbiguous').checked) chars = chars.replace(/[Il1O0o]/g, ''); result.push(randomString(length, chars || lower)); } } state.generated = result; $('passwordResults').innerHTML = result.map((password) => `<div class="password-row"><code>${password}</code><button data-copy-password="${encodeURIComponent(password)}" title="Copy">⧉</button></div>`).join(''); document.querySelectorAll('[data-copy-password]').forEach((button) => button.onclick = () => safeCopy(decodeURIComponent(button.dataset.copyPassword), button)); $('recipeExplanation').textContent = mode === 'passphrase' ? 'Long, randomly selected words are memorable and resistant to guessing. Generation happened only in this browser.' : `This recipe combines ${length} characters from your selected categories using the browser's cryptographically secure random source.`; }
  document.querySelectorAll('.mode-tab').forEach((button) => button.onclick = () => { document.querySelectorAll('.mode-tab').forEach((x) => x.classList.toggle('active', x === button)); $('passwordLength').disabled = button.dataset.generatorMode === 'passphrase'; generatePasswords(); }); $('generatePasswords').onclick = generatePasswords; generatePasswords();

  function analyzePassword(value) { const categories = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(value)).length; const pool = categories === 4 ? 94 : categories === 3 ? 62 : categories === 2 ? 52 : 26; const bits = value ? Math.round(value.length * Math.log2(pool)) : 0; const repeats = /(.)\1{2,}/.test(value); const sequence = /(?:012|123|234|345|456|567|678|789|abc|qwe|asd|zxc)/i.test(value); const common = /password|admin|welcome|qwerty|letmein|monkey|dragon|football/i.test(value); const label = !value ? 'Waiting for input' : bits < 45 || common ? 'Needs improvement' : bits < 70 || repeats || sequence ? 'Good, but review patterns' : 'Strong estimate'; $('entropyLabel').textContent = label; $('entropyLength').textContent = value.length; $('entropyUnique').textContent = new Set(value).size; $('entropyBits').textContent = bits; $('entropyGuesses').textContent = bits ? `${Math.min(999, Math.round(bits / 10))} / 999+ years*` : '—'; $('entropyRing').textContent = bits ? `${Math.min(99, Math.round(bits / 1.28))}` : '—'; $('entropyRing').dataset.level = bits < 45 ? 'weak' : bits > 70 ? 'strong' : 'medium'; const findings = []; if (common) findings.push(['Common dictionary pattern detected.', false]); if (repeats) findings.push(['Repeated characters detected.', false]); if (sequence) findings.push(['Sequential or keyboard pattern detected.', false]); if (value.length < 14) findings.push(['Length is below the recommended long-password target.', false]); if (!findings.length && value) findings.push(['No obvious local patterns detected.', true]); $('entropyFindings').innerHTML = findings.map(([text, good]) => `<div class="finding ${good ? 'good' : ''}">${good ? '✓' : '⚠'} ${text}</div>`).join('') || '<p class="empty-state">Your analysis appears here and is cleared instantly.</p>'; }
  $('entropyPassword').oninput = (event) => analyzePassword(event.target.value); $('toggleEntropy').onclick = () => { $('entropyPassword').type = $('entropyPassword').type === 'password' ? 'text' : 'password'; $('toggleEntropy').textContent = $('entropyPassword').type === 'password' ? 'Show' : 'Hide'; }; $('clearEntropy').onclick = () => { $('entropyPassword').value = ''; analyzePassword(''); }; $('generateAlternative').onclick = () => { document.querySelector('[data-security-tool="password-generator"]').click(); $('passwordLength').value = 28; generatePasswords(); };

  const common = [{ value: '123456', category: 'sequence', why: 'Number sequence' }, { value: 'password123', category: 'phrase', why: 'Common word + suffix' }, { value: 'qwerty123', category: 'keyboard', why: 'Keyboard pattern' }, { value: 'welcome2024', category: 'seasonal', why: 'Greeting + year' }, { value: 'iloveyou', category: 'phrase', why: 'Common phrase' }, { value: 'admin', category: 'phrase', why: 'Default credential' }, { value: 'football', category: 'phrase', why: 'Sports word' }, { value: 'Summer2025', category: 'seasonal', why: 'Season + year' }]; function renderCommon() { const category = $('commonCategory').value; const query = $('commonSearch').value.toLowerCase(); const list = common.filter((item) => (category === 'all' || item.category === category) && (!query || item.value.includes(query))); $('commonList').innerHTML = list.map((item) => `<div><span>${item.value}</span><small>${item.why}</small></div>`).join('') || '<p class="empty-state">No local match found.</p>'; } $('commonSearch').oninput = renderCommon; $('commonCategory').onchange = renderCommon; $('scanCommon').onclick = () => { const value = $('commonSearch').value.toLowerCase(); const found = common.find((x) => x.value.toLowerCase() === value); $('commonResult').innerHTML = found ? `<div class="finding">⚠ <strong>Found locally:</strong> ${found.value} · ${found.why}. Do not use it.</div>` : `<div class="finding good">✓ Not found in this small local education dataset. This is not a breach guarantee.</div>`; renderCommon(); }; renderCommon();

  let lastDomain = null, lastIp = null; const download = (data, filename, type) => { const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(new Blob([data], { type })); anchor.download = filename; anchor.click(); }; const renderReport = (target, data, type) => { const entries = type === 'domain' ? [['Domain', data.domain], ['Registrar', JSON.stringify(data.registrar)], ['Registered', data.registered || 'Not reported'], ['Updated', data.updated || 'Not reported'], ['Expires', data.expires || 'Not reported'], ['DNSSEC', data.dnssec ? 'Enabled' : 'Not observed'], ['Status', (data.status || []).join(', ')], ['Nameservers', (data.nameservers || []).join(', ')]] : [['IP address', data.ip], ['Version', `IPv${data.version}`], ['Private / reserved', data.private || data.reserved ? 'Yes' : 'No'], ['Network', data.network], ['Name', data.name], ['Country', data.country], ['Registry', data.registry], ['RDAP source', data.rdap_url]]; target.innerHTML = `<div class="result-grid">${entries.map(([key, value]) => `<p><span>${key}</span><b>${value || 'Not reported'}</b></p>`).join('')}</div><p class="security-note">Observed data from RDAP. Any interpretation is advisory and may be incomplete.</p>`; };
  $('domainLookup').onclick = async () => { const button = $('domainLookup'); button.disabled = true; try { const response = await fetch('/api/security/rdap', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ domain: $('domainInput').value }) }); const result = await response.json(); if (!result.success) throw Error(result.message); lastDomain = result.data; renderReport($('domainResult'), lastDomain, 'domain'); } catch (error) { $('domainResult').innerHTML = `<p class="status-warn">${error.message}</p>`; } finally { button.disabled = false; } }; $('domainJson').onclick = () => lastDomain && download(JSON.stringify(lastDomain, null, 2), 'domain-rdap.json', 'application/json'); $('domainTxt').onclick = () => lastDomain && download(Object.entries(lastDomain).map(([k,v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n'), 'domain-report.txt', 'text/plain');
  $('ipLookup').onclick = async () => { const button = $('ipLookup'); button.disabled = true; try { const response = await fetch('/api/security/ip', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ip: $('ipInput').value }) }); const result = await response.json(); if (!result.success) throw Error(result.message); lastIp = result.data; renderReport($('ipResult'), lastIp, 'ip'); } catch (error) { $('ipResult').innerHTML = `<p class="status-warn">${error.message}</p>`; } finally { button.disabled = false; } }; $('currentIp').onclick = async () => { const response = await fetch('https://api.ipify.org?format=json'); const result = await response.json(); $('ipInput').value = result.ip; $('ipLookup').click(); }; $('ipJson').onclick = () => lastIp && download(JSON.stringify(lastIp, null, 2), 'ip-rdap.json', 'application/json'); $('ipTxt').onclick = () => lastIp && download(Object.entries(lastIp).map(([k,v]) => `${k}: ${v}`).join('\n'), 'ip-report.txt', 'text/plain');

  const roomStorageKey = 'Thakronix-room-list';
  const loadRoomList = () => { try { return JSON.parse(localStorage.getItem(roomStorageKey) || '[]'); } catch { return []; } };
  const persistRoomList = (rooms) => { localStorage.setItem(roomStorageKey, JSON.stringify(rooms.slice(0, 8))); };
  const parseRoomToken = (value) => {
    const raw = (value || '').trim(); if (!raw) return '';
    const cleaned = raw.replace(/^https?:\/\//i, '').split('/').pop();
    const tokenMatch = cleaned.match(/[A-Za-z0-9_-]+/);
    return tokenMatch ? tokenMatch[0] : cleaned;
  };
  const renderRoomList = () => {
    const target = $('roomList'); if (!target) return;
    const rooms = loadRoomList();
    if (!rooms.length) { target.innerHTML = '<p class="empty-state">No rooms created in this browser.</p>'; return; }
    target.innerHTML = rooms.map((room) => `
      <div class="room-item">
        <div>
          <strong>${room.purpose || 'Secure room'}</strong>
          <small>${room.recipient || 'Recipient'} · ${new Date(room.expiresAt).toLocaleString()}</small>
        </div>
        <div class="room-item-actions">
          <button class="outline-btn" data-room-open="${room.token}">Open</button>
          <button class="outline-btn" data-room-log="${room.token}">Log</button>
          <button class="outline-btn" data-room-revoke="${room.token}" data-room-owner="${encodeURIComponent(room.ownerKey || '')}">Revoke</button>
        </div>
      </div>`).join('');
  };

  async function encryptRoomBundle(bundle, key) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), 'PBKDF2', false, ['deriveKey']);
    const derivedKey = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, derivedKey, new TextEncoder().encode(JSON.stringify(bundle)));
    return JSON.stringify({ algorithm: 'AES-GCM-256/PBKDF2', salt: b64(salt), iv: b64(iv), ciphertext: b64(new Uint8Array(ciphertext)) });
  }

  const roomDocumentMeta = (file) => ({ name: file.name, type: file.type || 'application/octet-stream', size: file.size });

  const appendRoomEntry = (entry) => {
    const rooms = loadRoomList();
    const next = [entry, ...rooms.filter((room) => room.token !== entry.token)].slice(0, 8);
    persistRoomList(next);
    renderRoomList();
  };

  const roomStatus = (message, ok = true) => { const target = $('roomStatus'); if (target) { target.textContent = message; target.classList.toggle('status-warn', !ok); target.classList.toggle('status-ok', ok); } };

  $('createRoom').onclick = async () => {
    const files = Array.from($('roomFiles')?.files || []);
    if (!files.length) {
      roomStatus('Choose at least one document before creating a room.', false);
      return;
    }
    const purpose = ($('roomPurpose')?.value || '').trim();
    const recipient = ($('roomRecipient')?.value || '').trim();
    const ttl = Number($('roomTtl')?.value || 86400);
    const watermarkText = ($('roomWatermarkText')?.value || '').trim();
    const allowDownload = !!$('roomAllowDownload')?.checked;
    const watermark = !!$('roomWatermark')?.checked;
    if (!purpose || !recipient) {
      roomStatus('Purpose and recipient are required to create a secure room.', false);
      return;
    }
    const button = $('createRoom');
    button.disabled = true;
    button.textContent = 'Creating room...';
    try {
      const fileBundle = await Promise.all(files.map(async (file) => {
        const buffer = await file.arrayBuffer();
        return { name: file.name, type: file.type || 'application/octet-stream', size: file.size, data: b64(new Uint8Array(buffer)) };
      }));
      const roomKey = b64(crypto.getRandomValues(new Uint8Array(32)));
      const bundle = { purpose, recipient, watermarkText: watermarkText || 'Service Center · View only', allowDownload, watermark, documents: fileBundle };
      const payload = await encryptRoomBundle(bundle, roomKey);
      const response = await fetch('/api/security/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload,
          ttl,
          allowDownload,
          watermark,
          purpose,
          recipient,
          watermarkText: bundle.watermarkText,
          documents: fileBundle.map(roomDocumentMeta)
        })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Room creation failed.');
      const fullLink = `${location.origin}/security-room/${result.token}#key=${encodeURIComponent(roomKey)}`;
      $('roomOutput').classList.remove('hidden');
      $('roomQr').src = result.qrDataUrl;
      $('roomLink').href = fullLink;
      $('roomLink').textContent = fullLink;
      $('roomExpires').textContent = `Expires ${new Date(result.expiresAt).toLocaleString()}`;
      roomStatus('Room created. Share the link and keep the owner recovery key private.', true);
      appendRoomEntry({ token: result.token, ownerKey: result.ownerKey, url: fullLink, expiresAt: result.expiresAt, purpose, recipient });
      $('copyRoomLink').onclick = () => safeCopy(fullLink, $('copyRoomLink'));
      $('copyRoomKey').onclick = () => safeCopy(result.ownerKey, $('copyRoomKey'));
    } catch (error) {
      roomStatus(error.message || 'Room creation failed.', false);
    } finally {
      button.disabled = false;
      button.textContent = 'Create Secure Share Room';
    }
  };

  renderRoomList();
  document.addEventListener('click', (event) => {
    const openRoom = event.target.closest('[data-room-open]');
    const logRoom = event.target.closest('[data-room-log]');
    const revokeRoom = event.target.closest('[data-room-revoke]');
    const copyRoom = event.target.closest('[data-room-copy]');

    if (copyRoom) {
      const value = copyRoom.dataset.roomCopy || '';
      safeCopy(value, copyRoom);
      return;
    }
    if (openRoom) {
      const token = openRoom.dataset.roomOpen;
      const room = loadRoomList().find((entry) => entry.token === token);
      if (room) window.open(room.url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (logRoom) {
      const token = logRoom.dataset.roomLog;
      const room = loadRoomList().find((entry) => entry.token === token);
      const key = (room && room.ownerKey) || $('roomRecoveryKey')?.value || '';
      const recoveryToken = room ? room.token : parseRoomToken($('roomRecoveryToken')?.value || '');
      if (!recoveryToken || !key) { $('roomAccessLog').innerHTML = '<p class="status-warn">Paste the room token and owner key to view the access log.</p>'; return; }
      fetch(`/api/security/rooms/${recoveryToken}/log`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ownerKey: key }) }).then(async (response) => {
        const data = await response.json();
        $('roomAccessLog').innerHTML = data.success && data.entries.length ? data.entries.map((entry) => `<div class="room-log-entry"><strong>${entry.event}</strong><small>${new Date(entry.at).toLocaleString()}</small></div>`).join('') : '<p class="empty-state">No access entries yet.</p>';
      }).catch(() => { $('roomAccessLog').innerHTML = '<p class="status-warn">Unable to fetch the access log.</p>'; });
      return;
    }
    if (revokeRoom) {
      const token = revokeRoom.dataset.roomRevoke;
      const ownerKey = decodeURIComponent(revokeRoom.dataset.roomOwner || '');
      const recoveryToken = token || parseRoomToken($('roomRecoveryToken')?.value || '');
      if (!recoveryToken || !ownerKey) { $('roomAccessLog').innerHTML = '<p class="status-warn">Owner recovery key is required to revoke this room.</p>'; return; }
      fetch(`/api/security/rooms/${recoveryToken}/revoke`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ownerKey }) }).then(async (response) => { const data = await response.json(); $('roomAccessLog').innerHTML = response.ok && data.success ? '<p class="status-ok">Room revoked successfully.</p>' : '<p class="status-warn">Unable to revoke this room.</p>'; }).catch(() => { $('roomAccessLog').innerHTML = '<p class="status-warn">Unable to revoke this room.</p>'; });
    }
  });

  $('recoverRoomLog').onclick = async () => {
    const token = parseRoomToken($('roomRecoveryToken')?.value || '');
    const ownerKey = $('roomRecoveryKey')?.value || '';
    if (!token || !ownerKey) {
      $('roomAccessLog').innerHTML = '<p class="status-warn">Paste the room link or token and the owner recovery key to inspect access.</p>';
      return;
    }
    const response = await fetch(`/api/security/rooms/${token}/log`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ownerKey }) });
    const data = await response.json();
    $('roomAccessLog').innerHTML = response.ok && data.success && data.entries.length ? data.entries.map((entry) => `<div class="room-log-entry"><strong>${entry.event}</strong><small>${new Date(entry.at).toLocaleString()}</small></div>`).join('') : '<p class="empty-state">No access entries yet.</p>';
  };

  $('recoverRoomRevoke').onclick = async () => {
    const token = parseRoomToken($('roomRecoveryToken')?.value || '');
    const ownerKey = $('roomRecoveryKey')?.value || '';
    if (!token || !ownerKey) {
      $('roomAccessLog').innerHTML = '<p class="status-warn">Paste the room link or token and the owner recovery key to revoke it.</p>';
      return;
    }
    const response = await fetch(`/api/security/rooms/${token}/revoke`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ownerKey }) });
    const data = await response.json();
    $('roomAccessLog').innerHTML = response.ok && data.success ? '<p class="status-ok">Room revoked successfully.</p>' : '<p class="status-warn">Unable to revoke this room.</p>';
  };

  if ($('roomFiles')) {
    $('roomDrop').onclick = () => $('roomFiles').click();
    $('roomFiles').onchange = (event) => {
      const files = [...event.target.files];
      const list = $('roomDocumentList');
      if (!list) return;
      list.innerHTML = files.length ? files.map((file) => `<div class="room-document-item"><div><strong>${file.name}</strong><small>${file.type || 'File'} · ${(file.size / 1024).toFixed(0)} KB</small></div><span>${(file.size / 1024).toFixed(0)} KB</span></div>`).join('') : '<p class="empty-state">Your selected documents will appear here.</p>';
    };
  }

})();