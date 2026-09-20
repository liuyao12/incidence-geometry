# A bidirectional, framed Penrose parallelepiped

The regular Penrose endpoint now defaults to **Moduli vectors · editable**. Drag the hollow corners to change the conics; drag faces or empty space to orbit the independent camera. A click on a face still inspects its four conics and contact chords. The previous **Seed chords · view only** interpretation remains selectable.

## Interaction

The origin ∅ stays fixed. Vertices 1, 2, 3 (shown as v1, v2, v3) are the three generating vector endpoints. Moving one changes just that displayed generator. A corner indexed by a nonempty subset S moves the generators indexed by S equally: each receives Δ/|S|. The rest of the corners are recomputed as subset sums. Thus opposite edges remain parallel and faces remain parallelograms.

Ordinary dragging moves in the camera's view plane through the initial point. Shift-drag changes its depth instead. All nine components are separately editable under **Vector coordinates and sensitivity**. A focused vertex uses arrows in the view plane, Shift-up/down in depth, and Alt for smaller steps. Face/background keyboard focus instead controls the camera. Camera orbit and perspective never change the conics.

**Undo edit** restores the exact parameter state from before the last drag, keyboard move, or numeric edit. **Reframe as cube** makes the current moduli the unit-cube reference without changing the conics. The original index directions and face labels are preserved; geometric lengths and angles of this display are not invariants of the theorem.

A random tour updates the moduli cube even when its seed chords are locked. Starting a geometric vector edit stops that tour; merely orbiting, inspecting a face, or reframing does not. The editable cube now controls the entire family at every planar narrative stage. It is encoded using that family’s regular Penrose endpoint and stays fixed as the transition slider moves. Spatial views retain the non-editable chord cube. Some family coordinates affect only the later conics; this is not a nine-dimensional parametrization of Pappus or Pascal themselves.

## Forward map

In the normalized chart used by `MODULI.md`, the weighted covector rows P, the fixed carrier J=diag(1,1,-1), and the unit-diagonal symmetric coupling matrix M give

    G = P J^-1 P^T,       A = G M^-1.

The generic information content is the six entries of G and three off-diagonal entries of M. The nine entries of A can recover them on an additional open subset. This is a local coordinate construction, not a new complete moduli-space classification.

Let Aref be the reference matrix, and let k>0 be a display magnification. The displayed column matrix is

    C = I + k (Aref^-1 A − I).

At the reference configuration C=I. Reconstruction begins with

    A = Aref [I + (C−I)/k].

The affine magnification is important: at the introductory example, the inverse of the unscaled map is sensitive enough that subpixel moves can approach a discriminant wall. The default k=1000 makes local editing practical. Changing k or Aref is a change of display only. A flattened *displayed* frame is not by itself a singular conic; reframe to restore a useful view. The reference axes e1,e2,e3 remain fixed as the vectors move, and rotate with the whole scene under camera orbit.

## Recovering M and G

For A=(a_ij), write M12=x, M23=y, M31=z, with Mii=1. The condition that AM be symmetric is the following three-by-three linear system:

    [a11−a22, a13,     −a23    ] [x]   [a21−a12]
    [−a31,    a22−a33, a21     ] [y] = [a32−a23]
    [a32,     −a12,    a33−a11 ] [z]   [a13−a31].

If its coefficient matrix is invertible, it uniquely recovers M, and then G=AM. The implementation rejects poorly conditioned solves and checks the symmetric reconstruction and the round trip back to A.

This system can fail at otherwise legitimate configurations. For example, A=diag(2,2,-1) leaves M12 undetermined. No claim is made that one chart covers these points. Finite representative-sign ambiguities remain as described in `MODULI.md`.

## Lifting the recovered Gram matrix continuously

Fix the currently accepted weighted matrix P0. Set

    H = P0^-1 G P0^-T.

At the starting point H=J. In a nearby chart write H=L D L^T without pivoting, requiring the diagonal signs of D to stay (+,+,-). Then

    P = P0 L sqrt(|D|)

satisfies P J P^T=G. This gives a locally continuous choice of actual covectors rather than jumping between arbitrary eigenvector bases.

The norm sqrt(p_i J p_i^T) recovers the chord weight. The chord J p_i intersects the circular carrier in its two seed endpoints; the old endpoint ordering fixes their branch. Converting them back to the existing u,v coordinates keeps the rest of the narrative and quadric extrusion usable. A sign-branch change, an excluded rational seed coordinate, or a lost real signature is explicitly rejected rather than silently permuting labels.

## Safety and verification boundary

Each proposed move is screened in the matrix chart. If a trial leaves the regular chamber, the first rejected interval is bisected and only the last accepted state is committed. Guards cover conditioning, Gram signature, seed-chart validity, principal minors, conic determinants, and contact discriminants; an independent forward reconstruction must recover the requested matrix. The diagram never independently interpolates or fits its conics.

These are finite numerical checks, **not** exact interval certification that an unsampled singularity cannot occur, and not new Lean proofs. The existing 87-theorem formal library is unchanged.

`test-vector-moduli.cjs` checks the inverse, all nine independent inputs, all seven corner operations, rejection cases, all 12 contact identities, and concurrence on all six faces in both planes. `scripts/browser_vectors.py` exercises actual pointer drags, depth, keyboard focus, numeric edits, Undo, camera independence, real face hits, random-tour interaction, earlier narrative stages, quadric lifting, and mobile sizes. The original chord-cube assertions now explicitly choose the retained chord model; the new suite separately checks the moduli model.
