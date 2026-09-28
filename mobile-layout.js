// Preserve artwork coordinates; the main screen uses the Figma 375 x 892 frame.
// A numeric scale also works in browsers without CSS length division.
(() => {
  const viewport = document.querySelector('.screen-viewport');
  const mobile = window.matchMedia('(max-width: 767.98px)');

  function updateMobileLayout() {
    if (mobile.matches) {
      const scale = document.documentElement.clientWidth / 375;
      viewport.style.setProperty('--mobile-scale', scale);
      viewport.style.setProperty('--map-height', `${Math.max(892, window.innerHeight / scale)}px`);
    } else {
      viewport.style.removeProperty('--mobile-scale');
      viewport.style.removeProperty('--map-height');
    }
  }

  updateMobileLayout();
  window.addEventListener('resize', updateMobileLayout);
  // Desktop-style scrollbars can change the usable width without a resize.
  new ResizeObserver(updateMobileLayout).observe(document.documentElement);
})();
