(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-wm-carousel]').forEach((carousel) => {
    const slides = [...carousel.querySelectorAll('[data-wm-slide]')];
    const dots = [...carousel.querySelectorAll('[data-wm-dot]')];
    const pauseButton = carousel.querySelector('[data-wm-pause]');
    const delay = Number(carousel.dataset.autoplayDelay) || 5000;
    let activeIndex = 0;
    let timer;
    let paused = reducedMotion;

    if (slides.length < 2) return;

    const showSlide = (index) => {
      activeIndex = index;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === index;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-pressed', String(active));
      });
    };

    const updatePauseButton = () => {
      if (!pauseButton) return;
      pauseButton.textContent = paused ? '▶' : 'Ⅱ';
      pauseButton.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
    };

    const start = () => {
      window.clearInterval(timer);
      updatePauseButton();
      if (!paused && !document.hidden) {
        timer = window.setInterval(() => showSlide((activeIndex + 1) % slides.length), delay);
      }
    };

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        showSlide(index);
        start();
      });
    });

    pauseButton?.addEventListener('click', () => {
      paused = !paused;
      start();
    });
    document.addEventListener('visibilitychange', start);
    showSlide(0);
    start();
  });

  document.querySelectorAll('[data-wm-video-button]').forEach((button) => {
    const card = button.closest('[data-wm-video-card]');
    const video = card?.querySelector('video');
    if (!video) return;

    button.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        button.textContent = 'Ⅱ';
        button.setAttribute('aria-label', 'Pause video');
      } else {
        video.pause();
        button.textContent = '▶';
        button.setAttribute('aria-label', 'Play video');
      }
    });
  });

  if (!reducedMotion) {
    document.querySelectorAll('[data-wm-faq-item]').forEach((item) => {
      const summary = item.querySelector('[data-wm-faq-summary]');
      const answer = item.querySelector('[data-wm-faq-answer]');
      let animation;

      if (!summary || !answer) return;

      summary.addEventListener('click', (event) => {
        event.preventDefault();
        animation?.cancel();

        const opening = !item.open;
        const startHeight = `${item.offsetHeight}px`;

        if (opening) item.open = true;

        const endHeight = opening ? `${item.scrollHeight}px` : `${summary.offsetHeight}px`;
        item.style.overflow = 'hidden';
        animation = item.animate(
          { height: [startHeight, endHeight] },
          { duration: 240, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
        );

        animation.onfinish = () => {
          item.open = opening;
          item.style.height = '';
          item.style.overflow = '';
          animation = undefined;
        };

        animation.oncancel = () => {
          item.style.height = '';
          item.style.overflow = '';
        };
      });
    });
  }

  document.querySelectorAll('[data-wm-swipe]').forEach((track) => {
    const items = [...track.children];
    if (items.length < 2) return;

    const pagination = document.createElement('div');
    pagination.className = 'wm-swipe-pagination';
    pagination.setAttribute('aria-label', `${track.getAttribute('aria-label') || 'Carousel'} pagination`);

    const dots = items.map((item, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `wm-swipe-pagination__dot${index === 0 ? ' is-active' : ''}`;
      dot.setAttribute('aria-label', `Go to item ${index + 1}`);
      dot.setAttribute('aria-pressed', String(index === 0));
      dot.addEventListener('click', () => {
        const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
        const left = items.length > 1 ? (maxScroll * index) / (items.length - 1) : 0;
        track.scrollTo({ left, behavior: reducedMotion ? 'auto' : 'smooth' });
      });
      pagination.appendChild(dot);
      return dot;
    });

    track.insertAdjacentElement('afterend', pagination);

    let frame;
    const updatePagination = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
        const progress = maxScroll > 0 ? track.scrollLeft / maxScroll : 0;
        const activeIndex = Math.min(items.length - 1, Math.round(progress * (items.length - 1)));

        dots.forEach((dot, index) => {
          const active = index === activeIndex;
          dot.classList.toggle('is-active', active);
          dot.setAttribute('aria-pressed', String(active));
        });
      });
    };

    track.addEventListener('scroll', updatePagination, { passive: true });
    window.addEventListener('resize', updatePagination, { passive: true });
    updatePagination();
  });

  document.querySelectorAll('[data-wm-gallery]').forEach((gallery) => {
    const dialog = gallery.querySelector('dialog');
    const dialogImage = dialog?.querySelector('img');
    if (!dialog || !dialogImage || typeof dialog.showModal !== 'function') return;

    gallery.querySelectorAll('[data-wm-gallery-image]').forEach((button) => {
      button.addEventListener('click', () => {
        dialogImage.src = button.dataset.wmGalleryImage;
        dialogImage.alt = button.dataset.wmGalleryAlt || '';
        dialog.showModal();
      });
    });

    dialog.querySelector('[data-wm-dialog-close]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
})();
