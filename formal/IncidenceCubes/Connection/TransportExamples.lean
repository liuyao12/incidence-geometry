import IncidenceCubes.Connection.ConicTransport

/-! An exact regular contact square with nontrivial holonomy.
This proves that face concurrence is NOT automatic from its four contact edges.
The matrices are rational; no square roots or numerical oracle occur. -/
namespace IncidenceCubes.Connection.TransportExamples
open Penrose.Normalization Penrose.Geometry ConicTransport

def Q0 : Form ℚ := !![-20,-16,14; -16,-8,12; 14,12,-11]
def Q1 : Form ℚ := !![-20,-16,14; -16,-12,14; 14,14,-12]
def Q2 : Form ℚ := !![-12,-8,6; -8,-4,6; 6,6,-4]
def Q3 : Form ℚ := !![-12,-8,6; -8,-4,6; 6,6,-6]
def p : Vec ℚ := ![0,-2,1]
def r : Vec ℚ := ![2,2,-2]
def s : Vec ℚ := ![0,0,-1]
def t : Vec ℚ := ![-2,0,-1]

def w01 : Witness Q0 Q1 p where
  scale := 1
  weight := -1
  chord_ne := by intro hz; have h := congrFun hz 2; change (1:ℚ)=0 at h; norm_num at h
  relation := by ext i j; fin_cases i <;> fin_cases j <;> norm_num [Q0,Q1,p,square]

def w21 : Witness Q2 Q1 r where
  scale := 1
  weight := Units.mk0 (-2 : ℚ) (by norm_num)
  chord_ne := by intro hz; have h := congrFun hz 0; norm_num [r] at h
  relation := by ext i j; fin_cases i <;> fin_cases j <;> norm_num [Q1,Q2,r,square]

def w23 : Witness Q2 Q3 s where
  scale := 1
  weight := Units.mk0 (-2 : ℚ) (by norm_num)
  chord_ne := by intro hz; have h := congrFun hz 2; change (-1:ℚ)=0 at h; norm_num at h
  relation := by ext i j; fin_cases i <;> fin_cases j <;> norm_num [Q2,Q3,s,square]

def w03 : Witness Q0 Q3 t where
  scale := Units.mk0 (1/2 : ℚ) (by norm_num)
  weight := Units.mk0 (-1/2 : ℚ) (by norm_num)
  chord_ne := by intro hz; have h := congrFun hz 0; norm_num [t] at h
  relation := by ext i j; fin_cases i <;> fin_cases j <;> norm_num [Q0,Q3,t,square]

theorem all_regular : Q0.det ≠ 0 ∧ Q1.det ≠ 0 ∧ Q2.det ≠ 0 ∧ Q3.det ≠ 0 := by
  simp only [Matrix.det_fin_three]
  change ((-20:ℚ)*(-8)*(-11) - (-20)*(12)*(12) - (-16)*(-16)*(-11) + (-16)*(12)*(14) + (14)*(-16)*(12) - (14)*(-8)*(14)) ≠ 0 ∧
    ((-20:ℚ)*(-12)*(-12) - (-20)*(14)*(14) - (-16)*(-16)*(-12) + (-16)*(14)*(14) + (14)*(-16)*(14) - (14)*(-12)*(14)) ≠ 0 ∧
    ((-12:ℚ)*(-4)*(-4) - (-12)*(6)*(6) - (-8)*(-8)*(-4) + (-8)*(6)*(6) + (6)*(-8)*(6) - (6)*(-4)*(6)) ≠ 0 ∧
    ((-12:ℚ)*(-4)*(-6) - (-12)*(6)*(6) - (-8)*(-8)*(-6) + (-8)*(6)*(6) + (6)*(-8)*(6) - (6)*(-4)*(6)) ≠ 0
  norm_num

theorem all_symmetric : ∀ n : Fin 4, ∀ i j : Fin 3,
    (![Q0,Q1,Q2,Q3] n) i j = (![Q0,Q1,Q2,Q3] n) j i := by
  intro n i j; fin_cases n <;> fin_cases i <;> fin_cases j <;> rfl

theorem all_contacts : Contact Q0 Q1 p ∧ Contact Q2 Q1 r ∧ Contact Q2 Q3 s ∧ Contact Q0 Q3 t :=
  ⟨w01.contact _ _ _, w21.contact _ _ _, w23.contact _ _ _, w03.contact _ _ _⟩

theorem nontrivial_transport :
    ((w01.scale * w23.scale / (w21.scale * w03.scale) : ℚˣ) : ℚ) = 2 := by
  norm_num [w01,w21,w23,w03,Units.val_div_eq_div_val]

theorem not_concurrent : ¬ Concurrent4 p r s t := by
  have hi : Classical.cross p r ≠ 0 := by
    intro hz; have h := congrFun hz 0; change ((-2:ℚ)*(-2)-1*2)=0 at h; norm_num at h
  intro hc
  have he := (face_concurrent_iff Q0 Q1 Q2 Q3 p r s t all_regular.1 hi w01 w21 w23 w03).mp hc
  have hu := congrArg (fun u : ℚˣ => (u : ℚ)) he
  dsimp only at hu
  rw [nontrivial_transport, Units.val_one] at hu
  norm_num at hu

end IncidenceCubes.Connection.TransportExamples
