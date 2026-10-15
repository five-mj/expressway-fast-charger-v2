(() => {
  const status = document.getElementById('shareStatus');
  let toastTimer;
  let activeButton;
  function showStatus(message, persistent = false, unsupported = false) {
    clearTimeout(toastTimer);
    status.textContent = message;
    status.classList.toggle('is-expanded', false);
    status.classList.toggle('is-unsupported', unsupported);
    const anchor = unsupported ? activeButton.closest('.route-share-buttons') : activeButton.parentElement;
    anchor.appendChild(status);
    status.style.marginLeft = '0px';
    const screen = activeButton.closest('.figma-screen');
    if (screen && message !== '링크 복사 성공!') {
      const bounds = screen.getBoundingClientRect();
      const scale = bounds.width / screen.offsetWidth;
      const bubble = status.getBoundingClientRect();
      const inset = 10 * scale;
      const shift = Math.max(bounds.left + inset - bubble.left, Math.min(0, bounds.right - inset - bubble.right));
      status.style.marginLeft = `${shift / scale}px`;
    }
    status.classList.add('is-visible');
    if (!persistent) toastTimer = setTimeout(() => status.classList.remove('is-visible'), 1000);
  }
  const incoming = new URLSearchParams(location.search);
  const origin = incoming.get('origin');
  const destination = incoming.get('destination');
  if (origin && getOriginOptions().includes(origin) && (destination || incoming.get('view') === 'result')) {
    state.origin = origin;
    state.destination = getDestinationOptions(origin).includes(destination) ? destination : '';
    refreshMenus();
    render();
    showMap();
  }
  function shareUrl() {
    const url = new URL(location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('origin', state.origin);
    if (state.destination) url.searchParams.set('destination', state.destination);
    else url.searchParams.set('view', 'result');
    return url.href;
  }
  async function copy(url, message) {
    try {
      await navigator.clipboard.writeText(url);
      showStatus(message);
    } catch {
      showStatus('다시 시도해주세요.');
    }
  }
  document.querySelectorAll('[data-share]').forEach(button => {
    button.addEventListener('click', async () => {
      activeButton = button;
      const url = shareUrl();
      const title = state.destination ? `${state.origin} → ${state.destination} 최저가 급속 충전소` : `${state.origin} → 도착지 선택`;
      const previewUrl = new URL(`/share/${encodeURIComponent(state.origin)}-${encodeURIComponent(state.destination || '도착지선택')}.html`, location.origin).href;
      clearTimeout(toastTimer);
      status.classList.remove('is-visible');
      try {
      switch (button.dataset.share) {
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(previewUrl)}`, '_blank', 'noopener,noreferrer');
          break;
        case 'x':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(previewUrl)}`, '_blank', 'noopener,noreferrer');
          break;
        case 'kakao':
          // Native sharing needs no Kakao app key. Desktop fallback is explicit.
          if (navigator.share) {
            try {
              await navigator.share({title, url});
            } catch (error) {
              if (error.name !== 'AbortError') showStatus('다시 시도해주세요.');
            }
          } else showStatus('이 브라우저에서는 공유창을 지원하지 않습니다.\n링크 복사를 이용해주세요.', false, true);
          break;
        default:
          await copy(url, '링크 복사 성공!');
      }
      } catch (error) {
        if (error.name !== 'AbortError') showStatus('다시 시도해주세요.');
      }
    });
  });
})();

