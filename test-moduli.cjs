'use strict';
// Independent numerical regression tests; not a mathematical proof certificate.
const assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('./engine.js'),N=require('./narrative-math.js'),W=require('./moduli.js'),B=require('./cube-view.js');
let checks=0,configurations=0,paths=0,maxContact=0,maxFace=0,maxModel=0;
function ok(v,msg){checks++;assert.ok(v,msg);}
function near(x,y,tol=2e-8){ok(Math.abs(x-y)<=tol*(1+Math.abs(x)+Math.abs(y)),`${x} != ${y}`);}
function proportional(A,B){const a=A.flat(),b=B.flat(),j=b.reduce((k,x,i)=>Math.abs(x)>Math.abs(b[k])?i:k,0),scale=a[j]/b[j];return Math.hypot(...a.map((x,i)=>x-scale*b[i]))/(1+Math.hypot(...a));}
function verify(p){
 const d=W.diagnose(p),F=d.F,Q=d.D.map(E.inverse);configurations++;
 F.dual.forEach((A,i)=>{const err=proportional(A,d.D[i]);maxModel=Math.max(maxModel,err);near(err,0);});
 for(const c of F.contacts){
  const difference=N.matrixAdd(Q[c.t],N.matrixScale(Q[c.s],-1)),l=E.mul(Q[c.s],c.dualChord);
  const err=proportional(difference,E.outer(l));maxContact=Math.max(maxContact,err);near(err,0,1e-7);
  for(const P of c.primalPoints){near(E.quad(F.primal[c.s],P),0);near(E.quad(F.primal[c.t],P),0);}
 }
 for(const face of E.FACES)for(const dual of [false,true]){
  const ls=E.faceEdges(face).map(i=>dual?F.contacts[i].dualChord:F.contacts[i].chord);
  const X=N.unit(E.cross(ls[0],ls[1]));for(const l of ls){const err=Math.abs(E.dot(l,X));maxFace=Math.max(maxFace,err);near(err,0,1e-7);}
 }
 return d;
}
const initial=N.defaults(),rng=W.randomSource(20260918);let current=initial;
for(let i=0;i<36;i++){
 const lockChords=i%3===0,route=W.plan(current,initial,rng,{lockChords,amount:.7+(i%4)*.15});paths++;
 ok(route.ok&&route.change>1e-5,'genuine moduli change');
 for(let k=0;k<=12;k++){
  const p=W.interpolate(route.from,route.to,k/12),d=verify(p);
  ok(d.signature===route.signature,'preserved chamber signature');
  if(lockChords)assert.deepEqual(B.shape(p).basis,B.shape(route.from).basis);
 }
 current=route.to;
}
// Same seed directions -> same cuboid, while both independent kinds of omitted
// data (weights, face couplings) can change the actual conics.
for(const mode of ['weights','couplings']){
 const p=W.clone(initial);if(mode==='weights')p.inflation[0]+=.02;else p.couplings[1]+=.13;
 assert.deepEqual(B.shape(initial).basis,B.shape(p).basis);
 ok(W.distance(W.descriptor(initial).values,W.descriptor(p).values)>1e-4,'cube is not a complete invariant');
 ok(N.matrixNorm(N.matrixAdd(N.family(3,p).dual[mode==='weights'?1:6],N.matrixScale(N.family(3,initial).dual[mode==='weights'?1:6],-1)))>1e-4,'actual conic changed');verify(p);
}
// Replayability and endpoints, with zero velocity and acceleration at endpoints.
const r1=W.plan(initial,initial,W.randomSource(312)),r2=W.plan(initial,initial,W.randomSource(312));assert.deepEqual(r1,r2);
assert.deepEqual(W.interpolate(r1.from,r1.to,0),r1.from);assert.deepEqual(W.interpolate(r1.from,r1.to,1),r1.to);
near(W.smooth(1e-4)/1e-4,0,2e-7);near((1-W.smooth(1-1e-4))/1e-4,0,2e-7);
// The nine numbers are invariant under a genuine carrier-preserving projective
// boost, not merely a Euclidean rotation of the screen.
const F=N.family(3,initial),t=.4,L=[[Math.cosh(t),0,Math.sinh(t)],[0,1,0],[Math.sinh(t),0,Math.cosh(t)]];
const transformed={...F,p:F.p.map(p=>E.mul(L,p))};
W.descriptor(initial,F).values.forEach((x,i)=>near(x,W.descriptor(initial,transformed).values[i]));
// Singular chart input rejected rather than zero vectors accepted as points.
const singular=W.clone(initial);singular.opening=0;assert.throws(()=>W.diagnose(singular));
const bad=W.clone(initial);bad.couplings=[NaN,1,1];assert.throws(()=>N.family(3,bad));
// Unequal couplings still approach the same classical and Salmon boundary data.
const generic=W.clone(initial);generic.couplings=[.7,1.4,.9];
for(const phase of [0,.25,1,1.5,2]){
 const a=N.family(phase,initial),b=N.family(phase,generic);near(a.error,0);near(b.error,0);
 a.pairs.flat().forEach((P,i)=>P.forEach((x,j)=>near(x,b.pairs.flat()[i][j])));
}
for(const edge of [0,3,7,10])near(N.extrusion(generic,edge).error,0,1e-7);
// Numerical rank of the 9-coordinate descriptor's Jacobian (diagnostic only).
const keys=['u','v','inflation','couplings'],cols=[];
for(const key of keys)for(let i=0;i<3;i++){
 const a=W.clone(initial),b=W.clone(initial),h=1e-5;a[key][i]+=h;b[key][i]-=h;
 cols.push(W.descriptor(a).values.map((x,j)=>(x-W.descriptor(b).values[j])/(2*h)));
}
const A=Array.from({length:9},(_,i)=>cols.map(c=>c[i]));let rank=0;
for(let j=0;j<12&&rank<9;j++){
 let k=rank;for(let i=rank+1;i<9;i++)if(Math.abs(A[i][j])>Math.abs(A[k][j]))k=i;
 if(Math.abs(A[k][j])<1e-7)continue;[A[k],A[rank]]=[A[rank],A[k]];
 const pivot=A[rank][j];A[rank]=A[rank].map(x=>x/pivot);
 for(let i=rank+1;i<9;i++){const c=A[i][j];A[i]=A[i].map((x,k)=>x-c*A[rank][k]);}rank++;
}
ok(rank===9,'all nine moduli directions are numerically present');
const result={status:'passed',checks,configurations,paths,seed:20260918,jacobianRank:rank,maxContact,maxFace,maxModel,scope:'Numerical software tests; not a formal moduli classification or certified path proof.'};
fs.writeFileSync('moduli-test-results.json',JSON.stringify(result,null,2)+'\n');console.log(result);
