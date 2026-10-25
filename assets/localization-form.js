if (!customElements.get('localization-form')) {
  customElements.define(
    'localization-form',
    class LocalizationForm extends HTMLElement {
      constructor() {
        super();
        this.mql = window.matchMedia('(min-width: 750px)');
        this.header = document.querySelector('.header-wrapper');
        this.elements = {
          input: this.querySelector('input[name="locale_code"], input[name="country_code"]'),
          button: this.querySelector('button.localization-form__select'),
          panel: this.querySelector('.disclosure__list-wrapper'),
          search: this.querySelector('input[name="country_filter"]'),
          closeButton: this.querySelector('.country-selector__close-button'),
          resetButton: this.querySelector('.country-filter__reset-button'),
          searchIcon: this.querySelector('.country-filter__search-icon'),
          liveRegion: this.querySelector('#sr-country-search-results'),
        };
        this.countryOptionsHydrated = false;
        this.addEventListener('keyup', this.onContainerKeyUp.bind(this));
        this.addEventListener('keydown', this.onContainerKeyDown.bind(this));
        this.addEventListener('focusout', this.closeSelector.bind(this));
        this.elements.button.addEventListener('click', this.openSelector.bind(this));
        this.elements.button.addEventListener('pointerenter', () => LocalizationForm.loadCountryData(), { once: true });

        if (this.elements.search) {
          this.elements.search.addEventListener('keyup', this.filterCountries.bind(this));
          this.elements.search.addEventListener('focus', this.onSearchFocus.bind(this));
          this.elements.search.addEventListener('blur', this.onSearchBlur.bind(this));
          this.elements.search.addEventListener('keydown', this.onSearchKeyDown.bind(this));
        }
        if (this.elements.closeButton) {
          this.elements.closeButton.addEventListener('click', this.hidePanel.bind(this));
        }
        if (this.elements.resetButton) {
          this.elements.resetButton.addEventListener('click', this.resetFilter.bind(this));
          this.elements.resetButton.addEventListener('mousedown', (event) => event.preventDefault());
        }

        this.bindCountryOptionLinks();
      }

      bindCountryOptionLinks() {
        this.querySelectorAll('[data-country-option]').forEach((item) => {
          if (item.dataset.countryOptionBound === 'true') return;
          item.dataset.countryOptionBound = 'true';
          item.addEventListener('click', this.onItemClick.bind(this));
        });
      }

      createCountryList(countries, className, ariaLabel, selectedIso, showCurrencies, idPrefix) {
        const list = document.createElement('ul');
        list.className = `list-unstyled ${className}`;
        list.setAttribute('role', 'list');
        if (ariaLabel) list.setAttribute('aria-label', ariaLabel);

        countries.forEach((country) => {
          const item = document.createElement('li');
          item.className = 'disclosure__item';
          item.tabIndex = -1;

          const link = document.createElement('a');
          link.className = 'link link--text disclosure__link caption-large focus-inset';
          link.href = '#';
          link.dataset.value = country.iso;
          link.dataset.countryOption = '';
          link.id = `${idPrefix}-${country.iso}`;

          const indicator = document.createElement('span');
          if (country.iso === selectedIso) {
            link.setAttribute('aria-current', 'true');
            indicator.innerHTML = '<svg class="icon icon-checkmark" aria-hidden="true" focusable="false" viewBox="0 0 12 9" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.35.643a.5.5 0 01.006.707l-6.77 6.886a.5.5 0 01-.719-.006L.638 4.845a.5.5 0 11.724-.69l2.872 3.011 6.41-6.517a.5.5 0 01.707-.006h-.001z" fill="currentColor"/></svg>';
          } else {
            indicator.className = 'visibility-hidden localization-check-placeholder';
          }

          const name = document.createElement('span');
          name.className = 'country';
          name.textContent = country.name;

          link.append(indicator, name);
          if (showCurrencies) {
            const currency = document.createElement('span');
            currency.className = 'localization-form__currency motion-reduce';
            currency.textContent = `${country.currencyCode} ${country.currencySymbol}`;
            link.append(currency);
          }

          item.append(link);
          list.append(item);
        });

        return list;
      }

      hydrateCountryOptions() {
        if (this.countryOptionsHydrated) return;
        const root = this.querySelector('[data-country-options]');
        if (!root) return;

        const dataNode = document.getElementById('WaymeloCountryData');
        if (dataNode) {
          this.renderCountryOptions(root, LocalizationForm.parseCountryData(dataNode.textContent));
          return;
        }

        if (this.countryOptionsLoading) return;
        this.countryOptionsLoading = true;
        root.setAttribute('aria-busy', 'true');
        LocalizationForm.loadCountryData().then((countries) => {
          this.countryOptionsLoading = false;
          root.removeAttribute('aria-busy');
          this.renderCountryOptions(root, countries);
          if (this.elements.search && this.elements.search.value) this.filterCountries();
        });
      }

      static parseCountryData(text) {
        try {
          return JSON.parse(text).countries || [];
        } catch (error) {
          return [];
        }
      }

      /* The country list is no longer inlined in every page; it is fetched once, on demand,
         from sections/waymelo-country-data.liquid via the Section Rendering API. */
      static loadCountryData() {
        if (!LocalizationForm.countryDataPromise) {
          const rootUrl = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
          LocalizationForm.countryDataPromise = fetch(`${rootUrl}?sections=waymelo-country-data`, {
            headers: { Accept: 'application/json' },
          })
            .then((response) => response.json())
            .then((json) => {
              const html = json && json['waymelo-country-data'];
              if (!html) return [];
              const doc = new DOMParser().parseFromString(html, 'text/html');
              const node = doc.getElementById('WaymeloCountryData');
              return node ? LocalizationForm.parseCountryData(node.textContent) : [];
            })
            .catch(() => {
              LocalizationForm.countryDataPromise = null;
              return [];
            });
        }
        return LocalizationForm.countryDataPromise;
      }

      renderCountryOptions(root, countries) {
        if (this.countryOptionsHydrated || !countries.length) return;

        const selectedIso = this.elements.input?.value || '';
        const showCurrencies = root.dataset.showCurrencies === 'true';
        const fragment = document.createDocumentFragment();

        if (root.dataset.showPopular === 'true') {
          const popularCountries = countries.filter((country) => country.popular);
          if (popularCountries.length) {
            fragment.append(
              this.createCountryList(
                popularCountries,
                'popular-countries',
                root.dataset.popularLabel || '',
                selectedIso,
                showCurrencies,
                `${root.id}-popular`
              )
            );
          }
        }

        fragment.append(
          this.createCountryList(countries, 'countries', '', selectedIso, showCurrencies, `${root.id}-all`)
        );
        root.replaceChildren(fragment);
        this.countryOptionsHydrated = true;
        this.bindCountryOptionLinks();
      }

      hidePanel() {
        this.elements.button.setAttribute('aria-expanded', 'false');
        this.elements.panel.setAttribute('hidden', true);
        if (this.elements.search) {
          this.elements.search.value = '';
          this.filterCountries();
          this.elements.search.setAttribute('aria-activedescendant', '');
        }
        document.body.classList.remove('overflow-hidden-mobile');
        document.querySelector('.menu-drawer').classList.remove('country-selector-open');
        this.header.preventHide = false;
      }

      onContainerKeyDown(event) {
        this.hydrateCountryOptions();
        const focusableItems = Array.from(this.querySelectorAll('[data-country-option]')).filter(
          (item) => !item.parentElement.classList.contains('hidden')
        );
        let focusedItemIndex = focusableItems.findIndex((item) => item === document.activeElement);
        let itemToFocus;

        switch (event.code.toUpperCase()) {
          case 'ARROWUP':
            if (!focusableItems.length) return;
            event.preventDefault();
            itemToFocus =
              focusedItemIndex > 0 ? focusableItems[focusedItemIndex - 1] : focusableItems[focusableItems.length - 1];
            itemToFocus.focus();
            break;
          case 'ARROWDOWN':
            if (!focusableItems.length) return;
            event.preventDefault();
            itemToFocus =
              focusedItemIndex < focusableItems.length - 1 ? focusableItems[focusedItemIndex + 1] : focusableItems[0];
            itemToFocus.focus();
            break;
        }

        if (!this.elements.search) return;

        setTimeout(() => {
          focusedItemIndex = focusableItems.findIndex((item) => item === document.activeElement);
          if (focusedItemIndex > -1) {
            this.elements.search.setAttribute('aria-activedescendant', focusableItems[focusedItemIndex].id);
          } else {
            this.elements.search.setAttribute('aria-activedescendant', '');
          }
        });
      }

      onContainerKeyUp(event) {
        event.preventDefault();

        switch (event.code.toUpperCase()) {
          case 'ESCAPE':
            if (this.elements.button.getAttribute('aria-expanded') == 'false') return;
            this.hidePanel();
            event.stopPropagation();
            this.elements.button.focus();
            break;
          case 'SPACE':
            if (this.elements.button.getAttribute('aria-expanded') == 'true') return;
            this.openSelector();
            break;
        }
      }

      onItemClick(event) {
        event.preventDefault();
        const form = this.querySelector('form');
        this.elements.input.value = event.currentTarget.dataset.value;
        if (form) form.submit();
      }

      openSelector() {
        this.hydrateCountryOptions();
        this.elements.button.focus();
        this.elements.panel.toggleAttribute('hidden');
        this.elements.button.setAttribute(
          'aria-expanded',
          (this.elements.button.getAttribute('aria-expanded') === 'false').toString()
        );
        if (!document.body.classList.contains('overflow-hidden-tablet')) {
          document.body.classList.add('overflow-hidden-mobile');
        }
        if (this.elements.search && this.mql.matches) {
          this.elements.search.focus();
        }
        if (this.hasAttribute('data-prevent-hide')) {
          this.header.preventHide = true;
        }
        document.querySelector('.menu-drawer').classList.add('country-selector-open');
      }

      closeSelector(event) {
        if (
          event.target.classList.contains('country-selector__overlay') ||
          !this.contains(event.target) ||
          !this.contains(event.relatedTarget)
        ) {
          this.hidePanel();
        }
      }

      normalizeString(str) {
        return str
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase();
      }

      filterCountries() {
        const searchValue = this.normalizeString(this.elements.search.value);
        const popularCountries = this.querySelector('.popular-countries');
        const allCountries = this.querySelectorAll('[data-country-option]');
        let visibleCountries = 0;

        this.elements.resetButton.classList.toggle('hidden', !searchValue);

        if (popularCountries) {
          popularCountries.classList.toggle('hidden', searchValue);
        }

        allCountries.forEach((item) => {
          const countryName = this.normalizeString(item.querySelector('.country').textContent);
          if (countryName.indexOf(searchValue) > -1) {
            item.parentElement.classList.remove('hidden');
            visibleCountries++;
          } else {
            item.parentElement.classList.add('hidden');
          }
        });

        if (this.elements.liveRegion) {
          this.elements.liveRegion.innerHTML = window.accessibilityStrings.countrySelectorSearchCount.replace(
            '[count]',
            visibleCountries
          );
        }

        this.querySelector('.country-selector').scrollTop = 0;
        this.querySelector('.country-selector__list').scrollTop = 0;
      }

      resetFilter(event) {
        event.stopPropagation();
        this.elements.search.value = '';
        this.filterCountries();
        this.elements.search.focus();
      }

      onSearchFocus() {
        this.elements.searchIcon.classList.add('country-filter__search-icon--hidden');
      }

      onSearchBlur() {
        if (!this.elements.search.value) {
          this.elements.searchIcon.classList.remove('country-filter__search-icon--hidden');
        }
      }

      onSearchKeyDown(event) {
        if (event.code.toUpperCase() === 'ENTER') {
          event.preventDefault();
        }
      }
    }
  );
}
