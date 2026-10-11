document.addEventListener('DOMContentLoaded', () => {
    const byId = (id) => document.getElementById(id);
    const catalog = byId('qrToolCatalog');
    if (catalog) {
        [...catalog.querySelectorAll('.catalog-tool')].forEach((card, index) => {
            const title = card.querySelector('strong')?.textContent || '';
            const slug = title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const link = document.createElement('a');
            link.className = card.className;
            const params = new URLSearchParams({ tool: slug, panel: card.dataset.panel || 'createPanel', title });
            if (card.dataset.type) params.set('type', card.dataset.type);
            link.href = `/qr-generator?${params}`;
            link.style.setProperty('--tool-index', index);
            ['data-category', 'data-panel', 'data-type'].forEach((name) => { if (card.hasAttribute(name)) link.setAttribute(name, card.getAttribute(name)); });
            link.innerHTML = card.innerHTML;
            card.replaceWith(link);
        });
        const filterTools = () => {
            const query = byId('qrToolSearch').value.toLowerCase(), filter = document.querySelector('.qr-catalog .filter-chip.active').dataset.filter;
            const cards = [...catalog.querySelectorAll('.catalog-tool')];
            let visible = 0;
            cards.forEach((card) => { const show = (filter === 'all' || card.dataset.category === filter) && card.textContent.toLowerCase().includes(query); card.hidden = !show; if (show) visible += 1; });
            byId('qrCatalogEmpty').hidden = visible > 0;
        };
        byId('qrToolSearch').addEventListener('input', filterTools);
        document.querySelectorAll('.qr-catalog .filter-chip').forEach((chip) => chip.addEventListener('click', () => { document.querySelectorAll('.qr-catalog .filter-chip').forEach((item) => item.classList.toggle('active', item === chip)); filterTools(); }));
    }
    if (!byId('payloadType')) return;
    const tabs = [...document.querySelectorAll('.qr-workbench .workbench-tab')];
    const panels = [...document.querySelectorAll('.qr-workbench .workbench-panel')];
    const toolDetail = document.querySelector('.qr-tool-detail');
    const typeSelect = byId('payloadType');
    const payloadFields = byId('payloadFields');
    const qrCanvas = byId('qrCanvas');
    const qrContext = qrCanvas.getContext('2d');
    const status = (id, text, kind = '') => {
        const target = byId(id);
        if (!target) return;
        target.textContent = text;
        target.className = `tool-status${kind ? ` ${kind}` : ''}`;
    };
    const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    const safeJson = (value) => { try { return JSON.parse(value); } catch { return null; } };
    const schemas = {
        url: [['url', 'Website URL', 'url', 'https://example.com']],
        smartlink: [['destination', 'Destination URL', 'url', 'https://example.com'], ['utm_source', 'Campaign source', 'text', 'newsletter'], ['utm_medium', 'Campaign medium', 'text', 'email'], ['utm_campaign', 'Campaign name', 'text', 'spring-launch'], ['utm_term', 'Campaign term (optional)', 'text', ''], ['utm_content', 'Campaign content (optional)', 'text', '']],
        text: [['text', 'Text content', 'textarea', 'Enter any text, multilingual text or emoji']],
        phone: [['phone', 'Phone number', 'tel', '+911234567890']],
        email: [['email', 'Email address', 'email', 'hello@example.com'], ['subject', 'Subject', 'text', ''], ['body', 'Message', 'textarea', '']],
        sms: [['phone', 'Phone number', 'tel', '+911234567890'], ['message', 'Message', 'textarea', '']],
        wifi: [['ssid', 'Network name (SSID)', 'text', 'Wi-Fi network'], ['password', 'Password', 'password', ''], ['security', 'Security', 'select', 'WPA'], ['hidden', 'Hidden network', 'checkbox', '']],
        vcard: [['name', 'Full name', 'text', ''], ['org', 'Company', 'text', ''], ['title', 'Job title', 'text', ''], ['phone', 'Phone', 'tel', ''], ['phone2', 'Other phone', 'tel', ''], ['email', 'Email', 'email', ''], ['email2', 'Other email', 'email', ''], ['website', 'Website', 'url', ''], ['address', 'Address', 'text', ''], ['note', 'Notes', 'textarea', '']],
        location: [['latitude', 'Latitude', 'number', ''], ['longitude', 'Longitude', 'number', ''], ['address', 'Address (optional)', 'text', '']],
        event: [['title', 'Event name', 'text', ''], ['start', 'Start date and time', 'datetime-local', ''], ['end', 'End date and time', 'datetime-local', ''], ['location', 'Location', 'text', ''], ['organizer', 'Organizer', 'text', ''], ['description', 'Description', 'textarea', ''], ['url', 'Event URL', 'url', '']],
        whatsapp: [['phone', 'Phone with country code', 'tel', '919876543210'], ['message', 'Prefilled message', 'textarea', '']],
        upi: [['upi', 'UPI ID', 'text', 'name@bank'], ['payee', 'Payee name', 'text', ''], ['amount', 'Amount (optional)', 'number', ''], ['note', 'Transaction note', 'text', ''], ['currency', 'Currency', 'select', 'INR']],
        social: [['name', 'Name / username', 'text', ''], ['website', 'Website', 'url', ''], ['instagram', 'Instagram URL', 'url', ''], ['youtube', 'YouTube URL', 'url', ''], ['linkedin', 'LinkedIn URL', 'url', ''], ['x', 'X URL', 'url', ''], ['facebook', 'Facebook URL', 'url', ''], ['github', 'GitHub URL', 'url', ''], ['whatsapp', 'WhatsApp URL', 'url', '']],
        app: [['ios', 'iOS App Store URL', 'url', ''], ['android', 'Google Play URL', 'url', ''], ['fallback', 'Website fallback URL', 'url', '']],
        json: [['json', 'JSON data', 'textarea', '{\n  "name": "Example"\n}']],
        custom: [['custom', 'Custom payload', 'textarea', 'Paste any data supported by your QR reader']],
        gs1: [['gtin', 'GTIN', 'text', ''], ['domain', 'Digital Link domain', 'url', 'https://id.gs1.org'], ['lot', 'Batch / lot', 'text', ''], ['serial', 'Serial number', 'text', ''], ['expiry', 'Expiry YYMMDD', 'text', '']]
    };
    let currentPayload = '';
    let logoUrl = '';
    let logoImage = null;
    let logoAnchor = { x: 0.5, y: 0.5 };
    let qrBounds = null;
    let scanStream = null;
    let scanFrame = 0;
    let scanning = false;
    let lastScanned = '';
    let selectedQualityImage = null;
    let dynamicSlug = '';
    let dynamicToken = '';
    let dynamicActive = true;

    const panelNames = { createPanel: 'QR Generator & Designer', scanPanel: 'QR Scanner & Decoder', qualityPanel: 'Validator, Simulator & Repair', batchPanel: 'Bulk QR & Label Generator', businessPanel: 'Dynamic QR & Campaigns', extrasPanel: 'Barcode & Encryption Studio' };
    const showPanel = (panelId, scroll = true) => {
        tabs.forEach((tab) => { const active = tab.dataset.panel === panelId; tab.classList.toggle('active', active); tab.setAttribute('aria-selected', String(active)); });
        panels.forEach((panel) => { const active = panel.id === panelId; panel.hidden = !active; panel.classList.toggle('active', active); });
        byId('workbenchTitle').textContent = toolDetail?.dataset.toolTitle || panelNames[panelId] || 'QR Studio';
        if (scroll) byId('workbench').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    tabs.forEach((tab) => tab.addEventListener('click', () => showPanel(tab.dataset.panel)));

    const createField = ([name, label, kind, placeholder]) => {
        if (kind === 'checkbox') return `<label class="qr-check"><input type="checkbox" data-payload="${name}"> ${label}</label>`;
        if (kind === 'select') {
            const options = name === 'security' ? [['WPA', 'WPA/WPA2'], ['WEP', 'WEP'], ['nopass', 'Open network']] : [['INR', 'INR (Indian Rupee)']];
            return `<label class="qr-field"><span>${label}</span><select data-payload="${name}">${options.map(([v, text]) => `<option value="${v}">${text}</option>`).join('')}</select></label>`;
        }
        if (kind === 'textarea') return `<label class="qr-field qr-span-2"><span>${label}</span><textarea data-payload="${name}" rows="${name === 'text' || name === 'custom' ? 4 : 2}" placeholder="${escapeHtml(placeholder)}"></textarea></label>`;
        return `<label class="qr-field"><span>${label}</span><input data-payload="${name}" type="${kind}" placeholder="${escapeHtml(placeholder)}"${kind === 'number' ? ' step="any"' : ''}></label>`;
    };
    const renderFields = () => {
        payloadFields.innerHTML = `<div class="qr-field-grid">${(schemas[typeSelect.value] || schemas.custom).map(createField).join('')}</div>`;
        if (typeSelect.value === 'wifi') payloadFields.querySelector('[data-payload="password"]').autocomplete = 'new-password';
    };
    typeSelect.addEventListener('change', renderFields);
    renderFields();
    if (toolDetail) {
        if (toolDetail.dataset.toolType && ![...typeSelect.options].some((option) => option.value === toolDetail.dataset.toolType)) {
            const option = document.createElement('option'); option.value = toolDetail.dataset.toolType; option.textContent = toolDetail.dataset.toolTitle; typeSelect.add(option);
        }
        if (toolDetail.dataset.toolType) {
            typeSelect.value = toolDetail.dataset.toolType;
            renderFields();
        }
        showPanel(toolDetail.dataset.toolPanel, false);
        if (toolDetail.dataset.toolType === 'smartlink') {
            const actions = document.createElement('section'); actions.className = 'qr-smartlink-actions';
            actions.innerHTML = '<div class="qr-field-grid"><label class="qr-field"><span>Custom short-link slug (optional)</span><input id="smartLinkSlug" maxlength="48" placeholder="spring-menu"></label><div class="qr-smartlink-copy"><strong>Static QR</strong><span>Updates live from the URL and campaign fields above.</span></div></div><div class="qr-action-row"><button class="primary-action" type="button" id="smartLinkDynamic"><i class="bi bi-link-45deg"></i> Create dynamic QR link</button></div><div class="qr-smartlink-result" id="smartLinkResult" aria-live="polite"></div><p class="tool-status" id="smartLinkStatus" aria-live="polite"></p>';
            byId('qrStatus').before(actions);
        }
    }
    byId('qrMargin').closest('.qr-field').insertAdjacentHTML('afterend', '<label class="qr-field"><span>Design preset</span><select id="qrPreset"><option value="custom">Custom</option><option value="minimal">Minimal</option><option value="corporate">Corporate</option><option value="luxury">Luxury</option><option value="neon">Neon</option><option value="gradient">Gradient</option><option value="glass">Glass</option><option value="ecommerce">E-commerce</option><option value="restaurant">Restaurant</option><option value="event">Event</option><option value="portfolio">Portfolio</option></select></label>');
    document.querySelector('.qr-design-grid').insertAdjacentHTML('beforeend', '<label class="qr-field"><span>Background treatment</span><select id="qrBackgroundTreatment"><option value="solid">Solid</option><option value="linear">Linear gradient</option><option value="radial">Radial gradient</option></select></label><label class="qr-field"><span>Second background color</span><input id="qrBackgroundAlt" type="color" value="#edf4f1"></label><label class="qr-field"><span>Finder corner style</span><select id="qrCornerStyle"><option value="square">Square</option><option value="rounded">Rounded</option><option value="circle">Dots</option></select></label><label class="qr-field"><span>Logo backing</span><select id="qrLogoBackground"><option value="background">Match background</option><option value="white">White</option><option value="none">Transparent</option></select></label><label class="qr-field"><span>Logo margin <output id="qrLogoMarginValue">2 modules</output></span><input id="qrLogoMargin" type="range" min="0" max="8" value="2"></label><label class="qr-field"><span>Manual QR version (0 = auto)</span><input id="qrVersion" type="number" min="0" max="40" value="0"></label><label class="qr-check"><input id="qrBorder" type="checkbox"> Add print frame border</label>');
    const field = (name) => payloadFields.querySelector(`[data-payload="${name}"]`);
    const value = (name) => (field(name)?.value || '').trim();
    const checked = (name) => Boolean(field(name)?.checked);
    const wifiEscape = (text) => String(text).replace(/([\\;,:])/g, '\\$1');
    const icsEscape = (text) => String(text).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const icsDate = (text) => text ? new Date(text).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') : '';
    const validHttpUrl = (text) => { try { const parsed = new URL(text); return ['http:', 'https:'].includes(parsed.protocol); } catch { return false; } };
    const gs1Payload = () => {
        const gtin = (value('gtin') || byId('gs1Gtin').value).replace(/\s/g, '');
        if (!/^\d{8,14}$/.test(gtin) || !validGtin(gtin)) throw new Error('Enter a valid GTIN with a correct check digit.');
        const domain = value('domain') || byId('gs1Domain').value.trim() || 'https://id.gs1.org';
        if (!validHttpUrl(domain)) throw new Error('Use an HTTP(S) Digital Link domain.');
        const lot = value('lot') || byId('gs1Lot').value.trim();
        const serial = value('serial') || byId('gs1Serial').value.trim();
        const expiry = value('expiry') || byId('gs1Expiry').value.trim();
        let uri = `${domain.replace(/\/$/, '')}/01/${encodeURIComponent(gtin)}`;
        if (lot) uri += `/10/${encodeURIComponent(lot)}`;
        if (serial) uri += `/21/${encodeURIComponent(serial)}`;
        if (expiry) { if (!/^\d{6}$/.test(expiry)) throw new Error('Expiry must use YYMMDD.'); uri += `${uri.includes('?') ? '&' : '?'}17=${expiry}`; }
        return uri;
    };
    function validGtin(gtin) {
        const digits = gtin.split('').map(Number);
        const check = digits.pop();
        const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
        return (10 - (sum % 10)) % 10 === check;
    }
    const buildPayload = () => {
        const type = typeSelect.value;
        switch (type) {
            case 'url': case 'app': {
                const target = type === 'url' ? value('url') : value('ios') || value('android') || value('fallback');
                if (!validHttpUrl(target)) throw new Error('Enter a valid HTTP(S) URL.');
                return target;
            }
            case 'smartlink': {
                const destination = value('destination');
                if (!validHttpUrl(destination)) throw new Error('Enter a valid HTTP(S) destination URL.');
                const url = new URL(destination);
                [['utm_source', 'utm_source'], ['utm_medium', 'utm_medium'], ['utm_campaign', 'utm_campaign'], ['utm_term', 'utm_term'], ['utm_content', 'utm_content']].forEach(([key, param]) => { if (value(key)) url.searchParams.set(param, value(key)); });
                return url.toString();
            }
            case 'text': case 'custom': if (!value(type)) throw new Error('Enter some text first.'); return value(type);
            case 'phone': if (!value('phone')) throw new Error('Enter a phone number.'); return `tel:${value('phone')}`;
            case 'email': if (!value('email')) throw new Error('Enter an email address.'); return `mailto:${value('email')}?subject=${encodeURIComponent(value('subject'))}&body=${encodeURIComponent(value('body'))}`;
            case 'sms': if (!value('phone')) throw new Error('Enter a phone number.'); return `SMSTO:${value('phone')}:${value('message')}`;
            case 'wifi': {
                if (!value('ssid')) throw new Error('Enter a Wi-Fi network name.');
                const security = value('security') || 'WPA';
                if (security !== 'nopass' && !value('password')) throw new Error('Enter the Wi-Fi password, or select Open network.');
                return `WIFI:T:${security};S:${wifiEscape(value('ssid'))};P:${wifiEscape(security === 'nopass' ? '' : value('password'))};H:${checked('hidden') ? 'true' : 'false'};;`;
            }
            case 'vcard': {
                const fields = [['FN', value('name')], ['ORG', value('org')], ['TITLE', value('title')], ['TEL', value('phone')], ['TEL', value('phone2')], ['EMAIL', value('email')], ['EMAIL', value('email2')], ['URL', value('website')], ['ADR', value('address')], ['NOTE', value('note')]].filter(([, text]) => text);
                if (!fields.length) throw new Error('Enter at least one contact field.');
                return ['BEGIN:VCARD', 'VERSION:3.0', ...fields.map(([key, text]) => `${key}:${String(text).replace(/\n/g, '\\n')}`), 'END:VCARD'].join('\r\n');
            }
            case 'location': {
                const lat = value('latitude'), lon = value('longitude');
                if (lat && lon && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon)) && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lon)) <= 180) return `https://maps.google.com/?q=${encodeURIComponent(`${lat},${lon}`)}`;
                if (value('address')) return `https://maps.google.com/?q=${encodeURIComponent(value('address'))}`;
                throw new Error('Enter valid latitude/longitude or an address.');
            }
            case 'event': {
                if (!value('title') || !value('start')) throw new Error('Event name and start time are required.');
                const start = icsDate(value('start')), end = icsDate(value('end'));
                return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `SUMMARY:${icsEscape(value('title'))}`, `DTSTART:${start}`, ...(end ? [`DTEND:${end}`] : []), ...(value('location') ? [`LOCATION:${icsEscape(value('location'))}`] : []), ...(value('organizer') ? [`ORGANIZER:${icsEscape(value('organizer'))}`] : []), ...(value('description') ? [`DESCRIPTION:${icsEscape(value('description'))}`] : []), ...(value('url') && validHttpUrl(value('url')) ? [`URL:${value('url')}`] : []), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
            }
            case 'whatsapp': {
                const phone = value('phone').replace(/\D/g, '');
                if (!phone) throw new Error('Enter a phone number with country code.');
                return `https://wa.me/${phone}${value('message') ? `?text=${encodeURIComponent(value('message'))}` : ''}`;
            }
            case 'upi': {
                if (!value('upi') || !value('payee')) throw new Error('UPI ID and payee name are required.');
                if (value('amount') && Number(value('amount')) <= 0) throw new Error('Amount must be greater than zero.');
                const params = new URLSearchParams({ pa: value('upi'), pn: value('payee'), cu: value('currency') || 'INR' });
                if (value('amount')) params.set('am', Number(value('amount')).toFixed(2));
                if (value('note')) params.set('tn', value('note'));
                return `upi://pay?${params.toString()}`;
            }
            case 'social': {
                const data = Object.fromEntries((schemas.social).map(([key]) => [key, value(key)]).filter(([, text]) => text));
                if (!data.name && !Object.keys(data).some((key) => key !== 'name')) throw new Error('Enter a name or a social profile link.');
                return JSON.stringify({ type: 'social-profile', version: 1, ...data }, null, 2);
            }
            case 'json': {
                const parsed = safeJson(value('json'));
                if (parsed === null) throw new Error('Enter valid JSON.');
                return JSON.stringify(parsed);
            }
            case 'gs1': return gs1Payload();
            default: throw new Error('Choose a supported payload type.');
        }
    };

    const getDesign = () => ({
        size: Number(byId('qrSize').value), margin: Number(byId('qrMargin').value), correction: byId('qrCorrection').value,
        foreground: byId('qrForeground').value, background: byId('qrBackground').value, gradient: byId('qrGradient').value,
        style: byId('qrDotStyle').value, transparent: byId('qrTransparent').checked, frame: byId('qrFrame').value,
        label: byId('qrLabel').value.trim(), font: byId('qrFont').value, textColor: byId('qrTextColor').value,
        logoSize: Number(byId('qrLogoSize').value) / 100, logoPosition: byId('qrLogoPosition').value,
        backgroundAlt: byId('qrBackgroundAlt').value, backgroundTreatment: byId('qrBackgroundTreatment').value,
        cornerStyle: byId('qrCornerStyle').value, logoBackground: byId('qrLogoBackground').value,
        logoMargin: Number(byId('qrLogoMargin').value), version: Number(byId('qrVersion').value || 0), border: byId('qrBorder').checked
    });
    const frameLabels = { scan: 'SCAN ME', visit: 'SCAN TO VISIT', social: 'CONNECT WITH US', business: 'CONTACT', poster: 'SCAN TO DISCOVER', packaging: 'PRODUCT DETAILS', restaurant: 'VIEW OUR MENU', event: 'EVENT DETAILS' };
    const roundedRect = (ctx, x, y, width, height, radius) => {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + width, y, x + width, y + height, r); ctx.arcTo(x + width, y + height, x, y + height, r); ctx.arcTo(x, y + height, x, y, r); ctx.arcTo(x, y, x + width, y, r); ctx.closePath();
    };
    const paintModules = (ctx, modules, x, y, area, design) => {
        const count = modules.size;
        const cell = area / (count + design.margin * 2);
        const inset = design.margin * cell;
        let fill = design.foreground;
        if (design.gradient === 'linear') { fill = ctx.createLinearGradient(x, y, x + area, y + area); fill.addColorStop(0, design.foreground); fill.addColorStop(1, design.textColor); }
        if (design.gradient === 'radial') { fill = ctx.createRadialGradient(x + area / 2, y + area / 2, area * .04, x + area / 2, y + area / 2, area * .7); fill.addColorStop(0, design.foreground); fill.addColorStop(1, design.textColor); }
        ctx.fillStyle = fill;
        for (let row = 0; row < count; row += 1) for (let col = 0; col < count; col += 1) {
            if (!modules.get(row, col)) continue;
            const px = Math.round(x + inset + col * cell), py = Math.round(y + inset + row * cell), side = Math.ceil(cell);
            const inFinder = (row < 8 && col < 8) || (row < 8 && col >= count - 8) || (row >= count - 8 && col < 8);
            const style = inFinder ? design.cornerStyle : design.style;
            if (style === 'circle') { ctx.beginPath(); ctx.arc(px + cell / 2, py + cell / 2, cell * .42, 0, Math.PI * 2); ctx.fill(); }
            else if (style === 'rounded') { roundedRect(ctx, px, py, side, side, cell * .34); ctx.fill(); }
            else ctx.fillRect(px, py, side, side);
        }
        return { x, y, area, cell, count };
    };
    const drawLogo = (ctx, bounds, design) => {
        if (!logoImage || !logoUrl) return;
        const size = bounds.area * design.logoSize;
        let cx = bounds.x + bounds.area * logoAnchor.x, cy = bounds.y + bounds.area * logoAnchor.y;
        const positions = { center: [.5, .5], 'top-left': [.28, .28], 'top-right': [.72, .28], 'bottom-left': [.28, .72], 'bottom-right': [.72, .72] };
        if (!qrCanvas.dataset.dragged) [logoAnchor.x, logoAnchor.y] = positions[design.logoPosition] || [.5, .5];
        cx = bounds.x + bounds.area * logoAnchor.x; cy = bounds.y + bounds.area * logoAnchor.y;
        const logoWidth = size, logoHeight = size * (logoImage.height / logoImage.width || 1);
        const side = Math.max(logoWidth, logoHeight) + bounds.cell * 1.5;
        const backing = design.logoBackground === 'white' ? '#ffffff' : design.logoBackground === 'none' ? '' : design.background;
        if (backing) { ctx.fillStyle = backing; roundedRect(ctx, cx - side / 2, cy - side / 2, side, side, bounds.cell * design.logoMargin); ctx.fill(); }
        ctx.drawImage(logoImage, cx - logoWidth / 2, cy - logoHeight / 2, logoWidth, logoHeight);
        qrBounds.logo = { x: cx - side / 2, y: cy - side / 2, size: side };
    };
    const renderMatrix = (text, canvas, design, frameOverride = null) => {
        if (!window.QRCode?.create) throw new Error('QR library did not load. Check your connection and reload.');
        const qr = window.QRCode.create(text, { errorCorrectionLevel: design.correction, typeNumber: design.version || 0 });
        const frame = frameOverride || design.frame;
        const frameHeight = frame === 'none' ? 0 : Math.round(design.size * .19);
        canvas.width = design.size; canvas.height = design.size + frameHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!design.transparent) {
            let background = design.background;
            if (design.backgroundTreatment === 'linear') { background = ctx.createLinearGradient(0, 0, canvas.width, canvas.height); background.addColorStop(0, design.background); background.addColorStop(1, design.backgroundAlt); }
            if (design.backgroundTreatment === 'radial') { background = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * .72); background.addColorStop(0, design.background); background.addColorStop(1, design.backgroundAlt); }
            ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        if (frame !== 'none') {
            ctx.fillStyle = design.textColor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.font = `700 ${Math.round(design.size * .045)}px "${design.font}", sans-serif`;
            const label = (design.label || frameLabels[frame] || 'SCAN ME').slice(0, 80);
            ctx.fillText(label, canvas.width / 2, frameHeight * .52, canvas.width * .88);
        }
        const y = frame === 'none' ? 0 : frameHeight;
        qrBounds = paintModules(ctx, qr.modules, 0, y, design.size, design);
        drawLogo(ctx, qrBounds, design);
        if (design.border) { ctx.strokeStyle = design.textColor; ctx.lineWidth = Math.max(2, design.size * .006); ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, canvas.width - ctx.lineWidth * 2, canvas.height - ctx.lineWidth * 2); }
        canvas.style.display = 'block';
        byId('qrPreviewEmpty').hidden = true;
        byId('qrMetaType').textContent = `Payload: ${typeSelect.value}`;
        const version = Math.max(1, Math.round((qr.modules.size - 17) / 4));
        byId('qrMetaVersion').textContent = `Version: ${version} · EC ${design.correction}`;
        byId('qrMetaChars').textContent = `${text.length.toLocaleString()} characters`;
        return qr;
    };
    const makeSvg = (text, design) => {
        const qr = window.QRCode.create(text, { errorCorrectionLevel: design.correction, typeNumber: design.version || 0 });
        const frameHeight = design.frame === 'none' ? 0 : Math.round(design.size * .19);
        const height = design.size + frameHeight;
        const cell = design.size / (qr.modules.size + design.margin * 2);
        const inset = design.margin * cell;
        const bgFill = design.backgroundTreatment === 'solid' ? design.background : 'url(#bg)';
        const bg = design.transparent ? '' : `<rect width="100%" height="100%" fill="${bgFill}"/>`;
        const defs = `<defs>${design.gradient === 'solid' ? '' : `<linearGradient id="fg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${design.foreground}"/><stop offset="1" stop-color="${design.textColor}"/></linearGradient>`}${design.backgroundTreatment === 'linear' ? `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${design.background}"/><stop offset="1" stop-color="${design.backgroundAlt}"/></linearGradient>` : ''}${design.backgroundTreatment === 'radial' ? `<radialGradient id="bg"><stop stop-color="${design.background}"/><stop offset="1" stop-color="${design.backgroundAlt}"/></radialGradient>` : ''}</defs>`;
        const foreground = design.gradient === 'solid' ? design.foreground : 'url(#fg)';
        const label = design.frame === 'none' ? '' : `<text x="50%" y="${frameHeight * .58}" text-anchor="middle" font-family="${escapeHtml(design.font)}" font-size="${Math.round(design.size * .045)}" font-weight="700" fill="${design.textColor}">${escapeHtml((design.label || frameLabels[design.frame] || 'SCAN ME').slice(0, 80))}</text>`;
        const modules = [];
        for (let row = 0; row < qr.modules.size; row += 1) for (let col = 0; col < qr.modules.size; col += 1) if (qr.modules.get(row, col)) {
            const x = (inset + col * cell).toFixed(2), y = (frameHeight + inset + row * cell).toFixed(2), side = (cell + .15).toFixed(2);
            const inFinder = (row < 8 && col < 8) || (row < 8 && col >= qr.modules.size - 8) || (row >= qr.modules.size - 8 && col < 8), style = inFinder ? design.cornerStyle : design.style;
            modules.push(style === 'circle' ? `<circle cx="${(inset + (col + .5) * cell).toFixed(2)}" cy="${(frameHeight + inset + (row + .5) * cell).toFixed(2)}" r="${(cell * .42).toFixed(2)}" fill="${foreground}"/>` : `<rect x="${x}" y="${y}" width="${side}" height="${side}"${style === 'rounded' ? ` rx="${(cell * .3).toFixed(2)}"` : ''} fill="${foreground}"/>`);
        }
        let logo = '';
        if (logoUrl && logoImage) {
            const size = design.size * design.logoSize;
            const x = design.size * logoAnchor.x - size / 2, y = frameHeight + design.size * logoAnchor.y - size / 2;
            const backing = design.logoBackground === 'none' ? '' : `<rect x="${x - cell * design.logoMargin}" y="${y - cell * design.logoMargin}" width="${size + cell * design.logoMargin * 2}" height="${size + cell * design.logoMargin * 2}" rx="${cell * design.logoMargin}" fill="${design.logoBackground === 'white' ? '#fff' : design.background}"/>`;
            logo = `${backing}<image href="${logoUrl}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
        }
        const border = design.border ? `<rect x="2" y="2" width="${design.size - 4}" height="${height - 4}" fill="none" stroke="${design.textColor}" stroke-width="3"/>` : '';
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${design.size}" height="${height}" viewBox="0 0 ${design.size} ${height}" shape-rendering="crispEdges">${defs}${bg}${label}${modules.join('')}${logo}${border}</svg>`;
    };
    const generate = (forcedText = null) => {
        try {
            currentPayload = forcedText === null ? buildPayload() : forcedText;
            renderMatrix(currentPayload, qrCanvas, getDesign());
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) qrCanvas.animate([{ opacity: .55, transform: 'scale(.975)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 210, easing: 'cubic-bezier(.2,.75,.25,1)' });
            status('qrStatus', 'QR ready. Scan the preview once before sharing or printing.', 'success');
            const oldVcf = byId('qrVcfDownload'); oldVcf?.remove();
            if (typeSelect.value === 'vcard') {
                const button = document.createElement('button'); button.className = 'secondary-action'; button.id = 'qrVcfDownload'; button.textContent = 'Download VCF';
                button.addEventListener('click', () => downloadBlob(new Blob([currentPayload], { type: 'text/vcard;charset=utf-8' }), 'contact.vcf'));
                byId('qrGenerate').parentElement.append(button);
            }
        } catch (error) { status('qrStatus', error.message || 'Could not create QR.', 'error'); }
    };
    let liveTimer = 0;
    const queueLivePreview = () => {
        window.clearTimeout(liveTimer);
        liveTimer = window.setTimeout(() => { try { const payload = buildPayload(); if (payload) generate(payload); } catch { /* incomplete input is normal while typing */ } }, 90);
    };
    payloadFields.addEventListener('input', queueLivePreview);
    typeSelect.addEventListener('change', queueLivePreview);
    byId('qrGenerate').addEventListener('click', () => generate());
    ['qrSize', 'qrMargin', 'qrCorrection', 'qrForeground', 'qrBackground', 'qrGradient', 'qrDotStyle', 'qrTransparent', 'qrFrame', 'qrLabel', 'qrFont', 'qrTextColor', 'qrLogoSize', 'qrLogoPosition', 'qrBackgroundTreatment', 'qrBackgroundAlt', 'qrCornerStyle', 'qrLogoBackground', 'qrLogoMargin', 'qrVersion', 'qrBorder'].forEach((id) => byId(id).addEventListener('input', () => { if (id === 'qrMargin') byId('qrMarginValue').value = `${byId(id).value} modules`; if (id === 'qrLogoSize') byId('qrLogoSizeValue').value = `${byId(id).value}%`; if (id === 'qrLogoMargin') byId('qrLogoMarginValue').value = `${byId(id).value} modules`; if (id === 'qrLogoPosition') delete qrCanvas.dataset.dragged; if (currentPayload) { try { renderMatrix(currentPayload, qrCanvas, getDesign()); } catch { /* keep the last valid preview */ } } }));
    const presets = {
        minimal: { foreground: '#152622', background: '#ffffff', backgroundAlt: '#eaf1ed', gradient: 'solid', backgroundTreatment: 'solid', style: 'square', cornerStyle: 'square', frame: 'none', correction: 'Q', label: '' },
        corporate: { foreground: '#123b36', background: '#ffffff', backgroundAlt: '#e3f1ed', gradient: 'solid', backgroundTreatment: 'solid', style: 'rounded', cornerStyle: 'square', frame: 'business', correction: 'H', label: 'CONTACT US' },
        luxury: { foreground: '#20201d', background: '#f5f0e3', backgroundAlt: '#e8dfcc', gradient: 'solid', backgroundTreatment: 'solid', style: 'square', cornerStyle: 'square', frame: 'business', correction: 'H', label: 'DISCOVER MORE' },
        neon: { foreground: '#56f0c0', background: '#10231f', backgroundAlt: '#193b35', gradient: 'linear', backgroundTreatment: 'solid', style: 'circle', cornerStyle: 'square', frame: 'scan', correction: 'H', label: 'SCAN ME' },
        gradient: { foreground: '#075c54', background: '#ffffff', backgroundAlt: '#e8f5f2', gradient: 'linear', backgroundTreatment: 'solid', style: 'rounded', cornerStyle: 'square', frame: 'none', correction: 'H', label: '' },
        glass: { foreground: '#163b36', background: '#edf7f3', backgroundAlt: '#d8ede6', gradient: 'solid', backgroundTreatment: 'radial', style: 'rounded', cornerStyle: 'square', frame: 'none', correction: 'H', label: '' },
        ecommerce: { foreground: '#172d27', background: '#ffffff', backgroundAlt: '#edf4f1', gradient: 'solid', backgroundTreatment: 'solid', style: 'square', cornerStyle: 'square', frame: 'packaging', correction: 'H', label: 'PRODUCT DETAILS' },
        restaurant: { foreground: '#202c25', background: '#fffdf7', backgroundAlt: '#f1ebd9', gradient: 'solid', backgroundTreatment: 'solid', style: 'rounded', cornerStyle: 'square', frame: 'restaurant', correction: 'H', label: 'VIEW OUR MENU' },
        event: { foreground: '#143d42', background: '#ffffff', backgroundAlt: '#e4f2f2', gradient: 'linear', backgroundTreatment: 'solid', style: 'rounded', cornerStyle: 'square', frame: 'event', correction: 'H', label: 'EVENT DETAILS' },
        portfolio: { foreground: '#203743', background: '#ffffff', backgroundAlt: '#e8f0f4', gradient: 'solid', backgroundTreatment: 'solid', style: 'circle', cornerStyle: 'square', frame: 'social', correction: 'H', label: 'MY WORK' }
    };
    byId('qrPreset').addEventListener('change', () => {
        const preset = presets[byId('qrPreset').value]; if (!preset) return;
        const accents = { neon: '#d7ff63', gradient: '#2d9caa', event: '#b95a4c', portfolio: '#5997aa', glass: '#4b8c78' };
        byId('qrForeground').value = preset.foreground; byId('qrBackground').value = preset.background; byId('qrBackgroundAlt').value = preset.backgroundAlt;
        byId('qrGradient').value = preset.gradient; byId('qrBackgroundTreatment').value = preset.backgroundTreatment; byId('qrDotStyle').value = preset.style; byId('qrCornerStyle').value = preset.cornerStyle;
        byId('qrFrame').value = preset.frame; byId('qrCorrection').value = preset.correction; byId('qrLabel').value = preset.label; byId('qrTextColor').value = accents[byId('qrPreset').value] || preset.foreground;
        if (currentPayload) generate(currentPayload);
    });
    byId('qrFrame').addEventListener('change', () => { const frame = byId('qrFrame').value; if (frame !== 'none' && !byId('qrLabel').value) byId('qrLabel').value = frameLabels[frame] || ''; if (currentPayload) generate(currentPayload); });
    byId('qrLogo').addEventListener('change', (event) => {
        const file = event.target.files?.[0]; if (!file) return;
        if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) { status('qrStatus', 'Choose an image smaller than 5 MB.', 'error'); event.target.value = ''; return; }
        const reader = new FileReader(); reader.onload = () => { logoUrl = reader.result; logoImage = new Image(); logoImage.onload = () => { qrCanvas.dataset.dragged = ''; if (currentPayload) generate(currentPayload); byId('qrLogoHint').textContent = file.name; }; logoImage.src = logoUrl; }; reader.readAsDataURL(file);
    });
    qrCanvas.addEventListener('pointerdown', (event) => {
        if (!qrBounds?.logo) return;
        const rect = qrCanvas.getBoundingClientRect(), x = (event.clientX - rect.left) * qrCanvas.width / rect.width, y = (event.clientY - rect.top) * qrCanvas.height / rect.height, logo = qrBounds.logo;
        if (x >= logo.x && x <= logo.x + logo.size && y >= logo.y && y <= logo.y + logo.size) { qrCanvas.setPointerCapture(event.pointerId); qrCanvas.dataset.dragging = 'true'; }
    });
    qrCanvas.addEventListener('pointermove', (event) => {
        if (qrCanvas.dataset.dragging !== 'true' || !qrBounds) return;
        const rect = qrCanvas.getBoundingClientRect(), x = (event.clientX - rect.left) * qrCanvas.width / rect.width, y = (event.clientY - rect.top) * qrCanvas.height / rect.height;
        logoAnchor = { x: Math.max(.12, Math.min(.88, x / qrCanvas.width)), y: Math.max(.12, Math.min(.88, (y - qrBounds.y) / qrBounds.area)) }; qrCanvas.dataset.dragged = 'true';
        if (currentPayload) renderMatrix(currentPayload, qrCanvas, getDesign());
    });
    qrCanvas.addEventListener('pointerup', () => { delete qrCanvas.dataset.dragging; });
    byId('qrReset').addEventListener('click', () => { typeSelect.value = 'url'; renderFields(); byId('qrSize').value = '512'; byId('qrCorrection').value = 'Q'; byId('qrMargin').value = '4'; byId('qrForeground').value = '#132d2a'; byId('qrBackground').value = '#ffffff'; byId('qrBackgroundAlt').value = '#edf4f1'; byId('qrGradient').value = 'solid'; byId('qrBackgroundTreatment').value = 'solid'; byId('qrDotStyle').value = 'square'; byId('qrCornerStyle').value = 'square'; byId('qrFrame').value = 'none'; byId('qrPreset').value = 'custom'; byId('qrVersion').value = '0'; byId('qrLabel').value = ''; byId('qrTransparent').checked = false; byId('qrBorder').checked = false; byId('qrLogo').value = ''; logoUrl = ''; logoImage = null; logoAnchor = { x: .5, y: .5 }; currentPayload = ''; qrCanvas.style.display = 'none'; byId('qrPreviewEmpty').hidden = false; status('qrStatus', 'Design reset.'); });

    const downloadBlob = (blob, name) => { const url = URL.createObjectURL(blob), anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
    const exportQr = (format) => {
        if (!currentPayload) { status('qrStatus', 'Generate a QR code first.', 'error'); return; }
        const design = getDesign();
        if (format === 'svg') { downloadBlob(new Blob([makeSvg(currentPayload, design)], { type: 'image/svg+xml;charset=utf-8' }), 'qr-code.svg'); return; }
        const type = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
        const exportCanvas = document.createElement('canvas'); exportCanvas.width = qrCanvas.width; exportCanvas.height = qrCanvas.height;
        const ctx = exportCanvas.getContext('2d'); if (format === 'jpg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height); }
        ctx.drawImage(qrCanvas, 0, 0); exportCanvas.toBlob((blob) => blob ? downloadBlob(blob, `qr-code.${format}`) : status('qrStatus', 'This browser could not export that image type.', 'error'), type, .94);
    };
    document.querySelectorAll('[data-export]').forEach((button) => button.addEventListener('click', () => exportQr(button.dataset.export)));
    byId('qrCopyImage').addEventListener('click', async () => { if (!currentPayload || !navigator.clipboard?.write) { status('qrStatus', 'Image clipboard is not available in this browser/context.', 'error'); return; } try { const blob = await new Promise((resolve) => qrCanvas.toBlob(resolve, 'image/png')); await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); status('qrStatus', 'QR image copied.', 'success'); } catch { status('qrStatus', 'Clipboard permission was not granted.', 'error'); } });
    byId('qrCopySvg').addEventListener('click', async () => { if (!currentPayload) return status('qrStatus', 'Generate a QR code first.', 'error'); try { await navigator.clipboard.writeText(makeSvg(currentPayload, getDesign())); status('qrStatus', 'SVG markup copied.', 'success'); } catch { status('qrStatus', 'Clipboard permission was not granted.', 'error'); } });
    byId('qrPrint').addEventListener('click', () => { if (!currentPayload) return status('qrStatus', 'Generate a QR code first.', 'error'); const popup = window.open('', '_blank'); if (!popup) return status('qrStatus', 'Allow pop-ups to print this code.', 'error'); const image = qrCanvas.toDataURL('image/png'); popup.document.write(`<title>Print QR</title><img style="max-width:90vw;max-height:85vh;display:block;margin:5vh auto" src="${image}" onload="window.print()">`); popup.document.close(); });
    byId('qrFavorite').addEventListener('click', () => { const favorites = safeJson(localStorage.getItem('qrStudioFavorites') || '[]') || []; favorites.push({ ...getDesign(), savedAt: new Date().toISOString() }); localStorage.setItem('qrStudioFavorites', JSON.stringify(favorites.slice(-20))); byId('qrFavorite').innerHTML = '<i class="bi bi-star-fill"></i>'; status('qrStatus', 'Design preset saved on this browser.', 'success'); });

    const scanHistoryKey = 'qrStudioScanHistory';
    const history = () => safeJson(localStorage.getItem(scanHistoryKey) || '[]') || [];
    const renderHistory = () => {
        const list = byId('scanHistory'); list.replaceChildren();
        history().slice(0, 12).forEach((entry) => { const item = document.createElement('div'); item.className = 'qr-history-item'; const text = document.createElement('span'); text.textContent = `${entry.value.slice(0, 110)} · ${new Date(entry.time).toLocaleString()}`; const button = document.createElement('button'); button.className = 'secondary-action'; button.textContent = 'Use'; button.addEventListener('click', () => { byId('scanResult').value = entry.value; renderScanActions(entry.value); }); item.append(text, button); list.append(item); });
    };
    const detectCodes = async (canvas) => {
        if (window.BarcodeDetector) {
            try { const formats = await BarcodeDetector.getSupportedFormats(); const detector = new BarcodeDetector({ formats }); const found = await detector.detect(canvas); if (found.length) return found.map((item) => ({ data: item.rawValue, format: item.format })); } catch { /* use the local QR decoder fallback */ }
        }
        const ctx = canvas.getContext('2d', { willReadFrequently: true }), image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = window.jsQR?.(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' });
        return decoded ? [{ data: decoded.data, format: 'qr_code', version: decoded.version }] : [];
    };
    const renderScanActions = (text) => {
        const target = byId('scanActions'); target.replaceChildren();
        const add = (label, href) => { const link = document.createElement('a'); link.className = 'secondary-action'; link.href = href; link.textContent = label; link.target = '_blank'; link.rel = 'noopener noreferrer'; target.append(link); };
        if (/^https?:\/\//i.test(text)) add('Open URL', text);
        if (/^geo:/i.test(text)) add('Open map', `https://maps.google.com/?q=${encodeURIComponent(text.slice(4))}`);
        if (/^WIFI:/i.test(text)) { const ssid = text.match(/S:((?:\\.|[^;])*)/)?.[1]?.replace(/\\(.)/g, '$1'); if (ssid) { const note = document.createElement('span'); note.className = 'qr-report-row'; note.textContent = `Wi-Fi network: ${ssid}. Confirm network and password with its owner before connecting.`; target.append(note); } }
        if (/BEGIN:VCARD/i.test(text)) { const button = document.createElement('button'); button.className = 'secondary-action'; button.textContent = 'Download contact'; button.addEventListener('click', () => downloadBlob(new Blob([text], { type: 'text/vcard' }), 'contact.vcf')); target.append(button); }
    };
    const acceptScan = (text, format = 'qr_code') => {
        if (!text) return;
        byId('scanResult').value = text; renderScanActions(text);
        if (text !== lastScanned) { lastScanned = text; const entries = history(); entries.unshift({ value: text, format, time: new Date().toISOString() }); localStorage.setItem(scanHistoryKey, JSON.stringify(entries.slice(0, 40))); renderHistory(); }
        status('scanStatus', `${format.replace('_', ' ')} decoded.`, 'success');
    };
    const loadImage = (file) => new Promise((resolve, reject) => { const url = URL.createObjectURL(file), img = new Image(); img.onload = () => { URL.revokeObjectURL(url); resolve(img); }; img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this image.')); }; img.src = url; });
    const imageToCanvas = (img, maxSide = 1800) => { const scale = Math.min(1, maxSide / Math.max(img.width, img.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale)); canvas.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, canvas.width, canvas.height); return canvas; };
    const decodeImage = async (img) => {
        const base = imageToCanvas(img); let codes = await detectCodes(base); if (codes.length) return { codes, canvas: base };
        const attempts = [];
        const scaled = document.createElement('canvas'); scaled.width = base.width * 2; scaled.height = base.height * 2; scaled.getContext('2d', { willReadFrequently: true }).drawImage(base, 0, 0, scaled.width, scaled.height); attempts.push(scaled);
        for (const threshold of [false, true]) {
            const canvas = document.createElement('canvas'); canvas.width = base.width; canvas.height = base.height; const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(base, 0, 0); const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < data.data.length; i += 4) { const lum = .299 * data.data[i] + .587 * data.data[i + 1] + .114 * data.data[i + 2]; const value = threshold ? (lum > 145 ? 255 : 0) : Math.max(0, Math.min(255, (lum - 128) * 1.7 + 128)); data.data[i] = data.data[i + 1] = data.data[i + 2] = value; }
            ctx.putImageData(data, 0, 0); attempts.push(canvas);
        }
        for (const attempt of attempts) { codes = await detectCodes(attempt); if (codes.length) return { codes, canvas: attempt }; }
        return { codes: [], canvas: base };
    };
    const processScanFile = async (file) => {
        try { const img = await loadImage(file); const result = await decodeImage(img); if (!result.codes.length) return status('scanStatus', 'No QR or supported barcode was detected in this image.', 'error'); acceptScan(result.codes.map((code) => code.data).join('\n'), result.codes.map((code) => code.format).join(', ')); }
        catch (error) { status('scanStatus', error.message, 'error'); }
    };
    byId('scanFile').addEventListener('change', (event) => { if (event.target.files[0]) processScanFile(event.target.files[0]); });
    const drop = byId('scanDrop');
    ['dragenter', 'dragover'].forEach((type) => drop.addEventListener(type, (event) => { event.preventDefault(); drop.classList.add('drag-over'); }));
    ['dragleave', 'drop'].forEach((type) => drop.addEventListener(type, (event) => { event.preventDefault(); drop.classList.remove('drag-over'); }));
    drop.addEventListener('drop', (event) => { const file = event.dataTransfer.files[0]; if (file) processScanFile(file); });
    byId('scanCopy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(byId('scanResult').value); status('scanStatus', 'Decoded text copied.', 'success'); } catch { status('scanStatus', 'Clipboard access is unavailable.', 'error'); } });
    byId('scanOpen').addEventListener('click', () => { const text = byId('scanResult').value.trim(); if (!validHttpUrl(text)) return status('scanStatus', 'The decoded value is not an HTTP(S) URL.', 'error'); window.open(text, '_blank', 'noopener,noreferrer'); });
    byId('scanShare').addEventListener('click', async () => { const text = byId('scanResult').value; if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); status('scanStatus', 'Share is unavailable; result copied instead.', 'success'); } });
    byId('scanSave').addEventListener('click', () => { const text = byId('scanResult').value; if (!text) return; downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'qr-decoded.txt'); });
    byId('clearScanHistory').addEventListener('click', () => { localStorage.removeItem(scanHistoryKey); renderHistory(); });
    renderHistory();
    const stopCamera = () => { scanning = false; cancelAnimationFrame(scanFrame); scanStream?.getTracks().forEach((track) => track.stop()); scanStream = null; byId('qrVideo').srcObject = null; byId('cameraStop').disabled = true; byId('cameraTorch').disabled = true; byId('qrCameraEmpty').hidden = false; };
    byId('cameraStart').addEventListener('click', async () => {
        if (!navigator.mediaDevices?.getUserMedia) return status('scanStatus', 'Camera API is not available in this browser.', 'error');
        stopCamera();
        try {
            const selection = byId('cameraDevice').value;
            const video = selection.startsWith('device:') ? { deviceId: { exact: selection.slice(7) } } : { facingMode: { ideal: selection } };
            scanStream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
            byId('qrVideo').srcObject = scanStream; await byId('qrVideo').play(); byId('qrCameraEmpty').hidden = true; byId('cameraStop').disabled = false; scanning = true;
            const devices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === 'videoinput');
            if (devices.length) { const select = byId('cameraDevice'), chosen = select.value; select.replaceChildren(...devices.map((device, index) => { const option = document.createElement('option'); option.value = `device:${device.deviceId}`; option.textContent = device.label || `Camera ${index + 1}`; return option; })); if (chosen.startsWith('device:') && devices.some((device) => `device:${device.deviceId}` === chosen)) select.value = chosen; else select.value = `device:${devices[0].deviceId}`; }
            const track = scanStream.getVideoTracks()[0], capabilities = track.getCapabilities?.(); byId('cameraTorch').disabled = !capabilities?.torch;
            status('scanStatus', 'Camera is scanning. Point it at a QR or supported barcode.', 'success');
            const frame = async () => {
                if (!scanning) return;
                const videoElement = byId('qrVideo');
                if (videoElement.readyState >= 2 && !byId('qrCameraCanvas').dataset.busy) {
                    const canvas = byId('qrCameraCanvas'); canvas.width = videoElement.videoWidth; canvas.height = videoElement.videoHeight; canvas.getContext('2d', { willReadFrequently: true }).drawImage(videoElement, 0, 0);
                    canvas.dataset.busy = '1'; detectCodes(canvas).then((codes) => { if (codes.length) acceptScan(codes.map((code) => code.data).join('\n'), codes.map((code) => code.format).join(', ')); }).catch(() => {}).finally(() => { delete canvas.dataset.busy; });
                }
                scanFrame = requestAnimationFrame(frame);
            };
            frame();
        } catch { stopCamera(); status('scanStatus', 'Camera permission was denied or no camera is available.', 'error'); }
    });
    byId('cameraStop').addEventListener('click', stopCamera);
    byId('cameraTorch').addEventListener('click', async () => { const track = scanStream?.getVideoTracks()[0]; if (!track) return; const enabled = !track.getSettings().torch; try { await track.applyConstraints({ advanced: [{ torch: enabled }] }); byId('cameraTorch').setAttribute('aria-pressed', String(enabled)); } catch { status('scanStatus', 'Torch control is not available for this camera.', 'error'); } });
    window.addEventListener('pagehide', stopCamera);

    const uploadQualityImage = async (file) => { try { selectedQualityImage = await loadImage(file); const canvas = imageToCanvas(selectedQualityImage); const view = byId('repairCanvas'); view.width = Math.min(640, canvas.width); view.height = Math.round(view.width * canvas.height / canvas.width); view.getContext('2d').drawImage(canvas, 0, 0, view.width, view.height); status('qualityStatus', `${file.name} loaded locally.`); } catch (error) { status('qualityStatus', error.message, 'error'); } };
    byId('qualityFile').addEventListener('change', (event) => { if (event.target.files[0]) uploadQualityImage(event.target.files[0]); });
    const contrastInfo = (canvas) => { const { data } = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height); let min = 255, max = 0, dark = 0; for (let i = 0; i < data.length; i += 16) { const lum = .2126 * data[i] + .7152 * data[i + 1] + .0722 * data[i + 2]; min = Math.min(min, lum); max = Math.max(max, lum); if (lum < 128) dark += 1; } return { min, max, range: max - min, darkRatio: dark / Math.max(1, data.length / 16) }; };
    const reportRows = (items) => { const target = byId('qualityReport'); target.replaceChildren(); items.forEach(([label, result, kind = '']) => { const row = document.createElement('div'); row.className = `qr-report-row${kind ? ` ${kind}` : ''}`; const icon = document.createElement('i'); icon.className = `bi ${kind === 'error' ? 'bi-x-circle' : kind === 'warning' ? 'bi-exclamation-triangle' : 'bi-check-circle'}`; const text = document.createElement('span'); text.textContent = `${label}: ${result}`; row.append(icon, text); target.append(row); }); };
    const decodeQuality = async (image = selectedQualityImage) => { if (!image) throw new Error('Choose a QR image first.'); return decodeImage(image); };
    byId('qualityCheck').addEventListener('click', async () => {
        try {
            const { codes, canvas } = await decodeQuality(); const contrast = contrastInfo(canvas); const marginOk = contrast.darkRatio > .02 && contrast.darkRatio < .8; const code = codes[0];
            const items = [['Decodable', code ? `${codes.length} symbol(s) decoded` : 'No symbol could be decoded', code ? '' : 'error'], ['Image contrast', contrast.range >= 100 ? `Good pixel luminance range (${Math.round(contrast.range)}/255)` : 'Low luminance range; improve foreground/background contrast', contrast.range >= 100 ? '' : 'warning'], ['Quiet zone', marginOk ? 'Outer area present; verify at actual print size' : 'Image may be cropped or mostly blank', marginOk ? '' : 'warning'], ['Payload', code ? `${code.format}: ${code.data.slice(0, 100)}` : 'Not available', code ? '' : 'error']];
            if (code && /^https?:/i.test(code.data)) { let valid = false; try { valid = ['http:', 'https:'].includes(new URL(code.data).protocol); } catch { /* invalid destination */ } items.push(['URL', valid ? 'Valid HTTP(S) URL' : 'Invalid URL', valid ? '' : 'warning']); }
            if (code?.version) items.push(['Version', `QR version ${code.version}; error correction/quiet zone are not reliably inferable from raster alone`]);
            items.push(['Logo obstruction', 'Cannot be inferred reliably; scan with the intended phone models', 'warning']);
            reportRows(items); if (code) acceptScan(code.data, code.format); status('qualityStatus', code ? 'Image decoded. Treat this as a practical check, not certification.' : 'No QR decoded. Try image recovery.', code ? 'success' : 'error');
        } catch (error) { status('qualityStatus', error.message, 'error'); }
    });
    const transformImage = (image, { rotate = 0, blur = 0, contrast = 1, brightness = 1, upscale = 1, jpeg = false } = {}) => {
        const base = imageToCanvas(image, 1400), canvas = document.createElement('canvas'), swap = Math.abs(rotate) % 180 === 90;
        canvas.width = Math.round((swap ? base.height : base.width) * upscale); canvas.height = Math.round((swap ? base.width : base.height) * upscale);
        const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.translate(canvas.width / 2, canvas.height / 2); ctx.rotate(rotate * Math.PI / 180); ctx.filter = `blur(${blur}px) contrast(${contrast}) brightness(${brightness})`; ctx.drawImage(base, -base.width * upscale / 2, -base.height * upscale / 2, base.width * upscale, base.height * upscale); ctx.filter = 'none';
        if (jpeg) { const img = new Image(); img.src = canvas.toDataURL('image/jpeg', .35); }
        return canvas;
    };
    const stressCases = [['Original', {}], ['Blur', { blur: 1.3 }], ['Low brightness', { brightness: .55 }], ['Low contrast', { contrast: .55 }], ['Rotation 15°', { rotate: 15 }], ['Scaled 50%', { upscale: .5 }], ['JPEG compression', { jpeg: true }], ['Rotation 90°', { rotate: 90 }]];
    byId('qualityStress').addEventListener('click', async () => {
        if (!selectedQualityImage) return status('qualityStatus', 'Choose an image first.', 'error');
        const output = byId('stressResults'); output.replaceChildren(); const successes = [];
        for (const [name, config] of stressCases) {
            const canvas = transformImage(selectedQualityImage, config); const codes = await detectCodes(canvas); const passed = codes.length > 0; successes.push(passed);
            const row = document.createElement('div'); row.className = 'qr-stress-row'; const title = document.createElement('span'); title.textContent = name; const result = document.createElement('strong'); result.textContent = passed ? 'Decoded' : 'Not decoded'; result.style.color = passed ? '#16804a' : '#c0392b'; row.append(title, result); output.append(row);
        }
        const score = Math.round(successes.filter(Boolean).length / successes.length * 100); const label = score >= 85 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs improvement'; status('qualityStatus', `Scan robustness: ${label} (${score}% of these synthetic tests decoded). Results vary by camera and print.`, score >= 60 ? 'success' : 'error');
    });
    byId('qualityRepair').addEventListener('click', async () => {
        if (!selectedQualityImage) return status('qualityStatus', 'Choose an image first.', 'error');
        const base = imageToCanvas(selectedQualityImage), output = byId('repairCanvas'); output.width = base.width; output.height = base.height;
        const ctx = output.getContext('2d', { willReadFrequently: true }); ctx.filter = 'grayscale(1) contrast(1.8) brightness(1.08)'; ctx.drawImage(base, 0, 0); ctx.filter = 'none';
        const data = ctx.getImageData(0, 0, output.width, output.height); for (let i = 0; i < data.data.length; i += 4) { const level = data.data[i] > 145 ? 255 : 0; data.data[i] = data.data[i + 1] = data.data[i + 2] = level; } ctx.putImageData(data, 0, 0);
        const codes = await detectCodes(output); if (codes.length) { acceptScan(codes[0].data, codes[0].format); status('qualityStatus', 'Recovery preprocessing decoded the payload.', 'success'); } else status('qualityStatus', 'Preprocessing did not recover this code; missing pixels cannot be recreated.', 'error');
    });

    const parseCsv = (text) => {
        const rows = []; let row = [], cell = '', quoted = false;
        for (let i = 0; i < text.length; i += 1) { const ch = text[i]; if (ch === '"' && quoted && text[i + 1] === '"') { cell += '"'; i += 1; } else if (ch === '"') quoted = !quoted; else if (ch === ',' && !quoted) { row.push(cell); cell = ''; } else if ((ch === '\n' || ch === '\r') && !quoted) { if (ch === '\r' && text[i + 1] === '\n') i += 1; row.push(cell); if (row.some((item) => item.trim())) rows.push(row); row = []; cell = ''; } else cell += ch; }
        row.push(cell); if (row.some((item) => item.trim())) rows.push(row); return rows;
    };
    const batchRecords = () => {
        const source = byId('batchInput').value.trim(); if (!source) throw new Error('Add at least one text line or CSV row.');
        const rows = parseCsv(source); let records;
        if (rows.length > 1 && rows[0].some((cell) => /^(name|url|value|text|sku|id|product)$/i.test(cell.trim()))) {
            const headers = rows[0].map((cell) => cell.trim().toLowerCase()); records = rows.slice(1).map((row) => { const item = Object.fromEntries(headers.map((head, i) => [head, (row[i] || '').trim()])); const content = item.url || item.value || item.text || item.id || item.sku || item.product || item.name; return { name: item.name || item.sku || item.id || content, content }; }).filter((item) => item.content);
        } else records = source.split(/\r?\n/).map((line, index) => ({ name: `item-${index + 1}`, content: line.trim() })).filter((item) => item.content);
        if (!records.length) throw new Error('No usable content rows were found.'); if (records.length > 2000) throw new Error('Batch limit is 2,000 records per ZIP.'); return records;
    };
    const qrForBatch = (text, size = 220) => { const canvas = document.createElement('canvas'); renderMatrix(text, canvas, { ...getDesign(), size, frame: 'none', transparent: false }); return canvas; };
    let lastBatch = [];
    const previewBatch = (records) => { lastBatch = records; const target = byId('batchPreview'); target.replaceChildren(); records.slice(0, 12).forEach((record) => { const item = document.createElement('div'); item.className = 'qr-batch-item'; const canvas = qrForBatch(record.content, 160); const label = document.createElement('span'); label.textContent = record.name.slice(0, 60); item.append(canvas, label); target.append(item); }); byId('batchSummary').textContent = `${records.length} QR record(s). ${records.length > 12 ? 'Showing first 12.' : ''}`; };
    byId('batchInput').addEventListener('input', () => { try { previewBatch(batchRecords()); status('batchStatus', 'Records parsed.', 'success'); } catch (error) { byId('batchPreview').innerHTML = '<p class="qr-muted">A preview of the first records will appear here.</p>'; status('batchStatus', error.message, 'error'); } });
    byId('batchGenerate').addEventListener('click', async () => {
        try {
            const records = batchRecords(); previewBatch(records); if (!window.JSZip) throw new Error('ZIP library unavailable. Reload with an internet connection.');
            const zip = new JSZip(), folder = zip.folder('qr-codes'), format = byId('batchFormat').value, pattern = byId('batchFilename').value || 'qr-{index}-{name}';
            for (let index = 0; index < records.length; index += 1) {
                const record = records[index], name = pattern.replaceAll('{index}', String(index + 1).padStart(3, '0')).replaceAll('{name}', record.name.replace(/[^a-z0-9_-]+/gi, '-').slice(0, 50));
                if (format === 'svg') folder.file(`${name}.svg`, makeSvg(record.content, { ...getDesign(), frame: 'none', size: 512 }));
                else { const canvas = qrForBatch(record.content, 512); const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png')); folder.file(`${name}.png`, blob); }
            }
            folder.file('records.csv', `name,content\r\n${records.map((record) => `"${record.name.replace(/"/g, '""')}","${record.content.replace(/"/g, '""')}"`).join('\r\n')}`);
            downloadBlob(await zip.generateAsync({ type: 'blob' }), 'qr-batch.zip'); status('batchStatus', `${records.length} QR codes exported in a ZIP.`, 'success');
        } catch (error) { status('batchStatus', error.message, 'error'); }
    });
    const makeContactSheet = (records) => {
        const layout = byId('labelPreset').value, columns = layout === 'sticker' ? 3 : layout === 'ticket' ? 2 : 5, cell = layout === 'sticker' ? 320 : layout === 'ticket' ? 460 : 190, qrSize = layout === 'sticker' ? 235 : layout === 'ticket' ? 270 : 145, cap = records.slice(0, 100), rows = Math.ceil(cap.length / columns), canvas = document.createElement('canvas');
        canvas.width = columns * cell; canvas.height = rows * cell; const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        cap.forEach((record, index) => { const qr = qrForBatch(record.content, qrSize), x = (index % columns) * cell + (cell - qrSize) / 2, y = Math.floor(index / columns) * cell + 10; ctx.drawImage(qr, x, y, qrSize, qrSize); ctx.fillStyle = '#172e2a'; ctx.font = layout === 'ticket' ? 'bold 20px sans-serif' : '16px sans-serif'; ctx.textAlign = 'center'; const label = layout === 'ticket' ? `ADMIT ONE · ${record.name}` : record.name; ctx.fillText(label.slice(0, 36), (index % columns + .5) * cell, Math.floor(index / columns) * cell + qrSize + 34, cell - 20); if (layout !== 'plain') { ctx.strokeStyle = '#b8c9c4'; ctx.strokeRect((index % columns) * cell + 4, Math.floor(index / columns) * cell + 4, cell - 8, cell - 8); } });
        return { canvas, records: cap, truncated: records.length > cap.length };
    };
    byId('batchContactSheet').addEventListener('click', async () => {
        try {
            const records = lastBatch.length ? lastBatch : batchRecords(), sheet = makeContactSheet(records);
            sheet.canvas.toBlob((blob) => downloadBlob(blob, 'qr-contact-sheet.png')); status('batchStatus', `${sheet.records.length} codes placed on the ${byId('labelPreset').value} contact sheet${sheet.truncated ? '; first 100 shown' : ''}.`, 'success');
        } catch (error) { status('batchStatus', error.message, 'error'); }
    });
    const printButton = document.createElement('button'); printButton.className = 'secondary-action'; printButton.id = 'batchPrintSheet'; printButton.textContent = 'Print / save PDF'; byId('batchContactSheet').after(printButton);
    printButton.addEventListener('click', () => {
        try {
            const records = lastBatch.length ? lastBatch : batchRecords(), sheet = makeContactSheet(records), popup = window.open('', '_blank'); if (!popup) throw new Error('Allow pop-ups to print the label sheet.');
            const image = sheet.canvas.toDataURL('image/png'); popup.document.write(`<!doctype html><html><head><title>QR labels</title><style>@page{size:A4;margin:10mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;margin:0}.sheet{width:100%;height:auto;display:block}h1{font-size:16px;margin:0 0 10px}</style></head><body><h1>${escapeHtml(byId('labelPreset').value)} QR sheet · ${sheet.records.length} items</h1><img class="sheet" src="${image}" onload="window.print()"></body></html>`); popup.document.close(); status('batchStatus', 'Print dialog opened. Choose Save as PDF for a PDF sheet.', 'success');
        } catch (error) { status('batchStatus', error.message, 'error'); }
    });

    const dynamicKey = (slug) => `qrDynamic:${slug}`;
    const storeDynamic = (slug, token) => { localStorage.setItem(dynamicKey(slug), token); localStorage.setItem('qrDynamicLast', slug); dynamicSlug = slug; dynamicToken = token; };
    const loadDynamicToken = () => { dynamicSlug = byId('dynamicSlug').value.trim(); dynamicToken = dynamicSlug ? localStorage.getItem(dynamicKey(dynamicSlug)) || '' : ''; return Boolean(dynamicSlug && dynamicToken); };
    const dynamicRequest = async (method, slug = '', data = {}) => {
        const response = await fetch(slug ? `/api/qr/dynamic/${encodeURIComponent(slug)}` : '/api/qr/dynamic', { method, headers: { 'Content-Type': 'application/json', ...(dynamicToken ? { 'X-Manage-Token': dynamicToken } : {}) }, body: method === 'GET' ? undefined : JSON.stringify(data) });
        const payload = await response.json().catch(() => ({})); if (!response.ok || !payload.success) throw new Error(payload.message || `Request failed (${response.status}).`); return payload.data;
    };
    const renderDynamic = (data) => { const target = byId('dynamicResult'); target.replaceChildren(); const link = document.createElement('a'); link.href = data.short_url; link.target = '_blank'; link.rel = 'noopener'; link.textContent = data.short_url; target.append(link); dynamicActive = data.active; byId('dynamicSlug').value = data.slug; if (data.destination) byId('dynamicUrl').value = data.destination; byId('dynamicCampaign').value = data.campaign || ''; byId('dynamicExpiry').value = data.expires_at ? new Date(data.expires_at).toISOString().slice(0, 16) : ''; byId('dynamicPause').textContent = data.active ? 'Pause link' : 'Resume link'; generate(data.short_url); };
    const drawStats = (data) => {
        byId('scanTotal').textContent = data.total_scans.toLocaleString(); byId('scanToday').textContent = data.today_scans.toLocaleString(); byId('scanWeek').textContent = data.week_scans.toLocaleString();
        const chart = byId('scanTrend'); chart.replaceChildren(); const max = Math.max(1, ...data.daily.map((day) => day.scans));
        data.daily.forEach((day) => { const row = document.createElement('div'); row.className = 'qr-trend-row'; const label = document.createElement('span'); label.textContent = day.date.slice(5); const barWrap = document.createElement('div'); barWrap.className = 'qr-trend-track'; const bar = document.createElement('div'); bar.className = 'qr-trend-bar'; bar.style.width = `${Math.max(2, day.scans / max * 100)}%`; barWrap.append(bar); const count = document.createElement('strong'); count.textContent = day.scans; row.append(label, barWrap, count); chart.append(row); });
        const devices = document.createElement('p'); devices.className = 'qr-small-note'; devices.textContent = `Device totals: ${(data.devices || []).map((device) => `${device.device} ${device.scans}`).join(' · ') || 'No scans yet'}`; chart.append(devices);
    };
    byId('dynamicCreate').addEventListener('click', async () => {
        try {
            if (!validHttpUrl(byId('dynamicUrl').value.trim())) throw new Error('Enter a valid HTTP(S) destination URL.');
            const data = await dynamicRequest('POST', '', { destination: byId('dynamicUrl').value.trim(), campaign: byId('dynamicCampaign').value.trim(), expires_at: byId('dynamicExpiry').value ? new Date(byId('dynamicExpiry').value).toISOString() : '', slug: byId('dynamicSlug').value.trim() });
            storeDynamic(data.slug, data.manage_token); renderDynamic(data); ensureDynamicBackup(); status('dynamicStatus', 'Dynamic QR created. Download a backup of the management key before moving to another browser.', 'success');
        } catch (error) { status('dynamicStatus', error.message, 'error'); }
    });
    const ensureDynamicBackup = () => {
        let button = byId('dynamicBackup'); if (!button) { button = document.createElement('button'); button.className = 'secondary-action'; button.id = 'dynamicBackup'; button.textContent = 'Download management key'; byId('dynamicResult').append(button); }
        button.onclick = () => downloadBlob(new Blob([JSON.stringify({ slug: dynamicSlug, manage_token: dynamicToken }, null, 2)], { type: 'application/json' }), `qr-${dynamicSlug}-management-key.json`);
    };
    byId('dynamicLoad').addEventListener('click', async () => { try { if (!loadDynamicToken()) throw new Error('Enter a slug created in this browser; its management key is required.'); const data = await dynamicRequest('GET', dynamicSlug); renderDynamic(data); ensureDynamicBackup(); status('dynamicStatus', 'Link loaded. Edit destination/campaign/expiry then save.', 'success'); } catch (error) { status('dynamicStatus', error.message, 'error'); } });
    byId('dynamicSave').addEventListener('click', async () => { try { if (!loadDynamicToken()) throw new Error('Enter a slug and load your link first.'); const data = await dynamicRequest('PUT', dynamicSlug, { destination: byId('dynamicUrl').value.trim(), campaign: byId('dynamicCampaign').value.trim(), expires_at: byId('dynamicExpiry').value ? new Date(byId('dynamicExpiry').value).toISOString() : '' }); renderDynamic(data); status('dynamicStatus', 'Destination and campaign updated.', 'success'); } catch (error) { status('dynamicStatus', error.message, 'error'); } });
    byId('dynamicPause').addEventListener('click', async () => { try { if (!loadDynamicToken()) throw new Error('Enter a slug and load your link first.'); const data = await dynamicRequest('PUT', dynamicSlug, { active: !dynamicActive }); renderDynamic(data); status('dynamicStatus', data.active ? 'Link resumed.' : 'Link paused.', 'success'); } catch (error) { status('dynamicStatus', error.message, 'error'); } });
    byId('dynamicAnalytics').addEventListener('click', async () => { try { if (!loadDynamicToken()) throw new Error('Enter a slug and management key first.'); const data = await dynamicRequest('GET', dynamicSlug); drawStats(data); renderDynamic(data); status('dynamicStatus', 'Aggregate analytics updated.', 'success'); } catch (error) { status('dynamicStatus', error.message, 'error'); } });
    if (byId('smartLinkDynamic')) byId('smartLinkDynamic').addEventListener('click', async () => {
        try {
            const destination = buildPayload();
            const campaign = value('utm_campaign');
            const data = await dynamicRequest('POST', '', { destination, campaign, slug: byId('smartLinkSlug').value.trim() });
            storeDynamic(data.slug, data.manage_token);
            generate(data.short_url);
            const result = byId('smartLinkResult'); result.replaceChildren();
            const shortLink = document.createElement('a'); shortLink.href = data.short_url; shortLink.textContent = data.short_url; shortLink.target = '_blank'; shortLink.rel = 'noopener noreferrer'; result.append(shortLink);
            const backup = document.createElement('button'); backup.className = 'secondary-action'; backup.textContent = 'Download management key'; backup.addEventListener('click', () => downloadBlob(new Blob([JSON.stringify({ slug: data.slug, manage_token: data.manage_token }, null, 2)], { type: 'application/json' }), `qr-${data.slug}-management-key.json`)); result.append(backup);
            status('smartLinkStatus', 'Dynamic link ready. The QR now points to your editable short URL.', 'success');
        } catch (error) { status('smartLinkStatus', error.message, 'error'); }
    });

    document.querySelectorAll('.qr-use-tool').forEach((button) => button.addEventListener('click', () => {
        typeSelect.value = button.dataset.type; renderFields(); showPanel('createPanel');
        if (button.dataset.type === 'gs1') { ['gtin', 'domain', 'lot', 'serial', 'expiry'].forEach((key) => { const source = byId(key === 'gtin' ? 'gs1Gtin' : key === 'domain' ? 'gs1Domain' : key === 'lot' ? 'gs1Lot' : key === 'serial' ? 'gs1Serial' : 'gs1Expiry').value; if (field(key)) field(key).value = source; }); }
        else if (button.dataset.type === 'upi') { /* Enter payment fields in the form before generating. */ }
    }));

    const barcodeGenerate = () => {
        const text = byId('barcodeValue').value.trim(); if (!text) return status('barcodeStatus', 'Enter barcode content.', 'error');
        try { if (!window.JsBarcode) throw new Error('Barcode library did not load.'); JsBarcode(byId('barcodeSvg'), text, { format: byId('barcodeType').value, displayValue: true, lineColor: '#172e2a', width: 2, height: 90, margin: 12, background: '#ffffff' }); status('barcodeStatus', 'Barcode generated.', 'success'); }
        catch (error) { status('barcodeStatus', error.message || 'Value is not valid for this barcode format.', 'error'); }
    };
    byId('barcodeGenerate').addEventListener('click', barcodeGenerate);
    byId('barcodeDownload').addEventListener('click', () => { if (!byId('barcodeSvg').innerHTML) return status('barcodeStatus', 'Generate a barcode first.', 'error'); downloadBlob(new Blob([new XMLSerializer().serializeToString(byId('barcodeSvg'))], { type: 'image/svg+xml' }), 'barcode.svg'); });
    document.querySelectorAll('.qr-use-tool[data-type="gs1"]').forEach((button) => button.addEventListener('click', () => { typeSelect.value = 'gs1'; renderFields(); ['gtin', 'domain', 'lot', 'serial', 'expiry'].forEach((key) => { const sourceId = { gtin: 'gs1Gtin', domain: 'gs1Domain', lot: 'gs1Lot', serial: 'gs1Serial', expiry: 'gs1Expiry' }[key]; if (field(key)) field(key).value = byId(sourceId).value; }); showPanel('createPanel'); }));

    const bytesToBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
    const base64ToBytes = (text) => Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
    const deriveKey = async (password, salt) => { const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']); return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); };
    byId('encryptSecret').addEventListener('click', async () => {
        try { const text = byId('secretText').value, password = byId('secretPassword').value; if (!text || password.length < 8) throw new Error('Enter a message and a password of at least 8 characters.'); const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), key = await deriveKey(password, salt), cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text))), payload = `TFQR1:${bytesToBase64(new Uint8Array([...salt, ...iv, ...cipher]))}`; byId('encryptedPayload').value = payload; typeSelect.value = 'text'; renderFields(); field('text').value = payload; showPanel('createPanel'); generate(); status('secretStatus', 'Encrypted locally with AES-GCM. The password is not included in the QR.', 'success'); }
        catch (error) { status('secretStatus', error.message || 'Web Crypto is not available in this secure context.', 'error'); }
    });
    byId('decryptSecret').addEventListener('click', async () => {
        try { const payload = byId('encryptedPayload').value.trim(), password = byId('decryptPassword').value; if (!payload.startsWith('TFQR1:') || !password) throw new Error('Paste a TFQR1 payload and enter its password.'); const data = base64ToBytes(payload.slice(6)); if (data.length < 29) throw new Error('Encrypted payload is incomplete.'); const key = await deriveKey(password, data.slice(0, 16)); const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: data.slice(16, 28) }, key, data.slice(28)); byId('secretText').value = new TextDecoder().decode(clear); status('secretStatus', 'Message decrypted in this browser.', 'success'); }
        catch { status('secretStatus', 'Could not decrypt. Check the password and payload.', 'error'); }
    });

    document.querySelectorAll('.qr-workbench .workbench-tab').forEach((tab) => tab.addEventListener('keydown', (event) => { if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); const index = tabs.indexOf(tab), next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; next.focus(); showPanel(next.dataset.panel); }));
});
