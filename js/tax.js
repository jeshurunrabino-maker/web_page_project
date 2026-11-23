const TAX_BRACKETS = [
  { limit: 250000, base: 0, floor: 0, rate: 0, label: '0% (Not over ₱250,000)' },
  { limit: 400000, base: 0, floor: 250000, rate: 0.20, label: '20% of the excess over ₱250,000' },
  { limit: 800000, base: 30000, floor: 400000, rate: 0.25, label: '₱30,000 + 25% of the excess over ₱400,000' },
  { limit: 2000000, base: 130000, floor: 800000, rate: 0.30, label: '₱130,000 + 30% of the excess over ₱800,000' },
  { limit: 8000000, base: 490000, floor: 2000000, rate: 0.32, label: '₱490,000 + 32% of the excess over ₱2,000,000' },
  { limit: Infinity, base: 2410000, floor: 8000000, rate: 0.35, label: '₱2,410,000 + 35% of the excess over ₱8,000,000' },
];

const computeIncomeTax = (annualIncome) => {
  const bracket = TAX_BRACKETS.find((candidate) => annualIncome <= candidate.limit);
  const taxableExcess = Math.max(0, annualIncome - bracket.floor);
  const excessTax = taxableExcess * bracket.rate;

  return {
    basicTax: bracket.base,
    excessTax,
    totalTax: bracket.base + excessTax,
    label: bracket.label,
  };
};

const initTax = () => {
  const periodSelect = getById('tax-period');
  const incomeInput = getById('tax-income');
  const bracketDisplay = getById('tax-bracket');
  const breakdownDisplay = getById('tax-breakdown');
  const payableDisplay = getById('tax-payable');
  const netIncomeDisplay = getById('tax-net');
  const errorDisplay = getById('tax-error');
  const tableToggleButton = getById('tax-table-toggle');
  const referencePanel = getById('tax-ref-panel');
  const referenceTableBody = getById('tax-ref-tbody');

  const resetOutputs = () => {
    bracketDisplay.textContent = '-';
    breakdownDisplay.textContent = 'Basic ₱0.00 + Excess ₱0.00';
    payableDisplay.textContent = formatPhpCurrency(0);
    netIncomeDisplay.textContent = formatPhpCurrency(0);
  };

  const calculateTax = (shouldLog = true) => {
    const rawIncome = incomeInput.value.trim();
    const numericIncome = Number(rawIncome);

    if (rawIncome === '' || !Number.isFinite(numericIncome) || numericIncome < 0) {
      setFieldError(errorDisplay, 'Please enter a valid income of 0 or more.');
      resetOutputs();
      return;
    }

    clearFieldError(errorDisplay);
    const annualIncome = periodSelect.value === 'monthly' ? numericIncome * 12 : numericIncome;
    const { basicTax, excessTax, totalTax, label } = computeIncomeTax(annualIncome);

    bracketDisplay.textContent = label;
    breakdownDisplay.textContent = `Basic ${formatPhpCurrency(basicTax)} + Excess ${formatPhpCurrency(excessTax)}`;
    payableDisplay.textContent = formatPhpCurrency(totalTax);
    netIncomeDisplay.textContent = formatPhpCurrency(annualIncome - totalTax);

    if (shouldLog) {
      const selectedPeriod = periodSelect.value;
      logScratchpadEntry('Income Tax', `Income ${formatPhpCurrency(annualIncome)} → Tax ${formatPhpCurrency(totalTax)}`, () => {
        periodSelect.value = selectedPeriod;
        incomeInput.value = rawIncome;
        calculateTax(false);
      });
    }
  };

  getById('tax-form').addEventListener('submit', (event) => {
    event.preventDefault();
    calculateTax();
  });

  if (tableToggleButton && referencePanel) {
    tableToggleButton.addEventListener('click', () => {
      const willHide = !referencePanel.hidden;
      referencePanel.hidden = willHide;
      tableToggleButton.setAttribute('aria-expanded', String(!willHide));
      tableToggleButton.textContent = willHide ? 'Show Tax Table' : 'Hide Tax Table';
    });
  }

  if (referenceTableBody) {
    const applySampleBracketRow = (tableRow) => {
      const sampleIncome = tableRow.dataset.sample;
      if (!sampleIncome) return;
      periodSelect.value = 'annual';
      incomeInput.value = sampleIncome;
      calculateTax();
    };

    referenceTableBody.addEventListener('click', (event) => {
      const tableRow = event.target.closest('tr[data-sample]');
      if (tableRow) applySampleBracketRow(tableRow);
    });

    referenceTableBody.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const tableRow = event.target.closest('tr[data-sample]');
      if (tableRow) {
        event.preventDefault();
        applySampleBracketRow(tableRow);
      }
    });
  }
};