import IncidenceCubes.Penrose.Normalization

/-! Projective contact pencils and coordinate changes. Nonzero scale factors
are retained. These statements do not assert two real intersection points. -/
namespace IncidenceCubes.Penrose.Geometry
open Normalization
variable {K : Type*} [Field K]

def pairing (l x : Vec K) : K := l 0 * x 0 + l 1 * x 1 + l 2 * x 2

def value (Q : Form K) (x : Vec K) : K :=
  pairing x (Q.mulVec x)

def pullForm (B : Form K) (Q : Form K) : Form K := B.transpose * Q * B

def pullLine (B : Form K) (l : Vec K) : Vec K := B.transpose.mulVec l

theorem value_square (l x : Vec K) : value (square l) x = pairing l x ^ 2 := by
  simp [value, pairing, square, Matrix.mulVec, dotProduct, Fin.sum_univ_three]; ring

theorem value_combination (Q R : Form K) (a b : K) (x : Vec K) :
    value (a • Q + b • R) x = a * value Q x + b * value R x := by
  simp [value, pairing, Matrix.mulVec, dotProduct, Fin.sum_univ_three]; ring

theorem contact_polar (Q R : Form K) (l x : Vec K)
    (h : Contact Q R l) (hx : pairing l x = 0) :
    ∃ a : K, a ≠ 0 ∧ R.mulVec x = a • Q.mulVec x ∧ value R x = a * value Q x := by
  obtain ⟨_,a,b,ha,_,hr⟩ := h
  refine ⟨a,ha,?_,?_⟩
  · rw [hr]
    ext i
    simp [Matrix.mulVec, dotProduct, Fin.sum_univ_three, square]
    dsimp [pairing] at hx
    linear_combination b * l i * hx
  · rw [hr, value_combination, value_square, hx]
    ring

theorem rank_two_determinant (p r : Vec K) (a b : K) :
    (a • square p + b • square r).det = 0 := by
  simp [Matrix.det_fin_three, square]; ring

theorem contact_coefficient_unique (Q R : Form K) (p r : Vec K)
    (hQ : Q.det ≠ 0) (a b c d : K)
    (hp : R = a • Q + b • square p) (hr : R = c • Q + d • square r) : a = c := by
  have hmat : (a-c) • Q = (-b) • square p + d • square r := by
    have h := hp.symm.trans hr
    ext i j
    have hh := congrFun (congrFun h i) j
    simp at hh ⊢
    linear_combination hh
  have hz := congrArg Matrix.det hmat
  rw [Matrix.det_smul, rank_two_determinant] at hz
  have hs : (a-c)^3 = 0 := by simpa using (mul_eq_zero.mp hz).resolve_right hQ
  exact sub_eq_zero.mp (pow_eq_zero hs)

/-- For a nonsingular first conic, any two contact witnesses have the same
projective chord: expressed without choosing a scale as equal kernels. -/
theorem contact_chord_kernel (Q R : Form K) (p r : Vec K)
    (hQ : Q.det ≠ 0) (hp : Contact Q R p) (hr : Contact Q R r) (x : Vec K) :
    pairing p x = 0 ↔ pairing r x = 0 := by
  obtain ⟨_,a,b,ha,hb,ep⟩ := hp
  obtain ⟨_,c,d,hc,hd,er⟩ := hr
  have hac := contact_coefficient_unique Q R p r hQ a b c d ep er
  subst c
  have hv := congrArg (fun T : Form K => value T x) (ep.symm.trans er)
  simp only [value_combination, value_square] at hv
  have hs : b * pairing p x ^ 2 = d * pairing r x ^ 2 := add_left_cancel hv
  constructor
  · intro h
    rw [h, zero_pow (by decide : 2 ≠ 0), mul_zero] at hs
    exact sq_eq_zero_iff.mp ((mul_eq_zero.mp hs.symm).resolve_left hd)
  · intro h
    rw [h, zero_pow (by decide : 2 ≠ 0), mul_zero] at hs
    exact sq_eq_zero_iff.mp ((mul_eq_zero.mp hs).resolve_left hb)

theorem Contact.rescale_left (Q R : Form K) (l : Vec K) (s : K) (hs : s ≠ 0)
    (h : Contact (s • Q) R l) : Contact Q R l := by
  obtain ⟨hl,a,b,ha,hb,he⟩ := h
  exact ⟨hl,a*s,b,mul_ne_zero ha hs,hb,by simpa [smul_smul] using he⟩

theorem Contact.rescale_right (Q R : Form K) (l : Vec K) (s : K) (hs : s ≠ 0)
    (h : Contact Q R l) : Contact Q (s • R) l := by
  obtain ⟨hl,a,b,ha,hb,he⟩ := h
  exact ⟨hl,s*a,s*b,mul_ne_zero hs ha,mul_ne_zero hs hb,by simp [he,smul_add,smul_smul]⟩

theorem initial_normal_form (Q R : Form K) (l : Vec K) (h : Contact Q R l) :
    ∃ d a : K, d ≠ 0 ∧ a ≠ 0 ∧ R = a • single Q l d := by
  obtain ⟨_,a,b,ha,hb,he⟩ := h
  refine ⟨-a/b,a,div_ne_zero (neg_ne_zero.mpr ha) hb,ha,?_⟩
  rw [he]
  ext i j
  simp [single]
  field_simp [ha, hb]
  ring

theorem pull_square (B : Form K) (l : Vec K) :
    pullForm B (square l) = square (pullLine B l) := by
  ext i j
  simp [pullForm,pullLine,square,Matrix.mul_apply,Matrix.mulVec,dotProduct,Fin.sum_univ_three]
  ring

theorem pull_smul (B Q : Form K) (a : K) :
    pullForm B (a • Q) = a • pullForm B Q := by
  simp [pullForm,Matrix.mul_smul,Matrix.smul_mul]

theorem pull_combination (B Q R : Form K) (a b : K) :
    pullForm B (a • Q + b • R) = a • pullForm B Q + b • pullForm B R := by
  simp [pullForm,Matrix.mul_add,Matrix.add_mul,Matrix.mul_smul,Matrix.smul_mul]

theorem pull_comp (A B Q : Form K) :
    pullForm A (pullForm B Q) = pullForm (B*A) Q := by
  simp [pullForm,Matrix.transpose_mul,Matrix.mul_assoc]

theorem pull_identity (Q : Form K) : pullForm 1 Q = Q := by simp [pullForm]

theorem pullLine_comp (A B : Form K) (l : Vec K) :
    pullLine A (pullLine B l) = pullLine (B*A) l := by
  simp [pullLine,Matrix.transpose_mul,Matrix.mulVec_mulVec]

theorem pullLine_identity (l : Vec K) : pullLine 1 l = l := by simp [pullLine]

theorem pull_injective (B C : Form K) (hBC : B*C=1) : Function.Injective (pullForm B) := by
  intro Q R h
  have hh := congrArg (pullForm C) h
  simpa [pull_comp,hBC,pull_identity] using hh

theorem pullLine_injective (B C : Form K) (hBC : B*C=1) : Function.Injective (pullLine B) := by
  intro p r h
  have hh := congrArg (pullLine C) h
  simpa [pullLine_comp,hBC,pullLine_identity] using hh

theorem Contact.pull (B C Q R : Form K) (hBC : B*C=1) (l : Vec K)
    (h : Contact Q R l) : Contact (pullForm B Q) (pullForm B R) (pullLine B l) := by
  obtain ⟨hl,a,b,ha,hb,hr⟩ := h
  refine ⟨?_,a,b,ha,hb,?_⟩
  · intro hz
    apply hl
    apply pullLine_injective B C hBC
    simpa [pullLine] using hz
  · rw [hr,pull_combination,pull_square]



def FaceOff (Q : Form K) (p r u v : Vec K) : Prop :=
  ∃ x : Vec K, x ≠ 0 ∧ value Q x ≠ 0 ∧
    pairing p x = 0 ∧ pairing r x = 0 ∧ pairing u x = 0 ∧ pairing v x = 0

theorem pairing_axis_left (i : Fin 3) (x : Vec K) : pairing (axis i) x = x i := by
  fin_cases i <;> simp [pairing,axis]

theorem pairing_axis_right (i : Fin 3) (x : Vec K) : pairing x (axis i) = x i := by
  fin_cases i <;> simp [pairing,axis]

theorem pairing_scale (p x : Vec K) (a : K) : pairing p (a • x) = a * pairing p x := by
  simp [pairing]; ring

theorem value_axis (Q : Form K) (i : Fin 3) : value Q (axis i) = Q i i := by
  fin_cases i <;> simp [value,pairing,axis,Matrix.mulVec,dotProduct,Fin.sum_univ_three]

theorem value_scale (Q : Form K) (x : Vec K) (a : K) : value Q (a • x) = a^2 * value Q x := by
  simp [value,pairing,Matrix.mulVec,dotProduct,Fin.sum_univ_three]; ring

/-- In the initial-chord frame, the given concurrence determines the missing
coordinate axis. Its non-incidence with the base yields the needed nonzero entry. -/
theorem face_axis_coordinates (Q : Form K) (i j k : Fin 3)
    (hij : i ≠ j) (hik : i ≠ k) (hjk : j ≠ k) (u v : Vec K)
    (h : FaceOff Q (axis i) (axis j) u v) :
    Q k k ≠ 0 ∧ u k = 0 ∧ v k = 0 := by
  obtain ⟨x,hx,hQ,hi,hj,hu,hv⟩ := h
  rw [pairing_axis_left] at hi hj
  have he : x = x k • axis k := by
    ext n
    have hn : n=i ∨ n=j ∨ n=k := by omega
    rcases hn with rfl | rfl | rfl
    · simp [axis,hik,hi]
    · simp [axis,hjk,hj]
    · simp [axis]
  have hk : x k ≠ 0 := by
    intro hz; apply hx; simpa [hz] using he
  have hQk : Q k k ≠ 0 := by
    intro hz; apply hQ; rw [he,value_scale,value_axis,hz,mul_zero]
  rw [he,pairing_scale,pairing_axis_right] at hu hv
  exact ⟨hQk,(mul_eq_zero.mp hu).resolve_left hk,(mul_eq_zero.mp hv).resolve_left hk⟩

theorem pairing_pull (B : Form K) (p x : Vec K) :
    pairing (pullLine B p) x = pairing p (B.mulVec x) := by
  simp [pairing,pullLine,Matrix.mulVec,dotProduct,Fin.sum_univ_three]; ring

theorem value_pull (B Q : Form K) (x : Vec K) :
    value (pullForm B Q) x = value Q (B.mulVec x) := by
  simp [value,pairing,pullForm,Matrix.mul_apply,Matrix.mulVec,dotProduct,Fin.sum_univ_three]
  ring

theorem FaceOff.pull (B C Q : Form K) (hBC : B*C=1) (p r u v : Vec K)
    (h : FaceOff Q p r u v) :
    FaceOff (pullForm B Q) (pullLine B p) (pullLine B r) (pullLine B u) (pullLine B v) := by
  obtain ⟨x,hx,hQ,hp,hr,hu,hv⟩ := h
  have hc : B.mulVec (C.mulVec x) = x := by rw [Matrix.mulVec_mulVec,hBC,Matrix.one_mulVec]
  refine ⟨C.mulVec x,?_,?_,?_,?_,?_,?_⟩
  · intro hz; apply hx; rw [hz,Matrix.mulVec_zero] at hc; exact hc.symm
  · simpa [value_pull,hc] using hQ
  · simpa [pairing_pull,hc] using hp
  · simpa [pairing_pull,hc] using hr
  · simpa [pairing_pull,hc] using hu
  · simpa [pairing_pull,hc] using hv

theorem pull_row (L B : Form K) (h : L*B=1) (i : Fin 3) :
    pullLine B (L i) = axis i := by
  ext j
  have hh := congrFun (congrFun h i) j
  simpa [pullLine,Matrix.mulVec,Matrix.mul_apply,dotProduct,Fin.sum_univ_three,
    axis,Matrix.one_apply,mul_comm,eq_comm] using hh

theorem pull_single (B Q : Form K) (p : Vec K) (d : K) :
    pullForm B (single Q p d) = single (pullForm B Q) (pullLine B p) d := by
  have h := pull_combination B Q (square p) 1 (-(1/d))
  simpa [single,pull_square,sub_eq_add_neg] using h

theorem pull_double (B Q : Form K) (p r : Vec K) (d e a : K) :
    pullForm B (double Q p r d e a) =
      double (pullForm B Q) (pullLine B p) (pullLine B r) d e a := by
  ext i j
  simp [pullForm,pullLine,double,square,mixed,Matrix.mul_apply,Matrix.mulVec,dotProduct,
    Fin.sum_univ_three]
  ring

theorem proportional_of_pull (B C Q R : Form K) (hBC : B*C=1)
    (h : Proportional (pullForm B Q) (pullForm B R)) : Proportional Q R := by
  obtain ⟨a,ha,he⟩ := h
  refine ⟨a,ha,pull_injective B C hBC ?_⟩
  simpa [pullForm,Matrix.mul_smul,Matrix.smul_mul] using he

/-- The complete reverse face theorem for arbitrary independent contact
covectors (the rows of L), rather than coordinate-axis hypotheses. -/
theorem arbitrary_face_normal_form (L B Q R : Form K) (hLB : L*B=1) (hBL : B*L=1)
    (i j k : Fin 3) (hij : i ≠ j) (hik : i ≠ k) (hjk : j ≠ k)
    (d e : K) (hd : d ≠ 0) (he : e ≠ 0) (u v : Vec K)
    (hface : FaceOff Q (L i) (L j) u v) (hR : ¬ Proportional Q R)
    (cu : Contact (single Q (L i) d) R u)
    (cv : Contact (single Q (L j) e) R v) :
    ∃ a s : K, s ≠ 0 ∧ D2 d e a ≠ 0 ∧ R = s • double Q (L i) (L j) d e a := by
  have hface' := FaceOff.pull B L Q hBL (L i) (L j) u v hface
  rw [pull_row L B hLB i,pull_row L B hLB j] at hface'
  obtain ⟨hQ,hu,hv⟩ := face_axis_coordinates _ i j k hij hik hjk _ _ hface'
  have cu' := Contact.pull B L _ R hBL u cu
  have cv' := Contact.pull B L _ R hBL v cv
  rw [pull_single,pull_row L B hLB i] at cu'
  rw [pull_single,pull_row L B hLB j] at cv'
  have hR' : ¬ Proportional (pullForm B Q) (pullForm B R) :=
    fun h => hR (proportional_of_pull B L Q R hBL h)
  obtain ⟨a,s,hs,hD,hr⟩ := face_normal_form _ _ i j k hij hik hjk d e hd he _ _ hu hv hQ hR' cu' cv'
  refine ⟨a,s,hs,hD,pull_injective B L hBL ?_⟩
  rw [pull_smul,pull_double,pull_row L B hLB i,pull_row L B hLB j]
  exact hr

end IncidenceCubes.Penrose.Geometry
