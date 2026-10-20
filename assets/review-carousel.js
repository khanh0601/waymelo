document.addEventListener("DOMContentLoaded", function () {
  const horizontalTracks = document.querySelectorAll(".video-keen-track");
  
  let activeState = {
    isDown: false,
    startX: 0,
    startY: 0,
    currentTranslate: 0,
    prevTranslate: 0,
    lastX: 0,
    lastY: 0,
    velocity: 0,
    isDragging: false,
    track: null,
    slides: []
  };

  horizontalTracks.forEach(track => {
    const slides = Array.from(track.querySelectorAll(".video-slide"));
    if (slides.length === 0) return;

    slides.forEach(slide => slide.style.cursor = "pointer");

    slides.forEach(slide => {
      slide.addEventListener("mousedown", (e) => startDrag(e, track, slides));
      slide.addEventListener("touchstart", (e) => startDrag(e, track, slides), { passive: false });
      
      slide.addEventListener("click", function(e) {
        if (!activeState.isDragging) {
           openPopupFromSlide(this, track);
        }
      });
    });
  });

  function getPoint(e) {
    if (e.touches && e.touches[0]) return { x: e.touches[0].pageX, y: e.touches[0].pageY };
    if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY };
    return { x: e.pageX, y: e.pageY };
  }

  function startDrag(e, track, slides) {
    activeState.isDown = true;
    activeState.isDragging = false;
    activeState.track = track;
    activeState.slides = slides;
    
    const style = window.getComputedStyle(track);
    const matrix = new WebKitCSSMatrix(style.transform);
    activeState.prevTranslate = matrix.m41; 

    const p = getPoint(e);
    activeState.startX = p.x;
    activeState.startY = p.y;
    activeState.lastX = activeState.startX;
    activeState.velocity = 0;

    slides.forEach(s => s.style.cursor = "grabbing");
    track.style.transition = "none";
  }

  function moveDrag(e) {
    if (!activeState.isDown || !activeState.track) return;

    const p = getPoint(e);
    const x = p.x;
    const y = p.y;
    const deltaX = x - activeState.startX;
    const deltaY = y - activeState.startY;

    const DRAG_THRESHOLD = ("ontouchstart" in window) ? 10 : 5;
    if (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD) {
      activeState.isDragging = true;
    }

    if (activeState.isDragging) {
       e.preventDefault?.();
    }

    const nextTranslate = activeState.prevTranslate + deltaX;
    setTranslate(activeState.track, nextTranslate);

    activeState.velocity = x - activeState.lastX;
    activeState.lastX = x;
  }

  function setTranslate(track, x, withTransition = false) {
    track.style.transition = withTransition ? "transform 0.4s ease-out" : "none";
    
    const containerWidth = track.parentElement ? track.parentElement.getBoundingClientRect().width : 0;
    const trackWidth = track.scrollWidth;
    
    const minTranslate = -(trackWidth - containerWidth);
    const maxTranslate = 0;

    if (minTranslate >= 0) x = 0; 
    else {
        if (x > maxTranslate) x = maxTranslate;
        if (x < minTranslate) x = minTranslate;
    }

    activeState.currentTranslate = x;
    track.style.transform = `translate3d(${x}px,0,0)`;
  }

  function endDrag() {
    if (!activeState.isDown) return;
    activeState.isDown = false;

    const momentum = activeState.velocity * 20;
    setTranslate(activeState.track, activeState.currentTranslate + momentum, true);

    if (activeState.slides) {
        activeState.slides.forEach(s => s.style.cursor = "pointer");
    }
    
    setTimeout(() => {
        activeState.isDragging = false;
        activeState.track = null;
    }, 50);
  }

  document.addEventListener("mousemove", moveDrag);
  document.addEventListener("touchmove", moveDrag, { passive: false });
  ["mouseup", "touchend", "touchcancel", "mouseleave"].forEach(evt => {
    document.addEventListener(evt, endDrag);
  });
  
  const modalInstances = [];

  class VideoModal {
    constructor(modalEl, index) {
      this.modalEl = modalEl;
      this.index = index;
      
      this.container = modalEl.querySelector(".left_video_thumbnail");
      this.view = this.container ? this.container.querySelector(".thumb_view") : null;
      this.track = this.container ? this.container.querySelector(".thumb_track") : null;
      this.items = this.container ? Array.from(this.container.querySelectorAll(".thumb_item")) : [];
      this.prevBtn = this.container ? this.container.querySelector(".thumb_btn.prev") : null;
      this.nextBtn = this.container ? this.container.querySelector(".thumb_btn.next") : null;

      this.mainWrapper = modalEl.querySelector(".popup_main_video_wrapper");
      this.mainVideos = this.mainWrapper ? Array.from(this.mainWrapper.querySelectorAll(".main_video")) : [];
      
      this.closeBtn = modalEl.querySelector("#close-popup");
      
      this.currentIndex = 0;
      this.allMuted = false;

      // Scroll autoplay observer for main popup videos
      this._scrollObserver = null;

      this.init();
    }

    init() {
      if (!this.container || !this.mainWrapper) return;
      this._setupScrollObserver();
      this.updateSlider();
      this.addEventListeners();
    }
    _setupScrollObserver() {
      if (!this.mainWrapper) return;

      this._scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const wrap = entry.target;
          const video = wrap.querySelector("video");
          const btn = wrap.querySelector(".autoplay_button");
          if (!video) return;

          const idx = this.mainVideos.indexOf(wrap);

          if (entry.isIntersecting && idx === this.currentIndex) {
            video.muted = this.allMuted;
            video.play().catch(() => {});
            if (btn) btn.style.display = "none";
          } else {
            video.pause();
            video.muted = true;
            if (btn) btn.style.display = "block";
          }
        });
      }, {
        root: this.mainWrapper,
        threshold: 0.6
      });

      this.mainVideos.forEach(wrap => this._scrollObserver.observe(wrap));
    }

    addEventListeners() {
      this.items.forEach((item) => {
        item.addEventListener("click", () => {
          this.currentIndex = this.items.indexOf(item);
          this.updateSlider();
        });
      });

      this.nextBtn?.addEventListener("click", () => {
        if (this.currentIndex < this.items.length - 1) {
          this.currentIndex++;
          this.updateSlider();
        }
      });
      this.prevBtn?.addEventListener("click", () => {
        if (this.currentIndex > 0) {
          this.currentIndex--;
          this.updateSlider();
        }
      });

      const wheelHandler = (e) => {
        e.preventDefault();
        if (e.deltaY > 0 && this.currentIndex < this.items.length - 1) this.currentIndex++;
        else if (e.deltaY < 0 && this.currentIndex > 0) this.currentIndex--;
        this.updateSlider();
      };
      this.container.addEventListener("wheel", wheelHandler, { passive: false });
      this.mainWrapper.addEventListener("wheel", wheelHandler, { passive: false });

      // Manual click to toggle play/pause on main video
      this.mainVideos.forEach(wrap => {
        const video = wrap.querySelector("video");
        const btn = wrap.querySelector(".autoplay_button");
        if (!video) return;

        wrap.addEventListener("click", () => {
          if (video.paused) { 
            video.play().catch(() => {}); 
            if (btn) btn.style.display = "none"; 
          } else { 
            video.pause(); 
            if (btn) btn.style.display = "block"; 
          }
        });
        
        if (btn) {
            btn.addEventListener("click", (e) => {
                 e.stopPropagation();
                 video.play().catch(() => {});
                 btn.style.display = "none";
            });
        }
      });

      this.modalEl.querySelector(".speacker_button")?.addEventListener("click", () => {
        this.allMuted = !this.allMuted;
        this.mainVideos.forEach((wrap, index) => {
          const video = wrap.querySelector("video");
          if (video) video.muted = this.allMuted || index !== this.currentIndex;
        });
        
        const muteIcon = this.modalEl.querySelector(".mute_icon");
        const speakerIcon = this.modalEl.querySelector(".speaker_icon");
        if (muteIcon) muteIcon.style.display = this.allMuted ? "" : "none";
        if (speakerIcon) speakerIcon.style.display = this.allMuted ? "none" : "";
      });
      
      this.closeBtn?.addEventListener("click", () => this.close());
    }

    open(indexToOpen) {
      this.currentIndex = indexToOpen;
      this.modalEl.style.display = "block";
      document.body.style.overflow = "hidden";
      
      requestAnimationFrame(() => {
        this.updateSlider(true);

        // ── AUTOPLAY on click/open ──
        const activeWrap = this.mainVideos[this.currentIndex];
        if (activeWrap) {
          const video = activeWrap.querySelector("video");
          const btn = activeWrap.querySelector(".autoplay_button");
          if (video) {
            video.muted = this.allMuted;
            video.play().catch(() => {});
            if (btn) btn.style.display = "none";
          }
        }
      });
    }

    updateSlider(instant = false) {
      if (!this.view || !this.track || this.items.length === 0 || this.mainVideos.length === 0) return;

      // --- Thumbnails ---
      const GAP = 15;
      const VISIBLE_COUNT = 3;
      const itemHeight = this.items[0].getBoundingClientRect().height + GAP;
      const viewHeight = this.view.getBoundingClientRect().height;
      const trackHeight = this.items.length * itemHeight;
      const maxTranslate = Math.max(trackHeight - viewHeight, 0);

      let translateY = this.currentIndex * itemHeight - (itemHeight * Math.floor(VISIBLE_COUNT / 2));
      translateY = Math.max(0, Math.min(translateY, maxTranslate));
      this.track.style.transform = `translateY(-${translateY}px)`;

      this.items.forEach((item, idx) => {
        item.style.border = idx === this.currentIndex ? "2px solid #fff" : "2px solid transparent";
        item.style.opacity = idx === this.currentIndex ? "1" : "0.5";
      });

      if (this.prevBtn) this.prevBtn.classList.toggle("is-hidden", this.currentIndex === 0);
      if (this.nextBtn) this.nextBtn.classList.toggle("is-hidden", this.currentIndex === this.items.length - 1);

      
      this.mainVideos.forEach((wrap, index) => {
        const video = wrap.querySelector("video");
        const btn = wrap.querySelector(".autoplay_button");
        if (!video) return;

        if (index === this.currentIndex) {
          wrap.classList.add("active");
          video.muted = this.allMuted;
          // Autoplay when slider moves to this video
          video.play().catch(() => {});
          if (btn) btn.style.display = "none";
        } else {
          wrap.classList.remove("active");
          video.pause();
          video.muted = true;
          if (btn) btn.style.display = "block";
        }
      });

      // --- Scroll Main Wrapper ---
      let scrollPos = 0;
      if (this.mainVideos[this.currentIndex]) {
        scrollPos = this.mainVideos[this.currentIndex].offsetTop;
      }

      this.mainWrapper.scrollTo({ 
        top: scrollPos, 
        behavior: instant ? "auto" : "smooth" 
      });
      
      // --- Sidebar Products ---
      const products = Array.from(this.modalEl.querySelectorAll(".product_sidebar .collection-products"));
      if (products.length) {
        products.forEach(p => p.style.display = "none");
        if (products[this.currentIndex]) products[this.currentIndex].style.display = "";
      }
    }

    close() {
      this.modalEl.style.display = "none";
      document.body.style.overflow = "";

      this.mainVideos.forEach(wrap => {
        const video = wrap.querySelector("video");
        const btn = wrap.querySelector(".autoplay_button");
        if (!video) return;
        video.pause();
        video.currentTime = 0;
        video.muted = true;
        wrap.classList.remove("active");
        if (btn) btn.style.display = "block";
      });

      this.currentIndex = 0;
      this.items.forEach(it => { it.style.border = "2px solid transparent"; });
      if (this.items[0]) this.items[0].style.border = "2px solid #fff";
      if (this.track) this.track.style.transform = "translateY(0)";
      this.mainWrapper?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const modalElements = document.querySelectorAll("#video-popup");
  modalElements.forEach((el, index) => {
    modalInstances.push(new VideoModal(el, index));
  });


  function openPopupFromSlide(slideEl, trackEl) {
    const allTracks = Array.from(document.querySelectorAll(".video-keen-track"));
    const trackIndex = allTracks.indexOf(trackEl);
    
    const allSlidesInTrack = Array.from(trackEl.querySelectorAll(".video-slide"));
    const slideIndex = allSlidesInTrack.indexOf(slideEl);

    if (trackIndex === -1 || slideIndex === -1) return;

    const modalInstance = modalInstances[trackIndex];
    if (modalInstance) {
        modalInstance.open(slideIndex);
    }
  }

  if (window.innerWidth < 768) {
    modalElements.forEach((modalEl, index) => {
        const instance = modalInstances[index];
        if(!instance) return;

        let touchStartY = 0;
        let touchEndY = 0;
        let isDraggingVertically = false;

        const swipeTargets = [
            modalEl.querySelector(".left_video_thumbnail"),
            modalEl.querySelector(".popup_main_video_wrapper"),
        ].filter(Boolean);

        swipeTargets.forEach(target => {
            target.addEventListener("touchstart", function (e) {
                touchStartY = e.touches[0].clientY;
                isDraggingVertically = false;
            }, { passive: true });

            target.addEventListener("touchmove", function (e) {
                touchEndY = e.touches[0].clientY;
                const diff = touchStartY - touchEndY;
                if (Math.abs(diff) > 15) isDraggingVertically = true;
            }, { passive: true });

            target.addEventListener("touchend", function () {
                if (!isDraggingVertically) return;
                const diff = touchStartY - touchEndY;
                const SWIPE_THRESHOLD = 50;

                if (diff > SWIPE_THRESHOLD && instance.currentIndex < instance.items.length - 1) {
                    instance.currentIndex++;
                    instance.updateSlider();
                } else if (diff < -SWIPE_THRESHOLD && instance.currentIndex > 0) {
                    instance.currentIndex--;
                    instance.updateSlider();
                }
            }, { passive: true });
        });
    });
  }
});


document.addEventListener("DOMContentLoaded", function () {
  const viewButtons = document.querySelectorAll(".view_popup_products");
  const productSidebar = document.querySelector(".product_sidebar");
  const closeIcon = document.querySelector(".close_icon");

  viewButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const sidebar = button.closest("#video-popup")?.querySelector(".product_sidebar") || productSidebar;
      if (sidebar) sidebar.classList.add("active");
    });
  });

  if (closeIcon) {
    document.querySelectorAll(".close_icon").forEach(icon => {
        icon.addEventListener("click", function () {
             const sidebar = icon.closest(".product_sidebar");
             if (sidebar) sidebar.classList.remove("active");
        });
    });
  }
});


document.addEventListener("DOMContentLoaded", function () {
  const directAddButtons = document.querySelectorAll(".popup_single_product, .sort_add_to_cart, .product-item, .shop_now_btn");

  directAddButtons.forEach((el) => {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const variantId = el.getAttribute("data-variant-id") || el.closest("[data-variant-id]")?.getAttribute("data-variant-id");
      
      if (variantId) {
        fetch(window.Shopify.routes.root + 'cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{ id: variantId, quantity: 1 }]
          })
        })
        .then(response => response.json())
        .then(data => {
          fetch(window.Shopify.routes.root + '?section_id=cart-drawer')
            .then((response) => response.text())
            .then((responseText) => {
              const html = new DOMParser().parseFromString(responseText, 'text/html');
              
              const cartDrawer = document.querySelector('cart-drawer');
              const newCartDrawerContent = html.querySelector('cart-drawer');
              const cartIcon = document.querySelector('#cart-icon-bubble');
              const newCartIcon = html.querySelector('#cart-icon-bubble');

              if (cartDrawer && newCartDrawerContent) {
                const oldDrawerInner = cartDrawer.querySelector('#CartDrawer');
                const newDrawerInner = newCartDrawerContent.querySelector('#CartDrawer');

                if (oldDrawerInner && newDrawerInner) {
                   oldDrawerInner.innerHTML = newDrawerInner.innerHTML;
                }
                
                cartDrawer.classList.remove('is-empty'); 
                cartDrawer.open(el);
              }

              if (cartIcon && newCartIcon) {
                cartIcon.innerHTML = newCartIcon.innerHTML;
              }
            })
            .catch((e) => { console.error(e); });
        })
        .catch(err => {
          console.error('Error adding to cart:', err);
          alert('Could not add to cart. Please try again.');
        });
      } else {
        console.warn("No variant ID found for this element.");
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("link_copied_btn"); 
  if (!btn) return;
  btn.addEventListener("click", async function (e) {
    e.preventDefault();
    const url = btn.getAttribute("data-url") || "";
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      const tempInput = document.createElement("input");
      tempInput.value = url;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      tempInput.remove();
    }
    const label = btn.querySelector(".social_name");
    if (!label) return;
    const prev = label.textContent;
    label.textContent = "Link Copied";
    setTimeout(() => { label.textContent = prev || "Link"; }, 2000);
  });
});


document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".drawer_slider").forEach((slider) => {
    const prev = slider.querySelector(".slider_arrow.prev");
    const next = slider.querySelector(".slider_arrow.next");
    if (prev) prev.style.display = "none";
    if (next) next.style.display = "";
  });
});

document.addEventListener("click", function (e) {
  const arrow = e.target.closest(".slider_arrow");
  if (!arrow) return;
  const slider = arrow.closest(".drawer_slider");
  if (!slider) return;
  const track = slider.querySelector(".slider_track");
  const view = slider.querySelector(".slider_view");
  if (!track || !view) return;
  let currentPos = parseInt(slider.getAttribute("data-pos") || "0", 10) || 0;
  const maxScroll = Math.max(track.scrollWidth - view.getBoundingClientRect().width, 0);
  if (arrow.classList.contains("next")) currentPos += 150;
  else currentPos -= 150;
  if (currentPos < 0) currentPos = 0;
  if (currentPos > maxScroll) currentPos = maxScroll;
  slider.setAttribute("data-pos", String(currentPos));
  track.style.transform = `translateX(-${currentPos}px)`;
  const prev = slider.querySelector(".slider_arrow.prev");
  const next = slider.querySelector(".slider_arrow.next");
  if (prev) prev.style.display = currentPos > 0 ? "" : "none";
  if (next) next.style.display = currentPos < maxScroll ? "" : "none";
});


document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".product-item, .shop_now_btn").forEach((el) => {
    el.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  });

  document.addEventListener("click", function (e) {
    const closeBtn = e.target.closest("#close_modal");
    if (!closeBtn) return;
    e.stopPropagation();
    const modal = closeBtn.closest(".drawer_modal");
    if (modal) modal.classList.remove("active");
    document.body.classList.remove("drawer-open");
  });
});


document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".popup_product_accordian").forEach((acc) => {
    acc.addEventListener("click", function () {
      acc.classList.toggle("active");
    });
  });
});


document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".drawer_qty_wrapper").forEach((wrapper) => {
    const input = wrapper.querySelector(".drawer_qty");
    const minus = wrapper.querySelector(".minus");
    const plus = wrapper.querySelector(".plus");
    if (!input) return;
    const getVal = () => Math.max(parseInt(input.value || "1", 10) || 1, 1);
    const setVal = (v) => { input.value = String(Math.max(v, 1)); };
    if (minus) {
      minus.addEventListener("click", function () {
        const value = getVal();
        if (value > 1) setVal(value - 1);
      });
    }
    if (plus) {
      plus.addEventListener("click", function () {
        const value = getVal();
        setVal(value + 1);
      });
    }
    input.addEventListener("input", function () { setVal(getVal()); });
  });
});


document.addEventListener('DOMContentLoaded', function() {
  const addToCartBtns = document.querySelectorAll('.drawer_addtocart');
  addToCartBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const drawer = this.closest('.drawer_inner');
      const variantSelect = drawer.querySelector('.drawer_variant');
      const qtyInput = drawer.querySelector('.drawer_qty');
      let variantId = this.dataset.id;
      if (variantSelect && variantSelect.value) variantId = variantSelect.value;
      const quantity = qtyInput ? parseInt(qtyInput.value) : 1;
      if (!variantId || quantity < 1) return;
      
      fetch(window.Shopify.routes.root + 'cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id: variantId, 
            quantity: quantity,
            sections: 'cart-drawer,cart-icon-bubble'
        })
      })
      .then(response => response.json())
      .then(data => {
         const cartDrawer = document.querySelector('cart-drawer');
         if (cartDrawer && data.sections && data.sections['cart-drawer']) {
             try {
                cartDrawer.renderContents(data);
             } catch(e) {
                 window.location.reload();
             }
         } else {
             window.location.href = window.Shopify.routes.root + `products/${data.handle}`;
         }
      })
      .catch(err => { console.error('Add to cart error:', err); });
    });
  });
});


