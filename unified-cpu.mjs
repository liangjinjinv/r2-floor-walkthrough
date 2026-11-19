/**
 * Continuous R2 tour CPU renderer. Real perspective-correct mesh rendering,
 * one colour buffer and one depth buffer for both the plan and baked regions.
 * No panorama, independent room overlay, GPU flags, DOM handlers or animation loop.
 *
 * Host:
 *   const base = makeUnifiedBaseMeshes([solid, ceiling, trans], zoneTint);
 *   const cpu = createUnifiedCPU(canvas);
 *   cpu.draw({eye, target, fov:65, width, height,
 *     meshes:globalBakedMeshes, baseMeshes:base, boxes, quality:'moving'});
 *   // Draw once more with quality:'idle' after movement stops.
 *
 * Geometry uses global Y-up metres. A loaded mesh has interleaved
 * `data: Float32Array` [x,y,z,u,v,r,g,b], count, material and bounds.
 * Detail mesh.clipDetail is an array of [minX,minZ,maxX,maxZ] rectangles:
 * fragments OUTSIDE their union are discarded. An absent clipDetail is unmasked;
 * an explicitly empty clipDetail draws nothing. Base fragments INSIDE boxes are
 * discarded, except base meshes with clipBase:false. Rectangles have no height
 * cutoff and never change collision data.
 *
 * Requires warehouse-render.mjs to export makeSoftware and honour
 * mesh.discardAt(worldX,worldY,worldZ) before committing colour OR depth.
 * The imported renderer must not clear depth between meshes.
 *
 * Original base glass alpha is retained, not flattened onto a background.
 * Opaque geometry draws first, then globally depth-sorted transparent triangles
 * blend against its colour, testing its depth without writing depth themselves.
 * This is see-through alpha compositing, not physical refraction/reflection.
 * A source discardAt callback composes with the region masks and may reject old
 * baked wall fragments. Both sides of transparent geometry remain visible.
 *
 * Inputs are read-only. Reuse mesh/data objects; after changing an existing
 * buffer in place call invalidate(). No hardware/mobile FPS claim is implied.
 */
import {makeSoftware} from './warehouse-render.mjs?v=r2-clear-glass';

const BACKGROUND=[.78,.86,.83], WHITE=[1,1,1];
const BASE_TILE=6, DETAIL_TILE=4, CHUNK_TRIANGLES=1024;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite3=v=>v&&v.length===3&&v.every(Number.isFinite);
const now=()=>globalThis.performance?.now?.()??Date.now();
const EMPTY=[];

function rectsOf(input){
 if(input==null)return [];
 if(!Array.isArray(input))throw new TypeError('Replacement masks must be rectangle arrays.');
 return input.map(r=>{
  if(!r||r.length!==4||!r.every(Number.isFinite)||r[2]<r[0]||r[3]<r[1])
   throw new TypeError('A replacement rectangle must be [minX,minZ,maxX,maxZ].');
  return [...r];
 });
}
const signature=rects=>rects.map(r=>r.join(',')).join(';');
const overlaps=(b,r)=>b.max[0]>=r[0]&&b.min[0]<=r[2]&&b.max[2]>=r[1]&&b.min[2]<=r[3];
const containsBounds=(r,b)=>b.min[0]>=r[0]&&b.max[0]<=r[2]&&b.min[2]>=r[1]&&b.max[2]<=r[3];

function discardInside(rects){

 return (x,_y,z)=>{
  for(let i=0;i<rects.length;i++){
   const r=rects[i];if(x>=r[0]&&x<=r[2]&&z>=r[1]&&z<=r[3])return true;
  }return false;
 };
}
function discardOutside(rects){
 return (x,_y,z)=>{
  for(let i=0;i<rects.length;i++){
   const r=rects[i];if(x>=r[0]&&x<=r[2]&&z>=r[1]&&z<=r[3])return false;
  }return true;
 };
}

function boundsOf(data){
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<data.length;i+=8)for(let k=0;k<3;k++){
  const v=data[i+k];min[k]=Math.min(min[k],v);max[k]=Math.max(max[k],v);
 }return {min,max};
}
function meshRecord(data,extra){
 const bounds=boundsOf(data),min=bounds.min,max=bounds.max;
 return {data,count:data.length/8,bounds,
  _center:[(min[0]+max[0])/2,(min[1]+max[1])/2,(min[2]+max[2])/2],
  _extent:[(max[0]-min[0])/2,(max[1]-min[1])/2,(max[2]-min[2])/2],
  material:{color:WHITE,texture:null},...extra};
}

function clipPlane(poly,axis,bound,greater){
 const out=[];
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],ai=greater?a[axis]>=bound:a[axis]<=bound,
   bi=greater?b[axis]>=bound:b[axis]<=bound;
  if(ai)out.push(a);
  if(ai!==bi){
   const t=(bound-a[axis])/(b[axis]-a[axis]),v=new Array(7);
   for(let k=0;k<7;k++)v[k]=a[k]+(b[k]-a[k])*t;
   v[axis]=bound;out.push(v);
  }
 }return out;
}

/**
 * Convert ORIGINAL flat xyzrgba buffers to reusable tiled xyzuvrgb meshes.
 * Triangles spanning multiple tiles are geometrically clipped, not duplicated.
 * This matters for the enormous floor slab: a centroid-only bucket cannot cull it.
 * zoneTint(x,y,z,r,g,b) may return a new RGB or undefined, just like tour.mjs.
 * Output sourceIndex and roofMode let the host omit ceilings in overview.
 * Source 2 (glass) and optional source 3 (confirmed ordinary door leaves) are
 * NEVER replacement-masked. They preserve structure missing in isolated bakes.
 * Already-tinted buffers should pass no zoneTint, to avoid applying light twice.
 */
export function makeUnifiedBaseMeshes(groups,zoneTint){
 if(!Array.isArray(groups))throw new TypeError('Expected [solid, ceiling, trans] buffers.');
 const output=[];
 for(let sourceIndex=0;sourceIndex<groups.length;sourceIndex++){
  const data=groups[sourceIndex];if(!data?.length)continue;
  if(data.length%21)throw new Error('Base buffer must contain xyzrgba triangle vertices (21 floats per triangle).');
  const tiles=new Map();
  function vertex(v,out,alphas){
   let r=v[3],g=v[4],b=v[5];
   const tint=zoneTint?.(v[0],v[1],v[2],r,g,b);
   if(tint){r=tint[0];g=tint[1];b=tint[2];}
   out.push(v[0],v[1],v[2],0,0,clamp(r,0,1),clamp(g,0,1),clamp(b,0,1));
   if(alphas)alphas.push(clamp(v[6],0,1));
  }
  for(let o=0;o<data.length;o+=21){
   const tri=[Array.from(data.slice(o,o+7)),Array.from(data.slice(o+7,o+14)),Array.from(data.slice(o+14,o+21))];
   if(!tri.every(v=>v.every(Number.isFinite)))throw new Error('Base buffer contains a non-finite vertex.');
   if(tri.every(v=>v[6]<=0))continue;
   const constantAlpha=tri.every(v=>Math.abs(v[6]-tri[0][6])<1e-10),opacity=constantAlpha?clamp(tri[0][6],0,1):1;
   const loX=Math.min(tri[0][0],tri[1][0],tri[2][0]),hiX=Math.max(tri[0][0],tri[1][0],tri[2][0]),
    loZ=Math.min(tri[0][2],tri[1][2],tri[2][2]),hiZ=Math.max(tri[0][2],tri[1][2],tri[2][2]);
   const x0=Math.floor(loX/BASE_TILE),x1=Math.floor(hiX/BASE_TILE),z0=Math.floor(loZ/BASE_TILE),z1=Math.floor(hiZ/BASE_TILE);
   if((x1-x0+1)*(z1-z0+1)>100000)throw new Error('Base mesh is outside the supported metre-scale floor plan.');
   for(let iz=z0;iz<=z1;iz++)for(let ix=x0;ix<=x1;ix++){
    let poly=tri;
    if(x0!==x1){poly=clipPlane(poly,0,ix*BASE_TILE,true);poly=clipPlane(poly,0,(ix+1)*BASE_TILE,false);}
    if(z0!==z1){poly=clipPlane(poly,2,iz*BASE_TILE,true);poly=clipPlane(poly,2,(iz+1)*BASE_TILE,false);}
    if(poly.length<3)continue;
    const key=ix+':'+iz+':'+(constantAlpha?opacity:'varying');let tile=tiles.get(key);
    if(!tile){tile={data:[],opacity,alphas:constantAlpha?null:[]};tiles.set(key,tile);}
    for(let j=1;j<poly.length-1;j++){
     const a=poly[0],b=poly[j],c=poly[j+1],ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],
      vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
     if(Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)<1e-10)continue;
     vertex(a,tile.data,tile.alphas);vertex(b,tile.data,tile.alphas);vertex(c,tile.data,tile.alphas);
    }
   }
  }
  for(const [tile,{data,opacity,alphas}] of tiles)if(data.length){
   for(let start=0;start<data.length;start+=CHUNK_TRIANGLES*24){
    output.push(meshRecord(new Float32Array(data.slice(start,start+CHUNK_TRIANGLES*24)),{
     name:`base-${sourceIndex}-${tile}`,sourceIndex,roofMode:sourceIndex===1,
     clipBase:sourceIndex<2,_unifiedTile:true,collision:false,opacity,
     vertexAlpha:alphas?new Float32Array(alphas.slice(start/8,(start+CHUNK_TRIANGLES*24)/8)):undefined
    }));
   }
  }
 }
 return output;
}

function detailChunks(mesh){
 const data=mesh.data;
 if(!data||data.length%24)throw new Error('Loaded mesh data must use eight-float triangle vertices.');
 if(!data.length)return [];
 const material={color:WHITE,texture:null,...mesh.material};
 if(mesh._unifiedTile)return [meshRecord(data,{...mesh,material})];
 const tiles=new Map();
 for(let o=0;o<data.length;o+=24){
  const x=(data[o]+data[o+8]+data[o+16])/3,z=(data[o+2]+data[o+10]+data[o+18])/3;
  if(!Number.isFinite(x)||!Number.isFinite(z))throw new Error('Detail mesh contains non-finite positions.');
  const key=Math.floor(x/DETAIL_TILE)+':'+Math.floor(z/DETAIL_TILE);
  let tile=tiles.get(key);if(!tile){tile=[];tiles.set(key,tile);}tile.push(o);
 }
 const out=[];
 for(const list of tiles.values())for(let first=0;first<list.length;first+=CHUNK_TRIANGLES){
  const len=Math.min(CHUNK_TRIANGLES,list.length-first),buffer=new Float32Array(len*24),alpha=mesh.vertexAlpha?new Float32Array(len*3):undefined;
  for(let i=0;i<len;i++){
   const offset=list[first+i];for(let k=0;k<24;k++)buffer[i*24+k]=data[offset+k];
   if(alpha)for(let k=0;k<3;k++)alpha[i*3+k]=mesh.vertexAlpha[offset/8+k];
  }
  out.push(meshRecord(buffer,{material,name:mesh.name,clipBase:mesh.clipBase,
   clipDetail:mesh.clipDetail,opacity:mesh.opacity,vertexAlpha:alpha,collision:false,_unifiedTile:true}));
 }
 return out;
}

function planesFor(eye,target,fov,aspect){
 const dx=target[0]-eye[0],dy=target[1]-eye[1],dz=target[2]-eye[2],len=Math.hypot(dx,dy,dz);
 if(len<.000001)throw new Error('Camera target must differ from eye.');
 const yaw=Math.atan2(dx,-dz),pitch=Math.asin(clamp(dy/len,-1,1)),s=Math.sin(yaw),c=Math.cos(yaw),
  p=Math.sin(pitch),q=Math.cos(pitch),r=[c,0,s],u=[-s*p,q,c*p],f=[s*q,p,-c*q],
  ty=Math.tan(fov*Math.PI/360),tx=ty*aspect;
 const planes=[f];
 for(const [a,t] of [[r,tx],[u,ty]])for(const sign of [-1,1])planes.push([a[0]*sign+f[0]*t,a[1]*sign+f[1]*t,a[2]*sign+f[2]*t]);
 return {camera:{eye,yaw,pitch},planes};
}
function visible(mesh,eye,planes){
 const c=mesh._center,e=mesh._extent,x=c[0]-eye[0],y=c[1]-eye[1],z=c[2]-eye[2];
 for(let i=0;i<planes.length;i++){
  const p=planes[i],d=x*p[0]+y*p[1]+z*p[2],r=e[0]*Math.abs(p[0])+e[1]*Math.abs(p[1])+e[2]*Math.abs(p[2]);
  if(d+r<(i===0?.045:0))return false;
 }return true;
}

/** draw returns timing/count diagnostics, not a promised display frame rate. */
export function createUnifiedCPU(canvas){
 const scene={meshes:[],background:BACKGROUND,uvOrigin:'bottom-left'};
 const renderer=makeSoftware(canvas,scene);
 let cache=new WeakMap(),allBoxes=[],boxKey=null,maskVersion=0,disposed=false,
  movingScale=1,lastStats=null;

 function prepare(mesh,base){
  let entry=cache.get(mesh);
  const own=base?null:mesh.clipDetail,ownKey=own==null?'unmasked':signature(rectsOf(own));
  if(!entry||entry.data!==mesh.data||entry.length!==mesh.data.length||entry.material!==mesh.material||entry.vertexAlpha!==mesh.vertexAlpha){
   entry={data:mesh.data,length:mesh.data.length,material:mesh.material,vertexAlpha:mesh.vertexAlpha,chunks:detailChunks(mesh),version:-1,ownKey:null,base};cache.set(mesh,entry);
  }
  if(entry.version!==maskVersion||entry.ownKey!==ownKey||entry.base!==base||entry.discardAt!==mesh.discardAt||entry.opacity!==mesh.opacity){
   const ownBoxes=base?null:own==null?null:rectsOf(own);entry.ready=[];
   for(const chunk of entry.chunks){
    chunk.discardAt=null;chunk.opacity=mesh.opacity;
    const masks=base?allBoxes:ownBoxes;
    if(masks!==null){
     const near=masks.filter(r=>overlaps(chunk.bounds,r)),covered=near.some(r=>containsBounds(r,chunk.bounds));
     if(base){if(covered)continue;if(near.length)chunk.discardAt=discardInside(near);}
     else{if(!near.length)continue;if(!covered)chunk.discardAt=discardOutside(near);}
    }
    const maskDiscard=chunk.discardAt,sourceDiscard=mesh.discardAt;
    chunk.discardAt=sourceDiscard?(maskDiscard?((x,y,z)=>maskDiscard(x,y,z)||sourceDiscard(x,y,z)):sourceDiscard):maskDiscard;
    entry.ready.push(chunk);
   }
   entry.version=maskVersion;entry.ownKey=ownKey;entry.base=base;entry.discardAt=mesh.discardAt;entry.opacity=mesh.opacity;
  }
  return entry.ready;
 }

 return {
  mode:'software',
  draw({eye,target,fov=65,width=canvas.clientWidth||canvas.width,height=canvas.clientHeight||canvas.height,
   meshes=EMPTY,baseMeshes=EMPTY,boxes=EMPTY,quality='idle'}={}){
   if(disposed)throw new Error('Unified CPU renderer has been disposed.');
   if(!finite3(eye)||!finite3(target))throw new Error('Unified CPU camera requires finite eye and target vectors.');
   if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw new Error('Invalid CPU viewport.');
   if(!Number.isFinite(fov)||fov<=1||fov>=179)throw new Error('Invalid camera FOV.');
   const started=now(),parsed=rectsOf(boxes),key=signature(parsed);
   if(key!==boxKey){allBoxes=parsed;boxKey=key;maskVersion++;}
   const idle=quality===true||quality==='idle'||quality==='high'||(typeof quality==='number'&&quality>=1)||
    (quality&&typeof quality==='object'&&quality.highQuality===true),options=typeof quality==='object'&&quality?quality:{},
    maxW=options.maxWidth||(idle?900:480*movingScale),maxH=options.maxHeight||(idle?560:300*movingScale),
    scale=Math.min(1,maxW/width,maxH/height),W=Math.max(1,Math.round(width*scale)),H=Math.max(1,Math.round(height*scale));
   if(canvas.width!==W)canvas.width=W;if(canvas.height!==H)canvas.height=H;
   const {camera,planes}=planesFor(eye,target,fov,W/H),list=[];
   let available=0,masked=0;
   function add(collection,base){
    for(const source of collection){
     for(const mesh of prepare(source,base&&source.clipBase!==false)){
      available++;if(!visible(mesh,eye,planes))continue;
      const b=mesh.bounds,dx=Math.max(b.min[0]-eye[0],0,eye[0]-b.max[0]),
       dy=Math.max(b.min[1]-eye[1],0,eye[1]-b.max[1]),dz=Math.max(b.min[2]-eye[2],0,eye[2]-b.max[2]);
      mesh._distance=dx*dx+dy*dy+dz*dz;
      if(mesh.discardAt)masked++;list.push(mesh);
     }
    }
   }
   add(meshes,false);add(baseMeshes,true);


   list.sort((a,b)=>a._distance-b._distance);scene.meshes=list;
   const rasterStart=now();renderer.draw(camera,fov,idle);const ended=now(),rasterMs=ended-rasterStart;
   if(!idle){
    if(rasterMs>120)movingScale=Math.max(.5,movingScale*.88);
    else if(rasterMs<45)movingScale=Math.min(1,movingScale*1.04);
   }
   lastStats={mode:'software',quality:idle?'idle':'moving',width:W,height:H,
    visibleChunks:list.length,availableChunks:available,maskedChunks:masked,
    triangles:list.reduce((n,m)=>n+m.count/3,0),prepareMs:rasterStart-started,rasterMs,totalMs:ended-started};
   return {...lastStats};
  },
  getStats(){return lastStats?{...lastStats}:null;},
  invalidate(){cache=new WeakMap();maskVersion++;},
  dispose(){if(disposed)return;disposed=true;renderer.dispose();scene.meshes=[];cache=new WeakMap();allBoxes=[];}
 };
}

export default createUnifiedCPU;
