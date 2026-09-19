# Conic contact without a vertex coloring, and transport along a boundary

This review strengthens the conic-contact surface theorem on its existing
regular locus. It does not extend the treatment of singular conics, claim
historical priority, or supply a general theorem constructing missing conics
on an arbitrary surface.

## The coloring assumption is unnecessary

Point/hyperplane labels in Fomin–Pylyavskyy's theorem have different types at
the two ends of an edge. Conic labels do not. Choose a direction on each
physical edge of a closed oriented quadrangulation; a face can traverse it
in either direction. No black–white coloring of the vertices is needed.

For proper contact, the equation

    Q_v = lambda_uv Q_u + mu_uv l_uv l_uv^T

has a unique nonzero scale lambda_uv when Q_u is nonsingular. Reversing an
edge gives lambda_vu = lambda_uv^(-1). On a quadrilateral, the existing local
rank-one proof identifies concurrence of its four chords with the product
of the four directed scales being one. The new cyclic wrapper derives the
appropriate reverse witnesses, rather than assuming compatible face data.

Every physical edge occurs once in each direction in the product over all
faces. Consequently all but one coherent face still force the last, without
any vertex coloring. Adjacent distinct-chord and proper-contact hypotheses
are retained. Over characteristic different from two, nonsingular symmetric
quadratic forms have the usual geometric conic interpretation; the matrix
and transport lemmas themselves are stated with their exact algebraic scope.

The formal structure records vertex incidences, cyclic face boundaries, and
a bijection from face sides to the two directed occurrences of each physical
edge. It does not implement topological manifold recognition. Every finite
closed oriented quadrangulation with this incidence data supplies an instance.

Main statement:

    OrientedSurface.conic_surface_last_face

The older bicolored theorem and APIs remain available. Removing their coloring
assumption on the conic side does not remove the need to distinguish points
from hyperplanes in the Fomin realization.

## A boundary formula for any patch

Let S be any set of faces, and H_f the directed product around f. Interior
edges appear twice with opposite exponents and cancel. Hence

    product_(f in S) H_f = product_(directed boundary occurrences) lambda_e.

This identity is proved before assuming coherence and in any commutative
group. When the faces of S are coherent, its right side equals one.

A patch need not be a disk. If its boundary has several components, the
statement concerns their **combined product with induced orientations**;
it does not say that each component separately has transport one. Nor does
local face coherence imply that every noncontractible loop has transport one,
or that all edge scales can be simultaneously normalized to one.

Entry points:

    OrientedSurface.region_boundary
    OrientedSurface.internal_edge_cancels
    OrientedSurface.coherent_region_boundary

This makes the surface proof compositional: a whole coherent patch can be
replaced by its oriented boundary when tracking scales. It does not prove
existence of a geometric filling from arbitrarily prescribed boundary data.

## A genuinely non-bicolorable example

`OrientedExample.lean` gives an exact rational 3-by-4 torus with twelve conics,
twenty-four contacts and twelve faces. Its horizontal three-edge cycle makes
a black–white vertex coloring impossible. The theorem `not_bicolorable` checks
that obstruction directly.

The matrices are produced from a periodic additive net C_ij = J + S_i + T_j,
then Q_ij = adj(C_ij), with J = diag(100,100,-100). Horizontal increments are
-2uu^T, -3uu^T, 5uu^T for u=(1,0,0). The four vertical increments use a=(1,2,1),
b=(3,-1,2), a+b and a-b with coefficients -2,-2,1,1. Both periods close.

All twelve conics are nonsingular. All edge contact equations and each face's
required distinct adjacent chords are checked in Lean. Eleven concurrence
hypotheses are checked directly; **the twelfth is deduced from the general
coloring-free theorem**, not separately inserted as a checked determinant.
Repeated concurrence points on different faces are permitted and occur in
this example; twelve distinct concurrence points are not asserted.

    OrientedExample.first_eleven
    OrientedExample.twelfth_face

The reproducible generator `scripts/generate_oriented_example.py` emits scalar
proofs checked by `norm_num`, not axioms or `native_decide`. The Python generator
is not a trusted proof oracle. The slider-driven twelve-conic example uses the
same periodic construction with different parameters and is tested numerically;
it is not advertised as the exact Lean instance at every slider position.

## Presentation and interaction review

The conic-surface chapter now provides both a rotatable torus and a cut-open
periodic rectangle. Opposite colored sides are identified; this drawing is not
a planar embedding of the torus. Face selection is shared between the map and
conic diagram. A patch selector highlights surviving boundary edges and reports
internal cancellations. The twelve-conic preset demonstrates why the coloring
restriction was real and can now be dropped.

The motion control now starts and resumes at the current parameter state, using
C2-eased segments instead of jumping to a predetermined sinusoidal trajectory.
Transport traces are canceled when their geometry or equation scales change,
and face/edge buttons retain keyboard focus during motion. A bookmark control
records a validated scene in the URL, including parameters, camera, selected
face and patch; reopening it does not start animation automatically.

These browser guards and numerical tests do not constitute exact certification
of continuously traversed parameter paths. Kernel evidence is separate from
rendering evidence. The existing generic Penrose and hyperplane results are
unchanged, and their qualifications remain in the theorem appendix.

## Sources and verification

The starting points remain the two papers linked by the main chapters:
[Penrose's eight-conic theorem](https://arxiv.org/html/2409.17150v8) and
[Fomin–Pylyavskyy, Incidences and tilings](https://arxiv.org/abs/2305.07728).
The coloring-free extension and boundary theorem are deductions proved here,
not an established priority claim.

All 236 public theorem dependencies in this release are audited against the
same allowlist: `propext`, `Classical.choice`, `Quot.sound`. The two new modules
are imported by the root library. CI checks the actual HTTP-loaded pages,
mathematical engines, source fingerprints, internal links, and the formal
build independently. See `verification/release-audit.json`, `Audit.lean`,
`test-oriented-net.cjs`, and `scripts/browser_review.py`.
