/* Interactive exposition. Numerical drawings never constitute Lean evidence. */
(()=>{'use strict';
const E=window.IncidenceMath,G=window.IncidencePGA,$=id=>document.getElementById(id),C=['#657881','#237d79','#b27a30','#7b6798','#bd6556','#4386a3','#ab784c','#24723d'];
const state={mode:'penrose',params:E.defaults(),complete:false,selection:{kind:'all',id:0},chords:true,O:[0.08,-0.05,1],ts:[0.57,0.68,0.78],weights:E.coherentWeights(),t:0.45,angle:0.6,five:G.defaultFive(),theta:.42,envelope:false,playing:false,zoom:1,pan:[0,0]};
const canvas=$('geometry'),R=window.createGanjaView(canvas),svg=$('cube');let data=null,view={w:0,h:0,s:1,x:0,y:0},drag=null,panelDrag=null;
const fmt=(x,n=3)=>Number.isFinite(x)?(Math.abs(x)<1e-12?'0':x.toFixed(n)):'undefined';
const sci=x=>Number.isFinite(x)?x.toExponential(1):'degenerate';
const screen=p=>[view.x+p[0]*view.s,view.y-p[1]*view.s];
const world=(x,y)=>[(x-view.x)/view.s,(view.y-y)/view.s,1];
function userChange(){ $('follow').checked=false; }
function line(...args){R.line(...args);}
function path(...args){R.path(...args);}
function point(...args){R.point(...args);}
function drawConic(...args){R.conic(...args);}
function setupCanvas(){const rect=$('stage').getBoundingClientRect();view.w=rect.width;view.h=rect.height;view.s=rect.height/(state.mode==='fomin'?5.1:state.mode==='pascal'?2.9:4.05)*state.zoom;view.x=rect.width*(state.mode==='pascal'?.5:.45)+state.pan[0];view.y=rect.height*.53+state.pan[1];R.begin(view);line([1,0,0],'#cdd7d0',.65,.6);line([0,1,0],'#cdd7d0',.65,.6);}
function selectedEdges(){if(state.selection.kind==='edge')return [state.selection.id];if(state.selection.kind==='face')return E.faceEdges(E.FACES[state.selection.id]);return [];}
function drawPenrose(){const selected=selectedEdges(),vertices=new Set(selected.flatMap(i=>E.EDGES[i]));for(let i=0;i<8;i++){if(i===7&&!state.complete)continue;const bright=vertices.size===0||vertices.has(i);drawConic(data.Q[i],C[i],bright?(i===7?1:.8):.13,i===7?2.7:1.7);}
 if(state.chords){const es=selected.length?selected:[0,1,2];es.forEach(i=>{const c=data.contacts[i];if(c.t===7&&!state.complete)return;line(c.l,'#707b8b',.6,1,[5,4]);if(state.selection.kind==='edge')E.lineConic(data.Q[c.s],c.l).forEach(p=>{point(p,C[c.t],'',false,4);line(E.mul(data.Q[c.s],p),C[c.t],.32,.8,[2,5]);});});}
 if(state.selection.kind==='face'){const f=data.faces[state.selection.id];if(f.point&&(!E.FACES[state.selection.id].includes(7)||state.complete))point(f.point,'#a24f31','R',false,4);}
 if(state.envelope){const i=state.selection.kind==='edge'?data.contacts[state.selection.id].s:state.complete?7:0;R.envelope(data.Q[i],C[i]);}
 data.p.forEach((p,i)=>point([-p[2]*p[0]-.75*p[1],-p[2]*p[1]+.75*p[0],1],C[1<<i],`p${i+1}`,true,5,`seed:${i}`));
}
function drawFomin(){const L=data.labels,sel=state.selection.kind==='face'?E.FACES[state.selection.id]:null;
 [[3,5],[3,6],[5,6]].forEach(([a,b])=>path([L[a],L[b]],'#a3acaa',.6,1));
 data.vertices.forEach((p,i)=>{line(G.joinCoordinates(state.O,p),'#acb9b1',.65,1,[4,5]);point(p,'#a9b1a8','',true,2.5);});
 [1,2,4,7].forEach(i=>{if(i===7&&!state.complete)return;line(L[i],C[i],sel&&!sel.includes(i)?.18:.85,i===7?2.5:1.5);});
 [0,3,5,6].forEach(i=>point(L[i],C[i],i===0?'O':`P${E.LABELS[i]}`,i===0,4.5,i===0?'center:0':''));
 if(state.complete)data.meetings.forEach((p,i)=>point(p,C[7],`R${i+1}`,false,3.7));
 if(sel){const [a,l,b,m]=sel;line(G.joinCoordinates(L[a],L[b]),'#326b9b',.9,1.4,[5,3]);if(!sel.includes(7)||state.complete)point(G.meetCoordinates(L[l],L[m]),'#326b9b','meet',true,4);}
}
function drawBridge(){drawConic(data.Q0,C[0],.7,1.7);drawConic(data.Q,C[7],1,2.5);if(state.envelope)R.envelope(data.Q,C[7]);line(data.l,'#947452',.8,1.2,[5,4]);E.lineConic(data.Q0,data.l).forEach(p=>point(p,C[7],'',false,4));}
function drawPascal(){
 const witness=data,pts=state.five;
 R.curve(witness.samples,C[7],.95,2.1);
 if(state.envelope){const q=witness.coefficients;R.envelope([[q[0],q[3]/2,q[4]/2],[q[3]/2,q[1],q[5]/2],[q[4]/2,q[5]/2,q[2]]],C[7]);}
 if(witness.complete){
   const F=G.pointCoordinates(witness.sixth);
   [[pts[0],pts[3]],[pts[1],pts[2]],[pts[1],pts[4]],[pts[3],pts[4]],[pts[0],F],[pts[2],F]].forEach(([a,b])=>line(G.joinCoordinates(a,b),'#9aaab0',.65,1,[4,4]));
   line(G.lineCoordinates(witness.pascalLine),'#a5552f',.95,1.8);
   [witness.X,witness.Y,witness.Z].forEach((p,i)=>point(p,'#a5552f',['X','Y','Z'][i],false,3.8));
   point(witness.sixth,'#a5552f','F',false,5);
 }
 pts.forEach((p,i)=>point(p,C[0],['A','B','C','D','E'][i],true,5.5,`five:${i}`));
}
const V=[[36,139],[103,155],[13,86],[80,102],[113,79],[180,95],[90,26],[157,42]];
function renderCube(){svg.replaceChildren();if(state.mode==='bridge'||state.mode==='pascal')return;const ns='http://www.w3.org/2000/svg';const make=(tag,attrs,parent=svg)=>{const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));parent.append(n);return n;};const sel=selectedEdges();
 E.EDGES.forEach(([a,b],i)=>{const missing=state.mode!=='surface'&&!state.complete&&b===7,active=sel.includes(i);const g=make('g',{class:'cube-edge',role:'button',tabindex:'0','aria-label':`Inspect edge ${E.LABELS[a]} to ${E.LABELS[b]}`});make('line',{x1:V[a][0],y1:V[a][1],x2:V[b][0],y2:V[b][1],stroke:'transparent','stroke-width':13},g);make('line',{x1:V[a][0],y1:V[a][1],x2:V[b][0],y2:V[b][1],stroke:active?'#196d69':'#99aaa4','stroke-width':active?2.9:1.15,'stroke-dasharray':missing?'4 4':''},g);const select=()=>{userChange();state.selection={kind:'edge',id:i};$('inspect').value=`edge:${i}`;render();};g.addEventListener('click',select);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}});if(state.mode==='surface'&&active){const text=make('text',{x:(V[a][0]+V[b][0])/2+5,y:(V[a][1]+V[b][1])/2-5,fill:'#196d69'});text.textContent=state.weights[i];}});
 V.forEach(([x,y],i)=>{const missing=i===7&&!state.complete&&state.mode!=='surface',n=make('g',{role:'button',tabindex:'0','aria-label':missing?'Reveal eighth vertex':`Inspect vertex ${E.LABELS[i]}`});make('circle',{cx:x,cy:y,r:i===7?6:4.7,class:'node',fill:missing?'#fafbf8':(state.mode==='fomin'||state.mode==='surface')?(E.parity(i)?'#f9fbf7':'#405c65'):C[i],stroke:i===7?'#24723d':'#405c65','stroke-width':1.3},n);const text=make('text',{x:x+(x<80?-15:8),y:y-5,fill:'#485d60'});text.textContent=missing?'?':E.LABELS[i];const activate=()=>{userChange();if(i===7){state.complete=!state.complete;render();}else{const e=E.EDGES.findIndex(edge=>edge.includes(i));state.selection={kind:'edge',id:e};$('inspect').value=`edge:${e}`;render();}};n.addEventListener('click',activate);n.addEventListener('keydown',e=>{if(e.key==='Enter'){activate();}});});
}
function controls(){const mode=state.mode,sliders=mode==='penrose'?[['a12',-.9,.9,.01,state.params.couplings[0]],['a13',-.9,.9,.01,state.params.couplings[1]],['a23',-.9,.9,.01,state.params.couplings[2]]]:mode==='fomin'?[['t12',.2,.93,.01,state.ts[0]],['t13',.2,.93,.01,state.ts[1]],['t23',.2,.93,.01,state.ts[2]]]:mode==='pascal'?[['ray θ',.005,3.137,.005,state.theta]]:mode==='bridge'?[['pencil t',-.6,1.2,.01,state.t],['angle',0,3.14,.01,state.angle]]:[];
 $('controls').innerHTML=sliders.map(([name,min,max,step,value],i)=>`<label class="control">${name}<span id="value-${i}">${fmt(value,2)}</span><input aria-label="${name}" data-slider="${i}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`).join('');
 if(mode==='surface')$('controls').innerHTML='<div class="surface-controls"><button id="coherent">All ratios = 1</button><button id="perturb">Double selected edge</button><button id="random-weights">Other edge values</button></div>';
 $('controls').querySelectorAll('[data-slider]').forEach(input=>input.addEventListener('input',()=>{userChange();const i=+input.dataset.slider,v=+input.value;if(mode==='penrose')state.params.couplings[i]=v;if(mode==='fomin')state.ts[i]=v;if(mode==='bridge')i===0?state.t=v:state.angle=v;if(mode==='pascal')state.theta=v;$(`value-${i}`).textContent=fmt(v,2);render();}));
 if(mode==='surface'){$('coherent').onclick=()=>{userChange();state.weights=E.coherentWeights();render();};$('perturb').onclick=()=>{userChange();const i=state.selection.kind==='edge'?state.selection.id:0;state.selection={kind:'edge',id:i};$('inspect').value=`edge:${i}`;state.weights[i]=state.weights[i]<1e9?state.weights[i]*2:1;render();};$('random-weights').onclick=()=>{userChange();state.weights=state.weights.map((_,i)=>2+(i*7+Math.floor(Math.random()*7))%17);render();};}
}
function populateInspect(){const s=$('inspect');s.innerHTML='<option value="all:0">Overview</option>'+E.EDGES.map(([a,b],i)=>`<option value="edge:${i}">Edge ${E.LABELS[a]}—${E.LABELS[b]}</option>`).join('')+E.FACES.map((f,i)=>`<option value="face:${i}">Face ${f.map(v=>E.LABELS[v]).join(' · ')}</option>`).join('');s.value=`${state.selection.kind}:${state.selection.id}`;}
function facesReadout(){const box=$('face-readout');box.classList.toggle('coefficients',state.mode==='bridge');box.innerHTML='';if(state.mode==='pascal'){box.innerHTML='<p class=pascal-order>Hexagon order: A · D · E · B · C · F<br>AD ∩ BC = X; AF ∩ BE = Y; DE ∩ CF = Z.</p>';return;}if(state.mode==='bridge'){['x²','y²','z²','xy','xz','yz'].forEach((name,i)=>{const d=document.createElement('div');d.className='coeff-cell';d.textContent=`${name}: ${fmt(data.base[i],2)} − t·${fmt(data.veronese[i],3)}`;box.append(d);});return;}
 E.FACES.forEach((f,i)=>{const b=document.createElement('button');b.className='face-chip'+(state.selection.kind==='face'&&state.selection.id===i?' active':'');let text=`${f.map(v=>E.LABELS[v]).join('·')}`;if(state.mode==='surface'){const r=data.ratios[i];text+=` : ${E.ratioString(r)}`;if(r.n!==r.d)b.classList.add('changed');}else if(f.includes(7)&&!state.complete)text+=' : incomplete';else if(state.mode==='fomin')text+=` : r = ${fmt(data.ratios[i],3)}`;else text+=data.faces[i].error===null?' : degenerate':data.faces[i].error<1e-8?' : concurrent':' : unstable';b.textContent=text;b.title='Inspect this face';b.onclick=()=>{userChange();state.selection={kind:'face',id:i};$('inspect').value=`face:${i}`;render();};box.append(b);});
}
function render(){try{
 const m=state.mode;$('stage').className=`stage ${m}`;$('complete').hidden=m==='surface'||m==='bridge'||m==='pascal';$('complete').textContent=state.complete?'Hide completion':'Complete cube';$('complete').setAttribute('aria-pressed',String(state.complete));$('chord-toggle').hidden=m!=='penrose';$('overview').hidden=m==='bridge'||m==='pascal';$('inspect').parentElement.hidden=m==='bridge'||m==='pascal';$('envelope-toggle').hidden=m==='surface'||m==='fomin';$('play').hidden=m!=='pascal';$('play').textContent=state.playing?'Pause trace':'Trace F';
 data=m==='penrose'?E.penrose(state.params):m==='fomin'?G.fomin(state.O,state.ts):m==='pascal'?G.pascal(state.five,state.theta):m==='surface'?E.surface(state.weights):E.bridge(state.t,state.angle);
 if(m!=='surface'){setupCanvas();if(m==='penrose')drawPenrose();if(m==='fomin')drawFomin();if(m==='bridge')drawBridge();if(m==='pascal')drawPascal();R.finish();}renderCube();facesReadout();
 $('mode-caption').textContent={pascal:'Five points, a conic, and Pascal',penrose:'Seven conics → eight',fomin:'Seven point/line labels → eight',surface:'Every edge: once with each sign',bridge:'A conic pencil in six coordinates'}[m];
 $('stage-label').textContent={pascal:'Drag A–E · orange F is constructed by joins and meets',penrose:'Affine chart z = 1 · hollow handles move seed chords',fomin:'Filled points / lines · drag O',surface:'A closed, oriented cube surface',bridge:'Gray: q₀ · green: q₀ − tℓ² · dashed: ℓ = 0'}[m];
 $('arithmetic-label').textContent=m==='surface'?'Exact integer-fraction arithmetic':'Floating-point illustration, not proof';
 $('lemma-link').href='formal/IncidenceCubes/'+({pascal:'Fomin/Coherence',penrose:'Penrose/Algebra',fomin:'Fomin/Coherence',surface:'Fomin/Surface',bridge:'Connection/Veronese'}[m])+'.lean';
 $('lemma-link').hidden=m==='pascal';$('construction-link').hidden=m!=='pascal';let read='',hint='';
 if(m==='penrose'){const edges=state.complete?data.contacts:data.contacts.filter(c=>c.t!==7),fs=state.complete?data.faces:data.faces.filter((_,i)=>!E.FACES[i].includes(7));read=`<strong>${edges.length} edge identities</strong> · max residual ${sci(Math.max(...edges.map(c=>c.error)))}<br>${fs.length} face-pencil checks · max residual ${sci(Math.max(...fs.map(f=>f.error??Infinity)))}`;if(state.selection.kind==='edge'){const c=data.contacts[state.selection.id];read+=`<br>Selected edge: ${E.lineConic(data.Q[c.s],c.l).length} real contact points in this chart.`;}if(state.selection.kind==='face'&&!E.affine(data.faces[state.selection.id].point||[0,0,0]))read+='<br><span class="warn">Concurrence is at infinity or degenerate.</span>';if(data.minConic<1e-6)read+='<br><span class="warn">A conic is singular or nearly singular.</span>';if(!data.seedIndependent)read+='<br><span class="warn">Seed chords are dependent: uniqueness needs separate hypotheses.</span>';hint=`min |parameter minor| = ${fmt(data.minMinor)}; min |conic determinant| = ${fmt(data.minConic)}. Click a cube edge, or select a face. Shift-wheel zooms; drag empty space to pan.`;}
 if(m==='fomin'){const rs=data.ratios.filter((_,i)=>state.complete||!E.FACES[i].includes(7));read=`<strong>${rs.length} coherent faces</strong> · max |r − 1| = ${sci(Math.max(...rs.map(r=>Math.abs(r-1))))}<br>Smallest normalized edge pairing: ${fmt(data.minPairing,4)}`;if(data.minPairing<1e-6)read+='<br><span class="warn">Near incidence: the nonzero-pairing hypothesis is unstable.</span>';hint='The final line joins two constructed side-intersection points. The third lies on it by Desargues. The sliders preserve the three seed-face conditions.';}
 if(m==='surface'){const changed=data.ratios.filter(r=>r.n!==r.d).length;read=`<strong>Product of all six face ratios = ${E.ratioString(data.product)}</strong>, exactly.<br>${changed===0?'All six faces are coherent.':`${changed} face ratios differ from 1.`}`;if(state.selection.kind==='edge'){const i=state.selection.id;read+=` Edge value: ${state.weights[i]}.`; }hint='Select an edge, then double it. Its two incident face ratios change reciprocally. These are abstract scalar labels, not a claimed geometric realization.';}
 if(m==='pascal'){read=`<strong>Pascal straightedge construction</strong> · conic residual ${sci(data.residual)}<br>${data.complete?'X, Y, Z are collinear · residual '+sci(data.incidenceResidual):'This ray is exceptional; move θ slightly.'}`;hint='The locus uses your notebook’s join/meet construction, not a fitted conic. An independent quadratic equation checks the samples and supplies optional tangent lines. This construction is not yet formalized in Lean.';}
 if(m==='bridge'){read='<strong>q(t) = q₀ − t ν₂(ℓ)</strong> in six-dimensional coefficient space.<br>ν₂(ℓ) evaluates to ℓ(x)²; it is a double line, not an arbitrary point of ℙ⁵.';if(Math.abs(E.det(data.Q))<1e-5)read+='<br><span class="warn">The displayed conic is singular.</span>';hint='Each coefficient below is affine-linear in t. The double-line vector obeys the quadratic Veronese relations. No reduction to a tiled-surface proof is claimed.';}
 $('readout').innerHTML=read;$('hint').textContent=hint;
 }catch(error){data=null;if(state.mode!=='surface'){setupCanvas();if(state.mode==='pascal')state.five.forEach((p,i)=>point(p,C[0],['A','B','C','D','E'][i],true,5.5,`five:${i}`));if(state.mode==='fomin')point(state.O,C[0],'O',true,5,'center:0');R.finish();}$('face-readout').replaceChildren();$('readout').textContent=`Degenerate configuration: ${error.message}. Reset or adjust the parameters.`;console.warn(error.message);}}
function setMode(mode,manual=false){if(!['penrose','fomin','surface','bridge','pascal'].includes(mode))mode='penrose';if(manual)userChange();state.playing=false;state.mode=mode;state.selection={kind:'all',id:0};state.pan=[0,0];state.zoom=1;$('experiment').setAttribute('aria-labelledby',`tab-${mode}`);document.querySelectorAll('[data-mode]').forEach(b=>{const active=b.dataset.mode===mode;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});controls();populateInspect();render();}
$('inspect').onchange=()=>{userChange();const[k,id]=$('inspect').value.split(':');state.selection={kind:k,id:+id};render();};$('chords').onchange=()=>{userChange();state.chords=$('chords').checked;render();};$('overview').onclick=()=>{userChange();state.selection={kind:'all',id:0};$('inspect').value='all:0';render();};$('complete').onclick=()=>{userChange();state.complete=!state.complete;render();};$('reset').onclick=()=>{userChange();state.params=E.defaults();state.five=G.defaultFive();state.theta=.42;state.O=[.08,-.05,1];state.ts=[.57,.68,.78];state.weights=E.coherentWeights();state.complete=false;state.t=.45;state.angle=.6;setMode(state.mode);};
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode,true));
document.querySelector('.tabs').addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();const modes=['penrose','pascal','fomin','surface','bridge'];let i=modes.indexOf(state.mode);i=e.key==='Home'?0:e.key==='End'?4:(i+(e.key==='ArrowRight'?1:4))%5;setMode(modes[i],true);$(`tab-${modes[i]}`).focus();});
document.querySelectorAll('[data-demo]').forEach(b=>b.onclick=()=>{setMode(b.dataset.demo,true);if(b.dataset.complete){state.complete=true;render();}if(innerWidth<=820)$('demo').scrollIntoView({block:'start',behavior:'smooth'});});
function moveHandle(kind,id,w){
 if(kind==='five'){state.five[id]=[Math.max(-6,Math.min(6,w[0])),Math.max(-6,Math.min(6,w[1])),1];}
 else if(kind==='seed'){const a=state.params.angles[id];state.params.offsets[id]=Math.max(-.7,Math.min(.7,-w[0]*Math.cos(a)-w[1]*Math.sin(a)));}
 else if(kind==='center')state.O=[Math.max(-.5,Math.min(.5,w[0])),Math.max(-.5,Math.min(.5,w[1])),1];
}
canvas.addEventListener('pointerdown',e=>{
 const r=canvas.getBoundingClientRect(),p=[e.clientX-r.left,e.clientY-r.top],handle=e.target.closest('[data-handle]');
 userChange();let kind='pan',id=-1;if(handle){[kind,id]=handle.dataset.handle.split(':');id=+id;}
 drag={kind,id,start:p,pan:state.pan.slice()};canvas.setPointerCapture(e.pointerId);e.preventDefault();
});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const r=canvas.getBoundingClientRect(),p=[e.clientX-r.left,e.clientY-r.top],w=world(...p);
 if(drag.kind==='pan')state.pan=[drag.pan[0]+p[0]-drag.start[0],drag.pan[1]+p[1]-drag.start[1]];
 else moveHandle(drag.kind,drag.id,w);render();
});
['pointerup','pointercancel','lostpointercapture'].forEach(type=>canvas.addEventListener(type,()=>drag=null));
canvas.addEventListener('keydown',e=>{
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
 const h=e.target.closest('[data-handle]');if(!h)return;e.preventDefault();userChange();
 const [kind,k]=h.dataset.handle.split(':'),i=+k,step=e.shiftKey?.1:.025;let p;
 if(kind==='five')p=state.five[i].slice();else if(kind==='center')p=state.O.slice();else{const a=state.params.angles[i],c=state.params.offsets[i];p=[-c*Math.cos(a)-.75*Math.sin(a),-c*Math.sin(a)+.75*Math.cos(a),1];}
 p[0]+=e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0;p[1]+=e.key==='ArrowUp'?step:e.key==='ArrowDown'?-step:0;
 moveHandle(kind,i,p);render();
});
canvas.addEventListener('wheel',e=>{if(!e.shiftKey)return;e.preventDefault();userChange();state.zoom=Math.max(.5,Math.min(3,state.zoom*Math.exp(-e.deltaY*.001)));render();},{passive:false});
$('envelope').onchange=()=>{userChange();state.envelope=$('envelope').checked;render();};
$('fit-view').onclick=()=>{userChange();state.pan=[0,0];state.zoom=1;render();};
let animationFrame=0,lastFrame=0;
function animate(time){if(!state.playing||state.mode!=='pascal'){animationFrame=0;return;}if(time-lastFrame>60){state.theta=(state.theta+.014)%Math.PI;lastFrame=time;const input=$('controls').querySelector('input');if(input)input.value=state.theta;$('value-0').textContent=fmt(state.theta,2);render();}animationFrame=requestAnimationFrame(animate);}
$('play').onclick=()=>{userChange();state.playing=!state.playing;render();if(state.playing&&!animationFrame)animationFrame=requestAnimationFrame(animate);};
$('dragbar').addEventListener('pointerdown',e=>{if(innerWidth<=820||e.target.closest('button,input,label'))return;const rect=$('demo').getBoundingClientRect();panelDrag={x:e.clientX,y:e.clientY,dx:parseFloat($('demo').style.getPropertyValue('--dx'))||0,dy:parseFloat($('demo').style.getPropertyValue('--dy'))||0,rect};$('dragbar').setPointerCapture(e.pointerId);});$('dragbar').addEventListener('pointermove',e=>{if(!panelDrag)return;const p=panelDrag,dx=Math.max(12-p.rect.left,Math.min(innerWidth-12-p.rect.right,e.clientX-p.x)),dy=Math.max(12-p.rect.top,Math.min(innerHeight-40-p.rect.top,e.clientY-p.y));$('demo').style.setProperty('--dx',`${p.dx+dx}px`);$('demo').style.setProperty('--dy',`${p.dy+dy}px`);});['pointerup','pointercancel','lostpointercapture'].forEach(t=>$('dragbar').addEventListener(t,()=>panelDrag=null));$('reset-panel').onclick=()=>{$('demo').style.removeProperty('--dx');$('demo').style.removeProperty('--dy');$('demo').style.removeProperty('width');};
$('export').onclick=()=>{const content=JSON.stringify({schema:'incidence-cubes/v1',state,arithmetic:state.mode==='surface'?'exact integer fractions':'floating point',warning:'A browser configuration is not a Lean proof certificate.'},null,2),url=URL.createObjectURL(new Blob([content],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`incidence-cubes-${state.mode}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
let scrollTick=false;addEventListener('scroll',()=>{if(scrollTick)return;scrollTick=true;requestAnimationFrame(()=>{scrollTick=false;if(!$('follow').checked||innerWidth<=820)return;let current='penrose';document.querySelectorAll('[data-stage]').forEach(s=>{if(s.getBoundingClientRect().top<innerHeight*.38)current=s.dataset.stage;});if(current!==state.mode)setMode(current);});},{passive:true});
new ResizeObserver(()=>render()).observe($('stage'));setMode(new URLSearchParams(location.search).get('view')||'penrose');
fetch('verification.json').then(r=>{if(!r.ok)throw new Error('No verification record');return r.json();}).then(v=>{$('build-summary').textContent=v.summary;$('verification-detail').textContent=v.detail;if(v.lean==='verified'){$('verification-detail').classList.add('verified');document.querySelector('.status-dot').style.background='#367b48';}}).catch(()=>{$('build-summary').textContent='Formalization in progress · inspect the linked build evidence';});
window.incidenceApp={state,setMode,render,getData:()=>data};
})();
