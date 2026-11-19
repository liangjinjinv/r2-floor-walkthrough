import {walls} from './arch.mjs';

// Proposed finishes only, independent of the structural trace and door/window schedule.
// Bounds are drawn in R2 plan coordinates. The walk line begins at 0.023 m.
const themes={
 forecourt:{col:[0xb1b4ad,0xb7b9b1,0xbcbeb7,0xc1c1b7],sx:17,sy:17,seam:.035,wall:0xccc7bc,base:0x777e7c},
 entry:{col:[0xbfbab1,0xc5c0b5,0xc9c3b8,0xc6bfb3],sx:18,sy:17,seam:.018,wall:0xe1d9ce,base:0x766957, accent:0xc6ac94},
 lobby:{col:[0xcac3b7,0xc5bdb0,0xccc4b8,0xc9c2b6],sx:21,sy:21,seam:.013,wall:0xe8e0d4,base:0x927c67,accent:0xa78162},
 corridor:{col:[0xb7b7b0,0xb3b3ac,0xbdbcb3],sx:18,sy:13,seam:.018,wall:0xe0e0d7,base:0x687572,accent:0xd1c9b8},
 hall:{col:[0xc5c1b6,0xc1bcb0,0xccc7bd,0xc8c2b5],sx:22,sy:22,seam:.014,wall:0xd6d0c5,base:0x605a57,accent:0xa68262},
 shop:{col:[0xbfc3b9,0xbabeb6,0xc2c5bb],sx:21,sy:21,seam:.012,wall:0xd9decf,base:0x66796e,accent:0x939f83},
 industry:{col:[0xa4aeab,0xa8b2ae,0xa5aeaa],sx:54,sy:42,seam:.01,wall:0xd9dedc,base:0x6e7e7e},
 street:{col:[0xb6ae9f,0xbeb3a6,0xb1a89a,0xc0b5a8],sx:11.5,sy:13,seam:.024,wall:0xd7ccbf,base:0x908474,accent:0xa88c76},
 stage:{col:[0xabb5b6,0xaab3b4,0xaab3b5],sx:24,sy:21,seam:.008,wall:0xe1e1da,base:0x778382,accent:0x545957},
 hotel:{col:[0xbda27f,0xc0a584,0xc4ac8e,0xb59b7b],sx:21,sy:5.6,seam:.008,wall:0xdfcebd,base:0x826650,accent:0x9f795a},
 residential:{col:[0xb7a899,0xbfb0a0,0xc0b2a2],sx:11,sy:14,seam:.019,wall:0xe2d8cc,base:0x8c8071},
 portal:{col:[0xaaa9a0,0xb4b0a4,0xafa99c],sx:10,sy:18,seam:.024,wall:0xd2c8bb,base:0x77766c,accent:0xafa08f},
 outdoor:{col:[0xa4aaa7,0xabb0aa,0xb2b5ac,0xa9aeaa],sx:13,sy:13,seam:.031,wall:0xc8c7bf,base:0x818e8d},
 lift:{col:[0xb8bab6,0xbcbeb8,0xc3c5bf],sx:11,sy:12,seam:.019,wall:0xdcdfd8,base:0x7b8684,accent:0xa1afa9},
};
const bounds=[
 [663,769,765,935,'forecourt'],
 [565,843,613,935,'entry'],
 [565,936,705,1045,'lobby'],
 [53,1047,704,1081,'corridor'],
 [334,1086,562,1208,'hall'],
 [54,1086,332,1154,'shop'], [54,1154,332,1189,'shop'], [54,1189,332,1331,'shop'],
 [54,844,559,1043,'industry'],
 [263,728,369,840,'stage'],
 [263,622,468,650,'street'], [263,650,282,691,'street'],
 [263,691,469,726,'street'], [469,623,514,840,'street'],
 [263,579,362,621,'hotel'], [283,651,468,690,'hotel'],
 [363,579,468,621,'residential'],
 [469,578,514,622,'street'], [515,578,614,621,'portal'],
 [616,528,659,621,'outdoor'], [661,527,765,768,'outdoor'],
 [709,326,761,370,'lift'],
];
// All suggested finishes stay on known solid-wall faces. No overlays are applied to glazing or door apertures.
function boundaryRuns(w,zone) {
 const [x,y,X,Y]=w,[a,b,c,d]=zone, eps=4.8, runs=[];
 if(Math.abs(Y-y)<.8){
  const s=Math.min(x,X),e=Math.max(x,X),u=Math.max(a,s),v=Math.min(c,e);
  if(v-u<6)return runs;
  if(Math.abs(y-b)<=eps) runs.push([u,y,v,y,0,1]);
  else if(Math.abs(y-d)<=eps) runs.push([u,y,v,y,0,-1]);
 }else if(Math.abs(X-x)<.8){
  const s=Math.min(y,Y),e=Math.max(y,Y),u=Math.max(b,s),v=Math.min(d,e);
  if(v-u<6)return runs;
  if(Math.abs(x-a)<=eps)runs.push([x,u,x,v,1,0]);
  else if(Math.abs(x-c)<=eps)runs.push([x,u,x,v,-1,0]);
 }
 return runs;
}
export const zoneSurfaceMapping={1:'室外浅灰石材',2:'迎宾通道浅灰石材与暖灰墙',3:'门厅水磨石、浅色墙与暖木饰面',4:'展廊浅灰铺地、局部线性展墙',5:'主展厅水磨石与暖灰墙面',6:'主展厅水磨石与局部暖木墙面',7:'店面耐磨地坪与中性绿灰墙',8:'前置仓耐磨地坪与中性绿灰墙',9:'骑手／顾客区耐磨地坪与易清洁墙脚',10:'展廊浅灰地坪；观察窗保留',11:'上线区工业灰地坪',12:'装配线工业灰地坪',13:'线尾工业灰地坪',15:'表演区齐平灰色地坪与浅中性墙面',16:'回转区暖灰仿石地面',17:'街区酒店暖木色板纹与暖灰石面过渡',18:'住宅场景中性暖灰石面',19:'街区小广场浅暖灰板块铺地',20:'街门通道深浅石材过渡',21:'室外广场浅灰外铺，原图窗门独立',22:'候梯区浅灰地坪及中性耐磨墙面'};
export function addZoneSurfaces({box,line,face,solid,xyz,sc}){
 const plane=(a,b,c,d,z,col)=>face(solid,[xyz(a,b,z),xyz(c,b,z),xyz(c,d,z),xyz(a,d,z)],col,1,1);
 const runs=new Map();
 for(let iz=0;iz<bounds.length;iz++){
  const zone=bounds[iz],[a,b,c,d,key]=zone,{col,sx,sy,seam,wall,base,accent}=themes[key];
  const nx=Math.max(1,Math.round((c-a)/sx)),ny=Math.max(1,Math.round((d-b)/sy));
  const dx=(c-a)/nx,dy=(d-b)/ny,top=.0226;
  // An opaque mortar layer fills the joint: this never covers the red route marks.
  plane(a,b,c,d,.019,base);
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
   const k=((i*13+j*7+i*j*3+9*iz)>>>0)%col.length;
   const u=a+i*dx,v=b+j*dy,p=seam/(2*sc);
   plane(u+p,v+p,u+dx-p,v+dy-p,top,col[k]);
  }
  for(const w of walls){
   if(w[4]!=='wall')continue;
   for(const r of boundaryRuns(w,zone)){
    let[x,y,X,Y,ux,uy]=r;
    const len=Math.hypot(X-x,Y-y);if(len<7)continue;
    const ddx=(X-x)/len,ddy=(Y-y)/len;
    // Trim end grain at doors and wall junctions; use a thin finish skin, not another wall.
    x+=ddx*.60;y+=ddy*.60;X-=ddx*.60;Y-=ddy*.60;
    const id=[x,y,X,Y,ux,uy].map(i=>i.toFixed(2)).join(',');
    if(runs.has(id))continue;runs.set(id,key);
    const off=.116/sc;
    line(x+ux*off,y+uy*off,X+ux*off,Y+uy*off,2.86,.027,wall,.013);
    const sk=.132/sc;
    line(x+ux*sk,y+uy*sk,X+ux*sk,Y+uy*sk,.112,.023,base,.019);
    if(accent&&len>=16){
     const sx=x+ddx*2,sy=y+ddy*2,ex=X-ddx*2,ey=Y-ddy*2;
     const sk=.142/sc;
     const isLobbyFeature=key==='lobby'&&ddx===0&&x<568&&len>=22;
     const isHallFeature=key==='hall'&&ddy===0&&y<1090;
     if(isLobbyFeature||isHallFeature){
      line(sx+ux*sk,sy+uy*sk,ex+ux*sk,ey+uy*sk,2.26,.38,accent,.037);
      const step=key==='lobby'?2.1:2.8;
      for(let t=2;t<len-3;t+=step)
       box(sx+ddx*t+ux*(sk+.32),sy+ddy*t+uy*(sk+.32),.032,.032,2.21,.405,base);
     }else{
      line(sx+ux*sk,sy+uy*sk,ex+ux*sk,ey+uy*sk,.11,.88,accent,.025);
     }
    }
   }
  }
 }
 // Shallow proposed décor attached to the verified north guestroom wall.
 // Does not add a partition, opening or furnished footprint.
 line(275,581,351,581,1.85,.48,0xb48a69,.067);
 for(let x=277;x<351;x+=4)box(x,581.43,.022,.036,1.83,.49,0xc89e7b);
 // Art is intentionally abstract and unbranded; mounting surface is the confirmed east gallery wall.
 for(const y of [1124,1148]){
  box(563.45,y,.062,.98,.70,1.42,0x775f4b);
  box(562.90,y,.034,.90,.62,1.46,0xf0e6d5);
  for(const [j,h,c] of [[-.28,.27,0x8f9e99],[0,.38,0xb37857],[.27,.21,0x999075]])
   box(562.62,y+j/sc,.029,.14,h,1.54,c);
 }
}
