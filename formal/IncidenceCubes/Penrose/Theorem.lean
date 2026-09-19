import IncidenceCubes.Penrose.Tangency

/-!
# Generic Penrose theorem with two-point tangencies as input

The user-facing input supplies seven regular symmetric conics, their chords,
and ordinary tangencies at two distinct points per edge. The theorem derives
all rank-one pencils and all matrix parameters; neither is an input assumption.
The genericity conditions are stronger than the complete theorem in the paper.
-/
namespace IncidenceCubes.Penrose.Theorem
open Normalization Geometry GeometricSeven Completion Uniqueness Tangency
variable {K : Type*} [Field K]

/-- Two distinct projective points on the first conic and on the given chord,
with the two polar covectors agreeing up to nonzero scalars. In characteristic
≠2 these are ordinary smooth tangencies when the first conic is regular.
The conics themselves must be projectively distinct. -/
def TwoPointContact (Q R : Form K) (l : Vec K) : Prop :=
  l ≠ 0 ∧ ¬ Proportional Q R ∧ ∃ x y : Vec K,
    Classical.cross x y ≠ 0 ∧ pairing l x=0 ∧ pairing l y=0 ∧
    value Q x=0 ∧ value Q y=0 ∧ ∃ a b : K,
    a ≠ 0 ∧ b ≠ 0 ∧ R.mulVec x=a • Q.mulVec x ∧ R.mulVec y=b • Q.mulVec y

/-- The pencil relation is derived from actual tangent data. -/
theorem TwoPointContact.to_contact (Q R : Form K) (l : Vec K)
    (hQ : Q.det ≠ 0) (hsQ : ∀ i j, Q i j=Q j i) (hsR : ∀ i j, R i j=R j i)
    (h : TwoPointContact Q R l) : Contact Q R l := by
  obtain ⟨hl,hne,x,y,hxy,hlx,hly,hx,hy,a,b,ha,hb,hax,hby⟩ := h
  exact contact_of_two_tangencies Q R l x y hQ hsQ hsR hl hxy hlx hly hx hy hne a b ha hb hax hby

/-- Arbitrary seven-conic data specified without rank-one-pencil identities. -/
structure TangentSeven (K : Type*) [Field K] where
  two_ne : (2:K) ≠ 0
  base : Form K
  first : Fin 3 → Form K
  second : Fin 3 → Form K
  chord : Fin 3 → Vec K
  upperLeft : Fin 3 → Vec K
  upperRight : Fin 3 → Vec K
  base_symmetric : ∀ i j, base i j=base j i
  first_symmetric : ∀ n i j, first n i j=first n j i
  second_symmetric : ∀ n i j, second n i j=second n j i
  base_regular : base.det ≠ 0
  first_regular : ∀ i, (first i).det ≠ 0
  second_regular : ∀ f, (second f).det ≠ 0
  independent : Matrix.det (chord : Form K) ≠ 0
  initial_tangencies : ∀ i, TwoPointContact base (first i) (chord i)
  left_tangencies : ∀ f, TwoPointContact (first (leftIndex f)) (second f) (upperLeft f)
  right_tangencies : ∀ f, TwoPointContact (first (rightIndex f)) (second f) (upperRight f)
  face_off : ∀ f, FaceOff base (chord (leftIndex f)) (chord (rightIndex f))
    (upperLeft f) (upperRight f)
  opposite_distinct : ∀ f, ¬ Proportional base (second f)

/-- Conversion only proves contact identities; it changes none of the input
conics, lines, labels or concurrence witnesses. -/
def TangentSeven.toSeven (S : TangentSeven K) : Seven K where
  two_ne := S.two_ne
  base := S.base
  first := S.first
  second := S.second
  chord := S.chord
  upperLeft := S.upperLeft
  upperRight := S.upperRight
  base_symmetric := S.base_symmetric
  base_regular := S.base_regular
  first_regular := S.first_regular
  second_regular := S.second_regular
  independent := S.independent
  initial_contact := fun i => TwoPointContact.to_contact _ _ _ S.base_regular
    S.base_symmetric (S.first_symmetric i) (S.initial_tangencies i)
  left_contact := fun f => TwoPointContact.to_contact _ _ _ (S.first_regular _)
    (S.first_symmetric _) (S.second_symmetric f) (S.left_tangencies f)
  right_contact := fun f => TwoPointContact.to_contact _ _ _ (S.first_regular _)
    (S.first_symmetric _) (S.second_symmetric f) (S.right_tangencies f)
  face_off := S.face_off
  opposite_distinct := S.opposite_distinct

/-- End-to-end generic completion starting with two-point tangencies. The extra
hypothesis says the three points of intersection of the known upper chords
are noncollinear. It concerns only the original input lines.
The output is a nonzero symmetric equation, three contact pencils, concurrence
on each new face, and projective uniqueness against arbitrary competing chords.
No assertion is made that the eighth conic is nonsingular or that each new
contact chord has two points over the original field. -/
theorem penrose_from_tangencies (S : TangentSeven K)
    (h : IndependentFacePoints S.toSeven) :
    ∃ T : Form K, ∃ l : Fin 3 → Vec K, Completes S.toSeven T l ∧
      (∃ x : Vec K, value T x ≠ 0) ∧
      ∀ U : Form K, ∀ m : Fin 3 → Vec K,
        Completes S.toSeven U m → Proportional T U :=
  generic_nonzero_equation S.toSeven h

/-- At each projective point of a contact chord on the original regular conic,
the completed conic passes through the point, is smooth there, and has the same
projective tangent. Existence of two distinct such points is a separate split
section condition, not silently assumed for arbitrary real data. -/
theorem completion_tangent_at_section (S : Seven K) (T : Form K) (l : Fin 3 → Vec K)
    (h : Completes S T l) (f : Fin 3) (x : Vec K) (hx : x ≠ 0)
    (hsec : value (S.second f) x=0) (hl : pairing (l f) x=0) :
    value T x=0 ∧ T.mulVec x ≠ 0 ∧ ∃ a : K,
      a ≠ 0 ∧ T.mulVec x=a • (S.second f).mulVec x := by
  obtain ⟨a,ha,he,hv⟩ := contact_polar _ _ _ x (h.2.2.1 f) hl
  refine ⟨by simpa [hsec] using hv,?_,a,ha,he⟩
  rw [he]
  exact smul_ne_zero ha (polar_nonzero _ _ (S.second_regular f) hx)

end IncidenceCubes.Penrose.Theorem
