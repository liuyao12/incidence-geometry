import IncidenceCubes.Penrose.Tangency

/-! Exact rational nonvacuity check for the generic geometric hypotheses.
No floating-point calculations or external certificates are used. This example
uses pencil contact; it does not assert all contacts split over the reals. -/
namespace IncidenceCubes.Penrose.Examples
open Normalization Geometry GeometricSeven Completion Uniqueness

def base : Form ℚ := !![2,0,0;0,3,0;0,0,-1]
def first (i : Fin 3) : Form ℚ := base - square (axis i)
def second (f : Fin 3) : Form ℚ :=
  base - square (axis (leftIndex f)) - square (axis (rightIndex f))

private theorem axis_ne (i : Fin 3) : (axis i : Vec ℚ) ≠ 0 := by
  intro h
  have hh := congrFun h i
  simp [axis] at hh

private theorem initial (i : Fin 3) : Contact base (first i) (axis i) := by
  refine ⟨axis_ne i,1,-1,by norm_num,by norm_num,?_⟩
  simp [first,sub_eq_add_neg]

private theorem left (f : Fin 3) : Contact (first (leftIndex f)) (second f) (axis (rightIndex f)) := by
  refine ⟨axis_ne _,1,-1,by norm_num,by norm_num,?_⟩
  simp [first,second,sub_eq_add_neg]

private theorem right (f : Fin 3) : Contact (first (rightIndex f)) (second f) (axis (leftIndex f)) := by
  refine ⟨axis_ne _,1,-1,by norm_num,by norm_num,?_⟩
  ext i j; simp [first,second]; ring

private theorem distinct (f : Fin 3) : ¬ Proportional base (second f) := by
  rintro ⟨s,_,hs⟩
  have hu := congrFun (congrFun hs (otherIndex f)) (otherIndex f)
  have hv := congrFun (congrFun hs (leftIndex f)) (leftIndex f)
  fin_cases f <;>
    simp [base,second,axis,square,leftIndex,rightIndex,otherIndex,Matrix.cons_val_two] at hu hv <;>
    linarith

/-- Seven explicit regular rational conics and their nine actual chord forms. -/
def rationalSeven : Seven ℚ where
  two_ne := by norm_num
  base := base
  first := first
  second := second
  chord := axis
  upperLeft := fun f => axis (rightIndex f)
  upperRight := fun f => axis (leftIndex f)
  base_symmetric := by decide
  base_regular := by norm_num [base,Matrix.det_fin_three,Matrix.cons_val_two]
  first_regular := by
    intro i; fin_cases i <;> simp [first,base,axis,square,Matrix.det_fin_three,Matrix.cons_val_two] <;> norm_num
  second_regular := by
    intro f; fin_cases f <;> simp [second,base,axis,square,leftIndex,rightIndex,Matrix.det_fin_three,Matrix.cons_val_two] <;> norm_num
  independent := by simp [axis,Matrix.det_fin_three]
  initial_contact := initial
  left_contact := left
  right_contact := right
  face_off := by
    intro f
    refine ⟨axis (otherIndex f),axis_ne _,?_,?_,?_,?_,?_⟩ <;>
      fin_cases f <;> simp [value_axis,base,pairing,axis,leftIndex,rightIndex,otherIndex,Matrix.cons_val_two]
  opposite_distinct := distinct

/-- The extra geometric genericity hypothesis is satisfied, not inconsistent. -/
theorem rational_independent_faces : IndependentFacePoints rationalSeven := by
  refine ⟨axis,?_,?_⟩
  · simp [axis,Matrix.det_fin_three]
  · intro i; fin_cases i <;> simp [upperAt,rationalSeven,leftIndex,rightIndex,pairing,axis,Matrix.cons_val_two]

/-- Instantiation of the arbitrary-input theorem on actual rational data. -/
theorem rational_completion :
    ∃ T : Form ℚ, ∃ l : Fin 3 → Vec ℚ, Completes rationalSeven T l ∧
      ∀ U : Form ℚ, ∀ m : Fin 3 → Vec ℚ,
        Completes rationalSeven U m → Proportional T U :=
  penrose_generic rationalSeven rational_independent_faces

end IncidenceCubes.Penrose.Examples
