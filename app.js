document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigationAndShell();
  const updateHeroFx = initHeroPreview();
  initConverter(updateHeroFx);
  initTax();
  initLooping();
  initPayroll();
});