import IncidenceCubes.Penrose.Completion

/-! Projective uniqueness of the completion and a genericity test expressed
entirely in the original contact geometry, not in chosen normal-form parameters. -/
namespace IncidenceCubes.Penrose.Uniqueness
open Normalization Geometry GeometricSeven Completion
variable {K : Type*} [Field K]

private theorem incident (i : Fin 3) : member i (leftIndex i) ∧ member i (rightIndex i) := by
  fin_cases i <;> simp [member,leftIndex,rightIndex]

/-- The two already given chords of a new face determine its point uniquely.
This holds even for x=0 and therefore needs no projective nonzero assumption. -/
theorem forced_face_point (S : Seven K) (N : NormalForm S) (i : Fin 3) (x : Vec K)
    (hx : pairing (upperAt S i (leftIndex i)) x = 0)
    (hy : pairing (upperAt S i (rightIndex i)) x = 0) :
    x = (pairing (S.chord i) x / N.diagonal i) • facePoint S N i := by
  obtain ⟨hi,hj⟩ := incident i
  have h1 := (original_upper_kernel S N i (leftIndex i) hi x).mp hx
  have h2 := (original_upper_kernel S N i (rightIndex i) hj x).mp hy
  rw [pairing_middle] at h1 h2
  have hinj : Function.Injective (Matrix.mulVec (S.chord : Form K)) :=
    Matrix.mulVec_injective_iff_isUnit.mpr ((Matrix.isUnit_iff_isUnit_det _).mpr
      (isUnit_iff_ne_zero.mpr S.independent))
  apply hinj
  ext j
  rw [← pairing_row,← pairing_row]
  rw [pairing_scale,facePoint_pair]
  have hd0 := N.diagonal_ne 0
  have hd1 := N.diagonal_ne 1
  have hd2 := N.diagonal_ne 2
  fin_cases i <;> fin_cases j <;>
    simp [oppositeIndex,leftIndex,rightIndex,matrix] at h1 h2 ⊢ <;>
    field_simp [hd0,hd1,hd2] <;> first | linear_combination h1 | linear_combination h2


noncomputable def faceFrame (S : Seven K) (N : NormalForm S) : Form K :=
  let L : Form K := S.chord
  L⁻¹ * matrix N.diagonal N.coupling

theorem faceFrame_column (S : Seven K) (N : NormalForm S) (i : Fin 3) :
    (fun j => faceFrame S N j i) = facePoint S N i := by
  ext j; simp [faceFrame,facePoint,Matrix.mul_apply,Matrix.mulVec,dotProduct]

theorem matrix_det (d a : Vec K) : (matrix d a).det = fullDet d a := by
  simp [matrix,fullDet,Matrix.det_fin_three,D3]; ring

theorem faceFrame_det (S : Seven K) (N : NormalForm S) :
    (faceFrame S N).det = (Matrix.det (S.chord : Form K))⁻¹ * fullDet N.diagonal N.coupling := by
  simp [faceFrame,Matrix.det_mul,Matrix.det_nonsing_inv,matrix_det]

/-- Three independent points determined by the known upper chords. All its
quantifiers and equations refer only to the original Seven input. -/
def IndependentFacePoints (S : Seven K) : Prop :=
  ∃ X : Fin 3 → Vec K, Matrix.det (X : Form K) ≠ 0 ∧
    ∀ i, pairing (upperAt S i (leftIndex i)) (X i) = 0 ∧
      pairing (upperAt S i (rightIndex i)) (X i) = 0

theorem fullDet_of_independent_faces (S : Seven K) (N : NormalForm S)
    (h : IndependentFacePoints S) : fullDet N.diagonal N.coupling ≠ 0 := by
  obtain ⟨X,hX,hinc⟩ := h
  let s : Vec K := fun i => pairing (S.chord i) (X i) / N.diagonal i
  have he (i : Fin 3) : X i = s i • facePoint S N i :=
    forced_face_point S N i (X i) (hinc i).1 (hinc i).2
  have hm : (X : Form K) = Matrix.diagonal s * (faceFrame S N).transpose := by
    ext i j
    simp only [Matrix.diagonal_mul,Matrix.transpose_apply]
    have hh := congrFun (he i) j
    rw [← faceFrame_column S N i] at hh
    exact hh
  intro hz
  apply hX
  rw [hm,Matrix.det_mul,Matrix.det_transpose,faceFrame_det,hz,mul_zero,mul_zero]

private theorem member_reciprocal (i f : Fin 3) (h : member i f) :
    f=leftIndex i ∨ f=rightIndex i := by
  fin_cases i <;> fin_cases f <;> simp_all [member,leftIndex,rightIndex]

theorem completion_chord_at_face (S : Seven K) (N : NormalForm S) (T : Form K)
    (l : Fin 3 → Vec K) (h : Completes S T l) (i f : Fin 3) (hi : member i f) :
    pairing (l f) (facePoint S N i) = 0 := by
  obtain ⟨x,hx,h1,h2,h3,h4⟩ := h.2.2.2 i
  have he := forced_face_point S N i x h1 h2
  let s := pairing (S.chord i) x / N.diagonal i
  have hs : s ≠ 0 := by
    intro hz; apply hx; simpa [s,hz] using he
  have hlx : pairing (l f) x = 0 := by
    rcases member_reciprocal i f hi with rfl | rfl
    · exact h3
    · exact h4
  rw [he,pairing_scale] at hlx
  exact (mul_eq_zero.mp hlx).resolve_left hs

/-- The third face point does not lie on a top contact chord in the regular
chart. This also provides a witness separating two top chords. -/
theorem top_at_other (S : Seven K) (N : NormalForm S) (f : Fin 3) :
    pairing (topChord S N f) (facePoint S N (otherIndex f)) = fullDet N.diagonal N.coupling := by
  simp only [topChord,pairing_last,facePoint_pair]
  fin_cases f <;> simp [matrix,leftIndex,rightIndex,otherIndex,fullDet,D2,D3] <;> ring

private theorem support_axis (p : Vec K) (i j k : Fin 3)
    (hij : i ≠ j) (hik : i ≠ k) (hjk : j ≠ k) (hi : p i=0) (hj : p j=0) :
    p = p k • axis k := by
  ext n
  have hn : n=i ∨ n=j ∨ n=k := by omega
  rcases hn with rfl | rfl | rfl
  · simp [axis,hik,hi]
  · simp [axis,hjk,hj]
  · simp [axis]

private theorem line_on_column (F : Form K) (l : Vec K) (i : Fin 3) :
    pullLine F l i = pairing l (fun j => F j i) := by
  simp [pullLine,pairing,Matrix.mulVec,dotProduct,Fin.sum_univ_three,mul_comm]

/-- Two nonzero lines containing the same two columns of an invertible frame
are proportional. No projective incidence theorem is used as an axiom. -/
theorem line_through_frame_pair (F : Form K) (hF : F.det ≠ 0)
    (i j k : Fin 3) (hij : i ≠ j) (hik : i ≠ k) (hjk : j ≠ k)
    (p q : Vec K) (hp : p ≠ 0) (hq : q ≠ 0)
    (hpi : pairing p (fun n => F n i)=0) (hpj : pairing p (fun n => F n j)=0)
    (hqi : pairing q (fun n => F n i)=0) (hqj : pairing q (fun n => F n j)=0) :
    ∃ s : K, s ≠ 0 ∧ p = s • q := by
  have hunit : IsUnit F.det := isUnit_iff_ne_zero.mpr hF
  have hinj := pullLine_injective F F⁻¹ (Matrix.mul_nonsing_inv F hunit)
  have ep := support_axis (pullLine F p) i j k hij hik hjk
    (by rwa [line_on_column]) (by rwa [line_on_column])
  have eq := support_axis (pullLine F q) i j k hij hik hjk
    (by rwa [line_on_column]) (by rwa [line_on_column])
  have hpk : pullLine F p k ≠ 0 := by
    intro h; apply hp; apply hinj; rw [h] at ep; simpa [pullLine] using ep
  have hqk : pullLine F q k ≠ 0 := by
    intro h; apply hq; apply hinj; rw [h] at eq; simpa [pullLine] using eq
  refine ⟨pullLine F p k / pullLine F q k,div_ne_zero hpk hqk,hinj ?_⟩
  have hscale (a : K) : pullLine F (a • q) = a • pullLine F q := by simp [pullLine,Matrix.mulVec_smul]
  rw [hscale]
  calc
    pullLine F p = pullLine F p k • axis k := ep
    _ = (pullLine F p k / pullLine F q k) • (pullLine F q k • axis k) := by
      rw [smul_smul,div_mul_cancel₀ _ hqk]
    _ = (pullLine F p k / pullLine F q k) • pullLine F q :=
      congrArg (fun v : Vec K => (pullLine F p k / pullLine F q k) • v) eq.symm

theorem completion_chord_proportional (S : Seven K) (N : NormalForm S)
    (hD : fullDet N.diagonal N.coupling ≠ 0) (T : Form K) (l : Fin 3 → Vec K)
    (h : Completes S T l) (f : Fin 3) :
    ∃ s : K, s ≠ 0 ∧ l f = s • topChord S N f := by
  have hF : (faceFrame S N).det ≠ 0 := by
    rw [faceFrame_det]; exact mul_ne_zero (inv_ne_zero S.independent) hD
  have hij : leftIndex f ≠ rightIndex f := by fin_cases f <;> decide
  have hik : leftIndex f ≠ otherIndex f := by fin_cases f <;> decide
  have hjk : rightIndex f ≠ otherIndex f := by fin_cases f <;> decide
  apply line_through_frame_pair (faceFrame S N) hF (leftIndex f) (rightIndex f) (otherIndex f)
    hij hik hjk (l f) (topChord S N f) (h.2.2.1 f).1 (topChord_ne S N f)
  · rw [faceFrame_column]; exact completion_chord_at_face S N T l h _ _ (Or.inl rfl)
  · rw [faceFrame_column]; exact completion_chord_at_face S N T l h _ _ (Or.inr rfl)
  · rw [faceFrame_column]; exact facePoint_top S N _ _ (Or.inl rfl)
  · rw [faceFrame_column]; exact facePoint_top S N _ _ (Or.inr rfl)



theorem square_scale (p : Vec K) (a : K) : square (a • p) = a^2 • square p := by
  ext i j; simp [square]; ring

theorem Contact.rescale_chord (Q T : Form K) (l : Vec K) (a : K) (ha : a ≠ 0)
    (h : Contact Q T (a • l)) : Contact Q T l := by
  obtain ⟨hl,b,c,hb,hc,he⟩ := h
  refine ⟨?_,b,c*a^2,hb,mul_ne_zero hc (pow_ne_zero _ ha),?_⟩
  · intro hz; apply hl; simp [hz]
  · simpa [square_scale,smul_smul] using he

theorem value_smul (Q : Form K) (a : K) (x : Vec K) : value (a • Q) x = a * value Q x := by
  have h := value_combination Q Q a 0 x
  simpa using h

/-- Two fixed-chord pencils have at most one common projective conic if one
contains a regular conic and the chords can be separated by a point. The common
conic itself need not be regular. -/
theorem two_pencils_unique (Q R T U : Form K) (p q x : Vec K)
    (hQ : Q.det ≠ 0) (hpx : pairing p x ≠ 0) (hqx : pairing q x = 0)
    (hT : Contact Q T p) (hU : Contact Q U p)
    (hT' : Contact R T q) (hU' : Contact R U q) : Proportional T U := by
  obtain ⟨_,a,b,ha,_,et⟩ := hT
  obtain ⟨_,c,d,hc,_,eu⟩ := hU
  obtain ⟨_,e,f,he,_,et'⟩ := hT'
  obtain ⟨_,g,h,hg,_,eu'⟩ := hU'
  have h1 : a • U - c • T = (a*d-c*b) • square p := by
    rw [eu,et]; ext i j; simp; ring
  have h2 : e • U - g • T = (e*h-g*f) • square q := by
    rw [eu',et']; ext i j; simp; ring
  let z := a*g-c*e
  have hcomb : z • T = (e*(a*d-c*b)) • square p + (-a*(e*h-g*f)) • square q := by
    ext i j
    have hh1 := congrFun (congrFun h1 i) j
    have hh2 := congrFun (congrFun h2 i) j
    simp at hh1 hh2 ⊢
    dsimp [z]
    linear_combination e*hh1-a*hh2
  have hmat : (z*a) • Q = (e*(a*d-c*b)-z*b) • square p + (-a*(e*h-g*f)) • square q := by
    rw [et] at hcomb
    ext i j
    have hh := congrFun (congrFun hcomb i) j
    simp at hh ⊢
    linear_combination hh
  have hz : z=0 := by
    have hh := congrArg Matrix.det hmat
    rw [Matrix.det_smul,rank_two_determinant] at hh
    have hpw : (z*a)^3=0 := by simpa using (mul_eq_zero.mp hh).resolve_right hQ
    exact (mul_eq_zero.mp (pow_eq_zero hpw)).resolve_right ha
  have hprod : (e*(a*d-c*b)) • square p = (a*(e*h-g*f)) • square q := by
    rw [hz] at hcomb
    ext i j
    have hh := congrFun (congrFun hcomb i) j
    simp at hh ⊢
    linear_combination -hh
  have hv := congrArg (fun A : Form K => value A x) hprod
  simp only [value_smul,value_square,hqx,zero_pow (by decide : 2 ≠ 0),mul_zero] at hv
  have hB : a*d-c*b=0 :=
    (mul_eq_zero.mp ((mul_eq_zero.mp hv).resolve_right (pow_ne_zero _ hpx))).resolve_left he
  refine ⟨c/a,div_ne_zero hc ha,?_⟩
  rw [hB] at h1
  ext i j
  have hh := congrFun (congrFun h1 i) j
  simp at hh ⊢
  field_simp
  linear_combination hh

/-- Uniqueness is up to a NONZERO scalar and does not demand regularity of a
competing eighth conic. Its chord witnesses may differ from the constructed ones. -/
theorem completion_unique (S : Seven K) (N : NormalForm S)
    (hD : fullDet N.diagonal N.coupling ≠ 0) (U : Form K) (l : Fin 3 → Vec K)
    (hU : Completes S U l) : Proportional (result S N) U := by
  have hu (f : Fin 3) : Contact (S.second f) U (topChord S N f) := by
    obtain ⟨a,ha,he⟩ := completion_chord_proportional S N hD U l hU f
    have h := hU.2.2.1 f
    rw [he] at h
    exact Contact.rescale_chord _ _ _ a ha h
  have hp : pairing (topChord S N 0) (facePoint S N 2) ≠ 0 := by
    have hh := top_at_other S N 0
    simpa [otherIndex] using (hh.trans_ne hD)
  have hq : pairing (topChord S N 1) (facePoint S N 2) = 0 :=
    facePoint_top S N 2 1 (by simp [member,leftIndex,rightIndex])
  exact two_pencils_unique (S.second 0) (S.second 1) (result S N) U
    (topChord S N 0) (topChord S N 1) (facePoint S N 2) (S.second_regular 0) hp hq
    (top_contact S N hD 0) (hu 0) (top_contact S N hD 1) (hu 1)

/-- Generic Penrose completion, with existence and projective uniqueness.
Every hypothesis concerns the seven original conics and their contact chords.
No normal-form parameters and no candidate eighth conic occur in the input. -/
theorem penrose_generic (S : Seven K) (h : IndependentFacePoints S) :
    ∃ T : Form K, ∃ l : Fin 3 → Vec K, Completes S T l ∧
      ∀ U : Form K, ∀ m : Fin 3 → Vec K, Completes S U m → Proportional T U := by
  let N := S.normalForm
  have hD := fullDet_of_independent_faces S N h
  exact ⟨result S N,topChord S N,⟨result_ne S N hD,result_symmetric S N,
    top_contact S N hD,new_faces_concurrent S N⟩,completion_unique S N hD⟩

end IncidenceCubes.Penrose.Uniqueness
