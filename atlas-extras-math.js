/* Independent constructions for Monge, homogeneous triangle criteria,
 * and the converse of Pascal. Numerical witnesses, never Lean proof oracles. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'));else root.AtlasExtraMath=factory(root.IncidenceMath);})(globalThis,E=>{
'use strict';
const add=(a,b)=>a.map((x,i)=>x+b[i]),scale=(a,t)=>a.map(x=>x*t),sub=(a,b)=>a.map((x,i)=>x-b[i]);
const unit=a=>{const n=Math.hypot(...a);if(!Number.isFinite(n)||n<1e-9)throw Error('A defining point or line has collapsed.');return scale(a,1/n);};
const cross=(a,b)=>unit(E.cross(a,b));
const aff=a=>{if(Math.abs(a[2])<1e-5)throw Error('This drawing chart is too close to a point at infinity.');const p=[a[0]/a[2],a[1]/a[2]];if(p.some(x=>!Number.isFinite(x)||Math.abs(x)>40))throw Error('The construction is leaving the displayed affine chart.');return p;};
const pt=a=>[a[0],a[1],1],dot=E.dot;
const defaults=()=>({circles:[[-1.5,-.7],[1.4,-.4],[-.1,1.8]],r:[.5,1.15,1.85],triangle:[[-1.7,-1.0],[1.6,-.8],[.1,1.5]],s:1.5,t:1.3,five:[[-1.5,.1],[-.85,1.0],[.75,1.05],[1.6,-.3],[.2,-1.15]],angle:-.2});
function monge(p){
 const centers=p.circles.map(pt),r=p.r;
 if(r.some(x=>x<=0||!Number.isFinite(x)))throw Error('Radii must be positive.');
 if(Math.abs(dot(cross(centers[0],centers[1]),unit(centers[2])))<1e-3)throw Error('Keep the three centers noncollinear in this chart.');
 const pairs=[[0,1],[1,2],[2,0]],X=[],tangents=[];
 for(const [i,j]of pairs){
  const d=sub(p.circles[j],p.circles[i]),len=Math.hypot(...d),dr=r[j]-r[i];
  if(Math.abs(dr)<.07||len<=Math.abs(dr)+.12)throw Error('Keep unequal radii and two distinct external tangents per pair.');
  const k=dr/len,h=Math.sqrt(1-k*k),v=scale(d,1/len);
  tangents.push([-1,1].map(sign=>{const n=[k*v[0]-sign*h*v[1],k*v[1]+sign*h*v[0]];return [...n,r[i]-n[0]*p.circles[i][0]-n[1]*p.circles[i][1]];}));
  X.push(unit(sub(scale(centers[i],r[j]),scale(centers[j],r[i]))));
 }
 const axis=cross(X[0],X[1]),A=centers.map((c,i)=>add(c,[0,r[i],0])),B=centers.map((c,i)=>add(c,[0,-r[i],0]));
 const linesA=pairs.map(([i,j])=>cross(A[i],A[j])),linesB=pairs.map(([i,j])=>cross(B[i],B[j]));
 const error=Math.max(...X.map(x=>Math.abs(dot(axis,x))),...X.flatMap((x,k)=>[Math.abs(dot(linesA[k],x)),Math.abs(dot(linesB[k],x))]));
 const circleQ=centers.map(([a,b],i)=>[[1,0,-a],[0,1,-b],[-a,-b,a*a+b*b-r[i]*r[i]]]);
 return {kind:'monge',centers,X,axis,tangents,A,B,linesA,linesB,circleQ,error};
}
function triangle(kind,p){
 const [A,B,C]=p.triangle.map(pt),[a,b,c,d,e,f]=[1,p.s,1,p.t,1,(kind==='ceva'?1:-1)/(p.s*p.t)];
 if(Math.abs(dot(cross(A,B),unit(C)))<.03)throw Error('The triangle must be noncollinear.');
 const X=add(scale(B,a),scale(C,b)),Y=add(scale(C,c),scale(A,d)),Z=add(scale(A,e),scale(B,f));
 [X,Y,Z].forEach(aff);const lines=[cross(A,X),cross(B,Y),cross(C,Z)],point=cross(lines[0],lines[1]),axis=cross(X,Y);
 return {kind,ABC:[A,B,C],X:[X,Y,Z],lines,point,axis,coeff:[a,b,c,d,e,f],error:kind==='ceva'?Math.abs(dot(lines[2],point)):Math.abs(dot(axis,unit(Z)))};
}
function det(a){const n=a.length,m=a.map(r=>r.slice());let out=1;for(let k=0;k<n;k++){let i=k;for(let j=k+1;j<n;j++)if(Math.abs(m[j][k])>Math.abs(m[i][k]))i=j;if(Math.abs(m[i][k])<1e-13)return 0;if(i!==k){[m[k],m[i]]=[m[i],m[k]];out=-out;}const v=m[k][k];out*=v;for(let j=k+1;j<n;j++){const q=m[j][k]/v;for(let l=k+1;l<n;l++)m[j][l]-=q*m[k][l];}}return out;}
function throughFive(points){const rows=points.map(p=>{const [x,y]=aff(p);return [x*x,y*y,1,2*x*y,2*x,2*y];}),q=unit(Array.from({length:6},(_,i)=>(i%2?-1:1)*det(rows.map(row=>row.filter((_,j)=>j!==i)))));return [[q[0],q[3],q[4]],[q[3],q[1],q[5]],[q[4],q[5],q[2]]];}
function braikenridge(p){
 const [A,B,C,D,H]=p.five.map(pt),AZ=cross(A,[A[0]+Math.cos(p.angle),A[1]+Math.sin(p.angle),1]);
 const X=cross(cross(A,B),cross(D,H)),Z=cross(cross(C,D),AZ),axis=cross(X,Z),Y=cross(axis,cross(B,C)),F=cross(cross(H,Y),AZ),Q=throughFive([A,B,C,D,H]);
 [X,Y,Z,F].forEach(aff);const six=[A,B,C,D,H,F],error=Math.max(...six.map(x=>Math.abs(dot(unit(x),E.mul(Q,unit(x))))));
 if(Math.abs(E.det(Q))<1e-4)throw Error('The five-point conic is leaving this regular display chart.');
 return {kind:'braikenridge',six,X:[X,Y,Z],axis,Q,error};
}
function build(kind,p){return kind==='monge'?monge(p):kind==='braikenridge'?braikenridge(p):triangle(kind,p);}
return {defaults,build,monge,triangle,braikenridge,throughFive,aff,pt,unit,cross,scale,sub,add};
});
