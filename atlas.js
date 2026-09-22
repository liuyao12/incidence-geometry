/* Standalone atlas. Same-origin live chapter laboratories are reused, not screenshots.
 * No postMessage listener, arbitrary navigation, or external runtime dependency.
 */
(()=>{'use strict';
const A=IncidenceAtlas,$=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const byId=new Map(A.nodes.map(n=>[n.id,n])),frames=new Map(),enabled=new Set(Object.keys(A.types));
let selected='pappus',chosenEdge=null,zoom=1,serial=0,mathQueue=Promise.resolve();
const graph=$('atlas-graph'),viewport=$('graph-viewport');
const svg=(tag,attrs={},text)=>{const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;};
const textName=n=>n.title.replaceAll('\n',' ');
const label=s=>s.replaceAll('\n',' ');
function path(e){
 const a=byId.get(e.from),b=byId.get(e.to),dx=b.x-a.x,dy=b.y-a.y;
 const inset=96,offset=(A.edges.indexOf(e)%7-3)*2.1;
 let ps;
 if(Math.abs(dy)<5&&Math.abs(dx)<250){const d=Math.sign(dx);ps=[[a.x+inset*d,a.y],[b.x-inset*d,b.y]];}
 else if(Math.abs(dx)<5&&!A.nodes.some(n=>n.x===a.x&&n.y>Math.min(a.y,b.y)&&n.y<Math.max(a.y,b.y))){const d=Math.sign(dy);ps=[[a.x,a.y+35*d],[b.x,b.y-35*d]];}
 else if(Math.abs(dy)<5){const y=a.y+54+offset;ps=[[a.x,a.y+35],[a.x,y],[b.x,y],[b.x,b.y+35]];}
 else if(Math.abs(dx)<5){const d=a.x>500?-1:1,g=a.x+115*d+offset;ps=[[a.x+96*d,a.y],[g,a.y],[g,b.y],[b.x+96*d,b.y]];}
 else if(Math.abs(dx)<250){const d=Math.sign(dx),g=(a.x+b.x)/2+offset;ps=[[a.x+96*d,a.y],[g,a.y],[g,b.y],[b.x-96*d,b.y]];}
 else{const d=Math.sign(dx),g=a.x+115*d+offset,h=b.x-115*d+offset,ys=[85,195,305,415,525,690,805,915,1025,1180],k=ys.indexOf(b.y),q=dy>0?(ys[k-1]+b.y)/2:(ys[k+1]+b.y)/2;ps=[[a.x+96*d,a.y],[g,a.y],[g,q+offset],[h,q+offset],[h,b.y],[b.x-96*d,b.y]];}
 let out=`M${ps[0][0]} ${ps[0][1]}`;
 for(let i=1;i<ps.length-1;i++){const [x,y]=ps[i],prev=ps[i-1],next=ps[i+1],r=Math.min(7,Math.hypot(x-prev[0],y-prev[1])/2,Math.hypot(x-next[0],y-next[1])/2),l=Math.hypot(x-prev[0],y-prev[1]),t=Math.hypot(x-next[0],y-next[1]);if(!l||!t)continue;out+=` L${x+(prev[0]-x)*r/l} ${y+(prev[1]-y)*r/l} Q${x} ${y} ${x+(next[0]-x)*r/t} ${y+(next[1]-y)*r/t}`;}
 return out+` L${ps.at(-1)[0]} ${ps.at(-1)[1]}`;
}
function makeGraph(){
 const defs=svg('defs');for(const [id,color]of [['implication','#55796a'],['limit','#b87943']]){const m=svg('marker',{id:'arrow-'+id,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'});m.append(svg('path',{d:'M0 0 L10 5 L0 10 z',fill:color}));defs.append(m);}graph.append(defs);
 for(const [y,t]of [[27,'Conics · classical incidence · spatial proofs'],[635,'Surface principles · applications · contact geometry'],[1127,'Triangle criteria · a sharpness example']]){
 graph.append(svg('text',{x:15,y,class:'cluster-title'},t),svg('line',{x1:15,y1:y+10,x2:665,y2:y+10,class:'cluster-rule'}));
 }
 const edgeLayer=svg('g',{'aria-label':'Relationships'});
 for(const e of A.edges){const g=svg('g',{class:'atlas-edge '+e.type,'data-edge':e.id,tabindex:0,role:'button','aria-label':`${textName(byId.get(e.from))} ${e.type==='implication'||e.type==='limit'?'to':'and'} ${textName(byId.get(e.to))}: ${e.label}`});
  g.append(svg('title',{},`${e.label}: ${e.note}`),svg('path',{d:path(e),class:'edge-hit'}),svg('path',{d:path(e),class:'edge-line',...(['implication','limit'].includes(e.type)?{'marker-end':'url(#arrow-'+e.type+')'}:{})}));
  g.addEventListener('click',()=>selectEdge(e));g.addEventListener('keydown',ev=>{if(['Enter',' '].includes(ev.key)){ev.preventDefault();selectEdge(e);}});edgeLayer.append(g);
 }graph.append(edgeLayer);
 for(const n of A.nodes){const g=svg('g',{class:'atlas-node '+n.kind,'data-node':n.id,transform:`translate(${n.x},${n.y})`,tabindex:0,role:'button','aria-label':`${textName(n)} — ${n.kind}`,'aria-pressed':'false'});
  g.append(svg('title',{},textName(n)),svg('rect',{x:-96,y:-35,width:192,height:70}));
  const lines=n.title.split('\n');lines.forEach((line,i)=>g.append(svg('text',{y:(lines.length===1?1:-6)+i*18},line)));
  g.append(svg('text',{y:26,class:'node-kind'},n.kind==='theorem'?(n.group==='surfaces'?'conic surfaces':n.group==='fomin'?'incidence on surfaces':'incidence & conics'):n.kind));
  g.addEventListener('click',()=>select(n.id));g.addEventListener('keydown',ev=>{
   if(['Enter',' '].includes(ev.key)){ev.preventDefault();select(n.id);return;}
   const dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]},d=dirs[ev.key];if(!d)return;ev.preventDefault();
   const choices=A.nodes.filter(m=>(m.x-n.x)*d[0]+(m.y-n.y)*d[1]>1).sort((a,b)=>{const score=m=>Math.abs((m.x-n.x)*d[1]-(m.y-n.y)*d[0])*3+Math.hypot(m.x-n.x,m.y-n.y);return score(a)-score(b);});
   if(choices[0]){const target=graph.querySelector(`[data-node="${choices[0].id}"]`);target.focus({preventScroll:true});target.scrollIntoView({block:'nearest',inline:'nearest'});}
  });graph.append(g);
 }
 for(const [type,name]of Object.entries(A.types)){const b=document.createElement('button');b.className=type;b.type='button';b.setAttribute('aria-pressed','true');b.append(document.createElement('i'),document.createTextNode(name));b.addEventListener('click',()=>{enabled.has(type)?enabled.delete(type):enabled.add(type);b.setAttribute('aria-pressed',String(enabled.has(type)));highlight();});$('atlas-legend').append(b);}
 $('atlas-count').textContent=`${A.nodes.length} results · ${A.edges.length} connections`;
 A.nodes.forEach(n=>{const op=document.createElement('option');op.value=textName(n);$('atlas-options').append(op);});
}
function highlight(){
 const adjacent=new Set([selected]);for(const e of A.edges)if(enabled.has(e.type)&&(e.from===selected||e.to===selected)){adjacent.add(e.from);adjacent.add(e.to);}
 graph.querySelectorAll('[data-node]').forEach(g=>{g.classList.toggle('selected',g.dataset.node===selected);g.classList.toggle('neighbor',adjacent.has(g.dataset.node));g.setAttribute('aria-pressed',String(g.dataset.node===selected));});
 graph.querySelectorAll('[data-edge]').forEach(g=>{const e=A.edges.find(e=>e.id===g.dataset.edge);g.classList.toggle('connected',e.from===selected||e.to===selected);g.classList.toggle('chosen',chosenEdge===e.id);g.classList.toggle('off',!enabled.has(e.type));});
}
function relationNote(node){
 const box=$('relation-reading');box.replaceChildren();const p=document.createElement('strong');p.textContent=textName(node);box.append(p,document.createTextNode(' — '));
 const es=A.edges.filter(e=>e.from===node.id||e.to===node.id);
 if(!es.length){box.append(document.createTextNode('A result in the library; no unverified implication is invented to connect it.'));return;}
 es.forEach((e,i)=>{if(i)box.append(document.createTextNode(' · '));const b=document.createElement('button');b.textContent=e.label;b.addEventListener('click',()=>selectEdge(e));box.append(b);});
}
function selectEdge(e){
 chosenEdge=e.id;highlight();const box=$('relation-reading');box.replaceChildren();
 const h=document.createElement('strong');h.textContent=`${textName(byId.get(e.from))} ${['implication','limit'].includes(e.type)?'→':'—'} ${textName(byId.get(e.to))}: ${e.label}. `;box.append(h,document.createTextNode(e.note));
 const p=document.createElement('small');p.textContent=e.checked?'This deduction or identity is checked in the Lean library. ':'Literature or explanatory connection; not a claim of a checked Lean reduction. ';
 const a=document.createElement('a');a.href=e.source;a.target='_blank';a.rel='noopener';a.textContent='Source ↗';p.append(a);box.append(p);
}
function typeset(el){
 mathQueue=mathQueue.catch(()=>{}).then(async()=>{if(window.MathJax?.startup?.promise)await MathJax.startup.promise;if(window.MathJax?.typesetPromise)await MathJax.typesetPromise([el]);});
}
function views(n){
 const v=[{title:n.demo.page==='atlas-extras.html'?'Interactive construction':'Chapter laboratory',spec:n.demo,note:n.id==='eight-quadric'?'Illustration of a normalized ring-contact pair and its slices, not the full eight-quadric completion.':n.id==='point-line-cube'?'A planar Desargues instance of the point–hyperplane completion rule.':n.id==='fomin'?'The planar Desargues instance of the arbitrary-dimensional surface theorem.':''}];
 if(n.id==='pappus')v.push({title:'Fomin’s torus proof · dual form',spec:{page:'fomin.html',example:'pappus',dual:false},note:'The paper’s dual concurrency formulation; selecting a tile shows its corresponding incidence.'});
 if(n.id==='fomin')v.push({title:'Pappus · nine-face torus',spec:{page:'fomin.html',example:'pappus'},note:'A second planar instance of the same arbitrary-dimensional theorem.'},{title:'Generalized quadrangle · sphere',spec:{page:'fomin.html',example:'generalization'},note:'Theorem 3.4: fewer collinearity assumptions, the same proof surface.'});
 if(n.id==='conic-surface')v.push({title:'Penrose cube · compatibility',spec:{page:'connections.html',example:'cube'},note:'All eight conics are supplied; five face conditions imply the sixth.'},{title:'Odd-cycle torus',spec:{page:'connections.html',example:'odd'},note:'No alternating vertex coloring is possible.'});
 return v;
}
const embedCSS=`html,body{margin:0!important;background:#fffef9!important;overflow-x:hidden!important}body{min-height:0!important}.site-nav,.site-footer,.prose,.extra-top,.column-jump,.lab-title,#journey-controls,.example-controls,.scene-diagnostics,#bookmark-scene,#share-status{display:none!important}.narrative,.reading-layout,.interactive-column{display:block!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important;border:0!important;position:static!important;height:auto!important;min-height:0!important}.laboratory{width:100%!important;max-width:none!important;min-width:0!important;max-height:none!important;height:auto!important;position:static!important;overflow:visible!important;border:0!important;border-radius:0!important;box-shadow:none!important;transform:none!important;resize:none!important}.drawing,#fomin-drawing,#surface-drawing{height:360px!important}.lab-options label:has(#follow-story),.lab-options label:has(#dual-view),.lab-options label:has(#fomin-follow),.lab-options label:has(#fomin-dual),.lab-options label:has(#weight-view),#surface-example{display:none!important}.cube-scene{min-height:160px!important}.proof-map-layout{grid-template-columns:minmax(0,1fr)!important}.net-layout{padding-inline:12px!important}#net-topology{height:270px!important}.surface-toolbar{justify-content:end!important}@media(max-width:450px){.drawing,#fomin-drawing,#surface-drawing{height:315px!important}}`;
function pause(frame){try{const w=frame.contentWindow;if(w.incidenceStory){w.incidenceStory.pauseWalk(false);w.incidenceStory.state.playing=false;}if(w.conicSurface?.state.animate)w.document.getElementById('animate-net').click();}catch{}}
function loadFrame(page){
 if(frames.has(page))return frames.get(page);
 const f=document.createElement('iframe');f.title='Interactive theorem construction';f.style.visibility='hidden';f.loading='eager';
 const promise=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('The laboratory did not finish loading. Open the chapter directly to retry.')),20000);
  f.addEventListener('load',()=>{try{clearTimeout(timer);const style=f.contentDocument.createElement('style');style.textContent=embedCSS;f.contentDocument.head.append(style);resolve(f);}catch(e){reject(e);}},{once:true});f.addEventListener('error',()=>{clearTimeout(timer);reject(Error('The interactive could not be loaded.'));},{once:true});});
 frames.set(page,{frame:f,promise});f.src=page+'?atlas=1';$('atlas-frames').append(f);return {frame:f,promise};
}
function configure(frame,spec){
 const w=frame.contentWindow,d=w.document,check=(id,v)=>{const el=d.getElementById(id);if(el)el.checked=v;};
 if(w.incidenceStory){const a=w.incidenceStory;a.state.follow=false;check('follow-story',false);a.state.dual=!!spec.dual;check('dual-view',a.state.dual);a.state.conclusion=true;check('show-conclusion',true);a.setPhase(spec.phase??0);a.state.selection=spec.selection||'all';if(spec.scene!=='journey')a.setScene(spec.scene);a.render();}
 else if(w.fominStory){const a=w.fominStory;a.state.follow=false;check('fomin-follow',false);a.state.dual=!!spec.dual;check('fomin-dual',a.state.dual);a.state.complete=true;check('fomin-complete',true);a.setExample(spec.example||'desargues');a.render();}
 else if(w.conicSurface){const a=w.conicSurface,el=d.getElementById('surface-example');el.value=spec.example||'torus';el.dispatchEvent(new w.Event('change'));a.state.patch=false;check('patch-mode',false);a.state.map=true;a.render();if(spec.face!==undefined)a.selectFace(spec.face);a.state.reveal=!!spec.reveal;a.render();if(spec.patch==='four'){d.getElementById('patch-controls').open=true;d.getElementById('patch-four').click();a.render();}}
 else if(w.atlasExtras)w.atlasExtras.select(spec.example);
 else throw Error('The laboratory API was not available.');
 frame.dataset.theorem=selected;
}
async function showDemo(v){
 const request=++serial;$('atlas-frames').setAttribute('aria-busy','true');$('frame-loading').hidden=false;$('frame-loading').textContent='Loading the interactive geometry…';$('illustration-note').textContent=v.note||'Drag the construction or use its controls. The geometry is recomputed, not replayed from an image.';
 for(const {frame}of frames.values()){pause(frame);frame.style.visibility='hidden';frame.setAttribute('aria-hidden','true');}
 try{const {promise}=loadFrame(v.spec.page),f=await promise;if(request!==serial)return;f.style.visibility='visible';f.removeAttribute('aria-hidden');configure(f,v.spec);f.title='Interactive illustration of '+textName(byId.get(selected));$('frame-loading').hidden=true;$('atlas-frames').setAttribute('aria-busy','false');}
 catch(err){if(request!==serial)return;$('frame-loading').textContent=err.message;$('atlas-frames').setAttribute('aria-busy','false');}
}
function select(id,push=true){
 if(!byId.has(id))return;selected=id;chosenEdge=null;const n=byId.get(id);highlight();relationNote(n);$('selected-kind').textContent=n.kind+' · '+(n.group==='fomin'?'Incidence on surfaces':n.group==='surfaces'?'Conic contact on surfaces':'Classical incidence & conics');$('selected-title').textContent=textName(n);
 if(window.MathJax?.typesetClear)MathJax.typesetClear([$('selected-statement')]);$('selected-statement').innerHTML='<p>'+n.statement+'</p>';typeset($('selected-statement'));$('selected-chapter').href=n.chapter;$('selected-source').href=n.source;$('selected-scope').textContent=n.scope;$('selected-proof-status').textContent=n.lean.length?'Existing audited Lean entry points (scope as described above):':'No dedicated Lean theorem is claimed for this node.';$('selected-lean').replaceChildren();
 n.lean.forEach(name=>{const li=document.createElement('li');li.textContent=name;$('selected-lean').append(li);});
 const vs=views(n),sel=$('atlas-view');sel.replaceChildren();vs.forEach((v,i)=>{const op=document.createElement('option');op.value=i;op.textContent=v.title;sel.append(op);});sel.onchange=()=>showDemo(vs[+sel.value]);showDemo(vs[0]);$('link-status').textContent='';
 if(push&&location.hash!=='#'+id)history.pushState({theorem:id},'', '#'+id);
 document.title=textName(n)+' · Theorem map';
}
$('atlas-search').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();graph.querySelectorAll('[data-node]').forEach(g=>{const n=byId.get(g.dataset.node),match=(textName(n)+' '+n.id+' '+n.group+' '+n.kind).toLowerCase().includes(q);g.classList.toggle('search-dim',!!q&&!match);g.classList.toggle('search-match',!!q&&match);});});
$('atlas-search').addEventListener('keydown',e=>{if(e.key!=='Enter')return;const q=e.target.value.trim().toLowerCase(),n=A.nodes.find(n=>textName(n).toLowerCase()===q)||A.nodes.find(n=>(textName(n)+' '+n.id).toLowerCase().includes(q));if(n){select(n.id);graph.querySelector(`[data-node="${n.id}"]`).scrollIntoView({block:'center',inline:'nearest'});}});
function setZoom(z){zoom=Math.min(2,Math.max(.4,z));graph.style.width=(100*zoom)+'%';}
$('atlas-in').onclick=()=>setZoom(zoom*1.2);$('atlas-out').onclick=()=>setZoom(zoom/1.2);$('atlas-reset').onclick=()=>setZoom(1);$('atlas-fit').onclick=()=>{setZoom(Math.min(1,(viewport.clientHeight-12)/(1250*viewport.clientWidth/680)));viewport.scrollTo(0,0);};
$('atlas-link').onclick=async()=>{const url=new URL(location.href);url.hash=selected;try{await navigator.clipboard.writeText(url.href);$('link-status').textContent='Link copied';}catch{$('link-status').textContent='The address bar links to this theorem.';}};
window.addEventListener('popstate',()=>select(location.hash.slice(1)||'pappus',false));window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(id!==selected&&byId.has(id))select(id,false);});
makeGraph();const initial=location.hash.slice(1);select(byId.has(initial)?initial:'pappus',false);
window.theoremAtlas={select,views,get selected(){return selected;},get frames(){return Object.fromEntries([...frames].map(([k,v])=>[k,v.frame]));},data:A};
})();
