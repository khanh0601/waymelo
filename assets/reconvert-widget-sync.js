/*
 * Waymelo: style sync for the ReConvert (Upsell.com) product-page widget.
 *
 * ReConvert renders its "product recommendations" block inside an open shadow
 * root on `[id^="reconvert-slot-"]`, so theme CSS cannot reach it. This script
 * appends a stylesheet into each slot's shadow root so the widget matches the
 * theme's cards, inputs, quantity selector and buttons.
 */
(function () {
  var STYLE_ID = 'waymelo-reconvert-sync';
  var HOST_SELECTOR = '[id^="reconvert-slot-"]:not([id^="reconvert-slot-cartDrawer"])';

  var CSS = [
    '.section_content { padding: 0 !important; color: #2f2530; }',
    '.section_content .all-widgets > div { max-width: 100% !important; }',

    /* Heading */
    '.section_content .reconvert-text-widget { margin: 0.6rem 0 0.4rem !important; }',
    '.section_content .reconvert-text-widget .heading_font p { margin: 0; line-height: 1.3; }',
    '.section_content .reconvert-text-widget .heading_font span { font-size: 1.8rem !important; font-weight: 700; letter-spacing: 0.01em; color: #2f2530; }',

    /* Track */
    '.section_content .slider-scroll-container { padding-bottom: 0.6rem !important; scrollbar-width: thin; scrollbar-color: rgba(47, 37, 48, 0.35) transparent; }',
    '.section_content .slider-scroll-container::-webkit-scrollbar { height: 4px; }',
    '.section_content .slider-scroll-container::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.06); border-radius: 999px; }',
    '.section_content .slider-scroll-container::-webkit-scrollbar-thumb { background: rgba(47, 37, 48, 0.35); border-radius: 999px; }',
    '.section_content .slider-scroll-container > div { margin-bottom: 0 !important; }',
    '.section_content .slider-scroll-container [class*="flex-nowrap"] { margin-bottom: 0.6rem !important; }',

    /* Image */
    '.section_content .slider-scroll-container [class*="border-gray-300"] { overflow: hidden; border-color: rgba(122, 81, 104, 0.14) !important; border-radius: 1.3rem !important; background: #f7f3f5; box-shadow: 0 6px 18px rgba(66, 38, 53, 0.06); transition: border-color 0.24s ease, box-shadow 0.24s ease, transform 0.24s ease; }',
    '.section_content .slider-scroll-container [class*="border-gray-300"]:hover { border-color: rgba(122, 81, 104, 0.3) !important; box-shadow: 0 10px 26px rgba(66, 38, 53, 0.11); transform: translateY(-2px); }',
    '.section_content img.product-image { border-radius: 1.2rem !important; border: 0 !important; object-fit: cover !important; background: #f7f3f5; transition: transform 0.2s ease; }',
    '.section_content [class*="border-gray-300"]:hover img.product-image { transform: scale(1.025); }',

    /* Title + variant name + description toggle */
    '.section_content .product_title_style { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; margin: 0.2rem 0 0; font-family: var(--font-body-family) !important; font-size: 1.4rem !important; font-weight: 600 !important; line-height: 1.4; letter-spacing: 0 !important; color: #2f2530; }',
    '.section_content .product_details_style { margin: 0 !important; font-family: var(--font-body-family) !important; font-size: 1.1rem !important; font-weight: 600 !important; letter-spacing: 0.06em !important; color: #6f6572; }',
    '.section_content .description_button_style { padding: 0; border: 0; background: transparent; cursor: pointer; font-family: var(--font-body-family) !important; font-size: 1.2rem !important; font-weight: 500 !important; letter-spacing: 0 !important; color: #6f6572; text-decoration: underline; text-underline-offset: 0.3em; }',
    '.section_content .description_button_style:hover { color: #2f2530; }',
    '.section_content .description_button_style .svg_icon { fill: currentColor !important; }',
    '.section_content .block-stack.scroll-view { font-size: 1.3rem !important; line-height: 1.55; color: #6f6572; }',

    /* Price */
    '.section_content .normal_price, .section_content .price_style { font-size: 1.6rem !important; font-weight: 700 !important; color: #2f2530 !important; }',
    '.section_content .deleted_price { font-size: 1.25rem !important; font-weight: 400; color: #6f6572 !important; }',

    /* Variant select */
    '.section_content .theme_input { border: 1px solid rgba(36, 22, 42, 0.18) !important; border-radius: 999px !important; background: #fff !important; box-shadow: none !important; transition: border-color 0.2s ease, box-shadow 0.2s ease; }',
    '.section_content .theme_input:hover { border-color: rgba(36, 22, 42, 0.45) !important; }',
    '.section_content .select_input_wrapper { min-height: 4.6rem; }',
    '.section_content .select_input_lable { top: 0.7rem !important; left: 1.7rem !important; font-family: var(--font-body-family) !important; font-size: 1rem !important; font-weight: 600 !important; letter-spacing: 0.06em !important; line-height: 1.2 !important; text-transform: uppercase; color: #6f6572; }',
    '.section_content .selectVariantStyle { min-height: 4.6rem; padding: 1.9rem 3.2rem 0.5rem 1.6rem !important; font-size: 1.3rem !important; color: #2f2530; }',
    '.section_content .selectVariantStyle:hover { box-shadow: none !important; }',
    '.section_content .selectVariantStyle:focus { border-color: #7a5168 !important; box-shadow: 0 0 0 1px #7a5168 !important; }',
    '.section_content .select_input_dropdown_icon { right: 1.5rem !important; }',
    '.section_content .select_input_dropdown_icon .svg_icon { fill: #2f2530 !important; }',

    /* Quantity: "- 1 +" pill like the theme's quantity selector */
    '.section_content .quantity_selector_style { display: flex !important; align-items: center; min-height: 4.6rem !important; padding: 0 1.3rem !important; cursor: default !important; }',
    '.section_content .quantity_text_container { order: 2; position: static !important; left: 0 !important; display: block; flex: 1 1 auto; width: auto !important; min-width: 0; text-align: center !important; }',
    '.section_content .quantity_lable { display: none !important; }',
    '.section_content .quantity_input { display: block; width: 100% !important; max-width: none !important; margin: 0; padding: 0 !important; text-align: center; font-size: 1.4rem !important; font-weight: 600; color: #2f2530 !important; }',
    '.section_content .quantity_input::-webkit-outer-spin-button, .section_content .quantity_input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }',
    '.section_content .quantity_selector_style > div:last-child { display: contents !important; position: static !important; transform: none !important; }',
    '.section_content .quantity_selector_style > div:last-child > span { display: contents !important; }',
    '.section_content .quantity_selector_style > div:last-child > span > div { display: flex; align-items: center; justify-content: center; width: 2.4rem; height: 2.4rem; flex: 0 0 auto; }',
    '.section_content .quantity_selector_style > div:last-child > span > div:first-child { order: 1; }',
    '.section_content .quantity_selector_style > div:last-child > span > div:last-child { order: 3; }',
    '.section_content .quantity_selector_style svg { width: 1.4rem; height: 1.4rem; }',
    '.section_content .quantity_svg_style { fill: #2f2530 !important; stroke: none !important; }',
    '.section_content .quantity_svg_style_disabled { fill: rgba(47, 37, 48, 0.35) !important; stroke: none !important; }',

    /* Add to cart: match the theme primary button */
    '.section_content .btn_container { margin-top: 0.2rem; }',
    '.section_content .theme_button { min-height: 4.4rem !important; padding: 0.8rem 1.4rem !important; border: 0 !important; border-radius: 999px !important; font-family: var(--font-body-family) !important; font-size: 1.3rem !important; font-weight: 700 !important; letter-spacing: 0.08em !important; line-height: 1.2 !important; text-transform: uppercase; box-shadow: none !important; transition: filter 0.2s ease, transform 0.2s ease !important; }',
    '.section_content .theme_button_primary, .section_content .theme_button_secondary { color: #fff !important; background-color: rgb(var(--color-button, 122, 81, 104)) !important; }',
    '.section_content .theme_button::before, .section_content .theme_button::after { content: none !important; box-shadow: none !important; }',
    '.section_content .theme_button:hover { filter: brightness(0.92); transform: translateY(-1px); box-shadow: none !important; }',
    '.section_content .theme_button .span_style, .section_content .theme_button .span_style span { color: inherit !important; }',
    '.section_content .button_loading { opacity: 0.55 !important; }',

    '@media (prefers-reduced-motion: reduce) {',
    '  .section_content .theme_button, .section_content img.product-image, .section_content .slider-scroll-container [class*="border-gray-300"] { transition: none !important; transform: none !important; }',
    '}'
  ].join('\n');

  var observedRoots = typeof WeakSet === 'function' ? new WeakSet() : null;

  function syncHost(host) {
    var root = host.shadowRoot;
    if (!root) return false;

    var style = root.getElementById ? root.getElementById(STYLE_ID) : root.querySelector('#' + STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
    }
    // Keep our sheet last so it wins over the widget's own injected styles.
    if (root.lastElementChild !== style) root.appendChild(style);

    if (observedRoots && !observedRoots.has(root) && 'MutationObserver' in window) {
      observedRoots.add(root);
      new MutationObserver(function () {
        if (root.lastElementChild !== style) root.appendChild(style);
      }).observe(root, { childList: true });
    }
    return true;
  }

  function scan() {
    var pending = false;
    document.querySelectorAll(HOST_SELECTOR).forEach(function (host) {
      if (!syncHost(host)) pending = true;
    });
    return pending;
  }

  var scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      scan();
    });
  }

  function start() {
    scan();

    // The widget attaches its shadow root asynchronously; keep checking for a while.
    var attempts = 0;
    var timer = setInterval(function () {
      attempts += 1;
      if (!scan() || attempts > 120) clearInterval(timer);
    }, 250);

    if ('MutationObserver' in window) {
      new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
