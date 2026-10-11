document.addEventListener('DOMContentLoaded', () => {
    const tabs = [...document.querySelectorAll('.workbench-tab')];
    const panels = [...document.querySelectorAll('.workbench-panel')];
    const workbenchTitle = document.getElementById('workbenchTitle');
    const downloaderDetail = document.querySelector('.downloader-tool-detail');
    const panelTitles = {
        directPanel: 'Direct file',
        mediaPanel: 'Public media',
        apkPanel: 'APK / AAB',
        epubPanel: 'EPUB',
        metadataPanel: 'Metadata export'
    };
    const status = (id, message, type = '') => {
        const element = document.getElementById(id);
        element.textContent = message;
        element.className = `tool-status${type ? ` ${type}` : ''}`;
    };
    const showPanel = (panelId, title = panelTitles[panelId]) => {
        workbenchTitle.textContent = title;
        tabs.forEach((tab) => {
            const active = tab.dataset.panel === panelId;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-selected', String(active));
        });
        panels.forEach((panel) => {
            const active = panel.id === panelId;
            panel.hidden = !active;
            panel.classList.toggle('active', active);
        });
    };
    tabs.forEach((tab) => tab.addEventListener('click', () => showPanel(tab.dataset.panel)));
    if (downloaderDetail) showPanel(downloaderDetail.dataset.toolPanel, downloaderDetail.dataset.toolTitle);

    const saveResponse = async (response, statusId, fallbackName) => {
        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.message || `Request failed (${response.status}).`);
        }
        const blob = await response.blob();
        const disposition = response.headers.get('content-disposition') || '';
        const name = disposition.match(/filename="?([^";]+)"?/i)?.[1] || fallbackName;
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = name;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        status(statusId, `Ready: ${name}`, 'success');
    };
    const setBusy = (form, busy) => form.querySelectorAll('button').forEach((button) => { button.disabled = busy; });

    const directForm = document.getElementById('directForm');
    directForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setBusy(directForm, true);
        status('directStatus', 'Checking source and downloading file…');
        try {
            const response = await fetch('/api/downloader/direct', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: document.getElementById('directUrl').value.trim() })
            });
            await saveResponse(response, 'directStatus', 'download');
        } catch (error) { status('directStatus', error.message, 'error'); }
        finally { setBusy(directForm, false); }
    });

    const mediaType = document.getElementById('mediaType');
    const syncMediaOptions = () => {
        const audio = mediaType.value === 'audio';
        document.getElementById('audioFormatGroup').hidden = !audio;
        document.getElementById('videoQualityGroup').hidden = audio;
    };
    mediaType.addEventListener('change', syncMediaOptions);
    syncMediaOptions();
    if (downloaderDetail?.dataset.toolMode === 'media') {
        mediaType.value = downloaderDetail.dataset.mediaType || 'video';
        document.getElementById('audioFormat').value = downloaderDetail.dataset.audioFormat || 'mp3';
        syncMediaOptions();
    }
    const mediaForm = document.getElementById('mediaForm');
    mediaForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setBusy(mediaForm, true);
        status('mediaStatus', 'Preparing media download. Large files can take a while…');
        try {
            const response = await fetch('/api/downloader/public-media', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: document.getElementById('mediaUrl').value.trim(),
                    type: mediaType.value,
                    quality: document.getElementById('mediaQuality').value,
                    audio_format: document.getElementById('audioFormat').value,
                    authorized: document.getElementById('mediaAuthorized').checked
                })
            });
            await saveResponse(response, 'mediaStatus', 'media-file');
        } catch (error) { status('mediaStatus', error.message, 'error'); }
        finally { setBusy(mediaForm, false); }
    });

    const renderResult = (target, values) => {
        target.replaceChildren();
        const grid = document.createElement('div');
        grid.className = 'result-grid';
        Object.entries(values).forEach(([label, value]) => {
            const item = document.createElement('div');
            item.className = 'result-item';
            const caption = document.createElement('span');
            caption.textContent = label;
            const detail = document.createElement('strong');
            detail.textContent = Array.isArray(value) ? (value.join(', ') || 'Not detected') : String(value || 'Not available');
            item.append(caption, detail);
            grid.append(item);
        });
        target.append(grid);
        target.hidden = false;
    };
    const apkForm = document.getElementById('apkForm');
    apkForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setBusy(apkForm, true);
        status('apkStatus', 'Inspecting archive and calculating SHA-256…');
        try {
            const formData = new FormData();
            formData.append('file', document.getElementById('apkFile').files[0]);
            const response = await fetch('/api/downloader/apk-inspect', { method: 'POST', body: formData });
            const payload = await response.json();
            if (!response.ok || !payload.success) throw new Error(payload.message || 'APK inspection failed.');
            renderResult(document.getElementById('apkResult'), {
                File: payload.data.filename, Type: payload.data.kind, Size: `${(payload.data.size / 1048576).toFixed(2)} MB`,
                Package: payload.data.package, 'Version name': payload.data.version_name, 'Version code': payload.data.version_code,
                'Signature files': payload.data.signed_files, 'SHA-256': payload.data.sha256,
                'Manifest note': payload.data.manifest_readable ? 'Readable XML manifest' : 'Binary manifest; package fields need Android build tools'
            });
            status('apkStatus', 'Archive inspected. Signature presence is not a cryptographic verification.', 'success');
        } catch (error) { status('apkStatus', error.message, 'error'); }
        finally { setBusy(apkForm, false); }
    });

    const epubForm = document.getElementById('epubForm');
    epubForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const action = event.submitter?.dataset.epubAction || 'inspect';
        setBusy(epubForm, true);
        status('epubStatus', action === 'text' ? 'Extracting chapter text…' : 'Reading EPUB package metadata…');
        try {
            const formData = new FormData();
            formData.append('file', document.getElementById('epubFile').files[0]);
            formData.append('action', action);
            const response = await fetch('/api/downloader/epub', { method: 'POST', body: formData });
            if (action === 'text') {
                await saveResponse(response, 'epubStatus', 'ebook.txt');
            } else {
                const payload = await response.json();
                if (!response.ok || !payload.success) throw new Error(payload.message || 'EPUB inspection failed.');
                renderResult(document.getElementById('epubResult'), payload.data);
                status('epubStatus', 'EPUB metadata loaded.', 'success');
            }
        } catch (error) { status('epubStatus', error.message, 'error'); }
        finally { setBusy(epubForm, false); }
    });

    const parseCsv = (text) => {
        const rows = [];
        let row = [], cell = '', quoted = false;
        for (let index = 0; index < text.length; index += 1) {
            const char = text[index];
            if (char === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
            else if (char === '"') quoted = !quoted;
            else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
            else if ((char === '\n' || char === '\r') && !quoted) {
                if (char === '\r' && text[index + 1] === '\n') index += 1;
                row.push(cell); if (row.some((value) => value.trim())) rows.push(row); row = []; cell = '';
            } else cell += char;
        }
        row.push(cell); if (row.some((value) => value.trim())) rows.push(row);
        const [headers, ...records] = rows;
        return records.map((values) => Object.fromEntries(headers.map((header, index) => [header.trim(), (values[index] || '').trim()])));
    };
    const metadataForm = document.getElementById('metadataForm');
    metadataForm.addEventListener('submit', (event) => {
        event.preventDefault();
        try {
            const source = document.getElementById('metadataInput').value.trim();
            if (!source) throw new Error('Paste at least one metadata record.');
            const records = source.startsWith('[') ? JSON.parse(source) : parseCsv(source);
            if (!Array.isArray(records) || !records.length || records.some((record) => !record || typeof record !== 'object')) throw new Error('Use a JSON array or CSV with a header row.');
            const format = document.getElementById('metadataFormat').value;
            let data = '', mime = 'text/plain;charset=utf-8', extension = format;
            if (format === 'json') { data = JSON.stringify(records, null, 2); mime = 'application/json;charset=utf-8'; }
            else if (format === 'csv') {
                const headers = [...new Set(records.flatMap((record) => Object.keys(record)))];
                const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
                data = [headers, ...records.map((record) => headers.map((header) => record[header] ?? ''))].map((row) => row.map(quote).join(',')).join('\r\n');
            } else data = records.map((record) => Object.entries(record).map(([key, value]) => `${key}: ${value}`).join('\n')).join('\n\n');
            const link = document.createElement('a');
            const objectUrl = URL.createObjectURL(new Blob([data], { type: mime }));
            link.href = objectUrl; link.download = `track-metadata.${extension}`; link.click();
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
            status('metadataStatus', `Exported ${records.length} record(s) as ${format.toUpperCase()}.`, 'success');
        } catch (error) { status('metadataStatus', error.message || 'Metadata export failed.', 'error'); }
    });

    const catalog = document.getElementById('toolCatalog');
    if (catalog) {
        const search = document.getElementById('toolSearch');
        const filterButtons = [...document.querySelectorAll('.filter-chip')];
        let currentFilter = 'all';
        [...catalog.querySelectorAll('button.catalog-tool')].forEach((tool, index) => {
            const title = tool.dataset.title || tool.querySelector('strong')?.textContent || '';
            const slug = title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const link = document.createElement('a');
            link.className = tool.className;
            link.href = `/downloader-tools/${slug}`;
            link.style.setProperty('--tool-index', index);
            link.innerHTML = tool.innerHTML;
            ['data-category', 'data-mode', 'data-title'].forEach((name) => link.setAttribute(name, tool.getAttribute(name)));
            tool.replaceWith(link);
        });
        const filterCatalog = () => {
            const query = search.value.trim().toLowerCase();
            let visible = 0;
            catalog.querySelectorAll('.catalog-tool').forEach((tool) => {
                const show = (currentFilter === 'all' || tool.dataset.category === currentFilter)
                    && (!query || tool.textContent.toLowerCase().includes(query));
                tool.hidden = !show;
                if (show) visible += 1;
            });
            document.getElementById('catalogEmpty').hidden = visible > 0;
        };
        search.addEventListener('input', filterCatalog);
        filterButtons.forEach((button) => button.addEventListener('click', () => {
            currentFilter = button.dataset.filter;
            filterButtons.forEach((item) => item.classList.toggle('active', item === button));
            filterCatalog();
        }));
    }
});