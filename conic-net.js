/* Conics on a 4×4 periodic surface. No free scalar labels are substituted
   for geometric contacts. Gauge changes rescale equations, not their loci. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'));else root.ConicNet=factory(root.IncidenceMath);})(globalThis,E=>{
'use strict';
const add=(A,B)=>A.map((r,i)=>r.map((x,j)=>x+B[i][j]));
const scale=(A,t)=>A.map(r=>r.map(x=>t*x));
const zero=()=>[[0,0,0],[0,0,0],[0,0,0]], J=[[1,0,0],[0,1,0],[0,0,-1]];
const id=(i,j)=>4*((i+4)%4)+(j+4)%4;
const parity=n=>((n>>2)+(n%4))%2;
const fnorm=A=>Math.hypot(...A.flat());
function assemble(Q,edges,faces){
 let maxEdge=0,maxFace=0,minDet=Infinity;
 for(const q of Q)minDet=Math.min(minDet,Math.abs(E.det(q))/fnorm(q)**3);
 for(const edge of edges){let err=0;for(let i=0;i<3;i++)for(let j=0;j<3;j++)err=Math.max(err,Math.abs(Q[edge.target][i][j]-edge.scale*Q[edge.source][i][j]-edge.weight*edge.chord[i]*edge.chord[j]));edge.error=err/(1+fnorm(Q[edge.target]));maxEdge=Math.max(maxEdge,edge.error);}
 for(const f of faces){const ls=f.edges.map(e=>edges[e].chord);const X=E.cross(ls[0],ls[1]),nx=E.norm(X);f.point=nx>1e-13?E.scale(X,1/nx):null;f.error=nx>1e-13?Math.max(...ls.map(l=>Math.abs(E.dot(l,X))/(E.norm(l)*nx))):Infinity;f.holonomy=edges[f.edges[0]].scale*edges[f.edges[2]].scale/(edges[f.edges[1]].scale*edges[f.edges[3]].scale);maxFace=Math.max(maxFace,f.error);}
 return {Q,edges,faces,maxEdge,maxFace,minDet,product:faces.reduce((p,f)=>p*f.holonomy,1)};
}
function torus({amount=1,twist=0,gauge=0,spread=2.8}={}){
 if(![amount,twist,gauge,spread].every(Number.isFinite)||amount<.2||amount>1.8||Math.abs(twist)>.35||gauge<0||gauge>3||spread<1||spread>3)throw Error('Outside the displayed regular chart.');
 const rotate=v=>[Math.cos(twist)*v[0]-Math.sin(twist)*v[1],Math.sin(twist)*v[0]+Math.cos(twist)*v[1],v[2]];
 const U=[[1,0,0],[0,1,0],[1,1,0],[1,-1,0]].map(v=>v.map(x=>x*spread)),a=rotate([1,2,.2]),b=rotate([3,-1,.3]),V=[a,b,E.add(a,b),E.add(a,E.scale(b,-1))],beta=[-.02,-.02,.01,.01].map(x=>x*amount);
 const S=[zero()],T=[zero()];for(let i=0;i<4;i++){S.push(add(S[i],scale(E.outer(U[i]),beta[i])));T.push(add(T[i],scale(E.outer(V[i]),beta[i])));}
 const C=Array.from({length:16},(_,n)=>add(J,add(S[n>>2],T[n%4]))),I=C.map(E.inverse),gauges=C.map((_,n)=>Math.exp(gauge*Math.sin((n+1)*1.7))),Q=I.map((q,n)=>scale(q,gauges[n]));
 const edges=[],lookup=new Map();
 for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let axis=0;axis<2;axis++){
  let s=id(i,j),t=axis===0?id(i+1,j):id(i,j+1);const v=axis===0?U[i]:V[j],k=axis===0?beta[i]:beta[j],chord=E.mul(I[s],v);let lambda=gauges[t]/gauges[s],weight=-gauges[t]*k/(1+k*E.dot(v,chord));
  if(parity(s)){[s,t]=[t,s];weight=-weight/lambda;lambda=1/lambda;}
  lookup.set([s,t].sort((x,y)=>x-y).join(','),edges.length);edges.push({source:s,target:t,chord,scale:lambda,weight});
 }
 const faces=[];
 for(let i=0;i<4;i++)for(let j=0;j<4;j++){
  let vertices=[id(i,j),id(i+1,j),id(i+1,j+1),id(i,j+1)];if(parity(vertices[0]))vertices.push(vertices.shift());
  const ee=vertices.map((x,k)=>lookup.get([x,vertices[(k+1)%4]].sort((a,b)=>a-b).join(',')));
  faces.push({i,j,vertices,edges:ee});
 }
 const result=assemble(Q,edges,faces);if(result.minDet<1e-5||result.maxEdge>1e-8||result.maxFace>1e-7)throw Error('The construction approaches a singular boundary.');
 return {...result,kind:'torus',C,gauges};
}
function noncoherent(){
 const Q=[[[-20,-16,14],[-16,-8,12],[14,12,-11]],[[-20,-16,14],[-16,-12,14],[14,14,-12]],[[-12,-8,6],[-8,-4,6],[6,6,-4]],[[-12,-8,6],[-8,-4,6],[6,6,-6]]];
 const chords=[[0,-2,1],[2,2,-2],[0,0,-1],[-2,0,-1]],lambda=[1,1,1,2],mu=[-1,2,-2,1];
 const edges=chords.map((chord,i)=>i%2?{source:(i+1)%4,target:i,chord,scale:1/lambda[i],weight:-mu[i]/lambda[i]}:{source:i,target:(i+1)%4,chord,scale:lambda[i],weight:mu[i]});
 return {...assemble(Q,edges,[{i:0,j:0,vertices:[0,1,2,3],edges:[0,1,2,3]}]),kind:'square'};
}
return {torus,noncoherent,id,parity};
});
