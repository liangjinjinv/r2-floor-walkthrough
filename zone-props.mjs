

const C={oak:0xa87347,oakTop:0xc09463,flute:0xb67e50,darkOak:0x80593e,cream:0xe9dcbe,edge:0xc7b28e,sage:0x818965,teal:0x4f6663,blue:0x5c7583,gray:0x68716f,zinc:0x969a92,black:0x363c37,ink:0x282f31,white:0xeae8da,linen:0xc8b698,kraft:0xbb986b,light:0xf0d7a8,bronze:0x5d4c3d};
export function makeZoneProp(k,x,y,ww,dd,deg=0,{box,round,sc}){
 const w=ww*sc,d=dd*sc,a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 const at=(u,v)=>[x+(u*w*c-v*d*s)/sc,y+(u*w*s+v*d*c)/sc];
 const b=(u,v,uw,vd,h,z,col)=>{const [X,Y]=at(u,v);box(X,Y,uw*w,vd*d,h,z,col,a);};
 const r=(u,v,uw,vd,h,z,col,n=10)=>{const [X,Y]=at(u,v);round(X,Y,uw*w,vd*d,h,z,col,a,n);};
 const lobby=x>=557&&x<660&&y>860&&y<1040, gallery=x>333&&x<558&&y>1078&&y<1211,
       hotel=x>=270&&x<467&&y>=580&&y<699, store=x<333&&y>1085&&y<1155,
       warehouse=x<333&&y>1176&&y<1333, performance=x>=262&&x<369&&y>730&&y<840,
       industry=x<568&&y>847&&y<1043;
 const hospitality=lobby||gallery||hotel||store;
 const wood=hospitality?C.oak:C.zinc, top=hospitality?C.cream:C.zinc;
 const slim=(u,v,W,D,h,z,col)=>{

   if(d>w*1.35)b(v,u,D,W,h,z,col);else b(u,v,W,D,h,z,col);
 };
 if(k==='reception'||k==='counter'){
  const detailed=k==='reception'||store||gallery, ht=k==='reception'?1.04:.93;
  b(0,0,.93,.82,.095,0,C.black);
  b(0,0,.96,.90,ht-.14,.09,warehouse?C.gray:wood);
  b(0,0,.99,.98,.065,ht-.065,top);
  if(detailed){
   const n=Math.min(24,Math.max(5,Math.round(Math.max(w,d)/.092)));
   for(const sign of (k==='reception'?[-1,1]:[1])){
    const n0=k==='reception'?Math.min(54,n*2):n;
    for(let i=0;i<n0;i++)slim((i+.5)/n0*.91-.455,sign*.466,.55/n0,.052,ht-.24,.125,C.flute);
   }

   if(k==='reception'||store){
    slim(-.27,-.09,.19,.41,.025,ht,C.bronze);
    slim(-.27,-.13,.13,.13,.045,ht+.025,C.black);
    slim(-.27,-.12,.22,.065,.18,ht+.065,C.ink);
    slim(.22,-.05,.16,.28,.036,ht,C.linen);
   }
  }else{
   const n=Math.max(1,Math.min(4,Math.round(Math.max(w,d)/.55)));
   for(let i=0;i<n;i++){slim((i+.5)/n*.92-.46,.451,.89/n,.064,.57,.15,warehouse?C.zinc:C.linen);slim((i+.5)/n*.92-.46,.489,.30/n,.020,.025,.63,C.ink);}
  }
  return true;
 }
 if(k==='shelf'||k==='rack'){
  const heavy=k==='rack', h=heavy?1.91:store?1.79:gallery?1.19:1.52;
  const frame=heavy||store?C.gray:C.darkOak, shelf=heavy?C.zinc:C.oakTop;
  for(const i of [-.456,.456])for(const j of [-.432,.432])b(i,j,.075,.105,h,0,frame);
  if(!heavy)b(0,-.47,.93,.058,h*.95,.05,store?C.gray:C.linen);
  for(const f of [.11,.36,.61,.86]){
   b(0,0,.988,.98,.048,h*f,shelf);

   for(const [i,j] of [[-.29,0],[0,1],[.29,2]]){
    const item=.12+j*.033;
    b(i,-.012,.18,.55,item,h*f+.048,(j+(Math.round(x)+Math.round(y))%3)%3===1?C.sage:j===2?C.white:C.kraft);
    if(heavy&&j===0)b(i,.270,.083,.020,.046,h*f+.076,C.cream);
   }
  }
  if(heavy)b(0,0,.978,.97,.048,h-.048,C.gray);
  return true;
 }
 if(k==='display'||k==='kiosk'){
  const board=k==='display', h=board?performance?2.20:gallery?1.76:1.68:performance?.92:lobby?1.82:1.32;
  const casing=performance?C.ink:lobby?C.teal:gallery?C.darkOak:C.gray;
  slim(0,0,.96,.93,.088,0,C.black);
  slim(0,0,board? .92:.76,board?.48:.63,h-.09,.088,casing);
  slim(0,.29,board?.81:.62,.109,h*.56,h*.35,C.ink);

  slim(0,.356,board?.75:.51,.017,h*.073,h*.80,C.light);
  for(const i of [.48,.56,.64])slim(0,.356,board?.55:.34,.015,h*.023,h*i,board?C.zinc:C.teal);
  if(board&&(performance||gallery)){
   slim(0,-.295,.86,.090,h*.66,h*.28,performance?0x3e6878:0x475a5d);
   slim(0,-.351,.66,.020,h*.032,h*.80,0xe1dfcf);
   for(let i=0;i<6;i++)slim(-.27+i*.103,-.351,.026,.019,h*(.19+i*.02),h*.39,performance?0x9dc7cc:0xb49b7f);
  }
  if(!board)slim(0,.28,.35,.035,.045,.20,performance?C.black:C.bronze);
  return true;
 }
 if(k==='sofa'){
  const portrait=d>w*1.35;
  const l=(u,v,W,D,h,z,col)=>portrait?b(v,u,D,W,h,z,col):b(u,v,W,D,h,z,col);
  const color=hotel?C.linen:C.sage;
  l(0,0,.88,.81,.115,.016,C.bronze);
  l(0,0,.96,.91,.246,.117,color);
  for(const i of [-.218,.218]){
   l(i,-.03,.41,.63,.097,.361,color);
   l(i,.325,.417,.23,.30,.442,hotel?C.cream:C.sage);
  }
  for(const i of [-.44,.44])l(i,-.02,.103,.896,.173,.40,hotel?C.oak:C.teal);
  return true;
 }
 if(k==='bed'){
  b(0,0,.88,.84,.136,0,C.darkOak);
  b(0,0,.96,.90,.20,.125,C.oak);
  b(0,0,.95,.87,.14,.324,C.white);
  b(0,.13,.963,.55,.068,.456,C.linen);
  b(0,.28,.970,.20,.033,.518,C.teal);
  b(0,-.462,.973,.075,.51,.24,C.darkOak);
  b(0,-.423,.887,.05,.367,.316,C.linen);
  for(const i of [-.226,.226])b(i,-.277,.38,.197,.095,.456,C.white);
  return true;
 }
 if(k==='table'||k==='desk'){
  const desk=k==='desk', z=.72, rounded=gallery&&Math.abs(w-d)<.70;
  if(rounded){
   r(0,0,.255,.242,.043,0,C.bronze,12);
   r(0,0,.044,.044,.685,.04,C.bronze,10);
   r(0,0,.487,.484,.05,.724,C.oakTop,16);
  }else{
   b(0,0,.98,.98,.061,z,top);
   b(0,0,.92,.91,.038,z-.03,wood);
   for(const i of [-.405,.405])for(const j of [-.385,.385])b(i,j,.063,.104,z-.03,0,warehouse?C.zinc:C.bronze);
  }
  if(desk&&warehouse){
   b(-.24,-.13,.34,.61,.21,.781,C.kraft);b(.25,.09,.29,.43,.061,.781,C.sage);
  }
  if(desk&&!warehouse){
   b(0,-.16,.48,.30,.025,.781,C.bronze);b(0,-.238,.20,.084,.15,.806,C.darkOak);
   b(0,-.255,.61,.064,.283,.941,C.ink);b(0,-.215,.549,.022,.228,.971,C.teal);
   b(0,.09,.454,.184,.019,.783,C.gray);
  }
  return true;
 }
 if(k==='chair'){
  const cover=hotel?C.linen:lobby||gallery?C.sage:C.gray;
  for(const i of [-.337,.337])for(const j of [-.339,.339])b(i,j,.07,.08,.416,0,C.bronze);
  b(0,0,.90,.88,.044,.390,wood);
  b(0,0,.89,.873,.071,.432,cover);
  b(0,.329,.844,.242,.278,.504,cover);
  b(0,.438,.79,.074,.239,.522,wood);
  return true;
 }
 if(k==='machine'&&!(w>6.5)){

  const h=industry?.81:.94;
  b(0,0,.95,.86,.095,0,C.ink);b(0,0,.93,.91,h-.08,.08,C.gray);
  b(0,0,.99,.97,.054,h-.054,C.zinc);
  b(0,.434,.81,.106,h*.47,h*.28,C.zinc);
  b(-.23,.473,.23,.053,h*.15,h*.51,C.ink);
  b(.29,.473,.10,.051,h*.067,h*.51,C.light);
  return true;
 }
 if(k==='conveyor'){
  const n=Math.min(54,Math.max(8,Math.ceil(w/.48)));
  b(0,0,.978,.89,.145,.739,C.gray);b(0,0,.999,.70,.050,.877,C.black);
  for(const j of [-.458,.458])b(0,j,.997,.08,.124,.836,C.zinc);
  for(let i=0;i<n;i++)b((i+.5)/n*.98-.49,0,.29/n,.75,.039,.926,C.zinc);
  const legs=Math.min(23,Math.ceil(w/1.45));
  for(let i=0;i<legs;i++)for(const j of [-.338,.338])b((i+.5)/legs*.98-.49,j,.20/legs,.081,.738,.01,C.gray);
  return true;
 }
 if(k==='pallet'){
  b(0,0,.98,.98,.047,.082,C.oak);
  for(const i of [-.374,.0,.374])b(i,0,.131,.92,.082,0,C.darkOak);
  const n=Math.min(8,Math.max(1,Math.floor(w/.55)));
  for(let i=0;i<n;i++){const off=(i+.5)/n*.91-.455;b(off,0,.79/n,.75,.34+(i%2)*.16,.129,i%3===0?C.sage:C.kraft);}
  return true;
 }
 if(k==='toilet'){
  r(0,-.085,.234,.258,.224,0,C.white,10);
  r(0,-.11,.418,.350,.131,.219,C.white,14);
  r(0,-.116,.347,.288,.021,.354,C.cream,14);
  r(0,-.116,.282,.223,.009,.370,C.gray,14);
  b(0,.305,.83,.315,.331,.337,C.white);
  b(0,.32,.085,.14,.018,.665,C.zinc);
  return true;
 }
 if(k==='basin'){
  b(0,0,.62,.55,.744,0,C.white);
  r(0,-.025,.479,.456,.108,.747,C.white,14);
  r(0,-.045,.363,.298,.015,.853,C.gray,14);
  b(0,.311,.065,.09,.124,.834,C.zinc);
  b(0,.223,.07,.255,.028,.936,C.zinc);
  return true;
 }
 if(k==='stair'){
  const N=12;
  for(let i=0;i<N;i++){
   const q=(i+.5)/N-.5,h=.128*(i+1);
   b(0,q,.985,.99/N,h,0,C.zinc);
   b(0,q-.383/N,.975,.17/N,.021,h-.022,C.gray);
  }
  return true;
 }
 if(k==='stage'){
  b(0,0,.97,.94,.11,0,C.darkOak);
  b(0,0,.99,.99,.08,.11,C.oak);
  b(0,0,1,1,.023,.19,C.oakTop);
  return true;
 }
 return false;
}
