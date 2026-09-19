import IncidenceCubes.Penrose.Seven

/-! Geometric completion from arbitrary seven-conic data in the regular
parameter chart. All new chords are nonzero and the new face incidences use
the ORIGINAL input chord witnesses, not replacements silently assumed equal. -/
namespace IncidenceCubes.Penrose.Completion
open Normalization Geometry GeometricSeven
variable {K : Type*} [Field K]

def middleChord (p r : Vec K) (d a : K) : Vec K := d • r - a • p

def lastChord (p r s : Vec K) (d e a b c : K) : Vec K :=
  D2 d e a • s - (e*b-a*c) • p - (d*c-a*b) • r

def triple (Q : Form K) (p r s : Vec K) (d e f a b c : K) : Form K :=
  D3 d e f a b c • Q - (e*f-c^2) • square p - (d*f-b^2) • square r -
    (d*e-a^2) • square s - (b*c-a*f) • mixed p r -
    (a*c-e*b) • mixed p s - (a*b-d*c) • mixed r s

theorem middle_identity (Q : Form K) (p r : Vec K) (d e a : K) (hd : d ≠ 0) :
    double Q p r d e a = D2 d e a • single Q p d + (-1/d) • square (middleChord p r d a) := by
  ext i j
  simp [double,single,square,mixed,middleChord,D2]
  field_simp
  ring

theorem double_swap (Q : Form K) (p r : Vec K) (d e a : K) :
    double Q p r d e a = double Q r p e d a := by
  ext i j; simp [double,square,mixed,D2]; ring

theorem triple_identity (Q : Form K) (p r s : Vec K) (d e f a b c : K) :
    D3 d e f a b c • double Q p r d e a -
      D2 d e a • triple Q p r s d e f a b c = square (lastChord p r s d e a b c) := by
  ext i j
  simp [triple,double,lastChord,D2,D3,square,mixed]
  ring

def matrix (d a : Vec K) : Form K :=
  !![d 0,a 0,a 1; a 0,d 1,a 2; a 1,a 2,d 2]

def fullDet (d a : Vec K) : K := D3 (d 0) (d 1) (d 2) (a 0) (a 1) (a 2)

def result (S : Seven K) (N : NormalForm S) : Form K :=
  triple S.base (S.chord 0) (S.chord 1) (S.chord 2)
    (N.diagonal 0) (N.diagonal 1) (N.diagonal 2) (N.coupling 0) (N.coupling 1) (N.coupling 2)

def topChord (S : Seven K) (N : NormalForm S) (f : Fin 3) : Vec K :=
  let i := leftIndex f
  let j := rightIndex f
  let k := otherIndex f
  let M := matrix N.diagonal N.coupling
  lastChord (S.chord i) (S.chord j) (S.chord k)
    (N.diagonal i) (N.diagonal j) (N.coupling f) (M i k) (M j k)

/-- The three missing edge equations share one eighth MATRIX, not merely a
pointwise scalar witness. -/
theorem all_top_identities (S : Seven K) (N : NormalForm S) (f : Fin 3) :
    fullDet N.diagonal N.coupling •
      double S.base (S.chord (leftIndex f)) (S.chord (rightIndex f))
        (N.diagonal (leftIndex f)) (N.diagonal (rightIndex f)) (N.coupling f) -
      D2 (N.diagonal (leftIndex f)) (N.diagonal (rightIndex f)) (N.coupling f) • result S N =
        square (topChord S N f) := by
  fin_cases f <;> ext i j <;>
    simp [fullDet,double,result,triple,topChord,lastChord,matrix,leftIndex,rightIndex,otherIndex,
      square,mixed,D2,D3] <;> ring

omit [Field K] in
theorem matrix_diagonal (d a : Vec K) (i : Fin 3) : matrix d a i i = d i := by
  fin_cases i <;> rfl

omit [Field K] in
theorem matrix_symmetric (d a : Vec K) (i j : Fin 3) : matrix d a i j = matrix d a j i := by
  fin_cases i <;> fin_cases j <;> rfl

omit [Field K] in
theorem matrix_edge (d a : Vec K) (f : Fin 3) : matrix d a (leftIndex f) (rightIndex f) = a f := by
  fin_cases f <;> rfl

theorem pairing_row (L : Form K) (x : Vec K) (i : Fin 3) : pairing (L i) x = L.mulVec x i := by
  simp [pairing,Matrix.mulVec,dotProduct,Fin.sum_univ_three]

theorem pairing_middle (p r x : Vec K) (d a : K) :
    pairing (middleChord p r d a) x = d*pairing r x-a*pairing p x := by
  simp [pairing,middleChord]; ring

theorem pairing_last (p r s x : Vec K) (d e a b c : K) :
    pairing (lastChord p r s d e a b c) x =
      D2 d e a * pairing s x-(e*b-a*c)*pairing p x-(d*c-a*b)*pairing r x := by
  simp [pairing,lastChord]; ring

private theorem frame_pair (S : Seven K) (x : Vec K) (i : Fin 3) :
    pairing (S.chord i) (Matrix.mulVec ((S.chord : Form K)⁻¹) x) = x i := by
  rw [pairing_row,Matrix.mulVec_mulVec,Matrix.mul_nonsing_inv _ (isUnit_iff_ne_zero.mpr S.independent),Matrix.one_mulVec]

theorem middleChord_ne (S : Seven K) (i j : Fin 3) (hij : i ≠ j) (d a : K) (hd : d ≠ 0) :
    middleChord (S.chord i) (S.chord j) d a ≠ 0 := by
  intro h
  have hv := congrArg (fun l => pairing l (Matrix.mulVec ((S.chord : Form K)⁻¹) (axis j))) h
  simp only [pairing_middle,frame_pair] at hv
  simp [axis,hij,pairing] at hv
  exact hd hv

theorem topChord_ne (S : Seven K) (N : NormalForm S) (f : Fin 3) : topChord S N f ≠ 0 := by
  intro hz
  have hv := congrArg (fun l => pairing l (Matrix.mulVec ((S.chord : Form K)⁻¹) (axis (otherIndex f)))) hz
  have hi : leftIndex f ≠ otherIndex f := by fin_cases f <;> decide
  have hj : rightIndex f ≠ otherIndex f := by fin_cases f <;> decide
  simp only [topChord,pairing_last,frame_pair] at hv
  simp [axis,hi,hj,pairing] at hv
  exact N.minor_ne f hv

theorem top_contact (S : Seven K) (N : NormalForm S)
    (hD : fullDet N.diagonal N.coupling ≠ 0) (f : Fin 3) :
    Contact (S.second f) (result S N) (topChord S N f) := by
  let D := D2 (N.diagonal (leftIndex f)) (N.diagonal (rightIndex f)) (N.coupling f)
  have hn : D ≠ 0 := N.minor_ne f
  have hs := N.secondScale_ne f
  refine ⟨topChord_ne S N f,fullDet N.diagonal N.coupling / (D*N.secondScale f),
    -1/D,div_ne_zero hD (mul_ne_zero hn hs),div_ne_zero (neg_ne_zero.mpr one_ne_zero) hn,?_⟩
  rw [N.second_eq]
  have hh := all_top_identities S N f
  ext i j
  have he := congrFun (congrFun hh i) j
  change fullDet N.diagonal N.coupling * _ - D * result S N i j = _ at he
  field_simp
  linear_combination -D * N.secondScale f * he

theorem contact_target_ne (Q R : Form K) (l : Vec K) (hQ : Q.det ≠ 0)
    (h : Contact Q R l) : R ≠ 0 := by
  obtain ⟨_,a,b,ha,hb,he⟩ := h
  intro hzero
  have hm : a • Q = (-b) • square l + (0:K) • square l := by
    rw [hzero] at he
    ext i j
    have hh := congrFun (congrFun he i) j
    simp at hh ⊢
    linear_combination -hh
  have hh := congrArg Matrix.det hm
  rw [Matrix.det_smul,rank_two_determinant] at hh
  exact (mul_ne_zero (pow_ne_zero _ ha) hQ) hh

/-- The constructed equation is a genuine nonzero conic representative.
Nonsingularity is not asserted: the original theorem can complete by a singular conic. -/
theorem result_ne (S : Seven K) (N : NormalForm S) (hD : fullDet N.diagonal N.coupling ≠ 0) :
    result S N ≠ 0 := contact_target_ne _ _ _ (S.second_regular 0) (top_contact S N hD 0)



/-- Contact with the canonical middle chord, including the original conic scales. -/
theorem canonical_middle_contact (Q : Form K) (p r : Vec K) (d e a s t : K)
    (hd : d ≠ 0) (hD : D2 d e a ≠ 0) (hs : s ≠ 0) (ht : t ≠ 0)
    (hl : middleChord p r d a ≠ 0) :
    Contact (s • single Q p d) (t • double Q p r d e a) (middleChord p r d a) := by
  refine ⟨hl,t*D2 d e a/s,-t/d,
    div_ne_zero (mul_ne_zero ht hD) hs,div_ne_zero (neg_ne_zero.mpr ht) hd,?_⟩
  rw [middle_identity Q p r d e a hd]
  ext i j
  simp
  field_simp
  ring

def oppositeIndex (i f : Fin 3) : Fin 3 := if i=leftIndex f then rightIndex f else leftIndex f

def upperAt (S : Seven K) (i f : Fin 3) : Vec K :=
  if i=leftIndex f then S.upperLeft f else S.upperRight f

def member (i f : Fin 3) : Prop := i=leftIndex f ∨ i=rightIndex f

theorem canonical_upper_contact (S : Seven K) (N : NormalForm S) (i f : Fin 3)
    (h : member i f) :
    Contact (S.first i) (S.second f)
      (middleChord (S.chord i) (S.chord (oppositeIndex i f)) (N.diagonal i) (N.coupling f)) := by
  have hij : leftIndex f ≠ rightIndex f := by fin_cases f <;> decide
  rcases h with rfl | rfl
  · simp only [oppositeIndex,ite_true]
    rw [N.first_eq,N.second_eq]
    exact canonical_middle_contact _ _ _ _ _ _ _ _ (N.diagonal_ne _) (N.minor_ne f)
      (N.firstScale_ne _) (N.secondScale_ne _) (middleChord_ne S _ _ hij _ _ (N.diagonal_ne _))
  · simp only [oppositeIndex,Ne.symm hij,ite_false]
    rw [N.first_eq,N.second_eq,double_swap]
    have hD : D2 (N.diagonal (rightIndex f)) (N.diagonal (leftIndex f)) (N.coupling f) ≠ 0 := by
      simpa [D2,mul_comm] using N.minor_ne f
    exact canonical_middle_contact _ _ _ _ _ _ _ _ (N.diagonal_ne _) hD
      (N.firstScale_ne _) (N.secondScale_ne _) (middleChord_ne S _ _ (Ne.symm hij) _ _ (N.diagonal_ne _))

theorem original_upper_contact (S : Seven K) (i f : Fin 3) (h : member i f) :
    Contact (S.first i) (S.second f) (upperAt S i f) := by
  rcases h with rfl | rfl
  · simpa [upperAt] using S.left_contact f
  · have hij : rightIndex f ≠ leftIndex f := by fin_cases f <;> decide
    simpa [upperAt,hij] using S.right_contact f

/-- The original upper chords and the derived canonical ones define the same
line, expressed as equality of their incidence kernels. -/
theorem original_upper_kernel (S : Seven K) (N : NormalForm S) (i f : Fin 3)
    (h : member i f) (x : Vec K) :
    pairing (upperAt S i f) x = 0 ↔
    pairing (middleChord (S.chord i) (S.chord (oppositeIndex i f)) (N.diagonal i) (N.coupling f)) x = 0 :=
  contact_chord_kernel _ _ _ _ (S.first_regular i) (original_upper_contact S i f h)
    (canonical_upper_contact S N i f h) x

noncomputable def facePoint (S : Seven K) (N : NormalForm S) (i : Fin 3) : Vec K :=
  Matrix.mulVec ((S.chord : Form K)⁻¹) (fun j => matrix N.diagonal N.coupling j i)

theorem facePoint_pair (S : Seven K) (N : NormalForm S) (i j : Fin 3) :
    pairing (S.chord j) (facePoint S N i) = matrix N.diagonal N.coupling j i :=
  frame_pair S _ j

theorem facePoint_ne (S : Seven K) (N : NormalForm S) (i : Fin 3) : facePoint S N i ≠ 0 := by
  intro hz
  have hh := facePoint_pair S N i i
  rw [hz,matrix_diagonal] at hh
  exact N.diagonal_ne i (by simpa [pairing] using hh.symm)

theorem facePoint_upper (S : Seven K) (N : NormalForm S) (i f : Fin 3) (h : member i f) :
    pairing (upperAt S i f) (facePoint S N i) = 0 := by
  apply (original_upper_kernel S N i f h _).mpr
  rw [pairing_middle,facePoint_pair,facePoint_pair,matrix_diagonal]
  rcases h with rfl | rfl
  · simp only [oppositeIndex,ite_true]
    rw [matrix_symmetric,matrix_edge]
    ring
  · have hij : rightIndex f ≠ leftIndex f := by fin_cases f <;> decide
    simp only [oppositeIndex,hij,ite_false]
    rw [matrix_edge]
    ring

theorem facePoint_top (S : Seven K) (N : NormalForm S) (i f : Fin 3) (h : member i f) :
    pairing (topChord S N f) (facePoint S N i) = 0 := by
  simp only [topChord,pairing_last,facePoint_pair]
  rcases h with rfl | rfl
  · fin_cases f <;> simp [matrix,leftIndex,rightIndex,otherIndex,D2] <;> ring
  · fin_cases f <;> simp [matrix,leftIndex,rightIndex,otherIndex,D2] <;> ring

/-- No non-incidence restriction is needed on a new face's concurrence point. -/
def ConcurrentFour (p r u v : Vec K) : Prop :=
  ∃ x : Vec K, x ≠ 0 ∧ pairing p x=0 ∧ pairing r x=0 ∧ pairing u x=0 ∧ pairing v x=0

private theorem incident_faces (i : Fin 3) : member i (leftIndex i) ∧ member i (rightIndex i) := by
  fin_cases i <;> simp [member,leftIndex,rightIndex]

/-- All three new faces have a genuine projective concurrence point, and the
four lines include the two input chords exactly as supplied by the user. -/
theorem new_faces_concurrent (S : Seven K) (N : NormalForm S) (i : Fin 3) :
    ConcurrentFour (upperAt S i (leftIndex i)) (upperAt S i (rightIndex i))
      (topChord S N (leftIndex i)) (topChord S N (rightIndex i)) := by
  obtain ⟨hi,hj⟩ := incident_faces i
  exact ⟨facePoint S N i,facePoint_ne S N i,facePoint_upper S N i _ hi,
    facePoint_upper S N i _ hj,facePoint_top S N i _ hi,facePoint_top S N i _ hj⟩

theorem result_symmetric (S : Seven K) (N : NormalForm S) :
    ∀ i j, result S N i j = result S N j i := by
  intro i j
  simp [result,triple,square,mixed]
  rw [S.base_symmetric i j]
  ring

/-- A completion consists of one nonzero symmetric equation, three nonzero
contact chords, all three contact relations, and all three new face incidences. -/
def Completes (S : Seven K) (T : Form K) (l : Fin 3 → Vec K) : Prop :=
  T ≠ 0 ∧ (∀ i j, T i j=T j i) ∧
  (∀ f, Contact (S.second f) T (l f)) ∧
  ∀ i, ConcurrentFour (upperAt S i (leftIndex i)) (upperAt S i (rightIndex i))
    (l (leftIndex i)) (l (rightIndex i))

/-- Generic geometric existence in the pencil-contact formulation. All normal
parameters are first obtained from arbitrary Seven input. The sole additional
regular-chart test is the nonzero determinant of that derived scalar matrix. -/
theorem seven_completion (S : Seven K)
    (hD : fullDet S.normalForm.diagonal S.normalForm.coupling ≠ 0) :
    ∃ T : Form K, ∃ l : Fin 3 → Vec K, Completes S T l := by
  exact ⟨result S S.normalForm,topChord S S.normalForm,result_ne S S.normalForm hD,
    result_symmetric S S.normalForm,top_contact S S.normalForm hD,new_faces_concurrent S S.normalForm⟩

end IncidenceCubes.Penrose.Completion
