import IncidenceCubes.Connection.Determinantal
import IncidenceCubes.Penrose.Algebra
import IncidenceCubes.Fomin.Coherence

/-! Checked specializations into the EXISTING Penrose and Fomin APIs.
This is a local comparison, not a global geometric reduction. -/
namespace IncidenceCubes.Connection

/-- The existing Penrose middle-edge theorem follows from the nonsymmetric
exchange after imposing symmetry. This uses exactly its original statement. -/
theorem penrose_middle_via_symmetric_exchange {R : Type*} [CommRing R]
    (q p r d e a : R) :
    Penrose.D2 d e a * Penrose.F1 q p d - d * Penrose.F2 q p r d e a =
      (Penrose.L1 p r d a) ^ 2 := by
  have h := Determinantal.symmetric_exchange q p r d e a
  dsimp [Determinantal.bordered, Determinantal.delta] at h
  dsimp [Penrose.D2, Penrose.F1, Penrose.F2, Penrose.L1]
  linear_combination h

/-- An existing mixedRatio is coherent precisely when its pairing matrix has
zero Schur complement. Only the three algebraically needed nonzero pairings
are required here; an admissible geometric tile has all four nonzero. -/
theorem fomin_coherence_via_zero_pivot {K : Type*} [Field K]
    (A B l m : Fin 3 → K)
    (hlA : Fomin.dot3 l A ≠ 0) (hlB : Fomin.dot3 l B ≠ 0)
    (hmA : Fomin.dot3 m A ≠ 0) :
    Fomin.mixedRatio A B l m = 1 ↔
      Fomin.dot3 m B - Fomin.dot3 m A * Fomin.dot3 l B / Fomin.dot3 l A = 0 := by
  simpa [Fomin.mixedRatio, mul_comm] using
    Determinantal.fomin_face_iff_zero_pivot
      (Fomin.dot3 l A) (Fomin.dot3 l B) (Fomin.dot3 m A) (Fomin.dot3 m B) hlA hlB hmA

/-- Fomin's coordinate coherence conclusion uses the SAME collinearity
predicate as the independent classical baseline. -/
theorem fomin_coherence_iff_classical_collinear {K : Type*} [Field K]
    (A B l m : Fin 3 → K) (hmA : Fomin.dot3 m A ≠ 0) (hlB : Fomin.dot3 l B ≠ 0) :
    Fomin.mixedRatio A B l m = 1 ↔
      Classical.Collinear A B (Classical.cross l m) := by
  rw [Classical.collinear_iff_bracket]
  exact Fomin.ratio_one_iff_incident A B l m hmA hlB

end IncidenceCubes.Connection
