/* Linked geometric and topological views. The surface positions are labels;
   the conics are independently reconstructed in the projective plane. */
(()=>{'use strict';
const E=IncidenceMath,G=IncidencePGA,N=IncidenceNarrative,Net=ConicNet,$=id=>document.getElementById(id);
const host=$('surface-geometry'),R=createGanjaView(host),canvas=$('net-topology'),ctx=canvas.getContext('2d');
const colors=['#315f9c','#168477','#9b5b90','#bb592e'];
const state={amount:1.4,twist:.1,gauge:.7,face:0,edge:-1,reveal:false,context:false,kind:'torus',yaw:.55,tilt:.7,zoom:1,pan:[0,0],animate:false};
let data,frame=0,view,polygons=[],drag=null,diagramDrag=null,last=0,anim=0,traceTimer=null;
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
 for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let a=0;a<7;a++)for(let b=0;b<7;b++){
  const at=(a,b)=>screen(torusPoint((i+a/7)*Math.PI/2,(j+b/7)*Math.PI/2)),pts=[at(a,b),at(a+1,b),at(a+1,b+1),at(a,b+1)];polygons.push({pts,z:pts.reduce((s,p)=>s+p[2],0)/4,face:4*i+j});
 }
 polygons.sort((a,b)=>a.z-b.z);
 for(const p of polygons){ctx.beginPath();p.pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();const shade=.35+.15*(p.z+1);ctx.fillStyle=p.face===state.face?'#e4a375':(p.face%2?'#d2e3db':'#c2d4d4');ctx.fill();}
 const boundary=[];
 for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let axis=0;axis<2;axis++){
  const pts=Array.from({length:18},(_,k)=>screen(torusPoint((i+(axis===0?k/17:0))*Math.PI/2,(j+(axis===1?k/17:0))*Math.PI/2)));
  boundary.push({pts,z:pts.reduce((s,p)=>s+p[2],0)/18});
 }
 boundary.sort((a,b)=>a.z-b.z).forEach(({pts,z})=>{ctx.strokeStyle=z<0?'#849d9966':'#547972';ctx.lineWidth=z<0?.6:1.2;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();});
 const f=data.faces[state.face],selected=new Set(f.vertices);
 for(let i=0;i<4;i++)for(let j=0;j<4;j++){
  const n=4*i+j,p=screen(torusPoint(i*Math.PI/2,j*Math.PI/2));if(p[2]<-.4&&!selected.has(n))continue;
  ctx.beginPath();ctx.arc(p[0],p[1],selected.has(n)?4.5:2.6,0,2*Math.PI);ctx.fillStyle=selected.has(n)?colors[f.vertices.indexOf(n)]:Net.parity(n)?'#fbfcf8':'#43645f';ctx.fill();ctx.strokeStyle='#587970';ctx.lineWidth=.8;ctx.stroke();
 }
 $('net-topology').dataset.camera=JSON.stringify([state.yaw,state.tilt]);
}
function diagram(){
 const b=$('surface-drawing').getBoundingClientRect();view={w:b.width,h:b.height,s:Math.min(b.width,b.height)/(state.kind==='torus'?3.05:5.2)*state.zoom,x:b.width/2+state.pan[0],y:b.height*.52+state.pan[1]};R.begin(view);
 const f=data.faces[state.face],context=new Set(f.vertices);
 if(state.context&&state.kind==='torus')data.Q.forEach((q,i)=>{if(!context.has(i))R.conic(q,'#c7d2cb',.45,.8);});
 f.vertices.forEach((v,k)=>R.conic(data.Q[v],colors[k],state.edge<0||data.edges[f.edges[state.edge]].source===v||data.edges[f.edges[state.edge]].target===v?1:.2,k===0?2.6:2));
 f.edges.forEach((e,k)=>{const edge=data.edges[e],selected=state.edge<0||state.edge===k;R.line(edge.chord,colors[k],selected?.78:.13,selected?1.35:.7,[5,4]);if(state.edge===k){const pts=N.lineConic(data.Q[edge.source],edge.chord);pts.forEach((p,i)=>{R.point(p,colors[k],'T'+(i+1),false,4);R.line(E.mul(data.Q[edge.source],p),colors[k],.45,.9);});}});
 if(state.reveal&&f.point)R.point(f.point,state.kind==='torus'?'#bb592e':'#8c627e',state.kind==='torus'?'Ω':'ℓ₀ ∩ ℓ₁',false,5);
 R.finish().setAttribute('aria-label',state.kind==='torus'?'Four nonsingular conics with four concurrent contact chords':'Four contacting conics whose contact chords are not concurrent');
 $('surface-legend').innerHTML=f.vertices.map((v,k)=>`<span><i style="--legend-color:${colors[k]}"></i>Q<sub>${state.kind==='torus'?(v>>2)+','+(v%4):v}</sub></span>`).join('');
}
function selectFace(f){clearInterval(traceTimer);$('transport-trace').textContent='Start with scale 1. Reversed edges use inverse factors.';state.face=f;state.edge=-1;state.reveal=false;schedule();}
function render(){
 try{data=state.kind==='torus'?Net.torus(state):Net.noncoherent();if(state.kind==='square')state.face=0;
  topology();diagram();
  $('surface-title').textContent=state.kind==='torus'?'One face of a conic torus':'Contact without concurrence';
  $('surface-status').classList.remove('error');
  $('surface-status').textContent=state.kind==='square'?'All four adjacent pairs have double contact, but the scale returns multiplied by 2. The chords are not concurrent.':state.reveal?'The four contact chords meet at Ω. This is the face forced by the other fifteen.':'Sixteen conics, thirty-two contacts. Inspect the selected face, then reveal its concurrence.';
  $('surface-diagnostic').textContent=`Largest contact residual ${data.maxEdge.toExponential(2)}; selected face residual ${data.faces[state.face].error.toExponential(2)}. These are drawing diagnostics, not proof evidence.`;
  $('surface-parameters').hidden=state.kind!=='torus';$('net-face-buttons').hidden=state.kind!=='torus';$('net-counts').textContent=state.kind==='torus'?'16 conics · 32 contact edges · 16 faces':'4 conics · 4 contacts · H = 2';
  $('face-number').textContent=state.kind==='torus'?`Face ${state.face+1} / 16`:'A noncoherent quadrilateral';
  $('reveal-face').textContent=state.reveal?'Hide concurrence':'Reveal concurrence';$('reveal-face').disabled=state.kind==='square';
  $('net-face-buttons').innerHTML=data.faces.map((f,i)=>`<button type="button" data-face="${i}" aria-pressed="${i===state.face}" title="Select face ${i+1}">${i+1}<span>${i===state.face&&!state.reveal?'?':'✓'}</span></button>`).join('');
  const f=data.faces[state.face];$('transport-values').innerHTML=f.edges.map((e,k)=>`<button type="button" data-contact="${k}" aria-pressed="${state.edge===k}" style="--contact-color:${colors[k]}"><span>ℓ${k}</span><strong>${format(data.edges[e].scale)}</strong><small>${k%2?'denominator':'numerator'}</small></button>`).join('');
  $('holonomy-value').textContent=state.kind==='square'?'2':state.reveal?'1':'?';
  $('global-product').textContent=state.kind==='torus'?'∏ Hf = 1':'This example is one face, not a closed surface.';
 }catch(e){$('surface-status').textContent=e.message;$('surface-status').classList.add('error');}
}
function stop(){clearInterval(traceTimer);state.animate=false;cancelAnimationFrame(anim);last=0;$('animate-net').textContent='Move the conics';}
function tick(t){if(!state.animate)return;if(!last)last=t;const d=(t-last)/1000;state.amount=1.05+.4*Math.sin(d*.6);state.twist=.16*Math.sin(d*.38);$('net-amount').value=state.amount;$('net-twist').value=state.twist;render();anim=requestAnimationFrame(tick);}
$('trace-scale').onclick=()=>{
 stop();let step=0,total=1;const f=data.faces[state.face];$('transport-trace').textContent='Starting scale: 1';
 function advance(){if(step>=4){clearInterval(traceTimer);return;}const e=data.edges[f.edges[step]],factor=step%2?1/e.scale:e.scale;total*=factor;
  $('transport-values').querySelectorAll('button').forEach((b,k)=>b.classList.toggle('tracing',k===step));
  $('transport-trace').textContent=`Step ${step+1}: multiply by ${format(factor)} → ${format(total)}${step===3?(Math.abs(total-1)<1e-8?' · back to the original scale':' · not back to the original scale'):''}`;step++;
 }
 advance();if(matchMedia('(prefers-reduced-motion: reduce)').matches){while(step<4)advance();}else traceTimer=setInterval(advance,700);
};
$('animate-net').onclick=()=>{if(state.animate){stop();return;}if(matchMedia('(prefers-reduced-motion: reduce)').matches){state.twist=state.twist===0?.15:0;schedule();return;}state.animate=true;last=0;$('animate-net').textContent='Pause';anim=requestAnimationFrame(tick);};
for(const [id,key] of [['net-amount','amount'],['net-twist','twist'],['net-gauge','gauge']])$(id).oninput=e=>{stop();state[key]=+e.target.value;schedule();};
$('net-context').onchange=e=>{state.context=e.target.checked;schedule();};
$('reveal-face').onclick=()=>{state.reveal=!state.reveal;schedule();};$('clear-contact').onclick=()=>{state.edge=-1;schedule();};
$('net-face-buttons').addEventListener('click',e=>{const b=e.target.closest('[data-face]');if(b)selectFace(+b.dataset.face);});
$('transport-values').addEventListener('click',e=>{const b=e.target.closest('[data-contact]');if(b){state.edge=+b.dataset.contact;schedule();}});
$('surface-example').onchange=e=>{stop();state.kind=e.target.value;state.face=0;state.edge=-1;state.reveal=state.kind==='square';state.zoom=1;state.pan=[0,0];schedule();};
document.querySelectorAll('[data-net-example]').forEach(b=>b.onclick=()=>{$('surface-example').value=b.dataset.netExample;$('surface-example').dispatchEvent(new Event('change'));if(innerWidth<880)$('surface-laboratory').scrollIntoView({block:'start',behavior:'smooth'});});
const inside=(p,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw:state.yaw,tilt:state.tilt,moved:false};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>4)drag.moved=true;if(drag.moved){state.yaw=drag.yaw+dx/130;state.tilt=Math.max(-1.4,Math.min(1.4,drag.tilt+dy/140));topology();}});
canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved&&state.kind==='torus'){const r=canvas.getBoundingClientRect(),p=[e.clientX-r.left,e.clientY-r.top];for(const face of [...polygons].reverse())if(inside(p,face.pts)){selectFace(face.face);break;}}drag=null;});
for(const event of ['pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>drag=null);
canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();state.yaw+=e.key==='ArrowLeft'?-.12:e.key==='ArrowRight'?.12:0;state.tilt+=e.key==='ArrowUp'?.1:e.key==='ArrowDown'?-.1:0;topology();}});
$('surface-drawing').addEventListener('pointerdown',e=>{diagramDrag={x:e.clientX,y:e.clientY,pan:state.pan.slice()};$('surface-drawing').setPointerCapture(e.pointerId);});
$('surface-drawing').addEventListener('pointermove',e=>{if(diagramDrag){state.pan=[diagramDrag.pan[0]+e.clientX-diagramDrag.x,diagramDrag.pan[1]+e.clientY-diagramDrag.y];schedule();}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('surface-drawing').addEventListener(event,()=>diagramDrag=null);
$('surface-drawing').addEventListener('wheel',e=>{if(!e.shiftKey)return;e.preventDefault();state.zoom=Math.max(.3,Math.min(4,state.zoom*Math.exp(-e.deltaY*.001)));schedule();},{passive:false});
$('surface-fit').onclick=()=>{state.zoom=1;state.pan=[0,0];schedule();};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
new ResizeObserver(schedule).observe($('surface-drawing'));new ResizeObserver(schedule).observe(canvas);
window.conicSurface={state,render,getData:()=>data,selectFace};render();
})();
