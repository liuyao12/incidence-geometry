import IncidenceCubes.Penrose.Contact
import IncidenceCubes.Classical.Basic

/-!
# Contact transport: a geometric conic analogue of a Fomin face

For nonsingular quadratic forms, the coefficient of the old form in a proper
rank-one contact relation is unique. Around a quadrilateral, its multiplicative
curvature is one precisely when the four contact chords are concurrent.

This is a local theorem about arbitrary contact data, not conics already given
by a principal-minor parametrization. A pair of distinct chords is retained as
a convenient genericity assumption in the converse. No real-contact existence
or characteristic-two interpretation as ordinary tangency is asserted.
-/
namespace IncidenceCubes.Connection.ConicTransport
open Penrose.Normalization Penrose.Geometry
variable {K : Type*} [Field K]

/-- A proper contact witness, with both nonzero coefficients as field units. -/
structure Witness (Q R : Form K) (l : Vec K) where
  scale : Kˣ
  weight : Kˣ
  chord_ne : l ≠ 0
  relation : R = (scale : K) • Q + (weight : K) • square l

noncomputable def ofContact (Q R : Form K) (l : Vec K) (h : Contact Q R l) :
    Witness Q R l :=
  _root_.Classical.choice (by
    obtain ⟨hl,a,b,ha,hb,he⟩ := h
    exact ⟨⟨Units.mk0 a ha, Units.mk0 b hb, hl, he⟩⟩)

theorem Witness.contact (Q R : Form K) (l : Vec K) (w : Witness Q R l) :
    Contact Q R l :=
  ⟨w.chord_ne, w.scale, w.weight, Units.ne_zero _, Units.ne_zero _, w.relation⟩

/-- The edge transport is independent of the contact witness and chord scale. -/
theorem scale_unique (Q R : Form K) (p r : Vec K) (hQ : Q.det ≠ 0)
    (w : Witness Q R p) (v : Witness Q R r) : w.scale = v.scale := by
  apply Units.ext
  exact contact_coefficient_unique Q R p r hQ _ _ _ _ w.relation v.relation

/-- Reverse traversal inverts the edge transport. -/
def Witness.reverse (Q R : Form K) (l : Vec K) (w : Witness Q R l) : Witness R Q l where
  scale := w.scale⁻¹
  weight := -(w.scale⁻¹ * w.weight)
  chord_ne := w.chord_ne
  relation := by
    ext i j
    have hr := congrFun (congrFun w.relation i) j
    simp [Units.val_inv_eq_inv_val] at hr ⊢
    rw [hr]
    field_simp
    try ring

/-- Changes of representative change an edge transport by the ratio of the
endpoint rescalings, exactly the gauge law of a one-dimensional connection. -/
def Witness.rescale (Q R : Form K) (l : Vec K) (w : Witness Q R l) (u v : Kˣ) :
    Witness ((u : K) • Q) ((v : K) • R) l where
  scale := (v/u)*w.scale
  weight := v*w.weight
  chord_ne := w.chord_ne
  relation := by
    ext i j
    have hr := congrFun (congrFun w.relation i) j
    simp [Units.val_div_eq_div_val] at hr ⊢
    rw [hr]
    field_simp
    try ring

/-- A projective change of coordinates leaves the transport coefficient
unchanged (when the same homogeneous representatives are pulled back). -/
def Witness.pull (Q R B C : Form K) (l : Vec K) (w : Witness Q R l) (hBC : B*C=1) :
    Witness (pullForm B Q) (pullForm B R) (pullLine B l) where
  scale := w.scale
  weight := w.weight
  chord_ne := (Contact.pull B C Q R hBC l (w.contact Q R l)).1
  relation := by
    simpa only [pull_combination, pull_square] using congrArg (pullForm B) w.relation

/-- The face curvature is independent of all four representative scales. -/
theorem face_gauge_invariant (a c e g u0 u1 u2 u3 : Kˣ) :
    ((u1/u0)*a)*((u3/u2)*e) / (((u1/u2)*c)*((u3/u0)*g)) = a*e/(c*g) := by
  apply Units.ext
  simp only [Units.val_div_eq_div_val, Units.val_mul]
  field_simp
  ring

/-- Four actual projective lines pass through one nonzero point. -/
def Concurrent4 (p r s t : Vec K) : Prop :=
  ∃ x : Vec K, x ≠ 0 ∧ pairing p x = 0 ∧ pairing r x = 0 ∧
    pairing s x = 0 ∧ pairing t x = 0

/-- Three independent rank-one squares cannot add to a singular form when all
three coefficients are nonzero. This identity is the quadratic rigidity step. -/
theorem det_three_squares (p r s : Vec K) (a b c : K) :
    (a • square p + b • square r + c • square s).det =
      a*b*c * (Classical.bracket p r s)^2 := by
  simp [Matrix.det_fin_three, square, Classical.bracket, Classical.pair, Classical.cross]
  ring

theorem det_single_square (p : Vec K) (a : K) : (a • square p).det = 0 := by
  simpa using rank_two_determinant p p a (0 : K)

private theorem bracket_of_four (p r s t : Vec K) (a b c d : K)
    (ha : a ≠ 0) (hb : b ≠ 0) (hc : c ≠ 0)
    (he : a • square p + b • square r + c • square s + d • square t = 0) :
    Classical.bracket p r s = 0 := by
  have h3 : a • square p + b • square r + c • square s = (-d) • square t := by
    ext i j
    have h := congrFun (congrFun he i) j
    simp at h ⊢
    linear_combination h
  have hdet := congrArg Matrix.det h3
  rw [det_three_squares, det_single_square] at hdet
  exact sq_eq_zero_iff.mp ((mul_eq_zero.mp hdet).resolve_left
    (mul_ne_zero (mul_ne_zero ha hb) hc))

/-- A nontrivial relation between four rank-one squares forces concurrence.
Only one specified pair of chord covectors is assumed independent. -/
theorem four_squares_concurrent (p r s t : Vec K) (a b c d : K)
    (ha : a ≠ 0) (hb : b ≠ 0) (hc : c ≠ 0) (hd : d ≠ 0)
    (hpr : Classical.cross p r ≠ 0)
    (he : a • square p + b • square r + c • square s + d • square t = 0) :
    Concurrent4 p r s t := by
  have hs := bracket_of_four p r s t a b c d ha hb hc he
  have he' : a • square p + b • square r + d • square t + c • square s = 0 := by
    simpa only [add_assoc, add_left_comm, add_comm] using he
  have ht := bracket_of_four p r t s a b d c ha hb hd he'
  refine ⟨Classical.cross p r, hpr, ?_, ?_, ?_, ?_⟩
  · change Classical.pair p (Classical.cross p r) = 0
    rw [Classical.pair_comm]
    exact Classical.cross_left_incident p r
  · change Classical.pair r (Classical.cross p r) = 0
    rw [Classical.pair_comm]
    exact Classical.cross_right_incident p r
  · change Classical.pair s (Classical.cross p r) = 0
    rw [Classical.pair_comm]
    exact hs
  · change Classical.pair t (Classical.cross p r) = 0
    rw [Classical.pair_comm]
    exact ht

/-- Orientation: positive edges 0→1 and 2→3, negative edges 2→1 and 0→3. -/
theorem face_balance (Q0 Q1 Q2 Q3 : Form K) (p r s t : Vec K)
    (a b c d e f g h : K)
    (h01 : Q1 = a • Q0 + b • square p)
    (h21 : Q1 = c • Q2 + d • square r)
    (h23 : Q3 = e • Q2 + f • square s)
    (h03 : Q3 = g • Q0 + h • square t) :
    (a*e-c*g) • Q0 + (b*e) • square p + (-d*e) • square r +
      (c*f) • square s + (-c*h) • square t = 0 := by
  ext i j
  have h1 := congrFun (congrFun h01 i) j
  have h2 := congrFun (congrFun h21 i) j
  have h3 := congrFun (congrFun h23 i) j
  have h4 := congrFun (congrFun h03 i) j
  simp at h1 h2 h3 h4 ⊢
  linear_combination -e*h1 + e*h2 - c*h3 + c*h4

theorem square_mulVec (l x : Vec K) :
    (square l).mulVec x = pairing l x • l := by
  ext i
  simp [square, pairing, Matrix.mulVec, dotProduct, Fin.sum_univ_three]
  ring

/-- Concurrence implies trivial contact holonomy. The concurrency point need
not lie off the base conic: nonsingularity is applied to its polar covector. -/
theorem concurrence_implies_balance (Q0 Q1 Q2 Q3 : Form K) (p r s t : Vec K)
    (a b c d e f g h : K) (hQ : Q0.det ≠ 0)
    (h01 : Q1 = a • Q0 + b • square p)
    (h21 : Q1 = c • Q2 + d • square r)
    (h23 : Q3 = e • Q2 + f • square s)
    (h03 : Q3 = g • Q0 + h • square t)
    (hc : Concurrent4 p r s t) : a*e = c*g := by
  obtain ⟨x,hx,hp,hr,hs,ht⟩ := hc
  have hmat := face_balance Q0 Q1 Q2 Q3 p r s t a b c d e f g h h01 h21 h23 h03
  have hv := congrArg (fun Q : Form K => Q.mulVec x) hmat
  simp only [Matrix.add_mulVec, Matrix.smul_mulVec_assoc, square_mulVec,
    hp, hr, hs, ht, zero_smul, smul_zero, add_zero, Matrix.zero_mulVec] at hv
  have hnon : Q0.mulVec x ≠ 0 := by
    intro hz
    apply hx
    have hinj : Function.Injective Q0.mulVec := Matrix.mulVec_injective_iff_isUnit.mpr
      ((Matrix.isUnit_iff_isUnit_det Q0).mpr (isUnit_iff_ne_zero.mpr hQ))
    apply hinj
    simpa using hz
  exact sub_eq_zero.mp ((smul_eq_zero.mp hv).resolve_right hnon)

/-- The exact local equivalence needed to turn scalar surface cancellation
into a theorem about conics. No face coherence is assumed in the witnesses. -/
theorem face_concurrent_iff (Q0 Q1 Q2 Q3 : Form K) (p r s t : Vec K)
    (hQ : Q0.det ≠ 0) (hpr : Classical.cross p r ≠ 0)
    (w01 : Witness Q0 Q1 p) (w21 : Witness Q2 Q1 r)
    (w23 : Witness Q2 Q3 s) (w03 : Witness Q0 Q3 t) :
    Concurrent4 p r s t ↔ w01.scale * w23.scale / (w21.scale * w03.scale) = 1 := by
  have hne : ((w21.scale : K)*(w03.scale : K)) ≠ 0 :=
    mul_ne_zero (Units.ne_zero _) (Units.ne_zero _)
  constructor
  · intro hc
    have he := concurrence_implies_balance Q0 Q1 Q2 Q3 p r s t
      _ _ _ _ _ _ _ _ hQ w01.relation w21.relation w23.relation w03.relation hc
    apply Units.ext
    simp only [Units.val_div_eq_div_val, Units.val_mul, Units.val_one]
    exact (div_eq_one_iff_eq hne).mpr he
  · intro hc
    have hval := congrArg (fun u : Kˣ => (u : K)) hc
    simp only [Units.val_div_eq_div_val, Units.val_mul, Units.val_one] at hval
    have he := (div_eq_one_iff_eq hne).mp hval
    have hmat := face_balance Q0 Q1 Q2 Q3 p r s t
      _ _ _ _ _ _ _ _ w01.relation w21.relation w23.relation w03.relation
    rw [he, sub_self, zero_smul, zero_add] at hmat
    exact four_squares_concurrent p r s t _ _ _ _
      (mul_ne_zero (Units.ne_zero _) (Units.ne_zero _))
      (mul_ne_zero (neg_ne_zero.mpr (Units.ne_zero _)) (Units.ne_zero _))
      (mul_ne_zero (Units.ne_zero _) (Units.ne_zero _))
      (mul_ne_zero (neg_ne_zero.mpr (Units.ne_zero _)) (Units.ne_zero _)) hpr hmat

end IncidenceCubes.Connection.ConicTransport
