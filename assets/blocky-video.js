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
        if (this.video) {
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
        } else {
          this.video.addEventListener("pause", (event) => {
              if (event.target.paused) event.target.play()
          })
          this.video.addEventListener("canplay", (event) => {
              if (event.target.paused) event.target.play()
          })
        }

        this.waitForHeroThenObserve();
      }

      waitForHeroThenObserve() {
        const hero = document.querySelector('blocky-featured-product');
        const start = () => this.observeVisibility();

        if (!hero || document.documentElement.classList.contains('waymelo-hero-ready')) {
          start();
          return;
        }

        window.addEventListener('waymelo:hero-ready', start, { once: true });
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
        if (!this.isManual) {
          if (this.hydrateSources()) this.video.load();
          this.video.play().catch(() => {});
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
            if (!this.isManual) {
              if (this.hydrateSources()) this.video.load();
              this.video.play().catch(() => {});
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

      showSpinner() {
        this.video.classList.add('loading');
      }
  
      hideSpinner() {
          this.video.classList.remove('loading');
      }
    }
  )
}
