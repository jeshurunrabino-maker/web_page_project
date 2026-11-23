const UNIT_CATALOG = {
  temperature: {
    label: 'Temperature',
    defaultFrom: 'c',
    defaultTo: 'f',
    allowNegative: true,
    units: {
      c: { name: 'Celsius', symbol: '°C', toBase: (celsius) => celsius, fromBase: (celsius) => celsius },
      f: {
        name: 'Fahrenheit',
        symbol: '°F',
        toBase: (fahrenheit) => (fahrenheit - 32) / 1.8,
        fromBase: (celsius) => (celsius * 1.8) + 32,
      },
      k: {
        name: 'Kelvin',
        symbol: 'K',
        toBase: (kelvin) => kelvin - 273.15,
        fromBase: (celsius) => celsius + 273.15,
      },
    },
  },
  length: {
    label: 'Length',
    defaultFrom: 'm',
    defaultTo: 'ft',
    units: {
      au: { name: 'Astronomical Unit', symbol: 'AU', factor: 149597870700 },
      cm: { name: 'Centimeter', symbol: 'cm', factor: 0.01 },
      dm: { name: 'Decimeter', symbol: 'dm', factor: 0.1 },
      ft: { name: 'Foot', symbol: 'ft', factor: 0.3048 },
      in: { name: 'Inch', symbol: 'in', factor: 0.0254 },
      km: { name: 'Kilometer', symbol: 'km', factor: 1000 },
      ly: { name: 'Light Year', symbol: 'ly', factor: 9460730472580800 },
      m: { name: 'Meter', symbol: 'm', factor: 1 },
      mi: { name: 'Mile', symbol: 'mi', factor: 1609.344 },
      mm: { name: 'Millimeter', symbol: 'mm', factor: 0.001 },
      yd: { name: 'Yard', symbol: 'yd', factor: 0.9144 },
    },
  },
  weight: {
    label: 'Weight',
    defaultFrom: 'kg',
    defaultTo: 'lb',
    units: {
      dram: { name: 'Dram', symbol: 'dram', factor: 0.0017718451953125 },
      g: { name: 'Gram', symbol: 'g', factor: 0.001 },
      kg: { name: 'Kilogram', symbol: 'kg', factor: 1 },
      lt: { name: 'Long Ton', symbol: 'lt', factor: 1016.0469088 },
      t: { name: 'Metric Ton', symbol: 't', factor: 1000 },
      mg: { name: 'Milligram', symbol: 'mg', factor: 0.000001 },
      oz: { name: 'Ounce', symbol: 'oz', factor: 0.028349523125 },
      lb: { name: 'Pound', symbol: 'lb', factor: 0.45359237 },
      ton: { name: 'Short Ton', symbol: 'ton', factor: 907.18474 },
      slug: { name: 'Slug', symbol: 'slug', factor: 14.593902937 },
    },
  },
  volume: {
    label: 'Volume',
    defaultFrom: 'l',
    defaultTo: 'gal',
    units: {
      cl: { name: 'Centiliter', symbol: 'cL', factor: 0.01 },
      cm3: { name: 'Cubic Centimeter', symbol: 'cm³', factor: 0.001 },
      ft3: { name: 'Cubic Foot', symbol: 'ft³', factor: 28.316846592 },
      m3: { name: 'Cubic Meter', symbol: 'm³', factor: 1000 },
      cup: { name: 'Cup (US)', symbol: 'cup', factor: 0.2365882365 },
      fldr: { name: 'Fluid Dram (US)', symbol: 'fl dr', factor: 0.0036966911953125 },
      floz: { name: 'Fluid Ounce (US)', symbol: 'fl oz', factor: 0.0295735295625 },
      gal: { name: 'Gallon (US)', symbol: 'gal', factor: 3.785411784 },
      l: { name: 'Liter', symbol: 'L', factor: 1 },
      ml: { name: 'Milliliter', symbol: 'mL', factor: 0.001 },
    },
  },
  area: {
    label: 'Area',
    defaultFrom: 'm2',
    defaultTo: 'ft2',
    units: {
      daa: { name: 'Decare', symbol: 'daa', factor: 1000 },
      ha: { name: 'Hectare', symbol: 'ha', factor: 10000 },
      cm2: { name: 'Square Centimeter', symbol: 'cm²', factor: 0.0001 },
      ft2: { name: 'Square Foot', symbol: 'ft²', factor: 0.09290304 },
      in2: { name: 'Square Inch', symbol: 'in²', factor: 0.00064516 },
      km2: { name: 'Square Kilometer', symbol: 'km²', factor: 1000000 },
      m2: { name: 'Square Meter', symbol: 'm²', factor: 1 },
      mi2: { name: 'Square Mile', symbol: 'mi²', factor: 2589988.110336 },
      mm2: { name: 'Square Millimeter', symbol: 'mm²', factor: 0.000001 },
      yd2: { name: 'Square Yard', symbol: 'yd²', factor: 0.83612736 },
      str: { name: 'Stremma', symbol: 'str', factor: 1000 },
    },
  },
  speed: {
    label: 'Speed',
    defaultFrom: 'kmh',
    defaultTo: 'mph',
    units: {
      cms: { name: 'Centimeter per Second', symbol: 'cm/s', factor: 0.01 },
      fts: { name: 'Foot per Second', symbol: 'ft/s', factor: 0.3048 },
      kmh: { name: 'Kilometer per Hour', symbol: 'km/h', factor: 1 / 3.6 },
      kn: { name: 'Knot', symbol: 'kn', factor: 1852 / 3600 },
      mach: { name: 'Mach (Std. Atm.)', symbol: 'M', factor: 340.29 },
      ms: { name: 'Meter per Second', symbol: 'm/s', factor: 1 },
      mph: { name: 'Mile per Hour', symbol: 'mph', factor: 0.44704 },
    },
  },
  time: {
    label: 'Time',
    defaultFrom: 'hr',
    defaultTo: 'min',
    units: {
      day: { name: 'Day', symbol: 'day', factor: 86400 },
      hr: { name: 'Hour', symbol: 'hr', factor: 3600 },
      usec: { name: 'Microsecond', symbol: 'µsec', factor: 0.000001 },
      msec: { name: 'Millisecond', symbol: 'msec', factor: 0.001 },
      min: { name: 'Minute', symbol: 'min', factor: 60 },
      nsec: { name: 'Nanosecond', symbol: 'nsec', factor: 1e-9 },
      sec: { name: 'Second', symbol: 'sec', factor: 1 },
      wk: { name: 'Week', symbol: 'wk', factor: 604800 },
      yr: { name: 'Year (365 days)', symbol: 'yr', factor: 31536000 },
    },
  },
  data: {
    label: 'Data',
    defaultFrom: 'gb',
    defaultTo: 'gib',
    units: {
      bit: { name: 'Bit', symbol: 'bit', factor: 0.125 },
      byte: { name: 'Byte', symbol: 'byte', factor: 1 },
      gib: { name: 'Gibibyte', symbol: 'GiB', factor: 1024 ** 3 },
      gb: { name: 'Gigabyte', symbol: 'GB', factor: 1000 ** 3 },
      kib: { name: 'Kibibyte', symbol: 'KiB', factor: 1024 },
      kb: { name: 'Kilobyte', symbol: 'kB', factor: 1000 },
      mib: { name: 'Mebibyte', symbol: 'MiB', factor: 1024 ** 2 },
      mb: { name: 'Megabyte', symbol: 'MB', factor: 1000 ** 2 },
      pib: { name: 'Pebibyte', symbol: 'PiB', factor: 1024 ** 5 },
      tb: { name: 'Terabyte', symbol: 'TB', factor: 1000 ** 4 },
      tib: { name: 'Tebibyte', symbol: 'TiB', factor: 1024 ** 4 },
      pb: { name: 'Petabyte', symbol: 'PB', factor: 1000 ** 5 },
    },
  },
  energy: {
    label: 'Energy',
    defaultFrom: 'kcal',
    defaultTo: 'kj',
    units: {
      btu: { name: 'British Thermal Unit', symbol: 'BTU', factor: 1055.05585262 },
      cal: { name: 'Calorie', symbol: 'cal', factor: 4.184 },
      erg: { name: 'Erg', symbol: 'erg', factor: 1e-7 },
      ftlb: { name: 'Foot Pound', symbol: 'ft lb', factor: 1.3558179483314 },
      j: { name: 'Joule', symbol: 'J', factor: 1 },
      kcal: { name: 'Kilocalorie', symbol: 'kcal', factor: 4184 },
      kj: { name: 'Kilojoule', symbol: 'kJ', factor: 1000 },
      kwh: { name: 'Kilowatt Hour', symbol: 'kWh', factor: 3600000 },
      nm: { name: 'Newton Meter', symbol: 'N·m', factor: 1 },
    },
  },
  power: {
    label: 'Power',
    defaultFrom: 'kw',
    defaultTo: 'hp',
    units: {
      btumin: { name: 'BTU per Minute', symbol: 'BTU/min', factor: 17.58426421033333 },
      hp: { name: 'Horsepower', symbol: 'HP', factor: 745.6998715822702 },
      kw: { name: 'Kilowatt', symbol: 'kW', factor: 1000 },
      w: { name: 'Watt', symbol: 'W', factor: 1 },
    },
  },
  pressure: {
    label: 'Pressure',
    defaultFrom: 'kpa',
    defaultTo: 'psi',
    units: {
      atm: { name: 'Atmosphere', symbol: 'atm', factor: 101325 },
      bar: { name: 'Bar', symbol: 'bar', factor: 100000 },
      inhg: { name: 'Inch of Mercury', symbol: 'inHg', factor: 3386.389 },
      kpa: { name: 'Kilopascal', symbol: 'kPa', factor: 1000 },
      pa: { name: 'Pascal', symbol: 'Pa', factor: 1 },
      psi: { name: 'Pound per Square Inch', symbol: 'PSI', factor: 6894.757293168 },
      torr: { name: 'Torr', symbol: 'Torr', factor: 101325 / 760 },
    },
  },
  force: {
    label: 'Force',
    defaultFrom: 'n',
    defaultTo: 'lbf',
    units: {
      dyn: { name: 'Dyne', symbol: 'dyn', factor: 0.00001 },
      kgf: { name: 'Kilogram-Force', symbol: 'kgf', factor: 9.80665 },
      n: { name: 'Newton', symbol: 'N', factor: 1 },
      lbf: { name: 'Pound-Force', symbol: 'lbf', factor: 4.4482216152605 },
      pdl: { name: 'Poundal', symbol: 'pdl', factor: 0.138254954376 },
    },
  },
  angle: {
    label: 'Angle',
    defaultFrom: 'deg',
    defaultTo: 'rad',
    units: {
      amin: { name: 'Arcminute', symbol: 'amin', factor: Math.PI / 10800 },
      asec: { name: 'Arcsecond', symbol: 'asec', factor: Math.PI / 648000 },
      deg: { name: 'Degree', symbol: 'deg', factor: Math.PI / 180 },
      uasec: { name: 'Microarcsecond', symbol: 'µasec', factor: Math.PI / 648000000000 },
      urad: { name: 'Microradian', symbol: 'µrad', factor: 0.000001 },
      masec: { name: 'Milliarcsecond', symbol: 'masec', factor: Math.PI / 648000000 },
      mrad: { name: 'Milliradian', symbol: 'mrad', factor: 0.001 },
      rad: { name: 'Radian', symbol: 'rad', factor: 1 },
    },
  },
  fuel: {
    label: 'Fuel',
    defaultFrom: 'kml',
    defaultTo: 'mpg',
    units: {
      gal100mi: {
        name: 'Gallon per 100 Miles',
        symbol: 'gal/100mi',
        toBase: (galPer100Mi) => (galPer100Mi === 0 ? 0 : (100 / galPer100Mi) * 0.425143707),
        fromBase: (kmPerLiter) => (kmPerLiter === 0 ? 0 : 100 / (kmPerLiter / 0.425143707)),
      },
      kml: {
        name: 'Kilometer per Liter',
        symbol: 'km/L',
        toBase: (kmPerLiter) => kmPerLiter,
        fromBase: (kmPerLiter) => kmPerLiter,
      },
      l100km: {
        name: 'Liter per 100 Kilometers',
        symbol: 'L/100km',
        toBase: (litersPer100Km) => (litersPer100Km === 0 ? 0 : 100 / litersPer100Km),
        fromBase: (kmPerLiter) => (kmPerLiter === 0 ? 0 : 100 / kmPerLiter),
      },
      mpg: {
        name: 'Mile per Gallon (US)',
        symbol: 'mi/gal',
        toBase: (milesPerGal) => milesPerGal * 0.425143707,
        fromBase: (kmPerLiter) => kmPerLiter / 0.425143707,
      },
    },
  },
  currency: {
    label: 'Currency',
    defaultFrom: 'usd',
    defaultTo: 'php',
    note: 'Offline reference rates (base: 1 USD)',
    units: {
      all: { name: 'Albanian Lek', symbol: 'ALL', factor: 1 / 92.5 },
      dzd: { name: 'Algerian Dinar', symbol: 'DZD', factor: 1 / 134.5 },
      ars: { name: 'Argentine Peso', symbol: 'ARS', factor: 1 / 995.0 },
      amd: { name: 'Armenian Dram', symbol: 'AMD', factor: 1 / 387.0 },
      aud: { name: 'Australian Dollar', symbol: 'AUD', factor: 1 / 1.53 },
      azn: { name: 'Azerbaijani Manat', symbol: 'AZN', factor: 1 / 1.70 },
      bsd: { name: 'Bahamian Dollar', symbol: 'BSD', factor: 1 },
      bhd: { name: 'Bahraini Dinar', symbol: 'BHD', factor: 1 / 0.376 },
      cad: { name: 'Canadian Dollar', symbol: 'CAD', factor: 1 / 1.39 },
      cny: { name: 'Chinese Yuan', symbol: 'CNY', factor: 1 / 7.24 },
      eur: { name: 'Euro', symbol: 'EUR', factor: 1 / 0.94 },
      jpy: { name: 'Japanese Yen', symbol: 'JPY', factor: 1 / 154.0 },
      php: { name: 'Philippine Peso', symbol: 'PHP', factor: 1 / 58.5 },
      sgd: { name: 'Singapore Dollar', symbol: 'SGD', factor: 1 / 1.34 },
      krw: { name: 'South Korean Won', symbol: 'KRW', factor: 1 / 1395.0 },
      gbp: { name: 'British Pound', symbol: 'GBP', factor: 1 / 0.79 },
      usd: { name: 'US Dollar', symbol: 'USD', factor: 1 },
    },
  },
};

const CURRENCY_API_URL = 'https://open.er-api.com/v6/latest/USD';
const CURRENCY_CACHE_KEY = 'utility_suite_fx_usd_v1';
const CURRENCY_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

const applyCurrencyRates = (ratesBySymbol, statusLabel) => {
  const currencyUnits = UNIT_CATALOG.currency.units;
  Object.values(currencyUnits).forEach((unit) => {
    const usdToUnitRate = ratesBySymbol[unit.symbol];
    if (typeof usdToUnitRate === 'number' && usdToUnitRate > 0) {
      unit.factor = 1 / usdToUnitRate;
    }
  });
  UNIT_CATALOG.currency.note = statusLabel;
};

const hydrateCachedCurrencyRates = () => {
  try {
    const rawCache = localStorage.getItem(CURRENCY_CACHE_KEY);
    if (!rawCache) return null;

    const cachedPayload = JSON.parse(rawCache);
    if (cachedPayload && cachedPayload.rates) {
      applyCurrencyRates(cachedPayload.rates, `Saved market rates (${cachedPayload.date}) • Offline ready`);
      return cachedPayload;
    }
  } catch {
    // Ignore storage access errors in restricted browsing modes
  }
  return null;
};

const syncLiveCurrencyRates = async (onRatesUpdated) => {
  const cachedPayload = hydrateCachedCurrencyRates();
  onRatesUpdated();

  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const isCacheFresh = cachedPayload && (Date.now() - cachedPayload.timestamp < CURRENCY_REFRESH_INTERVAL_MS);
  if (isOffline || isCacheFresh) return;

  try {
    const response = await fetch(CURRENCY_API_URL);
    if (!response.ok) return;

    const exchangePayload = await response.json();
    if (exchangePayload.result !== 'success' || !exchangePayload.rates) return;

    const updatedDate = exchangePayload.time_last_update_utc
      ? exchangePayload.time_last_update_utc.slice(5, 16)
      : 'Latest';

    applyCurrencyRates(exchangePayload.rates, `Live market rates (${updatedDate})`);
    onRatesUpdated();

    try {
      const serializedCache = JSON.stringify({
        timestamp: Date.now(),
        date: updatedDate,
        rates: exchangePayload.rates,
      });
      localStorage.setItem(CURRENCY_CACHE_KEY, serializedCache);
    } catch {
      // Ignore storage quota errors
    }
  } catch {
    // Offline fallback rates remain active
  }
};

const formatConvertedNumber = (numericValue) => {
  if (numericValue === 0 || Math.abs(numericValue) >= 0.01) {
    return numericValue.toFixed(2);
  }
  return numericValue.toPrecision(4);
};

const convertUnitValue = (categoryKey, fromUnitKey, toUnitKey, inputValue) => {
  const category = UNIT_CATALOG[categoryKey];
  const fromUnit = category.units[fromUnitKey];
  const toUnit = category.units[toUnitKey];

  if (fromUnit.toBase && toUnit.fromBase) {
    const baseValue = fromUnit.toBase(inputValue);
    return toUnit.fromBase(baseValue);
  }

  const baseValue = inputValue * fromUnit.factor;
  return baseValue / toUnit.factor;
};

const TEMPERATURE_FORMULAS = {
  'c->f': 'Formula: (°C × 1.8) + 32',
  'f->c': 'Formula: (°F − 32) ÷ 1.8',
  'c->k': 'Formula: °C + 273.15',
  'k->c': 'Formula: K − 273.15',
  'f->k': 'Formula: ((°F − 32) ÷ 1.8) + 273.15',
  'k->f': 'Formula: ((K − 273.15) × 1.8) + 32',
};

const describeConversion = (categoryKey, fromUnitKey, toUnitKey) => {
  const category = UNIT_CATALOG[categoryKey];
  const fromUnit = category.units[fromUnitKey];
  const toUnit = category.units[toUnitKey];

  if (categoryKey === 'temperature') {
    const formulaKey = `${fromUnitKey}->${toUnitKey}`;
    return TEMPERATURE_FORMULAS[formulaKey] || `Identity: 1 ${fromUnit.symbol} = 1 ${toUnit.symbol}`;
  }

  if (categoryKey === 'fuel' && fromUnitKey !== toUnitKey) {
    const sampleConversion = convertUnitValue(categoryKey, fromUnitKey, toUnitKey, 10);
    const usesInverseScale = fromUnitKey.includes('100') || toUnitKey.includes('100');
    const scaleLabel = usesInverseScale ? 'Inverse fuel economy scale' : 'Direct ratio';
    return `${scaleLabel} • Reference: 10 ${fromUnit.symbol} = ${formatConvertedNumber(sampleConversion)} ${toUnit.symbol}`;
  }

  const unitRatio = convertUnitValue(categoryKey, fromUnitKey, toUnitKey, 1);
  const noteSuffix = category.note ? ` • ${category.note}` : '';
  return `Ratio: 1 ${fromUnit.symbol} = ${formatConvertedNumber(unitRatio)} ${toUnit.symbol}${noteSuffix}`;
};

const initHeroPreview = () => {
  const previewTabs = document.querySelectorAll('.preview-tab[data-preview-tab]');
  const fxPane = getById('hero-pane-fx');
  const loopPane = getById('hero-pane-loop');

  previewTabs.forEach((tabButton) => {
    tabButton.addEventListener('click', () => {
      const targetTab = tabButton.dataset.previewTab;
      previewTabs.forEach((candidateTab) => {
        const isSelected = candidateTab === tabButton;
        candidateTab.classList.toggle('active', isSelected);
        candidateTab.setAttribute('aria-selected', String(isSelected));
      });
      fxPane.hidden = targetTab !== 'fx';
      loopPane.hidden = targetTab !== 'loop';
      fxPane.setAttribute('aria-hidden', String(targetTab !== 'fx'));
      loopPane.setAttribute('aria-hidden', String(targetTab !== 'loop'));
    });
  });

  const fxAmountInput = getById('hero-fx-amount');
  const fxOutputText = getById('hero-fx-output');
  const fxRateNote = getById('hero-fx-rate-note');

  const updateHeroFx = () => {
    const parsedAmount = Number(fxAmountInput.value);
    const usdAmount = Number.isFinite(parsedAmount) && parsedAmount >= 0 ? parsedAmount : 0;
    const phpAmount = convertUnitValue('currency', 'usd', 'php', usdAmount);
    const usdToPhpRate = convertUnitValue('currency', 'usd', 'php', 1);

    fxOutputText.textContent = formatPhpCurrency(phpAmount);
    fxRateNote.textContent = `1 USD = ${usdToPhpRate.toFixed(2)} PHP • ${UNIT_CATALOG.currency.note}`;
  };

  fxAmountInput.addEventListener('input', updateHeroFx);

  const heroLoopInput = getById('hero-loop-n');
  const heroLoopRunButton = getById('hero-loop-run');

  const updateHeroLoop = () => {
    let n = Math.floor(Number(heroLoopInput.value));
    if (!Number.isFinite(n) || n < 0) n = 0;
    if (n > 15) n = 15;
    heroLoopInput.value = String(n);

    const { fact, sum, avg } = computeLoopTraces(n);
    const heroFactEl = getById('hero-loop-fact');
    heroFactEl.textContent = formatCompactNumber(fact.value);
    heroFactEl.title = formatExactInteger(fact.value);
    getById('hero-loop-sum').textContent = formatCompactNumber(sum.value);
    getById('hero-loop-avg').textContent = avg.value.toFixed(2);
  };

  heroLoopRunButton.addEventListener('click', updateHeroLoop);
  updateHeroFx();
  updateHeroLoop();

  return updateHeroFx;
};

const findMatchingUnits = (activeCategoryKey, rawQuery) => {
  const normalizedQuery = rawQuery.trim().toLowerCase();
  if (!normalizedQuery) {
    const activeCategory = UNIT_CATALOG[activeCategoryKey];
    return Object.entries(activeCategory.units).map(([unitKey, unit]) => ({
      categoryKey: activeCategoryKey,
      categoryLabel: activeCategory.label,
      unitKey,
      unit,
    }));
  }

  const matches = [];
  Object.entries(UNIT_CATALOG).forEach(([categoryKey, category]) => {
    Object.entries(category.units).forEach(([unitKey, unit]) => {
      const searchableText = `${unit.name} ${unit.symbol} ${category.label}`.toLowerCase();
      if (searchableText.includes(normalizedQuery)) {
        matches.push({ categoryKey, categoryLabel: category.label, unitKey, unit });
      }
    });
  });
  return matches;
};

const initConverter = (onCurrencySync) => {
  const categoryContainer = getById('conv-categories');
  const valueInput = getById('conv-input');
  const searchInput = getById('conv-search');
  const clearSearchButton = getById('conv-search-clear');
  const fromUnitSelect = getById('conv-from');
  const toUnitSelect = getById('conv-to');
  const swapUnitsButton = getById('conv-swap-btn');
  const resultDisplay = getById('conv-result');
  const formulaDisplay = getById('conv-formula');
  const errorDisplay = getById('conv-error');
  const listHeading = getById('conv-list-label');
  const listCountBadge = getById('conv-list-count');
  const unitListContainer = getById('conv-unit-list');

  let activeCategoryKey = 'temperature';
  let scratchpadDebounceId = null;

  const renderCategoryPills = () => {
    categoryContainer.innerHTML = Object.entries(UNIT_CATALOG)
      .map(([categoryKey, category]) => {
        const isActive = categoryKey === activeCategoryKey;
        return `
          <button
            type="button"
            class="cat-pill ${isActive ? 'active' : ''}"
            aria-pressed="${isActive}"
            data-cat="${categoryKey}"
          >
            ${escapeHtml(category.label)}
          </button>
        `;
      })
      .join('');
  };

  const populateUnitSelects = () => {
    const activeCategory = UNIT_CATALOG[activeCategoryKey];
    const optionsMarkup = Object.entries(activeCategory.units)
      .map(([unitKey, unit]) => `<option value="${unitKey}">${escapeHtml(unit.name)} (${escapeHtml(unit.symbol)})</option>`)
      .join('');

    fromUnitSelect.innerHTML = optionsMarkup;
    toUnitSelect.innerHTML = optionsMarkup;
    fromUnitSelect.value = activeCategory.defaultFrom;
    toUnitSelect.value = activeCategory.defaultTo;
  };

  const renderUnitBrowser = () => {
    const trimmedQuery = searchInput.value.trim();
    const isSearching = trimmedQuery.length > 0;
    clearSearchButton.hidden = !isSearching;

    const matchingUnits = findMatchingUnits(activeCategoryKey, trimmedQuery);
    listHeading.textContent = isSearching
      ? 'Search Results Across All Categories'
      : `${UNIT_CATALOG[activeCategoryKey].label} Units (Click to set target unit)`;
    listCountBadge.textContent = `${matchingUnits.length} ${matchingUnits.length === 1 ? 'unit' : 'units'}`;

    if (matchingUnits.length === 0) {
      unitListContainer.innerHTML = `<p class="unit-empty">No units match "${escapeHtml(trimmedQuery)}".</p>`;
      return;
    }

    unitListContainer.innerHTML = matchingUnits
      .map(({ categoryKey, categoryLabel, unitKey, unit }) => {
        const isSelected = categoryKey === activeCategoryKey && unitKey === toUnitSelect.value;
        const categoryBadge = isSearching ? `<span class="unit-item-badge">${escapeHtml(categoryLabel)}</span>` : '';
        const checkmark = isSelected ? '<span class="unit-item-check" aria-hidden="true">&#10003;</span>' : '';

        return `
          <button
            type="button"
            class="unit-item ${isSelected ? 'selected' : ''}"
            role="option"
            aria-selected="${isSelected}"
            data-cat="${categoryKey}"
            data-unit="${unitKey}"
          >
            <span class="unit-item-main">
              <span class="unit-item-name">${escapeHtml(unit.name)}</span>
              <span class="unit-item-sub">${escapeHtml(unit.symbol)}</span>
            </span>
            <span>${categoryBadge}${checkmark}</span>
          </button>
        `;
      })
      .join('');
  };

  const updateConversion = (shouldLogToScratchpad = false) => {
    const activeCategory = UNIT_CATALOG[activeCategoryKey];
    const fromUnitKey = fromUnitSelect.value;
    const toUnitKey = toUnitSelect.value;
    const fromUnit = activeCategory.units[fromUnitKey];
    const toUnit = activeCategory.units[toUnitKey];

    formulaDisplay.textContent = describeConversion(activeCategoryKey, fromUnitKey, toUnitKey);

    const rawInput = valueInput.value.trim();
    if (rawInput === '') {
      clearFieldError(errorDisplay);
      resultDisplay.textContent = `0.00 ${toUnit.symbol}`;
      return;
    }

    const numericValue = Number(rawInput);
    if (!Number.isFinite(numericValue)) {
      setFieldError(errorDisplay, 'Please enter a valid number.');
      resultDisplay.textContent = `0.00 ${toUnit.symbol}`;
      return;
    }

    if (numericValue < 0 && !activeCategory.allowNegative) {
      setFieldError(errorDisplay, 'Negative values are only allowed for temperature conversions.');
      resultDisplay.textContent = `0.00 ${toUnit.symbol}`;
      return;
    }

    clearFieldError(errorDisplay);
    const convertedValue = convertUnitValue(activeCategoryKey, fromUnitKey, toUnitKey, numericValue);
    const formattedOutput = `${formatConvertedNumber(convertedValue)} ${toUnit.symbol}`;
    resultDisplay.textContent = formattedOutput;

    if (shouldLogToScratchpad) {
      const loggedCategoryKey = activeCategoryKey;
      window.clearTimeout(scratchpadDebounceId);
      scratchpadDebounceId = window.setTimeout(() => {
        logScratchpadEntry('Conversion', `${numericValue} ${fromUnit.symbol} = ${formattedOutput}`, () => {
          searchInput.value = '';
          switchCategory(loggedCategoryKey);
          fromUnitSelect.value = fromUnitKey;
          toUnitSelect.value = toUnitKey;
          valueInput.value = rawInput;
          renderUnitBrowser();
          updateConversion(false);
        });
      }, 650);
    }
  };

  const switchCategory = (categoryKey, targetUnitKey = null) => {
    activeCategoryKey = categoryKey;
    renderCategoryPills();
    populateUnitSelects();
    if (targetUnitKey && UNIT_CATALOG[categoryKey].units[targetUnitKey]) {
      toUnitSelect.value = targetUnitKey;
    }
    renderUnitBrowser();
    updateConversion(false);
  };

  categoryContainer.addEventListener('click', (event) => {
    const categoryPill = event.target.closest('.cat-pill[data-cat]');
    if (!categoryPill) return;
    searchInput.value = '';
    switchCategory(categoryPill.dataset.cat);
  });

  unitListContainer.addEventListener('click', (event) => {
    const unitButton = event.target.closest('.unit-item[data-unit]');
    if (!unitButton) return;

    const { cat: categoryKey, unit: unitKey } = unitButton.dataset;
    if (categoryKey !== activeCategoryKey) {
      switchCategory(categoryKey, unitKey);
      return;
    }

    toUnitSelect.value = unitKey;
    renderUnitBrowser();
    updateConversion(true);
  });

  searchInput.addEventListener('input', renderUnitBrowser);
  clearSearchButton.addEventListener('click', () => {
    searchInput.value = '';
    renderUnitBrowser();
    searchInput.focus();
  });

  valueInput.addEventListener('input', () => updateConversion(true));
  fromUnitSelect.addEventListener('change', () => updateConversion(true));
  toUnitSelect.addEventListener('change', () => {
    renderUnitBrowser();
    updateConversion(true);
  });

  swapUnitsButton.addEventListener('click', () => {
    const previousFromUnit = fromUnitSelect.value;
    fromUnitSelect.value = toUnitSelect.value;
    toUnitSelect.value = previousFromUnit;
    renderUnitBrowser();
    updateConversion(true);
  });

  renderCategoryPills();
  populateUnitSelects();
  renderUnitBrowser();
  updateConversion(false);
  syncLiveCurrencyRates(() => {
    updateConversion(false);
    if (onCurrencySync) onCurrencySync();
  });
};