(() => {
  const STORAGE_KEY = 'tf-life-admin-v1';
  const VAULT_KEY = 'tf-life-admin-vault-v1';
  const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
  const categories = {
    expiry: 'documents', receipt: 'money', shopping: 'money', repair: 'assets', tco: 'assets', complaints: 'assets', warranty: 'assets', maintenance: 'assets', assets: 'assets', filelifecycle: 'documents', vault: 'documents', lifevault: 'documents', meeting: 'work', actions: 'work', projectcost: 'work', freelance: 'work', timebudget: 'work', audit: 'overview', dashboard: 'overview', beforebuy: 'money', emergency: 'documents', handover: 'documents', lifeadmin: 'overview'
  };
  const titles = {
    expiry: 'Smart Document Expiry Manager', receipt: 'Smart Bill & Receipt Analyzer', shopping: 'Shopping Cost Comparison Studio', repair: 'Repair vs Replace Calculator', tco: 'Total Cost of Ownership Calculator', complaints: 'Smart Complaint & Service Tracker', warranty: 'Warranty Claim Manager', maintenance: 'Home Maintenance Manager', assets: 'Personal Asset Manager', filelifecycle: 'Smart File Lifecycle Manager', vault: 'Personal Records Vault', lifevault: 'LifeVault: Prepare for Life', meeting: 'Smart Meeting Planner', actions: 'Meeting Action Tracker', projectcost: 'Smart Project Cost Estimator', freelance: 'Freelance Project Command Center', timebudget: 'Smart Time Budget Planner', audit: 'Digital Life Audit', dashboard: 'Life Admin Dashboard', beforebuy: 'Before You Buy Analyzer', emergency: 'Personal Emergency Information Card', handover: 'Important Information Handover Pack', lifeadmin: 'Universal Life Admin Workspace'
  };
  const $ = (id) => document.getElementById(id);
  const page = document.querySelector('.life-admin-page');
  if (!page) return;
  const escaped = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const number = (value) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; };
  const currency = (value) => `₹${number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const isoToday = () => new Date().toISOString().slice(0, 10);
  const daysUntil = (date) => { if (!date) return null; const target = new Date(`${date}T00:00:00`); if (Number.isNaN(target.getTime())) return null; return Math.ceil((target.getTime() - new Date(`${isoToday()}T00:00:00`).getTime()) / 86400000); };
  const read = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } };
  const state = read();
  const rows = (key) => Array.isArray(state[key]) ? state[key] : [];
  const saveState = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const addRow = (key, value) => { state[key] = [{ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...value }, ...rows(key)].slice(0, 1000); saveState(); return state[key][0]; };
  const deleteRow = (key, id) => { state[key] = rows(key).filter((item) => item.id !== id); saveState(); };
  let attachmentDbPromise;
  function attachmentDb() {
    if (!window.indexedDB) return Promise.reject(new Error('Local file storage is unavailable in this browser.'));
    if (!attachmentDbPromise) attachmentDbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('Thakronix-life-admin-files', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('attachments', { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return attachmentDbPromise;
  }
  async function putAttachment(record) { const db = await attachmentDb(); return new Promise((resolve, reject) => { const request = db.transaction('attachments', 'readwrite').objectStore('attachments').put(record); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); }); }
  async function getAttachment(id) { const db = await attachmentDb(); return new Promise((resolve, reject) => { const request = db.transaction('attachments', 'readonly').objectStore('attachments').get(id); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
  const fileSchema = (id = 'laAttachment', multiple = false, accept = '*/*') => `<label class="life-field life-span-2"><span>Attachment (processed locally)</span><input id="${id}" type="file" accept="${accept}" ${multiple ? 'multiple' : ''}></label>`;
  const textField = (id, label, placeholder = '', type = 'text', required = false) => `<label class="life-field"><span>${escaped(label)}</span><input id="${id}" type="${type}" placeholder="${escaped(placeholder)}" ${required ? 'required' : ''}></label>`;
  const areaField = (id, label, placeholder = '', rowsCount = 3) => `<label class="life-field life-span-2"><span>${escaped(label)}</span><textarea id="${id}" rows="${rowsCount}" placeholder="${escaped(placeholder)}"></textarea></label>`;
  const selectField = (id, label, options) => `<label class="life-field"><span>${escaped(label)}</span><select id="${id}">${options.map((option) => `<option value="${escaped(option)}">${escaped(option)}</option>`).join('')}</select></label>`;
  const action = (id, label, secondary = false) => `<button type="button" id="${id}" class="${secondary ? 'hub-secondary' : 'hub-primary'}">${label}</button>`;
  const shell = (intro, form, side = '') => `<div class="life-intro"><span class="hub-kicker">LOCAL WORKSPACE</span><p>${escaped(intro)}</p></div><div class="life-workspace-grid"><section class="hub-panel"><div class="life-form-grid">${form}</div><div class="life-actions">${action('lifePreview', 'Calculate / Preview')}${action('lifeSave', 'Save record', true)}${action('lifePrint', 'Print / Save PDF', true)}${action('lifeExport', 'Export CSV', true)}</div><div id="lifeResult" class="hub-result" aria-live="polite"></div><p id="lifeStatus" class="life-status" aria-live="polite"></p></section><aside class="hub-panel"><div class="life-side-head"><div><span class="hub-kicker">LOCAL RECORDS</span><h3>Saved history</h3></div></div>${side}<div id="lifeRecords" class="life-records"></div></aside></div>`;
  const input = (id) => $(id);
  const val = (id) => input(id)?.value?.trim() ?? '';
  const num = (id) => number(input(id)?.value);
  const values = (ids) => Object.fromEntries(ids.map((id) => [id, input(id)?.type === 'checkbox' ? input(id).checked : input(id)?.value ?? '']));
  const result = (headline, detail = '', metrics = []) => ({ headline, detail, metrics });
  const setStatus = (message, error = false) => { const node = $('lifeStatus'); if (node) { node.textContent = message; node.classList.toggle('is-error', error); } };
  const toolStateKey = (tool) => `life:${tool}`;
  let activeTool = '';
  let unlockedVault = null;
  let vaultKey = null;
  let lastReceiptHash = '';
  const lifeVaultPacks = [
    { key: 'vehicle', label: 'Vehicle Renewal', entity: 'Vehicle', aliases: ['bike', 'vehicle', 'car', 'insurance renewal', 'renew insurance', 'rc', 'puc'], required: [['Insurance policy', ['insurance', 'policy']], ['RC / registration', ['rc', 'registration', 'vehicle registration']], ['PUC certificate', ['puc', 'pollution certificate']], ['Previous policy', ['previous policy', 'old policy', 'prior insurance']], ['Vehicle details', ['vehicle details', 'vehicle profile', 'bike details', 'car details']] ] },
    { key: 'job', label: 'New Job', entity: 'Job application', aliases: ['job', 'employment', 'resume', 'cover letter', 'portfolio'], required: [['Resume', ['resume', 'cv']], ['Photograph', ['photo', 'photograph', 'profile picture']], ['Graduation marksheet', ['marksheet', 'transcript', 'degree']], ['ID proof', ['id proof', 'identity', 'passport', 'driving licence']], ['Certificates', ['certificate', 'certification']], ['Cover letter', ['cover letter']], ['Portfolio link', ['portfolio', 'work samples']]] },
    { key: 'college', label: 'College', entity: 'College admission', aliases: ['college', 'admission', 'university', 'scholarship'], required: [['Application', ['application', 'admission form']], ['Marksheet', ['marksheet', 'transcript']], ['Identity proof', ['identity', 'id proof', 'passport']], ['Photographs', ['photo', 'photograph']], ['Transfer / migration certificate', ['transfer certificate', 'migration certificate']], ['Fee or scholarship proof', ['fee receipt', 'scholarship', 'income certificate']]] },
    { key: 'travel', label: 'Travel', entity: 'Trip', aliases: ['travel', 'trip', 'flight', 'visa', 'passport'], required: [['Passport / identity', ['passport', 'identity', 'id proof']], ['Visa', ['visa']], ['Tickets', ['ticket', 'flight', 'booking']], ['Itinerary / stay', ['itinerary', 'hotel', 'accommodation']], ['Travel insurance', ['travel insurance']], ['Emergency contacts', ['emergency contact', 'contact']]] },
    { key: 'home', label: 'New Home', entity: 'Home / rental', aliases: ['home', 'house', 'rent', 'rental', 'lease'], required: [['Rental / purchase agreement', ['rental agreement', 'lease', 'sale deed', 'agreement']], ['Identity proof', ['identity', 'id proof', 'passport']], ['Deposit / payment proof', ['deposit', 'payment receipt', 'rent receipt']], ['Utility details', ['utility', 'electricity', 'water bill']], ['Inventory / handover', ['inventory', 'handover', 'inspection']]] },
    { key: 'rental', label: 'Rental Move-in', entity: 'Rental home', aliases: ['rental move', 'move in', 'landlord', 'tenant'], required: [['Lease / rental agreement', ['rental agreement', 'lease']], ['Identity proof', ['identity', 'id proof', 'passport']], ['Deposit receipt', ['deposit receipt', 'deposit', 'rent receipt']], ['Utility handover', ['utility', 'electricity', 'water bill']], ['Move-in inventory', ['inventory', 'move-in', 'inspection']]] },
    { key: 'kyc', label: 'Bank / KYC', entity: 'Bank / KYC', aliases: ['bank', 'kyc', 'account', 'verification'], required: [['Identity proof', ['identity', 'id proof', 'passport', 'driving licence']], ['Address proof', ['address proof', 'utility bill', 'bank statement']], ['PAN / tax ID', ['pan', 'tax id']], ['Photograph', ['photo', 'photograph']], ['Bank form / account proof', ['bank form', 'bank account', 'cancelled cheque']]] },
    { key: 'government', label: 'Government', entity: 'Government application', aliases: ['government', 'govt', 'license', 'licence', 'official'], required: [['Application / reference', ['application', 'reference number', 'acknowledgement']], ['Identity proof', ['identity', 'id proof', 'passport']], ['Address proof', ['address proof', 'utility bill']], ['Supporting certificate', ['certificate', 'marksheet']], ['Payment receipt', ['payment receipt', 'fee receipt', 'challan']]] },
    { key: 'claim', label: 'Insurance Claim', entity: 'Insurance claim', aliases: ['insurance claim', 'claim', 'accident', 'damage'], required: [['Policy', ['insurance', 'policy']], ['Identity proof', ['identity', 'id proof', 'passport']], ['Incident report', ['incident report', 'fir', 'claim report']], ['Bills / receipts', ['invoice', 'receipt', 'bill']], ['Photos / evidence', ['photo', 'image', 'evidence']], ['Bank details', ['bank details', 'cancelled cheque']]] },
    { key: 'warranty', label: 'Warranty Claim', entity: 'Warranty claim', aliases: ['warranty claim', 'repair claim', 'service claim'], required: [['Warranty card', ['warranty']], ['Invoice / purchase proof', ['invoice', 'bill', 'purchase']], ['Serial / product details', ['serial', 'imei', 'product details']], ['Issue photos', ['photo', 'image', 'issue']], ['Service case reference', ['service case', 'claim number', 'ticket']]] },
    { key: 'proof', label: 'Warranty / Purchase Proof', entity: 'Purchase', aliases: ['prove', 'proof', 'purchase', 'warranty', 'refund', 'dispute', 'evidence'], required: [['Invoice', ['invoice', 'bill']], ['Payment receipt', ['payment receipt', 'receipt', 'transaction']], ['Warranty card', ['warranty']], ['Delivery confirmation', ['delivery', 'shipping']], ['Product photos', ['product photo', 'photo', 'image']]] },
    { key: 'scholarship', label: 'Scholarship', entity: 'Scholarship application', aliases: ['scholarship', 'grant', 'financial aid'], required: [['Scholarship application', ['scholarship application', 'application']], ['Identity proof', ['identity', 'id proof', 'passport']], ['Income certificate', ['income certificate', 'income proof']], ['Marksheet', ['marksheet', 'transcript']], ['Bank details', ['bank details', 'bank account', 'cancelled cheque']]] },
    { key: 'legal', label: 'Legal', entity: 'Legal matter', aliases: ['legal', 'court', 'lawyer', 'dispute'], required: [['Agreement / contract', ['agreement', 'contract', 'deed']], ['Identity proof', ['identity', 'id proof', 'passport']], ['Correspondence', ['email', 'letter', 'correspondence']], ['Receipts / payments', ['receipt', 'invoice', 'payment']], ['Supporting evidence', ['evidence', 'photo', 'report']]] },
    { key: 'emergency', label: 'Emergency', entity: 'Emergency profile', aliases: ['emergency', 'family emergency', 'medical emergency'], required: [['Identity documents', ['identity', 'id proof', 'passport']], ['Medical information', ['medical', 'health', 'prescription', 'allergy']], ['Insurance', ['insurance', 'policy']], ['Emergency contacts', ['emergency contact', 'contact']], ['Vehicle documents', ['vehicle', 'rc', 'registration']], ['Property / financial details', ['property', 'financial', 'bank']]] }
  ];
  let activeLifeVaultTask = lifeVaultPacks[0];
  let lifeVaultMatches = [];

  const definitions = {
    expiry: { ids: ['expName','expCategory','expNumber','expIssuer','expDate','expRepeat','expPriority','expNotes'], form: `${textField('expName','Document / renewal name','Vehicle insurance', 'text', true)}${selectField('expCategory','Category',['Insurance','Warranty','Driving licence','Passport','Vehicle document','Certificate','Domain / hosting','Membership','Subscription','College document','Other'])}${textField('expNumber','Reference number','Policy / document number')}${textField('expIssuer','Issuer / provider','Provider name')}${textField('expDate','Expiry / renewal date','', 'date', true)}${selectField('expRepeat','Recurring renewal',['No repeat','1 month','3 months','6 months','12 months','24 months'])}${selectField('expPriority','Priority',['Normal','Important','Critical'])}${areaField('expNotes','Notes / renewal instructions','Contact, amount, required documents')}${textField('expPassphrase','Attachment encryption passphrase (required for files)','At least 10 characters','password')}${fileSchema()}` },
    receipt: { ids: ['rcVendor','rcInvoice','rcDate','rcCategory','rcItems','rcDiscount','rcTax','rcTotal','rcMethod','rcOcr','rcHash'], form: `${fileSchema('rcFile', false, 'image/*,.pdf,application/pdf')}${textField('rcVendor','Shop / vendor','Vendor name')}${textField('rcInvoice','Invoice number','Invoice / receipt number')}${textField('rcDate','Invoice date','', 'date')}${selectField('rcCategory','Expense category',['Food','Travel','Office','Utilities','Home','Software','Medical','Other'])}${areaField('rcItems','Items: description, quantity, unit price','Paper,2,150\nInk,1,500')}${textField('rcDiscount','Discount','0','number')}${textField('rcTax','Tax','0','number')}${textField('rcTotal','Total amount','0','number')}${selectField('rcMethod','Payment method',['Cash','UPI','Card','Bank transfer','Cheque','Other'])}${areaField('rcOcr','OCR text / extraction review','Upload a bill and choose Extract. Verify all fields before saving.',4)}${action('rcExtract','Extract from image / PDF',true)}${action('rcSaveExpense','Save as expense',true)}` },
    shopping: { ids: ['shopName','shopYears','shopPrice','shopDiscount','shopDelivery','shopTax','shopCoupon','shopCashback','shopWarranty','shopInstall','shopMaint','shopSubscription','shopAlternatives'], form: `${textField('shopName','Product / plan','Laptop, AC, phone or software')}${textField('shopYears','Ownership period (years)','3','number')}${textField('shopPrice','Product price','0','number')}${textField('shopDiscount','Discount (%)','0','number')}${textField('shopDelivery','Delivery','0','number')}${textField('shopTax','Tax (%)','0','number')}${textField('shopCoupon','Coupon amount','0','number')}${textField('shopCashback','Cashback','0','number')}${textField('shopWarranty','Warranty cost','0','number')}${textField('shopInstall','Installation','0','number')}${textField('shopMaint','Annual maintenance','0','number')}${textField('shopSubscription','Monthly subscription / upkeep','0','number')}${areaField('shopAlternatives','Alternative scenarios: name, total cost','Option B,45000\nOption C,52000')}` },
    repair: { ids: ['rrName','rrCurrentValue','rrRepair','rrRepairLife','rrNewPrice','rrWarranty','rrMaintenance','rrNewLife','rrHorizon'], form: `${textField('rrName','Product','Laptop / appliance')}${textField('rrCurrentValue','Current product value','0','number')}${textField('rrRepair','Repair cost','0','number')}${textField('rrRepairLife','Expected repair life (years)','2','number')}${textField('rrNewPrice','Replacement price','0','number')}${textField('rrWarranty','Replacement warranty (years)','1','number')}${textField('rrMaintenance','Annual maintenance','0','number')}${textField('rrNewLife','Replacement lifespan (years)','5','number')}${selectField('rrHorizon','Comparison horizon',['1','3','5'])}` },
    tco: { ids: ['tcoAsset','tcoYears','tcoPurchase','tcoRunning','tcoInsurance','tcoMaintenance','tcoRepairs','tcoSubscription','tcoTaxes','tcoResale'], form: `${textField('tcoAsset','Asset / vehicle','Car, laptop, appliance')}${textField('tcoYears','Ownership period (years)','5','number')}${textField('tcoPurchase','Purchase price','0','number')}${textField('tcoRunning','Annual running / fuel cost','0','number')}${textField('tcoInsurance','Annual insurance','0','number')}${textField('tcoMaintenance','Annual maintenance','0','number')}${textField('tcoRepairs','Total repair estimate','0','number')}${textField('tcoSubscription','Annual software / service','0','number')}${textField('tcoTaxes','Annual taxes / fees','0','number')}${textField('tcoResale','Expected resale value','0','number')}` },
    complaints: { ids: ['comProduct','comCompany','comNumber','comDate','comIssue','comContact','comDue','comFollow','comStatus','comSla','comHistory'], form: `${textField('comProduct','Product / service','Service name')}${textField('comCompany','Company','Company name')}${textField('comNumber','Complaint number','Ticket ID')}${textField('comDate','Complaint date','', 'date')}${textField('comIssue','Issue','Short issue description')}${textField('comContact','Contact person','Name / channel')}${textField('comDue','Expected resolution','', 'date')}${textField('comFollow','Next follow-up','', 'date')}${selectField('comStatus','Status',['Raised','Assigned','In Progress','Escalated','Resolved','Closed'])}${textField('comSla','SLA target (days)','7','number')}${areaField('comHistory','Communication / evidence notes','Date - call summary, reference, promised action')}${fileSchema()}` },
    warranty: { ids: ['warProduct','warBrand','warModel','warSerial','warPurchaseDate','warPrice','warMonths','warInvoice','warCenter','warClaim','warStatus','warProblem','warRepairCost','warHistory'], form: `${textField('warProduct','Product','Laptop / appliance')}${textField('warBrand','Brand','Brand')}${textField('warModel','Model','Model')}${textField('warSerial','Serial number','Serial / IMEI')}${textField('warPurchaseDate','Purchase date','', 'date')}${textField('warPrice','Purchase price','0','number')}${textField('warMonths','Warranty length (months)','12','number')}${textField('warInvoice','Invoice reference','Invoice number')}${textField('warCenter','Service center','Provider')}${textField('warClaim','Claim number','Claim ID')}${selectField('warStatus','Claim status',['No claim','Raised','Assigned','In Service','Resolved','Rejected'])}${textField('warProblem','Problem / claim description','Issue')}${textField('warRepairCost','Repair cost','0','number')}${areaField('warHistory','Repair / claim history','Date, service, outcome')}${fileSchema()}` },
    maintenance: { ids: ['maintTask','maintAsset','maintCategory','maintLast','maintNext','maintRepeat','maintCost','maintProvider','maintWarranty','maintNotes'], form: `${textField('maintTask','Maintenance task','AC servicing')}${textField('maintAsset','Asset / location','Living room AC')}${selectField('maintCategory','Category',['AC','RO filter','Water tank','Pest control','Plumbing','Electrical','Gas service','Appliance','Painting','Other'])}${textField('maintLast','Last service','', 'date')}${textField('maintNext','Next service','', 'date')}${selectField('maintRepeat','Repeat schedule',['No repeat','Monthly','Quarterly','Every 6 months','Yearly'])}${textField('maintCost','Service cost','0','number')}${textField('maintProvider','Technician / provider','Provider name')}${textField('maintWarranty','Warranty expiry','', 'date')}${areaField('maintNotes','Service notes','Work done, parts, reference')}` },
    assets: { ids: ['assetName','assetType','assetBrand','assetModel','assetSerial','assetPurchaseDate','assetPurchase','assetValue','assetCondition','assetLocation','assetWarranty','assetInsurance','assetNotes'], form: `${textField('assetName','Asset name','Laptop / vehicle')}${selectField('assetType','Asset type',['Laptop','Phone','TV','Camera','Furniture','Appliance','Vehicle','Electronics','Tools','Other'])}${textField('assetBrand','Brand','Brand')}${textField('assetModel','Model','Model')}${textField('assetSerial','Serial number','Serial / IMEI')}${textField('assetPurchaseDate','Purchase date','', 'date')}${textField('assetPurchase','Purchase price','0','number')}${textField('assetValue','Current value','0','number')}${selectField('assetCondition','Condition',['New','Good','Fair','Needs repair','Retired'])}${textField('assetLocation','Location','Home / office')}${textField('assetWarranty','Warranty expiry','', 'date')}${textField('assetInsurance','Insurance expiry','', 'date')}${areaField('assetNotes','Notes / repair history','Service, parts, insurance notes')}${fileSchema()}` },
    filelifecycle: { ids: ['fileImportance','fileState','fileReview','fileRule'], form: `${fileSchema('lifecycleFiles', true)}${selectField('fileImportance','Importance',['Normal','Important','Critical'])}${selectField('fileState','Lifecycle state',['Created','Active','Reviewed','Archived','Expired'])}${textField('fileReview','Review after (days)','90','number')}${areaField('fileRule','Folder / archive rule','Rule for future review')}${action('analyzeLifecycle','Analyze selected files',true)}` },
    vault: { ids: ['vaultName','vaultCategory','vaultDate','vaultTags','vaultNotes'], form: `${textField('vaultPassphrase','Vault passphrase','Use a strong private passphrase','password',true)}${action('vaultUnlock','Unlock / create encrypted vault',true)}<div id="vaultLocked" class="life-note life-span-2">Vault remains locked until you enter your passphrase.</div>${textField('vaultName','Record name','Document name')}${selectField('vaultCategory','Category',['Education','Finance','Insurance','Vehicle','Property','Employment','Certificate','Purchase','Warranty','Other'])}${textField('vaultDate','Expiry (optional)','', 'date')}${textField('vaultTags','Tags','passport, renewal')}${areaField('vaultNotes','Private notes','Encrypted and stored only in this browser')}${fileSchema('vaultFile', false)}${action('vaultLock','Lock vault',true)}` },
    lifevault: { ids: [], form: '' },
    meeting: { ids: ['meetTitle','meetDate','meetTime','meetDuration','meetZone','meetTargetZone','meetParticipants','meetHoursStart','meetHoursEnd','meetAgenda','meetNotes'], form: `${textField('meetTitle','Meeting title','Weekly planning')}${textField('meetDate','Date','', 'date')}${textField('meetTime','Start time','09:00','time')}${textField('meetDuration','Duration (minutes)','30','number')}${textField('meetZone','Organizer timezone','Asia/Kolkata')}${textField('meetTargetZone','Participant timezone','America/New_York')}${textField('meetParticipants','Participants','alex@example.com, Sam')}${textField('meetHoursStart','Preferred hours start','9','number')}${textField('meetHoursEnd','Preferred hours end','17','number')}${areaField('meetAgenda','Agenda','Topic, owner, duration')}${areaField('meetNotes','Notes / follow-up','Decisions and next steps')}` },
    actions: { ids: ['actMeeting','actDecision','actTask','actOwner','actDeadline','actPriority','actStatus','actNotes'], form: `${textField('actMeeting','Meeting title','Meeting')}${textField('actDecision','Decision','Decision summary')}${textField('actTask','Action item','Task description')}${textField('actOwner','Owner','Name')}${textField('actDeadline','Deadline','', 'date')}${selectField('actPriority','Priority',['Low','Normal','High','Urgent'])}${selectField('actStatus','Status',['Open','In Progress','Blocked','Completed'])}${areaField('actNotes','Notes / follow-up','')}` },
    projectcost: { ids: ['projName','projTasks','projTools','projHosting','projMaterials','projMisc','projContingency','projMargin','projClient'], form: `${textField('projName','Project','Project name')}${textField('projClient','Client','Client name')}${areaField('projTasks','Tasks: task name, hours, hourly rate','Design,12,800\nDevelopment,30,1000')}${textField('projTools','Tools / software','0','number')}${textField('projHosting','Hosting','0','number')}${textField('projMaterials','Materials','0','number')}${textField('projMisc','Miscellaneous','0','number')}${textField('projContingency','Contingency (%)','10','number')}${textField('projMargin','Target profit margin (%)','25','number')}` },
    freelance: { ids: ['freeClient','freeProject','freeStatus','freeStart','freeDue','freeQuote','freeMilestones','freeTasks','freeHours','freeRate','freeExpenses','freeInvoiced','freePaid','freeNotes'], form: `${textField('freeClient','Client','Client name')}${textField('freeProject','Project','Project name')}${selectField('freeStatus','Project status',['Lead','Quoted','Active','On Hold','Complete','Closed'])}${textField('freeStart','Start date','', 'date')}${textField('freeDue','Deadline','', 'date')}${textField('freeQuote','Quote / contract value','0','number')}${areaField('freeMilestones','Milestones','Discovery, Design, Delivery')}${areaField('freeTasks','Tasks and status','Add task notes')}${textField('freeHours','Hours worked','0','number')}${textField('freeRate','Hourly rate','0','number')}${textField('freeExpenses','Project expenses','0','number')}${textField('freeInvoiced','Invoiced','0','number')}${textField('freePaid','Paid','0','number')}${areaField('freeNotes','Project notes','')}` },
    timebudget: { ids: ['timeDate','timeActivities','timeCommitments','timePlannedSleep','timeActual'], form: `${textField('timeDate','Plan date','', 'date')}${areaField('timeActivities','Activities: name, planned hours, actual hours','Sleep,8,7\nWork,8,8\nStudy,2,1')}${textField('timeCommitments','Fixed commitments (hours)','0','number')}${textField('timePlannedSleep','Sleep target (hours)','8','number')}${textField('timeActual','Total actual hours (optional)','0','number')}` },
    audit: { ids: [], form: '' },
    dashboard: { ids: [], form: '' },
    beforebuy: { ids: ['buyProduct','buyUsage','buyYears','buyPrice','buyDiscount','buyDelivery','buyTax','buyCoupon','buyCashback','buyWarranty','buyInstall','buyMaintenance','buySubscription','buyResale','buyAlternative'], form: `${textField('buyProduct','Product / service','Laptop, vehicle, plan')}${textField('buyUsage','Expected usage per month','Hours / km / usage')}${textField('buyYears','Ownership period (years)','3','number')}${textField('buyPrice','Purchase price','0','number')}${textField('buyDiscount','Discount (%)','0','number')}${textField('buyDelivery','Delivery','0','number')}${textField('buyTax','Tax (%)','0','number')}${textField('buyCoupon','Coupon amount','0','number')}${textField('buyCashback','Cashback','0','number')}${textField('buyWarranty','Warranty','0','number')}${textField('buyInstall','Installation','0','number')}${textField('buyMaintenance','Annual maintenance','0','number')}${textField('buySubscription','Monthly running / subscription','0','number')}${textField('buyResale','Expected resale value','0','number')}${areaField('buyAlternative','Alternative options: name, total ownership cost','Option B,55000')}` },
    emergency: { ids: ['emName','emContact','emBackup','emBlood','emAllergy','emInsurance','emVehicle','emDoctor','emMedical','emInstructions','emInsuranceAvailable','emDocId','emDocInsurance','emDocVehicle'], form: `${textField('emName','Name','Person name')}${textField('emContact','Father: name and phone','+91 98765 43210')}${textField('emBackup','Mother: name and phone','+91 98765 43210')}${textField('emBlood','Blood group (optional)','')}${textField('emAllergy','Allergy / alert (optional)','')}${textField('emInsurance','Insurance reference','Policy number')}${textField('emVehicle','Vehicle reference','Registration')}${textField('emDoctor','Doctor / clinic','Contact')}${areaField('emMedical','Medical / emergency information','Only add details you choose to include')}${areaField('emInstructions','Emergency instructions','')}
      <div class="emergency-profile-flags life-span-2"><label><input id="emInsuranceAvailable" type="checkbox"> Insurance is available</label><label><input id="emDocId" type="checkbox"> ID document available</label><label><input id="emDocInsurance" type="checkbox"> Insurance document available</label><label><input id="emDocVehicle" type="checkbox"> Vehicle document available</label></div>
      <fieldset class="emergency-share-picker life-span-2"><legend>Choose what the QR can show</legend><p>Nothing is shared until you select it here. Empty fields are always left out.</p><div class="emergency-share-options">
        <label><input type="checkbox" data-emergency-share="name" data-source="emName"> Name</label><label><input type="checkbox" data-emergency-share="father_contact" data-source="emContact"> Father contact</label><label><input type="checkbox" data-emergency-share="mother_contact" data-source="emBackup"> Mother contact</label><label><input type="checkbox" data-emergency-share="blood_group" data-source="emBlood"> Blood group</label><label><input type="checkbox" data-emergency-share="allergies" data-source="emAllergy"> Allergies</label><label><input type="checkbox" data-emergency-share="medical_info" data-source="emMedical"> Medical information</label><label><input type="checkbox" data-emergency-share="emergency_notes" data-source="emInstructions"> Emergency notes</label><label><input type="checkbox" data-emergency-share="doctor" data-source="emDoctor"> Doctor / clinic</label><label><input type="checkbox" data-emergency-share="insurance" data-source="emInsurance"> Insurance reference</label><label><input type="checkbox" data-emergency-share="vehicle" data-source="emVehicle"> Vehicle details</label><label><input type="checkbox" data-emergency-share="id_document" data-source="emDocId" data-flag="true"> ID document status</label><label><input type="checkbox" data-emergency-share="insurance_document" data-source="emDocInsurance" data-flag="true"> Insurance document status</label><label><input type="checkbox" data-emergency-share="vehicle_document" data-source="emDocVehicle" data-flag="true"> Vehicle document status</label><label><input type="checkbox" data-emergency-share="insurance_available" data-source="emInsuranceAvailable" data-flag="true"> Insurance availability</label>
      </div></fieldset><label class="life-field emergency-expiry"><span>QR access expires after</span><select id="emQrTtl"><option value="3600">1 hour</option><option value="21600">6 hours</option><option value="86400" selected>24 hours</option><option value="604800">7 days</option><option value="2592000">30 days</option></select></label><div class="life-span-2 emergency-share-actions"><button type="button" id="emQrGenerate" class="hub-primary"><i class="bi bi-qr-code"></i> Generate Emergency QR</button><p class="life-status">The QR contains a link only. Selected information is encrypted on the server and visible read-only until expiry or revocation.</p></div><div class="life-span-2 emergency-qr-result" id="emergencyQrResult" hidden><img id="emergencyQrImage" width="256" height="256" alt="Emergency QR code"><div><strong>Emergency QR ready</strong><a id="emergencyQrLink" target="_blank" rel="noopener noreferrer"></a><p id="emergencyQrExpiry"></p><button type="button" id="emergencyQrCopyKey" class="hub-secondary">Copy revoke key</button><p id="emergencyQrNotice" class="life-status">Keep the revoke key private. Active cards are also managed in this browser.</p></div></div>` },
    handover: { ids: ['handTitle','handRecipient','handInstructions','handCategories'], form: `${textField('handTitle','Handover pack title','Family / business handover')}${textField('handRecipient','For','Recipient')}${areaField('handInstructions','Instructions','Important steps and contacts')}${selectField('handCategories','Include records from',['All Life Admin records','Documents and renewals','Assets and warranty','Work and projects'])}${action('buildHandover','Build ZIP + print pack',true)}` },
    lifeadmin: { ids: [], form: '' }
  };

  function listSummary(tool) {
    const records = rows(toolStateKey(tool));
    if (!records.length) return '<p class="hub-muted">No saved records yet.</p>';
    return `<div class="life-record-list">${records.slice(0, 40).map((record) => `<article class="life-record"><div><strong>${escaped(record.title || record.name || titles[tool])}</strong><small>${escaped(record.summary || new Date(record.createdAt).toLocaleDateString())}</small></div><button type="button" class="life-delete" data-delete-record="${escaped(record.id)}" aria-label="Delete ${escaped(record.title || record.name || titles[tool])}" title="Delete"><i class="bi bi-trash"></i></button></article>`).join('')}</div>`;
  }

  function groupRows(lines) {
    return String(lines || '').split(/\r?\n/).map((line) => line.split(',').map((part) => part.trim()));
  }

  function metricCards(items) {
    return `<div class="life-metric-grid">${items.map(([label, value]) => `<div class="life-metric"><span>${escaped(label)}</span><strong>${escaped(value)}</strong></div>`).join('')}</div>`;
  }

  function expiryCalendar(records) {
    const monthKey = $('expiryMonth')?.value || isoToday().slice(0, 7);
    const [year, month] = monthKey.split('-').map(Number);
    const first = new Date(year, month - 1, 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const byDate = {};
    records.forEach((record) => { if (record.expDate?.startsWith(monthKey)) (byDate[record.expDate] ||= []).push(record); });
    const cells = Array.from({ length: offset + daysInMonth }, (_, index) => {
      if (index < offset) return '<div class="life-calendar-cell is-empty"></div>';
      const day = index - offset + 1;
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const events = byDate[iso] || [];
      return `<div class="life-calendar-cell ${iso === isoToday() ? 'is-today' : ''}"><span>${day}</span>${events.slice(0, 2).map((record) => `<small title="${escaped(record.expName)}">${escaped(record.expName)}</small>`).join('')}${events.length > 2 ? `<small>+${events.length - 2} more</small>` : ''}</div>`;
    });
    const weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day) => `<div class="life-calendar-weekday">${day}</div>`).join('');
    return `<div class="life-calendar"><div class="life-calendar-caption">${new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(first)}</div><div class="life-calendar-grid">${weekdays}${cells.join('')}</div></div>`;
  }

  function runCalculation(tool, data) {
    const n = (id) => number(data[id]);
    const totalCost = (price, discount, delivery, tax, coupon, cashback, warranty, install, maintenance, subscription, years) => {
      const discounted = price * (1 - discount / 100);
      const upfront = discounted + delivery + discounted * tax / 100 - coupon - cashback + warranty + install;
      return upfront + (maintenance + subscription * 12) * years;
    };
    switch (tool) {
      case 'expiry': {
        const days = daysUntil(data.expDate);
        const urgency = days === null ? 'Date required' : days < 0 ? `Expired ${Math.abs(days)} days ago` : days === 0 ? 'Expires today' : `${days} days remaining`;
        return result(urgency, `${data.expCategory} · ${data.expPriority} priority · ${data.expIssuer || 'No issuer'} · ${data.expDate || 'No date'}`);
      }
      case 'receipt': {
        const items = groupRows(data.rcItems).map((parts) => ({ name: parts[0], quantity: number(parts[1]), price: number(parts[2]) })).filter((item) => item.name && item.quantity > 0);
        const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
        const calculated = subtotal - n('rcDiscount') + n('rcTax');
        const entered = n('rcTotal');
        return result(`${currency(entered || calculated)} verified bill total`, `${data.rcVendor || 'Vendor not set'} · ${items.length} items · Parsed lines ${currency(subtotal)} · Discount ${currency(n('rcDiscount'))} · Tax ${currency(n('rcTax'))} · Difference ${currency(entered - calculated)}`);
      }
      case 'shopping': case 'beforebuy': {
        const isBuy = tool === 'beforebuy';
        const prefix = isBuy ? 'buy' : 'shop';
        const years = Math.max(1, n(`${prefix}Years`));
        const gross = totalCost(n(`${prefix}Price`), n(`${prefix}Discount`), n(`${prefix}Delivery`), n(`${prefix}Tax`), n(`${prefix}Coupon`), n(`${prefix}Cashback`), n(`${prefix}Warranty`), n(`${prefix}Install`), n(`${prefix}Maintenance`), n(`${prefix}Subscription`), years);
        const resale = isBuy ? n('buyResale') : 0;
        const net = gross - resale;
        const alternatives = groupRows(data[isBuy ? 'buyAlternative' : 'shopAlternatives']).filter((parts) => parts[0] && number(parts[1]) > 0).map((parts) => `${parts[0]} ${currency(number(parts[1]))}`);
        return result(`${currency(net)} total ownership cost`, `${currency(net / years / 12)}/month · ${currency(net / years)}/year · ${years} years · Upfront and recurring costs ${currency(gross)}${resale ? ` · Resale −${currency(resale)}` : ''}${alternatives.length ? ` · Alternatives: ${alternatives.join(' | ')}` : ''}`);
      }
      case 'repair': {
        const years = [1, 3, 5];
        const repairHorizon = Math.max(1, n('rrRepairLife'));
        const replaceLife = Math.max(1, n('rrNewLife'));
        const repairCost = (horizon) => Math.ceil(horizon / repairHorizon) * n('rrRepair') + n('rrMaintenance') * horizon;
        const replaceCost = (horizon) => Math.ceil(horizon / replaceLife) * n('rrNewPrice') + n('rrMaintenance') * horizon;
        const chosen = years.includes(n('rrHorizon')) ? n('rrHorizon') : 3;
        return result(`${chosen}-year: repair ${currency(repairCost(chosen))} vs replace ${currency(replaceCost(chosen))}`, years.map((year) => `${year}-year repair ${currency(repairCost(year))} / replace ${currency(replaceCost(year))}`).join(' · ') + ` · Replacement warranty ${n('rrWarranty')} years · Current value ${currency(n('rrCurrentValue'))}`);
      }
      case 'tco': {
        const years = Math.max(1, n('tcoYears'));
        const perYear = n('tcoRunning') + n('tcoInsurance') + n('tcoMaintenance') + n('tcoSubscription') + n('tcoTaxes');
        const lifetime = n('tcoPurchase') + perYear * years + n('tcoRepairs') - n('tcoResale');
        const yearly = Array.from({ length: Math.min(years, 10) }, (_, index) => `${index + 1}: ${currency(n('tcoPurchase') + perYear * (index + 1) + n('tcoRepairs') * (index + 1) / years - (index + 1 === years ? n('tcoResale') : 0))}`).join(' · ');
        return result(`${currency(lifetime)} lifetime cost`, `${currency(lifetime / years / 12)}/month · ${currency(lifetime / years)}/year · ${data.tcoAsset || 'Asset'} · Yearly cumulative cost: ${yearly}`);
      }
      case 'complaints': {
        const due = daysUntil(data.comDue);
        const follow = daysUntil(data.comFollow);
        const sla = data.comDate ? Math.max(0, n('comSla') - Math.floor((Date.now() - new Date(`${data.comDate}T00:00:00`).getTime()) / 86400000)) : null;
        return result(`${data.comStatus} · ${due === null ? 'Resolution date unset' : due < 0 ? `${Math.abs(due)} days past target` : `${due} days to target`}`, `SLA ${sla === null ? 'not started' : sla === 0 ? 'due today' : sla < 0 ? `${Math.abs(sla)} days overdue` : `${sla} days remaining`} · Follow-up ${follow === null ? 'not set' : follow < 0 ? `${Math.abs(follow)} days overdue` : `in ${follow} days`} · ${data.comCompany || 'Company'} · ${data.comNumber || 'No ticket ID'}`);
      }
      case 'warranty': {
        const purchased = data.warPurchaseDate ? new Date(`${data.warPurchaseDate}T00:00:00`) : null;
        const expiry = purchased ? new Date(purchased.getTime()) : null;
        if (expiry) expiry.setMonth(expiry.getMonth() + n('warMonths'));
        const days = expiry ? Math.ceil((expiry.getTime() - new Date(`${isoToday()}T00:00:00`).getTime()) / 86400000) : null;
        return result(`${days === null ? 'Set purchase date' : days < 0 ? `Warranty expired ${Math.abs(days)} days ago` : `${days} warranty days remaining`}`, `${data.warProduct || 'Product'} · ${data.warBrand || 'Brand'} ${data.warModel || ''} · ${data.warStatus} · Claim ${data.warClaim || 'not filed'} · Repair cost ${currency(n('warRepairCost'))}`);
      }
      case 'maintenance': {
        const days = daysUntil(data.maintNext);
        return result(`${days === null ? 'Set next service date' : days < 0 ? `Service overdue ${Math.abs(days)} days` : days === 0 ? 'Service due today' : `${days} days until service`}`, `${data.maintTask || 'Task'} · ${data.maintAsset || 'Asset'} · ${data.maintProvider || 'Provider unset'} · ${data.maintRepeat} · ${currency(n('maintCost'))} last cost`);
      }
      case 'assets': {
        const days = daysUntil(data.assetWarranty);
        return result(`${data.assetName || 'Asset'} · Current value ${currency(n('assetValue'))}`, `Purchase ${currency(n('assetPurchase'))} on ${data.assetPurchaseDate || 'date unset'} · ${data.assetCondition} · Warranty ${days === null ? 'not set' : days < 0 ? `expired ${Math.abs(days)} days ago` : `${days} days remaining`} · Insurance ${data.assetInsurance || 'not set'} · ${data.assetLocation || 'location unset'}`);
      }
      case 'filelifecycle': {
        const files = state.pendingLifecycleFiles || [];
        const old = files.filter((file) => (Date.now() - file.lastModified) / 86400000 > n('fileReview')).length;
        const large = files.filter((file) => file.size > 100 * 1024 * 1024).length;
        const total = files.reduce((sum, file) => sum + file.size, 0);
        return result(`${files.length} files · ${(total / 1048576).toFixed(1)} MB selected`, `${old} older than ${n('fileReview')} days · ${large} larger than 100 MB · Review ${data.fileState} · Important: ${data.fileImportance}`);
      }
      case 'meeting': {
        if (!data.meetDate || !data.meetTime) return result('Choose meeting date and time', 'Time-zone conversion runs locally in the browser.');
        const instant = new Date(`${data.meetDate}T${data.meetTime}:00`);
        const format = (zone) => { try { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: zone }).format(instant); } catch { return 'Invalid time zone'; } };
        const end = new Date(instant.getTime() + n('meetDuration') * 60000);
        const workingHour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: data.meetTargetZone || 'UTC' }).format(instant));
        const fits = workingHour >= n('meetHoursStart') && workingHour < n('meetHoursEnd');
        return result(`${format(data.meetZone || 'UTC')} (${data.meetZone || 'UTC'})`, `${format(data.meetTargetZone || 'UTC')} (${data.meetTargetZone || 'UTC'}) · Ends ${new Intl.DateTimeFormat(undefined, { timeStyle: 'short', timeZone: data.meetTargetZone || 'UTC' }).format(end)} · ${fits ? 'Within participant work hours' : 'Outside participant preferred hours'} · ${data.meetParticipants || 'No participants added'}`);
      }
      case 'actions': {
        const due = daysUntil(data.actDeadline);
        return result(`${data.actStatus} · ${data.actPriority} priority`, `${data.actTask || 'Action item'} · Owner ${data.actOwner || 'Unassigned'} · ${due === null ? 'No deadline' : due < 0 ? `${Math.abs(due)} days overdue` : due === 0 ? 'Due today' : `Due in ${due} days`} · ${data.actMeeting || 'Meeting not specified'}`);
      }
      case 'projectcost': {
        const tasks = groupRows(data.projTasks).map((parts) => ({ name: parts[0], hours: number(parts[1]), rate: number(parts[2]) })).filter((task) => task.name);
        const labor = tasks.reduce((sum, task) => sum + task.hours * task.rate, 0);
        const base = labor + n('projTools') + n('projHosting') + n('projMaterials') + n('projMisc');
        const cost = base * (1 + n('projContingency') / 100);
        const quote = cost / Math.max(0.01, 1 - n('projMargin') / 100);
        return result(`${currency(cost)} estimated project cost`, `${tasks.length} tasks · ${tasks.reduce((sum, task) => sum + task.hours, 0)} labour hours · Suggested quote ${currency(quote)} at ${n('projMargin')}% margin · Expected gross profit ${currency(quote - cost)} · ${data.projClient || 'Client unset'}`);
      }
      case 'freelance': {
        const remaining = Math.max(0, n('freeQuote') - n('freePaid'));
        const profit = n('freePaid') - n('freeExpenses');
        const due = daysUntil(data.freeDue);
        return result(`${data.freeStatus} · ${currency(remaining)} outstanding`, `${data.freeProject || 'Project'} for ${data.freeClient || 'Client'} · ${currency(profit)} cash profit to date · ${n('freeHours')} hours · Deadline ${due === null ? 'not set' : due < 0 ? `${Math.abs(due)} days overdue` : `in ${due} days`} · ${data.freeMilestones || 'No milestones'}`);
      }
      case 'timebudget': {
        const activities = groupRows(data.timeActivities).map((parts) => ({ name: parts[0], planned: number(parts[1]), actual: number(parts[2]) })).filter((item) => item.name);
        const planned = activities.reduce((sum, item) => sum + item.planned, 0) + n('timeCommitments');
        const actual = n('timeActual') || activities.reduce((sum, item) => sum + item.actual, 0);
        const remaining = 24 - planned;
        return result(`${planned.toFixed(1)} planned hours · ${remaining.toFixed(1)} hours unallocated`, `${actual.toFixed(1)} actual hours · ${Math.max(0, planned - actual).toFixed(1)} hours under plan · ${planned > 24 ? 'Warning: plan exceeds 24 hours' : 'Within 24-hour day'} · Sleep target ${n('timePlannedSleep')} hours`);
      }
      case 'audit': case 'dashboard': case 'lifeadmin': {
        const expiry = rows('expiry');
        const expiring = expiry.filter((record) => { const days = daysUntil(record.expDate); return days !== null && days <= 30; }).length;
        const overdue = expiry.filter((record) => daysUntil(record.expDate) < 0).length;
        const warranty = rows('warranty').filter((record) => { const purchase = new Date(`${record.warPurchaseDate}T00:00:00`); if (Number.isNaN(purchase.getTime())) return false; purchase.setMonth(purchase.getMonth() + number(record.warMonths)); return purchase.getTime() - Date.now() <= 30 * 86400000; }).length;
        const actions = rows('actions').filter((record) => record.actStatus !== 'Completed').length;
        const complaints = rows('complaints').filter((record) => !['Resolved','Closed'].includes(record.comStatus)).length;
        const assets = rows('assets');
        const assetValue = assets.reduce((sum, record) => sum + number(record.assetValue), 0);
        const maintenanceDue = rows('maintenance').filter((record) => { const days = daysUntil(record.maintNext); return days !== null && days <= 30; }).length;
        const finance = (() => { try { return JSON.parse(localStorage.getItem('tf-finance-data')) || {}; } catch { return {}; } })();
        const recurring = (finance.transactions || []).filter((row) => row.recurring).reduce((sum, row) => sum + number(row.amount), 0);
        const receipts = rows('receipt');
        const message = `${expiring} documents expiring within 30 days · ${overdue} expired · ${warranty} warranties at risk · ${maintenanceDue} maintenance due · ${actions} open actions · ${complaints} active complaints · ${currency(recurring)} recorded recurring finance entries · ${receipts.length} analyzed receipts`;
        return result(`${currency(assetValue)} tracked current asset value`, message, [['Expiring documents', expiring], ['Warranty risk', warranty], ['Maintenance due', maintenanceDue], ['Open actions', actions], ['Active complaints', complaints], ['Assets', assets.length]]);
      }
      case 'emergency': {
        return result(`${data.emName || 'Emergency card'} · Ready to print`, `${data.emContact || 'Primary contact not set'} · ${data.emBackup || 'Secondary contact not set'} · Medical alert ${data.emAllergy || 'none entered'} · Insurance ${data.emInsurance || 'not set'} · Vehicle ${data.emVehicle || 'not set'}`);
      }
      case 'handover': {
        const count = Object.keys(state).filter((key) => Array.isArray(state[key])).reduce((sum, key) => sum + rows(key).length, 0);
        return result(`${count} local records available for handover`, `${data.handTitle || 'Handover pack'} · For ${data.handRecipient || 'recipient not set'} · ${data.handCategories || 'All Life Admin records'} · Includes only records stored in this browser`);
      }
      default: return result('Ready to save', 'Enter details, then save a local record.');
    }
  }

  function outputHtml(output) {
    return `<strong>${escaped(output.headline)}</strong><span>${escaped(output.detail)}</span>${output.metrics?.length ? `<div class="life-metric-grid">${output.metrics.map(([label, value]) => `<div class="life-metric"><span>${escaped(label)}</span><strong>${escaped(value)}</strong></div>`).join('')}</div>` : ''}`;
  }

  function renderRecords(tool) {
    if (tool === 'dashboard' || tool === 'audit' || tool === 'lifeadmin' || tool === 'handover') return '';
    const recordKey = toolStateKey(tool);
    const records = rows(recordKey);
    const listHtml = records.slice(0, 30).map((record) => `<article class="life-record"><div><strong>${escaped(record.title || record.name || titles[tool])}</strong><small>${escaped(record.summary || new Date(record.createdAt).toLocaleDateString())}</small></div><button class="life-delete" data-delete-record="${escaped(record.id)}" type="button" aria-label="Delete ${escaped(record.title || record.name || titles[tool])}" title="Delete"><i class="bi bi-trash"></i></button></article>`).join('') || '<p class="hub-muted">No saved records yet.</p>';
    if (tool === 'expiry') {
      const calendarRows = records.slice().sort((a, b) => String(a.expDate).localeCompare(String(b.expDate))).map((record) => { const days = daysUntil(record.expDate); return `<div class="life-timeline-item"><span class="life-timeline-dot ${days !== null && days <= 30 ? 'urgent' : ''}"></span><div><strong>${escaped(record.expName)}</strong><small>${escaped(record.expCategory)} · ${escaped(record.expDate)} · ${days === null ? 'Date missing' : days < 0 ? `${Math.abs(days)} days expired` : `${days} days remaining`} · ${escaped(record.expPriority)}</small><button type="button" class="life-inline" data-renew-record="${escaped(record.id)}">Mark renewed</button></div></div>`; }).join('');
      return `<div class="life-expiry-summary">${metricCards([['Upcoming (30 days)', records.filter((record) => { const days = daysUntil(record.expDate); return days !== null && days >= 0 && days <= 30; }).length], ['Expired', records.filter((record) => daysUntil(record.expDate) < 0).length], ['Tracked', records.length]])}</div>${expiryCalendar(records)}<div class="life-timeline">${calendarRows || '<p class="hub-muted">Upcoming and expired documents appear here after saving.</p>'}</div><div class="life-history-list">${listHtml}</div>`;
    }
    if (tool === 'receipt') {
      const totalsByVendor = {};
      const totalsByCategory = {};
      const totalsByMonth = {};
      records.forEach((record) => {
        const total = number(record.rcTotal);
        const vendor = record.rcVendor || 'Unknown vendor';
        const category = record.rcCategory || 'Other';
        const month = (record.rcDate || record.createdAt || '').slice(0, 7) || 'Undated';
        totalsByVendor[vendor] = (totalsByVendor[vendor] || 0) + total;
        totalsByCategory[category] = (totalsByCategory[category] || 0) + total;
        totalsByMonth[month] = (totalsByMonth[month] || 0) + total;
      });
      const reportGroup = (title, entries) => `<section class="life-report-group"><h4>${title}</h4>${Object.entries(entries).map(([label, total]) => `<div class="life-report-row"><span>${escaped(label)}</span><strong>${currency(total)}</strong></div>`).join('') || '<p class="hub-muted">No data yet.</p>'}</section>`;
      return `${records.length ? `<div class="life-report-grid">${reportGroup('Vendor spending', totalsByVendor)}${reportGroup('Category spending', totalsByCategory)}${reportGroup('Monthly spending', totalsByMonth)}</div>` : ''}${listHtml}`;
    }
    return listHtml;
  }

  function currentFormValues(tool) {
    return Object.fromEntries(definitions[tool].ids.map((id) => { const node = $(id); return [id, node?.type === 'checkbox' ? node.checked : node?.value ?? '']; }));
  }

  function refreshRecords(tool) {
    const node = $('lifeRecords');
    if (!node) return;
    node.innerHTML = renderRecords(tool);
    node.querySelectorAll('[data-delete-record]').forEach((button) => button.addEventListener('click', () => { deleteRow(toolStateKey(tool), button.dataset.deleteRecord); refreshRecords(tool); updateExpiryView(); }));
    node.querySelectorAll('[data-renew-record]').forEach((button) => button.addEventListener('click', () => renewExpiry(button.dataset.renewRecord)));
  }

  function updateExpiryView() {
    refreshRecords('expiry');
    const output = $('lifeResult');
    if (output) output.innerHTML = outputHtml(runCalculation('expiry', currentFormValues('expiry')));
  }

  function renewExpiry(id) {
    const records = rows(toolStateKey('expiry'));
    const record = records.find((item) => item.id === id);
    if (!record) return;
    const months = Number(String(record.expRepeat || '').match(/\d+/)?.[0] || 0);
    if (months) { const current = record.expDate ? new Date(`${record.expDate}T00:00:00`) : new Date(); const base = Number.isNaN(current.getTime()) || current < new Date(`${isoToday()}T00:00:00`) ? new Date(`${isoToday()}T00:00:00`) : current; base.setMonth(base.getMonth() + months); record.expDate = base.toISOString().slice(0, 10); }
    else record.expDate = isoToday();
    record.createdAt = new Date().toISOString();
    saveState();
    refreshRecords('expiry');
  }

  function renderLifeVault() {
    const eventButtons = lifeVaultPacks.map((pack) => `<button type="button" class="lifevault-event" data-lifevault-task="${escaped(pack.key)}">${escaped(pack.label)}</button>`).join('');
    return `<div class="life-intro"><span class="hub-kicker">CAPTURE · UNDERSTAND · PREPARE</span><p>Describe the job you need to finish. LifeVault checks records you have added to this encrypted browser vault, then shows what is ready and what is missing.</p></div>
      <div class="lifevault-layout">
        <section class="hub-panel lifevault-main">
          <div class="lifevault-unlock"><div><span class="hub-kicker">PRIVATE LOCAL VAULT</span><p id="lvVaultState" class="hub-muted">Unlock your encrypted records to build packs. Files are not scanned until you add them here.</p></div><label class="life-field"><span>Vault passphrase</span><input id="lvPassphrase" type="password" autocomplete="current-password" placeholder="At least 10 characters"></label><div class="life-actions">${action('lvUnlock','Unlock / create vault')}${action('lvLock','Lock vault',true)}</div></div>
          <details class="lifevault-add"><summary>Add a document to the vault</summary><div class="life-form-grid">${textField('lvName','Document name','Bike Insurance.pdf')}${selectField('lvCategory','Category',['Insurance','Vehicle','Property','Employment','Education','Identity','Medical','Finance','Purchase','Warranty','Travel','Other'])}${textField('lvDate','Expiry / due date','', 'date')}${textField('lvTags','Tags','bike, renewal, policy')}${areaField('lvNotes','Private notes','Optional notes. Encrypted before storage.')}${fileSchema('lvFile', false)}</div><div class="life-actions">${action('lvSave','Encrypt and save document')}</div></details>
          <div class="lifevault-task"><span class="hub-kicker">WHAT DO I NEED?</span><h3>Tell us what you are preparing for</h3><div class="lifevault-query"><input id="lvTaskQuery" type="search" placeholder="e.g. Mujhe bike insurance renew karna hai"><button id="lvPlan" class="hub-primary" type="button">Find my documents</button></div><div class="lifevault-events" role="group" aria-label="Life event packs">${eventButtons}</div><p id="lvPlanStatus" class="life-status" aria-live="polite"></p>
            <div class="lifevault-result-grid"><section><div class="lifevault-section-head"><h4>Found in your vault</h4><span id="lvFoundCount" class="lifevault-count">0</span></div><div id="lvFound" class="lifevault-list"></div></section><section><div class="lifevault-section-head"><h4>Still needed</h4><span id="lvMissingCount" class="lifevault-count is-missing">0</span></div><div id="lvMissing" class="lifevault-list"></div></section></div>
            <div class="life-actions">${action('lvCreatePack','Create ready-to-use ZIP pack')}${action('lvPrintPack','Print pack index / Save PDF',true)}</div>
          </div>
          <details class="lifevault-saved"><summary>Your encrypted records</summary><div id="lifeRecords" class="life-records"></div></details>
        </section>
        <aside class="hub-panel lifevault-side"><span class="hub-kicker">ACTION CENTER</span><h3 id="lvScoreTitle">Pack completeness</h3><div class="lifevault-score"><strong id="lvScore">0%</strong><span id="lvScoreCaption">Unlock the vault to check a pack</span></div><div id="lvInsights" class="lifevault-insights"></div><section class="lifevault-related"><h4>Related records</h4><div id="lvRelations" class="lifevault-relations"><p class="hub-muted">Choose a life event to connect related records.</p></div></section>
          <section class="lifevault-emergency"><span class="hub-kicker">EMERGENCY MODE</span><h4>Share a selected emergency pack</h4><p class="hub-muted">Export selected records encrypted with a separate password. The local viewer enforces expiry; a downloaded file cannot be remotely revoked.</p><div class="life-form-grid">${textField('lvEmergencyPassword','Pack password (10+ characters)','Separate from your vault passphrase','password')}${textField('lvEmergencyDays','Expires after (days)','7','number')}</div><button type="button" id="lvEmergencyExport" class="hub-secondary">Create encrypted emergency pack</button><label class="life-field"><span>Open a received pack</span><input id="lvEmergencyFile" type="file" accept="application/json,.json"></label><label class="life-field"><span>Pack password</span><input id="lvEmergencyOpenPassword" type="password" autocomplete="off"></label><button type="button" id="lvEmergencyOpen" class="hub-secondary">Open view-only pack</button><div id="lvEmergencyView" class="lifevault-emergency-view" hidden></div></section>
        </aside>
      </div><section class="lifevault-printable" id="lvPrintable" hidden></section>`;
  }

  const normalizeLifeVault = (value) => String(value ?? '').toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const lifeVaultEntries = () => [
    ...(unlockedVault || []).map((record) => ({ key: `vault:${record.id}`, title: record.vaultName, category: record.vaultCategory, date: record.vaultDate, tags: record.vaultTags, notes: record.vaultNotes, source: 'Encrypted vault', record })),
    ...rows('life:expiry').map((record, index) => ({ key: `expiry:${record.id || index}`, title: record.expName, category: record.expCategory, date: record.expDate, tags: `${record.expIssuer || ''} ${record.expNumber || ''}`, notes: record.expNotes, source: 'Expiry manager', record })),
    ...rows('life:assets').map((record, index) => ({ key: `asset:${record.id || index}`, title: record.assetName, category: record.assetType, date: record.assetInsurance || record.assetWarranty, tags: `${record.assetBrand || ''} ${record.assetModel || ''} ${record.assetSerial || ''}`, notes: record.assetNotes, source: 'Asset manager', record }))
  ].filter((entry) => entry.title);

  function detectLifeVaultTask(query) {
    const text = normalizeLifeVault(query);
    const match = lifeVaultPacks.flatMap((pack) => pack.aliases.map((alias) => ({ pack, alias: normalizeLifeVault(alias) })))
      .filter((item) => text.includes(item.alias)).sort((left, right) => right.alias.length - left.alias.length)[0];
    return match?.pack || activeLifeVaultTask || lifeVaultPacks[0];
  }

  function setLifeVaultMessage(message, error = false) {
    const node = $('lvPlanStatus');
    if (node) { node.textContent = message; node.classList.toggle('is-error', error); }
  }

  function runLifeVaultPlan(query = $('lvTaskQuery')?.value || '') {
    activeLifeVaultTask = detectLifeVaultTask(query);
    const entries = unlockedVault ? lifeVaultEntries() : [];
    const missing = [];
    const found = new Map();
    activeLifeVaultTask.required.forEach(([label, terms]) => {
      const matches = entries.filter((entry) => {
        const searchText = normalizeLifeVault(`${entry.title} ${entry.category} ${entry.tags} ${entry.notes} ${entry.record?.attachment?.name || ''}`);
        return terms.some((term) => searchText.includes(normalizeLifeVault(term)));
      });
      if (!matches.length) { missing.push(label); return; }
      matches.forEach((entry) => {
        const current = found.get(entry.key) || { ...entry, requirements: [] };
        current.requirements.push(label);
        found.set(entry.key, current);
      });
    });
    lifeVaultMatches = [...found.values()];
    $('lvFoundCount').textContent = lifeVaultMatches.length;
    $('lvMissingCount').textContent = missing.length;
    $('lvFound').innerHTML = lifeVaultMatches.map((entry, index) => `<label class="lifevault-match"><input class="lv-pack-check" type="checkbox" data-match-index="${index}" checked><span><strong>${escaped(entry.title)}</strong><small>${escaped(entry.category || entry.source)} · ${escaped(entry.date || 'No date')} · ${escaped(entry.source)}</small><em>${escaped(entry.requirements.join(', '))}</em></span></label>`).join('') || '<p class="hub-muted">No matching records yet. Add records to your encrypted vault.</p>';
    $('lvMissing').innerHTML = missing.map((label) => `<div class="lifevault-missing"><i class="bi bi-exclamation-circle" aria-hidden="true"></i><span>${escaped(label)}</span></div>`).join('') || '<p class="hub-muted">All checklist items have a matching record.</p>';
    const ratio = activeLifeVaultTask.required.length ? Math.round((activeLifeVaultTask.required.length - missing.length) / activeLifeVaultTask.required.length * 100) : 0;
    $('lvScore').textContent = `${ratio}%`;
    $('lvScoreCaption').textContent = `${activeLifeVaultTask.label} checklist complete`;
    $('lvScoreTitle').textContent = `${activeLifeVaultTask.label} readiness`;
    $('lvRelations').innerHTML = `<div class="lifevault-relation-root"><i class="bi bi-diagram-3" aria-hidden="true"></i><strong>${escaped(activeLifeVaultTask.entity)}</strong></div><div class="lifevault-relation-branches">${lifeVaultMatches.map((entry) => `<div class="lifevault-relation"><span></span><b>${escaped(entry.title)}</b><small>${escaped(entry.category || entry.source)}</small></div>`).join('') || '<p class="hub-muted">Matching documents will connect here.</p>'}</div>`;
    renderLifeVaultInsights(entries, missing);
    setLifeVaultMessage(unlockedVault ? `${lifeVaultMatches.length} matching record(s) found. ${missing.length} checklist item(s) still needed.` : 'Unlock the vault to search encrypted records.', !unlockedVault);
  }

  function renderLifeVaultInsights(entries, missing) {
    if (!unlockedVault) {
      $('lvInsights').innerHTML = '<p class="hub-muted">Unlock the encrypted vault to review deadlines, duplicates and repeat receipt vendors.</p>';
      return;
    }
    const upcoming = entries.map((entry) => ({ ...entry, days: daysUntil(entry.date) })).filter((entry) => entry.days !== null && entry.days >= 0 && entry.days <= 30).sort((a, b) => a.days - b.days);
    const conflicts = upcoming.filter((entry, index) => upcoming.some((other, otherIndex) => otherIndex !== index && Math.abs(other.days - entry.days) <= 5));
    const counts = new Map();
    entries.forEach((entry) => { const key = normalizeLifeVault(entry.title); counts.set(key, (counts.get(key) || 0) + 1); });
    const duplicates = [...counts.values()].filter((count) => count > 1).reduce((sum, count) => sum + count - 1, 0);
    const repeatVendors = new Map();
    rows('life:receipt').forEach((receipt) => {
      const vendor = String(receipt.rcVendor || '').trim();
      if (!vendor) return;
      const item = repeatVendors.get(normalizeLifeVault(vendor)) || { vendor, count: 0, total: 0 };
      item.count += 1;
      item.total += number(receipt.rcTotal);
      repeatVendors.set(normalizeLifeVault(vendor), item);
    });
    const recurring = [...repeatVendors.values()].filter((item) => item.count > 1);
    const conflictText = conflicts.length ? `${conflicts.length} deadlines fall within 5 days of another deadline.` : upcoming.length ? `${upcoming.length} deadline(s) in the next 30 days.` : 'No saved deadlines in the next 30 days.';
    $('lvInsights').innerHTML = `<div class="lifevault-insight"><span>Vault records</span><strong>${entries.length}</strong></div><div class="lifevault-insight"><span>Deadlines</span><strong>${escaped(conflictText)}</strong></div><div class="lifevault-insight"><span>Possible duplicates</span><strong>${duplicates}</strong></div><div class="lifevault-insight"><span>Repeat receipt vendors</span><strong>${recurring.length ? recurring.map((item) => `${escaped(item.vendor)} · ${item.count} receipts · ${currency(item.total)} recorded`).join('<br>') : 'No repeated vendor receipts found.'}</strong></div><p class="hub-muted">${missing.length ? `Next action: add ${missing.length} missing ${missing.length === 1 ? 'item' : 'items'} for ${escaped(activeLifeVaultTask.label)}.` : 'Review the selected records before sharing.'} Repeat vendors are signals to review, not confirmed subscriptions.</p>`;
  }

  async function persistLifeVault() {
    const previous = loadVaultCipher();
    if (!vaultKey || !Array.isArray(unlockedVault) || !previous) throw new Error('Unlock the vault before saving.');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await encryptVault(unlockedVault, vaultKey, iv);
    localStorage.setItem(VAULT_KEY, JSON.stringify({ salt: previous.salt, iv: toBase64(iv), cipher }));
  }

  function selectedLifeVaultEntries() {
    const selected = new Set([...document.querySelectorAll('.lv-pack-check:checked')].map((node) => Number(node.dataset.matchIndex)));
    return lifeVaultMatches.filter((entry, index) => selected.has(index));
  }

  function lifeVaultManifest(entries = selectedLifeVaultEntries()) {
    return { title: activeLifeVaultTask.label, request: $('lvTaskQuery')?.value || activeLifeVaultTask.label, createdAt: new Date().toISOString(), required: activeLifeVaultTask.required.map(([label]) => label), found: entries.map((entry) => ({ name: entry.title, category: entry.category, date: entry.date || '', source: entry.source })), missing: activeLifeVaultTask.required.map(([label]) => label).filter((label) => !lifeVaultMatches.some((entry) => entry.requirements.includes(label))) };
  }

  function renderLifeVaultPrint() {
    const manifest = lifeVaultManifest();
    $('lvPrintable').innerHTML = `<h1>${escaped(manifest.title)} Pack</h1><p>Prepared ${escaped(new Date(manifest.createdAt).toLocaleString())}</p><p>Request: ${escaped(manifest.request)}</p><h2>Included records</h2><ul>${manifest.found.map((entry) => `<li>${escaped(entry.name)} · ${escaped(entry.category)} · ${escaped(entry.date || 'No date')}</li>`).join('') || '<li>No matching records selected</li>'}</ul><h2>Still needed</h2><ul>${manifest.missing.map((item) => `<li>${escaped(item)}</li>`).join('') || '<li>Checklist complete</li>'}</ul><p class="lifevault-print-note">This index was prepared from records stored in this browser. Verify original documents and dates before use.</p>`;
    $('lvPrintable').hidden = false;
    document.body.classList.add('lifevault-printing');
    window.addEventListener('afterprint', () => { document.body.classList.remove('lifevault-printing'); $('lvPrintable')?.setAttribute('hidden', ''); }, { once: true });
    window.print();
    window.setTimeout(() => { document.body.classList.remove('lifevault-printing'); $('lvPrintable')?.setAttribute('hidden', ''); }, 2000);
  }

  async function createLifeVaultPack() {
    if (!unlockedVault) { setLifeVaultMessage('Unlock the vault before creating a pack.', true); return; }
    const entries = selectedLifeVaultEntries();
    const manifest = lifeVaultManifest(entries);
    if (!window.JSZip) { download('lifevault-pack.json', JSON.stringify(manifest, null, 2), 'application/json'); setLifeVaultMessage('ZIP library unavailable; downloaded the pack index as JSON.'); return; }
    const archive = new window.JSZip();
    archive.file('pack-index.json', JSON.stringify(manifest, null, 2));
    let attachmentCount = 0;
    entries.forEach((entry) => {
      const attachment = entry.record?.attachment;
      if (!attachment?.bytes) return;
      const safeName = String(attachment.name || entry.title).replace(/[\\/:*?"<>|]/g, '_');
      archive.file(`documents/${safeName}`, fromBase64(attachment.bytes));
      attachmentCount += 1;
    });
    archive.file('README.txt', 'This pack contains only records selected in LifeVault. Verify each document and date before submitting.');
    download(`lifevault-${activeLifeVaultTask.key}-pack.zip`, await archive.generateAsync({ type: 'blob' }), 'application/zip');
    setLifeVaultMessage(`Pack downloaded with ${entries.length} record(s), ${attachmentCount} attached file(s), and ${manifest.missing.length} missing checklist item(s).`);
  }

  async function createEmergencyPack() {
    if (!unlockedVault) { setLifeVaultMessage('Unlock your vault before creating an emergency pack.', true); return; }
    const password = $('lvEmergencyPassword').value;
    const days = Math.max(1, Math.min(30, number($('lvEmergencyDays').value) || 7));
    if (password.length < 10) { setLifeVaultMessage('Choose a separate emergency-pack password of at least 10 characters.', true); return; }
    const entries = selectedLifeVaultEntries();
    if (!entries.length) { setLifeVaultMessage('Select at least one record in the found list first.', true); return; }
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + days * 86400000).toISOString();
    const payload = { format: 'Thakronix-lifevault-emergency-v1', title: activeLifeVaultTask.label, createdAt: createdAt.toISOString(), expiresAt, records: entries.map((entry) => entry.record) };
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveVaultKey(password, salt);
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(payload)));
    download('lifevault-emergency-pack.encrypted.json', JSON.stringify({ format: payload.format, expiresAt, salt: toBase64(salt), iv: toBase64(iv), cipher: toBase64(cipher) }), 'application/json');
    setLifeVaultMessage(`Encrypted pack downloaded. It expires in ${days} day(s) in the LifeVault viewer; downloaded copies cannot be remotely revoked.`);
  }

  async function openEmergencyPack() {
    const file = $('lvEmergencyFile').files?.[0];
    const password = $('lvEmergencyOpenPassword').value;
    const panel = $('lvEmergencyView');
    if (!file || !password) { setLifeVaultMessage('Choose an encrypted pack and enter its separate password.', true); return; }
    try {
      const envelope = JSON.parse(await file.text());
      if (envelope.format !== 'Thakronix-lifevault-emergency-v1') throw new Error('This is not a LifeVault emergency pack.');
      if (Date.now() > new Date(envelope.expiresAt).getTime()) throw new Error('This emergency pack has expired.');
      const key = await deriveVaultKey(password, fromBase64(envelope.salt));
      const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(envelope.iv) }, key, fromBase64(envelope.cipher));
      const payload = JSON.parse(new TextDecoder().decode(clear));
      panel.innerHTML = `<h5>${escaped(payload.title)} · View only</h5><p>Expires ${escaped(new Date(payload.expiresAt).toLocaleString())}</p>${payload.records.map((record) => `<div class="lifevault-match"><span><strong>${escaped(record.vaultName)}</strong><small>${escaped(record.vaultCategory)} · ${escaped(record.vaultDate || 'No date')}</small></span></div>`).join('') || '<p class="hub-muted">No records in this pack.</p>'}`;
      panel.hidden = false;
    } catch (error) { panel.hidden = true; setLifeVaultMessage(error.message || 'Could not open this pack. Check its password.', true); }
  }

  function bindLifeVault() {
    $('lvUnlock').addEventListener('click', async () => {
      const passphrase = $('lvPassphrase').value;
      if (passphrase.length < 10) { setLifeVaultMessage('Use a vault passphrase with at least 10 characters.', true); return; }
      try {
        if (!crypto?.subtle) throw new Error('Secure browser encryption is unavailable.');
        const cipher = loadVaultCipher();
        if (!cipher) {
          const salt = crypto.getRandomValues(new Uint8Array(16));
          vaultKey = await deriveVaultKey(passphrase, salt);
          unlockedVault = [];
          localStorage.setItem(VAULT_KEY, JSON.stringify({ salt: toBase64(salt), iv: '', cipher: '' }));
        } else {
          const salt = fromBase64(cipher.salt);
          vaultKey = await deriveVaultKey(passphrase, salt);
          unlockedVault = cipher.cipher ? JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(cipher.iv) }, vaultKey, fromBase64(cipher.cipher)))) : [];
        }
        $('lvVaultState').textContent = `${unlockedVault.length} encrypted record(s) unlocked in this tab. The key is not saved.`;
        document.querySelector('.lifevault-add').open = true;
        drawVaultRecords();
        runLifeVaultPlan();
      } catch { vaultKey = null; unlockedVault = null; setLifeVaultMessage('Could not unlock this vault. Check the passphrase; it cannot be recovered.', true); }
    });
    $('lvLock').addEventListener('click', () => { vaultKey = null; unlockedVault = null; $('lvVaultState').textContent = 'Vault locked. The encryption key was cleared from memory.'; $('lifeRecords').innerHTML = ''; $('lvEmergencyView').hidden = true; runLifeVaultPlan(); });
    $('lvSave').addEventListener('click', async () => {
      if (!vaultKey || !Array.isArray(unlockedVault)) { setLifeVaultMessage('Unlock the vault before adding a record.', true); return; }
      const name = $('lvName').value.trim();
      if (!name) { setLifeVaultMessage('Enter a document name.', true); return; }
      const file = $('lvFile').files?.[0];
      if (file && file.size > 2 * 1024 * 1024) { setLifeVaultMessage('Encrypted vault attachment limit is 2 MB.', true); return; }
      const attachment = file ? { name: file.name, type: file.type, bytes: toBase64(await file.arrayBuffer()) } : undefined;
      unlockedVault.unshift({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), vaultName: name, vaultCategory: $('lvCategory').value, vaultDate: $('lvDate').value, vaultTags: $('lvTags').value, vaultNotes: $('lvNotes').value, attachment });
      try {
        await persistLifeVault();
        $('lvName').value = ''; $('lvDate').value = ''; $('lvTags').value = ''; $('lvNotes').value = ''; $('lvFile').value = '';
        drawVaultRecords(); runLifeVaultPlan();
        $('lvVaultState').textContent = `${unlockedVault.length} encrypted record(s) stored locally.`;
      } catch (error) { setLifeVaultMessage(error.message || 'Could not encrypt this record.', true); }
    });
    $('lvPlan').addEventListener('click', () => runLifeVaultPlan($('lvTaskQuery').value));
    $('lvTaskQuery').addEventListener('keydown', (event) => { if (event.key === 'Enter') runLifeVaultPlan($('lvTaskQuery').value); });
    document.querySelectorAll('[data-lifevault-task]').forEach((button) => button.addEventListener('click', () => { activeLifeVaultTask = lifeVaultPacks.find((pack) => pack.key === button.dataset.lifevaultTask) || lifeVaultPacks[0]; $('lvTaskQuery').value = activeLifeVaultTask.label; runLifeVaultPlan(activeLifeVaultTask.label); }));
    $('lvCreatePack').addEventListener('click', createLifeVaultPack);
    $('lvPrintPack').addEventListener('click', renderLifeVaultPrint);
    $('lvEmergencyExport').addEventListener('click', createEmergencyPack);
    $('lvEmergencyOpen').addEventListener('click', openEmergencyPack);
    runLifeVaultPlan();
  }

  function renderWorkspace(tool) {
    activeTool = tool;
    $('lifeWorkspace').hidden = false;
    $('lifeWorkspaceTitle').textContent = titles[tool];
    const definition = definitions[tool];
    if (tool === 'dashboard' || tool === 'audit' || tool === 'lifeadmin') {
      const output = runCalculation(tool, {});
      const actions = `<div class="life-actions">${action('lifeRefresh','Refresh dashboard')}${action('lifePrint','Print / Save PDF',true)}${action('lifeExport','Export local records',true)}</div>`;
      $('lifeWorkspaceBody').innerHTML = `<div class="life-intro"><span class="hub-kicker">CROSS-TOOL OVERVIEW</span><p>${tool === 'audit' ? 'A local-only review of reminders and records you have entered in Life Admin and Finance.' : 'A shared overview of your Life Admin records and connected local Finance data.'}</p></div><section class="hub-panel life-overview-panel"><div id="lifeResult" class="hub-result">${outputHtml(output)}</div>${actions}<div id="lifeRecords"></div></section>`;
      $('lifeRefresh').addEventListener('click', () => { $('lifeResult').innerHTML = outputHtml(runCalculation(tool, {})); });
      $('lifePrint').addEventListener('click', () => window.print());
      $('lifeExport').addEventListener('click', exportAllRecords);
      return;
    }
    if (tool === 'lifevault') {
      $('lifeWorkspaceBody').innerHTML = renderLifeVault();
      bindLifeVault();
      return;
    }
    if (tool === 'vault') {
      const side = '<div class="life-vault-preview"><p class="hub-muted">Unlock the vault to view decrypted record names.</p></div>';
      $('lifeWorkspaceBody').innerHTML = shell('Sensitive records are encrypted with AES-GCM using a passphrase you choose. The key is not stored; forgetting the passphrase makes the vault unrecoverable.', definition.form, side);
      bindVault();
      return;
    }
    if (tool === 'handover') {
      $('lifeWorkspaceBody').innerHTML = shell('Prepare a local records manifest and print a handover summary. Attachments selected in expiry records can be bundled when available.', definition.form, `<div id="lifeRecords" class="life-handover-preview"><p class="hub-muted">The pack is generated from records selected above.</p></div>`);
      bindTool(tool);
      $('buildHandover').addEventListener('click', buildHandover);
      return;
    }
    const side = tool === 'emergency' ? '<section class="emergency-share-manager"><span class="hub-kicker">QR ACCESS</span><h3>Your active emergency cards</h3><p class="hub-muted">Manage cards in this browser, or use the recovery key from any device.</p><div id="emergencyActiveShares"></div><div class="emergency-recovery"><label class="life-field"><span>Card link or token</span><input id="emergencyRecoveryToken" autocomplete="off" placeholder="Paste emergency card link or token"></label><label class="life-field"><span>Revoke key</span><input id="emergencyRecoveryKey" type="password" autocomplete="off" placeholder="Paste private revoke key"></label><button type="button" id="emergencyRecoveryRevoke" class="hub-secondary">Revoke with key</button></div></section>' : tool === 'expiry' ? '<div class="life-expiry-controls"><label class="life-field"><span>Calendar month</span><input id="expiryMonth" type="month"></label><button type="button" id="expiryBundle" class="hub-secondary">Build document bundle</button></div>' : '';
    $('lifeWorkspaceBody').innerHTML = shell(tool === 'receipt' ? 'Upload a bill image or PDF. OCR is optional and local when the browser library is available; verify every extracted value before saving.' : (tool === 'emergency' ? 'Create the same printable emergency card, or share only the fields you select through a private, expiring QR.' : (titles[tool] + ' uses the details you enter here. Preview results before saving records.')), definition.form, side);
    bindTool(tool);
    refreshRecords(tool);
    const output = $('lifeResult');
    if (output) output.innerHTML = outputHtml(runCalculation(tool, currentFormValues(tool)));
    if (tool === 'expiry') { $('expiryMonth').value = isoToday().slice(0, 7); $('expiryMonth').addEventListener('change', filterExpiryCalendar); $('expiryBundle').addEventListener('click', exportExpiryBundle); }
    if (tool === 'filelifecycle') $('analyzeLifecycle').addEventListener('click', analyzeLifecycle);
    if (tool === 'receipt') { $('rcExtract').addEventListener('click', extractReceipt); $('rcSaveExpense').addEventListener('click', async () => { await saveTool(tool); }); }
    if (tool === 'emergency') $('lifePrint').addEventListener('click', () => window.print());
    if (tool === 'emergency') bindEmergencyQr();
  }

  function bindTool(tool) {
    const definition = definitions[tool];
    definition.ids.forEach((id) => { const node = $(id); node?.addEventListener('input', () => { $('lifeResult').innerHTML = outputHtml(runCalculation(tool, currentFormValues(tool))); }); node?.addEventListener('change', () => { $('lifeResult').innerHTML = outputHtml(runCalculation(tool, currentFormValues(tool))); }); });
    $('lifePreview').addEventListener('click', () => { $('lifeResult').innerHTML = outputHtml(runCalculation(tool, currentFormValues(tool))); });
    $('lifeSave').addEventListener('click', () => saveTool(tool));
    $('lifePrint').addEventListener('click', () => window.print());
    $('lifeExport').addEventListener('click', () => exportRows(tool));
    $('lifeWorkspaceBody').querySelectorAll('input[type="file"]').forEach((node) => node.addEventListener('change', () => { if (tool === 'filelifecycle') state.pendingLifecycleFiles = [...node.files].map((file) => ({ name: file.name, size: file.size, type: file.type, lastModified: file.lastModified })); }));
  }

  const EMERGENCY_SHARES_KEY = 'tf-emergency-qr-shares-v1';
  const readEmergencyShares = () => { try { const value = JSON.parse(localStorage.getItem(EMERGENCY_SHARES_KEY)); return Array.isArray(value) ? value : []; } catch { return []; } };
  const writeEmergencyShares = (shares) => localStorage.setItem(EMERGENCY_SHARES_KEY, JSON.stringify(shares));

  function renderEmergencyShares() {
    const container = $('emergencyActiveShares');
    if (!container) return;
    const shares = readEmergencyShares();
    container.innerHTML = shares.length ? shares.map((share) => `<article class="emergency-share-row"><div><a href="${escaped(share.url)}" target="_blank" rel="noopener noreferrer">Open shared card</a><small>Expires ${escaped(new Date(share.expiresAt).toLocaleString())}</small><small>${share.revoked ? 'Revoked' : 'Active'}</small></div>${share.revoked ? '' : `<button type="button" class="life-delete" data-emergency-revoke="${escaped(share.token)}" aria-label="Revoke emergency QR" title="Revoke"><i class="bi bi-slash-circle"></i></button>`}</article>`).join('') : '<p class="hub-muted">No emergency QR cards created in this browser.</p>';
    container.querySelectorAll('[data-emergency-revoke]').forEach((button) => button.addEventListener('click', async () => {
      const target = readEmergencyShares().find((share) => share.token === button.dataset.emergencyRevoke);
      if (!target) return;
      button.disabled = true;
      try {
        const response = await fetch(`/api/emergency-qr/${encodeURIComponent(target.token)}/revoke`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revokeKey: target.revokeKey }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not revoke this card.');
        writeEmergencyShares(readEmergencyShares().map((share) => share.token === target.token ? { ...share, revoked: true } : share));
        renderEmergencyShares();
      } catch (error) { setStatus(error.message, true); button.disabled = false; }
    }));
  }

  function bindEmergencyQr() {
    renderEmergencyShares();
    $('emergencyRecoveryRevoke').addEventListener('click', async () => {
      const rawToken = val('emergencyRecoveryToken');
      const revokeKey = val('emergencyRecoveryKey');
      const tokenMatch = rawToken.match(/(?:^|\/)emergency-qr\/([A-Za-z0-9_-]+)\/?(?:[?#].*)?$/) || rawToken.match(/^([A-Za-z0-9_-]{24,64})$/);
      if (!tokenMatch || !revokeKey) { setStatus('Enter a valid emergency card link or token and its revoke key.', true); return; }
      const token = tokenMatch[1];
      const button = $('emergencyRecoveryRevoke');
      button.disabled = true;
      try {
        const response = await fetch(`/api/emergency-qr/${encodeURIComponent(token)}/revoke`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revokeKey }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not revoke this card.');
        writeEmergencyShares(readEmergencyShares().map((share) => share.token === token ? { ...share, revoked: true } : share));
        $('emergencyRecoveryKey').value = '';
        setStatus('Emergency card revoked. Its link no longer shows any information.');
        renderEmergencyShares();
      } catch (error) { setStatus(error.message, true); }
      finally { button.disabled = false; }
    });
    $('emQrGenerate').addEventListener('click', async () => {
      const data = {};
      document.querySelectorAll('[data-emergency-share]:checked').forEach((checkbox) => {
        const source = $(checkbox.dataset.source);
        const value = checkbox.dataset.flag === 'true' ? (source.checked ? 'Available' : 'Not available') : source.value.trim();
        if (value) data[checkbox.dataset.emergencyShare] = value;
      });
      if (!Object.keys(data).length) { setStatus('Select at least one non-empty field to include in the QR.', true); return; }
      const button = $('emQrGenerate');
      button.disabled = true;
      setStatus('Encrypting selected information and creating your private link...');
      try {
        const response = await fetch('/api/emergency-qr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data, ttl: Number($('emQrTtl').value) }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not create this emergency QR.');
        const share = { token: result.url.split('/').pop(), url: result.url, revokeKey: result.revokeKey, expiresAt: result.expiresAt, revoked: false };
        writeEmergencyShares([share, ...readEmergencyShares()]);
        $('emergencyQrResult').hidden = false;
        $('emergencyQrLink').href = result.url;
        $('emergencyQrLink').textContent = result.url;
        $('emergencyQrExpiry').textContent = `Read-only access expires ${new Date(result.expiresAt).toLocaleString()}.`;
        $('emergencyQrImage').src = result.qrDataUrl;
        $('emergencyQrCopyKey').onclick = async () => {
          try { await navigator.clipboard.writeText(result.revokeKey); setStatus('Revoke key copied. Keep it private.'); }
          catch { setStatus('Clipboard unavailable. The revoke key remains saved in this browser.', true); }
        };
        setStatus('Emergency QR created. Only selected information is included.');
        renderEmergencyShares();
      } catch (error) { setStatus(error.message, true); }
      finally { button.disabled = false; }
    });
  }

  function filterExpiryCalendar() {
    const month = $('expiryMonth').value;
    refreshRecords('expiry');
    const node = $('lifeRecords');
    node.querySelectorAll('.life-timeline-item').forEach((item) => { item.hidden = month && !item.querySelector('small')?.textContent.includes(month); });
  }

  async function analyzeLifecycle() {
    const files = [...($('lifecycleFiles')?.files || [])];
    state.pendingLifecycleFiles = files.map((file) => ({ name: file.name, size: file.size, type: file.type, lastModified: file.lastModified }));
    saveState();
    $('lifeResult').innerHTML = outputHtml(runCalculation('filelifecycle', currentFormValues('filelifecycle')));
    setStatus(`${files.length} selected files analyzed. Originals have not been changed.`);
  }

  async function extractReceipt() {
    const file = $('rcFile').files?.[0];
    if (!file) { setStatus('Choose a receipt image or PDF first.', true); return; }
    setStatus('Preparing local OCR...');
    try {
      let source = file;
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        if (!window.pdfjsLib) throw new Error('PDF reader library unavailable. You can still enter the verified fields manually.');
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height;
        await firstPage.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        source = canvas;
      }
      if (!window.Tesseract?.recognize) throw new Error('OCR library unavailable. You can still enter the verified fields manually.');
      const recognition = await window.Tesseract.recognize(source, 'eng');
      const text = recognition.data.text || '';
      $('rcOcr').value = text;
      const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (!$('rcVendor').value) $('rcVendor').value = lines[0] || '';
      const invoice = text.match(/(?:invoice|bill|receipt)\s*(?:no\.?|number|#)?\s*[:#-]?\s*([A-Z0-9/-]{3,})/i);
      if (invoice && !$('rcInvoice').value) $('rcInvoice').value = invoice[1];
      const ocrDate = text.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b|\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
      if (ocrDate && !$('rcDate').value) {
        let year, month, day;
        if (ocrDate[1]) [, year, month, day] = ocrDate;
        else { [, day, month, year] = ocrDate; if (year.length === 2) year = `20${year}`; }
        $('rcDate').value = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
      const total = text.match(/(?:grand\s*total|total\s*due|amount\s*due|total)\D{0,20}([\d,]+(?:\.\d{1,2})?)/i);
      if (total && !$('rcTotal').value) $('rcTotal').value = total[1].replaceAll(',', '');
      const discount = text.match(/discount\D{0,20}([\d,]+(?:\.\d{1,2})?)/i);
      if (discount && !$('rcDiscount').value) $('rcDiscount').value = discount[1].replaceAll(',', '');
      const tax = text.match(/(?:GST|VAT|tax)\D{0,20}([\d,]+(?:\.\d{1,2})?)/i);
      if (tax && !$('rcTax').value) $('rcTax').value = tax[1].replaceAll(',', '');
      const itemLines = lines.map((line) => {
        const match = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*[xX@]\s*[₹$]?\s*([\d,]+(?:\.\d{1,2})?)$|^(.+?)\s+(\d+(?:\.\d+)?)\s+[₹$]?\s*([\d,]+(?:\.\d{1,2})?)$/);
        if (!match) return null;
        return `${(match[1] || match[4]).trim()},${match[2] || match[5]},${(match[3] || match[6]).replaceAll(',', '')}`;
      }).filter(Boolean);
      if (itemLines.length && !$('rcItems').value) $('rcItems').value = itemLines.join('\n');
      const method = /\bUPI\b/i.test(text) ? 'UPI' : /\b(card|visa|mastercard)\b/i.test(text) ? 'Card' : /\bcash\b/i.test(text) ? 'Cash' : /\b(cheque|check)\b/i.test(text) ? 'Cheque' : '';
      if (method) $('rcMethod').value = method;
      setStatus('OCR complete. Verify vendor, invoice, line items, tax and total before saving.');
    } catch (error) { setStatus(error.message || 'OCR could not read this file. Enter the fields manually.', true); }
  }

  function addExpenseFromReceipt(data, output) {
    const finance = (() => { try { return JSON.parse(localStorage.getItem('tf-finance-data')) || {}; } catch { return {}; } })();
    const fingerprint = data.rcHash || `${data.rcVendor}|${data.rcInvoice}|${data.rcDate}|${data.rcTotal}`.toLowerCase();
    state.receiptHashes = state.receiptHashes || {};
    if (state.receiptHashes[fingerprint]) { setStatus('Duplicate bill detected. Review the existing saved receipt before adding another expense.', true); return false; }
    state.receiptHashes[fingerprint] = true;
    saveState();
    finance.transactions = Array.isArray(finance.transactions) ? finance.transactions : [];
    finance.transactions.unshift({ id: crypto.randomUUID(), amount: number(data.rcTotal) || number(output.headline.match(/[\d,.]+/)?.[0]?.replaceAll(',', '')), kind: 'expense', date: data.rcDate || new Date().toISOString(), category: data.rcCategory || 'Other', payment: data.rcMethod || 'Other', recurring: '', note: `${data.rcVendor || 'Bill'} ${data.rcInvoice || ''}`.trim() });
    localStorage.setItem('tf-finance-data', JSON.stringify(finance));
    return true;
  }

  async function saveTool(tool) {
    const data = currentFormValues(tool);
    const title = data.expName || data.rcVendor || data.shopName || data.rrName || data.tcoAsset || data.comProduct || data.warProduct || data.maintTask || data.assetName || data.vaultName || data.meetTitle || data.actTask || data.projName || data.freeProject || data.handTitle || titles[tool];
    const output = runCalculation(tool, data);
    const fileInputId = tool === 'receipt' ? 'rcFile' : 'laAttachment';
    const file = $(fileInputId)?.files?.[0];
    if (file && file.size > MAX_ATTACHMENT_BYTES) { setStatus('Attachment exceeds the 5 MB local limit.', true); return; }
    if (tool === 'expiry' && file && val('expPassphrase').length < 10) { setStatus('Enter a passphrase of at least 10 characters to encrypt this document attachment.', true); return; }
    if (tool === 'receipt') {
      try { data.rcHash = file ? await hashFile(file) : `${data.rcVendor}|${data.rcInvoice}|${data.rcDate}|${data.rcTotal}`.trim().toLowerCase(); }
      catch { setStatus('Could not fingerprint this bill in the browser.', true); return; }
      state.receiptHashes = state.receiptHashes || {};
      if (state.receiptHashes[data.rcHash]) { setStatus('Duplicate bill detected. Review the existing saved receipt before saving.', true); return; }
    }
    let attachment;
    if (file) {
      try {
        const id = crypto.randomUUID();
        if (tool === 'expiry') {
          const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
          const key = await deriveVaultKey(val('expPassphrase'), salt);
          const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, await file.arrayBuffer());
          attachment = { id, name: file.name, type: file.type, size: file.size, encrypted: true };
          await putAttachment({ ...attachment, salt: toBase64(salt), iv: toBase64(iv), cipher: toBase64(cipher) });
        } else {
          attachment = { id, name: file.name, type: file.type, size: file.size, encrypted: false };
          await putAttachment({ ...attachment, blob: file });
        }
      } catch (error) { setStatus(error.message || 'Could not store the attachment locally.', true); return; }
    }
    const record = addRow(toolStateKey(tool), { ...data, title, summary: output.headline });
    if (attachment) record.attachment = attachment;
    if (tool === 'receipt') {
      const savedExpense = addExpenseFromReceipt(data, output);
      if (!savedExpense) return;
    }
    saveState();
    $('lifeResult').innerHTML = outputHtml(output);
    setStatus(`${title} saved in this browser.`);
    refreshRecords(tool);
    if (tool === 'expiry') updateExpiryView();
  }

  async function hashFile(file) {
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  function exportRows(tool) {
    const records = rows(toolStateKey(tool));
    const keys = [...new Set(records.flatMap((row) => Object.keys(row)))];
    const csvValue = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [keys.join(','), ...records.map((row) => keys.map((key) => csvValue(typeof row[key] === 'object' ? JSON.stringify(row[key]) : row[key])).join(','))].join('\n');
    download(`${tool}-records.csv`, csv, 'text/csv');
  }

  function exportAllRecords() { download('life-admin-backup.json', JSON.stringify(state, null, 2), 'application/json'); }

  async function exportExpiryBundle() {
    const records = rows(toolStateKey('expiry'));
    if (!window.JSZip) { setStatus('ZIP library unavailable; use Print / Save PDF for the current expiry list.', true); window.print(); return; }
    const archive = new window.JSZip();
    archive.file('expiry-records.json', JSON.stringify(records, null, 2));
    archive.file('expiry-timeline.txt', records.slice().sort((a, b) => String(a.expDate).localeCompare(String(b.expDate))).map((record) => `${record.expDate || 'No date'} | ${record.expName} | ${record.expCategory} | ${record.expPriority}`).join('\n'));
    const passphrase = val('expPassphrase');
    for (const record of records.filter((item) => item.attachment?.id)) {
      const stored = await getAttachment(record.attachment.id);
      if (!stored) continue;
      let blob = stored.blob;
      if (stored.encrypted) {
        if (passphrase.length < 10) { setStatus('Enter the attachment passphrase to decrypt documents into the bundle.', true); return; }
        const key = await deriveVaultKey(passphrase, fromBase64(stored.salt));
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(stored.iv) }, key, fromBase64(stored.cipher));
        blob = new Blob([plain], { type: stored.type });
      }
      if (blob) archive.file(`documents/${record.attachment.name}`, blob);
    }
    download('expiry-bundle.zip', await archive.generateAsync({ type: 'blob' }), 'application/zip');
  }

  async function buildHandover() {
    const chosen = $('handCategories').value;
    const include = Object.fromEntries(Object.keys(state).filter((key) => Array.isArray(state[key]) && (!chosen.startsWith('Documents') || ['life:expiry','life:vault','life:emergency'].includes(key)) && (!chosen.startsWith('Assets') || ['life:assets','life:warranty','life:maintenance'].includes(key)) && (!chosen.startsWith('Work') || ['life:meeting','life:actions','life:projectcost','life:freelance'].includes(key))).map((key) => [key, rows(key)]));
    const manifest = { title: val('handTitle'), recipient: val('handRecipient'), instructions: val('handInstructions'), createdAt: new Date().toISOString(), records: include };
    $('lifeResult').innerHTML = outputHtml(runCalculation('handover', { ...currentFormValues('handover'), handTitle: val('handTitle'), handRecipient: val('handRecipient'), handCategories: chosen }));
    $('lifeRecords').innerHTML = `<pre class="life-manifest">${escaped(JSON.stringify(manifest, null, 2))}</pre>`;
    if (window.JSZip) { const archive = new window.JSZip(); archive.file('handover-pack.json', JSON.stringify(manifest, null, 2)); archive.file('readme.txt', 'This pack contains only the records chosen in this browser. Check it before sharing.'); download('life-admin-handover.zip', await archive.generateAsync({ type: 'blob' }), 'application/zip'); }
    setStatus('Handover pack created. Use Print / Save PDF to produce a printable copy.');
    window.print();
  }

  function loadVaultCipher() { try { return JSON.parse(localStorage.getItem(VAULT_KEY) || 'null'); } catch { return null; } }
  function toBase64(bytes) { let binary = ''; new Uint8Array(bytes).forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary); }
  function fromBase64(text) { return Uint8Array.from(atob(text), (character) => character.charCodeAt(0)); }
  async function deriveVaultKey(passphrase, salt) {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt','decrypt']);
  }
  async function encryptVault(records, key, iv) {
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(records)));
    return toBase64(cipher);
  }
  async function bindVault() {
    $('vaultUnlock').addEventListener('click', async () => {
      const passphrase = val('vaultPassphrase');
      if (passphrase.length < 10) { setStatus('Use a passphrase with at least 10 characters.', true); return; }
      try {
        if (!crypto?.subtle) throw new Error('Secure browser encryption is unavailable.');
        const cipher = loadVaultCipher();
        if (!cipher) {
          const salt = crypto.getRandomValues(new Uint8Array(16));
          vaultKey = await deriveVaultKey(passphrase, salt);
          unlockedVault = [];
          localStorage.setItem(VAULT_KEY, JSON.stringify({ salt: toBase64(salt), iv: '', cipher: '' }));
        } else {
          const salt = fromBase64(cipher.salt);
          vaultKey = await deriveVaultKey(passphrase, salt);
          if (cipher.cipher) unlockedVault = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(cipher.iv) }, vaultKey, fromBase64(cipher.cipher))));
          else unlockedVault = [];
        }
        $('vaultLocked').textContent = `${unlockedVault.length} encrypted record(s) unlocked in memory for this tab.`;
        drawVaultRecords(); setStatus('Vault unlocked. The encryption key exists only in this browser tab.');
      } catch { vaultKey = null; unlockedVault = null; setStatus('Could not unlock this vault. Check the passphrase; it cannot be recovered.', true); }
    });
    $('lifeSave').textContent = 'Encrypt and save vault record';
    $('lifeSave').addEventListener('click', saveVaultRecord);
    $('lifeExport').addEventListener('click', () => {
      const backup = loadVaultCipher();
      if (!backup) { setStatus('Create the encrypted vault before exporting a backup.', true); return; }
      download('personal-records-vault.encrypted.json', JSON.stringify(backup), 'application/json');
      setStatus('Encrypted vault backup downloaded. Keep the passphrase separately.');
    });
    $('vaultLock').addEventListener('click', () => { vaultKey = null; unlockedVault = null; $('vaultLocked').textContent = 'Vault locked. The encryption key was cleared from memory.'; $('lifeRecords').innerHTML = ''; setStatus('Vault locked.'); });
  }
  async function saveVaultRecord() {
    if (!vaultKey || !Array.isArray(unlockedVault)) { setStatus('Unlock the vault first.', true); return; }
    const data = currentFormValues('vault');
    if (!data.vaultName) { setStatus('Enter a record name.', true); return; }
    const file = $('vaultFile').files?.[0];
    if (file && file.size > 2 * 1024 * 1024) { setStatus('Encrypted vault attachment limit is 2 MB.', true); return; }
    let attachment;
    if (file) attachment = { name: file.name, type: file.type, bytes: toBase64(await file.arrayBuffer()) };
    unlockedVault.unshift({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...data, attachment });
    const previous = loadVaultCipher();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await encryptVault(unlockedVault, vaultKey, iv);
    localStorage.setItem(VAULT_KEY, JSON.stringify({ salt: previous.salt, iv: toBase64(iv), cipher }));
    $('vaultLocked').textContent = `${unlockedVault.length} encrypted record(s) stored locally.`;
    drawVaultRecords(); setStatus('Record encrypted with AES-GCM and saved locally.');
  }
  function drawVaultRecords() {
    $('lifeRecords').innerHTML = `<div class="life-record-list">${(unlockedVault || []).map((record) => `<article class="life-record"><div><strong>${escaped(record.vaultName)}</strong><small>${escaped(record.vaultCategory)} · ${escaped(record.vaultDate || 'No expiry')} · ${escaped(record.vaultTags)}</small></div><button type="button" class="life-delete" data-vault-delete="${escaped(record.id)}" aria-label="Delete ${escaped(record.vaultName)}"><i class="bi bi-trash"></i></button>${record.attachment ? `<button type="button" class="life-inline" data-vault-download="${escaped(record.id)}">Download attachment</button>` : ''}</article>`).join('') || '<p class="hub-muted">Vault is empty.</p>'}</div>`;
    $('lifeRecords').querySelectorAll('[data-vault-delete]').forEach((button) => button.addEventListener('click', async () => { unlockedVault = unlockedVault.filter((record) => record.id !== button.dataset.vaultDelete); const previous = loadVaultCipher(), iv = crypto.getRandomValues(new Uint8Array(12)); localStorage.setItem(VAULT_KEY, JSON.stringify({ salt: previous.salt, iv: toBase64(iv), cipher: await encryptVault(unlockedVault, vaultKey, iv) })); drawVaultRecords(); }));
    $('lifeRecords').querySelectorAll('[data-vault-download]').forEach((button) => button.addEventListener('click', () => { const record = unlockedVault.find((item) => item.id === button.dataset.vaultDownload); if (record?.attachment) download(record.attachment.name, new Blob([fromBase64(record.attachment.bytes)], { type: record.attachment.type }), record.attachment.type); }));
  }

  function download(filename, content, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function attachLifeActions() {
    document.querySelectorAll('.life-filter').forEach((button) => button.addEventListener('click', () => {
      document.querySelectorAll('.life-filter').forEach((item) => item.classList.toggle('active', item === button)); filterCatalog();
    }));
    $('lifeToolSearch').addEventListener('input', filterCatalog);
    document.querySelectorAll('.life-tool-grid .hub-card').forEach((card) => card.addEventListener('click', () => { location.href = `/life-admin?tool=${encodeURIComponent(card.dataset.tool)}`; }));
    $('lifeWorkspaceClose').addEventListener('click', () => { location.href = '/life-admin'; });
    const selected = new URLSearchParams(location.search).get('tool');
    if (selected && definitions[selected]) { page.classList.add('is-focused'); document.querySelector('.life-admin-catalog').hidden = true; renderWorkspace(selected); }
  }
  function filterCatalog() {
    const query = $('lifeToolSearch').value.toLowerCase().trim();
    const filter = document.querySelector('.life-filter.active').dataset.filter;
    let visible = 0;
    document.querySelectorAll('.life-tool-grid .hub-card').forEach((card) => { const show = (filter === 'all' || card.dataset.category === filter) && card.textContent.toLowerCase().includes(query); card.hidden = !show; if (show) visible += 1; });
    $('lifeToolEmpty').hidden = visible > 0;
  }
  attachLifeActions();
})();
