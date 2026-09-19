import IncidenceCubes.Penrose.Contact

/-!
# Seven arbitrary conics yield one compatible matrix normal form

The input records only the seven conics, nine contact chords, non-incidence of
face concurrence points with the base, and independence of the three initial
chords. It does not contain determinant parameters or a candidate eighth conic.
-/
namespace IncidenceCubes.Penrose.GeometricSeven
open Normalization Geometry
variable {K : Type*} [Field K]

def leftIndex : Fin 3 → Fin 3 := ![0,0,1]
def rightIndex : Fin 3 → Fin 3 := ![1,2,2]
def otherIndex : Fin 3 → Fin 3 := ![2,1,0]

private theorem indices_distinct (f : Fin 3) :
    leftIndex f ≠ rightIndex f ∧ leftIndex f ≠ otherIndex f ∧ rightIndex f ≠ otherIndex f := by
  fin_cases f <;> decide

/-- Homogeneous input representatives. Only the base needs an explicit
symmetry field: symmetry of every given neighbor follows from its contact. -/
structure Seven (K : Type*) [Field K] where
  two_ne : (2 : K) ≠ 0
  base : Form K
  first : Fin 3 → Form K
  second : Fin 3 → Form K
  chord : Fin 3 → Vec K
  upperLeft : Fin 3 → Vec K
  upperRight : Fin 3 → Vec K
  base_symmetric : ∀ i j, base i j = base j i
  base_regular : base.det ≠ 0
  first_regular : ∀ i, (first i).det ≠ 0
  second_regular : ∀ f, (second f).det ≠ 0
  independent : Matrix.det (chord : Form K) ≠ 0
  initial_contact : ∀ i, Contact base (first i) (chord i)
  left_contact : ∀ f, Contact (first (leftIndex f)) (second f) (upperLeft f)
  right_contact : ∀ f, Contact (first (rightIndex f)) (second f) (upperRight f)
  face_off : ∀ f, FaceOff base (chord (leftIndex f)) (chord (rightIndex f))
    (upperLeft f) (upperRight f)
  opposite_distinct : ∀ f, ¬ Proportional base (second f)

/-- Output of normalization, not an input assumption. Face order is 01,02,12. -/
structure NormalForm (S : Seven K) where
  diagonal : Vec K
  coupling : Vec K
  firstScale : Vec K
  secondScale : Vec K
  diagonal_ne : ∀ i, diagonal i ≠ 0
  firstScale_ne : ∀ i, firstScale i ≠ 0
  secondScale_ne : ∀ f, secondScale f ≠ 0
  minor_ne : ∀ f, D2 (diagonal (leftIndex f)) (diagonal (rightIndex f)) (coupling f) ≠ 0
  first_eq : ∀ i, S.first i = firstScale i • single S.base (S.chord i) (diagonal i)
  second_eq : ∀ f, S.second f = secondScale f •
    double S.base (S.chord (leftIndex f)) (S.chord (rightIndex f))
      (diagonal (leftIndex f)) (diagonal (rightIndex f)) (coupling f)

/-- All three face parameters are derived from the original geometric input.
This is the reverse-normalization step absent from the initial formal library. -/
theorem seven_normal_form (S : Seven K) : Nonempty (NormalForm S) := by
  have hfirst := fun i => initial_normal_form S.base (S.first i) (S.chord i) (S.initial_contact i)
  choose d a hd ha heq using hfirst
  let L : Form K := S.chord
  let B : Form K := L⁻¹
  have hunit : IsUnit L.det := isUnit_iff_ne_zero.mpr S.independent
  have hLB : L*B=1 := Matrix.mul_nonsing_inv L hunit
  have hBL : B*L=1 := Matrix.nonsing_inv_mul L hunit
  have hface (f : Fin 3) : ∃ c s : K, s ≠ 0 ∧
      D2 (d (leftIndex f)) (d (rightIndex f)) c ≠ 0 ∧
      S.second f = s • double S.base (S.chord (leftIndex f)) (S.chord (rightIndex f))
        (d (leftIndex f)) (d (rightIndex f)) c := by
    obtain ⟨hij,hik,hjk⟩ := indices_distinct f
    have hc1 := S.left_contact f
    have hc2 := S.right_contact f
    rw [heq] at hc1 hc2
    have hu := Contact.rescale_left _ _ _ _ (ha _) hc1
    have hv := Contact.rescale_left _ _ _ _ (ha _) hc2
    exact arbitrary_face_normal_form L B S.base (S.second f) hLB hBL
      (leftIndex f) (rightIndex f) (otherIndex f) hij hik hjk
      (d (leftIndex f)) (d (rightIndex f)) (hd _) (hd _)
      (S.upperLeft f) (S.upperRight f) (S.face_off f) (S.opposite_distinct f) hu hv
  choose c s hs hm hh using hface
  exact ⟨⟨d,c,a,s,hd,ha,hs,hm,heq,hh⟩⟩

noncomputable def Seven.normalForm (S : Seven K) : NormalForm S :=
  Classical.choice (seven_normal_form S)

end IncidenceCubes.Penrose.GeometricSeven
