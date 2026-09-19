/* Conics on periodic quadrilateral surfaces (4×4 or an uncolored 3×4 torus). No free scalar labels are substituted
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
 for(const f of faces){const ls=f.edges.map(e=>edges[e].chord);const X=E.cross(ls[0],ls[1]),nx=E.norm(X);f.point=nx>1e-13?E.scale(X,1/nx):null;f.error=nx>1e-13?Math.max(...ls.map(l=>Math.abs(E.dot(l,X))/(E.norm(l)*nx))):Infinity;f.directions=f.edges.map((e,k)=>edges[e].source===f.vertices[k]?1:-1);f.holonomy=f.edges.reduce((h,e,k)=>h*edges[e].scale**f.directions[k],1);maxFace=Math.max(maxFace,f.error);}
 return {Q,edges,faces,maxEdge,maxFace,minDet,product:faces.reduce((p,f)=>p*f.holonomy,1)};
}
function torus({amount=1,twist=0,gauge=0,spread=2.8,rows=4}={}){
 if(rows!==3&&rows!==4)throw Error('Use three or four rows.');
 const id=(i,j)=>4*((i+rows)%rows)+(j+4)%4;
 if(![amount,twist,gauge,spread].every(Number.isFinite)||amount<.2||amount>1.8||Math.abs(twist)>.35||gauge<0||gauge>3||spread<1||spread>3)throw Error('Outside the displayed regular chart.');
 const rotate=v=>[Math.cos(twist)*v[0]-Math.sin(twist)*v[1],Math.sin(twist)*v[0]+Math.cos(twist)*v[1],v[2]];
 const U=(rows===4?[[1,0,0],[0,1,0],[1,1,0],[1,-1,0]]:[[1,0,0],[1,0,0],[1,0,0]]).map(v=>v.map(x=>x*spread)),a=rotate([1,2,.2]),b=rotate([3,-1,.3]),V=[a,b,E.add(a,b),E.add(a,E.scale(b,-1))],beta=[-.02,-.02,.01,.01].map(x=>x*amount),betaU=(rows===4?[-.02,-.02,.01,.01]:[-.012,-.016,.028]).map(x=>x*amount);
 const S=[zero()],T=[zero()];for(let i=0;i<rows;i++)S.push(add(S[i],scale(E.outer(U[i]),betaU[i])));for(let i=0;i<4;i++)T.push(add(T[i],scale(E.outer(V[i]),beta[i])));
 const C=Array.from({length:4*rows},(_,n)=>add(J,add(S[n>>2],T[n%4]))),I=C.map(E.inverse),gauges=C.map((_,n)=>Math.exp(gauge*Math.sin((n+1)*1.7))),Q=I.map((q,n)=>scale(q,gauges[n]));
 const edges=[],lookup=new Map();
 for(let i=0;i<rows;i++)for(let j=0;j<4;j++)for(let axis=0;axis<2;axis++){
  let s=id(i,j),t=axis===0?id(i+1,j):id(i,j+1);const v=axis===0?U[i]:V[j],k=axis===0?betaU[i]:beta[j],chord=E.mul(I[s],v);let lambda=gauges[t]/gauges[s],weight=-gauges[t]*k/(1+k*E.dot(v,chord));
  if(rows===4&&parity(s)){[s,t]=[t,s];weight=-weight/lambda;lambda=1/lambda;}
  lookup.set([s,t].sort((x,y)=>x-y).join(','),edges.length);edges.push({source:s,target:t,chord,scale:lambda,weight});
 }
 const faces=[];
 for(let i=0;i<rows;i++)for(let j=0;j<4;j++){
  let vertices=[id(i,j),id(i+1,j),id(i+1,j+1),id(i,j+1)];if(rows===4&&parity(vertices[0]))vertices.push(vertices.shift());
  const ee=vertices.map((x,k)=>lookup.get([x,vertices[(k+1)%4]].sort((a,b)=>a-b).join(',')));
  faces.push({i,j,vertices,edges:ee});
 }
 const result=assemble(Q,edges,faces);if(result.minDet<1e-5||result.maxEdge>1e-8||result.maxFace>1e-7)throw Error('The construction approaches a singular boundary.');
 return {...result,kind:rows===4?'torus':'odd',rows,cols:4,C,gauges};
}
function noncoherent(){
 const Q=[[[-20,-16,14],[-16,-8,12],[14,12,-11]],[[-20,-16,14],[-16,-12,14],[14,14,-12]],[[-12,-8,6],[-8,-4,6],[6,6,-4]],[[-12,-8,6],[-8,-4,6],[6,6,-6]]];
 const chords=[[0,-2,1],[2,2,-2],[0,0,-1],[-2,0,-1]],lambda=[1,1,1,2],mu=[-1,2,-2,1];
 const edges=chords.map((chord,i)=>i%2?{source:(i+1)%4,target:i,chord,scale:1/lambda[i],weight:-mu[i]/lambda[i]}:{source:i,target:(i+1)%4,chord,scale:lambda[i],weight:mu[i]});
 return {...assemble(Q,edges,[{i:0,j:0,vertices:[0,1,2,3],edges:[0,1,2,3]}]),kind:'square'};
}
/** Oriented patch balance. Non-boundary edges cancel before multiplying. */
function boundary(net,selected){
 const region=new Set(selected);
 if([...region].some(f=>!Number.isInteger(f)||f<0||f>=net.faces.length))throw Error('Unknown face in patch.');
 const incidence=net.edges.map(()=>({exponent:0,uses:0}));let faceProduct=1;
 for(const i of region){const f=net.faces[i];faceProduct*=f.holonomy;f.edges.forEach((e,k)=>{incidence[e].uses++;incidence[e].exponent+=f.directions[k];});}
 const boundaryEdges=[],internalEdges=[];
 incidence.forEach((v,e)=>{if(v.exponent)boundaryEdges.push({edge:e,direction:v.exponent,factor:net.edges[e].scale**v.exponent});else if(v.uses)internalEdges.push(e);});
 const boundaryProduct=boundaryEdges.reduce((p,e)=>p*e.factor,1);
 return {faces:[...region].sort((a,b)=>a-b),boundaryEdges,internalEdges,faceProduct,boundaryProduct,error:Math.abs(faceProduct-boundaryProduct)/(1+Math.abs(faceProduct)+Math.abs(boundaryProduct))};
}
function isBicolorable(net){
 const colors=new Map(),adj=net.Q.map(()=>[]);for(const e of net.edges){adj[e.source].push(e.target);adj[e.target].push(e.source);}
 for(let n=0;n<adj.length;n++){if(colors.has(n))continue;colors.set(n,0);const todo=[n];while(todo.length){const v=todo.pop();for(const u of adj[v]){if(colors.has(u)){if(colors.get(u)===colors.get(v))return false;}else{colors.set(u,1-colors.get(v));todo.push(u);}}}}return true;
}
/** C² interpolation used by the animation; endpoint state is never replaced. */
function interpolate(a,b,t){const u=Math.max(0,Math.min(1,t));if(u===0)return {...a};if(u===1)return {...b};const s=u**3*(10+u*(-15+6*u));return {amount:a.amount+(b.amount-a.amount)*s,twist:a.twist+(b.twist-a.twist)*s};}
return {torus,noncoherent,id,parity,boundary,isBicolorable,interpolate};
});
