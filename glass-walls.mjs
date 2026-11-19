import {glassAudit} from './glass-lines.mjs?v=r2-clear-glass';
import {walls as tracedWalls} from './arch.mjs';
const S=8.4/101;
const X=x=>(x-395)*S,Z=y=>(y-785)*S;
const kindOf=a=>Math.abs(a[2]-a[0])<.01?'v':Math.abs(a[3]-a[1])<.01?'h':null;
const linePos=(a,k=kindOf(a))=>k==='v'?a[0]:a[1];
const spanOf=(a,k=kindOf(a))=>k==='v'?[Math.min(a[1],a[3]),Math.max(a[1],a[3])]:[Math.min(a[0],a[2]),Math.max(a[0],a[2])];
const lineOf=(k,p,a,b)=>k==='v'?[p,a,p,b]:[a,p,b,p];
function subtract(pieces,a,b){return pieces.flatMap(([l,h])=>{
 if(b<=l||a>=h)return [[l,h]];
 const r=[];if(a>l+.02)r.push([l,a]);if(b<h-.02)r.push([b,h]);return r;
});}
function validated(){
 return glassAudit.filter(r=>Array.isArray(r.line)&&r.line.length===4&&r.line.every(Number.isFinite)&&kindOf(r.line)&&spanOf(r.line)[1]-spanOf(r.line)[0]>.35);
}
function keepOpenings(row,walls){
 const k=kindOf(row.line),p=linePos(row.line,k);let pieces=[spanOf(row.line,k)];
 for(const a of walls){
  if(!['window','glass-door','solid-door'].includes(a[4])||kindOf(a)!==k||Math.abs(linePos(a,k)-p)>2.8)continue;
  pieces=subtract(pieces,...spanOf(a,k));
 }
 return pieces;
}
/** Exact classified pane paths, with any known door/observation-window span removed. */
export function applyGlassWalls(walls){
 const mapped=[],newWalls=[];
 for(const r of validated()){
  const k=kindOf(r.line),p=linePos(r.line,k),pieces=keepOpenings(r,walls);

  mapped.push(...pieces.map(([a,b])=>({line:lineOf(k,p,a,b),tolerance:r.tolerance??2.8,aliases:r.also??[],kind:r.kind,height:r.height})));
 }
 for(const a of walls){
  if(!['wall','glass'].includes(a[4])||!kindOf(a)){newWalls.push(a);continue;}
  const k=kindOf(a),p=linePos(a,k);let pieces=[spanOf(a,k)];
  for(const row of mapped){
   if(kindOf(row.line)!==k||(![row.line,...row.aliases].some(l=>kindOf(l)===k&&Math.abs(linePos(l,k)-p)<=row.tolerance)))continue;
   pieces=subtract(pieces,...spanOf(row.line,k));
  }
  newWalls.push(...pieces.map(([l,h])=>[...lineOf(k,p,l,h),...a.slice(4)]));
 }
 return [...newWalls,...mapped.filter(row=>row.kind!=='open').map(row=>[...row.line,row.kind==='rail'?'review-rail':'review-glass',row.height])];
}
function makeCuts(){
 const items=[];
 for(const row of validated()){
  if(row.cut===false)continue;
  const type=kindOf(row.line),orth=type==='v'?0:2,long=type==='v'?2:0,tf=type==='v'?Z:X,pf=type==='v'?X:Z;
  const c=pf(linePos(row.line,type)),centres=[c,...(row.also??[]).filter(l=>kindOf(l)===type).map(l=>pf(linePos(l,type)))];
  const pad=(row.cutWidth??2.6)*S;


  let spans=keepOpenings(row,tracedWalls);
  for(const [lo,hi] of row.protect??[])spans=subtract(spans,lo,hi);
  for(const [lo,hi] of spans)items.push({orth,long,low:tf(lo),high:tf(hi),side0:Math.min(...centres)-pad,side1:Math.max(...centres)+pad});
 }
 return items;
}
const CUTS=makeCuts();
function clip(poly,axis,pivot,keepHigh){
 const out=[];
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],inside=v=>keepHigh?v[axis]>=pivot:v[axis]<=pivot;
  const aa=inside(a),bb=inside(b);if(aa)out.push(a);
  if(aa!==bb){const d=(pivot-a[axis])/(b[axis]-a[axis]),p=a.map((v,k)=>v+(b[k]-v)*d);p[axis]=pivot;out.push(p);}
 }
 return out;
}
const EPS=.00004;
function cut(poly,band){
 const {orth,long,low,high,side0,side1}=band;
 let p0=Infinity,p1=-Infinity,a0=Infinity,a1=-Infinity,y0=Infinity,y1=-Infinity;
 for(const p of poly){p0=Math.min(p0,p[orth]);p1=Math.max(p1,p[orth]);a0=Math.min(a0,p[long]);a1=Math.max(a1,p[long]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);}


 if(p0<side0-EPS||p1>side1+EPS||a1<low+EPS||a0>high-EPS||y1<=.070||y0>4.45)return [poly];
 if(y1-y0<.02 && p1-p0>.38)return [poly];
 const remaining=[];
 for(const [axis,limit,side] of [[long,low,false],[long,high,true],[1,.045,false],[1,4.4,true]]){
  if(!poly.length)break;
  const outside=clip(poly,axis,limit,side);if(outside.length>=3)remaining.push(outside);
  poly=clip(poly,axis,limit,!side);
 }
 return remaining;
}
function append(out,a,b,c){
 const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
 if(Math.abs(uy*vz-uz*vy)+Math.abs(uz*vx-ux*vz)+Math.abs(ux*vy-uy*vx)<1e-9)return;
 out.push(...a,...b,...c);
}
/** Strip the earlier opaque wall geometry from baked meshes without altering UVs
 * of the retained floor, ceiling, furniture, headers or perpendicular walls. */
export function clearBakedWalls(mesh){
 const cuts=CUTS.filter(c=>mesh.bounds.max[c.orth]>=c.side0&&mesh.bounds.min[c.orth]<=c.side1&&mesh.bounds.max[c.long]>=c.low&&mesh.bounds.min[c.long]<=c.high);
 if(!cuts.length)return 0;
 const data=mesh.data,out=[];let changed=0;
 for(let o=0;o<data.length;o+=24){
  const triCuts=cuts.filter(c=>{
   const a=data[o+c.orth],b=data[o+8+c.orth],d=data[o+16+c.orth],
    p=data[o+c.long],q=data[o+8+c.long],r=data[o+16+c.long];
   return Math.min(a,b,d)>=c.side0-EPS&&Math.max(a,b,d)<=c.side1+EPS&&Math.max(p,q,r)>c.low+EPS&&Math.min(p,q,r)<c.high-EPS&&Math.max(data[o+1],data[o+9],data[o+17])>.07;
  });
  if(!triCuts.length){for(let i=o;i<o+24;i++)out.push(data[i]);continue;}
  let polys=[[Array.from(data.subarray(o,o+8)),Array.from(data.subarray(o+8,o+16)),Array.from(data.subarray(o+16,o+24))]];
  const orig=polys[0];
  for(const c of triCuts){polys=polys.flatMap(p=>cut(p,c));if(!polys.length)break;}
  if(polys.length!==1||polys[0]!==orig)changed++;
  for(const p of polys)for(let i=1;i+1<p.length;i++)append(out,p[0],p[i],p[i+1]);
 }
 if(changed){mesh.data=new Float32Array(out);mesh.count=out.length/8;}
 return changed;
}
