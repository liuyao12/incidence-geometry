import IncidenceCubes.Classical.Basic

/-! Coordinate polarity, kept separate from the combinatorial conic theorem.
For a symmetric invertible matrix S in characteristic different from two,
`S.mulVec x` represents the tangent covector at a nonzero point x on xᵀSx=0.
This file proves the necessary nonvanishing and dual-quadratic statements. -/
namespace IncidenceCubes.Classical
variable {K : Type*} [Field K]
abbrev Mat3 (K : Type*) := Matrix (Fin 3) (Fin 3) K

def matrixQuad (S : Mat3 K) (x : Vec K) : K := pair (S.mulVec x) x

def matrixCoefficients (S : Mat3 K) : Fin 6 → K :=
  ![S 0 0, S 1 1, S 2 2, S 0 1 + S 1 0, S 0 2 + S 2 0, S 1 2 + S 2 1]

theorem inverse_polar (S : Mat3 K) (x : Vec K) (hS : S.det ≠ 0) :
    S⁻¹.mulVec (S.mulVec x) = x := by
  rw [Matrix.mulVec_mulVec, Matrix.nonsing_inv_mul S (isUnit_iff_ne_zero.mpr hS),
    Matrix.one_mulVec]

theorem polar_ne_zero (S : Mat3 K) (x : Vec K) (hS : S.det ≠ 0) (hx : x ≠ 0) :
    S.mulVec x ≠ 0 := by
  intro h
  have hc := inverse_polar S x hS
  rw [h, Matrix.mulVec_zero] at hc
  exact hx hc.symm

theorem polar_on_dual_quadric (S : Mat3 K) (x : Vec K) (hS : S.det ≠ 0)
    (hx : matrixQuad S x = 0) : matrixQuad S⁻¹ (S.mulVec x) = 0 := by
  unfold matrixQuad at *
  rw [inverse_polar S x hS, pair_comm]
  exact hx

theorem inverse_symmetric (S : Mat3 K) (hS : ∀ i j, S i j = S j i) :
    ∀ i j, S⁻¹ i j = S⁻¹ j i := by
  have ht : S.transpose = S := by
    funext i j
    exact hS j i
  have hi : (S⁻¹).transpose = S⁻¹ := by
    rw [Matrix.transpose_nonsing_inv, ht]
  intro i j
  exact congrFun (congrFun hi j) i

theorem matrixCoefficients_ne_zero (S : Mat3 K)
    (hS : ∀ i j, S i j = S j i) (hdet : S.det ≠ 0) (h2 : (2 : K) ≠ 0) :
    matrixCoefficients S ≠ 0 := by
  intro hz
  have h00 : S 0 0 = 0 := by simpa [matrixCoefficients] using congrFun hz 0
  have h11 : S 1 1 = 0 := by simpa [matrixCoefficients] using congrFun hz 1
  have h22 : S 2 2 = 0 := by simpa [matrixCoefficients] using congrFun hz 2
  have off (i j : Fin 3) (h : S i j + S j i = 0) : S i j = 0 := by
    rw [← hS i j] at h
    have hh : (2 : K) * S i j = 0 := by calc
      2 * S i j = S i j + S i j := by ring
      _ = 0 := h
    exact (mul_eq_zero.mp hh).resolve_left h2
  have h01 : S 0 1 = 0 := off 0 1 (by simpa [matrixCoefficients] using congrFun hz 3)
  have h02 : S 0 2 = 0 := off 0 2 (by simpa [matrixCoefficients] using congrFun hz 4)
  have h12 : S 1 2 = 0 := off 1 2 (by simpa [matrixCoefficients] using congrFun hz 5)
  have h10 := hS 1 0
  have h20 := hS 2 0
  have h21 := hS 2 1
  have hzero : S = 0 := by
    funext i j
    fin_cases i <;> fin_cases j <;>
      first | exact h00 | exact h11 | exact h22 | exact h01 | exact h02 | exact h12 |
        exact h10.trans h01 | exact h20.trans h02 | exact h21.trans h12
  exact hdet (by simp [hzero])

theorem inverse_det_ne_zero (S : Mat3 K) (hS : S.det ≠ 0) : S⁻¹.det ≠ 0 := by
  intro h
  have hc := Matrix.det_nonsing_inv_mul_det S (isUnit_iff_ne_zero.mpr hS)
  rw [h, zero_mul] at hc
  exact zero_ne_one hc

/-- The first-order term is the polar covector. Together with `polar_ne_zero`,
this identifies the genuine tangent line in characteristic different from two. -/
theorem polar_tangent_expansion (S : Mat3 K) (x y : Vec K) (t : K)
    (hS : ∀ i j, S i j = S j i) :
    matrixQuad S (x + t • y) = matrixQuad S x +
      2 * t * pair (S.mulVec x) y + t ^ 2 * matrixQuad S y := by
  simp [matrixQuad, pair, Matrix.mulVec, dotProduct, Fin.sum_univ_three]
  rw [hS 1 0, hS 2 0, hS 2 1]
  ring

end IncidenceCubes.Classical
