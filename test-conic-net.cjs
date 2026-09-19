'use strict';
// Numerical regression of the rendered conic net; the proof is checked in Lean.
const assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('./engine.js'),N=require('./narrative-math.js'),Net=require('./conic-net.js');
let seed=20260919,checks=0,cases=0,maxContact=0,maxFace=0;
function rng(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function ok(v,m){checks++;assert.ok(v,m);}
function near(a,b,t=1e-8){ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<t*(1+Math.abs(a)+Math.abs(b)),`${a} vs ${b}`);}
function projectivelyEqual(a,b){const k=a.findIndex(x=>Math.abs(x)>1e-9);return k>=0&&a.every((x,i)=>Math.abs(x*b[k]-b[i]*a[k])<1e-8*(1+Math.abs(x*b[k])+Math.abs(b[i]*a[k])));}
for(let n=0;n<242;n++){
 const p={amount:n===0?1.4:.3+1.5*rng(),twist:n===0?.1:.6*rng()-.3,gauge:2*rng()};
 const d=Net.torus(p);cases++;maxContact=Math.max(maxContact,d.maxEdge);maxFace=Math.max(maxFace,d.maxFace);
 ok(d.Q.length===16&&d.edges.length===32&&d.faces.length===16,'net counts');ok(d.minDet>1e-5,'regular conics');ok(d.maxEdge<1e-8&&d.maxFace<1e-7,'contacts and concurrences');near(d.product,1);
 const occurrences=Array.from({length:32},()=>[0,0]);
 d.faces.forEach(f=>{near(f.holonomy,1);ok(f.point!==null,'concurrence point');f.edges.forEach((e,i)=>occurrences[e][i%2]++);});
 occurrences.forEach(x=>ok(x[0]===1&&x[1]===1,'one edge occurrence per orientation'));
 for(let i=0;i<16;i++)for(let j=0;j<i;j++)ok(!projectivelyEqual(d.Q[i].flat(),d.Q[j].flat()),'conics are distinct');
 for(const edge of d.edges){
  ok(Net.parity(edge.source)===0&&Net.parity(edge.target)===1,'bicolored edge');
  const roots=N.lineConic(d.Q[edge.source],edge.chord);ok(roots.length===2,'two real contact points');ok(E.norm(E.cross(...roots))>1e-7,'distinct contacts');
  for(const x of roots){near(E.dot(edge.chord,x),0);near(E.quad(d.Q[edge.source],x),0);near(E.quad(d.Q[edge.target],x),0);near(E.norm(E.cross(E.mul(d.Q[edge.source],x),E.mul(d.Q[edge.target],x))),0);}
 }
 const g=Net.torus({...p,gauge:p.gauge+.2});g.Q.forEach((q,i)=>ok(projectivelyEqual(q.flat(),d.Q[i].flat()),'gauge preserves conic'));g.edges.forEach((e,i)=>{ok(projectivelyEqual(e.chord,d.edges[i].chord),'gauge preserves chord');ok(Math.abs(e.scale)>0,'nonzero transport');});
}
const square=Net.noncoherent();near(square.faces[0].holonomy,2);ok(square.maxEdge<1e-8&&square.minDet>0,'noncoherent example contacts');ok(square.maxFace>1e-3,'noncoherent example not concurrent');
assert.throws(()=>Net.torus({amount:10}));assert.throws(()=>Net.torus({twist:NaN}));
const result={status:'passed',checks,configurations:cases,seed:20260919,maxContact,maxFace,scope:'Numerical software checks; theorem verification is independent and performed by Lean.'};fs.writeFileSync('conic-net-test-results.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
