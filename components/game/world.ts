import * as THREE from 'three';
import type {Collider,Surface} from './physics';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createStonePalette} from './materials';
import {createVegetation} from './vegetation';
import {buildMainGate} from './gate';
import {LOCATION_LIST} from './locations';

export function buildWorld(scene:THREE.Scene,loadTextures=typeof document!=='undefined'){
 const colliders:Collider[]=[],surfaces:Surface[]=[],occluders:THREE.Object3D[]=[],water:THREE.Mesh[]=[];
 const root=new THREE.Group();scene.add(root);
 let seed=1729;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const mat=(color:string,extra:THREE.MeshStandardMaterialParameters={})=>new THREE.MeshStandardMaterial({color,roughness:.88,...extra});
 const palette=createStonePalette(loadTextures);
 const {stone,oldStone,trim,paving}=palette;
 const wood=mat('#493b31'),iron=mat('#262c29',{roughness:.58,metalness:.4}),soil=mat('#655e51'),waterMat=mat('#54888a',{roughness:.16,metalness:.18,transparent:true,opacity:.84}),glass=mat('#303b40',{roughness:.24,metalness:.27});
 const vegetation=createVegetation(root,random);
 const cube=new THREE.BoxGeometry(1,1,1),cylinder=new THREE.CylinderGeometry(1,1,1,16),sphere=new THREE.SphereGeometry(1,24,16);
 const baluster=new THREE.LatheGeometry([[.11,0],[.11,.045],[.073,.085],[.063,.16],[.087,.22],[.113,.30],[.118,.34],[.104,.4],[.071,.50],[.059,.57],[.078,.615],[.11,.65],[.11,.69]].map(([r,y])=>new THREE.Vector2(r,y)),20);
 const rounded=new Map<string,THREE.BufferGeometry>();
 type Batch={geometry:THREE.BufferGeometry;material:THREE.Material;matrices:THREE.Matrix4[];colors:THREE.Color[]};
 const batches=new Map<string,Batch>();const dummy=new THREE.Object3D();
 function instance(key:string,geo:THREE.BufferGeometry,material:THREE.Material,x:number,y:number,p:number,sx:number,sy:number,sz:number,color='#ffffff',ry=0,rz=0){
  if(!batches.has(key))batches.set(key,{geometry:geo,material,matrices:[],colors:[]});
  dummy.position.set(x,y,-p);dummy.scale.set(sx,sy,sz);dummy.rotation.set(0,ry,rz);dummy.updateMatrix();
  const b=batches.get(key)!;b.matrices.push(dummy.matrix.clone());b.colors.push(new THREE.Color(color));
 }
 function mesh(geometry:THREE.BufferGeometry,material:THREE.Material,x:number,y:number,p:number,blockCamera=true){
    const m=new THREE.Mesh(geometry,material);m.position.set(x,y,-p);m.castShadow=true;m.receiveShadow=true;
    root.add(m);if(blockCamera)occluders.push(m);return m;
 }
 function collider(x:number,p:number,w:number,d:number,bottom:number,top:number){colliders.push({minX:x-w/2,maxX:x+w/2,minZ:-p-d/2,maxZ:-p+d/2,bottom,top});}
 function box(x:number,p:number,bottom:number,w:number,d:number,h:number,material:THREE.Material=stone,solid=false,camera=true){
  const key=[w,h,d].join(',');let geometry=rounded.get(key);if(!geometry){geometry=new RoundedBoxGeometry(w,h,d,2,Math.min(.045,Math.min(w,h,d)*.12));rounded.set(key,geometry);}
  const m=mesh(geometry,material,x,bottom+h/2,p,camera);if(solid)collider(x,p,w,d,bottom,bottom+h);return m;
 }
 function floor(x:number,p:number,w:number,d:number,top:number,thickness=.25,material:THREE.Material=paving){
  box(x,p,top-thickness,w,d,thickness,material,false,true);surfaces.push({minX:x-w/2,maxX:x+w/2,minZ:-p-d/2,maxZ:-p+d/2,height:top});
 }
 function railing(x1:number,p1:number,x2:number,p2:number,h:number,block=true){
  const len=Math.hypot(x2-x1,p2-p1),angle=Math.atan2(p2-p1,x2-x1);
  for(const [base,hh,thick] of [[.02,.13,.28],[.84,.16,.3]]){
   instance('rail-bars',cube,trim,(x1+x2)/2,h+base+hh/2,(p1+p2)/2,len,hh,thick,'#ffffff',angle);
  }
  const count=Math.max(1,Math.round(len/.43));
  for(let i=0;i<=count;i++){
   const t=i/count,x=x1+(x2-x1)*t,p=p1+(p2-p1)*t;
   instance('turned-stone-baluster',baluster,trim,x,h+.15,p,1,1,1);
  }
  if(block)collider((x1+x2)/2,(p1+p2)/2,Math.abs(x2-x1)+.24,Math.abs(p2-p1)+.24,h,h+1.05);
 }
 function archWall(x:number,p:number,base:number,width:number,height:number,depth:number,axis:'x'|'p',material=stone){
  const half=width/2,r=half-.35,spring=height-r-.24,s=new THREE.Shape();
  s.moveTo(-half,0);s.lineTo(-r,0);s.lineTo(-r,spring);
  s.absarc(0,spring,r,Math.PI,0,true);s.lineTo(r,0);s.lineTo(half,0);s.lineTo(half,height);s.lineTo(-half,height);s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.02,bevelThickness:.018,curveSegments:40});g.translate(0,0,-depth/2);
  const m=mesh(g,material,x,base,p);if(axis==='p')m.rotation.y=Math.PI/2;
  for(const end of [-1,1]){
   if(axis==='p')collider(x,p+end*(half-.18),depth,.36,base,base+height);
   else collider(x+end*(half-.18),p,.36,depth,base,base+height);
  }
  // Wedge-shaped dressed stones follow the arch, with fine radial mortar gaps.
  const sections=21,angle=Math.PI/sections-.009;
  const wedge=new THREE.Shape();wedge.absarc(0,0,r+.21,0,angle,false);wedge.lineTo(Math.cos(angle)*r,Math.sin(angle)*r);wedge.absarc(0,0,r,angle,0,true);wedge.closePath();
  const wg=new THREE.ExtrudeGeometry(wedge,{depth:.075,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:1,curveSegments:5});
  for(let i=0;i<sections;i++)instance('arch-voussoirs-'+width+'-'+axis,wg,trim,axis==='p'?x-depth/2-.035:x,base+spring,axis==='x'?p-depth/2-.035:p,1,1,1,'#ffffff',axis==='p'?Math.PI/2:0,i*Math.PI/sections+.0045);
  return m;
 }
 function opening(x:number,p:number,base:number,w:number,h:number,axis:'x'|'p',isDoor=false,arched=true,back=false){
  const r=w/2,s=new THREE.Shape();s.moveTo(-r,0);s.lineTo(r,0);if(arched){s.lineTo(r,h-r);s.absarc(0,h-r,r,0,Math.PI,false);}else{s.lineTo(r,h);s.lineTo(-r,h);}s.closePath();
  const m=mesh(new THREE.ShapeGeometry(s),isDoor?wood:glass,x,base,p,false);
  if(axis==='p')m.rotation.y=-Math.PI/2;else if(back)m.rotation.y=Math.PI;
  const framePoints=[];framePoints.push(new THREE.Vector3(-r,0,0),new THREE.Vector3(-r,arched?h-r:h,0));
  if(arched){for(let i=0;i<=24;i++){const a=Math.PI-i/24*Math.PI;framePoints.push(new THREE.Vector3(Math.cos(a)*r,h-r+Math.sin(a)*r,0));}}else framePoints.push(new THREE.Vector3(r,h,0));
  framePoints.push(new THREE.Vector3(r,0,0));
  const line=new THREE.CatmullRomCurve3(framePoints,false,'catmullrom',0);
  const frame=new THREE.Mesh(new THREE.TubeGeometry(line,48,.052,10,false),wood);m.add(frame);
  if(!isDoor){for(const xx of [-w/3,0,w/3]){const bar=new THREE.Mesh(cube,wood);bar.position.set(xx,(h-(arched?r*.4:0))*.5,.055);bar.scale.set(.038,h-(arched?r*.4:0),.06);m.add(bar);}}
  if(!isDoor)for(const yy of [h*.28,h*.60]){const cross=new THREE.Mesh(cube,wood);cross.position.set(0,yy,.052);cross.scale.set(w,.048,.055);m.add(cross);}
  else {const handle=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),iron);handle.position.set(.3,1.1,.055);m.add(handle);}
 }
 function bench(x:number,p:number,y=0,rotation=0){
  const group=new THREE.Group();group.position.set(x,y,-p);group.rotation.y=rotation;root.add(group);
  for(let i=0;i<4;i++){const s=new THREE.Mesh(cube,wood);s.position.set(0,.5,-.3+i*.17);s.scale.set(2,.09,.13);group.add(s);}
  for(let i=0;i<3;i++){const s=new THREE.Mesh(cube,wood);s.position.set(0,.79+i*.16,-.32);s.scale.set(2,.09,.1);group.add(s);}
  for(const xx of [-.8,.8]){const b=new THREE.Mesh(cube,iron);b.position.set(xx,.25,0);b.scale.set(.07,.5,.5);group.add(b);}
  group.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
  collider(x,p,rotation? .6:2,rotation?2:.6,y,y+.5);
 }
 function table(x:number,p:number,y=0){
  box(x,p,y+.7,2.4,1.2,.1,wood,false,false);
  for(const xx of [-.95,.95])for(const pp of [-.4,.4])instance('table-legs',cube,iron,x+xx,y+.35,p+pp,.065,.7,.065);
  collider(x,p,2.4,1.2,y,y+.8);
  for(const xx of [-.7,.7])for(const sign of [-1,1]){
   instance('chair-seat',cube,wood,x+xx,y+.45,p+sign*.95,.48,.09,.5);
   instance('chair-back',cube,wood,x+xx,y+.75,p+sign*1.18,.48,.57,.06);
   for(const sx of [-.18,.18])for(const sp of [-.18,.18])instance('chair-leg',cube,iron,x+xx+sx,y+.23,p+sign*.95+sp,.04,.45,.04);
  }
 }
 function plant(x:number,p:number,y=0,size=1){
  const potProfile=[[.17,0],[.24,.04],[.28,.39],[.32,.43],[.32,.49],[.26,.49],[.24,.42]].map(([r,h])=>new THREE.Vector2(r*size,h*size));
  mesh(new THREE.LatheGeometry(potProfile,24),oldStone,x,y,p,false);
  vegetation.shrub(x,p,y+.43*size,.37*size,1.35);
 }
 function tree(x:number,p:number,r=1.5){vegetation.winterTree(x,p,r);collider(x,p,.34,.34,0,4);}
 function globeLamp(x:number,p:number){
  instance('lamp-base',cylinder,iron,x,.12,p,.19,.24,.19);
  instance('lamp-shaft',cylinder,iron,x,1.5,p,.04,3,.04);
  instance('lamp-cross',cube,iron,x,2.86,p,.86,.05,.06);
  for(const xx of [-.4,.4])instance('lamp-globe',sphere,matGlobe,x+xx,3.04,p,.16,.18,.16);
 }
 const matGlobe=mat('#f1f0e7',{emissive:'#fff2d4',emissiveIntensity:.12});

 // Ground, village setting, distant hills.
 box(0,40,-.4,420,420,.25,mat('#9a9485'),false,false);
 const terrain=new THREE.PlaneGeometry(500,500,60,60);terrain.rotateX(-Math.PI/2);
 const pos=terrain.attributes.position;
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),z=pos.getZ(i);let height=-2;
  if(x<-28)height=-5+Math.sin(x*.021+z*.028)*5+Math.cos(z*.025)*4;
  if(z<-105)height+=Math.sin(x*.015)*8+Math.sin(z*.04)*5+12;
  pos.setY(i,height);
 }
 terrain.computeVertexNormals();mesh(terrain,oldStone,0,-.2,40,false);
 floor(-2.5,53,29,106,0,.28,paving);
 // Flat approach outside the entrance; the player starts here facing the gate.
 floor(-2.5,-6.5,29,13,0,.28,paving);
 // The full garden route is a continuous flat surface.
 box(0,16.5,.006,6,33,.035,paving,false,false);
 for(const [x,p,w,d] of [[-9.6,16,12.2,30],[6.5,14,6.6,26]]){
  box(x,p,.01,w,d,.1,soil,false,false);
  box(x-w/2,p,.08,.18,d,.17,trim);box(x+w/2,p,.08,.18,d,.17,trim);
  box(x,p-d/2,.08,w,.18,.17,trim);box(x,p+d/2,.08,w,.18,.17,trim);
  for(let i=0;i<150;i++)vegetation.grass(x+(random()-.5)*(w-.7),p+(random()-.5)*(d-.6));
 }
 for(const [x,p,r] of [[-5.5,4,1.6],[-13,16,1.35],[-6,16,1.4],[-11,23,1.8],[-5.5,26,1.5],[-11,29,1.3],[6.1,5,1.3],[7.6,13,1.5],[5.6,24,1.45]])tree(x,p,r);
 for(const [x,p,h] of [[-4.8,5,3.4],[4.8,5,3.5],[-4.8,29,3.8],[5.1,29,3.5]])vegetation.cypress(x,p,h);
 for(const p of [3,13,25,32]){globeLamp(-3.9,p);globeLamp(3.9,p);}
 // White vine pergola at front-left.
 for(const x of [-15,-7])for(const p of [2,7.5,13])box(x,p,0,.15,.15,2.8,trim,true,false);
 for(const x of [-15,-7])box(x,7.5,2.8,.18,11.4,.18,wood,false,false);
 for(let p=2;p<=13;p+=1.2){box(-11,p,2.92,8.4,.14,.12,wood,false,false);vegetation.vine(-15,p,-7,p,3.1);}
 bench(-11,4,0);bench(-15,40,0,Math.PI/2);bench(-15,51,0,Math.PI/2);
 // Enclosure, with a separate entrance portal. West side pushed out for more room beside STAIR-01A.
 box(-20,53,0,.7,106,2.5,oldStone,true);box(11.7,53,0,.7,106,3.3,oldStone,true);
 box(-11.625,0,0,16.75,.8,2.7,stone,true);box(7.7,0,0,8.3,.8,2.7,stone,true);
 const mainGate=buildMainGate(root,colliders,occluders,stone,trim,loadTextures);
 // Village houses outside the lower enclosure.
 for(let i=0;i<7;i++){
  const x=-24-random()*10,p=8+i*12,h=3+random()*3.7,w=5+random()*3,d=6+random()*3;
  box(x,p,-1,w,d,h,oldStone);box(x,p,h-1,w+.15,d+.15,.16,trim);
  opening(x,p-d/2-.025,-1,1,2.2,'x',true);
  for(const xx of [-1.7,1.7])opening(x+xx,p-d/2-.03,.65,.7,1,'x');
 }
 // A continuous stratified limestone face replaces the piles of faceted boulders.
 const rockMat=oldStone.clone();rockMat.color.set('#c7c6b9');rockMat.onBeforeCompile=oldStone.onBeforeCompile;rockMat.customProgramCacheKey=oldStone.customProgramCacheKey;
 const rockVertices:number[]=[],rockIndices:number[]=[],rockUV:number[]=[];
 const lengthSegments=168,heightSegments=36;
 for(let i=0;i<=lengthSegments;i++){
  const p=26+i/lengthSegments*70,h=Math.min(13,2+(p-26)*.25);
  for(let j=0;j<=heightSegments;j++){
   const y=j/heightSegments*h;
   const ledge=Math.sin(y*5.2)*.25+Math.sin(y*11.2)*.095;
   const x=11.45+Math.sin(p*.31)*.55+Math.sin(p*1.71+y*.8)*.18+ledge+y*.037;
   rockVertices.push(x,y,-p);rockUV.push(p/4,y/4);
   if(i<lengthSegments&&j<heightSegments){const a=i*(heightSegments+1)+j,b=a+heightSegments+1;rockIndices.push(a,b,a+1,b,b+1,a+1);}
  }
 }
 const cliff=new THREE.BufferGeometry();cliff.setAttribute('position',new THREE.Float32BufferAttribute(rockVertices,3));cliff.setAttribute('uv',new THREE.Float32BufferAttribute(rockUV,2));cliff.setIndex(rockIndices);cliff.computeVertexNormals();
 mesh(cliff,rockMat,0,0,0,true);
 const plateau=new THREE.PlaneGeometry(100,90,40,36);plateau.rotateX(-Math.PI/2);
 const pv=plateau.attributes.position;
 for(let i=0;i<pv.count;i++){const x=pv.getX(i),z=pv.getZ(i);pv.setY(i,Math.sin(x*.18+z*.16)*.18+Math.sin(z*.7)*.07);}
 plateau.computeVertexNormals();mesh(plateau,oldStone,62,12.85,63,false);
 box(16,65,12.85,5,61,.16,paving,false);box(18.65,65,12.85,.65,61,1.1,oldStone,false);
 // Mardin-style view beyond the wall: stepped stone-walled fields and a road across the plain.
 for(let i=0;i<7;i++){
  const tx=26+i*11.5,tp=24+((i*37)%52),tw=8+(i%3)*1.6,td=13+(i%2)*4,th=12.6-i*.28;
  box(tx,tp,th-.35,tw,td,.35,oldStone,false,false);
  box(tx,tp,th,tw,td,.1,soil,false,false);
  box(tx-tw/2,tp,th,.16,td,.2,trim);box(tx+tw/2,tp,th,.16,td,.2,trim);
  box(tx,tp-td/2,th,tw,.16,.2,trim);box(tx,tp+td/2,th,tw,.16,.2,trim);
  for(let g=0;g<70;g++)vegetation.grass(tx+(random()-.5)*(tw-.7),tp+(random()-.5)*(td-.7));
  if(i%2===0)tree(tx+tw/2-.6,tp-td/2+.6,1.1);
 }
 const outerRoad:[number,number][]=[[20,18],[30,28],[42,40],[55,50],[68,58],[80,64]];
 for(let i=0;i<outerRoad.length-1;i++){
  const [x1,p1]=outerRoad[i],[x2,p2]=outerRoad[i+1],mx=(x1+x2)/2,mp=(p1+p2)/2;
  const len=Math.hypot(x2-x1,p2-p1),angle=Math.atan2(p2-p1,x2-x1);
  instance('outer-road',cube,soil,mx,12.62,mp,len+.4,.05,3.2,'#8a7a63',angle);
 }

 // Orientation is photo-grounded; metric dimensions remain estimates.
 box(2.5,60,0,15,36,4.5,oldStone,true);
 floor(-1.5,53,7,22,4.5,.22);
 box(6,54,4.5,8,24,9.5,stone,true);
 box(-2.5,71,4.5,5,14,5,stone,true);
 box(6,75.5,4.5,8,14,5,stone,true);
 box(1,73.25,4.5,2,9.5,5,stone,true);
 box(6,72,9.5,8,12,3.15,stone,true);
 floor(-2.5,60,5,36,9.52,.32);floor(1,73.25,2,9.5,9.52,.32);
 floor(6,54,8.3,24.3,14,.25);
 floor(6,72,8.2,12.2,12.65,.25);
 for(let i=0;i<4;i++)archWall(-5,44.75+i*5.5,4.5,5.5,5,.65,'p');
 archWall(-1.5,42,4.5,7,5,.65,'x');
 for(const p of [42,47.5,53,58.5,64]){
  box(-5,p,4.5,.9,.9,.24,trim);box(-5,p,9.13,.87,.88,.18,trim);
 }
 for(const [a,b] of [[42.4,47.1],[47.9,52.6],[53.4,58.1]])railing(-5.06,a,-5.06,b,4.5);
 railing(-4.5,41.98,1.6,41.98,4.5);
 railing(-5.14,42,-5.14,78,9.5);railing(-5,41.88,2,41.88,9.5);railing(-5,78,2,78,9.5);
 railing(1.87,42,1.87,66,14);railing(10.13,42,10.13,66,14);railing(2,66,10,66,14);
 railing(2,42,10,42,14);railing(2,78,10,78,12.65);railing(2,66,2,78,12.65);
 // Repeated carved cornice below the upper terrace.
 for(let p=42;p<78;p+=.56)instance('cornice',sphere,trim,-5.19,9.11,p,.22,.13,.24);
 box(-5.16,60,9.25,.23,36.4,.17,trim);box(-1.5,41.8,9.25,7.5,.24,.17,trim);
 for(const p of [46,56.4])opening(1.975,p,10.35,3.6,2.9,'p');
 opening(1.975,61,10.4,1.4,2.9,'p');
 opening(1.975,47.5,9.5,1.35,4,'p',true);
 opening(1.975,66.5,9.5,1.35,3.1,'p',true);
 for(const p of [72,76])opening(1.975,p,10.05,2.6,2.0,'p');
 opening(6,41.975,9.9,4.7,3.8,'x',true);
 opening(-1.5,41.975,0,1.35,2.65,'x',true,false);
 opening(-5.026,55.5,.8,1.05,1.55,'p',false,false);opening(-5.026,48.5,1.1,1.5,1.9,'p',false,false);
 opening(-5.026,57.7,0,1.5,2.75,'p',true,false);
 const porchRoof=box(-5.95,57.7,3.05,2.1,2.7,.14,mat('#386e5b'),false);porchRoof.rotation.z=.16;
 for(const p of [56.5,58.9])box(-6.88,p,0,.10,.10,3.0,wood,true,false);
 for(const p of [67,72.5,76])opening(-5.035,p,5.1,.9,2.55,'p',false,false);opening(-5.04,70.15,4.5,1.35,3.1,'p',true,false);
 // Curved balcony on the short entrance-facing upper end.
 const balcony=new THREE.CylinderGeometry(1.85,1.85,.25,32,1,false,-Math.PI/2,Math.PI);
 mesh(balcony,trim,6,9.5,42);surfaces.push({minX:4.2,maxX:7.8,minZ:-42,maxZ:-40.3,height:9.62});
 for(let i=0;i<18;i++){
  const a=-Math.PI/2+i/17*Math.PI,x=6+Math.sin(a)*1.72,p=42-Math.cos(a)*1.72;
  instance('balcony-stem',cylinder,trim,x,10.04,p,.075,.8,.075);
  instance('balcony-belly',sphere,trim,x,9.99,p,.12,.15,.12);
 }
 const balconyCurve=new THREE.CatmullRomCurve3(Array.from({length:25},(_,i)=>{const a=-Math.PI/2+i/24*Math.PI;return new THREE.Vector3(6+Math.sin(a)*1.75,10.47,-42+Math.cos(a)*1.75);}));
 mesh(new THREE.TubeGeometry(balconyCurve,32,.12,6,false),trim,0,0,0);
 // Video 01:28–01:44: the roof parapet follows a second curved front projection.
 const roofProjection=new THREE.CylinderGeometry(1.85,1.85,.22,48,1,false,-Math.PI/2,Math.PI);
 mesh(roofProjection,trim,6,14,42);
 for(let i=0;i<=20;i++){
  const a=-Math.PI/2+i/20*Math.PI;instance('roof-balcony-balusters',baluster,trim,6+Math.sin(a)*1.73,14.18,42-Math.cos(a)*1.73,1,1,1);
 }
 const roofRail=new THREE.CatmullRomCurve3(Array.from({length:33},(_,i)=>{const a=-Math.PI/2+i/32*Math.PI;return new THREE.Vector3(6+Math.sin(a)*1.77,14.94,-42+Math.cos(a)*1.77);}));
 mesh(new THREE.TubeGeometry(roofRail,48,.105,10,false),trim,0,0,0);
 // Close-up reference: open court before the vaulted terrace; an L-shaped
 // stair meets a broad landing and a continuous gallery along the mansion wall.
 function masonryVault(x:number,front:number,width:number,depth:number,height:number,openingWidth:number,openingHeight:number,axis:'x'|'p'='p'){
  const r=openingWidth/2,spring=openingHeight-r,half=width/2;
  const shape=new THREE.Shape();shape.moveTo(-half,0);shape.lineTo(-r,0);shape.lineTo(-r,spring);
  shape.absarc(0,spring,r,Math.PI,0,true);shape.lineTo(r,0);shape.lineTo(half,0);shape.lineTo(half,height);shape.lineTo(-half,height);shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:48,bevelEnabled:false});geo.translate(0,0,-depth);
  const vault=mesh(geo,oldStone,x,0,front);if(axis==='x')vault.rotation.y=-Math.PI/2;
  const side=(width-openingWidth)/2;
  for(const sign of [-1,1]){
   if(axis==='x')collider(x+depth/2,front+sign*(r+side/2),depth,side,0,height);
   else collider(x+sign*(r+side/2),front+depth/2,side,depth,0,height);
  }
  // Fill the curved head with narrow collision strips instead of sealing the opening.
  for(let i=0;i<24;i++){
   const xx=-r+(i+.5)*openingWidth/24,head=spring+Math.sqrt(Math.max(0,r*r-xx*xx));
   if(axis==='x')collider(x+depth/2,front+xx,depth,openingWidth/24,head,height);
   else collider(x+xx,front+depth/2,openingWidth/24,depth,head,height);
  }
  // Actual radial voussoirs with a recessed intrados through the whole masonry depth.
  for(let i=0;i<21;i++){
   const aa=i*Math.PI/21+.004,bb=(i+1)*Math.PI/21-.004,wedge=new THREE.Shape();
   wedge.absarc(0,spring,r+.19,aa,bb,false);wedge.lineTo(Math.cos(bb)*r,spring+Math.sin(bb)*r);wedge.absarc(0,spring,r,bb,aa,true);wedge.closePath();
   const wg=new THREE.ExtrudeGeometry(wedge,{depth:.08,steps:1,curveSegments:4,bevelEnabled:false});
   const voussoir=axis==='x'?mesh(wg,oldStone,x-.015,0,front):mesh(wg,oldStone,x,0,front-.015);if(axis==='x')voussoir.rotation.y=-Math.PI/2;
  }
 }
 // The terrace begins on its supporting facade, with no floating overhang.
 // The vault does not face the stairs; it runs flush along the wall, boring toward the house.
 masonryVault(-11.1,67.15,6.8,4.6,4.36,3.6,3.35,'x');
 box(-11.1,74.875,0,6.8,6.25,4.36,oldStone,true);
 floor(-11.1,72.575,6.8,10.85,4.5,.18,paving);
 floor(-8.8,67.15,4.6,3.6,0,.08,paving);
 // The widened gallery and stairhead meet the house with no intervening slot.
 box(-6.35,68.9,0,2.7,18.2,4.36,oldStone,true);
 floor(-6.35,68.9,2.7,18.2,4.5,.18,paving);
 railing(-14.5,67.15,-14.5,78,4.5);railing(-12.5,78,-5,78,4.5);
 railing(-14.5,67.15,-7.7,67.15,4.5);railing(-7.7,62.2,-7.7,67.15,4.5);
 bench(-11.7,74,4.5);plant(-13,76,4.5);plant(-8.65,68.3,4.5);
 function flight(x:number,p:number,width:number,length:number,start:number,end:number,axis:'x'|'p',direction=1,stoneSteps=false){
  const n=Math.ceil((end-start)/.17),run=length/n;
  for(let i=0;i<n;i++){
   const along=-length/2+(i+.5)*run,top=start+(i+1)/n*(end-start);
   const xx=x+(axis==='x'?along*direction:0),pp=p+(axis==='p'?along*direction:0);
   box(xx,pp,start,axis==='x'?run:width,axis==='p'?run:width,top-start,stoneSteps?oldStone:trim,true);
   if(stoneSteps)box(xx,pp,top-.07,axis==='x'?run:width,axis==='p'?run:width,.08,paving,false);
   surfaces.push({minX:xx-(axis==='x'?run:width)/2,maxX:xx+(axis==='x'?run:width)/2,minZ:-pp-(axis==='p'?run:width)/2,maxZ:-pp+(axis==='p'?run:width)/2,height:top});
  }
 }
 // Lower flight and corner landing retain the L-turn seen in the reference.
 // STAIR-01A: Ana merdiven alt kolu.
 flight(-12.8,64.1,2.4,3.8,0,2.1,'p',-1,true);
 masonryVault(-12.8,59.8,2.4,2.4,2.1,1.5,1.67);
 box(-12.8,62.06,0,1.5,.28,1.67,oldStone,true);
 floor(-12.8,61,2.4,2.4,2.1,.13,paving);
 // Every upper tread has masonry below it; the top reaches the gallery at x=-7.7.
 box(-9.65,61,0,3.9,2.4,2.1,oldStone,true);
 // STAIR-01B: Ana merdiven ust kolu.
 flight(-9.65,61,2.4,3.9,2.1,4.5,'x',1,true);
 function stairRail(x1:number,p1:number,y1:number,x2:number,p2:number,y2:number){
  const horizontal=Math.hypot(x2-x1,p2-p1),length=Math.hypot(horizontal,y2-y1),yaw=Math.atan2(p2-p1,x2-x1),slope=Math.atan2(y2-y1,horizontal);
  for(const [offset,h] of [[.1,.16],[.94,.16]]){
   const beam=mesh(new THREE.BoxGeometry(length,h,.28),trim,(x1+x2)/2,(y1+y2)/2+offset,(p1+p2)/2);
   beam.rotation.set(0,yaw,0);beam.rotateZ(slope);
  }
  const n=Math.ceil(horizontal/.4);
  for(let i=0;i<=n;i++){
   const t=i/n,x=x1+(x2-x1)*t,p=p1+(p2-p1)*t,y=y1+(y2-y1)*t;
   instance('courtyard-stair-balusters',baluster,trim,x,y+.17,p,1,1,1);
   collider(x,p,.22,.22,y,y+1.04);
  }
 }
 stairRail(-14,66,0,-14,62.2,2.1);
 stairRail(-11.6,66,0,-11.6,62.2,2.1);
 railing(-14,59.8,-11.6,59.8,2.1);
 railing(-14,59.8,-14,62.2,2.1);
 stairRail(-11.6,59.8,2.1,-7.7,59.8,4.5);
 stairRail(-11.6,62.2,2.1,-7.7,62.2,4.5);
 railing(-7.7,59.8,-5,59.8,4.5);
 for(const [x,p,y] of [[-14,59.8,2.1],[-7.7,59.8,4.5],[-7.7,67.15,4.5]]){
  box(x,p,y,.32,.32,.95,trim,true);box(x,p,y+.91,.40,.40,.13,trim);
 }
 // STAIR-02A: sadakatRoom merdiveni.
 flight(.9,50.5,1.8,6,4.5,9.5,'p',-1);
 stairRail(0,53.5,4.5,0,47.5,9.5);
 stairRail(1.8,53.5,4.5,1.8,47.5,9.5);
 floor(1,47.4,2.05,4.2,9.53,.15);
 railing(-.03,45.3,-.03,49.5,9.53);
 railing(-.03,45.3,2.03,45.3,9.53);
 // STAIR-02B: AlyaRoom merdiveni.
 flight(.9,61,1.8,6,4.5,9.5,'p',1);
 stairRail(0,58,4.5,0,64,9.5);
 stairRail(1.8,58,4.5,1.8,64,9.5);
 floor(1,65.5,2.05,6,9.53,.15);
 // Video 01:04/01:44: a sloping stair enclosure occupies the upper terrace.
 const stairRoof=new THREE.BufferGeometry();
 stairRoof.setAttribute('position',new THREE.Float32BufferAttribute([-2.2,9.72,-56.5,2.05,9.72,-56.5,2.05,12.15,-63.5,-2.2,12.15,-63.5],3));
 stairRoof.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,2,0,2],2));stairRoof.setIndex([0,2,1,0,3,2]);stairRoof.computeVertexNormals();
 const roofMaterial=trim.clone();roofMaterial.side=THREE.DoubleSide;roofMaterial.onBeforeCompile=trim.onBeforeCompile;roofMaterial.customProgramCacheKey=trim.customProgramCacheKey;
 mesh(stairRoof,roofMaterial,0,0,0);
 // West cheek leaves the actual top landing open to the terrace.
 const cheek=new THREE.Shape();cheek.moveTo(56.5,9.5);cheek.lineTo(56.5,9.72);cheek.lineTo(61,11.28);cheek.lineTo(61,9.5);cheek.closePath();
 const cheekGeo=new THREE.ExtrudeGeometry(cheek,{depth:.15,bevelEnabled:false});const cheekMesh=mesh(cheekGeo,trim,-2.2,0,0);cheekMesh.rotation.y=Math.PI/2;
 collider(-2.2,58.75,.18,4.5,9.5,11.4);
 box(-2.2,63.25,9.5,.2,.5,2.55,trim,true);
 //box(-.075,64,9.5,4.45,.18,2.65,trim,true);
 // Video 00:56–01:28: the rear block widens, with a separate roof and rear courts.
 box(2.5,82.9,0,15,9.8,12.65,oldStone,true);floor(2.5,82.9,15.1,9.9,12.65,.2,trim);
 railing(-5.1,78,-5.1,87.8,12.65);railing(-5.1,87.8,10,87.8,12.65);railing(10,78,10,87.8,12.65);
 for(const x of [-2,2.4,7])opening(x,87.84,7.1,1.05,2.2,'x',false,false,true);
 opening(1,87.85,6.2,1.2,2.5,'x',true,false,true);
 // Rear courts step down toward the left boundary rather than forming a single box.
 box(-11.2,84,0,6.2,8,3.1,oldStone,true);floor(-11.2,84,6.2,8,3.1);
 box(-11.2,93,0,6.2,10,6.2,oldStone,true);floor(-11.2,93,6.2,10,6.2);
 box(2.55,97,0,16.5,17,6.2,oldStone,true);floor(2.55,97,16.5,17,6.2);floor(-6.45,97.95,1.5,15.1,6.2);
 railing(-14.3,80,-14.3,81,3.1);railing(-14.3,83.6,-14.3,88,3.1);railing(-14.3,88,-14.3,98,6.2);
 railing(-14.3,98,10.8,98,6.2);railing(10.8,88.5,10.8,105.5,6.2);
 // A lower route from the west edge of the main terrace connects these stepped courts.
 floor(-14.2,78.1,3.5,1.2,4.5);
 // STAIR-03 baglanti rotasi: Bati teras inisi.
 flight(-13.5,79.2,1.55,2.8,3.1,4.5,'p',-1);
 stairRail(-14.275,77.8,4.5,-14.275,80.6,3.1);
 stairRail(-12.725,77.8,4.5,-12.725,80.6,3.1);
 floor(-13.5,80.75,1.6,.6,3.1);
 floor(-13.5,82.2,1.6,2.4,3.1);
 // STAIR-03: Arka merdiven baglantisi.
 flight(-6.7,86.8,1.8,6.4,3.1,6.2,'p',1);
 stairRail(-7.6,83.6,3.1,-7.6,90,6.2);
 stairRail(-5.8,83.6,3.1,-5.8,90,6.2);
 floor(-6.9,84.25,2.4,8.5,3.1);floor(-6.7,90.4,1.8,1,6.2);
 // The rear boundary has two tiers of blind arches, facing toward the main house.
 box(-1.7,105.45,0,25,.55,9.7,oldStone,true);
 for(const y of [3.1,6.4])for(const x of [-10,-2.8,4.4])archWall(x,105.08,y,6.8,3.3,.22,'x',stone);
 box(-1.7,105.06,6.23,25,.38,.14,trim);box(-1.7,105.02,9.53,25,.42,.17,trim);
 bench(-10.8,94,6.2);plant(-13.4,96,6.2);plant(8.8,102,6.2);
 // Roof fixtures seen during the orbit: solar collector, tank and slender pipes.
 const panel=box(7.5,81.5,13.0,2.4,2.8,.10,mat('#263746',{roughness:.28,metalness:.25}),false,false);panel.rotation.x=-.35;
 for(const x of [6.25,8.75])box(x,81.5,12.65,.045,3.0,.045,iron,false,false);
 mesh(new THREE.CylinderGeometry(.45,.45,1.45,28),trim,8.5,13.7,79.6,false);
 table(6,47,14);bench(5,59,14);plant(8.8,63,14,.8);
 // Tables, plants and chandeliers in the real open arcade.
 table(-.8,47,4.5);table(-.8,54,4.5);bench(1,50,4.5,Math.PI/2);
 for(const p of [44])plant(1,p,4.5,1.2);
 for(const p of [47,54]){
  instance('chandelier-rod',cylinder,iron,-1.2,8.6,p,.025,1.1,.025);
  const ring=new THREE.TorusGeometry(.53,.045,5,18);const m=mesh(ring,iron,-1.2,8.1,p,false);m.rotation.x=Math.PI/2;
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;instance('chandelier-lights',sphere,matGlobe,-1.2+Math.cos(a)*.5,8.2,p+Math.sin(a)*.5,.07,.13,.07);}
 }
 table(3.8,38.9);plant(-4.7,40.7);plant(7.7,41);plant(-3.7,43,9.5);plant(.7,60,9.5);
 // The blue rock-side wall fountain and the separate courtyard stone basin.
 const basin=mesh(new THREE.CylinderGeometry(1.45,1.35,.46,36),trim,7.65,.26,35.5);
 const waterDisc=mesh(new THREE.CircleGeometry(1.23,36),waterMat,7.65,.51,35.5,false);waterDisc.rotation.x=-Math.PI/2;water.push(waterDisc);
 const lip=mesh(new THREE.TorusGeometry(1.33,.13,8,36),trim,7.65,.54,35.5);lip.rotation.x=Math.PI/2;
 box(8.95,35.5,0,.42,3.2,3.2,trim,true);opening(8.72,35.5,.55,1.9,2.25,'p');
 box(8.65,35.5,1.5,.55,.13,.13,iron);
 const stream=mesh(new THREE.CylinderGeometry(.025,.04,1.0,8),waterMat,8.35,1.02,35.5,false);water.push(stream);
 collider(7.65,35.5,2.7,2.7,0,.62);
 mesh(new THREE.CylinderGeometry(1.15,1.25,.3,8),oldStone,-8.1,.2,35.1);
 mesh(new THREE.CylinderGeometry(.4,.5,.45,8),trim,-8.1,.48,35.1);collider(-8.1,35.1,2.4,2.4,0,.6);
 mesh(new THREE.CylinderGeometry(.62,.75,.3,8),trim,-1.4,9.66,50);
 mesh(new THREE.CylinderGeometry(.11,.22,.9,12),trim,-1.4,10.06,50);
 const topBowl=mesh(new THREE.CylinderGeometry(.41,.16,.2,20),trim,-1.4,10.47,50);collider(-1.4,50,1.3,1.3,9.5,10.65);
 const topWater=mesh(new THREE.CircleGeometry(.38,20),waterMat,-1.4,10.575,50,false);topWater.rotation.x=-Math.PI/2;water.push(topWater);
 void basin;void topBowl;
 for(const b of batches.values()){
  const m=new THREE.InstancedMesh(b.geometry,b.material,b.matrices.length);
  b.matrices.forEach((mx,i)=>{m.setMatrixAt(i,mx);m.setColorAt(i,b.colors[i]);});
  m.castShadow=true;m.receiveShadow=true;root.add(m);
 }
 for(const location of LOCATION_LIST){
  const anchor=new THREE.Object3D();anchor.name=location.id;
  anchor.position.set(location.x,location.height,-location.planY);
  anchor.userData={...location,locationId:location.id,kind:'location-anchor'};root.add(anchor);
 }
 root.updateMatrixWorld(true);
 vegetation.finish();
 return {root,colliders,surfaces,occluders,water,ready:palette.ready,dispose:()=>{palette.dispose();mainGate.dispose();}};
}
