from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
from pathlib import Path
p=ROOT/'narrative-math.js'
s=p.read_text()
s=s.replace('inflation:[.17,.12,.21],opening:.12','inflation:[.17,.12,.21],opening:.12,couplings:[1,1,1]')
s=s.replace("  if([...p.u,...p.v].some", "  if(p.couplings&&(!Array.isArray(p.couplings)||p.couplings.length!==3||!p.couplings.every(Number.isFinite)))throw Error('Invalid face couplings.');\n  if(!Number.isFinite(p.opening))throw Error('Invalid cube opening.');\n  if([...p.u,...p.v].some")
start=s.index('  pairIndices.forEach(([i,j],k)=>{\n    R[masks[k]]')
end=s.index('  const meetings=pairIndices.map',start)
s=s[:start]+'''  // Independent pair couplings (12,23,31). Equal values recover the original
  // narrative path; all three still tend to one at the Salmon boundary.
  const [a,c,b]=p.couplings||[1,1,1], z=open;
  const rates=[[0,a,b],[a,0,c],[b,c,0]], M=rates.map((row,i)=>row.map((r,j)=>i===j?1:1+z*r));
  pairIndices.forEach(([i,j],k)=>{
    const mij=M[i][j];
    R[masks[k]]=matrixAdd(matrixScale(Q0,1-mij*mij),matrixAdd(matrixScale(matrixAdd(outer(P[i]),outer(P[j])),-1),matrixScale(matrixAdd(outer(P[i],P[j]),outer(P[j],P[i])),mij)));
  });
  // Divide the bordered 4x4 determinant by its common factor z SYMBOLICALLY.
  // det(M)/z = z * (2(ab+ac+bc)-a²-b²-c² + 2zabc).
  // This is valid for unequal couplings and does not divide numerically near z=0.
  const K=2*(a*b+a*c+b*c)-a*a-b*b-c*c, opposite=[c,b,a];
  R[7]=matrixScale(Q0,z*(K+2*z*a*b*c));
  P.forEach((v,i)=>R[7]=matrixAdd(R[7],matrixScale(outer(v),2*opposite[i]+z*opposite[i]*opposite[i])));
  pairIndices.forEach(([i,j])=>{
    const k=3-i-j, coefficient=rates[i][k]+rates[j][k]-rates[i][j]+z*rates[i][k]*rates[j][k];
    R[7]=matrixAdd(R[7],matrixScale(matrixAdd(outer(P[i],P[j]),outer(P[j],P[i])),-coefficient));
  });
''' + s[end:]
s=s.replace('else if(ids.length===1)l=sub(P[k],scale(P[ids[0]],rho));\n    else l=sub(scale(P[k],rho+1),scale(add(P[ids[0]],P[ids[1]]),rho));','''else if(ids.length===1)l=sub(P[k],scale(P[ids[0]],M[k][ids[0]]));
    else {
      const [i,j]=ids,h=rates[i][j],b=rates[i][k],c=rates[j][k];
      // The top-edge linear minor also has the common factor -z.
      l=add(scale(P[k],2*h+z*h*h),add(scale(P[i],b-h-c-z*h*c),scale(P[j],c-h-b-z*h*b)));
    }''')
s=s.replace("inflate,open,rho,p:P,dual", "inflate,open,rho,M,p:P,dual")
s=s.replace('const M=identity3().map((r,i)=>r.map((_,j)=>i===j?1:F.rho));','const M=F.M;')
p.write_text(s)
from pathlib import Path
root=ROOT
p=root/'index.html';s=p.read_text()
s=s.replace('<script defer src="story.js"></script>','<script defer src="moduli.js"></script><script defer src="story.js"></script>')
# Verify asset spelling before writing.
assert 'src="moduli.js"' in s
controls='''<section class="moduli-controls" aria-label="Random exploration of Penrose configurations">
<div class="moduli-actions"><button id="random-target" type="button">Random target</button><button id="wander" type="button" aria-pressed="false">Wander</button><a href="#moduli">About the moduli</a></div>
<div class="moduli-settings"><label><input id="lock-chords" type="checkbox"> Keep seed chords fixed</label><label>Travel <input id="walk-duration" type="range" min="3" max="18" step="1" value="7" aria-label="Seconds per random transition"><output id="walk-duration-value">7 s</output></label></div>
<progress id="walk-progress" value="0" max="1" aria-label="Progress to the random target"></progress>
<p id="walk-status" role="status">Starts at Penrose. Samples a bounded real chart; not a uniform distribution on moduli space.</p>
<details class="moduli-settings-more"><summary>Exploration range and seed</summary><label>Range <input id="walk-range" type="range" min=".25" max="1.75" step=".05" value="1" aria-label="Random exploration range"></label><label>Seed <input id="walk-seed" type="number" min="0" max="4294967295" step="1" value="20260918"></label><button id="walk-reseed" type="button">Apply seed</button><p>Changing a geometric control pauses the walk. Face selection and either camera remain usable while it moves. Routes are numerically screened and guarded while playing, not formally certified.</p></details>
</section>'''
s=s.replace('<div id="spatial-controls" hidden>',controls+'<div id="spatial-controls" hidden>')
# section controls live outside journey div, explicitly hide in spatial view
s=s.replace('class="moduli-controls" aria-label','id="moduli-controls" class="moduli-controls" aria-label')
advanced='''<details id="moduli-parameters" class="chord-controls"><summary>Three weights and three face couplings</summary><div id="moduli-sliders"></div><p>The carrier is fixed. Weights change the neighboring conics without moving the seed chords. The couplings 12, 23, 31 are independent; equal values recover the original narrative path.</p><div id="moduli-invariants" class="moduli-invariants" aria-label="Nine regular-chart invariant coordinates"></div><p class="invariant-note">Six weighted-chord Gram entries + three couplings. These classify this regular chart up to carrier-preserving projective changes and finite sign choices; the cube’s Euclidean angles do not.</p></details>'''
s=s.replace('</section><p id="story-readout"',advanced+'</section><p id="story-readout"')
s=s.replace('Our path uses a scalar block with diagonal entries 1 and equal off-diagonal entries ρ. Salmon is the rank-one value ρ = 1; moving ρ above 1 opens the remaining objects.', 'The original narrative path uses diagonal entries 1 and equal off-diagonal entries ρ. Salmon is the rank-one value ρ = 1. The explorer also allows three independent couplings ρ₁₂, ρ₂₃, ρ₃₁, all tending to 1 at Salmon; the same minor formulas construct the whole cube.')
article='''<section id="moduli" data-scene="journey" data-fixed-phase="3"><p class="chapter-number">08b / Moving through configurations</p><h2>Nine moduli.<br>Not just a cuboid.</h2><p>The paper describes a 17-parameter family: five parameters for a base conic, nine for three weighted chord forms, and three scalar couplings. For generic labeled configurations, quotienting by the eight-dimensional projective group leaves <strong>nine continuous moduli</strong>. This dimension count applies to the regular locus, not to every singular stratum.</p><p>Fixing the carrier to a circle leaves twelve parameters before quotienting by its three-dimensional projective stabilizer. This explorer varies all twelve: the six seed positions, three weights and three independent couplings. It covers a bounded part of one real chart, not every configuration or every real component.</p><p><strong>Random target</strong> chooses a new configuration and moves smoothly to it. <strong>Wander</strong> repeats that process. Every intermediate frame is recomputed from the determinantal construction, so contact and face concurrence are not imposed by blending drawings. Candidate paths and displayed frames are numerically screened for singular conics, collapsed chords and changes in the real-contact pattern. This is not a kernel-checked path certificate.</p><p class="try">Check <strong>Keep seed chords fixed</strong>, then choose a random target: the conics move while the cuboid stays exactly the same. This exhibits the information that the cuboid does not encode.</p><p>In the normalized matrix chart, the six entries of the weighted-chord Gram matrix G = P J⁻¹ Pᵀ, together with the three off-diagonal entries of M, give nine coordinates, up to finite sign choices. The advanced controls show them. There is no canonical uniform distribution on the whole noncompact parameter space; this demonstration uses a seeded, bounded proposal distribution and rejects unsafe routes.</p><p class="source-line"><a href="https://arxiv.org/html/2409.17150v8#S6">Paper §6 ↗</a> · <a href="https://arxiv.org/html/2409.17150v8#S9">Paper §9 ↗</a> · <a href="MODULI.md">Chart, dimension count and sampling details</a></p></section>'''
s=s.replace('<section id="formalization"',article+'<section id="formalization"')
p.write_text(s)
# CSS small enough to preserve earlier responsiveness
p=root/'narrative.css';s=p.read_text()+'''
/* Bounded Penrose-chart exploration. Controls stay separate from both cameras. */
.moduli-controls{padding:9px 14px;border-top:1px solid #dbe3de;background:#f3f6f0;font:11px/1.5 system-ui,sans-serif}
.moduli-actions{display:flex;gap:8px;align-items:center}.moduli-actions button{font:11px system-ui;padding:6px 10px}.moduli-actions button[aria-pressed=true]{background:#23695d;color:white}.moduli-actions a{font-size:10px;margin-left:auto}
.moduli-settings{display:flex;align-items:center;gap:10px;justify-content:space-between;margin-top:8px}.moduli-settings label{display:flex;align-items:center;gap:5px;font-size:10px}.moduli-settings input[type=range]{width:75px}.moduli-settings output{min-width:25px;font-variant-numeric:tabular-nums}
#walk-progress{display:block;width:100%;height:4px;margin:8px 0;accent-color:#286f63}#walk-status{margin:3px 0;color:#61736c;font-size:10px;min-height:28px}#walk-status.error{color:#984027}.moduli-settings-more{font-size:10px;margin-top:3px}.moduli-settings-more label{display:inline-flex;gap:5px;align-items:center;margin:8px 9px 0 0}.moduli-settings-more input[type=range]{width:100px}.moduli-settings-more input[type=number]{width:98px;font:11px ui-monospace,monospace}.moduli-settings-more p{margin:7px 0 0;color:#61736c;font-size:10px}
#moduli-sliders .chord-row{grid-template-columns:30px 1fr 1fr}#moduli-parameters p{font:10px/1.65 system-ui;margin:7px 0;color:#61736c}.moduli-invariants{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;margin-top:8px}.modulus{background:#f1f5ef;font:10px/1.6 ui-monospace,monospace;padding:4px;white-space:nowrap}.modulus span{font-variant-numeric:tabular-nums}.invariant-note{font-size:9px!important}
@media(max-width:450px){.moduli-controls{padding:8px 10px}.moduli-settings{gap:4px}.moduli-settings label{font-size:9px}.moduli-settings input[type=range]{width:62px}.moduli-actions a{font-size:9px}.modulus{font-size:9px}}
''';p.write_text(s)
from pathlib import Path
p=ROOT/'story.js';s=p.read_text()
s=s.replace('N=window.IncidenceNarrative,$=', 'N=window.IncidenceNarrative,W=window.IncidenceModuli,$=')
s=s.replace("function setPhase(t,manual=true){cancelAnimationFrame", "function setPhase(t,manual=true){pauseWalk(true);cancelAnimationFrame")
s=s.replace("function setScene(scene,manual=true){if(!['journey'", "function setScene(scene,manual=true){pauseWalk(true);if(!['journey'")
s=s.replace("$('journey-controls').hidden=space;", "$('moduli-controls').hidden=space;$('journey-controls').hidden=space;")
s=s.replace(" host.dataset.scene=state.scene;host.dataset.phase=state.phase.toFixed(5);", " host.dataset.scene=state.scene;host.dataset.phase=state.phase.toFixed(5);updateModuliReadout();")
s=s.replace("function editChord(i,angle,distance){\n markManual();stopPlay();", "function editChord(i,angle,distance){\n pauseWalk(true);markManual();stopPlay();")
s=s.replace("$('play-journey').onclick=()=>{if(state.playing)", "$('play-journey').onclick=()=>{pauseWalk(true);if(state.playing)")
s=s.replace("$('seed-u').oninput=e=>{markManual();", "$('seed-u').oninput=e=>{pauseWalk(true);markManual();")
s=s.replace("$('reset-seeds').onclick=()=>{markManual();", "$('reset-seeds').onclick=()=>{pauseWalk(true);markManual();")
s=s.replace("function seedMove(handle,clientX,clientY){\n", "function seedMove(handle,clientX,clientY){\n pauseWalk(true);stopPlay();\n")
# No concurrent edits from pointer handles: stop as soon as the pointer goes down.
s=s.replace("const h=e.target.closest('[data-handle]');drag=", "const h=e.target.closest('[data-handle]');if(h){pauseWalk(true);stopPlay();}drag=")
s=s.replace("document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlay();});", "document.addEventListener('visibilitychange',()=>{if(document.hidden){stopPlay();if(tour.running)pauseWalk(false,'Paused while the page was hidden. Resume continues the same path.');}});")
# Tour functions must be initialized before the first render and ResizeObserver callback.
insertion=(ROOT/'scripts/_moduli_tour.js').read_text()
s=s.replace("window.incidenceStory={", insertion+"\nwindow.incidenceStory={")
s=s.replace("cube,editChord};", "cube,editChord,tour,randomTarget,wander,pauseWalk};")
p.write_text(s)

p=ROOT/'index.html';s=p.read_text().replace('id="moduli-parameters" class="chord-controls"','id="moduli-parameters" class="moduli-parameter-controls"');p.write_text(s)
p=ROOT/'narrative.css';s=p.read_text();s+='\n.moduli-parameter-controls{padding:8px 0;border-top:1px solid #dbe3de;font:11px/1.5 system-ui,sans-serif}.moduli-parameter-controls summary{cursor:pointer}\n';p.write_text(s)
p=ROOT/'story.js';s=p.read_text().replace("elapsed:0,last:0,steps:0", "progress:0,last:0,steps:0").replace("tour.elapsed=0", "tour.progress=0")
s=s.replace("const elapsed=Math.min(duration,tour.elapsed+dt),t=elapsed/duration,next=W.interpolate", "const t=Math.min(1,tour.progress+dt/duration),next=W.interpolate").replace("tour.elapsed=elapsed", "tour.progress=t")
s=s.replace("if(!state.follow)return;const oldScene=state.scene;", "if(!state.follow)return;pauseWalk(true);const oldScene=state.scene;")
s=s.replace("e.preventDefault();markManual();const [kind,i,j]", "e.preventDefault();pauseWalk(true);stopPlay();markManual();const [kind,i,j]")
p.write_text(s)
p=ROOT/'README.md';s=p.read_text();s+='\n## Random exploration of Penrose configurations\n\nThe main page now has **Random target**, **Wander**, pause/resume, and a **Keep seed chords fixed** option. The latter moves the conics without changing the linked cuboid. Three weights and three independent face couplings are exposed, along with nine regular-chart invariant coordinates. The path is numerically screened, not formally certified or uniformly sampled from the whole moduli space. See [MODULI.md](MODULI.md) for the 17/12/9 parameter counts, the chart, and sampling limitations.\n\nRun `node test-moduli.cjs` and `python scripts/browser_moduli.py --serve` for the added tests.\n';p.write_text(s)
p=ROOT/'NARRATIVE.md';s=p.read_text();s+='\n## Moduli explorer extension\n\nThe original equal-coupling narrative is retained as the default. Random exploration and the advanced controls now vary all three scalar couplings independently, as well as the weighted seeds. All three couplings converge to one at the Salmon stage. See [MODULI.md](MODULI.md) for the division-free top-conic formula and the distinction between a cuboid, a 12-parameter fixed-carrier chart, and nine generic projective moduli.\n';p.write_text(s)
p=ROOT/'.github/workflows/ci.yml';s=p.read_text().replace('          node test-narrative.cjs','          node test-narrative.cjs\n          node test-moduli.cjs').replace('          python scripts/browser_narrative.py --serve','          python scripts/browser_narrative.py --serve\n          python scripts/browser_moduli.py --serve').replace('            narrative-test-results.json','            moduli-test-results.json\n            moduli-browser-test-results.json\n            moduli-preview.png\n            moduli-mobile-preview.png\n            narrative-test-results.json');p.write_text(s)

import hashlib
expected={
  "index.html": "d07c06a93ebaa7ab4fad6b193f8344bd3d378527",
  "narrative.css": "25d155c9e1560d19316b72d1f05cb5d8c89f88fa",
  "narrative-math.js": "5c716d51753a7c6b5fef5a9ca5158948f991e8a0",
  "story.js": "f91ca799ed4ee271a94e46bc81a2a316bc4e9116",
  "MODULI.md": "ab3449d39cb0beada22596947f6428f5416d1ce2",
  "moduli.js": "f7217cf042a89f1831fe8b1a57a24427a609745c",
  "test-moduli.cjs": "9136bedf1db1aa2b547abd6348d15f89dad6860e",
  "scripts/browser_moduli.py": "b4bb4b0818991a1cd2466f9c2a1f9b5da0112ade",
  "README.md": "ccc0059ccb781010874cd08b7e44be3445d86441",
  "NARRATIVE.md": "8fcea865b79dbbe1f5a7bd644fbac3da900bb3d8",
  ".github/workflows/ci.yml": "e2e1ba056476820ce81220380dc3fda99f93b7bf",
  "moduli-test-results.json": "eb7cf175198fe98206c8274b6de598c08aaa95b3"
}
for name,h in expected.items():
    if name=="moduli-test-results.json": continue
    data=(ROOT/name).read_bytes();actual=hashlib.sha1(f"blob {len(data)}\0".encode()+data).hexdigest()
    assert actual==h,(name,actual,h)
print("All release source hashes agree with the locally tested files.")
