// Finishing proposal lighting. No shafts, openings, exterior trim or load-bearing geometry.
// Each line is a luminaire design and its light falloff, neither verified lighting nor construction.
const zones=[
 {bounds:[565,842,614,936], ceiling:0xe2dfd3, tone:[1,.98,.94], bars:[[586,862,586,904],[600,894,600,923]],kind:'linear'},
 {bounds:[565,936,705,1045], ceiling:0xe9ddce,tone:[1,.971,.921], bars:[[573,955,694,955],[574,982,695,982],[574,1012,694,1012]],kind:'recessed'},
 {bounds:[54,1046,705,1082], ceiling:0xdeddd4,tone:[.997,.99,.96],bars:Array.from({length:12},(_,i)=>[63+i*54,1063,97+i*54,1063]),kind:'linear'},
 {bounds:[334,1085,562,1210],ceiling:0xc4c0b5,tone:[1,.98,.94],bars:[[347,1105,550,1105],[347,1145,550,1145],[347,1185,550,1185]],kind:'track'},
 {bounds:[54,1085,333,1176],ceiling:0xe4dfd3,tone:[1,.975,.947],bars:Array.from({length:5},(_,i)=>[65+i*53,1114,95+i*53,1114]).concat(Array.from({length:5},(_,i)=>[65+i*53,1151,95+i*53,1151])),kind:'linear'},
 {bounds:[54,1177,332,1332],ceiling:0xe1e1d8,tone:[.986,1,.984],bars:[1201,1248,1296].flatMap(y=>[70,139,208,277].map(x=>[x,y,x+35,y])),kind:'warehouse'},
 {bounds:[54,844,559,1045],ceiling:0xbdc8c9,tone:[.968,1,.998],bars:[886,934,974,1022].flatMap(y=>[68,169,270,371,472].map(x=>[x,y,x+67,y])),kind:'warehouse'},
 {bounds:[263,729,369,841],ceiling:0x3c4649,tone:[.97,.985,1],bars:[[279,745,279,823],[315,745,315,823],[353,745,353,823]],kind:'stage'},
 {bounds:[264,580,363,621],ceiling:0xe8dbc9,tone:[1,.969,.919],bars:[[271,586,351,586],[272,614,353,614]],kind:'recessed'},
 {bounds:[364,580,467,621],ceiling:0xdedbce,tone:[1,.982,.951],bars:[[375,596,455,596]],kind:'linear'},
 {bounds:[283,651,468,690],ceiling:0xebe2d6,tone:[1,.972,.927],bars:[[294,656,456,656],[294,685,456,685]],kind:'recessed'},
 {bounds:[263,622,469,650],ceiling:null,tone:[1,.985,.962],bars:[[291,641,319,641],[366,641,391,641],[426,642,451,642]],kind:'facade'},
 {bounds:[515,578,614,621],ceiling:0xe0ddd2,tone:[1,.99,.961],bars:[[527,599,562,599],[570,599,606,599]],kind:'linear'},
 {bounds:[708,325,761,374],ceiling:0xdadbd3,tone:[.99,.993,.97],bars:[[720,339,750,339],[720,359,750,359]],kind:'linear'}
];
export function addZoneLights({box,round,roof,line,xyz,sc}){
 for(const {bounds:[x,y,X,Y],ceiling,tone,bars,kind} of zones){
  const z=2.948;
  if(ceiling){
   const cols=Math.ceil((X-x)/19),rows=Math.ceil((Y-y)/20);
   for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
    const A=x+(X-x)*i/cols,B=x+(X-x)*(i+1)/cols,C=y+(Y-y)*j/rows,D=y+(Y-y)*(j+1)/rows;
    roof([xyz(A,C,z),xyz(A,D,z),xyz(B,D,z),xyz(B,C,z)],ceiling);
   }
  }
  for(const [a,b,c,d] of bars){
   if(kind==='facade'){
    box((a+c)/2,622.9,.38,.12,.16,2.37,0x746b61);box((a+c)/2,623.5,.32,.07,.05,2.40,0xf5e4c8);continue;
   }
   const track=['track','stage'].includes(kind), body=track?0x353b3d:kind==='recessed'?0xe7ddca:0x53595a,width=track?.061:kind==='warehouse'?.17:.095;
   line(a,b,c,d,.06,2.863,body,width);
   if(track){
    const n=Math.ceil(Math.hypot(c-a,d-b)/21);
    for(let i=0;i<n;i++){
     const v=(i+.5)/n,sx=a+(c-a)*v,sy=b+(d-b)*v;
     round(sx,sy,.072,.072,.13,2.733,0x3e4241,0,12);
     round(sx,sy,.062,.062,.028,2.715,kind==='stage'?0xf5e6d2:0xffedd2,0,12);
    }
   }else line(a,b,c,d,.028,2.836,kind==='warehouse'?0xf0f7f2:0xffeed5,width*.85);
  }
 }
}
export function makeZoneTint(sc){
 const index=new Map();
 for(const zone of zones){
  const [a,b,c,d]=zone.bounds.map((v,i)=>(v-(i%2?785:395))*sc);
  const record={...zone, bounds:[a,b,c,d], bars:zone.bars.map(h=>h.map((v,i)=>(v-(i%2?785:395))*sc))};
  for(let j=Math.floor(b/6);j<=Math.floor(d/6);j++)for(let i=Math.floor(a/6);i<=Math.floor(c/6);i++){
   const key=(i+300)*1000+j,a=index.get(key)||[];a.push(record);index.set(key,a);
  }
 }
 return function tint(x,y,z,r,g,b){
  const cell=index.get((Math.floor(x/6)+300)*1000+Math.floor(z/6));if(!cell)return;
  for(const u of cell){
   const [A,B,C,D]=u.bounds;
   if(x<A||x>C||z<B||z>D)continue;
   const radius=.63+Math.max(0,2.89-y)*.62, rr=radius*radius;
   let light=0;
   for(const [a,b,c,d] of u.bars){
    const dx=c-a,dz=d-b,t=Math.max(0,Math.min(1,((x-a)*dx+(z-b)*dz)/(dx*dx+dz*dz||1)));
    const s=(x-a-t*dx)**2+(z-b-t*dz)**2;
    if(s<rr*3)light+=Math.exp(-2*s/rr);
   }
   const wallGap=Math.max(0,Math.min(x-A,C-x,z-B,D-z)), v=Math.min(1,wallGap/.5);
   const warm=u.kind==='stage'?[.10,.103,.116]:['track','recessed','facade'].includes(u.kind)?[.14,.106,.063]:[.115,.109,.093];
   const e=Math.min(.92,light*.7)*v, dark=u.kind==='stage'?.945:.986;
   return [r+(Math.min(1,r*u.tone[0]*dark+warm[0]*e)-r)*v,g+(Math.min(1,g*u.tone[1]*dark+warm[1]*e)-g)*v,b+(Math.min(1,b*u.tone[2]*dark+warm[2]*e)-b)*v];
  }
 };
}
