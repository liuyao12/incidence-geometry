import IncidenceCubes.Classical.Conics
import IncidenceCubes.Penrose.Contact
import Mathlib.FieldTheory.IsAlgClosed.Basic

/-! The short arguments used in the results-first exposition.
Salmon uses compatible square-root choices; these choices exist over an
algebraically closed field. The real illustration stays in a split branch.
The spatial lemmas express the plane-section argument and the worked lift,
not the complete eight-quadric extrusion theorem. -/
namespace IncidenceCubes.Presentation
open Penrose.Normalization Penrose.Geometry
variable {K : Type*} [Field K]

/-- The coefficient vector of the product of two line equations. -/
def linePair (l m : Vec K) : Fin 6 → K :=
  ![l 0*m 0, l 1*m 1, l 2*m 2, l 0*m 1+l 1*m 0,
    l 0*m 2+l 2*m 0, l 1*m 2+l 2*m 1]

theorem linePair_eval (l m x : Vec K) :
    Classical.conicEval (linePair l m) x = pairing l x * pairing m x := by
  simp [Classical.conicEval, linePair, pairing]; ring

theorem linePair_ne_zero (l m : Vec K) (hl : l ≠ 0) (hm : m ≠ 0) : linePair l m ≠ 0 := by
  intro h
  have h0 := congrFun h 0
  have h1 := congrFun h 1
  have h2 := congrFun h 2
  have h3 := congrFun h 3
  have h4 := congrFun h 4
  have h5 := congrFun h 5
  simp only [linePair, Matrix.cons_val_zero, Matrix.cons_val_one, Matrix.cons_val_two,
    Matrix.cons_val_three, Matrix.cons_val_four, Matrix.head_cons, Matrix.tail_cons,
    Pi.zero_apply] at h0 h1 h2 h3 h4 h5
  have hi : ∃ i : Fin 3, l i ≠ 0 := by
    by_contra hh
    apply hl
    funext i
    exact not_not.mp (not_exists.mp hh i)
  obtain ⟨i,hi⟩ := hi
  apply hm
  fin_cases i
  · change l 0 ≠ 0 at hi
    have m0 := (mul_eq_zero.mp h0).resolve_left hi
    have m1 : m 1=0 := by simpa [m0,hi] using h3
    have m2 : m 2=0 := by simpa [m0,hi] using h4
    funext j; fin_cases j <;> simp [m0,m1,m2]
  · change l 1 ≠ 0 at hi
    have m1 := (mul_eq_zero.mp h1).resolve_left hi
    have m0 : m 0=0 := by simpa [m1,hi] using h3
    have m2 : m 2=0 := by simpa [m1,hi] using h5
    funext j; fin_cases j <;> simp [m0,m1,m2]
  · change l 2 ≠ 0 at hi
    have m2 := (mul_eq_zero.mp h2).resolve_left hi
    have m0 : m 0=0 := by simpa [m2,hi] using h4
    have m1 : m 1=0 := by simpa [m2,hi] using h5
    funext j; fin_cases j <;> simp [m0,m1,m2]

/-- Pappus's line-pair specialization, with Pascal's hexagon order retained. -/
theorem pappus_via_pascal (a b c d e f l m : Vec K) (hl : l ≠ 0) (hm : m ≠ 0)
    (h : ∀ x ∈ ({a,b,c,d,e,f} : Set (Vec K)), pairing l x=0 ∨ pairing m x=0) :
    Classical.Collinear (Classical.pascalX a b d e)
      (Classical.pascalX b c e f) (Classical.pascalX c d f a) := by
  apply Classical.pascal
  have on (x : Vec K) (hx : x ∈ ({a,b,c,d,e,f} : Set (Vec K))) :
      Classical.conicEval (linePair l m) x=0 := by
    rw [linePair_eval]
    exact mul_eq_zero.mpr (h x hx)
  exact ⟨linePair l m,linePair_ne_zero l m hl hm,
    on a (by simp),on b (by simp),on c (by simp),on d (by simp),on e (by simp),on f (by simp)⟩

/-- Recover a squared contact increment from arbitrary proper contact data.
This uses a square root, not a supplied principal-minor parametrization. -/
theorem contact_split_normalization [IsAlgClosed K] (Q R : Form K) (l : Vec K)
    (h : Contact Q R l) :
    ∃ a : K, ∃ p : Vec K, a ≠ 0 ∧ p ≠ 0 ∧ R = a • (Q-square p) := by
  obtain ⟨hl,a,b,ha,hb,he⟩ := h
  obtain ⟨s,hs⟩ := IsAlgClosed.exists_pow_nat_eq (-b/a) (by decide : 0<2)
  have hs0 : s ≠ 0 := by
    intro hz
    rw [hz,zero_pow (by decide : 2≠0)] at hs
    exact (div_ne_zero (neg_ne_zero.mpr hb) ha) hs.symm
  refine ⟨a,s • l,ha,smul_ne_zero hs0 hl,?_⟩
  rw [he]
  ext i j
  simp [square]
  have hab : a*s^2 = -b := by rw [hs]; field_simp; ring
  linear_combination (l i*l j)*hab

/-- Compatible Salmon chords: their covectors are successive differences. -/
theorem salmon_concurrence (p r s : Vec K) :
    Classical.Concurrent (p-r) (r-s) (s-p) := by
  rw [Classical.concurrent_iff_bracket]
  simp [Classical.bracket, Classical.pair, Classical.cross]; ring

theorem salmon_factor (Q : Form K) (p r x : Vec K) :
    value (Q-square p) x-value (Q-square r) x =
      pairing (r-p) x * pairing (r+p) x := by
  simp [value, pairing, square, Matrix.mulVec, dotProduct, Fin.sum_univ_three]; ring

/-- Each chosen Salmon chord carries common points of the corresponding
conics. In the dual plane these points are common tangent lines. -/
theorem salmon_common_section (Q : Form K) (p r x : Vec K)
    (hq : value (Q-square p) x=0) (hx : pairing (p-r) x=0) :
    value (Q-square r) x=0 := by
  have hr : pairing (r-p) x=0 := by
    simp only [pairing,Pi.sub_apply] at hx ⊢
    linear_combination -hx
  have h := salmon_factor Q p r x
  rw [hq,hr,zero_mul] at h
  exact neg_eq_zero.mp (by simpa using h)

/-- Salmon from arbitrary contact with a common carrier, in a split field.
The conclusion chooses compatible chords and proves their concurrency and
common-section property. Distinctness of their intersections is geometric
admissibility; it is not asserted over every base field. -/
theorem salmon_from_contacts [IsAlgClosed K] (Q : Form K) (R : Fin 3 → Form K)
    (l : Fin 3 → Vec K) (hc : ∀ i, Contact Q (R i) (l i)) :
    ∃ a : Fin 3 → K, ∃ p : Fin 3 → Vec K,
      (∀ i, a i ≠ 0 ∧ p i ≠ 0 ∧ R i=a i • (Q-square (p i))) ∧
      Classical.Concurrent (p 0-p 1) (p 1-p 2) (p 2-p 0) ∧
      ∀ i j x, value (R i) x=0 → pairing (p i-p j) x=0 → value (R j) x=0 := by
  choose a p ha hp he using fun i => contact_split_normalization Q (R i) (l i) (hc i)
  refine ⟨a,p,fun i=>⟨ha i,hp i,he i⟩,salmon_concurrence _ _ _,?_⟩
  intro i j x hix hij
  have scaled (t : Fin 3) : value (R t) x=a t*value (Q-square (p t)) x := by
    rw [he t]
    simpa using value_combination (Q-square (p t)) (0 : Form K) (a t) (0 : K) x
  rw [scaled i] at hix
  have hi := (mul_eq_zero.mp hix).resolve_left (ha i)
  rw [scaled j, salmon_common_section Q (p i) (p j) x hi hij, mul_zero]
end IncidenceCubes.Presentation
