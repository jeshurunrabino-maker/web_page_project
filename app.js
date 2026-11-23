/* Large numbers: scientific notation from 1e12 up, exact digits kept for tooltips */
const fmtNum = (v) => (Number.isFinite(v) && Math.abs(v) >= 1e12 ? v.toExponential(4) : v.toLocaleString());
const fullNum = (v) => (Number.isFinite(v) ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : String(v));
const pickFrames = (len) => (len <= 12
  ? Array.from({ length: len }, (_, i) => i)
  : [0, 1, 2, 3, 4, 5, len - 4, len - 3, len - 2, len - 1]);

const formatPHP = (amount) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount);

const escapeHTML = (str) =>
  str.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

const setError = (el, msg) => { el.textContent = msg; };
const clearError = (el) => setError(el, '');
const $ = (id) => document.getElementById(id);

/* Session Scratchpad Logger (entries reload their inputs when selected) */
const TAB_FOR_MODULE = { Conversion: 'sec-conversion', 'Income Tax': 'sec-tax', Looping: 'sec-looping', Payroll: 'sec-payroll' };

const logScratchpad = (moduleName, summary, restore) => {
  const listEl = $('scratchpad-list');
  if (!listEl) return;
  const emptyEl = listEl.querySelector('.scratchpad-empty');
  if (emptyEl) emptyEl.remove();

  const item = document.createElement('li');
  item.className = 'scratchpad-item';
  const label = `<strong>${escapeHTML(moduleName)}</strong><span>${escapeHTML(summary)}</span>`;
  if (restore) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'scratchpad-btn';
    btn.title = 'Reload these inputs';
    btn.innerHTML = label;
    btn.addEventListener('click', () => {
      activateWorkspaceTab(TAB_FOR_MODULE[moduleName] || 'sec-conversion', false);
      restore();
    });
    item.append(btn);
  } else {
    item.classList.add('is-plain');
    item.innerHTML = label;
  }
  listEl.prepend(item);
  while (listEl.children.length > 6) listEl.lastElementChild.remove();
};

/* 1. Navigation, Deep-Links & Scratchpad Controls */
const activateWorkspaceTab = (targetId, shouldScroll = true) => {
  document.querySelectorAll('.nav-btn').forEach((b) => {
    const on = b.dataset.target === targetId;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
  });
  document.querySelectorAll('.tool-section').forEach((sec) => {
    const on = sec.id === targetId;
    sec.classList.toggle('active', on);
    sec.hidden = !on;
    sec.setAttribute('aria-hidden', String(!on));
  });
  renderQuickConstants(targetId);

  if (shouldScroll) {
    const workspaceEl = $('sec-workspace');
    if (workspaceEl) workspaceEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const initNavigationAndShell = () => {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => activateWorkspaceTab(btn.dataset.target, false));
  });

  document.querySelectorAll('[data-open-tab]').forEach((trigger) => {
    trigger.addEventListener('click', () => activateWorkspaceTab(trigger.dataset.openTab, true));
  });

  // Mobile Menu Drawer
  const mobileBtn = $('mobile-nav-btn');
  const mobileDrawer = $('mobile-nav-drawer');
  if (mobileBtn && mobileDrawer) {
    mobileBtn.addEventListener('click', () => {
      const isOpen = !mobileDrawer.hidden;
      mobileDrawer.hidden = isOpen;
      mobileBtn.setAttribute('aria-expanded', String(!isOpen));
    });

    mobileDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileDrawer.hidden = true;
        mobileBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Session Scratchpad Toggle & Clear
  const toggleRailBtn = $('toggle-scratchpad-btn');
  const workspaceLayout = $('workspace-layout');
  const scratchpadEl = $('session-scratchpad');
  if (toggleRailBtn && workspaceLayout && scratchpadEl) {
    toggleRailBtn.addEventListener('click', () => {
      const isHidden = !scratchpadEl.hidden;
      scratchpadEl.hidden = isHidden;
      workspaceLayout.classList.toggle('is-rail-hidden', isHidden);
      toggleRailBtn.setAttribute('aria-expanded', String(!isHidden));
      toggleRailBtn.textContent = isHidden ? 'Show Scratchpad' : 'Hide Scratchpad';
    });
  }

  const tabNav = document.querySelector('.tab-nav');
  if (tabNav) {
    tabNav.addEventListener('keydown', (e) => {
      const tabs = [...tabNav.querySelectorAll('.nav-btn')];
      let i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key === 'ArrowRight') i = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') i = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') i = 0;
      else if (e.key === 'End') i = tabs.length - 1;
      else return;
      e.preventDefault();
      tabs[i].focus();
      activateWorkspaceTab(tabs[i].dataset.target, false);
    });
  }
  activateWorkspaceTab('sec-conversion', false);

  const clearHistoryBtn = $('clear-history-btn');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      const listEl = $('scratchpad-list');
      if (listEl) {
        listEl.innerHTML = '<li class="scratchpad-empty">Run any calculation to log it here.</li>';
      }
    });
  }
};

/* 2. Multi-Category Unit Converter (15 Categories + Persistent Stale-While-Revalidate FX) */
const UNIT_CATALOG = {
  temperature: {
    label: 'Temperature',
    defaultFrom: 'c',
    defaultTo: 'f',
    allowNegative: true,
    units: {
      c: { name: 'Celsius', symbol: '°C', toBase: (v) => v, fromBase: (v) => v },
      f: { name: 'Fahrenheit', symbol: '°F', toBase: (v) => (v - 32) / 1.8, fromBase: (v) => (v * 1.8) + 32 },
      k: { name: 'Kelvin', symbol: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
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
        toBase: (v) => (v === 0 ? 0 : (100 / v) * 0.425143707),
        fromBase: (kml) => (kml === 0 ? 0 : 100 / (kml / 0.425143707)),
      },
      kml: {
        name: 'Kilometer per Liter',
        symbol: 'km/L',
        toBase: (v) => v,
        fromBase: (kml) => kml,
      },
      l100km: {
        name: 'Liter per 100 Kilometers',
        symbol: 'L/100km',
        toBase: (v) => (v === 0 ? 0 : 100 / v),
        fromBase: (kml) => (kml === 0 ? 0 : 100 / kml),
      },
      mpg: {
        name: 'Mile per Gallon (US)',
        symbol: 'mi/gal',
        toBase: (v) => v * 0.425143707,
        fromBase: (kml) => kml / 0.425143707,
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
const CURRENCY_REFRESH_MS = 60 * 60 * 1000;

const applyCurrencyRates = (rates, statusLabel) => {
  const currencyUnits = UNIT_CATALOG.currency.units;
  Object.values(currencyUnits).forEach((unit) => {
    const rate = rates[unit.symbol];
    if (typeof rate === 'number' && rate > 0) {
      unit.factor = 1 / rate;
    }
  });
  UNIT_CATALOG.currency.note = statusLabel;
};

const hydrateCachedCurrencyRates = () => {
  try {
    const raw = localStorage.getItem(CURRENCY_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached && cached.rates) {
      applyCurrencyRates(cached.rates, `Saved market rates (${cached.date}) • Offline ready`);
      return cached;
    }
  } catch {
    // Ignore storage restrictions
  }
  return null;
};

const syncLiveCurrencyRates = async (onRatesUpdated) => {
  const cached = hydrateCachedCurrencyRates();
  onRatesUpdated();

  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  if (cached && Date.now() - cached.timestamp < CURRENCY_REFRESH_MS) return;

  try {
    const response = await fetch(CURRENCY_API_URL);
    if (!response.ok) return;

    const data = await response.json();
    if (data.result !== 'success' || !data.rates) return;

    const updatedDate = data.time_last_update_utc
      ? data.time_last_update_utc.slice(5, 16)
      : 'Latest';

    applyCurrencyRates(data.rates, `Live market rates (${updatedDate})`);
    onRatesUpdated();

    try {
      localStorage.setItem(
        CURRENCY_CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), date: updatedDate, rates: data.rates })
      );
    } catch {
      // Ignore storage quota errors
    }
  } catch {
    // Offline fallback preserved
  }
};

const formatConvertedNumber = (num) => {
  if (num === 0 || Math.abs(num) >= 0.01) return num.toFixed(2);
  return num.toPrecision(4);
};

const convertUnitValue = (categoryKey, fromKey, toKey, value) => {
  const category = UNIT_CATALOG[categoryKey];
  const fromUnit = category.units[fromKey];
  const toUnit = category.units[toKey];

  if (fromUnit.toBase && toUnit.fromBase) {
    return toUnit.fromBase(fromUnit.toBase(value));
  }
  const inBase = value * fromUnit.factor;
  return inBase / toUnit.factor;
};

const describeConversion = (categoryKey, fromKey, toKey) => {
  const category = UNIT_CATALOG[categoryKey];
  const fromUnit = category.units[fromKey];
  const toUnit = category.units[toKey];

  if (categoryKey === 'temperature') {
    const tempFormulas = {
      'c->f': 'Formula: (°C × 1.8) + 32',
      'f->c': 'Formula: (°F − 32) ÷ 1.8',
      'c->k': 'Formula: °C + 273.15',
      'k->c': 'Formula: K − 273.15',
      'f->k': 'Formula: ((°F − 32) ÷ 1.8) + 273.15',
      'k->f': 'Formula: ((K − 273.15) × 1.8) + 32',
    };
    return tempFormulas[`${fromKey}->${toKey}`] || `Identity: 1 ${fromUnit.symbol} = 1 ${toUnit.symbol}`;
  }

  if (categoryKey === 'fuel' && fromKey !== toKey) {
    const sample = convertUnitValue(categoryKey, fromKey, toKey, 10);
    const note = fromKey.includes('100') || toKey.includes('100') ? 'Inverse fuel economy scale' : 'Direct ratio';
    return `${note} • Reference: 10 ${fromUnit.symbol} = ${formatConvertedNumber(sample)} ${toUnit.symbol}`;
  }

  const unitRatio = convertUnitValue(categoryKey, fromKey, toKey, 1);
  const suffix = category.note ? ` • ${category.note}` : '';
  return `Ratio: 1 ${fromUnit.symbol} = ${formatConvertedNumber(unitRatio)} ${toUnit.symbol}${suffix}`;
};

const initHeroPreview = () => {
  const previewTabs = document.querySelectorAll('.preview-tab[data-preview-tab]');
  const paneFx = $('hero-pane-fx');
  const paneLoop = $('hero-pane-loop');

  previewTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.previewTab;
      previewTabs.forEach((t) => {
        const isSelected = t === tab;
        t.classList.toggle('active', isSelected);
        t.setAttribute('aria-selected', String(isSelected));
      });
      paneFx.hidden = target !== 'fx';
      paneLoop.hidden = target !== 'loop';
      paneFx.setAttribute('aria-hidden', String(target !== 'fx'));
      paneLoop.setAttribute('aria-hidden', String(target !== 'loop'));
    });
  });

  // Quick FX Sandbox
  const fxAmountEl = $('hero-fx-amount');
  const fxOutputEl = $('hero-fx-output');
  const fxRateNoteEl = $('hero-fx-rate-note');

  const updateHeroFx = () => {
    const raw = Number(fxAmountEl.value);
    const amount = Number.isFinite(raw) && raw >= 0 ? raw : 0;
    const phpVal = convertUnitValue('currency', 'usd', 'php', amount);
    const rate = convertUnitValue('currency', 'usd', 'php', 1);
    fxOutputEl.textContent = formatPHP(phpVal);
    fxRateNoteEl.textContent = `1 USD = ${rate.toFixed(2)} PHP • ${UNIT_CATALOG.currency.note}`;
  };

  fxAmountEl.addEventListener('input', updateHeroFx);

  // Mini Loop Sandbox
  const loopNEl = $('hero-loop-n');
  const loopRunBtn = $('hero-loop-run');
  const updateHeroLoop = () => {
    let n = Math.floor(Number(loopNEl.value));
    if (!Number.isFinite(n) || n < 0) n = 0;
    if (n > 15) n = 15;
    loopNEl.value = String(n);

    let fact = 1;
    let i = 1;
    while (i <= n) { fact *= i; i++; }

    let sum = 0;
    let j = 0;
    do { sum += j; j++; } while (j <= n);

    let total = 0;
    for (let k = 1; k <= n; k++) total += k;
    const avg = n === 0 ? 0 : total / n;

    $('hero-loop-fact').textContent = fmtNum(fact);
    $('hero-loop-fact').title = fullNum(fact);
    $('hero-loop-sum').textContent = fmtNum(sum);
    $('hero-loop-avg').textContent = avg.toFixed(2);
  };

  loopRunBtn.addEventListener('click', updateHeroLoop);
  updateHeroFx();
  updateHeroLoop();

  return updateHeroFx;
};

const initConverter = (onCurrencySync) => {
  const catContainer = $('conv-categories');
  const inputEl = $('conv-input');
  const searchEl = $('conv-search');
  const clearSearchBtn = $('conv-search-clear');
  const fromSelect = $('conv-from');
  const toSelect = $('conv-to');
  const swapBtn = $('conv-swap-btn');
  const resultEl = $('conv-result');
  const formulaEl = $('conv-formula');
  const errorEl = $('conv-error');
  const listLabelEl = $('conv-list-label');
  const listCountEl = $('conv-list-count');
  const unitListEl = $('conv-unit-list');

  let activeCategory = 'temperature';
  let logDebounce = null;

  const renderCategoryPills = () => {
    catContainer.innerHTML = Object.entries(UNIT_CATALOG)
      .map(([key, cat]) => `
        <button
          type="button"
          class="cat-pill ${key === activeCategory ? 'active' : ''}"
          aria-pressed="${key === activeCategory}"
          data-cat="${key}"
        >
          ${escapeHTML(cat.label)}
        </button>
      `)
      .join('');
  };

  const populateUnitSelects = () => {
    const category = UNIT_CATALOG[activeCategory];
    const optionsHTML = Object.entries(category.units)
      .map(([uKey, unit]) => `<option value="${uKey}">${escapeHTML(unit.name)} (${escapeHTML(unit.symbol)})</option>`)
      .join('');
    fromSelect.innerHTML = optionsHTML;
    toSelect.innerHTML = optionsHTML;
    fromSelect.value = category.defaultFrom;
    toSelect.value = category.defaultTo;
  };

  const renderUnitBrowser = () => {
    const query = searchEl.value.trim().toLowerCase();
    clearSearchBtn.hidden = query.length === 0;

    let matches = [];
    if (query) {
      Object.entries(UNIT_CATALOG).forEach(([catKey, cat]) => {
        Object.entries(cat.units).forEach(([uKey, unit]) => {
          const haystack = `${unit.name} ${unit.symbol} ${cat.label}`.toLowerCase();
          if (haystack.includes(query)) {
            matches.push({ catKey, catLabel: cat.label, uKey, unit });
          }
        });
      });
      listLabelEl.textContent = 'Search Results Across All Categories';
    } else {
      const cat = UNIT_CATALOG[activeCategory];
      matches = Object.entries(cat.units).map(([uKey, unit]) => ({
        catKey: activeCategory,
        catLabel: cat.label,
        uKey,
        unit,
      }));
      listLabelEl.textContent = `${cat.label} Units (Click to set target unit)`;
    }

    listCountEl.textContent = `${matches.length} ${matches.length === 1 ? 'unit' : 'units'}`;

    if (matches.length === 0) {
      unitListEl.innerHTML = `<p class="unit-empty">No units match "${escapeHTML(searchEl.value.trim())}".</p>`;
      return;
    }

    unitListEl.innerHTML = matches
      .map(({ catKey, catLabel, uKey, unit }) => {
        const isSelected = catKey === activeCategory && uKey === toSelect.value;
        return `
          <button
            type="button"
            class="unit-item ${isSelected ? 'selected' : ''}"
            role="option"
            aria-selected="${isSelected}"
            data-cat="${catKey}"
            data-unit="${uKey}"
          >
            <span class="unit-item-main">
              <span class="unit-item-name">${escapeHTML(unit.name)}</span>
              <span class="unit-item-sub">${escapeHTML(unit.symbol)}</span>
            </span>
            <span>
              ${query ? `<span class="unit-item-badge">${escapeHTML(catLabel)}</span>` : ''}
              ${isSelected ? '<span class="unit-item-check" aria-hidden="true">&#10003;</span>' : ''}
            </span>
          </button>
        `;
      })
      .join('');
  };

  const updateConversion = (shouldLog = false) => {
    const category = UNIT_CATALOG[activeCategory];
    const fromKey = fromSelect.value;
    const toKey = toSelect.value;
    const fromUnit = category.units[fromKey];
    const toUnit = category.units[toKey];

    formulaEl.textContent = describeConversion(activeCategory, fromKey, toKey);

    const raw = inputEl.value.trim();
    if (raw === '') {
      clearError(errorEl);
      resultEl.textContent = `0.00 ${toUnit.symbol}`;
      return;
    }

    const value = Number(raw);
    if (!Number.isFinite(value)) {
      setError(errorEl, 'Please enter a valid number.');
      resultEl.textContent = `0.00 ${toUnit.symbol}`;
      return;
    }

    if (value < 0 && !category.allowNegative) {
      setError(errorEl, 'Negative values are only allowed for temperature conversions.');
      resultEl.textContent = `0.00 ${toUnit.symbol}`;
      return;
    }

    clearError(errorEl);
    const converted = convertUnitValue(activeCategory, fromKey, toKey, value);
    const formattedOut = `${formatConvertedNumber(converted)} ${toUnit.symbol}`;
    resultEl.textContent = formattedOut;

    if (shouldLog) {
      const catKey = activeCategory;
      window.clearTimeout(logDebounce);
      logDebounce = window.setTimeout(() => {
        logScratchpad('Conversion', `${value} ${fromUnit.symbol} = ${formattedOut}`, () => {
          searchEl.value = '';
          switchCategory(catKey);
          fromSelect.value = fromKey;
          toSelect.value = toKey;
          inputEl.value = raw;
          renderUnitBrowser();
          updateConversion(false);
        });
      }, 650);
    }
  };

  const switchCategory = (catKey, targetUnitKey = null) => {
    activeCategory = catKey;
    renderCategoryPills();
    populateUnitSelects();
    if (targetUnitKey && UNIT_CATALOG[catKey].units[targetUnitKey]) {
      toSelect.value = targetUnitKey;
    }
    renderUnitBrowser();
    updateConversion(false);
  };

  catContainer.addEventListener('click', (e) => {
    const pill = e.target.closest('.cat-pill[data-cat]');
    if (!pill) return;
    searchEl.value = '';
    switchCategory(pill.dataset.cat);
  });

  unitListEl.addEventListener('click', (e) => {
    const item = e.target.closest('.unit-item[data-unit]');
    if (!item) return;
    const { cat, unit } = item.dataset;
    if (cat !== activeCategory) {
      switchCategory(cat, unit);
    } else {
      toSelect.value = unit;
      renderUnitBrowser();
      updateConversion(true);
    }
  });

  searchEl.addEventListener('input', renderUnitBrowser);
  clearSearchBtn.addEventListener('click', () => {
    searchEl.value = '';
    renderUnitBrowser();
    searchEl.focus();
  });

  inputEl.addEventListener('input', () => updateConversion(true));
  fromSelect.addEventListener('change', () => updateConversion(true));
  toSelect.addEventListener('change', () => {
    renderUnitBrowser();
    updateConversion(true);
  });

  swapBtn.addEventListener('click', () => {
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
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

/* 3. Income Tax Calculator (Exact Assignment Schedule: Basic Tax + Excess Rate) */
const TAX_BRACKETS = [
  { limit: 250000, base: 0, floor: 0, rate: 0, label: '0% (Not over ₱250,000)' },
  { limit: 400000, base: 0, floor: 250000, rate: 0.20, label: '20% of the excess over ₱250,000' },
  { limit: 800000, base: 30000, floor: 400000, rate: 0.25, label: '₱30,000 + 25% of the excess over ₱400,000' },
  { limit: 2000000, base: 130000, floor: 800000, rate: 0.30, label: '₱130,000 + 30% of the excess over ₱800,000' },
  { limit: 8000000, base: 490000, floor: 2000000, rate: 0.32, label: '₱490,000 + 32% of the excess over ₱2,000,000' },
  { limit: Infinity, base: 2410000, floor: 8000000, rate: 0.35, label: '₱2,410,000 + 35% of the excess over ₱8,000,000' },
];

const computeTax = (annualIncome) => {
  const bracket = TAX_BRACKETS.find((b) => annualIncome <= b.limit);
  const excessAmount = Math.max(0, annualIncome - bracket.floor);
  const excessTax = excessAmount * bracket.rate;
  const totalTax = bracket.base + excessTax;
  return {
    basicTax: bracket.base,
    excessTax,
    tax: totalTax,
    label: bracket.label,
  };
};

const initTax = () => {
  const period = $('tax-period');
  const income = $('tax-income');
  const bracketEl = $('tax-bracket');
  const breakdownEl = $('tax-breakdown');
  const payableEl = $('tax-payable');
  const netEl = $('tax-net');
  const error = $('tax-error');
  const tableToggleBtn = $('tax-table-toggle');
  const refPanel = $('tax-ref-panel');
  const refTbody = $('tax-ref-tbody');

  const resetOutputs = () => {
    bracketEl.textContent = '-';
    breakdownEl.textContent = 'Basic ₱0.00 + Excess ₱0.00';
    payableEl.textContent = formatPHP(0);
    netEl.textContent = formatPHP(0);
  };

  const runTaxCalculation = (log = true) => {
    const raw = income.value.trim();
    const rawIncome = Number(raw);
    if (raw === '' || !Number.isFinite(rawIncome) || rawIncome < 0) {
      setError(error, 'Please enter a valid income of 0 or more.');
      resetOutputs();
      return;
    }
    clearError(error);
    const annualIncome = period.value === 'monthly' ? rawIncome * 12 : rawIncome;
    const { basicTax, excessTax, tax, label } = computeTax(annualIncome);

    bracketEl.textContent = label;
    breakdownEl.textContent = `Basic ${formatPHP(basicTax)} + Excess ${formatPHP(excessTax)}`;
    payableEl.textContent = formatPHP(tax);
    netEl.textContent = formatPHP(annualIncome - tax);
    if (log) {
      const per = period.value;
      logScratchpad('Income Tax', `Income ${formatPHP(annualIncome)} → Tax ${formatPHP(tax)}`, () => {
        period.value = per;
        income.value = raw;
        runTaxCalculation(false);
      });
    }
  };

  $('tax-form').addEventListener('submit', (e) => {
    e.preventDefault();
    runTaxCalculation();
  });

  // Toggle Reference Schedule Table visibility
  if (tableToggleBtn && refPanel) {
    tableToggleBtn.addEventListener('click', () => {
      const isHidden = !refPanel.hidden;
      refPanel.hidden = isHidden;
      tableToggleBtn.setAttribute('aria-expanded', String(!isHidden));
      tableToggleBtn.textContent = isHidden ? 'Show Tax Table' : 'Hide Tax Table';
    });
  }

  // Click or press Enter on any sample row in the Reference Table to test immediately
  if (refTbody) {
    const applySampleRow = (rowEl) => {
      const sampleVal = rowEl.dataset.sample;
      if (!sampleVal) return;
      period.value = 'annual';
      income.value = sampleVal;
      runTaxCalculation();
    };

    refTbody.addEventListener('click', (e) => {
      const row = e.target.closest('tr[data-sample]');
      if (row) applySampleRow(row);
    });

    refTbody.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const row = e.target.closest('tr[data-sample]');
      if (row) {
        e.preventDefault();
        applySampleRow(row);
      }
    });
  }
};

/* ==========================================================================
   4. LOOPING CONSTRUCTS — ALL 3 VISUAL DISPLAY ENGINES + VIEW TOGGLES
   ========================================================================== */

/* --- ENGINE A: Execution Tape Helpers --- */
const computeTapeFactorial = (n) => {
  let result = 1;
  let i = 1;
  const steps = [];
  while (i <= n) {
    const prev = result;
    result *= i;
    steps.push({
      iter: i,
      shortVal: fmtNum(result),
      full: result >= 1e12 ? fullNum(result) : '',
      expr: `Pass ${i}: ${fmtNum(prev)} × ${i} = ${fmtNum(result)}`,
      summaryVal: fmtNum(result),
    });
    i++;
  }
  return { value: result, steps };
};

const computeTapeSum = (n) => {
  let total = 0;
  let i = 0;
  const steps = [];
  do {
    const prev = total;
    total += i;
    steps.push({
      iter: i,
      shortVal: fmtNum(total),
      expr: `Pass ${steps.length + 1} (i = ${i}): ${fmtNum(prev)} + ${i} = ${fmtNum(total)}`,
      summaryVal: fmtNum(total),
    });
    i++;
  } while (i <= n);
  return { value: total, steps };
};

const computeTapeAverage = (n) => {
  let total = 0;
  const steps = [];
  for (let k = 1; k <= n; k++) {
    total += k;
    const runningAvg = (total / k).toFixed(2);
    steps.push({
      iter: k,
      shortVal: runningAvg,
      expr: `Pass ${k} (k = ${k}): sum ${fmtNum(total)} ÷ ${k} = ${runningAvg}`,
      summaryVal: runningAvg,
    });
  }
  return { value: n === 0 ? 0 : total / n, steps };
};

const buildVisibleTapeItems = (steps) => {
  if (steps.length <= 12) return steps.map((step, idx) => ({ type: 'step', step, stepIndex: idx }));
  const head = steps.slice(0, 6).map((step, idx) => ({ type: 'step', step, stepIndex: idx }));
  const tail = steps.slice(-4).map((step, offset) => ({ type: 'step', step, stepIndex: steps.length - 4 + offset }));
  return [...head, { type: 'ellipsis', skipped: steps.length - 10 }, ...tail];
};

/* --- ENGINE B: Control-Flow Flowchart Helpers --- */
const computeFlowFactorial = (n) => {
  let result = 1;
  let i = 1;
  const frames = [{ node: 'init', edge: null, readout: 'Init: result = 1, i = 1' }];
  while (i <= n) {
    const prev = result;
    result *= i;
    if (i <= 3 || i === n) {
      frames.push({ node: 'cond', edge: i === 1 ? 'init-cond' : 'body-cond', readout: `Check (${i} <= ${n}) → True` });
      frames.push({ node: 'body', edge: 'cond-body', readout: `Pass ${i}: ${fmtNum(prev)} × ${i} = ${fmtNum(result)}` });
    } else if (i === 4) {
      frames.push({ node: 'body', edge: 'body-cond', readout: `Looping passes 4..${n - 1}...` });
    }
    i++;
  }
  frames.push({ node: 'cond', edge: n === 0 ? 'init-cond' : 'body-cond', readout: `Check (${i} <= ${n}) → False` });
  frames.push({ node: 'exit', edge: 'cond-exit', readout: `Done (${n} ${n === 1 ? 'pass' : 'passes'}): ${fmtNum(result)}` });
  return { value: result, frames };
};

const computeFlowSum = (n) => {
  let total = 0;
  let i = 0;
  let passes = 0;
  const frames = [{ node: 'init', edge: null, readout: 'Init: total = 0, i = 0' }];
  do {
    const prev = total;
    total += i;
    passes++;
    if (passes <= 3 || i === n) {
      frames.push({ node: 'body', edge: passes === 1 ? 'init-body' : 'cond-body', readout: `Pass ${passes} (i = ${i}): ${fmtNum(prev)} + ${i} = ${fmtNum(total)}` });
      if (i < n) frames.push({ node: 'cond', edge: 'body-cond', readout: `Check (${i + 1} <= ${n}) → True` });
    } else if (passes === 4) {
      frames.push({ node: 'body', edge: 'cond-body', readout: `Looping passes 4..${n}...` });
    }
    i++;
  } while (i <= n);
  frames.push({ node: 'cond', edge: 'body-cond', readout: `Check (${i} <= ${n}) → False` });
  frames.push({ node: 'exit', edge: 'cond-exit', readout: `Done (${passes} ${passes === 1 ? 'pass' : 'passes'}): ${fmtNum(total)}` });
  return { value: total, frames };
};

const computeFlowAverage = (n) => {
  let total = 0;
  const frames = [{ node: 'init', edge: null, readout: 'Init: total = 0, k = 1' }];
  for (let k = 1; k <= n; k++) {
    total += k;
    const runningAvg = (total / k).toFixed(2);
    if (k <= 2 || k === n) {
      frames.push({ node: 'cond', edge: k === 1 ? 'init-cond' : 'inc-cond', readout: `Test (${k} <= ${n}) → True` });
      frames.push({ node: 'body', edge: 'cond-body', readout: `Body: total = ${fmtNum(total)} (avg ${runningAvg})` });
      frames.push({ node: 'inc', edge: 'body-inc', readout: `Update: k++ → ${k + 1}` });
    } else if (k === 3) {
      frames.push({ node: 'inc', edge: 'inc-cond', readout: `Looping passes 3..${n - 1}...` });
    }
  }
  const finalAvg = n === 0 ? 0 : total / n;
  frames.push({ node: 'cond', edge: n === 0 ? 'init-cond' : 'inc-cond', readout: `Test (${n + 1} <= ${n}) → False` });
  frames.push({ node: 'exit', edge: 'cond-exit', readout: n === 0 ? 'Done (0 passes): guarded 0.00' : `Done (${n} ${n === 1 ? 'pass' : 'passes'}): ${finalAvg.toFixed(2)}` });
  return { value: finalAvg, frames };
};

const NODE_EXPLANATIONS = {
  fact: {
    init: 'Initializes accumulator result = 1 and counter i = 1 before entering the loop.',
    cond: 'Entry condition: tests i <= n before every pass. Skips body completely if n = 0.',
    body: 'Multiplies result by i and increments i by 1, then loops back to re-test i <= n.',
    exit: 'Condition became false; exits loop and outputs the final factorial (0! = 1).',
  },
  sum: {
    init: 'Initializes running sum total = 0 and counter i = 0.',
    body: 'Executed BEFORE checking the condition—guarantees at least 1 pass even when n = 0.',
    cond: 'Exit condition: tests i <= n after the body runs. Loops back while true.',
    exit: 'Condition became false; exits loop and outputs the accumulated sum.',
  },
  avg: {
    init: 'Runs once at start: initializes total = 0 and loop counter k = 1.',
    cond: 'Entry test: checks k <= n before each iteration. Exits immediately when n = 0.',
    body: 'Adds current counter k into total.',
    inc: 'Increments counter k++ at the end of each pass before jumping back to k <= n.',
    exit: 'Divides total by n (returning 0.00 safely if n = 0).',
  },
};

/* --- ENGINE C: Visual Math Block Builder Helpers --- */
const computeBuilderFactorial = (n) => {
  let result = 1;
  let i = 1;
  const steps = [];
  while (i <= n) {
    const prev = result;
    result *= i;
    steps.push({ iter: i, prev, result });
    i++;
  }
  return { value: result, steps };
};

const computeBuilderSum = (n) => {
  let total = 0;
  let i = 0;
  const steps = [];
  do {
    total += i;
    steps.push({ iter: i, total });
    i++;
  } while (i <= n);
  return { value: total, steps };
};

const computeBuilderAverage = (n) => {
  let total = 0;
  const steps = [];
  for (let k = 1; k <= n; k++) {
    total += k;
    steps.push({ iter: k, total, avg: total / k });
  }
  return { value: n === 0 ? 0 : total / n, steps };
};

const getTierClass = (val, maxVal) => {
  if (maxVal <= 0 || val <= 0) return 'tier-1';
  return `tier-${Math.max(1, Math.min(12, Math.round((val / maxVal) * 12)))}`;
};

const buildStaircaseHTML = (columns, activeIndex, options = {}) => {
  const { leveledAvg = null, maxVal = 15 } = options;
  const isDiscrete = maxVal <= 15 && columns.length <= 16;

  const visibleCols = columns.length <= 12
    ? columns.map((col, idx) => ({ type: 'col', col, idx }))
    : [
        ...columns.slice(0, 6).map((col, idx) => ({ type: 'col', col, idx })),
        { type: 'ellipsis', skipped: columns.length - 10 },
        ...columns.slice(-4).map((col, offset) => ({ type: 'col', col, idx: columns.length - 4 + offset })),
      ];

  const colsHTML = visibleCols
    .map((item) => {
      if (item.type === 'ellipsis') return `<span class="builder-ellipsis">&hellip;</span>`;
      const { col, idx } = item;
      const isActive = idx === activeIndex;

      if (col === 0) {
        return `<div class="stair-col ${isActive ? 'is-active' : ''}"><div class="stair-stack"><span class="zero-col-marker"></span></div><span class="stair-label">i=0</span></div>`;
      }

      if (isDiscrete && leveledAvg !== null) {
        const wholeLevel = Math.floor(leveledAvg);
        const hasHalf = Math.abs(leveledAvg - wholeLevel - 0.5) < 0.001;
        const maxDisplayRows = Math.max(col, wholeLevel);
        const blocks = [];
        for (let r = 1; r <= maxDisplayRows; r++) {
          if (r <= col && r <= wholeLevel) blocks.push('<span class="unit-block"></span>');
          else if (r > col && r <= wholeLevel) blocks.push('<span class="unit-block is-leveled-gain"></span>');
          else if (r <= col && r > wholeLevel) {
            blocks.push(hasHalf && r === wholeLevel + 1 ? '<span class="unit-block is-half-block"></span>' : '<span class="unit-block is-leveled-trimmed"></span>');
          }
        }
        if (hasHalf && col <= wholeLevel) blocks.push('<span class="unit-block is-half-block is-leveled-gain"></span>');
        return `<div class="stair-col is-active"><div class="stair-stack">${blocks.join('')}</div><span class="stair-label">${leveledAvg.toFixed(2)}</span></div>`;
      }

      if (isDiscrete) {
        const blocks = Array.from({ length: col }, () => '<span class="unit-block"></span>').join('');
        return `<div class="stair-col ${isActive ? 'is-active' : ''}"><div class="stair-stack">${blocks}</div><span class="stair-label">+${col}</span></div>`;
      }

      if (leveledAvg !== null) {
        return `<div class="stair-col is-active"><div class="stair-stack"><span class="tier-bar is-leveled tier-6"></span></div><span class="stair-label">${leveledAvg.toFixed(2)}</span></div>`;
      }

      return `<div class="stair-col ${isActive ? 'is-active' : ''}"><div class="stair-stack"><span class="tier-bar ${getTierClass(col, maxVal)}"></span></div><span class="stair-label">+${col}</span></div>`;
    })
    .join('');

  const legendHTML = leveledAvg !== null && isDiscrete
    ? `<div class="builder-legend"><span class="legend-item"><span class="legend-swatch"></span> Original</span><span class="legend-item"><span class="legend-swatch is-gain"></span> Redistributed</span><span class="legend-item"><span class="legend-swatch is-trimmed"></span> Surplus moved</span></div>`
    : '';

  return `<div class="stair-arena">${colsHTML}</div>${legendHTML}`;
};

const buildFactorialStageHTML = (n, stepObj, allSteps) => {
  if (n === 0) {
    return `<div class="cluster-arena"><div class="fact-cluster"><span class="fact-cluster-title">0! Identity (1 block)</span><div class="fact-pip-grid"><span class="fact-pip"></span></div></div></div>`;
  }
  if (n <= 5) {
    const clustersHTML = Array.from({ length: stepObj.iter }, (_, idx) => {
      const pips = Array.from({ length: stepObj.prev }, () => '<span class="fact-pip"></span>').join('');
      return `<div class="fact-cluster"><span class="fact-cluster-title">Group ${idx + 1} (${stepObj.prev})</span><div class="fact-pip-grid">${pips}</div></div>`;
    }).join('');
    return `<div class="cluster-arena">${clustersHTML}</div>`;
  }

  const visibleSteps = allSteps.slice(0, stepObj.iter);
  const items = visibleSteps.length <= 12
    ? visibleSteps.map((s) => ({ type: 'step', s }))
    : [...visibleSteps.slice(0, 6).map((s) => ({ type: 'step', s })), { type: 'ellipsis' }, ...visibleSteps.slice(-4).map((s) => ({ type: 'step', s }))];

  const barsHTML = items
    .map((item) => {
      if (item.type === 'ellipsis') return '<span class="builder-ellipsis">&hellip;</span>';
      const isCurrent = item.s.iter === stepObj.iter;
      return `<div class="stair-col ${isCurrent ? 'is-active' : ''}"><div class="stair-stack"><span class="tier-bar ${getTierClass(item.s.iter, n)}"></span></div><span class="stair-label">&times;${item.s.iter}</span></div>`;
    })
    .join('');

  return `<div class="stair-arena">${barsHTML}</div>`;
};

const initLooping = () => {
  const input = $('loop-n');
  const speedSelect = $('loop-speed');
  const runBtn = $('loop-calc-btn');
  const replayBtn = $('loop-replay-btn');
  const error = $('loop-error');

  const viewBar = $('loop-view-bar');
  const hiddenNoticeEl = $('loop-views-hidden-notice');
  const showAllEmptyBtn = $('loop-show-all-btn');

  const VIEW_LABELS = {
    tape: '1. Execution Tape',
    flow: '2. Control-Flow Flowcharts',
    builder: '3. Visual Block Builder',
  };

  const viewPanels = {
    tape: $('loop-view-tape'),
    flow: $('loop-view-flow'),
    builder: $('loop-view-builder'),
  };

  const visibleViews = { tape: true, flow: true, builder: true };

  const syncViewVisibility = () => {
    const keys = Object.keys(visibleViews);
    const visibleCount = keys.filter((k) => visibleViews[k]).length;

    keys.forEach((key) => {
      const isShown = visibleViews[key];
      const panelEl = viewPanels[key];
      panelEl.hidden = !isShown;

      const focusBtn = panelEl.querySelector(`.view-action-btn[data-focus-view="${key}"]`);
      if (focusBtn) focusBtn.textContent = visibleCount === 1 && isShown ? 'Show All' : 'Only This';

      const togglePill = viewBar.querySelector(`[data-view-toggle="${key}"]`);
      if (togglePill) {
        togglePill.classList.toggle('active', isShown);
        togglePill.classList.toggle('is-off', !isShown);
        togglePill.setAttribute('aria-pressed', String(isShown));
        togglePill.innerHTML = `${isShown ? '&#10003;' : '&#10005;'} ${VIEW_LABELS[key]}`;
      }
    });

    const allBtn = viewBar.querySelector('[data-view-action="all"]');
    if (allBtn) allBtn.classList.toggle('active', visibleCount === keys.length);
    hiddenNoticeEl.hidden = visibleCount > 0;
  };

  const showAllViews = () => {
    visibleViews.tape = true;
    visibleViews.flow = true;
    visibleViews.builder = true;
    syncViewVisibility();
  };

  viewBar.addEventListener('click', (e) => {
    if (e.target.closest('[data-view-action="all"]')) {
      showAllViews();
      return;
    }
    const toggleBtn = e.target.closest('[data-view-toggle]');
    if (toggleBtn) {
      const key = toggleBtn.dataset.viewToggle;
      visibleViews[key] = !visibleViews[key];
      syncViewVisibility();
    }
  });

  showAllEmptyBtn.addEventListener('click', showAllViews);

  Object.entries(viewPanels).forEach(([key, panelEl]) => {
    panelEl.addEventListener('click', (e) => {
      if (e.target.closest(`[data-hide-view="${key}"]`)) {
        visibleViews[key] = false;
        syncViewVisibility();
        return;
      }
      if (e.target.closest(`[data-focus-view="${key}"]`)) {
        const currentlySolo = visibleViews[key] && Object.keys(visibleViews).filter((k) => visibleViews[k]).length === 1;
        if (currentlySolo) showAllViews();
        else {
          Object.keys(visibleViews).forEach((k) => { visibleViews[k] = k === key; });
          syncViewVisibility();
        }
      }
    });
  });

  const summaryEls = { fact: $('loop-factorial'), sum: $('loop-sum'), avg: $('loop-avg') };

  const tapeViews = {
    fact: {
      exprEl: $('trace-expr-fact'),
      statusEl: $('trace-status-fact'),
      trackEl: $('tape-track-fact'),
      emptyMsg: 'Condition (1 <= 0) is false at entry — 0 passes • 0! = 1',
      finalExpr: (val, count) => `Completed (${count} ${count === 1 ? 'pass' : 'passes'}) • Final Factorial = ${fmtNum(val)}`,
    },
    sum: {
      exprEl: $('trace-expr-sum'),
      statusEl: $('trace-status-sum'),
      trackEl: $('tape-track-sum'),
      emptyMsg: 'Executed 1 pass before checking exit condition',
      finalExpr: (val, count) => `Completed (${count} ${count === 1 ? 'pass' : 'passes'}) • Final Sum = ${fmtNum(val)}`,
    },
    avg: {
      exprEl: $('trace-expr-avg'),
      statusEl: $('trace-status-avg'),
      trackEl: $('tape-track-avg'),
      emptyMsg: 'Condition (1 <= 0) is false at entry — 0 passes • Average = 0.00',
      finalExpr: (val, count) => `Completed (${count} ${count === 1 ? 'pass' : 'passes'}) • Final Average = ${val.toFixed(2)}`,
    },
  };

  const flowCards = {
    fact: { cardEl: document.querySelector('.flow-card[data-loop="fact"]'), badgeEl: $('flow-badge-fact'), readoutEl: $('flow-readout-fact'), defaultBadge: 'Entry-Controlled' },
    sum: { cardEl: document.querySelector('.flow-card[data-loop="sum"]'), badgeEl: $('flow-badge-sum'), readoutEl: $('flow-readout-sum'), defaultBadge: 'Exit-Controlled' },
    avg: { cardEl: document.querySelector('.flow-card[data-loop="avg"]'), badgeEl: $('flow-badge-avg'), readoutEl: $('flow-readout-avg'), defaultBadge: 'Counter-Controlled' },
  };

  const builderStages = {
    fact: { exprEl: $('builder-expr-fact'), badgeEl: $('builder-badge-fact'), stageEl: $('builder-stage-fact') },
    sum: { exprEl: $('builder-expr-sum'), badgeEl: $('builder-badge-sum'), stageEl: $('builder-stage-sum') },
    avg: { exprEl: $('builder-expr-avg'), badgeEl: $('builder-badge-avg'), stageEl: $('builder-stage-avg') },
  };

  let activeTimers = [];
  let lastValidN = null;

  const clearAnimations = () => {
    activeTimers.forEach((id) => window.clearTimeout(id));
    activeTimers = [];
  };

  const setStatusBadge = (el, label, stateClass = '') => {
    el.textContent = label;
    el.classList.remove('is-running', 'is-complete');
    if (stateClass) el.classList.add(stateClass);
  };

  const clearFlowHighlights = (cardEl) => {
    cardEl.querySelectorAll('.flow-node, .flow-edge').forEach((el) => el.classList.remove('is-active', 'is-visited'));
  };

  const resetAllVisualizers = () => {
    clearAnimations();
    Object.values(summaryEls).forEach((el) => { el.textContent = '-'; });
    Object.values(tapeViews).forEach((view) => {
      view.exprEl.textContent = 'Ready: enter n and click Run All Loops';
      setStatusBadge(view.statusEl, 'Idle');
      view.trackEl.innerHTML = '';
    });
    Object.values(flowCards).forEach(({ cardEl, badgeEl, readoutEl, defaultBadge }) => {
      clearFlowHighlights(cardEl);
      badgeEl.textContent = defaultBadge;
      badgeEl.classList.remove('is-running');
      readoutEl.textContent = 'Ready: enter n and click Run All Loops';
    });
    Object.values(builderStages).forEach((st) => {
      st.exprEl.textContent = 'Ready: enter n and click Run All Loops';
      setStatusBadge(st.badgeEl, 'Idle');
      st.stageEl.innerHTML = '';
    });
  };

  const renderTapeLoop = (key, resultObj, delayMs) => {
    const view = tapeViews[key];
    const { value, steps } = resultObj;
    const finalFormatted = key === 'avg' ? value.toFixed(2) : fmtNum(value);
    summaryEls[key].title = key === 'fact' ? fullNum(value) : '';
    view.trackEl.innerHTML = '';

    if (steps.length === 0) {
      summaryEls[key].textContent = finalFormatted;
      view.exprEl.textContent = view.emptyMsg;
      setStatusBadge(view.statusEl, '0 passes', 'is-complete');
      view.trackEl.innerHTML = `<span class="tape-empty-note">${escapeHTML(view.emptyMsg)}</span>`;
      return;
    }

    const visibleItems = buildVisibleTapeItems(steps);
    view.trackEl.innerHTML = visibleItems
      .map((item) => {
        if (item.type === 'ellipsis') return `<span class="tape-ellipsis">&hellip; (${item.skipped} more) &hellip;</span>`;
        return `<button type="button" class="tape-cell" data-step-idx="${item.stepIndex}" title="${escapeHTML(item.step.full ? `${item.step.expr} (exact: ${item.step.full})` : item.step.expr)}"><span class="tape-cell-step">i=${item.step.iter}</span><span class="tape-cell-val">${escapeHTML(item.step.shortVal)}</span></button>`;
      })
      .join('');

    const stepButtons = Array.from(view.trackEl.querySelectorAll('.tape-cell[data-step-idx]'));
    stepButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const chosen = steps[Number(btn.dataset.stepIdx)];
        if (!chosen) return;
        stepButtons.forEach((b) => b.classList.remove('is-current'));
        btn.classList.add('is-current');
        view.exprEl.textContent = `Inspecting ${chosen.expr}`;
      });
    });

    if (delayMs === 0) {
      stepButtons.forEach((btn, idx) => btn.classList.add(idx === stepButtons.length - 1 ? 'is-current' : 'is-done'));
      summaryEls[key].textContent = finalFormatted;
      view.exprEl.textContent = view.finalExpr(value, steps.length);
      setStatusBadge(view.statusEl, `${steps.length} ${steps.length === 1 ? 'pass' : 'passes'}`, 'is-complete');
      return;
    }

    setStatusBadge(view.statusEl, 'Running...', 'is-running');
    stepButtons.forEach((btn, frameIdx) => {
      const timerId = window.setTimeout(() => {
        const currentStep = steps[Number(btn.dataset.stepIdx)];
        stepButtons.forEach((b, prevIdx) => {
          b.classList.remove('is-current');
          if (prevIdx < frameIdx) b.classList.add('is-done');
        });
        btn.classList.add('is-current');
        view.exprEl.textContent = currentStep.expr;
        summaryEls[key].textContent = currentStep.summaryVal;

        if (frameIdx === stepButtons.length - 1) {
          summaryEls[key].textContent = finalFormatted;
          view.exprEl.textContent = view.finalExpr(value, steps.length);
          setStatusBadge(view.statusEl, `${steps.length} ${steps.length === 1 ? 'pass' : 'passes'}`, 'is-complete');
        }
      }, frameIdx * delayMs);
      activeTimers.push(timerId);
    });
  };

  const applyFlowFrame = (loopKey, frame) => {
    const { cardEl, readoutEl } = flowCards[loopKey];
    cardEl.querySelectorAll('.flow-node.is-active, .flow-edge.is-active').forEach((el) => {
      el.classList.remove('is-active');
      el.classList.add('is-visited');
    });
    if (frame.edge) {
      const edgeEl = cardEl.querySelector(`.flow-edge[data-edge="${frame.edge}"]`);
      if (edgeEl) edgeEl.classList.add('is-active');
    }
    const nodeEl = cardEl.querySelector(`.flow-node[data-node="${frame.node}"]`);
    if (nodeEl) {
      nodeEl.classList.remove('is-visited');
      nodeEl.classList.add('is-active');
    }
    readoutEl.textContent = frame.readout;
  };

  const renderFlowchartLoop = (loopKey, resultObj, delayMs) => {
    const { cardEl, badgeEl, defaultBadge } = flowCards[loopKey];
    const { frames } = resultObj;
    clearFlowHighlights(cardEl);

    if (delayMs === 0) {
      frames.forEach((frame) => applyFlowFrame(loopKey, frame));
      badgeEl.textContent = defaultBadge;
      badgeEl.classList.remove('is-running');
      return;
    }

    badgeEl.textContent = 'Tracing...';
    badgeEl.classList.add('is-running');
    frames.forEach((frame, idx) => {
      const id = window.setTimeout(() => {
        applyFlowFrame(loopKey, frame);
        if (idx === frames.length - 1) {
          badgeEl.textContent = defaultBadge;
          badgeEl.classList.remove('is-running');
        }
      }, idx * delayMs);
      activeTimers.push(id);
    });
  };

  Object.entries(flowCards).forEach(([loopKey, { cardEl, readoutEl }]) => {
    const inspectNode = (nodeEl) => {
      const explanation = NODE_EXPLANATIONS[loopKey][nodeEl.dataset.node];
      if (!explanation) return;
      cardEl.querySelectorAll('.flow-node').forEach((n) => n.classList.remove('is-active'));
      nodeEl.classList.add('is-active');
      readoutEl.textContent = explanation;
    };
    cardEl.addEventListener('click', (e) => {
      const nodeEl = e.target.closest('.flow-node[data-node]');
      if (nodeEl) inspectNode(nodeEl);
    });
    cardEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const nodeEl = e.target.closest('.flow-node[data-node]');
        if (nodeEl) { e.preventDefault(); inspectNode(nodeEl); }
      }
    });
  });

  const renderBlockBuilderLoops = (n, delayMs) => {
    const factRes = computeBuilderFactorial(n);
    const sumRes = computeBuilderSum(n);
    const avgRes = computeBuilderAverage(n);
    const B = builderStages;
    // Large n: animate a sample of steps (first 6, last 4) and land on the exact final state.
    const animate = (steps, fn) => pickFrames(steps.length).forEach((idx, fi) => {
      activeTimers.push(window.setTimeout(() => fn(steps[idx], idx), fi * delayMs));
    });

    B.fact.badgeEl.title = fullNum(factRes.value);
    if (factRes.steps.length === 0) {
      B.fact.exprEl.textContent = 'Condition (1 <= 0) is false at entry • 0! = 1 block';
      setStatusBadge(B.fact.badgeEl, '1 block', 'is-complete');
      B.fact.stageEl.innerHTML = buildFactorialStageHTML(0, null, []);
    } else if (delayMs === 0) {
      const lastStep = factRes.steps[factRes.steps.length - 1];
      B.fact.exprEl.textContent = `Built ${n} ${n === 1 ? 'group' : 'groups'} • Total = ${fmtNum(factRes.value)} blocks`;
      setStatusBadge(B.fact.badgeEl, `${fmtNum(factRes.value)} blocks`, 'is-complete');
      B.fact.stageEl.innerHTML = buildFactorialStageHTML(n, lastStep, factRes.steps);
    } else {
      setStatusBadge(B.fact.badgeEl, 'Building...', 'is-running');
      animate(factRes.steps, (step, idx) => {
        B.fact.exprEl.textContent = `Pass ${step.iter}: ${step.iter} × ${fmtNum(step.prev)} = ${fmtNum(step.result)} blocks`;
        B.fact.stageEl.innerHTML = buildFactorialStageHTML(n, step, factRes.steps);
        if (idx === factRes.steps.length - 1) setStatusBadge(B.fact.badgeEl, `${fmtNum(factRes.value)} blocks`, 'is-complete');
      });
    }

    if (delayMs === 0) {
      const cols = sumRes.steps.map((st) => st.iter);
      B.sum.exprEl.textContent = `Staircase complete (i = 0..${n}) • Total = ${fmtNum(sumRes.value)} blocks`;
      setStatusBadge(B.sum.badgeEl, `${fmtNum(sumRes.value)} blocks`, 'is-complete');
      B.sum.stageEl.innerHTML = buildStaircaseHTML(cols, cols.length - 1, { maxVal: n });
    } else {
      setStatusBadge(B.sum.badgeEl, 'Stacking...', 'is-running');
      animate(sumRes.steps, (step, idx) => {
        const cols = sumRes.steps.slice(0, idx + 1).map((st) => st.iter);
        B.sum.exprEl.textContent = `Pass ${idx + 1} (i = ${step.iter}): +${step.iter} blocks → ${fmtNum(step.total)} total`;
        B.sum.stageEl.innerHTML = buildStaircaseHTML(cols, cols.length - 1, { maxVal: n });
        if (idx === sumRes.steps.length - 1) setStatusBadge(B.sum.badgeEl, `${fmtNum(sumRes.value)} blocks`, 'is-complete');
      });
    }

    const showLeveled = () => {
      const cols = avgRes.steps.map((st) => st.iter);
      B.avg.exprEl.textContent = `Leveled all ${n} columns to equal height = ${avgRes.value.toFixed(2)}`;
      setStatusBadge(B.avg.badgeEl, `Avg: ${avgRes.value.toFixed(2)}`, 'is-complete');
      B.avg.stageEl.innerHTML = buildStaircaseHTML(cols, -1, { leveledAvg: avgRes.value, maxVal: n });
    };
    if (avgRes.steps.length === 0) {
      B.avg.exprEl.textContent = '0 columns accumulated • Guarded division → Average = 0.00';
      setStatusBadge(B.avg.badgeEl, 'Avg: 0.00', 'is-complete');
      B.avg.stageEl.innerHTML = '<span class="builder-empty-note">No columns to level when n = 0 (0.00).</span>';
    } else if (delayMs === 0) {
      showLeveled();
    } else {
      setStatusBadge(B.avg.badgeEl, 'Accumulating...', 'is-running');
      animate(avgRes.steps, (step, idx) => {
        const cols = avgRes.steps.slice(0, idx + 1).map((st) => st.iter);
        B.avg.exprEl.textContent = `Pass ${step.iter}: sum ${fmtNum(step.total)} ÷ ${step.iter} = ${step.avg.toFixed(2)}`;
        B.avg.stageEl.innerHTML = buildStaircaseHTML(cols, cols.length - 1, { maxVal: n });
      });
      activeTimers.push(window.setTimeout(showLeveled, pickFrames(avgRes.steps.length).length * delayMs + 180));
    }
  };

  const executeAllLoopVisualizers = (n, log = true) => {
    clearAnimations();
    const delayMs = Number(speedSelect.value);
    const tapeFact = computeTapeFactorial(n);
    const tapeSum = computeTapeSum(n);
    const tapeAvg = computeTapeAverage(n);

    renderTapeLoop('fact', tapeFact, delayMs);
    renderTapeLoop('sum', tapeSum, delayMs);
    renderTapeLoop('avg', tapeAvg, delayMs);

    renderFlowchartLoop('fact', computeFlowFactorial(n), delayMs);
    renderFlowchartLoop('sum', computeFlowSum(n), delayMs);
    renderFlowchartLoop('avg', computeFlowAverage(n), delayMs);

    renderBlockBuilderLoops(n, delayMs);
    if (log) {
      logScratchpad('Looping', `n=${n} → n!=${fmtNum(tapeFact.value)}, Sum=${fmtNum(tapeSum.value)}, Avg=${tapeAvg.value.toFixed(2)}`, () => {
        input.value = String(n);
        clearError(error);
        lastValidN = n;
        replayBtn.disabled = false;
        executeAllLoopVisualizers(n, false);
      });
    }
  };

  $('loop-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = input.value.trim();
    const n = Number(raw);
    if (raw === '' || !Number.isInteger(n) || n < 0 || n > 170) {
      setError(error, 'Please enter a whole number from 0 to 170.');
      lastValidN = null;
      replayBtn.disabled = true;
      resetAllVisualizers();
      return;
    }
    clearError(error);
    lastValidN = n;
    replayBtn.disabled = false;
    executeAllLoopVisualizers(n);
  });

  replayBtn.addEventListener('click', () => {
    if (lastValidN !== null) executeAllLoopVisualizers(lastValidN, false);
  });

  syncViewVisibility();
};

/* 5. Payroll System */
const initPayroll = () => {
  const form = $('pay-form');
  const nameEl = $('pay-name');
  const daysEl = $('pay-days');
  const rateEl = $('pay-rate');
  const deductEl = $('pay-deduct');
  const tbody = $('pay-tbody');
  const error = $('pay-error');
  let payrollList = [];
  let nextId = 1;

  const renderRow = (emp, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHTML(emp.name)}</td>
      <td>${emp.days}</td>
      <td>${formatPHP(emp.rate)}</td>
      <td>${formatPHP(emp.grossPay)}</td>
      <td>${formatPHP(emp.deduction)}</td>
      <td>${formatPHP(emp.netPay)}</td>
      <td><button type="button" class="btn-danger delete-row-btn" data-id="${emp.id}">Delete</button></td>
    </tr>`;

  const sumBy = (key) => payrollList.reduce((acc, emp) => acc + emp[key], 0);

  const renderPayroll = () => {
    tbody.innerHTML = payrollList.length
      ? payrollList.map(renderRow).join('')
      : '<tr><td colspan="8">No employee records added yet.</td></tr>';
    $('pay-total-gross').textContent = formatPHP(sumBy('grossPay'));
    $('pay-total-deduct').textContent = formatPHP(sumBy('deduction'));
    $('pay-total-net').textContent = formatPHP(sumBy('netPay'));
  };

  const pushEmployee = ({ name, days, rate, deduction }) => {
    const grossPay = days * rate;
    payrollList.push({ id: nextId++, name, days, rate, grossPay, deduction, netPay: grossPay - deduction });
  };

  $('pay-sample-btn').addEventListener('click', () => {
    [
      { name: 'Maria Santos', days: 22, rate: 700, deduction: 1500 },
      { name: 'Juan Dela Cruz', days: 15, rate: 650, deduction: 0 },
      { name: 'Ana Reyes', days: 26, rate: 820, deduction: 2150 },
    ].forEach(pushEmployee);
    clearError(error);
    renderPayroll();
    logScratchpad('Payroll', 'Loaded 3 sample employees');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameEl.value.trim();
    const days = Number(daysEl.value);
    const rate = Number(rateEl.value);
    const deduction = Number(deductEl.value);
    const grossPay = days * rate;

    if (!name) return setError(error, 'Employee name is required.');
    if (!Number.isFinite(days) || days <= 0) return setError(error, 'Days worked must be greater than 0.');
    if (!Number.isFinite(rate) || rate <= 0) return setError(error, 'Daily rate must be greater than 0.');
    if (!Number.isFinite(deduction) || deduction < 0) return setError(error, 'Deduction cannot be negative.');
    if (deduction > grossPay) return setError(error, 'Deduction cannot exceed gross pay.');

    clearError(error);
    const netPay = grossPay - deduction;
    pushEmployee({ name, days, rate, deduction });
    logScratchpad('Payroll', `${name}: Net ${formatPHP(netPay)}`, () => {
      nameEl.value = name;
      daysEl.value = String(days);
      rateEl.value = String(rate);
      deductEl.value = String(deduction);
    });
    form.reset();
    deductEl.value = '0';
    renderPayroll();
  });

  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('.delete-row-btn[data-id]');
    if (!btn) return;
    payrollList = payrollList.filter((emp) => emp.id !== Number(btn.dataset.id));
    renderPayroll();
  });

  $('pay-clear-btn').addEventListener('click', () => {
    if (payrollList.length && window.confirm('Clear all employee records?')) {
      payrollList = [];
      clearError(error);
      renderPayroll();
    }
  });


  renderPayroll();
};

/* Context-aware quick constants */
const QUICK_CONSTANTS = {
  'sec-conversion': { title: 'Conversion factors', items: [
    ['1 in', '2.54 cm'], ['1 mi', '1.609344 km'], ['1 lb', '0.45359237 kg'], ['1 US gal', '3.785411784 L'],
    ['1 kB / 1 KiB', '1,000 / 1,024 B'], ['°F', '°C × 1.8 + 32']] },
  'sec-tax': { title: 'Tax notes', items: [
    ['Exempt up to', '₱250,000/yr'], ['Next bracket', '20% over ₱250,000'], ['Top bracket', '35% over ₱8,000,000'], ['Monthly input', '× 12 = annual']] },
  'sec-looping': { title: 'Loop notes', items: [
    ['0!', '1'], ['Max safe n', '170 (171! overflows)'], ['Sum 0..n', 'n(n + 1) / 2'], ['Average 1..n', '(n + 1) / 2']] },
  'sec-payroll': { title: 'Payroll notes', items: [
    ['Gross pay', 'days × daily rate'], ['Net pay', 'gross − deductions'], ['Hourly rate', 'daily ÷ 8 hours'], ['Deductions', 'cannot exceed gross']] },
};

const renderQuickConstants = (tabId) => {
  const data = QUICK_CONSTANTS[tabId];
  const list = $('qc-list');
  if (!data || !list) return;
  $('qc-title').textContent = data.title;
  list.innerHTML = data.items
    .map(([k, v]) => `<li><span>${escapeHTML(k)}</span><strong class="qc-val">${escapeHTML(v)}</strong></li>`)
    .join('');
};

/* Theme system: light / dark / system / custom */
const THEME_KEY = 'qr-theme';
const CUSTOM_KEY = 'qr-theme-custom';
const ADDU_DEFAULT = { primary: '#0033A0', page: '#F8FAFC', card: '#FFFFFF' };
const CUSTOM_VAR_NAMES = ['--primary', '--primary-mid', '--on-primary', '--primary-dark', '--accent-text', '--primary-light', '--tint-2',
  '--tint-border', '--visited', '--bg-page', '--bg-card', '--bg-surface', '--text-main', '--text-muted', '--border-subtle', '--border-color'];

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbToHex = (c) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mixHex = (a, b, t) => { const x = hexToRgb(a); const y = hexToRgb(b); return rgbToHex(x.map((v, i) => v * (1 - t) + y[i] * t)); };
const lum = (h) => {
  const [r, g, b] = hexToRgb(h).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const la = lum(a); const lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
const readableOn = (bg) => (contrast('#0F172A', bg) >= contrast('#FFFFFF', bg) ? '#0F172A' : '#FFFFFF');
const isHex = (v) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

const customVars = ({ primary, page, card }) => {
  const ink = ['#0F172A', '#F1F5F9']
    .map((c) => [c, Math.min(contrast(c, page), contrast(c, card))])
    .sort((a, b) => b[1] - a[1])[0][0];
  let accent = primary;
  for (let i = 0; i < 12 && contrast(accent, card) < 4.5; i++) accent = mixHex(accent, ink, 0.15);
  return {
    '--primary': primary, '--primary-mid': primary, '--on-primary': readableOn(primary),
    '--primary-dark': lum(primary) < 0.08 ? mixHex(primary, '#FFFFFF', 0.18) : mixHex(primary, '#000000', 0.2),
    '--accent-text': accent,
    '--primary-light': mixHex(card, primary, 0.1), '--tint-2': mixHex(card, primary, 0.2),
    '--tint-border': mixHex(card, primary, 0.4), '--visited': mixHex(card, primary, 0.6),
    '--bg-page': page, '--bg-card': card, '--bg-surface': mixHex(page, ink, 0.05),
    '--text-main': ink, '--text-muted': mixHex(ink, page, 0.3),
    '--border-subtle': mixHex(card, ink, 0.12), '--border-color': mixHex(card, ink, 0.24),
  };
};

const initTheme = () => {
  const root = document.documentElement;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };
  let mode = store.get(THEME_KEY);
  if (!['light', 'dark', 'system', 'custom'].includes(mode)) mode = 'light';
  let custom = { ...ADDU_DEFAULT };
  try {
    const saved = JSON.parse(store.get(CUSTOM_KEY) || 'null');
    if (saved) Object.keys(custom).forEach((k) => { if (isHex(saved[k])) custom[k] = saved[k]; });
  } catch { /* ignore bad JSON */ }

  const btn = $('theme-btn');
  const panel = $('theme-panel');
  const customBox = $('theme-custom');
  const inputs = { primary: $('theme-primary'), page: $('theme-page'), card: $('theme-card') };
  const meta = document.querySelector('meta[name="theme-color"]');
  const modeBtns = document.querySelectorAll('[data-theme-mode]');

  const apply = () => {
    CUSTOM_VAR_NAMES.forEach((n) => root.style.removeProperty(n));
    let resolved = mode;
    if (mode === 'system') resolved = mq.matches ? 'dark' : 'light';
    if (mode === 'custom') {
      resolved = lum(custom.page) < 0.25 ? 'dark' : 'light';
      Object.entries(customVars(custom)).forEach(([k, v]) => root.style.setProperty(k, v));
    }
    root.dataset.theme = resolved;
    root.dataset.themeMode = mode;
    root.style.colorScheme = resolved;
    if (meta) meta.content = getComputedStyle(root).getPropertyValue('--primary').trim() || '#0033A0';
    modeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themeMode === mode)));
    customBox.hidden = mode !== 'custom';
    Object.entries(inputs).forEach(([k, el]) => { el.value = custom[k]; });
  };

  const setOpen = (open) => {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  };

  btn.addEventListener('click', () => setOpen(panel.hidden));
  document.addEventListener('click', (e) => { if (!panel.hidden && !e.target.closest('.theme-menu, .theme-panel')) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { setOpen(false); btn.focus(); } });

  modeBtns.forEach((b) => b.addEventListener('click', () => {
    mode = b.dataset.themeMode;
    store.set(THEME_KEY, mode);
    apply();
  }));

  Object.entries(inputs).forEach(([k, el]) => el.addEventListener('input', () => {
    custom[k] = el.value;
    store.set(CUSTOM_KEY, JSON.stringify(custom));
    mode = 'custom';
    store.set(THEME_KEY, mode);
    apply();
  }));

  $('theme-reset').addEventListener('click', () => {
    custom = { ...ADDU_DEFAULT };
    mode = 'light';
    store.set(CUSTOM_KEY, JSON.stringify(custom));
    store.set(THEME_KEY, mode);
    apply();
  });

  mq.addEventListener('change', () => { if (mode === 'system') apply(); });
  apply();
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigationAndShell();
  const updateHeroFx = initHeroPreview();
  initConverter(updateHeroFx);
  initTax();
  initLooping();
  initPayroll();
});

