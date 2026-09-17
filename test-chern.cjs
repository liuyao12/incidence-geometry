'use strict';
// The new arrangement is a genuine matrix-generated contact cube, not a tracing.
const assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('./engine.js'),G=require('./pga.js');
let seed=20260918,checks=0,maxEdge=0,maxFace=0,maxLocus=0,maxTangency=0;
const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const ok=(v,message)=>{checks++;assert.ok(v,message);};
const near=(x,tol,message)=>ok(Math.abs(x)<tol,message);
const defaults=E.defaults();assert.equal(defaults.diagonal,-.5);
assert.equal(E.defaults('compact').diagonal,3.5);
assert.throws(()=>E.defaults('missing'),/Unknown conic preset/);
for(let n=0;n<126;n++){
 const p=E.defaults();
 if(n){p.couplings=p.couplings.map(a=>a+.04*(rng()-.5));p.offsets=p.offsets.map(a=>a+.06*(rng()-.5));}
 const data=E.penrose(p),M=data.M;
 ok(M[0][0]<0&&E.det(M.slice(0,2).map(r=>r.slice(0,2)))>0&&E.det(M)<0,'M is negative definite');
 ok(data.seedIndependent,'nonconcurrent initial chords');
 maxEdge=Math.max(maxEdge,data.maxEdge);maxFace=Math.max(maxFace,data.maxFace);
 near(data.maxEdge,1e-11,'12 rank-one equations');near(data.maxFace,1e-10,'six face pencils');
 for(const [i,Q] of data.Q.entries()){
  const ellipse=E.ellipse(Q,96);ok(ellipse!==null,'all eight conics are real ellipses');
  for(const P of G.conicSamples(Q,96)){
   const x=G.pointCoordinates(P),error=Math.abs(E.quad(Q,x))/(1+E.norm(Q.flat())*E.dot(x,x));
   maxLocus=Math.max(maxLocus,error);near(error,1e-11,'native PGA conic sample');
   ok(x[0]**2+x[1]**2<=1+1e-9,'all conics inside the base circle');
   if(i===7)ok(Math.hypot(x[0],x[1])<.5,'completion is well separated from the outer conic');
  }
 }
 for(const edge of data.contacts){
  const pts=E.lineConic(data.Q[edge.s],edge.l);
  ok(pts.length===2,'every edge has two real contacts');
  ok(E.norm(E.add(pts[0],E.scale(pts[1],-1)))>.05,'contacts are distinct');
  for(const x of pts){
   near(E.quad(data.Q[edge.s],x),1e-10,'contact lies on source');
   near(E.quad(data.Q[edge.t],x),1e-10,'contact lies on target');
   near(E.dot(edge.l,x),1e-10,'contact is on the chord');
   const a=E.mul(data.Q[edge.s],x),b=E.mul(data.Q[edge.t],x);
   const err=E.norm(E.cross(a,b))/(E.norm(a)*E.norm(b));
   maxTangency=Math.max(maxTangency,err);near(err,1e-10,'tangent covectors are proportional');
  }
 }
}
const result={status:'passed',seed:20260918,cases:126,checks,maxima:{edge:maxEdge,face:maxFace,locus:maxLocus,tangency:maxTangency},scope:'Software checks of the Chern-inspired preset and nearby parameters, not new Lean proofs.'};
fs.writeFileSync('chern-test-results.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
