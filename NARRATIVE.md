# The continuous Penrose page and its linked cube

This is an independently chosen coordinate family illustrating the progression in the introduction of [Arnold et al., *Penrose's eight-conic theorem*, v8](https://arxiv.org/html/2409.17150v8). It is not a claim that every admissible configuration lies in the numerical chart, nor a new proof of the general geometric theorem.

## Pages

- `index.html`: Pappus → Pascal/Brianchon → Salmon → Penrose, with one continuous parameter and persistent labels. `?stage=penrose` opens directly at the regular conic cube.
- `fomin.html`: point–line incidence and exact scalar cancellation, independently of the conic narrative.
- `connections.html`: proved algebraic comparisons and the still-unproved proposed common geometric generalization.
- `lab.html`: the earlier tabbed laboratory, including the Chern-inspired all-ellipse preset.

## The mathematical path

For pair i the two seeds are represented by

    A_i(t) = [u_i²-t, 2u_i, u_i²+t],
    B_i(t) = [t-v_i², 2v_i, v_i²+t].

They lie on x²+t y²=w². At t=0 the carrier is a line pair; at t=1 it is the circle. Joins and meets are recomputed with ganja.js projective geometric algebra. The Pappus/Pascal conclusion is not imposed by drawing a fitted line.

For the circular carrier, take its chord poles, with the compatible sign choices determined from the labeled Pascal cross-joins. Shrinking these pole vectors replaces point pairs by conics, in the dual quadratic-form description. The scalar matrix block has diagonal 1 and common off-diagonal rho. At rho=1 its singular minors describe the Salmon configuration; opening rho beyond 1 yields a regular eight-conic family. A common factor in the top bordered determinant is removed algebraically before numerical evaluation. The endpoints retain point-pair/line-pair data independently of a singular conic matrix.

The three adjustable chord pairs are the three index directions of the cube. The theorem does not prescribe lengths, right angles or a Euclidean embedding of that cube.

## The linked, rotatable cube

`cube-view.js` uses a **fixed reference basis of covectors**, not an invented metric in the theorem. Let l_i^0 be the three seed-chord covectors of the default circular configuration and let B0 have those covectors as columns. A chord is normalized by sqrt(a²+b²), preserving the sign from its ordered endpoints. Its displayed direction is

    b_i = B0^(-1) l_i.

The displayed vertex for a subset S is

    V_S = sum_i (1_{i in S} - 1/2) b_i.

Consequently every edge adding index i has exactly direction b_i, and every face remains a parallelogram. At the reference configuration B0^(-1) B0=I, so it is a regular cube. Moving a chord changes this coefficient-space parallelepiped; lengths and angles may change. These are coordinate-dependent diagnostics, not projective invariants or additional hypotheses of Penrose's theorem. The “Link shape to chords” switch restores a regular combinatorial cube when disabled.

The face planes are computed with ganja's 3D projective algebra. Camera projection, depth sorting and pointer picking are display operations. The cube's camera is entirely independent of both the conic diagram and the spatial quadric scenes. Hidden rear edges are drawn dashed but do not intercept pointer clicks through front faces. All six faces are also available through keyboard-accessible buttons and the selector.

Clicking a face highlights its four conics and their contact chords. In the spatial extrusion scene it selects the corresponding four quadrics and their rings. Clicking an edge selects its two conics. Hiding the conclusion does not reveal its edge-contact data. The palette distinguishes given curves from the dashed orange completion.

### Three chord handles and angle controls

At the Penrose endpoint the handles h1,h2,h3 are the Euclidean midpoints of the original circular seed chords. Dragging one changes both its offset and orientation, moving its two endpoints on the circle. Shift-dragging rotates at fixed offset. The three angle sliders do the same operation; offset sliders change only the chord distance. Left/right arrow keys on a focused handle rotate it; up/down change its offset. Earlier in the narrative all six seeds can be moved individually.

Endpoint ordering is matched to the preceding pair to preserve the selected branch. An edit at an excluded seed-chart value or collapsed incidence is rejected with a message, leaving the last valid configuration available. The slider bounds deliberately exclude tangency and antipodal endpoint ambiguity in this chart.

## Spatial constructions

### Dandelin / Pascal

The quadric x²+y²-z²=1 has rulings

    r_(theta,s)(z) = (cos(theta)-s z sin(theta), sin(theta)+s z cos(theta), z).

An unprimed and a primed ruling intersect at H_i. The three H_i determine Gamma. For each pair of indices the two off-diagonal tangent planes both contain H_i and H_j. Their traces in the section plane Pi are the paired hexagon sides, so their intersection point belongs to Pi ∩ H_iH_j, hence to Pi ∩ Gamma. All three Pascal points lie on that line. The implementation independently computes the planar joins/meets and the spatial line–plane intersections.

This is the regular real spatial chart of the mechanism in the paper's Example 5.3. Ideal or collapsed auxiliary constructions produce a chart warning, not a fabricated finite point.

### Conic extrusion

The worked regular matrix family admits consistent normalization with adjacent conic equations differing by rank-one forms. Adding z² lifts each equation to a quadric while preserving those differences. The contact chord lifts to a contact plane; its intersection with a quadric is the contact ring. Moving the section plane recovers conic sections. Hyperbola branches are split at infinity, rather than connected by a spurious segment.

This visual lift is not the general extrusion lemma for arbitrary seven-conic input, and it is not a full step-by-step eight-quadric completion proof.

## Verification boundary

The Lean library remains at the previously checked 87 public theorems at `dc01f403d36ed7722603470cc03670ebd4b54203`. This release does not add formal theorems. Salmon specializations, the continuous endpoint path, Dandelin's construction and the general extrusion proof are not yet Lean formalized.

`node test-narrative.cjs` checks 732 numerical configurations and 23,134 assertions: carrier incidence, conic contact, face concurrence, all twelve spatial contact rings, independent planar/spatial Pascal constructions, chord edits and the cube's defining linear identities. The older engine suites remain separate.

`python scripts/browser_narrative.py --serve` loads the actual assets over HTTP in Chromium and tests the continuous stages, three handles, angle controls, independent cube camera, actual face picking, all six faces, spatial scenes, mobile layouts, Fomin page and research-status wording. Omit `--serve` for offline assembly; its report explicitly distinguishes that method. CI also runs the earlier laboratory's browser suite and the existing Lean build/axiom audit.

## Moduli explorer extension

The original equal-coupling narrative is retained as the default. Random exploration and the advanced controls now vary all three scalar couplings independently, as well as the weighted seeds. All three couplings converge to one at the Salmon stage. See [MODULI.md](MODULI.md) for the division-free top-conic formula and the distinction between a cuboid, a 12-parameter fixed-carrier chart, and nine generic projective moduli.

## Editable moduli vectors

The regular Penrose endpoint now defaults to a second, bidirectional cube model: three framed vectors encode the nine normalized moduli. Hollow vector endpoints change the conics, whereas dragging faces/background changes only the camera. The original unweighted seed-chord model remains selectable and continues to be used at earlier stages and in spatial views. See [VECTOR_CONTROLS.md](VECTOR_CONTROLS.md) for the calibrated matrix chart and its inverse, corner-distribution rule, and numerical guards. This does not add Lean theorem coverage.

## The opening arrangement and a fixed family controller

The opening now follows the composition of the paper's introductory Pappus–Pascal–Salmon–Penrose strip: nearly horizontal carrier lines, a horizontal ellipse, three slender contacting ellipses, and a real central completing ellipse. These are parameters selected by eye, not the authors' numerical coordinates. There is one default, not a preset menu.

`journey-view.js` applies one fixed nonsingular homography to **every** point, line and conic through the entire story. Its inverse is applied to pointer coordinates. The canonical construction and its conic equations are unchanged by this display choice. The negative `opening` and unequal positive rates select a real twelve-contact branch; the former positive-opening family remains supported by the mathematical API, but is not another user-facing preset. Tests cover both signs.

The cube represents the regular Penrose endpoint of the **whole chosen family**. It is computed from the family parameters, not from the transition slider. Those parameters, its reference frame, its camera and a selected face are retained when sweeping forward/backward. Cube editing is therefore available while viewing Pappus or Pascal too. This is deliberately not a nine-dimensional moduli chart of a degenerate Pappus configuration: some family parameters first affect the later conics. Point edits and vector edits both choose a new entire path. Play travels back and forth rather than jumping from the end to an unrelated start.

The default is a displayed member of the existing determinantal model. No individual conic is relocated, fitted to an image, or interpolated independently. No new Lean theorem is claimed by this presentation change.
