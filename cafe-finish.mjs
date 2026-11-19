// C3 concept finishes only. Units and room envelope follow the existing R2 trace.
export const cafeStops = [
  {label:'入口看吧台',eye:[424,736],look:[422,786],pitch:-.037,via:[[453,740]]},
  {label:'走到吧台侧',eye:[456,768],look:[424,783],pitch:-.095,via:[[456,809]]},
  {label:'走到座位区',eye:[444,813],look:[414,806],pitch:-.135},
];
const glyphs={
  C:[[[1,1],[.26,1],[0,.78],[0,.22],[.26,0],[1,0]]],
  '3':[[[0,1],[.82,1],[1,.84],[1,.67],[.73,.5],[.24,.5]],[[.73,.5],[1,.33],[1,.17],[.82,0],[0,0]]],
  O:[[[.22,0],[.78,0],[1,.21],[1,.79],[.78,1],[.22,1],[0,.79],[0,.21],[.22,0]]],
  F:[[[0,0],[0,1],[1,1]],[[0,.54],[.77,.54]]],
  E:[[[1,0],[0,0],[0,1],[1,1]],[[0,.53],[.76,.53]]]
};
export function addCafeFinish({box,round,face,solid,xyz,sc,roof}){
 const tx=371.8, ty=730.5, rx=467.25, by=839.6;
 // Warm stone tile geometry, with shallow joints and restrained natural variation.
 const layout=[0xb6afa3,0xc5bdb0,0xcbc2b3,0xc1b8aa,0xc7beaf];
 for(let j=0;j<11;j++)for(let i=0;i<10;i++){
  const dw=(rx-tx)/10,dh=(by-ty)/11;
  box(tx+(i+.5)*dw,ty+(j+.5)*dh,dw*sc-.013,dh*sc-.013,.012,.014,layout[(i*11+j*13+i*j*3)%layout.length]);
 }
 // Keep the existing 3D wall and every opening unchanged. Apply thin finish only to inside faces.
 box(371.65,784.4,.032,108.6*sc,2.93,.012,0xe3d7c7);
 box(466.62,784.4,.032,108.6*sc,2.93,.012,0xe5d9c9);
 box(419.6,839.87,94.7*sc,.036,2.95,.014,0xe7dac8);
 for(const x of [371.97,466.37])box(x,784.4,.04,108.5*sc,.10,.012,0xba9b80);
 box(419.8,839.56,95*sc,.04,.1,.012,0xc4a58a);
 // A finished ceiling in walking view; hidden in the site-wide cutaway.
 for(let j=0;j<7;j++)for(let i=0;i<6;i++){
  const x=371.2+i*16.1,y=729.6+j*15.95,X=x+16.1,Y=y+15.95;
  roof([xyz(x,y,2.95),xyz(x,Y,2.95),xyz(X,Y,2.95),xyz(X,y,2.95)],0xe6d9c7);
 }
 // Backdrop behind the furniture, applied on an existing wall, not a new partition.
 box(424,839.20,68*sc,.12,2.63,.04,0xb68769);
 for(let i=0;i<25;i++){
  const x=391.4+i*2.71;
  box(x,838.21,.030,.08,2.59,.055,i%4===0?0xd9ad8a:0xc79b7f);
 }
 const start=433.8, size=.19, wy=837.48;
 let xCursor=start;
 for(const letter of 'C3 COFFEE'){
  if(letter===' '){xCursor-=size*.72/sc;continue;}
  for(const stroke of glyphs[letter]){
   for(let i=1;i<stroke.length;i++){
    const [a,b]=stroke[i-1],[c,d]=stroke[i],x1=xCursor-a*size*.73/sc,x2=xCursor-c*size*.73/sc;
    const z1=2.09+b*size,z2=2.09+d*size,len=Math.hypot((x2-x1)*sc,z2-z1)||.001;
    const ux=-(z2-z1)*.008/len, uz=(x2-x1)*sc*.008/len;
    const p=xyz(x1,wy,z1),q=xyz(x2,wy,z2);
    const v=[[p[0]+ux,p[1]+uz,p[2]],[q[0]+ux,q[1]+uz,q[2]],[q[0]-ux,q[1]-uz,q[2]],[p[0]-ux,p[1]-uz,p[2]]];face(solid,v,0xffedda,1,1);face(solid,[...v].reverse(),0xffedda,1,1);
   }
  }
  xCursor-=size*.99/sc;
 }
 // Three shallow drum pendants. The bottom diffuser and subtle light falloff are separate.
 for(const x of [408,423,438]){
  round(x,777,.035,.035,.045,2.906,0x635a52,0,12);
  round(x,777,.012,.012,.454,2.480,0x332b2a,0,8);
  round(x,777,.23,.23,.12,2.365,0x494039,0,20);
  round(x,777,.203,.203,.024,2.348,0xffd99e,0,20);
  const [wx,,wz]=xyz(x,777), z=2.346;
  for(let j=0;j<20;j++){
   const a=j*Math.PI/10,b=(j+1)*Math.PI/10,r=.201;
   face(solid,[[wx+r*Math.cos(a),z,wz+r*Math.sin(a)],[wx+r*Math.cos(b),z,wz+r*Math.sin(b)],[wx,z,wz],[wx,z,wz]],0xffefd4,1,1);
  }
 }
}
