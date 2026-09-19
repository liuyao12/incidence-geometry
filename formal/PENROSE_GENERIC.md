# Generic Penrose completion: formal status and theorem statement

**19 September 2026.** This development upgrades the original scalar construction
to an end-to-end, arbitrary-input theorem on an explicitly restricted geometric
locus. It is not the whole eight-conic/complete-conic theorem, nor a common
master theorem for Penrose and Fomin–Pylyavskyy.

## Entry points

```lean
import IncidenceCubes

#check IncidenceCubes.Penrose.GeometricSeven.seven_normal_form
#check IncidenceCubes.Penrose.Uniqueness.penrose_generic
#check IncidenceCubes.Penrose.Theorem.penrose_from_tangencies
#check IncidenceCubes.Penrose.Theorem.completion_tangent_at_section
```

`penrose_generic` starts from pencil-contact geometry. The second entry point,
`penrose_from_tangencies`, accepts two distinct points of tangency on each given
edge and derives the pencil relations before applying the theorem.

All conics use arbitrary homogeneous symmetric matrices over a commutative
field with `2 ≠ 0`. Nonzero scalar multiplication is projective equivalence;
the interface uses representatives, not a new quotient type. No coordinates
of a circle, predetermined contact forms, scalar parameter matrix, or candidate
eighth conic are supplied in the input.

## Precise generic hypotheses

Label the given matrices Q0, Q1,Q2,Q3,Q12,Q13,Q23. Give the nine corresponding
contact chords. The hypotheses are:

1. All seven conics are nonsingular. Every existing edge has proper pencil
   contact, or (for the tangency entry point) two distinct common tangencies
   between projectively distinct conics.
2. The three chords from Q0 are linearly independent as covectors.
3. On each completed face the four original chord lines are concurrent at a
   point **off Q0**.
4. None of Q12,Q13,Q23 is projectively equal to Q0.
5. At each Qi, intersect the two already given chords towards Qij and Qik.
   The three resulting points R1,R2,R3 are **noncollinear**.

The last condition is `IndependentFacePoints`: it quantifies over points
annihilated by the ORIGINAL upper chord covectors. It does not assume
invertibility of a parameter matrix or anything about an eighth conic. The
proof derives that invertibility from these incidences.

These open conditions deliberately describe a smaller locus than the paper.
The exact rational example in `Penrose/Examples.lean` proves the hypotheses
consistent and instantiates the theorem. Some chords in that example do not
split over the real numbers; it is a pencil-contact example, not a claim that
all nine contacts occur at real points.

## Conclusion, including its limits

There exists a nonzero symmetric quadratic matrix T and three nonzero contact
chords such that T has proper rank-one pencil contact with Q12,Q13,Q23 and the
four ORIGINAL/NEW chords on each newly completed face are concurrent at a
nonzero point. T is unique up to a **nonzero scalar** among all such completions,
even when competing completions supply different chord representatives.

The tangency entry point additionally records that the quadratic equation is
not identically zero. In characteristic different from two this follows from
symmetry and nonvanishing of the matrix; it is not a statement that the real
zero set is nonempty.

**The output T is not asserted to be nonsingular.** At every point x of a new
contact chord lying on the original regular conic, the theorem
`completion_tangent_at_section` proves that T passes through x, has a nonzero
polar there, and has the same projective tangent. The formal first-order
expansion identifies that polar as a tangent when `2 ≠ 0`. Existence of two
distinct such section points over the chosen field is separate; we do not
silently assume that every quadratic splits over the reals or rationals.

The type `Contact Q R l` means

    l ≠ 0 and R = a Q + b (l lᵀ), for nonzero a,b.

This is no longer an unconnected surrogate for tangency:
`contact_iff_two_tangencies` proves the equivalence whenever the specified
chord has two distinct points on Q, Q is nonsingular, both matrices symmetric,
and Q,R are projectively distinct. The converse constructs a coordinate frame
from the two GIVEN points and proves the pencil relation; it does not assume
such a frame or relation in the geometric input.

## Proof organization

### Recover one face

Normalize the initial contacts to Qi = Q0 − pi²/di, deriving the nonzero di
and representative scales. Pull back by the inverse matrix of the three
initial chord covectors, so pi become coordinate forms. On a face, the two
upper chords lie in the span of pi,pj. Their common off-conic concurrence
point forces their coefficients of Q0 to agree.

Write the residual binary quadratic as A pi² + 2 B pi pj + C pj².
The two rank-one differences yield

    (A + 1/di) C = B²,       A (C + 1/dj) = B².

The excluded case Qij proportional to Q0 rules out the zero binary block.
`binary_normal_form` then derives aij, with Dij=di dj−aij² nonzero, and

    Dij A=−dj,       Dij B=aij,       Dij C=−di.

### Recover all seven and construct the eighth

Repeat for the three faces; this produces a single symmetric parameter matrix
M, diagonal di and off-diagonal aij, plus all representative scales. This is
`seven_normal_form`: the output parameters are DERIVED from the geometry.

The prior polynomial edge identities construct the eighth matrix. New matrix
versions connect those identities to the original scaled conics. Contact
chord uniqueness for a regular conic shows that the canonical upper chords
and the ORIGINAL upper chord witnesses have the same kernels.

In chord coordinates the three new face points are the columns of M; in the
original coordinates they are the columns of L⁻¹ M. The input noncollinearity
condition therefore forces det M ≠ 0. This ensures proper coefficients on the
three new contact pencils. All three new faces are checked using original
chord witnesses, not a relabeled diagram.

### Uniqueness

Any competing completion has the same three new face points, because each is
already determined by two original chords. Each new contact chord must join
two of these noncollinear points, so it is the constructed chord up to scale.
Two resulting conic pencils have at most one common projective conic: otherwise
a given regular conic would be a combination of two double lines and hence
have zero determinant. This proves uniqueness without assuming the competing
completion is itself nonsingular.

## Modules

- `Normalization.lean`: reverse single-face normalization.
- `Contact.lean`: matrix contact geometry, polar identities, coordinate transport.
- `Seven.lean`: arbitrary input and derived compatible normal form.
- `Completion.lean`: nonzero eighth matrix, proper contacts and original-chord concurrence.
- `Uniqueness.lean`: geometric genericity, forced chords, projective uniqueness.
- `Tangency.lean`: equivalence with two-point tangency and nonzero quadratic equations.
- `Theorem.lean`: end-to-end entry point using ordinary tangent data.
- `Examples.lean`: exact rational nonvacuity instance.

Every module is imported by the root library and every public theorem is in
`Audit.lean`. The new layer adds 94 public theorems, bringing the total to 181;
these counts include supporting lemmas, not 181 distinct geometric theorems.
The audit compares the source inventory to actual Lean dependency output and
allows only `propext`, `Classical.choice`, and `Quot.sound`. No numerical/CAS
result, custom axiom, placeholder, or native-computation assumption is trusted.

## Not yet covered

The restrictions above are not removed. In particular: dependent initial
chords; concurrence on the base; projectively coincident opposite conics;
collinear/coincident new face points; arbitrary singular input; complete conics
retaining dual data; the spatial eight-quadric/extrusion proof; and the formal
specialization chain through Salmon are outside this milestone. Automatic
existence/distinctness of contact section points over algebraic closures is
also not bundled here.

The Fomin code and the local determinantal comparisons are unchanged. This is
now a generic theorem on the Penrose side, **not** a newly established common
geometric master theorem.

Reference: Arnold, Chern, Eide, Gunn, Neukirchner and Penrose,
[*Penrose's eight-conic theorem*](https://arxiv.org/html/2409.17150v8), especially
§§4.2–4.3 and §§6–7. The Lean proof organizes the algebraic route with explicit
reverse normalization and an independent two-pencil uniqueness argument.
