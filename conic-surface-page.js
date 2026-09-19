/* Linked geometric and topological views. The surface positions are labels;
   the conics are independently reconstructed in the projective plane. */
(()=>{'use strict';
const E=IncidenceMath,G=IncidencePGA,N=IncidenceNarrative,Net=ConicNet,$=id=>document.getElementById(id);
const host=$('surface-geometry'),R=createGanjaView(host),canvas=$('net-topology'),ctx=canvas.getContext('2d');
const colors=['#315f9c','#168477','#9b5b90','#bb592e'];
const state={amount:1.4,twist:.1,gauge:.7,face:5,edge:-1,reveal:false,context:false,kind:'torus',yaw:.55,tilt:.7,zoom:1,pan:[0,0],animate:false,map:false,patch:false,region:[5]};
let data,frame=0,view,polygons=[],drag=null,diagramDrag=null,last=0,anim=0,traceTimer=null,motion=null;
const isNet=()=>state.kind!=='square';
const format=x=>Math.abs(x-Math.round(x))<1e-9?String(Math.round(x)):x.toFixed(4);
function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;render();});}
function project(x){const c=Math.cos(state.yaw),s=Math.sin(state.yaw),a=c*x[0]-s*x[1],b=s*x[0]+c*x[1],t=state.tilt;return [a,Math.cos(t)*b-Math.sin(t)*x[2],Math.sin(t)*b+Math.cos(t)*x[2]];}
function torusPoint(u,v){return [(1.45+.57*Math.cos(v))*Math.cos(u),(1.45+.57*Math.cos(v))*Math.sin(u),.57*Math.sin(v)];}
function topology(){
 const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height,dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);polygons=[];
 const screen=p=>{const q=project(p),s=Math.min(w/4.6,h/3.5);return [w/2+q[0]*s,h/2-q[1]*s,q[2]];};
 if(state.kind==='square'){
  const pts=[[w*.25,h*.25],[w*.75,h*.25],[w*.75,h*.75],[w*.25,h*.75]];ctx.strokeStyle='#96a6a1';ctx.lineWidth=2;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.stroke();pts.forEach((p,i)=>{ctx.beginPath();ctx.arc(...p,6,0,7);ctx.fillStyle=colors[i];ctx.fill();ctx.font='12px system-ui';ctx.fillText('Q'+i,p[0]+10,p[1]+4);});return;
 }
 const rows=data.rows;
 if(state.map){
  const cell=Math.min((w-42)/rows,(h-30)/4),x0=(w-rows*cell)/2,y0=(h-4*cell)/2;
  for(let i=0;i<rows;i++)for(let j=0;j<4;j++){
   const x=x0+i*cell,y=y0+j*cell,face=4*i+j,pts=[[x,y,0],[x+cell,y,0],[x+cell,y+cell,0],[x,y+cell,0]];
   polygons.push({pts,z:0,face});ctx.fillStyle=state.patch&&state.region.includes(face)?'#f4d4ae':face===state.face?'#e4a375':'#edf3e9';ctx.fillRect(x,y,cell,cell);ctx.strokeStyle='#97aca3';ctx.lineWidth=.8;ctx.strokeRect(x,y,cell,cell);ctx.fillStyle='#49665d';ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText(String(face+1),x+cell/2,y+cell/2+3);
  }
  const B=Net.boundary(data,state.patch?state.region:[state.face]);
  for(const f of B.faces){const face=data.faces[f];for(let k=0;k<4;k++){
   const edge=face.edges[k];if(!B.boundaryEdges.some(b=>b.edge===edge))continue;
   const v=face.vertices[k],t=face.vertices[(k+1)%4],i=f>>2,j=f%4;
   // Use the unrotated cell boundary, then match its periodic endpoint labels.
   const ids=[4*i+j,4*((i+1)%rows)+j,4*((i+1)%rows)+(j+1)%4,4*i+(j+1)%4];
   const corners=[[x0+i*cell,y0+j*cell],[x0+(i+1)*cell,y0+j*cell],[x0+(i+1)*cell,y0+(j+1)*cell],[x0+i*cell,y0+(j+1)*cell]];
   const a=ids.indexOf(v),b=ids.indexOf(t);if(a<0||b<0)continue;
   ctx.strokeStyle='#b96531';ctx.lineWidth=2.7;ctx.beginPath();ctx.moveTo(...corners[a]);ctx.lineTo(...corners[b]);ctx.stroke();
  }}
  // Matching sides, not extra vertices: this is a cut-open periodic chart.
  ctx.lineWidth=2;ctx.setLineDash([4,3]);
  for(const [color,lines] of [['#168477',[[x0,y0,x0,y0+4*cell],[x0+rows*cell,y0,x0+rows*cell,y0+4*cell]]],['#315f9c',[[x0,y0,x0+rows*cell,y0],[x0,y0+4*cell,x0+rows*cell,y0+4*cell]]]]){
   ctx.strokeStyle=color;for(const [a,b,c,d]of lines){ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke();}
  }
  ctx.setLineDash([]);ctx.textAlign='left';canvas.dataset.camera=JSON.stringify([state.yaw,state.tilt]);return;
 }
 for(let i=0;i<rows;i++)for(let j=0;j<4;j++)for(let a=0;a<7;a++)for(let b=0;b<7;b++){
  const at=(a,b)=>screen(torusPoint((i+a/7)*2*Math.PI/rows,(j+b/7)*Math.PI/2)),pts=[at(a,b),at(a+1,b),at(a+1,b+1),at(a,b+1)];polygons.push({pts,z:pts.reduce((s,p)=>s+p[2],0)/4,face:4*i+j});
 }
 polygons.sort((a,b)=>a.z-b.z);
 for(const p of polygons){ctx.beginPath();p.pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();const shade=.35+.15*(p.z+1);ctx.fillStyle=state.patch&&state.region.includes(p.face)?'#f0cfab':p.face===state.face?'#e4a375':(p.face%2?'#d2e3db':'#c2d4d4');ctx.fill();}
 const boundary=[];
 for(let i=0;i<rows;i++)for(let j=0;j<4;j++)for(let axis=0;axis<2;axis++){
  const pts=Array.from({length:18},(_,k)=>screen(torusPoint((i+(axis===0?k/17:0))*2*Math.PI/rows,(j+(axis===1?k/17:0))*Math.PI/2)));
  boundary.push({pts,z:pts.reduce((s,p)=>s+p[2],0)/18});
 }
 boundary.sort((a,b)=>a.z-b.z).forEach(({pts,z})=>{ctx.strokeStyle=z<0?'#849d9966':'#547972';ctx.lineWidth=z<0?.6:1.2;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();});
 const f=data.faces[state.face],selected=new Set(f.vertices);
 for(let i=0;i<rows;i++)for(let j=0;j<4;j++){
  const n=4*i+j,p=screen(torusPoint(i*2*Math.PI/rows,j*Math.PI/2));if(p[2]<-.4&&!selected.has(n))continue;
  ctx.beginPath();ctx.arc(p[0],p[1],selected.has(n)?4.5:2.6,0,2*Math.PI);ctx.fillStyle=selected.has(n)?colors[f.vertices.indexOf(n)]:state.kind==='odd'?'#617a72':Net.parity(n)?'#fbfcf8':'#43645f';ctx.fill();ctx.strokeStyle='#587970';ctx.lineWidth=.8;ctx.stroke();
 }
 $('net-topology').dataset.camera=JSON.stringify([state.yaw,state.tilt]);
}
function diagram(){
 const b=$('surface-drawing').getBoundingClientRect();view={w:b.width,h:b.height,s:Math.min(b.width,b.height)/(isNet()?3.05:5.2)*state.zoom,x:b.width/2+state.pan[0],y:b.height*.52+state.pan[1]};R.begin(view);
 const f=data.faces[state.face],context=new Set(f.vertices);
 if(state.context&&isNet())data.Q.forEach((q,i)=>{if(!context.has(i))R.conic(q,'#c7d2cb',.45,.8);});
 f.vertices.forEach((v,k)=>R.conic(data.Q[v],colors[k],state.edge<0||data.edges[f.edges[state.edge]].source===v||data.edges[f.edges[state.edge]].target===v?1:.2,k===0?2.6:2));
 f.edges.forEach((e,k)=>{const edge=data.edges[e],selected=state.edge<0||state.edge===k;R.line(edge.chord,colors[k],selected?.78:.13,selected?1.35:.7,[5,4]);if(state.edge===k){const pts=N.lineConic(data.Q[edge.source],edge.chord);pts.forEach((p,i)=>{R.point(p,colors[k],'T'+(i+1),false,4);R.line(E.mul(data.Q[edge.source],p),colors[k],.45,.9);});}});
 if(state.reveal&&f.point)R.point(f.point,isNet()?'#bb592e':'#8c627e',isNet()?'Ω':'ℓ₀ ∩ ℓ₁',false,5);
 R.finish().setAttribute('aria-label',isNet()?'Four nonsingular conics with four concurrent contact chords':'Four contacting conics whose contact chords are not concurrent');
 $('surface-legend').innerHTML=f.vertices.map((v,k)=>`<span><i style="--legend-color:${colors[k]}"></i>Q<sub>${isNet()?(v>>2)+','+(v%4):v}</sub></span>`).join('');
}
function clearTrace(){clearInterval(traceTimer);traceTimer=null;$('transport-trace').textContent='Start with scale 1. Reversed edges use inverse factors.';$('transport-values').querySelectorAll('button').forEach(b=>b.classList.remove('tracing'));}
function selectFace(f){
 if(!Number.isInteger(f)||f<0||f>=data.faces.length)return;
 clearTrace();state.face=f;state.edge=-1;state.reveal=false;
 if(state.patch){const i=state.region.indexOf(f);if(i>=0)state.region.splice(i,1);else state.region.push(f);}else state.region=[f];schedule();
}
function render(){
 try{data=isNet()?Net.torus({...state,rows:state.kind==='odd'?3:4}):Net.noncoherent();if(state.kind==='square')state.face=0;
  topology();diagram();
  $('surface-title').textContent=isNet()?'One face of a conic torus':'Contact without concurrence';
  $('surface-status').classList.remove('error');
  $('surface-status').textContent=state.kind==='square'?'All four adjacent pairs have double contact, but the scale returns multiplied by 2. The chords are not concurrent.':state.reveal?`The four contact chords meet at Ω. This face follows from the other ${data.faces.length-1}.`:`${data.Q.length} conics, ${data.edges.length} contacts. ${state.kind==='odd'?'The 3-edge loop prevents any black–white coloring.':'Select a face and reveal its concurrence.'}`;
  $('surface-diagnostic').textContent=`Largest contact residual ${data.maxEdge.toExponential(2)}; selected face residual ${data.faces[state.face].error.toExponential(2)}. These are drawing diagnostics, not proof evidence.`;
  $('surface-parameters').hidden=!isNet();$('net-face-buttons').hidden=!isNet();$('patch-controls').hidden=!isNet();$('net-map').hidden=!isNet();$('net-counts').textContent=isNet()?`${data.Q.length} conics · ${data.edges.length} contacts · ${data.faces.length} faces`:'4 conics · 4 contacts · H = 2';
  $('topology-caption').textContent=!isNet()?'A single face; no gluing is asserted.':state.map?'Matching colored sides are identified. Orange marks the patch boundary.':'Drag to turn the gluing diagram; click a face.';
  $('net-map').textContent=state.map?'Show torus':'Cut open';$('net-map').setAttribute('aria-pressed',String(state.map));
  $('face-number').textContent=isNet()?`Face ${state.face+1} / ${data.faces.length}`:'A noncoherent quadrilateral';
  $('reveal-face').textContent=state.reveal?'Hide concurrence':'Reveal concurrence';$('reveal-face').disabled=state.kind==='square';
  // Keep buttons in the DOM: keyboard focus must survive moving geometry.
  const faces=$('net-face-buttons');
  if(faces.childElementCount!==data.faces.length)faces.innerHTML=data.faces.map((f,i)=>`<button type="button" data-face="${i}" title="Select face ${i+1}">${i+1}<span></span></button>`).join('');
  faces.querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-pressed',String(state.patch?state.region.includes(i):i===state.face));b.querySelector('span').textContent=i===state.face&&!state.reveal?'?':'✓';});
  const f=data.faces[state.face],values=$('transport-values');
  if(values.childElementCount!==4)values.innerHTML=f.edges.map((e,k)=>`<button type="button" data-contact="${k}" style="--contact-color:${colors[k]}"><span>ℓ${k}</span><strong></strong><small></small></button>`).join('');
  values.querySelectorAll('button').forEach((b,k)=>{b.setAttribute('aria-pressed',String(state.edge===k));b.querySelector('strong').textContent=format(data.edges[f.edges[k]].scale);b.querySelector('small').textContent=f.directions[k]===1?'forward: ×λ':'reverse: ÷λ';});
  if(isNet()){
   const patch=Net.boundary(data,state.patch?state.region:[state.face]);
   $('patch-readout').textContent=`${patch.faces.length} selected faces · ${patch.internalEdges.length} internal edges cancel · ${patch.boundaryEdges.length} boundary edges. Boundary product = ${format(patch.boundaryProduct)}.`;
  }
  $('holonomy-value').textContent=state.kind==='square'?'2':state.reveal?'1':'?';
  $('global-product').textContent=isNet()?'∏ Hf = 1':'This example is one face, not a closed surface.';
 }catch(e){$('surface-status').textContent=e.message;$('surface-status').classList.add('error');}
}
function stop(clear=false){clearTrace();state.animate=false;cancelAnimationFrame(anim);last=0;if(clear)motion=null;$('animate-net').textContent=motion?'Resume motion':'Move the conics';}
function newMotion(){return {from:{amount:state.amount,twist:state.twist},to:{amount:state.amount>1?.65:1.45,twist:state.twist>0?-.18:.18},elapsed:0,duration:5000};}
function tick(t){
 if(!state.animate)return;
 if(!motion)motion=newMotion();
 const dt=last?Math.min(100,Math.max(0,t-last)):0;last=t;motion.elapsed+=dt;
 Object.assign(state,Net.interpolate(motion.from,motion.to,motion.elapsed/motion.duration));
 $('net-amount').value=state.amount;$('net-twist').value=state.twist;render();
 if(motion.elapsed>=motion.duration)motion=null;
 anim=requestAnimationFrame(tick);
}
$('trace-scale').onclick=()=>{
 stop();let step=0,total=1;const f=data.faces[state.face];$('transport-trace').textContent='Starting scale: 1';
 function advance(){if(step>=4){clearInterval(traceTimer);return;}const e=data.edges[f.edges[step]],factor=e.scale**f.directions[step];total*=factor;
  $('transport-values').querySelectorAll('button').forEach((b,k)=>b.classList.toggle('tracing',k===step));
  $('transport-trace').textContent=`Step ${step+1}: multiply by ${format(factor)} → ${format(total)}${step===3?(Math.abs(total-1)<1e-8?' · back to the original scale':' · not back to the original scale'):''}`;step++;
 }
 advance();if(matchMedia('(prefers-reduced-motion: reduce)').matches){while(step<4)advance();}else traceTimer=setInterval(advance,700);
};
$('animate-net').onclick=()=>{if(state.animate){stop();return;}clearTrace();if(!motion)motion=newMotion();if(matchMedia('(prefers-reduced-motion: reduce)').matches){Object.assign(state,motion.to);motion=null;$('net-amount').value=state.amount;$('net-twist').value=state.twist;schedule();return;}state.animate=true;last=0;$('animate-net').textContent='Pause';anim=requestAnimationFrame(tick);};
for(const [id,key] of [['net-amount','amount'],['net-twist','twist'],['net-gauge','gauge']])$(id).oninput=e=>{stop(true);state[key]=+e.target.value;schedule();};
$('net-context').onchange=e=>{state.context=e.target.checked;schedule();};
$('reveal-face').onclick=()=>{state.reveal=!state.reveal;schedule();};$('clear-contact').onclick=()=>{state.edge=-1;schedule();};
$('net-face-buttons').addEventListener('click',e=>{const b=e.target.closest('[data-face]');if(b)selectFace(+b.dataset.face);});
$('transport-values').addEventListener('click',e=>{const b=e.target.closest('[data-contact]');if(b){state.edge=+b.dataset.contact;schedule();}});
$('surface-example').onchange=e=>{stop(true);state.kind=e.target.value;state.face=state.kind==='odd'?10:state.kind==='torus'?5:0;state.region=[state.face];state.edge=-1;state.reveal=state.kind==='square';state.zoom=1;state.pan=[0,0];schedule();};
document.querySelectorAll('[data-net-example]').forEach(b=>b.onclick=()=>{$('surface-example').value=b.dataset.netExample;$('surface-example').dispatchEvent(new Event('change'));if(innerWidth<880)$('surface-laboratory').scrollIntoView({block:'start',behavior:'smooth'});});
const inside=(p,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw:state.yaw,tilt:state.tilt,moved:false};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>4)drag.moved=true;if(drag.moved&&!state.map){state.yaw=drag.yaw+dx/130;state.tilt=Math.max(-1.4,Math.min(1.4,drag.tilt+dy/140));topology();}});
canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved&&isNet()){const r=canvas.getBoundingClientRect(),p=[e.clientX-r.left,e.clientY-r.top];for(const face of [...polygons].reverse())if(inside(p,face.pts)){selectFace(face.face);break;}}drag=null;});
for(const event of ['pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>drag=null);
canvas.addEventListener('keydown',e=>{if(!state.map&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();state.yaw+=e.key==='ArrowLeft'?-.12:e.key==='ArrowRight'?.12:0;state.tilt=Math.max(-1.4,Math.min(1.4,state.tilt+(e.key==='ArrowUp'?.1:e.key==='ArrowDown'?-.1:0)));topology();}});
$('surface-drawing').addEventListener('pointerdown',e=>{diagramDrag={x:e.clientX,y:e.clientY,pan:state.pan.slice()};$('surface-drawing').setPointerCapture(e.pointerId);});
$('surface-drawing').addEventListener('pointermove',e=>{if(diagramDrag){state.pan=[diagramDrag.pan[0]+e.clientX-diagramDrag.x,diagramDrag.pan[1]+e.clientY-diagramDrag.y];schedule();}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('surface-drawing').addEventListener(event,()=>diagramDrag=null);
$('surface-drawing').addEventListener('wheel',e=>{if(!e.shiftKey)return;e.preventDefault();state.zoom=Math.max(.3,Math.min(4,state.zoom*Math.exp(-e.deltaY*.001)));schedule();},{passive:false});
$('surface-fit').onclick=()=>{state.zoom=1;state.pan=[0,0];schedule();};
$('net-map').onclick=()=>{state.map=!state.map;topology();schedule();};
$('net-reset').onclick=()=>{state.yaw=.55;state.tilt=.7;state.zoom=1;state.pan=[0,0];schedule();};
$('patch-mode').onchange=e=>{state.patch=e.target.checked;state.region=[state.face];schedule();};
$('patch-four').onclick=()=>{state.patch=true;$('patch-mode').checked=true;state.region=[0,1,4,5];state.map=true;schedule();};
$('patch-all').onclick=()=>{state.patch=true;$('patch-mode').checked=true;state.region=data.faces.map((_,i)=>i);schedule();};
function snapshot(){const keys=['amount','twist','gauge','face','edge','kind','reveal','context','yaw','tilt','zoom','pan','map','patch','region'];return Object.fromEntries([['v',1],...keys.map(k=>[k,state[k]])]);}
function restore(value){
 if(!value||value.v!==1||!['torus','odd','square'].includes(value.kind))throw Error('Unknown saved view.');
 const limit=value.kind==='torus'?16:value.kind==='odd'?12:1;
 const ranges={amount:[.3,1.8],twist:[-.3,.3],gauge:[0,2],yaw:[-1e4,1e4],tilt:[-1.4,1.4],zoom:[.3,4]};
 for(const [key,[lo,hi]]of Object.entries(ranges))if(!Number.isFinite(value[key])||value[key]<lo||value[key]>hi)throw Error('Invalid saved coordinate.');
 if(!Number.isInteger(value.face)||value.face<0||value.face>=limit||!Number.isInteger(value.edge)||value.edge< -1||value.edge>3)throw Error('Invalid saved selection.');
 if(!Array.isArray(value.pan)||value.pan.length!==2||value.pan.some(x=>!Number.isFinite(x)||Math.abs(x)>1e5))throw Error('Invalid saved pan.');
 if(!Array.isArray(value.region)||value.region.some(x=>!Number.isInteger(x)||x<0||x>=limit))throw Error('Invalid saved patch.');
 for(const key of ['reveal','context','map','patch'])if(typeof value[key]!=='boolean')throw Error('Invalid saved toggle.');
 for(const key of Object.keys(snapshot()))if(key!=='v')state[key]=value[key];
 state.region=[...new Set(state.region)];state.animate=false;
 $('surface-example').value=state.kind;$('net-amount').value=state.amount;$('net-twist').value=state.twist;$('net-gauge').value=state.gauge;$('net-context').checked=state.context;$('patch-mode').checked=state.patch;
}
$('bookmark-scene').onclick=()=>{
 try{const url=new URL(location.href);url.hash='scene='+encodeURIComponent(JSON.stringify(snapshot()));history.replaceState(null,'',url);$('share-status').textContent='Address updated. Bookmark or copy this URL to return to the same view.';}catch{$('share-status').textContent='Bookmarking needs the published page or a local HTTP server.';}
};
try{if(location.hash.startsWith('#scene='))restore(JSON.parse(decodeURIComponent(location.hash.slice(7))));}catch{$('share-status').textContent='Invalid saved view ignored; showing the default configuration.';}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
new ResizeObserver(schedule).observe($('surface-drawing'));new ResizeObserver(schedule).observe(canvas);
window.conicSurface={state,render,getData:()=>data,selectFace,snapshot,restore};render();
})();
