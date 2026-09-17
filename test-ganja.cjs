'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const E=require('./engine.js'),G=require('./pga.js');let seed=20260917,checks=0;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
const vector=()=>Array.from({length:3},()=>random()*2-1);
const near=(a,b,tol=1e-9)=>{checks++;assert.ok(Math.abs(a-b)<tol*(1+Math.abs(a)+Math.abs(b)),`${a} != ${b}`);};
const projectivelyEqual=(a,b)=>near(E.norm(E.cross(a,b))/(E.norm(a)*E.norm(b)),0);
const pin=JSON.parse(fs.readFileSync('vendor/manifest.json','utf8'));
for(const [file,hash] of Object.entries(pin.files)){
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('vendor/'+file)).digest('hex'),hash);
}
assert.ok(G.point([1,2,1]) instanceof Float64Array);
const ideal=G.meet(G.line([1,0,0]),G.line([1,0,-1]));
assert.ok(G.valid(ideal));assert.equal(G.pointCoordinates(ideal)[2],0);assert.equal(G.affine(ideal),null);
let maxPascal=0,maxConic=0,maxFomin=0;
for(let n=0;n<300;n++){
 const a=vector(),b=vector(),l=vector(),m=vector();
 projectivelyEqual(G.joinCoordinates(a,b),E.cross(a,b));
 projectivelyEqual(G.meetCoordinates(l,m),E.cross(l,m));
 near(G.incidence(G.point(a),G.line(l)),E.dot(a,l));
 const j=G.join(G.point(a),G.point(b));near(G.incidence(G.point(a),j),0);near(G.incidence(G.point(b),j),0);
}
for(let n=0;n<120;n++){
 const O=[.4*random()-.2,.4*random()-.2,1],ts=[.3+.13*random(),.53+.13*random(),.77+.13*random()];
 const d=G.fomin(O,ts),reference=E.fomin(O,ts);maxFomin=Math.max(maxFomin,d.error);
 d.labels.forEach((label,i)=>projectivelyEqual(label,reference.labels[i]));
 d.ratios.forEach(r=>near(r,1));near(d.thirdError,0);
}
for(let n=0;n<120;n++){
 const points=G.defaultFive().map(p=>[p[0]+.12*(random()-.5),p[1]+.12*(random()-.5),1]);
 const d=G.pascal(points,random()*Math.PI,100);maxPascal=Math.max(maxPascal,d.residual);near(d.residual,0);
 if(d.complete){near(d.incidenceResidual,0);near(G.incidence(d.sixth,d.ray),0);
  const F=G.pointCoordinates(d.sixth),[A,B,C,D,Fifth]=points;
  projectivelyEqual(G.pointCoordinates(d.X),E.cross(E.cross(A,D),E.cross(B,C)));
  projectivelyEqual(G.pointCoordinates(d.Y),E.cross(E.cross(A,F),E.cross(B,Fifth)));
  projectivelyEqual(G.pointCoordinates(d.Z),E.cross(E.cross(D,Fifth),E.cross(C,F)));
 }
 points.forEach(p=>near(G.evalCoefficients(d.coefficients,p),0));
}
for(let n=0;n<120;n++){
 const params=E.defaults('compact');params.couplings=params.couplings.map(()=>1.8*random()-.9);
 for(const Q of E.penrose(params).Q){
  const samples=G.conicSamples(Q,64);assert.ok(samples.length);samples.filter(G.valid).forEach(P=>{
   const x=G.pointCoordinates(P),r=Math.abs(E.quad(Q,x))/(1+E.dot(x,x));maxConic=Math.max(maxConic,r);near(r,0);
   const t=G.line(E.mul(Q,x));near(G.incidence(P,t),0);
  });
 }
}
// Non-elliptic conics and a nonsingular parabola, including ideal directions.
for(const Q of [[[1,0,0],[0,-1,0],[0,0,-1]],[[1,0,0],[0,0,-.5],[0,-.5,0]]])
 G.conicSamples(Q,128).filter(G.valid).forEach(P=>{const x=G.pointCoordinates(P);near(E.quad(Q,x)/(1+E.dot(x,x)),0);});
assert.throws(()=>G.pascal([[0,0,1],[1,0,1],[2,0,1],[0,1,1],[1,1,1]]),/no three collinear/);
const record={status:'passed',checks,cases:{joinMeet:300,incidenceCube:120,pascal:120,conicCubes:120},
 maxima:{pascalLocus:maxPascal,conicLocus:maxConic,incidenceRatios:maxFomin},
 engine:'ganja.js Float64 Cl(2,0,1)',upstreamCommit:pin.commit,
 scope:'Software tests and independent numerical cross-checks, not Lean theorem verification.'};
fs.writeFileSync('ganja-test-results.json',JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record,null,2));
