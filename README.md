# Incidence Geometry

Interactive projective geometry and an independent Lean library.

**[Penrose narrative](https://liuyao12.github.io/incidence-geometry/)** · **[Open the linked conic cube](https://liuyao12.github.io/incidence-geometry/?stage=penrose)** · [Fomin–Pylyavskyy](https://liuyao12.github.io/incidence-geometry/fomin.html) · [Connections](https://liuyao12.github.io/incidence-geometry/connections.html)

## Interactive pages

The Penrose page follows the paper's introductory progression through Pappus, Pascal/Brianchon, Salmon and Penrose. One continuous parameter preserves the seed labels while the objects generalize. Duality, contact inspection, a spatial Dandelin/Pascal construction and a worked conic-to-quadric lift accompany the text.

At the Penrose end, drag the three hollow chord handles h1,h2,h3. They change the original circular seed chords and recompute the entire conic configuration. Shift-drag rotates at fixed chord offset; the angle and offset sliders offer separate controls.

The cube has its own rotatable perspective scene. Its three directions are the current chord covectors in a fixed reference basis. Moving a chord deforms the cube into a parallelepiped; its displayed lengths and angles are coordinate choices, not invariants or hypotheses of the theorem. Click a face to highlight its four conics and contact chords, or an edge for its two conics. The cube camera is independent of the geometry camera. All six faces are also keyboard-accessible through buttons and a selector.

The Fomin–Pylyavskyy page develops point–line coherence and exact scalar edge cancellation separately. The Connections page records checked algebra and the proposed, still unproved common geometric generalization. The [earlier laboratory](https://liuyao12.github.io/incidence-geometry/lab.html) preserves the Chern-inspired all-ellipse preset.

See [NARRATIVE.md](NARRATIVE.md) for exact constructions and limitations.

## Formal verification

The independent project under `formal/` pins Lean/mathlib 4.19.0. The classical and comparison milestone contains **87 audited public theorems**, including supporting lemmas. This visual release does not add formal theorems.

```sh
cd formal
lake exe cache get
lake build
lake env lean Audit.lean > axiom-audit-current.txt
python3 ../scripts/audit_axioms.py axiom-audit-current.txt
```

[Formal inventory](formal/README.md) · [Research notes](research/COMMON_GENERALIZATION.md) · [CI](https://github.com/liuyao12/incidence-geometry/actions/workflows/ci.yml)

Classical Pappus, Desargues, Pascal, Brianchon and the stated converse/duality results are checked under explicit hypotheses. Penrose's polynomial contact identities, surface cancellation, and local determinantal comparisons are also checked. Arbitrary-input Penrose normalization/completion, full geometric surface assembly, and a common geometric master theorem remain separate tasks. Numerical animations do not supply Lean evidence.

## Implementation and tests

Rendering and projective algebra use the pinned vendored ganja.js. Conics retain their quadratic-form representation. No external runtime scripts, tracking, accounts or uploads are used.

```sh
node test.cjs
node test-ganja.cjs
node test-chern.cjs
node test-narrative.cjs
python3 scripts/check_site_links.py
pip install playwright==1.55.0
python3 -m playwright install chromium
python3 scripts/browser_narrative.py --serve
python3 -m http.server 8000
```

Open `http://localhost:8000/`. The new suite checks 732 numerical configurations and 23,134 assertions, independently of the older engine suites and of Lean. Browser tests exercise actual HTTP-loaded assets, chord edits, angle controls, independent cube orbit, actual face picking, duality, spatial scenes and mobile layouts. The earlier laboratory's browser test accepts `--url http://localhost:8000/lab.html`.

## References

- Arnold, Chern, Eide, Gunn, Neukirchner, Penrose, [Penrose's eight-conic theorem](https://arxiv.org/html/2409.17150v8).
- Fomin and Pylyavskyy, [Incidences and tilings](https://arxiv.org/abs/2305.07728).
- [Albert Chern's project page](https://cseweb.ucsd.edu/~alchern/projects/Penrose/).
- [Yao Liu's conic-section notebook](https://observablehq.com/@liuyao12/conics-sections).

## Random exploration of Penrose configurations

The main page now has **Random target**, **Wander**, pause/resume, and a **Keep seed chords fixed** option. The latter moves the conics without changing the linked cuboid. Three weights and three independent face couplings are exposed, along with nine regular-chart invariant coordinates. The path is numerically screened, not formally certified or uniformly sampled from the whole moduli space. See [MODULI.md](MODULI.md) for the 17/12/9 parameter counts, the chart, and sampling limitations.

Run `node test-moduli.cjs` and `python scripts/browser_moduli.py --serve` for the added tests.
