/* Continuous projective configurations; no interpolated conic pictures.
 * The family is our choice of coordinates, not coordinates copied from the paper.
 * References: Arnold et al., arXiv:2409.17150v8, §§1, 4.4, 5.3, 7.2.
 * Algebra is evaluated numerically. The independent Lean library is unchanged.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'),require('./pga.js'),require('./vendor/ganja.js'));
  else root.IncidenceNarrative=factory(root.IncidenceMath,root.IncidencePGA,root.Algebra);
})(globalThis,(E,G,Algebra)=>{
'use strict';
const {dot,norm,scale,add,outer,mul,quad,cross,det}=E;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
const sub=(a,b)=>add(a,scale(b,-1));
const unit=a=>{const n=norm(a);if(!Number.isFinite(n)||n<1e-13)throw Error('A projective construction has collapsed. Move the seed away from this degeneracy.');return scale(a,1/n);};
const affine=p=>Math.abs(p[p.length-1])<1e-10*norm(p)?null:p.slice(0,-1).map(x=>x/p[p.length-1]);
const matrixScale=(A,t)=>A.map(r=>r.map(x=>x*t));
const matrixAdd=(A,B)=>A.map((r,i)=>r.map((x,j)=>x+B[i][j]));
const matrixNorm=A=>norm(A.flat());
const normalized=A=>{const n=matrixNorm(A);if(n<1e-14)return null;return matrixScale(A,1/n);};
function adj(A){return A.map((_,i)=>A.map((_,j)=>(i+j)%2?-det(A.filter((_,k)=>k!==j).map(r=>r.filter((_,l)=>l!==i))):det(A.filter((_,k)=>k!==j).map(r=>r.filter((_,l)=>l!==i)))));}
const identity3=()=>[[1,0,0],[0,1,0],[0,0,1]];
const baseDual=()=>[[1,0,0],[0,1,0],[0,0,-1]];
const pairIndices=[[0,1],[1,2],[2,0]], masks=[3,6,5];
const names=['A','A′','B','B′','C','C′'];
const defaults=()=>({u:[2.13,-2.49,1.60],v:[1.47,-2.54,2.89],inflation:[.17,.12,.21],opening:.12,couplings:[1,1,1]});
function validate(p){
  for(const key of ['u','v','inflation'])if(!Array.isArray(p[key])||p[key].length!==3||!p[key].every(Number.isFinite))throw Error('Invalid seed parameters.');
  if(p.couplings&&(!Array.isArray(p.couplings)||p.couplings.length!==3||!p.couplings.every(Number.isFinite)))throw Error('Invalid face couplings.');
  if(!Number.isFinite(p.opening))throw Error('Invalid cube opening.');
  if([...p.u,...p.v].some(x=>Math.abs(x)<.1))throw Error('A seed is too near the excluded zero parameter.');
}
// x² + t y² = w². At t=0 the carrier is x=±w; at t=1 it is a circle.
function seedPairs(t,p=defaults()){
  validate(p);return p.u.map((u,i)=>{
    const v=p.v[i];return [[u*u-t,2*u,u*u+t],[t-v*v,2*v,v*v+t]].map(unit);
  });
}
function classical(t,p=defaults()){
  const pairs=seedPairs(t,p), lines=[],meetings=[];
  for(const [i,j] of pairIndices){
    const l=unit(G.joinCoordinates(pairs[i][0],pairs[j][1])),m=unit(G.joinCoordinates(pairs[i][1],pairs[j][0]));
    lines.push([l,m]);meetings.push(unit(G.meetCoordinates(l,m)));
  }
  const axis=unit(G.joinCoordinates(meetings[0],meetings[1]));
  const error=Math.max(...meetings.map(P=>Math.abs(dot(axis,P))));
  return {pairs,lines,meetings,axis,Q:[[1,0,0],[0,t,0],[0,0,-1]],error};
}
// Restrict a homogeneous conic to a homogeneous line, including ideal roots.
// Using an orthonormal basis here is a numerical coordinate choice, not a metric
// assumption in any incidence theorem.
function lineConic(Q,l){
  const L=unit(l),axis=[0,1,2].reduce((i,j)=>Math.abs(L[j])<Math.abs(L[i])?j:i,0);
  const e=[0,0,0];e[axis]=1;
  const u=unit(cross(L,e)),v=cross(L,u),a=quad(Q,u),b=2*dot(u,mul(Q,v)),c=quad(Q,v),sc=Math.max(Math.abs(a),Math.abs(b),Math.abs(c),1e-30);
  let D=b*b-4*a*c;if(D< -1e-11*sc*sc)return [];
  D=Math.max(0,D);
  if(Math.abs(c)>1e-12*sc){
    // solve a s²+b s t+c t²=0 with s=1
    const q=-.5*(b+(b<0?-1:1)*Math.sqrt(D));
    if(Math.abs(q)<1e-14*sc)return [unit(u)];
    return [unit(add(scale(u,c),scale(v,q))),unit(add(scale(u,q),scale(v,a)))];
  }
  if(Math.abs(b)>1e-12*sc)return [unit(v),unit(add(scale(u,b),scale(v,-a)))];
  return Math.abs(a)>1e-12*sc?[unit(v)]:[];
}
function poles(p=defaults()){
  const C=classical(1,p),Q=baseDual();
  const raw=C.pairs.map(([A,B])=>{
    const l=unit(G.joinCoordinates(A,B)),s=quad(Q,l);
    if(s<1e-10)throw Error('Two endpoints coincide, or the chord is too close to tangency.');
    return scale(mul(Q,l),1/Math.sqrt(s));
  });
  // Choose the compatible common-tangent branches that converge to the same
  // labeled cross-joins as Pappus/Pascal. Four sign choices are enough.
  let best=null;
  for(const b of [-1,1])for(const c of [-1,1]){
    const P=raw.map((v,i)=>scale(v,[1,b,c][i]));
    let err=0;
    try{err=Math.max(...pairIndices.map(([i,j],k)=>norm(cross(unit(sub(P[i],P[j])),C.meetings[k]))));}catch{continue;}
    if(!best||err<best.err)best={P,err};
  }
  if(!best||best.err>1e-6)throw Error('The selected point-pair branch is degenerate. Move a seed slightly.');
  return {...C,p:best.P};
}
function family(phase,p=defaults()){
  phase=clamp(phase,0,3);
  if(phase<=1)return {...classical(ease(phase),p),phase,kind:'classical',t:ease(phase)};
  const C=poles(p),inflate=ease(phase-1),open=ease(phase-2)*p.opening,rho=1+open;
  const P=C.p.map((x,i)=>scale(x,1-inflate*p.inflation[i])),R=[],Q0=baseDual();
  R[0]=Q0;
  [1,2,4].forEach((s,i)=>R[s]=matrixAdd(Q0,matrixScale(outer(P[i]),-1)));
  // Independent pair couplings (12,23,31). Equal values recover the original
  // narrative path; all three still tend to one at the Salmon boundary.
  const [a,c,b]=p.couplings||[1,1,1], z=open;
  const rates=[[0,a,b],[a,0,c],[b,c,0]], M=rates.map((row,i)=>row.map((r,j)=>i===j?1:1+z*r));
  pairIndices.forEach(([i,j],k)=>{
    const mij=M[i][j];
    R[masks[k]]=matrixAdd(matrixScale(Q0,1-mij*mij),matrixAdd(matrixScale(matrixAdd(outer(P[i]),outer(P[j])),-1),matrixScale(matrixAdd(outer(P[i],P[j]),outer(P[j],P[i])),mij)));
  });
  // Divide the bordered 4x4 determinant by its common factor z SYMBOLICALLY.
  // det(M)/z = z * (2(ab+ac+bc)-a²-b²-c² + 2zabc).
  // This is valid for unequal couplings and does not divide numerically near z=0.
  const K=2*(a*b+a*c+b*c)-a*a-b*b-c*c, opposite=[c,b,a];
  R[7]=matrixScale(Q0,z*(K+2*z*a*b*c));
  P.forEach((v,i)=>R[7]=matrixAdd(R[7],matrixScale(outer(v),2*opposite[i]+z*opposite[i]*opposite[i])));
  pairIndices.forEach(([i,j])=>{
    const k=3-i-j, coefficient=rates[i][k]+rates[j][k]-rates[i][j]+z*rates[i][k]*rates[j][k];
    R[7]=matrixAdd(R[7],matrixScale(matrixAdd(outer(P[i],P[j]),outer(P[j],P[i])),-coefficient));
  });
  const meetings=pairIndices.map(([i,j])=>unit(sub(P[i],P[j]))),axis=unit(G.joinCoordinates(meetings[0],meetings[1]));
  const tangentPairs=pairIndices.map(([i],k)=>lineConic(R[1<<i],meetings[k]));
  const contacts=E.EDGES.map(([s,t])=>{
    const k=Math.log2(s^t),ids=[0,1,2].filter(i=>s>>i&1);let l;
    if(ids.length===0)l=P[k];
    else if(ids.length===1)l=sub(P[k],scale(P[ids[0]],M[k][ids[0]]));
    else {
      const [i,j]=ids,h=rates[i][j],b=rates[i][k],c=rates[j][k];
      // The top-edge linear minor also has the common factor -z.
      l=add(scale(P[k],2*h+z*h*h),add(scale(P[i],b-h-c-z*h*c),scale(P[j],c-h-b-z*h*b)));
    }
    l=unit(l);
    const tangents=lineConic(R[s],l),primalPoints=tangents.map(x=>mul(R[s],x)).filter(x=>norm(x)>1e-10).map(unit);
    const chord=mul(adj(R[s]),l);
    return {s,t,dualChord:l,chord:norm(chord)>1e-10?unit(chord):null,tangents,primalPoints};
  });
  return {...C,phase,kind:'conics',inflate,open,rho,M,p:P,dual:R.map(normalized),primal:R.map(A=>normalized(adj(A))),rawDual:R,meetings,axis,tangentPairs,contacts,
    error:Math.max(...meetings.map(x=>Math.abs(dot(x,axis))))};
}
// A regular chart for all eight line-wise conics. Only used away from Salmon.
function normalizedDual(phase=3,p=defaults()){
  const F=family(phase,p);if(F.kind!=='conics'||F.open<1e-7)throw Error('The regular matrix chart is undefined at the Salmon endpoint.');
  const M=F.M;
  return Array.from({length:8},(_,s)=>{
    const ix=[0,1,2].filter(i=>s>>i&1),H=E.inverse(ix.map(i=>ix.map(j=>M[i][j]))),A=baseDual();
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)for(let k=0;k<ix.length;k++)for(let l=0;l<ix.length;l++)A[i][j]-=F.p[ix[k]][i]*H[k][l]*F.p[ix[l]][j];
    return A;
  });
}
// 3D projective geometric algebra: points are grade 3, planes grade 1.
const A3=Algebra({p:3,q:0,r:1,baseType:Float64Array});
function point3([x,y,z,w=1]){const p=new A3();p.e123=w;p.e023=-x;p.e013=y;p.e012=-z;return p;}
function plane3([a,b,c,d]){const p=new A3();p.e1=a;p.e2=b;p.e3=c;p.e0=d;return p;}
const coordinates3=P=>[-P.e023,P.e013,-P.e012,P.e123];
const planeCoordinates=P=>[P.e1,P.e2,P.e3,P.e0];
const planeThrough=(p,q,r)=>unit(planeCoordinates(point3(p).Vee(point3(q)).Vee(point3(r))));
const meetLinePlane=(p,q,l)=>unit(coordinates3(plane3(l).Wedge(point3(p).Vee(point3(q)))));
const meetPlanes=(l,m,n)=>unit(coordinates3(plane3(l).Wedge(plane3(m)).Wedge(plane3(n))));
function ruling(theta,sign,z){return [Math.cos(theta)-sign*z*Math.sin(theta),Math.sin(theta)+sign*z*Math.cos(theta),z,1];}
function dandelin(p=defaults(),height=0){
  const C=classical(1,p),theta=C.pairs.map(([A])=>Math.atan2(A[1],A[0])),phi=C.pairs.map(([,B])=>Math.atan2(B[1],B[0]));
  const vertices=theta.map((a,i)=>{
    const h=Math.tan((phi[i]-a)/2);if(Math.abs(h)>25)throw Error('A ruling intersection is too close to infinity for this spatial chart.');
    return ruling(a,1,h);
  });
  const plane=planeThrough(...vertices),slice=[0,0,1,-height];
  const A=theta.map(a=>ruling(a,1,height)),B=phi.map(a=>ruling(a,-1,height));
  // Order around the skew hexagon: A1,B2,A3,B1,A2,B3.
  const order=[A[0],B[1],A[2],B[0],A[1],B[2]], planar=order.map(([x,y,,w])=>[x,y,w]);
  const sidePlanes=[],offDiagonal=[];
  for(const [i,j] of [[0,1],[2,1],[2,0],[1,0],[1,2],[0,2]]){
    const z=Math.tan((phi[j]-theta[i])/2),P=ruling(theta[i],1,z);
    if(Math.abs(z)>100)throw Error('An auxiliary tangent plane is at the boundary of this spatial chart.');
    offDiagonal.push(P);sidePlanes.push(unit([P[0],P[1],-P[2],-1]));
  }
  const intersections=[meetLinePlane(vertices[0],vertices[1],slice),meetLinePlane(vertices[1],vertices[2],slice),meetLinePlane(vertices[2],vertices[0],slice)];
  const X=intersections.map(([x,y,,w])=>unit([x,y,w]));
  const axis=unit([plane[0],plane[1],plane[2]*height+plane[3]]);
  const direct=[G.meetCoordinates(G.joinCoordinates(planar[0],planar[1]),G.joinCoordinates(planar[3],planar[4])),G.meetCoordinates(G.joinCoordinates(planar[1],planar[2]),G.joinCoordinates(planar[4],planar[5])),G.meetCoordinates(G.joinCoordinates(planar[2],planar[3]),G.joinCoordinates(planar[5],planar[0]))].map(unit);
  const error=Math.max(...X.map(x=>Math.abs(dot(axis,x))),...X.map((x,i)=>norm(cross(x,direct[i]))),...vertices.map(v=>Math.abs(dot(plane,unit(v)))));
  return {theta,phi,vertices,plane,slice,A,B,order,planar,sidePlanes,offDiagonal,intersections,X,axis,error,height};
}
function extrusion(p=defaults(),edge=0){
  const F=family(3,p),D=normalizedDual(3,p),Q=D.map(E.inverse),c=F.contacts[edge],line=unit(mul(Q[c.s],c.dualChord));
  const n=line[0]**2+line[1]**2;if(n<1e-10)throw Error('This contact plane lies outside the current affine view.');
  const x=[-line[2]*line[0]/n,-line[2]*line[1]/n,1],v=unit([-line[1],line[0],0]);
  const a=quad(Q[c.s],v),b=dot(v,mul(Q[c.s],x)),cc=quad(Q[c.s],x),ringQ=[[a,0,b],[0,1,0],[b,0,cc]];
  const samples=G.conicSamples(ringQ,150),ring=[],ringSegments=[];
  function liftRing(P){const a=G.affine(P);if(!a)return null;const [t,z]=a,R=[x[0]+t*v[0],x[1]+t*v[1],z,1];return norm(R)<30?R:null;}
  for(let i=0;i<samples.length;i++){
    const P=samples[i],Q=samples[(i+1)%samples.length],a=liftRing(P),b=liftRing(Q);
    if(a)ring.push(a);
    // Never join the two branches through infinity after affine conversion.
    if(a&&b&&P.e12*Q.e12>0)ringSegments.push([a,b]);
  }
  const lift=A=>[[A[0][0],A[0][1],0,A[0][2]],[A[1][0],A[1][1],0,A[1][2]],[0,0,1,0],[A[2][0],A[2][1],0,A[2][2]]];
  const quadrics=Q.map(lift),plane=[line[0],line[1],0,line[2]];
  const delta=matrixAdd(Q[c.t],matrixScale(Q[c.s],-1)),j=line.reduce((i,x,k)=>Math.abs(x)>Math.abs(line[i])?k:i,0),k=delta[j][j]/(line[j]**2);
  const rankError=matrixNorm(matrixAdd(delta,matrixScale(outer(line),-k)))/(1+matrixNorm(delta));
  const error=Math.max(rankError,...ring.map(P=>Math.abs(quad(quadrics[c.s],P))/(1+dot(P,P))),...ring.map(P=>Math.abs(dot(plane,P))/(1+norm(P))));
  return {F,Q,quadrics,plane,ring,ringSegments,c,error};
}
return {clamp,ease,sub,unit,affine,adj,normalized,matrixScale,matrixAdd,matrixNorm,defaults,names,pairIndices,masks,seedPairs,classical,lineConic,poles,family,normalizedDual,A3,point3,plane3,coordinates3,planeCoordinates,planeThrough,meetLinePlane,meetPlanes,ruling,dandelin,extrusion};
});
