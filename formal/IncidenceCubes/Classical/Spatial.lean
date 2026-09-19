import IncidenceCubes.Classical.Basic
import IncidenceCubes.Penrose.Contact

/-! Algebra underlying the spatial illustrations. Rulings and polar incidence
are expressed in Segre coordinates; plane-section collinearity is generic.
The worked rank-one lift does not assert a global extrusion normal form. -/
namespace IncidenceCubes.Spatial
open Penrose.Normalization Penrose.Geometry
variable {K : Type*} [Field K]

def segre (u v : Fin 2 → K) : Fin 4 → K :=
  ![u 0*v 0,u 0*v 1,u 1*v 0,u 1*v 1]
def quadric (x : Fin 4 → K) : K := x 0*x 3-x 1*x 2
def polar (x y : Fin 4 → K) : K :=
  x 0*y 3+x 3*y 0-x 1*y 2-x 2*y 1

theorem segre_on_quadric (u v : Fin 2 → K) : quadric (segre u v)=0 := by
  simp [quadric,segre]; ring

theorem same_ruling_polar (u v w : Fin 2 → K) :
    polar (segre u v) (segre u w)=0 ∧ polar (segre u v) (segre w v)=0 := by
  constructor <;> simp [polar,segre] <;> ring

/-- The tangent plane at an off-diagonal ruling intersection contains
both diagonal ruling intersections H_i and H_j. -/
theorem dandelin_tangent_plane (u v r s : Fin 2 → K) :
    polar (segre u s) (segre u v)=0 ∧ polar (segre u s) (segre r s)=0 := by
  constructor <;> simp [polar,segre] <;> ring

def inSlice (h : K) (x : Vec K) : Fin 4 → K := ![x 0,x 1,h*x 2,x 2]
def planeValue (g x : Fin 4 → K) : K := g 0*x 0+g 1*x 1+g 2*x 2+g 3*x 3
def trace (h : K) (g : Fin 4 → K) : Vec K := ![g 0,g 1,h*g 2+g 3]

theorem trace_incidence (g : Fin 4 → K) (h : K) (x : Vec K) :
    Classical.pair (trace h g) x=planeValue g (inSlice h x) := by
  simp [Classical.pair,trace,planeValue,inSlice]; ring

/-- The Pascal line in the spatial argument is the trace of Γ in Π.
Nonzero trace excludes Γ=Π. The existence of Γ is separate input here. -/
theorem plane_section_collinear (g : Fin 4 → K) (h : K) (x y z : Vec K)
    (hg : trace h g ≠ 0)
    (hx : planeValue g (inSlice h x)=0) (hy : planeValue g (inSlice h y)=0)
    (hz : planeValue g (inSlice h z)=0) : Classical.Collinear x y z := by
  refine ⟨trace h g,hg,?_,?_,?_⟩ <;> rw [trace_incidence]
  · exact hx
  · exact hy
  · exact hz

/-- Coordinates in this algebraic lift are (x,y,w,z). -/
def lift (Q : Form K) : Matrix (Fin 4) (Fin 4) K :=
  !![Q 0 0,Q 0 1,Q 0 2,0;Q 1 0,Q 1 1,Q 1 2,0;
     Q 2 0,Q 2 1,Q 2 2,0;0,0,0,1]
def liftLine (l : Vec K) : Fin 4 → K := ![l 0,l 1,l 2,0]
def square4 (l : Fin 4 → K) : Matrix (Fin 4) (Fin 4) K := fun i j=>l i*l j

/-- A normalized rank-one conic difference lifts to a rank-one quadric
 difference, the contact-ring equation used by the 3D demonstration. -/
theorem lift_rank_one (Q R : Form K) (l : Vec K) (b : K)
    (h : R=Q+b • square l) : lift R=lift Q+b • square4 (liftLine l) := by
  ext i j
  fin_cases i <;> fin_cases j <;> simp [lift,liftLine,square4,h,square]
end IncidenceCubes.Spatial
