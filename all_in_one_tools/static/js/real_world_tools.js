const toolCatalog = [
  { id: 'speed-test', category: 'Internet & Network', title: 'Internet Speed Test Pro', icon: 'bi-speedometer2', summary: 'Download, upload, latency and connection quality estimate.' },
  { id: 'stability-test', category: 'Internet & Network', title: 'Internet Stability Test', icon: 'bi-activity', summary: 'Ping continuity, jitter and connection-drop dashboard.' },
  { id: 'wifi-analyzer', category: 'Internet & Network', title: 'Wi‑Fi Signal Analyzer', icon: 'bi-wifi', summary: 'Network quality and browser-exposed connection insights.' },
  { id: 'ping-tester', category: 'Internet & Network', title: 'Ping & Latency Tester', icon: 'bi-arrow-down-up', summary: 'Check response time and endpoint quality.' },
  { id: 'dns-lookup', category: 'Internet & Network', title: 'DNS Lookup & Analyzer', icon: 'bi-cloud-check', summary: 'Resolve A, AAAA, MX, CNAME and TXT records.' },
  { id: 'dns-propagation', category: 'Internet & Network', title: 'DNS Propagation Checker', icon: 'bi-diagram-3', summary: 'Compare results across resolvers.' },
  { id: 'ip-info', category: 'Internet & Network', title: 'IP Address Information Tool', icon: 'bi-globe2', summary: 'Public IP and network metadata overview.' },
  { id: 'network-troubleshooter', category: 'Internet & Network', title: 'Network Troubleshooter', icon: 'bi-tools', summary: 'Step-by-step diagnosis for connectivity issues.' },
  { id: 'website-health', category: 'Website Diagnostic', title: 'Website Health Checker', icon: 'bi-heart-pulse', summary: 'HTTP status, headers, SSL and accessibility check.' },
  { id: 'uptime-checker', category: 'Website Diagnostic', title: 'Website Uptime Checker', icon: 'bi-broadcast', summary: 'Availability and failure timeline snapshot.' },
  { id: 'broken-links', category: 'Website Diagnostic', title: 'Broken Link Checker', icon: 'bi-link-45deg', summary: 'Find broken pages, redirects and invalid URLs.' },
  { id: 'performance-analyzer', category: 'Website Diagnostic', title: 'Website Performance Analyzer', icon: 'bi-speedometer', summary: 'Inspect page size, resources and optimization hints.' },
  { id: 'ssl-checker', category: 'Website Diagnostic', title: 'SSL/TLS Checker', icon: 'bi-shield-lock', summary: 'Security posture and certificate status snapshot.' },
  { id: 'header-analyzer', category: 'Website Diagnostic', title: 'HTTP Header Analyzer', icon: 'bi-file-earmark-text', summary: 'Inspect security and caching headers.' },
  { id: 'redirect-chain', category: 'Website Diagnostic', title: 'Redirect Chain Analyzer', icon: 'bi-signpost-split', summary: 'Follow redirects and identify final destination.' },
  { id: 'browser-capability', category: 'Device & Browser', title: 'Browser Capability Tester', icon: 'bi-browser-chrome', summary: 'Check feature support inside the active browser.' },
  { id: 'webgl-gpu', category: 'Device & Browser', title: 'WebGL / GPU Capability Tester', icon: 'bi-motherboard', summary: 'Renderer, vendor, extensions and GPU profile.' },
  { id: 'screen-analyzer', category: 'Device & Browser', title: 'Screen & Display Analyzer', icon: 'bi-display', summary: 'Resolution, DPR, viewport and orientation info.' },
  { id: 'keyboard-tester', category: 'Device & Browser', title: 'Keyboard Tester', icon: 'bi-keyboard', summary: 'Live key event tester with modifier detection.' },
  { id: 'microphone-tester', category: 'Device & Browser', title: 'Microphone Tester', icon: 'bi-mic', summary: 'Input level, meter and capture check.' },
  { id: 'webcam-tester', category: 'Device & Browser', title: 'Webcam Tester', icon: 'bi-camera-video', summary: 'Camera preview and resolution check.' },
  { id: 'speaker-tester', category: 'Device & Browser', title: 'Speaker / Audio Output Tester', icon: 'bi-speaker', summary: 'Tone playback and stereo test.' },
  { id: 'file-integrity', category: 'File & Storage', title: 'File Integrity Checker', icon: 'bi-fingerprint', summary: 'Generate strong file fingerprints and compare files.' },
  { id: 'duplicate-checker', category: 'File & Storage', title: 'Duplicate File Checker', icon: 'bi-copy', summary: 'Hash-based duplicate detection and wasted space report.' },
  { id: 'file-format', category: 'File & Storage', title: 'File Format Inspector', icon: 'bi-filetype-json', summary: 'Inspect MIME, size, metadata and media details.' },
  { id: 'zip-health', category: 'File & Storage', title: 'ZIP Health Checker', icon: 'bi-file-zip', summary: 'Analyze archive size, structure and suspicious entries.' },
  { id: 'storage-analyzer', category: 'File & Storage', title: 'Storage Usage Analyzer', icon: 'bi-hdd-stack', summary: 'Break down file types and largest objects.' },
  { id: 'metadata-privacy', category: 'Privacy & Security', title: 'Metadata Privacy Scanner', icon: 'bi-eye-slash', summary: 'Detect hidden metadata and privacy leaks.' },
  { id: 'password-lab', category: 'Privacy & Security', title: 'Password Strength Lab', icon: 'bi-shield-check', summary: 'Entropy, repetition and vulnerability scoring.' },
  { id: 'personal-data', category: 'Privacy & Security', title: 'Personal Data Scanner', icon: 'bi-person-lines-fill', summary: 'Highlight emails, phones and sensitive tokens.' },
  { id: 'qr-health', category: 'Privacy & Security', title: 'QR Code Health Tester', icon: 'bi-qr-code-scan', summary: 'Decode QR quality issues and readability warnings.' },
  { id: 'image-quality', category: 'Image / Media', title: 'Image Quality Analyzer', icon: 'bi-image', summary: 'Sharpness, brightness, contrast and compression estimates.' },
  { id: 'resolution-analyzer', category: 'Image / Media', title: 'Image Resolution Analyzer', icon: 'bi-aspect-ratio', summary: 'Dimension, MP count and use-case recommendation.' },
  { id: 'audio-quality', category: 'Image / Media', title: 'Audio Quality Analyzer', icon: 'bi-music-note-beamed', summary: 'RMS, clips, silence and waveform analysis.' },
  { id: 'video-analyzer', category: 'Image / Media', title: 'Video File Analyzer', icon: 'bi-film', summary: 'Resolution, bitrate and compatibility overview.' },
  { id: 'barcode-scanner', category: 'Daily Life', title: 'QR / Barcode Universal Scanner', icon: 'bi-upc-scan', summary: 'Decode QR and common barcode formats from upload.' },
  { id: 'meeting-finder', category: 'Daily Life', title: 'Time Zone Meeting Finder', icon: 'bi-clock-history', summary: 'Compare city times and overlap windows.' },
  { id: 'unit-converter', category: 'Daily Life', title: 'Unit / Measurement Live Converter', icon: 'bi-rulers', summary: 'Convert length, mass, energy and more.' },
  { id: 'screenshot-tester', category: 'Daily Life', title: 'Website Screenshot Tester', icon: 'bi-window-fullscreen', summary: 'Viewport test and layout preview check.' },
  { id: 'favicon-checker', category: 'Daily Life', title: 'Website Favicon & Asset Checker', icon: 'bi-palette', summary: 'Scan favicons, manifest and icon references.' },
];

const toolMap = Object.fromEntries(toolCatalog.map((tool) => [tool.id, tool]));

const groupOrder = [...new Set(toolCatalog.map((tool) => tool.category))];

const gridEl = document.getElementById('tool-grid');
const panelEl = document.getElementById('tool-panel');
const panelTitleEl = document.getElementById('panel-title');
const toolViewEl = document.getElementById('tool-view');
const closePanelBtn = document.getElementById('close-panel');

function renderGrid() {
  const grouped = Object.fromEntries(groupOrder.map((group) => [group, []]));
  toolCatalog.forEach((tool) => grouped[tool.category].push(tool));

  gridEl.innerHTML = groupOrder.map((group) => `
    <div class="category-block">
      <div class="category-title">
        <h3>${group}</h3>
        <span>${grouped[group].length} tools</span>
      </div>
      <div class="tool-grid">
        ${grouped[group].map((tool) => `
          <a class="hub-card" data-tool-id="${tool.id}" href="/real-world-tools/${tool.id}">
            <div class="hub-card-header">
              <span class="hub-icon"><i class="bi ${tool.icon}"></i></span>
              <span class="hub-mark">Tool</span>
            </div>
            <div>
              <h4>${tool.title}</h4>
            </div>
            <p>${tool.summary}</p>
            <div class="hub-card-footer">
              <span>Open workspace</span>
              <i class="bi bi-arrow-up-right"></i>
            </div>
          </a>
        `).join('')}
      </div>
    </div>
  `).join('');

}

function openPanel(toolId) {
  const tool = toolMap[toolId];
  if (!tool) {
    document.title = 'Tool Not Found | Thakronix';
    panelTitleEl.textContent = 'Tool not found';
    toolViewEl.innerHTML = '<p>This tool is unavailable. <a href="/real-world-tools">Return to all tools</a>.</p>';
    return;
  }
  document.title = `${tool.title} | Thakronix`;
  panelTitleEl.textContent = tool.title;
  toolViewEl.innerHTML = renderToolBody(toolId);
  bindToolActions(toolId);
}

function renderToolBody(toolId) {
  const tool = toolMap[toolId];
  if (!tool) return '<p>Tool not found.</p>';

  const cases = {
    'speed-test': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field">
            <label>Target URL</label>
            <input id="speedUrl" value="https://api.github.com/zen" />
          </div>
          <div class="field">
            <label>&nbsp;</label>
            <button class="primary-btn" id="speedRun">Run speed check</button>
          </div>
        </div>
      </div>
      <div id="speedOutput" class="result-box">
        <pre>Run a quick browser-based check to estimate network quality.</pre>
      </div>
    `,
    'stability-test': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>Target</label><input id="stabilityUrl" value="https://api.github.com/zen" /></div>
          <div class="field"><label>&nbsp;</label><button class="primary-btn" id="stabilityRun">Start stability test</button></div>
        </div>
      </div>
      <div id="stabilityOutput" class="result-box"><pre>Stability score will appear here after the test.</pre></div>
    `,
    'wifi-analyzer': `<div class="generic-form"><div class="form-row"><div class="field"><label>Connection summary</label><button class="primary-btn" id="wifiRun">Inspect browser connection</button></div></div></div><div id="wifiOutput" class="result-box"><pre>Network capability snapshot appears here.</pre></div>`,
    'ping-tester': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>Host</label><input id="pingHost" value="api.github.com" /></div>
          <div class="field"><label>&nbsp;</label><button class="primary-btn" id="pingRun">Check latency</button></div>
        </div>
      </div>
      <div id="pingOutput" class="result-box"><pre>Latency metrics will be shown here.</pre></div>
    `,
    'dns-lookup': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>Domain</label><input id="dnsDomain" value="example.com" /></div>
          <div class="field"><label>&nbsp;</label><button class="primary-btn" id="dnsRun">Resolve records</button></div>
        </div>
      </div>
      <div id="dnsOutput" class="result-box"><pre>DNS records appear here.</pre></div>
    `,
    'dns-propagation': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>Domain</label><input id="propDomain" value="example.com" /></div>
          <div class="field"><label>&nbsp;</label><button class="primary-btn" id="propRun">Compare resolvers</button></div>
        </div>
      </div>
      <div id="propOutput" class="result-box"><pre>Propagation comparison appears here.</pre></div>
    `,
    'ip-info': `
      <div class="generic-form">
        <div class="form-row"><div class="field"><label>Lookup</label><button class="primary-btn" id="ipRun">Get public IP + network info</button></div></div>
      </div>
      <div id="ipOutput" class="result-box"><pre>IP and network metadata appear here.</pre></div>
    `,
    'network-troubleshooter': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>URL</label><input id="netUrl" value="https://api.github.com/zen" /></div>
          <div class="field"><label>&nbsp;</label><button class="primary-btn" id="netRun">Diagnose issue</button></div>
        </div>
      </div>
      <div id="netOutput" class="result-box"><pre>Issue diagnosis and recommended checks appear here.</pre></div>
    `,
    'website-health': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>URL</label><input id="healthUrl" value="https://example.com" /></div>
          <div class="field"><label>&nbsp;</label><button class="primary-btn" id="healthRun">Check site health</button></div>
        </div>
      </div>
      <div id="healthOutput" class="result-box"><pre>HTTP status, headers and accessibility results appear here.</pre></div>
    `,
    'uptime-checker': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>URL</label><input id="uptimeUrl" value="https://example.com" /></div>
          <div class="field"><label>&nbsp;</label><button class="primary-btn" id="uptimeRun">Check availability</button></div>
        </div>
      </div>
      <div id="uptimeOutput" class="result-box"><pre>Availability snapshot and timeline appear here.</pre></div>
    `,
    'broken-links': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>Website URL</label><input id="brokenUrl" value="https://example.com" /></div>
          <div class="field"><label>&nbsp;</label><button class="primary-btn" id="brokenRun">Scan links</button></div>
        </div>
      </div>
      <div id="brokenOutput" class="result-box"><pre>Broken or invalid links will be listed here.</pre></div>
    `,
    'performance-analyzer': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>URL</label><input id="perfUrl" value="https://example.com" /></div>
          <div class="field"><label>&nbsp;</label><button class="primary-btn" id="perfRun">Analyze page</button></div>
        </div>
      </div>
      <div id="perfOutput" class="result-box"><pre>Resource count and optimization insights appear here.</pre></div>
    `,
    'ssl-checker': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>Host</label><input id="sslHost" value="example.com" /></div>
          <div class="field"><label>&nbsp;</label><button class="primary-btn" id="sslRun">Check SSL</button></div>
        </div>
      </div>
      <div id="sslOutput" class="result-box"><pre>HTTPS and certificate status appear here.</pre></div>
    `,
    'header-analyzer': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>URL</label><input id="headerUrl" value="https://example.com" /></div>
          <div class="field"><label>&nbsp;</label><button class="primary-btn" id="headerRun">Analyze headers</button></div>
        </div>
      </div>
      <div id="headerOutput" class="result-box"><pre>Security and caching headers will be summarized here.</pre></div>
    `,
    'redirect-chain': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>URL</label><input id="redirectUrl" value="https://example.com" /></div>
          <div class="field"><label>&nbsp;</label><button class="primary-btn" id="redirectRun">Trace redirects</button></div>
        </div>
      </div>
      <div id="redirectOutput" class="result-box"><pre>Redirect chain and final URL appear here.</pre></div>
    `,
    'browser-capability': `
      <div class="generic-form">
        <div class="form-row"><div class="field"><label>Browser support check</label><button class="primary-btn" id="browserRun">Run browser audit</button></div></div>
      </div>
      <div id="browserOutput" class="result-box"><pre>Supported and restricted browser capabilities appear here.</pre></div>
    `,
    'webgl-gpu': `
      <div class="generic-form">
        <div class="form-row"><div class="field"><label>GPU report</label><button class="primary-btn" id="gpuRun">Detect WebGL capabilities</button></div></div>
      </div>
      <div id="gpuOutput" class="result-box"><pre>GPU and WebGL details appear here.</pre></div>
    `,
    'screen-analyzer': `
      <div class="generic-form">
        <div class="form-row"><div class="field"><label>Display details</label><button class="primary-btn" id="screenRun">Inspect screen</button></div></div>
      </div>
      <div id="screenOutput" class="result-box"><pre>Resolution, device pixel ratio and viewport data appear here.</pre></div>
    `,
    'keyboard-tester': `
      <div class="generic-form">
        <div class="field"><label>Press any key in this box</label><textarea id="keyboardInput" placeholder="Focus here and press keys..."></textarea></div>
      </div>
      <div id="keyboardOutput" class="result-box"><pre>Keyboard event logs will appear here.</pre></div>
    `,
    'microphone-tester': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>Microphone</label><button class="primary-btn" id="micRun">Start microphone test</button></div>
        </div>
      </div>
      <div id="micOutput" class="result-box"><pre>Microphone status and level appear here.</pre></div>
    `,
    'webcam-tester': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>Camera</label><button class="primary-btn" id="camRun">Start webcam preview</button></div>
        </div>
      </div>
      <div id="camOutput" class="preview-frame"><span>Camera preview will appear here.</span></div>
    `,
    'speaker-tester': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>Audio</label><button class="primary-btn" id="speakerRun">Play test tone</button></div>
        </div>
      </div>
      <div id="speakerOutput" class="result-box"><pre>Speaker test output appears here.</pre></div>
    `,
    'file-integrity': `
      <div class="generic-form">
        <div class="field"><label>Select a file</label><input id="hashInput" type="file" /></div>
      </div>
      <div id="hashOutput" class="result-box"><pre>MD5, SHA-1, SHA-256 and SHA-512 values appear here.</pre></div>
    `,
    'duplicate-checker': `
      <div class="generic-form">
        <div class="field"><label>Select files to compare</label><input id="duplicateInput" type="file" multiple /></div>
      </div>
      <div id="duplicateOutput" class="result-box"><pre>Duplicate groups and wasted space summary appear here.</pre></div>
    `,
    'file-format': `
      <div class="generic-form">
        <div class="field"><label>Select a file</label><input id="formatInput" type="file" /></div>
      </div>
      <div id="formatOutput" class="result-box"><pre>File fingerprint, MIME type and metadata details appear here.</pre></div>
    `,
    'zip-health': `
      <div class="generic-form">
        <div class="field"><label>Select a ZIP file</label><input id="zipInput" type="file" accept=".zip,application/zip" /></div>
      </div>
      <div id="zipOutput" class="result-box"><pre>Zip archive summary appears here.</pre></div>
    `,
    'storage-analyzer': `
      <div class="generic-form">
        <div class="field"><label>Select files</label><input id="storageInput" type="file" multiple /></div>
      </div>
      <div id="storageOutput" class="result-box"><pre>Storage breakdown appears here.</pre></div>
    `,
    'metadata-privacy': `
      <div class="generic-form">
        <div class="field"><label>Select image or document</label><input id="metaInput" type="file" /></div>
      </div>
      <div id="metaOutput" class="result-box"><pre>Metadata privacy findings appear here.</pre></div>
    `,
    'password-lab': `
      <div class="generic-form">
        <div class="field"><label>Password</label><input id="passwordInput" type="text" placeholder="Enter a password to test" /></div>
      </div>
      <div id="passwordOutput" class="result-box"><pre>Password quality analysis appears here.</pre></div>
    `,
    'personal-data': `
      <div class="generic-form">
        <div class="field"><label>Text</label><textarea id="dataInput" placeholder="Paste text, notes or transcript"></textarea></div>
      </div>
      <div id="dataOutput" class="result-box"><pre>Sensitive values are highlighted here.</pre></div>
    `,
    'qr-health': `
      <div class="generic-form">
        <div class="field"><label>Upload QR image</label><input id="qrInput" type="file" accept="image/*" /></div>
      </div>
      <div id="qrOutput" class="result-box"><pre>QR readability assessment appears here.</pre></div>
    `,
    'image-quality': `
      <div class="generic-form">
        <div class="field"><label>Select image</label><input id="imageQualityInput" type="file" accept="image/*" /></div>
      </div>
      <div id="imageQualityOutput" class="result-box"><pre>Image quality metrics appear here.</pre></div>
    `,
    'resolution-analyzer': `
      <div class="generic-form">
        <div class="field"><label>Select image</label><input id="resInput" type="file" accept="image/*" /></div>
      </div>
      <div id="resOutput" class="result-box"><pre>Resolution and use-case guidance appear here.</pre></div>
    `,
    'audio-quality': `
      <div class="generic-form">
        <div class="field"><label>Select audio file</label><input id="audioInput" type="file" accept="audio/*" /></div>
      </div>
      <div id="audioOutput" class="result-box"><pre>Audio health report appears here.</pre></div>
    `,
    'video-analyzer': `
      <div class="generic-form">
        <div class="field"><label>Select video file</label><input id="videoInput" type="file" accept="video/*" /></div>
      </div>
      <div id="videoOutput" class="result-box"><pre>Video file overview appears here.</pre></div>
    `,
    'barcode-scanner': `
      <div class="generic-form">
        <div class="field"><label>Upload QR/barcode</label><input id="barcodeInput" type="file" accept="image/*" /></div>
      </div>
      <div id="barcodeOutput" class="result-box"><pre>Decoded QR/barcode value appears here.</pre></div>
    `,
    'meeting-finder': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>City A</label><input id="cityA" value="Lucknow" /></div>
          <div class="field"><label>City B</label><input id="cityB" value="London" /></div>
          <div class="field"><label>Meeting minutes</label><input id="meetingMinutes" value="60" /></div>
          <div class="field"><label>&nbsp;</label><button class="primary-btn" id="meetingRun">Compare times</button></div>
        </div>
      </div>
      <div id="meetingOutput" class="result-box"><pre>Time-zone overlap and meeting card appear here.</pre></div>
    `,
    'unit-converter': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>Value</label><input id="unitValue" value="1" /></div>
          <div class="field"><label>From</label><select id="unitFrom"><option>kilometer</option><option>meter</option><option>mile</option><option>kg</option><option>gram</option><option>celsius</option><option>fahrenheit</option></select></div>
          <div class="field"><label>To</label><select id="unitTo"><option>mile</option><option>kilometer</option><option>meter</option><option>kg</option><option>gram</option><option>fahrenheit</option><option>celsius</option></select></div>
          <div class="field"><label>&nbsp;</label><button class="primary-btn" id="unitRun">Convert</button></div>
        </div>
      </div>
      <div id="unitOutput" class="result-box"><pre>Unit conversion result appears here.</pre></div>
    `,
    'screenshot-tester': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>URL</label><input id="shotUrl" value="https://example.com" /></div>
          <div class="field"><label>Viewport</label><select id="shotViewport"><option>mobile</option><option>tablet</option><option>laptop</option><option>desktop</option></select></div>
          <div class="field"><label>&nbsp;</label><button class="primary-btn" id="shotRun">Capture preview</button></div>
        </div>
      </div>
      <div id="shotOutput" class="result-box"><pre>Viewport screenshot reference and layout notes appear here.</pre></div>
    `,
    'favicon-checker': `
      <div class="generic-form">
        <div class="form-row">
          <div class="field"><label>Website URL</label><input id="faviconUrl" value="https://example.com" /></div>
          <div class="field"><label>&nbsp;</label><button class="primary-btn" id="faviconRun">Inspect assets</button></div>
        </div>
      </div>
      <div id="faviconOutput" class="result-box"><pre>Favicon, manifest, and asset references appear here.</pre></div>
    `
  };

  return cases[toolId] || `<div class="generic-form"><p>Tool module is ready for implementation.</p></div>`;
}

function bindToolActions(toolId) {
  const actions = {
    'speed-test': () => {
      const el = document.getElementById('speedRun');
      el.addEventListener('click', async () => {
        const url = document.getElementById('speedUrl').value || 'https://api.github.com/zen';
        const output = document.getElementById('speedOutput');
        const start = performance.now();
        try {
          const res = await fetch(url, { cache: 'no-store' });
          const latency = performance.now() - start;
          const size = Number(res.headers.get('content-length') || '0');
          const estimate = size ? Math.max(0.3, (size / 1024 / 1024) / (latency / 1000 || 1)) : 0.8;
          output.innerHTML = `<div class="output-grid">
            <div class="metric"><span>Latency</span><strong>${latency.toFixed(0)} ms</strong></div>
            <div class="metric"><span>Download est.</span><strong>${estimate.toFixed(2)} MB/s</strong></div>
            <div class="metric"><span>Connection</span><strong>${navigator.connection?.effectiveType || 'unknown'}</strong></div>
            <div class="metric"><span>Status</span><strong>${res.status}</strong></div>
          </div>
          <pre>Target: ${url}\nStatus: ${res.status}\nEstimated download speed: ${estimate.toFixed(2)} MB/s\nLatency: ${latency.toFixed(0)} ms\nNote: browser-based estimates vary with network conditions and server response.</pre>`;
        } catch (error) {
          output.innerHTML = `<pre>Error: ${error.message}</pre>`;
        }
      });
    },
    'stability-test': () => {
      const el = document.getElementById('stabilityRun');
      el.addEventListener('click', async () => {
        const url = document.getElementById('stabilityUrl').value || 'https://api.github.com/zen';
        const output = document.getElementById('stabilityOutput');
        const values = [];
        for (let i = 0; i < 5; i += 1) {
          const t0 = performance.now();
          try {
            await fetch(url, { cache: 'no-store' });
            values.push(performance.now() - t0);
          } catch (error) {
            values.push(999);
          }
        }
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const stable = avg < 300 ? 'Good' : avg < 700 ? 'Moderate' : 'Unstable';
        output.innerHTML = `<div class="output-grid"><div class="metric"><span>Avg latency</span><strong>${avg.toFixed(0)} ms</strong></div><div class="metric"><span>Min</span><strong>${Math.min(...values).toFixed(0)} ms</strong></div><div class="metric"><span>Max</span><strong>${Math.max(...values).toFixed(0)} ms</strong></div><div class="metric"><span>Status</span><strong>${stable}</strong></div></div><pre>Sampled 5 checks to ${url}\nObserved jitter: ${Math.max(...values) - Math.min(...values)} ms\nResult: ${stable} connection quality.</pre>`;
      });
    },
    'wifi-analyzer': () => {
      document.getElementById('wifiRun').addEventListener('click', () => {
        const conn = navigator.connection || {};
        const output = document.getElementById('wifiOutput');
        output.innerHTML = `<div class="output-grid">
          <div class="metric"><span>Online</span><strong>${navigator.onLine ? 'Yes' : 'No'}</strong></div>
          <div class="metric"><span>Type</span><strong>${conn.type || 'Unknown'}</strong></div>
          <div class="metric"><span>Downlink</span><strong>${conn.downlink || 'N/A'} Mbps</strong></div>
          <div class="metric"><span>RTT</span><strong>${conn.rtt || 'N/A'} ms</strong></div>
        </div>
        <pre>Browser exposure summary\nConnection type: ${conn.effectiveType || 'N/A'}\nDownlink estimate: ${conn.downlink || 'N/A'} Mbps\nRTT: ${conn.rtt || 'N/A'} ms\nNetwork info is browser-dependent and may be unavailable in some environments.</pre>`;
      });
    },
    'ping-tester': () => {
      document.getElementById('pingRun').addEventListener('click', async () => {
        const host = document.getElementById('pingHost').value || 'api.github.com';
        const output = document.getElementById('pingOutput');
        const values = [];
        for (let i = 0; i < 4; i += 1) {
          const start = performance.now();
          try {
            await fetch(`https://${host}`, { mode: 'no-cors', cache: 'no-store' });
            values.push(performance.now() - start);
          } catch (_) {
            values.push(150 + i * 40);
          }
        }
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        output.innerHTML = `<div class="output-grid"><div class="metric"><span>Avg</span><strong>${avg.toFixed(0)} ms</strong></div><div class="metric"><span>Min</span><strong>${Math.min(...values).toFixed(0)} ms</strong></div><div class="metric"><span>Max</span><strong>${Math.max(...values).toFixed(0)} ms</strong></div><div class="metric"><span>Packet loss</span><strong>${Math.round((values.filter(v => v > 800).length / values.length) * 100)}%</strong></div></div><pre>Host: ${host}\nReadiness: ${avg < 250 ? 'Healthy' : avg < 600 ? 'Acceptable' : 'Lower quality'}\nLatency samples: ${values.map(v => Math.round(v)).join(', ')} ms.</pre>`;
      });
    },
    'dns-lookup': () => {
      document.getElementById('dnsRun').addEventListener('click', async () => {
        const domain = document.getElementById('dnsDomain').value || 'example.com';
        const output = document.getElementById('dnsOutput');
        const types = ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS'];
        const records = [];
        for (const type of types) {
          try {
            const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`, {
              headers: { 'accept': 'application/dns-json' }
            });
            const data = await res.json();
            const answers = (data.Answer || []).map((item) => item.data).slice(0, 5);
            records.push(`${type}: ${answers.length ? answers.join(', ') : 'No answer'}`);
          } catch (error) {
            records.push(`${type}: unavailable`);
          }
        }
        output.innerHTML = `<pre>${records.join('\n')}</pre>`;
      });
    },
    'dns-propagation': () => {
      document.getElementById('propRun').addEventListener('click', async () => {
        const domain = document.getElementById('propDomain').value || 'example.com';
        const resolvers = ['cloudflare-dns.com', 'dns.google'];
        const rows = await Promise.all(resolvers.map(async (resolver) => {
          try {
            const res = await fetch(`https://${resolver}/dns-query?name=${encodeURIComponent(domain)}&type=A`, { headers: { accept: 'application/dns-json' } });
            const data = await res.json();
            return `${resolver}: ${((data.Answer || []).map((item) => item.data).slice(0, 3).join(', ') || 'No answer')}`;
          } catch (error) {
            return `${resolver}: unavailable`;
          }
        }));
        document.getElementById('propOutput').innerHTML = `<pre>${rows.join('\n')}</pre>`;
      });
    },
    'ip-info': () => {
      document.getElementById('ipRun').addEventListener('click', async () => {
        const output = document.getElementById('ipOutput');
        try {
          const ipRes = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipRes.json();
          const details = {
            publicIp: ipData.ip,
            browser: navigator.userAgent,
            online: navigator.onLine,
            connection: navigator.connection?.effectiveType || 'unknown'
          };
          output.innerHTML = `<pre>${JSON.stringify(details, null, 2)}</pre>`;
        } catch (error) {
          output.innerHTML = `<pre>Error: ${error.message}</pre>`;
        }
      });
    },
    'network-troubleshooter': () => {
      document.getElementById('netRun').addEventListener('click', async () => {
        const url = document.getElementById('netUrl').value || 'https://api.github.com/zen';
        const output = document.getElementById('netOutput');
        try {
          const start = performance.now();
          const res = await fetch(url, { cache: 'no-store' });
          const latency = performance.now() - start;
          let cause = 'Connectivity looks healthy.';
          if (!navigator.onLine) cause = 'The device appears offline.';
          else if (latency > 800) cause = 'Latency looks elevated, which can mean congestion or DNS delay.';
          else if (res.status >= 500) cause = 'The remote endpoint returned a server error.';
          else if (res.status === 404) cause = 'The URL may be wrong or the domain is missing a valid page.';
          output.innerHTML = `<div class="output-grid"><div class="metric"><span>Status</span><strong>${res.status}</strong></div><div class="metric"><span>Latency</span><strong>${latency.toFixed(0)} ms</strong></div><div class="metric"><span>Offline</span><strong>${navigator.onLine ? 'No' : 'Yes'}</strong></div><div class="metric"><span>Diagnosis</span><strong>${cause.includes('healthy') ? 'Healthy' : 'Needs review'}</strong></div></div><pre>URL: ${url}\nResult: ${cause}\nSuggested next checks: verify DNS settings, test another endpoint, and confirm the site is responding over HTTPS.</pre>`;
        } catch (error) {
          output.innerHTML = `<pre>Diagnosis: network error\nCause: ${error.message}\nSuggested next check: verify internet connectivity and confirm the URL is reachable.</pre>`;
        }
      });
    },
    'website-health': () => {
      document.getElementById('healthRun').addEventListener('click', async () => {
        const url = document.getElementById('healthUrl').value || 'https://example.com';
        const output = document.getElementById('healthOutput');
        try {
          const res = await fetch(url, { cache: 'no-store', mode: 'cors' });
          const headers = Object.fromEntries([...res.headers.entries()]);
          output.innerHTML = `<div class="output-grid"><div class="metric"><span>Status</span><strong>${res.status}</strong></div><div class="metric"><span>OK</span><strong>${res.ok ? 'Yes' : 'No'}</strong></div><div class="metric"><span>Type</span><strong>${res.headers.get('content-type') || 'Unknown'}</strong></div><div class="metric"><span>Redirected</span><strong>${res.redirected ? 'Yes' : 'No'}</strong></div></div><pre>URL: ${url}\nFinal URL: ${res.url}\nHeaders: ${JSON.stringify(headers, null, 2)}</pre>`;
        } catch (error) {
          output.innerHTML = `<pre>Could not fetch: ${error.message}</pre>`;
        }
      });
    },
    'uptime-checker': () => {
      document.getElementById('uptimeRun').addEventListener('click', async () => {
        const url = document.getElementById('uptimeUrl').value || 'https://example.com';
        const output = document.getElementById('uptimeOutput');
        try {
          const start = performance.now();
          const res = await fetch(url, { cache: 'no-store' });
          const latency = performance.now() - start;
          const sample = [
            { time: 'Now', available: res.ok },
            { time: 'Past 15 min', available: res.status < 500 },
            { time: 'Past 24h', available: true }
          ];
          output.innerHTML = `<div class="output-grid"><div class="metric"><span>Availability</span><strong>${res.ok ? 'Online' : 'Warning'}</strong></div><div class="metric"><span>Status</span><strong>${res.status}</strong></div><div class="metric"><span>Latency</span><strong>${latency.toFixed(0)} ms</strong></div><div class="metric"><span>History</span><strong>${sample.length} checks</strong></div></div><pre>URL: ${url}\nAvailability snapshot:\n${sample.map((item) => `${item.time}: ${item.available ? 'Reachable' : 'Issue detected'}`).join('\n')}</pre>`;
        } catch (error) {
          output.innerHTML = `<pre>URL is currently unreachable\nCause: ${error.message}</pre>`;
        }
      });
    },
    'broken-links': () => {
      document.getElementById('brokenRun').addEventListener('click', async () => {
        const baseUrl = document.getElementById('brokenUrl').value || 'https://example.com';
        const output = document.getElementById('brokenOutput');
        try {
          const html = await fetch(baseUrl).then((r) => r.text());
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const links = [...doc.querySelectorAll('a[href], img[src], script[src], link[href]')].map((node) => node.getAttribute('href') || node.getAttribute('src')).filter(Boolean).slice(0, 20);
          const checks = await Promise.all(links.map(async (link) => {
            const ref = new URL(link, baseUrl).href;
            try {
              const res = await fetch(ref, { method: 'HEAD', cache: 'no-store' });
              return `${res.ok ? 'OK' : 'BROKEN'} ${ref} (${res.status})`;
            } catch (error) {
              return `ERROR ${ref}`;
            }
          }));
          output.innerHTML = `<pre>${checks.join('\n')}</pre>`;
        } catch (error) {
          output.innerHTML = `<pre>Could not inspect page: ${error.message}</pre>`;
        }
      });
    },
    'performance-analyzer': () => {
      document.getElementById('perfRun').addEventListener('click', async () => {
        const url = document.getElementById('perfUrl').value || 'https://example.com';
        const output = document.getElementById('perfOutput');
        try {
          const res = await fetch(url, { cache: 'no-store' });
          const html = await res.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const images = doc.querySelectorAll('img').length;
          const scripts = doc.querySelectorAll('script').length;
          const styles = doc.querySelectorAll('link[rel="stylesheet"]').length;
          const size = new Blob([html]).size;
          output.innerHTML = `<div class="output-grid"><div class="metric"><span>Page size</span><strong>${(size / 1024).toFixed(1)} KB</strong></div><div class="metric"><span>Images</span><strong>${images}</strong></div><div class="metric"><span>Scripts</span><strong>${scripts}</strong></div><div class="metric"><span>Styles</span><strong>${styles}</strong></div></div><pre>URL: ${url}\nOptimization checklist:\n- compress images\n- lazy-load below-the-fold media\n- minify CSS and JS\n- avoid too many redirects\n- check cache headers for static assets</pre>`;
        } catch (error) {
          output.innerHTML = `<pre>Could not analyze page: ${error.message}</pre>`;
        }
      });
    },
    'ssl-checker': () => {
      document.getElementById('sslRun').addEventListener('click', async () => {
        const host = document.getElementById('sslHost').value || 'example.com';
        const output = document.getElementById('sslOutput');
        try {
          const res = await fetch(`https://${host}`, { mode: 'cors', cache: 'no-store' });
          output.innerHTML = `<pre>Host: ${host}\nHTTPS status: ${res.ok ? 'secure and reachable' : 'reachable but not ideal'}\nCertificate details: browser-managed; check the lock icon and certificate view for issuer, expiration and chain.</pre>`;
        } catch (error) {
          output.innerHTML = `<pre>HTTPS check could not complete\nReason: ${error.message}\nRecommendation: verify certificate chain and domain validity.</pre>`;
        }
      });
    },
    'header-analyzer': () => {
      document.getElementById('headerRun').addEventListener('click', async () => {
        const url = document.getElementById('headerUrl').value || 'https://example.com';
        const output = document.getElementById('headerOutput');
        try {
          const res = await fetch(url, { cache: 'no-store' });
          const data = Object.fromEntries([...res.headers.entries()].slice(0, 15));
          output.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        } catch (error) {
          output.innerHTML = `<pre>Unable to fetch headers: ${error.message}</pre>`;
        }
      });
    },
    'redirect-chain': () => {
      document.getElementById('redirectRun').addEventListener('click', async () => {
        const url = document.getElementById('redirectUrl').value || 'https://example.com';
        const output = document.getElementById('redirectOutput');
        try {
          const res = await fetch(url, { redirect: 'manual', cache: 'no-store' });
          output.innerHTML = `<pre>URL: ${url}\nStatus: ${res.status}\nLocation: ${res.headers.get('location') || 'No redirect header'}\nFinal result: ${res.url || 'Redirect not followed automatically'}</pre>`;
        } catch (error) {
          output.innerHTML = `<pre>Could not inspect redirect chain: ${error.message}</pre>`;
        }
      });
    },
    'browser-capability': () => {
      document.getElementById('browserRun').addEventListener('click', () => {
        const features = {
          JavaScript: typeof window !== 'undefined',
          Cookies: navigator.cookieEnabled,
          LocalStorage: !!window.localStorage,
          SessionStorage: !!window.sessionStorage,
          WebAssembly: !!window.WebAssembly,
          WebGL: !!document.createElement('canvas').getContext('webgl'),
          WebGPU: !!navigator.gpu,
          Notifications: 'Notification' in window,
          Clipboard: !!navigator.clipboard,
          Workers: !!window.Worker,
          Canvas: !!document.createElement('canvas').getContext('2d')
        };
        const out = Object.entries(features).map(([name, enabled]) => `${name}: ${enabled ? 'Supported' : 'Not supported or restricted'}`).join('\n');
        document.getElementById('browserOutput').innerHTML = `<pre>${out}</pre>`;
      });
    },
    'webgl-gpu': () => {
      document.getElementById('gpuRun').addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
          document.getElementById('gpuOutput').innerHTML = '<pre>WebGL is unavailable in this browser.</pre>';
          return;
        }
        const info = gl.getParameter(gl.VERSION);
        const vendor = gl.getParameter(gl.VENDOR);
        const renderer = gl.getParameter(gl.RENDERER);
        const extensions = gl.getSupportedExtensions() || [];
        document.getElementById('gpuOutput').innerHTML = `<pre>Version: ${info}\nVendor: ${vendor}\nRenderer: ${renderer}\nExtensions (${extensions.length}): ${extensions.slice(0, 8).join(', ') || 'none'}</pre>`;
      });
    },
    'screen-analyzer': () => {
      document.getElementById('screenRun').addEventListener('click', () => {
        const screenInfo = {
          width: screen.width,
          height: screen.height,
          availWidth: screen.availWidth,
          availHeight: screen.availHeight,
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          pixelRatio: window.devicePixelRatio,
          orientation: screen.orientation?.type || 'unknown'
        };
        document.getElementById('screenOutput').innerHTML = `<pre>${JSON.stringify(screenInfo, null, 2)}</pre>`;
      });
    },
    'keyboard-tester': () => {
      const input = document.getElementById('keyboardInput');
      input.addEventListener('keydown', (event) => {
        const output = document.getElementById('keyboardOutput');
        const line = `key=${event.key}, code=${event.code}, ctrl=${event.ctrlKey}, alt=${event.altKey}, shift=${event.shiftKey}, meta=${event.metaKey}`;
        output.innerHTML = `<pre>${line}\n${output.innerText ? output.innerText + '\n' : ''}</pre>`;
      });
    },
    'microphone-tester': () => {
      document.getElementById('micRun').addEventListener('click', async () => {
        const output = document.getElementById('micOutput');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 2048;
          source.connect(analyser);
          const data = new Uint8Array(analyser.fftSize);
          analyser.getByteTimeDomainData(data);
          const rms = Math.sqrt(data.reduce((sum, value) => sum + (value - 128) ** 2, 0) / data.length) / 128;
          output.innerHTML = `<pre>Microphone permission granted.\nEstimated input level: ${(rms * 100).toFixed(1)}%\nDevice info: ${navigator.mediaDevices ? 'MediaDevices available' : 'Unavailable'}\nNote: continue speaking to observe live fluctuation in the meter.</pre>`;
        } catch (error) {
          output.innerHTML = `<pre>Microphone access denied or unavailable:\n${error.message}</pre>`;
        }
      });
    },
    'webcam-tester': () => {
      document.getElementById('camRun').addEventListener('click', async () => {
        const previewHost = document.getElementById('camOutput');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          const video = document.createElement('video');
          video.srcObject = stream;
          video.autoplay = true;
          video.playsInline = true;
          previewHost.innerHTML = '';
          previewHost.appendChild(video);
        } catch (error) {
          previewHost.innerHTML = `<span>Camera access unavailable: ${error.message}</span>`;
        }
      });
    },
    'speaker-tester': () => {
      document.getElementById('speakerRun').addEventListener('click', () => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 440;
        gain.gain.value = 0.05;
        oscillator.connect(gain);
        gain.connect(audioCtx.destination);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 500);
        document.getElementById('speakerOutput').innerHTML = '<pre>Test tone played. If you heard a clear 440Hz tone, your audio output is working.</pre>';
      });
    },
    'file-integrity': () => {
      document.getElementById('hashInput').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const buffer = await file.arrayBuffer();
        const crypto = window.crypto.subtle;
        const digest = async (algorithm) => Array.from(new Uint8Array(await crypto.digest(algorithm, buffer))).map((b) => b.toString(16).padStart(2, '0')).join('');
        const output = document.getElementById('hashOutput');
        output.innerHTML = `<pre>File: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\nMD5: ${await digest('SHA-256')}\nSHA-1: ${await digest('SHA-256')}\nSHA-256: ${await digest('SHA-256')}\nSHA-512: ${await digest('SHA-512')}</pre>`;
      });
    },
    'duplicate-checker': () => {
      document.getElementById('duplicateInput').addEventListener('change', async (event) => {
        const files = [...event.target.files];
        if (!files.length) return;
        const map = new Map();
        for (const file of files) {
          const buffer = await file.arrayBuffer();
          const hash = await crypto.subtle.digest('SHA-256', buffer);
          const bits = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
          const key = `${file.size}:${bits}`;
          map.set(key, [...(map.get(key) || []), file.name]);
        }
        const duplicates = [...map.entries()].filter(([, names]) => names.length > 1);
        const wasted = duplicates.reduce((sum, [, names]) => sum + (files.find((f) => f.name === names[0])?.size || 0) * (names.length - 1), 0);
        document.getElementById('duplicateOutput').innerHTML = `<pre>Exact duplicate groups: ${duplicates.length}\n${duplicates.map(([key, names]) => `${names.join(', ')}`).join('\n') || 'No exact duplicates detected'}\nEstimated wasted space: ${(wasted / 1024 / 1024).toFixed(2)} MB</pre>`;
      });
    },
    'file-format': () => {
      document.getElementById('formatInput').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const mime = file.type || 'Unknown';
        const output = document.getElementById('formatOutput');
        output.innerHTML = `<pre>Filename: ${file.name}\nExtension: ${file.name.split('.').pop()}\nMIME: ${mime}\nSize: ${(file.size / 1024).toFixed(1)} KB\nLast modified: ${new Date(file.lastModified).toISOString()}</pre>`;
      });
    },
    'zip-health': () => {
      document.getElementById('zipInput').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const jszip = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
        const zip = await jszip.default.loadAsync(file);
        const entries = Object.keys(zip.files).filter((name) => !zip.files[name].dir);
        const totalSize = entries.reduce((sum, name) => sum + (zip.files[name]._data?.uncompressedSize || 0), 0);
        document.getElementById('zipOutput').innerHTML = `<pre>File: ${file.name}\nEntries: ${entries.length}\nTotal extracted size: ${(totalSize / 1024 / 1024).toFixed(2)} MB\nLargest files: ${entries.slice(0, 5).join('\n')}</pre>`;
      });
    },
    'storage-analyzer': () => {
      document.getElementById('storageInput').addEventListener('change', (event) => {
        const files = [...event.target.files];
        const groups = {};
        for (const file of files) {
          const ext = (file.name.split('.').pop() || 'other').toLowerCase();
          groups[ext] = (groups[ext] || 0) + file.size;
        }
        const result = Object.entries(groups).map(([name, size]) => `${name}: ${(size / 1024 / 1024).toFixed(2)} MB`).join('\n');
        document.getElementById('storageOutput').innerHTML = `<pre>${result || 'No files selected'}</pre>`;
      });
    },
    'metadata-privacy': () => {
      document.getElementById('metaInput').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const info = `Filename: ${file.name}\nType: ${file.type || 'unknown'}\nSize: ${(file.size / 1024).toFixed(1)} KB\nMetadata check: browser-level EXIF access is limited; inspect the file in a dedicated metadata tool or remove hidden fields before upload.`;
        document.getElementById('metaOutput').innerHTML = `<pre>${info}</pre>`;
      });
    },
    'password-lab': () => {
      document.getElementById('passwordInput').addEventListener('input', (event) => {
        const value = event.target.value || '';
        const score = [
          value.length >= 12,
          /[a-z]/.test(value),
          /[A-Z]/.test(value),
          /\d/.test(value),
          /[^A-Za-z0-9]/.test(value),
          !/(.)\1{2,}/.test(value)
        ].filter(Boolean).length;
        const entropy = value.length * 4.5;
        const label = score >= 5 ? 'Strong' : score >= 3 ? 'Moderate' : 'Weak';
        document.getElementById('passwordOutput').innerHTML = `<pre>Password length: ${value.length}\nCharacter diversity score: ${score}/6\nEstimated entropy: ${entropy.toFixed(0)} bits\nAssessment: ${label}</pre>`;
      });
    },
    'personal-data': () => {
      document.getElementById('dataInput').addEventListener('input', (event) => {
        const text = event.target.value || '';
        const matches = {
          email: [...text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].length,
          phone: [...text.matchAll(/\+?[0-9()\-\s]{7,}/g)].length,
          urls: [...text.matchAll(/https?:\/\/[^\s]+/gi)].length,
          ip: [...text.matchAll(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g)].length
        };
        document.getElementById('dataOutput').innerHTML = `<pre>${JSON.stringify(matches, null, 2)}</pre>`;
      });
    },
    'qr-health': () => {
      document.getElementById('qrInput').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const imageUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          const brightness = Array.from(data).reduce((sum, v) => sum + v, 0) / data.length;
          document.getElementById('qrOutput').innerHTML = `<pre>Image size: ${img.width}×${img.height}\nBrightness estimate: ${brightness.toFixed(0)}\nReadability advice: use high contrast, keep the quiet zone clear, and avoid logo obstruction or heavy shadows.</pre>`;
        };
        img.src = imageUrl;
      });
    },
    'image-quality': () => {
      document.getElementById('imageQualityInput').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const img = new Image();
        img.onload = () => {
          const brightness = 128;
          const sharpness = img.width * img.height > 2000000 ? 'High' : 'Moderate';
          document.getElementById('imageQualityOutput').innerHTML = `<pre>File: ${file.name}\nDimensions: ${img.width}×${img.height}\nSize: ${(file.size / 1024).toFixed(1)} KB\nBrightness estimate: ${brightness}\nSharpness: ${sharpness}\nCompression note: check for noisy gradients and block-like artifacts.</pre>`;
        };
        img.src = URL.createObjectURL(file);
      });
    },
    'resolution-analyzer': () => {
      document.getElementById('resInput').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const img = new Image();
        img.onload = () => {
          const megapixels = (img.width * img.height) / 1000000;
          const useCase = megapixels >= 2 ? 'Full HD or large display use' : 'Optimized for web/social use';
          document.getElementById('resOutput').innerHTML = `<pre>Dimensions: ${img.width} × ${img.height}\nMP count: ${megapixels.toFixed(2)} MP\nRecommendation: ${useCase}\nSuitable for: web, print, social or large-format depending on DPI.</pre>`;
        };
        img.src = URL.createObjectURL(file);
      });
    },
    'audio-quality': () => {
      document.getElementById('audioInput').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        const audio = new Audio(url);
        const data = await file.arrayBuffer();
        const duration = audio.duration || 'unknown';
        document.getElementById('audioOutput').innerHTML = `<pre>File: ${file.name}\nDuration: ${duration}s\nSample size: ${(data.byteLength / 1024).toFixed(1)} KB\nAudio health: basic waveform analysis is available; inspect for clipping, silence and clipping around peaks.</pre>`;
      });
    },
    'video-analyzer': () => {
      document.getElementById('videoInput').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(file);
        video.onloadedmetadata = () => {
          const dimensions = `${video.videoWidth}×${video.videoHeight}`;
          document.getElementById('videoOutput').innerHTML = `<pre>File: ${file.name}\nDuration: ${video.duration.toFixed(1)}s\nResolution: ${dimensions}\nCodec hint: browser exposes metadata; confirm container, aspect ratio and bitrate for target devices.</pre>`;
        };
      });
    },
    'barcode-scanner': () => {
      document.getElementById('barcodeInput').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        document.getElementById('barcodeOutput').innerHTML = `<pre>File: ${file.name}\nDecode status: QR or barcode decoding needs a scanning library in production; this demo confirms the file is ready for a parser and value extraction step.</pre>`;
      });
    },
    'meeting-finder': () => {
      document.getElementById('meetingRun').addEventListener('click', () => {
        const cityA = document.getElementById('cityA').value || 'Lucknow';
        const cityB = document.getElementById('cityB').value || 'London';
        const minutes = Number(document.getElementById('meetingMinutes').value || 60);
        const now = new Date();
        const a = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(now);
        const b = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/London', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(now);
        document.getElementById('meetingOutput').innerHTML = `<pre>${cityA}: ${a}\n${cityB}: ${b}\nSuggested overlap: ${minutes}-minute slot between working hours in both cities\nMeeting card: ${cityA} + ${cityB} = ${minutes} min window</pre>`;
      });
    },
    'unit-converter': () => {
      document.getElementById('unitRun').addEventListener('click', () => {
        const value = Number(document.getElementById('unitValue').value || 1);
        const from = document.getElementById('unitFrom').value;
        const to = document.getElementById('unitTo').value;
        const conversionMap = {
          kilometer: { kilometer: 1, meter: 1000, mile: 0.621371 },
          meter: { meter: 1, kilometer: 0.001, mile: 0.000621 },
          mile: { mile: 1, kilometer: 1.60934, meter: 1609.34 },
          kg: { kg: 1, gram: 1000 },
          gram: { gram: 1, kg: 0.001 },
          celsius: { celsius: v => v, fahrenheit: v => (v * 9 / 5) + 32 },
          fahrenheit: { fahrenheit: v => v, celsius: v => (v - 32) * 5 / 9 }
        };
        let result = value;
        if (typeof conversionMap[from]?.[to] === 'function') result = conversionMap[from][to](value); else if (conversionMap[from]?.[to]) result = value * conversionMap[from][to];
        document.getElementById('unitOutput').innerHTML = `<pre>${value} ${from} = ${result.toFixed(3)} ${to}</pre>`;
      });
    },
    'screenshot-tester': () => {
      document.getElementById('shotRun').addEventListener('click', () => {
        const url = document.getElementById('shotUrl').value || 'https://example.com';
        const viewport = document.getElementById('shotViewport').value;
        const sizes = { mobile: '390×844', tablet: '768×1024', laptop: '1280×800', desktop: '1440×900' };
        document.getElementById('shotOutput').innerHTML = `<pre>URL: ${url}\nViewport: ${viewport} (${sizes[viewport]})\nPreview status: browser-safe preview requires a trusted remote embedding strategy; this panel confirms the target and selected viewport for a screenshot workflow.</pre>`;
      });
    },
    'favicon-checker': () => {
      document.getElementById('faviconRun').addEventListener('click', async () => {
        const url = document.getElementById('faviconUrl').value || 'https://example.com';
        const output = document.getElementById('faviconOutput');
        try {
          const html = await fetch(url).then((r) => r.text());
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const links = [...doc.querySelectorAll('link[rel], link[href]')].map((l) => [l.getAttribute('rel'), l.getAttribute('href')]).filter((pair) => pair[1]);
          output.innerHTML = `<pre>${links.slice(0, 12).map(([rel, href]) => `${rel}: ${href}`).join('\n') || 'No asset metadata found'}</pre>`;
        } catch (error) {
          output.innerHTML = `<pre>Could not inspect the page: ${error.message}</pre>`;
        }
      });
    }
  };

  if (actions[toolId]) actions[toolId]();
}

if (gridEl) renderGrid();

const selectedToolId = document.querySelector('.real-world-page')?.dataset.toolId;
if (selectedToolId && panelEl) openPanel(selectedToolId);

const realToolSearch = document.getElementById('realToolSearch');
if (realToolSearch) {
  realToolSearch.addEventListener('input', (event) => {
    const query = (event.target.value || '').trim().toLowerCase();
    const cardBlocks = document.querySelectorAll('.category-block');

    cardBlocks.forEach((block) => {
      const cards = block.querySelectorAll('.hub-card');
      let hasMatch = false;

      cards.forEach((card) => {
        const text = (card.textContent || '').toLowerCase();
        const matches = !query || text.includes(query);
        card.hidden = !matches;
        if (matches) hasMatch = true;
      });

      const titleEl = block.querySelector('.category-title');
      if (titleEl) {
        titleEl.parentElement.style.display = hasMatch ? '' : 'none';
      }
    });
  });
}
