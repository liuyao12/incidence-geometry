import IncidenceCubes.Classical.Basic

/-!
# Pascal and the conic-determinant criterion

A conic is a nonzero coefficient vector for x²,y²,z²,xy,xz,yz.
The input consists of arbitrary six coordinate vectors annihilated by that
quadratic form: no parametrization, nonsingularity, or chosen conic is built in.
The determinant identity also supplies the converse (existence of a nonzero
conic equation), including reducible conics and hence Pappus specializations.
-/
namespace IncidenceCubes.Classical
set_option maxHeartbeats 16000000
set_option maxRecDepth 10000
section Ring
variable {K : Type*} [CommRing K]
def conicRow (p : Vec K) : Fin 6 → K :=
  ![p 0 ^ 2, p 1 ^ 2, p 2 ^ 2, p 0 * p 1, p 0 * p 2, p 1 * p 2]
def conicMatrix (a b c d e f : Vec K) : Matrix (Fin 6) (Fin 6) K :=
  ![conicRow a, conicRow b, conicRow c, conicRow d, conicRow e, conicRow f]
def conicEval (q : Fin 6 → K) (p : Vec K) : K :=
  q 0 * p 0 ^ 2 + q 1 * p 1 ^ 2 + q 2 * p 2 ^ 2 +
  q 3 * p 0 * p 1 + q 4 * p 0 * p 2 + q 5 * p 1 * p 2

def pascalX (a b d e : Vec K) : Vec K := cross (cross a b) (cross d e)

private theorem det_four (M : Matrix (Fin 4) (Fin 4) K) :
    M.det =
      (-1 : K) ^ 0 * M 0 0 * (M.submatrix Fin.succ (Fin.succAbove (0 : Fin 4))).det +
      (-1 : K) ^ 1 * M 0 1 * (M.submatrix Fin.succ (Fin.succAbove (1 : Fin 4))).det +
      (-1 : K) ^ 2 * M 0 2 * (M.submatrix Fin.succ (Fin.succAbove (2 : Fin 4))).det +
      (-1 : K) ^ 3 * M 0 3 * (M.submatrix Fin.succ (Fin.succAbove (3 : Fin 4))).det := by
  rw [Matrix.det_succ_row_zero]
  simp only [Fin.sum_univ_four]
  rfl

private theorem det_five (M : Matrix (Fin 5) (Fin 5) K) :
    M.det =
      (-1 : K) ^ 0 * M 0 0 * (M.submatrix Fin.succ (Fin.succAbove (0 : Fin 5))).det +
      (-1 : K) ^ 1 * M 0 1 * (M.submatrix Fin.succ (Fin.succAbove (1 : Fin 5))).det +
      (-1 : K) ^ 2 * M 0 2 * (M.submatrix Fin.succ (Fin.succAbove (2 : Fin 5))).det +
      (-1 : K) ^ 3 * M 0 3 * (M.submatrix Fin.succ (Fin.succAbove (3 : Fin 5))).det +
      (-1 : K) ^ 4 * M 0 4 * (M.submatrix Fin.succ (Fin.succAbove (4 : Fin 5))).det := by
  rw [Matrix.det_succ_row_zero]
  simp only [Fin.sum_univ_five]
  rfl

private theorem det_six (M : Matrix (Fin 6) (Fin 6) K) :
    M.det =
      (-1 : K) ^ 0 * M 0 0 * (M.submatrix Fin.succ (Fin.succAbove (0 : Fin 6))).det +
      (-1 : K) ^ 1 * M 0 1 * (M.submatrix Fin.succ (Fin.succAbove (1 : Fin 6))).det +
      (-1 : K) ^ 2 * M 0 2 * (M.submatrix Fin.succ (Fin.succAbove (2 : Fin 6))).det +
      (-1 : K) ^ 3 * M 0 3 * (M.submatrix Fin.succ (Fin.succAbove (3 : Fin 6))).det +
      (-1 : K) ^ 4 * M 0 4 * (M.submatrix Fin.succ (Fin.succAbove (4 : Fin 6))).det +
      (-1 : K) ^ 5 * M 0 5 * (M.submatrix Fin.succ (Fin.succAbove (5 : Fin 6))).det := by
  rw [Matrix.det_succ_row_zero]
  simp only [Fin.sum_univ_six]
  rfl

/-- Pascal's bracket is exactly the six-point conic determinant. -/
theorem pascal_identity (a b c d e f : Vec K) :
    bracket (pascalX a b d e) (pascalX b c e f) (pascalX c d f a) =
      (conicMatrix a b c d e f).det := by
  norm_num [conicMatrix, conicRow, det_six, det_five, det_four, Matrix.det_fin_three,
     Matrix.submatrix, pascalX, bracket, pair, cross]
  ring
end Ring
end IncidenceCubes.Classical
