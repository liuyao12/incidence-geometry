'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const E=require('./engine.js'),N=require('./narrative-math.js'),B=require('./cube-view.js');
let checks=0,cases=0,seed=20260918,maxIncidence=0,maxContact=0;
const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const ok=(h,msg)=>{checks++;assert.ok(h,msg);};
const near=(x,y,tol=2e-8)=>ok(Math.abs(x-y)<=tol*(1+Math.abs(x)+Math.abs(y)),`${x} != ${y}`);
const vnear=(a,b)=>a.forEach((x,i)=>near(x,b[i]));
const defaultP=N.defaults();
for(let c=0;c<45;c++){
 let p=N.defaults();p.u=p.u.map(x=>x+(rng()-.5)*.07);p.v=p.v.map(x=>x+(rng()-.5)*.07);
 for(const t of [0,.2,.7,1]){
  const f=N.family(t,p);near(f.error,0);maxIncidence=Math.max(maxIncidence,f.error);
  for(const pair of f.pairs)for(const P of pair)near(E.quad(f.Q,P),0);cases++;
 }
 for(const t of [1.25,1.75,2,2.35,2.7,3]){
  const f=N.family(t,p);near(f.error,0);cases++;
  if(t>2){
   const Q=N.normalizedDual(t,p).map(E.inverse);
   for(const con of f.contacts){
    const diff=N.matrixAdd(Q[con.t],N.matrixScale(Q[con.s],-1));
    const l=E.mul(Q[con.s],con.dualChord),k=l.reduce((i,x,j)=>Math.abs(x)>Math.abs(l[i])?j:i,0),factor=diff[k][k]/l[k]**2;
    const err=N.matrixNorm(N.matrixAdd(diff,N.matrixScale(E.outer(l),-factor)))/(1+N.matrixNorm(diff));
    near(err,0);maxContact=Math.max(maxContact,err);
    for(const T of con.primalPoints){near(E.quad(Q[con.s],T),0);near(E.quad(Q[con.t],T),0);}
   }
   for(const face of E.FACES){const ls=E.faceEdges(face).map(i=>f.contacts[i].chord);const P=N.unit(E.cross(ls[0],ls[1]));ls.forEach(l=>near(E.dot(l,P),0));}
  }
 }
 for(const h of [-.25,0,.25]){const f=N.dandelin(p,h);near(f.error,0);f.A.concat(f.B).forEach(P=>{near(P[0]**2+P[1]**2-P[2]**2,1);near(P[2],h);});cases++;}
 const S=B.shape(p);for(const [s,t]of E.EDGES){const i=Math.log2(s^t);vnear(N.sub(S.vertices[t],S.vertices[s]),S.basis[i]);}
 for(const face of E.FACES){const ps=face.map(i=>S.vertices[i]);near(E.dot(E.cross(N.sub(ps[1],ps[0]),N.sub(ps[2],ps[0])),N.sub(ps[3],ps[0])),0);}
 for(let i=0;i<3;i++){
  const old=B.chordData(p),next=B.moveChord(p,i,old[i].angle+2,old[i].distance-.004),fresh=B.chordData(next);
  near(fresh[i].angle,old[i].angle+2);near(fresh[i].distance,old[i].distance-.004);
  for(let j=0;j<3;j++)if(i!==j){vnear(fresh[j].line,old[j].line);}
  const Q=B.shape(next);ok(E.norm(N.sub(S.basis[i],Q.basis[i]))>1e-4,'Edited chord changes linked direction');cases++;
 }
}
for(let e=0;e<12;e++){
 const f=N.extrusion(defaultP,e);near(f.error,0);f.ring.forEach(P=>{near(E.quad(f.quadrics[f.c.s],P),0,1e-7);near(E.quad(f.quadrics[f.c.t],P),0,1e-7);near(E.dot(f.plane,P),0);});cases++;
}
const S=B.shape(defaultP);S.lengths.forEach(x=>near(x,1));S.angles.forEach(x=>near(x,90));near(S.volume,1);
const p=B.moveChord(defaultP,0,84,.82);B.shape(p,false).basis.forEach((v,i)=>vnear(v,[0,1,2].map(j=>+(i===j))));
for(const camera of [{yaw:.7,tilt:.3,zoom:1,perspective:true},{yaw:2,tilt:-1,zoom:1,perspective:false}])ok(B.projected(S,camera).flat().every(Number.isFinite),'camera finite');
assert.throws(()=>B.moveChord(defaultP,4,80,.8));assert.throws(()=>B.moveChord(defaultP,0,NaN,.8));
const report={status:'passed',cases,checks,seed:20260918,maxIncidence,maxContact,scope:'Numerical implementation tests of continuous families, spatial sections, all contact edges, face concurrency, chord edits and coefficient-space cube. Not new Lean proofs.'};
fs.writeFileSync(path.join(__dirname,'narrative-test-results.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
