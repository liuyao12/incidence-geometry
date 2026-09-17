/* Native ganja SVG rendering, with a Pointer Events adapter for responsive
 * rectangular viewports and touch. Algebra values are never used as proof data.
 */
(function(root) {
  'use strict';
  const G=root.IncidencePGA;
  const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  root.createGanjaView = function(host) {
    let scene=[],view=null;
    const color=c=>typeof c==='number'?c:parseInt(c.replace('#',''),16);
    const group=(c,alpha,width,dash,body,extra='')=>{
      scene.push(`<g opacity="${alpha}" stroke-width="${width/view.s}" ${dash.length?`stroke-dasharray="${dash.map(d=>d/view.s).join(' ')}"`:''} ${extra}>`,color(c));
      body();scene.push('</g>');
    };
    const bounds=()=>({xmin:-view.x/view.s,xmax:(view.w-view.x)/view.s,ymin:-(view.h-view.y)/view.s,ymax:view.y/view.s});
    function clip(a,b) {
      const {xmin,xmax,ymin,ymax}=bounds();let t0=0,t1=1;
      const dx=b[0]-a[0],dy=b[1]-a[1];
      for(const [p,q] of [[-dx,a[0]-xmin],[dx,xmax-a[0]],[-dy,a[1]-ymin],[dy,ymax-a[1]]]){
        if(Math.abs(p)<1e-14){if(q<0)return null;continue;}
        const t=q/p;
        if(p<0)t0=Math.max(t0,t);else t1=Math.min(t1,t);
        if(t0>t1)return null;
      }
      return [[a[0]+t0*dx,a[1]+t0*dy,1],[a[0]+t1*dx,a[1]+t1*dy,1]];
    }
    function segments(samples,closed=true) {
      for(let i=0;i<(closed?samples.length:samples.length-1);i++){
        const a=samples[i],b=samples[(i+1)%samples.length];
        // Opposite homogeneous weights are different affine branches. Never
        // draw the tempting but false chord through the middle of the viewport.
        if(!G.finite(a)||!G.finite(b)||a.e12*b.e12<=0)continue;
        const pair=clip(G.affine(a),G.affine(b));
        if(pair)scene.push(pair.map(G.point));
      }
    }
    function line(l,c='#71898b',alpha=1,width=1,dash=[]) {
      if(!l.every(Number.isFinite))return;
      const m=G.line(l), n=Math.hypot(l[0],l[1]);if(n<1e-12)return;
      group(c,alpha,width,dash,()=>scene.push(m.Scale(1/n)));
    }
    function point(p,c,label='',hollow=false,r=3.5,handle='') {
      const P=p instanceof G.algebra?p:G.point(p);
      if(!G.valid(P))return;
      const a=G.affine(P),b=bounds();
      if(!a){
        // An ideal point is a direction, not a point at the origin.
        const xyz=G.pointCoordinates(P),n=Math.hypot(xyz[0],xyz[1]);if(!n)return;
        let dx=xyz[0]/n,dy=-xyz[1]/n;const t=Math.min((view.w/2-16)/Math.max(Math.abs(dx),1e-8),(view.h/2-20)/Math.max(Math.abs(dy),1e-8));
        const x=(view.w/2+t*dx-view.x)/view.s,y=(view.h/2+t*dy-view.y)/view.s;
        scene.push(`<g class="ideal-marker" transform="translate(${x} ${y})" fill="${esc(c)}"><text font-size="${11/view.s}">${esc(label)} ∞</text></g>`);return;
      }
      if(a[0]<b.xmin-.2||a[0]>b.xmax+.2||a[1]<b.ymin-.2||a[1]>b.ymax+.2)return;
      const extra=handle?`data-handle="${esc(handle)}" class="ganja-handle" role="button" tabindex="0" aria-label="Drag ${esc(label)}; arrow keys move it"`:'';
      group(c,1,1.3,[],()=>{
        scene.push(G.point(a));
        if(label)scene.push(esc(label));
      },`${extra} data-point-radius="${r/view.s}" ${hollow?'data-hollow="true"':''}`);
    }
    return {
      begin(v){view=v;scene=[];},
      line,point,
      path(ps,c,alpha=1,width=1.6,dash=[]){if(!ps?.length)return;group(c,alpha,width,dash,()=>segments(ps.map(p=>G.point([...p.slice(0,2),1])),false));},
      curve(samples,c,alpha=1,width=1.6){group(c,alpha,width,[],()=>segments(samples));},
      conic(Q,c,alpha=1,width=1.6){group(c,alpha,width,[],()=>segments(G.conicSamples(Q)));},
      envelope(Q,c='#71898b'){
        const samples=G.conicSamples(Q,32);
        samples.filter(G.finite).forEach(p=>{const x=G.pointCoordinates(p);line(root.IncidenceMath.mul(Q,x),c,.17,.7);});
      },
      finish(){
        const focus=host.querySelector(':focus')?.getAttribute('data-handle');
        const svg=G.algebra.graph(scene,{width:view.w,height:view.h,scale:1,animate:false,fontSize:11/view.s/.1,pointRadius:3.5/view.s/.03,lineWidth:1.5/view.s/.005});
        svg.id='ganja-svg';svg.dataset.renderer='ganja.js';svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
        svg.setAttribute('viewBox',`${-view.x/view.s} ${-view.y/view.s} ${view.w/view.s} ${view.h/view.s}`);
        svg.style.cssText='width:100%;height:100%;display:block;background:transparent;user-select:none';
        svg.setAttribute('role','group');svg.setAttribute('aria-label','Projective construction rendered with ganja.js');
        svg.onwheel=null;svg.onmousedown=null;svg.onmousemove=null;
        svg.querySelectorAll('[onmousedown]').forEach(n=>n.removeAttribute('onmousedown'));
        svg.querySelectorAll('[data-point-radius]').forEach(g=>{const c=g.querySelector('circle');if(!c)return;c.setAttribute('r',g.dataset.pointRadius);if(g.dataset.hollow){c.setAttribute('stroke',c.getAttribute('fill'));c.setAttribute('fill','#fff');}});
        host.replaceChildren(svg);host.ganjaScene=scene;
        if(focus)host.querySelector(`[data-handle="${focus}"]`)?.focus({preventScroll:true});
        return svg;
      },
      get scene(){return scene;}
    };
  };
})(globalThis);
