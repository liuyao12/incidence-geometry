# The Penrose parameter space, its projective quotient, and a bounded walk

## Status and references

This note concerns the **generic labeled regular locus**. It is not a construction of a fine moduli scheme, a classification of singular complete-conic strata, or a new Lean theorem. The mathematical starting point is Arnold–Chern–Eide–Gunn–Neukirchner–Penrose, [*Penrose's eight-conic theorem*, §§6–7 and §9](https://arxiv.org/html/2409.17150v8). Section 6 explicitly counts 17 parameters; section 9 discusses paths between configurations and rank-changing strata. The quotient count and Gram-coordinate description below are deductions from that parametrization.

## 17 parameters before quotienting, 9 generic moduli after quotienting

Keep a cube's vertices labeled and choose its initial corner. A regular matrix chart has a base quadratic form Q0, three weighted linear forms p1,p2,p3, and three scalar face couplings. The paper's count is

    5 + (3 + 3 + 3) + 3 = 17.

This includes placement in the ambient projective plane. Modulo PGL(3), which has dimension 8, the **generic** dimension is 17−8=9. The generic stabilizer is finite: after normalization an automorphism preserving the base and three neighboring conics must preserve the three independent weighted contact forms up to signs. Three independent forms leave only finitely many such transformations. Special configurations can have larger stabilizers, so the subtraction is not a dimension statement for every stratum.

Forgetting the labels amounts to further finite identifications (cube automorphisms); it does not change the generic dimension. Real configurations have additional discrete distinctions and discriminant chambers. In particular, not every pair of real regular configurations can be connected without crossing a degeneracy.

## A concrete normalized chart

Work in a real chart with base form J=diag(1,1,−1), and fix the diagonal entries of the scalar matrix M to 1. Sign variants of this normalization describe other sectors; the demonstration does not claim to cover them all. Write P for the matrix with weighted covectors pi as rows. Then

    qS(x) = xᵀJx − (PS x)ᵀ MS⁻¹(PS x).

Here MS is a principal submatrix and PS selects the corresponding rows. For the narrative implementation this is used in the dual plane, and the primal conics are recovered by adjugates; duality does not change the parameter count. Restrict the regular chart by requiring the relevant principal minors, conic determinants and contact constructions to be nonzero.

The entries of P give 9 parameters and the three off-diagonal entries of M give 3 more. With J fixed, the residual projective group preserving it has dimension 3. Thus 12−3=9 again. Fixing the carrier does **not** fix its projective stabilizer.

On the open subset where P is invertible, define

    G = P J⁻¹ Pᵀ.

The six entries of the symmetric Gram matrix G together with M12,M23,M31 describe this chart up to the residual group, with simultaneous sign identifications. They are not the Euclidean dot products of the on-screen cube's edges. G has the same inertia as J, which is an open condition rather than an extra equation.

To see completeness in this chart, suppose P and P' give the same G, and the scalar matrices M agree. Set A=P⁻¹P'. The equality of Gram matrices implies A J⁻¹ Aᵀ=J⁻¹, so A preserves the base form. The change x=A y carries all the qS simultaneously to the primed configuration. Conversely, any base-preserving change has this effect and preserves G. Choices pi→si pi, si=±1, act by G→SGS and M→SMS, S=diag(si); these are finite ambiguities.

This is not a claim of globally canonical nine real numbers: another real sign sector, initial corner, basis or representative branch can change this description. The UI shows the values in its fixed normalized chart.

## What the cuboid does and does not encode

The existing cube uses the **unweighted** seed-chord covectors expressed in a fixed reference-chord basis. It visualizes the three index directions and supports incidence selection. It neither contains the three weights nor the independent face couplings. Holding all six endpoints fixed while varying either of those changes the conics without changing the cuboid.

The `Keep seed chords fixed` option demonstrates precisely that. An ordinary cuboid has only three shape parameters; a general Euclidean parallelepiped has six up to rigid motion. Neither is a complete nine-dimensional projective invariant. A decorated cube retaining the absolute conic, weighted forms and coupling data can encode a chart, but it is additional data, not a bare Euclidean solid.

## Removing the equal-coupling restriction without breaking the narrative

Originally all three off-diagonal entries were rho=1+z, z=opening*ease(phase−2). Now use independent rates a,b,c:

    M12=1+za,  M13=1+zb,  M23=1+zc.

The serialized `couplings` array is ordered **12,23,31**, matching the UI and `pairIndices`. The original path is a=b=c=1. All entries still converge to 1 at Salmon.

For the top conic use the bordered determinant divided by its common factor z, but cancel that factor algebraically before numerical evaluation. Specifically,

    det(M)/z = z [2(ab+ac+bc)−a²−b²−c²+2zabc].

The diagonal entries of adj(M)/z are −2c−zc², −2b−zb², −2a−za². The off-diagonal (1,2) entry is b+c−a+zbc, and similarly for the others. Substitution gives the implemented expression for the top conic, including a finite limit at z=0. A similar symbolic cancellation is made for top-edge chord minors. This is not a small-number floating-point division.

The source now has twelve independently varying regular-chart parameters: six endpoints on the circular carrier, three weights `1−inflation[i]`, and three coupling rates. `opening` is held fixed during random exploration. Its product with the rates determines the actual off-diagonal entries, so independently randomizing it as well would introduce redundancy.

## Random target and Wander

`Random target` starts at the Penrose stage, chooses a destination, and animates one route. `Wander` repeats. These are random excursions within a bounded neighborhood of the starting configuration, with rejection and a small-step fallback. They are neither Brownian motion nor samples from a canonical uniform measure on the noncompact moduli space. Some sampled coordinate motion can be a projective change of presentation; the nine-coordinate descriptor is checked to ensure that the endpoint also changes the moduli.

Each accepted route is a straight segment in the endpoint/weight/coupling parameters, reparametrized by

    s(t)=6t⁵−15t⁴+10t³.

Its first two derivatives vanish at the endpoints, so successive segments stop and start smoothly. All conics and chords are **reconstructed from the formulas** at every frame; conic drawing coefficients are not interpolated independently. Geometry identities therefore come from the model, subject to floating-point error.

The planner screens 65 positions on a proposed route. It requires nontrivial changes in the nine-coordinate descriptor, margins from zero for principal determinants, normalized conic determinants, independence of the seed covectors and contact discriminants, and the same real-chamber signature throughout the samples. Sign/branch changes are rejected. Each displayed frame has a further live check **before** assigning the state; a failed check pauses at the last valid position.

These are numerical guards, not an exact interval proof that no unsampled singularity exists. The UI and test reports do not claim a certified path. Routes are restricted to the current regular real-contact pattern; crossing singular strata is left to the separate narrative and later development.

The random seed can be reset. Given the same starting state, anchor, lock setting and range, the selected targets are reproducible. Changing duration changes the speed, not the point on the path. Direct geometric edits and following the narrative cancel the current route. Face/edge selection and both cameras remain usable without interrupting it. Hidden pages pause, and reduced-motion users receive a target without animated travel.

## Verification

`node test-moduli.cjs` checks 470 configurations on 36 planned paths, all 12 contact edges and all 6 faces in both primal and dual forms, agreement with independent principal-matrix inversion, fixed-cube counterexamples, reproducibility, scalar boundary cases, quadric lifting and invariance under a non-Euclidean carrier-preserving projective boost. A finite-difference Jacobian has rank nine at the initial state; this is a software diagnostic, not a proof of the moduli dimension.

`scripts/browser_moduli.py` tests actual controls, intermediate frames, pause/resume, speed changes, repeated destinations, the chord lock, live face selection, independent camera, geometric-edit cancellation, reduced motion and responsive layout. CI also runs the earlier narrative, geometry and black-circle focus regression suites and the existing Lean audit.

No Lean source is changed by this visual release; the formal library remains at 87 audited public theorems.

## Bidirectional framed-vector chart

The full Penrose endpoint now also has an editable cube model encoding **all nine** coordinates via A=GM^-1. It is different from the original unweighted chord cube discussed above. The inverse recovers the unit-diagonal symmetric M from AM=MA^T, then recovers G and a continuous local representative P. All seven non-origin corners can drive the conics. The fixed frame, local magnification, inverse-chart exclusions, controls and numerical safety qualifications are detailed in [VECTOR_CONTROLS.md](VECTOR_CONTROLS.md).

## Presentation update: fixed family through the narrative

The paper-like opening arrangement now uses a negative opening and unequal rates. The regular matrix formulas and their inverse accept either nonzero sign; the earlier equal positive-opening example is not a second preset. The cube represents the regular endpoint of the chosen family at every planar stage, so it stays fixed when only the transition slider moves. See `NARRATIVE.md` for the display homography and the distinction between a controller of a family and moduli coordinates of an intermediate degeneration.
