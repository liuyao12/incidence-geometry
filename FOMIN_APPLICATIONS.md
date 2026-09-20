# Classical incidence theorems from the original proof surfaces

The second chapter follows §§2–3 of Sergey Fomin and Pavlo Pylyavskyy,
[Incidences and tilings, version 2](https://arxiv.org/abs/2305.07728v2):
the master theorem first, then Desargues, Pappus, the complete quadrangle,
and its generalization. The local ratio proof and exact-weight experiment
come after the geometric applications.

## Sources and topology

| Example | Paper | Vertices | Edges | Faces | Surface |
|---|---|---:|---:|---:|---|
| Desargues | Theorem 3.1, Figure 5 | 8 | 12 | 6 | Sphere |
| Pappus | Theorem 3.2, Figure 9 | 9 | 18 | 9 | Torus |
| Complete quadrangle | Theorem 3.3, Figure 15 | 11 | 18 | 9 | Sphere |
| Generalized quadrangle | Theorem 3.4, Figure 15 | 11 | 18 | 9 | Same sphere |

`fomin-classics.js` lists every face with its actual paper labels, its role
(construction identity, hypothesis, conclusion), and a geometric explanation.
Face cycles are consistently oriented. The topology checks verify opposite
orientations on paired edges, one cyclic link at every vertex, connectivity,
a global point/line coloring, and Euler characteristic. The planar maps are
redrawings of the cited figures, not unrelated pictures with matching counts.

In Figure 9, the hexagonal boundary cuts through three tiles. Each appears
in two triangular pieces on the cut-open map but is ONE quadrilateral after
gluing. Opposite cuts I, II, III are identified by translation. Repeated a and
b vertices are identified as well. There is no a–b tiling edge. The map contains
12 polygonal *pieces* representing 9 *faces*. The spherical drawings include
the outside region as a quadrilateral through the map's point at infinity.

## Geometric constructions

Desargues uses arbitrary first-triangle vertices and scalar positions of the
second vertices on rays through O. The final side-intersection incidence is
computed independently from those inputs.

For the paper's concurrency form of Pappus, choose A, B, P1, P3, P5, and put
P2 = AP1 ∩ BP3, P4 = AP3 ∩ BP5, P6 = AP5 ∩ BP1. Construct C = P1P4 ∩ P2P5,
then a=BC, b=AC, c=AB. The ninth incidence C ∈ P3P6 is evaluated afterward;
it is never used to construct C or P6. Dual view exchanges these same points
and lines and hence recovers the familiar collinearity formulation.

For the complete quadrangle, first form the six sections Pij of AiAj by h,
choose B1 and B2 ∈ B1P12, and construct B3 and B4 from their prescribed joins.
The conclusion P34 ∈ B3B4 is evaluated afterward. The release slider moves
P14, P24 and P34 separately along their AiA4 lines and constructs the other
Pij by equation (3.4) of the paper. It retains the three collinearities actually
used by the nine-tile proof, without retaining one common transversal.

Selected tiles highlight their two point labels, two line labels, and the
join/intersection condition in the geometry. This is not an incidence graph:
a boundary edge records NON-incidence. Input edits preserve the hypotheses;
near-degenerate edits are rejected and retain the last usable input state.
These numerical guards do not provide certified interval bounds.

## Scope of verification

No Lean theorem, mathematical engine on the first/third page, or global
layout was changed. The existing field-valued surface theorem remains the
formal foundation; the new explicit classical specialization constructions
and their labels are explained here and tested independently. We do not
claim to have added end-to-end Lean proofs of these particular reductions,
nor to illustrate every theorem in the 83-page paper. Figure 13's alternative
Pappus proof and the higher-dimensional examples are cited, not implemented.

`test-fomin-classics.cjs` checks the topology, evaluated incidence conditions,
representative rescalings, duality, loss of total collinearity during release,
and an incoherent labeling with total ratio product one.
`browser_fomin_classics.py` exercises the actual inputs, tile picking,
cut-crossing face selection, scrolling, LaTeX rendering, and responsive layout.
The original exact BigInt edge-weight experiment is retained separately.
