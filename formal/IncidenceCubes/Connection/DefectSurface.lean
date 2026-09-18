import IncidenceCubes.Fomin.Surface
import Mathlib.Algebra.Order.BigOperators.Ring.Finset
import IncidenceCubes.Connection.Determinantal

/-!
# A surface identity retaining determinantal defects

The original surface theorem is the zero-defect case. Here a face may have a
factorized defect ad-bc=u*v. This is the shape of a nonsymmetric minor exchange;
symmetry specializes it to a square. The global theorem follows from the SAME
edge pairing certificate, without assuming that its product is one.

This is a scalar theorem, not an assertion that an arbitrary decorated surface
is realized by projective points, conics, or one matrix of minors. In particular,
it does not supply Penrose's arbitrary-input normalization or a global reduction.
-/
namespace IncidenceCubes.Connection.DefectSurface
open scoped BigOperators
variable {F E K : Type*} [Fintype F] [Fintype E] [Field K]

/-- The two negatively oriented edge values have a nonzero product. -/
def denominator (T : Fomin.ClosedQuadrangulation F E) (w : E → Kˣ) (f : F) : K :=
  (w (T.negative (f, 0)) : K) * (w (T.negative (f, 1)) : K)

/-- The determinant of the four edge values in alternating face order. -/
def defect (T : Fomin.ClosedQuadrangulation F E) (w : E → Kˣ) (f : F) : K :=
  (w (T.positive (f, 0)) : K) * (w (T.positive (f, 1)) : K) - denominator T w f

omit [Fintype F] [Fintype E] in
theorem denominator_ne_zero (T : Fomin.ClosedQuadrangulation F E) (w : E → Kˣ) (f : F) :
    denominator T w f ≠ 0 := mul_ne_zero (Units.ne_zero _) (Units.ne_zero _)

omit [Fintype F] [Fintype E] in
theorem face_ratio (T : Fomin.ClosedQuadrangulation F E) (w : E → Kˣ) (f : F) :
    ((Fomin.faceWeight T w f : Kˣ) : K) = 1 + defect T w f / denominator T w f := by
  simp only [Fomin.faceWeight, Fin.prod_univ_two, Units.val_div_eq_div_val,
    Units.val_mul, defect, denominator]
  exact Determinantal.defect_ratio _ _ _ _ (Units.ne_zero _) (Units.ne_zero _)

/-- A closed surface balances its normalized determinant defects. -/
theorem total_defect_product (T : Fomin.ClosedQuadrangulation F E) (w : E → Kˣ) :
    (∏ f : F, (1 + defect T w f / denominator T w f)) = 1 := by
  have h := congrArg (fun u : Kˣ => (u : K)) (Fomin.total_product T w)
  simp only [Units.coe_prod, Units.val_one] at h
  simpa only [face_ratio] using h

/-- Retain both factors of a local exchange instead of setting its defect zero. -/
theorem factorized_product (T : Fomin.ClosedQuadrangulation F E) (w : E → Kˣ)
    (u v : F → K) (h : ∀ f, defect T w f = u f * v f) :
    (∏ f : F, (1 + u f * v f / denominator T w f)) = 1 := by
  simpa only [h] using total_defect_product T w

theorem symmetric_product (T : Fomin.ClosedQuadrangulation F E) (w : E → Kˣ)
    (u : F → K) (h : ∀ f, defect T w f = u f ^ 2) :
    (∏ f : F, (1 + u f ^ 2 / denominator T w f)) = 1 := by
  simpa only [h] using total_defect_product T w

omit [Fintype F] [Fintype E] in
/-- The zero-defect specialization is exactly multiplicative face coherence. -/
theorem coherent_iff_defect_zero (T : Fomin.ClosedQuadrangulation F E) (w : E → Kˣ)
    (f : F) : Fomin.faceWeight T w f = 1 ↔ defect T w f = 0 := by
  have hn := denominator_ne_zero T w f
  constructor
  · intro h
    have hc := face_ratio T w f
    rw [h, Units.val_one] at hc
    have hz : defect T w f / denominator T w f = 0 := by linear_combination -hc
    exact (div_eq_zero_iff).mp hz |>.resolve_right hn
  · intro h
    apply Units.ext
    simpa [h] using face_ratio T w f

theorem last_defect_zero (T : Fomin.ClosedQuadrangulation F E) (w : E → Kˣ)
    (missing : F) (h : ∀ f, f ≠ missing → defect T w f = 0) :
    defect T w missing = 0 := by
  apply (coherent_iff_defect_zero T w missing).mp
  apply Fomin.last_face T w missing
  intro f hf
  exact (coherent_iff_defect_zero T w f).mpr (h f hf)

/-- Nonsymmetric factorizations have two possible zero-factor branches. -/
theorem last_factor_vanishes (T : Fomin.ClosedQuadrangulation F E) (w : E → Kˣ)
    (u v : F → K) (hf : ∀ f, defect T w f = u f * v f)
    (missing : F) (h : ∀ f, f ≠ missing → defect T w f = 0) :
    u missing = 0 ∨ v missing = 0 := by
  have hz := last_defect_zero T w missing h
  rw [hf] at hz
  exact mul_eq_zero.mp hz

/-- Symmetry identifies the two branches, without a characteristic restriction. -/
theorem last_square_root_zero (T : Fomin.ClosedQuadrangulation F E) (w : E → Kˣ)
    (u : F → K) (hf : ∀ f, defect T w f = u f ^ 2)
    (missing : F) (h : ∀ f, f ≠ missing → defect T w f = 0) :
    u missing = 0 := by
  have hz := last_defect_zero T w missing h
  rw [hf] at hz
  exact sq_eq_zero_iff.mp hz
/-- Obstruction to a naive positive square-defect gluing: every face ratio is
at least one, so a closed product of one forces all square defects to vanish.
Thus nontrivial symmetric data require signs/orientations beyond this ansatz. -/
theorem positive_square_obstruction {R : Type*} [Field R] [LinearOrder R] [IsStrictOrderedRing R]
    (T : Fomin.ClosedQuadrangulation F E) (w : E → Rˣ) (u : F → R)
    (hf : ∀ f, defect T w f = u f ^ 2)
    (hp : ∀ f, 0 < denominator T w f) : ∀ f, u f = 0 := by
  classical
  intro f
  by_contra hu
  have hall : ∀ i, (1 : R) ≤ 1 + u i ^ 2 / denominator T w i := by
    intro i
    have hz := div_nonneg (sq_nonneg (u i)) (hp i).le
    linarith
  have hstrict : (1 : R) < 1 + u f ^ 2 / denominator T w f := by
    have hz := div_pos (sq_pos_of_ne_zero hu) (hp f)
    linarith
  have hprod : (∏ _i : F, (1 : R)) < ∏ i : F, (1 + u i ^ 2 / denominator T w i) :=
    Finset.prod_lt_prod (fun _ _ => zero_lt_one) (fun i _ => hall i)
      ⟨f, Finset.mem_univ f, hstrict⟩
  rw [Finset.prod_const_one, symmetric_product T w u hf] at hprod
  exact (lt_irrefl (1 : R)) hprod
end IncidenceCubes.Connection.DefectSurface
