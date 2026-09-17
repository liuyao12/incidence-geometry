import IncidenceCubes.Classical.Pascal

/-!
# Geometric consequences of Pascal's identity

Statements use arbitrary homogeneous coordinates and an arbitrary nonzero
conic equation. In particular, the conic is not assumed to come from a rational
parametrization or to be nonsingular. The dual theorem is explicitly about six
covectors on a conic in the dual plane; identifying that dual conic with the
ordinary tangent locus requires a separate polarity theorem.
-/
namespace IncidenceCubes.Classical
variable {K : Type*} [Field K]

/-- Six representatives satisfy one nonzero homogeneous quadratic equation. -/
def OnCommonConic (a b c d e f : Vec K) : Prop :=
  ∃ q : Fin 6 → K, q ≠ 0 ∧ conicEval q a = 0 ∧ conicEval q b = 0 ∧
    conicEval q c = 0 ∧ conicEval q d = 0 ∧ conicEval q e = 0 ∧ conicEval q f = 0

theorem onCommonConic_iff_det (a b c d e f : Vec K) :
    OnCommonConic a b c d e f ↔ (conicMatrix a b c d e f).det = 0 := by
  rw [det_zero_iff_kernel]
  constructor
  · rintro ⟨q, hq, ha, hb, hc, hd, he, hf⟩
    refine ⟨q, hq, ?_⟩
    funext i; fin_cases i
    · simpa [conicMatrix, conicRow, conicEval, Matrix.mulVec, dotProduct,
        Fin.sum_univ_six, mul_comm, mul_left_comm, mul_assoc] using ha
    · simpa [conicMatrix, conicRow, conicEval, Matrix.mulVec, dotProduct,
        Fin.sum_univ_six, mul_comm, mul_left_comm, mul_assoc] using hb
    · simpa [conicMatrix, conicRow, conicEval, Matrix.mulVec, dotProduct,
        Fin.sum_univ_six, mul_comm, mul_left_comm, mul_assoc] using hc
    · simpa [conicMatrix, conicRow, conicEval, Matrix.mulVec, dotProduct,
        Fin.sum_univ_six, mul_comm, mul_left_comm, mul_assoc] using hd
    · simpa [conicMatrix, conicRow, conicEval, Matrix.mulVec, dotProduct,
        Fin.sum_univ_six, mul_comm, mul_left_comm, mul_assoc] using he
    · simpa [conicMatrix, conicRow, conicEval, Matrix.mulVec, dotProduct,
        Fin.sum_univ_six, mul_comm, mul_left_comm, mul_assoc] using hf
  · rintro ⟨q, hq, h⟩
    refine ⟨q, hq, ?_, ?_, ?_, ?_, ?_, ?_⟩
    · simpa [conicMatrix, conicRow, conicEval, Matrix.mulVec, dotProduct,
        Fin.sum_univ_six, mul_comm, mul_left_comm, mul_assoc] using congrFun h 0
    · simpa [conicMatrix, conicRow, conicEval, Matrix.mulVec, dotProduct,
        Fin.sum_univ_six, mul_comm, mul_left_comm, mul_assoc] using congrFun h 1
    · simpa [conicMatrix, conicRow, conicEval, Matrix.mulVec, dotProduct,
        Fin.sum_univ_six, mul_comm, mul_left_comm, mul_assoc] using congrFun h 2
    · simpa [conicMatrix, conicRow, conicEval, Matrix.mulVec, dotProduct,
        Fin.sum_univ_six, mul_comm, mul_left_comm, mul_assoc] using congrFun h 3
    · simpa [conicMatrix, conicRow, conicEval, Matrix.mulVec, dotProduct,
        Fin.sum_univ_six, mul_comm, mul_left_comm, mul_assoc] using congrFun h 4
    · simpa [conicMatrix, conicRow, conicEval, Matrix.mulVec, dotProduct,
        Fin.sum_univ_six, mul_comm, mul_left_comm, mul_assoc] using congrFun h 5

/-- Pascal for an arbitrary conic equation, including reducible conics. -/
theorem pascal (a b c d e f : Vec K) (h : OnCommonConic a b c d e f) :
    Collinear (pascalX a b d e) (pascalX b c e f) (pascalX c d f a) := by
  rw [collinear_iff_bracket, pascal_identity]
  exact (onCommonConic_iff_det a b c d e f).mp h

/-- The converse is the existence of a nonzero conic equation (not necessarily
smooth). No assertion of conic uniqueness is hidden in this equivalence. -/
theorem braikenridge_maclaurin_iff (a b c d e f : Vec K) :
    Collinear (pascalX a b d e) (pascalX b c e f) (pascalX c d f a) ↔
      OnCommonConic a b c d e f := by
  rw [collinear_iff_bracket, pascal_identity, onCommonConic_iff_det]

/-- Dual Pascal, i.e. the dual-conic formulation of Brianchon.
Here a,...,f are line COVECTORS; pascalX then joins opposite polygon vertices. -/
theorem brianchon_dual_conic (a b c d e f : Vec K)
    (h : OnCommonConic a b c d e f) :
    Concurrent (pascalX a b d e) (pascalX b c e f) (pascalX c d f a) := by
  rw [concurrent_iff_collinear]
  exact pascal a b c d e f h

/-- Admissible Pascal data have actual nonzero constructed intersection points.
The six input representatives and the relevant joins must then also be nonzero. -/
structure PascalInput (K : Type*) [Field K] where
  a b c d e f : Vec K
  onConic : OnCommonConic a b c d e f
  first_ne : pascalX a b d e ≠ 0
  second_ne : pascalX b c e f ≠ 0
  third_ne : pascalX c d f a ≠ 0

/-- The conclusion is a genuine projective line containing all three genuine
intersection points, not merely a zero determinant. -/
theorem PascalInput.conclusion (P : PascalInput K) :
    ∃ l : Vec K, l ≠ 0 ∧
      (pascalX P.a P.b P.d P.e ≠ 0 ∧ pair l (pascalX P.a P.b P.d P.e) = 0) ∧
      (pascalX P.b P.c P.e P.f ≠ 0 ∧ pair l (pascalX P.b P.c P.e P.f) = 0) ∧
      (pascalX P.c P.d P.f P.a ≠ 0 ∧ pair l (pascalX P.c P.d P.f P.a) = 0) := by
  obtain ⟨l, hl, h1, h2, h3⟩ := pascal P.a P.b P.c P.d P.e P.f P.onConic
  exact ⟨l, hl, ⟨P.first_ne, h1⟩, ⟨P.second_ne, h2⟩, ⟨P.third_ne, h3⟩⟩

end IncidenceCubes.Classical
