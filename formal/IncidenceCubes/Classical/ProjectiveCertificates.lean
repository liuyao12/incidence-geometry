import IncidenceCubes.Classical.PappusDesargues
import IncidenceCubes.Classical.Brianchon

/-! Explicit nonzero certificates for the projective interpretations. These
are not assumptions of the conclusion: each structure stores only geometric
hypotheses and well-definedness of the join/meet constructions. -/
namespace IncidenceCubes.Classical
variable {K : Type*} [Field K]

structure DesarguesInput (K : Type*) [Field K] where
  a b c d e f : Vec K
  firstTriangle : ¬ Collinear a b c
  secondTriangle : ¬ Collinear d e f
  perspective : Concurrent (cross a d) (cross b e) (cross c f)
  connectors_ne : cross a d ≠ 0 ∧ cross b e ≠ 0 ∧ cross c f ≠ 0
  intersections_ne : cross (cross c a) (cross f d) ≠ 0 ∧
    cross (cross a b) (cross d e) ≠ 0 ∧ cross (cross b c) (cross e f) ≠ 0

theorem DesarguesInput.conclusion (D : DesarguesInput K) :
    ∃ l : Vec K, l ≠ 0 ∧
      (cross (cross D.c D.a) (cross D.f D.d) ≠ 0 ∧
        pair l (cross (cross D.c D.a) (cross D.f D.d)) = 0) ∧
      (cross (cross D.a D.b) (cross D.d D.e) ≠ 0 ∧
        pair l (cross (cross D.a D.b) (cross D.d D.e)) = 0) ∧
      (cross (cross D.b D.c) (cross D.e D.f) ≠ 0 ∧
        pair l (cross (cross D.b D.c) (cross D.e D.f)) = 0) := by
  obtain ⟨l, hl, h1, h2, h3⟩ := desargues D.a D.b D.c D.d D.e D.f D.perspective
  exact ⟨l, hl, ⟨D.intersections_ne.1, h1⟩,
    ⟨D.intersections_ne.2.1, h2⟩, ⟨D.intersections_ne.2.2, h3⟩⟩

/-- Six actual points on a nonsingular conic, and three actual diagonals of
the polygon formed by their polar tangents. -/
structure BrianchonInput (K : Type*) [Field K] where
  S : Mat3 K
  a b c d e f : Vec K
  symmetric : ∀ i j, S i j = S j i
  nonsingular : S.det ≠ 0
  two_ne : (2 : K) ≠ 0
  points_ne : ∀ i : Fin 6, (![a,b,c,d,e,f] i) ≠ 0
  onConic : matrixQuad S a = 0 ∧ matrixQuad S b = 0 ∧ matrixQuad S c = 0 ∧
    matrixQuad S d = 0 ∧ matrixQuad S e = 0 ∧ matrixQuad S f = 0
  diagonals_ne :
    pascalX (S.mulVec a) (S.mulVec b) (S.mulVec d) (S.mulVec e) ≠ 0 ∧
    pascalX (S.mulVec b) (S.mulVec c) (S.mulVec e) (S.mulVec f) ≠ 0 ∧
    pascalX (S.mulVec c) (S.mulVec d) (S.mulVec f) (S.mulVec a) ≠ 0

/-- A genuine projective point on all three genuine diagonals. -/
theorem BrianchonInput.conclusion (B : BrianchonInput K) :
    ∃ p : Vec K, p ≠ 0 ∧
      (pascalX (B.S.mulVec B.a) (B.S.mulVec B.b) (B.S.mulVec B.d) (B.S.mulVec B.e) ≠ 0 ∧
        pair (pascalX (B.S.mulVec B.a) (B.S.mulVec B.b) (B.S.mulVec B.d) (B.S.mulVec B.e)) p = 0) ∧
      (pascalX (B.S.mulVec B.b) (B.S.mulVec B.c) (B.S.mulVec B.e) (B.S.mulVec B.f) ≠ 0 ∧
        pair (pascalX (B.S.mulVec B.b) (B.S.mulVec B.c) (B.S.mulVec B.e) (B.S.mulVec B.f)) p = 0) ∧
      (pascalX (B.S.mulVec B.c) (B.S.mulVec B.d) (B.S.mulVec B.f) (B.S.mulVec B.a) ≠ 0 ∧
        pair (pascalX (B.S.mulVec B.c) (B.S.mulVec B.d) (B.S.mulVec B.f) (B.S.mulVec B.a)) p = 0) := by
  obtain ⟨ha,hb,hc,hd,he,hf⟩ := B.onConic
  obtain ⟨p,hp,h1,h2,h3⟩ := brianchon B.S B.a B.b B.c B.d B.e B.f
    B.symmetric B.nonsingular B.two_ne ha hb hc hd he hf
  exact ⟨p,hp,⟨B.diagonals_ne.1,h1⟩,⟨B.diagonals_ne.2.1,h2⟩,⟨B.diagonals_ne.2.2,h3⟩⟩
end IncidenceCubes.Classical
