/**
  © BlockyApps. You are permitted to use this content within your store. Redistribution or use in any other application is strictly prohibited. 
  Unauthorized copying, distribution, or reproduction in any form will result in legal action.
**/
if (!customElements.get('blocky-slider-1')) {
  customElements.define('blocky-slider-1',
    class BlockySlider1 extends HTMLElement {
      constructor() {
        super()

        let nextButton = this.querySelector('#next');
        let prevButton = this.querySelector('#prev');
        
        nextButton.addEventListener("click", () => {
            this.showSlider('next');
        })
        prevButton.addEventListener("click", () => {
            this.showSlider('prev');
        })
      }

      showSlider(type) {      
        let listHTML = this.querySelector('.blocky-slider-container');

        this.classList.remove('next', 'prev');
        let items = this.querySelectorAll('.slide');
        if(type === 'next'){
          listHTML.appendChild(items[0]);
          this.classList.add('next');          
        } else{
          listHTML.prepend(items[items.length - 1]);
          this.classList.add('prev');
        }
      }
    }
  )
}
