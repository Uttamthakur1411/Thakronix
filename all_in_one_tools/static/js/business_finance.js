(() => {
  const KEY = 'tf-business-finance-v1';
  const MAX_AMOUNT = 1000000000000;
  const field = (id, label, type = 'number', placeholder = '0', options = []) => [id, label, type, placeholder, options];
  const text = (id, label, placeholder = '') => field(id, label, 'text', placeholder);
  const date = (id, label) => field(id, label, 'date', '');
  const select = (id, label, options) => field(id, label, 'select', '', options);
  const definitions = {
    gst: { title: 'GST / Tax Invoice Calculator', intro: 'Calculate inclusive or exclusive GST/VAT, discount-first taxable value, local or interstate tax split and invoice rounding.', fields: [field('gstAmount', 'Amount', 'number', '10000'), field('gstRate', 'GST / VAT rate (%)', 'number', '18'), field('gstDiscount', 'Discount (%)', 'number', '0'), select('gstMode', 'Entered amount', [['exclusive', 'Tax exclusive'], ['inclusive', 'Tax inclusive']]), select('gstSupply', 'Supply type', [['intra', 'Intra-state (CGST + SGST)'], ['inter', 'Inter-state (IGST)']]), select('gstRound', 'Round total', [['none', 'No round-off'], ['rupee', 'Nearest rupee']])], summary: 'gstAmount' },
    cashflow: { title: 'Cash Flow Calculator', intro: 'Combine opening balance, operating income, collections and payments, then project future cash and shortage risk.', fields: [field('cfOpening', 'Opening balance', 'number', '50000'), field('cfIncome', 'Sales / other income', 'number', '0'), field('cfReceivables', 'Receivables collected', 'number', '0'), field('cfExpenses', 'Expenses', 'number', '0'), field('cfPayables', 'Payables paid', 'number', '0'), select('cfPeriod', 'Period', [['daily', 'Daily'], ['monthly', 'Monthly']]), field('cfDays', 'Forecast days', 'number', '30'), field('cfThreshold', 'Minimum cash threshold', 'number', '0')], summary: 'cfOpening' },
    receivables: { title: 'Accounts Receivable Tracker', intro: 'Record customer invoices and payments. Outstanding, payment status and overdue days are calculated automatically.', fields: [text('arCustomer', 'Customer', 'Customer name'), text('arInvoice', 'Invoice number', 'INV-2026-0001'), field('arAmount', 'Invoice amount', 'number', '0'), field('arPaid', 'Paid amount', 'number', '0'), date('arDue', 'Due date')], summary: 'arCustomer', tracked: true },
    payables: { title: 'Accounts Payable Tracker', intro: 'Track supplier bills, outstanding balances, overdue dates and upcoming payments.', fields: [text('apVendor', 'Supplier / vendor', 'Vendor name'), text('apBill', 'Purchase bill number', 'BILL-001'), field('apAmount', 'Bill amount', 'number', '0'), field('apPaid', 'Paid amount', 'number', '0'), date('apDue', 'Due date')], summary: 'apVendor', tracked: true },
    paymenttracker: { title: 'Customer Payment Tracker', intro: 'Save payment events against customer invoices and follow advance, paid and remaining balances.', fields: [text('payCustomer', 'Customer', 'Customer name'), text('payInvoice', 'Invoice / order', 'Invoice number'), field('payTotal', 'Total amount', 'number', '0'), field('payAdvance', 'Advance received', 'number', '0'), field('payAmount', 'This payment', 'number', '0'), date('payDate', 'Payment date'), select('payMethod', 'Payment method', [['UPI', 'UPI'], ['Bank', 'Bank transfer'], ['Cash', 'Cash'], ['Card', 'Card'], ['Cheque', 'Cheque'], ['Other', 'Other']])], summary: 'payCustomer', tracked: true },
    businessloan: { title: 'Business Loan Calculator', intro: 'Estimate reducing-balance EMI, processing fee, total interest, a first-year amortization schedule and monthly prepayment savings.', fields: [field('loanAmount', 'Loan amount', 'number', '1000000'), field('loanRate', 'Annual interest (%)', 'number', '12'), field('loanMonths', 'Tenure (months)', 'number', '60'), field('loanFee', 'Processing fee (%)', 'number', '1'), field('loanExtra', 'Extra monthly prepayment', 'number', '0')], summary: 'loanAmount' },
    revenue: { title: 'Business Revenue Calculator', intro: 'Project daily, weekly and monthly revenue per product, save multiple products and calculate units needed for a target.', fields: [text('revProduct', 'Product / service', 'Product name'), field('revUnits', 'Units sold', 'number', '0'), field('revPrice', 'Selling price per unit', 'number', '0'), select('revPeriod', 'Sales period', [['day', 'Daily'], ['week', 'Weekly'], ['month', 'Monthly']]), field('revTarget', 'Target monthly revenue', 'number', '0')], summary: 'revProduct', tracked: true },
    salestarget: { title: 'Sales Target Calculator', intro: 'Translate a monthly revenue target into remaining orders, customers and a realistic daily pace.', fields: [field('targetAmount', 'Monthly sales target', 'number', '500000'), field('targetAchieved', 'Sales achieved so far', 'number', '0'), field('targetAov', 'Average order value', 'number', '2500'), field('targetConversion', 'Lead conversion (%)', 'number', '10'), field('targetDays', 'Selling days remaining', 'number', '20')], summary: 'targetAmount' },
    businessroi: { title: 'Business ROI Calculator', intro: 'Compare investment scenarios using revenue, expenses, time period and net return.', fields: [text('roiName', 'Investment / campaign', 'Investment name'), field('roiInvestment', 'Investment', 'number', '0'), field('roiRevenue', 'Revenue generated', 'number', '0'), field('roiExpenses', 'Other expenses', 'number', '0'), field('roiMonths', 'Period (months)', 'number', '12')], summary: 'roiName', tracked: true },
    clv: { title: 'Customer Lifetime Value Calculator', intro: 'Estimate gross-margin-adjusted customer value and compare a second retention or purchase scenario.', fields: [field('clvAov', 'Average order value', 'number', '2500'), field('clvFrequency', 'Purchases per year', 'number', '4'), field('clvYears', 'Customer lifespan (years)', 'number', '3'), field('clvMargin', 'Gross margin (%)', 'number', '40'), field('clvScenarioFrequency', 'Scenario purchases per year', 'number', '5'), field('clvScenarioYears', 'Scenario lifespan (years)', 'number', '4')], summary: 'clvAov' },
    employeecost: { title: 'Employee Cost Calculator', intro: 'Calculate total monthly and annual employer cost per person and across a team.', fields: [text('empName', 'Employee / role', 'Name or role'), field('empSalary', 'Basic monthly salary', 'number', '0'), field('empAllowances', 'Monthly allowances', 'number', '0'), field('empBonus', 'Monthly bonus provision', 'number', '0'), field('empContribution', 'Employer contributions (%)', 'number', '0'), field('empBenefits', 'Monthly benefits', 'number', '0'), field('empCount', 'Employee count', 'number', '1')], summary: 'empName' },
    overtime: { title: 'Overtime Calculator', intro: 'Calculate overtime pay from monthly salary or hourly rate, overtime multiplier and payroll period.', fields: [text('otEmployee', 'Employee / role', 'Employee name'), field('otSalary', 'Monthly salary (optional)', 'number', '0'), field('otRate', 'Hourly rate (overrides salary)', 'number', '0'), field('otRegular', 'Regular hours per week', 'number', '40'), field('otHours', 'Overtime hours per week', 'number', '0'), field('otMultiplier', 'Overtime multiplier', 'number', '1.5')], summary: 'otEmployee' },
    businessbudget: { title: 'Business Budget Planner', intro: 'Compare planned vs actual revenue, rent, salaries, marketing, utilities, inventory, software and miscellaneous costs.', fields: [field('budRevenuePlan', 'Revenue target', 'number', '0'), field('budRevenueActual', 'Actual revenue', 'number', '0'), field('budRentPlan', 'Rent planned', 'number', '0'), field('budRentActual', 'Rent actual', 'number', '0'), field('budSalaryPlan', 'Salaries planned', 'number', '0'), field('budSalaryActual', 'Salaries actual', 'number', '0'), field('budMarketingPlan', 'Marketing planned', 'number', '0'), field('budMarketingActual', 'Marketing actual', 'number', '0'), field('budUtilitiesPlan', 'Utilities planned', 'number', '0'), field('budUtilitiesActual', 'Utilities actual', 'number', '0'), field('budInventoryPlan', 'Inventory planned', 'number', '0'), field('budInventoryActual', 'Inventory actual', 'number', '0'), field('budSoftwarePlan', 'Software planned', 'number', '0'), field('budSoftwareActual', 'Software actual', 'number', '0'), field('budMiscPlan', 'Miscellaneous planned', 'number', '0'), field('budMiscActual', 'Miscellaneous actual', 'number', '0')], summary: 'budRevenuePlan' },
    commission: { title: 'Sales Commission Calculator', intro: 'Calculate fixed plus percentage or tiered commission, target achievement and employee-wise saved payouts.', fields: [text('comEmployee', 'Employee', 'Employee name'), field('comSales', 'Sales amount', 'number', '0'), field('comFixed', 'Fixed commission', 'number', '0'), field('comRate', 'Base commission (%)', 'number', '0'), field('comThreshold', 'Tier threshold', 'number', '0'), field('comTierRate', 'Rate above threshold (%)', 'number', '0'), field('comTarget', 'Sales target', 'number', '0')], summary: 'comEmployee', tracked: true },
    inventory: { title: 'Inventory Valuation Calculator', intro: 'Save multiple products and track quantity, stock value, potential sales revenue and expected gross profit.', fields: [text('invProduct', 'Product', 'Product name'), text('invSku', 'SKU / reference', 'SKU'), field('invQuantity', 'Quantity in stock', 'number', '0'), field('invPurchase', 'Purchase price per unit', 'number', '0'), field('invSelling', 'Selling price per unit', 'number', '0')], summary: 'invProduct', tracked: true },
    purchasecost: { title: 'Purchase Cost Calculator', intro: 'Calculate true landed purchase cost after shipping, tax, packaging and other charges.', fields: [text('pcProduct', 'Product', 'Product name'), field('pcQuantity', 'Quantity', 'number', '1'), field('pcPrice', 'Supplier price per unit', 'number', '0'), field('pcShipping', 'Shipping', 'number', '0'), field('pcTax', 'Tax (%)', 'number', '0'), field('pcPackaging', 'Packaging', 'number', '0'), field('pcOther', 'Other charges', 'number', '0')], summary: 'pcProduct' },
    productprofit: { title: 'Product Profitability Calculator', intro: 'Include purchase, packaging, shipping, marketplace, payment and marketing costs to see true unit margin.', fields: [text('ppProduct', 'Product / service', 'Product name'), field('ppPrice', 'Selling price', 'number', '0'), field('ppCost', 'Purchase cost', 'number', '0'), field('ppPackaging', 'Packaging cost', 'number', '0'), field('ppShipping', 'Shipping cost', 'number', '0'), field('ppPlatform', 'Platform fee (%)', 'number', '0'), field('ppPayment', 'Payment gateway fee (%)', 'number', '0'), field('ppMarketing', 'Marketing cost per sale', 'number', '0')], summary: 'ppProduct' },
    marketplace: { title: 'Marketplace Fee Calculator', intro: 'Estimate seller payout and actual profit after platform, payment, shipping, tax and product costs.', fields: [text('marketProduct', 'Product / marketplace', 'Product name'), field('marketPrice', 'Selling price', 'number', '0'), field('marketCost', 'Product cost', 'number', '0'), field('marketCommission', 'Platform commission (%)', 'number', '0'), field('marketPayment', 'Payment fee (%)', 'number', '0'), field('marketShipping', 'Shipping', 'number', '0'), field('marketTax', 'Tax / withholding (%)', 'number', '0'), field('marketOther', 'Other charges', 'number', '0')], summary: 'marketProduct' },
    discountprofit: { title: 'Discount & Profit Calculator', intro: 'Check profit and margin after discount and tax, and calculate the maximum discount allowed by your target margin.', fields: [field('dpCost', 'Cost price', 'number', '0'), field('dpMrp', 'MRP', 'number', '0'), field('dpSelling', 'Selling price before discount', 'number', '0'), field('dpDiscount', 'Discount (%)', 'number', '0'), field('dpTax', 'GST / VAT (%)', 'number', '0'), field('dpTargetMargin', 'Minimum target margin (%)', 'number', '20')], summary: 'dpMrp' },
    breakeven: { title: 'Business Break-Even Simulator', intro: 'Model fixed and variable costs, units, revenue, profit/loss and multiple price/cost scenarios. Optional product mix rows use name, price, variable cost and mix quantity.', fields: [field('beFixed', 'Fixed cost', 'number', '600'), field('beVariable', 'Variable cost per unit', 'number', '15'), field('bePrice', 'Selling price per unit', 'number', '35'), field('beUnits', 'Planned units', 'number', '50'), field('beScenarioPrice', 'Scenario selling price', 'number', '30'), field('beScenarioVariable', 'Scenario variable cost', 'number', '15'), field('beProducts', 'Product mix: name, price, variable cost, mix quantity', 'textarea', 'Product A,35,15,1\nProduct B,50,22,2')], summary: 'beFixed' },
    quoteinvoice: { title: 'Quotation → Invoice Workflow', intro: 'Keep customer and line items together while moving from quotation to acceptance, invoice, payment and receipt.', fields: [text('qiCustomer', 'Customer', 'Customer name'), text('qiCompany', 'Business name', 'Your business'), text('qiQuote', 'Quote number', 'QT-2026-0001'), text('qiInvoice', 'Invoice number', 'INV-2026-0001'), field('qiItems', 'Line items: name, quantity, unit price', 'textarea', 'Design,1,15000\nSupport,2,2500'), field('qiDiscount', 'Discount (%)', 'number', '0'), field('qiTax', 'Tax (%)', 'number', '18'), date('qiDue', 'Due date'), select('qiStage', 'Workflow stage', [['Quotation', 'Quotation'], ['Accepted', 'Accepted'], ['Invoice', 'Invoice'], ['Payment', 'Payment'], ['Receipt', 'Receipt']])], summary: 'qiCustomer', tracked: true, workflow: true },
    purchaseorder: { title: 'Purchase Order → Inventory Workflow', intro: 'Track a purchase order through goods received; received quantities update the browser-local stock ledger.', fields: [text('poVendor', 'Vendor', 'Vendor name'), text('poNumber', 'PO number', 'PO-2026-0001'), text('poProduct', 'Product', 'Product name'), field('poOrdered', 'Quantity ordered', 'number', '0'), field('poReceived', 'Quantity received', 'number', '0'), field('poPrice', 'Purchase price per unit', 'number', '0'), date('poDelivery', 'Expected delivery')], summary: 'poVendor', tracked: true, workflow: true },
    challan: { title: 'Delivery Challan → Invoice Workflow', intro: 'Record customer, delivery address, items, vehicle reference and status, then convert a delivery into an invoice record.', fields: [text('dcCustomer', 'Customer', 'Customer name'), text('dcAddress', 'Delivery address', 'Address'), text('dcItem', 'Item', 'Product / service'), field('dcQuantity', 'Quantity', 'number', '0'), text('dcVehicle', 'Vehicle / reference', 'Vehicle or docket'), text('dcNumber', 'Challan number', 'DC-2026-0001'), select('dcStatus', 'Delivery status', [['Prepared', 'Prepared'], ['Dispatched', 'Dispatched'], ['Delivered', 'Delivered'], ['Invoiced', 'Invoiced']]), field('dcPrice', 'Unit price for invoice conversion', 'number', '0')], summary: 'dcCustomer', tracked: true, workflow: true },
    numbering: { title: 'Business Document Numbering Manager', intro: 'Set document prefixes, financial year and sequence rules, preview formats and issue unique numbers locally.', fields: [select('numType', 'Document type', [['INV', 'Invoice'], ['QT', 'Quotation'], ['PO', 'Purchase order'], ['DC', 'Delivery challan'], ['REC', 'Receipt']]), text('numPrefix', 'Custom prefix (optional)', 'Leave blank for type prefix'), text('numYear', 'Financial year', '2026-27'), field('numStart', 'Starting number', 'number', '1'), field('numDigits', 'Number of digits', 'number', '4')], summary: 'numPrefix', tracked: true, workflow: true },
    customers: { title: 'Business Customer Directory', intro: 'Save customer profiles and see matching order, receivable and payment totals from your local business records.', fields: [text('custName', 'Customer name', 'Name'), text('custCompany', 'Company', 'Company'), text('custPhone', 'Phone', 'Phone'), text('custEmail', 'Email', 'Email'), text('custAddress', 'Address', 'Address'), text('custTaxId', 'GST / tax ID', 'Tax ID'), field('custNotes', 'Notes', 'textarea', 'Customer notes')], summary: 'custName', tracked: true },
    vendors: { title: 'Supplier / Vendor Manager', intro: 'Save supplier contacts, products supplied, purchase history and outstanding payable balances.', fields: [text('venName', 'Vendor / supplier', 'Vendor name'), text('venCompany', 'Company', 'Company'), text('venContact', 'Contact', 'Phone or email'), text('venProducts', 'Products supplied', 'Products'), text('venTaxId', 'GST / tax ID', 'Tax ID'), field('venNotes', 'Notes', 'textarea', 'Vendor notes')], summary: 'venName', tracked: true },
    orders: { title: 'Business Order Manager', intro: 'Save order details, line values, discount, tax, payment and delivery status and print an order summary.', fields: [text('ordNumber', 'Order number', 'ORD-2026-0001'), text('ordCustomer', 'Customer', 'Customer name'), field('ordItems', 'Items: name, quantity, unit price', 'textarea', 'Product,2,500'), field('ordDiscount', 'Discount (%)', 'number', '0'), field('ordTax', 'Tax (%)', 'number', '18'), select('ordPayment', 'Payment status', [['Unpaid', 'Unpaid'], ['Partial', 'Partial'], ['Paid', 'Paid']]), select('ordStatus', 'Order status', [['New', 'New'], ['Processing', 'Processing'], ['Ready', 'Ready'], ['Cancelled', 'Cancelled']]), select('ordDelivery', 'Delivery status', [['Pending', 'Pending'], ['Packed', 'Packed'], ['Shipped', 'Shipped'], ['Delivered', 'Delivered']])], summary: 'ordCustomer', tracked: true, workflow: true },
    businessdashboard: { title: 'Business Dashboard', intro: 'Review connected local finance and business records: revenue, expenses, profit, orders, inventory, receivables and payables.', fields: [], summary: 'Business totals' }
  };

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const amount = (value) => { const parsed = Number(value); return Number.isFinite(parsed) ? Math.min(Math.max(parsed, -MAX_AMOUNT), MAX_AMOUNT) : 0; };
  const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const today = () => new Date().toISOString().slice(0, 10);
  const daysLate = (due) => due ? Math.max(0, Math.floor((Date.now() - new Date(`${due}T00:00:00`).getTime()) / 86400000)) : 0;
  const ratio = (numerator, denominator) => denominator ? numerator / denominator : 0;
  const readNumber = (values, key) => amount(values[key]);
  const readStore = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const store = readStore();
  const saveStore = () => localStorage.setItem(KEY, JSON.stringify(store));
  const list = (tool) => Array.isArray(store[tool]) ? store[tool] : [];
  const latestRecords = (tool, keyOf) => {
    const latest = new Map();
    list(tool).forEach((row) => { const key = keyOf(row) || row.id; if (!latest.has(key)) latest.set(key, row); });
    return [...latest.values()];
  };
  const pushRecord = (tool, values, result) => { store[tool] = [{ id: crypto.randomUUID(), createdAt: new Date().toISOString(), values, result }, ...list(tool)].slice(0, 500); saveStore(); };
  const getBaseFinance = () => { try { return JSON.parse(localStorage.getItem('tf-finance-data')) || {}; } catch { return {}; } };

  function renderField(item) {
    const [id, label, type, placeholder, options] = item;
    if (type === 'select') return `<label class="finance-field"><span>${esc(label)}</span><select id="${id}">${(options || []).map(([value, textValue]) => `<option value="${esc(value)}">${esc(textValue)}</option>`).join('')}</select></label>`;
    if (type === 'textarea') return `<label class="finance-field finance-span-2"><span>${esc(label)}</span><textarea id="${id}" class="finance-textarea" rows="4" placeholder="${esc(placeholder)}"></textarea></label>`;
    const attrs = type === 'number' ? `min="0" max="${MAX_AMOUNT}" step="0.01" inputmode="decimal"` : '';
    return `<label class="finance-field"><span>${esc(label)}</span><input id="${id}" type="${type}" ${attrs} placeholder="${esc(placeholder)}"></label>`;
  }

  function valuesFrom(config) {
    return Object.fromEntries(config.fields.map(([id]) => [id, document.getElementById(id)?.value ?? '']));
  }

  function result(headline, detail, chart = [], table = null) { return { headline, detail, chart, table }; }

  function parseLines(raw) {
    return String(raw || '').split(/\r?\n/).map((line) => {
      const [name, quantity, price] = line.split(',').map((part) => part?.trim() || '');
      return { name, quantity: amount(quantity), price: amount(price) };
    }).filter((line) => line.name && line.quantity > 0 && line.price >= 0);
  }

  function parseBreakEvenProducts(raw) {
    return String(raw || '').split(/\r?\n/).map((line) => {
      const [name, price, variable, mix] = line.split(',').map((part) => part?.trim() || '');
      return { name, price: amount(price), variable: amount(variable), mix: amount(mix) };
    }).filter((product) => product.name && product.mix > 0);
  }

  function calculate(tool, values) {
    const n = (key) => readNumber(values, key);
    switch (tool) {
      case 'gst': {
        const discounted = n('gstAmount') * (1 - n('gstDiscount') / 100);
        const taxable = values.gstMode === 'inclusive' ? discounted / (1 + n('gstRate') / 100) : discounted;
        const tax = values.gstMode === 'inclusive' ? discounted - taxable : taxable * n('gstRate') / 100;
        const cgst = values.gstSupply === 'intra' ? tax / 2 : 0;
        const sgst = cgst;
        const igst = values.gstSupply === 'inter' ? tax : 0;
        const rawTotal = taxable + tax;
        const total = values.gstRound === 'rupee' ? Math.round(rawTotal) : rawTotal;
        const round = total - rawTotal;
        return result(`${money(total)} invoice total`, `Taxable ${money(taxable)} · Discount ${money(n('gstAmount') - discounted)} · ${values.gstSupply === 'intra' ? `CGST ${money(cgst)} + SGST ${money(sgst)}` : `IGST ${money(igst)}`} · Round-off ${money(round)}`);
      }
      case 'cashflow': {
        const inflow = n('cfIncome') + n('cfReceivables');
        const outflow = n('cfExpenses') + n('cfPayables');
        const net = inflow - outflow;
        const closing = n('cfOpening') + net;
        const periodDays = values.cfPeriod === 'monthly' ? 30 : 1;
        const forecast = closing + net / periodDays * n('cfDays');
        const shortage = forecast < n('cfThreshold');
        const interval = values.cfPeriod === 'monthly' ? 30 : 1;
        const points = Array.from({ length: values.cfPeriod === 'monthly' ? 6 : 7 }, (_, index) => {
          const count = index + 1;
          return [`${values.cfPeriod === 'monthly' ? 'Month' : 'Day'} ${count}`, closing + net / periodDays * interval * count];
        });
        return result(`${money(closing)} closing balance`, `${money(inflow)} inflow − ${money(outflow)} outflow · ${money(forecast)} projected in ${n('cfDays')} days · ${shortage ? `Shortage risk: ${money(n('cfThreshold') - forecast)} below threshold` : 'Above minimum cash threshold'}`, [['Opening', n('cfOpening')], ['Inflow', inflow], ['Outflow', -outflow], ['Closing', closing], ...points]);
      }
      case 'receivables': {
        const due = Math.max(0, n('arAmount') - n('arPaid'));
        const overdue = due > 0 ? daysLate(values.arDue) : 0;
        const status = due <= 0 ? 'Paid' : overdue ? `Overdue · ${overdue} days` : n('arPaid') ? 'Partially paid' : 'Unpaid';
        return result(`${money(due)} due · ${status}`, `${esc(values.arCustomer || 'Customer')} · Invoice ${esc(values.arInvoice || '—')} · Due ${esc(values.arDue || 'not set')}`);
      }
      case 'payables': {
        const due = Math.max(0, n('apAmount') - n('apPaid'));
        const overdue = due > 0 ? daysLate(values.apDue) : 0;
        const status = due <= 0 ? 'Paid' : overdue ? `Overdue · ${overdue} days` : n('apPaid') ? 'Partially paid' : 'Unpaid';
        return result(`${money(due)} payable · ${status}`, `${esc(values.apVendor || 'Vendor')} · Bill ${esc(values.apBill || '—')} · Due ${esc(values.apDue || 'not set')}`);
      }
      case 'paymenttracker': {
        const invoiceKey = String(values.payInvoice || '').trim().toLowerCase();
        const customerKey = String(values.payCustomer || '').trim().toLowerCase();
        const priorEvents = list('paymenttracker').filter((row) => String(row.values.payInvoice || '').trim().toLowerCase() === invoiceKey && String(row.values.payCustomer || '').trim().toLowerCase() === customerKey);
        const previousPayments = priorEvents.reduce((sum, row) => sum + amount(row.values.payAdvance) + amount(row.values.payAmount), 0);
        const paidTotal = previousPayments + n('payAdvance') + n('payAmount');
        const due = Math.max(0, n('payTotal') - paidTotal);
        const status = due <= 0 ? 'Paid in full' : paidTotal > 0 ? 'Partially paid' : 'Unpaid';
        return result(`${money(due)} remaining · ${status}`, `${money(previousPayments + n('payAdvance'))} paid before this entry + ${money(n('payAmount'))} payment · ${esc(values.payMethod || 'Payment method')} · ${esc(values.payDate || today())} · ${priorEvents.length + 1} payment event(s)`);
      }
      case 'businessloan': {
        const principal = n('loanAmount'), months = Math.max(1, Math.floor(n('loanMonths'))), monthlyRate = n('loanRate') / 1200;
        const emi = monthlyRate ? principal * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1) : principal / months;
        const totalInterest = Math.max(0, emi * months - principal);
        const fee = principal * n('loanFee') / 100;
        let balance = principal;
        const schedule = [];
        for (let month = 1; month <= Math.min(months, 12); month += 1) {
          const interest = balance * monthlyRate;
          const principalPart = Math.min(balance, emi - interest);
          balance = Math.max(0, balance - principalPart);
          schedule.push([`Month ${month}`, money(emi), money(principalPart), money(interest), money(balance)]);
        }
        let preBalance = principal, preMonths = 0, preInterest = 0;
        while (preBalance > 0.01 && preMonths < months && preMonths < 1200) { const interest = preBalance * monthlyRate; preInterest += interest; preBalance = Math.max(0, preBalance + interest - emi - n('loanExtra')); preMonths += 1; }
        return result(`${money(emi)} monthly EMI`, `${months} months · Interest ${money(totalInterest)} · Processing fee ${money(fee)} · With extra ${money(n('loanExtra'))}/month: ${preMonths} months, interest ${money(preInterest)}, savings ${money(Math.max(0, totalInterest - preInterest))} · Amortization shown for the first ${schedule.length} months`, [], { headers: ['Period', 'EMI', 'Principal', 'Interest', 'Balance'], rows: schedule });
      }
      case 'revenue': {
        const units = n('revUnits'), price = n('revPrice');
        const monthlyUnits = values.revPeriod === 'day' ? units * 30 : values.revPeriod === 'week' ? units * 4.333 : units;
        const monthly = monthlyUnits * price;
        return result(`${money(monthly)} projected monthly revenue`, `${esc(values.revProduct || 'Product')} · ${units} units/${values.revPeriod} at ${money(price)} · ${money(monthly * 12)} annual run rate · ${n('revTarget') ? `${Math.ceil(n('revTarget') / (price || 1))} units needed for target` : 'Enter a target for unit planning'}`);
      }
      case 'salestarget': {
        const remaining = Math.max(0, n('targetAmount') - n('targetAchieved'));
        const orders = Math.ceil(remaining / (n('targetAov') || 1));
        const leads = Math.ceil(orders / (n('targetConversion') / 100 || 1));
        const days = Math.max(1, n('targetDays'));
        return result(`${money(remaining)} remaining · ${Math.ceil(orders / days)} orders/day`, `${orders} orders · about ${leads} qualified leads at ${n('targetConversion')}% conversion · ${Math.ceil(leads / days)} leads/day · Pace adjusts over ${days} selling days`);
      }
      case 'businessroi': {
        const investment = n('roiInvestment'), net = n('roiRevenue') - n('roiExpenses') - investment;
        const period = Math.max(1, n('roiMonths'));
        const roi = ratio(net, investment) * 100;
        return result(`${money(net)} net return · ${roi.toFixed(2)}% ROI`, `${period} months · ${money(net / period)}/month · ${(roi * 12 / period).toFixed(2)}% simple annualized ROI · Revenue ${money(n('roiRevenue'))} · Expenses ${money(n('roiExpenses'))}`);
      }
      case 'clv': {
        const margin = n('clvMargin') / 100;
        const base = n('clvAov') * n('clvFrequency') * n('clvYears') * margin;
        const scenario = n('clvAov') * n('clvScenarioFrequency') * n('clvScenarioYears') * margin;
        return result(`${money(base)} estimated gross-profit CLV`, `Scenario ${money(scenario)} · Difference ${money(scenario - base)} · Based on entered order value, frequency, lifespan and ${n('clvMargin')}% gross margin`);
      }
      case 'employeecost': {
        const base = n('empSalary') + n('empAllowances') + n('empBonus');
        const monthly = base * (1 + n('empContribution') / 100) + n('empBenefits');
        const count = Math.max(1, Math.floor(n('empCount')));
        return result(`${money(monthly)} monthly cost per employee`, `${money(monthly * 12)}/year per employee · ${money(monthly * count)}/month for ${count} employees · Contributions ${money(base * n('empContribution') / 100)} included`);
      }
      case 'overtime': {
        const hourly = n('otRate') || n('otSalary') / 173.33;
        const weekly = hourly * n('otHours') * n('otMultiplier');
        return result(`${money(weekly)} overtime pay per week`, `${money(hourly)}/hour · ${n('otHours')} hours × ${n('otMultiplier')} multiplier · ${money(weekly * 4.333)}/month payroll impact · Regular hours ${n('otRegular')}/week`);
      }
      case 'businessbudget': {
        const groups = [['Rent', 'budRent'], ['Salaries', 'budSalary'], ['Marketing', 'budMarketing'], ['Utilities', 'budUtilities'], ['Inventory', 'budInventory'], ['Software', 'budSoftware'], ['Misc', 'budMisc']];
        const planned = groups.reduce((sum, [, key]) => sum + n(`${key}Plan`), 0);
        const actual = groups.reduce((sum, [, key]) => sum + n(`${key}Actual`), 0);
        const plannedNet = n('budRevenuePlan') - planned, actualNet = n('budRevenueActual') - actual;
        const bars = [['Planned revenue', n('budRevenuePlan')], ['Actual revenue', n('budRevenueActual')], ['Planned costs', planned], ['Actual costs', actual]];
        return result(`${money(actualNet)} actual net · ${money(plannedNet)} planned net`, `Cost variance ${money(actual - planned)} · Revenue variance ${money(n('budRevenueActual') - n('budRevenuePlan'))} · Positive cost variance means over budget`, bars);
      }
      case 'commission': {
        const sales = n('comSales'), threshold = n('comThreshold');
        const commission = n('comFixed') + Math.min(sales, threshold || sales) * n('comRate') / 100 + Math.max(0, sales - threshold) * n('comTierRate') / 100;
        const achievement = ratio(sales, n('comTarget')) * 100;
        return result(`${money(commission)} commission`, `${esc(values.comEmployee || 'Employee')} · Target achievement ${achievement.toFixed(1)}% · Base tier ${money(Math.min(sales, threshold || sales) * n('comRate') / 100)} · Above threshold ${money(Math.max(0, sales - threshold) * n('comTierRate') / 100)}`);
      }
      case 'inventory': {
        const stock = n('invQuantity') * n('invPurchase'), potential = n('invQuantity') * n('invSelling');
        return result(`${money(stock)} stock value · ${money(potential)} potential revenue`, `${esc(values.invProduct || 'Product')} · SKU ${esc(values.invSku || '—')} · Expected gross profit ${money(potential - stock)} · ${n('invQuantity')} units`);
      }
      case 'purchasecost': {
        const subtotal = n('pcQuantity') * n('pcPrice');
        const total = subtotal + n('pcShipping') + n('pcPackaging') + n('pcOther') + subtotal * n('pcTax') / 100;
        return result(`${money(total)} landed cost · ${money(total / (n('pcQuantity') || 1))}/unit`, `${esc(values.pcProduct || 'Purchase')} · Supplier ${money(subtotal)} · Tax ${money(subtotal * n('pcTax') / 100)} · Shipping, packaging and other charges included`);
      }
      case 'productprofit': {
        const price = n('ppPrice'), fees = price * (n('ppPlatform') + n('ppPayment')) / 100;
        const costs = n('ppCost') + n('ppPackaging') + n('ppShipping') + n('ppMarketing') + fees;
        const profit = price - costs;
        const margin = ratio(profit, price) * 100;
        return result(`${money(profit)} net profit · ${margin.toFixed(2)}% margin`, `${esc(values.ppProduct || 'Product')} · ${money(fees)} platform/payment fees · Total unit cost ${money(costs)}`);
      }
      case 'marketplace': {
        const price = n('marketPrice');
        const platform = price * n('marketCommission') / 100, payment = price * n('marketPayment') / 100, tax = price * n('marketTax') / 100;
        const payout = price - platform - payment - tax - n('marketShipping') - n('marketOther');
        const profit = payout - n('marketCost');
        const margin = ratio(profit, price) * 100;
        return result(`${money(payout)} estimated net payout · ${money(profit)} profit`, `${esc(values.marketProduct || 'Sale')} · Platform ${money(platform)} · Payment ${money(payment)} · Tax ${money(tax)} · Shipping/other ${money(n('marketShipping') + n('marketOther'))} · Margin ${margin.toFixed(2)}%`);
      }
      case 'discountprofit': {
        const price = n('dpSelling') || n('dpMrp');
        const discounted = price * (1 - n('dpDiscount') / 100);
        const tax = discounted * n('dpTax') / 100;
        const profit = discounted - n('dpCost');
        const margin = ratio(profit, discounted) * 100;
        const maxDiscount = n('dpMrp') ? Math.max(0, Math.min(100, (1 - n('dpCost') * (1 + n('dpTargetMargin') / 100) / n('dpMrp')) * 100)) : 0;
        return result(`${money(profit)} profit · ${margin.toFixed(2)}% margin`, `Discounted price ${money(discounted)} · Tax ${money(tax)} · Total with tax ${money(discounted + tax)} · Maximum discount at ${n('dpTargetMargin')}% target margin: ${maxDiscount.toFixed(2)}%`);
      }
      case 'breakeven': {
        const fixed = n('beFixed'), variable = n('beVariable'), price = n('bePrice'), units = n('beUnits');
        const products = parseBreakEvenProducts(values.beProducts);
        const mixUnits = products.reduce((sum, product) => sum + product.mix, 0);
        const mixContribution = products.reduce((sum, product) => sum + (product.price - product.variable) * product.mix, 0);
        const contributionPerUnit = mixUnits ? mixContribution / mixUnits : price - variable;
        const q = contributionPerUnit > 0 ? fixed / contributionPerUnit : Infinity;
        const averagePrice = mixUnits ? products.reduce((sum, product) => sum + product.price * product.mix, 0) / mixUnits : price;
        const averageVariable = mixUnits ? products.reduce((sum, product) => sum + product.variable * product.mix, 0) / mixUnits : variable;
        const revenue = averagePrice * units, costs = fixed + averageVariable * units, profit = revenue - costs;
        const scenarioQ = n('beScenarioPrice') > n('beScenarioVariable') ? fixed / (n('beScenarioPrice') - n('beScenarioVariable')) : Infinity;
        const chart = [['Revenue', revenue], ['Total cost', costs], ['Break-even revenue', Number.isFinite(q) ? q * averagePrice : 0], ['Scenario break-even', Number.isFinite(scenarioQ) ? scenarioQ * n('beScenarioPrice') : 0]];
        const breakEvenUnits = q;
        return result(Number.isFinite(q) ? `${breakEvenUnits.toFixed(2)} units to break even` : 'No break-even at this price', `Revenue ${money(revenue)} · Total cost ${money(costs)} · ${profit >= 0 ? 'Profit' : 'Loss'} ${money(Math.abs(profit))} at ${units} units · ${products.length ? `${products.length}-product weighted mix` : 'Single product'} · Scenario break-even ${Number.isFinite(scenarioQ) ? scenarioQ.toFixed(2) : 'not achievable'} units`, chart);
      }
      case 'quoteinvoice': case 'orders': {
        const lines = parseLines(values[tool === 'orders' ? 'ordItems' : 'qiItems']);
        const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.price, 0);
        const discount = subtotal * n(tool === 'orders' ? 'ordDiscount' : 'qiDiscount') / 100;
        const tax = (subtotal - discount) * n(tool === 'orders' ? 'ordTax' : 'qiTax') / 100;
        const total = subtotal - discount + tax;
        return result(`${money(total)} document total`, `${lines.length} line items · Subtotal ${money(subtotal)} · Discount ${money(discount)} · Tax ${money(tax)} · ${tool === 'orders' ? `Order ${esc(values.ordStatus)} · Payment ${esc(values.ordPayment)} · Delivery ${esc(values.ordDelivery)}` : `Stage ${esc(values.qiStage)} · Due ${esc(values.qiDue || 'not set')}`}`);
      }
      case 'purchaseorder': {
        const ordered = n('poOrdered'), received = Math.min(ordered, n('poReceived'));
        return result(`${received} received · ${Math.max(0, ordered - received)} pending`, `${esc(values.poProduct || 'Product')} · ${esc(values.poVendor || 'Vendor')} · Stock value received ${money(received * n('poPrice'))} · PO ${esc(values.poNumber || '—')}`);
      }
      case 'challan': {
        return result(`${esc(values.dcStatus || 'Prepared')} · ${n('dcQuantity')} units`, `${esc(values.dcItem || 'Item')} for ${esc(values.dcCustomer || 'Customer')} · ${esc(values.dcAddress || 'Address not set')} · Ref ${esc(values.dcVehicle || '—')} · Invoice value ${money(n('dcQuantity') * n('dcPrice'))}`);
      }
      case 'numbering': {
        const prefix = (values.numPrefix || values.numType || 'DOC').trim();
        const year = String(values.numYear || new Date().getFullYear()).trim();
        const digits = Math.max(1, Math.min(10, Math.floor(n('numDigits') || 4)));
        const seq = Math.max(1, Math.floor(n('numStart') || 1));
        return result(`${prefix}-${year}-${String(seq).padStart(digits, '0')}`, `Preview · Next number is issued and reserved when you select “Issue next number”.`);
      }
      case 'customers': case 'vendors': {
        const isCustomer = tool === 'customers';
        const name = values[isCustomer ? 'custName' : 'venName'] || '';
        const customerOrders = latestRecords('orders', (row) => row.values.ordNumber).filter((row) => String(row.values.ordCustomer || '').trim().toLowerCase() === name.trim().toLowerCase());
        const customerInvoices = latestRecords('receivables', (row) => row.values.arInvoice).filter((row) => String(row.values.arCustomer || '').trim().toLowerCase() === name.trim().toLowerCase());
        const paymentEvents = list('paymenttracker').filter((row) => String(row.values.payCustomer || '').trim().toLowerCase() === name.trim().toLowerCase());
        const vendorBills = latestRecords('payables', (row) => row.values.apBill).filter((row) => String(row.values.apVendor || '').trim().toLowerCase() === name.trim().toLowerCase());
        const vendorOrders = latestRecords('purchaseorder', (row) => row.values.poNumber).filter((row) => String(row.values.poVendor || '').trim().toLowerCase() === name.trim().toLowerCase());
        const linked = isCustomer ? [...customerOrders, ...customerInvoices, ...paymentEvents] : [...vendorBills, ...vendorOrders];
        const billed = isCustomer ? customerOrders.reduce((sum, row) => sum + parseLines(row.values.ordItems).reduce((total, line) => total + line.quantity * line.price, 0), 0) + customerInvoices.reduce((sum, row) => sum + amount(row.values.arAmount), 0) : vendorBills.reduce((sum, row) => sum + amount(row.values.apAmount), 0) + vendorOrders.reduce((sum, row) => sum + amount(row.values.poOrdered) * amount(row.values.poPrice), 0);
        const paid = isCustomer ? customerInvoices.reduce((sum, row) => sum + amount(row.values.arPaid), 0) + paymentEvents.reduce((sum, row) => sum + amount(row.values.payAdvance) + amount(row.values.payAmount), 0) + customerOrders.filter((row) => row.values.ordPayment === 'Paid').reduce((sum, row) => sum + parseLines(row.values.ordItems).reduce((total, line) => total + line.quantity * line.price, 0), 0) : vendorBills.reduce((sum, row) => sum + amount(row.values.apPaid), 0);
        return result(`${linked.length} linked records · ${money(Math.max(0, billed - paid))} outstanding`, `${isCustomer ? esc(values.custCompany || name || 'Customer profile') : esc(values.venCompany || name || 'Vendor profile')} · ${money(billed)} tracked total · ${money(paid)} paid · ${esc(isCustomer ? values.custTaxId || 'Tax ID not set' : values.venTaxId || 'Tax ID not set')}`);
      }
      case 'businessdashboard': {
        const base = getBaseFinance();
        const income = (base.transactions || []).filter((row) => row.kind === 'income').reduce((sum, row) => sum + amount(row.amount), 0);
        const expense = (base.transactions || []).filter((row) => row.kind === 'expense').reduce((sum, row) => sum + amount(row.amount), 0);
        const orders = latestRecords('orders', (row) => row.values.ordNumber);
        const orderRevenue = orders.reduce((sum, row) => sum + parseLines(row.values.ordItems).reduce((total, line) => total + line.quantity * line.price, 0), 0);
        const productRevenue = latestRecords('revenue', (row) => row.values.revProduct).reduce((sum, row) => { const units = amount(row.values.revUnits), price = amount(row.values.revPrice), factor = row.values.revPeriod === 'day' ? 30 : row.values.revPeriod === 'week' ? 4.333 : 1; return sum + units * price * factor; }, 0);
        const revenue = orderRevenue + productRevenue;
        const receivable = latestRecords('receivables', (row) => row.values.arInvoice).reduce((sum, row) => sum + Math.max(0, amount(row.values.arAmount) - amount(row.values.arPaid)), 0);
        const payable = latestRecords('payables', (row) => row.values.apBill).reduce((sum, row) => sum + Math.max(0, amount(row.values.apAmount) - amount(row.values.apPaid)), 0);
        const purchaseOrders = latestRecords('purchaseorder', (row) => row.values.poNumber);
        const inventory = latestRecords('inventory', (row) => row.values.invSku || row.values.invProduct);
        const stock = inventory.reduce((sum, row) => sum + amount(row.values.invQuantity) * amount(row.values.invPurchase), 0) + purchaseOrders.reduce((sum, row) => sum + Math.min(amount(row.values.poOrdered), amount(row.values.poReceived)) * amount(row.values.poPrice), 0);
        const net = income + revenue - expense;
        return result(`${money(net)} recorded operating net`, `${money(income + revenue)} revenue/income · ${money(expense)} expenses · ${orders.length} orders · ${money(stock)} inventory value · ${money(receivable)} receivables · ${money(payable)} payables`, [['Revenue', income + revenue], ['Expenses', expense], ['Stock', stock], ['Receivables', receivable], ['Payables', payable]]);
      }
      default: return result('Ready to calculate', 'Enter values and calculate or save a local record.');
    }
  }

  function resultHtml(tool, output) {
    const max = Math.max(1, ...(output.chart || []).map(([, value]) => Math.abs(Number(value))));
    const chart = output.chart?.length ? `<div class="business-chart" aria-label="Visual comparison">${output.chart.map(([label, value]) => `<div class="business-bar-row"><span>${esc(label)}</span><span class="business-bar-track"><i style="width:${Math.max(2, Math.min(100, Math.abs(Number(value)) / max * 100))}%"></i></span><b>${money(value)}</b></div>`).join('')}</div>` : '';
    const table = output.table ? `<div class="business-table-wrap"><table class="business-table"><thead><tr>${output.table.headers.map((header) => `<th>${esc(header)}</th>`).join('')}</tr></thead><tbody>${output.table.rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
    return `<div class="result-highlight"><strong>${esc(output.headline)}</strong><span>${output.detail}</span></div>${chart}${table}`;
  }

  function recordsHtml(tool) {
    const rows = list(tool);
    const config = definitions[tool];
    let report = '';
    if (tool === 'receivables' || tool === 'payables') {
      const customerKey = tool === 'receivables' ? 'arCustomer' : 'apVendor';
      const amountKey = tool === 'receivables' ? 'arAmount' : 'apAmount';
      const paidKey = tool === 'receivables' ? 'arPaid' : 'apPaid';
      const grouped = {};
      const currentRows = latestRecords(tool, (row) => tool === 'receivables' ? row.values.arInvoice : row.values.apBill);
      currentRows.forEach((row) => { const name = row.values[customerKey] || 'Unassigned'; grouped[name] = (grouped[name] || 0) + Math.max(0, amount(row.values[amountKey]) - amount(row.values[paidKey])); });
      report = Object.entries(grouped).map(([name, balance]) => `<div class="business-report-item"><span>${esc(name)}</span><b>${money(balance)}</b></div>`).join('') || '<p class="muted">Customer/vendor balances appear after saving records.</p>';
    }
    const history = rows.slice(0, 25).map((row) => {
      const label = row.values[config.summary] || config.title;
      const dateText = new Date(row.createdAt).toLocaleDateString();
      const detail = row.result?.headline || row.values[config.fields[1]?.[0]] || '';
      return `<div class="finance-list-item"><div><strong>${esc(label)}</strong><small>${esc(dateText)} · ${esc(detail)}</small></div><div class="finance-row-actions"><button type="button" data-business-delete="${esc(row.id)}" aria-label="Delete ${esc(label)}" title="Delete"><i class="bi bi-trash"></i></button></div></div>`;
    }).join('') || '<p class="muted">No saved records yet.</p>';
    return `${report ? `<div class="business-report-grid">${report}</div>` : ''}<div class="finance-list">${history}</div>`;
  }

  function readNumberFromSaved(row, key) { return amount(row.values[key]); }

  function collectValues(config) {
    return Object.fromEntries(config.fields.map(([id]) => [id, document.getElementById(id)?.value ?? '']));
  }

  function saveRecord(tool) {
    const config = definitions[tool];
    const values = collectValues(config);
    const output = calculate(tool, values);
    const summaryValue = values[config.summary] || config.title;
    if (tool === 'numbering') {
      const prefix = (values.numPrefix || values.numType || 'DOC').trim();
      const year = (values.numYear || new Date().getFullYear()).trim();
      const key = `${prefix}-${year}`;
      const next = Math.max(Math.floor(amount(store.numberSequences?.[key]) || 0), Math.floor(amount(values.numStart) || 1));
      const digits = Math.max(1, Math.min(10, Math.floor(amount(values.numDigits) || 4)));
      output.headline = `${prefix}-${year}-${String(next).padStart(digits, '0')}`;
      store.numberSequences = { ...(store.numberSequences || {}), [key]: next + 1 };
      values.issuedNumber = output.headline;
    }
    if (tool === 'quoteinvoice') {
      output.detail += ` · ${values.qiStage}`;
    }
    if (tool === 'purchaseorder') values.poStockAdded = String(Math.min(amount(values.poOrdered), amount(values.poReceived)));
    pushRecord(tool, values, output);
    const resultNode = document.getElementById('businessResult');
    if (resultNode) resultNode.innerHTML = resultHtml(tool, output);
    const status = document.getElementById('businessStatus');
    if (status) status.textContent = `${summaryValue || config.title} saved in this browser.`;
    refreshRecords(tool);
  }

  function refreshRecords(tool) {
    const node = document.getElementById('businessRecords');
    if (node) node.innerHTML = recordsHtml(tool);
    node?.querySelectorAll('[data-business-delete]').forEach((button) => button.addEventListener('click', () => {
      store[tool] = list(tool).filter((record) => record.id !== button.dataset.businessDelete);
      saveStore();
      refreshRecords(tool);
    }));
  }

  function advanceWorkflow(tool) {
    const stage = document.getElementById('qiStage');
    if (!stage) return;
    stage.selectedIndex = Math.min(stage.selectedIndex + 1, stage.options.length - 1);
    const values = collectValues(definitions[tool]);
    const output = calculate(tool, values);
    document.getElementById('businessResult').innerHTML = resultHtml(tool, output);
    saveRecord(tool);
  }

  function issueNumber(tool) {
    const values = collectValues(definitions[tool]);
    const prefix = (values.numPrefix || values.numType || 'DOC').trim();
    const year = String(values.numYear || new Date().getFullYear()).trim();
    const key = `${prefix}-${year}`;
    const next = Math.max(Math.floor(amount(store.numberSequences?.[key]) || 0), Math.floor(amount(values.numStart) || 1));
    const digits = Math.max(1, Math.min(10, Math.floor(amount(values.numDigits) || 4)));
    const issued = `${prefix}-${year}-${String(next).padStart(digits, '0')}`;
    store.numberSequences = { ...(store.numberSequences || {}), [key]: next + 1 };
    values.issuedNumber = issued;
    const output = result(issued, `Issued and reserved locally · Next sequence ${String(next + 1).padStart(digits, '0')}`);
    pushRecord(tool, values, output);
    document.getElementById('businessResult').innerHTML = resultHtml(tool, output);
    document.getElementById('businessStatus').textContent = `${issued} issued.`;
    refreshRecords(tool);
  }

  function convertChallan() {
    const tool = 'challan';
    const values = collectValues(definitions[tool]);
    values.dcStatus = 'Invoiced';
    const output = calculate(tool, values);
    output.headline = `Invoice draft ${money(amount(values.dcQuantity) * amount(values.dcPrice))}`;
    output.detail += ` · Created from challan ${values.dcNumber || 'DC'}`;
    pushRecord(tool, values, output);
    const invoiceValues = {
      ordNumber: `INV-${values.dcNumber || Date.now()}`,
      ordCustomer: values.dcCustomer,
      ordItems: `${values.dcItem || 'Delivered item'},${amount(values.dcQuantity)},${amount(values.dcPrice)}`,
      ordDiscount: '0',
      ordTax: '0',
      ordPayment: 'Unpaid',
      ordStatus: 'Ready',
      ordDelivery: 'Delivered',
      sourceChallan: values.dcNumber
    };
    const invoiceResult = calculate('orders', invoiceValues);
    pushRecord('orders', invoiceValues, invoiceResult);
    document.getElementById('businessResult').innerHTML = resultHtml(tool, output);
    document.getElementById('businessStatus').textContent = 'Invoice conversion saved locally. Print this page to create a PDF.';
    refreshRecords(tool);
    window.print();
  }

  function chartOrResult(tool) {
    const values = collectValues(definitions[tool]);
    const output = calculate(tool, values);
    const target = document.getElementById('businessResult');
    if (target) target.innerHTML = resultHtml(tool, output);
    return output;
  }

  function openBusinessTool(tool) {
    const config = definitions[tool];
    if (!config) return;
    const catalog = document.getElementById('financeCatalog');
    const workbench = document.getElementById('financeWorkbench');
    catalog.hidden = true;
    workbench.hidden = false;
    document.getElementById('financeWorkspaceTitle').textContent = config.title;
    document.getElementById('financeHeroTitle').textContent = config.title;
    document.getElementById('financeHeroText').textContent = 'Private business workspace. Your records are saved only in this browser.';
    document.querySelector('.finance-page')?.classList.add('is-finance-tool-page');
    const panel = document.getElementById('financePanel');
    const fields = config.fields.map(renderField).join('');
    const extraActions = [
      tool === 'quoteinvoice' ? '<button type="button" class="secondary-action" id="advanceStage">Advance workflow stage</button>' : '',
      tool === 'purchaseorder' ? '<button type="button" class="secondary-action" id="receiveStock">Receive all remaining stock</button>' : '',
      tool === 'challan' ? '<button type="button" class="secondary-action" id="convertChallan">Convert to invoice / print</button>' : '',
      tool === 'numbering' ? '<button type="button" class="secondary-action" id="issueNumber">Issue next number</button>' : '',
      tool === 'businessdashboard' ? '<button type="button" class="secondary-action" id="exportBusiness">Export business data</button>' : ''
    ].join('');
    panel.innerHTML = `<div class="finance-tool-intro"><span class="section-kicker">BUSINESS WORKSPACE</span><p>${esc(config.intro)}</p></div><div class="business-workspace-grid"><div class="finance-card"><div class="finance-form-grid">${fields}</div><div class="business-actions"><button type="button" class="primary-action" id="calculateBusiness">Calculate / Preview</button><button type="button" class="secondary-action" id="saveBusiness">${config.tracked ? 'Save record' : 'Save scenario'}</button>${extraActions}<button type="button" class="secondary-action" id="printBusiness"><i class="bi bi-printer"></i> Print / Save PDF</button></div><div id="businessResult" aria-live="polite"></div><p class="tool-status" id="businessStatus" aria-live="polite"></p></div><div class="finance-card business-history"><div class="business-history-head"><div><span class="section-kicker">LOCAL RECORDS</span><h3>Saved history & reports</h3></div><button type="button" class="secondary-action" id="exportToolRecords">Export CSV</button></div><div id="businessRecords"></div></div></div>`;

    const calculateButton = document.getElementById('calculateBusiness');
    calculateButton.addEventListener('click', () => chartOrResult(tool));
    document.getElementById('saveBusiness').addEventListener('click', () => saveRecord(tool));
    document.getElementById('printBusiness').addEventListener('click', () => { chartOrResult(tool); window.print(); });
    document.getElementById('exportToolRecords').addEventListener('click', () => exportRecords(tool));
    config.fields.forEach(([id]) => {
      const element = document.getElementById(id);
      element?.addEventListener('input', () => chartOrResult(tool));
      element?.addEventListener('change', () => chartOrResult(tool));
    });
    document.getElementById('advanceStage')?.addEventListener('click', () => advanceWorkflow(tool));
    document.getElementById('receiveStock')?.addEventListener('click', () => {
      const ordered = document.getElementById('poOrdered');
      const received = document.getElementById('poReceived');
      received.value = amount(ordered.value);
      chartOrResult(tool);
      saveRecord(tool);
    });
    document.getElementById('convertChallan')?.addEventListener('click', convertChallan);
    document.getElementById('issueNumber')?.addEventListener('click', () => issueNumber(tool));
    document.getElementById('exportBusiness')?.addEventListener('click', exportAll);
    chartOrResult(tool);
    refreshRecords(tool);
    workbench.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function exportRecords(tool) {
    const rows = list(tool);
    const keys = [...new Set(rows.flatMap((row) => Object.keys(row.values)))];
    const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [keys.join(','), ...rows.map((row) => keys.map((key) => quote(row.values[key])).join(','))].join('\n');
    download(csv, `${tool}-records.csv`, 'text/csv');
  }

  function exportAll() {
    download(JSON.stringify(store, null, 2), 'business-finance-backup.json', 'application/json');
  }

  function download(content, filename, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function initialize() {
    const tool = new URLSearchParams(location.search).get('tool');
    if (definitions[tool]) openBusinessTool(tool);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
