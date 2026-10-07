(() => {
  const status = document.getElementById('shareStatus');
  let toastTimer;
  function showStatus(message, persistent = false) {
    clearTimeout(toastTimer);
    status.textContent = message;
    status.classList.toggle('is-expanded', message !== '링크 복사 성공!' && message !== '다시 시도해주세요.');
    if (!status.classList.contains('is-expanded')) {
      status.style.setProperty('width', 'max-content', 'important');
      status.style.setProperty('padding', '7px 18px', 'important');
      status.style.setProperty('box-sizing', 'content-box', 'important');
    } else {
      status.style.removeProperty('width');
      status.style.removeProperty('padding');
      status.style.removeProperty('box-sizing');
    }
    status.classList.add('is-visible');
    if (!persistent) toastTimer = setTimeout(() => status.classList.remove('is-visible'), 1000);
  }
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
      showStatus(message);
    } catch {
      showStatus('다시 시도해주세요.');
    }
  }
  document.querySelectorAll('[data-share]').forEach(button => {
    button.addEventListener('click', async () => {
      const url = shareUrl();
      const title = `${state.origin} → ${state.destination} 최저가 급속 충전소`;
      clearTimeout(toastTimer);
      status.classList.remove('is-visible');
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
          await copy(url, '링크 복사 성공!');
      }
    });
  });
})();

