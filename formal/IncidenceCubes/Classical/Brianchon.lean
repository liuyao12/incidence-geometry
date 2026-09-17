import IncidenceCubes.Classical.Conics
import IncidenceCubes.Classical.Polarity

/-! Brianchon for the actual polar tangent lines of a nonsingular symmetric
conic matrix, not merely for an unspecified dual-conic parametrization. -/
namespace IncidenceCubes.Classical
variable {K : Type*} [Field K]

theorem conicEval_matrixCoefficients (S : Mat3 K) (x : Vec K) :
    conicEval (matrixCoefficients S) x = matrixQuad S x := by
  simp [conicEval, matrixCoefficients, matrixQuad, pair,
    Matrix.mulVec, dotProduct, Fin.sum_univ_three]
  ring

/-- The polars of arbitrary points on a nonsingular conic lie on the dual
conic represented by the inverse symmetric matrix. -/
theorem polars_on_common_conic (S : Mat3 K) (a b c d e f : Vec K)
    (hS : ∀ i j, S i j = S j i) (hdet : S.det ≠ 0) (h2 : (2 : K) ≠ 0)
    (ha : matrixQuad S a = 0) (hb : matrixQuad S b = 0)
    (hc : matrixQuad S c = 0) (hd : matrixQuad S d = 0)
    (he : matrixQuad S e = 0) (hf : matrixQuad S f = 0) :
    OnCommonConic (S.mulVec a) (S.mulVec b) (S.mulVec c)
      (S.mulVec d) (S.mulVec e) (S.mulVec f) := by
  refine ⟨matrixCoefficients S⁻¹,
    matrixCoefficients_ne_zero S⁻¹ (inverse_symmetric S hS)
      (inverse_det_ne_zero S hdet) h2, ?_, ?_, ?_, ?_, ?_, ?_⟩
  · rw [conicEval_matrixCoefficients]; exact polar_on_dual_quadric S a hdet ha
  · rw [conicEval_matrixCoefficients]; exact polar_on_dual_quadric S b hdet hb
  · rw [conicEval_matrixCoefficients]; exact polar_on_dual_quadric S c hdet hc
  · rw [conicEval_matrixCoefficients]; exact polar_on_dual_quadric S d hdet hd
  · rw [conicEval_matrixCoefficients]; exact polar_on_dual_quadric S e hdet he
  · rw [conicEval_matrixCoefficients]; exact polar_on_dual_quadric S f hdet hf

/-- Brianchon: the three diagonals of the hexagon formed by six polar tangents
are concurrent. Input points must be nonzero to call their polars tangents;
nonzero diagonal checks exclude collapsed polygon constructions. -/
theorem brianchon (S : Mat3 K) (a b c d e f : Vec K)
    (hS : ∀ i j, S i j = S j i) (hdet : S.det ≠ 0) (h2 : (2 : K) ≠ 0)
    (ha : matrixQuad S a = 0) (hb : matrixQuad S b = 0)
    (hc : matrixQuad S c = 0) (hd : matrixQuad S d = 0)
    (he : matrixQuad S e = 0) (hf : matrixQuad S f = 0) :
    Concurrent
      (pascalX (S.mulVec a) (S.mulVec b) (S.mulVec d) (S.mulVec e))
      (pascalX (S.mulVec b) (S.mulVec c) (S.mulVec e) (S.mulVec f))
      (pascalX (S.mulVec c) (S.mulVec d) (S.mulVec f) (S.mulVec a)) :=
  brianchon_dual_conic _ _ _ _ _ _
    (polars_on_common_conic S a b c d e f hS hdet h2 ha hb hc hd he hf)

end IncidenceCubes.Classical
