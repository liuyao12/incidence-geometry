import IncidenceCubes.Classical.Basic

/-!
# Pappus, Desargues, their duals and the converse of Desargues

The two polynomial identities are Theorem 1 (P) and (D) of Roger D. Maddux,
*Formulas generalizing Pappus and Desargues*, arXiv:2011.12455.
They are proved by kernel-checked commutative-ring normalization, not assumed.
The geometric statements take arbitrary homogeneous coordinates. There is no
normal-form parametrization hypothesis. A zero cross product is not a projective
object: the certificate structures below retain the nonzero construction checks.
-/
namespace IncidenceCubes.Classical
set_option maxHeartbeats 8000000

section Ring
variable {K : Type*} [CommRing K]
/-- Unconditional polynomial identity underlying Pappus. -/
theorem pappus_identity (u v w x y z : Vec K) :
    bracket (cross (cross u y) (cross x v))
      (cross (cross w x) (cross z u)) (cross (cross v z) (cross y w)) =
    bracket v u x * bracket u w z * bracket w v y * bracket y x z +
    bracket x y v * bracket z x u * bracket y z w * bracket u w v := by
  simp [bracket, pair, cross]
  ring

/-- Unconditional polynomial identity underlying both directions of Desargues. -/
theorem desargues_identity (u v w x y z : Vec K) :
    bracket (cross (cross w u) (cross z x))
      (cross (cross u v) (cross x y)) (cross (cross v w) (cross y z)) =
    bracket x y z * bracket (cross u x) (cross v y) (cross w z) * bracket u v w := by
  simp [bracket, pair, cross]
  ring
end Ring

section Field
variable {K : Type*} [Field K]
/-- Pappus: two collinear triples yield three collinear cross-intersections. -/
theorem pappus (u v w x y z : Vec K)
    (hU : Collinear u v w) (hX : Collinear x y z) :
    Collinear (cross (cross u y) (cross x v))
      (cross (cross w x) (cross z u)) (cross (cross v z) (cross y w)) := by
  apply (collinear_iff_bracket _ _ _).mpr
  rw [pappus_identity]
  have hu := (collinear_iff_bracket u v w).mp hU
  have hx := (collinear_iff_bracket x y z).mp hX
  have hx' : bracket y x z = 0 := by
    rw [bracket_cyclic, bracket_swap, hx, neg_zero]
  rw [bracket_swap u v w, hu, neg_zero, hx']
  ring

/-- Dual Pappus: exchange point representatives and line covectors. -/
theorem dual_pappus (u v w x y z : Vec K)
    (hU : Concurrent u v w) (hX : Concurrent x y z) :
    Concurrent (cross (cross u y) (cross x v))
      (cross (cross w x) (cross z u)) (cross (cross v z) (cross y w)) := by
  apply (concurrent_iff_collinear _ _ _).mpr
  exact pappus u v w x y z
    ((concurrent_iff_collinear _ _ _).mp hU) ((concurrent_iff_collinear _ _ _).mp hX)

/-- Desargues, forward direction; the concurrency hypothesis is geometric. -/
theorem desargues (u v w x y z : Vec K)
    (h : Concurrent (cross u x) (cross v y) (cross w z)) :
    Collinear (cross (cross w u) (cross z x))
      (cross (cross u v) (cross x y)) (cross (cross v w) (cross y z)) := by
  apply (collinear_iff_bracket _ _ _).mpr
  rw [desargues_identity, (concurrent_iff_bracket _ _ _).mp h]
  ring

/-- Converse Desargues requires both triangles to be noncollinear. -/
theorem desargues_iff (u v w x y z : Vec K)
    (hU : ¬ Collinear u v w) (hX : ¬ Collinear x y z) :
    Concurrent (cross u x) (cross v y) (cross w z) ↔
    Collinear (cross (cross w u) (cross z x))
      (cross (cross u v) (cross x y)) (cross (cross v w) (cross y z)) := by
  have hu : bracket u v w ≠ 0 := fun h => hU ((collinear_iff_bracket _ _ _).mpr h)
  have hx : bracket x y z ≠ 0 := fun h => hX ((collinear_iff_bracket _ _ _).mpr h)
  rw [concurrent_iff_bracket, collinear_iff_bracket, desargues_identity]
  simp only [mul_eq_zero, hu, hx, false_or, or_false]

/-- Dual Desargues, useful without reconstructing vertices from their sides. -/
theorem dual_desargues (u v w x y z : Vec K)
    (h : Collinear (cross u x) (cross v y) (cross w z)) :
    Concurrent (cross (cross w u) (cross z x))
      (cross (cross u v) (cross x y)) (cross (cross v w) (cross y z)) := by
  apply (concurrent_iff_collinear _ _ _).mpr
  exact desargues u v w x y z ((concurrent_iff_collinear _ _ _).mpr h)

/-- Generic projective Pappus input, with all constructed points nonzero.
Nonzero cross-intersections also imply nonzero defining joins and endpoints. -/
structure PappusInput where
  u : Vec K
  v : Vec K
  w : Vec K
  x : Vec K
  y : Vec K
  z : Vec K
  firstLine : Collinear u v w
  secondLine : Collinear x y z
  firstPoint : cross (cross u y) (cross x v) ≠ 0
  secondPoint : cross (cross w x) (cross z u) ≠ 0
  thirdPoint : cross (cross v z) (cross y w) ≠ 0

/-- The conclusion contains a nonzero line and three nonzero incident points. -/
theorem PappusInput.conclusion (d : PappusInput (K := K)) :
    ∃ l : Vec K, l ≠ 0 ∧
      (cross (cross d.u d.y) (cross d.x d.v) ≠ 0 ∧
        pair l (cross (cross d.u d.y) (cross d.x d.v)) = 0) ∧
      (cross (cross d.w d.x) (cross d.z d.u) ≠ 0 ∧
        pair l (cross (cross d.w d.x) (cross d.z d.u)) = 0) ∧
      (cross (cross d.v d.z) (cross d.y d.w) ≠ 0 ∧
        pair l (cross (cross d.v d.z) (cross d.y d.w)) = 0) := by
  obtain ⟨l, hl, h1, h2, h3⟩ := pappus d.u d.v d.w d.x d.y d.z d.firstLine d.secondLine
  exact ⟨l, hl, ⟨d.firstPoint, h1⟩, ⟨d.secondPoint, h2⟩, ⟨d.thirdPoint, h3⟩⟩
end Field
end IncidenceCubes.Classical
