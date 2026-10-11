(() => {
  const page = document.querySelector('.home-travel-page');
  if (!page) return;
  const $ = (id) => document.getElementById(id);
  const toolNames = { trip: 'Trip Cost Planner Pro', tripcompare: 'Trip Scenario Compare', fuel: 'Vehicle Fuel Logbook Pro', fuelanalytics: 'Mileage & Fuel Analytics', maintenance: 'Car/Bike Maintenance Command Center', serviceschedule: 'Vehicle Service Schedule', packing: 'Smart Travel Packing Planner', bagplanner: 'Bag Capacity Planner', travelbudget: 'Travel Budget Planner Pro', budgethealth: 'Travel Budget Health' };
  const aliases = { tripcompare: 'trip', fuelanalytics: 'fuel', serviceschedule: 'maintenance', bagplanner: 'packing', budgethealth: 'travelbudget' };
  const money = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const num = (id) => Number($(id)?.value || 0) || 0;
  const text = (id) => String($(id)?.value || '').trim();
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const input = (id, label, type = 'number', placeholder = '') => `<label class="hub-field"><span>${label}</span><input id="${id}" type="${type}" placeholder="${placeholder}" min="0"></label>`;
  const select = (id, label, options) => `<label class="hub-field"><span>${label}</span><select id="${id}">${options.map((option) => `<option>${option}</option>`).join('')}</select></label>`;
  const button = (id, label, cls = 'hub-primary') => `<button class="${cls}" id="${id}" type="button">${label}</button>`;
  const shell = (intro, left, right) => `<div class="workspace-intro"><span class="hub-kicker">LIVE LOCAL WORKSPACE</span><p>${intro}</p><div class="travel-actions">${button('saveTravelProject', 'Save project', 'hub-secondary')}${button('exportTravelData', 'Export JSON', 'hub-secondary')}${button('printTravelReport', 'Print', 'hub-secondary')}</div></div><div class="workspace-grid"><div class="hub-panel">${left}</div><div class="hub-panel">${right}</div></div><div id="travelHistory" class="travel-history"></div>`;
  const key = (tool) => `tf-travel-${tool}`;
  const load = (tool) => { try { return JSON.parse(localStorage.getItem(key(tool))) || []; } catch { return []; } };
  const save = (tool, data) => localStorage.setItem(key(tool), JSON.stringify(data));
  const historyKey = (tool) => `${key(tool)}-history`;
  const loadHistory = (tool) => { try { return JSON.parse(localStorage.getItem(historyKey(tool))) || []; } catch { return []; } };
  const saveHistory = (tool, data) => localStorage.setItem(historyKey(tool), JSON.stringify(data));
  const today = () => new Date().toISOString().slice(0, 10);
  const daysUntil = (date) => date ? Math.ceil((new Date(`${date}T23:59:59`) - new Date()) / 86400000) : 0;
  let selected = new URLSearchParams(location.search).get('tool') || 'trip';

  function render(tool) {
    selected = tool;
    let intro = '', left = '', right = '';
    if (tool === 'trip') {
      intro = 'Plan a complete trip budget by route, vehicle, travel mode and traveller count. Compare alternate options before you leave.';
      left = `<div class="hub-form-grid">${input('tripStart', 'Starting point', 'text', 'Delhi')}${input('tripDestination', 'Destination', 'text', 'Jaipur')}${input('tripStops', 'Multiple stops', 'text', 'Agra, Pushkar')}${input('tripDistance', 'Distance (km)')}${input('tripMileage', 'Mileage (km/l or km/kWh)')}${input('tripFuelPrice', 'Fuel / energy price')}${select('tripFuelType', 'Vehicle / fuel', ['Petrol', 'Diesel', 'CNG', 'EV', 'Train', 'Bus'])}${select('tripDirection', 'Trip type', ['One-way', 'Round trip'])}${input('tripToll', 'Toll')}${input('tripParking', 'Parking')}${input('tripFood', 'Food')}${input('tripHotel', 'Hotel')}${input('tripActivities', 'Activities')}${input('tripOther', 'Other')}${input('tripPeople', 'Travellers', 'number', '2')}${input('tripBuffer', 'Emergency buffer %', 'number', '15')}${select('tripCurrency', 'Currency', ['INR', 'USD', 'EUR', 'GBP'])}</div>`;
      right = `<div id="tripResult" class="hub-result"></div><h4>Scenario compare</h4><div class="hub-form-grid">${input('scenarioCarA', 'Car A transport cost')}${input('scenarioCarATime', 'Car A time (hours)')}${input('scenarioCarAParking', 'Car A parking')}${input('scenarioCarAFuel', 'Car A fuel')}${input('scenarioCarB', 'Car B transport cost')}${input('scenarioCarBTime', 'Car B time (hours)')}${input('scenarioCarBParking', 'Car B parking')}${input('scenarioCarBFuel', 'Car B fuel')}${input('scenarioTrain', 'Train transport cost')}${input('scenarioTrainTime', 'Train time (hours)')}${input('scenarioBus', 'Bus transport cost')}${input('scenarioBusTime', 'Bus time (hours)')}</div><div id="tripScenarios" class="hub-list"></div>`;
    } else if (tool === 'fuel') {
      intro = 'Keep a real fill-up history for multiple vehicles. Mileage is calculated from consecutive odometer readings and shown with neutral checks when it changes.';
      left = `<div class="hub-form-grid">${input('fuelVehicle', 'Vehicle', 'text', 'Honda City')}${input('fuelDate', 'Date', 'date')}${input('fuelOdo', 'Odometer (km)')}${input('fuelLitres', 'Litres')}${input('fuelPrice', 'Fuel price / litre')}${input('fuelAmount', 'Total amount')}${input('fuelStation', 'Fuel station', 'text', 'HP Petrol Pump')}${select('fuelType', 'Fuel type', ['Petrol', 'Diesel', 'CNG', 'EV'])}${select('fuelFill', 'Fill type', ['Full tank', 'Partial fill'])}${input('fuelNotes', 'Notes', 'text', 'Traffic, route or load')}</div>${button('addFuelEntry', 'Add fuel entry')}`;
      right = `<div id="fuelResult" class="hub-result"></div><div id="fuelChecks" class="shopping-list"></div><div id="fuelList" class="hub-list"></div>`;
    } else if (tool === 'maintenance') {
      intro = 'Manage vehicle profiles, service schedules, expiry dates, costs and replaced parts in one local command center.';
      left = `<div class="hub-form-grid">${select('maintVehicleType', 'Vehicle type', ['Car', 'Bike'])}${input('maintVehicle', 'Registration nickname', 'text', 'My Honda City')}${input('maintBrand', 'Brand', 'text', 'Honda')}${input('maintModel', 'Model', 'text', 'City')}${input('maintYear', 'Year', 'number', '2022')}${input('maintCurrent', 'Current KM')}${input('maintNext', 'Next service KM')}${input('maintInsurance', 'Insurance expiry', 'date')}${input('maintPuc', 'PUC expiry', 'date')}${select('maintItem', 'Maintenance item', ['Engine oil', 'Oil filter', 'Air filter', 'Brake', 'Tyres', 'Battery', 'Coolant', 'Chain', 'Spark plug', 'AC service', 'General service', 'Insurance', 'PUC', 'Custom'])}${input('maintParts', 'Parts replaced', 'text', 'Oil filter')}${input('maintGarage', 'Garage / provider', 'text', 'Local garage')}${input('maintCost', 'Cost')}${input('maintDate', 'Service date', 'date')}${input('maintNotes', 'Notes', 'text', 'Next check')}</div>${button('addMaintenanceEntry', 'Save service record')}`;
      right = `<div id="maintenanceResult" class="hub-result"></div><div id="maintenanceList" class="hub-list"></div><div id="maintenanceAnalytics" class="shopping-list"></div>`;
    } else if (tool === 'packing') {
      intro = 'Generate a trip-specific packing engine with quantities, packed/buy status, estimated weight and bag allocation.';
      left = `<div class="hub-form-grid">${input('packDestination', 'Destination', 'text', 'Manali')}${input('packDays', 'Number of days', 'number', '5')}${select('packType', 'Trip type', ['College Trip', 'Business', 'Beach', 'Mountain', 'Family', 'Wedding', 'Road Trip', 'International'])}${input('packTravellers', 'Travellers', 'number', '1')}${select('packWeather', 'Weather', ['Warm', 'Cold', 'Rainy', 'Mixed'])}${input('packActivities', 'Activities', 'text', 'Hiking, dinner')}${input('packCapacity', 'Suitcase capacity (kg)', 'number', '20')}${input('packCustom', 'Custom items', 'text', 'Camera, personal medication')}</div>${button('buildPacking', 'Generate packing list')}`;
      right = `<div id="packingResult" class="hub-result"></div><div id="packingList" class="hub-list"></div>`;
    } else {
      intro = 'Track planned and actual trip spending by category, compare the burn rate with your trip day, and test what-if changes.';
      left = `<div class="hub-form-grid">${input('tbTotal', 'Total budget')}${input('tbDays', 'Trip days', 'number', '7')}${input('tbDay', 'Current trip day', 'number', '1')}${input('tbPeople', 'Travellers', 'number', '2')}${input('tbRate', 'Currency rate to INR', 'number', '1')}${input('tbTransport', 'Transport')}${input('tbHotel', 'Hotel')}${input('tbFood', 'Food')}${input('tbActivities', 'Activities')}${input('tbShopping', 'Shopping')}${input('tbLocal', 'Local travel')}${input('tbTickets', 'Tickets')}${input('tbParking', 'Parking')}${input('tbEmergency', 'Emergency reserve')}${input('tbMisc', 'Miscellaneous')}${input('tbActual', 'Spent so far')}</div>`;
      right = `<div id="travelBudgetResult" class="hub-result"></div><h4>Scenario simulator</h4><div class="hub-form-grid">${input('tbHotelChange', 'Hotel change')}${input('tbFoodChange', 'Food change')}${input('tbShoppingChange', 'Shopping change')}</div><div id="budgetHealth" class="shopping-list"></div>`;
    }
    $('workspaceBody').innerHTML = shell(intro, left, right);
    bind(tool);
    calculate(tool);
    renderHistory(tool);
  }

  function bind(tool) {
    document.querySelectorAll('#workspaceBody input, #workspaceBody select, #workspaceBody textarea').forEach((field) => {
      field.addEventListener('input', () => calculate(tool));
      field.addEventListener('change', () => calculate(tool));
    });
    $('saveTravelProject').addEventListener('click', () => {
      const history = loadHistory(tool);
      history.unshift({ id: Date.now(), title: text(tool === 'trip' ? 'tripDestination' : tool === 'fuel' ? 'fuelVehicle' : tool === 'maintenance' ? 'maintVehicle' : tool === 'packing' ? 'packDestination' : 'tbTotal') || toolNames[tool], summary: resultText(tool), saved: new Date().toISOString() });
      saveHistory(tool, history.slice(0, 20));
      renderHistory(tool);
    });
    $('exportTravelData').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({ tool, saved: load(tool), exported: new Date().toISOString() }, null, 2)], { type: 'application/json' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${tool}-backup.json`; link.click(); URL.revokeObjectURL(link.href);
    });
    $('printTravelReport').addEventListener('click', () => window.print());
    $('addFuelEntry')?.addEventListener('click', () => addFuel());
    $('addMaintenanceEntry')?.addEventListener('click', () => addMaintenance());
    $('buildPacking')?.addEventListener('click', () => calculate('packing'));
  }

  function resultText(tool) { return $(`${tool === 'travelbudget' ? 'travelBudget' : tool}Result`)?.textContent || 'Saved locally'; }
  function calculate(tool) {
    if (tool === 'trip') calculateTrip();
    if (tool === 'fuel') renderFuel();
    if (tool === 'maintenance') renderMaintenance();
    if (tool === 'packing') renderPacking();
    if (tool === 'travelbudget') calculateBudget();
  }
  function calculateTrip() {
    const distance = num('tripDistance') * (text('tripDirection') === 'Round trip' ? 2 : 1);
    const fuel = num('tripMileage') ? distance / num('tripMileage') * num('tripFuelPrice') : 0;
    const parts = { Fuel: fuel, Toll: num('tripToll'), Parking: num('tripParking'), Food: num('tripFood'), Hotel: num('tripHotel'), Activities: num('tripActivities'), Other: num('tripOther') };
    const base = Object.values(parts).reduce((sum, value) => sum + value, 0); const buffer = base * num('tripBuffer') / 100; const total = base + buffer; const people = Math.max(1, num('tripPeople'));
    $('tripResult').innerHTML = `<strong>${money(total)} recommended fund | ${money(total / people)}/person</strong>${Object.entries(parts).map(([label, value]) => `<span>${label}: ${money(value)}</span>`).join('')}<span>Base budget ${money(base)} | Emergency buffer ${money(buffer)} | ${text('tripDirection') || 'One-way'} | ${esc(text('tripCurrency') || 'INR')}</span>`;
    const scenarios = [['Car A', num('scenarioCarA') + num('scenarioCarAParking') + num('scenarioCarAFuel'), num('scenarioCarATime')], ['Car B', num('scenarioCarB') + num('scenarioCarBParking') + num('scenarioCarBFuel'), num('scenarioCarBTime')], ['Train', num('scenarioTrain'), num('scenarioTrainTime')], ['Bus', num('scenarioBus'), num('scenarioBusTime')]].filter(([, cost]) => cost > 0);
    $('tripScenarios').innerHTML = scenarios.map(([label, cost, hours]) => `<div class="hub-list-item"><strong>${label}: ${money(cost / people)}/person</strong><small>Total ${money(cost)} | Travel time ${hours || 0} hours</small></div>`).join('') || '<p class="hub-muted">Enter manual scenario costs to compare Car A, Car B, Train and Bus.</p>';
  }
  function addFuel() {
    const history = load('fuel'); history.unshift({ vehicle: text('fuelVehicle'), date: text('fuelDate') || today(), odo: num('fuelOdo'), litres: num('fuelLitres'), price: num('fuelPrice'), amount: num('fuelAmount') || num('fuelLitres') * num('fuelPrice'), station: text('fuelStation'), type: text('fuelType'), fill: text('fuelFill'), notes: text('fuelNotes') }); save('fuel', history.slice(0, 100)); renderFuel(); renderHistory('fuel');
  }
  function renderFuel() {
    const entries = load('fuel').sort((a, b) => new Date(a.date) - new Date(b.date) || Number(a.odo || 0) - Number(b.odo || 0)); const distances = entries.slice(1).map((entry, index) => ({ distance: entry.odo - entries[index].odo, litres: entry.litres, mileage: entry.litres ? (entry.odo - entries[index].odo) / entry.litres : 0 })).filter((x) => x.distance > 0 && x.mileage > 0); const mileage = distances.length ? distances.reduce((sum, x) => sum + x.mileage, 0) / distances.length : 0; const totalDistance = entries.length > 1 ? entries.at(-1).odo - entries[0].odo : 0; const totalAmount = entries.reduce((sum, x) => sum + Number(x.amount || 0), 0); const monthly = entries.filter((x) => x.date?.slice(0, 7) === today().slice(0, 7)).reduce((sum, x) => sum + Number(x.amount || 0), 0); const best = distances.length ? Math.max(...distances.map((x) => x.mileage)) : 0; const worst = distances.length ? Math.min(...distances.map((x) => x.mileage)) : 0;
    $('fuelResult').innerHTML = `<strong>Average mileage ${mileage.toFixed(1)} km/L</strong><span>Cost per KM ${totalDistance ? money(totalAmount / totalDistance) : money(0)} | Monthly fuel ${money(monthly)} | Year estimate ${money(monthly * 12)}</span><span>Total distance ${totalDistance.toLocaleString('en-IN')} km | Best ${best.toFixed(1)} km/L | Worst ${worst.toFixed(1)} km/L</span>`;
    const previous = distances.at(-2)?.mileage || 0; const current = distances.at(-1)?.mileage || 0; const drop = previous > 0 && current < previous ? (previous - current) / previous * 100 : 0;
    $('fuelChecks').innerHTML = drop ? `<div class="file-chip">Mileage drop: ${drop.toFixed(1)}% (${previous.toFixed(1)} to ${current.toFixed(1)} km/L). Check tyre pressure, traffic/route, load, service interval and driving pattern.</div>` : '';
    $('fuelList').innerHTML = entries.slice().reverse().map((entry) => `<div class="hub-list-item"><strong>${esc(entry.vehicle || 'Vehicle')} | ${entry.litres || 0} L | ${money(entry.amount)}</strong><small>${esc(entry.date)} | ${entry.odo || 0} km | ${esc(entry.station)} | ${esc(entry.type)} | ${esc(entry.fill)} | ${esc(entry.notes)}</small></div>`).join('') || '<p class="hub-muted">No fuel entries yet. Add the first fill-up to start your history.</p>';
  }
  function addMaintenance() {
    const history = load('maintenance'); history.unshift({ vehicle: text('maintVehicle'), type: text('maintVehicleType'), brand: text('maintBrand'), model: text('maintModel'), year: text('maintYear'), current: num('maintCurrent'), next: num('maintNext'), insurance: text('maintInsurance'), puc: text('maintPuc'), item: text('maintItem'), parts: text('maintParts'), garage: text('maintGarage'), cost: num('maintCost'), date: text('maintDate') || today(), notes: text('maintNotes') }); save('maintenance', history.slice(0, 100)); renderMaintenance(); renderHistory('maintenance');
  }
  function renderMaintenance() {
    const entries = load('maintenance'); const latest = entries[0] || {}; const serviceRemaining = Math.max(0, Number(latest.next || 0) - Number(latest.current || 0)); const serviceCosts = entries.reduce((sum, x) => sum + Number(x.cost || 0), 0); $('maintenanceResult').innerHTML = `<strong>Next service ${serviceRemaining.toLocaleString('en-IN')} km remaining</strong><span>Insurance ${daysUntil(latest.insurance)} days remaining | PUC ${daysUntil(latest.puc)} days remaining</span><span>Total recorded maintenance ${money(serviceCosts)} | Ownership cost combines fuel, maintenance, insurance, PUC, repairs and accessories when entered.</span>`;
    $('maintenanceList').innerHTML = entries.map((x) => `<div class="hub-list-item"><strong>${esc(x.vehicle)} | ${esc(x.item)} | ${money(x.cost)}</strong><small>${esc(x.date)} | ${esc(x.parts)} | ${esc(x.garage)} | Next at ${x.next || 'not set'} km</small></div>`).join('') || '<p class="hub-muted">No service records yet.</p>';
    const byYear = {}; entries.forEach((x) => { const year = (x.date || today()).slice(0, 4); byYear[year] = (byYear[year] || 0) + Number(x.cost || 0); }); $('maintenanceAnalytics').innerHTML = Object.entries(byYear).map(([year, cost]) => `<div class="file-chip">${year}: service and parts ${money(cost)}</div>`).join('');
  }
  const packingItems = (days, travellers, type, weather, activities, custom) => { const list = [['Shirts', Math.max(2, days) * travellers, .25], ['Pants', Math.max(1, Math.ceil(days / 3)) * travellers, .5], ['Underwear', days * travellers, .12], ['Socks', Math.max(2, days) * travellers, .08], ['Shoes', 1 * travellers, .8], ['Toiletries', 1 * travellers, .5], ['Documents', 1, .2], ['Charger', 1 * travellers, .2], ['Reusable bottle', 1 * travellers, .3]]; if (weather === 'Cold' || type === 'Mountain') list.push(['Jacket', travellers, 1.2]); if (weather === 'Rainy') list.push(['Rain cover', travellers, .3]); if (type === 'Business' || type === 'Wedding') list.push(['Formal outfit', Math.max(1, Math.ceil(days / 3)) * travellers, .6]); if (type === 'Beach') list.push(['Swimwear', 2 * travellers, .2]); if (activities.toLowerCase().includes('laptop') || type === 'Business') list.push(['Laptop', travellers, 1.5]); custom.split(',').map((x) => x.trim()).filter(Boolean).forEach((x) => list.push([x, 1, .3])); return list; };
  function renderPacking() { const items = packingItems(num('packDays'), Math.max(1, num('packTravellers')), text('packType'), text('packWeather'), text('packActivities'), text('packCustom')); const weight = items.reduce((sum, x) => sum + x[1] * x[2], 0); const remaining = num('packCapacity') - weight; $('packingResult').innerHTML = `<strong>${weight.toFixed(1)} kg current estimated weight</strong><span>Bag capacity ${num('packCapacity').toFixed(1)} kg | Remaining ${remaining.toFixed(1)} kg | ${remaining < 0 ? 'Over capacity: move items to another bag.' : 'Capacity available.'}</span><span>${esc(text('packDestination')) || 'Trip'} | ${esc(text('packType'))} | ${esc(text('packWeather'))}</span>`; $('packingList').innerHTML = items.map(([label, quantity, itemWeight], index) => `<label class="hub-list-item packing-row"><input type="checkbox" data-pack-index="${index}"><strong>${quantity} x ${esc(label)}</strong><small>Approx ${ (quantity * itemWeight).toFixed(1) } kg | ${index < 3 ? 'Core item' : 'Add or remove as needed'}</small></label>`).join(''); }
  function calculateBudget() { const fields = ['tbTransport', 'tbHotel', 'tbFood', 'tbActivities', 'tbShopping', 'tbLocal', 'tbTickets', 'tbParking', 'tbEmergency', 'tbMisc']; const planned = fields.reduce((sum, id) => sum + num(id), 0); const budget = num('tbTotal'); const actual = num('tbActual'); const used = budget ? (actual || planned) / budget * 100 : 0; const expected = num('tbDay') / Math.max(1, num('tbDays')) * 100; const scenario = planned + num('tbHotelChange') + num('tbFoodChange') - num('tbShoppingChange'); const buffer = budget - planned; $('travelBudgetResult').innerHTML = `<strong>${money(budget)} budget | ${money(planned)} planned | ${money(buffer)} buffer</strong><span>Per person ${money(planned / Math.max(1, num('tbPeople')))} | Remaining daily budget ${money((budget - (actual || planned)) / Math.max(1, num('tbDays') - num('tbDay') + 1))}</span><span>Trip day ${num('tbDay')}/${num('tbDays')} | Budget used ${used.toFixed(1)}% | Expected ${expected.toFixed(1)}% | Status: ${used > expected ? 'Spending above plan' : 'Within plan'}</span><span>Scenario total after changes: ${money(scenario)}</span>`; const totalForHealth = planned || 1; $('budgetHealth').innerHTML = fields.slice(0, 6).map((id) => `<div class="metric-row"><span>${id.replace('tb', '')}</span><b>${(num(id) / totalForHealth * 100).toFixed(1)}%</b></div>`).join(''); }
  function renderHistory(tool) { const history = loadHistory(tool); $('travelHistory').innerHTML = `<h4>Saved history</h4>${history.map((item) => `<div class="hub-list-item"><strong>${esc(item.title)}</strong><small>${esc(item.summary)} | ${new Date(item.saved).toLocaleString()}</small></div>`).join('') || '<p class="hub-muted">No saved projects yet.</p>'}`; }
  document.querySelectorAll('.hub-card').forEach((card) => card.addEventListener('click', () => { location.href = `?tool=${card.dataset.tool}`; }));
  $('hubSearch')?.addEventListener('input', () => { const query = $('hubSearch').value.toLowerCase(); document.querySelectorAll('.hub-card').forEach((card) => { card.hidden = !card.textContent.toLowerCase().includes(query); }); });
  const fromUrl = new URLSearchParams(location.search).get('tool'); if (fromUrl && toolNames[fromUrl]) { page.classList.add('is-focused'); document.querySelector('.hub-catalog').hidden = true; $('hubWorkspace').hidden = false; $('workspaceTitle').textContent = toolNames[fromUrl]; render(aliases[fromUrl] || fromUrl); $('hubWorkspace').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  $('workspaceClose').addEventListener('click', () => { location.href = '/travel-tools'; });
})();