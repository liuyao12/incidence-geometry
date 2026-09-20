/* A true 3D parallelepiped in a FIXED coordinate system on the covector space.
 * Its edge i is the current seed chord expressed in the three reference chords.
 * This is an explanatory choice of representatives, NOT an invariant metric
 * of Penrose's theorem. Camera motion never changes the conic configuration.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'),require('./narrative-math.js'));
  else root.IncidenceCube=factory(root.IncidenceMath,root.IncidenceNarrative);
})(globalThis,(E,N)=>{
'use strict';
const colors=['#2c5f9e','#168477','#9565a0'];
const transpose=A=>A[0].map((_,i)=>A.map(r=>r[i]));
function chordData(p){return N.classical(1,p).pairs.map(([A,B])=>{
  const a=N.affine(A),b=N.affine(B),l=E.cross(A,B),n=Math.hypot(l[0],l[1]);
  if(n<1e-10)throw Error('A seed chord is not defined.');
  const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
  return {line:l.map(x=>x/n),mid,distance:Math.hypot(...mid),angle:Math.atan2(mid[1],mid[0])*180/Math.PI};
});}
const refInverse=E.inverse(transpose(chordData(N.defaults()).map(c=>c.line)));
function shape(p,linked=true,options={}){
  const chords=chordData(p),basis=linked?(options.basis||chords.map(c=>E.mul(refInverse,c.line))):[[1,0,0],[0,1,0],[0,0,1]];
  // Keep the origin fixed in editable mode: dragging vi must not translate it.
  const origin=options.basis?[-.5,-.5,-.5]:basis.reduce((v,b)=>E.add(v,E.scale(b,-.5)),[0,0,0]);
  const vertices=Array.from({length:8},(_,s)=>basis.reduce((v,b,i)=>E.add(v,E.scale(b,(s>>i)&1)),origin.slice()));
  const lengths=basis.map(E.norm),angles=[[0,1],[1,2],[2,0]].map(([i,j])=>Math.acos(N.clamp(E.dot(basis[i],basis[j])/lengths[i]/lengths[j],-1,1))*180/Math.PI);
  return {vertices,basis,chords,lengths,angles,origin,volume:Math.abs(E.det(basis))};
}
function rotate(p,c){const cy=Math.cos(c.yaw),sy=Math.sin(c.yaw),ct=Math.cos(c.tilt),st=Math.sin(c.tilt),x=cy*p[0]+sy*p[2],z=-sy*p[0]+cy*p[2];return [x,ct*p[1]-st*z,st*p[1]+ct*z];}
function projected(S,c,w=290,h=200,radiusOverride=null){
  const radius=radiusOverride||Math.max(.9,...S.vertices.map(E.norm)),s=Math.min(w,h)*.34*c.zoom/radius;
  return S.vertices.map(p=>{const q=rotate(p,c),r=c.perspective?4*radius/(4*radius-q[2]):1;return [w/2+s*q[0]*r,h/2-s*q[1]*r,q[2]];});
}
// Move an entire pair on the circular carrier: its midpoint determines its
// orientation and offset. Preserve endpoint order by matching to the old pair.
function moveChord(p,i,angle,distance){
  if(!Number.isInteger(i)||i<0||i>2||!Number.isFinite(angle)||!Number.isFinite(distance))throw Error('Invalid chord edit.');
  const a=angle*Math.PI/180,d=N.clamp(distance,.005,.985),n=[Math.cos(a),Math.sin(a)],v=[-n[1],n[0]],h=Math.sqrt(1-d*d);
  let P=E.add(E.scale(n,d),E.scale(v,h)),Q=E.add(E.scale(n,d),E.scale(v,-h));
  const old=N.affine(N.seedPairs(1,p)[i][0]);if(E.norm(N.sub(P,old))>E.norm(N.sub(Q,old)))[P,Q]=[Q,P];
  const u=Math.abs(P[1])>.2?(1+P[0])/P[1]:P[1]/(1-P[0]);
  const vparam=Math.abs(1+Q[0])>.2?Q[1]/(1+Q[0]):(1-Q[0])/Q[1];
  if(!Number.isFinite(u)||!Number.isFinite(vparam)||Math.min(Math.abs(u),Math.abs(vparam))<.101||Math.max(Math.abs(u),Math.abs(vparam))>100)throw Error('This edit meets an excluded seed chart. Choose a nearby angle.');
  const next={...p,u:p.u.slice(),v:p.v.slice(),inflation:p.inflation.slice()};next.u[i]=u;next.v[i]=vparam;
  N.family(3,next); // reject a collapsed or incompatible branch before applying
  return next;
}
// Invert camera rotation without using a numerical matrix inverse.
function unrotate(p,c){const cy=Math.cos(c.yaw),sy=Math.sin(c.yaw),ct=Math.cos(c.tilt),st=Math.sin(c.tilt),y=ct*p[1]+st*p[2],z=-st*p[1]+ct*p[2];return [cy*p[0]-sy*z,y,sy*p[0]+cy*z];}
function create(host,onSelect,callbacks={}){
  const ns='http://www.w3.org/2000/svg',camera={yaw:.65,tilt:.42,zoom:1,perspective:true};
  let current=null,selection='all',complete=true,drag=null,linked=true,options={},lastProjection=null;
  const make=(tag,attrs,parent)=>{const x=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))x.setAttribute(k,String(v));parent.appendChild(x);return x;};
  function render(){
    if(!current)return;
    const focus=host.querySelector(':focus')?.dataset.vectorCorner;
    const box=host.getBoundingClientRect(),w=Math.max(170,box.width),h=Math.max(145,box.height),radius=drag?.radius||Math.max(.9,...current.vertices.map(E.norm)),ps=projected(current,camera,w,h,radius);
    lastProjection={w,h,radius,ps,scale:Math.min(w,h)*.34*camera.zoom/radius};
    const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('aria-label',options.editable?'Drag framed vector endpoints to change the conics; drag faces to orbit':'Rotate the linked coefficient-space cube; click a face or edge');
    const faceId=selection.startsWith('face:')?+selection.split(':')[1]:-1,edgeId=selection.startsWith('edge:')?+selection.split(':')[1]:-1;
    const selected=faceId>=0?E.faceEdges(E.FACES[faceId]):edgeId>=0?[edgeId]:[];
    // Plane equations are computed in ganja's 3D projective algebra. A regular
    // central projection and depth order are only display operations.
    const faces=E.FACES.map((ids,i)=>{
      let facing=1;try{const plane=N.planeThrough(...ids.slice(0,3).map(s=>[...current.vertices[s],1]));const normal=plane.slice(0,3),center=ids.reduce((a,s)=>E.add(a,current.vertices[s]),[0,0,0]);const outward=E.dot(normal,N.sub(center,current.vertices.reduce((a,v)=>E.add(a,E.scale(v,.5)),[0,0,0])))<0?E.scale(normal,-1):normal;const rc=rotate(center.map(x=>x/4),camera),rn=rotate(outward,camera),radius=Math.max(.9,...current.vertices.map(E.norm));facing=camera.perspective?E.dot(rn,[-rc[0],-rc[1],4*radius-rc[2]]):rn[2];}catch{facing=0;}
      return {ids,i,facing,depth:ids.reduce((a,s)=>a+ps[s][2],0)/4};
    }).sort((a,b)=>a.depth-b.depth);
    const front=new Set();faces.forEach(f=>{if(f.facing>0)E.faceEdges(f.ids).forEach(e=>front.add(e));});
    faces.forEach(({ids,i,facing})=>{const active=i===faceId;const p=make('polygon',{points:ids.map(s=>ps[s].slice(0,2).join(',')).join(' '),fill:active?'#e1b894':'#bdd2ca','fill-opacity':active?.54:facing>0?.23:.08,stroke:active?'#ae592e':'none','stroke-width':1.5,'data-face':i,class:'cube-face',role:'button',tabindex:facing>0?0:-1,'aria-label':`Face ${ids.map(s=>E.LABELS[s]).join(', ')}`,'aria-pressed':active,'pointer-events':facing>0?'all':'none'},svg);make('title',{},p).textContent=`Conics ${ids.map(s=>E.LABELS[s]).join(' · ')}`;});
    E.EDGES.forEach(([a,b],i)=>{const axis=Math.log2(a^b),g=make('g',{'data-edge':i,role:'button',tabindex:0,'aria-label':`Edge ${E.LABELS[a]}–${E.LABELS[b]}`},svg),hidden=!front.has(i),active=selected.includes(i);make('line',{x1:ps[a][0],y1:ps[a][1],x2:ps[b][0],y2:ps[b][1],stroke:active?'#b6532c':colors[axis],'stroke-width':active?3:1.8,'stroke-opacity':hidden?.45:1,'stroke-dasharray':hidden||b===7&&!complete?'4 4':'none','pointer-events':'none'},g);make('line',{x1:ps[a][0],y1:ps[a][1],x2:ps[b][0],y2:ps[b][1],stroke:'transparent','stroke-width':10,'pointer-events':hidden?'none':'stroke'},g);});
    if(options.basis){
      const ref={vertices:[current.origin,...[0,1,2].map(i=>current.origin.map((v,j)=>v+ +(j===i)))]};
      const rp=projected(ref,camera,w,h,radius);
      for(let i=1;i<4;i++){make('line',{x1:rp[0][0],y1:rp[0][1],x2:rp[i][0],y2:rp[i][1],stroke:'#75838c','stroke-width':1,'stroke-dasharray':'2 4','pointer-events':'none'},svg);make('text',{x:rp[i][0]-13,y:rp[i][1]+15,fill:'#71818a','font-size':10,'pointer-events':'none'},svg).textContent='e'+i;}
    }
    ps.forEach(([x,y],s)=>{
      const editable=options.editable&&s!==0,axis=[1,2,4].indexOf(s),label=options.basis&&axis>=0?'v'+(axis+1):E.LABELS[s];
      const g=make('g',editable?{'data-vector-corner':s,class:'vector-vertex',role:'button',tabindex:0,'aria-label':`Move ${axis>=0?'vector '+(axis+1):'corner '+E.LABELS[s]}. Arrow keys move in the view plane; Shift up or down changes depth.`}:{},svg);
      make('circle',{cx:x,cy:y,r:editable?(axis>=0?6:4.5):s===7?4.4:3.1,fill:editable?'#fffef9':s===7&&!complete?'#fffef9':s===7?'#bb592e':'#37556a',stroke:editable?(axis>=0?colors[axis]:'#677c88'):'none','stroke-width':2,'pointer-events':'none'},g);
      if(editable)make('circle',{cx:x,cy:y,r:10,fill:'transparent',class:'vertex-hit','pointer-events':'all'},g);
      make('text',{x:x+8,y:y-7,'pointer-events':'none',class:'cube-vertex-label'},svg).textContent=label;
    });
    host.replaceChildren(svg);host.dataset.selection=selection;host.dataset.volume=current.volume.toFixed(6);host.dataset.shape=JSON.stringify(current.basis);host.dataset.camera=JSON.stringify(camera);host.dataset.model=options.basis?'moduli':'chords';
    host.dataset.editable=String(!!options.editable);
    if(focus!==undefined)host.querySelector(`[data-vector-corner="${focus}"]`)?.focus({preventScroll:true});
  }
  function update(p,sel='all',show=true,link=true,opts={}){linked=link;selection=sel;complete=show;options=opts;current=shape(p,linked,opts);render();return current;}
  function select(key){selection=key;onSelect(key);render();}
  host.tabIndex=0;host.setAttribute('role','group');host.setAttribute('aria-label','Independent cube camera. Drag to rotate; arrow keys orbit; Shift-wheel zooms.');
  function applyDelta(base,corner,delta){
    const ids=[0,1,2].filter(i=>corner>>i&1),basis=base.map((v,i)=>ids.includes(i)?E.add(v,E.scale(delta,1/ids.length)):v.slice());
    callbacks.onEdit?.(basis,corner);
  }
  host.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;e.preventDefault();const vertex=e.target.closest('[data-vector-corner]'),target=e.target.closest('[data-face],[data-edge]');
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:camera.yaw,tilt:camera.tilt,moved:false,key:target?(target.hasAttribute('data-face')?'face:'+target.dataset.face:'edge:'+target.dataset.edge):null};
    if(vertex&&options.editable){
      const corner=+vertex.dataset.vectorCorner;
      Object.assign(drag,{corner,basis:current.basis.map(v=>v.slice()),radius:lastProjection.radius,scale:lastProjection.scale,depth:lastProjection.ps[corner][2],camera:{...camera}});
      callbacks.onEditStart?.();vertex.focus({preventScroll:true});
    }
    host.setPointerCapture(e.pointerId);
  });
  host.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>3)drag.moved=true;
    if(!drag.moved)return;
    if(drag.corner!==undefined){
      const factor=drag.camera.perspective?4*drag.radius/(4*drag.radius-drag.depth):1;
      const camDelta=e.shiftKey?[0,0,-dy/drag.scale]:[dx/(drag.scale*factor),-dy/(drag.scale*factor),0];
      applyDelta(drag.basis,drag.corner,unrotate(camDelta,drag.camera));
    }else{camera.yaw=drag.yaw+dx/115;camera.tilt=N.clamp(drag.tilt+dy/135,-1.48,1.48);render();}
  });
  host.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;if(d.corner!==undefined)callbacks.onEditEnd?.();else if(!d.moved&&d.key)select(d.key);render();});
  ['pointercancel','lostpointercapture'].forEach(t=>host.addEventListener(t,()=>{if(drag?.corner!==undefined)callbacks.onEditEnd?.();drag=null;}));
  host.addEventListener('keydown',e=>{
    const vertex=e.target.closest('[data-vector-corner]');
    if(vertex&&options.editable&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
      e.preventDefault();const corner=+vertex.dataset.vectorCorner,step=e.altKey?.003:.02;
      const delta=e.shiftKey?[0,0,e.key==='ArrowUp'?step:e.key==='ArrowDown'?-step:0]:[e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0,e.key==='ArrowUp'?step:e.key==='ArrowDown'?-step:0,0];
      callbacks.onEditStart?.();applyDelta(current.basis,corner,unrotate(delta,camera));callbacks.onEditEnd?.();return;
    }
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')camera.yaw-=.1;if(e.key==='ArrowRight')camera.yaw+=.1;if(e.key==='ArrowUp')camera.tilt=N.clamp(camera.tilt-.1,-1.48,1.48);if(e.key==='ArrowDown')camera.tilt=N.clamp(camera.tilt+.1,-1.48,1.48);render();}
    else if(e.key==='Enter'||e.key===' '){const t=e.target.closest('[data-face],[data-edge]');if(t){e.preventDefault();select(t.hasAttribute('data-face')?'face:'+t.dataset.face:'edge:'+t.dataset.edge);}}
  });
  host.addEventListener('wheel',e=>{if(e.shiftKey){e.preventDefault();camera.zoom=N.clamp(camera.zoom*Math.exp(-e.deltaY*.001),.65,1.65);render();}},{passive:false});
  new ResizeObserver(render).observe(host);
  return {update,render,camera,reset(){Object.assign(camera,{yaw:.65,tilt:.42,zoom:1});render();},setPerspective(p){camera.perspective=p;render();},getShape:()=>current,getProjection:()=>lastProjection};
}
return {chordData,shape,projected,moveChord,create,colors,rotate,unrotate};
});
