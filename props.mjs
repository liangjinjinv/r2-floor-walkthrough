
export const props = [];
const add=(kind,x,y,w,d,a=0)=>props.push([kind,55+x/2,575+y/2,w/2,d/2,a]);
const row=(kind,xs,y,w,d,a=0)=>xs.forEach(x=>add(kind,x,y,w,d,a));
const col=(kind,x,ys,w,d,a=0)=>ys.forEach(y=>add(kind,x,y,w,d,a));

add('counter',735,416,69,15);add('coffee',741,416,13,11);
row('chair',[677,789],417,11,13);row('chair',[700,735,770],355,13,13);
add('table',719,470,31,29);add('chair',747,472,12,12);
add('counter',659,467,12,31);add('counter',670,516,30,14);
add('shelf',810,508,9,22);
col('kiosk',640,[389,411,433,453,474,495,516],9,9);

row('kiosk',[445,491,536],365,13,13);
row('kiosk',[445,491,536],455,13,13);
add('kiosk',604,357,13,13);add('display',522,522,90,8);

add('bed',478,47,37,34);add('bed',543,47,37,34);row('chair',[450,573],53,10,12);
add('reception',493,211,11,34);row('desk',[538,583],201,15,17);row('chair',[538,583],218,12,12);
add('counter',705,194,27,12);add('chair',707,209,14,14);add('chair',743,198,14,14);
add('sofa',812,177,17,37);add('shelf',768,219,34,10);
row('desk',[637,686],65,35,26);add('counter',750,28,52,38);add('kiosk',806,69,13,13);

for (const y of [370,411,454,495]) {add('table',49,y,82,12);row('chair',[11,28,45,61,78],y+14,11,10);}
add('counter',133,366,16,53);add('sofa',194,362,16,55);col('chair',162,[324,347],15,15);
add('table',244,357,62,20);for (const y of [336,380]) row('chair',[220,242,262],y,12,10);
for(const y of [413,490]) {row('desk',[233,270,307,344],y,27,13);row('chair',[233,270,307,344],y-12,11,10);}
row('machine',[231,270,307,347],447,19,18);
col('rack',130,[432,455,478,501],12,18);add('desk',192,490,29,14);add('chair',192,477,11,11);

for(const y of [15,116,194]) row('kiosk',[22,44,66,88,109],y,8,11);
col('kiosk',160,[50,76,144,171,198],9,10);
col('rack',319,[43,96,145,183,217],13,30);
add('rack',371,21,31,11);add('pallet',264,236,22,14);add('pallet',202,154,23,45);
add('machine',271,170,25,14);add('pallet',295,215,14,25);

add('machine',132,655,144,12);row('machine',[307,377,463,562,670,748,798],651,37,23);
row('kiosk',[69,160,305,374,560,672],628,12,12);
add('machine',29,628,27,41);add('pallet',783,581,28,19);
add('conveyor',451,794,607,15);
row('machine',[182,252,311,370,472,530,642,701],779,52,7);
row('machine',[152,169,279,293,335,352,385,414,445,482,515,548,581,608,638,666,695,722],815,10,7);
add('pallet',374,855,570,18);add('machine',783,794,33,14);add('machine',783,870,34,13);
col('rack',25,[796,850,870,918],35,15);
row('desk',[941,968],595,22,13);row('machine',[937,974],678,19,15);row('kiosk',[935,993],800,18,11);
col('kiosk',926,[865,885,905,925],8,10);add('pallet',974,888,37,51);

add('reception',1078,899,80,17);row('chair',[1067,1098],919,13,14);
add('kiosk',1203,809,13,43);add('kiosk',1020,757,10,11);add('counter',1022,654,10,42);
row('shelf',[570,589,641,661,680,701,722,746,767,789],1033,17,16);
add('kiosk',584,1112,18,46);add('table',756,1209,38,31);
add('sofa',985,1184,32,20);add('sofa',986,1230,30,19);add('table',978,1208,24,15);add('display',1000,1212,8,78);
add('counter',578,1259,30,14);
row('shelf',[213,293,369,445],1054,35,12);row('shelf',[213,293,369,445],1102,35,12);
row('counter',[182,280,480],1144,38,19);add('shelf',540,1094,12,76);
add('shelf',12,1132,14,69);add('counter',44,1029,30,14);
row('counter',[169,230],1237,31,19);add('desk',54,1257,36,18);add('desk',99,1293,32,18);
row('desk',[169,247],1378,35,18);add('desk',168,1308,34,16);
for(const y of [1307,1369,1429]) row('rack',[343,466],y,69,12);
add('pallet',181,1500,51,13);

for(const x of [585,605,662,681,739,758,815,835]){
 for(const y of [1291,1327,1363]) add('desk',x,y,18,32);
}
for(const x of [574,625,652,702,728,779,804,856]) col('chair',x,[1291,1327,1363],12,12);
for(const x of [802,824]) for(const y of [1456,1491]) add('desk',x,y,18,31);
for(const x of [791,843]) col('chair',x,[1456,1491],11,12);
add('table',965,1340,34,88);for(const x of [938,993]) col('chair',x,[1306,1328,1349,1370],11,12);
col('chair',966,[1286,1393],12,12);
add('desk',966,1480,26,37);add('chair',980,1481,12,12);col('chair',938,[1463,1493],11,11);
add('counter',646,1424,43,15);add('counter',706,1424,65,13);add('machine',724,1424,12,9);
for(const [x,y] of [[1370,920],[692,1475],[976,245],[975,379],[52,1387]]) add('stair',x,y,51,52,90);
for(const y of [1249,1500]) row('toilet',[1316,1345,1372,1401],y,12,15);
row('basin',[1375,1396],1315,12,11);row('basin',[1347,1372],1428,12,11);
add('counter',1356,1224,98,13);

props.push(['stair',645,221,24,34,90],['stair',23,222,22,31,90],['stair',737,448,19,46,90]);

const north=(kind,x,y,w=8,d=10)=>props.push([kind,(1270+x)/2,(335+y)/2,w/2,d/2,0]);
for(const x of [159,184,209,235]) north('toilet',x,42);
for(const x of [159,184,209]) north('toilet',x,245);
for(const y of [175,198]) north('toilet',243,y,7,8);
for(const x of [212,234]) for(const y of [128,146]) north('basin',x,y,10,8);

add('display',34,315,29,6); // Training display.
add('display',1004,583,5,63); // Welcome screen.
add('display',1005,672,5,52); // Operations observation screen.
add('display',880,1020,69,6); // Exhibit-corridor screen panel.
add('display',566,1108,5,59); // Logo wall slim panel.
add('display',815,1125,7,113); // Exhibit divider.
add('display',659,1259,72,5); // Hall product display.
add('shelf',165,1028,27,12);add('counter',493,1028,31,14);
add('counter',266,1486,29,12);add('shelf',465,1505,48,14);
add('rack',193,1466,54,28);add('pallet',147,1537,21,34);
add('pallet',230,1556,22,33); // Outdoor demo vehicle footprint; placeholder.
add('kiosk',500,210,8,8);add('shelf',291,19,22,17);
add('counter',194,397,13,13);add('desk',271,235,27,15);
add('display',810,88,14,5);
add('pallet',1270,143,32,148); // Plaza installation footprint; illustrative.
add('display',1214,371,6,74);add('display',1270,614,29,7);
