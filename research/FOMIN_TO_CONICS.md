# From incidence to contact: a conic version of Fomin's surface theorem

**19 September 2026. Local, kernel-checked development based on main commit
`40728d48cf596ba9cc856aaf59cc8a45b3acee00`.**

This note proposes the following mathematical organization of the “three P's”:
Pappus -> Pascal -> Penrose enlarges the geometric objects while retaining a
compatibility principle. Starting from Fomin–Pylyavskyy, retain the closed
quadrilateral gluing and its multiplicative cancellation, and replace the
point–hyperplane pairing by the canonical relative scale of two conics in
double contact. The essential new step is a proved geometric equivalence:
**four contact chords are concurrent exactly when contact transport around the
quadrilateral is trivial**.

The result is a genuine conic surface implication. It is not merely the earlier
scalar defect-product identity. It is also not a proof that every Fomin
configuration deforms into a conic configuration, nor a replacement for the
existence part of Penrose's seven-to-eight theorem. Those distinctions are
explained below. Priority in the literature has not been established.

## 1. Precise conic surface theorem

Work over a commutative field K of characteristic different from two for the
ordinary geometric interpretation; the matrix/contact version needs no
characteristic restriction. A conic is represented by a nonsingular symmetric
3-by-3 matrix, up to nonzero scale.

Let T be a finite, closed, oriented, bicolored quadrangulation. Assign a
nonsingular conic Q_v to every vertex. Assume:

1. Each adjacent pair has proper double contact along a specified nonzero
   chord l_e. Equivalently, Q_v = a_e Q_u + b_e l_e l_e^T with a_e,b_e nonzero.
   There is a separate formal entry point which DERIVES this relation from
   two distinct common tangent points on each edge.
2. On every face, one specified adjacent pair of contact chords is distinct.
   This convenient open condition supplies a unique candidate concurrence
   point. The proof does not assume a common conic parametrization.

Call a face coherent when its four ORIGINAL edge-contact chords are concurrent.
Then:

> **Conic surface theorem.** If every face except one is coherent, the last
> face is coherent as well.

The conics all live in a projective plane; T is the separate combinatorial
surface organizing the theorem. Its edges represent double contact, not
segments drawn on the conics. The theorem holds for any such finite gluing,
including positive genus. It does not assume a global scalar matrix whose
principal minors generate every conic.

Formal entry points:

```lean
#check IncidenceCubes.Connection.GeometricSurface.conic_surface_last_face
#check IncidenceCubes.Connection.SurfaceApplications.conic_surface_from_tangencies
#check IncidenceCubes.Connection.SurfaceApplications.conic_cube_five_faces
```

The input datatype `Tiling` includes black/white vertex endpoints, the four
vertex slots of each face, and compatibility with the two edge-slot bijections.
It is the finite incidence data extracted from a quadrangulated surface, not
an assertion that a topology/manifold-recognition library has been completed.

## 2. The canonical transport along a contact edge

For adjacent conics choose representatives and write

    Q_v = lambda_uv Q_u + mu_uv l_uv l_uv^T,
    lambda_uv != 0, mu_uv != 0.

The first scalar lambda_uv is unique. If a second contact expression had
coefficient lambda'_uv, subtracting the two relations would express
(lambda_uv-lambda'_uv) Q_u as a sum of two rank-one matrices. Since Q_u has
rank three, lambda_uv=lambda'_uv. This also proves independence from the
chosen scale of the chord or the supplied contact witness.

Reverse traversal has coefficient lambda_vu=lambda_uv^-1. If representatives
are changed by Q_v -> s_v Q_v, then

    lambda_uv -> (s_v/s_u) lambda_uv.

Consequently, the product around a closed face is independent of all chosen
representatives. Congruence by an invertible coordinate matrix leaves the
coefficient unchanged. This is scalar transport (a one-dimensional discrete
connection), not an arbitrary edge label declared as extra geometric input.

Lean has `scale_unique`, `Witness.reverse`, `Witness.rescale`, `Witness.pull`,
and `face_gauge_invariant`. The proper contact relation supplies nonzero
coefficients; field zero is never silently used as an invertible edge value.

## 3. The local theorem, with proof

Write the four matrices in cyclic order as Q0,Q1,Q2,Q3, and orient all edges
from black to white. Let

    Q1 = a Q0 + b p p^T,
    Q1 = c Q2 + d r r^T,
    Q3 = e Q2 + f s s^T,
    Q3 = g Q0 + h t t^T.

All eight scalars are nonzero, Q0 is nonsingular, and p,r are independent.
The face holonomy is

    H = ae/(cg).

The theorem is

    p,r,s,t concurrent  <=>  H=1.

### Concurrence implies H=1

Eliminating Q1,Q2,Q3 gives

    (ae-cg) Q0 + be pp^T - de rr^T + cf ss^T - ch tt^T = 0.    (1)

At a common nonzero point x of the four chords, every rank-one term annihilates
x. Thus (ae-cg) Q0 x=0. Invertibility of Q0 implies Q0 x!=0, hence ae=cg.

Notice that x need NOT be off the base conic. Applying the matrices to x uses
the nonzero polar vector Q0 x, instead of evaluating the scalar quadratic
x^T Q0 x. This local theorem therefore avoids that extra assumption of the
older normalization argument without developing singular input cases.

### H=1 implies concurrence

With ae=cg, equation (1) is a dependence of four rank-one squares with all
four coefficients nonzero. Any three linearly independent chord covectors
would make their weighted square sum invertible, because

    det(A pp^T + B rr^T + C ss^T) = ABC det[p r s]^2.

But the relation says that sum is a single rank-one form. This is impossible.
Therefore the four covectors span a space of dimension at most two, so they
have a common projective zero. Concretely, because p,r are independent,
x=p cross r is nonzero; applying the determinant argument to p,r,s and then
p,r,t proves s(x)=t(x)=0.

This rank-one rigidity is the nonlinear geometric step. The Lean theorem
`face_concurrent_iff` accepts ARBITRARY matrix contact witnesses; it neither
assumes face flatness nor starts with a principal-minor family. The same file
contains the determinant lemma and the cleared-denominator identity (1).

## 4. Global proof and Fomin specialization

For an oriented face f, define H_f as the product of contact transport along
its boundary, using inverse transport on a reversed edge. Every physical edge
appears with both orientations in the product over all faces. Hence

    product_f H_f = 1.                                      (2)

If all faces other than f0 have concurrent contact chords, the local theorem
makes their holonomies one. Equation (2) forces H_f0=1; the converse part of
the same local theorem gives the missing concurrence.

This uses exactly the pre-existing `Fomin.total_product`/`Fomin.last_face` proof.
The difference from the old scalar result is that edge weights are DERIVED
from geometric labels and that their flatness is PROVED equivalent to the
required geometric conclusion.

For Fomin's original objects, use a point vector A at each black vertex and a
nonzero linear functional l at each white vertex. Non-incidence gives the edge
weight l(A). On a face (A,l,B,m), the holonomy is

    l(A)m(B) / (l(B)m(A)).

It equals one precisely when the line AB meets ker(l) intersect ker(m). The
new `HyperplaneSurface` module proves this equivalence and the all-but-one
geometric theorem in an ARBITRARY ambient vector space, not just dimension
three. In dimension three this is the familiar join/meet incidence.

For example the geometric intersection, when the pairing determinant is zero,
is represented by

    x = l(B) A - l(A) B.

The point-independence and non-incidence hypotheses prove x nonzero. This is
an actual geometric witness, not a definition of incidence as a ratio.

```lean
#check IncidenceCubes.Connection.HyperplaneSurface.coherent_iff_minor
#check IncidenceCubes.Connection.HyperplaneSurface.hyperplane_surface_last_face
#check IncidenceCubes.Connection.GeometricSurface.point_line_surface_last_face
```

Thus the common **surface-transport principle** now has two checked geometric
realizations. A point/hyperplane face uses evaluation transport and linear
incidence. A conic face uses contact transport and concurrent contact chords.
This does not assert that an arbitrary point/hyperplane net is a degeneration
of a particular conic net.

No sign-positivity hypothesis is used. The earlier `positive_square_obstruction`
concerned a different proposed ansatz with every normalized face defect a
positive square. Here the relevant invariant is the RELATIVE SCALE of a contact
pencil. The square coefficients in (1) have their proper orientation signs.

## 5. The connection with Penrose, stated precisely

For the boundary of a cube, the new theorem says:

> Given eight nonsingular conics with proper contact on all twelve edges,
> concurrence on five faces forces concurrence on the sixth.

It is important not to replace this by the seven-to-eight statement. The new
surface theorem presupposes all vertex labels. Penrose also proves existence
and uniqueness of an absent vertex label from three compatible initial faces.
That is a stronger local construction problem, not a formal consequence of
scalar cancellation alone.

The established generic Penrose theorem in this library is precisely the local
completion rule for the conic interpretation of face coherence. Where its
completion is regular, one may replace the three faces meeting at one cube
corner by the other three: both patches share the same six boundary vertices
and edges, and all new faces are coherent. The previously checked Penrose
result provides existence/uniqueness; the new surface result supplies the
arbitrary-surface compatibility law. We have NOT formalized arbitrary sequences
of such patch replacements or a global conic realization algorithm.

This is a more useful common organization than demanding one huge scalar
parameter matrix for every surface:

    scalar surface transport
      /                     \
    point/hyperplane      conic contact
       coherence           coherence
                              |
                    generic Penrose cube completion

The outstanding unification question is whether there is a direct geometric
construction connecting the two realizations (or a broader completion theorem),
not whether their local/global scalar laws can be matched. Those laws are now
matched by proofs.

## 6. Nonvacuity and exact examples

### A contact quadrilateral which is NOT coherent

Take the four rational symmetric matrices

    Q0 = [[-20,-16,14],[-16,-8,12],[14,12,-11]],
    Q1 = [[-20,-16,14],[-16,-12,14],[14,14,-12]],
    Q2 = [[-12,-8,6],[-8,-4,6],[6,6,-4]],
    Q3 = [[-12,-8,6],[-8,-4,6],[6,6,-6]].

Their determinants are 128,192,64,96. Put

    p=(0,-2,1), r=(2,2,-2), s=(0,0,-1), t=(-2,0,-1).

They satisfy

    Q1=Q0-pp^T, Q2=Q1+2rr^T, Q3=Q2-2ss^T, Q0=2Q3+tt^T.

The cyclic transport product is 2, not 1. Their chords are not concurrent.
`TransportExamples.lean` proves regularity, symmetry, all four proper contacts,
nontrivial holonomy and nonconcurrency with exact kernel-checked rational proofs.
The independent exact checker additionally verifies negative binary section
determinants, so each edge has two distinct real contact points. That last
real-splitting check is not included as a Lean theorem.

### A regular conic torus, not just a cube

A 4-by-4 periodic square grid has 16 vertices, 32 edges and 16 faces. The exact
checker constructs a conic net on this torus with:

- 16 projectively distinct nonsingular conics;
- two distinct real contact points on EVERY edge;
- four distinct contact chords on EVERY face;
- 16 distinct concurrence points;
- nonconstant edge transport (after changing vertex representative scales).

Let J=diag(1,1,-1),

    u0=(1,0,0), u1=(0,1,0), u2=u0+u1, u3=u0-u1,
    a=(1,2,1/5), b=(3,-1,3/10),
    v0=a, v1=b, v2=a+b, v3=a-b,
    beta=(-2,-2,1,1)/100.

Both sum beta_i ui ui^T and sum beta_i vi vi^T are zero. Define partial sums
S_i,T_j, starting at zero, and C_ij=J+S_i+T_j. This closes periodically.
Invert each matrix and then rescale at each vertex:

    Q_ij = ((17+4i+j)/17) C_ij^-1.

The Sherman-Morrison identity supplies all edge chords and scales. Inversion
makes the opposite chord lines of each face generally distinct, rather than
the equal opposite chords of the additive precursor. Every property listed
above is checked using rational arithmetic in `scripts/test_conic_transport.py`.
All 16 conics, 32 edges, 16 faces, their chords, scales and concurrence points
are exported in `verification/conic-transport/exact-examples.json`.

These example checks are separate from the proof of the general theorem.
They use SymPy as an independent implementation check, never as a Lean oracle.

## 7. Formal status and reproduction

New modules:

- `Connection/ConicTransport.lean`: contact witnesses, uniqueness, gauge law,
  projective pullback, four-square rigidity, and the local geometric equivalence.
- `Connection/GeometricSurface.lean`: vertex/edge/face incidence, actual conic
  and point–line nets, geometric all-but-one-face theorems.
- `Connection/HyperplaneSurface.lean`: original point/hyperplane interpretation
  in arbitrary vector spaces.
- `Connection/SurfaceApplications.lean`: input by actual tangent points and the
  finite six-face cube instantiations.
- `Connection/TransportExamples.lean`: an exact noncoherent contact square.

The five modules add 28 public theorems, bringing the total from 181 to 209.
Counts include infrastructure; they are not 209 separate incidence theorems.
All five modules are in the root import, and every public theorem is in Audit.

```sh
cd formal
lake exe cache get
lake build
lake env lean Audit.lean > ../verification/conic-transport/axiom-audit.txt
python3 ../scripts/audit_axioms.py ../verification/conic-transport/axiom-audit.txt
cd ..
python3 scripts/test_conic_transport.py
```

Lean/mathlib are pinned to 4.19.0 with the existing dependency lockfile. The
actual local build/audit evidence is under `verification/conic-transport/`.
It is not described as a fresh GitHub Actions run. No interactive source or
non-generic classification was changed in this development.

## References and attribution

1. Sergey Fomin and Pavlo Pylyavskyy, *Incidences and tilings*,
   https://arxiv.org/abs/2305.07728, especially Proposition 2.5 and Theorem 2.6.
   The original local model uses projective linear subspaces, rather than conics.
2. Russell Arnold, Albert Chern, Morten Eide, Charles Gunn, Thomas Neukirchner,
   Roger Penrose, *Penrose's eight-conic theorem*,
   https://arxiv.org/html/2409.17150v8, particularly §§1, 3.1.2, 4.2 and 6–7.
3. Alexander I. Bobenko and Wolfgang K. Schief, *Discrete line complexes and
   integrable evolution of minors*, https://arxiv.org/abs/1410.5794.
4. Alexander I. Bobenko and Alexander Y. Fairley, *Nets of Lines with the
   Combinatorics of the Square Grid and with Touching Inscribed Conics*,
   https://doi.org/10.1007/s00454-021-00277-5. This is related conic-net work,
   not identified here with the double-contact surface theorem.

The scalar cancellation, contact-pencil matrix description and rank/determinant
facts are established ingredients. Targeted searches did not identify this
precise all-but-one conic-contact formulation. That does not establish novelty;
a publication-level literature comparison remains necessary. The theorem and
its proofs stand independently of a priority claim.
