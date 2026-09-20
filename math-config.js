/* LaTeX in the mathematical exposition, not in the continually redrawn scenes.
 * MathJax 3.2.1 is vendored; SVG output makes no web-font requests.
 * Keep the input delimiters in HTML so sources remain readable and editable.
 */
window.MathJax = {
  tex: {
    inlineMath: [['\\(', '\\)']],
    displayMath: [['\\[', '\\]']],
    processEscapes: true,
    tags: 'none'
  },
  svg: {fontCache: 'local'},
  options: {enableMenu: false},
  startup: {
    elements: ['.prose'],
    pageReady() {
      return MathJax.startup.defaultPageReady().then(() => {
        document.documentElement.dataset.mathReady = 'true';
        document.dispatchEvent(new Event('math-typeset'));
      });
    }
  }
};
