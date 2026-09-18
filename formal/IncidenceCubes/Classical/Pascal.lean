import IncidenceCubes.Classical.Basic
import IncidenceCubes.Classical.DetExpansion

/-!
# Pascal and the conic-determinant criterion

A conic is a nonzero coefficient vector for x²,y²,z²,xy,xz,yz.
The identity is for arbitrary six coordinate vectors, without a parametrization,
nonsingularity hypothesis, or selected conic. Geometric consequences are in
Conics.lean. The abstract determinant is expanded first to avoid repeated
normalization of deeply nested Fin submatrices.
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

/-- Pascal's bracket is exactly the six-point conic determinant. -/
theorem pascal_identity (a b c d e f : Vec K) :
    bracket (pascalX a b d e) (pascalX b c e f) (pascalX c d f a) =
      (conicMatrix a b c d e f).det := by
  rw [det_six_scalar]
  dsimp [conicMatrix, conicRow, pascalX, bracket, pair, cross]
  ring
end Ring
end IncidenceCubes.Classical
