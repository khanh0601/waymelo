/**
  © BlockyApps. You are permitted to use this content within your store. Redistribution or use in any other application is strictly prohibited. 
  Unauthorized copying, distribution, or reproduction in any form will result in legal action.
**/
if (!customElements.get('blocky-slider-2')) {
  customElements.define('blocky-slider-2',
    class BlockySlider2 extends HTMLElement {
      constructor() {
        super()
        this.track = this.querySelector(".blocky-slider-2-carousel-track");
        this.slides = Array.from(this.track.children);
        this.rightArrow = this.querySelector(".right-arrow")
        this.leftArrow = this.querySelector(".left-arrow")
        this.currentIndex = 0;
        this.isMobile = window.matchMedia("(max-width: 750px)").matches;

        
        this.rightArrow.addEventListener("click", () => {
          let end = this.isMobile ? this.slides.length - 1 : this.slides.length - 3
          if (this.currentIndex < end) {
            this.currentIndex++;
            this.updateCarousel();
          }
        });
    
        this.leftArrow.addEventListener("click", () => {
          if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateCarousel();
          }
        });
    
        window.addEventListener("resize", () => {
          this.updateCarousel
          this.isMobile = window.matchMedia("(max-width: 750px)").matches;
        });
        this.updateArrows()
      }

      updateCarousel() {
        const slideWidth = this.slides[0].getBoundingClientRect().width;
        this.track.style.transform = `translateX(-${this.currentIndex * slideWidth}px)`;
        this.updateArrows()
      }

      updateArrows() {
        if (this.currentIndex === 0) {
          this.leftArrow.classList.add("disabled")
        } else {
          this.leftArrow.classList.remove("disabled")          
        }        
        let end = this.isMobile ? this.slides.length - 1 : this.slides.length - 3
        if (this.currentIndex >= end) {
          this.rightArrow.classList.add("disabled")
        } else {
          this.rightArrow.classList.remove("disabled")
        }        
      }

    }
  )
}
