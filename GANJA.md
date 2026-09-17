# Ganja interactive implementation

The five-point Pascal construction from Yao Liu’s Observable notebook is an explicit candidate for a future formalization: prove that its constructed sixth point lies on the unique conic through the five seed points, with exceptional rays and degeneracies handled explicitly. The browser constructs the locus by PGA joins/meets and checks it against an independent coefficient equation. That numerical check is not the proposed theorem.

The rendering adapter also supports ideal points, branch splitting at infinity, tangent envelopes, draggable construction data and keyboard controls. These do not change the Lean coverage ledger in BLUEPRINT.md.

`pga.js` implements homogeneous projective algebra with ganja’s Float64 Cl(2,0,1). `ganja-view.js` invokes ganja's native SVG renderer; our Pointer Events adapter supplies consistent rectangular-viewbox dragging, touch, pan, zoom and keyboard handles. `engine.js` is retained as independent numerical reference and for the exact scalar cancellation experiment.

The observed notebook revision is 1069. The upstream library is pinned by commit and SHA256 in vendor/manifest.json, with the complete MIT license retained. No externally loaded runtime scripts are needed.
