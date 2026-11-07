/**
 * Selleasy Bundle Draggable & Swipeable Carousel
 * Enables smooth mouse drag-to-scroll on Desktop and enhanced touch swipe on Mobile
 */
(function() {
  function initDraggableBundle() {
    const containers = document.querySelectorAll('.lb-bundle-offers, [class*="lb-bundle-offers"]');
    containers.forEach(container => {
      if (container.dataset.dragInit === 'true') return;
      container.dataset.dragInit = 'true';

      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;
      let hasDragged = false;

      // Mouse drag handlers (Desktop)
      container.addEventListener('mousedown', (e) => {
        // Never hijack clicks on inputs, checkboxes, selects, or labels
        if (e.target.closest('select, option, input, label, .lb-checkbox-cont, .lb-custom-checkbox, .lb-card-checkbox-cont, button, a')) {
          return;
        }
        isDown = true;
        hasDragged = false;
        container.classList.add('is-dragging');
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
      });

      window.addEventListener('mouseup', () => {
        if (!isDown) return;
        isDown = false;
        container.classList.remove('is-dragging');
        setTimeout(() => {
          hasDragged = false;
        }, 50);
      });

      window.addEventListener('mouseleave', () => {
        if (!isDown) return;
        isDown = false;
        container.classList.remove('is-dragging');
        setTimeout(() => {
          hasDragged = false;
        }, 50);
      });

      container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 1.6;
        if (Math.abs(x - startX) > 5) {
          hasDragged = true;
          e.preventDefault();
        }
        container.scrollLeft = scrollLeft - walk;
      });

      // Prevent accidental clicks if the user was dragging
      container.addEventListener('click', (e) => {
        if (hasDragged) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDraggableBundle);
  } else {
    initDraggableBundle();
  }

  // Observe for dynamic insertion by Selleasy custom elements
  const observer = new MutationObserver(() => {
    initDraggableBundle();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
