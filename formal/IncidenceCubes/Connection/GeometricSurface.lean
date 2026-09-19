import IncidenceCubes.Connection.ConicTransport
import IncidenceCubes.Connection.LocalComparison
import IncidenceCubes.Fomin.Surface

/-!
# Fomin-type surface theorems with genuine geometric labels

A bicolored quadrilateral gluing carries a point-line realization or a conic
contact realization. The edge weights are derived from geometric input, not
postulated. Local equivalences turn the same cancellation theorem into two
geometric all-but-one-face theorems.

The gluing data are weaker than a topological manifold structure. Every closed
oriented bicolored quadrangulation supplies these finite incidence data. No
claim about existence of a missing vertex or conic is part of this surface rule.
-/
namespace IncidenceCubes.Connection.GeometricSurface
open Penrose.Normalization Penrose.Geometry ConicTransport

/-- Actual vertex incidence added to the finite oriented edge pairing. -/
structure Tiling (F E B W : Type*) where
  slots : Fomin.ClosedQuadrangulation F E
  black : E → B
  white : E → W
  faceBlack : F → Fin 2 → B
  faceWhite : F → Fin 2 → W
  positive_black : ∀ f i, black (slots.positive (f,i)) = faceBlack f i
  positive_white : ∀ f i, white (slots.positive (f,i)) = faceWhite f i
  negative_black : ∀ f i, black (slots.negative (f,i)) = faceBlack f (Fin.rev i)
  negative_white : ∀ f i, white (slots.negative (f,i)) = faceWhite f i

variable {F E B W K : Type*} [Field K]

/-- Nonsingular conics at vertices and proper double-contact relations at
edges. No concurrence or scalar face-coherence hypotheses are stored here. -/
structure ConicNet (T : Tiling F E B W) where
  blackForm : B → Form K
  whiteForm : W → Form K
  black_symmetric : ∀ v i j, blackForm v i j = blackForm v j i
  white_symmetric : ∀ v i j, whiteForm v i j = whiteForm v j i
  black_regular : ∀ v, (blackForm v).det ≠ 0
  white_regular : ∀ v, (whiteForm v).det ≠ 0
  chord : E → Vec K
  contact : ∀ e, Contact (blackForm (T.black e)) (whiteForm (T.white e)) (chord e)
  distinct_chords : ∀ f,
    Classical.cross (chord (T.slots.positive (f,0))) (chord (T.slots.negative (f,0))) ≠ 0

noncomputable def ConicNet.edgeWitness {T : Tiling F E B W} (N : ConicNet (K := K) T) (e : E) :
    Witness (N.blackForm (T.black e)) (N.whiteForm (T.white e)) (N.chord e) :=
  ofContact _ _ _ (N.contact e)

noncomputable def ConicNet.edgeWeight {T : Tiling F E B W} (N : ConicNet (K := K) T) (e : E) : Kˣ :=
  (N.edgeWitness e).scale

def ConicNet.Coherent {T : Tiling F E B W} (N : ConicNet (K := K) T) (f : F) : Prop :=
  Concurrent4 (N.chord (T.slots.positive (f,0))) (N.chord (T.slots.negative (f,0)))
    (N.chord (T.slots.positive (f,1))) (N.chord (T.slots.negative (f,1)))

/-- The crucial geometric interpretation: face holonomy is one iff the
four ORIGINAL contact chords are concurrent. -/
theorem ConicNet.coherent_iff_weight {T : Tiling F E B W} (N : ConicNet (K := K) T) (f : F) :
    N.Coherent f ↔ Fomin.faceWeight T.slots N.edgeWeight f = 1 := by
  let e01 := T.slots.positive (f,0)
  let e21 := T.slots.negative (f,0)
  let e23 := T.slots.positive (f,1)
  let e03 := T.slots.negative (f,1)
  let w01 := N.edgeWitness e01
  let w21 := N.edgeWitness e21
  let w23 := N.edgeWitness e23
  let w03 := N.edgeWitness e03
  have rev0 : Fin.rev (0 : Fin 2) = 1 := by decide
  have rev1 : Fin.rev (1 : Fin 2) = 0 := by decide
  have h01 : N.whiteForm (T.faceWhite f 0) =
      (w01.scale : K) • N.blackForm (T.faceBlack f 0) + (w01.weight : K) • square (N.chord e01) := by
    simpa only [e01, T.positive_black, T.positive_white] using w01.relation
  have h21 : N.whiteForm (T.faceWhite f 0) =
      (w21.scale : K) • N.blackForm (T.faceBlack f 1) + (w21.weight : K) • square (N.chord e21) := by
    simpa only [e21, T.negative_black, T.negative_white, rev0] using w21.relation
  have h23 : N.whiteForm (T.faceWhite f 1) =
      (w23.scale : K) • N.blackForm (T.faceBlack f 1) + (w23.weight : K) • square (N.chord e23) := by
    simpa only [e23, T.positive_black, T.positive_white] using w23.relation
  have h03 : N.whiteForm (T.faceWhite f 1) =
      (w03.scale : K) • N.blackForm (T.faceBlack f 0) + (w03.weight : K) • square (N.chord e03) := by
    simpa only [e03, T.negative_black, T.negative_white, rev1] using w03.relation
  have h := face_concurrent_iff
    (N.blackForm (T.faceBlack f 0)) (N.whiteForm (T.faceWhite f 0))
    (N.blackForm (T.faceBlack f 1)) (N.whiteForm (T.faceWhite f 1))
    (N.chord e01) (N.chord e21) (N.chord e23) (N.chord e03)
    (N.black_regular _) (N.distinct_chords f)
    ⟨w01.scale,w01.weight,w01.chord_ne,h01⟩ ⟨w21.scale,w21.weight,w21.chord_ne,h21⟩
    ⟨w23.scale,w23.weight,w23.chord_ne,h23⟩ ⟨w03.scale,w03.weight,w03.chord_ne,h03⟩
  simpa only [ConicNet.Coherent, Fomin.faceWeight, Fin.prod_univ_two,
    ConicNet.edgeWeight, e01,e21,e23,e03,w01,w21,w23,w03] using h

/-- A conic analogue of Fomin--Pylyavskyy's master theorem on an arbitrary
closed finite quadrilateral gluing. Its hypotheses are geometric concurrence. -/
theorem conic_surface_last_face [Fintype F] [Fintype E]
    (T : Tiling F E B W) (N : ConicNet (K := K) T) (missing : F)
    (h : ∀ f, f ≠ missing → N.Coherent f) : N.Coherent missing := by
  apply (N.coherent_iff_weight missing).mpr
  apply Fomin.last_face T.slots N.edgeWeight missing
  intro f hf
  exact (N.coherent_iff_weight f).mp (h f hf)

/-- The full curvature product is one even when many faces are not coherent. -/
theorem conic_total_holonomy [Fintype F] [Fintype E]
    (T : Tiling F E B W) (N : ConicNet (K := K) T) :
    (∏ f : F, Fomin.faceWeight T.slots N.edgeWeight f) = 1 :=
  Fomin.total_product T.slots N.edgeWeight

/-- Fomin's original planar vertex labels, on exactly the same combinatorics.
Distinctness is recorded so joins and meets denote actual projective objects. -/
structure PointLineNet (T : Tiling F E B W) where
  point : B → Vec K
  line : W → Vec K
  nonincident : ∀ e, Fomin.dot3 (line (T.white e)) (point (T.black e)) ≠ 0
  distinct_points : ∀ f, Classical.cross (point (T.faceBlack f 0)) (point (T.faceBlack f 1)) ≠ 0
  distinct_lines : ∀ f, Classical.cross (line (T.faceWhite f 0)) (line (T.faceWhite f 1)) ≠ 0

def PointLineNet.edgeWeight {T : Tiling F E B W} (N : PointLineNet (K := K) T) (e : E) : Kˣ :=
  Units.mk0 (Fomin.dot3 (N.line (T.white e)) (N.point (T.black e))) (N.nonincident e)

def PointLineNet.Coherent {T : Tiling F E B W} (N : PointLineNet (K := K) T) (f : F) : Prop :=
  Classical.Collinear (N.point (T.faceBlack f 0)) (N.point (T.faceBlack f 1))
    (Classical.cross (N.line (T.faceWhite f 0)) (N.line (T.faceWhite f 1)))

theorem PointLineNet.weight_val {T : Tiling F E B W} (N : PointLineNet (K := K) T) (e : E) :
    (N.edgeWeight e : K) = Fomin.dot3 (N.line (T.white e)) (N.point (T.black e)) := rfl

theorem PointLineNet.coherent_iff_weight {T : Tiling F E B W} (N : PointLineNet (K := K) T) (f : F) :
    N.Coherent f ↔ Fomin.faceWeight T.slots N.edgeWeight f = 1 := by
  have rev0 : Fin.rev (0 : Fin 2) = 1 := by decide
  have rev1 : Fin.rev (1 : Fin 2) = 0 := by decide
  have hmA := N.nonincident (T.slots.negative (f,1))
  have hlB := N.nonincident (T.slots.negative (f,0))
  simp only [T.negative_white, T.negative_black, rev0, rev1] at hmA hlB
  have h := fomin_coherence_iff_classical_collinear
    (N.point (T.faceBlack f 0)) (N.point (T.faceBlack f 1))
    (N.line (T.faceWhite f 0)) (N.line (T.faceWhite f 1)) hmA hlB
  have hval : ((Fomin.faceWeight T.slots N.edgeWeight f : Kˣ) : K) =
      Fomin.mixedRatio (N.point (T.faceBlack f 0)) (N.point (T.faceBlack f 1))
        (N.line (T.faceWhite f 0)) (N.line (T.faceWhite f 1)) := by
    simp only [Fomin.faceWeight, Fin.prod_univ_two, Units.val_div_eq_div_val,
      Units.val_mul, PointLineNet.weight_val, T.positive_black, T.positive_white,
      T.negative_black, T.negative_white, rev0, rev1, Fomin.mixedRatio]
    rw [mul_comm (Fomin.dot3 (N.line (T.faceWhite f 0)) (N.point (T.faceBlack f 1)))]
  constructor
  · intro hc
    apply Units.ext
    rw [hval, Units.val_one]
    exact h.mpr hc
  · intro hc
    apply h.mp
    rw [← hval, hc, Units.val_one]

/-- Fomin's geometric implication, not just its scalar cancellation kernel. -/
theorem point_line_surface_last_face [Fintype F] [Fintype E]
    (T : Tiling F E B W) (N : PointLineNet (K := K) T) (missing : F)
    (h : ∀ f, f ≠ missing → N.Coherent f) : N.Coherent missing := by
  apply (N.coherent_iff_weight missing).mpr
  apply Fomin.last_face T.slots N.edgeWeight missing
  intro f hf
  exact (N.coherent_iff_weight f).mp (h f hf)

end IncidenceCubes.Connection.GeometricSurface
