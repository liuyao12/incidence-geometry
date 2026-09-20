/* Bidirectional regular chart: A = G M^-1, V = Aref^-1 A.
 * Columns of V are framed edge vectors, not an unframed Euclidean invariant.
 * Reconstruction and path guards use Float64; they are NOT Lean certificates.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'),require('./narrative-math.js'),require('./moduli.js'));
  else root.IncidenceVectors=factory(root.IncidenceMath,root.IncidenceNarrative,root.IncidenceModuli);
})(globalThis,(E,N,W)=>{
'use strict';
const transpose=A=>A[0].map((_,i)=>A.map(r=>r[i]));
const multiply=(A,B)=>A.map(row=>transpose(B).map(col=>E.dot(row,col)));
const identity=()=>[[1,0,0],[0,1,0],[0,0,1]], J=[[1,0,0],[0,1,0],[0,0,-1]];
const copy=A=>A.map(r=>r.slice());
const residual=(A,B)=>E.norm(A.flat().map((v,i)=>v-B.flat()[i]))/(1+E.norm(A.flat())+E.norm(B.flat()));
function matrix(A){if(!Array.isArray(A)||A.length!==3||A.some(r=>!Array.isArray(r)||r.length!==3||!r.every(Number.isFinite)))throw Error('Three finite 3D vectors are required.');return A;}
function inverse(A){matrix(A);const B=E.inverse(A),condition=E.norm(A.flat())*E.norm(B.flat());if(!Number.isFinite(condition)||condition>1e8)throw Error('The vector chart is ill-conditioned here. Try a smaller move or reframe.');return B;}
function encode(p,reference){
 const F=N.family(3,p),G=W.descriptor(p,F).gram,M=F.M,A=multiply(G,inverse(M));
 const V=reference?multiply(inverse(reference),A):A;
 return {A,G,M,P:F.p,V,basis:transpose(V)};
}
const defaultReference=encode(N.defaults()).A;
function recover(A){
 matrix(A);const a=A;
 const L=[[a[0][0]-a[1][1],a[0][2],-a[1][2]],[-a[2][0],a[1][1]-a[2][2],a[1][0]],[a[2][1],-a[0][1],a[2][2]-a[0][0]]];
 const r=[a[1][0]-a[0][1],a[2][1]-a[1][2],a[0][2]-a[2][0]];
 const [x,y,z]=E.mul(inverse(L),r),M=[[1,x,z],[x,1,y],[z,y,1]],raw=multiply(A,M);
 if(residual(raw,transpose(raw))>1e-8)throw Error('The symmetric reconstruction lost precision.');
 const G=raw.map((row,i)=>row.map((v,j)=>(v+raw[j][i])/2));
 if(residual(multiply(G,inverse(M)),A)>1e-8)throw Error('The vector chart cannot be reconstructed reliably here.');
 return {G,M};
}
// A continuous local lift of the Gram matrix. Relative to the old P, H starts
// at J. Its unpivoted LDL factorization keeps the (+,+,-) pivot signs.
function liftGram(G,P){
 const Pi=inverse(P),H=multiply(multiply(Pi,G),transpose(Pi)),L=identity(),d=[];
 for(let i=0;i<3;i++){
  d[i]=H[i][i];for(let k=0;k<i;k++)d[i]-=L[i][k]*L[i][k]*d[k];
  if((i===2?-d[i]:d[i])<1e-7)throw Error('This move leaves the current real Gram chart.');
  for(let j=i+1;j<3;j++){let n=H[j][i];for(let k=0;k<i;k++)n-=L[j][k]*L[i][k]*d[k];L[j][i]=n/d[i];}
 }
 const R=L.map(row=>row.map((v,j)=>v*Math.sqrt(Math.abs(d[j])))),out=multiply(P,R);
 if(residual(multiply(multiply(out,J),transpose(out)),G)>1e-8)throw Error('The lifted chord forms lost precision.');
 return out;
}
function toParameters(P,M,old){
 const p=W.clone(old),oldPairs=N.seedPairs(1,old);
 if(!(Math.abs(p.opening)>1e-7))throw Error('Open the regular Penrose configuration before editing its vectors.');
 P.forEach((v,i)=>{
  const w2=E.quad(J,v);if(w2<1e-6)throw Error('A weighted chord is approaching the real-contact boundary.');
  const w=Math.sqrt(w2),l=E.mul(J,v),n=l[0]*l[0]+l[1]*l[1],h2=1-l[2]*l[2]/n;
  if(h2<1e-7)throw Error('The seed chord is approaching tangency.');
  const mid=[-l[2]*l[0]/n,-l[2]*l[1]/n],side=E.scale([-l[1],l[0]],Math.sqrt(h2/n));
  let a=E.add(mid,side),b=N.sub(mid,side);const oldA=N.affine(oldPairs[i][0]);
  if(E.norm(N.sub(a,oldA))>E.norm(N.sub(b,oldA)))[a,b]=[b,a];
  const u=Math.abs(a[1])>.2?(1+a[0])/a[1]:a[1]/(1-a[0]);
  const vparam=Math.abs(1+b[0])>.2?b[1]/(1+b[0]):(1-b[0])/b[1];
  if(!Number.isFinite(u)||!Number.isFinite(vparam)||Math.min(Math.abs(u),Math.abs(vparam))<.101||Math.max(Math.abs(u),Math.abs(vparam))>100)throw Error('A seed reaches the boundary of the narrative coordinate chart.');
  p.u[i]=u;p.v[i]=vparam;p.inflation[i]=1-w;
 });
 p.couplings=W.pairOrder.map(([i,j])=>(M[i][j]-1)/p.opening);
 if(p.couplings.some(v=>v<=1e-5))throw Error('A face coupling leaves the current narrative chamber.');
 const F=N.family(3,p);
 if(residual(F.p,P)>1e-7)throw Error('The weighted-chord representative branch changed. Try a smaller move.');
 return p;
}
function decode(V,anchor,reference=defaultReference){
 matrix(V);const A=multiply(reference,V),{G,M}=recover(A),old=N.family(3,anchor);
 const P=liftGram(G,old.p),p=toParameters(P,M,anchor),d=W.diagnose(p);
 if(residual(encode(p,reference).V,V)>1e-7)throw Error('The reconstructed conics do not round-trip to these vectors.');
 return {p,diagnostics:d,G,M,A,P};
}
// A drag may request a point beyond a discriminant wall. Screen short steps,
// then bisect the first rejected step, never jumping straight to its far side.
function move(from,to,anchor,reference=defaultReference){
 matrix(from);matrix(to);const start=W.diagnose(anchor),span=E.norm(to.flat().map((v,i)=>v-from.flat()[i]));
 const steps=Math.min(32,Math.max(1,Math.ceil(span/.006)));
 const at=t=>from.map((row,i)=>row.map((v,j)=>v+(to[i][j]-v)*t));
 let accepted={p:W.clone(anchor),V:copy(from),fraction:0},reason='';
 const trial=t=>{const V=at(t),d=decode(V,anchor,reference);if(d.diagnostics.signature!==start.signature)throw Error('This move would cross a conic or contact degeneracy.');return {p:d.p,V,fraction:t};};
 for(let i=1;i<=steps;i++){
  const t=i/steps;try{accepted=trial(t);}catch(e){
   reason=e.message;let lo=accepted.fraction,hi=t;
   for(let j=0;j<9;j++){const mid=(lo+hi)/2;try{accepted=trial(mid);lo=mid;}catch{hi=mid;}}
   break;
  }
 }
 return {...accepted,limited:accepted.fraction<1-1e-8,reason};
}
function cornerMove(basis,corner,delta){
 matrix(basis);if(!Number.isInteger(corner)||corner<1||corner>7||!Array.isArray(delta)||delta.length!==3||!delta.every(Number.isFinite))throw Error('Choose one of the seven non-origin corners.');
 const ids=[0,1,2].filter(i=>corner>>i&1);
 return basis.map((v,i)=>ids.includes(i)?E.add(v,E.scale(delta,1/ids.length)):v.slice());
}
return {transpose,multiply,identity,copy,residual,encode,recover,liftGram,toParameters,decode,move,cornerMove,defaultReference};
});
