(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const state = {
    report: {},
    bleDevice: null,
    bleServer: null,
    bleServices: [],
    bleEvents: [],
    bleNotifyCharacteristic: null,
    usbDevice: null,
    hidDevice: null,
    serialPort: null,
    serialReader: null,
    serialWriter: null,
    serialReadTask: null,
    serialStopping: false,
    cameraStream: null,
    micStream: null,
    audioContext: null,
    micFrame: 0,
    gamepadTimer: 0
  };

  const knownServices = [
    'battery_service', 'device_information', 'heart_rate', 'environmental_sensing',
    'health_thermometer', 'cycling_speed_and_cadence', 'running_speed_and_cadence',
    'body_composition', 'blood_pressure', 'weight_scale', 'fitness_machine',
    'generic_access', 'generic_attribute'
  ];
  const serviceNames = {
    '0000180f-0000-1000-8000-00805f9b34fb': 'Battery Service',
    '0000180a-0000-1000-8000-00805f9b34fb': 'Device Information',
    '0000180d-0000-1000-8000-00805f9b34fb': 'Heart Rate',
    '0000181a-0000-1000-8000-00805f9b34fb': 'Environmental Sensing',
    '00001809-0000-1000-8000-00805f9b34fb': 'Health Thermometer',
    '00001800-0000-1000-8000-00805f9b34fb': 'Generic Access',
    '00001801-0000-1000-8000-00805f9b34fb': 'Generic Attribute'
  };
  const apiChecks = [
    ['Web Bluetooth LE', () => !!navigator.bluetooth, 'BLE chooser and GATT access; secure context and user gesture required.'],
    ['WebUSB', () => !!navigator.usb, 'USB device chooser; supported browser and secure context required.'],
    ['WebHID', () => !!navigator.hid, 'HID device chooser and input reports; supported browser required.'],
    ['Web Serial', () => !!navigator.serial, 'Serial ports and live streams; supported browser required.'],
    ['Camera capture', () => !!navigator.mediaDevices?.getUserMedia, 'Requests camera permission only when started.'],
    ['Microphone capture', () => !!navigator.mediaDevices?.getUserMedia, 'Requests microphone permission only when started.'],
    ['Gamepad API', () => !!navigator.getGamepads, 'Reads gamepads after a button press or refresh.'],
    ['WebGL', () => { const canvas = document.createElement('canvas'); return !!(canvas.getContext('webgl2') || canvas.getContext('webgl')); }, 'GPU details are browser-filtered; no benchmark is run.'],
    ['Storage estimate', () => !!navigator.storage?.estimate, 'Approximate origin storage quota and usage.'],
    ['Clipboard API', () => !!navigator.clipboard, 'Clipboard access may require permission and user action.'],
    ['File System Access', () => !!(window.showOpenFilePicker || window.showSaveFilePicker), 'Browser-gated local file picker API.'],
    ['Notifications', () => 'Notification' in window, 'Permission state is shown without prompting.'],
    ['Geolocation', () => !!navigator.geolocation, 'Permission state is shown without requesting a location.'],
    ['Screen details', () => !!window.screen, 'Resolution, viewport, pixel ratio and orientation.']
  ];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function download(data, name, type = 'application/json') {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function setChip(id, text, kind = '') {
    const chip = $(id);
    chip.textContent = text;
    chip.classList.toggle('connected', kind === 'connected');
    chip.classList.toggle('error', kind === 'error');
  }

  function bytesToHex(bytes) {
    return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join(' ');
  }

  function logBle(message, type = 'info') {
    const entry = { at: new Date().toISOString(), type, message };
    state.bleEvents.unshift(entry);
    state.bleEvents = state.bleEvents.slice(0, 100);
    try { localStorage.setItem('Thakronix-device-lab-ble-history', JSON.stringify(state.bleEvents)); } catch { /* Storage may be blocked. */ }
    renderBleLog();
    renderBleStability();
  }

  function renderBleLog() {
    const list = $('bleEventLog');
    list.replaceChildren();
    state.bleEvents.slice(0, 20).forEach((event) => {
      const item = document.createElement('li');
      const time = document.createElement('time');
      time.dateTime = event.at;
      time.textContent = new Date(event.at).toLocaleTimeString();
      item.append(time, document.createTextNode(` ${event.message}`));
      list.append(item);
    });
    if (!state.bleEvents.length) list.innerHTML = '<li>No connection events yet.</li>';
  }

  function renderBleStability() {
    const disconnects = state.bleEvents.filter((event) => event.type === 'disconnect').length;
    const connects = state.bleEvents.filter((event) => event.type === 'connect').length;
    $('bleStability').textContent = connects
      ? `${connects} connection event(s) · ${disconnects} disconnect(s). RSSI and distance are not exposed by this browser API.`
      : 'No connection session yet. This API does not expose RSSI or physical distance.';
  }

  function renderCapabilityCards(items) {
    const grid = $('capabilityGrid');
    grid.replaceChildren();
    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'capability-card';
      const header = document.createElement('header');
      const title = document.createElement('strong');
      title.textContent = item.name;
      const status = document.createElement('span');
      status.className = `capability-state${item.available ? '' : ' unsupported'}`;
      status.textContent = item.available ? 'Available' : 'Unavailable';
      const description = document.createElement('p');
      description.textContent = item.detail;
      header.append(title, status);
      card.append(header, description);
      grid.append(card);
    });
  }

  async function refreshBluetoothAvailability() {
    const dot = $('bluetoothDot');
    if (!navigator.bluetooth) {
      $('bluetoothAvailability').textContent = 'Web Bluetooth unavailable';
      $('bluetoothAvailabilityDetail').textContent = window.isSecureContext
        ? 'This browser does not expose Web Bluetooth. Try a supported Chrome or Edge browser.'
        : 'Bluetooth access requires HTTPS or localhost in a supported browser.';
      dot.className = 'device-status-dot unavailable';
      return { available: false, detail: $('bluetoothAvailabilityDetail').textContent };
    }
    if (!window.isSecureContext) {
      $('bluetoothAvailability').textContent = 'Secure context required';
      $('bluetoothAvailabilityDetail').textContent = 'Open this site on HTTPS or localhost to use Web Bluetooth.';
      dot.className = 'device-status-dot unavailable';
      return { available: false, detail: $('bluetoothAvailabilityDetail').textContent };
    }
    try {
      if (typeof navigator.bluetooth.getAvailability !== 'function') throw new Error('Radio state is not exposed by this browser.');
      const available = await navigator.bluetooth.getAvailability();
      $('bluetoothAvailability').textContent = available ? 'Bluetooth available / on' : 'Bluetooth off or unavailable';
      $('bluetoothAvailabilityDetail').textContent = available
        ? 'Browser reports the Bluetooth adapter is available. Device names remain hidden until you choose a device.'
        : 'Turn Bluetooth on, then refresh. Some browsers do not report radio changes immediately.';
      dot.className = `device-status-dot ${available ? 'available' : 'unavailable'}`;
      return { available, detail: $('bluetoothAvailabilityDetail').textContent };
    } catch (error) {
      $('bluetoothAvailability').textContent = 'Bluetooth API available';
      $('bluetoothAvailabilityDetail').textContent = error.message;
      dot.className = 'device-status-dot';
      return { available: true, detail: error.message };
    }
  }

  async function scanCapabilities() {
    const bluetooth = await refreshBluetoothAvailability();
    const secure = !!window.isSecureContext;
    const items = apiChecks.map(([name, test, detail]) => {
      const supported = test();
      const secureApi = ['Web Bluetooth LE', 'WebUSB', 'WebHID', 'Web Serial', 'Camera capture', 'Microphone capture'].includes(name);
      return { name, available: supported && (!secureApi || secure), detail: !secure && secureApi ? 'Requires HTTPS or localhost.' : detail };
    });
    const permissionState = (name) => {
      try { return window[name]?.permission ?? 'Not queried'; } catch { return 'Unavailable'; }
    };
    items.find((item) => item.name === 'Web Bluetooth LE').detail = bluetooth.detail;
    const storage = await navigator.storage?.estimate?.().catch(() => null);
    if (storage) items.find((item) => item.name === 'Storage estimate').detail = `Approx. ${(storage.usage || 0) / 1048576 | 0} MB used of ${(storage.quota || 0) / 1048576 | 0} MB reported quota.`;
    if ('Notification' in window) items.find((item) => item.name === 'Notifications').detail = `Permission: ${Notification.permission}; no prompt was shown.`;
    if (navigator.geolocation && navigator.permissions?.query) {
      try { const permission = await navigator.permissions.query({ name: 'geolocation' }); items.find((item) => item.name === 'Geolocation').detail = `Permission: ${permission.state}; no location was requested.`; } catch { /* Permission query may not be implemented. */ }
    }
    const stateName = (available) => available.length;
    renderCapabilityCards(items);
    $('deviceSupportSummary').textContent = `${stateName(items.filter((item) => item.available))} of ${items.length} capabilities available in this browser. Hardware APIs vary by browser, operating system, secure context and user permission.`;
    state.report = {
      generatedAt: new Date().toISOString(),
      pageOrigin: location.origin,
      secureContext: secure,
      userAgent: navigator.userAgent,
      platform: navigator.userAgentData?.platform || navigator.platform || 'Not exposed',
      bluetooth,
      notificationPermission: permissionState('Notification'),
      capabilities: items,
      display: getDisplayInfo(),
      bleHistory: state.bleEvents
    };
    renderDisplayInfo();
  }

  function getDisplayInfo() {
    return {
      screen: `${screen.width} × ${screen.height}`,
      available: `${screen.availWidth} × ${screen.availHeight}`,
      viewport: `${innerWidth} × ${innerHeight}`,
      devicePixelRatio: window.devicePixelRatio || 1,
      colorDepth: `${screen.colorDepth}-bit`,
      orientation: screen.orientation?.type || 'Not exposed',
      touchPoints: navigator.maxTouchPoints ?? 'Not exposed',
      prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Yes' : 'No'
    };
  }

  function renderDisplayInfo() {
    const displayValues = getDisplayInfo();
    state.report.display = displayValues;
    const displayGrid = $('displayInfo');
    if (displayGrid) {
      displayGrid.replaceChildren();
      Object.entries(displayValues).forEach(([name, value]) => {
        const card = document.createElement('article');
        card.className = 'capability-card';
        const title = document.createElement('strong');
        title.textContent = name.replace(/[A-Z]/g, (char) => ` ${char}`).replace(/^./, (char) => char.toUpperCase());
        const detail = document.createElement('p');
        detail.textContent = String(value);
        card.append(title, detail);
        displayGrid.append(card);
      });
    }
  }

  function buildReport() {
    return {
      ...state.report,
      generatedAt: new Date().toISOString(),
      secureContext: !!window.isSecureContext,
      bluetooth: {
        name: state.bleDevice?.name || null,
        id: state.bleDevice?.id || null,
        connected: !!state.bleServer?.connected,
        services: state.bleServices.map(({ service, characteristics }) => ({
          uuid: service.uuid,
          name: serviceNames[service.uuid] || service.uuid,
          characteristics: characteristics.map((characteristic) => ({ uuid: characteristic.uuid, properties: characteristic.properties }))
        })),
        events: state.bleEvents
      },
      usb: state.usbDevice ? { vendorId: state.usbDevice.vendorId, productId: state.usbDevice.productId, productName: state.usbDevice.productName || null, manufacturerName: state.usbDevice.manufacturerName || null, serialNumber: state.usbDevice.serialNumber || null } : null,
      hid: state.hidDevice ? { vendorId: state.hidDevice.vendorId, productId: state.hidDevice.productId, productName: state.hidDevice.productName || null } : null,
      serial: state.serialPort ? { connected: !!state.serialPort.readable, info: state.serialPort.getInfo?.() || {} } : null
    };
  }

  function showError(target, error) {
    target.textContent = error?.message || String(error);
    target.classList.add('error');
  }

  function setOutput(target, text) {
    target.textContent = text;
    target.classList.remove('error');
  }

  function showPanel(panelName) {
    document.querySelectorAll('.device-tab').forEach((tab) => {
      const selected = tab.dataset.panel === panelName;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
    document.querySelectorAll('.device-panel').forEach((panel) => {
      const selected = panel.id === `panel-${panelName}`;
      panel.classList.toggle('active', selected);
      panel.hidden = !selected;
    });
  }

  function formatUuid(uuid) { return serviceNames[uuid] ? `${serviceNames[uuid]} · ${uuid}` : uuid; }

  function selectedBleCharacteristic() {
    const service = state.bleServices[Number($('bleServiceSelect').value)];
    return service?.characteristics[Number($('bleCharacteristicSelect').value)] || null;
  }

  function updateBleCharacteristicControls() {
    const characteristic = selectedBleCharacteristic();
    $('bleRead').disabled = !characteristic?.properties.read;
    $('bleWrite').disabled = !(characteristic?.properties.write || characteristic?.properties.writeWithoutResponse);
    $('bleWriteValue').disabled = $('bleWrite').disabled;
    $('bleNotify').disabled = !(characteristic?.properties.notify || characteristic?.properties.indicate);
    $('bleNotify').textContent = state.bleNotifyCharacteristic === characteristic ? 'Stop notifications' : 'Start notifications';
  }

  async function loadBleCharacteristics() {
    const serviceIndex = Number($('bleServiceSelect').value);
    const record = state.bleServices[serviceIndex];
    const select = $('bleCharacteristicSelect');
    select.replaceChildren(new Option(record ? 'Choose a characteristic' : 'Choose a service first', ''));
    if (!record) {
      select.disabled = true;
      updateBleCharacteristicControls();
      return;
    }
    record.characteristics = await record.service.getCharacteristics();
    record.characteristics.forEach((characteristic, index) => {
      const properties = Object.entries(characteristic.properties).filter(([, enabled]) => enabled).map(([name]) => name).join(', ');
      select.add(new Option(`${characteristic.uuid} · ${properties || 'no readable properties'}`, String(index)));
    });
    select.disabled = record.characteristics.length === 0;
    updateBleCharacteristicControls();
  }

  async function discoverBleServices() {
    if (!state.bleServer?.connected) throw new Error('Connect to a BLE device first.');
    const container = $('bleServices');
    container.className = 'device-list';
    container.textContent = 'Discovering allowed GATT services...';
    try {
      const services = await state.bleServer.getPrimaryServices();
      state.bleServices = await Promise.all(services.map(async (service) => ({ service, characteristics: await service.getCharacteristics() })));
      container.replaceChildren();
      state.bleServices.forEach(({ service, characteristics }, index) => {
        const record = document.createElement('article');
        record.className = 'device-record';
        const title = document.createElement('strong');
        title.textContent = serviceNames[service.uuid] || 'GATT service';
        const uuid = document.createElement('small');
        uuid.innerHTML = `<code>${escapeHtml(service.uuid)}</code> · ${characteristics.length} characteristic(s)`;
        record.append(title, uuid);
        container.append(record);
        if (index === 0) $('bleServiceSelect').value = '0';
      });
      $('bleServiceSelect').replaceChildren(new Option('Choose a service', ''));
      state.bleServices.forEach(({ service }, index) => $('bleServiceSelect').add(new Option(formatUuid(service.uuid), String(index))));
      $('bleServiceSelect').disabled = state.bleServices.length === 0;
      $('bleCharacteristicSelect').replaceChildren(new Option('Choose a service first', ''));
      $('bleCharacteristicSelect').disabled = true;
      $('bleExport').disabled = false;
      if (state.bleServices.length) {
        $('bleServiceSelect').value = '0';
        await loadBleCharacteristics();
      } else container.textContent = 'No allowed primary services were exposed. Add that service UUID under Optional custom service UUID and reconnect.';
      logBle(`Discovered ${services.length} allowed service(s).`);
    } catch (error) {
      container.className = 'device-list empty-state';
      container.textContent = `${error.message} Only standard services and UUIDs included in Optional custom service UUID can be discovered.`;
    }
  }

  async function connectBle() {
    if (!navigator.bluetooth?.requestDevice) throw new Error('Web Bluetooth is not available in this browser. Use HTTPS or localhost in a supported browser.');
    const optionalServices = [...knownServices];
    const customUuid = $('bleServiceUuid').value.trim();
    if (customUuid) optionalServices.push(customUuid);
    $('bleChoose').disabled = true;
    try {
      const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices });
      state.bleDevice = device;
      $('bleDeviceName').textContent = device.name || 'Unnamed BLE device';
      $('bleDeviceId').textContent = device.id || 'Not exposed';
      device.addEventListener('gattserverdisconnected', () => {
        state.bleServer = null;
        setChip('bleConnectionState', 'Disconnected', 'error');
        $('bleGattState').textContent = 'Disconnected';
        $('bleDisconnect').disabled = true;
        $('bleDiscover').disabled = true;
        logBle(`${device.name || 'Device'} disconnected.`, 'disconnect');
      });
      logBle(`Selected ${device.name || 'unnamed device'} (${device.id || 'ID unavailable'}).`);
      const server = await device.gatt.connect();
      state.bleServer = server;
      setChip('bleConnectionState', 'Connected', 'connected');
      $('bleGattState').textContent = 'Connected';
      $('bleDisconnect').disabled = false;
      $('bleDiscover').disabled = false;
      await discoverBleServices();
      logBle(`Connected to ${device.name || 'BLE device'}.`, 'connect');
    } finally {
      $('bleChoose').disabled = false;
    }
  }

  async function stopBleNotifications() {
    const characteristic = state.bleNotifyCharacteristic;
    if (!characteristic) return;
    try {
      characteristic.removeEventListener('characteristicvaluechanged', onBleValueChanged);
      await characteristic.stopNotifications();
    } catch { /* Device may already be disconnected. */ }
    state.bleNotifyCharacteristic = null;
    updateBleCharacteristicControls();
    logBle('Notifications stopped.');
  }

  function onBleValueChanged(event) {
    const value = event.target.value;
    const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    const text = new TextDecoder().decode(bytes);
    setOutput($('bleValueOutput'), `Notification received\nHex: ${bytesToHex(bytes)}\nUTF-8: ${text || '(not valid printable text)'}`);
    logBle(`Notification packet received (${bytes.length} byte(s)).`, 'notification');
  }

  function renderUsbInfo(device) {
    const target = $('usbInfo');
    target.className = 'device-list';
    const facts = [
      ['Product', device.productName || 'Not exposed'],
      ['Manufacturer', device.manufacturerName || 'Not exposed'],
      ['Vendor ID', `0x${device.vendorId.toString(16).padStart(4, '0')}`],
      ['Product ID', `0x${device.productId.toString(16).padStart(4, '0')}`],
      ['Serial number', device.serialNumber || 'Not exposed'],
      ['Opened', String(device.opened)]
    ];
    const summary = document.createElement('article');
    summary.className = 'device-record';
    summary.innerHTML = `<strong>${escapeHtml(device.productName || 'USB device')}</strong><small>${facts.map(([key, value]) => `${escapeHtml(key)}: ${escapeHtml(value)}`).join('<br>')}</small>`;
    target.replaceChildren(summary);
    (device.configurations || []).forEach((configuration) => {
      const config = document.createElement('article');
      config.className = 'device-record';
      const interfaces = configuration.interfaces.map((item) => `Interface ${item.interfaceNumber}: class ${item.alternates[0]?.interfaceClass ?? 'unknown'}, ${item.alternates[0]?.endpoints.length ?? 0} endpoint(s)`).join('\n');
      config.innerHTML = `<strong>Configuration ${configuration.configurationValue}${configuration.configurationName ? ` · ${escapeHtml(configuration.configurationName)}` : ''}</strong><small>${escapeHtml(interfaces || 'No interfaces exposed')}</small>`;
      target.append(config);
    });
  }

  async function chooseUsb() {
    if (!navigator.usb?.requestDevice) throw new Error('WebUSB is unavailable. Use a supported browser on HTTPS or localhost.');
    const value = $('usbVendorId').value.trim();
    let filter = {};
    if (value) {
      const vendorId = Number.parseInt(value.replace(/^0x/i, ''), 16);
      if (!Number.isInteger(vendorId) || vendorId < 0 || vendorId > 65535) throw new Error('Enter a valid 16-bit hexadecimal vendor ID.');
      filter = { vendorId };
    }
    const device = await navigator.usb.requestDevice({ filters: [filter] });
    state.usbDevice = device;
    await device.open();
    setChip('usbState', 'Connected', 'connected');
    $('usbDisconnect').disabled = false;
    renderUsbInfo(device);
  }

  function hidCollections(device) {
    return (device.collections || []).map((collection, index) => {
      const inputReports = (collection.inputReports || []).map((report) => `input report ${report.reportId}`).join(', ') || 'none';
      const outputReports = (collection.outputReports || []).map((report) => `output report ${report.reportId}`).join(', ') || 'none';
      return `Collection ${index + 1}: usage page ${collection.usagePage}, usage ${collection.usage}\n${inputReports}; ${outputReports}`;
    }).join('\n\n');
  }

  async function chooseHid() {
    if (!navigator.hid?.requestDevice) throw new Error('WebHID is unavailable in this browser. Try a supported desktop Chrome or Edge browser.');
    const [device] = await navigator.hid.requestDevice({ filters: [{}] });
    if (!device) return;
    await device.open();
    state.hidDevice = device;
    setChip('hidState', 'Connected', 'connected');
    $('hidDisconnect').disabled = false;
    const target = $('hidInfo');
    target.className = 'device-list';
    target.innerHTML = `<article class="device-record"><strong>${escapeHtml(device.productName || 'HID device')}</strong><small>Vendor ID: 0x${device.vendorId.toString(16)} · Product ID: 0x${device.productId.toString(16)}<br>${escapeHtml(hidCollections(device))}</small></article>`;
  }

  function handleHidInput(event) {
    if (event.device !== state.hidDevice) return;
    const bytes = new Uint8Array(event.data.buffer, event.data.byteOffset, event.data.byteLength);
    const line = `${new Date().toLocaleTimeString()} · report ${event.reportId} · ${bytesToHex(bytes)}`;
    $('hidLog').textContent = `${line}\n${$('hidLog').textContent}`.split('\n').slice(0, 100).join('\n');
  }

  function appendSerial(direction, text) {
    const target = $('serialLog');
    const line = `${new Date().toLocaleTimeString()} ${direction} ${text}`;
    target.textContent = `${target.textContent}${target.textContent ? '\n' : ''}${line}`.split('\n').slice(-2000).join('\n');
    if ($('serialAutoScroll').checked) target.scrollTop = target.scrollHeight;
  }

  function serialChunk(bytes) {
    if ($('serialMode').value === 'hex') return bytesToHex(bytes);
    return new TextDecoder().decode(bytes);
  }

  async function readSerial(port) {
    while (port.readable && !state.serialStopping) {
      const reader = port.readable.getReader();
      state.serialReader = reader;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          appendSerial('RX', serialChunk(value));
        }
      } catch (error) {
        if (!state.serialStopping) appendSerial('ERR', error.message);
      } finally {
        reader.releaseLock();
        if (state.serialReader === reader) state.serialReader = null;
      }
    }
  }

  async function connectSerial() {
    if (!navigator.serial?.requestPort) throw new Error('Web Serial is unavailable. Use a supported browser on HTTPS or localhost.');
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: Number($('serialBaud').value) });
    state.serialPort = port;
    state.serialStopping = false;
    setChip('serialState', `Connected · ${$('serialBaud').value} baud`, 'connected');
    $('serialDisconnect').disabled = false;
    $('serialInput').disabled = false;
    $('serialSend').disabled = false;
    appendSerial('SYS', `Port opened. Info: ${JSON.stringify(port.getInfo?.() || {})}`);
    state.serialReadTask = readSerial(port);
  }

  async function disconnectSerial() {
    const port = state.serialPort;
    if (!port) return;
    state.serialStopping = true;
    try { await state.serialReader?.cancel(); } catch { /* The stream may already have ended. */ }
    try { await state.serialReadTask; } catch { /* Read errors are logged by the loop. */ }
    try { await state.serialWriter?.close(); } catch { /* Writer can already be closed. */ }
    try { await port.close(); } catch (error) { appendSerial('ERR', error.message); }
    state.serialPort = null;
    state.serialWriter = null;
    setChip('serialState', 'Disconnected');
    $('serialDisconnect').disabled = true;
    $('serialInput').disabled = true;
    $('serialSend').disabled = true;
    appendSerial('SYS', 'Port closed.');
  }

  async function sendSerial(event) {
    event.preventDefault();
    const port = state.serialPort;
    if (!port?.writable) throw new Error('Connect to a serial device first.');
    const text = $('serialInput').value + ($('serialNewline').checked ? '\n' : '');
    const writer = port.writable.getWriter();
    state.serialWriter = writer;
    try {
      await writer.write(new TextEncoder().encode(text));
      appendSerial('TX', text.replace(/\n$/, '\\n'));
      $('serialInput').value = '';
    } finally {
      writer.releaseLock();
      state.serialWriter = null;
    }
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera capture is unavailable in this browser or context.');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    state.cameraStream = stream;
    $('cameraPreview').srcObject = stream;
    const settings = stream.getVideoTracks()[0]?.getSettings?.() || {};
    $('cameraStatus').textContent = `Camera active · ${settings.width || '?'} × ${settings.height || '?'} · ${settings.frameRate || '?'} fps reported.`;
    $('cameraStart').disabled = true;
    $('cameraStop').disabled = false;
  }

  function stopCamera() {
    state.cameraStream?.getTracks().forEach((track) => track.stop());
    state.cameraStream = null;
    $('cameraPreview').srcObject = null;
    $('cameraStatus').textContent = 'Camera is off.';
    $('cameraStart').disabled = false;
    $('cameraStop').disabled = true;
  }

  async function startMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone capture is unavailable in this browser or context.');
    state.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    state.audioContext = new AudioContext();
    const source = state.audioContext.createMediaStreamSource(state.micStream);
    const analyser = state.audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    const draw = () => {
      analyser.getByteTimeDomainData(samples);
      const rms = Math.sqrt(samples.reduce((sum, sample) => sum + (sample - 128) ** 2, 0) / samples.length) / 128;
      $('micLevel').style.width = `${Math.min(100, Math.round(rms * 200))}%`;
      state.micFrame = requestAnimationFrame(draw);
    };
    draw();
    $('micStatus').textContent = `Microphone active · ${state.micStream.getAudioTracks()[0]?.getSettings?.().sampleRate || 'sample rate not exposed'} Hz reported.`;
    $('micStart').disabled = true;
    $('micStop').disabled = false;
  }

  async function stopMicrophone() {
    cancelAnimationFrame(state.micFrame);
    state.micStream?.getTracks().forEach((track) => track.stop());
    state.micStream = null;
    await state.audioContext?.close().catch(() => {});
    state.audioContext = null;
    $('micLevel').style.width = '0';
    $('micStatus').textContent = 'Microphone is off.';
    $('micStart').disabled = false;
    $('micStop').disabled = true;
  }

  async function playSpeakerTone() {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = Number($('speakerFrequency').value);
    gain.gain.value = 0.06;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 1);
    oscillator.addEventListener('ended', () => context.close());
  }

  function renderGamepads() {
    const target = $('gamepadInfo');
    const pads = [...(navigator.getGamepads?.() || [])].filter(Boolean);
    if (!pads.length) {
      target.className = 'device-list empty-state';
      target.textContent = 'No gamepad detected. Connect a controller and press any button, then refresh.';
      return;
    }
    target.className = 'device-list';
    target.innerHTML = pads.map((pad) => {
      const buttons = pad.buttons.map((button, index) => button.pressed ? index : null).filter((index) => index !== null);
      return `<article class="device-record"><strong>${escapeHtml(pad.id || `Gamepad ${pad.index + 1}`)}</strong><small>Index ${pad.index} · ${pad.mapping || 'standard mapping'} · ${pad.connected ? 'connected' : 'disconnected'}<br>Axes: ${pad.axes.map((axis) => axis.toFixed(3)).join(', ') || 'none'}<br>Pressed buttons: ${buttons.join(', ') || 'none'}</small></article>`;
    }).join('');
  }

  async function exportBleSession() {
    download(JSON.stringify(buildReport().bluetooth, null, 2), 'Thakronix-ble-session.json');
  }

  function printReport() {
    const report = buildReport();
    const popup = window.open('', '_blank');
    if (!popup) throw new Error('The browser blocked the print window. Allow pop-ups for this site to save as PDF.');
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Device capability report</title><style>body{font:14px/1.5 system-ui,sans-serif;color:#18251f;margin:32px}h1{font-size:24px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f3f5f2;padding:16px;border:1px solid #dce4dd;border-radius:8px}@media print{body{margin:12mm}}</style></head><body><h1>Device &amp; Hardware Lab report</h1><p>Generated ${escapeHtml(new Date(report.generatedAt).toLocaleString())}</p><pre>${escapeHtml(JSON.stringify(report, null, 2))}</pre></body></html>`);
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 250);
  }

  function addDeviceEvents() {
    document.querySelectorAll('.device-tab').forEach((tab) => tab.addEventListener('click', () => showPanel(tab.dataset.panel)));
    $('refreshBluetooth').addEventListener('click', refreshBluetoothAvailability);
    $('scanCapabilities').addEventListener('click', scanCapabilities);
    $('refreshDisplay').addEventListener('click', renderDisplayInfo);
    $('exportReport').addEventListener('click', () => download(JSON.stringify(buildReport(), null, 2), 'Thakronix-device-capability-report.json'));
    $('printReport').addEventListener('click', () => { try { printReport(); } catch (error) { alert(error.message); } });
    $('bleChoose').addEventListener('click', () => connectBle().catch((error) => { setChip('bleConnectionState', 'Could not connect', 'error'); setOutput($('bleValueOutput'), error.message); }));
    $('bleDisconnect').addEventListener('click', () => { if (state.bleDevice?.gatt?.connected) state.bleDevice.gatt.disconnect(); });
    $('bleDiscover').addEventListener('click', () => discoverBleServices());
    $('bleServiceSelect').addEventListener('change', () => loadBleCharacteristics().catch((error) => setOutput($('bleValueOutput'), error.message)));
    $('bleCharacteristicSelect').addEventListener('change', updateBleCharacteristicControls);
    $('bleRead').addEventListener('click', async () => {
      try {
        const characteristic = selectedBleCharacteristic();
        const value = await characteristic.readValue();
        const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
        setOutput($('bleValueOutput'), `Read ${bytes.length} byte(s)\nHex: ${bytesToHex(bytes)}\nUTF-8: ${new TextDecoder().decode(bytes)}`);
      } catch (error) { setOutput($('bleValueOutput'), error.message); }
    });
    $('bleWrite').addEventListener('click', async () => {
      try {
        const characteristic = selectedBleCharacteristic();
        const raw = $('bleWriteValue').value.trim();
        let bytes;
        if ($('bleWriteHex').checked) {
          if (!/^(?:[0-9a-f]{2}(?:\s|$))+$/.test(raw.toLowerCase())) throw new Error('Enter hex bytes separated by spaces, for example: 01 0a ff.');
          bytes = Uint8Array.from(raw.split(/\s+/), (value) => Number.parseInt(value, 16));
        } else bytes = new TextEncoder().encode(raw);
        if (characteristic.writeValueWithResponse) await characteristic.writeValueWithResponse(bytes);
        else if (characteristic.writeValueWithoutResponse) await characteristic.writeValueWithoutResponse(bytes);
        else await characteristic.writeValue(bytes);
        setOutput($('bleValueOutput'), `Wrote ${bytes.length} byte(s)\nHex: ${bytesToHex(bytes)}`);
        logBle(`Wrote ${bytes.length} byte(s) to ${characteristic.uuid}.`, 'write');
      } catch (error) { setOutput($('bleValueOutput'), error.message); }
    });
    $('bleNotify').addEventListener('click', async () => {
      const characteristic = selectedBleCharacteristic();
      try {
        if (state.bleNotifyCharacteristic === characteristic) return await stopBleNotifications();
        if (state.bleNotifyCharacteristic) await stopBleNotifications();
        await characteristic.startNotifications();
        state.bleNotifyCharacteristic = characteristic;
        characteristic.addEventListener('characteristicvaluechanged', onBleValueChanged);
        updateBleCharacteristicControls();
        logBle(`Notifications started for ${characteristic.uuid}.`);
      } catch (error) { setOutput($('bleValueOutput'), error.message); }
    });
    $('bleExport').addEventListener('click', exportBleSession);
    $('clearBleHistory').addEventListener('click', () => { state.bleEvents = []; try { localStorage.removeItem('Thakronix-device-lab-ble-history'); } catch { /* Storage may be blocked. */ } renderBleLog(); renderBleStability(); });
    $('usbChoose').addEventListener('click', () => chooseUsb().catch((error) => { setChip('usbState', 'Unavailable', 'error'); $('usbInfo').textContent = error.message; }));
    $('usbDisconnect').addEventListener('click', async () => { try { await state.usbDevice?.close(); } finally { state.usbDevice = null; setChip('usbState', 'Disconnected'); $('usbDisconnect').disabled = true; } });
    $('hidChoose').addEventListener('click', () => chooseHid().catch((error) => { setChip('hidState', 'Unavailable', 'error'); $('hidInfo').textContent = error.message; }));
    $('hidDisconnect').addEventListener('click', async () => { try { await state.hidDevice?.close(); } finally { state.hidDevice = null; setChip('hidState', 'Disconnected'); $('hidDisconnect').disabled = true; } });
    $('clearHidLog').addEventListener('click', () => { $('hidLog').textContent = 'Waiting for an input report.'; });
    $('serialConnect').addEventListener('click', () => connectSerial().catch((error) => { setChip('serialState', 'Not connected', 'error'); appendSerial('ERR', error.message); }));
    $('serialDisconnect').addEventListener('click', () => disconnectSerial());
    $('serialSendForm').addEventListener('submit', (event) => sendSerial(event).catch((error) => appendSerial('ERR', error.message)));
    $('serialSave').addEventListener('click', () => download($('serialLog').textContent || 'No serial data.', 'Thakronix-serial-log.txt', 'text/plain'));
    $('serialClear').addEventListener('click', () => { $('serialLog').textContent = ''; });
    $('serialMode').addEventListener('change', () => appendSerial('SYS', `Display mode changed to ${$('serialMode').value}; new incoming bytes use this mode.`));
    $('cameraStart').addEventListener('click', () => startCamera().catch((error) => { $('cameraStatus').textContent = error.message; }));
    $('cameraStop').addEventListener('click', stopCamera);
    $('micStart').addEventListener('click', () => startMicrophone().catch((error) => { $('micStatus').textContent = error.message; }));
    $('micStop').addEventListener('click', () => stopMicrophone());
    $('speakerTest').addEventListener('click', () => playSpeakerTone().catch((error) => alert(error.message)));
    $('keyDisplay').addEventListener('keydown', (event) => {
      $('keyName').textContent = event.key === ' ' ? 'Space' : event.key;
      $('keyCode').textContent = event.code;
      $('keyModifiers').textContent = ['ctrl', 'alt', 'shift', 'meta'].filter((key) => event[`${key}Key`]).join(' + ') || 'None';
    });
    $('gamepadRefresh').addEventListener('click', renderGamepads);
    window.addEventListener('gamepadconnected', renderGamepads);
    window.addEventListener('gamepaddisconnected', renderGamepads);
    navigator.hid?.addEventListener?.('inputreport', handleHidInput);
    navigator.usb?.addEventListener?.('disconnect', (event) => { if (event.device === state.usbDevice) { state.usbDevice = null; setChip('usbState', 'Disconnected'); $('usbDisconnect').disabled = true; $('usbInfo').textContent = 'USB device disconnected.'; } });
    navigator.hid?.addEventListener?.('disconnect', (event) => { if (event.device === state.hidDevice) { state.hidDevice = null; setChip('hidState', 'Disconnected'); $('hidDisconnect').disabled = true; $('hidInfo').textContent = 'HID device disconnected.'; } });
    navigator.bluetooth?.addEventListener?.('availabilitychanged', refreshBluetoothAvailability);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshBluetoothAvailability(); });
    window.addEventListener('resize', renderDisplayInfo, { passive: true });
    window.addEventListener('beforeunload', () => {
      state.cameraStream?.getTracks().forEach((track) => track.stop());
      state.micStream?.getTracks().forEach((track) => track.stop());
      if (state.bleDevice?.gatt?.connected) state.bleDevice.gatt.disconnect();
    });
  }

  try { state.bleEvents = JSON.parse(localStorage.getItem('Thakronix-device-lab-ble-history') || '[]'); } catch { state.bleEvents = []; }
  addDeviceEvents();
  const requestedPanel = new URLSearchParams(location.search).get('panel');
  if ([...document.querySelectorAll('.device-tab')].some((tab) => tab.dataset.panel === requestedPanel)) showPanel(requestedPanel);
  renderBleLog();
  renderBleStability();
  renderGamepads();
  renderDisplayInfo();
  scanCapabilities();
  setInterval(() => { if (!document.hidden) refreshBluetoothAvailability(); }, 5000);
  state.gamepadTimer = setInterval(renderGamepads, 500);
})();