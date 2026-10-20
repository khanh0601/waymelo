/**
  © BlockyApps. You are permitted to use this content within your store. Redistribution or use in any other application is strictly prohibited. 
  Unauthorized copying, distribution, or reproduction in any form will result in legal action.
**/

if (!customElements.get('blocky-product-showcase')) {
  customElements.define('blocky-product-showcase',
    class BlockyProductShowcase extends HTMLElement {
      constructor() {
        super()

        const showcases = this.querySelectorAll(".blocky-showcase-button") 
        for (const showcase of showcases) {
          showcase.addEventListener("click", (e) => {
            const ind = showcase.getAttribute("data-index")
            const activeButton = this.querySelector(".blocky-showcase-button-active")
            if (activeButton) activeButton.classList.remove("blocky-showcase-button-active")
            showcase.classList.add("blocky-showcase-button-active")
      
            const activeShowcase = this.querySelector(".blocky-showcase-showcase-active")
            if (activeShowcase) activeShowcase.classList.remove("blocky-showcase-showcase-active")
            this.querySelector(`.blocky-showcase-showcase[data-index='${ind}']`).classList.add("blocky-showcase-showcase-active")
          })
        }
      }
    }
  )
}
