# Incidence Geometry

Three interactive chapters, with precise theorem statements and Lean sources alongside them.

- [From Pappus, to Pascal, to Penrose](https://liuyao12.github.io/incidence-geometry/): a continuous Pappus → Pascal/Brianchon → Salmon → Penrose story, spatial Pascal, and editable framed-vector conic controls.
- [Incidence on surfaces](https://liuyao12.github.io/incidence-geometry/fomin.html): Fomin–Pylyavskyy’s geometric surface principle and exact scalar cancellation.
- [Conic contact on surfaces](https://liuyao12.github.io/incidence-geometry/connections.html): a conic-contact counterpart, linked sixteen- and twelve-conic tori, contact-scale transport, and oriented patch boundaries.

[Theorems and sources](https://liuyao12.github.io/incidence-geometry/proofs.html) gives the hypotheses, attribution, proof entry points and verification scope. The result pages emphasize geometry; development evidence is kept in this appendix and in CI artifacts.

## Formal results

The pinned Lean 4.19.0/mathlib library has 236 audited public theorems, including supporting lemmas. It contains independent classical results; generic arbitrary-input Penrose completion and projective uniqueness; Fomin’s geometric surface theorem in arbitrary ambient dimension; and the conic-contact surface theorem. The conic theorem no longer needs a black–white vertex coloring. A boundary formula tracks transport around any patch. Exact rational tori deduce a sixteenth concurrence from fifteen and a twelfth concurrence from eleven; the second torus has an odd cycle and is not bicolorable. See [the review and strengthening](research/ORIENTED_SURFACES.md).

This does not claim the full degenerate eight-conic theorem, the complete spatial extrusion proof, or a common existence theorem filling arbitrary partial surface labels. Historical priority of the conic-contact surface formulation has not been settled. See [formal/README.md](formal/README.md), [formal/PENROSE_GENERIC.md](formal/PENROSE_GENERIC.md), and [the conic-surface proof](research/FOMIN_TO_CONICS.md).

```sh
cd formal
lake exe cache get
lake build
lake env lean Audit.lean > axiom-audit-current.txt
python3 ../scripts/audit_axioms.py axiom-audit-current.txt
```

Only `propext`, `Classical.choice`, and `Quot.sound` are permitted in theorem dependencies. Every public theorem is in the audit inventory and every implemented module is imported by the root library. Numerical and browser tests are not proof oracles.

## Preview and tests

```sh
python3 -m http.server 8000
node test-conic-net.cjs
node test-oriented-net.cjs
python3 scripts/check_site_links.py
python3 scripts/check_release_sources.py
```

The browser suites require Playwright and Chromium. `python scripts/browser_results.py --serve` exercises the new pages through actual HTTP assets. `python scripts/browser_review.py --serve` exercises cut-open maps, patches, animation continuity, keyboard focus, and bookmark round trips. The older narrative, moduli, vector-editing and focus-regression suites remain in CI. Offline mode is available for local checking without network access, and is labeled separately in its test reports.

The site uses vendored ganja.js for existing projective-plane constructions and a native canvas surface renderer for torus picking. No external runtime scripts, accounts or telemetry are required. The earlier all-ellipse laboratory remains at [lab.html](lab.html).

## Publishing

GitHub Actions builds and audits the formal library and exercises the browser controls. The Pages workflow publishes the repository’s static source tree. `theorem-map.json` maps chapters to formal entry points; `verification/release-source-hashes.json` fingerprints the implementation and formal source for this release. Fresh run-specific logs are uploaded by CI rather than treated as mathematical content.
