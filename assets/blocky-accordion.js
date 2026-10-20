/**
© BlockyApps. You are permitted to use this content within your store. Redistribution or use in any other application is strictly prohibited. 
Unauthorized copying, distribution, or reproduction in any form will result in legal action.
**/
if (!customElements.get('blocky-accordion')) {
  customElements.define('blocky-accordion',
    class BlockyAccordion extends HTMLElement {
      constructor() {
        super()

        this.querySelectorAll('.blocky-accordion-btn').forEach(button => {
          button.addEventListener('click', () => {
            const answer = button.nextElementSibling;
            button.classList.toggle('active');
            answer.classList.toggle("active")        
          });
        });
      }
    }
  )
}
