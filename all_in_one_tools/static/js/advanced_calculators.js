(() => {
  const $ = (id) => document.getElementById(id);
  const num = (id) => Number($(id)?.value) || 0;
  const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const fixed = (value, digits = 2) => Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: digits });
  const set = (id, value) => { if ($(id)) $(id).textContent = value; };
  const percent = (value) => `${Number(value || 0).toFixed(2)}%`;
  const monthlyFuture = (payment, annualRate, months) => {
    const r = annualRate / 1200;
    return r ? payment * (((1 + r) ** months - 1) / r) * (1 + r) : payment * months;
  };

  function calculateSip() {
    const monthly = num('sipMonthly'), step = num('sipStepUp') / 100, rate = num('sipRate'), years = Math.max(1, num('sipYears')), goal = num('sipGoal'), inflation = num('sipInflation') / 100;
    let corpus = 0, invested = 0, payment = monthly, rows = [];
    for (let year = 1; year <= years; year += 1) {
      let yearInvested = 0;
      for (let month = 0; month < 12; month += 1) { corpus = corpus * (1 + rate / 1200) + payment; invested += payment; yearInvested += payment; }
      rows.push(`<tr><td>${year}</td><td>${money(yearInvested)}</td><td>${money(corpus)}</td><td>${money(corpus - invested)}</td></tr>`);
      payment *= 1 + step;
    }
    const real = corpus / ((1 + inflation) ** years), required = goal ? goal / (((1 + rate / 1200) ** (years * 12) - 1) / (rate / 1200 || 1)) / (1 + rate / 1200) : 0;
    set('sipCorpus', money(corpus)); set('sipInvested', money(invested)); set('sipReturns', money(corpus - invested)); set('sipReal', money(real)); set('sipRequired', goal ? money(required) : '--'); set('sipCagr', invested ? percent(((corpus / invested) ** (1 / years) - 1) * 100) : '--'); set('sipGoalResult', goal ? `${money(goal)} goal needs about ${money(required)}/month` : 'Add a goal for a target estimate'); $('sipSchedule').innerHTML = rows.join('');
  }

  function calculateCompound() {
    const principal = num('ciPrincipal'), rate = num('ciRate') / 100, years = Math.max(1, num('ciYears')), frequency = num('ciFrequency'), deposit = num('ciDeposit'), withdrawal = num('ciWithdrawal'), inflation = num('ciInflation') / 100;
    let balance = principal, deposits = 0, withdrawals = 0, milestones = [100000, 150000, 200000, 500000, 1000000], crossed = [];
    for (let month = 1; month <= years * 12; month += 1) { balance = balance * (1 + rate / frequency) ** (frequency / 12) + deposit - withdrawal; deposits += deposit; withdrawals += withdrawal; milestones.forEach((m) => { if (balance >= m && !crossed.some((x) => x.m === m)) crossed.push({ m, month }); }); }
    const future = Math.max(0, balance), totalAdded = principal + deposits - withdrawals;
    set('ciFuture', money(future)); set('ciPresent', `Present value ${money(future / ((1 + inflation) ** years))}`); set('ciInterest', money(future - totalAdded)); set('ciDeposits', money(deposits)); set('ciWithdrawals', money(withdrawals)); set('ciReal', money(future / ((1 + inflation) ** years))); $('ciMilestones').innerHTML = milestones.map((m) => { const found = crossed.find((x) => x.m === m); return `<div><b>${money(m)}</b><span>${found ? `crossed around year ${(found.month / 12).toFixed(1)}` : 'not reached in this plan'}</span></div>`; }).join('');
  }

  function calculateSalary() {
    const ctc = num('salCtc'), basic = ctc * num('salBasic') / 100, hra = basic * num('salHra') / 100, allow = num('salAllow'), bonus = num('salBonus'), pf = basic * num('salPf') / 100, gross = ctc - bonus, taxable = Math.max(0, gross - 75000 - pf), regime = $('salRegime').value;
    const tax = regime === 'new' ? Math.max(0, taxable - 700000) * .10 : Math.max(0, taxable - 500000) * .15, annual = Math.max(0, gross - pf * 12 - tax);
    set('salTakeHome', money(annual / 12)); set('salGross', `Gross monthly ${money(gross / 12)}`); set('salBasicOut', money(basic)); set('salHraOut', money(hra)); set('salPfOut', money(pf * 12)); set('salTaxOut', money(tax)); set('salAnnualOut', money(annual));
  }

  function calculateRentBuy() {
    const rent = num('rbRent'), rise = num('rbRentRise') / 100, price = num('rbPrice'), down = num('rbDown'), rate = num('rbRate') / 1200, loanYears = Math.max(1, num('rbYears')), maintenance = num('rbMaintenance'), appreciation = num('rbAppreciation') / 100, years = Math.max(1, num('rbCompare')), loan = Math.max(0, price - down), months = loanYears * 12, emi = rate ? loan * rate * (1 + rate) ** months / ((1 + rate) ** months - 1) : loan / months;
    let totalRent = 0, balance = loan, homeCost = down, breakEven = null, timeline = [];
    for (let year = 1; year <= years; year += 1) { const yearlyRent = rent * 12 * (1 + rise) ** (year - 1); totalRent += yearlyRent; homeCost += emi * 12 + maintenance; balance = Math.max(0, balance - (emi * 12 - balance * rate * 12)); const equity = price * (1 + appreciation) ** year - balance; if (!breakEven && equity >= totalRent) breakEven = year; timeline.push(`<div><b>Year ${year}</b><span>Rent ${money(totalRent)} | Home equity ${money(equity)}</span></div>`); }
    set('rbBreakEven', breakEven ? `Year ${breakEven}` : 'Beyond comparison'); set('rbSummary', 'Based on the assumptions shown'); set('rbRentOut', money(totalRent)); set('rbInterest', money(Math.max(0, emi * months - loan))); set('rbHomeCost', money(homeCost)); set('rbValue', money(price * (1 + appreciation) ** years)); $('rbTimeline').innerHTML = timeline.join('');
  }

  function calculateFuel() {
    const distance = num('fuelDistance') * (num('fuelRound') ? 2 : 1), mileage = Math.max(.1, num('fuelMileage')), price = num('fuelPrice'), trips = Math.max(1, num('fuelTrips')), litres = distance / mileage, fuelCost = litres * price, tolls = num('fuelTolls'), trip = fuelCost + tolls, yearly = trip * trips * 12, mileageB = Math.max(.1, num('fuelMileageB')), costB = distance / mileageB * num('fuelPriceB') + tolls;
    set('fuelTrip', money(trip)); set('fuelRequired', `Fuel required ${fixed(litres, 1)} litres`); set('fuelMonthly', money(trip * trips)); set('fuelYearly', money(yearly)); set('fuelLitres', fixed(litres, 1)); set('fuelFuelCost', money(fuelCost)); set('fuelCompare', `Vehicle B saves ${money(Math.max(0, (trip - costB) * trips * 12))} per year`);
  }

  function calculateElectricity() {
    const units = num('elecUnits'), fixedCharge = num('elecFixed'), taxRate = num('elecTax') / 100, subsidy = num('elecSubsidy'), slab = units <= 100 ? units * 3 : units <= 200 ? 300 + (units - 100) * 5 : 800 + (units - 200) * 7;
    const acUnits = num('elecAcHours') * num('elecAcWatt') / 1000 * num('elecDays'), tax = Math.max(0, slab + fixedCharge - subsidy) * taxRate, bill = Math.max(0, slab + fixedCharge + tax - subsidy), whatIf = num('elecAcHours') > 4 ? acUnits - 4 * num('elecAcWatt') / 1000 * num('elecDays') : 0;
    set('elecBill', money(bill)); set('elecBreakup', `Energy charge ${money(slab)}`); set('elecEnergy', money(slab)); set('elecTaxOut', money(tax)); set('elecAcUnits', fixed(acUnits, 1)); set('elecWhatIf', `${fixed(Math.max(0, whatIf), 1)} units saved`);
  }

  function calculatePercentage() {
    const x = num('pctX'), y = num('pctY'), rate = num('pctRate'), mode = $('pctMode').value; let result = 0, explain = '';
    if (mode === 'of') { result = rate * y / 100; explain = `${rate}% of ${fixed(y)} = ${fixed(result)}`; } else if (mode === 'what') { result = y ? x / y * 100 : 0; explain = `${fixed(x)} is ${fixed(result)}% of ${fixed(y)}`; } else if (mode === 'increase') { result = x * (1 + rate / 100); explain = `${fixed(x)} after ${rate}% increase`; } else if (mode === 'decrease') { result = x * (1 - rate / 100); explain = `${fixed(x)} after ${rate}% decrease`; } else if (mode === 'reverse') { result = x / Math.max(.0001, 1 - rate / 100); explain = `Original before ${rate}% discount`; } else { result = y ? (y - x) / y * 100 : 0; explain = 'Margin percentage'; }
    set('pctResult', fixed(result)); set('pctExplain', explain); set('pctChange', percent(y ? (x - y) / y * 100 : 0)); set('pctDifference', fixed(Math.abs(x - y))); set('pctSuccessive', fixed(x * (1 + rate / 100) * (1 - rate / 100)));
  }

  function calculateStatistics() {
    const data = $('statsData').value.split(',').map(Number).filter(Number.isFinite).sort((a, b) => a - b); if (!data.length) return;
    const mean = data.reduce((a, b) => a + b, 0) / data.length, median = data.length % 2 ? data[(data.length - 1) / 2] : (data[data.length / 2 - 1] + data[data.length / 2]) / 2, variance = data.reduce((s, x) => s + (x - mean) ** 2, 0) / data.length, q = (p) => data[Math.floor((data.length - 1) * p)]; const counts = {}; data.forEach((x) => { counts[x] = (counts[x] || 0) + 1; }); const maxCount = Math.max(...Object.values(counts)), modes = Object.keys(counts).filter((x) => counts[x] === maxCount && maxCount > 1); const low = q(.25), high = q(.75), outliers = data.filter((x) => x < low - 1.5 * (high - low) || x > high + 1.5 * (high - low));
    set('statsMean', fixed(mean)); set('statsSummary', `${data.length} values | sum ${fixed(data.reduce((a, b) => a + b, 0))}`); set('statsMedian', fixed(median)); set('statsMode', modes.length ? modes.join(', ') : 'No mode'); set('statsRange', fixed(data[data.length - 1] - data[0])); set('statsStd', fixed(Math.sqrt(variance))); set('statsQuartiles', `${fixed(low)} / ${fixed(high)}`); set('statsOutliers', outliers.length ? outliers.join(', ') : 'None'); $('statsBars').innerHTML = data.slice(0, 20).map((x) => `<i style="height:${Math.max(8, Math.min(100, x / Math.max(...data) * 100))}%" title="${x}"></i>`).join('');
  }

  function calculateProbability() {
    const favourable = num('probFavourable'), total = Math.max(1, num('probTotal')), trials = Math.max(1, num('probTrials')), chance = Math.max(0, Math.min(100, num('probChance'))) / 100, probability = Math.max(0, Math.min(1, favourable / total)), successes = Array.from({ length: Math.min(trials, 20000) }, () => Math.random() < chance).filter(Boolean).length;
    const combination = (n, r) => { let result = 1; for (let i = 1; i <= r; i += 1) result = result * (n - r + i) / i; return result; };
    set('probResult', percent(probability * 100)); set('probSimulated', `Simulated ${successes}/${Math.min(trials, 20000)} successes`); set('probComplement', percent((1 - probability) * 100)); set('probExpected', fixed(trials * chance)); set('probCombination', fixed(combination(Math.max(total, favourable), Math.min(favourable, total)))); set('probVariance', fixed(trials * chance * (1 - chance))); $('probBars').innerHTML = `<i style="height:${Math.max(5, probability * 100)}%" title="Probability"></i><i style="height:${Math.max(5, (1 - probability) * 100)}%" title="Complement"></i>`;
  }

  function calculateGeometry() {
    const shape = $('geoShape').value, a = num('geoA'), b = num('geoB'), c = num('geoC'); let area = 0, perimeter = 0, volume = 0;
    if (shape === 'rectangle') { area = a * b; perimeter = 2 * (a + b); } else if (shape === 'circle') { area = Math.PI * a ** 2; perimeter = 2 * Math.PI * a; } else if (shape === 'triangle') { const s = (a + b + c) / 2; area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c))); perimeter = a + b + c; } else if (shape === 'cube') { area = 6 * a ** 2; volume = a ** 3; } else if (shape === 'cylinder') { area = 2 * Math.PI * a * (a + b); volume = Math.PI * a ** 2 * b; } else { area = 4 * Math.PI * a ** 2; volume = 4 / 3 * Math.PI * a ** 3; }
    set('geoPrimary', fixed(volume || area)); set('geoSecondary', volume ? `Volume ${fixed(volume)} cubic units` : `Area ${fixed(area)} square units`); set('geoArea', fixed(area)); set('geoPerimeter', fixed(perimeter)); set('geoVolume', fixed(volume));
  }

  function calculateUnits() {
    const value = num('unitValue'), category = $('unitCategory').value; const maps = { length: { meter: 1, kilometer: .001, centimeter: 100, foot: 3.28084, inch: 39.3701 }, weight: { kilogram: 1, gram: 1000, pound: 2.20462, ounce: 35.274 }, speed: { 'km/h': 1, mph: .621371, 'm/s': .277778 }, data: { byte: 1, KB: 1 / 1024, MB: 1 / 1048576, GB: 1 / 1073741824 }, time: { second: 1, minute: 1 / 60, hour: 1 / 3600, day: 1 / 86400 } }; if (category === 'temperature') { const c = value; $('unitResults').innerHTML = `<div><b>${fixed(c)} C</b><span>${fixed(c * 9 / 5 + 32)} F | ${fixed(c + 273.15)} K</span></div>`; set('unitPrimary', `${fixed(c * 9 / 5 + 32)} F`); set('unitSummary', 'Temperature conversion'); return; } const map = maps[category], base = value / (map[$('unitFrom').value] || 1); $('unitResults').innerHTML = Object.entries(map).map(([name, factor]) => `<div><b>${name}</b><span>${fixed(base * factor, 5)}</span></div>`).join(''); set('unitPrimary', fixed(base)); set('unitSummary', `All ${category} units`);
  }

  function calculateDate() {
    const start = new Date(`${$('dateStart').value}T00:00:00`), end = new Date(`${$('dateEnd').value}T00:00:00`); if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return; const days = Math.round((end - start) / 86400000), weekend = $('dateWeekend').value.split(',').map(Number); let work = 0; for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) if (!weekend.includes(d.getDay())) work += 1; const added = new Date(start); added.setDate(added.getDate() + num('dateAdd')); set('dateDifference', `${Math.abs(days)} days`); set('dateBusiness', `Business days ${Math.max(0, work)}`); set('dateDays', Math.abs(days)); set('dateWeeks', fixed(Math.abs(days) / 7)); set('dateWorkdays', Math.max(0, work)); set('dateAdded', added.toLocaleDateString('en-IN'));
  }

  function duration(idStart, idEnd) { const [sh, sm] = $(idStart).value.split(':').map(Number), [eh, em] = $(idEnd).value.split(':').map(Number); let value = (eh * 60 + em) - (sh * 60 + sm); if (value < 0) value += 1440; return value; }
  function calculateTime() { const first = duration('timeStart1', 'timeEnd1'), second = duration('timeStart2', 'timeEnd2'), total = first + second, overtime = Math.max(0, total - num('timeOvertime')), moneyOut = total / 60 * num('timeRate'); const fmt = (x) => `${Math.floor(x / 60)}h ${x % 60}m`; set('timeTotal', fmt(total)); set('timePay', `Estimated pay ${money(moneyOut)}`); set('timeOut1', fmt(first)); set('timeOut2', fmt(second)); set('timeBreak', fmt(Math.max(0, 1440 - total))); set('timeOvertimeOut', fmt(overtime * 60)); }

  function calculateDeveloper() { const base = num('devBase'), value = parseInt($('devValue').value, base) || 0, other = parseInt($('devOther').value, 10) || 0, op = $('devOperation').value; const bit = op === 'and' ? value & other : op === 'or' ? value | other : op === 'xor' ? value ^ other : value << other; set('devDecimal', value); set('devHex', `HEX ${value.toString(16).toUpperCase()}`); set('devBinary', value.toString(2)); set('devOctal', value.toString(8)); set('devBitwise', bit); set('devAscii', value >= 32 && value <= 126 ? String.fromCharCode(value) : 'Non-printable'); $('devBits').innerHTML = value.toString(2).padStart(8, '0').split('').map((x, i) => `<i><b>${x}</b><small>${2 ** (7 - i)}</small></i>`).join(''); }

  function calculateStorage() { const users = num('storeUsers'), perUser = num('storePerUser'), fileBytes = num('storeFileSize') * num('storeFileUnit') * 1024 * 1024, totalMb = users * perUser, totalBytes = totalMb * 1024 * 1024, speed = Math.max(.1, num('storeSpeed')) * 1000000 * num('storeEfficiency') / 100, seconds = fileBytes * 8 / speed; const fmtTime = (s) => s < 60 ? `${fixed(s)} sec` : `${fixed(s / 60)} min`; set('storeTotal', `${fixed(totalMb / 1024, 2)} GB`); set('storeDownload', `Download time ${fmtTime(seconds)}`); set('storeDecimal', `${fixed(totalBytes / 1e9, 2)} GB`); set('storeBinary', `${fixed(totalBytes / 1073741824, 2)} GiB`); set('storeBandwidth', `${fixed(totalMb * 8 / 3600, 2)} Mbps-hour`); set('storeUpload', fmtTime(seconds)); }

  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return Math.abs(a) || 1; };
  function calculateConstruction() { const volume = num('buildLength') * num('buildWidth') * num('buildDepth'), factor = 1 + num('buildWaste') / 100, concrete = volume * factor, cement = concrete * 0.25, sand = concrete * 0.5, aggregate = concrete * 1, bricks = num('buildLength') * num('buildWidth') * 8 * factor, cost = cement * num('buildCementRate') + bricks * num('buildBrickRate'); set('buildVolume', `${fixed(concrete)} cu ft`); set('buildCost', `Estimated cost ${money(cost)}`); set('buildCement', `${fixed(cement)} bags approx.`); set('buildSand', fixed(sand)); set('buildAggregate', fixed(aggregate)); set('buildBricks', fixed(bricks)); }
  function calculateBandwidth() { const bytes = num('bandFile') * num('bandUnit') * 1024 * 1024, speed = num('bandSpeed') * num('bandSpeedUnit') * 1000000 * num('bandEfficiency') / 100, seconds = bytes * 8 / Math.max(1, speed), fmt = (s) => s < 60 ? `${fixed(s)} sec` : `${fixed(s / 60)} min`; set('bandTime', fmt(seconds)); set('bandOutput', `${fixed(bytes / 1073741824, 2)} GiB at ${fixed(speed / 1000000, 1)} Mbps effective`); $('bandTable').innerHTML = [10, 50, 100, 500].map((x) => `<div><b>${x} Mbps</b><span>${fmt(bytes * 8 / (x * 1000000 * num('bandEfficiency') / 100))}</span></div>`).join(''); }
  function calculateRatio() { const a = num('ratioA'), b = num('ratioB'), known = num('ratioKnown'), unit = gcd(a, b), unknown = $('ratioSide').value === 'second' ? known * b / Math.max(1, a) : known * a / Math.max(1, b), total = a + b; set('ratioResult', `${fixed(a / unit)} : ${fixed(b / unit)}`); set('ratioExplain', `Missing value ${fixed(unknown)}`); set('ratioPctA', percent(total ? a / total * 100 : 0)); set('ratioPctB', percent(total ? b / total * 100 : 0)); set('ratioEquivalent', `${fixed(a * 2)} : ${fixed(b * 2)}`); }
  function calculateCooking() { const amount = num('cookAmount') * num('cookTarget') / Math.max(1, num('cookOriginal')); set('cookResult', `${fixed(amount)} ${$('cookUnit').value}`); set('cookExplain', `Scaled for ${num('cookTarget')} servings`); }
  function calculateGpa() { const current = num('gpaCurrent'), completed = num('gpaCompleted'), target = num('gpaTarget'), remaining = num('gpaRemaining'), currentPoints = current * completed, targetPoints = target * (completed + remaining), required = (targetPoints - currentPoints) / Math.max(1, remaining); set('gpaRequired', `${fixed(required)} / 10`); set('gpaExplain', required <= 10 ? 'Target is mathematically reachable' : 'Target exceeds the remaining-credit maximum'); set('gpaCurrentPoints', fixed(currentPoints)); set('gpaTargetPoints', fixed(targetPoints)); set('gpaSemesters', fixed(remaining / Math.max(1, num('gpaSemesterCredits')))); }
  function calculateMarks() { const current = num('marksAssignment') + num('marksInternal') + num('marksPractical') + num('marksMidterm'), finalMax = num('marksFinalMax'), totalMax = current + finalMax, passTotal = totalMax * num('marksPass') / 100, required = Math.max(0, passTotal - current); set('marksRequired', `${fixed(Math.min(finalMax, required))} / ${fixed(finalMax)}`); set('marksSummary', required > finalMax ? 'Passing target is not reachable with these marks' : 'Minimum final exam marks'); set('marksCurrent', fixed(current)); set('marksPercent', percent(totalMax ? current / totalMax * 100 : 0)); set('marksPassingTotal', fixed(passTotal)); }
  function calculateLoanCompare() { const p = num('lcAmount'), years = Math.max(1, num('lcYears')), months = years * 12, emi = (rate) => { const r = rate / 1200; return r ? p * r * (1 + r) ** months / ((1 + r) ** months - 1) : p / months; }, a = emi(num('lcRateA')), b = emi(num('lcRateB')), totalA = a * months, totalB = b * months; set('lcDifference', money(Math.abs(a - b))); set('lcSummary', `${b < a ? 'Loan B' : 'Loan A'} has the lower EMI`); set('lcEmiA', money(a)); set('lcEmiB', money(b)); set('lcInterestDiff', money(Math.abs((totalA - p) - (totalB - p)))); set('lcTotals', `${money(totalA)} / ${money(totalB)}`); }
  const actions = { sip: calculateSip, compound: calculateCompound, salary: calculateSalary, rentbuy: calculateRentBuy, fuel: calculateFuel, electricity: calculateElectricity, percentage: calculatePercentage, statistics: calculateStatistics, probability: calculateProbability, geometry: calculateGeometry, units: calculateUnits, datetime: calculateDate, productivity: calculateTime, developer: calculateDeveloper, storage: calculateStorage, construction: calculateConstruction, bandwidth: calculateBandwidth, ratio: calculateRatio, cooking: calculateCooking, gpa: calculateGpa, marks: calculateMarks, loancompare: calculateLoanCompare };
  Object.entries(actions).forEach(([name, fn]) => { const button = document.querySelector(`[data-panel="${name}"] .primary-btn`); if (button) { button.onclick = fn; fn(); } });
  const today = new Date(), dateString = today.toISOString().slice(0, 10); if ($('dateStart')) $('dateStart').value = dateString; if ($('dateEnd')) { const end = new Date(today); end.setDate(end.getDate() + 30); $('dateEnd').value = end.toISOString().slice(0, 10); calculateDate(); }
})();
