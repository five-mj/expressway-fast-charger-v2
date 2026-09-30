(() => {
  const status = document.getElementById('shareStatus');
  const incoming = new URLSearchParams(location.search);
  const origin = incoming.get('origin');
  const destination = incoming.get('destination');
  if (origin && destination && getDestinationOptions(origin).includes(destination)) {
    state.origin = origin;
    state.destination = destination;
    refreshMenus();
    render();
    showMap();
  }
  function shareUrl() {
    const url = new URL(location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('origin', state.origin);
    url.searchParams.set('destination', state.destination);
    return url.href;
  }
  async function copy(url, message) {
    try {
      await navigator.clipboard.writeText(url);
      status.textContent = message;
    } catch {
      status.textContent = '아래 링크를 복사해주세요.';
      const input = document.createElement('input');
      input.value = url;
      input.readOnly = true;
      input.setAttribute('aria-label', '공유 링크');
      status.append(input);
      input.select();
    }
  }
  document.querySelectorAll('[data-share]').forEach(button => {
    button.addEventListener('click', async () => {
      const url = shareUrl();
      const title = `${state.origin} → ${state.destination} 최저가 급속 충전소`;
      status.textContent = '';
      switch (button.dataset.share) {
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
          break;
        case 'x':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
          break;
        case 'kakao':
          // Native sharing needs no Kakao app key. Desktop fallback is explicit.
          if (navigator.share) {
            try {
              await navigator.share({title, url});
            } catch (error) {
              if (error.name !== 'AbortError') await copy(url, '링크를 복사했어요. 카카오톡에 붙여넣어주세요.');
            }
          } else await copy(url, '링크를 복사했어요. 카카오톡에 붙여넣어주세요.');
          break;
        default:
          await copy(url, '선택한 경로의 링크를 복사했어요.');
      }
    });
  });
})();
