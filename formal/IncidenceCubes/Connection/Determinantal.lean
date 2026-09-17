import IncidenceCubes.Classical.Basic

/-!
# A common local determinantal calculus

The nonsymmetric Schur update is the M-system of Bobenko--Schief
(arXiv:1410.5794, equation (2.3)). Two eliminations commute when their pivots
exist. Its symmetric specialization produces the square in the Penrose contact
identity. A zero 2-by-2 minor gives Fomin--Pylyavskyy's local face coherence.
These local facts are NOT a reduction between the two complete geometric
master theorems: arbitrary-input realization and global gluing remain separate.
-/
namespace IncidenceCubes.Connection.Determinantal
section Ring
variable {K : Type*} [CommRing K]
def delta (d e a b : K) : K := d * e - a * b
def bordered (q u v r s d e a b : K) : K :=
  delta d e a b * q - e * u * r + a * u * s + b * v * r - d * v * s

/-- A nonsymmetric Desnanot--Jacobi exchange. The defect factors but need not
be a square. Here `bordered` is the determinant of [[q,u,v],[r,d,a],[s,b,e]]. -/
theorem exchange (q u v r s d e a b : K) :
    delta d e a b * (d * q - u * r) - d * bordered q u v r s d e a b =
      (d * v - a * u) * (d * s - b * r) := by
  unfold bordered delta; ring

theorem bordered_eq_det (q u v r s d e a b : K) :
    bordered q u v r s d e a b = Matrix.det !![q,u,v; r,d,a; s,b,e] := by
  simp [Matrix.det_fin_three, bordered, delta]; ring

/-- Symmetry identifies the two factors: the actual source of the square. -/
theorem symmetric_exchange (q u v d e a : K) :
    delta d e a a * (d * q - u ^ 2) - d * bordered q u v u v d e a a =
      (d * v - a * u) ^ 2 := by
  unfold bordered delta; ring
end Ring

section Field
variable {K : Type*} [Field K]

/-- Eliminate one scalar pivot in a bilinear matrix. No symmetry is assumed. -/
def pivot {ι : Type*} (M : ι → ι → K) (k : ι) : ι → ι → K :=
  fun i j => M i j - M i k * M k j / M k k

private theorem next_pivot (d e a b : K) (hd : d ≠ 0) :
    e - b * a / d = delta d e a b / d := by
  unfold delta; field_simp; ring

/-- Two-pivot reduction equals the bordered determinant divided by the pivot
block determinant, with every required nonzero condition exposed. -/
theorem eliminate_two (q u v r s d e a b : K)
    (hd : d ≠ 0) (hD : delta d e a b ≠ 0) :
    q - u * r / d - (v - u * a / d) * (s - b * r / d) / (e - b * a / d) =
      bordered q u v r s d e a b / delta d e a b := by
  rw [next_pivot d e a b hd]
  field_simp
  unfold bordered delta
  ring

/-- A concrete two-direction consistency theorem, not a assumed cube axiom. -/
theorem elimination_commutes (q u v r s d e a b : K)
    (hd : d ≠ 0) (he : e ≠ 0) (hD : delta d e a b ≠ 0) :
    q - u * r / d - (v - u * a / d) * (s - b * r / d) / (e - b * a / d) =
      q - v * s / e - (u - v * b / e) * (r - a * s / e) / (d - a * b / e) := by
  have hswap : delta e d b a = delta d e a b := by unfold delta; ring
  rw [eliminate_two q u v r s d e a b hd hD,
      eliminate_two q v u s r e d b a he (by rwa [hswap])]
  congr 1
  · unfold bordered delta; ring
  · exact hswap.symm

/-- The M-system consistency equation for an arbitrary matrix of coefficients. -/
theorem pivot_commutes {ι : Type*} (M : ι → ι → K) (k l : ι)
    (hk : M k k ≠ 0) (hl : M l l ≠ 0)
    (hkl : delta (M k k) (M l l) (M k l) (M l k) ≠ 0) :
    pivot (pivot M k) l = pivot (pivot M l) k := by
  funext i j
  exact elimination_commutes (M i j) (M i k) (M i l) (M k j) (M l j)
    (M k k) (M l l) (M k l) (M l k) hk hl hkl

theorem pivot_preserves_symmetry {ι : Type*} (M : ι → ι → K) (k : ι)
    (h : ∀ i j, M i j = M j i) :
    ∀ i j, pivot M k i j = pivot M k j i := by
  intro i j
  simp only [pivot]
  rw [h i j, h i k, h k j]
  ring

/-- A coherent Fomin face is a zero Schur complement of its pairing matrix.
For geometric tiles all FOUR edge pairings are nonzero; the fourth is not
needed for this purely algebraic equivalence. -/
theorem fomin_face_iff_zero_pivot (a b c d : K)
    (ha : a ≠ 0) (hb : b ≠ 0) (hc : c ≠ 0) :
    a * d / (b * c) = 1 ↔ d - c * b / a = 0 := by
  rw [div_eq_one_iff_eq (mul_ne_zero hb hc), sub_eq_zero, eq_div_iff ha]
  constructor <;> intro h <;> simpa [mul_comm] using h

/-- Retaining rather than discarding the 2-by-2 determinant defect. -/
theorem defect_ratio (a b c d : K) (hb : b ≠ 0) (hc : c ≠ 0) :
    a * d / (b * c) = 1 + (a * d - b * c) / (b * c) := by
  field_simp

/-- Naive noncommutative edge cancellation fails even on a one-face torus.
These are invertible determinant-one 2-by-2 rational matrices. -/
theorem torus_commutator_counterexample :
    ( !![(1 : ℚ),1;0,1] * !![1,0;1,1] * !![1,-1;0,1] * !![1,0;-1,1]) ≠
      (1 : Matrix (Fin 2) (Fin 2) ℚ) := by
  intro h
  have hh := congrArg (fun A : Matrix (Fin 2) (Fin 2) ℚ => A 0 0) h
  norm_num [Matrix.mul_apply, Fin.sum_univ_two] at hh
end Field
end IncidenceCubes.Connection.Determinantal
