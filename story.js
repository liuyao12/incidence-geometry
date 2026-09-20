/* Reading-driven scenes. The mathematical state lives in narrative-math.js.
 * 3D incidence uses ganja Cl(3,0,1); a controlled orthographic camera projects
 * its geometry into the same native ganja SVG stage used by the planar story.
 */
(()=>{
'use strict';
const E=window.IncidenceMath,G=window.IncidencePGA,N=window.IncidenceNarrative,W=window.IncidenceModuli,VM=window.IncidenceVectors,$=id=>document.getElementById(id);
const C=['#2b414d','#2c5f9e','#507fb2','#168477','#5676af','#44a18b','#80a393','#bb592e'];
const state={scene:'journey',phase:0,dual:false,conclusion:true,follow:true,p:N.defaults(),playing:false,direction:1,lift:.82,height:0,proof:3,surface:true,zoom:1,pan:[0,0],yaw:-.3,tilt:.95,selection:'all',edge:0};
const B=window.IncidenceCube;
const host=$('story-geometry'),chart=window.IncidenceJourneyView,R=chart.wrap(window.createGanjaView(host));
const cube=B.create($('story-cube'),key=>{markManual();state.selection=key;if(key.startsWith('edge:'))state.edge=+key.split(':')[1];schedule();},{onEdit:editVectors,onEditStart:beginVectorEdit,onEditEnd:endVectorEdit});let view={s:1,x:0,y:0,w:0,h:0},data,drag=null,frame=0,playFrame=0,lastTime=0,liftFrame=0;
const vectorState={reference:VM.copy(VM.defaultReference),gain:1000,undo:[],snapshot:null,active:false};
const sci=x=>Number.isFinite(x)?x.toExponential(1):'not defined';
const rgba=(color,label)=>`<span><i style="--legend-color:${color}"></i>${label}</span>`;
const inverseLabel=['Pappus','Brianchon','Dual Salmon','Penrose · dual'];
const normalLabel=['Pappus','Pascal','Salmon','Penrose'];
function markManual(){state.follow=false;$('follow-story').checked=false;}
function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;render();});}
function getView(){
 const r=$('drawing').getBoundingClientRect();view={w:r.width,h:r.height,s:Math.min(r.width,r.height)/3.5*state.zoom,x:r.width/2+state.pan[0],y:r.height*.52+state.pan[1]};R.begin(view);
}
function regularConic(Q,c,alpha=1,width=1.7,dash=[]){if(Q)R.conic(Q,c,alpha,width,dash);}
function drawSeeds(pairs,alpha=1){R.layer(alpha,()=>pairs.forEach((pair,i)=>pair.forEach((P,j)=>{
 const name=N.names[2*i+j];
 if(!state.dual)R.point(P,C[1<<i],name,true,4,`seed:${i}:${j}`);
 else {
   R.line(P,C[1<<i],.7,1.25);
   // Label a finite location on the line; not a new incidence object.
   const n=P[0]*P[0]+P[1]*P[1];if(n>1e-9)R.point([-P[2]*P[0]/n,-P[2]*P[1]/n,1],C[1<<i],name.toLowerCase(),true,2);
 }
})));}
// Extend the visible construction only a little beyond its defining points.
// Projective points at infinity fall back to the actual full line.
function traceLine(l,points,c,alpha=1,width=1.2,dash=[],margin=.12){
 const a=points.map(P=>N.affine(P));
 if(a.some(P=>!P)){R.line(l,c,alpha,width,dash);return;}
 const u=N.unit([-l[1],l[0],0]).slice(0,2),values=a.map(P=>E.dot(P,u));
 const min=Math.min(...values),max=Math.max(...values),pad=Math.max(.1,(max-min)*margin);
 const origin=a[0],offset=E.dot(origin,u);
 R.path([min-pad,max+pad].map(t=>E.add(origin,E.scale(u,t-offset))),c,alpha,width,dash);
}
function drawEarly(F){
 if(!state.dual){
  if(F.t===0){traceLine([1,0,-1],F.pairs.map(p=>p[0]),C[0],1,2.2);traceLine([1,0,1],F.pairs.map(p=>p[1]),C[0],1,2.2);}else regularConic(F.Q,C[0],1,2.5);
  F.lines.forEach((ls,k)=>{const [i,j]=N.pairIndices[k];ls.forEach((l,b)=>traceLine(l,[F.pairs[i][b],F.pairs[j][1-b],F.meetings[k]],'#648b85',.72,1.05,[],.035));});
  if(state.conclusion){traceLine(F.axis,F.meetings,C[7],.95,2,[3,4],.3);F.meetings.forEach((P,i)=>R.point(P,C[7],['X','Y','Z'][i],false,4));}
 }else{
  if(F.t===0){R.point([1,0,-1],C[0],'L',false,5);R.point([1,0,1],C[0],'L′',false,5);}
  else regularConic(N.adj(F.Q),C[0],1,2.4);
  F.lines.flat().forEach((l,i)=>R.point(l,'#648b85','',false,2.4));
  if(state.conclusion){F.meetings.forEach((P,i)=>R.line(P,C[7],.8,1.6));R.point(F.axis,C[7],'O',false,4.5);}
 }
 drawSeeds(F.pairs);
 $('story-readout').textContent=`${state.dual?'Three constructed diagonals are concurrent.':'Three cross-intersections are collinear.'} Normalized incidence residual ${sci(F.error)}.`;
}
function selectedEdges(){if(state.selection.startsWith('edge:'))return [+state.selection.split(':')[1]];if(state.selection.startsWith('face:'))return E.faceEdges(E.FACES[+state.selection.split(':')[1]]);return [];}
function drawConics(F){
 const selected=selectedEdges(),vertices=new Set(selected.flatMap(i=>E.EDGES[i]));
 const conics=state.dual?F.dual:F.primal,open=F.open;
 regularConic(conics[0],C[0],vertices.size&&!vertices.has(0)?.15:1,2.5);
 [1,2,4].forEach((s,i)=>regularConic(conics[s],C[s],vertices.size&&!vertices.has(s)?.15:1,1.9));
 if(Math.abs(open)<1e-7){
  if(!state.dual){
   F.tangentPairs.forEach((ls,k)=>{const [i,j]=N.pairIndices[k];ls.forEach(l=>traceLine(l,[E.mul(F.rawDual[1<<i],l),E.mul(F.rawDual[1<<j],l),F.meetings[k]],'#638a84',.72,1.1,[],.1));});
   F.meetings.forEach((P,i)=>R.point(P,C[3],['X','Y','Z'][i],false,4));
   if(state.conclusion)traceLine(F.axis,F.meetings,C[7],1,2.2,[3,4],.28);
  }else{
   F.tangentPairs.flat().forEach(l=>R.point(l,'#638a84','',false,2.8));
   F.meetings.forEach(P=>R.line(P,C[3],.85,1.6));
   if(state.conclusion)R.point(F.axis,C[7],'O',false,4.5);
  }
 }else{
  [3,5,6,7].forEach(s=>{if(s===7&&!state.conclusion)return;regularConic(conics[s],C[s],vertices.size&&!vertices.has(s)?.12:1,s===7?2.4:1.65,s===7?[7,4]:[]);});
 }
 if(F.phase<2.05)drawSeeds(F.pairs,.9);
 else if(!state.dual){
  const cs=B.chordData(state.p);cs.forEach((c,i)=>{
   R.line(c.line,C[1<<i],selected.length?.12:.26,.8,[3,5]);
   R.point([...c.mid,1],C[1<<i],`h${i+1}`,true,5,`chord:${i}`);
  });
 }

 let real=0,faceError=null;
 selected.forEach(i=>{
   const c=F.contacts[i];if(c.t===7&&!state.conclusion)return;
   const chord=state.dual?c.dualChord:c.chord;
   if(chord)R.line(chord,'#6d7684',.8,1.25,[5,4]);
   const points=state.dual?c.tangents:c.primalPoints;real+=points.length;
   if(selected.length===1)points.forEach((P,j)=>{
     R.point(P,C[7],`T${j+1}`,false,4);
     const q=conics[c.s];if(q)R.line(E.mul(q,P),C[7],.65,1);
   });
 });
 if(state.selection.startsWith('face:')){
   const chords=selected.map(i=>state.dual?F.contacts[i].dualChord:F.contacts[i].chord).filter(Boolean);
   if(chords.length===4){const X=E.cross(chords[0],chords[1]);if(E.norm(X)>1e-10){const U=N.unit(X);faceError=Math.max(...chords.map(l=>Math.abs(E.dot(l,U))));R.point(U,C[7],'Ω',false,5);}}
 }
 let text=Math.abs(open)<1e-7?`Compatible common-tangent branches: ${F.tangentPairs.map(x=>x.length).join(' / ')} real tangents. Collinearity residual ${sci(F.error)}.`:`${state.conclusion?'Eight':'Seven'} conics in one determinantal family. Solid = given; dashed orange = completion.`;
 if(selected.length===1)text+=real?` Selected edge: ${real} real contact points.`:' Selected edge: no real contact points in this chart; the rank-one relation still holds.';
 if(faceError!==null)text+=` Four-chord concurrence residual ${sci(faceError)}.`;
 $('story-readout').textContent=text;
}
function project(P){
 const a=P.length===4?N.affine(P):P;if(!a)return null;
 const yaw=state.yaw*N.ease(state.lift),tilt=state.tilt*N.ease(state.lift),[x,y,z0]=a,z=z0*state.lift;
 const xx=Math.cos(yaw)*x-Math.sin(yaw)*y,yy=Math.sin(yaw)*x+Math.cos(yaw)*y;
 return [xx,Math.cos(tilt)*yy-Math.sin(tilt)*z,Math.sin(tilt)*yy+Math.cos(tilt)*z];
}
function path3(ps,color,alpha=1,width=1.4,dash=[]){let previous=null;for(const P of ps){const a=project(P);if(a&&a.every(Number.isFinite)&&E.norm(a)<100){if(previous)R.path([previous,a],color,alpha,width,dash);previous=a;}else previous=null;}}
function point3(P,color,label='',radius=3){const a=project(P);if(a)R.point([...a.slice(0,2),1],color,label,false,radius);}
function polygon3(ps,color,alpha){const points=ps.map(project);if(points.every(Boolean))R.polygon(points,color,alpha);}
function lineInSection(l,height,extent=3.7){
 const n=l[0]**2+l[1]**2;if(n<1e-12)return [];
 const x0=-l[2]*l[0]/n,y0=-l[2]*l[1]/n,v=[-l[1],l[0]],m=Math.hypot(...v);
 const pts=[-extent,extent].map(t=>[x0+t*v[0]/m,y0+t*v[1]/m,height,1]);
 // Restrict to a square so distant affine intersections do not distort the scene.
 let lo=0,hi=1;const a=pts[0],b=pts[1],d=[b[0]-a[0],b[1]-a[1]];
 for(const [p,q] of [[-d[0],a[0]+extent],[d[0],extent-a[0]],[-d[1],a[1]+extent],[d[1],extent-a[1]]]){
  if(Math.abs(p)<1e-12){if(q<0)return [];continue;}const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return [];
 }
 return [lo,hi].map(t=>[a[0]+t*d[0],a[1]+t*d[1],height,1]);
}
function circleSection(height,color,alpha=1){const radius=Math.sqrt(1+height*height);path3(Array.from({length:121},(_,i)=>[radius*Math.cos(i*Math.PI/60),radius*Math.sin(i*Math.PI/60),height,1]),color,alpha,2.4);}
function drawSurfaceHyperboloid(){
 const polygons=[],Ntheta=28,Nz=10,zmax=1.7;
 const at=(i,j)=>{const z=-zmax+2*zmax*j/Nz,a=i*2*Math.PI/Ntheta,r=Math.sqrt(1+z*z);return [r*Math.cos(a),r*Math.sin(a),z,1];};
 for(let j=0;j<Nz;j++)for(let i=0;i<Ntheta;i++){const ps=[at(i,j),at(i+1,j),at(i+1,j+1),at(i,j+1)];polygons.push({ps,d:ps.reduce((s,p)=>s+project(p)[2],0)});}
 polygons.sort((a,b)=>a.d-b.d).forEach(({ps})=>polygon3(ps,'#82a99d',.045*state.lift));
 for(let j=0;j<=6;j++){const z=-zmax+2*zmax*j/6;path3(Array.from({length:65},(_,i)=>{const a=i*Math.PI/32,r=Math.sqrt(1+z*z);return [r*Math.cos(a),r*Math.sin(a),z,1];}),'#7ba096',.15*state.lift,.55);}
}
function convexOrder(ps){
 const aa=ps.map(P=>N.affine(P)),center=aa.reduce((a,b)=>E.add(a,b),[0,0,0]).map(x=>x/aa.length),u=N.unit(N.sub(aa[0],center)),normal=N.unit(E.cross(N.sub(aa[1],aa[0]),N.sub(aa[2],aa[0]))),v=E.cross(normal,u);
 return ps.map((p,i)=>({p,t:Math.atan2(E.dot(N.sub(aa[i],center),v),E.dot(N.sub(aa[i],center),u))})).sort((a,b)=>a.t-b.t).map(x=>x.p);
}
function drawDandelin(){
 data=N.dandelin(state.p,state.height);const D=data,L=state.lift;
 if(state.surface&&L>.001)drawSurfaceHyperboloid();
 polygon3([[-1.9,-1.9,D.height,1],[1.9,-1.9,D.height,1],[1.9,1.9,D.height,1],[-1.9,1.9,D.height,1]],'#b6c5ce',.18*L);
 if(state.proof>=2&&L>.001){
  polygon3(convexOrder([D.vertices[0],D.vertices[1],D.A[0],D.B[1]]),'#4675aa',.16*L);
  polygon3(convexOrder([D.vertices[0],D.vertices[1],D.A[1],D.B[0]]),'#ad7795',.16*L);
 }
 if(state.proof>=3&&L>.001){
  const center=D.vertices.reduce((a,p)=>E.add(a,p.slice(0,3)),[0,0,0]).map(x=>x/3);
  const patch=D.vertices.map(p=>[...E.add(center,E.scale(N.sub(p.slice(0,3),center),1.7)),1]);polygon3(patch,C[3],.18*L);
  point3([...E.add(center,[.25,.08,.02]),1],C[3],'Γ',1);
 }
 if(L>.001&&state.proof>=1){
  D.theta.forEach(a=>path3([-1.7,1.7].map(z=>N.ruling(a,1,z)),C[1],.7*L,1.35));
  D.phi.forEach(a=>path3([-1.7,1.7].map(z=>N.ruling(a,-1,z)),'#997297',.7*L,1.35));
  R.layer(L,()=>D.vertices.forEach((p,i)=>point3(p,C[3],`H${i+1}`,4)));
 }
 circleSection(D.height,C[0]);
 const sideLines=Array.from({length:6},(_,i)=>G.joinCoordinates(D.planar[i],D.planar[(i+1)%6]));
 sideLines.forEach((l,i)=>path3(lineInSection(l,D.height,2.3),i===0||i===3?'#648b85':'#90a6a0',.75,1.1));
 if(state.proof>=3){
  [[0,1],[1,2],[2,0]].forEach(([i,j],k)=>{
    path3([D.vertices[i],D.vertices[j]],C[3],L*.9,1.8);
    const X=D.intersections[k],A=N.affine(X);if(A&&E.norm(A)<8)path3([D.vertices[i],X],C[3],L*.45,1,[4,4]);
  });
 }
 if(state.conclusion){path3(lineInSection(D.axis,D.height,2.4),C[7],1,2.4);D.intersections.forEach((P,i)=>point3(P,C[7],['X','Y','Z'][i],4));}
 D.A.forEach((P,i)=>point3(P,C[1<<i],N.names[2*i],4));D.B.forEach((P,i)=>point3(P,C[1<<i],N.names[2*i+1],4));
 if(L>.3)point3([-1.8,-1.65,D.height,1],'#6e8286','Π',1);
 $('story-readout').textContent=`The three side-intersections lie on Π ∩ Γ. Independently computed planar/spatial incidence residual ${sci(D.error)}. Section z = ${D.height.toFixed(2)}.`;
}
function meshQuadric(Q,color){
 const ellipse=E.ellipse(Q,40);if(!ellipse){
  for(const h of [-1.2,-.8,-.4,0,.4,.8,1.2]){
   const q=Q.map(r=>r.slice());q[2][2]+=h*h;const pts=G.conicSamples(q,90);let run=[];
   for(let i=0;i<pts.length;i++){const a=G.affine(pts[i]);if(!a||E.norm(a)>6||(i&&pts[i].e12*pts[i-1].e12<0)){path3(run,color,.25*state.lift,.65);run=[];}else run.push([a[0],a[1],h,1]);}path3(run,color,.25*state.lift,.65);
  }return;
 }
 const xy=ellipse.slice(0,-1),center=xy.reduce((a,b)=>E.add(a,b),[0,0]).map(x=>x/xy.length),k=-E.quad(Q,[...center,1]);if(k<=0)return;
 const at=(i,j)=>{const lat=-Math.PI/2+j*Math.PI/10,b=xy[(i+xy.length)%xy.length];return [center[0]+Math.cos(lat)*(b[0]-center[0]),center[1]+Math.cos(lat)*(b[1]-center[1]),Math.sqrt(k)*Math.sin(lat),1];};
 const polygons=[];
 for(let j=0;j<10;j++)for(let i=0;i<xy.length;i+=2){const ps=[at(i,j),at(i+2,j),at(i+2,j+1),at(i,j+1)];polygons.push({ps,d:ps.reduce((s,p)=>s+project(p)[2],0)});}
 polygons.sort((a,b)=>a.d-b.d).forEach(({ps})=>polygon3(ps,color,.042*state.lift));
 for(let j=1;j<10;j+=2)path3(Array.from({length:xy.length+1},(_,i)=>at(i,j)),color,.2*state.lift,.7);
 for(let i=0;i<xy.length;i+=8)path3(Array.from({length:21},(_,j)=>at(i,j/2)),color,.19*state.lift,.7);
}
function drawExtrusion(){
 data=N.extrusion(state.p,state.edge);const D=data,faceEdges=state.selection.startsWith('face:')?selectedEdges():null,ids=[...new Set(faceEdges?faceEdges.flatMap(i=>E.EDGES[i]):[D.c.s,D.c.t])].filter(s=>state.conclusion||s!==7),L=state.lift;
 if(state.surface&&L>.001)ids.forEach(i=>meshQuadric(D.Q[i],C[i]));
 polygon3([[-1.7,-1.7,state.height,1],[1.7,-1.7,state.height,1],[1.7,1.7,state.height,1],[-1.7,1.7,state.height,1]],'#bac7ce',.2*L);
 const l=[D.plane[0],D.plane[1],D.plane[3]],segment=lineInSection(l,0,1.8);
 if(segment.length===2&&L>.001){const a=segment[0],b=segment[1];polygon3([[a[0],a[1],-1.2,1],[b[0],b[1],-1.2,1],[b[0],b[1],1.2,1],[a[0],a[1],1.2,1]],C[3],.13*L);}
 ids.forEach(i=>{
   const Q=D.Q[i].map(r=>r.slice());Q[2][2]+=state.height*state.height;
   const samples=G.conicSamples(Q,200);let run=[];
   samples.concat(samples.slice(0,1)).forEach((P,k)=>{const a=G.affine(P);if(!a||E.norm(a)>10||(k&&P.e12*samples[(k-1)%samples.length].e12<0)){path3(run,C[i],1,2.2);run=[];}else run.push([a[0],a[1],state.height,1]);});path3(run,C[i],1,2.2);
 });
 if(L>.001)(faceEdges?faceEdges.map(i=>N.extrusion(state.p,i)): [D]).forEach(pair=>{if(!state.conclusion&&pair.c.t===7)return;pair.ringSegments.forEach(segment=>path3(segment,C[7],L,2.5));});
 const Q=D.Q[D.c.s].map(r=>r.slice());Q[2][2]+=state.height*state.height;
 N.lineConic(Q,l).forEach((P,i)=>{const a=N.affine(P);if(a)point3([...a,state.height,1],C[7],`T${i+1}`,4);});
 if(L>.3)point3([-1.65,-1.5,state.height,1],'#6e8286','Π',1);
 $('story-readout').textContent=`Conics ${ids.map(i=>E.LABELS[i]).join(', ')} are the sections of the highlighted quadrics. Rank-one lift/ring residual ${sci(D.error)}. ${D.ring.length?'Orange: the contact ring.':'No real ring in this affine chart.'}`;
}
function drawCube(){
 try {
  const useModuli=$('cube-model').value==='moduli'&&state.scene==='journey',linked=$('cube-linked').checked;
  let opts={};vectorState.active=false;
  if(useModuli){
    const encoded=VM.encode(state.p,vectorState.reference);
    // Display a magnified affine chart around I; retain its exact inverse.
    const shown=encoded.V.map((row,i)=>row.map((v,j)=> +(i===j)+vectorState.gain*(v- +(i===j))));
    try{VM.recover(encoded.A);opts={basis:VM.transpose(shown),editable:linked};vectorState.active=linked;}
    catch(e){$('vector-feedback').textContent='Vector chart unavailable here: '+e.message;}
  }
  $('vector-controls').hidden=!vectorState.active;
  $('cube-linked-text').textContent=useModuli?'Link shape to configuration':'Link shape to chords';
  $('cube-explanation').textContent=useModuli?'This cube controls the entire family and stays fixed while the transition slider moves. Drag a hollow corner to edit the family; Shift-drag changes depth. Some parameters become visible only in the later conics. Drag a face to orbit; click to inspect.':'Directions follow the unweighted seed chords. Drag to orbit; click a face to inspect. The editable model controls the regular Penrose endpoint of the family, even while viewing Pappus or Pascal.';
  const S=cube.update(state.p,state.selection,state.conclusion,linked,opts);
  if(vectorState.active)S.basis.forEach((v,i)=>v.forEach((x,j)=>{const el=$(`vector-${i}-${j}`);if(document.activeElement!==el)el.value=x.toFixed(5);}));
  $('cube-metrics').textContent=`Edge lengths: ${S.lengths.map(x=>x.toFixed(2)).join(' · ')}. Angles 12 / 23 / 31: ${S.angles.map(x=>x.toFixed(1)+'°').join(' / ')}${S.volume<1e-4?' · The displayed frame is nearly flat. Reframe to restore a cube.':''}`;
  $('cube-faces').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(state.selection===`face:${b.dataset.cubeFace}`)));
  S.chords.forEach((c,i)=>{if(document.activeElement!==$(`chord-angle-${i}`))$(`chord-angle-${i}`).value=c.angle;$(`chord-angle-value-${i}`).textContent=c.angle.toFixed(1)+'°';if(document.activeElement!==$(`chord-offset-${i}`))$(`chord-offset-${i}`).value=c.distance;$(`chord-offset-value-${i}`).textContent=c.distance.toFixed(3);});
 }catch(e){$('cube-metrics').textContent=e.message;}
}
function displayedVectors(){
 const V=VM.encode(state.p,vectorState.reference).V;
 return VM.transpose(V.map((r,i)=>r.map((v,j)=> +(i===j)+vectorState.gain*(v- +(i===j)))));
}
function beginVectorEdit(){
 if(!vectorState.active)return;
 pauseWalk(true);stopPlay();markManual();vectorState.snapshot=W.clone(state.p);
}
function endVectorEdit(){
 if(vectorState.snapshot&&JSON.stringify(vectorState.snapshot)!==JSON.stringify(state.p)){
  vectorState.undo.push(vectorState.snapshot);if(vectorState.undo.length>30)vectorState.undo.shift();
 }
 vectorState.snapshot=null;$('vector-undo').disabled=!vectorState.undo.length;
}
function editVectors(basis){
 if(!vectorState.active)return false;
 try{
  const display=VM.transpose(basis),to=display.map((r,i)=>r.map((v,j)=> +(i===j)+(v- +(i===j))/vectorState.gain));
  const from=VM.encode(state.p,vectorState.reference).V;
  const result=VM.move(from,to,state.p,vectorState.reference);
  state.p=result.p;
  $('vector-feedback').textContent=result.limited?'Stopped at the last valid point: '+result.reason:'Family reconstructed from the vectors. Sweep the slider forward or backward: your edit is retained.';
  $('vector-feedback').classList.toggle('limited',result.limited);
  render();return !result.limited;
 }catch(e){$('vector-feedback').textContent='No change applied: '+e.message;$('vector-feedback').classList.add('limited');return false;}
}
function reframeVectors(){
 try{vectorState.reference=VM.encode(state.p).A;$('vector-feedback').textContent='The current configuration is now the unit-cube reference. The conics have not changed.';$('vector-feedback').classList.remove('limited');schedule();}
 catch(e){$('vector-feedback').textContent=e.message;}
}
function syncControls(){
 const space=state.scene!=='journey',later=state.phase>2.001;
 $('moduli-controls').hidden=space||state.phase<2.999;$('journey-controls').hidden=space;$('spatial-controls').hidden=!space;$('dual-label').hidden=space;
 $('proof-steps').hidden=state.scene!=='dandelin';$('inspect-row').hidden=space&&state.scene!=='extrusion';
 $('journey').value=state.phase;$('lift').value=state.lift;$('lift-value').textContent=Math.round(state.lift*100)+'%';$('height-value').textContent=state.height.toFixed(2);
 $('section-height').value=state.height;$('seed-u').value=state.p.u[0];$('seed-u-value').textContent=state.p.u[0].toFixed(2);
 $('inspect-cube').value=state.selection;
 $('scene-title').textContent=space?(state.scene==='dandelin'?'Pascal in space':'Double contact → ring contact'):(state.dual?inverseLabel:normalLabel)[Math.min(3,Math.floor(state.phase+.00001))]+(state.phase%1>.001&&state.phase%1<.999?' · in transition':'');
 document.querySelectorAll('[data-go]').forEach(b=>b.classList.toggle('current',Math.abs(+b.dataset.go-state.phase)<.025));
 $('phase-detail').textContent=state.phase<1?'Carrier lines → conic':state.phase<2?'Point pairs → conics':state.phase<3?'Meetings and line → conics':'A seven-to-eight completion';
 $('interaction-hint').textContent=space?'Drag the large scene to orbit · its camera is independent of the cube':later&&!state.dual?'Drag h₁, h₂, h₃ to change chord offset and angle · Shift-drag rotates · the cube follows':'Drag hollow seeds · drag empty space to pan · Shift-scroll to zoom';
 $('corner-caption').textContent=space?'ganja.js · 3D PGA · orthographic view':'ganja.js · projective geometry';
 $('scene-legend').innerHTML=space?(state.scene==='dandelin'?rgba(C[1],'one ruling family')+rgba('#997297','the other family')+rgba(C[3],'auxiliary plane Γ')+rgba(C[7],'Π ∩ Γ'):rgba(C[1],'quadric sections')+rgba(C[3],'ring plane')+rgba(C[7],'contact ring')):rgba(C[0],'carrier')+rgba(C[1],'three pairs / conics')+rgba(C[3],'intermediate objects')+rgba(C[7],'conclusion');
 document.querySelectorAll('[data-proof]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.proof===state.proof)));
 drawCube();
}
function render(){
 syncControls();getView();$('story-readout').classList.remove('error');
 try{
  if(state.scene==='journey'){data=N.family(state.phase,state.p);if(data.kind==='classical')drawEarly(data);else drawConics(data);}
  else if(state.scene==='dandelin')drawDandelin();else drawExtrusion();
 }catch(e){$('story-readout').textContent=e.message;$('story-readout').classList.add('error');}
 const svg=R.finish();svg.setAttribute('aria-label',state.scene==='journey'?'Continuous conic and incidence configuration':'Rotatable spatial incidence construction');
 // Move seed labels outward from the carrier, preserving their IDs while dragging.
 svg.querySelectorAll('[data-handle]').forEach(g=>{const t=g.querySelector('text'),c=g.querySelector('circle');if(!t||!c)return;const x=+c.getAttribute('cx'),y=+c.getAttribute('cy'),len=Math.hypot(x,y)||1;t.setAttribute('x',x+(x/len)*.09);t.setAttribute('y',y+(y/len)*.09);});
 host.dataset.scene=state.scene;host.dataset.phase=state.phase.toFixed(5);updateModuliReadout();
}
function setPhase(t,manual=true){pauseWalk(true);cancelAnimationFrame(liftFrame);if(manual)markManual();stopPlay();state.scene='journey';state.phase=N.clamp(+t,0,3);schedule();}
function animateLift(target){
 cancelAnimationFrame(liftFrame);const start=performance.now(),from=state.lift;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){state.lift=target;schedule();return;}
 function step(now){const t=N.clamp((now-start)/750);state.lift=from+(target-from)*N.ease(t);render();if(t<1)liftFrame=requestAnimationFrame(step);}
 liftFrame=requestAnimationFrame(step);
}
function setScene(scene,manual=true){pauseWalk(true);if(!['journey','dandelin','extrusion'].includes(scene))return;if(manual)markManual();stopPlay();state.scene=scene;state.zoom=1;state.pan=[0,0];if(scene==='extrusion'){state.selection=`edge:${state.edge}`;}schedule();}
function stopPlay(){state.playing=false;cancelAnimationFrame(playFrame);$('play-journey').textContent='Play the journey';}
function play(now){
 if(!state.playing)return;
 if(lastTime)state.phase=N.clamp(state.phase+state.direction*Math.min(now-lastTime,120)/8500,0,3);
 lastTime=now;
 if(state.phase>=3)state.direction=-1;else if(state.phase<=0)state.direction=1;
 render();playFrame=requestAnimationFrame(play);
}

$('inspect-cube').innerHTML='<option value="all">Whole configuration</option>'+E.EDGES.map(([a,b],i)=>`<option value="edge:${i}">Edge ${E.LABELS[a]}–${E.LABELS[b]}</option>`).join('')+E.FACES.map((f,i)=>`<option value="face:${i}">Face ${f.map(s=>E.LABELS[s]).join(' · ')}</option>`).join('');
$('cube-faces').innerHTML=E.FACES.map((f,i)=>`<button type="button" data-cube-face="${i}" aria-label="Select face ${f.map(s=>E.LABELS[s]).join(', ')}" aria-pressed="false">${f.map(s=>E.LABELS[s]).join('·')}</button>`).join('');
$('chord-sliders').innerHTML=[0,1,2].map(i=>`<div class="chord-row"><strong>h${i+1}</strong><label>Angle <input id="chord-angle-${i}" data-chord-angle="${i}" type="range" min="-180" max="180" step=".2" aria-label="Chord ${i+1} angle"><output id="chord-angle-value-${i}"></output></label><label>Offset <input id="chord-offset-${i}" data-chord-offset="${i}" type="range" min=".005" max=".985" step=".002" aria-label="Chord ${i+1} offset"><output id="chord-offset-value-${i}"></output></label></div>`).join('');
function editChord(i,angle,distance){
 pauseWalk(true);markManual();stopPlay();
 try {const next=B.moveChord(state.p,i,angle,distance);N.family(state.phase,next);state.p=next;$('chord-feedback').textContent='Chord changed; all conics and the coefficient-space cube have been recomputed.';schedule();}
 catch(e){$('chord-feedback').textContent=e.message;}
}
$('chord-sliders').addEventListener('input',e=>{
 const i=+(e.target.dataset.chordAngle??e.target.dataset.chordOffset);if(!Number.isInteger(i))return;const c=B.chordData(state.p)[i];
 editChord(i,e.target.hasAttribute('data-chord-angle')?+e.target.value:c.angle,e.target.hasAttribute('data-chord-offset')?+e.target.value:c.distance);
});
$('cube-faces').addEventListener('click',e=>{const b=e.target.closest('[data-cube-face]');if(b){markManual();state.selection=`face:${b.dataset.cubeFace}`;schedule();}});
$('vector-coordinates').innerHTML='<span></span><strong>x</strong><strong>y</strong><strong>z</strong>'+[0,1,2].map(i=>`<strong>v${i+1}</strong>`+[0,1,2].map(j=>`<input id="vector-${i}-${j}" data-vector-i="${i}" data-vector-j="${j}" type="number" step=".02" aria-label="Vector ${i+1} ${['x','y','z'][j]} coordinate">`).join('')).join('');
$('vector-coordinates').addEventListener('change',e=>{
 if(!e.target.hasAttribute('data-vector-i'))return;
 const value=Number(e.target.value),i=+e.target.dataset.vectorI,j=+e.target.dataset.vectorJ;
 if(!Number.isFinite(value)){e.target.value='';return;}
 beginVectorEdit();const basis=displayedVectors();basis[i][j]=value;editVectors(basis);endVectorEdit();
 // Blur commits the accepted rather than the rejected input value.
 e.target.value=displayedVectors()[i][j].toFixed(5);
});
$('cube-model').onchange=()=>{markManual();if($('cube-model').value==='moduli'&&state.scene==='journey')reframeVectors();schedule();};
$('vector-reframe').onclick=reframeVectors;
$('vector-gain').oninput=e=>{vectorState.gain=+e.target.value;$('vector-gain-value').textContent='×'+e.target.value;schedule();};
$('vector-undo').onclick=()=>{if(!vectorState.undo.length)return;pauseWalk(true);stopPlay();markManual();state.p=vectorState.undo.pop();$('vector-undo').disabled=!vectorState.undo.length;$('vector-feedback').textContent='Previous configuration restored.';$('vector-feedback').classList.remove('limited');schedule();};
$('cube-reset').onclick=()=>cube.reset();$('cube-perspective').onchange=e=>cube.setPerspective(e.target.checked);
$('cube-linked').onchange=()=>schedule();$('cube-clear').onclick=()=>{markManual();state.selection='all';schedule();};

$('journey').addEventListener('input',e=>setPhase(e.target.value));
$('play-journey').onclick=()=>{pauseWalk(true);if(state.playing){stopPlay();return;}markManual();state.scene='journey';if(state.phase>=2.999)state.direction=-1;else if(state.phase<=.001)state.direction=1;state.playing=true;lastTime=0;$('play-journey').textContent='Pause';playFrame=requestAnimationFrame(play);};
$('dual-view').onchange=e=>{markManual();state.dual=e.target.checked;schedule();};
$('show-conclusion').onchange=e=>{markManual();state.conclusion=e.target.checked;schedule();};
$('follow-story').onchange=e=>{state.follow=e.target.checked;followScroll();};
$('lift').oninput=e=>{cancelAnimationFrame(liftFrame);markManual();state.lift=+e.target.value;schedule();};
$('section-height').oninput=e=>{markManual();state.height=+e.target.value;schedule();};
$('flat-view').onclick=()=>{markManual();animateLift(0);};$('space-view').onclick=()=>{markManual();animateLift(1);};
$('reset-camera').onclick=()=>{markManual();state.yaw=-.3;state.tilt=.95;state.zoom=1;state.pan=[0,0];schedule();};
$('show-surface').onchange=e=>{state.surface=e.target.checked;markManual();schedule();};
$('fit-view').onclick=()=>{state.zoom=1;state.pan=[0,0];schedule();};
$('seed-u').oninput=e=>{pauseWalk(true);markManual();state.p.u[0]=+e.target.value;schedule();};
$('reset-seeds').onclick=()=>{pauseWalk(true);markManual();state.p=N.defaults();schedule();};
$('inspect-cube').onchange=e=>{markManual();state.selection=e.target.value;if(state.selection.startsWith('edge:'))state.edge=+state.selection.split(':')[1];schedule();};
document.addEventListener('click',e=>{
 const p=e.target.closest('[data-go]');if(p)setPhase(+p.dataset.go);
 const s=e.target.closest('[data-scene-go]');if(s){setScene(s.dataset.sceneGo);if(s.dataset.sceneGo!=='journey'){state.height=0;state.lift=0;animateLift(.9);}}
 const pr=e.target.closest('[data-proof]');if(pr){markManual();state.proof=+pr.dataset.proof;schedule();}
});
function seedMove(handle,clientX,clientY){
 pauseWalk(true);stopPlay();
 const [_,i,j]=handle.split(':'),rect=$('drawing').getBoundingClientRect(),raw=chart.fromDiagram([(clientX-rect.left-view.x)/view.s,-(clientY-rect.top-view.y)/view.s,1]),P=N.affine(raw);if(!P)return;const [x,y]=P;
 const t=state.phase<=1?N.ease(state.phase):1;let z;
 if(t<1e-8)z=2/(Math.abs(y)>.05?y:(y<0?-.05:.05));
 else {const angle=Math.atan2(Math.sqrt(t)*y,x);z=+j?Math.sqrt(t)*Math.tan(angle/2):Math.sqrt(t)/Math.tan(angle/2);}
 if(Number.isFinite(z)&&Math.abs(z)>=.15&&Math.abs(z)<=100){state.p[+j?'v':'u'][+i]=z;schedule();}
}
$('drawing').addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;markManual();const h=e.target.closest('[data-handle]');if(h){pauseWalk(true);stopPlay();}drag={id:e.pointerId,x:e.clientX,y:e.clientY,pan:state.pan.slice(),yaw:state.yaw,tilt:state.tilt,handle:h?.dataset.handle};$('drawing').setPointerCapture(e.pointerId);});
$('drawing').addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;if(drag.handle?.startsWith('chord:')&&state.scene==='journey'&&!state.dual){
 const i=+drag.handle.split(':')[1],rect=$('drawing').getBoundingClientRect(),P=N.affine(chart.fromDiagram([(e.clientX-rect.left-view.x)/view.s,-(e.clientY-rect.top-view.y)/view.s,1]));if(!P)return;const [x,y]=P,c=B.chordData(state.p)[i];
 editChord(i,Math.atan2(y,x)*180/Math.PI,e.shiftKey?c.distance:Math.hypot(x,y));
 }else if(drag.handle&&state.scene==='journey'&&!state.dual)seedMove(drag.handle,e.clientX,e.clientY);else if(state.scene==='journey'){state.pan=[drag.pan[0]+e.clientX-drag.x,drag.pan[1]+e.clientY-drag.y];schedule();}else{state.yaw=drag.yaw+(e.clientX-drag.x)/160;state.tilt=N.clamp(drag.tilt+(e.clientY-drag.y)/180,-1.45,1.45);schedule();}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('drawing').addEventListener(event,()=>{drag=null;});
$('drawing').addEventListener('wheel',e=>{if(!e.shiftKey)return;e.preventDefault();markManual();state.zoom=N.clamp(state.zoom*Math.exp(-e.deltaY*.001),.3,5);schedule();},{passive:false});
host.addEventListener('keydown',e=>{const h=e.target.closest('[data-handle]');if(!h||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();pauseWalk(true);stopPlay();markManual();const [kind,i,j]=h.dataset.handle.split(':');const sign=e.key==='ArrowRight'||e.key==='ArrowUp'?1:-1;if(kind==='chord'){const c=B.chordData(state.p)[+i];editChord(+i,c.angle+(['ArrowRight','ArrowLeft'].includes(e.key)?sign:0),c.distance+(['ArrowUp','ArrowDown'].includes(e.key)?sign*.004:0));}else{state.p[+j?'v':'u'][+i]+=sign*.035;schedule();}});
// The interactive is an in-flow page column; only its geometry can be dragged.
let scrollFrame=0;
function followScroll(){
 if(!state.follow)return;pauseWalk(true);const oldScene=state.scene;stopPlay();const sections=[...document.querySelectorAll('.prose section[data-scene]')],marker=innerHeight*.4;
 let active=sections[0];for(const s of sections)if(s.getBoundingClientRect().top<=marker)active=s;
 if(active.dataset.phase!==undefined){
  const anchors=[...document.querySelectorAll('[data-phase]')],i=+active.dataset.phase;let f=i;
  if(i<3){const y0=anchors[i].getBoundingClientRect().top,y1=anchors[i+1].getBoundingClientRect().top;f=i+N.clamp((marker-y0)/(y1-y0));}
  state.scene='journey';state.phase=f;
 }else{state.scene=active.dataset.scene;if(active.dataset.fixedPhase)state.phase=+active.dataset.fixedPhase;if(active.dataset.edge!==undefined){state.edge=+active.dataset.edge;state.selection='edge:'+state.edge;}}
 if(oldScene!==state.scene){state.zoom=1;state.pan=[0,0];}schedule();
}
window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;followScroll();});},{passive:true});
new ResizeObserver(schedule).observe($('drawing'));
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopPlay();if(tour.running)pauseWalk(false,'Paused while the page was hidden. Resume continues the same path.');}});
// Random destinations are interpolated in a regular parameter chart. The
// cube camera and selected face survive; changing geometry cancels the route.
const tour={running:false,loop:false,route:null,anchor:null,progress:0,last:0,steps:0,rng:W.randomSource(20260918),frame:0};
function walkMessage(text,error=false){$('walk-status').textContent=text;$('walk-status').classList.toggle('error',error);}
function walkButtons(){
 $('wander').textContent=tour.running?'Pause':tour.route?'Resume':'Wander';
 $('wander').setAttribute('aria-pressed',String(tour.running));
 $('random-target').disabled=tour.running;
}
function pauseWalk(clear=false,message=''){
 tour.running=false;tour.last=0;cancelAnimationFrame(tour.frame);tour.frame=0;
 if(clear){tour.route=null;tour.anchor=null;tour.progress=0;$('walk-progress').value=0;}
 walkButtons();if(message)walkMessage(message);
}
function prepareWalk(loop){
 stopPlay();cancelAnimationFrame(liftFrame);markManual();
 state.scene='journey';state.phase=3;
 if(!tour.anchor)tour.anchor=W.clone(state.p);
 try{
  tour.route=W.plan(state.p,tour.anchor,tour.rng,{lockChords:$('lock-chords').checked,amount:+$('walk-range').value});
  tour.progress=0;tour.last=0;tour.loop=loop;tour.running=true;walkButtons();
  const r=tour.route;
  walkMessage(`Target ${tour.steps+1}: ${r.samples} path positions screened; ${r.realContacts}/12 edges have real two-point contact. ${$('lock-chords').checked?'Seed chords and cube stay fixed.':'Weights, chords and all three couplings may move.'}`);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){
   state.p=W.clone(r.to);tour.steps++;tour.route=null;tour.running=false;$('walk-progress').value=1;walkButtons();
   walkMessage('Random target applied without animation (reduced-motion preference).');render();return true;
  }
  tour.frame=requestAnimationFrame(walkFrame);schedule();return true;
 }catch(e){pauseWalk(true);walkMessage(e.message,true);schedule();return false;}
}
function walkFrame(now){
 if(!tour.running||!tour.route)return;
 const dt=tour.last?Math.max(0,Math.min(.12,(now-tour.last)/1000)):0;tour.last=now;
 const duration=+$('walk-duration').value;
 const t=Math.min(1,tour.progress+dt/duration),next=W.interpolate(tour.route.from,tour.route.to,t);
 try{
  const d=W.diagnose(next);
  if(d.signature!==tour.route.signature)throw Error('The live guard detected a change of real chamber.');
  // Never commit a bad intermediate state. Pause at the last accepted frame.
  state.p=next;tour.progress=t;$('walk-progress').value=t;render();
 }catch(e){pauseWalk(true);walkMessage(`Paused at the last valid configuration: ${e.message}`,true);return;}
 if(t>=1){
  const repeat=tour.loop;tour.steps++;tour.route=null;tour.running=false;walkButtons();
  if(repeat){prepareWalk(true);return;}
  walkMessage(`Reached target ${tour.steps}. All conics were reconstructed along the path. Choose another target or Wander.`);return;
 }
 tour.frame=requestAnimationFrame(walkFrame);
}
function randomTarget(){pauseWalk(false);return prepareWalk(false);}
function wander(){
 if(tour.running){pauseWalk(false,'Paused. Resume continues the same path.');return;}
 if(tour.route){tour.running=true;tour.last=0;walkButtons();walkMessage('Continuing the screened path.');tour.frame=requestAnimationFrame(walkFrame);return;}
 prepareWalk(true);
}
$('random-target').onclick=randomTarget;$('wander').onclick=wander;
$('walk-duration').oninput=()=>{$('walk-duration-value').textContent=$('walk-duration').value+' s';};
$('lock-chords').onchange=()=>pauseWalk(true,'Exploration paused. The next target uses the new chord-lock setting.');
$('walk-range').oninput=()=>pauseWalk(true,'The next target uses the selected bounded range.');
$('walk-reseed').onclick=()=>{
 const n=Number($('walk-seed').value);
 if(!Number.isInteger(n)||n<0||n>4294967295){walkMessage('Enter an integer seed from 0 to 4294967295.',true);return;}
 pauseWalk(true);tour.rng=W.randomSource(n);tour.steps=0;walkMessage(`Random sequence reset to seed ${n}. With the same starting configuration and options, targets are reproducible.`);
};
const invariantNames=['G11','G22','G33','G12','G23','G31','ρ12','ρ23','ρ31'];
$('moduli-invariants').innerHTML=invariantNames.map((n,i)=>`<div class="modulus">${n} <span id="invariant-${i}">—</span></div>`).join('');
$('moduli-sliders').innerHTML=[0,1,2].map((i)=>`<div class="chord-row"><strong>${i+1}</strong><label>Weight <input type="range" id="weight-${i}" data-weight="${i}" min=".52" max=".965" step=".001" aria-label="Weighted chord ${i+1} strength"><output id="weight-value-${i}"></output></label><label>ρ${['12','23','31'][i]} <input type="range" id="coupling-${i}" data-coupling="${i}" min=".25" max="3" step=".005" aria-label="Face coupling ${['12','23','31'][i]}"><output id="coupling-value-${i}"></output></label></div>`).join('');
$('moduli-sliders').addEventListener('input',e=>{
 const wi=e.target.dataset.weight,ci=e.target.dataset.coupling;if(wi===undefined&&ci===undefined)return;
 pauseWalk(true);stopPlay();markManual();const p=W.clone(state.p);
 if(wi!==undefined)p.inflation[+wi]=1-(+e.target.value);else p.couplings[+ci]=+e.target.value;
 try{N.family(state.phase,p);state.p=p;walkMessage('Parameters changed. The seed chords—and therefore the linked cube—have not moved.');schedule();}
 catch(e){walkMessage(e.message,true);}
});
function updateModuliReadout(){
 const show=state.scene==='journey'&&state.phase>2.999;
 $('moduli-parameters').hidden=!show;
 if(!show)return;
 const rates=state.p.couplings||[1,1,1];
 for(let i=0;i<3;i++){
  if(document.activeElement!==$(`weight-${i}`))$(`weight-${i}`).value=1-state.p.inflation[i];
  $(`weight-value-${i}`).textContent=(1-state.p.inflation[i]).toFixed(3);
  if(document.activeElement!==$(`coupling-${i}`))$(`coupling-${i}`).value=rates[i];
  $(`coupling-value-${i}`).textContent=(1+state.p.opening*rates[i]).toFixed(3);
 }
 try{const d=W.descriptor(state.p,data?.kind==='conics'?data:undefined);d.values.forEach((v,i)=>$(`invariant-${i}`).textContent=v.toFixed(4));}
 catch{invariantNames.forEach((_,i)=>$(`invariant-${i}`).textContent='—');}
}

window.incidenceStory={state,chart,render,setPhase,setScene,getData:()=>data,getView:()=>view,cube,editChord,vectorState,displayedVectors,beginVectorEdit,endVectorEdit,editVectors,reframeVectors,tour,randomTarget,wander,pauseWalk};
const entry=new URLSearchParams(location.search).get('stage');
if(entry==='penrose'){state.phase=3;state.follow=false;$('follow-story').checked=false;}
render();
// Deliberately start at the exact Pappus endpoint; scroll following begins when
// the reader actually scrolls. Reduced-motion users can step with the stop buttons.
})();
