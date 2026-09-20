'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),F=require('./fomin-classics.js'),E=require('./engine.js');
let seed=230507728,checks=0,configs=0,rejected=0;
const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const check=(b,m)=>{checks++;assert.ok(b,m);};
for(const [name,v] of Object.entries({desargues:[8,12,6,2],pappus:[9,18,9,0],quadrangle:[11,18,9,2]})){
 const m=F.models[name],t=m.topology;check(JSON.stringify([t.V,t.E,t.F,t.chi])===JSON.stringify(v),'paper topology');
 for(const pair of t.edges){check(pair.length===2,'two sides');check(pair[0].a===pair[1].b&&pair[0].b===pair[1].a,'oppositely oriented gluing');}
 const types={};for(const f of m.faces)f.cycle.forEach((n,i)=>{check(types[n]===undefined||types[n]===i%2,'global point-line coloring');types[n]=i%2;});
 for(let sample=0;sample<600;sample++){
  const p=F.defaults()[name];
  const disturb=v=>v.map((x,i)=>i===2?x:x+(rand()-.5)*.12);
  if(name==='desargues'){p.O=disturb(p.O);p.base=p.base.map(disturb);p.ts=p.ts.map(t=>t+(rand()-.5)*.10);}
  else if(name==='pappus'){p.A=disturb(p.A);p.B=disturb(p.B);p.seeds=p.seeds.map(disturb);}
  else {p.base=p.base.map(disturb);p.B1=disturb(p.B1);p.t=.20+rand()*.27;p.release=rand();}
  let d;try{d=F.build(name,p);}catch(e){rejected++;continue;}configs++;
  check(d.minPairing>1e-7,'all geometric edge hypotheses');
  check(d.error<1e-8,'actual face coherence');check(Math.abs(d.product-1)<1e-8,'global product');
  for(const r of d.results){check(Math.abs(r.ratio-1)<1e-8,'evaluated, not prescribed, cross-ratio');check(Math.abs(E.dot(r.line,r.point))<1e-8,'join meets intersection');}
  // The conclusion is read independently from the completed construction.
  const residual=name==='desargues'?E.dot(F.cross(d.points.B,d.points.C),F.unit(d.points.A)):
   name==='pappus'?E.dot(d.lines.s36,F.unit(d.points.C)):E.dot(d.lines.m34,F.unit(d.points.P34));
  check(Math.abs(residual)<1e-8,'classical conclusion');
  if(sample<40){
   const pts=structuredClone(d.points);
   // Independent nonzero representative rescalings at every vertex.
   for(const n of Object.keys(pts)){let s=(rand()>.5?1:-1)*(.3+rand()*3);pts[n]=pts[n].map(x=>s*x);}
   const ls=Object.fromEntries(Object.entries(d.lines).map(([n,v])=>{const s=(rand()>.5?1:-1)*(.4+rand()*2);return[n,v.map(x=>x*s)];}));
   const q=F.evaluate(m,pts,ls);check(q.error<1e-8,'representative invariance');
   const dualFaces=m.faces.map(f=>({...f,cycle:[f.cycle[1],f.cycle[2],f.cycle[3],f.cycle[0]]}));
   const dual=F.evaluate({...m,faces:dualFaces},ls,pts);check(dual.error<1e-8,'same configuration dualizes');
  }
 }
}
check(configs>1750,'nonvacuous randomized coverage');
for(let i=0;i<=200;i++){
 const p=F.defaults().quadrangle;p.release=i/200;const d=F.build('quadrangle',p);configs++;
 check(d.error<1e-9,'continuous common-line release');
 const triple=Math.abs(E.dot(F.cross(d.points.P14,d.points.P24),F.unit(d.points.P34)));
 check(i===0?triple<1e-10:triple>1e-7,'release truly removes the common line');
}
// An arbitrary labeling does not magically satisfy every face.
const d=F.build('pappus',F.defaults().pappus),pts=structuredClone(d.points);pts.P3[0]+=.1;
const broken=F.evaluate(F.models.pappus,pts,d.lines);
check(broken.results.filter(r=>Math.abs(r.ratio-1)>1e-4).length>=2,'face conditions have content');
check(Math.abs(broken.product-1)<1e-9,'surface cancellation is unconditional');
assert.throws(()=>F.cross([1,0,1],[1,0,1]));checks++;
const report={status:'passed',configurations:configs,rejectedNearDegeneracy:rejected,checks,
 models:['Figure 5: Desargues sphere','Figure 9: Pappus torus','Figure 15: quadrangle sphere; Theorems 3.3 and 3.4'],
 scope:'Numerical and combinatorial software checks, not new Lean proofs.'};
fs.writeFileSync('fomin-classics-test-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
