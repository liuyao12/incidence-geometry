from pathlib import Path
import hashlib
root=Path('.')
p=root/'engine.js';s=p.read_text();s=s.replace("function defaults(){return {couplings:[0.35,-0.25,0.45],offsets:[0.20,0.10,-0.08],angles:[0,2.0943951023931953,4.1887902047863905],diagonal:3.5};}",'''// Chern-inspired all-ellipse plate. These independently chosen parameters
// are NOT digitized coordinates from Chern's image. A negative-definite M
// puts the three first-level conics inside q0, rather than nearly on top of it.
function defaults(preset='chern'){
 if(preset==='compact')return {couplings:[0.35,-0.25,0.45],offsets:[0.20,0.10,-0.08],angles:[0,2.0943951023931953,4.1887902047863905],diagonal:3.5};
 if(preset==='chern')return {couplings:[0.28,-0.26,0.27],offsets:[0.09,-0.10,0.14],angles:[0.20,1.45,2.45],diagonal:-0.5};
 throw new Error('Unknown conic preset');
}''');p.write_text(s)
p=root/'app.js';s=p.read_text();s=s.replace("const state={mode:'penrose',params:E.defaults()", "// Depth colors follow Chern's colored all-ellipse plate; other tabs keep their palette.\nconst PC=['#273b46','#265bad','#7e9ecf','#00897e','#4890df','#348e87','#70a49f','#c25624'];\nconst state={mode:'penrose',preset:'chern',params:E.defaults()")
a=s.index('function setupCanvas()');b=s.index('\nfunction selectedEdges()',a)
s=s[:a]+'''function setupCanvas(){
 const rect=$('stage').getBoundingClientRect();view.w=rect.width;view.h=rect.height;
 if(state.mode==='penrose'){
   // Reserve space for the combinatorial cube instead of covering the conics.
   const reserve=Math.min(140,Math.max(98,rect.width*.24));
   view.s=Math.min((rect.height-42)/2.2,(rect.width-reserve-24)/2.2)*state.zoom;
   if(state.preset==='compact')view.s*=.72;
   view.x=(rect.width-reserve)/2+8+state.pan[0];view.y=rect.height*.50+state.pan[1];
 }else{
   view.s=rect.height/(state.mode==='fomin'?5.1:state.mode==='pascal'?2.9:4.05)*state.zoom;
   view.x=rect.width*(state.mode==='pascal'?.5:.45)+state.pan[0];view.y=rect.height*.53+state.pan[1];
 }
 R.begin(view);
 if(state.mode!=='penrose'){line([1,0,0],'#cdd7d0',.65,.6);line([0,1,0],'#cdd7d0',.65,.6);}
}''' +s[b:]
a=s.index('function drawPenrose()');b=s.index('\nfunction drawFomin()',a)
s=s[:a]+'''function drawPenrose(){
 const selected=selectedEdges(),vertices=new Set(selected.flatMap(i=>E.EDGES[i]));
 // Layering reflects the four levels of the cube. The eighth is drawn last.
 [0,1,2,4,3,5,6,7].forEach(i=>{
   if(i===7&&!state.complete)return;
   const bright=vertices.size===0||vertices.has(i);
   drawConic(data.Q[i],PC[i],bright?1:.14,i===7?2.7:i===0?2.4:1.65,i===7?[7,5]:[]);
 });
 // Overview is intentionally uncluttered. Inspection reveals the relevant chords.
 if(state.chords)selected.forEach(i=>{
   const c=data.contacts[i];if(c.t===7&&!state.complete)return;
   line(c.l,'#707b8b',.65,1,[5,4]);
   if(state.selection.kind==='edge')E.lineConic(data.Q[c.s],c.l).forEach(p=>{
     point(p,PC[c.t],'',false,4);line(E.mul(data.Q[c.s],p),PC[c.t],.4,.8,[2,5]);
   });
 });
 if(state.selection.kind==='face'){
   const f=data.faces[state.selection.id];
   if(f.point&&(!E.FACES[state.selection.id].includes(7)||state.complete))point(f.point,'#a24f31','R',false,4);
 }
 if(state.envelope){const i=state.selection.kind==='edge'?data.contacts[state.selection.id].s:state.complete?7:0;R.envelope(data.Q[i],PC[i]);}
 data.p.forEach((p,i)=>point([-p[2]*p[0]-.75*p[1],-p[2]*p[1]+.75*p[0],1],PC[1<<i],`p${i+1}`,true,5,`seed:${i}`));
}''' +s[b:]
s=s.replace(":C[i],stroke:i===7?'#24723d':'#405c65'",":(state.mode==='penrose'?PC[i]:C[i]),stroke:i===7?(state.mode==='penrose'?PC[7]:'#24723d'):'#405c65'")
s=s.replace("function controls(){const mode=state.mode,sliders=mode==='penrose'?[['a12',-.9,.9,.01,state.params.couplings[0]],['a13',-.9,.9,.01,state.params.couplings[1]],['a23',-.9,.9,.01,state.params.couplings[2]]]", "function controls(){const mode=state.mode,bound=state.preset==='chern'?.45:.9,sliders=mode==='penrose'?[['a12',-bound,bound,.01,state.params.couplings[0]],['a13',-bound,bound,.01,state.params.couplings[1]],['a23',-bound,bound,.01,state.params.couplings[2]]]")
s=s.replace("const m=state.mode;$('stage').className", "const m=state.mode;$('preset-row').hidden=m!=='penrose';$('conic-preset').value=state.preset;$('penrose-legend').hidden=m!=='penrose';$('preset-note').textContent=state.preset==='chern'?'Arrangement inspired by Chern’s colored ellipse diagram; independently chosen parameters.':'Original nearly nested parameter family, kept for comparison.';$('stage').className")
s=s.replace("penrose:'Affine chart z = 1 · hollow handles move seed chords'", "penrose:'Drag p₁–p₃ · inspect an edge for its contact chord'")
s=s.replace("$('readout').innerHTML=read;", "if(m==='penrose')$('completion-key').hidden=!state.complete;\n $('readout').innerHTML=read;")
s=s.replace("state.params=E.defaults();state.five", "state.params=E.defaults(state.preset);state.five")
s=s.replace("$('inspect').onchange=", "$('conic-preset').onchange=()=>{userChange();state.preset=$('conic-preset').value;state.params=E.defaults(state.preset);state.complete=false;state.selection={kind:'all',id:0};state.pan=[0,0];state.zoom=1;controls();populateInspect();render();};\n$('inspect').onchange=")
p.write_text(s)
p=root/'ganja-view.js';s=p.read_text();s=s.replace("conic(Q,c,alpha=1,width=1.6){group(c,alpha,width,[],()=>segments(G.conicSamples(Q)));}","conic(Q,c,alpha=1,width=1.6,dash=[]){group(c,alpha,width,dash,()=>segments(G.conicSamples(Q)),dash.length?'data-conic-dash=\"true\"':'');}")
s=s.replace("host.replaceChildren(svg);host.ganjaScene=scene;",'''svg.querySelectorAll('[data-conic-dash]').forEach(g=>{
          const ls=[...g.querySelectorAll('line')];if(!ls.length)return;
          let d='',last=null;
          ls.forEach(l=>{
            const a=[+l.getAttribute('x1'),+l.getAttribute('y1')],b=[+l.getAttribute('x2'),+l.getAttribute('y2')];
            if(!last||Math.hypot(a[0]-last[0],a[1]-last[1])>1e-7)d+=`M${a[0]} ${a[1]} `;
            d+=`L${b[0]} ${b[1]} `;last=b;
          });
          const path=document.createElementNS('http://www.w3.org/2000/svg','path');
          path.setAttribute('d',d);path.setAttribute('fill','none');
          path.setAttribute('stroke',ls[0].getAttribute('stroke')||'currentColor');
          g.replaceChildren(path);
        });
        host.replaceChildren(svg);host.ganjaScene=scene;''')
p.write_text(s)
p=root/'pga.js';s=p.read_text();s=s.replace("if (ellipse) A=[...ellipse[0],1];", "if (ellipse) return (E.ellipse(Q,N)||E.ellipse(Q.map(r=>r.map(x=>-x)),N)).slice(0,-1).map(x=>point([...x,1]));");p.write_text(s)
p=root/'style.css';s=p.read_text();s+='''
/* Chern-inspired configuration: readable curve families and a separate cube. */
.preset-row{display:flex;gap:8px;align-items:center;padding:3px 13px 9px;font:10px/1.5 var(--sans);color:var(--muted)}
.preset-row label{display:flex;align-items:center;gap:5px;white-space:nowrap}.preset-row select{font:11px var(--sans);padding:4px;border:1px solid var(--line);border-radius:4px;background:white;color:var(--ink)}
.preset-row a{margin-left:auto;font-size:10px;white-space:nowrap}.penrose-legend{display:flex;gap:8px;flex-wrap:wrap;padding:8px 13px 3px;font:10px/1.5 var(--sans);color:var(--muted)}
.penrose-legend span{display:inline-flex;gap:4px;align-items:center}.penrose-legend i{display:inline-block;width:15px;height:0;border-top:2px solid}.penrose-legend .outer{border-color:#273b46}.penrose-legend .first{border-color:#265bad}.penrose-legend .second{border-color:#348e87}.penrose-legend .eighth{border-color:#c25624;border-top-style:dashed}
.preset-note{font:10px/1.5 var(--sans);color:var(--muted);margin:2px 13px 6px}.stage.penrose #cube{width:clamp(88px,24%,130px);height:auto;top:12px;right:8px}.stage.penrose{height:340px}
@media(max-width:450px){.stage.penrose{height:290px}.preset-row{flex-wrap:wrap}.stage.penrose .stage-label{font-size:9px;max-width:95%}.penrose-legend{gap:5px 9px}}
''';p.write_text(s)
p=root/'index.html';s=p.read_text();s=s.replace('<div id="controls" class="controls"></div>', '''<div id="preset-row" class="preset-row"><label>Arrangement <select id="conic-preset" aria-label="Conic arrangement"><option value="chern">Chern-inspired ellipses</option><option value="compact">Original compact</option></select></label><a href="https://cseweb.ucsd.edu/~alchern/projects/Penrose/PenroseDGS2024.pdf#page=12" target="_blank" rel="noopener noreferrer">Reference diagram ↗</a></div>
<div id="controls" class="controls"></div>
<div id="penrose-legend"><div class="penrose-legend"><span><i class="outer"></i>Base</span><span><i class="first"></i>1, 2, 3</span><span><i class="second"></i>12, 13, 23</span><span id="completion-key" hidden><i class="eighth"></i>123</span></div><p id="preset-note" class="preset-note"></p></div>''')
s=s.replace('The sliders change M’s off-diagonal entries; the hollow handles change the constant terms of the three seed chords. The base conic is the unit circle. All eight curves are recomputed from the same parameters.', 'The default arrangement is inspired by <a href="https://cseweb.ucsd.edu/~alchern/projects/Penrose/PenroseDGS2024.pdf#page=12">Albert Chern’s colored all-ellipse diagram</a>: a dark outer conic, three elongated blue conics, three green conics, and an orange dashed completion. The numerical parameters are chosen independently, not transcribed from the image. The sliders change M’s off-diagonal entries; the hollow handles move the seed chords. Every curve is recomputed from the same matrix, so the contacts are preserved. The original compact arrangement is retained in the selector.');p.write_text(s)
p=root/'test.cjs';p.write_text(p.read_text().replace('const p=E.defaults();',"const p=E.defaults('compact');"))
p=root/'test-ganja.cjs';p.write_text(p.read_text().replace('const params=E.defaults();',"const params=E.defaults('compact');"))
p=root/'.github/workflows/ci.yml';s=p.read_text().replace('node test-ganja.cjs','node test-ganja.cjs\n          node test-chern.cjs');p.write_text(s)
p=root/'scripts/browser_smoke.py';s=p.read_text()
s=s.replace("assert page.locator('#ganja-svg line').count()>100",'''assert page.locator('#ganja-svg line').count()>100
    assert page.locator('#conic-preset').input_value()=='chern'
    assert page.evaluate('incidenceApp.state.params.diagonal')<0
    assert page.locator('#ganja-svg [data-conic-dash]').count()==0
    page.locator('#complete').click()
    assert page.locator('#ganja-svg [data-conic-dash] path').count()==1
    assert page.locator('#completion-key').is_visible()
    page.locator('#demo').screenshot(path=str(ROOT/'chern-eight-preview.png'))
    page.locator('#conic-preset').select_option('compact')
    assert page.evaluate('incidenceApp.state.params.diagonal')==3.5
    assert not page.evaluate('incidenceApp.state.complete')
    page.locator('#reset').click()
    assert page.locator('#conic-preset').input_value()=='compact'
    page.locator('#conic-preset').select_option('chern')
    assert page.evaluate('incidenceApp.getData().minMinor')>0
    results.append('Chern-inspired and original presets; reset preserves selection; eighth conic has continuous dashes')''')
s=s.replace("page.evaluate(\"incidenceApp.setMode('pascal',true)\")",'''page.evaluate("incidenceApp.setMode('penrose',true);incidenceApp.state.complete=true;incidenceApp.render()")
    page.locator('#demo').scroll_into_view_if_needed()
    page.locator('#demo').screenshot(path=str(ROOT/'chern-mobile-preview.png'))
    assert page.locator('#ganja-svg [data-conic-dash] path').count()==1
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
    page.evaluate("incidenceApp.setMode('pascal',true)")''');p.write_text(s)
p=root/'README.md';s=p.read_text();s+='''

## Chern-inspired arrangement

The default **Conics** preset follows the visual organization of Albert Chern's
[colored all-ellipse plate (PDF page 12)](https://cseweb.ucsd.edu/~alchern/projects/Penrose/PenroseDGS2024.pdf#page=12):
a dark enclosing conic, three elongated blue conics, three green conics and a
dashed orange completion. These are independently chosen parameters, not an
image trace or Chern's original numerical data. The reference image itself is
not bundled. The original compact positive-diagonal preset remains available.

`engine.defaults('chern')` uses diagonal −0.5, off-diagonals (0.28, −0.26, 0.27),
chord-normal angles (0.20, 1.45, 2.45) radians and offsets (0.09, −0.10, 0.14).
Every curve is generated from the same symmetric matrix. It is negative definite
at the preset, with independent chord forms: all twelve edge contacts are real
and all eight conics are nonsingular ellipses. No curve is translated or resized
independently. Arbitrary slider changes may leave this all-ellipse regime.

The viewport reserves space for the miniature cube. Contact chords and tangents
appear on inspection rather than cluttering the default overview. Ellipses use
uniform angular sampling; unbounded conics retain homogeneous branch splitting.
The dashed eighth conic combines contiguous ganja-generated SVG segments so the
dash pattern does not restart at every sample.

`node test-chern.cjs` checks this preset and 125 nearby configurations separately
from the original randomized family. UI regression tests cover both presets,
reset behavior, the dashed curve and the mobile layout. The Lean files and formal
coverage are unchanged by this display update.
''';p.write_text(s)
# Assert byte equality with the independently tested local files before publishing.
expected={
 'engine.js':'91844bde702b543506bb0df4643ee059fdd6eea2e410fcd0d7858d1f27310569',
 'app.js':'7eae5419dcd04d4ac7b1517da671bad08b78bd9400bbd202b6c26f4a1286fb4d',
 'ganja-view.js':'fb90b4f90660451840b572cfbb25899036839afa231cca3a1d5f2712e973a3c3',
 'pga.js':'c35eea7f2e66273c464da60ddb0ad0d5f88c9ac67b1762b6f6ecbf35c956bb01',
 'style.css':'171c0ca927bd791d75768dd76942952f94410a7b4e6ca6f7b3a40a96e6507714',
 'index.html':'5726d947674548fd65f76a8326d2ac22844ebbd41e33d358f5708195e4d986b4',
 'test.cjs':'1b13a6ba4f33fe79424799506f32a8ef5c442b51f6b49df62ea528943a4bbc63',
 'test-ganja.cjs':'bd337645768334277381772880daffea066b28ddf6c4f04802c1af4cdb488dc5',
 'scripts/browser_smoke.py':'7f913773677e852e67cbee5a8bf0366b1fba902d300d4db38d563088e63b1381',
 'README.md':'90c0a277ac72bddf1a673527cb3dce0a20e92dd25b0a774498785a0c5af83181',
 '.github/workflows/ci.yml':'8c6682d88ed6a830326541461255e32257802f4581e1cb8eac2df318d464e174'}
for name,digest in expected.items():
 assert hashlib.sha256((root/name).read_bytes()).hexdigest()==digest, name
print('All generated files match the tested versions.')
