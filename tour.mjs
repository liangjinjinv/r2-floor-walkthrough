import {walls as tracedWalls,route,stops} from './arch.mjs';
import {props} from './props.mjs';
import {finishes} from './finish.mjs';
import {makeCafeProp} from './cafe.mjs';
import {addCafeFinish,cafeStops} from './cafe-finish.mjs?v=r2-clear-glass';
import {addZoneSurfaces} from './zone-surfaces.mjs?v=r2-clear-glass';
import {makeZoneProp} from './zone-props.mjs';
import {zoneViews} from './zone-views.mjs';
import {addZoneLights,makeZoneTint} from './zone-light.mjs';
import {BOX_LIMIT,createDetailWorld,maskCode,maskSetup} from './unified-detail.mjs?v=r2-clear-glass';
import {createUnifiedCPU,makeUnifiedBaseMeshes} from './unified-cpu.mjs?v=r2-clear-glass';
import {applyGlassWalls} from './glass-walls.mjs?v=r2-clear-glass';
const $=x=>document.getElementById(x),cv=$('view'),gl=cv.getContext('webgl',{antialias:true,alpha:false});
const walls=applyGlassWalls(tracedWalls);
const sc=8.4/101,xyz=(x,y,h=0)=>[(x-395)*sc,h,(y-785)*sc];
const rgb=c=>[(c>>16)/255,(c>>8&255)/255,(c&255)/255];
const solid=[],trans=[],faces=[],ceiling=[],ceilingFaces=[],essential=[];
let keepPlanLeaf=false;
function face(g,q,c,a,f){const cl=rgb(c).map(k=>k*f);faces.push([q,cl,a]);for(const n of [0,1,2,0,2,3])g.push(...q[n],...cl,a)}
function box(x,y,w,d,h,z,c,ang=0,a=1){
 if(w<.001||d<.001)return;
 const g=a<1?trans:keepPlanLeaf?essential:solid,co=Math.cos(ang),si=Math.sin(ang),p=xyz(x,y,z),v=[[-1,0,-1],[1,0,-1],[1,0,1],[-1,0,1],[-1,1,-1],[1,1,-1],[1,1,1],[-1,1,1]].map(([u,b,j])=>[p[0]+(u*w*co-j*d*si)/2,z+b*h,p[2]+(u*w*si+j*d*co)/2]);
 const shade=[[0,1,5,4,.83],[1,2,6,5,.72],[2,3,7,6,.88],[3,0,4,7,.8],[4,5,6,7,1],[0,3,2,1,.72]];
 const useSlices=h<3&&((x>370.5&&x<468&&y>729&&y<841)||(x>570&&x<615&&y>1018&&y<1030));
 for(const [i,j,k,l,f] of shade){
  const q=[v[i],v[j],v[k],v[l]],cl=rgb(c).map(k=>k*f);
  for(const n of [i,j,k,i,k,l])g.push(...v[n],...cl,a);
  const dist=(u,t)=>Math.hypot(u[0]-t[0],u[1]-t[1],u[2]-t[2]),nx=useSlices?Math.ceil(dist(q[0],q[1])/.23):1,ny=useSlices&&h<.14?Math.ceil(dist(q[0],q[3])/.20):1;
  if(nx===1&&ny===1){faces.push([q,cl,a]);continue;}
  const lerp=(u,t,b)=>u.map((x,j)=>x+(t[j]-x)*b);
  for(let u=0;u<nx;u++){const a0=u/nx,a1=(u+1)/nx,p0=lerp(q[0],q[1],a0),p1=lerp(q[0],q[1],a1),p2=lerp(q[3],q[2],a1),p3=lerp(q[3],q[2],a0);for(let k=0;k<ny;k++){const b0=k/ny,b1=(k+1)/ny;faces.push([[lerp(p0,p3,b0),lerp(p1,p2,b0),lerp(p1,p2,b1),lerp(p0,p3,b1)],cl,a]);}}
 }
}
function roof(q,c){const cl=rgb(c);ceilingFaces.push([q,cl,1]);for(const n of [0,1,2,0,2,3])ceiling.push(...q[n],...cl,1);}

function round(x,y,rx,rz,h,z,col,ang=0,n=12){
 const p=xyz(x,y,z), ring=(j,b)=>{const t=(j%n)*2*Math.PI/n,u=rx*Math.cos(t),v=rz*Math.sin(t);return [p[0]+u*Math.cos(ang)-v*Math.sin(ang),z+b*h,p[2]+u*Math.sin(ang)+v*Math.cos(ang)]};
 for(let j=0;j<n;j++){const a=ring(j,0),b=ring(j+1,0),c=ring(j+1,1),d=ring(j,1);
  face(solid,[a,b,c,d],col,1,.79+.13*Math.cos(j*2*Math.PI/n+.65));
 }
 const top=Array.from({length:n},(_,j)=>ring(j,1)),cl=rgb(col);faces.push([top,cl,1]);for(let j=1;j<n-1;j++)for(const r of [top[0],top[j],top[j+1]])solid.push(...r,...cl,1);
}
function line(x,y,X,Y,h,z,c,d=.17,a=1){box((x+X)/2,(y+Y)/2,Math.hypot(X-x,Y-y)*sc,d,h,z,c,Math.atan2(Y-y,X-x),a)}
const regions=[
 [52,172,634,400,0xbfc5bf],[53,578,206,262,0xecdbc0],[262,578,250,262,0xf1d6cf],[515,625,100,215,0xc2c6bf],
 [53,844,509,201,0xdfe5c8],[52,1086,281,247,0xc5dfcc],[333,1086,229,126,0xcce2ce],[334,1212,230,122,0xc3ded8],
 [565,1087,101,246,0xc9cfc8],[709,173,55,354,0xc8d9df],[708,939,55,395,0xc8d9df],[566,845,48,201,0xd9e8df],[615,937,91,112,0xd9e8df],
 [662,526,103,410,0xe9d3cc],[52,1333,283,78,0xe8d8d1]];
box(394,786,794*sc,1260*sc,.21,-.22,0xd7d8cb);
regions.forEach(([x,y,w,d,c],i)=>box(x+w/2,y+d/2,w*sc,d*sc,.007,.002+i*.0005,c));
for(const [x,y,X,Y,k,leafMode,side=1] of walls){
 const len=Math.hypot(X-x,Y-y),a=Math.atan2(Y-y,X-x),cx=(x+X)/2,cy=(y+Y)/2;
 if(k==='wall')line(x,y,X,Y,2.95,0,0xeae9df,.21);
 else if(k==='review-glass'||k==='review-rail'){
  const isGlass=k==='review-glass',H=isGlass?(leafMode??2.95):1.05,metal=0x526462,parts=Math.max(1,Math.ceil(len/(isGlass?21:13)));
  if(isGlass){
   const pane=[xyz(x,y,.035),xyz(X,Y,.035),xyz(X,Y,H-.03),xyz(x,y,H-.03)];
   face(trans,pane,0xa0c5c3,.14,1);
  }
  keepPlanLeaf=true;
  for(const z of isGlass?[.025,H-.034]:[.12,.58,1.01])line(x,y,X,Y,.034,z,metal,.033);
  for(let n=0;n<=parts;n++){const t=n/parts;box(x+(X-x)*t,y+(Y-y)*t,.035,.045,H,0,metal);}
  keepPlanLeaf=false;
 }
 else if(k==='window'){
  const sill=.93, top=2.26, frame=0x395960;
  line(x,y,X,Y,sill,0,0xeae9df,.22);
  line(x,y,X,Y,2.95-top,top,0xeae9df,.22);
  line(x,y,X,Y,.078,sill-.033,frame,.24);
  line(x,y,X,Y,.076,top-.04,frame,.11);
  line(x,y,X,Y,top-sill-.07,sill+.04,0x8eb9cd,.045,.25);
  const N=Math.max(2,Math.ceil(len/17));
  for(let i=0;i<=N;i++){const t=i/N;box(x+(X-x)*t,y+(Y-y)*t,.072,.072,top-sill,sill,frame)}
 }else if(k==='glass'){
  line(x,y,X,Y,2.55,.04,0x85cbd8,.038,.28);
  for(let j=0;j<=Math.ceil(len/21);j++){const f=j/Math.ceil(len/21);box(x+(X-x)*f,y+(Y-y)*f,.07,.07,2.64,0,0x385b60);}
  line(x,y,X,Y,.056,2.56,0x385b60,.075);line(x,y,X,Y,.056,.04,0x385b60,.075);
 }else if(k==='glass-door'||k==='solid-door'){
  const glass=k==='glass-door', known=glass||leafMode==='double', frame=glass?0x315861:known?0x806250:0x7d837e,leaf=glass?0x76c6d3:0xa97a5b, w=len*sc;
  // Unconfirmed openings retain jambs only; no assumption that a door leaf is opaque or glazed.
  if(!known){box(x,y,.062,.065,2.17,0,frame);box(X,Y,.062,.065,2.17,0,frame);line(x,y,X,Y,.07,2.10,frame,.082);continue;}
  box(x,y,.085,.085,2.2,0,frame);box(X,Y,.085,.085,2.2,0,frame);line(x,y,X,Y,.09,2.14,frame,.11);
  if(glass){
   // The R2 callouts identify electric glass doors; leave the center travel lane open.
   const vx=(X-x)/len,vy=(Y-y)/len, ox=-vy*1.5,oy=vx*1.5;
   for(const [px,py,sgn] of [[x,y,-1],[X,Y,1]]){
    line(px+ox,py+oy,px+sgn*vx*len*.46+ox,py+sgn*vy*len*.46+oy,2.03,.06,leaf,.035,.22);
    box(px+ox,py+oy,.054,.055,2.08,.04,frame);
    line(px+ox,py+oy,px+sgn*vx*len*.46+ox,py+sgn*vy*len*.46+oy,.04,.06,frame,.04);
   }
   continue;
  }
  if(leafMode==='double'){
   keepPlanLeaf=x===94&&(y===1045||y===1083);
   for(const [px,py,sgn] of [[x,y,1],[X,Y,-1]]){
    const o=a+Math.PI*.48*side*sgn+(sgn===1?0:Math.PI), L=len*.47, fx=px+Math.cos(o)*L/2,fy=py+Math.sin(o)*L/2;
    box(fx,fy,L*sc,.058,2.07,.041,leaf,o);
    box(px+Math.cos(o)*L*.86,py+Math.sin(o)*L*.86,.105,.12,.053,1.03,0x314346,o);
   }
   keepPlanLeaf=false;
   continue;
  }
  // Door leaf shown open, with a visible edge and handle.
  const o=a+Math.PI*.48,fx=x+Math.cos(o)*len*.40,fy=y+Math.sin(o)*len*.40;
  box(fx,fy,.81*w,.055,2.07,.048,leaf,o,glass?.30:1);
  box(x+Math.cos(o)*len*.80,y+Math.sin(o)*len*.80,.042,.085,2.1,.04,frame,o);
  box(x+Math.cos(o)*len*.72,y+Math.sin(o)*len*.72,.13,.14,.05,1.02,0x314346,o);
 }
}
keepPlanLeaf=true; // Keep the original route marking over upgraded floors.
for(let j=0;j<route.length-1;j++){
 const [x,y]=route[j],[X,Y]=route[j+1],d=Math.hypot(X-x,Y-y),ang=Math.atan2(Y-y,X-x);
 for(let t=0;t<d;t+=6){const len=Math.min(3.6,d-t);box(x+Math.cos(ang)*(t+len/2),y+Math.sin(ang)*(t+len/2),len*sc,.13,.015,.023,0xdc6947,ang)}
}
keepPlanLeaf=false;
for(const x of [57,159,260,361,463,564,665])for(const y of [175,277,378,479,580,682,783,885,986,1088,1189,1290]){
 if(x>=564 && [580,783,986].includes(y)||x===665&&[885,1290].includes(y))continue;
 box(x,y,.56,.56,2.96,0,0x9ea9a5);
}
addCafeFinish({box,round,face,solid,xyz,sc,roof});
addZoneSurfaces({box,round,line,roof,face,solid,xyz,sc,wallPlan:walls});
addZoneLights({box,round,line,roof,xyz,sc});
const zoneTint=makeZoneTint(sc);
for(const [pi,[k,x,y,ww,dd,deg=0]] of props.entries()){
 if(pi<12&&makeCafeProp(k,x,y,ww,dd,deg,{box,round,sc}))continue;
 if(makeZoneProp(k,x,y,ww,dd,deg,{box,round,sc}))continue;
 const w=ww*sc,d=dd*sc,a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 const b=(u,v,W,D,h,z,col)=>box(x+(u*c-v*s)/sc,y+(u*s+v*c)/sc,W,D,h,z,col,a);
 const wood=0xbb8a59,dark=0x343c37,metal=0x778982,white=0xebeadc;
 const cylinder=(u,v,rx,rz,h,z,col)=>round(x+(u*c-v*s)/sc,y+(u*s+v*c)/sc,rx,rz,h,z,col,a);
 if(k==='coffee'){
  const W=Math.min(w,1),D=Math.min(d,.56),H=.98;
  b(0,0,W,D,.33,H,0x617479);b(0,0,W+.05,D,.06,H+.32,0x26383d);
  b(0,D*.45,W*.84,.04,.18,H+.09,0xc2cac8);b(0,D*.55,W*.86,.09,.04,H+.045,0xb9c4c2);
  cylinder(-W*.20,D*.54,.039,.039,.075,H+.087,0xf4e9d8);
  cylinder(W*.28,-D*.18,.072,.08,.106,H+.38,0x313b3b);
 }else if(k==='bed'){
  b(0,0,w,d,.25,.06,0x9c7559);b(0,0,w*.97,d*.95,.20,.31,0xf4e7cd);
  b(0,-d*.45,w,.10,.80,.08,0x65564b);
  for(const i of [-.22,.22])b(w*i,-d*.30,w*.39,d*.20,.09,.51,0xf5efdf);
  b(0,d*.17,w*.99,d*.60,.055,.52,0x607a77);
 }else if(k==='reception'){
  b(0,0,w,d,.94,0,0xa67d59);b(0,d*.47,w,.065,.72,.14,0x676c5d);b(0,0,w+.065,d+.062,.075,.94,0xe1d3b7);
  for(const i of [-.22,.22]){b(w*i,-d*.28,.38,.05,.25,1.05,0x435956);b(w*i,-d*.28,.12,.11,.07,1.015,dark)}
 }else if(k==='display'){
  b(0,0,w,d,.68,0,0x867458);b(0,0,w+.04,d+.04,.055,.68,0xe5dbc7);
  b(0,0,w*.51,d*.55,.26,.735,0xb3c3b6);b(0,0,w*.31,d*.32,.10,.995,0x49605a);
 }else if(k==='conveyor'){
  b(0,0,w,d,.10,.74,0x425753);
  for(let i=0;i<Math.min(90,Math.ceil(w/.26));i++)b(-w/2+.13+i*.26,0,.085,d,.075,.843,0x9aa9a6);
  for(let i=0;i<Math.min(30,Math.ceil(w/1.4));i++){for(const j of [-.36,.36])b(-w/2+.30+i*1.4,d*j,.065,.065,.74,0,0x6f837e)}
 }else if(k==='stage'){
  b(0,0,w,d,.21,0,0xb78659);b(0,0,w,d,.035,.21,0xcb9d6b);
  const n=Math.max(2,Math.min(14,Math.ceil(w/.34)));for(let i=1;i<n;i++)b(w*(i/n-.5),0,.012,d,.005,.245,0xa47248);
 }else if(['table','desk'].includes(k)){
  if(k==='table'&&x>367&&x<470&&y>728&&y<840&&Math.abs(w-d)<.55){cylinder(0,0,w*.50,d*.50,.072,.72,0xcc9a69);cylinder(0,0,.07,.07,.67,.045,dark);cylinder(0,0,.25,.23,.055,0,dark);continue}
  b(0,0,w,d,.075,.72,wood);
  for(const i of [-.38,.38])for(const j of [-.35,.35])b(w*i,d*j,.055,.055,.71,.01,dark);
  if(k==='desk'){b(0,-d*.26,Math.min(.54,w*.45),.067,.34,.85,0x435d5c);b(0,-d*.26,.14,.13,.10,.76,metal)}
 }else if(k==='chair'){
  b(0,0,w,d,.09,.42,0x53786e);b(0,d*.4,w,.08,.41,.49,0x53786e);
  for(const i of [-.34,.34])for(const j of [-.34,.34])b(w*i,d*j,.045,.045,.41,.01,dark);
 }else if(k==='sofa'){
  b(0,0,w,d,.42,.06,0x889d87);b(0,d*.39,w,d*.2,.39,.47,0x77917a);for(const i of [-.43,.43])b(w*i,0,w*.11,d,.22,.47,0x77917a);
 }else if(k==='counter'){
  b(0,0,w,d,.90,0,wood);b(0,0,w+.07,d+.09,.075,.91,0x4e5e56);
  if(x>367&&x<470&&y>728&&y<840){for(let j=-2;j<=2;j++)b(w*j*.16,d*.48,.018,.028,.72,.13,0x845b3e)}
 }else if(['shelf','rack'].includes(k)){
  for(const i of [-.45,.45])for(const j of [-.42,.42])b(w*i,d*j,.056,.055,1.65,0,metal);
  for(const h of [.16,.68,1.18,1.65])b(0,0,w,d,.06,h,wood);
  for(const i of [-.26,.23])b(w*i,0,w*.34,d*.65,.22,.74,0xbb9d76);
 }else if(k==='machine'){
  b(0,0,w,d,.73,0,0x788c85);b(0,0,w*.81,d*.86,.31,.72,0x9ea9a0);b(0,-d*.35,w*.68,d*.15,.093,.88,0x354e49);
 }else if(k==='kiosk'){
  b(0,0,w,d,.16,0,metal);b(0,0,w*.72,d*.58,1.18,.16,0xd6ded6);b(0,-d*.32,w*.53,.055,.45,.83,0x435f63);
 }else if(k==='plant'){
  b(0,0,w*.65,d*.65,.36,0,0xa86855);b(0,0,.06,.06,.56,.31,0x547449);b(0,0,w*.91,d*.85,.33,.65,0x59865c);
 }else if(k==='toilet'){
  b(0,0,w*.8,d*.77,.39,0,white);b(0,d*.32,w*.86,d*.29,.37,.35,white);
 }else if(k==='basin'){
  b(0,0,w,d,.14,.80,white);b(0,0,w*.46,d*.45,.67,.1,white);
 }else if(k==='stair'){
  for(let i=0;i<12;i++)b(0,-d/2+(i+.5)*d/12,w,d/12+.008,.128*(i+1),0,0xb8bbb3)
 }else if(k==='pallet'){b(0,0,w,d,.13,0,wood);b(0,0,w*.82,d*.80,.55,.13,0xb49b73);}
}
// Keep the last camera in the lift lobby, just in front of the closed cab.
const walkRoute=route.map(([x,y],i)=>[x,i===route.length-1?y+20:y]);
const off=[];let total=0;walkRoute.forEach(([x,y],i)=>{if(i)total+=Math.hypot(x-walkRoute[i-1][0],y-walkRoute[i-1][1])*sc;off.push(total)});
function at(t){t=Math.min(Math.max(0,t),total);let i=1;while(i<off.length-1&&off[i]<t)i++;const u=(t-off[i-1])/(off[i]-off[i-1]||1),a=walkRoute[i-1],b=walkRoute[i];return [a[0]+u*(b[0]-a[0]),a[1]+u*(b[1]-a[1])]}
function where(x,y){let best=Infinity,t=0;walkRoute.forEach(([X,Y],i)=>{if(!i)return;const [a,b]=walkRoute[i-1],dx=X-a,dy=Y-b,u=Math.max(0,Math.min(1,((x-a)*dx+(y-b)*dy)/(dx*dx+dy*dy||1))),d=(x-a-u*dx)**2+(y-b-u*dy)**2;if(d<best){best=d;t=off[i-1]+u*(off[i]-off[i-1])}});return t}
let last=0;const times=stops.map(([,x,y])=>last=Math.max(last,where(x,y)));
let dist=0,play=false,mode='walk',spin=.71,tilt=.86,zoom=125,yaw=0,pitch=0,heading=NaN,dirty=true,exact=-1;
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=v=>v.map(x=>x/(Math.hypot(...v)||1)),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
function camera(eye,target){const f=unit(eye.map((x,i)=>x-target[i])),r=unit(cross([0,1,0],f)),u=cross(f,r); return [r[0],u[0],f[0],0,r[1],u[1],f[1],0,r[2],u[2],f[2],0,-dot(r,eye),-dot(u,eye),-dot(f,eye),1]}
function projection(aspect){const n=.045,f=400,x=1/Math.tan((mode==='walk'?65:52)*Math.PI/360);return [x/aspect,0,0,0,0,x,0,0,0,0,(n+f)/(n-f),-1,0,0,2*f*n/(n-f),0]}
const explore=id=>id===21?{eye:[636,600],look:[636,538],pitch:-.03,hint:'景区广场观察点：从原红线看广场、北通道及两侧立面。'}:zoneViews[id];
let cafeIndex=0,cafeLeg=null,cafeT=0,cafeGlassView=false;
const isCafe=()=>exact>=0&&stops[exact][0]===14&&mode==='walk'&&!play;
const cafeView=()=>{const v=cafeStops[cafeIndex];return [v.eye[0],v.eye[1],v.look[0],v.look[1]]};
function cafeTransition(i){
 if(cafeGlassView){cafeGlassView=false;cafeIndex=i;cafeLeg=null;yaw=pitch=0;dirty=true;sync();return;}
 if(cafeLeg||i===cafeIndex)return;
 const from=cafeIndex;
 const keys=[];
 if(i>from){for(let k=from;k<i;k++)keys.push(...(cafeStops[k].via||[]),cafeStops[k+1].eye);}
 else{for(let k=from-1;k>=i;k--)keys.push(...[...(cafeStops[k].via||[])].reverse(),cafeStops[k].eye);}
 const start=cafeStops[from].eye;
 const poly=[start,...keys],cum=[0];
 for(let k=1;k<poly.length;k++)cum[k]=cum[k-1]+Math.hypot(poly[k][0]-poly[k-1][0],poly[k][1]-poly[k-1][1])*sc;
 cafeLeg={poly,cum,end:cum.at(-1),lookFrom:cafeCamera().slice(2),lookTo:cafeStops[i].look,pitchFrom:cafeStops[from].pitch};
 cafeIndex=i;cafeT=0;yaw=pitch=0;dirty=true;sync();
}
function cafePitch(){if(cafeGlassView)return -.065;const dest=cafeStops[cafeIndex].pitch;if(!cafeLeg)return dest;const t=Math.min(1,cafeT/(cafeLeg.end||1));return cafeLeg.pitchFrom+(dest-cafeLeg.pitchFrom)*t}
function cafeCamera(){
 if(cafeGlassView)return [490,772,422,784];
 if(!cafeLeg)return cafeView();const {poly,cum,end,lookFrom,lookTo}=cafeLeg;
 let k=1;while(k<cum.length-1&&cum[k]<cafeT)k++;
 const q=Math.max(0,Math.min(1,(cafeT-cum[k-1])/(cum[k]-cum[k-1]||1))),u=Math.min(1,cafeT/(end||1)),h=u*u*(3-2*u);
 return [poly[k-1][0]+(poly[k][0]-poly[k-1][0])*q,poly[k-1][1]+(poly[k][1]-poly[k-1][1])*q,lookFrom[0]+(lookTo[0]-lookFrom[0])*h,lookFrom[1]+(lookTo[1]-lookFrom[1])*h];
}
const cControl=$('cafeControl');
for(const [i,v] of cafeStops.entries()){
 const b=document.createElement('button');b.type='button';b.textContent=v.label;b.onclick=()=>cafeTransition(i);cControl.append(b);
}
const glassLook=document.createElement('button');glassLook.type='button';glassLook.textContent='从走道看进咖啡厅';
glassLook.onclick=()=>{cafeGlassView=true;cafeLeg=null;heading=NaN;yaw=pitch=0;dirty=true;sync();};cControl.append(glassLook);
let program,buffers=[],setHiddenRects=()=>{},detailWorld=null,cpu=null,baseMeshes=null,layerState='';
function init(){
 function sh(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
 program=gl.createProgram();
 gl.attachShader(program,sh(gl.VERTEX_SHADER,`attribute vec3 p;attribute vec4 c;uniform mat4 P,V;varying vec4 C;varying float fog;varying vec3 world;void main(){vec4 v=V*vec4(p,1.);gl_Position=P*v;C=c;world=p;fog=smoothstep(32.,125.,-v.z)*0.31;}`));
 gl.attachShader(program,sh(gl.FRAGMENT_SHADER,`precision highp float;varying vec4 C;varying float fog;varying vec3 world;
 ${maskCode(BOX_LIMIT,'hideArea')}
 float pool(vec2 center){vec2 v=world.xz-center;float y=max(0.,2.36-world.y);float r=.54+y*.63;return exp(-2.6*dot(v,v)/(r*r))*(.32+.68*smoothstep(0.,1.4,y));}
 void main(){if(hideAreaContains(world.xz))discard;vec3 base=C.rgb;
  if(world.x>-1.94&&world.x<6.06&&world.z>-4.61&&world.z<4.59){
   float e=smoothstep(-4.61,-3.9,world.z);
   float glow=min(1.,(pool(vec2(1.081,-.665))+pool(vec2(2.329,-.665))+pool(vec2(3.576,-.665)))*.68);
   float edge=(1.-smoothstep(0.,.43,min(min(world.x+1.94,6.06-world.x),4.59-world.z)))*(1.-smoothstep(.015,.1,world.y));
   base=mix(base,base*vec3(.98,.94,.90)*(1.-.17*edge)+glow*vec3(.145,.100,.054),e);
  }
  gl_FragColor=vec4(mix(base,vec3(.79,.87,.84),fog),C.a);
 }`));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 setHiddenRects=maskSetup(gl,program,'hideArea',BOX_LIMIT);
 buffers=[solid,ceiling,trans,essential].map(data=>{
  const out=new Float32Array(data);
  for(let i=0;i<out.length;i+=7){
   const rgb=zoneTint(out[i],out[i+1],out[i+2],out[i+3],out[i+4],out[i+5]);
   if(rgb)out.set(rgb,i+3);
  }
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,out,gl.STATIC_DRAW);return [b,data.length/7]
 });
 gl.enable(gl.DEPTH_TEST);gl.clearColor(.78,.86,.83,1);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
}
let canvas2=null,ctx=null;
function makeFaceBatches(){
 const grids=new Map();
 function add(records,roofMode){
  for(const [verts,color,alpha] of records){
   const len=verts.length,pos=[0,0,0];
   for(const p of verts)for(let i=0;i<3;i++)pos[i]+=p[i]/len;
   const [wx,wy,wz]=pos;
   let lit=color;
   if(wx>-1.94&&wx<6.06&&wz>-4.61&&wz<4.59){
    const spread=.60+Math.max(0,2.36-wy)*.66,glow=Math.min(.85,[1.081,2.329,3.576].reduce((t,x)=>t+Math.exp(-2.2*((wx-x)**2+(wz+.665)**2)/spread**2)*.61,0));
    lit=color.map((c,i)=>Math.min(1,c*[1.005,.969,.928][i]+glow*[.16,.108,.055][i]));
   }
   lit=zoneTint(wx,wy,wz,...lit)||lit;
   const n=verts[0],p=verts[1],q=verts[2],normal=cross([p[0]-n[0],p[1]-n[1],p[2]-n[2]],[q[0]-n[0],q[1]-n[1],q[2]-n[2]]);
   const floor=wy>=-.225&&wy<=.039&&verts.every(p=>Math.abs(p[1]-wy)<.00001)?40000-(wy+.225)*60000:0;
   const h=Math.floor(wx/8),v=Math.floor(wz/8),key=h+':'+v+':'+roofMode;
   if(!grids.has(key))grids.set(key,{roofMode,x:h*8+4,z:v*8+4,rx:0,rz:0,y0:Infinity,y1:-Infinity,list:[]});
   const b=grids.get(key);
   for(const [x,y,z] of verts){b.rx=Math.max(b.rx,Math.abs(x-b.x));b.rz=Math.max(b.rz,Math.abs(z-b.z));b.y0=Math.min(b.y0,y);b.y1=Math.max(b.y1,y);}
   b.list.push([verts,lit,alpha,floor,normal,dot(normal,n)]);
  }
 }
 add(faces,false);add(ceilingFaces,true);
 return [...grids.values()].map(g=>({...g,y:(g.y0+g.y1)/2,r:Math.hypot(g.rx,g.rz,(g.y1-g.y0)/2)}));
}
let faceBatches=[];
function fallback(W,H,V,eye){
 if(!ctx)return;
 ctx.fillStyle='#c7dbd4';ctx.fillRect(0,0,W,H);
 const f=H/(2*Math.tan((mode==='walk'?65:52)*Math.PI/360)),N=.065, polys=[];
 for(const b of faceBatches){
  if(b.roofMode&&mode!=='walk')continue;
  const bx=V[0]*b.x+V[4]*b.y+V[8]*b.z+V[12],by=V[1]*b.x+V[5]*b.y+V[9]*b.z+V[13],bz=-(V[2]*b.x+V[6]*b.y+V[10]*b.z+V[14]),r=b.r;
  if(bz+r<N||Math.abs(bx)-r>(bz+r)*W/(2*f)||Math.abs(by)-r>(bz+r)*H/(2*f))continue;
  for(const [verts,lit,alpha,floor,normal,plane] of b.list){
  if(alpha===1&&dot(normal,eye)>plane+.000001)continue;
  const v=verts.map(([x,y,z])=>[V[0]*x+V[4]*y+V[8]*z+V[12],V[1]*x+V[5]*y+V[9]*z+V[13],-(V[2]*x+V[6]*y+V[10]*z+V[14])]);
  if(v.every(p=>p[2]<N))continue;
  const k=[];
  for(let i=0;i<v.length;i++){const a=v[i],b=v[(i+1)%v.length];if(a[2]>=N)k.push(a);if((a[2]>=N)!==(b[2]>=N)){const t=(N-a[2])/(b[2]-a[2]);k.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,N])}}
  if(k.length<3)continue;
  const pts=k.map(([x,y,z])=>[W/2+x*f/z,H/2-y*f/z]);
  if(pts.every(([x,y])=>x<0)||pts.every(([x,y])=>x>W)||pts.every(([x,y])=>y<0)||pts.every(([x,y])=>y>H))continue;
  if(alpha===1){let area=0;for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];area+=a[0]*b[1]-b[0]*a[1]}if(area<0)continue}
  const z=k.reduce((sum,p)=>sum+p[2],0)/k.length;
  const tint=Math.max(0,Math.min(.25,(z-30)*.004));
  const c=lit.map((x,i)=>Math.round(255*(x*(1-tint)+[.79,.87,.84][i]*tint)));
  polys.push([floor+z,pts,c,alpha]);
 }}
 polys.sort((a,b)=>b[0]-a[0]);
 for(const [,pts,c,a] of polys){ctx.beginPath();ctx.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)ctx.lineTo(...pts[i]);ctx.closePath();ctx.fillStyle='rgba('+c.join(',')+','+a+')';ctx.fill()}
}
function draw(){
 if(!program&&!ctx)return;
 const W=cv.clientWidth,H=cv.clientHeight,p=Math.min(1.5,devicePixelRatio||1);
 if(program){if(cv.width!==Math.round(W*p)||cv.height!==Math.round(H*p)){cv.width=Math.round(W*p);cv.height=Math.round(H*p)}gl.viewport(0,0,cv.width,cv.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)}
 else if(!canvas2)return;
 const a=at(dist),q=at(Math.min(total,dist+2.4)),b=dist>total-1?at(Math.max(0,dist-1.6)):a;
 let eye,target;
 if(mode==='walk'){
  const ang=Math.atan2(q[0]-b[0],q[1]-b[1]);if(!Number.isFinite(heading))heading=ang;else if(play)heading+=Math.atan2(Math.sin(ang-heading),Math.cos(ang-heading))*.145;
  const cafe=isCafe(),v=exact>=0&&!play?explore(stops[exact][0]):null,
   p=cafe?cafeCamera():v?[...v.eye,...v.look]:null,viewPitch=pitch+(cafe?cafePitch():v?.pitch??0);
  if(p)heading=Math.atan2(p[2]-p[0],p[3]-p[1]);
  eye=p?xyz(p[0],p[1],1.62):xyz(...a,1.62);target=[eye[0]+Math.sin(heading+yaw)*Math.cos(viewPitch),eye[1]+Math.sin(viewPitch),eye[2]+Math.cos(heading+yaw)*Math.cos(viewPitch)];
 }else{eye=[Math.sin(spin)*zoom*Math.cos(tilt),Math.sin(tilt)*zoom,Math.cos(spin)*zoom*Math.cos(tilt)];target=[0,0,0]}
 const layer=mode==='walk'?detailWorld?.select(eye[0],eye[2]):null;
 const key=mode==='orbit'?'orbit':layer?.near?'detail':layer?.waiting?'loading':'base';
 if(layerState!==key){layerState=key;cv.dataset.tourLayer=key;$('detailHint').textContent=({orbit:'全层布局 · 拖动旋转，滚轮缩放',detail:'精细装修已接入 · 沿原路线连续行进',loading:'正在加载前方精细装修，路线仍可走',base:'沿原路线行进；未接入的区段保留原模型'})[key];}
 const V=camera(eye,target);
 if(!program){
  if(layer?.meshes?.length&&cpu){
   cpu.draw({eye,target,fov:65,width:W,height:H,meshes:layer.meshes,baseMeshes,boxes:layer.boxes,quality:play||drag?'moving':'idle'});return;
  }
  if(canvas2.width!==Math.round(W)||canvas2.height!==Math.round(H)){canvas2.width=Math.round(W);canvas2.height=Math.round(H)}
  fallback(W,H,V,eye);return;
 }
 const P=projection(W/H);
 gl.useProgram(program);setHiddenRects(layer?.boxes??[]);
 gl.uniformMatrix4fv(gl.getUniformLocation(program,'P'),false,P);gl.uniformMatrix4fv(gl.getUniformLocation(program,'V'),false,V);
 const pp=gl.getAttribLocation(program,'p'),cc=gl.getAttribLocation(program,'c');
 const base=(i)=>{const [v,n]=buffers[i];gl.bindBuffer(gl.ARRAY_BUFFER,v);gl.enableVertexAttribArray(pp);gl.enableVertexAttribArray(cc);gl.vertexAttribPointer(pp,3,gl.FLOAT,false,28,0);gl.vertexAttribPointer(cc,4,gl.FLOAT,false,28,12);gl.drawArrays(gl.TRIANGLES,0,n);};
 gl.disable(gl.BLEND);gl.depthMask(true);base(0);if(mode==='walk')base(1);
 if(layer?.rows.length)detailWorld.draw(layer.rows,P,V);
 gl.useProgram(program);setHiddenRects([]);base(3);gl.enable(gl.BLEND);gl.depthMask(false);base(2);gl.depthMask(true);
}
function index(){if(exact>=0)return exact;let i=0;while(i<times.length-1&&times[i+1]<=dist+.35)i++;return i}
function label([n,,,s]){return String(n).padStart(2,'0')+' · '+s}
stops.forEach((s,i)=>$('jump').add(new Option(label(s),i)));
$('fullRoam').onclick=()=>setMode('walk');
const finishFile=n=>'finish-'+String(n).padStart(2,'0')+'.jpg';
for(const item of finishes){
 const fig=document.createElement('figure');fig.className='finish-card';fig.dataset.new='true';
 const a=document.createElement('a');a.href=finishFile(item.id);a.target='_blank';a.rel='noopener';
 const im=document.createElement('img');im.src=a.href;im.alt=item.name+'装修效果图';im.loading='lazy';a.append(im);
 const fc=document.createElement('figcaption');const b=document.createElement('b');b.textContent=String(item.id).padStart(2,'0')+' · '+item.name;if(fig.dataset.new){const n=document.createElement('span');n.className='fresh';n.textContent=item.id===17?'客房装修参考':'已加入 3D 漫游';b.append(n)}
 const p=document.createElement('p');p.textContent=item.note;
 const btn=document.createElement('button');btn.type='button';btn.textContent='在 3D 中查看';btn.onclick=()=>jumpTo(item.id);
 fc.append(b,p,btn);fig.append(a,fc);$('finishGrid').append(fig);
}

const mapMarks=$('routeMarks'),mapNS='http://www.w3.org/2000/svg';
function mapMark(tag,attrs){const n=document.createElementNS(mapNS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);mapMarks.append(n);return n;}
mapMark('polyline',{points:route.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#c26149','stroke-width':12,'stroke-linejoin':'round','stroke-linecap':'round',opacity:.85});
for(const [n,x,y] of stops){mapMark('circle',{cx:x,cy:y,r:15,fill:'#fffdf7',stroke:'#8f4c3d','stroke-width':2.8});mapMark('text',{x,y:y+5,fill:'#4a2820','font-size':13,'font-weight':700,'text-anchor':'middle','font-family':'system-ui,sans-serif'}).textContent=String(n).padStart(2,'0');}
function jumpTo(n){
 const i=stops.findIndex(v=>v[0]===n);if(i<0)return;
 setMode('walk');go(i);document.querySelector('main').scrollIntoView({block:'start'});
}
const zones=[
 ['入口与接待','前庭、迎宾、门厅',1,2,3],
 ['展陈与店仓','主展厅、店面、前置仓及两处走道',4,5,6,7,8,9,10],
 ['工业参观','装配线头、工位、线尾',11,12,13],
 ['文旅布景','咖啡厅、表演区、酒店及街区',14,15,16,17,18,19,20],
 ['广场与电梯','景区广场、三楼前厅入口',21,22]
];
for(const [name,subtitle,...keys] of zones){
 const panel=document.createElement('section');panel.className='station-group';
 const t=document.createElement('h3');t.textContent=name;
 const s=document.createElement('p');s.textContent=subtitle;
 const choices=document.createElement('div');choices.className='station-choices';
 for(const n of keys){
  const stop=stops.find(v=>v[0]===n),a=document.createElement('a');
  a.href='?station='+n;a.textContent=label(stop);a.onclick=e=>{if(e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();const u=new URL(location.href);u.searchParams.set('station',n);u.hash='';history.replaceState(null,'',u);jumpTo(n)};choices.append(a);
 }
 panel.append(t,s,choices);$('stationGrid').append(panel);
}
let lastAudit=-1;
function sync(){const i=index();if(i!==lastAudit){lastAudit=i;const n=stops[i][0];$('finishNote').textContent=explore(n)?.hint??'木格栅、浅石台面、软包椅、暖吊灯；可选三处室内视角。';}$('now').textContent=label(stops[i]);$('jump').value=i;$('scrub').value=1000*dist/total;$('prev').disabled=i===0;$('next').disabled=i===stops.length-1;const caf=isCafe();cControl.hidden=!caf;cControl.querySelectorAll('button').forEach((b,j)=>b.setAttribute('aria-pressed',String(cafeGlassView?j===cafeStops.length:j===cafeIndex)));const [x,y]=caf?cafeCamera():mode==='walk'&&exact>=0&&!play?explore(stops[i][0])?.eye??at(dist):at(dist);$('dot').setAttribute('cx',x);$('dot').setAttribute('cy',y);$('play').textContent=play?'暂停漫游':dist>total-.05?'重新漫游':'开始漫游';$('modeTip').textContent=caf?'已加入软装与灯光 · 拖动看四周':mode==='walk'?(exact>=0?'本站实时布置 · 拖动看四周':'第一人称 · 沿红线行进'):'掀顶总览 · 拖动旋转／滚轮缩放';}
function go(i){i=Math.max(0,Math.min(stops.length-1,i));dist=times[i];exact=i;play=false;cafeIndex=0;cafeLeg=null;cafeGlassView=false;yaw=pitch=0;heading=NaN;dirty=true;sync()}
function toggle(){if(dist>total-.05){dist=0;heading=NaN}play=!play;if(play&&mode!=='walk')setMode('walk');exact=-1;cafeLeg=null;yaw=pitch=0;dirty=true;sync()}
$('jump').onchange=e=>go(+e.target.value);$('prev').onclick=()=>go(index()-1);$('next').onclick=()=>go(index()+1);$('play').onclick=toggle;
$('scrub').oninput=e=>{dist=total*e.target.value/1000;play=false;exact=-1;cafeLeg=null;heading=NaN;dirty=true;sync()};
function setMode(m){mode=m;if(m==='orbit')play=false;for(const v of ['walk','orbit'])$(v).setAttribute('aria-pressed',v===m);dirty=true;sync()}
for(const m of ['walk','orbit'])$(m).onclick=()=>setMode(m);
let drag=null;
cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);drag=[e.clientX,e.clientY]};
cv.onpointerup=cv.onpointercancel=()=>{drag=null;dirty=true;};
cv.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag[0],dy=e.clientY-drag[1];if(mode==='walk'){yaw-=dx*.006;pitch=Math.max(-1.1,Math.min(1.1,pitch+dy*.005))}else{spin-=dx*.009;tilt=Math.max(.33,Math.min(1.54,tilt+dy*.007))}drag=[e.clientX,e.clientY];dirty=true};
cv.onwheel=e=>{if(mode!=='orbit')return;e.preventDefault();zoom=Math.max(28,Math.min(250,zoom*Math.exp(e.deltaY*.001)));dirty=true};
window.addEventListener('resize',()=>dirty=true);
window.addEventListener('keydown',e=>{if(/BUTTON|INPUT|SELECT/.test(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();toggle()}else if(e.code==='ArrowRight')go(index()+1);else if(e.code==='ArrowLeft')go(index()-1)});
try{if(!gl)throw Error('WebGL unavailable');init()}catch(e){console.warn(e.message);program=null;canvas2=document.createElement('canvas');canvas2.style.cssText='position:absolute;inset:0;pointer-events:none';cv.after(canvas2);ctx=canvas2.getContext('2d');if(ctx)faceBatches=makeFaceBatches();if(!ctx)$('warn').style.display='block'}
try{
 if(program)detailWorld=createDetailWorld(gl,()=>dirty=true);
 else if(ctx){cpu=createUnifiedCPU(canvas2);baseMeshes=makeUnifiedBaseMeshes([solid,ceiling,trans,essential],zoneTint);detailWorld=createDetailWorld(null,()=>dirty=true);}
}catch(e){console.warn('装修层未启用；保持原导览',e);}
window.addEventListener('pagehide',e=>{if(!e.persisted){detailWorld?.dispose();cpu?.dispose();}});
const startStation=Number(new URLSearchParams(location.search).get('station'));const startIndex=stops.findIndex(v=>v[0]===startStation);if(startIndex>=0)go(startIndex);else sync();let tm=0;function frame(t){const dt=Math.min(.075,(t-tm)/1000||0);tm=t;if(cafeLeg&&isCafe()){cafeT+=dt*2.85;if(cafeT>=cafeLeg.end)cafeLeg=null;const [x,y]=cafeCamera();$('dot').setAttribute('cx',x);$('dot').setAttribute('cy',y);dirty=true;}if(play){dist=Math.min(total,dist+dt*2.3);if(dist>=total)play=false;dirty=true;sync()}if(dirty){draw();dirty=false}requestAnimationFrame(frame)}requestAnimationFrame(frame);
