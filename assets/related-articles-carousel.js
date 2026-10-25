(() => {
  const initializeCarousel = (section) => {
    if (!section || section.dataset.carouselInitialized === 'true') return;

    const track = section.querySelector('.waymelo-related-articles__viewport');
    const pagination = section.querySelector('[data-related-pagination]');
    if (!track || !pagination) return;

    const cards = Array.from(track.querySelectorAll('.waymelo-blog-card'));
    if (cards.length < 2) return;

    const dots = cards.map((card, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'waymelo-related-articles__dot';
      dot.setAttribute('aria-label', `Go to related article ${index + 1}`);
      dot.setAttribute('aria-current', index === 0 ? 'true' : 'false');
      dot.addEventListener('click', () => {
        card.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'nearest',
          inline: 'start'
        });
      });
      pagination.appendChild(dot);
      return dot;
    });

    let frameId;
    const updateActiveDot = () => {
      frameId = undefined;
      const trackLeft = track.getBoundingClientRect().left;
      let activeIndex = 0;
      let smallestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const distance = Math.abs(card.getBoundingClientRect().left - trackLeft);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          activeIndex = index;
        }
      });

      dots.forEach((dot, index) => dot.setAttribute('aria-current', index === activeIndex ? 'true' : 'false'));
    };

    track.addEventListener('scroll', () => {
      if (frameId) return;
      frameId = requestAnimationFrame(updateActiveDot);
    }, { passive: true });
    window.addEventListener('resize', updateActiveDot, { passive: true });

    section.dataset.carouselInitialized = 'true';
  };

  const initializeAll = (scope = document) => {
    scope.querySelectorAll('.waymelo-related-articles').forEach(initializeCarousel);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeAll());
  } else {
    initializeAll();
  }

  document.addEventListener('shopify:section:load', (event) => initializeAll(event.target));
})();
