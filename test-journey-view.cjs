'use strict';
// Numerical implementation/regression checks. Not new Lean proof evidence.
const assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('./engine'),N=require('./narrative-math'),W=require('./moduli'),V=require('./vector-moduli'),H=require('./journey-view');
let checks=0,phases=0;const ok=(x,m)=>{checks++;assert.ok(x,m);},near=(a,b,t=1e-8)=>ok(Math.abs(a-b)<t*(1+Math.abs(a)+Math.abs(b)),`${a} != ${b}`);
const p=N.defaults(),s=JSON.stringify(p),A=JSON.stringify(V.encode(p).A);
// Recoverable regular endpoint, real contacts, and the intended visible conics.
ok(W.diagnose(p).realContacts===12,'all twelve real two-point contacts');
const final=N.family(3,p);for(const i of [0,1,2,4,7]){const q=H.conic(final.primal[i]);ok(!!(E.ellipse(q)||E.ellipse(q.map(r=>r.map(x=>-x)))),'visible ellipse '+i);}
V.recover(V.encode(p).A);
// A fixed display chart preserves incidence, conic equations and pointer inverse.
for(const phase of Array.from({length:121},(_,i)=>i/40)){
 const F=N.family(phase,p);phases++;near(F.error,0);
 for(const q of F.pairs.flat()){
  const r=H.toDiagram(q),back=H.fromDiagram(r);q.forEach((x,i)=>near(x,back[i]));
  near(E.quad(H.conic(F.kind==='classical'?F.Q:[[1,0,0],[0,1,0],[0,0,-1]]),r),0);
 }
 if(F.kind==='classical')F.lines.forEach((ls,k)=>ls.forEach(l=>near(E.dot(H.line(l),H.toDiagram(F.meetings[k])),0)));
 if(phase>2)for(const e of F.contacts){
  for(const t of e.primalPoints){near(E.quad(H.conic(F.primal[e.s]),H.toDiagram(t)),0);near(E.quad(H.conic(F.primal[e.t]),H.toDiagram(t)),0);near(E.dot(H.line(e.chord),H.toDiagram(t)),0);}
 }
 // Neither the family parameters nor its moduli controller depend on phase.
 ok(JSON.stringify(p)===s,'phase does not edit parameters');ok(JSON.stringify(V.encode(p).A)===A,'cube does not depend on transition phase');
}
// The default branches are explicit signs, not an accidental positive-only API.
const old={u:[2.13,-2.49,1.60],v:[1.47,-2.54,2.89],inflation:[.17,.12,.21],opening:.12,couplings:[1,1,1]};
for(const pp of [p,old]){
 const D=N.normalizedDual(3,pp);ok(D.length===8,'both signs of the regular opening');
 const r=V.encode(pp).A,d=V.decode(V.identity(),pp,r);near(V.residual(V.encode(d.p).A,r),0);
}
// Small inverse edits, then forward/backward sweeps of exactly that edited family.
for(let i=0;i<3;i++)for(let j=0;j<3;j++){
 const m=V.identity();m[i][j]+=.00001;const changed=V.decode(m,p,V.defaultReference).p;
 const stored=JSON.stringify(changed),endpoint=JSON.stringify(N.family(3,changed));
 for(const t of [0,.4,1,1.5,2,2.4,3,2,1,0,3]){near(N.family(t,changed).error,0);phases++;}
 ok(stored===JSON.stringify(changed),'inverse edit survives phase sweep');ok(endpoint===JSON.stringify(N.family(3,changed)),'same endpoint on return');
}
const report={status:'passed',checks,phases,realContacts:12,scope:'Fixed paper-like chart, incidence and pointer inverses, signed regular openings, phase-independent family controller and reversible edited paths. Numerical software tests, not Lean proofs.'};
fs.writeFileSync('journey-view-test-results.json',JSON.stringify(report,null,2)+'\n');console.log(report);
