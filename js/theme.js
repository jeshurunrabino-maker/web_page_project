const THEME_STORAGE_KEY = 'qr-theme';
const CUSTOM_THEME_STORAGE_KEY = 'qr-theme-custom';
const VALID_THEME_MODES = ['light', 'dark', 'system', 'custom'];

const DEFAULT_THEME_COLORS = {
  primary: '#0033A0',
  page: '#F8FAFC',
  card: '#FFFFFF',
};

const CUSTOM_CSS_VARIABLES = [
  '--primary', '--primary-mid', '--on-primary', '--primary-dark',
  '--accent-text', '--primary-light', '--tint-2', '--tint-border',
  '--visited', '--bg-page', '--bg-card', '--bg-surface',
  '--text-main', '--text-muted', '--border-subtle', '--border-color',
];

const parseHexColor = (hexColor) => [
  parseInt(hexColor.slice(1, 3), 16),
  parseInt(hexColor.slice(3, 5), 16),
  parseInt(hexColor.slice(5, 7), 16),
];

const formatHexColor = (rgbChannels) => {
  const hexChannels = rgbChannels.map((channel) => {
    const clamped = Math.round(Math.max(0, Math.min(255, channel)));
    return clamped.toString(16).padStart(2, '0');
  });
  return `#${hexChannels.join('')}`;
};

const blendHexColors = (startHex, endHex, weight) => {
  const startRgb = parseHexColor(startHex);
  const endRgb = parseHexColor(endHex);
  const blendedRgb = startRgb.map((channel, index) => (channel * (1 - weight)) + (endRgb[index] * weight));
  return formatHexColor(blendedRgb);
};

const calculateRelativeLuminance = (hexColor) => {
  const [red, green, blue] = parseHexColor(hexColor).map((channel) => {
    const sRgb = channel / 255;
    return sRgb <= 0.03928 ? sRgb / 12.92 : ((sRgb + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
};

const calculateContrastRatio = (firstHex, secondHex) => {
  const firstLuminance = calculateRelativeLuminance(firstHex);
  const secondLuminance = calculateRelativeLuminance(secondHex);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
};

const selectReadableInkColor = (backgroundHex) => {
  const darkInkContrast = calculateContrastRatio('#0F172A', backgroundHex);
  const lightInkContrast = calculateContrastRatio('#FFFFFF', backgroundHex);
  return darkInkContrast >= lightInkContrast ? '#0F172A' : '#FFFFFF';
};

const isValidHexColor = (candidate) =>
  typeof candidate === 'string' && /^#[0-9a-f]{6}$/i.test(candidate);

// Iteratively shifts custom accent colors toward the active ink until WCAG AA (4.5:1) contrast is met.
const ensureAccessibleAccent = (primaryHex, cardHex, inkHex) => {
  let accessibleAccent = primaryHex;
  for (let step = 0; step < 12 && calculateContrastRatio(accessibleAccent, cardHex) < 4.5; step++) {
    accessibleAccent = blendHexColors(accessibleAccent, inkHex, 0.15);
  }
  return accessibleAccent;
};

const buildCustomThemeVariables = ({ primary, page, card }) => {
  const darkInkMinContrast = Math.min(calculateContrastRatio('#0F172A', page), calculateContrastRatio('#0F172A', card));
  const lightInkMinContrast = Math.min(calculateContrastRatio('#F1F5F9', page), calculateContrastRatio('#F1F5F9', card));
  const textInk = darkInkMinContrast >= lightInkMinContrast ? '#0F172A' : '#F1F5F9';

  const primaryHover = calculateRelativeLuminance(primary) < 0.08
    ? blendHexColors(primary, '#FFFFFF', 0.18)
    : blendHexColors(primary, '#000000', 0.2);

  return {
    '--primary': primary,
    '--primary-mid': primary,
    '--on-primary': selectReadableInkColor(primary),
    '--primary-dark': primaryHover,
    '--accent-text': ensureAccessibleAccent(primary, card, textInk),
    '--primary-light': blendHexColors(card, primary, 0.1),
    '--tint-2': blendHexColors(card, primary, 0.2),
    '--tint-border': blendHexColors(card, primary, 0.4),
    '--visited': blendHexColors(card, primary, 0.6),
    '--bg-page': page,
    '--bg-card': card,
    '--bg-surface': blendHexColors(page, textInk, 0.05),
    '--text-main': textInk,
    '--text-muted': blendHexColors(textInk, page, 0.3),
    '--border-subtle': blendHexColors(card, textInk, 0.12),
    '--border-color': blendHexColors(card, textInk, 0.24),
  };
};

const themeStorage = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage failures when private browsing blocks persistence
    }
  },
};

const loadSavedCustomColors = () => {
  const colors = { ...DEFAULT_THEME_COLORS };
  try {
    const parsedColors = JSON.parse(themeStorage.get(CUSTOM_THEME_STORAGE_KEY) || 'null');
    if (!parsedColors) return colors;

    Object.keys(colors).forEach((colorKey) => {
      if (isValidHexColor(parsedColors[colorKey])) {
        colors[colorKey] = parsedColors[colorKey];
      }
    });
  } catch {
    // Fall back to default colors if stored JSON is malformed
  }
  return colors;
};

const initTheme = () => {
  const rootElement = document.documentElement;
  const darkSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const savedMode = themeStorage.get(THEME_STORAGE_KEY);
  let activeMode = VALID_THEME_MODES.includes(savedMode) ? savedMode : 'light';
  let customColors = loadSavedCustomColors();

  const themeToggleButton = getById('theme-btn');
  const themePanel = getById('theme-panel');
  const customPickerGroup = getById('theme-custom');
  const colorInputs = {
    primary: getById('theme-primary'),
    page: getById('theme-page'),
    card: getById('theme-card'),
  };
  const themeColorMetaTag = document.querySelector('meta[name="theme-color"]');
  const modeButtons = document.querySelectorAll('[data-theme-mode]');

  const applyTheme = () => {
    CUSTOM_CSS_VARIABLES.forEach((variableName) => rootElement.style.removeProperty(variableName));

    let resolvedTheme = activeMode;
    if (activeMode === 'system') {
      resolvedTheme = darkSchemeQuery.matches ? 'dark' : 'light';
    } else if (activeMode === 'custom') {
      resolvedTheme = calculateRelativeLuminance(customColors.page) < 0.25 ? 'dark' : 'light';
      Object.entries(buildCustomThemeVariables(customColors)).forEach(([variableName, value]) => {
        rootElement.style.setProperty(variableName, value);
      });
    }

    rootElement.dataset.theme = resolvedTheme;
    rootElement.dataset.themeMode = activeMode;
    rootElement.style.colorScheme = resolvedTheme;

    if (themeColorMetaTag) {
      const computedPrimary = getComputedStyle(rootElement).getPropertyValue('--primary').trim();
      themeColorMetaTag.content = computedPrimary || DEFAULT_THEME_COLORS.primary;
    }

    modeButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.themeMode === activeMode));
    });

    customPickerGroup.hidden = activeMode !== 'custom';
    Object.entries(colorInputs).forEach(([colorKey, inputElement]) => {
      inputElement.value = customColors[colorKey];
    });
  };

  const setPanelOpen = (isOpen) => {
    themePanel.hidden = !isOpen;
    themeToggleButton.setAttribute('aria-expanded', String(isOpen));
  };

  themeToggleButton.addEventListener('click', () => {
    setPanelOpen(themePanel.hidden);
  });

  document.addEventListener('click', (event) => {
    if (themePanel.hidden) return;
    if (!event.target.closest('.theme-menu, .theme-panel')) {
      setPanelOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !themePanel.hidden) {
      setPanelOpen(false);
      themeToggleButton.focus();
    }
  });

  modeButtons.forEach((modeButton) => {
    modeButton.addEventListener('click', () => {
      activeMode = modeButton.dataset.themeMode;
      themeStorage.set(THEME_STORAGE_KEY, activeMode);
      applyTheme();
    });
  });

  Object.entries(colorInputs).forEach(([colorKey, inputElement]) => {
    inputElement.addEventListener('input', () => {
      customColors[colorKey] = inputElement.value;
      activeMode = 'custom';
      themeStorage.set(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(customColors));
      themeStorage.set(THEME_STORAGE_KEY, activeMode);
      applyTheme();
    });
  });

  getById('theme-reset').addEventListener('click', () => {
    customColors = { ...DEFAULT_THEME_COLORS };
    activeMode = 'light';
    themeStorage.set(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(customColors));
    themeStorage.set(THEME_STORAGE_KEY, activeMode);
    applyTheme();
  });

  darkSchemeQuery.addEventListener('change', () => {
    if (activeMode === 'system') applyTheme();
  });

  applyTheme();
};