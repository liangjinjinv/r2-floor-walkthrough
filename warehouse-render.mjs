/**
 * Station 08, actual triangle-mesh walkthrough, not a panorama or a video.
 *
 * Host:
 *   const view = await createWarehouseRenderer(canvas, {
 *     assetUrl: 'warehouse-assets/scene.json',
 *     onStatus: message => status.textContent = message, // string
 *     onReady: api => { ... }                          // after first frame
 *   });
 *   view.setPreset(0); view.setInput('KeyW', true); view.setInput('KeyW', false);
 *   view.dispose();
 *
 * Scene contract (Y up, metres):
 * {version:1, uvOrigin:'bottom-left', background:[r,g,b], eyeHeight:1.62,
 *  meshes:[{positions:[x,y,z,...],uvs:[u,v,...],colors?:[r,g,b,...],
 *           indices?:[i,...],material:0}],
 *  materials:[{baseColor:[r,g,b],lightmap:'atlas.png'}],
 *  presets:[{label:'...',eye:[x,y,z],target:[x,y,z]}],
 *  walkBounds:{min:[x,z],max:[x,z]},
 *  collisionBoxes?:[{min:[x,y,z],max:[x,y,z]}]}
 * Array fields may instead be {url:'buffer.bin',type:'float32'|'uint32',
 * byteOffset:0,length:N}. A material's texture/map aliases lightmap. Combined
 * baked colour/light images are displayed directly, without double lighting.
 * Untyped lightmap defaults to a combined sRGB beauty bake, not raw irradiance.
 *
 * API: canvas, mode ('webgl2'|'webgl1'|'software'), presets,
 * setPreset(index), setCamera({eye,target}), getCamera(), setInput(code,active),
 * resize(), dispose(). Keyboard: WASD/arrows, Shift; pointer drag: look.
 * setCamera/setPreset return false when an unsafe position is rejected.
 * Canvas software fallback uses perspective-correct textured triangles and a
 * real depth buffer. It is an honest lower-resolution/slower mesh renderer,
 * not a static substitute. No insecure GPU flags or external dependencies.
 */

const TAU=Math.PI*2, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const MOVE=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight']);
const finite3=v=>v&&v.length===3&&v.every(Number.isFinite);

async function arrayData(value,Type,base,signal){
 if(value==null)return null;
 if(ArrayBuffer.isView(value))return value;
 if(Array.isArray(value))return new Type(value);
 const url=typeof value==='string'?value:value.url;
 if(!url)throw new Error('网格数组缺少数据或 URL。');
 const response=await fetch(new URL(url,base),{signal});
 if(!response.ok)throw new Error(`无法加载网格数据 (${response.status})。`);
 const data=await response.arrayBuffer(),T=value.type==='uint16'?Uint16Array:value.type==='uint32'?Uint32Array:Type;
 return new T(data,value.byteOffset||0,value.length);
}

async function imageData(url,base,signal){
 const response=await fetch(new URL(url,base),{signal});
 if(!response.ok)throw new Error(`无法加载烘焙贴图 (${response.status})。`);
 const blob=await response.blob();
 let image;
 if(typeof createImageBitmap==='function')image=await createImageBitmap(blob);
 else image=await new Promise((resolve,reject)=>{const im=new Image(),u=URL.createObjectURL(blob);im.onload=()=>{URL.revokeObjectURL(u);resolve(im);};im.onerror=()=>{URL.revokeObjectURL(u);reject(new Error('贴图解码失败。'));};im.src=u;});
 const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
 const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
 return {image,width:image.width,height:image.height,pixels:ctx.getImageData(0,0,c.width,c.height).data};
}

async function loadScene(assetUrl,signal){
 const base=new URL(assetUrl,document.baseURI),response=await fetch(base,{signal});
 if(!response.ok)throw new Error(`场景加载失败 (${response.status})。`);
 const scene=await response.json();
 if(!Array.isArray(scene.meshes)||!scene.meshes.length)throw new Error('场景没有可漫游的三角网格。');
 const textureCache=new Map();
 const materials=await Promise.all((scene.materials||[{}]).map(async material=>{
  const file=material.lightmap||material.texture||material.map;
  let texture=null;
  if(file){const url=typeof file==='string'?file:file.url;if(!textureCache.has(url))textureCache.set(url,imageData(url,base,signal));texture=await textureCache.get(url);}
  return {...material,color:(material.baseColor||[1,1,1]).slice(0,3),texture};
 }));
 const meshes=await Promise.all(scene.meshes.map(async mesh=>{
  const [positions,uvs,colors,indices]=await Promise.all([
   arrayData(mesh.positions,Float32Array,base,signal),arrayData(mesh.uvs||mesh.uv,Float32Array,base,signal),
   arrayData(mesh.colors,Float32Array,base,signal),arrayData(mesh.indices,Uint32Array,base,signal)
  ]);
  if(!positions||positions.length%3)throw new Error('无效的位置数组。');
  const count=indices?indices.length:positions.length/3;
  if(count%3||count>3000000)throw new Error('无效或过大的三角网格。');
  const data=new Float32Array(count*8),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let n=0;n<count;n++){
   const i=indices?indices[n]:n,o=n*8;
   if(i<0||i*3+2>=positions.length)throw new Error('网格索引超出范围。');
   for(let k=0;k<3;k++){const v=positions[i*3+k];if(!Number.isFinite(v))throw new Error('网格坐标无效。');data[o+k]=v;min[k]=Math.min(min[k],v);max[k]=Math.max(max[k],v);}
   data[o+3]=uvs?uvs[i*2]:0;data[o+4]=uvs?uvs[i*2+1]:0;
   for(let k=0;k<3;k++)data[o+5+k]=colors?colors[i*3+k]:1;
  }
  return {data,count,bounds:{min,max},material:materials[mesh.material||0]||materials[0],collision:mesh.collision!==false,name:mesh.name||''};
 }));
 return {...scene,meshes,materials,textureCache};
}

function cameraFrom(preset){
 if(!finite3(preset.eye)||!finite3(preset.target))throw new Error('场景相机需要有效 eye/target 坐标。');
 const d=preset.target.map((v,i)=>v-preset.eye[i]),length=Math.hypot(...d);
 if(length<.001)throw new Error('相机目标与眼点重合。');
 return {eye:[...preset.eye],yaw:Math.atan2(d[0],-d[2]),pitch:Math.asin(clamp(d[1]/length,-1,1))};
}

function basis(camera){
 const s=Math.sin(camera.yaw),c=Math.cos(camera.yaw),p=Math.sin(camera.pitch),q=Math.cos(camera.pitch);
 return {r:[c,0,s],u:[-s*p,q,c*p],f:[s*q,p,-c*q]};
}

function viewMatrix(camera){
 const {r,u,f}=basis(camera),e=camera.eye,dot=a=>a[0]*e[0]+a[1]*e[1]+a[2]*e[2];
 return new Float32Array([r[0],u[0],-f[0],0,r[1],u[1],-f[1],0,r[2],u[2],-f[2],0,-dot(r),-dot(u),dot(f),1]);
}

function projection(aspect,fov,near=.045,far=120){
 const f=1/Math.tan(fov*Math.PI/360);
 return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
}

function makeGL(canvas,scene){
 const settings={alpha:false,antialias:true,depth:true,stencil:false,powerPreference:'high-performance'};
 let gl=canvas.getContext('webgl2',settings),webgl2=!!gl;
 if(!gl)gl=canvas.getContext('webgl',settings)||canvas.getContext('experimental-webgl',settings);
 if(!gl)return null;
 const precision=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT)?.precision?'highp':'mediump';
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const err=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error(err||'Shader compilation failed');}return s;}
 const vs=webgl2?`#version 300 es
 in vec3 position;in vec2 uv;in vec3 color;uniform mat4 view;uniform mat4 projection;out vec2 vUV;out vec3 vColor;void main(){vUV=uv;vColor=color;gl_Position=projection*view*vec4(position,1.);}`:
 `attribute vec3 position;attribute vec2 uv;attribute vec3 color;uniform mat4 view;uniform mat4 projection;varying ${precision} vec2 vUV;varying ${precision} vec3 vColor;void main(){vUV=uv;vColor=color;gl_Position=projection*view*vec4(position,1.);}`;
 const fs=webgl2?`#version 300 es
 precision highp float;in vec2 vUV;in vec3 vColor;uniform sampler2D baked;uniform vec3 baseColor;out vec4 outColor;void main(){outColor=vec4(texture(baked,vUV).rgb*vColor*baseColor,1.);}`:
 `precision ${precision} float;varying ${precision} vec2 vUV;varying ${precision} vec3 vColor;uniform sampler2D baked;uniform vec3 baseColor;void main(){gl_FragColor=vec4(texture2D(baked,vUV).rgb*vColor*baseColor,1.);}`;
 const program=gl.createProgram(),vert=shader(gl.VERTEX_SHADER,vs),frag=shader(gl.FRAGMENT_SHADER,fs);
 gl.attachShader(program,vert);gl.attachShader(program,frag);gl.linkProgram(program);gl.deleteShader(vert);gl.deleteShader(frag);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'Shader link failed');
 const locations={};for(const n of ['view','projection','baked','baseColor'])locations[n]=gl.getUniformLocation(program,n);
 const attributes=['position','uv','color'].map(n=>gl.getAttribLocation(program,n));
 const buffers=scene.meshes.map(mesh=>{const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,mesh.data,gl.STATIC_DRAW);return buffer;});
 const textures=new Map();
 for(const material of scene.materials){
  const source=material.texture;
  if(textures.has(source))continue;
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  // ImageBitmap ignores UNPACK_FLIP_Y_WEBGL on some implementations. Upload
  // via its decoded RGBA pixels and explicitly orient rows for parity with CPU.
  if(source){
   const pixels=source.pixels;
   if(scene.uvOrigin!=='top-left'){
    const flipped=new Uint8Array(pixels.length),stride=source.width*4;
    for(let row=0;row<source.height;row++)flipped.set(pixels.subarray(row*stride,(row+1)*stride),(source.height-1-row)*stride);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,source.width,source.height,0,gl.RGBA,gl.UNSIGNED_BYTE,flipped);
   }else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,source.width,source.height,0,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  }else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  const pot=n=>(n&(n-1))===0;
  if(source&&(webgl2||(pot(source.width)&&pot(source.height)))){gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);}else gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  textures.set(source,texture);
 }
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);
 return {mode:webgl2?'webgl2':'webgl1',draw(camera,fov){
  gl.viewport(0,0,canvas.width,canvas.height);const bg=scene.background||[.72,.74,.72];gl.clearColor(...bg.slice(0,3),1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);gl.uniformMatrix4fv(locations.view,false,viewMatrix(camera));gl.uniformMatrix4fv(locations.projection,false,projection(canvas.width/canvas.height,fov));gl.uniform1i(locations.baked,0);gl.activeTexture(gl.TEXTURE0);
  scene.meshes.forEach((mesh,i)=>{gl.bindBuffer(gl.ARRAY_BUFFER,buffers[i]);for(let k=0;k<3;k++){gl.enableVertexAttribArray(attributes[k]);gl.vertexAttribPointer(attributes[k],k===1?2:3,gl.FLOAT,false,32,[0,12,20][k]);}gl.bindTexture(gl.TEXTURE_2D,textures.get(mesh.material.texture));gl.uniform3fv(locations.baseColor,mesh.material.color);gl.drawArrays(gl.TRIANGLES,0,mesh.count);});
 },dispose(){buffers.forEach(b=>gl.deleteBuffer(b));for(const t of textures.values())gl.deleteTexture(t);gl.deleteProgram(program);}};
}

function nearClip(vertices,near){
 const out=[];for(let i=0;i<vertices.length;i++){
  const a=vertices[i],b=vertices[(i+1)%vertices.length],ai=a[2]>=near,bi=b[2]>=near;
  if(ai)out.push(a);
  if(ai!==bi){const t=(near-a[2])/(b[2]-a[2]);out.push(a.map((v,k)=>v+(b[k]-v)*t));}
 }return out;
}

function boundsVisible(bounds,eye,r,u,f,tanX,tanY){
 if(!bounds)return true;
 const out=[true,true,true,true,true];
 for(let i=0;i<8;i++){
  const x=(i&1?bounds.max[0]:bounds.min[0])-eye[0],y=(i&2?bounds.max[1]:bounds.min[1])-eye[1],z=(i&4?bounds.max[2]:bounds.min[2])-eye[2];
  const X=x*r[0]+y*r[1]+z*r[2],Y=x*u[0]+y*u[1]+z*u[2],Z=x*f[0]+y*f[1]+z*f[2];
  if(Z>=.045)out[0]=false;if(X>=-Z*tanX)out[1]=false;if(X<=Z*tanX)out[2]=false;if(Y>=-Z*tanY)out[3]=false;if(Y<=Z*tanY)out[4]=false;
 }return !out.some(Boolean);
}

function makeSoftware(canvas,scene){
 const ctx=canvas.getContext('2d',{alpha:false});
 if(!ctx)throw new Error('此浏览器既没有 WebGL，也没有可用的 Canvas 2D。');
 let buffer,depth,width=0,height=0;
 return {mode:'software',draw(camera,fov,highQuality){
  if(width!==canvas.width||height!==canvas.height){width=canvas.width;height=canvas.height;buffer=ctx.createImageData(width,height);depth=new Float32Array(width*height);}
  const bg=scene.background||[.72,.74,.72],bg32=(255<<24)|((bg[2]*255)<<16)|((bg[1]*255)<<8)|(bg[0]*255);
  new Uint32Array(buffer.data.buffer).fill(bg32);depth.fill(0);
  const pixels=buffer.data,{r,u,f}=basis(camera),eye=camera.eye,tanY=Math.tan(fov*Math.PI/360),tanX=tanY*width/height,scale=height/(2*tanY),hw=width/2,hh=height/2;
  const transformed=new Float32Array(24);
  for(const mesh of scene.meshes){
   if(!boundsVisible(mesh.bounds,eye,r,u,f,tanX,tanY))continue;
   const data=mesh.data,texture=mesh.material.texture,base=mesh.material.color;
   for(let o=0;o<data.length;o+=24){
    let behind=0;const triangle=[];
    for(let j=0;j<3;j++){
     const s=o+j*8,x=data[s]-eye[0],y=data[s+1]-eye[1],z=data[s+2]-eye[2],n=j*8;
     transformed[n]=x*r[0]+y*r[1]+z*r[2];transformed[n+1]=x*u[0]+y*u[1]+z*u[2];transformed[n+2]=x*f[0]+y*f[1]+z*f[2];
     if(transformed[n+2]<.045)behind++;
     for(let k=3;k<8;k++)transformed[n+k]=data[s+k];triangle.push(transformed.subarray(n,n+8));
    }
    if(behind===3)continue;
    const poly=behind?nearClip(triangle,.045):triangle;
    for(let tri=1;tri<poly.length-1;tri++){
     const p=[poly[0],poly[tri],poly[tri+1]],sx=[],sy=[],q=[];
     for(let k=0;k<3;k++){q[k]=1/p[k][2];sx[k]=hw+p[k][0]*q[k]*scale;sy[k]=hh-p[k][1]*q[k]*scale;}
     const minX=Math.max(0,Math.floor(Math.min(...sx))),maxX=Math.min(width-1,Math.ceil(Math.max(...sx))),minY=Math.max(0,Math.floor(Math.min(...sy))),maxY=Math.min(height-1,Math.ceil(Math.max(...sy)));
     if(minX>maxX||minY>maxY)continue;
     const area=(sx[1]-sx[0])*(sy[2]-sy[0])-(sy[1]-sy[0])*(sx[2]-sx[0]);if(Math.abs(area)<.00001)continue;
     const ix=1/area,bx0=(sy[1]-sy[2])*ix,by0=(sx[2]-sx[1])*ix,bx1=(sy[2]-sy[0])*ix,by1=(sx[0]-sx[2])*ix;
     let row0=((sx[1]-(minX+.5))*(sy[2]-(minY+.5))-(sy[1]-(minY+.5))*(sx[2]-(minX+.5)))*ix;
     let row1=((sx[2]-(minX+.5))*(sy[0]-(minY+.5))-(sy[2]-(minY+.5))*(sx[0]-(minX+.5)))*ix;
     const v0=p[0],v1=p[1],v2=p[2];
     for(let y=minY;y<=maxY;y++,row0+=by0,row1+=by1){
      let a=row0,b=row1,index=y*width+minX;
      for(let x=minX;x<=maxX;x++,a+=bx0,b+=bx1,index++){
       const c=1-a-b;if(a<-.000001||b<-.000001||c<-.000001)continue;
       const aq=a*q[0],bq=b*q[1],cq=c*q[2],z=aq+bq+cq;if(z<=depth[index])continue;
       depth[index]=z;const inv=1/z,po=index*4;
       let red=255,green=255,blue=255;
       if(texture){
        const U=clamp((aq*v0[3]+bq*v1[3]+cq*v2[3])*inv,0,1),V=clamp((aq*v0[4]+bq*v1[4]+cq*v2[4])*inv,0,1),fx=U*(texture.width-1),fy=(scene.uvOrigin==='top-left'?V:1-V)*(texture.height-1);
        const tx=Math.floor(fx),ty=Math.floor(fy),pos=(ty*texture.width+tx)*4,t=texture.pixels;
        if(highQuality){
         const dx=fx-tx,dy=fy-ty,x2=Math.min(tx+1,texture.width-1),y2=Math.min(ty+1,texture.height-1),p1=(ty*texture.width+x2)*4,p2=(y2*texture.width+tx)*4,p3=(y2*texture.width+x2)*4,w0=(1-dx)*(1-dy),w1=dx*(1-dy),w2=(1-dx)*dy,w3=dx*dy;
         red=t[pos]*w0+t[p1]*w1+t[p2]*w2+t[p3]*w3;green=t[pos+1]*w0+t[p1+1]*w1+t[p2+1]*w2+t[p3+1]*w3;blue=t[pos+2]*w0+t[p1+2]*w1+t[p2+2]*w2+t[p3+2]*w3;
        }else{red=t[pos];green=t[pos+1];blue=t[pos+2];}
       }
       pixels[po]=red*base[0]*(aq*v0[5]+bq*v1[5]+cq*v2[5])*inv;pixels[po+1]=green*base[1]*(aq*v0[6]+bq*v1[6]+cq*v2[6])*inv;pixels[po+2]=blue*base[2]*(aq*v0[7]+bq*v1[7]+cq*v2[7])*inv;
      }
     }
    }
   }
  }
  ctx.putImageData(buffer,0,0);
 },dispose(){buffer=null;depth=null;}};
}

function collisionIndex(scene,eyeY,radius){
 const min=[Infinity,Infinity],max=[-Infinity,-Infinity],cells=new Map(),size=.9,footY=eyeY-(scene.eyeHeight||1.62)+.12;
 const add=poly=>{
  const lo=[Math.min(...poly.map(p=>p[0])),Math.min(...poly.map(p=>p[1]))],hi=[Math.max(...poly.map(p=>p[0])),Math.max(...poly.map(p=>p[1]))];
  for(let x=Math.floor((lo[0]-radius)/size);x<=Math.floor((hi[0]+radius)/size);x++)for(let z=Math.floor((lo[1]-radius)/size);z<=Math.floor((hi[1]+radius)/size);z++){const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(poly);}
 };
 for(const mesh of scene.meshes){const d=mesh.data;for(let i=0;i<d.length;i+=8){min[0]=Math.min(min[0],d[i]);min[1]=Math.min(min[1],d[i+2]);max[0]=Math.max(max[0],d[i]);max[1]=Math.max(max[1],d[i+2]);}}
 if(Array.isArray(scene.collisionBoxes)){
  for(const box of scene.collisionBoxes){const a=box.min,b=box.max;if(a[1]>=eyeY+.18||b[1]<=footY)continue;add([[a[0],a[2]],[b[0],a[2]],[b[0],b[2]],[a[0],b[2]]]);}
 }else{
  // Conservative capsule footprint from real geometry. Horizontal floor and
  // overhead triangles are excluded; shelves/walls/counters remain obstacles.
  for(const mesh of scene.meshes){if(!mesh.collision)continue;const d=mesh.data;for(let i=0;i<d.length;i+=24){const ys=[d[i+1],d[i+9],d[i+17]];if(Math.min(...ys)>=eyeY+.18||Math.max(...ys)<=footY)continue;add([[d[i],d[i+2]],[d[i+8],d[i+10]],[d[i+16],d[i+18]]]);}}
 }
 const bounds=scene.walkBounds||{min,max};
 const a=bounds.min.length===3?[bounds.min[0],bounds.min[2]]:bounds.min,b=bounds.max.length===3?[bounds.max[0],bounds.max[2]]:bounds.max;
 function clear(x,z){
  if(x<a[0]+radius||x>b[0]-radius||z<a[1]+radius||z>b[1]-radius)return false;
  for(const poly of cells.get(Math.floor(x/size)+','+Math.floor(z/size))||[]){
   let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const p=poly[j],q=poly[i],dx=q[0]-p[0],dz=q[1]-p[1],t=clamp(((x-p[0])*dx+(z-p[1])*dz)/(dx*dx+dz*dz||1),0,1);
    if((x-p[0]-t*dx)**2+(z-p[1]-t*dz)**2<radius*radius)return false;
    if((p[1]>z)!==(q[1]>z)&&x<(q[0]-p[0])*(z-p[1])/(q[1]-p[1])+p[0])inside=!inside;
   }if(inside)return false;
  }return true;
 }
 return {clear,bounds:{min:a,max:b}};
}

export async function createWarehouseRenderer(canvas,options={}){
 if(!(canvas instanceof HTMLCanvasElement))throw new Error('需要一个 canvas 元素。');
 const status=message=>options.onStatus?.(message),controller=new AbortController();
 if(options.signal){if(options.signal.aborted)controller.abort();else options.signal.addEventListener('abort',()=>controller.abort(),{once:true});}
 status('正在加载 08 前置仓三维网格与烘焙光照贴图…');
 const scene=await loadScene(options.assetUrl||'warehouse-assets/scene.json',controller.signal);
 const presets=(scene.presets?.length?scene.presets:[scene.spawn||scene.camera]).filter(Boolean);
 if(!presets.length)throw new Error('场景没有安全的初始相机。');
 let camera=cameraFrom(presets[0]),engine,surface=canvas;
 const collisions=collisionIndex(scene,camera.eye[1],options.radius||.22);
 if(!collisions.clear(camera.eye[0],camera.eye[2]))throw new Error('资产初始相机在碰撞区内；请修正预设，不能穿墙开始漫游。');
 try{engine=makeGL(surface,scene);}catch(error){
  // A canvas that has already acquired a GL context cannot acquire 2D.
  const next=surface.cloneNode(false);surface.replaceWith(next);surface=next;
  status('WebGL 初始化失败，正在切换真实三角网格的软件渲染。');
 }
 if(!engine)engine=makeSoftware(surface,scene);
 surface.tabIndex=surface.tabIndex<0?0:surface.tabIndex;surface.style.touchAction='none';surface.setAttribute('aria-label','08 前置仓三维漫游。WASD 或方向键移动，拖拽转头。');
 const keys=new Set(),keyboardKeys=new Set(),buttonKeys=new Set(),listeners=[],listen=(obj,type,fn,opts)=>{obj.addEventListener(type,fn,opts);listeners.push(()=>obj.removeEventListener(type,fn,opts));};
 let dead=false,contextLost=false,dirty=true,last=performance.now(),lastDraw=0,lastChange=last,hq=false,frame=0,pointer=null;
 const fov=clamp(options.fov||scene.fov||62,35,90),software=engine.mode==='software';
 function invalidate(){dirty=true;hq=false;lastChange=performance.now();}
 function syncInput(){keys.clear();for(const code of keyboardKeys)keys.add(code);for(const code of buttonKeys)keys.add(code);invalidate();}
 function setInput(code,active,keyboard=false){if(!MOVE.has(code))return false;const set=keyboard?keyboardKeys:buttonKeys;active?set.add(code):set.delete(code);syncInput();return true;}
 function clearInput(){keyboardKeys.clear();buttonKeys.clear();syncInput();pointer=null;}
 function resize(highQuality=true){
  const rect=surface.getBoundingClientRect(),w=rect.width||surface.clientWidth||960,h=rect.height||surface.clientHeight||540;
  const ratio=software?Math.min(1,(highQuality?960:640)/w):Math.min(window.devicePixelRatio||1,options.maxPixelRatio||2);
  const W=Math.max(1,Math.round(w*ratio)),H=Math.max(1,Math.round(h*ratio));
  if(surface.width!==W||surface.height!==H){surface.width=W;surface.height=H;dirty=true;}
 }
 function setCamera(value){
  const next=cameraFrom(value);
  if(Math.abs(next.eye[1]-camera.eye[1])>.2||!collisions.clear(next.eye[0],next.eye[2])){status('该观察点不在当前安全步行区域，已保留原位置。');return false;}
  camera=next;clearInput();return true;
 }
 function getCamera(){const {f}=basis(camera);return {eye:[...camera.eye],target:camera.eye.map((v,i)=>v+f[i]),yaw:camera.yaw,pitch:camera.pitch};}
 function setPreset(index){const value=presets[index];return value?setCamera(value):false;}
 listen(surface,'keydown',event=>{if(MOVE.has(event.code)){event.preventDefault();setInput(event.code,true,true);}});
 listen(surface,'keyup',event=>{if(MOVE.has(event.code)){event.preventDefault();setInput(event.code,false,true);}});
 // Clicking a held movement button may blur the canvas. Only physical keys
 // should be released then; externally held buttons remain active until up.
 listen(surface,'blur',()=>{keyboardKeys.clear();syncInput();});listen(window,'blur',clearInput);
 listen(surface,'pointerdown',event=>{if(event.button!==0||pointer)return;surface.focus({preventScroll:true});pointer={id:event.pointerId,x:event.clientX,y:event.clientY};surface.setPointerCapture(event.pointerId);event.preventDefault();});
 listen(surface,'pointermove',event=>{if(!pointer||event.pointerId!==pointer.id)return;camera.yaw=(camera.yaw+(event.clientX-pointer.x)*.004)%TAU;camera.pitch=clamp(camera.pitch-(event.clientY-pointer.y)*.0035,-1.15,1.15);pointer.x=event.clientX;pointer.y=event.clientY;invalidate();});
 const release=event=>{if(pointer?.id===event.pointerId){pointer=null;invalidate();}};
 listen(surface,'pointerup',release);listen(surface,'pointercancel',release);listen(surface,'lostpointercapture',release);
 listen(surface,'contextmenu',event=>event.preventDefault());
 listen(surface,'webglcontextlost',event=>{event.preventDefault();contextLost=true;clearInput();status('图形上下文已中断，正在等待浏览器恢复；当前画面暂未实时更新。');});
 listen(surface,'webglcontextrestored',()=>{try{engine.dispose();engine=makeGL(surface,scene);contextLost=false;invalidate();status('WebGL 上下文已恢复，可以继续实时漫游。');}catch(error){status('WebGL 恢复失败，请重新加载预览。');}});
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(()=>{resize();invalidate();}):null;
 observer?.observe(surface);if(!observer)listen(window,'resize',()=>{resize();invalidate();});
 function tick(now){
  if(dead)return;const dt=Math.min(.12,(now-last)/1000);last=now;
  let ahead=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),side=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
  if(!contextLost&&(ahead||side)){const length=Math.hypot(ahead,side),speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?2.1:1.25)*dt/length,s=Math.sin(camera.yaw),c=Math.cos(camera.yaw),dx=(ahead*s+side*c)*speed,dz=(-ahead*c+side*s)*speed;
   // Axis sliding plus substeps prevents wall tunneling and eases aisle turns.
   const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.07));for(let i=0;i<n;i++){if(collisions.clear(camera.eye[0]+dx/n,camera.eye[2]))camera.eye[0]+=dx/n;if(collisions.clear(camera.eye[0],camera.eye[2]+dz/n))camera.eye[2]+=dz/n;}invalidate();
  }
  const idle=!keys.size&&!pointer&&now-lastChange>220;
  if(!contextLost&&((dirty&&(!software||now-lastDraw>65))||(software&&idle&&!hq))){
   resize(idle||!software);engine.draw(camera,fov,idle);dirty=false;hq=idle;lastDraw=now;
  }
  frame=requestAnimationFrame(tick);
 }
 const api={canvas:surface,mode:engine.mode,presets:presets.map(p=>({...p,eye:[...p.eye],target:[...p.target]})),setInput,setCamera,getCamera,setPreset,
  resize(){resize();invalidate();},
  dispose(){if(dead)return;dead=true;controller.abort();cancelAnimationFrame(frame);observer?.disconnect();listeners.forEach(fn=>fn());engine.dispose();for(const texture of scene.materials.map(m=>m.texture))texture?.image?.close?.();keys.clear();}
 };
 resize(true);engine.draw(camera,fov,true);dirty=false;hq=true;
 status(software?'当前浏览器未提供 WebGL：已启用真实三角网格的软件透视渲染。仍可移动和转头，画质及帧率较低；不是静态图或全景。':`${engine.mode==='webgl2'?'WebGL 2':'WebGL 1'} 实时漫游已就绪：使用静态烘焙光照，WASD / 方向键移动，拖拽转头。`);
 options.onReady?.(api);frame=requestAnimationFrame(tick);return api;
}

export default createWarehouseRenderer;
