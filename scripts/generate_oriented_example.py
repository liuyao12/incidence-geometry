"""Regenerate OrientedExample.lean. Each supplied equality has a Lean proof;
Python arithmetic and this generator are not part of the proof trust base.
"""
from fractions import Fraction as F
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def matadd(A,B):return [[x+y for x,y in zip(a,b)]for a,b in zip(A,B)]
def outer(v):return [[x*y for y in v]for x in v]
def scale(A,k):return [[k*x for x in r]for r in A]
def mm(A,v):return [sum(x*y for x,y in zip(r,v))for r in A]
def det(A):
 return (A[0][0]*(A[1][1]*A[2][2]-A[1][2]*A[2][1])
       - A[0][1]*(A[1][0]*A[2][2]-A[1][2]*A[2][0])
       + A[0][2]*(A[1][0]*A[2][1]-A[1][1]*A[2][0]))
def adj(A):return [[(-1)**(i+j)* (lambda B:B[0][0]*B[1][1]-B[0][1]*B[1][0])([[A[u][v]for v in range(3)if v!=i]for u in range(3)if u!=j]) for j in range(3)]for i in range(3)]
def pair(v,w):return sum(x*y for x,y in zip(v,w))
def cross(v,w):return [v[1]*w[2]-v[2]*w[1],v[2]*w[0]-v[0]*w[2],v[0]*w[1]-v[1]*w[0]]
def fnum(x):return str(x.numerator) if x.denominator==1 else f'({x.numerator}/{x.denominator})'
id=lambda i,j:4*(i%3)+(j%4)
Z=[[0]*3 for _ in range(3)];J=[[100,0,0],[0,100,0],[0,0,-100]]
U=[[1,0,0]]*3;ku=[-2,-3,5];a=[1,2,1];b=[3,-1,2];W=[a,b,[a[i]+b[i]for i in range(3)],[a[i]-b[i]for i in range(3)]];kv=[-2,-2,1,1]
S=[Z];T=[Z]
for v,k in zip(U,ku):S.append(matadd(S[-1],scale(outer(v),k)))
for v,k in zip(W,kv):T.append(matadd(T[-1],scale(outer(v),k)))
assert S[-1]==T[-1]==Z
C=[matadd(J,matadd(S[i],T[j]))for i in range(3)for j in range(4)]
Q=list(map(adj,C));dets=list(map(det,C))
source=[];target=[];chords=[];la=[];be=[];edgelookup={}
for i in range(3):
 for j in range(4):
  for axis in range(2):
   s=id(i,j);t=id(i+1,j)if axis==0 else id(i,j+1);k=ku[i]if axis==0 else kv[j];v=U[i]if axis==0 else W[j];l=mm(Q[s],v);lam=F(dets[t],dets[s]);beta=F(-k,dets[s])
   assert matadd(scale(Q[s],lam),scale(outer(l),beta))==Q[t]
   source.append(s);target.append(t);chords.append(l);la.append(lam);be.append(beta);edgelookup[s,t]=len(source)-1
corners=[];darts=[]
for i in range(3):
 for j in range(4):
  cs=[id(i,j),id(i+1,j),id(i+1,j+1),id(i,j+1)];corners.append(cs);ds=[]
  for k in range(4):
   a,b=cs[k],cs[(k+1)%4]
   if (a,b)in edgelookup:ds.append((edgelookup[a,b],0))
   else:ds.append((edgelookup[b,a],1))
  darts.append(ds)
  ls=[chords[e]for e,_ in ds];x=cross(ls[0],ls[1]);assert any(x)and all(pair(l,x)==0 for l in ls)
# Object code includes exact data only. All certificates are Lean proofs.
vec=lambda a:'!['+','.join(map(str,a))+']'
mt=lambda A:'!!['+';'.join(','.join(map(str,r))for r in A)+']'
s='''import IncidenceCubes.Connection.OrientedSurface

/-! An exact rational 3-by-4 torus. Its horizontal 3-cycle excludes a vertex
bicoloring. The final concurrence is derived from the new oriented theorem.
The arrays are computed from integer rank-one updates, but every assumption
is separately checked by the Lean kernel. No numerical proof oracle is used. -/
namespace IncidenceCubes.Connection.OrientedExample
open Penrose.Normalization Penrose.Geometry OrientedSurface
set_option maxRecDepth 20000
set_option maxHeartbeats 8000000
'''
s+='def source : Fin 24 → Fin 12 := '+vec(source)+'\n'
s+='def target : Fin 24 → Fin 12 := '+vec(target)+'\n'
s+='def vertex : Fin 12 → Fin 4 → Fin 12 := !['+','.join(vec(r)for r in corners)+']\n'
s+='def dartTable : Fin 12 → Fin 4 → Fin 24 × Fin 2 := !['+','.join('!['+','.join(f'({e},{d})'for e,d in r)+']'for r in darts)+']\n'
s+='''def dartMap (d : Fin 12 × Fin 4) : Fin 24 × Fin 2 := dartTable d.1 d.2
private theorem dartMap_bijective : Function.Bijective dartMap := by decide
noncomputable def torus : Quadrangulation (Fin 12) (Fin 24) (Fin 12) where
  darts := Equiv.ofBijective dartMap dartMap_bijective
  source := source
  target := target
  vertex := vertex
  starts := by decide
  ends := by decide

/-- The graph really is outside the old black--white formulation. -/
theorem not_bicolorable : ¬ ∃ c : Fin 12 → Bool, ∀ e : Fin 24, c (source e) ≠ c (target e) := by
  rintro ⟨c,h⟩
  have h0 : c 0 ≠ c 4 := h 0
  have h4 : c 4 ≠ c 8 := h 8
  have h8 : c 8 ≠ c 0 := h 16
  cases hc0 : c 0 <;> cases hc4 : c 4 <;> cases hc8 : c 8 <;> simp_all
'''
s+='def form : Fin 12 → Form ℚ := !['+','.join(mt(A)for A in Q)+']\n'
s+='def chord : Fin 24 → Vec ℚ := !['+','.join(vec(l)for l in chords)+']\n'
s+='def edgeScale : Fin 24 → ℚ := !['+','.join(map(fnum,la))+']\n'
s+='def edgeWeight : Fin 24 → ℚ := !['+','.join(map(fnum,be))+']\n'
# All data are defined. Replace the proof suffix with scalar normalization.
def q(x):return '('+fnum(F(x))+ ' : ℚ)'
s+='''private theorem contact_data : ∀ e : Fin 24,
    chord e ≠ 0 ∧ edgeScale e ≠ 0 ∧ edgeWeight e ≠ 0 ∧
    form (target e) = edgeScale e • form (source e) + edgeWeight e • square (chord e) := by
  intro e
  fin_cases e
'''
for k in range(24):
 l=chords[k];t=target[k];a=source[k];j=next(j for j in range(3)if l[j])
 s+=f'  · refine ⟨?_, ?_, ?_, ?_⟩\n    · intro h; have hh := congrFun h {j}; change {q(l[j])} = 0 at hh; norm_num at hh\n    · change {q(la[k])} ≠ 0; norm_num\n    · change {q(be[k])} ≠ 0; norm_num\n    · ext i j\n      fin_cases i <;> fin_cases j\n'
 for i in range(3):
  for j in range(3):s+=f'      · change {q(Q[t][i][j])} = {q(la[k])} * {q(Q[a][i][j])} + {q(be[k])} * ({q(l[i])} * {q(l[j])})\n        norm_num\n'
s+='''noncomputable def net : ConicNet (K := ℚ) torus where
  form := form
  chord := chord
  symmetric := by decide
  regular := by
    intro v
    rw [Matrix.det_fin_three]
    fin_cases v
'''
for A in Q:
 t=lambda i,j:q(A[i][j])
 ex=f'{t(0,0)}*{t(1,1)}*{t(2,2)} - {t(0,0)}*{t(1,2)}*{t(2,1)} - {t(0,1)}*{t(1,0)}*{t(2,2)} + {t(0,1)}*{t(1,2)}*{t(2,0)} + {t(0,2)}*{t(1,0)}*{t(2,1)} - {t(0,2)}*{t(1,1)}*{t(2,0)}'
 s+=f'    · change {ex} ≠ 0\n      norm_num\n'
s+='''  contact := by
    intro e
    obtain ⟨hl,ha,hb,he⟩ := contact_data e
    exact ⟨hl,edgeScale e,edgeWeight e,ha,hb,he⟩
  distinct_chords := by
    intro f
    fin_cases f
'''
points=[]
for ds in darts:
 l,r=chords[ds[0][0]],chords[ds[1][0]];x=cross(l,r);points.append(x);j=next(j for j in range(3)if x[j]);j1,j2=(j+1)%3,(j+2)%3
 s+=f'    · intro h; have hh := congrFun h {j}\n      change {q(l[j1])} * {q(r[j2])} - {q(l[j2])} * {q(r[j1])} = 0 at hh\n      norm_num at hh\n'
s+='def meeting : Fin 12 → Vec ℚ := !['+','.join(vec(x)for x in points)+']\n'
s+='''/-- Exactly eleven concurrences are verified directly. -/
theorem first_eleven (f : Fin 12) (hf : f ≠ 11) : net.Coherent f := by
  fin_cases f
'''
for f,ds in enumerate(darts[:-1]):
 x=points[f];j=next(j for j in range(3)if x[j]);s+=f'  · refine ⟨meeting {f}, ?_, ?_, ?_, ?_, ?_⟩\n    · intro h; have hh := congrFun h {j}; change {q(x[j])} = 0 at hh; norm_num at hh\n'
 for e,d in ds:
  l=chords[e];s+='    · change '+' + '.join(q(l[j])+' * '+q(x[j])for j in range(3))+' = 0\n      norm_num\n'
s+='''  · exact False.elim (hf rfl)

/-- The twelfth face is a consequence, not a directly checked equation. -/
theorem twelfth_face : net.Coherent 11 :=
  conic_surface_last_face torus net 11 first_eleven
end IncidenceCubes.Connection.OrientedExample
'''
(root/'formal/IncidenceCubes/Connection/OrientedExample.lean').write_text(s)
print('wrote',len(s),'chars')
