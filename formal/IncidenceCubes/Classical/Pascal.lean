import IncidenceCubes.Classical.Basic
import IncidenceCubes.Classical.DetExpansion

/-! Pascal's identity, proved coefficient by coefficient in the first point.
This avoids constructing one enormous normal-form proof for all eighteen
coordinates at once. No external polynomial calculation is trusted. -/
namespace IncidenceCubes.Classical
set_option maxHeartbeats 8000000
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
private def e0 : Vec K := ![1,0,0]
private def e1 : Vec K := ![0,1,0]
private def e2 : Vec K := ![0,0,1]

private theorem expand_left (a b d e : Vec K) :
    pascalX a b d e = a 0 • pascalX e0 b d e + a 1 • pascalX e1 b d e +
      a 2 • pascalX e2 b d e := by
  funext i; fin_cases i <;> simp [pascalX, cross, e0, e1, e2] <;> ring

private theorem expand_right (c d f a : Vec K) :
    pascalX c d f a = a 0 • pascalX c d f e0 + a 1 • pascalX c d f e1 +
      a 2 • pascalX c d f e2 := by
  funext i; fin_cases i <;> simp [pascalX, cross, e0, e1, e2] <;> ring

private theorem quadratic_bracket (x y z u v w h : Vec K) (a b c : K) :
    bracket (a • x + b • y + c • z) h (a • u + b • v + c • w) =
      a ^ 2 * bracket x h u + b ^ 2 * bracket y h v + c ^ 2 * bracket z h w +
      a * b * (bracket x h v + bracket y h u) +
      a * c * (bracket x h w + bracket z h u) +
      b * c * (bracket y h w + bracket z h v) := by
  simp [bracket, pair, cross]; ring

private def cofactor (b c d e f : Vec K) (j : Fin 6) : K :=
  (-1 : K) ^ j.val *
    (Matrix.submatrix
      (![conicRow b, conicRow c, conicRow d, conicRow e, conicRow f] :
        Matrix (Fin 5) (Fin 6) K) id (Fin.succAbove j)).det

private theorem det_row (a b c d e f : Vec K) :
    (conicMatrix a b c d e f).det =
      a 0 ^ 2 * cofactor b c d e f 0 + a 1 ^ 2 * cofactor b c d e f 1 +
      a 2 ^ 2 * cofactor b c d e f 2 + a 0 * a 1 * cofactor b c d e f 3 +
      a 0 * a 2 * cofactor b c d e f 4 + a 1 * a 2 * cofactor b c d e f 5 := by
  have h5 : (![a 0 ^ 2, a 1 ^ 2, a 2 ^ 2, a 0 * a 1, a 0 * a 2, a 1 * a 2] : Fin 6 → K) 5 = a 1 * a 2 := rfl
  have hsub (j : Fin 6) :
      Matrix.submatrix (conicMatrix a b c d e f) Fin.succ (Fin.succAbove j) =
      Matrix.submatrix (![conicRow b, conicRow c, conicRow d, conicRow e, conicRow f] :
        Matrix (Fin 5) (Fin 6) K) id (Fin.succAbove j) := rfl
  rw [Matrix.det_succ_row_zero]
  simp only [Fin.sum_univ_six, hsub]
  simp only [conicMatrix, conicRow, cofactor, Matrix.cons_val_zero, Matrix.cons_val_one,
    Matrix.cons_val_two, Matrix.cons_val_three, Matrix.cons_val_four,
    Matrix.head_cons, Matrix.tail_cons]
  simp only [h5]
  ring

private theorem coefficient_0 (b c d e f : Vec K) :
    bracket (pascalX e0 b d e) (pascalX b c e f) (pascalX c d f e0) = cofactor b c d e f 0 := by
  have hm : Matrix.submatrix
      (![conicRow b, conicRow c, conicRow d, conicRow e, conicRow f] :
        Matrix (Fin 5) (Fin 6) K) id (Fin.succAbove (0 : Fin 6)) =
      (!![b 1 ^ 2,b 2 ^ 2,b 0 * b 1,b 0 * b 2,b 1 * b 2;
        c 1 ^ 2,c 2 ^ 2,c 0 * c 1,c 0 * c 2,c 1 * c 2;
        d 1 ^ 2,d 2 ^ 2,d 0 * d 1,d 0 * d 2,d 1 * d 2;
        e 1 ^ 2,e 2 ^ 2,e 0 * e 1,e 0 * e 2,e 1 * e 2;
        f 1 ^ 2,f 2 ^ 2,f 0 * f 1,f 0 * f 2,f 1 * f 2] : Matrix (Fin 5) (Fin 5) K) := by
    ext i k
    fin_cases i <;> fin_cases k <;> rfl
  unfold cofactor
  have hval : (0 : Fin 6).val = 0 := rfl
  simp only [hval, hm, det_five_scalar]
  simp only [e0, e1, e2, pascalX, bracket, pair, cross, Matrix.of_apply,
    Matrix.cons_val_zero, Matrix.cons_val_one, Matrix.cons_val_two,
    Matrix.cons_val_three, Matrix.cons_val_four, Matrix.head_cons, Matrix.tail_cons]
  ring!

private theorem coefficient_1 (b c d e f : Vec K) :
    bracket (pascalX e1 b d e) (pascalX b c e f) (pascalX c d f e1) = cofactor b c d e f 1 := by
  have hm : Matrix.submatrix
      (![conicRow b, conicRow c, conicRow d, conicRow e, conicRow f] :
        Matrix (Fin 5) (Fin 6) K) id (Fin.succAbove (1 : Fin 6)) =
      (!![b 0 ^ 2,b 2 ^ 2,b 0 * b 1,b 0 * b 2,b 1 * b 2;
        c 0 ^ 2,c 2 ^ 2,c 0 * c 1,c 0 * c 2,c 1 * c 2;
        d 0 ^ 2,d 2 ^ 2,d 0 * d 1,d 0 * d 2,d 1 * d 2;
        e 0 ^ 2,e 2 ^ 2,e 0 * e 1,e 0 * e 2,e 1 * e 2;
        f 0 ^ 2,f 2 ^ 2,f 0 * f 1,f 0 * f 2,f 1 * f 2] : Matrix (Fin 5) (Fin 5) K) := by
    ext i k
    fin_cases i <;> fin_cases k <;> rfl
  unfold cofactor
  have hval : (1 : Fin 6).val = 1 := rfl
  simp only [hval, hm, det_five_scalar]
  simp only [e0, e1, e2, pascalX, bracket, pair, cross, Matrix.of_apply,
    Matrix.cons_val_zero, Matrix.cons_val_one, Matrix.cons_val_two,
    Matrix.cons_val_three, Matrix.cons_val_four, Matrix.head_cons, Matrix.tail_cons]
  ring!

private theorem coefficient_2 (b c d e f : Vec K) :
    bracket (pascalX e2 b d e) (pascalX b c e f) (pascalX c d f e2) = cofactor b c d e f 2 := by
  have hm : Matrix.submatrix
      (![conicRow b, conicRow c, conicRow d, conicRow e, conicRow f] :
        Matrix (Fin 5) (Fin 6) K) id (Fin.succAbove (2 : Fin 6)) =
      (!![b 0 ^ 2,b 1 ^ 2,b 0 * b 1,b 0 * b 2,b 1 * b 2;
        c 0 ^ 2,c 1 ^ 2,c 0 * c 1,c 0 * c 2,c 1 * c 2;
        d 0 ^ 2,d 1 ^ 2,d 0 * d 1,d 0 * d 2,d 1 * d 2;
        e 0 ^ 2,e 1 ^ 2,e 0 * e 1,e 0 * e 2,e 1 * e 2;
        f 0 ^ 2,f 1 ^ 2,f 0 * f 1,f 0 * f 2,f 1 * f 2] : Matrix (Fin 5) (Fin 5) K) := by
    ext i k
    fin_cases i <;> fin_cases k <;> rfl
  unfold cofactor
  have hval : (2 : Fin 6).val = 2 := rfl
  simp only [hval, hm, det_five_scalar]
  simp only [e0, e1, e2, pascalX, bracket, pair, cross, Matrix.of_apply,
    Matrix.cons_val_zero, Matrix.cons_val_one, Matrix.cons_val_two,
    Matrix.cons_val_three, Matrix.cons_val_four, Matrix.head_cons, Matrix.tail_cons]
  ring!

private theorem coefficient_3 (b c d e f : Vec K) :
    bracket (pascalX e0 b d e) (pascalX b c e f) (pascalX c d f e1) + bracket (pascalX e1 b d e) (pascalX b c e f) (pascalX c d f e0) = cofactor b c d e f 3 := by
  have hm : Matrix.submatrix
      (![conicRow b, conicRow c, conicRow d, conicRow e, conicRow f] :
        Matrix (Fin 5) (Fin 6) K) id (Fin.succAbove (3 : Fin 6)) =
      (!![b 0 ^ 2,b 1 ^ 2,b 2 ^ 2,b 0 * b 2,b 1 * b 2;
        c 0 ^ 2,c 1 ^ 2,c 2 ^ 2,c 0 * c 2,c 1 * c 2;
        d 0 ^ 2,d 1 ^ 2,d 2 ^ 2,d 0 * d 2,d 1 * d 2;
        e 0 ^ 2,e 1 ^ 2,e 2 ^ 2,e 0 * e 2,e 1 * e 2;
        f 0 ^ 2,f 1 ^ 2,f 2 ^ 2,f 0 * f 2,f 1 * f 2] : Matrix (Fin 5) (Fin 5) K) := by
    ext i k
    fin_cases i <;> fin_cases k <;> rfl
  unfold cofactor
  have hval : (3 : Fin 6).val = 3 := rfl
  simp only [hval, hm, det_five_scalar]
  simp only [e0, e1, e2, pascalX, bracket, pair, cross, Matrix.of_apply,
    Matrix.cons_val_zero, Matrix.cons_val_one, Matrix.cons_val_two,
    Matrix.cons_val_three, Matrix.cons_val_four, Matrix.head_cons, Matrix.tail_cons]
  ring!

private theorem coefficient_4 (b c d e f : Vec K) :
    bracket (pascalX e0 b d e) (pascalX b c e f) (pascalX c d f e2) + bracket (pascalX e2 b d e) (pascalX b c e f) (pascalX c d f e0) = cofactor b c d e f 4 := by
  have hm : Matrix.submatrix
      (![conicRow b, conicRow c, conicRow d, conicRow e, conicRow f] :
        Matrix (Fin 5) (Fin 6) K) id (Fin.succAbove (4 : Fin 6)) =
      (!![b 0 ^ 2,b 1 ^ 2,b 2 ^ 2,b 0 * b 1,b 1 * b 2;
        c 0 ^ 2,c 1 ^ 2,c 2 ^ 2,c 0 * c 1,c 1 * c 2;
        d 0 ^ 2,d 1 ^ 2,d 2 ^ 2,d 0 * d 1,d 1 * d 2;
        e 0 ^ 2,e 1 ^ 2,e 2 ^ 2,e 0 * e 1,e 1 * e 2;
        f 0 ^ 2,f 1 ^ 2,f 2 ^ 2,f 0 * f 1,f 1 * f 2] : Matrix (Fin 5) (Fin 5) K) := by
    ext i k
    fin_cases i <;> fin_cases k <;> rfl
  unfold cofactor
  have hval : (4 : Fin 6).val = 4 := rfl
  simp only [hval, hm, det_five_scalar]
  simp only [e0, e1, e2, pascalX, bracket, pair, cross, Matrix.of_apply,
    Matrix.cons_val_zero, Matrix.cons_val_one, Matrix.cons_val_two,
    Matrix.cons_val_three, Matrix.cons_val_four, Matrix.head_cons, Matrix.tail_cons]
  ring!

private theorem coefficient_5 (b c d e f : Vec K) :
    bracket (pascalX e1 b d e) (pascalX b c e f) (pascalX c d f e2) + bracket (pascalX e2 b d e) (pascalX b c e f) (pascalX c d f e1) = cofactor b c d e f 5 := by
  have hm : Matrix.submatrix
      (![conicRow b, conicRow c, conicRow d, conicRow e, conicRow f] :
        Matrix (Fin 5) (Fin 6) K) id (Fin.succAbove (5 : Fin 6)) =
      (!![b 0 ^ 2,b 1 ^ 2,b 2 ^ 2,b 0 * b 1,b 0 * b 2;
        c 0 ^ 2,c 1 ^ 2,c 2 ^ 2,c 0 * c 1,c 0 * c 2;
        d 0 ^ 2,d 1 ^ 2,d 2 ^ 2,d 0 * d 1,d 0 * d 2;
        e 0 ^ 2,e 1 ^ 2,e 2 ^ 2,e 0 * e 1,e 0 * e 2;
        f 0 ^ 2,f 1 ^ 2,f 2 ^ 2,f 0 * f 1,f 0 * f 2] : Matrix (Fin 5) (Fin 5) K) := by
    ext i k
    fin_cases i <;> fin_cases k <;> rfl
  unfold cofactor
  have hval : (5 : Fin 6).val = 5 := rfl
  simp only [hval, hm, det_five_scalar]
  simp only [e0, e1, e2, pascalX, bracket, pair, cross, Matrix.of_apply,
    Matrix.cons_val_zero, Matrix.cons_val_one, Matrix.cons_val_two,
    Matrix.cons_val_three, Matrix.cons_val_four, Matrix.head_cons, Matrix.tail_cons]
  ring!

/-- Pascal's bracket is exactly the six-point conic determinant. -/
theorem pascal_identity (a b c d e f : Vec K) :
    bracket (pascalX a b d e) (pascalX b c e f) (pascalX c d f a) =
      (conicMatrix a b c d e f).det := by
  conv_lhs =>
    rw [expand_left a b d e, expand_right c d f a, quadratic_bracket,
      coefficient_0, coefficient_1, coefficient_2, coefficient_3, coefficient_4, coefficient_5]
  rw [det_row]
end Ring
end IncidenceCubes.Classical
