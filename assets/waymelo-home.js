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
    const isReviewTrack = track.classList.contains('wm-review-grid');

    const pagination = document.createElement('div');
    pagination.className = 'wm-swipe-pagination';
    pagination.hidden = true;
    pagination.setAttribute('aria-label', `${track.getAttribute('aria-label') || 'Carousel'} pagination`);
    track.insertAdjacentElement('afterend', pagination);

    let dots = [];
    let positions = [];

    const getPositions = () => {
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      if (!isReviewTrack) {
        return items.map((item, index) => (items.length > 1 ? (maxScroll * index) / (items.length - 1) : 0));
      }

      const styles = window.getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
      const itemWidth = items[0].getBoundingClientRect().width;
      const visibleCount = Math.max(1, Math.floor((track.clientWidth + gap + 1) / (itemWidth + gap)));
      const pageCount = Math.ceil(items.length / visibleCount);

      return Array.from({ length: pageCount }, (unused, pageIndex) => {
        const itemIndex = Math.min(pageIndex * visibleCount, items.length - 1);
        return Math.min(maxScroll, items[itemIndex].offsetLeft - items[0].offsetLeft);
      });
    };

    const renderDots = () => {
      pagination.replaceChildren();
      dots = positions.map((position, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = `wm-swipe-pagination__dot${index === 0 ? ' is-active' : ''}`;
        dot.setAttribute('aria-label', `Go to page ${index + 1}`);
        dot.setAttribute('aria-pressed', String(index === 0));
        dot.addEventListener('click', () => {
          const currentPositions = getPositions();
          track.scrollTo({ left: currentPositions[index] || 0, behavior: reducedMotion ? 'auto' : 'smooth' });
        });
        pagination.appendChild(dot);
        return dot;
      });
    };

    let frame;
    const updatePagination = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
        const nextPositions = getPositions();
        if (nextPositions.length !== positions.length) {
          positions = nextPositions;
          renderDots();
        } else {
          positions = nextPositions;
        }

        pagination.hidden = maxScroll <= 1 || positions.length <= 1;
        const activeIndex = positions.reduce((closestIndex, position, index) => {
          return Math.abs(track.scrollLeft - position) < Math.abs(track.scrollLeft - positions[closestIndex])
            ? index
            : closestIndex;
        }, 0);

        dots.forEach((dot, index) => {
          const active = index === activeIndex;
          dot.classList.toggle('is-active', active);
          dot.setAttribute('aria-pressed', String(active));
        });
      });
    };

    track.addEventListener('scroll', updatePagination, { passive: true });
    window.addEventListener('resize', updatePagination, { passive: true });

    if (isReviewTrack) {
      let pointerId;
      let startX = 0;
      let startScroll = 0;

      const stopDragging = () => {
        if (pointerId === undefined) return;
        const releasedPointerId = pointerId;
        pointerId = undefined;
        if (track.hasPointerCapture(releasedPointerId)) track.releasePointerCapture(releasedPointerId);
        track.classList.remove('is-dragging');

        window.requestAnimationFrame(() => {
          const currentPositions = getPositions();
          const nearestPosition = currentPositions.reduce((closest, position) => {
            return Math.abs(track.scrollLeft - position) < Math.abs(track.scrollLeft - closest) ? position : closest;
          }, currentPositions[0] || 0);

          track.scrollTo({ left: nearestPosition, behavior: reducedMotion ? 'auto' : 'smooth' });
          updatePagination();
        });
      };

      track.addEventListener('pointerdown', (event) => {
        if (event.button !== 0 || event.target.closest('a, button, input, select, textarea, video')) return;
        pointerId = event.pointerId;
        startX = event.clientX;
        startScroll = track.scrollLeft;
        track.setPointerCapture(pointerId);
        track.classList.add('is-dragging');
      });

      track.addEventListener('pointermove', (event) => {
        if (event.pointerId !== pointerId) return;
        track.scrollLeft = startScroll - (event.clientX - startX);
        event.preventDefault();
      });

      track.addEventListener('pointerup', stopDragging);
      track.addEventListener('pointercancel', stopDragging);
      track.addEventListener('lostpointercapture', stopDragging);
    }

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
