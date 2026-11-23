const SCIENTIFIC_NOTATION_THRESHOLD = 1e12;

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const MODULE_TAB_IDS = {
  Conversion: 'sec-conversion',
  'Income Tax': 'sec-tax',
  Looping: 'sec-looping',
  Payroll: 'sec-payroll',
};

const MAX_SCRATCHPAD_ENTRIES = 6;

const QUICK_CONSTANTS = {
  'sec-conversion': {
    title: 'Conversion factors',
    items: [
      ['1 in', '2.54 cm'],
      ['1 mi', '1.609344 km'],
      ['1 lb', '0.45359237 kg'],
      ['1 US gal', '3.785411784 L'],
      ['1 kB / 1 KiB', '1,000 / 1,024 B'],
      ['°F', '°C × 1.8 + 32'],
    ],
  },
  'sec-tax': {
    title: 'Tax notes',
    items: [
      ['Exempt up to', '₱250,000/yr'],
      ['Next bracket', '20% over ₱250,000'],
      ['Top bracket', '35% over ₱8,000,000'],
      ['Monthly input', '× 12 = annual'],
    ],
  },
  'sec-looping': {
    title: 'Loop notes',
    items: [
      ['0!', '1'],
      ['Max safe n', '170 (171! overflows)'],
      ['Sum 0..n', 'n(n + 1) / 2'],
      ['Average 1..n', '(n + 1) / 2'],
    ],
  },
  'sec-payroll': {
    title: 'Payroll notes',
    items: [
      ['Gross pay', 'days × daily rate'],
      ['Net pay', 'gross − deductions'],
      ['Hourly rate', 'daily ÷ 8 hours'],
      ['Deductions', 'cannot exceed gross'],
    ],
  },
};

const getById = (elementId) => document.getElementById(elementId);

const escapeHtml = (text) =>
  text.replace(/[&<>"']/g, (character) => HTML_ESCAPE_MAP[character]);

const formatCompactNumber = (numericValue) => {
  if (Number.isFinite(numericValue) && Math.abs(numericValue) >= SCIENTIFIC_NOTATION_THRESHOLD) {
    return numericValue.toExponential(4);
  }
  return numericValue.toLocaleString();
};

const formatExactInteger = (numericValue) => {
  if (!Number.isFinite(numericValue)) return String(numericValue);
  return numericValue.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

// Sample the first 6 and last 4 frames when step count exceeds 12 to keep animations snappy.
const selectAnimationIndices = (totalSteps) => {
  if (totalSteps <= 12) {
    return Array.from({ length: totalSteps }, (_, index) => index);
  }
  return [
    0, 1, 2, 3, 4, 5,
    totalSteps - 4, totalSteps - 3, totalSteps - 2, totalSteps - 1,
  ];
};

const formatPhpCurrency = (amount) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);

const setFieldError = (errorElement, message) => {
  errorElement.textContent = message;
};

const clearFieldError = (errorElement) => {
  setFieldError(errorElement, '');
};

const renderQuickConstants = (tabId) => {
  const constantsGroup = QUICK_CONSTANTS[tabId];
  const constantsList = getById('qc-list');
  if (!constantsGroup || !constantsList) return;

  getById('qc-title').textContent = constantsGroup.title;
  constantsList.innerHTML = constantsGroup.items
    .map(([label, value]) => `<li><span>${escapeHtml(label)}</span><strong class="qc-val">${escapeHtml(value)}</strong></li>`)
    .join('');
};

const logScratchpadEntry = (moduleName, summaryText, restoreInputs) => {
  const scratchpadList = getById('scratchpad-list');
  if (!scratchpadList) return;

  const emptyPlaceholder = scratchpadList.querySelector('.scratchpad-empty');
  if (emptyPlaceholder) emptyPlaceholder.remove();

  const listItem = document.createElement('li');
  listItem.className = 'scratchpad-item';
  const entryMarkup = `<strong>${escapeHtml(moduleName)}</strong><span>${escapeHtml(summaryText)}</span>`;

  if (restoreInputs) {
    const restoreButton = document.createElement('button');
    restoreButton.type = 'button';
    restoreButton.className = 'scratchpad-btn';
    restoreButton.title = 'Reload these inputs';
    restoreButton.innerHTML = entryMarkup;
    restoreButton.addEventListener('click', () => {
      const targetTabId = MODULE_TAB_IDS[moduleName] || 'sec-conversion';
      activateWorkspaceTab(targetTabId, false);
      restoreInputs();
    });
    listItem.append(restoreButton);
  } else {
    listItem.classList.add('is-plain');
    listItem.innerHTML = entryMarkup;
  }

  scratchpadList.prepend(listItem);
  while (scratchpadList.children.length > MAX_SCRATCHPAD_ENTRIES) {
    scratchpadList.lastElementChild.remove();
  }
};