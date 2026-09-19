#!/usr/bin/env python3
"""Exact rational checks for conic contact transport and a 4x4 torus net.

These are independent implementation/example checks, NOT a trusted oracle for
Lean. Run with Python 3 and SymPy: python scripts/test_conic_transport.py.
All matrix data and arithmetic are rational; there are no numerical tolerances.
"""
from pathlib import Path
import json
from collections import Counter
import sympy as sp

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'verification' / 'conic-transport'
R, Mat = sp.Rational, sp.Matrix
checks = 0

def check(condition, message):
    global checks
    checks += 1
    if not condition:
        raise AssertionError(message)

def scalar(x):
    return str(x)

def matrix(q):
    return [[scalar(x) for x in row] for row in q.tolist()]

def vector(x):
    return [scalar(y) for y in x]

def projective_key(x):
    pivot = next(y for y in x if y != 0)
    return tuple(y/pivot for y in x)

def real_section_det(q, line):
    basis = Mat.hstack(*line.T.nullspace())
    check(basis.cols == 2, 'A contact chord must be a genuine line')
    determinant = (basis.T*q*basis).det()
    check(determinant < 0, 'The binary section has two distinct real projective roots')
    return determinant

def curved_square():
    q = [Mat(x) for x in (
        [[-20,-16,14],[-16,-8,12],[14,12,-11]],
        [[-20,-16,14],[-16,-12,14],[14,14,-12]],
        [[-12,-8,6],[-8,-4,6],[6,6,-4]],
        [[-12,-8,6],[-8,-4,6],[6,6,-6]])]
    lines = list(map(Mat, [(0,-2,1),(2,2,-2),(0,0,-1),(-2,0,-1)]))
    scales = list(map(R, [1,1,1,2]))
    weights = list(map(R, [-1,2,-2,1]))
    dets = []
    for i in range(4):
        check(q[i].det() != 0 and q[i] == q[i].T, 'Nonsingular symmetric input')
        check(q[(i+1)%4] == scales[i]*q[i]+weights[i]*lines[i]*lines[i].T,
              'Exact cyclic contact relation')
        dets.append(real_section_det(q[i], lines[i]))
    check(sp.prod(scales) == 2, 'Nontrivial holonomy')
    check(Mat.hstack(*lines).rank() == 3, 'The four chords are not concurrent')
    return {'matrices': list(map(matrix,q)), 'cyclicChords': list(map(vector,lines)),
            'cyclicScales': list(map(scalar,scales)), 'holonomy': '2',
            'concurrent': False, 'restrictionDeterminants': list(map(scalar,dets))}

def torus_example():
    J = sp.diag(1,1,-1)
    U = list(map(Mat, [(1,0,0),(0,1,0),(1,1,0),(1,-1,0)]))
    a, b = Mat([1,2,R(1,5)]), Mat([3,-1,R(3,10)])
    V = [a,b,a+b,a-b]
    beta = [R(-2,100),R(-2,100),R(1,100),R(1,100)]
    S, T = [sp.zeros(3)], [sp.zeros(3)]
    for i in range(4):
        S.append(S[-1]+beta[i]*U[i]*U[i].T)
        T.append(T[-1]+beta[i]*V[i]*V[i].T)
    check(S[-1] == T[-1] == sp.zeros(3), 'Periodic rank-one increment cycles')
    C = {(i,j): J+S[i]+T[j] for i in range(4) for j in range(4)}
    for q in C.values():
        check(q.det() != 0, 'Invertible precursor')
    inverse = {x:q.inv() for x,q in C.items()}
    gauge = {x:R(17+4*x[0]+x[1],17) for x in C}
    q = {x:gauge[x]*value for x,value in inverse.items()}
    edges = []
    for (i,j), form in C.items():
        for axis in (0,1):
            target = ((i+1)%4,j) if axis == 0 else (i,(j+1)%4)
            v, coefficient = (U[i],beta[i]) if axis == 0 else (V[j],beta[j])
            chord = inverse[i,j]*v
            scale = gauge[target]/gauge[i,j]
            weight = -gauge[target]*coefficient/(1+coefficient*(v.T*inverse[i,j]*v)[0])
            check(q[target] == scale*q[i,j]+weight*chord*chord.T, 'Sherman-Morrison contact')
            start = (i,j)
            if (i+j)%2:
                start, target = target, start
                weight, scale = -weight/scale, 1/scale
            check(q[target] == scale*q[start]+weight*chord*chord.T, 'Black-to-white contact')
            check(scale != 0 and weight != 0, 'Proper contact')
            section = real_section_det(q[start], chord)
            edges.append((start,target,chord,scale,weight,section))
    index = {frozenset((x,y)):k for k,(x,y,*_) in enumerate(edges)}
    faces, positive, negative, curvature = [], [], [], []
    for i,j in C:
        vertices = [(i,j),((i+1)%4,j),((i+1)%4,(j+1)%4),(i,(j+1)%4)]
        if (i+j)%2:
            vertices = vertices[1:]+vertices[:1]
        ee = [index[frozenset((vertices[k],vertices[(k+1)%4]))] for k in range(4)]
        ll = [edges[k][2] for k in ee]
        x = ll[0].cross(ll[1])
        check(x != sp.zeros(3,1), 'Independent adjacent contact chords')
        for line in ll:
            check((line.T*x)[0] == 0, 'Exact face concurrence')
        for k in range(4):
            for t in range(k):
                check(ll[k].cross(ll[t]) != sp.zeros(3,1), 'Four distinct face chords')
        h = edges[ee[0]][3]*edges[ee[2]][3]/(edges[ee[1]][3]*edges[ee[3]][3])
        check(h == 1, 'Coherent contact holonomy')
        positive += [ee[0],ee[2]]
        negative += [ee[1],ee[3]]
        curvature.append(h)
        faces.append({'vertices':vertices,'edges':ee,'concurrency':vector(x),'holonomy':scalar(h)})
    check(Counter(positive) == Counter(range(32)), 'Every edge occurs once positively')
    check(Counter(negative) == Counter(range(32)), 'Every edge occurs once negatively')
    check(sp.prod(curvature) == 1, 'Surface product')
    check(len(set(projective_key(value) for value in q.values())) == 16, '16 distinct conics')
    check(len(set(projective_key(Mat(f['concurrency'])) for f in faces)) == 16,
          '16 distinct concurrence points')
    # Full gauge recheck, not just a scalar numerical calculation.
    changed = {x:R(11+7*x[0]+3*x[1],13) for x in C}
    for f in faces:
        hh = []
        for k in f['edges']:
            x,y,line,scale,weight,*_ = edges[k]
            newscale = changed[y]/changed[x]*scale
            check(changed[y]*q[y] == newscale*changed[x]*q[x]+changed[y]*weight*line*line.T,
                  'Changed conic representatives have the predicted scale')
            hh.append(newscale)
        check(hh[0]*hh[2]/(hh[1]*hh[3]) == 1, 'Gauge invariant face curvature')
    return {'vertices':16,'edges':32,'faces':16,'eulerCharacteristic':0,
            'distinctConics':16,'distinctConcurrencyPoints':16,
            'allEdgesHaveTwoDistinctRealContacts':True,
            'allFacesHaveFourDistinctContactChords':True,
            'conics':[{'vertex':x,'matrix':matrix(value)} for x,value in q.items()],
            'edgeData':[{'source':x,'target':y,'chord':vector(l),'scale':scalar(a),
                         'weight':scalar(b),'sectionDeterminant':scalar(d)}
                        for x,y,l,a,b,d in edges], 'faceData':faces}

def main():
    square = curved_square()
    torus = torus_example()
    OUT.mkdir(parents=True,exist_ok=True)
    payload={'scope':'Exact rational example/implementation checks, not Lean proof evidence.',
             'noncoherentSquare':square,'torus':torus}
    (OUT/'exact-examples.json').write_text(json.dumps(payload,indent=2)+'\n')
    result={'status':'passed','arithmetic':'exact rationals','checks':checks,
            'noncoherentSquareHolonomy':square['holonomy'],
            'torusCounts':{'conics':16,'edges':32,'faces':16},
            'realDoubleContacts':32,'distinctConcurrencePoints':16,
            'scope':payload['scope']}
    (OUT/'exact-test-results.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))

if __name__ == '__main__':
    main()
