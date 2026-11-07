/**
 * Selleasy Bundle Draggable & Swipeable Carousel
 * - Smooth drag-to-scroll on Desktop and touch swipe on Mobile (no hand cursor)
 * - Safe pointer tracking: Only captures pointer and prevents click when deltaX > 6px (actual drag)
 * - Standard click on card image & title naturally triggers Selleasy Preview Popup
 */
(function() {
  'use strict';

  function initDraggableBundle() {
    const selector = '.lb-bundle-offers, [class*="lb-bundle-offers"], .lb-bundle-products-cont, .lb-bundle-products';
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
      let hasCaptured = false;

      // Prevent native HTML5 image/text drag-and-drop ghosting
      container.addEventListener('dragstart', (e) => {
        e.preventDefault();
      });

      // Pointer event handlers (Desktop mouse + Touchscreen)
      container.addEventListener('pointerdown', (e) => {
        // Do not intercept interactive form elements, checkboxes, selects, or buttons
        if (e.target.closest('select, option, input, label, button, a, .lb-checkbox-cont, .lb-custom-checkbox, .lb-card-checkbox-cont, .lb-cta-container, [role="button"]')) {
          return;
        }

        isDown = true;
        isDragging = false;
        preventClick = false;
        hasCaptured = false;
        startX = e.clientX;
        startY = e.clientY;
        initialScrollLeft = container.scrollLeft;

        // Note: Do NOT call e.preventDefault() here so that normal mouse clicks are preserved!
        // Note: Do NOT call setPointerCapture here so that click targets (img, title) receive the click!
      });

      container.addEventListener('pointermove', (e) => {
        if (!isDown) return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // Only start dragging if horizontal movement exceeds 6px
        if (!isDragging && Math.abs(deltaX) > 6 && Math.abs(deltaX) > Math.abs(deltaY)) {
          isDragging = true;
          preventClick = true;
          container.classList.add('is-dragging');
          container.style.scrollBehavior = 'auto';

          // Now capture pointer to ensure smooth drag tracking even outside container
          try {
            container.setPointerCapture(e.pointerId);
            hasCaptured = true;
          } catch (err) {}
        }

        if (isDragging) {
          container.scrollLeft = initialScrollLeft - deltaX;
          e.preventDefault();
        }
      });

      function endDrag(e) {
        if (!isDown) return;
        isDown = false;

        if (hasCaptured) {
          try {
            container.releasePointerCapture(e.pointerId);
          } catch (err) {}
          hasCaptured = false;
        }

        container.classList.remove('is-dragging');
        container.style.scrollBehavior = '';

        if (isDragging) {
          // Block accidental click after drag
          setTimeout(() => {
            isDragging = false;
            preventClick = false;
          }, 100);
        } else {
          preventClick = false;
        }
      }

      container.addEventListener('pointerup', endDrag);
      container.addEventListener('pointercancel', endDrag);

      // Prevent triggering click when an actual drag occurred
      container.addEventListener('click', (e) => {
        if (preventClick || isDragging) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
    });
  }

  // Initialize
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
