# Towards a common determinantal incidence theory

**Research status, 18 September 2026.** The project contains checked algebraic comparisons and a candidate architecture. It does not yet contain one geometric master theorem subsuming the complete Penrose and Fomin–Pylyavskyy papers. The interactive exposition is deliberately unchanged.

## 1. A common local operation

For a matrix M over a commutative field, eliminate a scalar pivot k by

    M^k_ij = M_ij − M_ik M_kj / M_kk.

This Schur complement is the M-system of Bobenko–Schief [BS, equation (2.3)], not a new recurrence. Their work connects it with line complexes, Desargues, minors and the hexahedron recurrence. A later paper studies its symmetric reduction and the discrete CKP equation [BC].

`Determinantal.pivot_commutes` proves that eliminating k and l in either order gives the same matrix when both initial pivots and their 2-by-2 principal determinant are nonzero. `pivot_preserves_symmetry` proves preservation of symmetry. No consistency axiom is assumed.

For the bordered matrix

    N = [[q,u,v], [r,d,a], [s,b,e]],    D = de − ab,

the basic exchange identity is

    D(dq − ur) − d det(N) = (dv − au)(ds − br).             (1)

`exchange` and `bordered_eq_det` check this polynomial identity and its interpretation as an actual determinant. Two successive Schur complements equal det(N)/D. These are standard determinantal facts; the contribution here is their checked organization and specializations, not a claim of novelty.

### Penrose specialization

Set r=u, s=v, b=a. The two factors in (1) become equal:

    (de − a²)(dq − u²) − d det(N) = (dv − au)².             (2)

With q quadratic and u,v linear, this is a rank-one conic-contact identity. `penrose_middle_via_symmetric_exchange` derives the EXISTING Penrose middle-edge statement from this identity. The larger-principal-minor version organizes [P, section 7].

Deriving the matrix normal form from arbitrary geometric seven-conic input remains separate: constructing normalized examples is not its proof.

### Fomin–Pylyavskyy specialization

For points A,B and hyperplanes l,m, form the pairing matrix

    H = [[l(A), l(B)], [m(A), m(B)]].

Coherence is det(H)=0, equivalently l(A)m(B)/(l(B)m(A))=1. When l(A) is nonzero, it is also the vanishing of the Schur complement of H's upper-left pivot. `fomin_coherence_via_zero_pivot` proves this with the existing mixedRatio API. `fomin_coherence_iff_classical_collinear` identifies the planar consequence with the SAME Collinear predicate used by the classical baseline.

All four edge pairings must be nonzero for a geometric tile. The purely algebraic zero-pivot equivalence needs three of them.

### The singular-stratum warning

A coherent Fomin pairing matrix has determinant zero, even though all four entries are nonzero. The regular two-pivot Schur formula divides by this determinant and therefore CANNOT be applied directly to that coherent block. Another minor chart might avoid the singular pivot, but that chart and its compatibility must be supplied.

This favors **division-free minor relations**, with Schur complements as regular coordinate charts. Zero minors encode incidence; symmetry identifies exchange factors. Neither should be discarded to obtain an everywhere-invertible recurrence.

Thus there is a concrete common LOCAL calculus, not merely a shared cube diagram. This does not establish a common GLOBAL geometric theorem.

## 2. Retaining defects on a closed surface

On a finite oriented quadrilateral edge-pairing certificate, give each edge a nonzero scalar. For a face, write its positive pair as a,d and its negative pair as b,c. Put

    D_f = a_f d_f − b_f c_f,    n_f = b_f c_f.

Then

    product_f (1 + D_f / n_f) = 1.                         (3)

**Proof.** Each factor is a_f d_f/(b_f c_f). The two face-slot bijections ensure that every physical edge occurs once with each sign. The edge values cancel. The formal proof uses `Fomin.total_product`, not an assumed global relation.

If D_f=u_f v_f, this becomes

    product_f (1 + u_f v_f / n_f) = 1.                     (4)

The zero-defect case recovers the last-face rule. When all but one defect vanish, the last product u_f v_f vanishes. If symmetry identifies the factors, its square root vanishes over a field. These statements are in `Connection/DefectSurface.lean`.

In a compatible minor model, (1) can supply the factorization. But an arbitrary factor-labeled surface is NOT automatically realized by one matrix or by a projective configuration. Equation (4) is a scalar generalization, not a proved geometric generalization of both papers.

### Obstruction to naive positive-square gluing

Over an ordered field, suppose every n_f is positive and every D_f=u_f². Every factor in (3) is at least one; any nonzero u_f makes one strictly greater than one. Thus the product is one only when EVERY u_f vanishes.

`positive_square_obstruction` formalizes this restriction. It excludes only this positive ansatz, not signed defects, mixed-sign weights, complex coefficients or a more sophisticated translation. Reversing a face swaps numerator and denominator and changes the determinant defect's sign. Orientation information cannot be discarded.

A different warning concerns replacing scalar weights by matrices. On an abstract torus boundary one gets a commutator rather than cancellation. For

    A = [[1,1],[0,1]],   B = [[1,0],[1,1]],

ABA^-1B^-1=[[3,-1],[1,0]], not the identity. `torus_commutator_counterexample` checks nonidentity. This is NOT a claimed one-face bicolored Fomin tiling or a counterexample to either paper.

## 3. What a full common generalization still needs

The candidate is a **division-free, signed determinantal incidence calculus**: rectangular matrices and minors, factorized exchanges, Schur transitions on regular charts, and explicit oriented gluing. Linear incidence and symmetric quadratic contact would be different geometric realizations.

A satisfactory master theorem needs:

1. A translation of arbitrary admissible Fomin point/hyperplane labels and tilings, not only a chosen cube.
2. A translation of arbitrary admissible seven-conic input without assuming the desired normal form.
3. Compatibility of local minor charts, singular strata and signs around cycles. A surface need not be one elimination cube or global principal-minor chart.
4. A conclusion recovering both forced incidence and a missing conic, including appropriate uniqueness and nondegeneracy.

The surface master theorem concerns a constraint implication on already assigned labels. Penrose concerns existence/completion. Fomin's separate Proposition 9.1 is itself a completion theorem, but this does not erase the distinction for arbitrary surfaces.

For now use a shared matrix/minor layer, a separate gluing layer and independent geometric interpretations. State the classical conclusions once and reuse them. Do not present the full theories as proved independent, or redraw the exposition as if a complete unification had been proved.

## 4. Classical baseline

The library uses arbitrary homogeneous coordinates over a commutative field, with nonzero certificates for genuine projective constructions. Pappus and Desargues use unconditional vector identities from Maddux [M], checked in Lean by ring normalization. Pascal uses the six-point conic determinant identity; the hypothesis is an arbitrary nonzero quadratic equation, not a parametrization. Reducible conics are allowed. Brianchon uses inverse polarity of a nonsingular symmetric matrix in characteristic different from two, together with the first-order polar-tangent expansion. Homogeneous Menelaus and Ceva are also included.

Current mathlib name searches found catalogue entries, not ready-to-import proofs of these hexagon/Desargues/Brianchon results. We reuse mathlib's algebra, determinants, kernels and tactics. This is a search result, not a claim about every external Lean project.

## References

- [P] Arnold, Chern, Eide, Gunn, Neukirchner, Penrose, [Penrose's eight-conic theorem](https://arxiv.org/html/2409.17150v8), §§6–7.
- [F] Fomin and Pylyavskyy, [Incidences and tilings](https://arxiv.org/abs/2305.07728), Proposition 2.5, Theorem 2.6, §9 and §11.
- [BS] Bobenko and Schief, [Discrete line complexes and integrable evolution of minors](https://arxiv.org/html/1410.5794v2), equation (2.3), §§3–4.
- [BC] Bobenko and Schief, [Circle complexes and the discrete CKP equation](https://arxiv.org/abs/1509.04109).
- [M] Maddux, [Formulas generalizing Pappus and Desargues](https://arxiv.org/abs/2011.12455).
