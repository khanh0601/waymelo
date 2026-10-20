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
        if (this.video) {
          this.video.addEventListener('waiting', (e) => {
            if (e.target.currentTime > 0) this.showSpinner();
          });
          this.video.addEventListener('playing', this.hideSpinner.bind(this));
          this.video.addEventListener('canplaythrough', this.hideSpinner.bind(this));
          this.video.addEventListener('error', this.hideSpinner.bind(this));
        }
        if (this.classList.contains("blocky-video-manual")) {
          this.video.addEventListener("click", (e) => this.onClick())
          const button = this.querySelector(".blocky-video-play-button")
          button.addEventListener("click", (e) => this.onClick())
        } else {
          if ("IntersectionObserver" in window) {
            this.observer = new IntersectionObserver(this.handleIntersection.bind(this), { root: null, rootMargin: '0px', threshold: 0.05 });
            this.observer.observe(this);
          } else {
            // Fallback for browsers that don't support IntersectionObserver
            for (const source of this.video.querySelectorAll('source[data-src]')) {
              source.setAttribute('src', source.getAttribute('data-src'));
              source.removeAttribute('data-src');
            }
            this.video.load();
          }
          this.video.addEventListener("pause", (event) => {
              if (event.target.paused) event.target.play()
          })
          this.video.addEventListener("canplay", (event) => {
              if (event.target.paused) event.target.play()
          })
        }
      }

      handleIntersection(entries) {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            for (const source of this.video.querySelectorAll('source[data-src]')) {
              source.setAttribute('src', source.getAttribute('data-src'));
              source.removeAttribute('data-src');
            }
            this.video.load();
            this.video.play();
            this.observer.disconnect();
          }
        });
      }

      onClick() {
        const button = this.querySelector(".blocky-video-play-button")
        if (this.video.paused == true) {
          this.showSpinner()
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
