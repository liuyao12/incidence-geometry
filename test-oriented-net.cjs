'use strict';
// Software checks for directed gluing and the new odd-cycle example.
// The Lean theorem proves the general statement independently of this code.
const assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('./engine.js'),N=require('./conic-net.js'),G=require('./narrative-math.js');
let seed=921407,checks=0,configs=0,patches=0,maxContact=0,maxBoundary=0;
const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const ok=(p,message)=>{checks++;assert.ok(p,message);};
const near=(a,b,t=1e-9)=>ok(Math.abs(a-b)<=t*(1+Math.abs(a)+Math.abs(b)),`${a} ≠ ${b}`);
for(const rows of [3,4])for(let k=0;k<100;k++){
 const d=N.torus({rows,amount:.3+1.5*rand(),twist:.6*rand()-.3,gauge:2*rand()});configs++;
 ok(N.isBicolorable(d)===(rows===4),'odd loop has no vertex coloring');
 ok(d.Q.length===4*rows&&d.edges.length===8*rows&&d.faces.length===4*rows,'torus counts');
 const occurrences=d.edges.map(()=>[]);
 for(const f of d.faces){for(let i=0;i<4;i++){
  const e=d.edges[f.edges[i]],sgn=f.directions[i];occurrences[f.edges[i]].push(sgn);
  ok((sgn===1?e.source:e.target)===f.vertices[i],'side begins at face corner');
  ok((sgn===1?e.target:e.source)===f.vertices[(i+1)%4],'side ends at next corner');
 }near(f.holonomy,1);ok(f.point&&f.error<1e-8,'proper concurrent face');}
 for(const a of occurrences)ok(a.length===2&&a[0]+a[1]===0,'opposite directed occurrences');
 for(const e of d.edges){
  maxContact=Math.max(maxContact,e.error);ok(e.error<1e-8,'rank-one contact');
  const points=G.lineConic(d.Q[e.source],e.chord);ok(points.length===2,'two real contact points');
  for(const p of points){near(E.quad(d.Q[e.source],p),0);near(E.quad(d.Q[e.target],p),0);}
 }
 for(let s=0;s<8;s++){
  const patch=d.faces.map((_,i)=>i).filter(()=>rand()<.45),b=N.boundary(d,patch);patches++;
  maxBoundary=Math.max(maxBoundary,b.error);ok(b.error<1e-9,'patch boundary equals face product');
  for(const e of b.internalEdges)ok(!b.boundaryEdges.some(v=>v.edge===e),'internal cancellation');
 }
 const whole=N.boundary(d,d.faces.map((_,i)=>i));ok(whole.boundaryEdges.length===0,'closed surface has empty boundary');near(whole.boundaryProduct,1);
 const b=N.boundary(d,[0,1,4,5]);ok(b.internalEdges.length===4&&b.boundaryEdges.length===8,'two-by-two patch counts');
 // Check the unrestricted scalar identity with noncoherent edge values too.
 const scalar={...d,edges:d.edges.map(e=>({...e,scale:1+Math.floor(11*rand())}))};
 scalar.faces=d.faces.map(f=>({...f,holonomy:f.edges.reduce((a,e,i)=>a*scalar.edges[e].scale**f.directions[i],1)}));
 const b2=N.boundary(scalar,[0,1,4,5]);ok(b2.error<1e-9,'boundary formula does not assume coherence');
}
const bad=N.noncoherent(),b=N.boundary(bad,[0]);near(b.faceProduct,2);near(b.boundaryProduct,2);
assert.throws(()=>N.boundary(bad,[2]));assert.throws(()=>N.torus({rows:5}));
const a={amount:1.7,twist:.27},z={amount:.6,twist:-.18};
assert.deepEqual(N.interpolate(a,z,0),a);assert.deepEqual(N.interpolate(a,z,1),z);
for(let i=0;i<=100;i++){const m=N.interpolate(a,z,i/100);ok(m.amount>=.6-1e-12&&m.amount<=1.7+1e-12,'motion bounded');ok(m.twist>=-.18-1e-12&&m.twist<=.27+1e-12,'motion bounded');}
const r={status:'passed',checks,configurations:configs,patches,seed:921407,maxContact,maxBoundary,scope:'Numerical implementation tests; independent of Lean theorem verification.'};
fs.writeFileSync('oriented-net-test-results.json',JSON.stringify(r,null,2)+'\n');console.log(r);
