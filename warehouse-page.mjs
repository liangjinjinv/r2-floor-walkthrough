import {createWarehouseRenderer} from './warehouse-render.mjs';
const $=id=>document.getElementById(id),cv=$('view'),loading=$('loading'),status=$('status'),presets=$('presets');
let view=null;
const abort=new AbortController(),moves=document.querySelectorAll('[data-move]');
for(const bt of moves){
 bt.disabled=true;
 bt.addEventListener('pointerdown',e=>{if(!view)return;e.preventDefault();bt.setPointerCapture(e.pointerId);view.setInput(bt.dataset.move,true);});
 for(const event of ['pointerup','pointercancel','lostpointercapture','blur'])bt.addEventListener(event,()=>view?.setInput(bt.dataset.move,false));
 for(const keyEvent of ['keydown','keyup'])bt.addEventListener(keyEvent,e=>{
  if(!view||(e.key!==' '&&e.key!=='Enter'))return;
  e.preventDefault();view.setInput(bt.dataset.move,keyEvent==='keydown');
 });
}
createWarehouseRenderer(cv,{
 assetUrl:'scene.json?v=112-clean',signal:abort.signal,
 onStatus:message=>status.textContent=message,
 onReady:api=>{
  view=api;
  loading.hidden=true;
  presets.replaceChildren();
  api.presets.forEach((p,i)=>{
   const btn=document.createElement('button');btn.type='button';btn.textContent=p.label||('站位 '+(i+1));
   btn.addEventListener('click',()=>{if(api.setPreset(i))api.canvas.focus({preventScroll:true});});
   presets.append(btn);
  });
  moves.forEach(b=>b.disabled=false);
  if(document.activeElement===document.body&&!matchMedia('(pointer: coarse)').matches)api.canvas.focus({preventScroll:true});
 }
}).then(api=>{view=api;}).catch(error=>{
 if(abort.signal.aborted)return;
 console.warn(error);
 loading.textContent='3D 场景没能载入。可刷新重试，或先返回一层导览。';
 status.textContent='前置仓高细节漫游尚未载入。';
});
window.addEventListener('pagehide',e=>{if(!e.persisted){abort.abort();view?.dispose();}},{once:true});
