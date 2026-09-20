/* Numerical regression for the worked bridge, not a formal proof oracle. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('./engine.js'),N=require('./narrative-math.js'),J=require('./journey-view.js'),Cube=require('./conic-cube.js'),Net=require('./conic-net.js');
let checks=0;function check(p,message){checks++;assert.ok(p,message);}
const norm=Q=>Math.hypot(...Q.flat());
function projectiveError(A,B){const a=A.flat(),b=B.flat(),t=E.dot(a,b)/E.dot(b,b);return E.norm(a.map((x,i)=>x-t*b[i]))/E.norm(a);}
let seed=826241;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
let largestContact=0,largestConcurrence=0;
for(let i=0;i<121;i++){
 const params=i?{amount:.3+1.5*rnd(),twist:-.3+.6*rnd(),gauge:2*rnd()}:{};
 const net=Cube.build(params),F=N.family(3,net.parameters);
 check(net.Q.length===8&&net.edges.length===12&&net.faces.length===6,'Cube topology counts');
 check(Net.isBicolorable(net),'The cubical graph still admits a coloring, although the conic theorem does not need one');
 net.Q.forEach((Q,j)=>check(projectiveError(Q,J.conic(F.primal[j]))<1e-8,'Each displayed conic is the chapter-one conic up to scale'));
 for(const e of net.edges){
  check(e.error<1e-8&&Number.isFinite(e.weight)&&Math.abs(e.weight)>1e-14,'Proper rank-one contact');
  const points=N.lineConic(net.Q[e.source],e.chord);check(points.length===2,'Two real contact points');
  for(const x of points){check(Math.abs(E.quad(net.Q[e.target],x))/(norm(net.Q[e.target])*E.norm(x)**2)<1e-8,'Common section');check(E.norm(E.cross(E.unit(E.mul(net.Q[e.source],x)),E.unit(E.mul(net.Q[e.target],x))))<1e-8,'Common tangent');}
 }
 for(const f of net.faces){check(f.error<1e-8,'All four original contact chords concur');check(Math.abs(f.holonomy-1)<1e-10,'Face holonomy evaluated from edge transport');}
 check(Math.abs(net.product-1)<1e-10,'Total face product');
 for(let e=0;e<12;e++){
  const uses=[];net.faces.forEach(f=>f.edges.forEach((j,k)=>{if(j===e)uses.push(f.directions[k]);}));
  check(uses.length===2&&uses[0]===-uses[1],'Each edge cancels with its reverse');
 }
 for(let mask=0;mask<64;mask++){
  const B=Net.boundary(net,net.faces.map((_,j)=>j).filter(j=>mask>>j&1));check(B.error<1e-10,'Every cubical patch satisfies boundary balance');
 }
 const a=Net.boundary(net,Cube.baseFaces),b=Net.boundary(net,Cube.oppositeFaces);
 check(a.internalEdges.length===3&&b.internalEdges.length===3,'Three internal edges per patch');
 check(a.boundaryEdges.length===6&&b.boundaryEdges.length===6,'Six boundary edges');
 for(const e of a.boundaryEdges){const f=b.boundaryEdges.find(f=>f.edge===e.edge);check(f&&f.direction===-e.direction,'Same labeled boundary, reversed induced orientation');}
 check(Math.abs(a.boundaryProduct*b.boundaryProduct-1)<1e-10,'Reciprocal patch boundary products');
 largestContact=Math.max(largestContact,net.maxEdge);largestConcurrence=Math.max(largestConcurrence,net.maxFace);
}
const a=Cube.build({gauge:0}),b=Cube.build({gauge:1.7});
check(a.edges.some((e,i)=>Math.abs(e.scale-b.edges[i].scale)>.01),'Gauge genuinely changes edge values');
a.Q.forEach((q,i)=>check(projectiveError(q,b.Q[i])<1e-12,'Gauge does not change conic loci'));
assert.throws(()=>Cube.build({amount:NaN}));assert.throws(()=>Cube.build({gauge:3}));
const result={status:'passed',configurations:121,patches:121*64,checks,largestContact,largestConcurrence,scope:'Numerical tests of a worked Penrose surface example and its match to chapter 1; no new formal theorem.'};
fs.writeFileSync('conic-bridge-test-results.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
