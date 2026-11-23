const SAMPLE_EMPLOYEES = [
  { name: 'Maria Santos', days: 22, rate: 700, deduction: 1500 },
  { name: 'Juan Dela Cruz', days: 15, rate: 650, deduction: 0 },
  { name: 'Ana Reyes', days: 26, rate: 820, deduction: 2150 },
];

const renderPayrollRow = (employee, index) => `
  <tr>
    <td>${index + 1}</td>
    <td>${escapeHtml(employee.name)}</td>
    <td>${employee.days}</td>
    <td>${formatPhpCurrency(employee.rate)}</td>
    <td>${formatPhpCurrency(employee.grossPay)}</td>
    <td>${formatPhpCurrency(employee.deduction)}</td>
    <td>${formatPhpCurrency(employee.netPay)}</td>
    <td><button type="button" class="btn-danger delete-row-btn" data-id="${employee.id}">Delete</button></td>
  </tr>
`;

const validatePayrollInputs = ({ name, days, rate, deduction, grossPay }) => {
  if (!name) return 'Employee name is required.';
  if (!Number.isFinite(days) || days <= 0) return 'Days worked must be greater than 0.';
  if (!Number.isFinite(rate) || rate <= 0) return 'Daily rate must be greater than 0.';
  if (!Number.isFinite(deduction) || deduction < 0) return 'Deduction cannot be negative.';
  if (deduction > grossPay) return 'Deduction cannot exceed gross pay.';
  return '';
};

const initPayroll = () => {
  const payrollForm = getById('pay-form');
  const nameInput = getById('pay-name');
  const daysInput = getById('pay-days');
  const rateInput = getById('pay-rate');
  const deductionInput = getById('pay-deduct');
  const tableBody = getById('pay-tbody');
  const errorDisplay = getById('pay-error');

  let payrollRecords = [];
  let nextEmployeeId = 1;

  const sumField = (fieldName) =>
    payrollRecords.reduce((total, employee) => total + employee[fieldName], 0);

  const renderPayrollTable = () => {
    tableBody.innerHTML = payrollRecords.length > 0
      ? payrollRecords.map(renderPayrollRow).join('')
      : '<tr><td colspan="8">No employee records added yet.</td></tr>';

    getById('pay-total-gross').textContent = formatPhpCurrency(sumField('grossPay'));
    getById('pay-total-deduct').textContent = formatPhpCurrency(sumField('deduction'));
    getById('pay-total-net').textContent = formatPhpCurrency(sumField('netPay'));
  };

  const addEmployeeRecord = ({ name, days, rate, deduction }) => {
    const grossPay = days * rate;
    payrollRecords.push({
      id: nextEmployeeId++,
      name,
      days,
      rate,
      grossPay,
      deduction,
      netPay: grossPay - deduction,
    });
  };

  getById('pay-sample-btn').addEventListener('click', () => {
    SAMPLE_EMPLOYEES.forEach(addEmployeeRecord);
    clearFieldError(errorDisplay);
    renderPayrollTable();
    logScratchpadEntry('Payroll', 'Loaded 3 sample employees');
  });

  payrollForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const days = Number(daysInput.value);
    const rate = Number(rateInput.value);
    const deduction = Number(deductionInput.value);
    const grossPay = days * rate;

    const validationError = validatePayrollInputs({ name, days, rate, deduction, grossPay });
    if (validationError) {
      setFieldError(errorDisplay, validationError);
      return;
    }

    clearFieldError(errorDisplay);
    const netPay = grossPay - deduction;
    addEmployeeRecord({ name, days, rate, deduction });

    logScratchpadEntry('Payroll', `${name}: Net ${formatPhpCurrency(netPay)}`, () => {
      nameInput.value = name;
      daysInput.value = String(days);
      rateInput.value = String(rate);
      deductionInput.value = String(deduction);
    });

    payrollForm.reset();
    deductionInput.value = '0';
    renderPayrollTable();
  });

  tableBody.addEventListener('click', (event) => {
    const deleteButton = event.target.closest('.delete-row-btn[data-id]');
    if (!deleteButton) return;
    const targetId = Number(deleteButton.dataset.id);
    payrollRecords = payrollRecords.filter((employee) => employee.id !== targetId);
    renderPayrollTable();
  });

  getById('pay-clear-btn').addEventListener('click', () => {
    if (payrollRecords.length === 0) return;
    if (window.confirm('Clear all employee records?')) {
      payrollRecords = [];
      clearFieldError(errorDisplay);
      renderPayrollTable();
    }
  });

  renderPayrollTable();
};