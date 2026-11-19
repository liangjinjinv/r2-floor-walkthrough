import {loadScene} from './warehouse-render.mjs?v=r2-clear-glass';
import {clearBakedWalls} from './glass-walls.mjs?v=r2-clear-glass';
import {details} from './continuous.mjs';
const scale=8.4/101;
const X=x=>(x-395)*scale,Z=z=>(z-785)*scale;
export const BOX_LIMIT=24;
const entries=details.map(r=>({...r,boxes:r.rects.map(([a,b,c,d])=>[X(a),Z(b),X(c),Z(d)])}));
const distTo=(row,x,z)=>Math.min(...row.boxes.map(([a,b,c,d])=>Math.hypot(Math.max(a-x,0,x-c),Math.max(b-z,0,z-d))));
export const maskCode=(count,prefix)=>`
 uniform int ${prefix}Num;uniform vec4 ${prefix}Rects[${count}];
 bool ${prefix}Contains(vec2 p){
  for(int i=0;i<${count};i++){
   if(i>=${prefix}Num)break;
   vec4 b=${prefix}Rects[i];if(all(greaterThanEqual(p,b.xy))&&all(lessThanEqual(p,b.zw)))return true;
  }
  return false;
 }`;
export function maskSetup(gl,program,prefix,count){
 const un=gl.getUniformLocation(program,prefix+'Num'),ur=gl.getUniformLocation(program,prefix+'Rects[0]'),packed=new Float32Array(count*4);
 return boxes=>{gl.uniform1i(un,boxes.length);if(boxes.length){for(let i=0;i<boxes.length;i++)packed.set(boxes[i],i*4);gl.uniform4fv(ur,packed);}};
}
function detailGPU(gl){
 const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
 const prog=gl.createProgram(),v=sh(gl.VERTEX_SHADER,`attribute vec3 p;attribute vec2 uv;attribute vec3 col;uniform mat4 P,V;varying vec2 U;varying vec3 C,W;void main(){W=p;U=uv;C=col;gl_Position=P*V*vec4(p,1.);}`),f=sh(gl.FRAGMENT_SHADER,`precision highp float;varying vec2 U;varying vec3 C,W;uniform sampler2D atlas;uniform vec3 tint;uniform float flipV;
 ${maskCode(8,'piece')}
 void main(){if(!pieceContains(W.xz))discard;gl_FragColor=vec4(texture2D(atlas,vec2(U.x,mix(U.y,1.-U.y,flipV))).rgb*C*tint,1.);}`);
 gl.attachShader(prog,v);gl.attachShader(prog,f);gl.linkProgram(prog);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));
 const p=gl.getAttribLocation(prog,'p'),uv=gl.getAttribLocation(prog,'uv'),col=gl.getAttribLocation(prog,'col');
 const un=Object.fromEntries(['P','V','atlas','tint','flipV'].map(k=>[k,gl.getUniformLocation(prog,k)])),set=maskSetup(gl,prog,'piece',8);
 return {install(scene){
  const textures=new Map();
  const parts=scene.meshes.map(m=>{
   const src=m.material.texture;let t=textures.get(src);
   if(!t){t=gl.createTexture();textures.set(src,t);gl.bindTexture(gl.TEXTURE_2D,t);
    if(src)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,src.width,src.height,0,gl.RGBA,gl.UNSIGNED_BYTE,src.pixels);
    else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    const pot=n=>(n&(n-1))===0;if(src&&pot(src.width)&&pot(src.height)){gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);}
   }
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,m.data,gl.STATIC_DRAW);
   return {texture:t,buffer,count:m.count,tint:m.material.color};
  });
  return {parts,flip:scene.uvOrigin==='top-left'?0:1,dispose(){for(const {buffer} of parts)gl.deleteBuffer(buffer);for(const t of textures.values())gl.deleteTexture(t);}};
 },draw(rows,P,V){
  gl.useProgram(prog);gl.disable(gl.BLEND);gl.depthMask(true);
  gl.uniformMatrix4fv(un.P,false,P);gl.uniformMatrix4fv(un.V,false,V);gl.uniform1i(un.atlas,0);gl.activeTexture(gl.TEXTURE0);
  for(const item of rows){const {parts,flip}=item.gpu;set(item.boxes);gl.uniform1f(un.flipV,flip);
   for(const part of parts){gl.bindBuffer(gl.ARRAY_BUFFER,part.buffer);gl.enableVertexAttribArray(p);gl.enableVertexAttribArray(uv);gl.enableVertexAttribArray(col);gl.vertexAttribPointer(p,3,gl.FLOAT,false,32,0);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,32,12);gl.vertexAttribPointer(col,3,gl.FLOAT,false,32,20);gl.bindTexture(gl.TEXTURE_2D,part.texture);gl.uniform3fv(un.tint,part.tint);gl.drawArrays(gl.TRIANGLES,0,part.count);}
  }
 }};
}
export function createDetailWorld(gl,onChange){
 const gpu=gl?detailGPU(gl):null;
 const ready=new Map(),pending=new Map(),failed=new Set();
 let desired=[],lastX=Infinity,lastZ=Infinity,closed=false;
 function pump(){
  if(closed)return;
  while(pending.size<2){
   const row=desired.find(r=>!ready.has(r.key)&&!pending.has(r.key)&&!failed.has(r.key));
   if(!row)break;
   const ac=new AbortController();pending.set(row.key,ac);
   loadScene(row.url,ac.signal).then(scene=>{
    if(closed||ac.signal.aborted){for(const t of scene.materials.map(m=>m.texture))t?.image?.close?.();return;}
    const ox=X(row.origin[0]),oz=Z(row.origin[1]),oy=row.elevation??0;
    for(const m of scene.meshes){
     for(let i=0;i<m.data.length;i+=8){m.data[i]+=ox;m.data[i+1]+=oy;m.data[i+2]+=oz;}
     m.bounds.min[0]+=ox;m.bounds.max[0]+=ox;m.bounds.min[1]+=oy;m.bounds.max[1]+=oy;m.bounds.min[2]+=oz;m.bounds.max[2]+=oz;
     m.clipDetail=row.boxes;
     if(!row.overlayOnly)clearBakedWalls(m);
    }
    for(const t of scene.materials.map(m=>m.texture))t?.image?.close?.();
    const sceneGPU=gpu?.install(scene);
    ready.set(row.key,{...row,gpu:sceneGPU,meshes:gpu?[]:scene.meshes});onChange();
   }).catch(err=>{if(!ac.signal.aborted){failed.add(row.key);console.warn('精细区加载失败，保留原导览模型',row.key,err);onChange();}}).finally(()=>{pending.delete(row.key);pump();});
  }
 }
 function plan(x,z){
  if(Math.hypot(x-lastX,z-lastZ)<1.5)return;
  lastX=x;lastZ=z;
  desired=entries.map(e=>[e,distTo(e,x,z)]).filter(([,d])=>d<(gl?40:24)).sort((a,b)=>a[1]-b[1]).slice(0,gl?9:5).map(([e])=>e);
  for(const v of ready.values()){if(!desired.some(e=>e.key===v.key)&&distTo(v,x,z)>(gl?48:28)){v.gpu?.dispose();ready.delete(v.key);}}
  for(const [k,ac] of pending){if(!desired.some(e=>e.key===k))ac.abort();}
  pump();
 }
 return {select(x,z){
  plan(x,z);const rows=[],boxes=[];
  for(const e of desired){const v=ready.get(e.key);if(!v||(!v.overlayOnly&&boxes.length+v.boxes.length>BOX_LIMIT))continue;rows.push(v);if(!v.overlayOnly)boxes.push(...v.boxes);}
  return {rows,boxes,meshes:gl?null:rows.flatMap(r=>r.meshes),waiting:desired.some(e=>!ready.has(e.key)&&!failed.has(e.key)),near:rows.some(r=>distTo(r,x,z)<1.5)};
 },draw(rows,P,V){if(rows.length)gpu?.draw(rows,P,V);},dispose(){closed=true;for(const ac of pending.values())ac.abort();for(const v of ready.values())v.gpu?.dispose();ready.clear();}};
}
