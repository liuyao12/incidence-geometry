import IncidenceCubes.Classical.Basic

/-! Homogeneous Menelaus and Ceva. Coefficients are projective ratios; no
ordering, division by a possibly zero coefficient, or affine chart is needed. -/
namespace IncidenceCubes.Classical
section Ring
variable {K : Type*} [CommRing K]

/-- Points on BC, CA and AB, respectively. -/
def sidePoint (B C : Vec K) (a b : K) : Vec K := a • B + b • C

theorem menelaus_identity (A B C : Vec K) (a b c d e f : K) :
    bracket (sidePoint B C a b) (sidePoint C A c d) (sidePoint A B e f) =
      (a * c * e + b * d * f) * bracket A B C := by
  simp [sidePoint, bracket, pair, cross]; ring

theorem ceva_identity (A B C : Vec K) (a b c d e f : K) :
    bracket (cross A (sidePoint B C a b)) (cross B (sidePoint C A c d))
      (cross C (sidePoint A B e f)) =
      (a * c * e - b * d * f) * bracket A B C ^ 2 := by
  simp [sidePoint, bracket, pair, cross]; ring
end Ring

section Field
variable {K : Type*} [Field K]
/-- Menelaus in projective-ratio form, including ideal side points. -/
theorem menelaus_iff (A B C : Vec K) (a b c d e f : K)
    (hABC : ¬ Collinear A B C) :
    Collinear (sidePoint B C a b) (sidePoint C A c d) (sidePoint A B e f) ↔
      a * c * e + b * d * f = 0 := by
  have hn : bracket A B C ≠ 0 := by simpa [collinear_iff_bracket] using hABC
  rw [collinear_iff_bracket, menelaus_identity]
  simp [hn]

/-- Ceva in projective-ratio form. For projective side points, each coefficient
pair must additionally be nonzero; the polynomial criterion remains true in
algebraically degenerate cases as well. -/
theorem ceva_iff (A B C : Vec K) (a b c d e f : K)
    (hABC : ¬ Collinear A B C) :
    Concurrent (cross A (sidePoint B C a b)) (cross B (sidePoint C A c d))
      (cross C (sidePoint A B e f)) ↔ a * c * e = b * d * f := by
  have hn : bracket A B C ≠ 0 := by simpa [collinear_iff_bracket] using hABC
  rw [concurrent_iff_bracket, ceva_identity]
  simp [hn, sub_eq_zero]
end Field
end IncidenceCubes.Classical
