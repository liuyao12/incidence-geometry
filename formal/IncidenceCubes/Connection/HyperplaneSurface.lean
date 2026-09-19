import IncidenceCubes.Connection.GeometricSurface

/-! The original point/hyperplane interpretation in an arbitrary vector space.
Face coherence means that the projective join of the two points meets the two
hyperplanes simultaneously. No parametrization or chosen intersection is input. -/
namespace IncidenceCubes.Connection.HyperplaneSurface
open GeometricSurface
variable {K V : Type*} [Field K] [AddCommGroup V] [Module K V]

/-- An explicit two-vector independence condition, independent of a chosen basis. -/
def IndependentPair (A B : V) : Prop :=
  ∀ a b : K, a • A + b • B = 0 → a = 0 ∧ b = 0

/-- The projective join AB intersects the projective intersection of ker l and ker m. -/
def Coherent (A B : V) (l m : V →ₗ[K] K) : Prop :=
  ∃ x : V, x ≠ 0 ∧ (∃ a b : K, x = a • A + b • B) ∧ l x = 0 ∧ m x = 0

/-- A genuine geometric equivalence, valid without any finite-dimensional
ambient-space hypothesis. The four nonincidences of a tile supply hlA. -/
theorem coherent_iff_minor (A B : V) (l m : V →ₗ[K] K)
    (hAB : IndependentPair (K := K) A B) (hlA : l A ≠ 0) :
    Coherent A B l m ↔ l A * m B - l B * m A = 0 := by
  constructor
  · rintro ⟨x,hx,⟨a,b,hrep⟩,hl,hm⟩
    rw [hrep] at hl hm
    simp only [map_add, map_smul, smul_eq_mul] at hl hm
    have hb : b ≠ 0 := by
      intro hz
      have ha : a = 0 := by
        rw [hz, zero_mul, add_zero] at hl
        exact (mul_eq_zero.mp hl).resolve_right hlA
      apply hx
      simp [hrep, ha, hz]
    have hminor : b * (l A * m B - l B * m A) = 0 := by
      linear_combination l A * hm - m A * hl
    exact (mul_eq_zero.mp hminor).resolve_left hb
  · intro hm
    let x := l B • A - l A • B
    have hx : x ≠ 0 := by
      intro hz
      have hi := hAB (l B) (-(l A)) (by simpa only [x, neg_smul, sub_eq_add_neg] using hz)
      exact hlA (neg_eq_zero.mp hi.2)
    refine ⟨x,hx,⟨l B,-l A,by simp [x, sub_eq_add_neg]⟩,?_,?_⟩
    · simp only [x, map_sub, map_smul, smul_eq_mul]; ring
    · simp only [x, map_sub, map_smul, smul_eq_mul]
      linear_combination -hm

structure Net {F E B W : Type*} (T : Tiling F E B W) where
  point : B → V
  hyperplane : W → (V →ₗ[K] K)
  nonincident : ∀ e, hyperplane (T.white e) (point (T.black e)) ≠ 0
  independent_points : ∀ f, IndependentPair (K := K) (point (T.faceBlack f 0)) (point (T.faceBlack f 1))

variable {F E B W : Type*}

def Net.edgeWeight {T : Tiling F E B W} (N : Net (K := K) (V := V) T) (e : E) : Kˣ :=
  Units.mk0 (N.hyperplane (T.white e) (N.point (T.black e))) (N.nonincident e)

def Net.CoherentFace {T : Tiling F E B W} (N : Net (K := K) (V := V) T) (f : F) : Prop :=
  Coherent (N.point (T.faceBlack f 0)) (N.point (T.faceBlack f 1))
    (N.hyperplane (T.faceWhite f 0)) (N.hyperplane (T.faceWhite f 1))

theorem Net.weight_val {T : Tiling F E B W} (N : Net (K := K) (V := V) T) (e : E) :
    (N.edgeWeight e : K) = N.hyperplane (T.white e) (N.point (T.black e)) := rfl

theorem Net.coherent_iff_weight {T : Tiling F E B W} (N : Net (K := K) (V := V) T) (f : F) :
    N.CoherentFace f ↔ Fomin.faceWeight T.slots N.edgeWeight f = 1 := by
  have rev0 : Fin.rev (0 : Fin 2) = 1 := by decide
  have rev1 : Fin.rev (1 : Fin 2) = 0 := by decide
  have ha := N.nonincident (T.slots.positive (f,0))
  have hb := N.nonincident (T.slots.negative (f,0))
  have hc := N.nonincident (T.slots.negative (f,1))
  simp only [T.positive_black,T.positive_white] at ha
  simp only [T.negative_black,T.negative_white,rev0,rev1] at hb hc
  have hval : ((Fomin.faceWeight T.slots N.edgeWeight f : Kˣ) : K) =
      (N.hyperplane (T.faceWhite f 0) (N.point (T.faceBlack f 0)) *
        N.hyperplane (T.faceWhite f 1) (N.point (T.faceBlack f 1))) /
      (N.hyperplane (T.faceWhite f 0) (N.point (T.faceBlack f 1)) *
        N.hyperplane (T.faceWhite f 1) (N.point (T.faceBlack f 0))) := by
    simp only [Fomin.faceWeight, Fin.prod_univ_two, Units.val_div_eq_div_val,
      Units.val_mul, Net.weight_val, T.positive_black, T.positive_white,
      T.negative_black,T.negative_white,rev0,rev1]
  have h := coherent_iff_minor _ _ _ (N.hyperplane (T.faceWhite f 1)) (N.independent_points f) ha
  constructor
  · intro hf
    apply Units.ext
    rw [hval, Units.val_one]
    exact (div_eq_one_iff_eq (mul_ne_zero hb hc)).mpr (sub_eq_zero.mp (h.mp hf))
  · intro hf
    apply h.mpr
    have hunit := congrArg (fun u : Kˣ => (u : K)) hf
    dsimp only at hunit
    rw [hval, Units.val_one] at hunit
    exact sub_eq_zero.mpr ((div_eq_one_iff_eq (mul_ne_zero hb hc)).mp hunit)

/-- The point/hyperplane surface theorem in arbitrary projective dimension,
using precisely the same tiling and cancellation theorem as the conic model. -/
theorem hyperplane_surface_last_face [Fintype F] [Fintype E]
    (T : Tiling F E B W) (N : Net (K := K) (V := V) T) (missing : F)
    (h : ∀ f, f ≠ missing → N.CoherentFace f) : N.CoherentFace missing := by
  apply (N.coherent_iff_weight missing).mpr
  apply Fomin.last_face T.slots N.edgeWeight missing
  intro f hf
  exact (N.coherent_iff_weight f).mp (h f hf)

end IncidenceCubes.Connection.HyperplaneSurface
