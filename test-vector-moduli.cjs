'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const E=require('./engine.js'),N=require('./narrative-math.js'),W=require('./moduli.js'),V=require('./vector-moduli.js');
let checks=0,states=0,roundtrip=0,maxContact=0,maxFace=0;
const ok=(h,m)=>{checks++;assert.ok(h,m);};
const near=(a,b,t=1e-7)=>ok(Math.abs(a-b)<t*(1+Math.abs(a)+Math.abs(b)),`${a} != ${b}`);
function verify(p){
 const d=W.diagnose(p),F=d.F,D=d.D;states++;
 for(const c of F.contacts){const i=Math.log2(c.s^c.t),ids=[0,1,2].filter(j=>c.s>>j&1),H=E.inverse(ids.map(j=>ids.map(k=>F.M[j][k]))),a=ids.map(j=>F.M[j][i]),b=E.mul(H,a),delta=1-E.dot(a,b);
 const l=F.p[i].map((v,k)=>v-ids.reduce((s,j,n)=>s+b[n]*F.p[j][k],0));
 for(let x=0;x<3;x++)for(let y=0;y<3;y++){let err=delta*(D[c.s][x][y]-D[c.t][x][y])-l[x]*l[y];maxContact=Math.max(maxContact,Math.abs(err));near(err,0,2e-6);}
 }
 for(const face of E.FACES)for(const key of ['chord','dualChord']){
  const ls=E.faceEdges(face).map(i=>F.contacts[i][key]),r=E.cross(ls[0],ls[1]),rn=E.norm(r);ok(rn>1e-9,'noncollapsed face');
  for(const l of ls){let err=Math.abs(E.dot(l,r))/rn;maxFace=Math.max(maxFace,err);near(err,0,2e-6);}
 }
 return d;
}
const p=N.defaults(),R=V.defaultReference;
near(V.residual(V.encode(p,R).V,V.identity()),0);
let unchanged=V.decode(V.identity(),p,R).p;
near(V.residual(N.family(3,p).p,N.family(3,unchanged).p),0);
// Each matrix entry has independent local influence and round-trips.
for(let i=0;i<3;i++)for(let j=0;j<3;j++)for(const sign of [-1,1]){
 const A=V.identity();A[i][j]+=sign*.00003;
 const d=V.decode(A,p,R);verify(d.p);near(V.residual(V.encode(d.p,R).V,A),0);roundtrip++;
 ok(W.distance(W.descriptor(p).values,W.descriptor(d.p).values)>1e-7,'genuine moduli change');
}
// All seven corners preserve parallel edges and have the requested displacement.
for(let s=1;s<8;s++){
 const delta=[.00002,-.00001,.00002],b=V.cornerMove(V.identity(),s,delta),A=V.transpose(b),d=V.decode(A,p,R);verify(d.p);
 const old=[0,1,2].filter(i=>s>>i&1).reduce((a,i)=>E.add(a,V.identity()[i]),[0,0,0]),next=[0,1,2].filter(i=>s>>i&1).reduce((a,i)=>E.add(a,b[i]),[0,0,0]);next.forEach((x,i)=>near(x-old[i],delta[i]));
 for(let i=0;i<3;i++)if(!(s>>i&1))assert.deepEqual(b[i],V.identity()[i]);
}
const rng=W.randomSource(482123);
for(let n=0;n<70;n++){
 let anchor=W.clone(p);anchor.inflation=anchor.inflation.map(x=>x+(rng.next()-.5)*.05);anchor.couplings=anchor.couplings.map(x=>x+(rng.next()-.5)*.1);
 verify(anchor);const frame=V.encode(anchor).A;
 const target=V.identity().map(r=>r.map(x=>x+(rng.next()-.5)*.00001));
 const d=V.decode(target,anchor,frame);verify(d.p);near(V.residual(V.encode(d.p,frame).V,target),0);roundtrip++;
}
// A rejected far edit must preserve a valid state and retain the chamber.
const huge=V.identity();huge[0][0]+=2;
const guarded=V.move(V.identity(),huge,p,R);ok(guarded.limited,'large step is clamped');verify(guarded.p);ok(guarded.fraction<1,'did not teleport to the target');
assert.throws(()=>V.recover([[2,0,0],[0,2,0],[0,0,-1]]));
assert.throws(()=>V.decode([[NaN,0,0],[0,1,0],[0,0,1]],p,R));
assert.throws(()=>V.cornerMove(V.identity(),0,[1,0,0]));
// Reference and magnification changes encode the SAME geometry.
const reference=V.encode(guarded.p).A;near(V.residual(V.encode(guarded.p,reference).V,V.identity()),0);
const record={status:'passed',checks,configurations:states,roundTrips:roundtrip,maxContact,maxFace,seed:482123,scope:'Numerical implementation tests of a local inverse, not a Lean moduli classification or certified path proof.'};
fs.writeFileSync(path.join(__dirname,'vector-test-results.json'),JSON.stringify(record,null,2)+'\n');console.log(record);
