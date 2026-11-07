/**
 * Selleasy Bundle Draggable & Swipeable Carousel + Luxury Quick View Modal
 * - Smooth drag-to-scroll on Desktop and touch swipe on Mobile (no hand cursor)
 * - Click on product card opens Quick View Popup Modal (100% Real Shopify Data)
 * - Modal includes: Gallery, Price with Currency, Variants, Quantity, Add to Order, Link to PDP
 */
(function() {
  'use strict';

  // =========================================================================
  // 1. FORMAT PRICE HELPER (100% Real Currency from Shopify)
  // =========================================================================
  function formatPrice(cents) {
    const currency = window.Shopify?.currency?.active || 'VND';
    const amount = cents / 100;
    try {
      return new Intl.NumberFormat(currency === 'VND' ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: currency === 'VND' ? 0 : 2
      }).format(amount);
    } catch(e) {
      return currency === 'VND' ? `${amount.toLocaleString('vi-VN')}₫` : `$${amount.toFixed(2)}`;
    }
  }

  // =========================================================================
  // 2. LUXURY QUICK VIEW MODAL
  // =========================================================================
  window.openProductQuickView = async function(handle) {
    if (!handle) return;

    // Remove any previous modal instance
    const prev = document.getElementById('selleasy-quick-view-overlay');
    if (prev) prev.remove();

    // Create Overlay
    const overlay = document.createElement('div');
    overlay.id = 'selleasy-quick-view-overlay';
    overlay.className = 'sqv-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    // Initial Loading Skeleton
    overlay.innerHTML = `
      <div class="sqv-modal">
        <button class="sqv-close" aria-label="Close" type="button">✕</button>
        <div class="sqv-loading-wrap">
          <div class="sqv-spinner"></div>
          <p class="sqv-loading-text">Loading Atelier Selection...</p>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add('sqv-open');
    document.body.style.overflow = 'hidden';

    // Trigger fade-in animation
    requestAnimationFrame(() => {
      overlay.classList.add('sqv-active');
    });

    const closeModal = () => {
      overlay.classList.remove('sqv-active');
      overlay.classList.add('sqv-closing');
      setTimeout(() => {
        overlay.remove();
        document.body.classList.remove('sqv-open');
        document.body.style.overflow = '';
      }, 220);
    };

    overlay.querySelector('.sqv-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    const onKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', onKeydown);
      }
    };
    document.addEventListener('keydown', onKeydown);

    try {
      // Fetch 100% Real Product JSON from Shopify
      const res = await fetch('/products/' + handle + '.js');
      if (!res.ok) throw new Error('Product not found: ' + handle);
      const product = await res.json();

      let selectedVariant = product.variants && product.variants.length ? product.variants[0] : null;
      let quantity = 1;

      const modal = overlay.querySelector('.sqv-modal');
      const images = product.images && product.images.length ? product.images : [product.featured_image || ''];
      const hasVariants = product.variants && product.variants.length > 1 && product.variants[0].title !== 'Default Title';
      const hasDiscount = selectedVariant && selectedVariant.compare_at_price > selectedVariant.price;
      const discountPercent = hasDiscount ? Math.round((1 - selectedVariant.price / selectedVariant.compare_at_price) * 100) : 0;

      // Clean HTML description into clean excerpt
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = product.description || '';
      const rawText = tempDiv.textContent || tempDiv.innerText || '';
      const descExcerpt = rawText.trim().slice(0, 190) + (rawText.trim().length > 190 ? '...' : '');

      modal.innerHTML = `
        <button class="sqv-close" aria-label="Close" type="button">✕</button>
        <div class="sqv-grid">
          <!-- Gallery -->
          <div class="sqv-gallery">
            <div class="sqv-main-media">
              <img id="sqv-main-image" src="${images[0]}" alt="${product.title}" />
            </div>
            ${images.length > 1 ? `
              <div class="sqv-thumbnails">
                ${images.slice(0, 8).map((img, idx) => `
                  <button type="button" class="sqv-thumb-btn ${idx === 0 ? 'is-active' : ''}" data-src="${img}" aria-label="Thumbnail ${idx + 1}">
                    <img src="${img}" alt="Thumbnail ${idx + 1}" />
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <!-- Product Details -->
          <div class="sqv-details">
            <div class="sqv-header">
              <div class="sqv-eyebrow">MAHJIVA ATELIER</div>
              <h3 class="sqv-title">${product.title}</h3>
              <div class="sqv-price-wrap">
                <span class="sqv-price" id="sqv-price-val">${selectedVariant ? formatPrice(selectedVariant.price) : ''}</span>
                <span class="sqv-compare-price ${hasDiscount ? '' : 'is-hidden'}" id="sqv-compare-val">
                  ${hasDiscount ? formatPrice(selectedVariant.compare_at_price) : ''}
                </span>
                <span class="sqv-badge ${hasDiscount ? '' : 'is-hidden'}" id="sqv-badge-val">
                  -${discountPercent}% OFF
                </span>
              </div>
            </div>

            ${descExcerpt ? `<p class="sqv-description">${descExcerpt}</p>` : ''}

            ${hasVariants ? `
              <div class="sqv-variants-cont">
                <label class="sqv-label" for="sqv-variant-select">Choose Option:</label>
                <div class="sqv-select-wrap">
                  <select id="sqv-variant-select" class="sqv-select">
                    ${product.variants.map(v => `
                      <option value="${v.id}"
                        data-price="${v.price}"
                        data-compare="${v.compare_at_price || ''}"
                        data-img="${v.featured_image ? v.featured_image.src : ''}"
                        ${v.id === selectedVariant.id ? 'selected' : ''}>
                        ${v.title} - ${formatPrice(v.price)}
                      </option>
                    `).join('')}
                  </select>
                </div>
              </div>
            ` : ''}

            <div class="sqv-actions">
              <div class="sqv-qty-row">
                <label class="sqv-label">Quantity:</label>
                <div class="sqv-qty-stepper">
                  <button type="button" class="sqv-qty-btn" id="sqv-qty-minus" aria-label="Decrease quantity">−</button>
                  <span class="sqv-qty-val" id="sqv-qty-display">1</span>
                  <button type="button" class="sqv-qty-btn" id="sqv-qty-plus" aria-label="Increase quantity">+</button>
                </div>
              </div>

              <button type="button" class="sqv-add-btn" id="sqv-add-button">
                <span class="sqv-btn-text">Add to Order</span>
                <span class="sqv-btn-spinner is-hidden"></span>
              </button>

              <a href="/products/${product.handle}" class="sqv-details-link">
                View full product details
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 4px;"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>
        </div>
      `;

      // Close button re-bind
      modal.querySelector('.sqv-close').addEventListener('click', closeModal);

      // Thumbnail clicks
      const mainImg = modal.querySelector('#sqv-main-image');
      modal.querySelectorAll('.sqv-thumb-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.querySelectorAll('.sqv-thumb-btn').forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          const src = btn.getAttribute('data-src');
          if (src) mainImg.src = src;
        });
      });

      // Variant dropdown change
      const variantSelect = modal.querySelector('#sqv-variant-select');
      if (variantSelect) {
        variantSelect.addEventListener('change', () => {
          const varId = parseInt(variantSelect.value, 10);
          selectedVariant = product.variants.find(v => v.id === varId) || product.variants[0];

          // Update price & badge
          modal.querySelector('#sqv-price-val').textContent = formatPrice(selectedVariant.price);
          const compVal = modal.querySelector('#sqv-compare-val');
          const badgeVal = modal.querySelector('#sqv-badge-val');

          if (selectedVariant.compare_at_price > selectedVariant.price) {
            compVal.textContent = formatPrice(selectedVariant.compare_at_price);
            compVal.classList.remove('is-hidden');
            const disc = Math.round((1 - selectedVariant.price / selectedVariant.compare_at_price) * 100);
            badgeVal.textContent = `-${disc}% OFF`;
            badgeVal.classList.remove('is-hidden');
          } else {
            compVal.classList.add('is-hidden');
            badgeVal.classList.add('is-hidden');
          }

          // Update main image if variant has featured image
          const opt = variantSelect.options[variantSelect.selectedIndex];
          const imgUrl = opt.getAttribute('data-img');
          if (imgUrl) {
            mainImg.src = imgUrl;
            modal.querySelectorAll('.sqv-thumb-btn').forEach(b => {
              if (b.getAttribute('data-src') === imgUrl) {
                b.classList.add('is-active');
              } else {
                b.classList.remove('is-active');
              }
            });
          }
        });
      }

      // Quantity buttons
      const qtyDisplay = modal.querySelector('#sqv-qty-display');
      modal.querySelector('#sqv-qty-minus').addEventListener('click', () => {
        if (quantity > 1) {
          quantity--;
          qtyDisplay.textContent = quantity;
        }
      });
      modal.querySelector('#sqv-qty-plus').addEventListener('click', () => {
        quantity++;
        qtyDisplay.textContent = quantity;
      });

      // Add to Order button
      const addBtn = modal.querySelector('#sqv-add-button');
      addBtn.addEventListener('click', async () => {
        if (!selectedVariant) return;
        addBtn.disabled = true;
        addBtn.querySelector('.sqv-btn-text').textContent = 'Adding to Order...';
        addBtn.querySelector('.sqv-btn-spinner').classList.remove('is-hidden');

        try {
          const postData = {
            id: selectedVariant.id,
            quantity: quantity,
            sections: 'cart-drawer,cart-icon-bubble'
          };
          const addRes = await fetch(window.routes?.cart_add_url || '/cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/javascript'
            },
            body: JSON.stringify(postData)
          });
          const cartResult = await addRes.json();

          closeModal();

          // Render into cart drawer & open
          const cartDrawer = document.querySelector('cart-drawer');
          if (cartDrawer && typeof cartDrawer.renderContents === 'function') {
            cartDrawer.renderContents(cartResult);
          } else {
            window.location.href = '/cart';
          }
        } catch (err) {
          console.error('Error adding to order:', err);
          addBtn.disabled = false;
          addBtn.querySelector('.sqv-btn-text').textContent = 'Add to Order';
          addBtn.querySelector('.sqv-btn-spinner').classList.add('is-hidden');
        }
      });

    } catch (err) {
      console.error('Quick View Error:', err);
      // Fallback navigation if API fails
      window.location.href = '/products/' + handle;
    }
  };

  // =========================================================================
  // 3. PRODUCT CARDS: CLICK IMAGE / TITLE -> OPEN QUICK VIEW POPUP
  // =========================================================================
  function initProductCardQuickView() {
    if (window._selleasyQuickViewInit) return;
    window._selleasyQuickViewInit = true;

    document.addEventListener('click', function(e) {
      // Do not intercept clicks inside the Quick View modal itself
      if (e.target.closest('#selleasy-quick-view-overlay')) return;

      // Ignore interactive controls: checkboxes, select dropdowns, inputs, buttons, quantity pickers
      if (e.target.closest('button, select, option, input, label, .lb-qty-picker-cont, .lb-qty-picker, .lb-qty-add, .lb-qty-remove, .lb-checkbox-cont, .lb-custom-checkbox, .lb-card-checkbox-cont, .lb-cta-container, .lb-bundle-cta-button, .lb-cta-button, .lb-long-cta-button')) {
        return;
      }

      // Target clicks on card image or title, or non-interactive parts of the card
      const isCardElement = e.target.closest('lb-card-image, .lb-card-image-cont, .lb-card-img, lb-card-title, .lb-card-title, .lb-card-title-cont, .lb-long-card, .lb-flat-card, lb-upsell-long-card, lb-upsell-flat-card, lb-bundle-card, [class*="lb-product-card"]');
      if (!isCardElement) return;

      const card = e.target.closest('[lb-product-handle], lb-upsell-long-card, lb-upsell-flat-card, lb-bundle-card, .lb-flat-card, .lb-long-card, [class*="lb-product-card"]');
      if (!card) return;

      // Extract handle
      let handle = card.getAttribute('lb-product-handle');
      if (!handle) {
        const link = card.querySelector('a[href*="/products/"]');
        if (link) {
          const match = link.getAttribute('href').match(/\/products\/([a-zA-Z0-9\-_]+)/);
          if (match) handle = match[1];
        }
      }
      if (!handle) {
        const parentWithHandle = card.closest('[lb-product-handle]');
        if (parentWithHandle) handle = parentWithHandle.getAttribute('lb-product-handle');
      }

      if (handle) {
        e.preventDefault();
        e.stopPropagation();
        window.openProductQuickView(handle);
      }
    }, false);
  }

  // =========================================================================
  // 4. BUNDLE DRAGGABLE & SWIPEABLE CAROUSEL
  // =========================================================================
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
    document.addEventListener('DOMContentLoaded', () => {
      initDraggableBundle();
      initProductCardQuickView();
    });
  } else {
    initDraggableBundle();
    initProductCardQuickView();
  }

  // Observe for dynamic Selleasy custom elements rendering
  const observer = new MutationObserver(() => {
    initDraggableBundle();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
