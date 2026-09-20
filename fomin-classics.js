/* Fomin–Pylyavskyy, Incidences and tilings, §3: Figures 5, 9 and 15.
 * A face is an oriented cycle [point, line, point, line]. Edge values are
 * evaluations, NOT incidences. The maps and geometric realizations are separate.
 * No classical conclusion is used when constructing the omitted incidence.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'));
 else root.FominClassics=factory(root.IncidenceMath);
})(globalThis,E=>{
 'use strict';
 const pt=(x,y)=>[x,y,1], dot=E.dot;
 const unit=x=>{const n=Math.hypot(...x);if(!Number.isFinite(n)||n<1e-12)throw Error('A defining join or intersection has collapsed.');return x.map(v=>v/n);};
 const cross=(a,b)=>unit(E.cross(a,b));
 const affine=x=>Math.abs(x[2])<1e-9?null:[x[0]/x[2],x[1]/x[2]];
 const lerp=(a,b,t)=>a.map((v,i)=>(1-t)*v+t*b[i]);
 const edgeKey=(a,b)=>[a,b].sort().join('|');
 function orient(raw){
  const faces=raw.map(f=>({...f,cycle:f.cycle.slice()})),occ=new Map();
  faces.forEach((f,i)=>f.cycle.forEach((a,k)=>{
   const b=f.cycle[(k+1)%4],key=edgeKey(a,b),d=a<b?1:-1;
   if(!occ.has(key))occ.set(key,[]);occ.get(key).push({i,d});
  }));
  for(const entries of occ.values())if(entries.length!==2)throw Error('Every surface edge must have exactly two sides.');
  const signs=Array(faces.length).fill(0);signs[0]=1;
  for(let sweep=0;sweep<faces.length;sweep++)for(const [x,y] of occ.values()){
   if(signs[x.i]&&!signs[y.i])signs[y.i]=-signs[x.i]*x.d*y.d;
   if(signs[y.i]&&!signs[x.i])signs[x.i]=-signs[y.i]*x.d*y.d;
   if(signs[x.i]&&signs[y.i]&&signs[x.i]*x.d!==-signs[y.i]*y.d)throw Error('Inconsistent orientation.');
  }
  if(signs.includes(0))throw Error('Disconnected face adjacency.');
  faces.forEach((f,i)=>{if(signs[i]<0){const [p,l,q,m]=f.cycle;f.cycle=[p,m,q,l];}});
  return faces;
 }
 const face=(cycle,reason,role='construction')=>({cycle,reason,role});
 const desarguesFaces=orient([
  face(['A1','c','A2','b'],'The connectors meet at O = b ∩ c; O lies on A₁A₂.','hypothesis'),
  face(['A1','a1','B','c'],'a₁ ∩ c = C₁, and A₁, B, C₁ lie on b₁.'),
  face(['A1','b','C','a1'],'a₁ ∩ b = B₁, and A₁, C, B₁ lie on c₁.'),
  face(['A2','c','B','a2'],'a₂ ∩ c = C₂, and A₂, B, C₂ lie on b₂.'),
  face(['A2','a2','C','b'],'a₂ ∩ b = B₂, and A₂, C, B₂ lie on c₂.'),
  face(['B','a1','C','a2'],'a₁ ∩ a₂ = A. This last tile asserts that A, B, C are collinear.','conclusion')
 ]);
 const pappusFaces=orient([
  face(['P1','b','P2','c'],'P₁P₂ passes through A = b ∩ c.','hypothesis'),
  face(['P2','a','P3','c'],'P₂P₃ passes through B = a ∩ c.'),
  face(['P3','b','P4','c'],'P₃P₄ passes through A = b ∩ c.'),
  face(['P4','a','P5','c'],'P₄P₅ passes through B = a ∩ c.','hypothesis'),
  face(['P5','b','P6','c'],'P₅P₆ passes through A = b ∩ c.'),
  face(['P6','a','P1','c'],'P₆P₁ passes through B = a ∩ c.'),
  face(['P1','a','P4','b'],'C = P₁P₄ ∩ P₂P₅ = a ∩ b lies on P₁P₄.'),
  face(['P2','b','P5','a'],'C = P₁P₄ ∩ P₂P₅ = a ∩ b lies on P₂P₅.'),
  face(['P3','a','P6','b'],'The ninth tile asserts that P₃P₆ also passes through C = a ∩ b.','conclusion')
 ]);
 const quadrangleFaces=orient([
  face(['A4','l13','P14','l12'],'ℓ₁₃ ∩ ℓ₁₂ = A₁ lies on A₄P₁₄.'),
  face(['P14','m13','B4','m12'],'m₁₃ ∩ m₁₂ = B₁ lies on B₄P₁₄.'),
  face(['A4','l23','P34','l13'],'ℓ₂₃ ∩ ℓ₁₃ = A₃ lies on A₄P₃₄.'),
  face(['A4','l12','P24','l23'],'ℓ₁₂ ∩ ℓ₂₃ = A₂ lies on A₄P₂₄.'),
  face(['P24','m12','B4','m23'],'m₁₂ ∩ m₂₃ = B₂ lies on P₂₄B₄.'),
  face(['P14','l13','P34','m13'],'ℓ₁₃ ∩ m₁₃ = P₁₃ lies on P₁₄P₃₄.','hypothesis'),
  face(['P14','m12','P24','l12'],'ℓ₁₂ ∩ m₁₂ = P₁₂ lies on P₁₄P₂₄.','hypothesis'),
  face(['P24','l23','P34','m23'],'ℓ₂₃ ∩ m₂₃ = P₂₃ lies on P₂₄P₃₄.','hypothesis'),
  face(['B4','m13','P34','m23'],'m₁₃ ∩ m₂₃ = B₃. The last tile forces P₃₄ onto B₃B₄.','conclusion')
 ]);
 const models={
  desargues:{title:'Desargues',surface:'Sphere',reference:'Theorem 3.1 · Figure 5',page:10,faces:desarguesFaces,last:5,
   nodes:{A2:[-1,-1],a2:[1,-1],B:[1,1],c:[-1,1],b:[-.35,-.35],C:[.35,-.35],a1:[.35,.35],A1:[-.35,.35]},outer:3},
  pappus:{title:'Pappus',surface:'Torus',reference:'Theorem 3.2 · Figure 9',page:13,faces:pappusFaces,last:8},
  quadrangle:{title:'Complete quadrangle',surface:'Sphere',reference:'Theorem 3.3 · Figure 15',page:17,faces:quadrangleFaces,last:8,
   nodes:{l23:[-1,-1],P34:[1,-1],m23:[1,1],P24:[-1,1],A4:[-.5,-.5],l13:[0,-.5],l12:[-.5,0],P14:[0,0],m13:[.5,0],m12:[0,.5],B4:[.5,.5]},outer:7}
 };
 function defaults(){return {
  desargues:{O:pt(.08,-.05),base:[pt(-1.25,-.72),pt(1.3,-.64),pt(.15,1.34)],ts:[.35,.65,.86]},
  pappus:{A:pt(0,1.1),B:pt(.3,.1),seeds:[pt(-1.6,.9),pt(-1.8,-1.3),pt(1.3,.25)]},
  quadrangle:{base:[pt(.1,1.05),pt(-.35,.60),pt(-1.05,1.6),pt(-.8,1.9)],B1:pt(.15,-1.15),t:.42,offset:0,release:0}
 };}
 function metadata(model){
  const vertices=[...new Set(model.faces.flatMap(f=>f.cycle))], edges=new Map();
  model.faces.forEach((f,i)=>f.cycle.forEach((a,j)=>{
   const b=f.cycle[(j+1)%4],k=edgeKey(a,b);if(!edges.has(k))edges.set(k,[]);edges.get(k).push({face:i,a,b});
  }));
  // Check not just Euler's formula but every vertex link: one cycle, not a pinch.
  for(const v of vertices){
   const adj=new Map();for(const f of model.faces){const k=f.cycle.indexOf(v);if(k<0)continue;
    const a=f.cycle[(k+3)%4],b=f.cycle[(k+1)%4];for(const [x,y] of [[a,b],[b,a]]){if(!adj.has(x))adj.set(x,[]);adj.get(x).push(y);}}
   if([...adj.values()].some(ns=>ns.length!==2))throw Error('Nonmanifold vertex link.');
   const seen=new Set(),todo=[adj.keys().next().value];while(todo.length){const v=todo.pop();if(seen.has(v))continue;seen.add(v);todo.push(...adj.get(v));}
   if(seen.size!==adj.size)throw Error('Disconnected vertex link.');
  }
  const chi=vertices.length-edges.size+model.faces.length;
  return {V:vertices.length,E:edges.size,F:model.faces.length,chi,genus:(2-chi)/2,vertices,edges:[...edges.values()]};
 }
 for(const model of Object.values(models))model.topology=metadata(model);
 function evaluate(model,points,lines){
  let minPairing=1,error=0;
  const results=model.faces.map(f=>{
   const [pn,ln,qn,mn]=f.cycle,p=unit(points[pn]),q=unit(points[qn]),l=unit(lines[ln]),m=unit(lines[mn]);
   const v=[dot(l,p),dot(l,q),dot(m,p),dot(m,q)];minPairing=Math.min(minPairing,...v.map(Math.abs));
   if(v.some(x=>Math.abs(x)<1e-7))throw Error('A point has reached an adjacent line: the surface theorem requires non-incidence.');
   const numerator=v[0]*v[3],denominator=v[1]*v[2],ratio=numerator/denominator;
   const residual=Math.abs(numerator-denominator)/(Math.abs(numerator)+Math.abs(denominator));
   error=Math.max(error,residual);
   return {ratio,residual,point:cross(l,m),line:cross(p,q),pairings:v};
  });
  return {results,ratios:results.map(r=>r.ratio),error,minPairing,product:results.reduce((a,r)=>a*r.ratio,1)};
 }
 function build(name,p){
  const model=models[name];if(!model)throw Error('Unknown classical example.');
  const points={},lines={},segments=[],handles=[],groups={};
  const point=(key,v,group='input',handle=null)=>{points[key]=v;groups[key]=group;if(handle)handles.push({key,...handle});return v;};
  const join=(key,a,b,group='input')=>{lines[key]=cross(points[a],points[b]);segments.push({key,a,b,group});return lines[key];};
  if(name==='desargues'){
   point('O',p.O,'center',{type:'free',path:'O'});
   ['A','B','C'].forEach((s,i)=>{
    point(s+'1',p.base[i],'first',{type:'base',i});point(s+'2',lerp(p.O,p.base[i],p.ts[i]),'second',{type:'radial',i});
    join(s.toLowerCase(),'O',s+'1','connector');
   });
   for(const [i,a,b] of [['a','B','C'],['b','A','C'],['c','A','B']]){
    join(i+'1',a+'1',b+'1','first');join(i+'2',a+'2',b+'2','second');point(i.toUpperCase(),cross(lines[i+'1'],lines[i+'2']),'conclusion');
   }
   join('axis','B','C','conclusion');
  }else if(name==='pappus'){
   point('A',p.A,'first',{type:'free',path:'A'});point('B',p.B,'second',{type:'free',path:'B'});
   [1,3,5].forEach((n,i)=>point('P'+n,p.seeds[i],'input',{type:'seed',i}));
   for(const [n,i,j] of [[2,1,3],[4,3,5],[6,5,1]])point('P'+n,cross(cross(p.A,points['P'+i]),cross(p.B,points['P'+j])));
   for(const [i,j] of [[1,2],[3,4],[5,6]])join('s'+i+j,'P'+i,'P'+j,'first');
   for(const [i,j] of [[2,3],[4,5],[6,1]])join('s'+i+j,'P'+i,'P'+j,'second');
   join('s14','P1','P4','third');join('s25','P2','P5','third');
   point('C',cross(lines.s14,lines.s25),'conclusion');join('s36','P3','P6','conclusion');
   join('a','B','C','auxiliary');join('b','A','C','auxiliary');join('c','A','B','auxiliary');
  }else{
   p.base.forEach((v,i)=>point('A'+(i+1),v,'first',{type:'base',i}));
   for(let i=1;i<=4;i++)for(let j=i+1;j<=4;j++)join('l'+i+j,'A'+i,'A'+j,'first');
   lines.h=[0,1,-p.offset];
   [1,2,3].forEach((i,k)=>{
    const v=cross(lines['l'+i+'4'],lines.h),a=affine(v);if(!a)throw Error('The section point is at infinity; move the transversal.');
    const t=p.release*[.17,-.13,.22][k];point('P'+i+'4',lerp([...a,1],p.base[3],t),'section');
   });
   for(const [i,j] of [[1,2],[1,3],[2,3]])point('P'+i+j,cross(lines['l'+i+j],cross(points['P'+i+'4'],points['P'+j+'4'])),'section');
   point('B1',p.B1,'second',{type:'free',path:'B1'});
   const p12=affine(points.P12);if(!p12)throw Error('The chosen section is at infinity.');
   point('B2',lerp(p.B1,[...p12,1],p.t),'second',{type:'b2'});
   for(const [i,j] of [[1,2],[1,3],[1,4],[2,3],[2,4]]){
    // m12 may be constructed using B1 or B2; build all from section points.
    lines['m'+i+j]=cross(points['B'+i],points['P'+i+j]);
   }
   point('B3',cross(lines.m13,lines.m23),'second');point('B4',cross(lines.m14,lines.m24),'second');
   for(const [i,j] of [[1,2],[1,3],[1,4],[2,3],[2,4]])segments.push({key:'m'+i+j,a:'B'+i,b:'B'+j,group:'second'});
   join('m34','B3','B4','conclusion');
  }
  const ev=evaluate(model,points,lines);
  if(!Number.isFinite(ev.error)||ev.error>1e-6)throw Error('The configuration is too close to a degeneracy.');
  return {name,model,points,lines,segments,handles,groups,...ev};
 }
 const tex=label=>label.replace(/^l(?=\d)/,'\\ell').replace(/([A-Za-z]+)(\d+)$/,'$1_{$2}');
 return {models,defaults,build,evaluate,metadata,orient,affine,cross,unit,lerp,pt,tex,edgeKey};
});
