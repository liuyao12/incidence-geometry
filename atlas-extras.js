/* Live supplementary constructions. The same numerical data are exposed to tests. */
(()=>{'use strict';const M=AtlasExtraMath,E=IncidenceMath,$=id=>document.getElementById(id),R=createGanjaView($('extra-geometry'));
const state={kind:'monge',p:M.defaults(),lift:0,triangles:false,reveal:false,yaw:0,tilt:.8};let data,view,camera=null,drag=null,notice='',frame=0;
const colors=['#315f9c','#148176','#9b5b90'],orange='#bb592e';
function proj(p){const a=state.yaw*state.lift,t=state.tilt*state.lift,c=Math.cos(a),s=Math.sin(a),x=c*p[0]-s*p[1],y=s*p[0]+c*p[1];return [x,Math.cos(t)*y+Math.sin(t)*(p[2]||0)];}
const projectPoint=(p,z=0)=>proj([...M.aff(p),z]);
function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;render();});}
function fit(){camera=null;render();}
function setup(){const b=$('extra-drawing').getBoundingClientRect();let points;
 if(state.kind==='monge'){points=[...data.X.map(x=>projectPoint(x)),...state.p.circles.flatMap((c,i)=>Array.from({length:20},(_,k)=>proj([c[0]+state.p.r[i]*Math.cos(k*Math.PI/10),c[1]+state.p.r[i]*Math.sin(k*Math.PI/10),0]))),...data.centers.map((c,i)=>projectPoint(c,state.lift*state.p.r[i]))];}
 else if(state.kind==='braikenridge')points=[...data.six,...data.X].map(M.aff);
 else points=[...data.ABC,...data.X].map(M.aff);
 if(!camera){const xs=points.map(x=>x[0]),ys=points.map(x=>x[1]);camera={x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2,w:Math.max(3,Math.max(...xs)-Math.min(...xs))*1.2,h:Math.max(3,Math.max(...ys)-Math.min(...ys))*1.2};}
 const s=Math.min((b.width-45)/camera.w,(b.height-50)/camera.h);view={w:b.width,h:b.height,s,x:b.width/2-camera.x*s,y:b.height/2+camera.y*s};R.begin(view);
}
function segment(a,b,color,width=1.3,dash=[]){R.path([a,b],color,1,width,dash);}
function drawMonge(){const p=state.p,pp=data.X.map(x=>projectPoint(x));
 if(state.lift>0){const cs=data.centers.map((c,i)=>projectPoint(c,state.lift*p.r[i]));R.polygon(cs,colors[0],.12);for(let i=0;i<3;i++){const j=(i+1)%3;segment(cs[i],cs[j],colors[0],1.7);segment(cs[i],pp[i],colors[0],1,[4,4]);segment(cs[j],pp[i],colors[0],1,[4,4]);segment(projectPoint(data.centers[i]),cs[i],'#849b8d',1,[3,3]);R.point([...cs[i],1],colors[i],'c'+(i+1)+'↑',false,4);}}
 data.centers.forEach((c,i)=>{const xy=p.circles[i],ps=Array.from({length:97},(_,k)=>proj([xy[0]+p.r[i]*Math.cos(k*Math.PI/48),xy[1]+p.r[i]*Math.sin(k*Math.PI/48),0]));R.path(ps,colors[i],.9,2);R.point([...projectPoint(c),1],colors[i],'c'+(i+1),state.lift===0,4.5,state.lift===0?'center:'+i:'');});
 data.tangents.forEach((ls,k)=>ls.forEach(l=>{if(state.lift===0)R.line(l,'#7c9186',state.triangles?.22:.65,1);else{const i=k,j=(k+1)%3,pts=[i,j].map(a=>proj([p.circles[a][0]-p.r[a]*l[0],p.circles[a][1]-p.r[a]*l[1],0]));segment(pts[0],pp[k],'#9aad9f',.8);segment(pts[1],pp[k],'#9aad9f',.8);}}));
 if(state.triangles){for(const [rows,color,prefix]of [[data.A,colors[0],'A'],[data.B,colors[1],'B']]){const a=rows.map(x=>projectPoint(x));R.path([...a,a[0]],color,.8,1.6);a.forEach((p,i)=>{R.point([...p,1],color,prefix+(i+1),false,3);segment(p,pp[i],color,.9,[3,4]);});}for(let i=0;i<3;i++)segment(projectPoint(data.A[i]),projectPoint(data.B[i]),'#7e9787',.8,[4,4]);}
 const v=M.sub(pp[1],pp[0]);segment(M.add(pp[0],M.scale(v,-.14)),M.add(pp[1],M.scale(v,.14)),orange,2,[6,4]);pp.forEach((p,i)=>R.point([...p,1],orange,['X₁₂','X₂₃','X₃₁'][i],false,4.5));
 
}
function drawTriangle(){const [A,B,C]=data.ABC;R.path([A,B,C,A].map(M.aff),'#627d70',1,1.8);data.ABC.forEach((p,i)=>R.point(p,colors[i],'ABC'[i],true,5,'triangle:'+i));data.X.forEach((p,i)=>R.point(p,colors[i],'XYZ'[i],false,4));
 if(state.kind==='ceva'){data.lines.forEach((l,i)=>R.line(l,colors[i],.65,1.3));R.point(data.point,orange,'O',false,5);}else{R.line(data.axis,orange,1,2,[6,4]);R.line(M.cross(A,B),'#899c91',.5,1,[3,4]);}
 const [a,b,c,d,e,f]=data.coeff;
}
function drawConverse(){const ps=data.six;R.path([...ps,ps[0]].map(M.aff),'#879b90',.65,1.3);for(let i=0;i<3;i++){R.line(M.cross(ps[i],ps[(i+1)%6]),colors[i],.5,1);R.line(M.cross(ps[(i+3)%6],ps[(i+4)%6]),colors[i],.5,1);}
 if(state.reveal)R.conic(data.Q,'#148176',.85,2.4);R.line(data.axis,orange,1,1.8,[5,3]);ps.forEach((p,i)=>R.point(p,i===5?orange:colors[i%3],'ABCDEF'[i],i<5,4.5,i<5?'five:'+i:''));data.X.forEach((p,i)=>R.point(p,orange,'XYZ'[i],false,4));
}

let formulaTimer=0,formulaTex='';
function explanation(){
 let tex;
 if(state.kind==='monge')tex=state.lift>0?String.raw`The lifted centers \((a_i,b_i,r_i)\) span a plane \(\Gamma\). Their edge lines meet \(z=0\) at the same \(X_{ij}\), so \(X_{12},X_{23},X_{31}\in\Gamma\cap\{z=0\}\).`:state.triangles?String.raw`The diameter lines \(A_iB_i\) are parallel. The two triangles are perspective from an ideal point and their corresponding sides meet at \(X_{ij}\). Desargues gives their collinearity.`:String.raw`Set \(p_i=(a_i,b_i,1)/r_i\). The three points have representatives \(p_1-p_2\), \(p_2-p_3\), \(p_3-p_1\). Their sum is zero, so they are collinear.`;
 else if(state.kind==='braikenridge')tex=String.raw`Choose \(A,B,C,D,E\) and a line \(AF\). Set \(X=AB\cap DE\), \(Z=CD\cap AF\), then \(Y=XZ\cap BC\) and \(F=EY\cap AZ\). Thus \(X,Y,Z\) are collinear by construction. The conic is recovered independently from the first five points and also contains \(F\).`;
 else{const [a,b,c,d,e,f]=data.coeff;tex=String.raw`\(X=B+${b.toFixed(3)}C\), \(Y=C+${d.toFixed(3)}A\), \(Z=A${f<0?'-':'+'}${Math.abs(f).toFixed(3)}B\). `+(state.kind==='ceva'?String.raw`The coefficient products satisfy \(ace=bdf\).`:String.raw`The coefficient products satisfy \(ace+bdf=0\).`);}
 if(formulaTex===tex)return;formulaTex=tex;const el=$('extra-formula');if(window.MathJax?.typesetClear)MathJax.typesetClear([el]);el.textContent=tex;clearTimeout(formulaTimer);formulaTimer=setTimeout(async()=>{try{await MathJax.startup.promise;if(formulaTex===tex)await MathJax.typesetPromise([el]);}catch{}},90);
}
function render(){try{data=M.build(state.kind,state.p);setup();if(state.kind==='monge')drawMonge();else if(state.kind==='braikenridge')drawConverse();else drawTriangle();explanation();R.finish();$('extra-state').textContent=notice||`Construction residual ${data.error.toExponential(1)}. Numerical illustration; see the theorem map for proof status.`;}catch(e){$('extra-state').textContent=e.message;}}
function update(fn){const p=structuredClone(state.p);try{fn(p);M.build(state.kind,p);state.p=p;notice='';}catch(e){notice=e.message;}sync();schedule();}
function sync(){for(let i=0;i<3;i++){$('radius-'+i).value=state.p.r[i];$('radius-value-'+i).value=state.p.r[i].toFixed(2);}$('triangle-s').value=state.p.s;$('triangle-t').value=state.p.t;$('converse-angle').value=state.p.angle;}
function select(kind){if(!['monge','ceva','menelaus','braikenridge'].includes(kind))return;state.kind=kind;state.lift=0;state.triangles=false;state.reveal=false;notice='';camera=null;$('monge-controls').hidden=kind!=='monge';$('triangle-controls').hidden=!['ceva','menelaus'].includes(kind);$('converse-controls').hidden=kind!=='braikenridge';$('monge-lift').value=0;$('monge-triangles').checked=false;$('converse-conic').checked=false;$('extra-title').textContent={monge:'Monge',ceva:'Ceva',menelaus:'Menelaus',braikenridge:'Braikenridge–Maclaurin'}[kind];$('extra-hint').textContent=kind==='monge'?'Drag circle centers or change the radii. At positive lift, drag empty space to orbit the spatial triangle.':kind==='braikenridge'?'Drag any of the five hollow points or change the line through A. The sixth point is constructed from the collinearity hypothesis.':'Drag the triangle vertices or change two side ratios. The third side point is reconstructed to satisfy the criterion.';sync();render();}
for(let i=0;i<3;i++)$('radius-'+i).oninput=e=>update(p=>p.r[i]=+e.target.value);
for(const [id,key]of [['triangle-s','s'],['triangle-t','t'],['converse-angle','angle']])$(id).oninput=e=>update(p=>p[key]=+e.target.value);
$('monge-triangles').onchange=e=>{state.triangles=e.target.checked;schedule();};$('converse-conic').onchange=e=>{state.reveal=e.target.checked;schedule();};$('monge-lift').oninput=e=>{state.lift=+e.target.value;camera=null;schedule();};$('extra-reset').onclick=()=>{state.p=M.defaults();select(state.kind);};$('extra-fit').onclick=fit;
function moveHandle(key,xy){const [which,k]=key.split(':');update(p=>{if(which==='center')p.circles[+k]=xy;else if(which==='triangle')p.triangle[+k]=xy;else if(which==='five')p.five[+k]=xy;});}
const drawing=$('extra-drawing');drawing.addEventListener('pointerdown',e=>{const key=e.target.closest('[data-handle]')?.dataset.handle;if(!key&&!(state.kind==='monge'&&state.lift>0))return;drag={key,x:e.clientX,y:e.clientY,yaw:state.yaw,tilt:state.tilt};drawing.setPointerCapture(e.pointerId);});drawing.addEventListener('pointermove',e=>{if(!drag)return;if(drag.key){const r=drawing.getBoundingClientRect();moveHandle(drag.key,[(e.clientX-r.left-view.x)/view.s,-(e.clientY-r.top-view.y)/view.s]);}else{state.yaw=drag.yaw+(e.clientX-drag.x)/140;state.tilt=Math.max(.15,Math.min(1.35,drag.tilt+(e.clientY-drag.y)/160));camera=null;schedule();}});for(const event of ['pointerup','pointercancel','lostpointercapture'])drawing.addEventListener(event,()=>drag=null);
$('extra-geometry').addEventListener('keydown',e=>{const key=e.target.closest('[data-handle]')?.dataset.handle;if(!key||!e.key.startsWith('Arrow'))return;e.preventDefault();const [which,i]=key.split(':'),p=state.p[which==='center'?'circles':which==='triangle'?'triangle':'five'][+i].slice();p[e.key==='ArrowLeft'||e.key==='ArrowRight'?0:1]+=(e.key==='ArrowRight'||e.key==='ArrowUp'?1:-1)*.03;moveHandle(key,p);});
new ResizeObserver(schedule).observe(drawing);window.atlasExtras={state,select,render,getData:()=>data};select(new URLSearchParams(location.search).get('theorem')||'monge');
})();
