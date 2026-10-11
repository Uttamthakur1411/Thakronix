(() => {
  const byId = (id) => document.getElementById(id);
  const storageKey = 'Thakronix-typing-profile-v1';
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const keyboardRows = ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const words = 'the quick brown fox jumps over a quiet river while people build useful tools and practice each day with patience clear focus steady rhythm thoughtful work makes progress easier than a perfect plan learn from small mistakes keep your hands relaxed and your eyes ahead'.split(' ');
  const quotes = {
    short: ['Small steps make strong habits.', 'Focus on the next keystroke.', 'Practice turns effort into ease.'],
    paragraph: ['Good typing is not only about moving quickly. It is about staying relaxed, reading ahead, and choosing accuracy when the words become difficult.', 'A useful practice session gives you a clear goal and enough time to notice your habits. Steady progress grows from the small corrections you make along the way.'],
    article: ['A thoughtful practice routine balances speed, accuracy, and rest. Begin with words that feel comfortable, then gradually add longer phrases, punctuation, and numbers. Pay attention to the keys that interrupt your rhythm. Short, focused sessions can be more useful than a long session spent rushing. Keep your shoulders relaxed and let your eyes move a little ahead of your hands. At the end, review the places where you slowed down and build a short exercise around those patterns. Progress is easier to sustain when each session has one clear purpose.']
  };
  const codeSamples = {
    html: '<section class="profile-card">\n  <h2>Build with care</h2>\n  <p>Small steps create useful products.</p>\n</section>',
    css: '.profile-card {\n  display: grid;\n  gap: 1rem;\n  color: #172321;\n}',
    javascript: 'function countWords(text) {\n  return text.trim().split(/\\s+/).length;\n}\n\nconsole.log(countWords("keep practicing"));',
    python: 'def count_words(text):\n    words = text.strip().split()\n    return len(words)\n\nprint(count_words("keep practicing"))',
    java: 'class Practice {\n    public static void main(String[] args) {\n        System.out.println("Keep practicing");\n    }\n}',
    sql: 'SELECT skill, AVG(score) AS average_score\nFROM practice_results\nWHERE completed = TRUE\nGROUP BY skill\nORDER BY average_score DESC;',
    json: '{\n  "tool": "typing-test",\n  "local": true,\n  "metrics": ["speed", "accuracy"]\n}',
    c: '#include <stdio.h>\n\nint main(void) {\n    printf("Keep practicing\\n");\n    return 0;\n}',
    cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Keep practicing\\n";\n    return 0;\n}'
  };
  const languageSamples = {
    en: 'Practice with calm focus and build your speed one word at a time.',
    hinglish: 'aaj college jana hai aur mujhe ek project complete karna hai',
    hi: 'आज अभ्यास करें और हर दिन अपनी गति में सुधार करें।',
    es: 'La práctica constante ayuda a escribir con calma y precisión.',
    fr: 'Une pratique régulière aide à écrire avec calme et précision.',
    de: 'Regelmäßiges Üben hilft dabei, ruhig und genau zu schreiben.'
  };
  let profile;
  try { profile = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { profile = {}; }
  profile.history = Array.isArray(profile.history) ? profile.history : [];
  profile.personalBests = profile.personalBests || {};
  profile.xp = Number(profile.xp) || 0;
  profile.difficulty = Math.min(5, Math.max(1, Number(profile.difficulty) || 1));
  profile.lastPracticeDate = profile.lastPracticeDate || '';
  profile.streak = Number(profile.streak) || 0;

  const state = {
    prompt: '', armed: false, running: false, finished: false, startedAt: 0, finishedSeconds: 0, timer: null,
    duration: 60, typed: '', errors: 0, backspaces: 0, correctKeys: 0, wrongKeys: 0,
    lastActionAt: 0, lastKey: '', keyStats: {}, pairStats: {}, samples: [], presses: [],
    lastSampleSecond: -1, currentKey: '', trackedLength: 0, usedBackspace: false, practiceMode: false, practiceLabel: ''
  };

  const saveProfile = () => localStorage.setItem(storageKey, JSON.stringify(profile));
  const selectedMode = () => byId('typingMode').value;
  const selectedChallenge = () => byId('typingChallenge').value;
  const selectedLength = () => byId('typingLength').value;
  const currentTypedLength = () => [...state.typed].length;
  const elapsedSeconds = () => state.running ? Math.max(0, (Date.now() - state.startedAt) / 1000) : state.finished ? state.finishedSeconds : 0;
  const expectedChar = (index) => [...state.prompt][index] || '';
  const charsEqual = (left, right) => left?.toLocaleLowerCase() === right?.toLocaleLowerCase();

  function configureLength() {
    const mode = selectedMode();
    const length = byId('typingLength');
    const options = mode === 'time' ? [['15','15 sec'],['30','30 sec'],['60','60 sec'],['120','120 sec'],['300','300 sec']]
      : mode === 'words' ? [['10','10 words'],['25','25 words'],['50','50 words'],['100','100 words'],['250','250 words']]
      : mode === 'quote' ? [['short','Short quotes'],['paragraph','Paragraph'],['article','Long article']]
      : mode === 'code' ? Object.keys(codeSamples).map((key) => [key, key.toUpperCase()])
      : mode === 'numbers' ? [['sequence','Number sequence'],['phone','Phone numbers'],['dates','Dates'],['decimal','Decimals'],['currency','Currency']]
      : mode === 'language' ? Object.keys(languageSamples).map((key) => [key, key === 'hi' ? 'Hindi' : key === 'en' ? 'English' : key[0].toUpperCase() + key.slice(1)])
      : mode === 'punctuation' ? [['mixed','Mixed symbols'],['quotes','Quotes & brackets'],['symbols','Symbols']]
      : [['custom','My passage']];
    const previous = length.value;
    length.innerHTML = options.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
    if (options.some(([value]) => value === previous)) length.value = previous;
    byId('typingCustomBox').classList.toggle('hidden', mode !== 'custom');
    if (mode === 'code') byId('typingDifficulty').value = '5';
  }

  function makePrompt() {
    const mode = selectedMode();
    const level = Number(byId('typingDifficulty').value);
    const length = selectedLength();
    if (mode === 'custom') return byId('typingCustomText').value.trim() || 'Paste your own passage above, then select Use passage.';
    if (mode === 'quote') { const options = quotes[length] || quotes.short; return options[Math.floor(Math.random() * options.length)]; }
    if (mode === 'code') return codeSamples[length] || codeSamples.python;
    if (mode === 'language') return languageSamples[length] || languageSamples.en;
    if (mode === 'numbers') {
      if (length === 'phone') return '+1 415-555-0138  +44 20 7946 0958  +91 98765 43210';
      if (length === 'dates') return '04/10/2026  2026-10-04  12.31.2026  18/06/2027';
      if (length === 'decimal') return '3.14159  0.875  42.006  1000.25  19,500.75';
      if (length === 'currency') return '$19.99  €42.50  £1,250.00  ₹875.25';
      return '1234567890  0987654321  2468135790  1357924680';
    }
    if (mode === 'punctuation') {
      if (length === 'quotes') return 'She asked, "Are we ready?" (We are!) [Check the notes]; then leave.';
      if (length === 'symbols') return '! @ # $ % ^ & * ( ) _ + = { } [ ] < > / ? : ;';
      return 'Wait... really?! Yes; however, practice (and patience) matter: "focus", not speed!';
    }
    const pool = level === 1 ? words.slice(0, 30) : level === 2 ? words.slice(30, 75) : level === 3 ? words : level === 4 ? words.concat(['2026','75%','3.14','1000']) : words.concat(['algorithm','database','function','variable','interface','syntax']);
    const count = mode === 'time' ? Math.max(55, Math.ceil(Number(length) * 2.4)) : Number(length) || 50;
    const result = [];
    for (let index = 0; index < count; index += 1) result.push(pool[Math.floor(Math.random() * pool.length)]);
    if (level >= 3) return result.map((word, index) => index % 7 === 6 ? `${word},` : index % 13 === 12 ? `${word}.` : word).join(' ');
    return result.join(' ');
  }

  function drawPrompt() {
    const prompt = byId('typingPrompt');
    const typed = [...state.typed];
    const chars = [...state.prompt];
    prompt.replaceChildren(...chars.map((char, index) => {
      const span = document.createElement('span');
      span.textContent = char;
      if (index < typed.length) span.className = charsEqual(typed[index], char) ? 'is-correct' : 'is-wrong';
      else if (index === typed.length) span.className = 'is-current';
      return span;
    }));
  }

  function resetSession(newPassage = true) {
    clearInterval(state.timer);
    state.timer = null;
    state.running = false;
    state.armed = false;
    state.finished = false;
    state.startedAt = 0;
    state.finishedSeconds = 0;
    state.typed = '';
    state.trackedLength = 0;
    state.errors = 0;
    state.backspaces = 0;
    state.correctKeys = 0;
    state.wrongKeys = 0;
    state.lastActionAt = 0;
    state.lastKey = '';
    state.keyStats = {};
    state.pairStats = {};
    state.samples = [];
    state.presses = [];
    state.lastSampleSecond = -1;
    state.currentKey = '';
    state.usedBackspace = false;
    state.practiceMode = false;
    state.practiceLabel = '';
    byId('typingResults').classList.add('hidden');
    byId('typingPractice').disabled = true;
    byId('typingTrainPairs').disabled = true;
    byId('typingInput').value = '';
    byId('typingInput').disabled = true;
    byId('typingStatus').textContent = 'Ready';
    byId('typingStart').disabled = false;
    byId('typingStart').textContent = 'Start test';
    byId('typingTime').textContent = 'Ready';
    byId('typingElapsed').textContent = '0 sec';
    if (newPassage) state.prompt = makePrompt();
    drawPrompt();
    updateMetrics();
    drawChart();
    drawKeyboard();
  }

  function startSession() {
    if (state.running) return;
    if (state.finished) resetSession(true);
    if (!state.prompt || state.prompt.startsWith('Paste your own passage')) {
      byId('typingStatus').textContent = 'Add a passage first';
      return;
    }
    const challenge = selectedChallenge();
    state.duration = challenge === 'sprint' ? 15 : challenge === 'endurance' ? 300 : selectedMode() === 'time' ? Number(selectedLength()) : 0;
    state.armed = true;
    state.running = true;
    state.startedAt = Date.now();
    state.lastActionAt = state.startedAt;
    byId('typingInput').disabled = false;
    byId('typingInput').focus();
    byId('typingStart').disabled = true;
    byId('typingStatus').textContent = state.practiceLabel || 'Typing';
    byId('typingInput').placeholder = 'Keep going. Your stats update as you type.';
    state.timer = setInterval(tick, 200);
    updateMetrics();
  }

  function keyName(key) {
    if (key === ' ') return 'SPACE';
    return key.length === 1 ? key.toUpperCase() : key;
  }

  function trackKey(key, correct, latency) {
    const name = keyName(key);
    const stats = state.keyStats[name] || (state.keyStats[name] = { presses: 0, correct: 0, errors: 0, latency: 0 });
    stats.presses += 1;
    stats.latency += Math.max(0, latency);
    if (correct) stats.correct += 1;
    else stats.errors += 1;
    state.currentKey = name;
  }

  function recordPairs(index, correct, latency) {
    if (index < 1) return;
    [2, 3].forEach((size) => {
      if (index < size - 1) return;
      const label = [...state.prompt].slice(index - size + 1, index + 1).join('').toUpperCase();
      if (!/[A-Z]/i.test(label)) return;
      const stat = state.pairStats[label] || (state.pairStats[label] = { count: 0, errors: 0, latency: 0 });
      stat.count += 1;
      stat.latency += latency;
      if (!correct) stat.errors += 1;
    });
  }

  function onKeyDown(event) {
    if (!state.running || event.ctrlKey || event.metaKey || event.altKey) return;
    const now = Date.now();
    if (event.key === 'Backspace' || event.key === 'Delete') {
      if (event.key === 'Backspace') state.backspaces += 1;
      state.usedBackspace = true;
      if (selectedChallenge() === 'no-backspace' || selectedChallenge() === 'perfect') event.preventDefault();
      updateMetrics();
      return;
    }
    if (event.key.length !== 1 || event.key === 'Dead') return;
    const index = [...byId('typingInput').value].length;
    const expected = expectedChar(index);
    const correct = charsEqual(event.key, expected);
    const latency = state.lastActionAt ? now - state.lastActionAt : 0;
    state.lastActionAt = now;
    state.presses.push({ key: keyName(event.key), correct, latency, at: now });
    trackKey(event.key, correct, latency);
    if (!correct) { state.errors += 1; state.wrongKeys += 1; }
    else state.correctKeys += 1;
    recordPairs(index, correct, latency);
    state.trackedLength = index + 1;
    drawKeyboard(event.key, !correct);
    updateMetrics();
  }

  function currentCounts() {
    const typed = [...state.typed];
    const expected = [...state.prompt];
    const correct = typed.reduce((total, char, index) => total + (charsEqual(char, expected[index]) ? 1 : 0), 0);
    return { typed: typed.length, correct, wrong: typed.length - correct };
  }

  function currentWpm() {
    const seconds = Math.max(elapsedSeconds(), 1);
    const counts = currentCounts();
    return { net: counts.correct / 5 / (seconds / 60), raw: counts.typed / 5 / (seconds / 60) };
  }

  function consistency() {
    const values = state.samples.map((sample) => sample.wpm).filter((value) => value > 0);
    if (values.length < 2) return values.length ? 100 : 0;
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
    return Math.max(0, Math.min(100, Math.round(100 - (Math.sqrt(variance) / Math.max(average, 1)) * 100)));
  }

  function updateMetrics() {
    const counts = currentCounts();
    const speed = currentWpm();
    const accuracy = counts.typed ? Math.round(counts.correct / counts.typed * 100) : 0;
    byId('typingWpm').textContent = String(Math.round(speed.net));
    byId('typingRawWpm').textContent = String(Math.round(speed.raw));
    byId('typingAccuracy').textContent = `${accuracy}%`;
    byId('typingErrors').textContent = String(state.errors);
    byId('typingChars').textContent = `${counts.correct} / ${counts.wrong}`;
    byId('typingBackspaces').textContent = String(state.backspaces);
    byId('typingConsistency').textContent = state.samples.length > 1 ? `${consistency()}%` : '--';
    const target = Math.max(1, Number(byId('typingTarget').value) || 60);
    byId('typingTargetValue').textContent = `${target} WPM target`;
    byId('typingTargetGap').textContent = `Current ${Math.round(speed.net)} · gap ${Math.max(0, Math.round(target - speed.net))} WPM`;
    byId('typingTargetBar').style.width = `${Math.min(100, speed.net / target * 100)}%`;
    const elapsed = Math.floor(elapsedSeconds());
    byId('typingElapsed').textContent = `${elapsed} sec`;
    const timeLabel = byId('typingTime').previousElementSibling;
    if (state.finished) { timeLabel.textContent = 'Duration'; byId('typingTime').textContent = `${elapsed} sec`; }
    else if (state.duration) { timeLabel.textContent = 'Time left'; byId('typingTime').textContent = `${Math.max(0, state.duration - elapsed)} sec`; }
    else if (selectedMode() === 'words') { timeLabel.textContent = 'Words typed'; byId('typingTime').textContent = `${Math.min(counts.typed, [...state.prompt].filter((char, index) => index === 0 || char === ' ').length)} / ${selectedLength()}`; }
    else { timeLabel.textContent = 'Elapsed'; byId('typingTime').textContent = `${elapsed} sec`; }
  }

  function tick() {
    if (!state.running) return;
    const elapsed = Math.floor(elapsedSeconds());
    if (elapsed > state.lastSampleSecond) {
      state.lastSampleSecond = elapsed;
      state.samples.push({ second: elapsed, wpm: Math.round(currentWpm().net) });
      drawChart();
    }
    updateMetrics();
    if (state.duration && elapsed >= state.duration) finishSession();
  }

  function drawChart() {
    const canvas = byId('typingChart');
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 450;
    const height = canvas.clientHeight || 120;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const context = canvas.getContext('2d');
    context.scale(ratio, ratio);
    context.clearRect(0, 0, width, height);
    context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--line').trim() || '#dfe5df';
    context.lineWidth = 1;
    for (let row = 1; row < 4; row += 1) { const y = (height - 18) * row / 4 + 6; context.beginPath(); context.moveTo(30, y); context.lineTo(width - 8, y); context.stroke(); }
    const values = state.samples.slice(-60);
    const maximum = Math.max(30, ...values.map((sample) => sample.wpm));
    context.fillStyle = '#6c7974';
    context.font = '10px DM Sans, sans-serif';
    context.fillText(`${maximum} WPM`, 5, 12);
    if (values.length < 2) return;
    context.strokeStyle = '#1e755c';
    context.lineWidth = 2;
    context.beginPath();
    values.forEach((sample, index) => {
      const x = 32 + index / Math.max(values.length - 1, 1) * (width - 44);
      const y = height - 12 - sample.wpm / maximum * (height - 32);
      if (index) context.lineTo(x, y); else context.moveTo(x, y);
    });
    context.stroke();
  }

  function drawKeyboard(active = state.currentKey, wrong = false) {
    const keyboard = byId('typingKeyboard');
    if (!keyboard) return;
    keyboard.innerHTML = keyboardRows.map((row) => `<div class="typing-key-row">${[...row].map((key) => `<button type="button" class="typing-key${active === key.toUpperCase() ? wrong ? ' key-wrong' : ' key-active' : ''}" data-typing-key="${key.toUpperCase()}" aria-label="Key ${key.toUpperCase()}">${key.toUpperCase()}</button>`).join('')}</div>`).join('');
    keyboard.querySelectorAll('[data-typing-key]').forEach((button) => button.addEventListener('click', () => showKeyDetail(button.dataset.typingKey)));
    if (active && active !== 'SPACE') byId('typingKeyHint').textContent = `Current key: ${active}`;
  }

  function showKeyDetail(key) {
    const stats = state.keyStats[key];
    if (!stats) { byId('typingKeyDetail').textContent = `${key}: no recorded presses in this session.`; return; }
    const accuracy = Math.round(stats.correct / stats.presses * 100);
    byId('typingKeyDetail').textContent = `${key} · ${accuracy}% accuracy · ${Math.round(stats.latency / stats.presses)} ms average response · ${stats.errors} errors · ${stats.presses} presses`;
  }

  function renderRows(container, rows, formatter) {
    container.innerHTML = rows.length ? rows.map(formatter).join('') : '<p class="muted">Complete a test to see this analysis.</p>';
  }

  function fingerFor(key) {
    const left = { q: 'Left pinky', a: 'Left pinky', z: 'Left pinky', w: 'Left ring', s: 'Left ring', x: 'Left ring', e: 'Left middle', d: 'Left middle', c: 'Left middle', r: 'Left index', f: 'Left index', v: 'Left index', t: 'Left index', g: 'Left index', b: 'Left index' };
    const right = { y: 'Right index', h: 'Right index', n: 'Right index', u: 'Right index', j: 'Right index', m: 'Right index', i: 'Right middle', k: 'Right middle', o: 'Right ring', l: 'Right ring', p: 'Right pinky' };
    return left[key.toLowerCase()] || right[key.toLowerCase()] || 'Other';
  }

  function renderAnalysis(result) {
    const keys = Object.entries(state.keyStats).filter(([key]) => /^[A-Z]$/.test(key));
    const weak = keys.filter(([, stat]) => stat.presses >= 2).map(([key, stat]) => ({ key, accuracy: stat.correct / stat.presses * 100, ...stat })).sort((a, b) => a.accuracy - b.accuracy).slice(0, 5);
    const pairs = Object.entries(state.pairStats).map(([label, stat]) => ({ label, ...stat, average: stat.latency / stat.count })).sort((a, b) => (b.errors / b.count) - (a.errors / a.count) || b.average - a.average).slice(0, 5);
    renderRows(byId('typingWeakKeys'), weak, (item) => `<div class="typing-row"><button type="button" data-practice-key="${item.key}">${item.key}</button><span class="typing-meter"><i style="width:${Math.max(3, item.accuracy)}%"></i></span><b>${Math.round(item.accuracy)}%</b></div>`);
    renderRows(byId('typingPairs'), pairs, (item) => `<div class="typing-row"><b>${item.label}</b><span>${Math.round(item.average)} ms · ${item.errors} errors</span><span>${Math.round(item.errors / item.count * 100)}%</span></div>`);
    const fingers = {};
    keys.forEach(([key, stat]) => { const finger = fingerFor(key); fingers[finger] = (fingers[finger] || 0) + stat.presses; });
    const totalPresses = Object.values(fingers).reduce((sum, value) => sum + value, 0) || 1;
    renderRows(byId('typingFingers'), Object.entries(fingers).sort((a, b) => b[1] - a[1]), ([name, count]) => `<div class="typing-row"><b>${name}</b><span class="typing-meter"><i style="width:${count / totalPresses * 100}%"></i></span><span>${Math.round(count / totalPresses * 100)}%</span></div>`);
    const allKeyPresses = Object.values(state.keyStats).reduce((sum, stat) => sum + stat.presses, 0);
    const punctuationErrors = state.presses.filter((press) => !/^[A-Z]$/i.test(press.key) && !press.correct).length;
    const comparisonWpm = Number(profile.personalBests[modeKey()]?.wpm) || result.wpm;
    const drop = profile.history.length > 1 ? Math.round((Number(profile.history.slice(0, 6).reduce((sum, item) => sum + item.wpm, 0) / Math.min(profile.history.length, 6)) - result.wpm) / Math.max(result.wpm, 1) * 100) : 0;
    const reasons = [];
    if (result.accuracy < 95) reasons.push('accuracy fell below 95%');
    if (punctuationErrors) reasons.push(`${punctuationErrors} symbol or punctuation errors`);
    if (weak.length) reasons.push(`key ${weak[0].key} was your least accurate`);
    if (drop > 5) reasons.push('speed was below your recent average');
    byId('typingInsight').textContent = reasons.length ? `Performance insight: ${reasons.join('; ')}. Slow down slightly on these spots and practice the highlighted keys.` : 'Performance insight: speed and accuracy stayed balanced. Keep this passage difficulty or move up one level.';
    byId('typingGrade').textContent = result.accuracy >= 99 && result.wpm >= 80 ? 'A+' : result.accuracy >= 97 ? 'A' : result.accuracy >= 92 ? 'B' : result.accuracy >= 80 ? 'C' : 'Keep practicing';
    byId('typingComparison').innerHTML = `<div class="typing-row"><b>You</b><span>${result.wpm} WPM · ${result.accuracy}%</span><b>${result.consistency}%</b></div><div class="typing-row"><b>Best</b><span>${comparisonWpm} WPM</span><b>${Math.round(Number(profile.personalBests[modeKey()]?.accuracy) || result.accuracy)}%</b></div><p class="muted">${Math.min(100, Math.round(result.wpm / Math.max(comparisonWpm, 1) * 100))}% of your mode best · ${allKeyPresses} analyzed key presses</p>`;
    byId('typingWeakKeys').querySelectorAll('[data-practice-key]').forEach((button) => button.addEventListener('click', () => buildWeakPractice([button.dataset.practiceKey])));
    byId('typingPractice').disabled = weak.length === 0;
    byId('typingTrainPairs').disabled = pairs.length === 0;
    byId('typingTrainPairs').onclick = () => buildPairPractice(pairs.slice(0, 3).map((item) => item.label));
    byId('typingPractice').onclick = () => buildWeakPractice(weak.slice(0, 4).map((item) => item.key));
    const analysisGrid = document.querySelector('#typingResults .typing-analysis-grid');
    analysisGrid.querySelector('.typing-code-checks')?.remove();
    if (selectedMode() === 'code') {
      const expected = [...state.prompt];
      const typed = [...state.typed];
      const symbols = expected.map((char, index) => ({ char, index })).filter(({ char }) => /[^a-z\d\s]/i.test(char));
      const symbolAccuracy = symbols.length ? Math.round(symbols.filter(({ char, index }) => charsEqual(char, typed[index])).length / symbols.length * 100) : 100;
      const brackets = new Set(['(', ')', '[', ']', '{', '}']);
      const bracketIndexes = expected.map((char, index) => ({ char, index })).filter(({ char }) => brackets.has(char));
      const bracketAccuracy = bracketIndexes.length ? Math.round(bracketIndexes.filter(({ char, index }) => char === typed[index]).length / bracketIndexes.length * 100) : 100;
      const expectedLines = state.prompt.split('\n');
      const typedLines = state.typed.split('\n');
      const indented = expectedLines.map((line, index) => ({ leading: line.match(/^[\t ]+/)?.[0] || '', index })).filter(({ leading }) => leading.length);
      const indentationAccuracy = indented.length ? Math.round(indented.filter(({ leading, index }) => leading === (typedLines[index]?.match(/^[\t ]+/)?.[0] || '')).length / indented.length * 100) : 100;
      const stack = [];
      let bracketErrors = 0;
      const closing = { ')': '(', ']': '[', '}': '{' };
      [...state.typed].forEach((char) => {
        if ('([{'.includes(char)) stack.push(char);
        else if (closing[char] && stack.pop() !== closing[char]) bracketErrors += 1;
      });
      bracketErrors += stack.length;
      const symbolStats = Object.entries(state.keyStats).filter(([key]) => !/^[A-Z]$/.test(key));
      const symbolPresses = symbolStats.reduce((sum, [, stat]) => sum + stat.presses, 0);
      const symbolLatency = symbolStats.reduce((sum, [, stat]) => sum + stat.latency, 0);
      const checks = document.createElement('section');
      checks.className = 'typing-code-checks';
      checks.innerHTML = `<h5>Developer checks · local heuristics</h5><p>Special-character accuracy: <b>${symbolAccuracy}%</b></p><p>Bracket accuracy: <b>${bracketAccuracy}%</b> · unbalanced brackets typed: <b>${bracketErrors}</b></p><p>Indentation match: <b>${indentationAccuracy}%</b></p><p>Symbol response: <b>${symbolPresses ? Math.round(symbolLatency / symbolPresses) : 0} ms</b> average</p>`;
      analysisGrid.append(checks);
    }
  }

  function modeKey() {
    const mode = selectedMode();
    return mode === 'time' ? `${mode}-${selectedLength()}` : mode;
  }

  function buildWeakPractice(keys) {
    const expanded = keys.flatMap((key) => {
      const lower = key.toLowerCase();
      return [lower, `${lower}${lower}`, `${lower}a`, `a${lower}`, `${lower}e`, `e${lower}`, `${lower}ing`, `pro${lower}ect`, `${lower}ublic`, `ob${lower}ect`];
    });
    byId('typingMode').value = 'custom';
    configureLength();
    byId('typingCustomText').value = [...new Set(expanded)].join(' ');
    state.practiceMode = true;
    state.prompt = byId('typingCustomText').value;
    byId('typingDifficulty').value = '2';
    resetSession(false);
    state.practiceMode = true;
    state.practiceLabel = 'Targeted key practice';
    byId('typingStatus').textContent = 'Targeted key practice';
    byId('typingChallenge').value = 'none';
    startSession();
  }

  function buildPairPractice(pairs) {
    const passage = pairs.flatMap((pair) => [pair.toLowerCase(), `the ${pair.toLowerCase()} pattern`, `${pair.toLowerCase()} ${pair.toLowerCase()} practice`]).join(' ');
    byId('typingMode').value = 'custom';
    configureLength();
    byId('typingCustomText').value = passage;
    state.prompt = passage;
    resetSession(false);
    state.practiceMode = true;
    state.practiceLabel = 'Combination practice';
    byId('typingStatus').textContent = 'Combination practice';
    byId('typingChallenge').value = 'none';
    startSession();
  }

  function finishSession() {
    if (!state.running) return;
    const duration = Math.max(elapsedSeconds(), 1);
    state.finishedSeconds = duration;
    state.running = false;
    state.finished = true;
    clearInterval(state.timer);
    state.timer = null;
    const counts = currentCounts();
    const result = {
      date: new Date().toISOString(), mode: modeKey(), wpm: Math.round(counts.correct / 5 / (duration / 60)),
      rawWpm: Math.round(counts.typed / 5 / (duration / 60)), accuracy: counts.typed ? Math.round(counts.correct / counts.typed * 1000) / 10 : 0,
      consistency: consistency(), errors: state.errors, backspaces: state.backspaces, correct: counts.correct, wrong: counts.wrong,
      seconds: Math.round(duration), challenge: selectedChallenge()
    };
    const prior = profile.personalBests[result.mode] || {};
    const isNewBest = result.wpm > (Number(prior.wpm) || 0);
    profile.personalBests[result.mode] = { wpm: Math.max(result.wpm, Number(prior.wpm) || 0), accuracy: Math.max(result.accuracy, Number(prior.accuracy) || 0), consistency: Math.max(result.consistency, Number(prior.consistency) || 0), date: result.date };
    profile.history.unshift(result);
    profile.history = profile.history.slice(0, 100);
    profile.xp += 100 + (result.accuracy >= 95 ? 50 : 0) + (isNewBest ? 100 : 0);
    const day = result.date.slice(0, 10);
    if (profile.lastPracticeDate !== day) {
      const previous = new Date(`${profile.lastPracticeDate || '2000-01-01'}T00:00:00`);
      const today = new Date(`${day}T00:00:00`);
      profile.streak = Math.floor((today - previous) / 86400000) === 1 ? profile.streak + 1 : 1;
      profile.lastPracticeDate = day;
    }
    if (result.accuracy >= 97) profile.difficulty = Math.min(5, profile.difficulty + 1);
    else if (result.accuracy < 85) profile.difficulty = Math.max(1, profile.difficulty - 1);
    saveProfile();
    byId('typingDifficulty').value = String(profile.difficulty);
    const challengePassed = result.challenge === 'none' || result.challenge === 'sprint' || result.challenge === 'endurance'
      || result.challenge === 'speed' && result.wpm >= Number(byId('typingTarget').value)
      || result.challenge === 'accuracy' && result.accuracy >= 99
      || result.challenge === 'perfect' && result.accuracy === 100 && !state.usedBackspace
      || result.challenge === 'no-backspace' && !state.usedBackspace;
    byId('typingStatus').textContent = result.challenge !== 'none' && !challengePassed ? 'Challenge not passed' : 'Test complete';
    byId('typingStart').disabled = false;
    byId('typingStart').textContent = 'Try again';
    byId('typingInput').disabled = true;
    byId('typingResults').classList.remove('hidden');
    renderAnalysis(result);
    updateProfile();
    updateCertificate(result);
    drawPrompt();
    updateMetrics();
  }

  function onInput() {
    if (!state.running) return;
    const input = byId('typingInput');
    let typed = [...input.value];
    const promptChars = [...state.prompt];
    if (typed.length > promptChars.length) { input.value = typed.slice(0, promptChars.length).join(''); typed = [...input.value]; }
    const previous = [...state.typed];
    state.typed = typed.join('');
    if (typed.length > previous.length) {
      for (let index = state.trackedLength; index < typed.length; index += 1) {
        const good = charsEqual(typed[index], promptChars[index]);
        state.presses.push({ key: keyName(typed[index]), correct: good, latency: 0, at: Date.now() });
        trackKey(typed[index], good, 0);
        if (!good) { state.errors += 1; state.wrongKeys += 1; } else state.correctKeys += 1;
        recordPairs(index, good, 0);
      }
    }
    state.trackedLength = typed.length;
    drawPrompt();
    updateMetrics();
    if (selectedMode() === 'words' && typed.length >= promptChars.length) finishSession();
    else if (typed.length >= promptChars.length) finishSession();
  }

  function updateProfile() {
    const best = Math.max(0, ...Object.values(profile.personalBests).map((item) => Number(item.wpm) || 0));
    const thisWeek = profile.history.filter((item) => Date.now() - new Date(item.date).getTime() < 7 * 86400000);
    const average = thisWeek.length ? Math.round(thisWeek.reduce((sum, item) => sum + item.wpm, 0) / thisWeek.length) : 0;
    byId('typingPb').textContent = best ? `${best} WPM` : '-- WPM';
    byId('typingWeekTests').textContent = String(thisWeek.length);
    byId('typingAverage').textContent = average ? `${average} WPM` : '-- WPM';
    byId('typingStreak').textContent = `${profile.streak} ${profile.streak === 1 ? 'day' : 'days'}`;
    byId('typingXp').textContent = `${profile.xp} XP`;
    byId('typingRank').textContent = profile.xp >= 5000 ? 'Legend' : profile.xp >= 2500 ? 'Master' : profile.xp >= 1200 ? 'Pro Typist' : profile.xp >= 500 ? 'Speed Typist' : profile.xp >= 200 ? 'Fast Learner' : 'Beginner';
    byId('typingProgress').innerHTML = thisWeek.slice(0, 7).map((item) => `<div class="typing-progress-item"><span>${new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' })} · ${item.mode}</span><b>${item.wpm} WPM</b></div>`).join('') || '<p class="muted">Complete a test to start your local history.</p>';
    byId('typingLeaderboard').innerHTML = profile.history.filter((item) => item.wpm > 0).slice().sort((a, b) => b.wpm - a.wpm).slice(0, 5).map((item, index) => `<div class="typing-leader-item"><span>#${index + 1} · Local score</span><b>${item.wpm} WPM</b></div>`).join('') || '<p class="muted">No scores yet.</p>';
    const badges = [];
    if (best >= 50) badges.push('50 WPM'); if (best >= 75) badges.push('75 WPM'); if (best >= 100) badges.push('100 WPM');
    if (profile.history.some((item) => item.accuracy >= 99)) badges.push('99% Accuracy');
    if (profile.history.length >= 10) badges.push('10 Tests'); if (profile.streak >= 7) badges.push('7 Day Streak');
    byId('typingBadges').innerHTML = badges.map((badge) => `<span class="typing-badge">${badge}</span>`).join('') || '<span class="muted">First badge at 50 WPM</span>';
    drawHistoryChart();
  }

  function drawHistoryChart() {
    const canvas = byId('typingHistoryChart');
    if (!canvas) return;
    const width = canvas.clientWidth || 260;
    const height = canvas.clientHeight || 110;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const context = canvas.getContext('2d');
    context.scale(ratio, ratio);
    context.clearRect(0, 0, width, height);
    const daily = new Map();
    profile.history.forEach((item) => {
      const day = item.date.slice(0, 10);
      if (!daily.has(day)) daily.set(day, []);
      daily.get(day).push(item.wpm);
    });
    const points = [...daily.entries()].slice(0, 7).reverse().map(([day, values]) => ({ day, wpm: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) }));
    context.strokeStyle = '#dfe5df';
    context.beginPath(); context.moveTo(22, height - 18); context.lineTo(width - 8, height - 18); context.stroke();
    if (!points.length) { context.fillStyle = '#6c7974'; context.font = '11px DM Sans, sans-serif'; context.fillText('Complete a test to see progress', 8, height / 2); return; }
    const max = Math.max(30, ...points.map((point) => point.wpm));
    context.strokeStyle = '#1e755c'; context.fillStyle = '#1e755c'; context.lineWidth = 2;
    context.beginPath();
    points.forEach((point, index) => {
      const x = 16 + index / Math.max(points.length - 1, 1) * (width - 32);
      const y = height - 23 - point.wpm / max * (height - 42);
      if (index) context.lineTo(x, y); else context.moveTo(x, y);
      context.fillRect(x - 2, y - 2, 4, 4);
    });
    context.stroke();
  }

  function dailyChallenge() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const number = Math.floor((now - start) / 86400000);
    byId('typingDaily').textContent = `Daily Challenge #${number} · 60 seconds · English · Punctuation. Your result stays on this device.`;
    byId('typingDailyStart').onclick = () => {
      byId('typingMode').value = 'time';
      configureLength();
      byId('typingLength').value = '60';
      byId('typingChallenge').value = 'none';
      byId('typingDifficulty').value = '3';
      resetSession(true);
      startSession();
    };
  }

  function updateCertificate(result) {
    byId('certificateSpeed').textContent = `${result.wpm} WPM`;
    byId('certificateDetails').textContent = `Accuracy ${result.accuracy}% · ${result.consistency}% consistency · ${result.mode} test`;
    byId('certificateDate').textContent = new Date(result.date).toLocaleDateString(undefined, { dateStyle: 'long' });
  }

  async function importPassage(file) {
    if (!file) return;
    try {
      let text;
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        if (!window.pdfjsLib) throw new Error('PDF reader is unavailable. Paste copied PDF text into the passage box instead.');
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const documentPdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        const pages = [];
        for (let pageNumber = 1; pageNumber <= documentPdf.numPages; pageNumber += 1) {
          const page = await documentPdf.getPage(pageNumber);
          const content = await page.getTextContent();
          pages.push(content.items.map((item) => item.str).join(' '));
        }
        text = pages.join('\n');
      } else text = await file.text();
      byId('typingCustomText').value = text.trim();
      byId('typingFileStatus').textContent = `Imported ${file.name} · ${text.trim().split(/\s+/).filter(Boolean).length} words`;
    } catch (error) { byId('typingFileStatus').textContent = error.message; }
  }

  function bind() {
    configureLength();
    const controls = document.querySelector('#utilityPanel .typing-controls');
    controls.insertAdjacentHTML('afterend', '<div class="typing-target"><div><strong id="typingTargetValue">60 WPM target</strong><span id="typingTargetGap">Current 0 · gap 60 WPM</span></div><span class="typing-target-track"><i id="typingTargetBar"></i></span></div>');
    const profileCard = document.querySelector('#utilityPanel .panel-grid > .card:nth-child(2)');
    profileCard.querySelector('.typing-side-stats').insertAdjacentHTML('beforeend', '<div><small>Experience points</small><strong id="typingXp">0 XP</strong></div><div><small>Current rank</small><strong id="typingRank">Beginner</strong></div>');
    profileCard.insertAdjacentHTML('beforeend', '<div class="typing-side-section"><h4>WPM by day</h4><canvas id="typingHistoryChart" height="110" aria-label="Recent WPM history"></canvas></div>');
    byId('typingDifficulty').value = String(profile.difficulty);
    if (selectedMode() === 'language') byId('typingLength').value = byId('typingLanguage').value;
    state.prompt = makePrompt();
    drawPrompt();
    drawKeyboard();
    updateProfile();
    dailyChallenge();
    byId('typingMode').onchange = () => { configureLength(); if (selectedMode() === 'language') byId('typingLength').value = byId('typingLanguage').value; resetSession(true); };
    byId('typingLength').onchange = () => { if (selectedMode() === 'language') byId('typingLanguage').value = selectedLength(); resetSession(true); };
    byId('typingDifficulty').onchange = () => resetSession(true);
    byId('typingChallenge').onchange = () => {
      if (byId('typingChallenge').value === 'sprint') { byId('typingMode').value = 'time'; configureLength(); byId('typingLength').value = '15'; }
      if (byId('typingChallenge').value === 'endurance') { byId('typingMode').value = 'time'; configureLength(); byId('typingLength').value = '300'; }
      resetSession(true);
    };
    byId('typingLanguage').onchange = () => {
      if (selectedMode() === 'language') { byId('typingLength').value = byId('typingLanguage').value; resetSession(true); }
    };
    byId('typingStart').onclick = startSession;
    byId('typingTarget').oninput = updateMetrics;
    byId('typingReset').onclick = () => resetSession(true);
    byId('typingInput').addEventListener('keydown', onKeyDown);
    byId('typingInput').addEventListener('input', onInput);
    byId('typingCustomText').addEventListener('input', () => {
      if (selectedMode() === 'custom' && !state.running) { state.prompt = makePrompt(); drawPrompt(); }
    });
    byId('typingUseCustom').onclick = () => {
      if (!byId('typingCustomText').value.trim()) { byId('typingFileStatus').textContent = 'Paste or import text before starting.'; return; }
      state.prompt = byId('typingCustomText').value.trim().slice(0, 12000);
      resetSession(false);
      byId('typingFileStatus').textContent = `${[...state.prompt].length} characters ready`;
    };
    byId('typingFile').onchange = (event) => importPassage(event.target.files[0]);
    byId('typingCertificate').onclick = () => {
      if (!state.finished) return;
      const name = window.prompt('Name for the certificate:', 'Typist');
      if (name === null) return;
      byId('certificateName').textContent = name.trim() || 'Typist';
      const certificate = byId('typingCertificatePage');
      certificate.classList.remove('hidden');
      document.body.classList.add('typing-certificate-print');
      window.print();
      window.setTimeout(() => { document.body.classList.remove('typing-certificate-print'); certificate.classList.add('hidden'); }, 500);
    };
    window.addEventListener('resize', drawChart, { passive: true });
    window.addEventListener('resize', drawHistoryChart, { passive: true });
    if (window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  window.initTypingTest = bind;
})();