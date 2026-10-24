/**
 * Waymelo Variant Selector Component for Quick-Choose Popups
 */
if (!customElements.get('waymelo-variant-selector')) {
  customElements.define(
    'waymelo-variant-selector',
    class WaymeloVariantSelector extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        const jsonEl = this.querySelector('.waymelo-variant-data-json');
        if (!jsonEl) return;

        try {
          this.variantsData = JSON.parse(jsonEl.textContent);
        } catch (e) {
          console.error('Failed to parse variant data', e);
          return;
        }

        this.form = this.querySelector('form');
        this.variantIdInput = this.querySelector('input[name="id"]');
        this.mainImage = this.querySelector('.waymelo-popup-main-image');
        this.salePrice = this.querySelector('.waymelo-popup-sale-price');
        this.comparePrice = this.querySelector('.waymelo-popup-compare-price');
        this.discountBadge = this.querySelector('.waymelo-popup-discount-badge');
        this.stockDot = this.querySelector('.stock-indicator-dot');
        this.stockText = this.querySelector('.stock-indicator-text');
        this.stockWrap = this.querySelector('.waymelo-popup-stock-indicator');
        this.submitButton = this.querySelector('.waymelo-popup-submit-btn');
        this.submitButtonText = this.submitButton ? this.submitButton.querySelector('span:first-child') : null;

        this.initPills();
        this.initThumbs();
      }

      initPills() {
        this.querySelectorAll('.waymelo-option-pill').forEach((pill) => {
          pill.addEventListener('click', (e) => {
            e.preventDefault();
            this.handlePillSelection(pill);
          });
        });
      }

      handlePillSelection(clickedPill) {
        const group = clickedPill.closest('.waymelo-popup-option-group');
        if (!group) return;

        group.querySelectorAll('.waymelo-option-pill').forEach((p) => p.classList.remove('is-active'));
        clickedPill.classList.add('is-active');

        const labelVal = group.querySelector('.option-selected-value-text');
        if (labelVal) {
          labelVal.textContent = clickedPill.dataset.value;
        }

        this.updateVariantState(clickedPill);
      }

      getSelectedOptionValues() {
        const groups = Array.from(this.querySelectorAll('.waymelo-popup-option-group'));
        return groups.map((g) => {
          const active = g.querySelector('.waymelo-option-pill.is-active');
          return active ? active.dataset.value : null;
        });
      }

      updateVariantState(clickedPill) {
        const selectedValues = this.getSelectedOptionValues();
        if (!this.variantsData || !this.variantsData.length) return;

        const currentVariant = this.variantsData.find((variant) => {
          return variant.options.every((optVal, idx) => optVal === selectedValues[idx]);
        });

        if (currentVariant) {
          if (this.variantIdInput) {
            this.variantIdInput.value = currentVariant.id;
          }

          // Update prices
          if (this.salePrice) {
            this.salePrice.innerHTML = currentVariant.price_formatted;
          }

          if (this.comparePrice) {
            if (currentVariant.compare_at_price > currentVariant.price) {
              this.comparePrice.innerHTML = currentVariant.compare_at_price_formatted;
              this.comparePrice.classList.remove('is-hidden');
              if (this.discountBadge) {
                const savings = Math.round(
                  ((currentVariant.compare_at_price - currentVariant.price) * 100) / currentVariant.compare_at_price
                );
                this.discountBadge.textContent = `SAVE ${savings}%`;
                this.discountBadge.classList.remove('is-hidden');
              }
            } else {
              this.comparePrice.classList.add('is-hidden');
              if (this.discountBadge) {
                this.discountBadge.classList.add('is-hidden');
              }
            }
          }

          // Update stock status & add button
          if (currentVariant.available) {
            if (this.stockWrap) this.stockWrap.classList.remove('is-out');
            if (this.stockText) this.stockText.textContent = 'In Stock';
            if (this.submitButton) {
              this.submitButton.removeAttribute('disabled');
              if (this.submitButtonText) {
                this.submitButtonText.textContent = window.variantStrings?.addToCart || 'Add to cart';
              }
            }
          } else {
            if (this.stockWrap) this.stockWrap.classList.add('is-out');
            if (this.stockText) this.stockText.textContent = 'Sold Out';
            if (this.submitButton) {
              this.submitButton.setAttribute('disabled', 'disabled');
              if (this.submitButtonText) {
                this.submitButtonText.textContent = window.variantStrings?.soldOut || 'Sold out';
              }
            }
          }

          // Update image
          if (currentVariant.image) {
            this.updateImage(currentVariant.image);
          } else if (clickedPill && clickedPill.dataset.variantImg) {
            this.updateImage(clickedPill.dataset.variantImg);
          }
        } else {
          // Combination does not exist
          if (this.stockWrap) this.stockWrap.classList.add('is-out');
          if (this.stockText) this.stockText.textContent = 'Unavailable';
          if (this.submitButton) {
            this.submitButton.setAttribute('disabled', 'disabled');
            if (this.submitButtonText) {
              this.submitButtonText.textContent = 'Unavailable';
            }
          }
        }
      }

      initThumbs() {
        const thumbBtns = this.querySelectorAll('.waymelo-popup-thumb-btn');
        thumbBtns.forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            thumbBtns.forEach((b) => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            const mediaUrl = btn.dataset.mediaUrl;
            if (mediaUrl) {
              this.updateImage(mediaUrl);
            }
          });
        });
      }

      updateImage(url) {
        if (!this.mainImage || this.mainImage.src === url) return;
        this.mainImage.style.opacity = '0.35';
        this.mainImage.style.transform = 'scale(0.98)';

        const tempImg = new Image();
        tempImg.onload = () => {
          this.mainImage.src = url;
          this.mainImage.style.opacity = '1';
          this.mainImage.style.transform = 'scale(1)';
        };
        tempImg.src = url;
      }
    }
  );
}
