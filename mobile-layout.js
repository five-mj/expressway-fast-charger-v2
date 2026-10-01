// Responsive policy is documented in README.md.
(() => {
  const viewport = document.querySelector('.screen-viewport');
  const narrow = matchMedia('(max-width: 767.98px)');
  const touch = matchMedia('(hover: none) and (pointer: coarse)');
  const MIN_SCALE = 0.85;

  function updateMobileLayout() {
    const responsive = narrow.matches || touch.matches;
    viewport.classList.toggle('responsive-screen', responsive);
    if (!responsive) {
      viewport.removeAttribute('data-layout');
      viewport.removeAttribute('style');
      return;
    }
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight;
    // Use viewport width for the breakpoint so scrollbar appearance cannot
    // repeatedly switch modes. Use usable width for the artwork itself.
    const fit = innerWidth >= 480 && innerWidth / height >= 0.6;
    const widthScale = width / 375;
    const scaleFor = baseHeight => fit
      ? Math.min(widthScale, Math.max(MIN_SCALE, height / baseHeight))
      : widthScale;
    const heroScale = scaleFor(812);
    const mapScale = scaleFor(1031);
    const mapHeight = fit ? 1031 : Math.max(1031, height / mapScale);
    viewport.dataset.layout = fit ? 'fit-height' : 'full-width';
    viewport.style.setProperty('--hero-scale', heroScale);
    viewport.style.setProperty('--map-scale', mapScale);
    viewport.style.setProperty('--map-height', `${mapHeight}px`);
    viewport.style.setProperty('--hero-flow-height', `${812 * heroScale}px`);
    viewport.style.setProperty('--map-flow-height', `${mapHeight * mapScale}px`);
  }
  updateMobileLayout();
  window.addEventListener('resize', updateMobileLayout);
  narrow.addEventListener('change', updateMobileLayout);
  touch.addEventListener('change', updateMobileLayout);
  new ResizeObserver(updateMobileLayout).observe(document.documentElement);
})();
