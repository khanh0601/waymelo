/**
 * Selleasy Bundle Draggable & Swipeable Carousel
 * Enables smooth drag-to-scroll on Desktop and touch swipe on Mobile
 * No hand cursor (standard cursor preserved)
 */
(function() {
  function initDraggableBundle() {
    const selector = '.lb-bundle-offers, [class*="lb-bundle-offers"], .lb-bundle-products-cont, .lb-bundle-products, .lb-addon-cont';
    const containers = document.querySelectorAll(selector);

    containers.forEach(container => {
      if (container.dataset.dragInit === 'true') return;
      container.dataset.dragInit = 'true';

      let isDown = false;
      let startX = 0;
      let startY = 0;
      let initialScrollLeft = 0;
      let isDragging = false;
      let preventClick = false;

      // Prevent native HTML5 image/text drag-and-drop
      container.addEventListener('dragstart', (e) => {
        e.preventDefault();
      });

      // Pointer event handlers (Desktop mouse + Touchscreen)
      container.addEventListener('pointerdown', (e) => {
        // Do not intercept interactive form elements, checkboxes, selects, or buttons
        if (e.target.closest('select, option, input, label, button, a, .lb-checkbox-cont, .lb-custom-checkbox, .lb-card-checkbox-cont, [role="button"]')) {
          return;
        }

        isDown = true;
        isDragging = false;
        preventClick = false;
        startX = e.clientX;
        startY = e.clientY;
        initialScrollLeft = container.scrollLeft;

        // Disable smooth scroll during drag to prevent animation fighting
        container.style.scrollBehavior = 'auto';

        if (e.pointerType === 'mouse') {
          e.preventDefault();
        }

        try {
          container.setPointerCapture(e.pointerId);
        } catch (err) {}
      });

      container.addEventListener('pointermove', (e) => {
        if (!isDown) return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // Distinguish intentional horizontal drag from vertical page scroll
        if (!isDragging && Math.abs(deltaX) > 4) {
          isDragging = true;
          preventClick = true;
          container.classList.add('is-dragging');
        }

        if (isDragging) {
          container.scrollLeft = initialScrollLeft - deltaX;
          e.preventDefault();
        }
      });

      function endDrag(e) {
        if (!isDown) return;
        isDown = false;

        try {
          container.releasePointerCapture(e.pointerId);
        } catch (err) {}

        container.classList.remove('is-dragging');
        container.style.scrollBehavior = '';

        if (isDragging) {
          setTimeout(() => {
            isDragging = false;
            preventClick = false;
          }, 60);
        }
      }

      container.addEventListener('pointerup', endDrag);
      container.addEventListener('pointercancel', endDrag);

      // Prevent triggering click on links/cards after dragging
      container.addEventListener('click', (e) => {
        if (preventClick || isDragging) {
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

  // Observe for dynamic insertion by Selleasy custom elements / async DOM updates
  const observer = new MutationObserver(() => {
    initDraggableBundle();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
