# MathJax TeX → SVG

Pinned `mathjax-full@3.2.1`, file `es5/tex-svg.js`, under the Apache-2.0 license
in `LICENSE`. Vendored to keep all three chapters and the theorem appendix
self-contained; no CDN or web-font request is needed to render the equations.

SHA-256 of `tex-svg.js`:
`0383da4c22a61555f3d99877f939f00012d2583381177302987ab04760cdadf3`.

Write inline mathematics as `\(...\)` and display mathematics as `\[...\]`
inside `.prose`. `math-config.js` limits typesetting to this exposition: it
does not rewrite the live geometry SVG, canvas, controls, or numeric readouts.
Use `scripts/browser_theorems.py --serve` to check math rendering, hidden proofs,
responsiveness, and the coexistence of typesetting with the live diagrams.

Upstream: https://github.com/mathjax/MathJax-src/tree/3.2.1
Documentation: https://docs.mathjax.org/en/v3.2/output/svg.html
