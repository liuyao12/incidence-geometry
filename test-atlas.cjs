'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),A=require('./atlas-data'),M=require('./atlas-extras-math'),E=require('./engine');
let checks=0,accepted=0;const test=(v,msg)=>{assert(v,msg);checks++;};
const ids=new Set(A.nodes.map(n=>n.id));test(ids.size===A.nodes.length,'Unique node ids');
const audit=new Set([...fs.readFileSync('formal/Audit.lean','utf8').matchAll(/^#print axioms (\S+)/gm)].map(m=>m[1]));
for(const n of A.nodes){test(n.title&&n.statement&&n.scope,'Nonempty statement and scope');test(fs.existsSync(n.demo.page),'Actual renderer for '+n.id);for(const name of n.lean)test(audit.has(name),'Existing audited declaration '+name);for(const href of [n.source,n.chapter])if(!href.startsWith('https:'))test(fs.existsSync(href.split(/[?#]/)[0]),'Local reference '+href);}
for(const e of A.edges){test(ids.has(e.from)&&ids.has(e.to),'Both edge endpoints');test(e.type in A.types,'Known relation type');test(!!e.note&&!!e.source,'Every relation has justification');}
test(!A.edges.some(e=>e.type==='implication'&&e.from==='conic-surface'&&e.to==='penrose'),'No compatibility-to-existence arrow');
test(!A.edges.some(e=>e.from==='bicolored'&&e.to==='conic-surface'),'General-to-special orientation');
test(!A.edges.some(e=>e.from==='conic-surface'&&e.to==='boundary'),'Boundary theorem is not a weaker corollary');
let seed=83214;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),jitter=(x,e)=>x+(rng()-.5)*e;
for(let k=0;k<220;k++){
 const p=M.defaults();p.circles=p.circles.map(c=>c.map(x=>jitter(x,.2)));p.r=p.r.map(r=>jitter(r,.15));const d=M.monge(p);accepted++;
 test(d.error<1e-10,'Monge and Desargues line incidence');
 [[0,1],[1,2],[2,0]].forEach(([i,j],h)=>{
  d.tangents[h].forEach(l=>{for(const t of [i,j]){test(Math.abs(E.dot(l,d.centers[t])-p.r[t])<1e-10,'External tangency signed distances');test(Math.abs(E.dot(l,d.X[h]))<1e-10,'Both external tangents contain homothety center');}});
  const lifted=M.sub(M.scale([...p.circles[i],p.r[i]],p.r[j]),M.scale([...p.circles[j],p.r[j]],p.r[i]));test(Math.abs(lifted[2])<1e-12,'Plane section lies in z=0');
  test(Math.hypot(...E.cross([lifted[0],lifted[1],p.r[j]-p.r[i]],d.X[h]))<1e-10,'Same point in spatial lift');
 });
 for(const kind of ['ceva','menelaus']){const t=M.defaults();t.triangle=t.triangle.map(c=>c.map(x=>jitter(x,.3)));t.s=jitter(1.5,.3);t.t=jitter(1.3,.3);const q=M.triangle(kind,t);accepted++;test(q.error<1e-10,kind+' criterion');}
 const t=M.defaults();t.five=t.five.map(c=>c.map(x=>jitter(x,.025)));t.angle=jitter(-.2,.025);const q=M.braikenridge(t);accepted++;test(q.error<1e-9,'Sixth point lies on independently fitted conic');
 const xs=Array.from({length:3},(_,i)=>M.cross(M.cross(q.six[i],q.six[(i+1)%6]),M.cross(q.six[(i+3)%6],q.six[(i+4)%6])));test(Math.abs(E.dot(M.cross(xs[0],xs[1]),xs[2]))<1e-10,'Converse hypothesis checked independently');
}
const p=M.defaults();p.r[1]=p.r[0];assert.throws(()=>M.monge(p));checks++;
const r={status:'passed',nodes:A.nodes.length,edges:A.edges.length,configurations:accepted,checks,scope:'Numerical and source-consistency tests, not new Lean proofs'};
fs.writeFileSync('atlas-test-results.json',JSON.stringify(r,null,2)+'\n');console.log(r);
