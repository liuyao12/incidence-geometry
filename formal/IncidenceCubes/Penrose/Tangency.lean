import IncidenceCubes.Penrose.Uniqueness
import IncidenceCubes.Classical.Polarity

/-! Relating the nonzero rank-one pencil relation to two-point tangency.
The transpose of a symmetric conic matrix gives its polar covector. In
characteristic different from two this is the actual first-order tangent.
No claim is made that every real contact chord has two real section points. -/
namespace IncidenceCubes.Penrose.Tangency
open Normalization Geometry GeometricSeven Completion Uniqueness
variable {K : Type*} [Field K]

theorem value_add_axes (Q : Form K) (i j : Fin 3) :
    value Q (axis i + axis j) = Q i i + Q i j + Q j i + Q j j := by
  fin_cases i <;> fin_cases j <;>
    simp [value,pairing,axis,Matrix.mulVec,dotProduct,Fin.sum_univ_three] <;> ring

/-- A nonzero symmetric matrix is a nonzero quadratic equation when 2≠0.
This is not the assertion that its real projective zero set is nonempty. -/
theorem nonzero_equation (Q : Form K) (hQ : Q ≠ 0)
    (hs : ∀ i j, Q i j=Q j i) (h2 : (2:K) ≠ 0) : ∃ x : Vec K, value Q x ≠ 0 := by
  by_contra h
  push_neg at h
  have hd (i : Fin 3) : Q i i=0 := by simpa [value_axis] using h (axis i)
  apply hQ
  ext i j
  have hh := h (axis i+axis j)
  rw [value_add_axes,hd i,hd j,hs j i] at hh
  have hz : (2:K)*Q i j=0 := by linear_combination hh
  exact (mul_eq_zero.mp hz).resolve_left h2

/-- A regular conic's polar never vanishes at a projective point. -/
theorem polar_nonzero (Q : Form K) (x : Vec K) (hQ : Q.det ≠ 0) (hx : x ≠ 0) :
    Q.mulVec x ≠ 0 := Classical.polar_ne_zero Q x hQ hx

/-- The existing classical first-order expansion is used, not a new
uninterpreted notion of tangent. -/
theorem tangent_expansion (Q : Form K) (x y : Vec K) (t : K)
    (hs : ∀ i j, Q i j=Q j i) :
    value Q (x+t • y) = value Q x + 2*t*pairing (Q.mulVec x) y + t^2*value Q y := by
  have h := Classical.polar_tangent_expansion Q x y t hs
  have hv (z : Vec K) : value Q z = Classical.matrixQuad Q z := by
    dsimp [value,Classical.matrixQuad,Classical.pair,pairing]; ring
  simpa only [hv] using h

private theorem axis_contact_of_tangencies (Q R : Form K) (a b : K)
    (hQ : Q.det ≠ 0) (hsQ : ∀ i j, Q i j=Q j i) (hsR : ∀ i j, R i j=R j i)
    (h00 : Q 0 0=0) (h11 : Q 1 1=0) (ha : a ≠ 0) (hb : b ≠ 0)
    (h0 : ∀ i, R i 0=a*Q i 0) (h1 : ∀ i, R i 1=b*Q i 1)
    (hne : ¬ Proportional Q R) : Contact Q R (axis 2) := by
  have h01 : Q 0 1 ≠ 0 := by
    intro hz; apply hQ
    simp [Matrix.det_fin_three,h00,h11,hz,hsQ 1 0]
  have hab : a=b := by
    have h := h0 1
    rw [hsR 1 0,hsQ 1 0,h1 0] at h
    exact ((mul_right_cancel₀ h01) h).symm
  subst b
  let c := R 2 2-a*Q 2 2
  have heq : R=a • Q+c • square (axis 2) := by
    ext i j
    fin_cases i <;> fin_cases j <;> simp [square,axis,c]
    all_goals first
      | exact h0 _
      | exact h1 _
      | simpa [hsR,hsQ] using h0 2
      | simpa [hsR,hsQ] using h1 2
  have hc : c ≠ 0 := by
    intro hz; apply hne; exact ⟨a,ha,by simpa [hz] using heq⟩
  refine ⟨?_,a,c,ha,hc,heq⟩
  intro hz
  have hh := congrFun hz 2
  simp [axis] at hh



def columns (x y z : Vec K) : Form K := fun i => ![x i,y i,z i]

theorem columns_det (x y z : Vec K) : (columns x y z).det = pairing (Classical.cross x y) z := by
  simp [columns,Matrix.det_fin_three,Classical.cross,pairing]; ring

theorem mulVec_axis (Q : Form K) (i : Fin 3) : Q.mulVec (axis i) = fun j => Q j i := by
  ext j; fin_cases i <;> simp [axis,Matrix.mulVec,dotProduct,Fin.sum_univ_three]

theorem pull_symmetric (F Q : Form K) (hQ : ∀ i j, Q i j=Q j i) :
    ∀ i j, pullForm F Q i j=pullForm F Q j i := by
  have ht : Q.transpose=Q := by ext i j; exact hQ j i
  have hh : (pullForm F Q).transpose=pullForm F Q := by
    simp [pullForm,Matrix.transpose_mul,ht,Matrix.mul_assoc]
  intro i j
  exact congrFun (congrFun hh j) i

theorem pull_regular (F Q : Form K) (hF : F.det ≠ 0) (hQ : Q.det ≠ 0) :
    (pullForm F Q).det ≠ 0 := by
  simp only [pullForm,Matrix.det_mul,Matrix.det_transpose]
  exact mul_ne_zero (mul_ne_zero hF hQ) hF

private theorem pulled_column (F Q : Form K) (i : Fin 3) :
    (pullForm F Q).mulVec (axis i) = pullLine F (Q.mulVec (fun j => F j i)) := by
  rw [pullForm,← Matrix.mulVec_mulVec,← Matrix.mulVec_mulVec,mulVec_axis]
  rfl

/-- Converse to the contact-polar implication: two distinct common tangencies
force a nonzero double-line member of the pencil. The frame is constructed in
the proof from the given points, not assumed in the input. -/
theorem contact_of_two_tangencies (Q R : Form K) (p x y : Vec K)
    (hQ : Q.det ≠ 0) (hsQ : ∀ i j, Q i j=Q j i) (hsR : ∀ i j, R i j=R j i)
    (hp : p ≠ 0) (hxy : Classical.cross x y ≠ 0)
    (hpx : pairing p x=0) (hpy : pairing p y=0)
    (hx : value Q x=0) (hy : value Q y=0) (hne : ¬ Proportional Q R)
    (a b : K) (ha : a ≠ 0) (hb : b ≠ 0)
    (htx : R.mulVec x=a • Q.mulVec x) (hty : R.mulVec y=b • Q.mulVec y) : Contact Q R p := by
  obtain ⟨k,hk⟩ : ∃ k : Fin 3, Classical.cross x y k ≠ 0 := by
    by_contra h; push_neg at h; apply hxy; ext k; exact h k
  let F := columns x y (axis k)
  have hF : F.det ≠ 0 := by
    simpa [F,columns_det,pairing_axis_right] using hk
  have hunit := isUnit_iff_ne_zero.mpr hF
  have hFinv := Matrix.mul_nonsing_inv F hunit
  have hinvF := Matrix.nonsing_inv_mul F hunit
  have h00 : pullForm F Q 0 0=0 := by
    have h := value_pull F Q (axis 0)
    rw [value_axis,mulVec_axis] at h
    simpa [F,columns,hx] using h
  have h11 : pullForm F Q 1 1=0 := by
    have h := value_pull F Q (axis 1)
    rw [value_axis,mulVec_axis] at h
    simpa [F,columns,hy] using h
  have h0 : ∀ i, pullForm F R i 0=a*pullForm F Q i 0 := by
    have he : (pullForm F R).mulVec (axis 0)=a • (pullForm F Q).mulVec (axis 0) := by
      rw [pulled_column,pulled_column]
      change pullLine F (R.mulVec x)=a • pullLine F (Q.mulVec x)
      rw [htx]
      simp [pullLine,Matrix.mulVec_smul]
    intro i; simpa [mulVec_axis] using congrFun he i
  have h1 : ∀ i, pullForm F R i 1=b*pullForm F Q i 1 := by
    have he : (pullForm F R).mulVec (axis 1)=b • (pullForm F Q).mulVec (axis 1) := by
      rw [pulled_column,pulled_column]
      change pullLine F (R.mulVec y)=b • pullLine F (Q.mulVec y)
      rw [hty]
      simp [pullLine,Matrix.mulVec_smul]
    intro i; simpa [mulVec_axis] using congrFun he i
  have hne' : ¬ Proportional (pullForm F Q) (pullForm F R) :=
    fun h => hne (proportional_of_pull F F⁻¹ Q R hFinv h)
  have hcan := axis_contact_of_tangencies (pullForm F Q) (pullForm F R) a b
    (pull_regular F Q hF hQ) (pull_symmetric F Q hsQ) (pull_symmetric F R hsR)
    h00 h11 ha hb h0 h1 hne'
  have back := Contact.pull F⁻¹ F _ _ hinvF (axis 2) hcan
  simp only [pull_comp,hFinv,pull_identity] at back
  have hzero (i : Fin 3) (hi : i ≠ 2) :
      pairing (pullLine F⁻¹ (axis 2)) (fun j => F j i)=0 := by
    rw [← mulVec_axis,pairing_pull,Matrix.mulVec_mulVec,hinvF,Matrix.one_mulVec,pairing_axis_left]
    simp [axis,Ne.symm hi]
  obtain ⟨s,hs,ep⟩ := line_through_frame_pair F hF 0 1 2 (by decide) (by decide) (by decide)
    p (pullLine F⁻¹ (axis 2)) hp back.1 (by simpa [F,columns] using hpx)
    (by simpa [F,columns] using hpy) (hzero 0 (by decide)) (hzero 1 (by decide))
  have hpback : pullLine F⁻¹ (axis 2)=(1/s) • p := by rw [ep,smul_smul]; simp [hs]
  rw [hpback] at back
  exact Contact.rescale_chord Q R p (1/s) (div_ne_zero one_ne_zero hs) back

/-- Once the chord meets the first regular conic in two distinct points, the
pencil-contact definition is equivalent to equality of their projective polar
tangents. In characteristic ≠2, tangent_expansion identifies these as tangents. -/
theorem contact_iff_two_tangencies (Q R : Form K) (p x y : Vec K)
    (hQ : Q.det ≠ 0) (hsQ : ∀ i j, Q i j=Q j i) (hsR : ∀ i j, R i j=R j i)
    (hp : p ≠ 0) (hxy : Classical.cross x y ≠ 0)
    (hpx : pairing p x=0) (hpy : pairing p y=0)
    (hx : value Q x=0) (hy : value Q y=0) (hne : ¬ Proportional Q R) :
    Contact Q R p ↔ ∃ a b : K, a ≠ 0 ∧ b ≠ 0 ∧
      R.mulVec x=a • Q.mulVec x ∧ R.mulVec y=b • Q.mulVec y := by
  constructor
  · intro h
    obtain ⟨a,ha,hax,_⟩ := contact_polar Q R p x h hpx
    obtain ⟨b,hb,hby,_⟩ := contact_polar Q R p y h hpy
    exact ⟨a,b,ha,hb,hax,hby⟩
  · rintro ⟨a,b,ha,hb,htx,hty⟩
    exact contact_of_two_tangencies Q R p x y hQ hsQ hsR hp hxy hpx hpy hx hy hne a b ha hb htx hty

/-- The completed matrix is also a nonzero quadratic equation, not merely a
nonzero alternating matrix in characteristic two. -/
theorem generic_nonzero_equation (S : Seven K) (h : IndependentFacePoints S) :
    ∃ T : Form K, ∃ l : Fin 3 → Vec K, Completes S T l ∧
      (∃ x : Vec K, value T x ≠ 0) ∧
      ∀ U : Form K, ∀ m : Fin 3 → Vec K, Completes S U m → Proportional T U := by
  obtain ⟨T,l,hc,hu⟩ := penrose_generic S h
  exact ⟨T,l,hc,nonzero_equation T hc.1 hc.2.1 S.two_ne,hu⟩

end IncidenceCubes.Penrose.Tangency
