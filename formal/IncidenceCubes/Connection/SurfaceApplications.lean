import IncidenceCubes.Connection.GeometricSurface
import IncidenceCubes.Penrose.Theorem

/-! Tangency-input and six-face instances of the new conic surface theorem.
The six-face instance concerns eight SUPPLIED conics and twelve contact edges;
it is not advertised as a proof of existence of the eighth conic. -/
namespace IncidenceCubes.Connection.SurfaceApplications
open Penrose.Normalization Penrose.Geometry Penrose.Theorem
open ConicTransport GeometricSurface
variable {F E B W K : Type*} [Field K]

/-- A surface of conics supplied by two distinct tangent points on every edge.
No scalar contact weights and no face-coherence equations are supplied. -/
structure TangencyNet (T : Tiling F E B W) where
  two_ne : (2 : K) ≠ 0
  blackForm : B → Form K
  whiteForm : W → Form K
  black_symmetric : ∀ v i j, blackForm v i j = blackForm v j i
  white_symmetric : ∀ v i j, whiteForm v i j = whiteForm v j i
  black_regular : ∀ v, (blackForm v).det ≠ 0
  white_regular : ∀ v, (whiteForm v).det ≠ 0
  chord : E → Vec K
  tangencies : ∀ e, TwoPointContact (blackForm (T.black e)) (whiteForm (T.white e)) (chord e)
  distinct_chords : ∀ f,
    Classical.cross (chord (T.slots.positive (f,0))) (chord (T.slots.negative (f,0))) ≠ 0

def TangencyNet.toConicNet {T : Tiling F E B W} (N : TangencyNet (K := K) T) : ConicNet (K := K) T where
  blackForm := N.blackForm
  whiteForm := N.whiteForm
  black_symmetric := N.black_symmetric
  white_symmetric := N.white_symmetric
  black_regular := N.black_regular
  white_regular := N.white_regular
  chord := N.chord
  contact := fun e => TwoPointContact.to_contact _ _ _ (N.black_regular _)
    (N.black_symmetric _) (N.white_symmetric _) (N.tangencies e)
  distinct_chords := N.distinct_chords

/-- End-to-end surface implication from ordinary two-point tangency data. -/
theorem conic_surface_from_tangencies [Fintype F] [Fintype E]
    (T : Tiling F E B W) (N : TangencyNet (K := K) T) (missing : F)
    (h : ∀ f, f ≠ missing → N.toConicNet.Coherent f) : N.toConicNet.Coherent missing :=
  conic_surface_last_face T N.toConicNet missing h

def cubeBlack : Fin 12 → Fin 8 := ![0,0,0,3,5,3,6,3,5,6,5,6]
def cubeWhite : Fin 12 → Fin 8 := ![1,2,4,1,1,2,2,7,4,4,7,7]
def cubeFaceBlack : Fin 6 → Fin 2 → Fin 8 := ![![0,3],![6,5],![0,5],![3,6],![0,6],![5,3]]
def cubeFaceWhite : Fin 6 → Fin 2 → Fin 8 := ![![1,2],![7,4],![4,1],![7,2],![2,4],![7,1]]

/-- Actual cube vertex/edge incidence added to the previously checked surface
certificate. Unused vertices in each color's Fin 8 index type are harmless. -/
noncomputable def cubeTiling : Tiling (Fin 6) (Fin 12) (Fin 8) (Fin 8) where
  slots := Fomin.cube
  black := cubeBlack
  white := cubeWhite
  faceBlack := cubeFaceBlack
  faceWhite := cubeFaceWhite
  positive_black := by intro f i; fin_cases f <;> fin_cases i <;> rfl
  positive_white := by intro f i; fin_cases f <;> fin_cases i <;> rfl
  negative_black := by intro f i; fin_cases f <;> fin_cases i <;> rfl
  negative_white := by intro f i; fin_cases f <;> fin_cases i <;> rfl

/-- Penrose face compatibility: on a fully edge-contacting cube, concurrence
on five faces forces concurrence on the sixth. This is not seven-to-eight
vertex existence; the net already supplies all eight conics. -/
theorem conic_cube_five_faces (N : ConicNet (K := K) cubeTiling) (missing : Fin 6)
    (h : ∀ f, f ≠ missing → N.Coherent f) : N.Coherent missing :=
  conic_surface_last_face cubeTiling N missing h

/-- The identical tiling certificate also gives the Fomin point-line cube. -/
theorem point_line_cube_five_faces (N : PointLineNet (K := K) cubeTiling) (missing : Fin 6)
    (h : ∀ f, f ≠ missing → N.Coherent f) : N.Coherent missing :=
  point_line_surface_last_face cubeTiling N missing h

end IncidenceCubes.Connection.SurfaceApplications
