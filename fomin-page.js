/* A separate reading-driven Fomin–Pylyavskyy page. Rendering is native ganja;
 * the arbitrary edge-weight model is explicitly not a geometric realization. */
(()=>{'use strict';
const E=IncidenceMath,G=IncidencePGA,$=id=>document.getElementById(id),host=$('fomin-geometry'),R=createGanjaView(host);
const state={weights:false,follow:true,O:[.08,-.05,1],ts:[.57,.68,.78],complete:true,w:E.coherentWeights(),edge:0};
let view,data,frame=0,drag=null;
function manual(){state.follow=false;$('fomin-follow').checked=false;}
function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;render();});}
function ratioTable(r,exact){$('face-ratios').innerHTML=r.map((v,i)=>`<span class="${exact&&v.n!==v.d?'noncoherent':''}">Face ${i+1}<strong>${exact?E.ratioString(v):v.toFixed(8)}</strong></span>`).join('');}
function geometry(){
 data=G.fomin(state.O,state.ts);const V=data.vertices,P=[data.labels[3],data.labels[5],data.labels[6]];
 for(let i=0;i<3;i++){
  const j=(i+1)%3;
  R.line(G.joinCoordinates(V[i],V[j]),'#315f9c',.65,1.25);
  R.path([G.affine(G.point(P[i])),G.affine(G.point(P[j]))],'#148176',1,2.1);
  R.line(G.joinCoordinates(state.O,V[i]),'#8d9e99',.45,.9,[4,4]);
  R.point(V[i],'#315f9c',['A','B','C'][i],false,4);R.point(P[i],'#148176',['A′','B′','C′'][i],false,4);
 }
 if(state.complete){R.line(data.labels[7],'#bb592e',1,2.2);data.meetings.forEach((p,i)=>R.point(p,'#bb592e',['X','Y','Z'][i],false,4));}
 R.point(state.O,'#315f9c','O',true,5,'center');ratioTable(data.ratios,false);
 $('fomin-readout').textContent=`${state.complete?'The three intersections lie on the completing line.':'The completing line is hidden; the six face ratios are still evaluated.'} Normalized geometric residual ${data.error.toExponential(1)}.`;
}
function weights(){
 data=E.surface(state.w);const pos=Array.from({length:8},(_,i)=>[-1.12+(i&1)*1.55+((i>>2)&1)*.57,-.92+((i>>1)&1)*1.46+((i>>2)&1)*.48,1]);
 E.EDGES.forEach(([a,b],i)=>{
  R.path([pos[a],pos[b]],i===state.edge?'#bb592e':'#789892',1,i===state.edge?3:1.7);
  const m=pos[a].map((x,j)=>(x+pos[b][j])/2);R.point(m,i===state.edge?'#bb592e':'#526b65',String(state.w[i]),true,2,`edge:${i}`);
 });
 pos.forEach((p,i)=>R.point(p,E.parity(i)?'#315f9c':'#148176',E.LABELS[i],false,4));ratioTable(data.ratios,true);
 const count=data.ratios.filter(r=>r.n!==r.d).length;
 $('fomin-readout').textContent=`${count?count+' face ratios differ from one.':'All six faces are coherent.'} The product is exactly ${E.ratioString(data.product)}. These are arbitrary edge weights, not assumed point–line pairings.`;
}
function render(){
 const box=$('fomin-drawing').getBoundingClientRect();view={w:box.width,h:box.height,s:Math.min(box.width,box.height)/(state.weights?3.1:4.5),x:box.width/2,y:box.height*.52};R.begin(view);
 $('weight-view').checked=state.weights;$('geometric-controls').hidden=state.weights;$('weight-controls').hidden=!state.weights;$('weight-edge').value=state.edge;
 $('fomin-title').textContent=state.weights?'Exact cancellation':'A point–line configuration';$('fomin-readout').classList.remove('error');
 try{if(state.weights)weights();else geometry();}catch(e){$('fomin-readout').textContent=e.message;$('fomin-readout').classList.add('error');if(!state.weights)R.point(state.O,'#315f9c','O',true,5,'center');}
 R.finish().setAttribute('aria-label',state.weights?'Cube with exact integer edge weights':'Desargues incidence configuration with draggable perspective center');
}
$('weight-view').onchange=e=>{manual();state.weights=e.target.checked;schedule();};
$('perspective').oninput=e=>{manual();state.ts[0]=+e.target.value;schedule();};
$('fomin-complete').onchange=e=>{manual();state.complete=e.target.checked;schedule();};
$('weight-edge').onchange=e=>{manual();state.edge=+e.target.value;schedule();};
$('double-edge').onclick=()=>{manual();if(!Number.isSafeInteger(state.w[state.edge]*2)){$('fomin-readout').textContent='This edge has reached the safe-integer limit. Reset the weights to continue.';return;}state.w[state.edge]*=2;schedule();};
$('reset-weights').onclick=()=>{manual();state.w=E.coherentWeights();schedule();};
$('fomin-follow').onchange=e=>{state.follow=e.target.checked;if(state.follow)follow();};
function follow(){if(!state.follow)return;let active;for(const section of document.querySelectorAll('[data-fomin]'))if(section.getBoundingClientRect().top<innerHeight*.4)active=section;if(active){state.weights=active.dataset.fomin==='weights';schedule();}}
window.addEventListener('scroll',follow,{passive:true});
$('fomin-drawing').addEventListener('pointerdown',e=>{const h=e.target.closest('[data-handle]');if(!h)return;manual();if(h.dataset.handle.startsWith('edge:')){state.edge=+h.dataset.handle.slice(5);schedule();return;}drag=true;$('fomin-drawing').setPointerCapture(e.pointerId);});
$('fomin-drawing').addEventListener('pointermove',e=>{if(!drag)return;const b=$('fomin-drawing').getBoundingClientRect();state.O=[(e.clientX-b.left-view.x)/view.s,-(e.clientY-b.top-view.y)/view.s,1];schedule();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('fomin-drawing').addEventListener(event,()=>drag=false);
host.addEventListener('keydown',e=>{const h=e.target.closest('[data-handle]');if(!h)return;if(h.dataset.handle.startsWith('edge:')&&['Enter',' '].includes(e.key)){e.preventDefault();manual();state.edge=+h.dataset.handle.slice(5);schedule();}if(h.dataset.handle==='center'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();manual();state.O[e.key==='ArrowLeft'||e.key==='ArrowRight'?0:1]+=(e.key==='ArrowRight'||e.key==='ArrowUp'?1:-1)*.035;schedule();}});
new ResizeObserver(schedule).observe($('fomin-drawing'));window.fominStory={state,render,getData:()=>data};render();
})();
