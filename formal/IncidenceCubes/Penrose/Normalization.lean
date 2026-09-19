import IncidenceCubes.Penrose.Algebra
import Mathlib.LinearAlgebra.Matrix.NonsingularInverse

/-!
# Recovering a Penrose face from contact data

This module goes in the reverse direction to Algebra.lean: its inputs are
quadratic equations and contact witnesses, not conics generated from parameters.
The extra open conditions are displayed in the theorem statements.
-/
namespace IncidenceCubes.Penrose.Normalization
variable {K : Type*} [Field K]

/-- Two rank-one conditions determine an invertible binary quadratic block.
The excluded zero block would make the opposite conic equal to the base. -/
theorem binary_normal_form (A B C d e : K) (hd : d ≠ 0) (he : e ≠ 0)
    (h1 : (A + 1 / d) * C = B ^ 2)
    (h2 : A * (C + 1 / e) = B ^ 2)
    (hn : A ≠ 0 ∨ B ≠ 0 ∨ C ≠ 0) :
    ∃ a : K, D2 d e a ≠ 0 ∧
      D2 d e a * A = -e ∧ D2 d e a * B = a ∧ D2 d e a * C = -d := by
  let t := A * C - B ^ 2
  have htC : d * t = -C := by
    dsimp [t]
    field_simp at h1
    linear_combination h1
  have htA : e * t = -A := by
    dsimp [t]
    field_simp at h2
    linear_combination h2
  have ht : t ≠ 0 := by
    intro hz
    have hA : A = 0 := by rw [hz] at htA; simpa using htA.symm
    have hC : C = 0 := by rw [hz] at htC; simpa using htC.symm
    have hB : B = 0 := by
      have hb : B ^ 2 = 0 := by simpa [t, hA, hC] using congrArg Neg.neg hz
      exact sq_eq_zero_iff.mp hb
    rcases hn with ha | hb | hc
    · exact ha hA
    · exact hb hB
    · exact hc hC
  have hA : A = -e * t := by linear_combination htA
  have hC : C = -d * t := by linear_combination htC
  have hs : B ^ 2 = d * e * t ^ 2 - t := by
    calc
      B ^ 2 = A * C - t := by dsimp [t]; ring
      _ = d * e * t ^ 2 - t := by rw [hA, hC]; ring
  have hD : D2 d e (B / t) = 1 / t := by
    dsimp [D2]
    field_simp
    rw [hs]
    ring
  refine ⟨B / t, ?_, ?_, ?_, ?_⟩
  · rw [hD]; exact div_ne_zero one_ne_zero ht
  · rw [hD]; field_simp
    linear_combination htA
  · rw [hD]; ring
  · rw [hD]; field_simp
    linear_combination htC


abbrev Vec (K : Type*) := Fin 3 → K
abbrev Form (K : Type*) := Matrix (Fin 3) (Fin 3) K

def square (p : Vec K) : Form K := fun i j => p i * p j
def mixed (p r : Vec K) : Form K := fun i j => p i * r j + r i * p j
def axis (i : Fin 3) : Vec K := fun j => if j = i then 1 else 0

def single (Q : Form K) (p : Vec K) (d : K) : Form K := Q - (1 / d) • square p

def double (Q : Form K) (p r : Vec K) (d e a : K) : Form K :=
  (D2 d e a) • Q - e • square p + a • mixed p r - d • square r

/-- The projective pencil contains the nonzero double line p². The coefficients
are nonzero; ordinary two-point tangency requires a transverse chord section. -/
def Contact (Q R : Form K) (p : Vec K) : Prop :=
  p ≠ 0 ∧ ∃ a b : K, a ≠ 0 ∧ b ≠ 0 ∧ R = a • Q + b • square p

def Proportional (Q R : Form K) : Prop := ∃ a : K, a ≠ 0 ∧ R = a • Q

theorem square_add (p r : Vec K) (a b : K) :
    square (a • p + b • r) = a ^ 2 • square p + (a*b) • mixed p r + b ^ 2 • square r := by
  ext i j; simp [square, mixed]; ring

private theorem exhaust (i j k : Fin 3) (hij : i ≠ j) (hik : i ≠ k) (hjk : j ≠ k)
    (x : Fin 3) : x = i ∨ x = j ∨ x = k := by omega

private theorem span_of_zero (u : Vec K) (i j k : Fin 3)
    (hij : i ≠ j) (hik : i ≠ k) (hjk : j ≠ k) (hu : u k = 0) :
    u = u i • axis i + u j • axis j := by
  ext x
  rcases exhaust i j k hij hik hjk x with rfl | rfl | rfl
  · simp [axis, hij]
  · simp [axis, hij, Ne.symm hij]
  · simp [axis, Ne.symm hik, Ne.symm hjk, hu]

private theorem block_injective (i j : Fin 3) (hij : i ≠ j) (A B C D E F : K)
    (h : A • square (axis (K := K) i) + B • mixed (axis (K := K) i) (axis (K := K) j) + C • square (axis (K := K) j) =
         D • square (axis (K := K) i) + E • mixed (axis (K := K) i) (axis (K := K) j) + F • square (axis (K := K) j)) :
    A = D ∧ B = E ∧ C = F := by
  have h1 := congrFun (congrFun h i) i
  have h2 := congrFun (congrFun h i) j
  have h3 := congrFun (congrFun h j) j
  simp [square, mixed, axis, hij, Ne.symm hij] at h1 h2 h3
  exact ⟨h1,h2,h3⟩

/-- A complete face is normalized from its two given upper contacts. The
concurrence point is the coordinate point k; its being off Q is explicit.
No double-form parameter is supplied in the hypotheses. -/
theorem face_normal_form (Q R : Form K) (i j k : Fin 3)
    (hij : i ≠ j) (hik : i ≠ k) (hjk : j ≠ k)
    (d e : K) (hd : d ≠ 0) (he : e ≠ 0)
    (u v : Vec K) (hu : u k = 0) (hv : v k = 0)
    (hQ : Q k k ≠ 0) (hR : ¬ Proportional Q R)
    (cu : Contact (single Q (axis (K := K) i) d) R u)
    (cv : Contact (single Q (axis (K := K) j) e) R v) :
    ∃ a s : K, s ≠ 0 ∧ D2 d e a ≠ 0 ∧
      R = s • double Q (axis (K := K) i) (axis (K := K) j) d e a := by
  obtain ⟨_, a, b, ha, hb, hru⟩ := cu
  obtain ⟨_, c, f, hc, hf, hrv⟩ := cv
  have hac : a = c := by
    have h := congrArg (fun T : Form K => T k k) (hru.symm.trans hrv)
    simp [single, square, axis, Ne.symm hik, Ne.symm hjk, hu, hv] at h
    exact h.resolve_right hQ
  subst c
  have eu := span_of_zero u i j k hij hik hjk hu
  have ev := span_of_zero v i j k hij hik hjk hv
  let A := -1/d + (b/a) * u i ^ 2
  let B := (b/a) * u i * u j
  let C := (b/a) * u j ^ 2
  let D := (f/a) * v i ^ 2
  let E := (f/a) * v i * v j
  let F := -1/e + (f/a) * v j ^ 2
  have repu : (1/a) • R = Q +
      (A • square (axis (K := K) i) + B • mixed (axis (K := K) i) (axis (K := K) j) + C • square (axis (K := K) j)) := by
    rw [hru, eu, square_add]
    ext x y
    simp [single, A, B, C]
    field_simp
    ring
  have repv : (1/a) • R = Q +
      (D • square (axis (K := K) i) + E • mixed (axis (K := K) i) (axis (K := K) j) + F • square (axis (K := K) j)) := by
    rw [hrv, ev, square_add]
    ext x y
    simp [single, D, E, F]
    field_simp
    ring
  have coeff := block_injective i j hij A B C D E F
    (add_left_cancel (repu.symm.trans repv))
  have h1 : (A + 1/d)*C = B^2 := by dsimp [A,B,C]; ring
  have h2 : A*(C+1/e) = B^2 := by
    rw [coeff.1, coeff.2.1, coeff.2.2]
    dsimp [D,E,F]; ring
  have hn : A ≠ 0 ∨ B ≠ 0 ∨ C ≠ 0 := by
    by_contra h
    push_neg at h
    have hz : (1/a) • R = Q := by simpa [h.1,h.2.1,h.2.2] using repu
    apply hR
    refine ⟨a, ha, ?_⟩
    have hh := congrArg (fun T : Form K => a • T) hz
    simpa [smul_smul, ha] using hh
  obtain ⟨r, hr, hA, hB, hC⟩ := binary_normal_form A B C d e hd he h1 h2 hn
  refine ⟨r, a / D2 d e r, div_ne_zero ha hr, hr, ?_⟩
  have scaled : (D2 d e r / a) • R = double Q (axis (K := K) i) (axis (K := K) j) d e r := by
    have hh := congrArg (fun T : Form K => D2 d e r • T) repu
    simp only [smul_add, smul_smul, ← div_eq_mul_inv, hA, hB, hC] at hh
    simpa only [double, div_eq_mul_inv, one_div, neg_smul, sub_eq_add_neg, add_assoc, one_mul] using hh
  have hh := congrArg (fun T : Form K => (a / D2 d e r) • T) scaled
  simpa [smul_smul, ha, hr] using hh

end IncidenceCubes.Penrose.Normalization
