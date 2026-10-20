/*
  BKY - Reviews Section behavior.
  - Star filter pills show/hide the pre-rendered review entries by rating.
  - The gallery prev/next controls scroll the review-image strip only.
  - A dedicated pagination control below the list pages the review entries three
    at a time in the "All Reviews" view.
  - Clicking a review photo (in the gallery or a review entry) opens it enlarged
    in a section-scoped image viewer with previous/next navigation and a caption.
  Entries render visible by default, so the list stays readable without JavaScript.
*/
(function () {
  'use strict';

  // Reviews shown per page in the "All Reviews" view. Fixed by design.
  var PAGE_SIZE = 3;

  function getState(root) {
    if (!root._rsState) {
      root._rsState = { filter: 'all', page: 1 };
    }
    return root._rsState;
  }

  function getReviews(root) {
    return root.querySelectorAll('[data-rating]');
  }

  function isPagingActive(state, total) {
    return state.filter === 'all' && total > PAGE_SIZE;
  }

  function galleryStep(gallery) {
    var item = gallery.querySelector('.reviews-section__gallery-item');
    if (!item) {
      return Math.round(gallery.clientWidth * 0.8);
    }
    var styles = window.getComputedStyle(gallery);
    var gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
    return Math.round(item.getBoundingClientRect().width + gap);
  }

  function scrollGallery(root, direction) {
    var gallery = root.querySelector('[data-rs-gallery]');
    if (!gallery) {
      return;
    }
    gallery.scrollBy({ left: direction * galleryStep(gallery), behavior: 'smooth' });
  }

  function updatePagination(root, pagingActive, page, pageCount) {
    var container = root.querySelector('[data-rs-pagination]');
    var prev = root.querySelector('[data-rs-page-prev]');
    var next = root.querySelector('[data-rs-page-next]');
    var status = root.querySelector('[data-rs-page-status]');

    if (container) {
      container.hidden = !pagingActive;
    }
    if (prev) {
      prev.disabled = pagingActive && page <= 1;
    }
    if (next) {
      next.disabled = pagingActive && page >= pageCount;
    }
    if (status) {
      var label = 'Page ' + page + ' of ' + pageCount;
      if (status.textContent !== label) {
        status.textContent = label;
      }
    }

    root.setAttribute('data-rs-page', String(page));
    root.setAttribute('data-rs-pages', String(pageCount));
  }

  // Apply the current filter and page to the pre-rendered review entries.
  function applyView(root) {
    var state = getState(root);
    var reviews = getReviews(root);
    var total = reviews.length;
    var pagingActive = isPagingActive(state, total);
    var pageCount = pagingActive ? Math.ceil(total / PAGE_SIZE) : 1;

    if (state.page > pageCount) {
      state.page = pageCount;
    }
    if (state.page < 1) {
      state.page = 1;
    }

    var start = (state.page - 1) * PAGE_SIZE;

    Array.prototype.forEach.call(reviews, function (review, index) {
      var show;
      if (state.filter === 'all') {
        show = !pagingActive || (index >= start && index < start + PAGE_SIZE);
      } else {
        show = review.getAttribute('data-rating') === state.filter;
      }
      review.hidden = !show;
    });

    updatePagination(root, pagingActive, state.page, pageCount);
  }

  function handlePage(root, direction) {
    var state = getState(root);
    var total = getReviews(root).length;
    if (!isPagingActive(state, total)) {
      return;
    }
    state.page += direction;
    applyView(root);
  }

  function handleFilter(root, pill) {
    var state = getState(root);
    state.filter = pill.getAttribute('data-rs-filter');
    state.page = 1;

    var pills = root.querySelectorAll('[data-rs-filter]');
    Array.prototype.forEach.call(pills, function (other) {
      var active = other === pill;
      other.classList.toggle('is-active', active);
      other.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    applyView(root);
  }

  // ---- Image viewer -------------------------------------------------------

  function getViewer(root) {
    return root.querySelector('[data-rs-viewer]');
  }

  function getPhotos(root) {
    return root.querySelectorAll('[data-rs-photo-open]');
  }

  function getViewerState(root) {
    if (!root._rsViewer) {
      root._rsViewer = { index: 0, opener: null, prevOverflow: '' };
    }
    return root._rsViewer;
  }

  function photoInfo(photo) {
    var img = photo.querySelector('img');
    var caption = photo.getAttribute('data-rs-caption') || '';
    var alt = photo.getAttribute('data-rs-alt') || (img ? img.getAttribute('alt') : '') || '';
    var label = caption || alt || 'Review photo';
    return {
      src: photo.getAttribute('data-rs-full') || (img ? img.getAttribute('src') : ''),
      alt: label,
      caption: label
    };
  }

  function renderViewer(root, index) {
    var viewer = getViewer(root);
    var photos = getPhotos(root);
    if (!viewer || !photos[index]) {
      return;
    }
    var info = photoInfo(photos[index]);
    var image = viewer.querySelector('[data-rs-viewer-image]');
    var caption = viewer.querySelector('[data-rs-viewer-caption]');
    var prev = viewer.querySelector('[data-rs-viewer-prev]');
    var next = viewer.querySelector('[data-rs-viewer-next]');
    var single = photos.length <= 1;

    if (image) {
      image.setAttribute('src', info.src);
      image.setAttribute('alt', info.alt);
    }
    if (caption) {
      caption.textContent = info.caption;
    }
    if (prev) {
      prev.hidden = single;
      prev.disabled = index <= 0;
    }
    if (next) {
      next.hidden = single;
      next.disabled = index >= photos.length - 1;
    }
    getViewerState(root).index = index;
  }

  function openViewer(root, photo) {
    var viewer = getViewer(root);
    if (!viewer) {
      return;
    }
    var photos = getPhotos(root);
    var index = Array.prototype.indexOf.call(photos, photo);
    var state = getViewerState(root);
    state.opener = photo;
    state.prevOverflow = document.body.style.overflow || '';
    viewer.hidden = false;
    document.body.style.overflow = 'hidden';
    renderViewer(root, index < 0 ? 0 : index);
    var close = viewer.querySelector('[data-rs-viewer-close]');
    if (close) {
      close.focus();
    }
  }

  function closeViewer(root) {
    var viewer = getViewer(root);
    var state = getViewerState(root);
    if (!viewer || viewer.hidden) {
      return;
    }
    viewer.hidden = true;
    document.body.style.overflow = state.prevOverflow || '';
    if (state.opener && state.opener.focus) {
      state.opener.focus();
    }
    state.opener = null;
  }

  // Re-hide the viewer after a theme-editor re-render even if it was open.
  function resetViewer(root) {
    var viewer = getViewer(root);
    var state = getViewerState(root);
    if (viewer && !viewer.hidden) {
      viewer.hidden = true;
      document.body.style.overflow = state.prevOverflow || '';
    }
    state.opener = null;
  }

  function stepViewer(root, direction) {
    var photos = getPhotos(root);
    var index = getViewerState(root).index + direction;
    if (index < 0) {
      index = 0;
    }
    if (index > photos.length - 1) {
      index = photos.length - 1;
    }
    renderViewer(root, index);
  }

  function isViewerOpen(root) {
    var viewer = getViewer(root);
    return !!viewer && !viewer.hidden;
  }

  // Keep Tab / Shift+Tab cycling through the viewer's controls while it is open.
  function trapViewerFocus(viewer, event) {
    var controls = viewer.querySelectorAll(
      '[data-rs-viewer-close], [data-rs-viewer-prev], [data-rs-viewer-next]'
    );
    var list = [];
    Array.prototype.forEach.call(controls, function (control) {
      if (!control.hidden && !control.disabled) {
        list.push(control);
      }
    });
    if (!list.length) {
      return;
    }
    var first = list[0];
    var last = list[list.length - 1];
    var active = document.activeElement;
    if (event.shiftKey) {
      if (active === first || !viewer.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || !viewer.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleViewerKeydown(root, event) {
    if (!isViewerOpen(root)) {
      return;
    }
    if (event.key === 'Escape' || event.key === 'Esc') {
      event.preventDefault();
      closeViewer(root);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      stepViewer(root, -1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      stepViewer(root, 1);
    } else if (event.key === 'Tab') {
      trapViewerFocus(getViewer(root), event);
    }
  }

  // One delegated listener per root survives theme-editor re-renders of the
  // controls and keeps initialization idempotent.
  function bindControls(root) {
    if (root.dataset.rsBound === 'true') {
      return;
    }
    root.dataset.rsBound = 'true';

    root.addEventListener('click', function (event) {
      var target = event.target;
      if (!target || !target.closest) {
        return;
      }

      if (isViewerOpen(root)) {
        var viewer = getViewer(root);
        if (target.closest('[data-rs-viewer-close]')) {
          closeViewer(root);
          return;
        }
        if (target.closest('[data-rs-viewer-prev]')) {
          stepViewer(root, -1);
          return;
        }
        if (target.closest('[data-rs-viewer-next]')) {
          stepViewer(root, 1);
          return;
        }
        // A click on the overlay outside the enlarged image closes the viewer.
        if (viewer.contains(target) && !target.closest('[data-rs-viewer-image]')) {
          closeViewer(root);
          return;
        }
      }

      var photo = target.closest('[data-rs-photo-open]');
      if (photo) {
        openViewer(root, photo);
        return;
      }

      var pill = target.closest('[data-rs-filter]');
      if (pill) {
        handleFilter(root, pill);
        return;
      }

      var pageNext = target.closest('[data-rs-page-next]');
      var pagePrev = target.closest('[data-rs-page-prev]');
      if (pageNext || pagePrev) {
        handlePage(root, pageNext ? 1 : -1);
        return;
      }

      var galleryNext = target.closest('[data-rs-gallery-next]');
      var galleryPrev = target.closest('[data-rs-gallery-prev]');
      if (galleryNext || galleryPrev) {
        scrollGallery(root, galleryNext ? 1 : -1);
      }
    });

    root.addEventListener('keydown', function (event) {
      handleViewerKeydown(root, event);
    });
  }

  function initSection(root) {
    getState(root);
    getViewerState(root);
    resetViewer(root);
    bindControls(root);
    applyView(root);
  }

  function initAll(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll('[data-rs]'), initSection);
  }

  function onSectionLoad(event) {
    var target = event.target;
    var root = null;
    if (target.matches && target.matches('[data-rs]')) {
      root = target;
    } else if (target.querySelector) {
      root = target.querySelector('[data-rs]');
    }
    if (root) {
      initSection(root);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initAll(document);
    });
  } else {
    initAll(document);
  }

  document.addEventListener('shopify:section:load', onSectionLoad);

  // Re-apply the active filter and page after the theme editor re-renders blocks.
  document.addEventListener('shopify:block:select', function (event) {
    var root = event.target.closest ? event.target.closest('[data-rs]') : null;
    if (root) {
      initSection(root);
    }
  });
})();
