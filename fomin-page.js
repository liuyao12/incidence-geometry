/* Reading-driven applications of Fomin–Pylyavskyy's master theorem.
 * Figure labels, surface faces, and geometric constructions live in
 * fomin-classics.js; this file only presents and edits those constructions.
 */
(()=>{'use strict';
const E=IncidenceMath,F=FominClassics,$=id=>document.getElementById(id),host=$('fomin-geometry'),R=createGanjaView(host);
const state={example:'desargues',face:5,inspect:false,dual:false,weights:false,follow:true,complete:true,params:F.defaults(),w:E.coherentWeights(),edge:0};
Object.defineProperties(state,{O:{get:()=>state.params.desargues.O,set:v=>state.params.desargues.O=v},ts:{get:()=>state.params.desargues.ts}});
let data,view,frame=0,drag=null,formulaKey='',mapKey='',tableKey='',lastFollow='',notice='',cameras={};
const colors={first:'#315f9c',second:'#148176',third:'#687892',input:'#435e6b',connector:'#84958f',auxiliary:'#9ca794',center:'#315f9c',section:'#56695c',conclusion:'#bb592e'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const label=s=>s.replace(/^l(?=\d)/,'ℓ').replace(/\d/g,n=>'₀₁₂₃₄₅₆₇₈₉'[+n]);
const model=()=>F.models[state.example],params=()=>state.params[state.example];
function manual(){state.follow=false;$('fomin-follow').checked=false;lastFollow='';}
function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;render();});}
function setExample(name,user=true){
 if(user)manual();state.weights=false;
 const generalized=name==='generalization';state.example=generalized?'quadrangle':name;
 if(generalized)params().release=1;else if(name==='quadrangle')params().release=0;
 state.face=model().last;state.inspect=false;notice='';formulaKey='';mapKey='';tableKey='';
 schedule();
}
function bounds(d){
 let ps=Object.values(state.dual?d.lines:d.points).map(F.affine).filter(p=>p&&p.every(v=>Math.abs(v)<30));
 if(!ps.length)return {x:0,y:0,w:5,h:4};
 let x0=Math.min(...ps.map(p=>p[0])),x1=Math.max(...ps.map(p=>p[0])),y0=Math.min(...ps.map(p=>p[1])),y1=Math.max(...ps.map(p=>p[1]));
 return {x:(x0+x1)/2,y:(y0+y1)/2,w:Math.max(2,x1-x0)*1.18,h:Math.max(1.6,y1-y0)*1.28};
}
function setupView(d){
 const b=$('fomin-drawing').getBoundingClientRect(),key=state.example+(state.dual?'-dual':'');
 if(!cameras[key])cameras[key]=bounds(d);const c=cameras[key],s=Math.min((b.width-45)/c.w,(b.height-50)/c.h);
 view={w:b.width,h:b.height,s,x:b.width/2-c.x*s,y:b.height/2+c.y*s};R.begin(view);
}
function geometry(){
 data=F.build(state.example,params());setupView(data);
 const f=model().faces[state.face],[pn,ln,qn,mn]=f.cycle,selected=data.results[state.face];
 const meetKey=Object.keys(data.points).find(k=>Math.hypot(...E.cross(F.unit(data.points[k]),selected.point))<1e-7);
 const muted=state.inspect?.18:1;
 if(!state.dual){
  for(const seg of data.segments){
   if(seg.group==='conclusion'&&!state.complete)continue;
   R.line(data.lines[seg.key],colors[seg.group]||colors.input,(seg.group==='auxiliary'?.4:.65)*muted,seg.group==='conclusion'?2:1.1,seg.group==='connector'?[4,4]:[]);
  }
  if(state.example==='quadrangle'){
   const ps=data.points;
   if(params().release===0)R.line(data.lines.h,'#586759',.75*muted,1.5);
   else for(const [a,b] of [['P14','P24'],['P14','P34'],['P24','P34']])R.line(F.cross(ps[a],ps[b]),'#889777',.7*muted,1,[4,4]);
  }
  if(state.inspect){
   for(const n of [ln,mn])R.line(data.lines[n],'#315f9c',.95,2);
   if(state.face!==model().last||state.complete){R.line(selected.line,'#bb592e',1,2,[5,3]);if(!meetKey)R.point(selected.point,'#bb592e','N',false,4.8);}
  }
  for(const [key,p] of Object.entries(data.points)){
   if(data.groups[key]==='conclusion'&&!state.complete)continue;
   const h=data.handles.find(h=>h.key===key),color=state.inspect&&(key===pn||key===qn||key===meetKey)?'#bb592e':colors[data.groups[key]]||colors.input;
   R.point(p,color,label(key),!!h,h?4.5:3.2,h?(key==='O'?'center':'point:'+key):'');
  }
 }else{
  for(const [key,p] of Object.entries(data.points))if(state.complete||data.groups[key]!=='conclusion')R.line(p,colors[data.groups[key]]||colors.input,.4*muted,1);
  for(const [key,l] of Object.entries(data.lines)){
   const group=data.segments.find(s=>s.key===key)?.group;
   if(group==='conclusion'&&!state.complete)continue;
   R.point(l,colors[group]||colors.input,label(key),false,3.5);
  }
  if(state.inspect){
   R.line(data.points[pn],'#315f9c',1,2);R.line(data.points[qn],'#315f9c',1,2);
   R.point(data.lines[ln],'#315f9c',label(ln),false,4);R.point(data.lines[mn],'#315f9c',label(mn),false,4);
   if(state.face!==model().last||state.complete){R.point(selected.line,'#bb592e','N*',false,5);R.line(selected.point,'#bb592e',1,2,[5,3]);}
  }
 }
 R.finish().setAttribute('aria-label',model().title+(state.dual?' dual configuration':' projective configuration with draggable inputs'));
 renderMap();renderTable();renderReading();
 $('fomin-readout').textContent=notice||`${model().title}: ${model().faces.length-1} known tiles force the last. Maximum numerical incidence residual ${data.error.toExponential(1)}.`;
}
function nodeMarkup(name,p,line){
 return `<circle class="map-node" cx="${p[0]}" cy="${p[1]}" r="4" fill="${line?'#fffef9':'#354a45'}" stroke="#354a45" stroke-width="1.2"/><text class="map-label" x="${p[0]+8}" y="${p[1]-7}">${esc(label(name))}</text>`;
}
function renderMap(){
 const m=model(),key=state.example+':'+state.face+':'+state.dual;
 if(key===mapKey)return;mapKey=key;
 const focused=$('fomin-tiling').querySelector(':focus')?.dataset.face;
 let shapes=[],edges='',nodes='',extra='';
 const make=(i,ps,textAt=null,outer=false)=>{
  const path=ps.map(p=>p.join(',')).join(' '),center=textAt||ps.reduce((a,p)=>[a[0]+p[0]/ps.length,a[1]+p[1]/ps.length],[0,0]);
  const poly=outer?`<path d="M8,8H432V284H8Z M${ps.map(p=>p.join(',')).join('L')}Z" fill-rule="evenodd"`: `<polygon points="${path}"`;
  shapes.push(`<g data-face="${i}" class="${i===state.face?'selected':''}" role="button" tabindex="0" aria-label="Tile ${i+1}: ${m.faces[i].role}"><title>Tile ${i+1}: ${esc(m.faces[i].reason)}</title>${poly} class="tile-polygon ${i===m.last?'tile-conclusion':''}"/><text class="face-number" x="${center[0]}" y="${center[1]}" text-anchor="middle">${i+1}${outer?' · outside':''}</text></g>`);
 };
 if(state.example==='pappus'){
  const s=70,c=[220,146],t=([x,y])=>[c[0]+s*x,c[1]+s*y],r=Math.sqrt(3)/2;
  const ps=[[-.5,-r],[.5,-r],[1,0],[.5,r],[-.5,r],[-1,0]].map(t),ws=[[0,-2*r],[1.5,-r],[1.5,r],[0,2*r],[-1.5,r],[-1.5,-r]].map(t);
  for(let j=0;j<6;j++){
   make(j,[ps[j],ws[j],ps[(j+1)%6],c]);
   const previous=ws[(j+5)%6],next=ws[j];
   make(6+j%3,[previous,ps[j],next]);
   for(const v of [previous,next,c])edges+=`<line class="map-edge" x1="${ps[j][0]}" y1="${ps[j][1]}" x2="${v[0]}" y2="${v[1]}"/>`;
   extra+=`<line class="map-seam" x1="${previous[0]}" y1="${previous[1]}" x2="${next[0]}" y2="${next[1]}"/>`;
   const mx=(previous[0]+next[0])/2,my=(previous[1]+next[1])/2;
   extra+=`<text class="face-number" x="${mx+(mx-c[0])*.17}" y="${my+(my-c[1])*.12}" text-anchor="middle">${['I','II','III'][j%3]}</text>`;
   nodes+=nodeMarkup('P'+(j+1),ps[j],state.dual)+nodeMarkup(j%2?'a':'b',ws[j],!state.dual);
  }nodes+=nodeMarkup('c',c,!state.dual);
  $('fomin-map-caption').textContent='Figure 9 redrawn. Match opposite cuts I, II, III. Repeated a and b labels are identified. Tiles 7–9 each cross a cut; both pieces count as ONE quadrilateral. Dashed cuts are not a–b edges.';
 }else{
  const coords=Object.fromEntries(Object.entries(m.nodes).map(([k,[x,y]])=>[k,[220+100*x,146+100*y]]));
  m.faces.forEach((f,i)=>make(i,f.cycle.map(k=>coords[k]),i===m.outer?[375,148]:null,i===m.outer));
  for(const es of m.topology.edges){const {a,b}=es[0],p=coords[a],q=coords[b];edges+=`<line class="map-edge" x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}"/>`;}
  for(const [k,p] of Object.entries(coords))nodes+=nodeMarkup(k,p,state.dual?!!data.points[k]:!!data.lines[k]);
  $('fomin-map-caption').textContent=`${m.reference.split(' · ')[1]} redrawn. The outside region is tile ${m.outer+1}. Together these tiles form a sphere; this is a proof diagram, not the projective plane above.`;
 }
 $('fomin-tiling').innerHTML=shapes.join('')+extra+edges+nodes;
 if(focused!==undefined)$('fomin-tiling').querySelector(`[data-face="${focused}"]`)?.focus({preventScroll:true});
 $('fomin-tiling').setAttribute('aria-label',`${m.title}: ${m.topology.F}-tile ${m.surface.toLowerCase()}, ${m.topology.V} vertices and ${m.topology.E} edges`);
 $('fomin-topology-title').textContent=`Proof surface — ${m.surface.toLowerCase()} · ${m.topology.F} tiles`;
}
function renderTable(){
 const key=state.weights?'weights':state.example;
 if(key!==tableKey){tableKey=key;
  $('face-ratios').innerHTML=state.weights?'':model().faces.map((f,i)=>`<button data-face="${i}" class="${f.role==='conclusion'?'last':''}" title="${esc(f.reason)}">${i+1} · ${f.role==='conclusion'?'last':f.role==='hypothesis'?'given':'built'}<strong></strong></button>`).join('');
 }
 if(!state.weights)for(const b of $('face-ratios').querySelectorAll('button')){
  const i=+b.dataset.face;b.setAttribute('aria-pressed',String(i===state.face));b.querySelector('strong').textContent=i===model().last&&!state.complete?'?':data.ratios[i].toFixed(5);
 }
}
let mathQueued=false;
function typesetReading(){
 if(mathQueued)return;mathQueued=true;
 const run=()=>{mathQueued=false;if(window.MathJax?.typesetPromise)MathJax.typesetPromise([$('tile-formula')]).catch(()=>{});};
 if(document.documentElement.dataset.mathReady==='true')run();else document.addEventListener('math-typeset',run,{once:true});
}
function renderReading(){
 const f=model().faces[state.face],[p,l,q,m]=f.cycle,key=state.example+state.face+state.dual;
 if(key!==formulaKey){formulaKey=key;
  if(window.MathJax?.typesetClear)MathJax.typesetClear([$('tile-formula')]);
  const t=F.tex;
  $('tile-formula').textContent=state.dual?
   `\\((${t(p)}\\cap ${t(q)})\\in\\overline{${t(l)}${t(m)}}\\)`:
   `\\(${t(l)}\\cap ${t(m)}\\in\\overline{${t(p)}${t(q)}}\\)`;
  $('tile-reason').textContent=(state.dual?'Dual of: ':'')+f.reason;typesetReading();
 }
 $('tile-ratio').textContent=state.face===model().last&&!state.complete?'The last relation is hidden. The surface theorem forces its ratio to be 1.':`Tile ${state.face+1}: mixed cross-ratio ${data.ratios[state.face].toFixed(10)}. The values are evaluated from the labels, not assigned to be one.`;
}
function weights(){
 data=E.surface(state.w);const b=$('fomin-drawing').getBoundingClientRect();view={w:b.width,h:b.height,s:Math.min(b.width,b.height)/3.1,x:b.width/2,y:b.height*.52};R.begin(view);
 const pos=Array.from({length:8},(_,i)=>[-1.12+(i&1)*1.55+((i>>2)&1)*.57,-.92+((i>>1)&1)*1.46+((i>>2)&1)*.48,1]);
 E.EDGES.forEach(([a,b],i)=>{R.path([pos[a],pos[b]],i===state.edge?'#bb592e':'#789892',1,i===state.edge?3:1.7);const m=pos[a].map((x,j)=>(x+pos[b][j])/2);R.point(m,'#526b65',String(state.w[i]),true,2,`edge:${i}`);});
 pos.forEach((p,i)=>R.point(p,E.parity(i)?'#315f9c':'#148176',E.LABELS[i],false,4));R.finish();
 tableKey='weights';$('face-ratios').innerHTML=data.ratios.map((v,i)=>`<span class="${v.n!==v.d?'noncoherent':''}">Face ${i+1}<strong>${E.ratioString(v)}</strong></span>`).join('');
 const count=data.ratios.filter(r=>r.n!==r.d).length;
 $('fomin-readout').textContent=`${count?count+' face ratios differ from one.':'All six faces are coherent.'} The product is exactly ${E.ratioString(data.product)}. These are arbitrary edge weights, not assumed point–line pairings.`;
}
function render(){
 $('weight-view').checked=state.weights;
 for(const id of ['geometric-controls','proof-map','tile-reading'])$(id).hidden=state.weights;
 $('weight-controls').hidden=!state.weights;$('weight-edge').value=state.edge;
 $('fomin-example').disabled=state.weights;$('fomin-dual').disabled=state.weights;$('fomin-dual').checked=state.dual;
 $('desargues-controls').hidden=state.example!=='desargues';$('quadrangle-controls').hidden=state.example!=='quadrangle';
 $('fomin-example').value=state.example==='quadrangle'&&params().release>0?'generalization':state.example;
 $('perspective').value=state.ts[0];$('quad-position').value=state.params.quadrangle.t;$('quad-release').value=state.params.quadrangle.release;$('quad-release-value').value=state.params.quadrangle.release.toFixed(2);
 $('fomin-complete').checked=state.complete;$('fomin-inspect').checked=state.inspect;
 $('fomin-title').textContent=state.weights?'Exact cancellation':state.example==='quadrangle'&&params().release>0?'Generalized quadrangle':model().title;
 $('fomin-reference').textContent=state.weights?'Theorem 2.6 · cancellation':state.example==='quadrangle'&&params().release>0?'Theorem 3.4 · Figure 15':model().reference;
 $('fomin-geometry-caption').textContent=state.weights?'Scalar model — no geometric labels':state.dual?'Dual projective plane — points ↔ lines':'Projective plane — geometry';
 $('fomin-hint').textContent=state.dual?'Return to the primal view to move the input points. Tile selection works in both views.':state.example==='pappus'?'Drag A, B, P₁, P₃ or P₅. The other points preserve the two given concurrences.':state.example==='quadrangle'?'Drag an Aᵢ or B₁. Drag B₂ along its prescribed line. The final incidence is reconstructed.':'Drag O or a triangle vertex. Corresponding vertices remain joined through O.';
 $('fomin-readout').classList.remove('error');
 try{if(state.weights)weights();else geometry();}catch(e){$('fomin-readout').textContent=e.message;$('fomin-readout').classList.add('error');}
}
function edit(change){
 const old=structuredClone(params());change(params());
 try{F.build(state.example,params());notice='';}catch(e){state.params[state.example]=old;notice=e.message+' The last admissible configuration is retained.';}
 schedule();
}
function selectFace(i){manual();state.face=i;state.inspect=true;schedule();}
$('fomin-example').onchange=e=>setExample(e.target.value);
$('fomin-reset').onclick=()=>{manual();state.params[state.example]=F.defaults()[state.example];notice='';cameras={};schedule();};
$('fomin-fit').onclick=()=>{cameras={};schedule();};
$('fomin-dual').onchange=e=>{manual();state.dual=e.target.checked;formulaKey='';mapKey='';schedule();};
$('weight-view').onchange=e=>{manual();state.weights=e.target.checked;schedule();};
$('perspective').oninput=e=>{manual();edit(p=>p.ts[0]=+e.target.value);};
$('quad-position').oninput=e=>{manual();edit(p=>p.t=+e.target.value);};
$('quad-release').oninput=e=>{manual();edit(p=>p.release=+e.target.value);};
$('fomin-complete').onchange=e=>{manual();state.complete=e.target.checked;schedule();};
$('fomin-inspect').onchange=e=>{manual();state.inspect=e.target.checked;schedule();};
$('last-tile').onclick=()=>selectFace(model().last);
for(const id of ['fomin-tiling','face-ratios']){
 $(id).addEventListener('click',e=>{const t=e.target.closest('[data-face]');if(t)selectFace(+t.dataset.face);});
 $(id).addEventListener('keydown',e=>{const t=e.target.closest('[data-face]');if(t&&['Enter',' '].includes(e.key)&&t.tagName!=='BUTTON'){e.preventDefault();selectFace(+t.dataset.face);}});
}
$('weight-edge').onchange=e=>{manual();state.edge=+e.target.value;schedule();};
$('double-edge').onclick=()=>{manual();if(!Number.isSafeInteger(state.w[state.edge]*2)){$('fomin-readout').textContent='Reset the weights before doubling further.';return;}state.w[state.edge]*=2;schedule();};
$('reset-weights').onclick=()=>{manual();state.w=E.coherentWeights();schedule();};
$('fomin-follow').onchange=e=>{state.follow=e.target.checked;lastFollow='';if(state.follow)follow();};
for(const b of document.querySelectorAll('[data-example-go]'))b.onclick=()=>setExample(b.dataset.exampleGo);
function follow(){
 if(!state.follow)return;let active=null;for(const s of document.querySelectorAll('[data-fomin]'))if(s.getBoundingClientRect().top<innerHeight*.4)active=s;
 if(!active||active.id===lastFollow)return;lastFollow=active.id;
 if(active.dataset.fomin==='weights')state.weights=true;
 else{setExample(active.dataset.fomin==='geometry'?'desargues':active.dataset.fomin,false);if(active.dataset.selectFace){state.face=+active.dataset.selectFace;state.inspect=true;}}
 schedule();
}
window.addEventListener('scroll',follow,{passive:true});document.addEventListener('math-typeset',()=>{lastFollow='';follow();});window.addEventListener('hashchange',()=>{state.follow=true;$('fomin-follow').checked=true;lastFollow='';follow();});
function moveHandle(key,xy){
 if(state.weights||state.dual)return;
 const h=data.handles.find(h=>h.key===key);if(!h)return;
 edit(p=>{
  if(h.type==='free')p[h.path]=[...xy,1];else if(h.type==='base')p.base[h.i]=[...xy,1];else if(h.type==='seed')p.seeds[h.i]=[...xy,1];
  else if(h.type==='radial'){const a=p.O,b=p.base[h.i],v=[b[0]-a[0],b[1]-a[1]],t=((xy[0]-a[0])*v[0]+(xy[1]-a[1])*v[1])/(v[0]**2+v[1]**2);p.ts[h.i]=Math.max(.08,Math.min(.94,t));}
  else if(h.type==='b2'){const a=p.B1,b=F.affine(data.points.P12),v=[b[0]-a[0],b[1]-a[1]];p.t=Math.max(.05,Math.min(.8,((xy[0]-a[0])*v[0]+(xy[1]-a[1])*v[1])/(v[0]**2+v[1]**2)));}
 });
}
$('fomin-drawing').addEventListener('pointerdown',e=>{
 const h=e.target.closest('[data-handle]');if(!h)return;manual();const k=h.dataset.handle;
 if(k.startsWith('edge:')){state.edge=+k.slice(5);schedule();return;}
 drag=k==='center'?'O':k.slice(6);$('fomin-drawing').setPointerCapture(e.pointerId);
});
$('fomin-drawing').addEventListener('pointermove',e=>{if(!drag)return;const b=$('fomin-drawing').getBoundingClientRect();moveHandle(drag,[(e.clientX-b.left-view.x)/view.s,-(e.clientY-b.top-view.y)/view.s]);});
for(const e of ['pointerup','pointercancel','lostpointercapture'])$('fomin-drawing').addEventListener(e,()=>drag=null);
host.addEventListener('keydown',e=>{
 const h=e.target.closest('[data-handle]');if(!h)return;const k=h.dataset.handle;
 if(k.startsWith('edge:')&&['Enter',' '].includes(e.key)){e.preventDefault();manual();state.edge=+k.slice(5);schedule();return;}
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||state.weights)return;
 e.preventDefault();manual();const key=k==='center'?'O':k.slice(6),xy=F.affine(data.points[key]);if(!xy)return;
 xy[e.key==='ArrowLeft'||e.key==='ArrowRight'?0:1]+=(e.key==='ArrowRight'||e.key==='ArrowUp'?1:-1)*.035;moveHandle(key,xy);
});
new ResizeObserver(schedule).observe($('fomin-drawing'));window.fominStory={state,render,setExample,selectFace,getData:()=>data};render();
})();
