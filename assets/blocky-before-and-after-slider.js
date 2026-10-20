/**
© BlockyApps. You are permitted to use this content within your store. Redistribution or use in any other application is strictly prohibited. 
Unauthorized copying, distribution, or reproduction in any form will result in legal action.
**/

if (!customElements.get('blocky-before-after-slider')) {
  customElements.define('blocky-before-after-slider',
    class BlockyBeforeAfterSlider extends HTMLElement {
      constructor() {
        super()
        
        this.querySelector(".blocky-before-after-slider-input").addEventListener("input", (e)=>{
          var sliderPos = e.currentTarget.value;
          var parentElement = e.currentTarget.parentElement
          var afterImage = parentElement.querySelector(".blocky-before-after-after-image")
      
          parentElement.querySelector(".blocky-before-after-slider-line").style.left = sliderPos + "%"
          afterImage.style.width = `${100 - sliderPos}%`
      
          if (afterImage.querySelector("img") !== null) {
            afterImage.querySelector("img").style.transform = `translate(-${sliderPos}%,0)`
          } else {
            afterImage.querySelector("svg").style.transform = `translate(-${sliderPos}%,0)`
          }
        })
      }
    }
  )
}
