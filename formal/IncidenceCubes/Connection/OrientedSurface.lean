import IncidenceCubes.Connection.GeometricSurface

/-!
# Conic contact on oriented surfaces, without a vertex coloring

Conics have the same type at both endpoints of an edge: unlike point--hyperplane
labels, they do not require a bipartition. A dart equivalence pairs each physical
edge with its two oppositely directed occurrences. It also proves a boundary
formula for any selected set of faces, before imposing coherence.

These data encode oriented gluing, not recognition of a topological manifold.
The theorem applies to any closed oriented quadrangulation supplying them.
-/
namespace IncidenceCubes.Connection.OrientedSurface
open scoped BigOperators
open Penrose.Normalization Penrose.Geometry ConicTransport
variable {F E V K : Type*} [Field K]

/-- Every edge appears once in each direction. No coloring of vertices. -/
structure Quadrangulation (F E V : Type*) where
  darts : (F × Fin 4) ≃ (E × Fin 2)
  source : E → V
  target : E → V
  vertex : F → Fin 4 → V
  starts : ∀ f i, vertex f i =
    if (darts (f,i)).2 = 0 then source (darts (f,i)).1 else target (darts (f,i)).1
  ends : ∀ f i, vertex f (i+1) =
    if (darts (f,i)).2 = 0 then target (darts (f,i)).1 else source (darts (f,i)).1

/-- Reverse traversal uses the reciprocal, including on odd graph cycles. -/
def directedWeight {G : Type*} [CommGroup G] (w : E → G) (d : E × Fin 2) : G :=
  if d.2 = 0 then w d.1 else (w d.1)⁻¹

def faceHolonomy {G : Type*} [CommGroup G] (T : Quadrangulation F E V)
    (w : E → G) (f : F) : G := ∏ i : Fin 4, directedWeight w (T.darts (f,i))

/-- The cancellation theorem needs edge orientation, not bipartite vertices. -/
theorem total_holonomy {G : Type*} [CommGroup G] [Fintype F] [Fintype E]
    (T : Quadrangulation F E V) (w : E → G) :
    (∏ f : F, faceHolonomy T w f) = 1 := by
  unfold faceHolonomy
  rw [← Fintype.prod_prod_type (fun d : F × Fin 4 => directedWeight w (T.darts d))]
  rw [Equiv.prod_comp T.darts]
  rw [Fintype.prod_prod_type]
  simp [directedWeight, Fin.prod_univ_two]

/-- Surface holonomy of a selected finite collection of faces. -/
noncomputable def regionHolonomy {G : Type*} [CommGroup G] [Fintype F]
    (T : Quadrangulation F E V) (w : E → G) (S : Finset F) : G := by
  classical
  exact ∏ f : F, if f ∈ S then faceHolonomy T w f else 1

/-- Internal edges cancel; only singly included oriented occurrences survive. -/
noncomputable def boundaryFactor {G : Type*} [CommGroup G]
    (T : Quadrangulation F E V) (w : E → G) (S : Finset F) (e : E) : G := by
  classical
  exact (if (T.darts.symm (e,0)).1 ∈ S then w e else 1) *
    (if (T.darts.symm (e,1)).1 ∈ S then (w e)⁻¹ else 1)

/-- Multiplicative discrete Stokes formula, before any coherence assumption. -/
theorem region_boundary {G : Type*} [CommGroup G] [Fintype F] [Fintype E]
    (T : Quadrangulation F E V) (w : E → G) (S : Finset F) :
    regionHolonomy T w S = ∏ e : E, boundaryFactor T w S e := by
  classical
  have hface (f : F) : (if f ∈ S then faceHolonomy T w f else 1) =
      ∏ i : Fin 4, if f ∈ S then directedWeight w (T.darts (f,i)) else 1 := by
    by_cases hf : f ∈ S <;> simp [hf, faceHolonomy]
  unfold regionHolonomy
  simp_rw [hface]
  rw [← Fintype.prod_prod_type
    (fun d : F × Fin 4 => if d.1 ∈ S then directedWeight w (T.darts d) else 1)]
  rw [← Equiv.prod_comp T.darts.symm
    (fun d : F × Fin 4 => if d.1 ∈ S then directedWeight w (T.darts d) else 1)]
  simp only [Equiv.apply_symm_apply]
  rw [Fintype.prod_prod_type]
  apply Finset.prod_congr rfl
  intro e _
  simp [Fin.prod_univ_two, directedWeight, boundaryFactor]

/-- A pair of included faces contributes no transport along their common edge. -/
theorem internal_edge_cancels {G : Type*} [CommGroup G]
    (T : Quadrangulation F E V) (w : E → G) (S : Finset F) (e : E)
    (h0 : (T.darts.symm (e,0)).1 ∈ S) (h1 : (T.darts.symm (e,1)).1 ∈ S) :
    boundaryFactor T w S e = 1 := by
  classical
  simp [boundaryFactor, h0, h1]

/-- The old alternating-face equivalence in cyclic traversal convention. -/
theorem cyclic_face_concurrent_iff (Q0 Q1 Q2 Q3 : Form K) (p r s t : Vec K)
    (hQ : Q0.det ≠ 0) (hpr : Classical.cross p r ≠ 0)
    (w01 : Witness Q0 Q1 p) (w12 : Witness Q1 Q2 r)
    (w23 : Witness Q2 Q3 s) (w30 : Witness Q3 Q0 t) :
    Concurrent4 p r s t ↔ w01.scale*w12.scale*w23.scale*w30.scale = 1 := by
  have h := face_concurrent_iff Q0 Q1 Q2 Q3 p r s t hQ hpr
    w01 (w12.reverse Q1 Q2 r) w23 (w30.reverse Q3 Q0 t)
  have hprod : w01.scale*w23.scale / (w12.scale⁻¹*w30.scale⁻¹) =
      w01.scale*w12.scale*w23.scale*w30.scale := by
    simp only [div_eq_mul_inv, mul_inv_rev, inv_inv]
    ac_rfl
  simpa only [Witness.reverse, hprod] using h

/-- Arbitrary nonsingular conic labels and proper contact on physical edges. -/
structure ConicNet (T : Quadrangulation F E V) where
  form : V → Form K
  symmetric : ∀ v i j, form v i j = form v j i
  regular : ∀ v, (form v).det ≠ 0
  chord : E → Vec K
  contact : ∀ e, Contact (form (T.source e)) (form (T.target e)) (chord e)
  distinct_chords : ∀ f,
    Classical.cross (chord (T.darts (f,0)).1) (chord (T.darts (f,1)).1) ≠ 0

noncomputable def ConicNet.edgeWitness {T : Quadrangulation F E V}
    (N : ConicNet (K := K) T) (e : E) :
    Witness (N.form (T.source e)) (N.form (T.target e)) (N.chord e) :=
  ofContact _ _ _ (N.contact e)

noncomputable def ConicNet.edgeWeight {T : Quadrangulation F E V}
    (N : ConicNet (K := K) T) (e : E) : Kˣ := (N.edgeWitness e).scale

noncomputable def ConicNet.sideWeight {T : Quadrangulation F E V}
    (N : ConicNet (K := K) T) (d : E × Fin 2) : Kˣ :=
  if d.2 = 0 then (N.edgeWitness d.1).weight
  else -((N.edgeWitness d.1).scale⁻¹ * (N.edgeWitness d.1).weight)

/-- The contact equation for each face side is derived in its traversal direction. -/
theorem ConicNet.side_relation {T : Quadrangulation F E V}
    (N : ConicNet (K := K) T) (f : F) (i : Fin 4) :
    N.form (T.vertex f (i+1)) =
      ((directedWeight N.edgeWeight (T.darts (f,i)) : Kˣ) : K) • N.form (T.vertex f i) +
      (N.sideWeight (T.darts (f,i)) : K) • square (N.chord (T.darts (f,i)).1) := by
  rw [T.ends, T.starts]
  by_cases hd : (T.darts (f,i)).2 = 0
  · simpa only [directedWeight, ConicNet.sideWeight, ConicNet.edgeWeight, if_pos hd] using
      (N.edgeWitness (T.darts (f,i)).1).relation
  · simpa only [directedWeight, ConicNet.sideWeight, ConicNet.edgeWeight, if_neg hd,
      Witness.reverse] using
      ((N.edgeWitness (T.darts (f,i)).1).reverse _ _ _).relation

def ConicNet.Coherent {T : Quadrangulation F E V} (N : ConicNet (K := K) T) (f : F) : Prop :=
  Concurrent4 (N.chord (T.darts (f,0)).1) (N.chord (T.darts (f,1)).1)
    (N.chord (T.darts (f,2)).1) (N.chord (T.darts (f,3)).1)

/-- The original four geometric chords, now without any vertex coloring. -/
theorem ConicNet.coherent_iff_holonomy {T : Quadrangulation F E V}
    (N : ConicNet (K := K) T) (f : F) :
    N.Coherent f ↔ faceHolonomy T N.edgeWeight f = 1 := by
  have h := cyclic_face_concurrent_iff
    (N.form (T.vertex f 0)) (N.form (T.vertex f 1))
    (N.form (T.vertex f 2)) (N.form (T.vertex f 3))
    (N.chord (T.darts (f,0)).1) (N.chord (T.darts (f,1)).1)
    (N.chord (T.darts (f,2)).1) (N.chord (T.darts (f,3)).1)
    (N.regular _) (N.distinct_chords f)
    ⟨_,_, (N.contact _).1, N.side_relation f 0⟩
    ⟨_,_, (N.contact _).1, N.side_relation f 1⟩
    ⟨_,_, (N.contact _).1, N.side_relation f 2⟩
    ⟨_,_, (N.contact _).1, N.side_relation f 3⟩
  simpa only [ConicNet.Coherent, faceHolonomy, Fin.prod_univ_four] using h

/-- Conic-contact surface theorem with the unnecessary bicoloring removed. -/
theorem conic_surface_last_face [Fintype F] [Fintype E]
    (T : Quadrangulation F E V) (N : ConicNet (K := K) T) (missing : F)
    (h : ∀ f, f ≠ missing → N.Coherent f) : N.Coherent missing := by
  classical
  have hp : (∏ f : F, faceHolonomy T N.edgeWeight f) = faceHolonomy T N.edgeWeight missing := by
    apply Finset.prod_eq_single missing
    · intro f _ hf
      exact (N.coherent_iff_holonomy f).mp (h f hf)
    · intro hm
      exact False.elim (hm (Finset.mem_univ missing))
  apply (N.coherent_iff_holonomy missing).mpr
  exact hp.symm.trans (total_holonomy T N.edgeWeight)

/-- A patch of coherent conic faces has trivial transport around its boundary.
This includes several boundary components: the product uses all their induced
orientations. It does not assert that each component separately has holonomy one. -/
theorem coherent_region_boundary [Fintype F] [Fintype E]
    (T : Quadrangulation F E V) (N : ConicNet (K := K) T) (S : Finset F)
    (h : ∀ f ∈ S, N.Coherent f) :
    (∏ e : E, boundaryFactor T N.edgeWeight S e) = 1 := by
  classical
  rw [← region_boundary]
  unfold regionHolonomy
  apply Finset.prod_eq_one
  intro f _
  split_ifs with hf
  · exact (N.coherent_iff_holonomy f).mp (h f hf)
  · rfl

end IncidenceCubes.Connection.OrientedSurface
