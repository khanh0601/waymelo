if (!customElements.get('product-addons')) {
  customElements.define(
    'product-addons',
    class ProductAddons extends HTMLElement {
      connectedCallback() {
        this.track = this.querySelector('[data-addons-track]');
        if (!this.track || this.initialized) return;

        this.initialized = true;
        this.previousButton = this.querySelector('[data-addons-previous]');
        this.nextButton = this.querySelector('[data-addons-next]');

        this.previousButton?.addEventListener('click', () => this.scroll(-1));
        this.nextButton?.addEventListener('click', () => this.scroll(1));
        this.track.addEventListener('scroll', () => this.updateArrows(), { passive: true });
        this.addEventListener('change', (event) => this.onVariantChange(event));

        if ('ResizeObserver' in window) {
          this.resizeObserver = new ResizeObserver(() => this.updateArrows());
          this.resizeObserver.observe(this.track);
        }

        requestAnimationFrame(() => this.updateArrows());
      }

      disconnectedCallback() {
        this.resizeObserver?.disconnect();
      }

      scroll(direction) {
        const card = this.track.querySelector('[data-addon-card]');
        if (!card) return;

        const gap = parseFloat(getComputedStyle(this.track).columnGap) || 0;
        this.track.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: 'smooth' });
      }

      updateArrows() {
        const maxScroll = Math.max(0, this.track.scrollWidth - this.track.clientWidth);
        const hasOverflow = maxScroll > 2;

        if (this.previousButton) this.previousButton.hidden = !hasOverflow || this.track.scrollLeft <= 2;
        if (this.nextButton) this.nextButton.hidden = !hasOverflow || this.track.scrollLeft >= maxScroll - 2;
      }

      onVariantChange(event) {
        const select = event.target.closest('[data-addon-variant-select]');
        if (!select) return;

        const card = select.closest('[data-addon-card]');
        const option = select.options[select.selectedIndex];
        const available = option.dataset.available === 'true';
        const input = card.querySelector('[data-addon-variant-input]');
        const price = card.querySelector('[data-addon-price]');
        const comparePrice = card.querySelector('[data-addon-compare-price]');
        const discount = card.querySelector('[data-addon-discount]');
        const image = card.querySelector('.product-addons__image');
        const button = card.querySelector('.product-addons__button');
        const buttonText = button?.querySelector('span:first-child');

        if (input) input.value = option.value;
        if (price) price.textContent = option.dataset.price || '';

        if (comparePrice) {
          comparePrice.textContent = option.dataset.comparePrice || '';
          comparePrice.hidden = !option.dataset.comparePrice;
        }

        if (discount) {
          const discountValue = Number(option.dataset.discount || 0);
          discount.textContent = discountValue > 0 ? `-${discountValue}%` : '';
          discount.hidden = discountValue <= 0;
        }

        if (image && option.dataset.image) {
          image.removeAttribute('srcset');
          image.src = option.dataset.image;
        }

        if (button) {
          button.disabled = !available;
          button.toggleAttribute('aria-disabled', !available);
        }
        if (buttonText) buttonText.textContent = available ? button.dataset.availableText || 'Add & Save' : 'Sold out';
      }
    }
  );
}
