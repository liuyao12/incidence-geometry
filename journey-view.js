/* One fixed projective display chart for the whole Pappus-to-Penrose path.
 * It changes presentation, never the conics or their incidence data.
 * The inverse is used for pointer edits, so rendered and editable points agree.
 * In the canonical chart x²+t y²=w² becomes a pair of nearly horizontal lines
 * at t=0 and a horizontal ellipse at t=1. All subsequent conics use the SAME H.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'),require('./narrative-math.js'),require('./pga.js'));
 else root.IncidenceJourneyView=factory(root.IncidenceMath,root.IncidenceNarrative,root.IncidencePGA);
})(globalThis,(E,N,G)=>{
 'use strict';
 const a=1.5,k=.12,cx=a*k/(1-k*k);
 const H=[[0,-a-cx*k,-cx],[1,0,0],[0,k,1]],inverse=E.inverse(H);
 const transpose=A=>A[0].map((_,j)=>A.map(r=>r[j]));
 const times=(A,B)=>A.map(r=>transpose(B).map(c=>E.dot(r,c)));
 const toDiagram=p=>E.mul(H,p),fromDiagram=p=>E.mul(inverse,p);
 const line=l=>E.mul(transpose(inverse),l);
 const conic=Q=>times(times(transpose(inverse),Q),inverse);
 function wrap(R){
  const affine=ps=>ps.map(p=>N.affine(toDiagram([...p.slice(0,2),1])));
  return {
   begin:v=>R.begin(v),finish:()=>R.finish(),
   layer:(opacity,draw)=>R.layer(opacity,draw),
   point:(p,...args)=>R.point(toDiagram(p instanceof G.algebra?G.pointCoordinates(p):p),...args),
   line:(l,...args)=>R.line(line(l),...args),
   conic:(Q,...args)=>R.conic(conic(Q),...args),
   path:(ps,...args)=>{
    const pts=ps.map(p=>toDiagram([...p.slice(0,2),1]));
    for(let i=1;i<pts.length;i++){
     const p=pts[i-1],q=pts[i],u=N.affine(p),v=N.affine(q);
     if(u&&v&&p[2]*q[2]>0)R.path([u,v],...args);
    }
   },
   // Do not turn a polygon crossing the horizon into a canvas-covering fill.
   polygon:(ps,...args)=>{const p=ps.map(v=>toDiagram([...v.slice(0,2),1]));if(p.every(q=>q[2]*p[0][2]>1e-10)){const out=affine(ps);if(out.every(Boolean))R.polygon(out,...args);}},
  };
 }
 return {H,inverse,toDiagram,fromDiagram,line,conic,wrap};
});
