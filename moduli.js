/* A bounded, reproducible exploration of one real Penrose chart.
 * Every frame is reconstructed from determinantal data, never curve-morphed.
 * Screening is numerical (including a live guard), NOT a certified global
 * path planner or a uniform distribution on the noncompact moduli space.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'),require('./narrative-math.js'));
  else root.IncidenceModuli=factory(root.IncidenceMath,root.IncidenceNarrative);
})(globalThis,(E,N)=>{
'use strict';
const pairOrder=[[0,1],[1,2],[2,0]], J=[[1,0,0],[0,1,0],[0,0,-1]];
const clone=p=>({...p,u:p.u.slice(),v:p.v.slice(),inflation:p.inflation.slice(),couplings:(p.couplings||[1,1,1]).slice()});
const smooth=t=>{t=N.clamp(t);return t*t*t*(10+t*(-15+6*t));}; // C² stationary at both endpoints
function interpolate(a,b,t){
  const s=smooth(t),p=clone(a);
  for(const key of ['u','v','inflation','couplings'])p[key]=p[key].map((x,i)=>x+(b[key][i]-x)*s);
  p.opening=a.opening+(b.opening-a.opening)*s;
  return p;
}
function randomSource(seed=20260918){
  let state=Number(seed)>>>0;
  return {next(){state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;},get state(){return state;}};
}
function descriptor(p,F=N.family(3,p)){
  // With Q0=J and Mii=1, the residual coordinate group is O(J).
  // Gram(P)=P J^-1 P^T, together with the 3 off-diagonal entries of M,
  // determines independent weighted covectors up to O(J), modulo finite
  // simultaneous sign choices. This is a regular-chart statement, not a
  // classification of singular complete conics.
  const gram=F.p.map(p=>F.p.map(q=>E.dot(p,E.mul(J,q))));
  const values=[gram[0][0],gram[1][1],gram[2][2],gram[0][1],gram[1][2],gram[2][0],...pairOrder.map(([i,j])=>F.M[i][j])];
  return {gram,couplings:pairOrder.map(([i,j])=>F.M[i][j]),values};
}
function distance(a,b){return Math.hypot(...a.map((v,i)=>(v-b[i])/(1+Math.abs(v)+Math.abs(b[i]))));}
function diagnose(p){
  const F=N.family(3,p),D=N.normalizedDual(3,p);
  const conicDets=F.dual.map(E.det),norms=F.p.map(E.norm);
  const chordMargin=Math.abs(E.det(F.p))/(norms[0]*norms[1]*norms[2]);
  const minorValues=pairOrder.map(([i,j])=>1-F.M[i][j]**2).concat(E.det(F.M));
  const minorMargin=Math.min(...minorValues.map(Math.abs));
  const conicMargin=Math.min(...conicDets.map(Math.abs));
  // Restriction of a conic to its contact chord; its discriminant separates
  // real two-point contact from complex conjugate contact and their boundary.
  const discriminants=F.contacts.map(c=>{
    const l=c.dualChord,k=[0,1,2].reduce((a,b)=>Math.abs(l[b])<Math.abs(l[a])?b:a,0),axis=[0,0,0];axis[k]=1;
    const u=N.unit(E.cross(l,axis)),v=E.cross(l,u),Q=F.dual[c.s];
    const a=E.quad(Q,u),b=2*E.dot(u,E.mul(Q,v)),d=E.quad(Q,v);
    return (b*b-4*a*d)/(a*a+b*b+d*d+1e-30);
  });
  const contactMargin=Math.min(...discriminants.map(Math.abs));
  const realContacts=discriminants.filter(x=>x>0).length;
  const sig=conicDets.concat(minorValues,discriminants).map(Math.sign).join(',');
  const min=Math.min(conicMargin/1e-6,chordMargin/1e-5,minorMargin/1e-4,contactMargin/1e-5);
  if(!Number.isFinite(min)||min<=1)throw Error('Too close to a singular conic, collapsed chord, or coalescing contact. Adjust the seeds or use Reset seeds.');
  return {F,D,signature:sig,conicMargin,minorMargin,chordMargin,contactMargin,realContacts,descriptor:descriptor(p,F)};
}
function screenPath(from,to,{samples=64}={}){
  const first=diagnose(from),last=diagnose(to);
  if(first.signature!==last.signature)return {ok:false,reason:'Different real chamber'};
  if(distance(first.descriptor.values,last.descriptor.values)<1e-5)return {ok:false,reason:'No meaningful change in the invariant data'};
  let previous=first.F.p,margin=first.conicMargin;
  for(let i=1;i<samples;i++){
    const d=diagnose(interpolate(from,to,i/samples));
    if(d.signature!==first.signature)return {ok:false,reason:'The path approaches a discriminant wall'};
    // Rule out a change of representative branch between sampled positions.
    if(d.F.p.some((v,j)=>E.dot(N.unit(v),N.unit(previous[j]))<.92))return {ok:false,reason:'A seed branch changed'};
    previous=d.F.p;margin=Math.min(margin,d.conicMargin);
  }
  return {ok:true,signature:first.signature,minConicMargin:Math.min(margin,last.conicMargin),realContacts:first.realContacts,samples:samples+1,change:distance(first.descriptor.values,last.descriptor.values)};
}
function proposal(anchor,rng,amount,lockChords){
  const p=clone(anchor),r=()=>2*rng.next()-1;
  if(!lockChords)for(const key of ['u','v'])p[key]=p[key].map(x=>x*Math.exp(r()*.28*amount));
  p.inflation=p.inflation.map(x=>N.clamp(x+r()*.14*amount,.035,.48));
  p.couplings=p.couplings.map(x=>N.clamp(x*Math.exp(r()*.55*amount),.25,3));
  return p;
}
function plan(from,anchor,rng,{lockChords=false,amount=1,samples=64,attempts=40}={}){
  const start=clone(from);diagnose(start);
  for(let i=0;i<attempts;i++){
    // Prefer destinations in a bounded neighborhood of the initial anchor;
    // later attempts become small local moves rather than forcing a wall.
    const local=i>=Math.floor(attempts*.7),base=local?start:anchor;
    const a=amount*(local?.18:1),to=proposal(base,rng,a,lockChords);
    if(lockChords){to.u=start.u.slice();to.v=start.v.slice();}
    try{const result=screenPath(start,to,{samples});if(result.ok)return {from:start,to,...result,attempts:i+1};}catch{/* Rejection sampling is expected near real discriminant walls. */}
  }
  throw Error('No safe local route was found. Use a smaller range or adjust the seeds.');
}
return {clone,smooth,interpolate,randomSource,descriptor,distance,diagnose,screenPath,plan,pairOrder};
});
