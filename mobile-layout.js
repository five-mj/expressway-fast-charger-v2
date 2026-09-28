// Keep the original 375 x 812 artwork coordinates, including map pins.
// A numeric scale also works in browsers without CSS length division.
(() => {
  const viewport = document.querySelector('.screen-viewport');
  const mobile = window.matchMedia('(max-width: 767.98px)');

  function updateMobileLayout() {
    if (mobile.matches) {
      viewport.style.setProperty('--mobile-scale', document.documentElement.clientWidth / 375);
    } else {
      viewport.style.removeProperty('--mobile-scale');
    }
  }

  updateMobileLayout();
  window.addEventListener('resize', updateMobileLayout);
  // Desktop-style scrollbars can change the usable width without a resize.
  new ResizeObserver(updateMobileLayout).observe(document.documentElement);
})();
