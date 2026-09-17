# Incidence Geometry

An interactive exposition and an independent Lean 4 project for Penrose's conic cube, Fomin–Pylyavskyy's surface cancellation, and the Veronese coefficient-space bridge.

[Live exposition](https://liuyao12.github.io/incidence-geometry/) · [Lean CI](https://github.com/liuyao12/incidence-geometry/actions/workflows/ci.yml) · [Blueprint](BLUEPRINT.md)

The page follows the reading-plus-floating-demo arrangement of `GCTS-I.html`. Its panel is sticky, draggable and horizontally resizable on desktop, and stacked above the text on mobile. “Follow text” selects the corresponding experiment while reading; using a control turns automatic following off. The reset-position button restores the panel.

## Five experiments

**Conics:** seven conics in a symmetric-matrix normal form; reveal the eighth; select cube edges for contact chords, points and tangents; select faces for concurrency. Drag the hollow seed-chord handles, change matrix couplings, pan with empty-space drag and zoom with Shift-wheel.

**Pascal:** adapted from [Yao Liu’s Conic sections notebook](https://observablehq.com/@liuyao12/conics-sections). Drag five points and construct a sixth via Pascal’s join/meet straightedge construction. Trace the conic, inspect the three collinear opposite-side intersections, and optionally show tangent envelopes. An independent equation is used for diagnostics and optional tangents, not to generate the point locus. This experiment is not yet formally proved in Lean.

**Incidences:** a point/line cube built from perspective triangles. Drag O or vary the three point positions. Reveal the line containing the three side-intersection points. The face ratios are numerical diagnostics, not proof evidence.

**Cancellation:** arbitrary nonzero integer edge values on the oriented cube. Ratios and their total product use exact BigInt fractions. Doubling one edge changes two face ratios reciprocally. An arbitrary edge assignment is not claimed to be geometrically realizable.

**Bridge:** a conic pencil q(t)=q0−tℓ² and all six coefficient coordinates. The double-line vector remains constrained to the Veronese surface; no reduction of Penrose's theorem to the Fomin–Pylyavskyy master theorem is asserted.

## Formal project

```
formal/
  lean-toolchain                # Lean 4.19.0
  lakefile.lean
  lake-manifest.json            # exact dependency commits
  IncidenceCubes.lean           # imports every implemented module
  Audit.lean                    # all 17 public theorem dependencies
  IncidenceCubes/
    Penrose/Algebra.lean
    Fomin/Surface.lean
    Fomin/Coherence.lean
    Connection/Veronese.lean
```

From this directory:

```sh
cd formal
lake exe cache get
lake build
lake env lean Audit.lean
```

The build record is in `verification.json`. The GitHub workflow builds the root library, runs the axiom audit, rejects `sorryAx`, `Lean.ofReduceBool` and `Lean.trustCompiler` in the audited dependency lists, and uploads the audit and lockfile. It does not rely on browser or CAS outputs.

**Implemented scope:** the polynomial contact identities and algebraic eighth expression; face-pencil and polarization identities; general finite edge cancellation and its last-face consequence; a concrete finite cube certificate; coordinate cross-ratio/incidence equivalence; double-line evaluation, scaling, nonvanishing and the coefficient-pencil relation.

**Not yet a full formalization of both geometric theorems:** arbitrary-input normal-form existence, projective contact geometry, full completion/uniqueness, complete conics and a theorem comparing the two frameworks remain development targets. The general cancellation certificate records algebraic pairing data, not a topological manifold structure. See the blueprint for the precise boundary.

## Software tests and local preview

```sh
node test.cjs
node test-ganja.cjs
python -m http.server 8000
```

Then open `http://localhost:8000/`. The page uses a locally vendored, hash-pinned copy of ganja.js and needs no external runtime services. `pga.js` supplies Float64 projective algebra; `ganja-view.js` uses ganja’s native SVG renderer with our touch/keyboard/pointer adapter. See [vendor provenance](vendor/README.md). `test.cjs` runs 1,000 deterministic configurations, including all twelve contact identities and all six face conditions, exact edge-product cancellation, non-incidence and coefficient identities. `test-results.json` records the original engine output; `ganja-test-results.json` records the independent ganja tests. Browser tests run with `python scripts/browser_smoke.py --serve` after installing Python Playwright and Chromium. Without `--serve`, the script exercises the actual local assets offline and supplies only the verification.json response. These are software tests, not replacements for Lean proofs.

Export data saves the current numerical configuration, explicitly marked as not a Lean certificate. No accounts, tracking, browser storage or user-data uploads are used.

## References

- Arnold, Chern, Eide, Gunn, Neukirchner and Penrose, [Penrose's eight-conic theorem](https://arxiv.org/html/2409.17150v8), especially §§6–7.
- Fomin and Pylyavskyy, [Incidences and tilings](https://arxiv.org/abs/2305.07728), Proposition 2.5, Theorem 2.6 and Proposition 9.1.
- [Chern's Penrose project page](https://cseweb.ucsd.edu/~alchern/projects/Penrose/).

## Ganja rendering and proof scope

The canvas implementation has been replaced by native ganja SVG output. Joins/meets in the incidence cube and Pascal construction use ganja operations, not a renamed coordinate cross-product routine. Quadratic-form coefficients still provide Penrose’s conic algebra; a general conic is not misidentified with a single PGA line or point. Homogeneous curve samples are split and clipped at infinity, and zero construction vectors raise diagnostics.

The upgrade preserves the existing 17 Lean theorems. No new geometric completion theorem, full Pascal proof, or reduction between the papers is claimed. The original proof evidence remains in `verification.json`; current CI separately rebuilds and audits these same sources in this repository.


## Chern-inspired arrangement

The default **Conics** preset follows the visual organization of Albert Chern's
[colored all-ellipse plate (PDF page 12)](https://cseweb.ucsd.edu/~alchern/projects/Penrose/PenroseDGS2024.pdf#page=12):
a dark enclosing conic, three elongated blue conics, three green conics and a
dashed orange completion. These are independently chosen parameters, not an
image trace or Chern's original numerical data. The reference image itself is
not bundled. The original compact positive-diagonal preset remains available.

`engine.defaults('chern')` uses diagonal −0.5, off-diagonals (0.28, −0.26, 0.27),
chord-normal angles (0.20, 1.45, 2.45) radians and offsets (0.09, −0.10, 0.14).
Every curve is generated from the same symmetric matrix. It is negative definite
at the preset, with independent chord forms: all twelve edge contacts are real
and all eight conics are nonsingular ellipses. No curve is translated or resized
independently. Arbitrary slider changes may leave this all-ellipse regime.

The viewport reserves space for the miniature cube. Contact chords and tangents
appear on inspection rather than cluttering the default overview. Ellipses use
uniform angular sampling; unbounded conics retain homogeneous branch splitting.
The dashed eighth conic combines contiguous ganja-generated SVG segments so the
dash pattern does not restart at every sample.

`node test-chern.cjs` checks this preset and 125 nearby configurations separately
from the original randomized family. UI regression tests cover both presets,
reset behavior, the dashed curve and the mobile layout. The Lean files and formal
coverage are unchanged by this display update.
