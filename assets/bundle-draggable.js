/**
 * Selleasy Bundle Draggable & Swipeable Carousel
 * Enables smooth drag-to-scroll on Desktop and touch swipe on Mobile
 * No hand cursor (standard cursor preserved)
 * Enables direct click navigation on product card images and titles
 */
(function() {
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

      // Prevent native HTML5 image/text drag-and-drop
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

  // Selleasy Product Cards: Click on Image or Title to navigate to product page
  function initProductCardNavigation() {
    if (window._selleasyNavInitialized) return;
    window._selleasyNavInitialized = true;

    document.addEventListener('click', function(e) {
      // Ignore interactive controls: buttons, inputs, selects, labels, quantity controls, checkboxes
      if (e.target.closest('button, select, option, input, label, .lb-qty-picker-cont, .lb-qty-picker, .lb-qty-add, .lb-qty-remove, .lb-checkbox-cont, .lb-custom-checkbox, .lb-card-checkbox-cont, .lb-cta-container, .lb-bundle-cta-button')) {
        return;
      }

      // Check if clicked element is part of product card image or title
      const clickable = e.target.closest('lb-card-image, .lb-card-image-cont, .lb-card-img, lb-card-title, .lb-card-title, .lb-card-title-cont');
      if (!clickable) return;

      const card = clickable.closest('[lb-product-handle]') || clickable.closest('lb-upsell-long-card, [class*="lb-product-card"]');
      if (!card) return;

      const handle = card.getAttribute('lb-product-handle');
      if (handle) {
        window.location.href = '/products/' + handle;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initDraggableBundle();
      initProductCardNavigation();
    });
  } else {
    initDraggableBundle();
    initProductCardNavigation();
  }

  // Observe for dynamic insertion by Selleasy custom elements / async DOM updates
  const observer = new MutationObserver(() => {
    initDraggableBundle();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
