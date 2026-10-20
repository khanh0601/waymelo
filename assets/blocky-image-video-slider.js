/**
  © BlockyApps. You are permitted to use this content within your store. Redistribution or use in any other application is strictly prohibited. 
  Unauthorized copying, distribution, or reproduction in any form will result in legal action.
**/
if (!customElements.get('blocky-media-slider')) {
  customElements.define('blocky-media-slider',
    class BlockyMediaSlider extends HTMLElement {
      constructor() {
        super()

        this.sectionId = this.getAttribute("data-id")
        if (this.sectionId) {
          this.setup()
        }

        document.querySelectorAll(".blocky-slider-img-link").forEach(t => {
          const url = t.getAttribute("data-url")
          if (!url) return
          t.addEventListener("click", (event) => {
            window.location.href = url
          })
        })
      }

      setup() {  
        const isDesktop = window.innerWidth >= 768
      
        const size = parseInt(this.getAttribute("data-size"))  
        const viewSize = parseInt(this.getAttribute("slide-size"))
        const mobileViewSize = parseInt(this.getAttribute("mobile-slide-size"))  
        const spacing = parseInt(this.getAttribute("media-spacing"))
        const mobileSpacing = this.hasAttribute("mobile-media-spacing") ? parseInt(this.getAttribute("mobile-media-spacing")) : spacing
      
        const glideId = 'ivs-' + this.sectionId
        const allowAutoplay = this.hasAttribute("data-auto") 
        const hasShadow = this.hasAttribute("data-shadow")   
        const peek = this.hasAttribute("data-peek") ? parseInt(this.getAttribute("data-peek")) : hasShadow ? 8 : 0  
        const animDuration = this.hasAttribute("data-anim-duration") ? parseInt(this.getAttribute("data-anim-duration")) : 400;
        const animEasing = this.getAttribute("data-anim-easing") || "ease-out";
        const autoplayInterval = this.hasAttribute("data-auto-interval") ? parseInt(this.getAttribute("data-auto-interval")) : 2000;

        window[glideId] = new Glide(`.${ glideId }`, {
          type: size >= viewSize ? 'carousel' : "slider",
          perView: viewSize,
          focusAt: 0,
          peek: peek,
          hoverpause: true,
          autoplay: allowAutoplay && size > 1 ? autoplayInterval : false,
          gap: isDesktop ? spacing : mobileSpacing,
          animationDuration: animDuration,
          animationTimingFunc: animEasing,
          breakpoints: {
            750: {
              perView: size >= viewSize ? viewSize : size,
            },
            500: {
              perView: size >= mobileViewSize ? mobileViewSize : size,
            },
          }
        }).mount()
      
        // Make bullet go faster
        const activeBullet = "glide__bullet--active";
        const bulletsContainerElement = this.querySelector(".glide__bullets");
        const changeActiveBullet = (newIndex, containerElement) => {
          if(!containerElement) return
          const glideDir = containerElement.querySelector(`[data-glide-dir="=${newIndex}"]`);
          const activeContainer = containerElement.querySelector(`.${activeBullet}`)
          if (activeContainer) activeContainer.classList.remove(activeBullet);
          if (glideDir) glideDir.classList.add(activeBullet);
        };  
        window[glideId].on("run", () => {
          requestAnimationFrame(() => changeActiveBullet(window[glideId].index, bulletsContainerElement));
        });

        const videos = this.querySelectorAll(".blocky-video-manual")
        for (const video of videos) {
          video.addEventListener("click", (e) => {
            const vid = video.querySelector("video")
            const _videos = this.querySelectorAll("video")
            for (const _vid of _videos) {
              if (vid.isSameNode(_vid) || vid.getAttribute("poster") != _vid.getAttribute("poster")) { continue }    
              if (_vid.paused == true) {
                _vid.muted = true;
                _vid.play()
                _vid.classList.add("blocky-video-playing")
                _vid.parentElement.querySelector("button").classList.add("blocky-hidden")       
              } else {
                _vid.muted = false;
                _vid.pause()
                _vid.classList.remove("blocky-video-playing")
                _vid.parentElement.querySelector("button").classList.remove("blocky-hidden")                
              }
            }
          })
        }
      }
    }
  )
}
