import Mathlib.Tactic
import Mathlib.LinearAlgebra.Matrix.NonsingularInverse

/-!
# Homogeneous incidence geometry over a commutative field

Points and line covectors are represented by three coordinates. `Collinear`
and `Concurrent` assert an ACTUAL nonzero common covector/vector, not just a
possibly vacuous determinant equation. Statements about projective objects
use nonzero representatives; rescaling lemmas show independence of their choice.
No theorem here assumes a classical incidence theorem as an axiom.
-/
namespace IncidenceCubes.Classical
abbrev Vec (K : Type*) := Fin 3 → K

section Ring
variable {K : Type*} [CommRing K]
def pair (u v : Vec K) : K := u 0 * v 0 + u 1 * v 1 + u 2 * v 2
def cross (u v : Vec K) : Vec K :=
  ![u 1 * v 2 - u 2 * v 1, u 2 * v 0 - u 0 * v 2, u 0 * v 1 - u 1 * v 0]
def bracket (u v w : Vec K) : K := pair (cross u v) w

theorem pair_comm (u v : Vec K) : pair u v = pair v u := by
  unfold pair; ring

theorem cross_left_incident (u v : Vec K) : pair (cross u v) u = 0 := by
  simp [pair, cross]; ring

theorem cross_right_incident (u v : Vec K) : pair (cross u v) v = 0 := by
  simp [pair, cross]; ring

theorem bracket_cyclic (u v w : Vec K) : bracket u v w = bracket v w u := by
  simp [bracket, pair, cross]; ring

theorem bracket_swap (u v w : Vec K) : bracket u w v = -bracket u v w := by
  simp [bracket, pair, cross]; ring

theorem bracket_scale (u v w : Vec K) (a b c : K) :
    bracket (a • u) (b • v) (c • w) = a * b * c * bracket u v w := by
  simp [bracket, pair, cross]; ring

theorem cross_scale (u v : Vec K) (a b : K) :
    cross (a • u) (b • v) = (a * b) • cross u v := by
  funext i; fin_cases i <;> simp [cross] <;> ring

theorem bracket_eq_det (u v w : Vec K) :
    bracket u v w = Matrix.det ![u, v, w] := by
  simp [Matrix.det_fin_three, bracket, pair, cross]; ring
end Ring

section Field
variable {K : Type*} [Field K]
/-- Three point representatives lie on some genuine projective line. -/
def Collinear (u v w : Vec K) : Prop :=
  ∃ l : Vec K, l ≠ 0 ∧ pair l u = 0 ∧ pair l v = 0 ∧ pair l w = 0
/-- Three line covectors contain some genuine projective point. -/
def Concurrent (l m n : Vec K) : Prop :=
  ∃ p : Vec K, p ≠ 0 ∧ pair l p = 0 ∧ pair m p = 0 ∧ pair n p = 0

/-- Determinantal singularity is equivalent to a nonzero kernel vector. -/
theorem det_zero_iff_kernel {n : Type*} [Fintype n] [DecidableEq n]
    (M : Matrix n n K) : M.det = 0 ↔ ∃ v : n → K, v ≠ 0 ∧ M.mulVec v = 0 := by
  constructor
  · intro hd
    have hn : ¬ Function.Injective M.mulVec := by
      intro hi
      have hu := (Matrix.isUnit_iff_isUnit_det M).mp
        (Matrix.mulVec_injective_iff_isUnit.mp hi)
      exact (isUnit_iff_ne_zero.mp hu) hd
    obtain ⟨x, y, hxy, hne⟩ := Function.not_injective_iff.mp hn
    exact ⟨x - y, sub_ne_zero.mpr hne, by rw [Matrix.mulVec_sub, hxy, sub_self]⟩
  · rintro ⟨v, hv, hMv⟩
    by_contra hd
    have hi : Function.Injective M.mulVec := Matrix.mulVec_injective_iff_isUnit.mpr
      ((Matrix.isUnit_iff_isUnit_det M).mpr (isUnit_iff_ne_zero.mpr hd))
    apply hv
    apply hi
    simpa using hMv

theorem collinear_iff_bracket (u v w : Vec K) :
    Collinear u v w ↔ bracket u v w = 0 := by
  rw [bracket_eq_det, det_zero_iff_kernel]
  constructor
  · rintro ⟨l, hl, hu, hv, hw⟩
    refine ⟨l, hl, ?_⟩
    funext i; fin_cases i
    · simpa [Matrix.mulVec, dotProduct, Fin.sum_univ_three, pair, mul_comm] using hu
    · simpa [Matrix.mulVec, dotProduct, Fin.sum_univ_three, pair, mul_comm] using hv
    · simpa [Matrix.mulVec, dotProduct, Fin.sum_univ_three, pair, mul_comm] using hw
  · rintro ⟨l, hl, h⟩
    refine ⟨l, hl, ?_, ?_, ?_⟩
    · simpa [Matrix.mulVec, dotProduct, Fin.sum_univ_three, pair, mul_comm] using congrFun h 0
    · simpa [Matrix.mulVec, dotProduct, Fin.sum_univ_three, pair, mul_comm] using congrFun h 1
    · simpa [Matrix.mulVec, dotProduct, Fin.sum_univ_three, pair, mul_comm] using congrFun h 2

theorem concurrent_iff_collinear (u v w : Vec K) :
    Concurrent u v w ↔ Collinear u v w := by
  simp only [Concurrent, Collinear, pair_comm]

theorem concurrent_iff_bracket (u v w : Vec K) :
    Concurrent u v w ↔ bracket u v w = 0 :=
  (concurrent_iff_collinear u v w).trans (collinear_iff_bracket u v w)

/-- The incidence predicates descend under independent nonzero rescalings. -/
theorem collinear_rescale (u v w : Vec K) (a b c : K)
    (ha : a ≠ 0) (hb : b ≠ 0) (hc : c ≠ 0) :
    Collinear (a • u) (b • v) (c • w) ↔ Collinear u v w := by
  rw [collinear_iff_bracket, collinear_iff_bracket, bracket_scale]
  simp only [mul_eq_zero, ha, hb, hc, false_or]

theorem concurrent_rescale (u v w : Vec K) (a b c : K)
    (ha : a ≠ 0) (hb : b ≠ 0) (hc : c ≠ 0) :
    Concurrent (a • u) (b • v) (c • w) ↔ Concurrent u v w := by
  rw [concurrent_iff_collinear, concurrent_iff_collinear]
  exact collinear_rescale u v w a b c ha hb hc
end Field
end IncidenceCubes.Classical
