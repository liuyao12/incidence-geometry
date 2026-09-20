/* The Penrose family from chapter 1, packaged as a closed conic-contact surface.
 * The cube is combinatorial; its camera is not a projectivity of the conics.
 * This is an evaluated example, not a replacement for the Lean surface theorem.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'),require('./narrative-math.js'),require('./journey-view.js'));
 else root.ConicCube=factory(root.IncidenceMath,root.IncidenceNarrative,root.IncidenceJourneyView);
})(globalThis,(E,N,J)=>{
 'use strict';
 const scale=(Q,t)=>Q.map(r=>r.map(x=>t*x));
 const frobenius=(A,B)=>E.dot(A.flat(),B.flat());
 const norm=Q=>Math.hypot(...Q.flat());
 const baseFaces=[0,2,4],oppositeFaces=[1,3,5];
 function build({amount=1.4,twist=.1,gauge=.7}={}){
  if(![amount,twist,gauge].every(Number.isFinite)||amount<.3||amount>1.8||Math.abs(twist)>.3||gauge<0||gauge>2)throw Error('Outside the displayed cube chart.');
  const p=N.defaults();
  p.inflation=p.inflation.map(x=>x*(1+.1*(amount/1.4-1)));
  p.opening*=1+.2*(twist-.1);
  const F=N.family(3,p),D=N.normalizedDual(3,p),I=D.map(E.inverse);
  const gauges=I.map((_,v)=>Math.exp(gauge*Math.sin((v+1)*1.7)));
  const Q=I.map((q,v)=>scale(J.conic(q),gauges[v]));
  const edges=E.EDGES.map(([s,t],i)=>{
   const l=F.contacts[i].dualChord,L=E.outer(l);
   const difference=D[t].map((row,a)=>row.map((x,b)=>x-D[s][a][b]));
   const k=frobenius(difference,L)/frobenius(L,L);
   const v=E.mul(I[s],l),chord=J.line(v),weight=-gauges[t]*k/(1+k*E.dot(l,v));
   const lambda=gauges[t]/gauges[s];
   const residual=Q[t].map((r,a)=>r.map((x,b)=>x-lambda*Q[s][a][b]-weight*chord[a]*chord[b]));
   const error=norm(residual)/(1+norm(Q[t]));
   return {source:s,target:t,chord,scale:lambda,weight,error};
  });
  const faces=E.FACES.map(vertices=>{
   const ee=E.faceEdges(vertices),directions=ee.map((e,k)=>edges[e].source===vertices[k]?1:-1);
   const ls=ee.map(e=>edges[e].chord),x=E.cross(ls[0],ls[1]),nx=E.norm(x);
   const point=nx>1e-12?E.scale(x,1/nx):null;
   const error=point?Math.max(...ls.map(l=>Math.abs(E.dot(l,point))/E.norm(l))):Infinity;
   const holonomy=ee.reduce((h,e,k)=>h*edges[e].scale**directions[k],1);
   return {vertices:vertices.slice(),edges:ee,directions,point,error,holonomy};
  });
  const maxEdge=Math.max(...edges.map(e=>e.error)),maxFace=Math.max(...faces.map(f=>f.error));
  const minDet=Math.min(...Q.map(q=>Math.abs(E.det(q))/norm(q)**3));
  if(!Number.isFinite(minDet)||minDet<1e-10||maxEdge>1e-7||maxFace>1e-7)throw Error('The cube is too close to a degenerate contact.');
  return {kind:'cube',Q,edges,faces,gauges,parameters:p,maxEdge,maxFace,minDet,product:faces.reduce((h,f)=>h*f.holonomy,1)};
 }
 return {build,baseFaces,oppositeFaces};
});
