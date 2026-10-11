document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. DOM ELEMENT SELECTIONS
    // ==========================================
    const urlInput = document.getElementById('ytUrlInput');
    const fetchBtn = document.getElementById('ytFetchBtn');
    const downloadBtn = document.getElementById('ytDownloadBtn');
    const exportBtn = document.getElementById('ytExportBtn');
    const copyBtn = document.getElementById('ytCopyBtn');
    const clearBtn = document.getElementById('ytClearBtn');
    const formatSelect = document.getElementById('ytFormatSelect');
    const qualitySelect = document.getElementById('ytQualitySelect');
    const authorizedCheck = document.getElementById('ytAuthorizedCheck');
    const statusMessage = document.getElementById('ytStatusMessage');
    const loadingState = document.getElementById('ytLoadingState');
    const emptyState = document.getElementById('ytEmptyState');
    const thumbnail = document.getElementById('ytThumbnail');
    const player = document.getElementById('ytPlayer');
    const titleEl = document.getElementById('ytTitle');
    const channelEl = document.getElementById('ytChannel');
    const durationEl = document.getElementById('ytDuration');
    const viewsEl = document.getElementById('ytViews');
    const descriptionEl = document.getElementById('ytDescription');
    const hashtagsEl = document.getElementById('ytHashtags');
    const historyList = document.getElementById('ytHistoryList');

    let currentMeta = null;

    // ==========================================
    // 2. HELPER FUNCTIONS & UI MANAGERS
    // ==========================================
    const showStatus = (message, type = '') => {
        if (!statusMessage) return;
        statusMessage.textContent = message;
        statusMessage.className = `yt-status-message${type ? ` ${type}` : ''}`;
    };

    const setLoading = (isLoading) => {
        if (loadingState) loadingState.hidden = !isLoading;
        if (fetchBtn) fetchBtn.disabled = isLoading;
        if (downloadBtn) downloadBtn.disabled = !currentMeta || isLoading;
        if (exportBtn) exportBtn.disabled = !currentMeta || isLoading;
    };

    const resetPreview = () => {
        if (emptyState) emptyState.classList.add('active');
        if (thumbnail) {
            thumbnail.hidden = true;
            thumbnail.removeAttribute('src');
        }
        if (player) {
            player.hidden = true;
            player.removeAttribute('src');
        }
    };

    const renderMeta = (meta) => {
        if (!meta) return;
        currentMeta = meta;

        if (titleEl) titleEl.textContent = meta.title || 'Untitled video';
        if (channelEl) channelEl.textContent = meta.channel || 'Unknown channel';
        if (durationEl) durationEl.textContent = meta.duration || 'Unknown';
        if (viewsEl) viewsEl.textContent = meta.views ? meta.views.toLocaleString() : '0';
        if (descriptionEl) descriptionEl.textContent = meta.description || 'No description available.';
        if (hashtagsEl) hashtagsEl.textContent = meta.hashtags?.length ? meta.hashtags.join(' ') : 'No hashtags found yet.';

        if (emptyState) emptyState.classList.remove('active');

        if (thumbnail) {
            if (meta.thumbnail) {
                thumbnail.src = meta.thumbnail;
                thumbnail.hidden = false;
            } else {
                thumbnail.hidden = true;
            }
        }

        if (player) {
            if (meta.embed_url) {
                player.src = `${meta.embed_url}?rel=0`;
                player.hidden = false;
            } else {
                player.hidden = true;
            }
        }

        if (downloadBtn) downloadBtn.disabled = false;
        if (exportBtn) exportBtn.disabled = false;
    };

    const addHistoryItem = (meta) => {
        if (!historyList) return;
        const existing = historyList.querySelector('.yt-history-empty');
        if (existing) existing.remove();

        const entry = document.createElement('li');
        entry.textContent = `${meta.title || 'YouTube video'} • ${meta.channel || 'Unknown channel'}`;
        historyList.prepend(entry);

        while (historyList.children.length > 5) {
            historyList.removeChild(historyList.lastChild);
        }
    };

    // ==========================================
    // 3. API FETCH METADATA (ERROR-SAFE)
    // ==========================================
    const fetchMetadata = async () => {
        const url = urlInput?.value?.trim();
        if (!url) {
            showStatus('Please enter a YouTube URL first.', 'error');
            return;
        }

        setLoading(true);
        showStatus('Fetching video details…');
        resetPreview();

        try {
            const response = await fetch('/api/youtube-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            // Safe content-type check to prevent HTML 404/500 JSON parse errors
            const contentType = response.headers.get('content-type') || '';
            let payload = {};

            if (contentType.includes('application/json')) {
                payload = await response.json();
            } else {
                if (response.status === 404) {
                    throw new Error('API Route "/api/youtube-info" not found on server (404). Check app.py.');
                }
                throw new Error(`Server returned status ${response.status}. Please try again later.`);
            }

            if (!response.ok || !payload.success) {
                throw new Error(payload.message || 'Unable to fetch video details.');
            }

            renderMeta(payload.data);
            addHistoryItem(payload.data);
            showStatus('Video details loaded successfully.', 'success');
        } catch (error) {
            currentMeta = null;
            if (downloadBtn) downloadBtn.disabled = true;
            if (exportBtn) exportBtn.disabled = true;
            showStatus(error.message || 'Unable to fetch this video right now.', 'error');
            console.error('Fetch metadata error:', error);
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // 4. DOWNLOAD HANDLER (SAFE BLOB & HEADERS)
    // ==========================================
    const handleDownload = async () => {
        if (!currentMeta || !urlInput) return;

        const selectedFormat = formatSelect?.value || 'video'; // 'video' (MP4) or 'audio' (MP3)
        const selectedQuality = qualitySelect?.value || '720p';
        const authorized = selectedFormat === 'thumbnail' || Boolean(authorizedCheck?.checked);
        if (!authorized) {
            showStatus('Confirm that you own this video or have permission to download it.', 'error');
            return;
        }

        setLoading(true);
        showStatus(`Preparing your ${selectedFormat === 'audio' ? 'MP3 Audio' : 'MP4 Video'} download...`);

        try {
            const response = await fetch('/api/youtube-download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: currentMeta.source_url || urlInput.value.trim(),
                    type: selectedFormat,
                    quality: selectedQuality,
                    authorized,
                    thumbnail_url: currentMeta.thumbnail || ''
                })
            });

            if (!response.ok) {
                const contentType = response.headers.get('content-type') || '';
                let errorMsg = 'Download failed on server.';
                if (contentType.includes('application/json')) {
                    const errData = await response.json().catch(() => ({}));
                    errorMsg = errData.message || errorMsg;
                } else if (response.status === 404) {
                    errorMsg = 'Download API endpoint "/api/youtube-download" not found (404).';
                }
                throw new Error(errorMsg);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            const disposition = response.headers.get('content-disposition');
            let filename = selectedFormat === 'audio' ? 'audio.mp3' : 'video.mp4';
            if (disposition && disposition.includes('filename=')) {
                const match = disposition.match(/filename="?([^";]+)"?/);
                if (match && match[1]) {
                    filename = match[1];
                }
            }

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            showStatus(`${selectedFormat === 'audio' ? 'MP3 Audio' : 'MP4 Video'} downloaded successfully!`, 'success');
        } catch (error) {
            showStatus(error.message || 'Download failed.', 'error');
            console.error('Download error:', error);
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // 5. EXPORT NOTES HANDLER
    // ==========================================
    const handleExport = async () => {
        if (!currentMeta || !urlInput) return;
        setLoading(true);
        showStatus('Exporting description and hashtags…');

        try {
            const response = await fetch('/api/youtube-export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: currentMeta.source_url || urlInput.value.trim() })
            });

            if (!response.ok) {
                const contentType = response.headers.get('content-type') || '';
                let errorMsg = 'Export failed.';
                if (contentType.includes('application/json')) {
                    const errData = await response.json().catch(() => ({}));
                    errorMsg = errData.message || errorMsg;
                }
                throw new Error(errorMsg);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = 'youtube-notes.txt';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            showStatus('Notes exported successfully.', 'success');
        } catch (error) {
            showStatus(error.message || 'Export failed.', 'error');
            console.error('Export error:', error);
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // 6. UTILITY FUNCTIONS
    // ==========================================
    const copyUrl = async () => {
        const value = urlInput?.value?.trim();
        if (!value) {
            showStatus('Paste a URL before copying it.', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(value);
            showStatus('URL copied to clipboard.', 'success');
        } catch (error) {
            showStatus('Clipboard access is not available in this browser.', 'error');
        }
    };

    const clearInputs = () => {
        if (urlInput) urlInput.value = '';
        currentMeta = null;
        resetPreview();
        if (titleEl) titleEl.textContent = '-';
        if (channelEl) channelEl.textContent = '-';
        if (durationEl) durationEl.textContent = '-';
        if (viewsEl) viewsEl.textContent = '-';
        if (descriptionEl) descriptionEl.textContent = 'No description available yet.';
        if (hashtagsEl) hashtagsEl.textContent = 'No hashtags found yet.';
        if (downloadBtn) downloadBtn.disabled = true;
        if (exportBtn) exportBtn.disabled = true;
        showStatus('Cleared. Paste a new YouTube URL to begin.', '');
    };

    // ==========================================
    // 7. EVENT LISTENERS
    // ==========================================
    fetchBtn?.addEventListener('click', fetchMetadata);
    downloadBtn?.addEventListener('click', handleDownload);
    exportBtn?.addEventListener('click', handleExport);
    copyBtn?.addEventListener('click', copyUrl);
    clearBtn?.addEventListener('click', clearInputs);

    urlInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            fetchMetadata();
        }
    });

    if (urlInput) {
        urlInput.addEventListener('input', () => {
            if (!urlInput.value.trim()) {
                showStatus('');
            }
        });
    }
});