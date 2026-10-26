/*
  BKY - Product Server Rating teaser.
  Mirrors the on-page reviews section's aggregate (average rating and total
  review count) into every [data-product-server-rating] block, so the product
  page's rating teaser always matches the reviews section.

  The reviews section is the single source of truth. This script reads, in
  order of preference:
    1. the data attributes on the reviews root ([data-rs-avg], [data-rs-avg-pct],
       [data-rs-total]); then
    2. the reviews summary markup that already exists on the page
       (.reviews-section__average-value text and the --rs-rating-pct custom
       property on the summary stars).
  The teaser ships hidden and is revealed only when a valid aggregate is found,
  so no fabricated or stale value is shown.
*/
(function () {
  'use strict';

  function parseNumber(value) {
    if (value === null || value === undefined) {
      return null;
    }
    var n = parseFloat(String(value).replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? n : null;
  }

  function getTeasers() {
    return document.querySelectorAll('[data-product-server-rating]');
  }

  function readSummaryAvg(root) {
    var el = root.querySelector('.reviews-section__summary .reviews-section__average-value');
    return el ? parseNumber(el.textContent) : null;
  }

  function readSummaryPct(root) {
    var stars = root.querySelector('.reviews-section__summary .reviews-section__stars');
    if (!stars) {
      return null;
    }
    var value = stars.style && stars.style.getPropertyValue ? stars.style.getPropertyValue('--rs-rating-pct') : '';
    if (!value) {
      var styleAttr = stars.getAttribute('style') || '';
      var match = styleAttr.match(/--rs-rating-pct:\s*([0-9.]+)/);
      value = match ? match[1] : '';
    }
    return value ? parseNumber(value) : null;
  }

  function resolveHref(link, root) {
    // Keep the authored anchor when the reviews section exposes it; otherwise
    // fall back to the reviews root's own id so the link still reaches it.
    if (document.getElementById('trustshop-review')) {
      return;
    }
    if (root && root.id) {
      link.setAttribute('href', '#' + root.id);
    }
  }

  function hideAll(teasers) {
    Array.prototype.forEach.call(teasers, function (teaser) {
      // Review data is server-rendered, so once the DOM is parsed an empty
      // aggregate is final: collapse the row instead of leaving a blank gap.
      teaser.hidden = true;
      teaser.classList.add('is-pending');
      teaser.setAttribute('aria-hidden', 'true');
    });
  }

  function syncTeaser(teaser, avg, avgPct, total, root) {
    var stars = teaser.querySelector('.product-server-rating__stars');
    var count = teaser.querySelector('.product-server-rating__count');
    var link = teaser.querySelector('.product-server-rating');

    if (stars) {
      stars.style.setProperty('--rating-percent', avgPct + '%');
    }
    if (count) {
      count.textContent = '(' + total + ')';
    }
    if (link) {
      link.setAttribute('aria-label', avg + ' out of 5 stars, ' + total + ' reviews');
      resolveHref(link, root);
    }

    teaser.hidden = false;
    teaser.classList.remove('is-pending');
    teaser.removeAttribute('aria-hidden');
  }

  function syncAll() {
    var teasers = getTeasers();
    if (!teasers.length) {
      return;
    }

    // The reviews section may be shipped lazily (inert <template>); until it is activated a
    // stub carrying the same aggregate attributes ([data-rs-aggregate]) stands in for it.
    var root = document.querySelector('[data-rs], [data-rs-aggregate]');
    if (!root) {
      hideAll(teasers);
      return;
    }

    var total = parseNumber(root.getAttribute('data-rs-total'));
    var avg = parseNumber(root.getAttribute('data-rs-avg'));
    var avgPct = parseNumber(root.getAttribute('data-rs-avg-pct'));

    if (avg === null) {
      avg = readSummaryAvg(root);
    }
    if (avgPct === null) {
      avgPct = readSummaryPct(root);
    }
    if (avgPct === null && avg !== null) {
      avgPct = Math.round(avg * 20 * 10) / 10;
    }

    // Degrade honestly: without a valid aggregate, leave every teaser hidden.
    if (total === null || total <= 0 || avg === null || avgPct === null) {
      hideAll(teasers);
      return;
    }

    Array.prototype.forEach.call(teasers, function (teaser) {
      syncTeaser(teaser, avg, avgPct, total, root);
    });
  }

  var scheduled = false;
  function scheduleSync() {
    if (scheduled) {
      return;
    }
    scheduled = true;
    var raf = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };
    raf(function () {
      scheduled = false;
      syncAll();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncAll);
  } else {
    syncAll();
  }

  // Re-sync at bounded lifecycle points. Avoid observing the entire document:
  // app widgets can create thousands of mutations during startup.
  window.addEventListener('load', syncAll);
  document.addEventListener('shopify:section:load', scheduleSync);
  document.addEventListener('shopify:block:select', scheduleSync);
})();
