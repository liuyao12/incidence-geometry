# A standalone theorem map

`theorem-map.html` is a fourth page, not a replacement for any narrative chapter.
The graph on the left selects a live construction on the right. Its current scope
is 29 named results, local lemmas, proof illustrations and examples from the three
chapters and the classical library, together with the Monge discussion. It is not
an inventory of every theorem in the two cited papers or every auxiliary Lean lemma.

## Geometry and navigation

The map reuses the actual chapter laboratories in same-origin iframes. Their
article text and site navigation are hidden only inside the map; standalone
chapters are unchanged. Related conic nodes share a laboratory and retain the
edited seed family. Switching away pauses active animations. Pappus can also
open the second chapter's torus proof. The conic surface node offers the torus,
Penrose cube, and odd-cycle examples.

`atlas-extras-math.js` supplies independent numerical constructions for Monge,
Ceva, Menelaus and Braikenridge–Maclaurin. The last constructs the sixth point
from the collinearity hypothesis and fits the conic independently from the first
five points. Monge exposes circle radii, the two Desargues triangles of parallel
diameter endpoints, and the spatial triangle of radius-height lifted centers.
Invalid local-chart edits retain the preceding admissible state.

The graph has keyboard-operable named nodes, search, zoom and an overview button.
`#monge`, `#pappus`, etc. link to a selected theorem. Browser history restores
selection. On narrow displays the graph and construction stack without an overlay.
The common math setup inserts a navigation link into the existing chapter headers.

## Reading the arrows

`atlas-data.js` is the reviewed node-and-edge specification. It is NOT a Lean
import graph. Every edge has a type, explanation, source, and separate verification
flag. Solid arrows mean deduction/specialization in the stated setting. Orange
dashed arrows pass to complete-conic or limiting configurations. Duality and
converse relations are separate undirected styles. Dotted connections identify
shared mechanisms or proof ingredients and do not assert implication.

In particular:

* Penrose-to-Salmon and Salmon-to-Pascal use the broader complete-conic setting,
  not just the generic nonsingular input theorem formalized here.
* Pascal-to-Pappus is the actual checked reducible-carrier specialization.
* The coloring-free theorem implies its bicolored restriction, not conversely.
* The boundary identity, together with the local face lemma, gives the closed
  surface rule. The arrow does not run from the weaker closed case to the boundary case.
* There is no arrow claiming that surface compatibility constructs a missing conic.
* The eight-quadric node explicitly shows only the existing normalized ring-contact
  slice illustration, not an implementation of the full eight-quadric completion.

Sources: Arnold–Chern–Eide–Gunn–Neukirchner–Penrose, arXiv:2409.17150v8, introduction,
§§4–5; Fomin–Pylyavskyy, arXiv:2305.07728, Theorems 2.6 and 3.1–3.4 and Proposition
9.1; Banchoff, *Monge's Theorem and Desargues' Theorem, Identified* (Brown University).
The exact source links appear in each node and edge inspector.

## Verification

No Lean source is changed, and no new formalization of Monge or of the literature
reductions is claimed. The public declaration references are checked against the
existing audit inventory. The new numerical suite checks 880 configurations,
including the external tangent equations, the Monge/Desargues/spatial point
identifications, triangle criteria, and the independently fitted converse conic.

`browser_atlas.py --serve` exercises the actual HTTP-loaded files and iframe URLs
in CI. Its offline mode inlines those local assets and substitutes same-origin
`srcdoc` fixtures only for the iframe URL assignment; this is explicitly marked
in its report. Browser tests cover all 29 nodes, actual input edits, dual views,
shared seed state, extra constructions, flat-surface selection, edge explanations,
filters, graph keyboard navigation and layout down to 320 pixels. All existing
mathematical and browser regression suites remain in CI.
