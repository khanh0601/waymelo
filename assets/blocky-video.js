/**
  © BlockyApps. You are permitted to use this content within your store. Redistribution or use in any other application is strictly prohibited. 
  Unauthorized copying, distribution, or reproduction in any form will result in legal action.
**/
if (!customElements.get('blocky-video')) {
  customElements.define('blocky-video',
    class BlockyVideo extends HTMLElement {
      constructor() {
        super()
        this.video = this.querySelector("video")
        this.isManual = this.classList.contains("blocky-video-manual")
        const userAgent = navigator.userAgent || ''
        const isIosWebView = /iPhone|iPad|iPod/i.test(userAgent) && !/Safari/i.test(userAgent)
        this.isEmbeddedWebView = /Zalo|; wv\)|\bwv\b/i.test(userAgent) || isIosWebView
        if (this.video) {
          this.prepareInlinePlayback()
          if (!this.isManual && !this.isEmbeddedWebView) {
            this.prepareAutoplay()
          } else if (this.isEmbeddedWebView) {
            this.video.autoplay = false
            this.video.removeAttribute('autoplay')
          }
          this.video.addEventListener('waiting', (e) => {
            if (e.target.currentTime > 0) this.showSpinner();
          });
          this.video.addEventListener('playing', this.hideSpinner.bind(this));
          this.video.addEventListener('canplaythrough', this.hideSpinner.bind(this));
          this.video.addEventListener('error', this.hideSpinner.bind(this));
        }
        if (this.isManual) {
          this.video.addEventListener("click", (e) => this.onClick())
          const button = this.querySelector(".blocky-video-play-button")
          button.addEventListener("click", (e) => this.onClick())
        } else if (!this.isEmbeddedWebView) {
          this.video.addEventListener("pause", (event) => {
              if (event.target.paused) this.tryAutoplay()
          })
          this.video.addEventListener("canplay", (event) => {
              if (event.target.paused) this.tryAutoplay()
          })
        }

        this.waitForHeroThenObserve();
      }

      waitForHeroThenObserve() {
        const hero = document.querySelector('blocky-featured-product');
        const start = () => this.observeVisibility();

        // Wait for the hero image and the buy-box app widget (see blocky-featured-product.js);
        // fall back after 10s if the signal never comes.
        let started = false;
        const startOnce = () => {
          if (started) return;
          started = true;
          start();
        };
        if (!hero || document.documentElement.classList.contains('waymelo-below-fold-ready')) {
          startOnce();
          return;
        }

        window.addEventListener('waymelo:below-fold-ready', startOnce, { once: true });
        window.setTimeout(startOnce, 10000);
      }

      observeVisibility() {
        if ("IntersectionObserver" in window) {
          this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
            root: null,
            rootMargin: '100% 0px 100% 0px',
            threshold: 0.01
          });
          this.observer.observe(this);
          return;
        }

        this.hydratePoster();
        if (!this.isManual && !this.isEmbeddedWebView) {
          if (this.hydrateSources()) this.video.load();
          this.tryAutoplay();
        }
      }

      hydratePoster() {
        const poster = this.video?.dataset.poster;
        if (!poster) return;
        this.video.poster = poster;
        delete this.video.dataset.poster;
      }

      hydrateSources() {
        let hydrated = false;
        for (const source of this.video.querySelectorAll('source[data-src]')) {
          source.setAttribute('src', source.getAttribute('data-src'));
          source.removeAttribute('data-src');
          hydrated = true;
        }
        return hydrated;
      }

      handleIntersection(entries) {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.hydratePoster();
            if (!this.isManual && !this.isEmbeddedWebView) {
              if (this.hydrateSources()) this.video.load();
              this.tryAutoplay();
            }
            this.observer.disconnect();
          }
        });
      }

      onClick() {
        const button = this.querySelector(".blocky-video-play-button")
        if (this.video.paused == true) {
          this.showSpinner()
          this.hydratePoster()
          if (this.hydrateSources()) this.video.load()
          const playPromise = this.video.play()      
          playPromise.then(() => {
            this.hideSpinner()
          }).catch((error) => {
            this.hideSpinner()
          });
          this.video.classList.add("blocky-video-playing")
          button.classList.add("blocky-hidden")
        } else {
          this.video.pause()
          this.video.classList.remove("blocky-video-playing")
          button.classList.remove("blocky-hidden")
        }
      }

      prepareAutoplay() {
        this.video.muted = true;
        this.video.defaultMuted = true;
        this.video.autoplay = true;
        this.video.setAttribute('muted', '');
        this.prepareInlinePlayback();
      }

      prepareInlinePlayback() {
        this.video.playsInline = true;
        this.video.disablePictureInPicture = true;
        this.video.controls = false;
        this.video.setAttribute('playsinline', '');
        this.video.setAttribute('webkit-playsinline', '');
        this.video.setAttribute('disablepictureinpicture', '');
        this.video.setAttribute('controlslist', 'nofullscreen nodownload noremoteplayback');

        if (window.matchMedia('(max-width: 749px)').matches) {
          this.video.style.pointerEvents = 'none';
        }
      }

      tryAutoplay() {
        if (!this.video || this.isManual || document.hidden) return;
        this.prepareAutoplay();
        const playPromise = this.video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
      }

      disconnectedCallback() {
        if (this.observer) this.observer.disconnect();
      }

      showSpinner() {
        this.video.classList.add('loading');
      }
  
      hideSpinner() {
          this.video.classList.remove('loading');
      }
    }
  )
}
