(() => {
  const $ = (id) => document.getElementById(id);
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(`tf-ent-${key}`)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(`tf-ent-${key}`, JSON.stringify(value));
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const formatSize = (bytes) => bytes > 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(1)} GB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  const titles = { video: 'Video Library Pro', radio: 'Personal Radio Studio', movies: 'Offline Movie Database', stream: 'Personal Media Stream', iptv: 'IPTV / M3U Player Pro', rss: 'RSS News Reader Pro', dialogue: 'Bollywood Dialogue Studio' };
  let currentTool = null;
  const library = [];
  let selectedVideo = null;

  function updateStats() {
    $('libraryCount').textContent = library.length + read('movies', []).length;
    $('favoriteCount').textContent = library.filter((item) => item.favorite).length;
    $('historyCount').textContent = read('history', []).length;
  }

  function openTool(tool) {
    currentTool = tool;
    $('entertainmentWorkbench').hidden = false;
    $('workspaceTitle').textContent = titles[tool];
    document.querySelectorAll('.entertainment-panel').forEach((panel) => { panel.hidden = panel.dataset.panel !== tool; });
    $('entertainmentWorkbench').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (tool === 'stream') renderContinue();
    if (tool === 'dialogue' && !quiz.started) startQuiz();
  }

  const toolPaths = { video: 'video-library', radio: 'radio-studio', movies: 'movie-database', stream: 'media-stream', iptv: 'iptv-player', rss: 'rss-reader', dialogue: 'dialogue-studio' };
  document.querySelectorAll('.catalog-tool').forEach((card) => card.addEventListener('click', () => { window.location.href = `/entertainment?tool=${card.dataset.tool}`; }));
  document.querySelectorAll('[data-open-tool]').forEach((button) => button.addEventListener('click', () => openTool(button.dataset.openTool)));
  $('closeWorkspace').addEventListener('click', () => { if (document.querySelector('.entertainment-page')?.classList.contains('is-tool-page')) window.location.href = '/entertainment'; else $('entertainmentWorkbench').hidden = true; });
  const filterCatalog = () => {
    const query = $('entertainmentSearch').value.toLowerCase().trim();
    const filter = document.querySelector('.filter-chip.active').dataset.filter;
    let visible = 0;
    document.querySelectorAll('.catalog-tool').forEach((card) => {
      const show = (!query || card.textContent.toLowerCase().includes(query)) && (filter === 'all' || card.dataset.category === filter);
      card.hidden = !show; if (show) visible += 1;
    });
    $('entertainmentEmpty').hidden = visible > 0;
  };
  $('entertainmentSearch').addEventListener('input', filterCatalog);
  document.querySelectorAll('.filter-chip').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.filter-chip').forEach((item) => item.classList.remove('active')); button.classList.add('active'); filterCatalog(); }));

  function renderVideos(filter = 'all') {
    const query = ($('videoSearch').value || '').toLowerCase();
    const sort = $('videoSort').value;
    let items = library.filter((item) => item.name.toLowerCase().includes(query));
    if (filter === 'favorites') items = items.filter((item) => item.favorite);
    if (filter === 'recent') items = items.filter((item) => item.lastPlayed);
    if (filter === 'continue') items = items.filter((item) => item.progress > 0 && item.progress < 1);
    items.sort((a, b) => sort === 'size' ? b.size - a.size : sort === 'date' ? b.lastModified - a.lastModified : sort === 'duration' ? (b.duration || 0) - (a.duration || 0) : a.name.localeCompare(b.name));
    $('videoGrid').innerHTML = items.length ? items.map((item) => `<article class="media-tile" data-video-id="${item.id}"><div class="video-thumb"><i class="bi bi-play-circle"></i></div><strong>${esc(item.name)}</strong><small>${formatSize(item.size)}${item.duration ? ` · ${Math.round(item.duration)}s` : ''} ${item.favorite ? ' · ♥' : ''}</small><div class="progress-bar"><i style="width:${Math.round((item.progress || 0) * 100)}%"></i></div></article>`).join('') : '<p class="form-hint">Import local videos to build your shelf.</p>';
    document.querySelectorAll('[data-video-id]').forEach((tile) => tile.addEventListener('click', () => selectVideo(tile.dataset.videoId)));
    updateStats(); renderContinue();
  }
  function selectVideo(id) {
    const item = library.find((entry) => entry.id === id); if (!item) return;
    selectedVideo = item; $('videoPlayer').src = item.url; $('videoPlayer').currentTime = item.progress * (item.duration || 0); $('videoNowTitle').textContent = item.name; $('videoHealth').textContent = `${item.type || 'Video'} · ${formatSize(item.size)} · health: browser playback available`;
    item.lastPlayed = Date.now(); write('history', [...new Set([item.id, ...read('history', [])])].slice(0, 20)); renderVideos();
  }
  $('videoFiles').addEventListener('change', (event) => [...event.target.files].forEach((file) => { const item = { id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type, lastModified: file.lastModified, url: URL.createObjectURL(file), progress: 0, favorite: false, duration: 0 }; library.push(item); const probe = document.createElement('video'); probe.preload = 'metadata'; probe.src = item.url; probe.onloadedmetadata = () => { item.duration = probe.duration; renderVideos(); }; }));
  $('videoDrop').addEventListener('dragover', (event) => event.preventDefault()); $('videoDrop').addEventListener('drop', (event) => { event.preventDefault(); $('videoFiles').files = event.dataTransfer.files; $('videoFiles').dispatchEvent(new Event('change')); });
  $('videoPlayer').addEventListener('timeupdate', () => { if (selectedVideo && $('videoPlayer').duration) { selectedVideo.duration = $('videoPlayer').duration; selectedVideo.progress = $('videoPlayer').currentTime / $('videoPlayer').duration; renderContinue(); } });
  $('videoSearch').addEventListener('input', () => renderVideos()); $('videoSort').addEventListener('change', () => renderVideos());
  document.querySelectorAll('[data-library-filter]').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('[data-library-filter]').forEach((item) => item.classList.remove('active')); button.classList.add('active'); renderVideos(button.dataset.libraryFilter); }));
  $('videoFavorite').addEventListener('click', () => { if (selectedVideo) { selectedVideo.favorite = !selectedVideo.favorite; renderVideos(); } });
  $('videoPip').addEventListener('click', () => $('videoPlayer').requestPictureInPicture?.()); $('videoFullscreen').addEventListener('click', () => $('videoPlayer').requestFullscreen?.());
  function renderContinue() { $('continueShelf').innerHTML = library.filter((item) => item.progress > 0 && item.progress < 1).map((item) => `<div class="continue-card"><strong>${esc(item.name)}</strong><small>${Math.round(item.progress * 100)}% watched</small><div class="progress-bar"><i style="width:${Math.round(item.progress * 100)}%"></i></div><button class="secondary-action" data-resume="${item.id}">Resume</button></div>`).join('') || '<p class="form-hint">Your in-progress videos will appear here.</p>'; document.querySelectorAll('[data-resume]').forEach((button) => button.addEventListener('click', () => { openTool('video'); selectVideo(button.dataset.resume); })); }

  let stations = read('stations', []);
  function renderStations() { $('stationList').innerHTML = stations.map((station, index) => `<div class="stack-item"><div><strong>${esc(station.name)}</strong><small>${esc(station.url)}</small></div><button class="secondary-action" data-station="${index}"><i class="bi bi-play-fill"></i></button></div>`).join('') || '<p class="form-hint">Add a stream URL or import an M3U playlist.</p>'; document.querySelectorAll('[data-station]').forEach((button) => button.addEventListener('click', () => playStation(stations[button.dataset.station]))); }
  function playStation(station) { $('radioAudio').src = station.url; $('radioNow').textContent = station.name; $('radioStatus').textContent = 'Connecting...'; $('radioAudio').play().then(() => $('radioStatus').textContent = 'Playing').catch(() => $('radioStatus').textContent = 'Browser blocked or stream unavailable'); }
  $('addStation').addEventListener('click', () => { const name = $('stationName').value.trim() || 'Untitled station'; const url = $('stationUrl').value.trim(); if (!url) return; stations.push({ name, url }); write('stations', stations); $('stationName').value = ''; $('stationUrl').value = ''; renderStations(); });
  $('stationFile').addEventListener('change', async (event) => { const text = await event.target.files[0]?.text(); if (!text) return; parseM3U(text).forEach((entry) => stations.push(entry)); write('stations', stations); renderStations(); });
  $('radioAudio').addEventListener('error', () => { $('radioStatus').textContent = 'Stream error'; }); $('checkStation').addEventListener('click', () => { $('radioStatus').textContent = $('radioAudio').src ? 'Player ready; network check depends on CORS and stream headers' : 'Add a station first'; });
  $('sleepTimer').addEventListener('change', () => { const minutes = Number($('sleepTimer').value); if (minutes) setTimeout(() => $('radioAudio').pause(), minutes * 60000); });

  function parseM3U(text) { const lines = text.split(/\r?\n/); const result = []; let meta = ''; lines.forEach((line) => { if (line.startsWith('#EXTINF')) meta = line.split(',').slice(1).join(',').trim(); else if (line.trim() && !line.startsWith('#')) { result.push({ name: meta || line.trim(), url: line.trim() }); meta = ''; } }); return result; }
  let movies = read('movies', []); let compare = [];
  function renderMovies() { const query = $('movieSearch').value.toLowerCase(); const visible = movies.filter((movie) => JSON.stringify(movie).toLowerCase().includes(query)); $('movieList').innerHTML = visible.map((movie, index) => `<div class="movie-item" data-movie="${movies.indexOf(movie)}"><div><strong>${esc(movie.name)}</strong><small>${esc(movie.year || 'Year unknown')} · ${esc(movie.genre || 'Genre unknown')}</small></div><button class="secondary-action" data-compare="${movies.indexOf(movie)}">Compare</button></div>`).join('') || '<p class="form-hint">Add a movie or import your personal dataset.</p>'; document.querySelectorAll('[data-compare]').forEach((button) => button.addEventListener('click', (event) => { event.stopPropagation(); compare.push(movies[button.dataset.compare]); compare = compare.slice(-2); renderCompare(); })); }
  function renderCompare() { $('movieCompare').innerHTML = compare.length ? compare.map((movie) => `<div><strong>${esc(movie.name)}</strong><small>${esc(movie.year || '-')}<br>${esc(movie.genre || '-')}<br>Rating: ${esc(movie.rating || 'Not rated')}</small></div>`).join('') : '<span>Movie A</span><span>Movie B</span>'; }
  $('addMovie').addEventListener('click', () => { const name = $('movieName').value.trim(); if (!name) return; movies.push({ name, year: $('movieYear').value, genre: $('movieGenre').value, rating: '' }); write('movies', movies); ['movieName','movieYear','movieGenre'].forEach((id) => $(id).value = ''); renderMovies(); updateStats(); }); $('movieSearch').addEventListener('input', renderMovies);
  $('movieImport').addEventListener('change', async (event) => { const file = event.target.files[0]; if (!file) return; const text = await file.text(); try { const data = file.name.endsWith('.json') ? JSON.parse(text) : text.split(/\r?\n/).filter(Boolean).slice(1).map((line) => { const [name, year, genre] = line.split(','); return { name, year, genre }; }); movies = movies.concat(Array.isArray(data) ? data : [data]); write('movies', movies); renderMovies(); updateStats(); } catch { $('movieList').innerHTML = '<p class="form-hint">Could not read that dataset.</p>'; } }); $('exportMovies').addEventListener('click', () => downloadBlob(JSON.stringify(movies, null, 2), 'movies.json', 'application/json'));
  function downloadBlob(content, name, type) { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([content], { type })); link.download = name; link.click(); URL.revokeObjectURL(link.href); }

  let channels = [];
  function renderChannels() { const query = $('iptvSearch').value.toLowerCase(); const group = $('iptvGroup').value; const visible = channels.filter((channel) => (!query || `${channel.name} ${channel.group}`.toLowerCase().includes(query)) && (group === 'all' || channel.group === group)); $('channelList').innerHTML = visible.map((channel, index) => `<div class="channel-item" data-channel="${channels.indexOf(channel)}"><div><strong>${esc(channel.name)}</strong><small>${esc(channel.group || 'Uncategorized')} · ready to test</small></div><i class="bi bi-play-circle"></i></div>`).join('') || '<p class="form-hint">Import an authorized M3U playlist.</p>'; document.querySelectorAll('[data-channel]').forEach((item) => item.addEventListener('click', () => { const channel = channels[item.dataset.channel]; $('iptvPlayer').src = channel.url; $('channelNow').textContent = channel.name; $('iptvPlayer').play().catch(() => {}); })); }
  function loadChannels(text) { channels = parseM3U(text).map((item) => ({ ...item, group: 'Uncategorized' })); $('iptvGroup').innerHTML = '<option value="all">All groups</option>'; [...new Set(channels.map((item) => item.group))].forEach((group) => $('iptvGroup').insertAdjacentHTML('beforeend', `<option>${esc(group)}</option>`)); renderChannels(); }
  $('iptvFile').addEventListener('change', async (event) => loadChannels(await event.target.files[0]?.text() || '')); $('iptvSearch').addEventListener('input', renderChannels); $('iptvGroup').addEventListener('change', renderChannels); $('iptvPip').addEventListener('click', () => $('iptvPlayer').requestPictureInPicture?.());
  $('loadIptvUrl').addEventListener('click', async () => { try { const response = await fetch($('iptvUrl').value); loadChannels(await response.text()); } catch { $('channelList').innerHTML = '<p class="form-hint">Playlist could not be fetched. Try downloading it and importing the file.</p>'; } });

  let feeds = read('feeds', []);
  function renderFeeds() { $('feedList').innerHTML = feeds.map((feed, index) => `<div class="stack-item"><div><strong>${esc(feed.name || feed.url)}</strong><small>${esc(feed.category)}</small></div><button class="secondary-action" data-feed="${index}">Refresh</button></div>`).join('') || '<p class="form-hint">Add an RSS or Atom feed URL.</p>'; document.querySelectorAll('[data-feed]').forEach((button) => button.addEventListener('click', () => fetchFeed(feeds[button.dataset.feed]))); }
  async function fetchFeed(feed) { try { const response = await fetch(feed.url); const xml = new DOMParser().parseFromString(await response.text(), 'text/xml'); const entries = [...xml.querySelectorAll('item, entry')].slice(0, 12).map((item) => ({ title: item.querySelector('title')?.textContent || 'Untitled article', link: item.querySelector('link')?.textContent || item.querySelector('link')?.getAttribute('href') || '#', date: item.querySelector('pubDate, updated')?.textContent || '' })); $('articleCount').textContent = `${entries.length} Articles`; $('articleList').innerHTML = entries.map((entry) => `<a href="${esc(entry.link)}" target="_blank" rel="noopener">${esc(entry.title)}<small>${esc(entry.date)}</small></a>`).join(''); } catch { $('articleList').innerHTML = '<p class="form-hint">Feed failed or blocked by browser CORS policy.</p>'; } }
  $('addFeed').addEventListener('click', () => { const url = $('feedUrl').value.trim(); if (!url) return; feeds.push({ url, category: $('feedCategory').value }); write('feeds', feeds); $('feedUrl').value = ''; renderFeeds(); fetchFeed(feeds.at(-1)); });

  const questions = [{ q: 'Which film mode is best for a quick family quiz?', a: ['Comedy', 'Documentary', 'Spreadsheet', 'Weather'], c: 0 }, { q: 'Which item belongs in a personal media library?', a: ['Your own video', 'A private API key', 'A server password', 'A payment token'], c: 0 }, { q: 'What does M3U commonly contain?', a: ['Playlist entries', 'Image pixels', 'PDF pages', 'CSS rules'], c: 0 }, { q: 'Which browser feature can resume a local video?', a: ['currentTime', 'innerWidth', 'localName', 'screenX'], c: 0 }, { q: 'What is the safest dialogue quiz dataset?', a: ['Short, original snippets', 'A copied full script', 'Private credentials', 'Unlicensed archive'], c: 0 }];
  const quiz = { started: false, index: 0, score: 0, answered: false }; let quizStats = read('quizStats', { games: 0, correct: 0, best: 0 });
  function renderQuiz() { const item = questions[quiz.index]; $('quizProgress').textContent = `Question ${quiz.index + 1} / ${questions.length}`; $('quizScore').textContent = `Score ${quiz.score}`; $('quizQuestion').textContent = item.q; $('quizOptions').innerHTML = item.a.map((answer, index) => `<button data-answer="${index}">${esc(answer)}</button>`).join(''); document.querySelectorAll('[data-answer]').forEach((button) => button.addEventListener('click', () => { if (quiz.answered) return; quiz.answered = true; const correct = Number(button.dataset.answer) === item.c; button.classList.add(correct ? 'correct' : 'wrong'); if (correct) quiz.score += 1; quizStats.correct += correct ? 1 : 0; document.querySelectorAll('[data-answer]')[item.c].classList.add('correct'); $('quizScore').textContent = `Score ${quiz.score}`; })); }
  function startQuiz() { quiz.started = true; quiz.index = 0; quiz.score = 0; quiz.answered = false; renderQuiz(); } $('newQuiz').addEventListener('click', startQuiz); $('nextQuestion').addEventListener('click', () => { if (!quiz.answered) return; if (quiz.index === questions.length - 1) { quizStats.games += 1; quizStats.best = Math.max(quizStats.best, quiz.score); write('quizStats', quizStats); $('quizQuestion').textContent = `Challenge complete: ${quiz.score}/${questions.length}`; $('quizOptions').innerHTML = '<p>Start a new challenge to play again.</p>'; quiz.answered = false; return; } quiz.index += 1; quiz.answered = false; renderQuiz(); });
  function init() { renderVideos(); renderStations(); renderMovies(); renderChannels(); renderFeeds(); $('gamesPlayed').textContent = quizStats.games; $('correctAnswers').textContent = quizStats.correct; $('bestStreak').textContent = quizStats.best; updateStats(); const page = document.querySelector('.entertainment-page'); const selectedTool = page?.dataset.selectedTool || new URLSearchParams(window.location.search).get('tool'); if (selectedTool && titles[selectedTool]) { page.classList.add('is-tool-page'); const heading = page.querySelector('.entertainment-hero h1'); if (heading) heading.textContent = titles[selectedTool]; const intro = page.querySelector('.entertainment-hero p'); if (intro) intro.textContent = 'Focused workspace for your personal entertainment workflow. Your data stays in this browser where possible.'; const stats = page.querySelector('.entertainment-stats'); if (stats) stats.hidden = true; const workbenchHeading = page.querySelector('.workbench-heading'); if (workbenchHeading && !workbenchHeading.querySelector('.entertainment-back')) workbenchHeading.querySelector('div')?.insertAdjacentHTML('afterbegin', '<a class="entertainment-back" href="/entertainment"><i class="bi bi-arrow-left"></i> All entertainment tools</a>'); openTool(selectedTool); } }
  init();
})();