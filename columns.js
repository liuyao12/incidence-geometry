/* Reserve the actual navigation height, including wrapped titles and zoom.
 * CSS owns both columns; this never translates, resizes or reparents a diagram.
 */
(() => {
  'use strict';
  const page = document.querySelector('.chapter-page');
  const nav = page?.querySelector('.site-nav');
  if (!nav) return;
  let height = -1;
  const measure = () => {
    const next = Math.ceil(nav.getBoundingClientRect().height);
    if (next === height) return;
    height = next;
    page.style.setProperty('--chapter-nav-height', `${height}px`);
  };
  measure();
  new ResizeObserver(measure).observe(nav);
  document.fonts?.ready.then(measure);
})();
