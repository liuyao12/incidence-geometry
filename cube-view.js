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
function shape(p,linked=true){
  const chords=chordData(p),basis=linked?chords.map(c=>E.mul(refInverse,c.line)):[[1,0,0],[0,1,0],[0,0,1]];
  const vertices=Array.from({length:8},(_,s)=>basis.reduce((v,b,i)=>E.add(v,E.scale(b,((s>>i)&1)-.5)),[0,0,0]));
  const lengths=basis.map(E.norm),angles=[[0,1],[1,2],[2,0]].map(([i,j])=>Math.acos(N.clamp(E.dot(basis[i],basis[j])/lengths[i]/lengths[j],-1,1))*180/Math.PI);
  return {vertices,basis,chords,lengths,angles,volume:Math.abs(E.det(basis))};
}
function rotate(p,c){const cy=Math.cos(c.yaw),sy=Math.sin(c.yaw),ct=Math.cos(c.tilt),st=Math.sin(c.tilt),x=cy*p[0]+sy*p[2],z=-sy*p[0]+cy*p[2];return [x,ct*p[1]-st*z,st*p[1]+ct*z];}
function projected(S,c,w=290,h=200){
  const radius=Math.max(.9,...S.vertices.map(E.norm)),s=Math.min(w,h)*.34*c.zoom/radius;
  return S.vertices.map(p=>{const q=rotate(p,c),r=c.perspective?4*radius/(4*radius-q[2]):1;return [w/2+s*q[0]*r,h/2-s*q[1]*r,q[2]];});
}
// Move an entire pair on the circular carrier: its midpoint determines its
// orientation and offset. Preserve endpoint order by matching to the old pair.
function moveChord(p,i,angle,distance){
  if(!Number.isInteger(i)||i<0||i>2||!Number.isFinite(angle)||!Number.isFinite(distance))throw Error('Invalid chord edit.');
  const a=angle*Math.PI/180,d=N.clamp(distance,.12,.965),n=[Math.cos(a),Math.sin(a)],v=[-n[1],n[0]],h=Math.sqrt(1-d*d);
  let P=E.add(E.scale(n,d),E.scale(v,h)),Q=E.add(E.scale(n,d),E.scale(v,-h));
  const old=N.affine(N.seedPairs(1,p)[i][0]);if(E.norm(N.sub(P,old))>E.norm(N.sub(Q,old)))[P,Q]=[Q,P];
  const u=Math.abs(P[1])>.2?(1+P[0])/P[1]:P[1]/(1-P[0]);
  const vparam=Math.abs(1+Q[0])>.2?Q[1]/(1+Q[0]):(1-Q[0])/Q[1];
  if(!Number.isFinite(u)||!Number.isFinite(vparam)||Math.min(Math.abs(u),Math.abs(vparam))<.101||Math.max(Math.abs(u),Math.abs(vparam))>100)throw Error('This edit meets an excluded seed chart. Choose a nearby angle.');
  const next={...p,u:p.u.slice(),v:p.v.slice(),inflation:p.inflation.slice()};next.u[i]=u;next.v[i]=vparam;
  N.family(3,next); // reject a collapsed or incompatible branch before applying
  return next;
}
function create(host,onSelect){
  const ns='http://www.w3.org/2000/svg',camera={yaw:.65,tilt:.42,zoom:1,perspective:true};
  let current=null,selection='all',complete=true,drag=null,linked=true;
  const make=(tag,attrs,parent)=>{const x=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))x.setAttribute(k,String(v));parent.appendChild(x);return x;};
  function render(){
    if(!current)return;
    const box=host.getBoundingClientRect(),w=Math.max(170,box.width),h=Math.max(145,box.height),ps=projected(current,camera,w,h);
    const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('aria-label','Rotate the linked coefficient-space cube; click a face or edge');
    const faceId=selection.startsWith('face:')?+selection.split(':')[1]:-1,edgeId=selection.startsWith('edge:')?+selection.split(':')[1]:-1;
    const selected=faceId>=0?E.faceEdges(E.FACES[faceId]):edgeId>=0?[edgeId]:[];
    // Plane equations are computed in ganja's 3D projective algebra. A regular
    // central projection and depth order are only display operations.
    const faces=E.FACES.map((ids,i)=>{
      let facing=1;try{const plane=N.planeThrough(...ids.slice(0,3).map(s=>[...current.vertices[s],1]));const normal=plane.slice(0,3),center=ids.reduce((a,s)=>E.add(a,current.vertices[s]),[0,0,0]);const outward=E.dot(normal,center)<0?E.scale(normal,-1):normal;const rc=rotate(center.map(x=>x/4),camera),rn=rotate(outward,camera),radius=Math.max(.9,...current.vertices.map(E.norm));facing=camera.perspective?E.dot(rn,[-rc[0],-rc[1],4*radius-rc[2]]):rn[2];}catch{facing=0;}
      return {ids,i,facing,depth:ids.reduce((a,s)=>a+ps[s][2],0)/4};
    }).sort((a,b)=>a.depth-b.depth);
    const front=new Set();faces.forEach(f=>{if(f.facing>0)E.faceEdges(f.ids).forEach(e=>front.add(e));});
    faces.forEach(({ids,i,facing})=>{const active=i===faceId;const p=make('polygon',{points:ids.map(s=>ps[s].slice(0,2).join(',')).join(' '),fill:active?'#e1b894':'#bdd2ca','fill-opacity':active?.54:facing>0?.23:.08,stroke:active?'#ae592e':'none','stroke-width':1.5,'data-face':i,class:'cube-face',role:'button',tabindex:facing>0?0:-1,'aria-label':`Face ${ids.map(s=>E.LABELS[s]).join(', ')}`,'aria-pressed':active,'pointer-events':facing>0?'all':'none'},svg);make('title',{},p).textContent=`Conics ${ids.map(s=>E.LABELS[s]).join(' · ')}`;});
    E.EDGES.forEach(([a,b],i)=>{const axis=Math.log2(a^b),g=make('g',{'data-edge':i,role:'button',tabindex:0,'aria-label':`Edge ${E.LABELS[a]}–${E.LABELS[b]}`},svg),hidden=!front.has(i),active=selected.includes(i);make('line',{x1:ps[a][0],y1:ps[a][1],x2:ps[b][0],y2:ps[b][1],stroke:active?'#b6532c':colors[axis],'stroke-width':active?3:1.8,'stroke-opacity':hidden?.45:1,'stroke-dasharray':hidden||b===7&&!complete?'4 4':'none','pointer-events':'none'},g);make('line',{x1:ps[a][0],y1:ps[a][1],x2:ps[b][0],y2:ps[b][1],stroke:'transparent','stroke-width':10,'pointer-events':hidden?'none':'stroke'},g);});
    ps.forEach(([x,y],s)=>{make('circle',{cx:x,cy:y,r:s===7?4.4:3.1,fill:s===7&&!complete?'#fffef9':s===7?'#bb592e':'#37556a','pointer-events':'none'},svg);make('text',{x:x+7,y:y-6,'pointer-events':'none',class:'cube-vertex-label'},svg).textContent=E.LABELS[s];});
    host.replaceChildren(svg);host.dataset.selection=selection;host.dataset.volume=current.volume.toFixed(6);host.dataset.shape=JSON.stringify(current.basis);host.dataset.camera=JSON.stringify(camera);
  }
  function update(p,sel='all',show=true,link=true){linked=link;selection=sel;complete=show;current=shape(p,linked);render();return current;}
  function select(key){selection=key;onSelect(key);render();}
  host.tabIndex=0;host.setAttribute('role','group');host.setAttribute('aria-label','Independent cube camera. Drag to rotate; arrow keys orbit; Shift-wheel zooms.');
  host.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();const target=e.target.closest('[data-face],[data-edge]');drag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:camera.yaw,tilt:camera.tilt,moved:false,key:target?(target.hasAttribute('data-face')?'face:'+target.dataset.face:'edge:'+target.dataset.edge):null};host.setPointerCapture(e.pointerId);});
  host.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5)drag.moved=true;if(drag.moved){camera.yaw=drag.yaw+dx/115;camera.tilt=N.clamp(drag.tilt+dy/135,-1.48,1.48);render();}});
  host.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;if(!d.moved&&d.key)select(d.key);});
  ['pointercancel','lostpointercapture'].forEach(t=>host.addEventListener(t,()=>drag=null));
  host.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key.startsWith('ArrowL'))camera.yaw-=.1;if(e.key.startsWith('ArrowR'))camera.yaw+=.1;if(e.key==='ArrowUp')camera.tilt=N.clamp(camera.tilt-.1,-1.48,1.48);if(e.key==='ArrowDown')camera.tilt=N.clamp(camera.tilt+.1,-1.48,1.48);render();}else if(e.key==='Enter'||e.key===' '){const t=e.target.closest('[data-face],[data-edge]');if(t){e.preventDefault();select(t.hasAttribute('data-face')?'face:'+t.dataset.face:'edge:'+t.dataset.edge);}}});
  host.addEventListener('wheel',e=>{if(e.shiftKey){e.preventDefault();camera.zoom=N.clamp(camera.zoom*Math.exp(-e.deltaY*.001),.65,1.65);render();}},{passive:false});
  new ResizeObserver(render).observe(host);
  return {update,render,camera,reset(){Object.assign(camera,{yaw:.65,tilt:.42,zoom:1});render();},setPerspective(p){camera.perspective=p;render();},getShape:()=>current};
}
return {chordData,shape,projected,moveChord,create,colors};
});
