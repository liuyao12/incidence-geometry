// Random destinations are interpolated in a regular parameter chart. The
// cube camera and selected face survive; changing geometry cancels the route.
const tour={running:false,loop:false,route:null,anchor:null,elapsed:0,last:0,steps:0,rng:W.randomSource(20260918),frame:0};
function walkMessage(text,error=false){$('walk-status').textContent=text;$('walk-status').classList.toggle('error',error);}
function walkButtons(){
 $('wander').textContent=tour.running?'Pause':tour.route?'Resume':'Wander';
 $('wander').setAttribute('aria-pressed',String(tour.running));
 $('random-target').disabled=tour.running;
}
function pauseWalk(clear=false,message=''){
 tour.running=false;tour.last=0;cancelAnimationFrame(tour.frame);tour.frame=0;
 if(clear){tour.route=null;tour.anchor=null;tour.elapsed=0;$('walk-progress').value=0;}
 walkButtons();if(message)walkMessage(message);
}
function prepareWalk(loop){
 stopPlay();cancelAnimationFrame(liftFrame);markManual();
 state.scene='journey';state.phase=3;
 if(!tour.anchor)tour.anchor=W.clone(state.p);
 try{
  tour.route=W.plan(state.p,tour.anchor,tour.rng,{lockChords:$('lock-chords').checked,amount:+$('walk-range').value});
  tour.elapsed=0;tour.last=0;tour.loop=loop;tour.running=true;walkButtons();
  const r=tour.route;
  walkMessage(`Target ${tour.steps+1}: ${r.samples} path positions screened; ${r.realContacts}/12 edges have real two-point contact. ${$('lock-chords').checked?'Seed chords and cube stay fixed.':'Weights, chords and all three couplings may move.'}`);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){
   state.p=W.clone(r.to);tour.steps++;tour.route=null;tour.running=false;$('walk-progress').value=1;walkButtons();
   walkMessage('Random target applied without animation (reduced-motion preference).');render();return true;
  }
  tour.frame=requestAnimationFrame(walkFrame);schedule();return true;
 }catch(e){pauseWalk(true);walkMessage(e.message,true);schedule();return false;}
}
function walkFrame(now){
 if(!tour.running||!tour.route)return;
 const dt=tour.last?Math.max(0,Math.min(.12,(now-tour.last)/1000)):0;tour.last=now;
 const duration=+$('walk-duration').value;
 const elapsed=Math.min(duration,tour.elapsed+dt),t=elapsed/duration,next=W.interpolate(tour.route.from,tour.route.to,t);
 try{
  const d=W.diagnose(next);
  if(d.signature!==tour.route.signature)throw Error('The live guard detected a change of real chamber.');
  // Never commit a bad intermediate state. Pause at the last accepted frame.
  state.p=next;tour.elapsed=elapsed;$('walk-progress').value=t;render();
 }catch(e){pauseWalk(true);walkMessage(`Paused at the last valid configuration: ${e.message}`,true);return;}
 if(t>=1){
  const repeat=tour.loop;tour.steps++;tour.route=null;tour.running=false;walkButtons();
  if(repeat){prepareWalk(true);return;}
  walkMessage(`Reached target ${tour.steps}. All conics were reconstructed along the path. Choose another target or Wander.`);return;
 }
 tour.frame=requestAnimationFrame(walkFrame);
}
function randomTarget(){pauseWalk(false);return prepareWalk(false);}
function wander(){
 if(tour.running){pauseWalk(false,'Paused. Resume continues the same path.');return;}
 if(tour.route){tour.running=true;tour.last=0;walkButtons();walkMessage('Continuing the screened path.');tour.frame=requestAnimationFrame(walkFrame);return;}
 prepareWalk(true);
}
$('random-target').onclick=randomTarget;$('wander').onclick=wander;
$('walk-duration').oninput=()=>{$('walk-duration-value').textContent=$('walk-duration').value+' s';};
$('lock-chords').onchange=()=>pauseWalk(true,'Exploration paused. The next target uses the new chord-lock setting.');
$('walk-range').oninput=()=>pauseWalk(true,'The next target uses the selected bounded range.');
$('walk-reseed').onclick=()=>{
 const n=Number($('walk-seed').value);
 if(!Number.isInteger(n)||n<0||n>4294967295){walkMessage('Enter an integer seed from 0 to 4294967295.',true);return;}
 pauseWalk(true);tour.rng=W.randomSource(n);tour.steps=0;walkMessage(`Random sequence reset to seed ${n}. With the same starting configuration and options, targets are reproducible.`);
};
const invariantNames=['G11','G22','G33','G12','G23','G31','ρ12','ρ23','ρ31'];
$('moduli-invariants').innerHTML=invariantNames.map((n,i)=>`<div class="modulus">${n} <span id="invariant-${i}">—</span></div>`).join('');
$('moduli-sliders').innerHTML=[0,1,2].map((i)=>`<div class="chord-row"><strong>${i+1}</strong><label>Weight <input type="range" id="weight-${i}" data-weight="${i}" min=".52" max=".965" step=".001" aria-label="Weighted chord ${i+1} strength"><output id="weight-value-${i}"></output></label><label>ρ${['12','23','31'][i]} <input type="range" id="coupling-${i}" data-coupling="${i}" min=".25" max="3" step=".005" aria-label="Face coupling ${['12','23','31'][i]}"><output id="coupling-value-${i}"></output></label></div>`).join('');
$('moduli-sliders').addEventListener('input',e=>{
 const wi=e.target.dataset.weight,ci=e.target.dataset.coupling;if(wi===undefined&&ci===undefined)return;
 pauseWalk(true);stopPlay();markManual();const p=W.clone(state.p);
 if(wi!==undefined)p.inflation[+wi]=1-(+e.target.value);else p.couplings[+ci]=+e.target.value;
 try{N.family(state.phase,p);state.p=p;walkMessage('Parameters changed. The seed chords—and therefore the linked cube—have not moved.');schedule();}
 catch(e){walkMessage(e.message,true);}
});
function updateModuliReadout(){
 const show=state.scene==='journey'&&state.phase>2.999;
 $('moduli-parameters').hidden=!show;
 if(!show)return;
 const rates=state.p.couplings||[1,1,1];
 for(let i=0;i<3;i++){
  if(document.activeElement!==$(`weight-${i}`))$(`weight-${i}`).value=1-state.p.inflation[i];
  $(`weight-value-${i}`).textContent=(1-state.p.inflation[i]).toFixed(3);
  if(document.activeElement!==$(`coupling-${i}`))$(`coupling-${i}`).value=rates[i];
  $(`coupling-value-${i}`).textContent=(1+state.p.opening*rates[i]).toFixed(3);
 }
 try{const d=W.descriptor(state.p,data?.kind==='conics'?data:undefined);d.values.forEach((v,i)=>$(`invariant-${i}`).textContent=v.toFixed(4));}
 catch{invariantNames.forEach((_,i)=>$(`invariant-${i}`).textContent='—');}
}
