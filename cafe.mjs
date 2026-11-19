

const pal={dark:0x352d25,bronze:0x463d35,plinth:0x48372c,walnut:0xa26943,walnutLight:0xb88055,shadow:0x875638,woodEdge:0x9a6543,stone:0xe8ddc8,stoneEdge:0xd6c5aa,olive:0x7e885b,oliveShade:0x6f7953,oliveLight:0x8b956b,metal:0x9d9d92,stainless:0xbbbaae,ivory:0xf4ebd9};
export function makeCafeProp(k,x,y,ww,dd,deg=0,api){
 const {box,round,sc}=api,{dark,bronze,plinth,walnut,walnutLight,shadow,woodEdge,stone,stoneEdge,olive,oliveShade,oliveLight,metal,stainless,ivory}=pal;
 const w=ww*sc,d=dd*sc,a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 const xy=(u,v)=>[x+(u*c-v*s)/sc,y+(u*s+v*c)/sc];
 const b=(u,v,W,D,h,z,c)=>{const [X,Y]=xy(u,v);box(X,Y,W,D,h,z,c,a);};
 const r=(u,v,R,Q,h,z,c,n=16)=>{const [X,Y]=xy(u,v);round(X,Y,R,Q,h,z,c,a,n);};
 if(k==='counter'){
  const isBar=ww>26,base=Math.min(w,d),top=isBar?1.073:.975;
  b(0,0,w*.923,d*.82,.092,0,plinth);
  b(0,0,w*.956,d*.921,top-.145,.088,walnut);
  if(isBar){

   const n=Math.max(18,Math.round(w/.067));
   for(const dir of [-1,1]){
    b(0,dir*d*.459,w*.943,d*.036,.832,.132,shadow);
    for(let i=0;i<n;i++){
     const u=w*.908*((i+.5)/n-.5);
     b(u,dir*d*.478,w*.47/n,d*.040,.807,.151,i%5===0?walnut:walnutLight);
    }
   }
   for(const dir of [-1,1])b(dir*w*.477,0,w*.036,d*.949,.828,.13,woodEdge);
  }else{

   const n=Math.max(1,Math.round(w/.56));
   for(let i=0;i<n;i++){
    const u=w*.94*((i+.5)/n-.5);
    b(u,d*.466,w*.90/n,d*.044,.68,.161,walnutLight);
    b(u,d*.493,Math.min(.11,w*.27/n),d*.012,.027,.716,bronze);
   }
  }
  b(0,0,w,d,.072,top-.072,stone);
  return true;
 }
 if(k==='coffee'){

  const W=w,D=d,z=1.073;
  b(0,0,W*.88,D*.90,.038,z,bronze);
  b(0,-D*.046,W*.92,D*.76,.258,z+.054,stainless);
  b(0,-D*.041,W*.98,D*.79,.025,z+.306,metal);
  b(0,D*.326,W*.87,D*.077,.128,z+.148,dark);
  b(0,D*.376,W*.90,D*.227,.029,z+.049,stainless);
  for(const i of [-.26,.19]){
   b(W*i,D*.365,W*.18,D*.094,.035,z+.141,metal);
   b(W*i,D*.398,W*.071,D*.045,.047,z+.096,bronze);
   const cup=Math.min(W*.075,D*.076);
   r(W*i,D*.381,cup,cup,.048,z+.079,ivory,12);
   r(W*i,-D*.12,cup,cup,.056,z+.331,ivory,12);
  }
  for(const i of [-.26,-.20,.20,.26])r(W*i,D*.17,.012,.012,.007,z+.332,bronze,8);
  return true;
 }
 if(k==='chair'){

  const leg=Math.min(w,d)*.073;
  for(const i of [-.337,.337])for(const j of [-.335,.335]){
   r(w*i,d*j,leg*.51,leg*.51,.411,0,bronze,8);
   r(w*i,d*j,leg*.62,leg*.62,.025,0,dark,8);
  }
  b(0,0,w*.86,d*.85,.052,.395,walnut);
  r(0,0,w*.491,d*.48,.075,.441,oliveShade,20);
  r(0,0,w*.46,d*.45,.026,.511,oliveLight,20);
  for(const i of [-1,1])b(i*w*.32,d*.343,leg,leg,.238,.49,bronze);
  b(0,d*.338,w*.876,d*.245,.214,.632,walnutLight);
  b(0,d*.318,w*.802,d*.212,.162,.655,olive);
  b(0,d*.303,w*.708,d*.135,.127,.669,oliveLight);
  return true;
 }
 if(k==='table'){
  r(0,0,w*.26,d*.24,.047,0,bronze,24);
  r(0,0,Math.min(w,d)*.035,Math.min(w,d)*.035,.673,.045,bronze,16);
  r(0,0,w*.482,d*.481,.052,.711,woodEdge,32);
  r(0,0,w*.50,d*.50,.019,.756,walnutLight,32);
  return true;
 }
 if(k==='shelf'){
  for(const i of [-1,1])b(i*w*.449,0,w*.092,d,1.32,.025,walnut);
  b(0,d*.431,w*.817,d*.114,1.27,.048,shadow);
  for(const z of [.12,.52,.92,1.32])b(0,0,w,d,.051,z,z===1.32?stone:walnutLight);
  return true;
 }
 return false;
}
