(() => {
  const initializeTableOfContents = (root) => {
    if (!root || root.dataset.tocInitialized === 'true') return;

    const content = root.querySelector('[data-article-content]');
    const navigation = root.querySelector('[data-article-toc]');
    const list = root.querySelector('[data-article-toc-list]');
    if (!content || !navigation || !list) return;

    const headings = Array.from(content.querySelectorAll('h2, h3')).filter((heading) => heading.textContent.trim());
    if (!headings.length) return;

    const usedIds = new Set();
    headings.forEach((heading, index) => {
      let headingId = heading.id || heading.textContent
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      if (!headingId) headingId = `section-${index + 1}`;
      const baseId = headingId;
      let duplicateIndex = 2;
      while (usedIds.has(headingId) || (document.getElementById(headingId) && document.getElementById(headingId) !== heading)) {
        headingId = `${baseId}-${duplicateIndex}`;
        duplicateIndex += 1;
      }

      usedIds.add(headingId);
      heading.id = headingId;

      const item = document.createElement('li');
      if (heading.tagName === 'H3') item.classList.add('is-subheading');

      const link = document.createElement('a');
      link.href = `#${headingId}`;
      link.textContent = heading.textContent.trim();
      link.dataset.tocLink = headingId;
      item.appendChild(link);
      list.appendChild(item);
    });

    navigation.hidden = false;
    root.dataset.tocInitialized = 'true';

    list.addEventListener('click', (event) => {
      const link = event.target.closest('[data-toc-link]');
      if (!link) return;

      const target = document.getElementById(link.dataset.tocLink);
      if (!target) return;

      event.preventDefault();
      window.history.pushState(null, '', `#${target.id}`);
      target.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      });
    });

    document.dispatchEvent(new CustomEvent('waymelo:toc-ready', { detail: { root } }));

    if (!('IntersectionObserver' in window)) return;

    const links = Array.from(list.querySelectorAll('[data-toc-link]'));
    const observer = new IntersectionObserver((entries) => {
      const visibleHeading = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => first.boundingClientRect.top - second.boundingClientRect.top)[0];

      if (!visibleHeading) return;
      links.forEach((link) => link.classList.toggle('is-active', link.dataset.tocLink === visibleHeading.target.id));
    }, { rootMargin: '-18% 0px -68% 0px' });

    headings.forEach((heading) => observer.observe(heading));
  };

  const initializeAll = (scope = document) => {
    scope.querySelectorAll('[data-article-toc-root]').forEach(initializeTableOfContents);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeAll());
  } else {
    initializeAll();
  }

  document.addEventListener('shopify:section:load', (event) => initializeAll(event.target));
})();
