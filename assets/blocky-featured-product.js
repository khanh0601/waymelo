/* Custom element for sections/blocky-main-product.liquid.
   Moved out of the section's inline <script> so the browser can cache it.
   Per-request values come from window.BlockyFeaturedProductConfig (set inline by the section). */
function blockyFeaturedProductConfig() {
  return window.BlockyFeaturedProductConfig || {};
}

/* Sections below the fold use content-visibility:auto on product pages. Before a smooth
   scroll to one of them, lift the skipping (html.waymelo-cv-off) so heights are final and the
   scroll lands exactly on the target. */
function blockyScrollToSection(target) {
  var root = document.documentElement;
  root.classList.add('waymelo-cv-off');
  window.requestAnimationFrame(function () {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(function () { root.classList.remove('waymelo-cv-off'); }, 2000);
  });
}

  if (!customElements.get('blocky-featured-product')) {
    customElements.define('blocky-featured-product', class extends HTMLElement {
      connectedCallback() {
        if (this.initialized) return;
        this.initialized = true;

        try {
          this.product = JSON.parse(this.querySelector('[data-blocky-product-json]')?.textContent || '{}') || {};
        } catch (error) {
          this.product = {};
        }

        this.moneyFormat = (blockyFeaturedProductConfig().moneyFormat || '${{amount}}');
        this.mediaByVariant = {};

        this.initMediaLoadingState();
        this.initBelowFoldGate();
        this.initDelayedAppSlots();

        (this.product.variants || []).forEach((variant) => {
          const mediaId = variant.featured_media_id || variant.featured_media?.id;
          if (mediaId) {
            this.mediaByVariant[variant.id] = mediaId.toString();
          }
        });

        this.addEventListener('click', (event) => {
          const thumb = event.target.closest('[data-blocky-product-thumb]');
          if (thumb) this.activateMedia(thumb.dataset.blockyProductThumb);
        });

        this.initBeforeAfterButtons();
        this.initScrollToButtons();
        this.initReviewCarouselModals();
        this.initPopupModals();
        this.initShareButtons();
        this.initComplementary();

        this.querySelectorAll('[data-blocky-option-position]').forEach((input) => {
          input.addEventListener('change', () => this.updateVariant());
        });

        this.querySelector('[data-blocky-quantity-minus]')?.addEventListener('click', () => this.changeQuantity(-1));
        this.querySelector('[data-blocky-quantity-plus]')?.addEventListener('click', () => this.changeQuantity(1));
        this.querySelector('[data-blocky-quantity-input]')?.addEventListener('input', () => this.syncQuantity());
        this.querySelectorAll('.blocky-product-form').forEach((form) => {
          form.addEventListener('submit', (event) => this.handleAddToCart(event));
        });

        this.syncQuantity();
        this.updateVariant();
      }

      initMediaLoadingState() {
        const mediaWrap = this.querySelector('.blocky-featured-product__media-wrap');
        const activeImage = mediaWrap?.querySelector('.blocky-featured-product__media.is-active img');
        if (!mediaWrap) return;

        const markReady = () => {
          mediaWrap.classList.remove('is-loading');
          mediaWrap.classList.add('is-ready');

          if (!document.documentElement.classList.contains('waymelo-hero-ready')) {
            document.documentElement.classList.add('waymelo-hero-ready');
            window.dispatchEvent(new CustomEvent('waymelo:hero-ready'));
          }
          this.maybeBelowFoldReady();
        };

        if (!activeImage || (activeImage.complete && activeImage.naturalWidth > 0)) {
          requestAnimationFrame(markReady);
          return;
        }

        activeImage.addEventListener('load', markReady, { once: true });
        activeImage.addEventListener('error', markReady, { once: true });
      }

      initDelayedAppSlots() {
        this.querySelectorAll('[data-blocky-pumper-slot]').forEach((slot) => {
          let mutationObserver;
          let resizeObserver;
          let stabilityTimer;
          let observedWidget;

          const normalizeText = (element) => (element.textContent || '').replace(/\s+/g, ' ').trim();
          const isBadgeText = (text) =>
            /^(most popular|best value|smart choice)$/i.test(
              text.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim()
            );
          const isTitleText = (text) => /^buy\s*\d+\s*:/i.test(text) && text.length < 100;

          const enhanceLabels = () => {
            const highlightTargets = new Set();
            const titleTargets = new Set();

            slot.querySelectorAll('*').forEach((element) => {
              const text = normalizeText(element);
              if (!text) return;

              // Only tag the element whose own text is exactly the badge label (emoji allowed)
              if (isBadgeText(text)) {
                const childIsBadge = Array.from(element.children).some((child) => isBadgeText(normalizeText(child)));
                if (!childIsBadge) highlightTargets.add(element);
              }

              if (isTitleText(text)) {
                const childIsTitle = Array.from(element.children).some((child) => isTitleText(normalizeText(child)));
                if (!childIsTitle) titleTargets.add(element);
              }
            });

            slot.querySelectorAll('.blocky-pumper-highlight-label').forEach((element) => {
              if (!highlightTargets.has(element)) element.classList.remove('blocky-pumper-highlight-label');
            });
            slot.querySelectorAll('.blocky-pumper-option-title').forEach((element) => {
              if (!titleTargets.has(element)) element.classList.remove('blocky-pumper-option-title');
            });
            highlightTargets.forEach((element) => element.classList.add('blocky-pumper-highlight-label'));
            titleTargets.forEach((element) => element.classList.add('blocky-pumper-option-title'));
          };

          /*
            Readiness signals coming from the Pumper app. Pumper dispatches its events on window and
            records performance marks, which may fire before this element connects, so buffered marks
            are checked first and observed afterwards.
          */
          const signals = { mounted: false, configured: false, firstPaint: false, blockTitle: false };
          const MOUNT_MARKS = ['pmpr:mount-done', 'pmpr:tiers-shell-mounted'];
          const CONFIG_MARKS = ['pmpr:config-applied'];
          const FIRST_PAINT_MARKS = ['pmpr:first-paint-done'];
          const BLOCK_TITLE_MARKS = ['pmpr:resolve-block-title'];
          const hasMark = (names) => {
            try {
              return names.some((name) => performance.getEntriesByName(name).length > 0);
            } catch (error) {
              return false;
            }
          };
          const syncSignals = () => {
            if (!signals.mounted && hasMark(MOUNT_MARKS)) signals.mounted = true;
            if (!signals.configured && hasMark(CONFIG_MARKS)) signals.configured = true;
            if (!signals.firstPaint && hasMark(FIRST_PAINT_MARKS)) signals.firstPaint = true;
            if (!signals.blockTitle && hasMark(BLOCK_TITLE_MARKS)) signals.blockTitle = true;
          };

          const startedAt = performance.now();
          const EMPTY_SLOT_TIMEOUT = 15000;
          const DOM_SETTLE_TIME = 240;
          const TITLE_MARK_FALLBACK = 1500;
          const SIGNAL_FALLBACK_SETTLE = 1500;
          let firstPaintReadyAt = 0;
          let lastMutationAt = performance.now();
          let revealed = false;
          let measuredWidgetHeight = 0;

          const getWidget = () => slot.querySelector('#pumper_bundle_svelte .pumper_block, #svelte-bundle-widget');
          const widgetHeight = () => measuredWidgetHeight;
          const cssReady = () => {
            const links = Array.from(
              document.querySelectorAll(
                'link[data-pumper-css], link[rel="stylesheet"][href*="/assets/pumper-bundles-v2.css"]'
              )
            );
            return links.length === 0 || links.every((link) => link.sheet || link.getAttribute('data-pumper-css') === 'loaded');
          };

          const cleanup = () => {
            mutationObserver?.disconnect();
            resizeObserver?.disconnect();
            markObserver?.disconnect();
            clearTimeout(stabilityTimer);
            clearTimeout(safetyTimer);
            clearInterval(pollTimer);
            PUMPER_EVENTS.forEach((name) => window.removeEventListener(name, onPumperEvent));
          };

          const reveal = () => {
            if (revealed) return;
            revealed = true;
            enhanceLabels();
            slot.classList.remove('is-loading', 'is-empty');
            slot.classList.add('is-ready');
            slot.setAttribute('aria-busy', 'false');
            cleanup();
            this.markAppSlotSettled();
          };

          const isComplete = () => {
            syncSignals();
            if (widgetHeight() < 100 || !cssReady()) return false;

            const settledFor = performance.now() - lastMutationAt;
            const signalsReady = signals.mounted && signals.configured && signals.firstPaint;
            // Fallback: if the app's readiness signals were missed (they can fire before this script
            // runs, e.g. when the app's JS is cached and this file is not), a fully sized widget whose
            // DOM has been still for SIGNAL_FALLBACK_SETTLE is treated as ready instead of staying hidden.
            if (!signalsReady && settledFor < SIGNAL_FALLBACK_SETTLE) return false;
            enhanceLabels();
            if (!firstPaintReadyAt) firstPaintReadyAt = performance.now();

            // The block title and ribbons are resolved after Pumper's first-paint mark. Wait for the
            // title signal when available, with a compatibility fallback for older app versions.
            const titleReady = signals.blockTitle || performance.now() - firstPaintReadyAt >= TITLE_MARK_FALLBACK;
            const domSettled = settledFor >= DOM_SETTLE_TIME;
            return titleReady && domSettled;
          };

          // Reveal only once Pumper reports its paint complete and the final DOM has settled.
          const check = () => {
            if (revealed) return;
            clearTimeout(stabilityTimer);
            stabilityTimer = window.setTimeout(() => {
              if (revealed || !isComplete()) return;

              const heightBefore = widgetHeight();
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  if (revealed) return;
                  const heightAfter = widgetHeight();
                  if (heightAfter < 100 || Math.abs(heightAfter - heightBefore) > 1) {
                    check();
                    return;
                  }
                  reveal();
                });
              });
            }, DOM_SETTLE_TIME);
          };

          const watchWidget = () => {
            if (revealed) return;
            const widget = getWidget();
            if (!widget) return;

            // If the configured offer mounts after the empty-slot timeout, restore its skeleton before the
            // slot becomes visible. The partially mounted app must never flash on screen.
            if (slot.classList.contains('is-empty')) {
              slot.classList.remove('is-ready', 'is-empty');
              slot.classList.add('is-loading');
              slot.setAttribute('aria-busy', 'true');
            }

            if (widget !== observedWidget) {
              resizeObserver?.disconnect();
              observedWidget = widget;
              measuredWidgetHeight = 0;
              if (window.ResizeObserver) {
                resizeObserver = new ResizeObserver((entries) => {
                  const entry = entries[0];
                  if (!entry) return;
                  measuredWidgetHeight = entry.borderBoxSize?.[0]?.blockSize || entry.contentRect.height || 0;
                  if (measuredWidgetHeight >= 100) slot.classList.remove('is-empty');
                  check();
                });
                resizeObserver.observe(widget);
              } else {
                requestAnimationFrame(() => {
                  measuredWidgetHeight = widget.getBoundingClientRect().height || 0;
                  if (measuredWidgetHeight >= 100) slot.classList.remove('is-empty');
                  check();
                });
              }
            }
            check();
          };

          const PUMPER_EVENTS = ['pumper-widget-ready', 'pumper:tierDomReady', 'prvw-svelte-dom-ready'];
          const onPumperEvent = (event) => {
            signals.mounted = true;
            if (event.type === 'pumper:tierDomReady' || event.type === 'prvw-svelte-dom-ready') {
              signals.firstPaint = true;
            }
            watchWidget();
          };
          PUMPER_EVENTS.forEach((name) => window.addEventListener(name, onPumperEvent));

          let markObserver;
          try {
            markObserver = new PerformanceObserver((list) => {
              if (list.getEntries().some((entry) => entry.name.startsWith('pmpr:'))) watchWidget();
            });
            markObserver.observe({ type: 'mark', buffered: true });
          } catch (error) {
            markObserver = null;
          }

          document.querySelectorAll('link[data-pumper-css]').forEach((link) => {
            link.addEventListener('load', () => window.setTimeout(watchWidget, 0), { once: true });
          });

          // Low-frequency poll as a backstop for signals that do not trigger DOM mutations
          const pollTimer = window.setInterval(watchWidget, 500);

          const safetyTimer = window.setTimeout(() => {
            if (revealed) return;
            if (widgetHeight() >= 10) return;

            // The configured widget did not mount. Collapse the slot; never reveal a partial widget.
            slot.classList.remove('is-loading');
            slot.classList.add('is-ready', 'is-empty');
            slot.setAttribute('aria-busy', 'false');
            clearInterval(pollTimer);
            this.markAppSlotSettled();
          }, Math.max(0, EMPTY_SLOT_TIMEOUT - (performance.now() - startedAt)));

          mutationObserver = new MutationObserver(() => {
            lastMutationAt = performance.now();
            watchWidget();
          });
          mutationObserver.observe(slot, { childList: true, subtree: true, characterData: true });
          watchWidget();
        });
      }

      /*
        Below-the-fold media (video showcase, video sections) wait until both the hero image has
        loaded and the buy-box app slots (Pumper) have settled, so they never compete for bandwidth
        with the offer widget on a cold load. Signal: html.waymelo-below-fold-ready plus the
        'waymelo:below-fold-ready' event. The buy box is considered settled when every Pumper slot
        has revealed or collapsed, or after 8s at most.
      */
      initBelowFoldGate() {
        this.pendingAppSlots = this.querySelectorAll('[data-blocky-pumper-slot]').length;
        this.buyBoxSettled = false;
        if (this.pendingAppSlots === 0) {
          this.settleBuyBox();
          return;
        }
        this.buyBoxTimer = window.setTimeout(() => this.settleBuyBox(), 8000);
      }

      markAppSlotSettled() {
        if (this.buyBoxSettled) return;
        this.pendingAppSlots = Math.max(0, (this.pendingAppSlots || 0) - 1);
        if (this.pendingAppSlots === 0) this.settleBuyBox();
      }

      settleBuyBox() {
        if (this.buyBoxSettled) return;
        this.buyBoxSettled = true;
        window.clearTimeout(this.buyBoxTimer);
        document.documentElement.classList.add('waymelo-buybox-ready');
        window.dispatchEvent(new CustomEvent('waymelo:buybox-ready'));
        this.maybeBelowFoldReady();
      }

      maybeBelowFoldReady() {
        const root = document.documentElement;
        if (root.classList.contains('waymelo-below-fold-ready')) return;
        if (!root.classList.contains('waymelo-hero-ready') || !root.classList.contains('waymelo-buybox-ready')) return;
        root.classList.add('waymelo-below-fold-ready');
        window.dispatchEvent(new CustomEvent('waymelo:below-fold-ready'));
      }

      initBeforeAfterButtons() {
        this.querySelectorAll('.before_after_dual_btn_wrapper').forEach((btnWrapper) => {
          const mediaItems = Array.from(this.querySelectorAll('[data-blocky-product-media]'));

          btnWrapper.querySelectorAll('.before_after_btn').forEach((btn) => {
            btn.addEventListener('click', (event) => {
              event.preventDefault();

              const targetIndex = Number(btn.dataset.index);
              const targetMedia = mediaItems[targetIndex];
              if (!targetMedia) return;

              this.activateMedia(targetMedia.dataset.blockyProductMedia);

              btnWrapper.querySelectorAll('.before_after_btn').forEach((button) => button.classList.remove('active'));
              btn.classList.add('active');
            });
          });
        });
      }

      initReviewCarouselModals() {
        this.querySelectorAll('[data-review-modal-open]').forEach((button) => {
          button.addEventListener('click', () => {
            const modal = this.querySelector(`[data-review-modal="${button.dataset.reviewModalOpen}"]`);
            if (!modal) return;

            this.openReviewModal(modal, button.dataset.reviewModalIndex);
          });
        });

        this.querySelectorAll('[data-review-modal]').forEach((modal) => {
          modal.querySelector('[data-review-modal-close]')?.addEventListener('click', () => this.closeReviewModal(modal));

          modal.addEventListener('click', (event) => {
            if (event.target === modal) this.closeReviewModal(modal);
          });

          modal.querySelectorAll('[data-review-modal-video]').forEach((panel) => {
            panel.addEventListener('click', () => this.toggleReviewModalVideo(panel));
          });

          modal.querySelectorAll('[data-review-modal-thumb]').forEach((thumb) => {
            thumb.addEventListener('click', () => this.selectReviewModalVideo(modal, thumb.dataset.reviewModalThumb));
          });
        });

        document.addEventListener('keydown', (event) => {
          if (event.key !== 'Escape') return;

          this.querySelectorAll('[data-review-modal]:not([hidden])').forEach((modal) => this.closeReviewModal(modal));
        });
      }

      openReviewModal(modal, index) {
        modal.hidden = false;
        document.documentElement.style.overflow = 'hidden';
        this.selectReviewModalVideo(modal, index);
        modal.querySelector('[data-review-modal-close]')?.focus();
      }

      closeReviewModal(modal) {
        modal.hidden = true;
        modal.querySelectorAll('video').forEach((video) => video.pause());

        if (!document.querySelector('[data-review-modal]:not([hidden])')) {
          document.documentElement.style.overflow = '';
        }
      }

      selectReviewModalVideo(modal, index) {
        modal.querySelectorAll('video').forEach((video) => video.pause());

        modal.querySelectorAll('[data-review-modal-video]').forEach((panel) => {
          const active = panel.dataset.reviewModalVideo === String(index);
          panel.hidden = !active;
          if (active) {
            const video = panel.querySelector('video');
            if (video) video.play().catch(() => {});
          }
        });

        modal.querySelectorAll('[data-review-modal-products]').forEach((panel) => {
          panel.hidden = panel.dataset.reviewModalProducts !== String(index);
        });

        modal.querySelectorAll('[data-review-modal-thumb]').forEach((thumb) => {
          thumb.classList.toggle('is-active', thumb.dataset.reviewModalThumb === String(index));
        });
      }

      toggleReviewModalVideo(panel) {
        const video = panel.querySelector('video');
        if (!video) return;

        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }

      initPopupModals() {
        this.querySelectorAll('[data-blocky-popup-open]').forEach((button) => {
          button.addEventListener('click', () => {
            const modal = this.querySelector(`[data-blocky-popup="${button.dataset.blockyPopupOpen}"]`);
            if (modal) this.openPopupModal(modal);
          });
        });

        this.querySelectorAll('[data-blocky-popup]').forEach((modal) => {
          modal.querySelector('[data-blocky-popup-close]')?.addEventListener('click', () => this.closePopupModal(modal));
          modal.addEventListener('click', (event) => {
            if (event.target === modal) this.closePopupModal(modal);
          });
        });

        document.addEventListener('keydown', (event) => {
          if (event.key !== 'Escape') return;
          this.querySelectorAll('[data-blocky-popup][open]').forEach((modal) => this.closePopupModal(modal));
        });
      }

      openPopupModal(modal) {
        modal.setAttribute('open', '');
        document.documentElement.style.overflow = 'hidden';
        modal.querySelector('[data-blocky-popup-close]')?.focus();
      }

      closePopupModal(modal) {
        modal.removeAttribute('open');
        if (!document.querySelector('[data-blocky-popup][open]')) {
          document.documentElement.style.overflow = '';
        }
      }

      initShareButtons() {
        this.querySelectorAll('[data-blocky-share]').forEach((button) => {
          const wrapper = button.closest('.blocky-share');
          const fallback = wrapper?.querySelector('[data-blocky-share-fallback]');

          button.addEventListener('click', async () => {
            const shareData = { title: button.dataset.shareTitle, url: button.dataset.shareUrl };
            if (navigator.share) {
              try {
                await navigator.share(shareData);
                return;
              } catch (error) {
                if (error && error.name === 'AbortError') return;
              }
            }
            if (fallback) fallback.hidden = !fallback.hidden;
          });

          wrapper?.querySelector('[data-blocky-share-copy]')?.addEventListener('click', () => {
            const input = wrapper.querySelector('[data-blocky-share-input]');
            const success = wrapper.querySelector('[data-blocky-share-success]');
            if (!input) return;

            const done = () => {
              if (!success) return;
              success.hidden = false;
              setTimeout(() => { success.hidden = true; }, 2000);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(input.value).then(done).catch(() => {
                input.select();
                document.execCommand('copy');
                done();
              });
            } else {
              input.select();
              document.execCommand('copy');
              done();
            }
          });
        });
      }

      initComplementary() {
        const block = this.querySelector('[data-blocky-complementary]');
        if (!block) return;

        const mount = block.querySelector('[data-blocky-complementary-mount]');
        const productId = block.dataset.productId;
        const limit = Number(block.dataset.limit) || 10;
        const perPage = Math.max(1, Number(block.dataset.perPage) || 3);
        const pagination = block.dataset.pagination || 'counter';
        const quickAdd = block.dataset.quickAdd === 'true';
        const fallback = block.dataset.fallback === 'true';
        if (!mount || !productId) return;

        const manualProductsNode = block.querySelector('[data-blocky-complementary-products]');
        let manualProducts = [];
        if (manualProductsNode) {
          try {
            manualProducts = JSON.parse(manualProductsNode.textContent);
          } catch (error) {
            manualProducts = [];
          }
        }

        const esc = (value) => String(value || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');

        const sized = (url) => {
          if (!url) return '';
          return url + (url.indexOf('?') === -1 ? '?' : '&') + 'width=400';
        };

        const buildCard = (item) => {
          const image = sized(item.featured_image || (item.images && item.images[0]) || '');
          const media = image ? `<img src="${esc(image)}" alt="${esc(item.title)}" loading="lazy">` : '';
          let quickAddHtml = '';
          if (quickAdd) {
            const variants = item.variants || [];
            if (variants.length > 1) {
              quickAddHtml = `<a class="blocky-complementary__quick-add" href="${esc(item.url)}">Choose options</a>`;
            } else if (variants.length === 1 && variants[0].available) {
              quickAddHtml = `<button type="button" class="blocky-complementary__quick-add" data-comp-add="${variants[0].id}">Add to cart</button>`;
            } else {
              quickAddHtml = `<button type="button" class="blocky-complementary__quick-add" disabled>Sold out</button>`;
            }
          }
          return `<div class="blocky-complementary__card"><a class="blocky-complementary__link" href="${esc(item.url)}"><div class="blocky-complementary__media">${media}</div><p class="blocky-complementary__title">${esc(item.title)}</p><p class="blocky-complementary__price">${this.formatMoney(item.price)}</p></a>${quickAddHtml}</div>`;
        };

        const render = (products) => {
          const list = (products || []).slice(0, limit);
          if (!list.length) {
            block.hidden = true;
            return;
          }

          const slides = [];
          for (let i = 0; i < list.length; i += perPage) {
            slides.push(list.slice(i, i + perPage));
          }

          const slidesHtml = slides.map((group) => `<div class="blocky-complementary__slide"><div class="blocky-complementary__grid">${group.map(buildCard).join('')}</div></div>`).join('');

          let navHtml = '';
          if (slides.length > 1) {
            let pagHtml = '';
            if (pagination === 'counter') {
              pagHtml = `<div class="blocky-complementary__pagination"><span data-comp-current>1</span><span>/</span><span>${slides.length}</span></div>`;
            } else if (pagination === 'numbers') {
              pagHtml = `<div class="blocky-complementary__pagination">${slides.map((group, i) => `<button type="button" class="blocky-complementary__num${i === 0 ? ' is-active' : ''}" data-comp-goto="${i}">${i + 1}</button>`).join('')}</div>`;
            } else {
              pagHtml = `<div class="blocky-complementary__pagination">${slides.map((group, i) => `<button type="button" class="blocky-complementary__dot${i === 0 ? ' is-active' : ''}" data-comp-goto="${i}" aria-label="Go to slide ${i + 1}"></button>`).join('')}</div>`;
            }
            navHtml = `<div class="blocky-complementary__nav"><button type="button" class="blocky-complementary__arrow" data-comp-prev aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg></button>${pagHtml}<button type="button" class="blocky-complementary__arrow" data-comp-next aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg></button></div>`;
          }

          mount.innerHTML = `<div class="blocky-complementary__slider"><div class="blocky-complementary__track" data-comp-track>${slidesHtml}</div>${navHtml}</div>`;

          this.initComplementarySlider(mount, slides.length);
          if (quickAdd) this.initComplementaryQuickAdd(mount);
        };

        const fetchRecs = (intent) => fetch(`/recommendations/products.json?product_id=${productId}&limit=${limit}&intent=${intent}`)
          .then((response) => (response.ok ? response.json() : { products: [] }))
          .then((data) => (data && data.products) || []);

        if (manualProducts.length) {
          render(manualProducts);
          return;
        }

        fetchRecs('complementary').then((products) => {
          if (products.length) {
            render(products);
          } else if (fallback) {
            fetchRecs('related').then(render);
          } else {
            block.hidden = true;
          }
        }).catch(() => {
          block.hidden = true;
        });
      }

      initComplementarySlider(mount, count) {
        const track = mount.querySelector('[data-comp-track]');
        if (!track || count <= 1) return;

        let index = 0;
        const update = () => {
          const current = mount.querySelector('[data-comp-current]');
          if (current) current.textContent = String(index + 1);
          mount.querySelectorAll('[data-comp-goto]').forEach((dot, i) => dot.classList.toggle('is-active', i === index));
          const prev = mount.querySelector('[data-comp-prev]');
          const next = mount.querySelector('[data-comp-next]');
          if (prev) prev.disabled = index <= 0;
          if (next) next.disabled = index >= count - 1;
        };

        const goTo = (target) => {
          index = Math.max(0, Math.min(count - 1, target));
          track.scrollTo({ left: track.clientWidth * index, behavior: 'smooth' });
          update();
        };

        mount.querySelector('[data-comp-prev]')?.addEventListener('click', () => goTo(index - 1));
        mount.querySelector('[data-comp-next]')?.addEventListener('click', () => goTo(index + 1));
        mount.querySelectorAll('[data-comp-goto]').forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

        let scrollTimer;
        track.addEventListener('scroll', () => {
          clearTimeout(scrollTimer);
          scrollTimer = setTimeout(() => {
            const i = Math.round(track.scrollLeft / track.clientWidth);
            if (i !== index) {
              index = i;
              update();
            }
          }, 80);
        });

        update();
      }

      initComplementaryQuickAdd(mount) {
        mount.querySelectorAll('[data-comp-add]').forEach((button) => {
          button.addEventListener('click', async (event) => {
            event.preventDefault();
            if (button.disabled) return;

            const original = button.textContent;
            button.disabled = true;
            try {
              const formData = new FormData();
              formData.append('id', button.dataset.compAdd);
              formData.append('quantity', '1');
              await this.openCartDrawer(formData, '');
              button.textContent = 'Added';
              setTimeout(() => {
                button.textContent = original;
                button.disabled = false;
              }, 1500);
            } catch (error) {
              button.textContent = original;
              button.disabled = false;
            }
          });
        });
      }

      initScrollToButtons() {
        this.querySelectorAll('.blocky-scroll-to-btn').forEach((button) => {
          button.addEventListener('click', () => {
            const buttonIndex = button.dataset.btn;
            const target = document.getElementById(`blocky-scroll-to-target-${buttonIndex}`)
              || document.getElementById(`scroll-to-${buttonIndex}`)
              || document.querySelector(`[data-scroll-to-target="${buttonIndex}"], [data-btn-target="${buttonIndex}"]`);
            if (!target) return;

            blockyScrollToSection(target);
          });
        });
      }

      getSelectedOptions() {
        return [1, 2, 3].map((position) => {
          const checked = this.querySelector(`[data-blocky-option-position="${position}"]:checked`);
          const select = this.querySelector(`select[data-blocky-option-position="${position}"]`);
          return checked?.value || select?.value;
        }).filter(Boolean);
      }

      getSelectedVariant() {
        const variants = this.product.variants || [];
        const selectedOptions = this.getSelectedOptions();
        if (!selectedOptions.length) return this.getDefaultVariant();

        return variants.find((variant) => {
          const variantOptions = variant.options || [variant.option1, variant.option2, variant.option3].filter(Boolean);
          if (variantOptions.length !== selectedOptions.length) return false;

          return variantOptions.every((option, index) => {
            return this.normalizeOption(option) === this.normalizeOption(selectedOptions[index]);
          });
        }) || this.getDefaultVariant();
      }

      getDefaultVariant() {
        const variants = this.product.variants || [];
        const selectedVariantId = String(this.product.selected_variant_id || '');
        return variants.find((variant) => String(variant.id) === selectedVariantId) || variants.find((variant) => variant.available) || variants[0];
      }

      normalizeOption(value) {
        return String(value || '').trim();
      }

      updateOptionAvailability() {
        const variants = this.product.variants || [];
        const selectedOptions = this.getSelectedOptions();
        if (!variants.length || !selectedOptions.length) return;

        this.querySelectorAll('[data-blocky-option-position]').forEach((input) => {
          const position = Number(input.dataset.blockyOptionPosition || 0);
          if (!position) return;

          if (input.tagName === 'SELECT') {
            Array.from(input.options).forEach((option) => {
              const candidateOptions = [...selectedOptions];
              candidateOptions[position - 1] = option.value;
              option.classList.toggle('is-sold-out', !this.hasAvailableVariant(candidateOptions));
            });
            return;
          }

          const candidateOptions = [...selectedOptions];
          candidateOptions[position - 1] = input.value;

          input.classList.toggle('is-sold-out', !this.hasAvailableVariant(candidateOptions));
        });
      }

      hasAvailableVariant(candidateOptions) {
        return (this.product.variants || []).some((variant) => {
          if (!variant.available) return false;

          const variantOptions = variant.options || [variant.option1, variant.option2, variant.option3].filter(Boolean);
          return candidateOptions.every((option, index) => {
            return this.normalizeOption(option) === this.normalizeOption(variantOptions[index]);
          });
        });
      }

      updateVariant() {
        if (!(this.product.variants || []).length) return;

        this.updateOptionAvailability();

        const variant = this.getSelectedVariant();
        if (!variant) {
          this.setUnavailableState();
          return;
        }

        const variantInput = this.querySelector('[data-blocky-variant-id]');
        if (variantInput) variantInput.value = variant.id;

        const price = this.querySelector('[data-blocky-current-price]');
        const compare = this.querySelector('[data-blocky-compare-price]');
        if (price) price.textContent = this.formatMoney(variant.price);
        if (compare) {
          compare.textContent = this.formatMoney(variant.compare_at_price || 0);
          compare.hidden = !(variant.compare_at_price && variant.compare_at_price > variant.price);
        }

        const addButton = this.querySelector('[data-blocky-add-button]');
        const addText = this.querySelector('[data-blocky-add-text]');
        const paymentButton = this.querySelector('.shopify-payment-button');
        if (addButton) addButton.disabled = !variant.available;
        if (addText && addButton) addText.innerHTML = (variant.available ? addButton.dataset.addText : addButton.dataset.soldOutText).replace(/\[PRICE\]/g, this.formatMoney(variant.price));
        if (paymentButton) paymentButton.hidden = !variant.available;

        const mediaId = this.mediaByVariant[variant.id];
        if (mediaId) this.activateMedia(mediaId);

        this.updateInventory(variant);
        this.updateSku(variant);
      }

      updateInventory(variant) {
        const element = this.querySelector('[data-blocky-inventory]');
        if (!element) return;

        if (!variant || variant.inventory_management !== 'shopify') {
          element.classList.add('blocky-hidden');
          return;
        }

        const threshold = Number(element.dataset.inventoryThreshold || 0);
        const showQuantity = element.dataset.showQuantity === 'true';
        const quantity = Number(variant.inventory_quantity || 0);

        let color;
        let text;
        if (quantity > 0) {
          if (quantity <= threshold) {
            color = 'rgb(238,148,65)';
            text = showQuantity ? `Low stock: ${quantity} left` : 'Low stock';
          } else {
            color = 'rgb(62,214,96)';
            text = showQuantity ? `${quantity} in stock` : 'In stock';
          }
        } else if (variant.inventory_policy === 'continue') {
          color = 'rgb(62,214,96)';
          text = 'In stock';
        } else {
          color = 'rgb(200,200,200)';
          text = 'Out of stock';
        }

        const faded = color.replace('rgb(', 'rgba(').replace(')', ',0.3)');
        element.classList.remove('blocky-hidden');
        element.innerHTML = `<svg class="blocky-product-inventory__dot" width="15" height="15" aria-hidden="true"><circle cx="7.5" cy="7.5" r="7.5" fill="${faded}"/><circle cx="7.5" cy="7.5" r="5" stroke="#ffffff" stroke-width="1" fill="${color}"/></svg><span data-blocky-inventory-text>${text}</span>`;
      }

      updateSku(variant) {
        const element = this.querySelector('[data-blocky-sku]');
        if (!element) return;

        const text = element.querySelector('[data-blocky-sku-text]');
        const sku = variant && variant.sku ? variant.sku : '';
        if (text) text.textContent = sku;
        element.classList.toggle('blocky-hidden', !sku);
      }

      setUnavailableState() {
        const variantInput = this.querySelector('[data-blocky-variant-id]');
        if (variantInput) variantInput.value = '';

        const addButton = this.querySelector('[data-blocky-add-button]');
        const addText = this.querySelector('[data-blocky-add-text]');
        const paymentButton = this.querySelector('.shopify-payment-button');
        if (addButton) addButton.disabled = true;
        if (addText && addButton) addText.innerHTML = (addButton.dataset.unavailableText || addButton.dataset.soldOutText || 'Unavailable').replace(/\[PRICE\]/g, '');
        if (paymentButton) paymentButton.hidden = true;
      }

      activateMedia(mediaId) {
        const targetMedia = this.querySelector(`[data-blocky-product-media="${mediaId}"]`);
        if (!targetMedia) return;

        const targetImage = targetMedia.querySelector('img');
        const mediaWrap = this.querySelector('.blocky-featured-product__media-wrap');
        if (mediaWrap && targetImage && !(targetImage.complete && targetImage.naturalWidth > 0)) {
          mediaWrap.classList.add('is-loading');
          mediaWrap.classList.remove('is-ready');
          const markReady = () => {
            mediaWrap.classList.remove('is-loading');
            mediaWrap.classList.add('is-ready');
          };
          targetImage.addEventListener('load', markReady, { once: true });
          targetImage.addEventListener('error', markReady, { once: true });
        }

        this.querySelectorAll('[data-blocky-product-media]').forEach((media) => {
          media.classList.toggle('is-active', media.dataset.blockyProductMedia === mediaId);
        });

        this.querySelectorAll('[data-blocky-product-thumb]').forEach((thumb) => {
          const active = thumb.dataset.blockyProductThumb === mediaId;
          thumb.classList.toggle('is-active', active);
          thumb.setAttribute('aria-current', active ? 'true' : 'false');
        });
      }

      changeQuantity(delta) {
        const input = this.querySelector('[data-blocky-quantity-input]');
        if (!input) return;

        input.value = Math.max(1, Number(input.value || 1) + delta);
        this.syncQuantity();
      }

      syncQuantity() {
        const input = this.querySelector('[data-blocky-quantity-input]');
        const formQuantity = this.querySelector('[data-blocky-form-quantity]');
        if (!input || !formQuantity) return;

        formQuantity.value = Math.max(1, Number(input.value || 1));
      }

      async handleAddToCart(event) {
        const form = event.currentTarget;
        const addButton = form.querySelector('[data-blocky-add-button]');
        const action = addButton?.dataset.cartAction || 'cart_drawer';

        if (!form || !addButton || addButton.disabled) return;
        event.preventDefault();

        this.syncQuantity();
        addButton.disabled = true;

        try {
          if (action === 'go_to_cart') {
            await this.addToCart(new FormData(form));
            window.location.href = (blockyFeaturedProductConfig().cartUrl || '/cart');
            return;
          }

          if (action === 'go_to_checkout') {
            await this.addToCart(new FormData(form));
            window.location.href = '/checkout';
            return;
          }

          if (action === 'ajax') {
            await this.addToCart(new FormData(form));
            await this.fetchCart();
            return;
          }

          await this.openCartDrawer(new FormData(form), form.getAttribute('id') || '');
        } catch (error) {
          console.error(error);
          if (action === 'cart_drawer') {
            window.location.href = (blockyFeaturedProductConfig().cartUrl || '/cart');
          }
        } finally {
          const variant = this.getSelectedVariant();
          addButton.disabled = !variant?.available;
        }
      }

      async openCartDrawer(formData, sourceId) {
        const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');

        if (cart?.renderContents) {
          const sections = cart.getSectionsToRender?.().map((section) => section.id).join(',') || 'cart-drawer,cart-icon-bubble';
          formData.append('sections', sections);
          formData.append('sections_url', window.location.pathname);

          const data = await this.addToCart(formData);
          cart.classList.remove('is-empty');
          cart.renderContents(data);
          return;
        }

        const drawer = document.querySelector('cart-drawer-component');
        if (!drawer) {
          window.location.href = (blockyFeaturedProductConfig().cartUrl || '/cart');
          return;
        }

        const sectionIds = this.getCartSectionIds();
        if (sectionIds.length) formData.append('sections', sectionIds.join(','));

        const data = await this.addToCart(formData);
        drawer.classList.remove('cart-drawer--empty');
        document.dispatchEvent(new CustomEvent('cart:update', {
          bubbles: true,
          detail: {
            resource: data,
            sourceId: sourceId || '',
            data: {
              source: 'product-form-component',
              itemCount: Number(formData.get('quantity')) || 1,
              sections: data.sections
            }
          }
        }));
        if (typeof drawer.open !== 'function') {
          window.location.href = (blockyFeaturedProductConfig().cartUrl || '/cart');
          return;
        }

        drawer.open();
      }

      getCartSectionIds() {
        return Array.from(document.querySelectorAll('cart-items-component'))
          .map((item) => item.dataset.sectionId)
          .filter(Boolean);
      }

      async addToCart(formData) {
        const response = await fetch((blockyFeaturedProductConfig().cartAddJsUrl || '/cart/add.js'), {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json'
          }
        });
        const data = await response.json();
        if (!response.ok || data.status) throw data;
        return data;
      }

      async fetchCart() {
        const response = await fetch((blockyFeaturedProductConfig().cartJsUrl || '/cart.js'), {
          headers: {
            Accept: 'application/json'
          }
        });
        const data = await response.json();
        if (!response.ok) throw data;
        return data;
      }

      formatMoney(cents) {
        if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
          return window.Shopify.formatMoney(cents, this.moneyFormat);
        }

        return (cents / 100).toLocaleString(undefined, { style: 'currency', currency: (blockyFeaturedProductConfig().currency || 'USD') });
      }
    });
  }

  if (!customElements.get('blocky-timer')) {
    customElements.define('blocky-timer', class extends HTMLElement {
      static get observedAttributes() {
        return ['data-text', 'data-hours', 'data-minutes'];
      }

      connectedCallback() {
        this.start();
      }

      attributeChangedCallback() {
        if (this.isConnected) this.start();
      }

      disconnectedCallback() {
        if (this.interval) clearInterval(this.interval);
      }

      start() {
        if (this.interval) clearInterval(this.interval);

        this.template = this.dataset.text || '';
        const hours = parseInt(this.dataset.hours, 10) || 0;
        const minutes = parseInt(this.dataset.minutes, 10) || 0;
        this.remaining = (hours * 3600) + (minutes * 60);
        this.output = this.querySelector('.blocky-timer-text');

        this.render();
        this.interval = setInterval(() => this.tick(), 1000);
      }

      tick() {
        if (this.remaining <= 0) {
          clearInterval(this.interval);
          return;
        }
        this.remaining -= 1;
        this.render();
      }

      render() {
        if (!this.output) return;
        const h = Math.floor(this.remaining / 3600);
        const m = Math.floor((this.remaining % 3600) / 60);
        const s = this.remaining % 60;
        this.output.innerHTML = this.template
          .replace(/\[HOURS\]/g, h)
          .replace(/\[MINUTES\]/g, m)
          .replace(/\[SECONDS\]/g, s);
      }
    });
  }

  if (!customElements.get('blocky-countdown-timer')) {
    customElements.define('blocky-countdown-timer', class extends HTMLElement {
      connectedCallback() {
        if (this.initialized) return;
        this.initialized = true;

        this.start();
        this.boundStart = () => this.start();
        document.addEventListener('shopify:section:load', this.boundStart);
      }

      disconnectedCallback() {
        if (this.interval) clearInterval(this.interval);
        if (this.boundStart) document.removeEventListener('shopify:section:load', this.boundStart);
      }

      getStorage(resetScope) {
        try {
          return resetScope === 'session' ? window.sessionStorage : window.localStorage;
        } catch (error) {
          return null;
        }
      }

      getEndTimestamp() {
        const mode = this.dataset.mode;
        const hours = parseFloat(this.dataset.hours) || 4;
        const fixedEnd = this.dataset.fixedEnd;

        if (mode === 'fixed') {
          if (!fixedEnd) return null;
          return new Date(fixedEnd.replace(' ', 'T')).getTime() || null;
        }

        const resetScope = this.dataset.resetScope;
        const storage = this.getStorage(resetScope);
        const storageKey = 'blocky-countdown-deals:' + this.dataset.id + ':' + hours;

        if (storage) {
          const stored = parseInt(storage.getItem(storageKey), 10);
          if (!isNaN(stored) && stored > Date.now()) return stored;
        }

        const endTimestamp = Date.now() + (hours * 60 * 60 * 1000);
        if (storage) {
          try {
            storage.setItem(storageKey, String(endTimestamp));
          } catch (error) {}
        }
        return endTimestamp;
      }

      start() {
        if (this.interval) clearInterval(this.interval);

        const endTimestamp = this.getEndTimestamp();
        if (!endTimestamp) return;

        const pad = (value) => String(Math.max(0, value)).padStart(2, '0');
        const daysEl = this.querySelector('[data-cd-days]');
        const hoursEl = this.querySelector('[data-cd-hours]');
        const minutesEl = this.querySelector('[data-cd-minutes]');
        const secondsEl = this.querySelector('[data-cd-seconds]');

        const render = () => {
          const secondsRemaining = Math.max(0, Math.floor((endTimestamp - Date.now()) / 1000));
          let secondsLeftToDistribute = secondsRemaining;

          if (daysEl) {
            const days = Math.floor(secondsLeftToDistribute / 86400);
            secondsLeftToDistribute -= days * 86400;
            daysEl.textContent = pad(days);
          }
          if (hoursEl) {
            const hoursLeft = Math.floor(secondsLeftToDistribute / 3600);
            secondsLeftToDistribute -= hoursLeft * 3600;
            hoursEl.textContent = pad(hoursLeft);
          }
          if (minutesEl) {
            const minutesLeft = Math.floor(secondsLeftToDistribute / 60);
            secondsLeftToDistribute -= minutesLeft * 60;
            minutesEl.textContent = pad(minutesLeft);
          }
          if (secondsEl) {
            secondsEl.textContent = pad(secondsLeftToDistribute);
          }

          return secondsRemaining > 0;
        };

        if (!render()) return;
        this.interval = setInterval(() => {
          if (!render()) clearInterval(this.interval);
        }, 1000);
      }
    });
  }

  if (!customElements.get('blocky-bundle-deals')) {
    customElements.define('blocky-bundle-deals', class extends HTMLElement {
      connectedCallback() {
        if (this.initialized) return;
        this.initialized = true;

        this.addEventListener('click', (event) => {
          const card = event.target.closest('.blocky-bd-card');
          if (card) this.selectCard(card);
        });

        const preselected = this.querySelector('.blocky-bd-card.is-selected');
        if (preselected) this.applyQuantity(preselected);
      }

      selectCard(card) {
        this.querySelectorAll('.blocky-bd-card').forEach((item) => {
          item.classList.toggle('is-selected', item === card);
        });
        this.applyQuantity(card);
      }

      applyQuantity(card) {
        const quantity = Math.max(1, parseInt(card.dataset.bdQuantity, 10) || 1);
        const root = this.closest('blocky-featured-product');
        if (!root) return;

        const quantityInput = root.querySelector('[data-blocky-quantity-input]');
        if (quantityInput) {
          quantityInput.value = quantity;
          quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }

        const formQuantity = root.querySelector('[data-blocky-form-quantity]');
        if (formQuantity) formQuantity.value = quantity;
      }
    });
  }

  if (!customElements.get('blocky-bundle-stack')) {
    customElements.define('blocky-bundle-stack', class extends HTMLElement {
      connectedCallback() {
        if (this.initialized) return;
        this.initialized = true;

        this.addEventListener('click', (event) => {
          const row = event.target.closest('.blocky-bs-row');
          if (row) this.selectRow(row);
        });

        const preselected = this.querySelector('.blocky-bs-row.is-selected');
        if (preselected) this.applyQuantity(preselected);
      }

      selectRow(row) {
        this.querySelectorAll('.blocky-bs-row').forEach((item) => {
          const selected = item === row;
          item.classList.toggle('is-selected', selected);
          item.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
        this.applyQuantity(row);
      }

      applyQuantity(row) {
        const quantity = Math.max(1, parseInt(row.dataset.bsQuantity, 10) || 1);
        const root = this.closest('blocky-featured-product');
        if (!root) return;

        const quantityInput = root.querySelector('[data-blocky-quantity-input]');
        if (quantityInput) {
          quantityInput.value = quantity;
          quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }

        const formQuantity = root.querySelector('[data-blocky-form-quantity]');
        if (formQuantity) formQuantity.value = quantity;
      }
    });
  }

  if (!customElements.get('blocky-delivery')) {
    customElements.define('blocky-delivery', class extends HTMLElement {
      connectedCallback() {
        this.triggers = Array.from(this.querySelectorAll('[data-bd-open]'));
        this.panels = Array.from(this.querySelectorAll('[data-bd-panel]'));
        this.overlay = this.querySelector('[data-bd-overlay]');

        this.onTriggerClick = this.onTriggerClick.bind(this);
        this.onCloseClick = this.onCloseClick.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onDocumentClick = this.onDocumentClick.bind(this);

        this.triggers.forEach((trigger) => trigger.addEventListener('click', this.onTriggerClick));
        this.querySelectorAll('[data-bd-close]').forEach((button) => button.addEventListener('click', this.onCloseClick));
        if (this.overlay) this.overlay.addEventListener('click', this.onCloseClick);

        document.addEventListener('click', this.onDocumentClick);
        document.addEventListener('keydown', this.onKeyDown);
      }

      disconnectedCallback() {
        document.removeEventListener('click', this.onDocumentClick);
        document.removeEventListener('keydown', this.onKeyDown);
      }

      onTriggerClick(event) {
        event.preventDefault();
        event.stopPropagation();

        var name = event.currentTarget.getAttribute('data-bd-open');
        var panel = this.querySelector('[data-bd-panel="' + name + '"]');
        var isOpen = panel && !panel.hidden;

        this.closeAll();
        if (!isOpen) this.open(name, panel);
      }

      onCloseClick(event) {
        event.preventDefault();
        this.closeAll();
      }

      onDocumentClick(event) {
        if (event.target.closest('[data-bd-panel]')) return;
        this.closeAll();
      }

      onKeyDown(event) {
        if (event.key === 'Escape' || event.code === 'Escape') this.closeAll();
      }

      open(name, panel) {
        if (!panel) return;
        panel.hidden = false;
        panel.classList.add('is-open');

        var trigger = this.querySelector('[data-bd-open="' + name + '"]');
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'true');
          trigger.classList.add('is-open');
        }

        if (this.overlay && name === 'modal') this.overlay.hidden = false;
      }

      closeAll() {
        this.panels.forEach((panel) => {
          panel.hidden = true;
          panel.classList.remove('is-open');
        });

        if (this.overlay) this.overlay.hidden = true;

        this.triggers.forEach((trigger) => {
          trigger.setAttribute('aria-expanded', 'false');
          trigger.classList.remove('is-open');
        });
      }
    });
  }
