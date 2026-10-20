class BlockyTimer extends HTMLElement {
  constructor() {
    super();
    this.currHours = this.getAttribute("data-hours")
    this.currMinutes = this.getAttribute("data-minutes")
    this.text = this.getAttribute("data-text")
    this.interval = setInterval(this.updateTimer.bind(this), 60000);
  }
  
  updateTimer() {
    if (this.currMinutes > 0) {
      this.currMinutes -= 1
    } else if (this.currHours > 0 ) {
      this.currHours -= 1
      this.currMinutes = 59
    }

    this.querySelector(".blocky-timer-text").innerHTML = this.text.replaceAll("[HOURS]", this.currHours).replaceAll("[MINUTES]", this.currMinutes)
    
    if (this.currHours == 0 && this.currMinutes == 0) {
      clearInterval(this.interval)
    }
  }
}
customElements.define('blocky-timer', BlockyTimer);

class BlockyScrollTo extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll(".blocky-scroll-to-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const element = document.getElementById("blocky-scroll-to-target-" + btn.getAttribute("data-btn")); 
        element.scrollIntoView({
          behavior: "smooth" 
        });
      })
    })
  }
}
customElements.define('blocky-scroll-to', BlockyScrollTo);

class BlockyProductReviews extends HTMLElement {
  constructor() {
    super();
    if(this.classList.contains("blocky-pdr-slider-auto-old")) {
      setInterval(function(){
        // const pdr = this.closest(".blocky-pdr")
        const container = this.querySelector(".blocky-pdr-container")
    
        const hasFirst = this.querySelector(`[data-index="0"]`)
        const hasSecond = this.querySelector(`[data-index="1"]`)
        const hasThird = this.querySelector(`[data-index="2"]`)
        let size = 0
        if (hasFirst) size += 1
        if (hasSecond) size += 1
        if (hasThird) size += 1
    
        if (size <= 1) return
    
        // Switch the background
        const active = this.querySelector(".blocky-pdr-container-text-active") || this.querySelector(`[data-index="0"]`) || this.querySelector(`[data-index="1"]`) || this.querySelector(`[data-index="2"]`)
        const curr = parseInt(active.getAttribute("data-index"))
        const newPos = curr < 2 ? curr + 1 : 0
    
        // Check if review 1/2/3 is missing
        let pos = newPos
        if (pos === 2) {
            if (!hasThird) {
                if (!hasFirst) {
                    pos = 1
                } else {
                    pos = 0
                }    
            }
        } else if (pos === 1) {
            if (!hasSecond) {
                if (!hasThird) {
                    pos = 0
                } else {
                    pos = 2
                }    
            }  
        } else if (pos === 0) {
            if (!hasFirst) {
                if (!hasSecond) {
                    pos = 2
                } else {
                    pos = 1
                }    
            }  
        }
    
        active.classList.remove("blocky-pdr-container-text-active")
        this.querySelector(`[data-index="${pos}"]`).classList.add("blocky-pdr-container-text-active")
    
        let windowPos = pos
        if (windowPos === 2) {
          windowPos = size - 1
        } else if (windowPos === 1) {
          if (!hasFirst) windowPos = 0
        }
      
        // Scrolling
        let e = container.clientWidth * windowPos;
        container.scrollTo({
          left: e
        })
      }.bind(this), 5000);
    }

    this.querySelectorAll(".blocky-pdr-carot-old").forEach(c=>{
      c.addEventListener("click", (event) => {
        event.preventDefault();
        const pdr = c.closest(".blocky-pdr")
        const container = pdr.querySelector(".blocky-pdr-container")
    
        const hasFirst = pdr.querySelector(`[data-index="0"]`)
        const hasSecond = pdr.querySelector(`[data-index="1"]`)
        const hasThird = pdr.querySelector(`[data-index="2"]`)
        let size = 0
        if (hasFirst) size += 1
        if (hasSecond) size += 1
        if (hasThird) size += 1
    
        if (size <= 1) return
    
        // Switch the background
        const active = pdr.querySelector(".blocky-pdr-container-text-active") || pdr.querySelector(`[data-index="0"]`) || pdr.querySelector(`[data-index="1"]`) || pdr.querySelector(`[data-index="2"]`)
        const curr = parseInt(active.getAttribute("data-index"))
        const isForward = c.getAttribute("name") === 'next'
        let newPos = isForward ? parseInt(curr) + 1 : parseInt(curr) - 1
    
        if (newPos < 0) newPos = 2
        if (newPos > 2) newPos = 0
    
        // Check if review 1/2/3 is missing
        let pos = newPos
        if (pos === 2) {
            if (!hasThird) {
                if (isForward) {
                    pos = 0
                } else {
                    pos = 1
                }    
            }
        } else if (pos === 1) {
            if (!hasSecond) {
                if (isForward) {
                    pos = 2
                } else {
                    pos = 0
                }    
            }  
        } else if (pos === 0) {
            if (!hasFirst) {
                if (isForward) {
                    pos = 1
                } else {
                    pos = 2
                }    
            }  
        }
    
        active.classList.remove("blocky-pdr-container-text-active")
        pdr.querySelector(`[data-index="${pos}"]`).classList.add("blocky-pdr-container-text-active")
    
        let windowPos = pos
        if (windowPos === 2) {
            windowPos = size - 1
        } else if (windowPos === 1) {
            if (!hasFirst) windowPos = 0
        }
    
        // Scrolling
        let e = container.clientWidth * windowPos;
        container.scrollTo({
            left: e
        })
      })
    })
  }
}
customElements.define('blocky-product-reviews', BlockyProductReviews);
