import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import type {Collider} from './physics';
import {ENTRANCE} from './entrance';

// Modelled from the supplied entrance photograph. Coordinates are local world
// coordinates: the street is +Z, and the garden is -Z. Dimensions are estimates.
export function buildMainGate(root:THREE.Group,colliders:Collider[],occluders:THREE.Object3D[],stoneSource:THREE.MeshStandardMaterial,trimSource:THREE.MeshStandardMaterial,withTextures:boolean){
 const gate=new THREE.Group();gate.name='Arton main entrance';root.add(gate);
 const textures:THREE.Texture[]=[];
 const stone=stoneSource.clone(),trim=trimSource.clone();
 stone.color.set('#e4d0ac');trim.color.set('#ead8b8');
 stone.onBeforeCompile=stoneSource.onBeforeCompile;stone.customProgramCacheKey=stoneSource.customProgramCacheKey;
 trim.onBeforeCompile=trimSource.onBeforeCompile;trim.customProgramCacheKey=trimSource.customProgramCacheKey;
 const steel=new THREE.MeshStandardMaterial({color:'#292e34',metalness:.55,roughness:.68});
 const edge=new THREE.MeshStandardMaterial({color:'#353b41',metalness:.64,roughness:.58});
 const lampIron=new THREE.MeshStandardMaterial({color:'#191d1e',metalness:.65,roughness:.46});
 const lampGlass=new THREE.MeshStandardMaterial({color:'#d7c8a2',roughness:.28,metalness:.1,emissive:'#e7b865',emissiveIntensity:.13});
 function mesh(g:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0,camera=true){
  const object=new THREE.Mesh(g,m);object.position.set(x,y,z);object.castShadow=true;object.receiveShadow=true;gate.add(object);if(camera)occluders.push(object);return object;
 }
 function box(x:number,y:number,z:number,w:number,h:number,d:number,m:THREE.Material=stone,camera=true){return mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(.025,w*.1,h*.1,d*.1)),m,x,y,z,camera);}
 function block(minX:number,maxX:number,minZ:number,maxZ:number,bottom:number,top:number){colliders.push({minX,maxX,minZ,maxZ,bottom,top});}
 function extrude(s:THREE.Shape,depth:number,material:THREE.Material,z=0){
  const g=new THREE.ExtrudeGeometry(s,{depth,curveSegments:48,steps:1,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2});g.translate(0,0,-depth/2);return mesh(g,material,0,0,z);
 }
 const radius=2.25,spring=2.62,height=5.65,half=3.23;
 const surround=new THREE.Shape();
 surround.moveTo(-half,0);surround.lineTo(-radius,0);surround.lineTo(-radius,spring);
 surround.absarc(0,spring,radius,Math.PI,0,true);surround.lineTo(radius,0);surround.lineTo(half,0);surround.lineTo(half,height);surround.lineTo(-half,height);surround.closePath();
 extrude(surround,1.15,stone);
 block(-half,-radius,-.58,.58,0,height);block(radius,half,-.58,.58,0,height);
 block(-radius,radius,-.58,.58,spring+radius,height);

 // The radial arch stones and projecting jambs are separate dressed limestone.
 const archCount=25,arcWidth=Math.PI/archCount;
 for(let i=0;i<archCount;i++){
  const a=i*arcWidth+.005,b=(i+1)*arcWidth-.005,s=new THREE.Shape();
  s.absarc(0,spring,radius+.24,a,b,false);s.lineTo(Math.cos(b)*radius,spring+Math.sin(b)*radius);s.absarc(0,spring,radius,b,a,true);s.closePath();
  extrude(s,.12,trim,.61);
 }
 for(const x of [-2.38,2.38])box(x,spring/2,.64,.24,spring,.14,trim);
 for(const x of [-3.20,3.20]){
  box(x,3.17,.07,1.08,6.34,1.42,stone);
  box(x,6.32,.07,1.17,.19,1.54,trim);
  box(x,.16,.13,1.27,.32,1.53,trim);
  block(x-.55,x+.55,-.65,.8,0,6.45);
 }
 function merlon(x:number,y:number,width:number,depth:number){
  const s=new THREE.Shape();s.moveTo(-width/2,0);s.lineTo(width/2,0);s.lineTo(width*.38,.39);s.quadraticCurveTo(width*.28,.5,0,.5);s.quadraticCurveTo(-width*.28,.5,-width*.38,.39);s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2});g.translate(0,0,-depth/2);mesh(g,stone,x,y,.02);
 }
 for(const x of [-1.55,0,1.55])merlon(x,height,.57,1.1);
 for(const x of [-3.2,3.2])merlon(x,6.40,.72,1.28);
 box(0,5.61,.02,5.4,.12,1.25,trim);

 // Two steel leaves stay closed, with a real opening in the left leaf.
 // The opening is a notch, not a dark painted rectangle or an invisible wall.
 const {wicketLeft:left,wicketRight:right,wicketHeight:wh}=ENTRANCE;
 const leftLeaf=new THREE.Shape();leftLeaf.moveTo(-radius,0);leftLeaf.lineTo(left,0);leftLeaf.lineTo(left,wh);leftLeaf.lineTo(right,wh);leftLeaf.lineTo(right,0);leftLeaf.lineTo(0,0);leftLeaf.lineTo(0,spring+radius);leftLeaf.absarc(0,spring,radius,Math.PI/2,Math.PI,false);leftLeaf.closePath();
 extrude(leftLeaf,.14,steel,.1);
 const rightLeaf=new THREE.Shape();rightLeaf.moveTo(.022,0);rightLeaf.lineTo(radius,0);rightLeaf.lineTo(radius,spring);rightLeaf.absarc(0,spring,radius,0,Math.PI/2,false);rightLeaf.lineTo(.022,0);rightLeaf.closePath();extrude(rightLeaf,.14,steel,.1);
 block(-radius,left,-.01,.22,0,spring+radius);block(right,radius,-.01,.22,0,spring+radius);block(left,right,-.01,.22,wh,spring+radius);
 box(left-.035,wh/2,.20,.07,wh,.07,edge);box(right+.035,wh/2,.20,.07,wh,.07,edge);box((left+right)/2,wh+.035,.20,right-left+.14,.07,.07,edge);
 box(0,spring/2,.205,.034,spring,.065,edge);
 box(0,2.65,.205,4.46,.045,.065,edge);
 // Open pedestrian leaf, hinged into the garden along the left jamb.
 const pivot=new THREE.Group();pivot.position.set(left,.035,.1);pivot.rotation.y=Math.PI/2;gate.add(pivot);
 const smallDoor=new THREE.Mesh(new RoundedBoxGeometry(right-left-.06,wh-.07,.095,2,.014),steel);
 smallDoor.position.set((right-left-.06)/2,(wh-.07)/2,0);smallDoor.castShadow=true;smallDoor.receiveShadow=true;pivot.add(smallDoor);occluders.push(smallDoor);
 block(left-.06,left+.06,-1.12,.20,0,wh);
 for(const yy of [.35,1.86])box(left,yy,.27,.11,.23,.10,edge,false);

 // Small raised grape motifs and rivets from the ironwork in the reference.
 const bead=new THREE.SphereGeometry(1,10,7),studMatrices:THREE.Matrix4[]=[];const dummy=new THREE.Object3D();
 function stud(x:number,y:number,z:number,sx:number,sy:number,sz:number){dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();studMatrices.push(dummy.matrix.clone());}
 function grapes(x:number,y:number){
  for(let row=0;row<4;row++)for(let col=0;col<4-row;col++)stud(x+(col-(3-row)/2)*.052,y-row*.045,.215,.030,.032,.021);
  for(const side of [-1,1])stud(x+side*.073,y+.067,.209,.080,.032,.018);
 }
 for(const x of [-1.72,-.68,.66,1.72])for(const y of [.58,1.65,3.2,3.87]){
  if(x>left-.13&&x<right+.13&&y<wh+.15)continue;
  if(y>spring&&Math.hypot(x,y-spring)>radius-.3)continue;grapes(x,y);
 }
 for(let y=.2;y<2.58;y+=.27)for(const x of [-2.16,2.16])stud(x,y,.218,.023,.023,.015);
 for(let i=0;i<=30;i++){const a=i*Math.PI/30;stud(Math.cos(a)*(radius-.10),spring+Math.sin(a)*(radius-.10),.215,.022,.022,.015);}
 const studs=new THREE.InstancedMesh(bead,edge,studMatrices.length);studMatrices.forEach((m,i)=>studs.setMatrixAt(i,m));studs.castShadow=true;gate.add(studs);

 function plaque(x:number,y:number,w:number,h:number,text:string){
  box(x,y,.65,w+.10,h+.10,.13,trim,false);
  const face=new THREE.MeshStandardMaterial({color:'#d5c9ae',roughness:.93});
  if(withTextures&&typeof document!=='undefined'){
   const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.round(1024*h/w);
   const ctx=canvas.getContext('2d')!;
   ctx.fillStyle='#d5c9ae';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.strokeStyle='#948775';ctx.lineWidth=8;ctx.strokeRect(8,8,canvas.width-16,canvas.height-16);
   ctx.fillStyle='#51483e';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${Math.round(canvas.height*.48)}px Georgia, serif`;ctx.fillText(text,512,canvas.height*.53,970);
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;textures.push(texture);face.map=texture;face.color.set('#ffffff');
  }
  face.userData.gateLabel={text,width:w,height:h};mesh(new THREE.PlaneGeometry(w,h),face,x,y,.728,false);
 }
 plaque(1.42,5.28,1.72,.43,'ARTON AİLESİ');
 // The tiny left plaque cannot be read in the supplied image: retain its relief.
 box(-1.48,5.25,.65,.66,.42,.13,trim,false);
 for(const yy of [5.15,5.25,5.34])box(-1.48,yy,.73,.45,.018,.025,stone,false);
 const crest=new THREE.Mesh(new THREE.SphereGeometry(1,20,12),trim);crest.scale.set(.17,.25,.035);crest.position.set(0,5.29,.69);gate.add(crest);
 for(const side of [-1,1]){const curl=mesh(new THREE.TorusGeometry(.13,.04,8,24,Math.PI*1.5),trim,side*.15,5.25,.72,false);curl.rotation.z=side*Math.PI*.3;}

 // Pair of black wall lanterns, including brackets, glazing and metal frames.
 for(const x of [-2.72,2.72]){
  box(x,4.26,.65,.11,.39,.11,lampIron,false);box(x,4.34,.84,.055,.05,.38,lampIron,false);
  const body=mesh(new THREE.CylinderGeometry(.115,.082,.29,4),lampGlass,x,4.12,1.0,false);body.rotation.y=Math.PI/4;
  const cap=mesh(new THREE.ConeGeometry(.18,.14,4),lampIron,x,4.34,1.0,false);cap.rotation.y=Math.PI/4;
  mesh(new THREE.SphereGeometry(.034,10,8),lampIron,x,4.44,1,false);
  const bottom=mesh(new THREE.ConeGeometry(.11,.13,4),lampIron,x,3.91,1,false);bottom.rotation.z=Math.PI;bottom.rotation.y=Math.PI/4;
  for(const dx of [-.075,.075])for(const dz of [-.075,.075])box(x+dx,4.115,1+dz,.016,.3,.016,lampIron,false);
 }
 return {dispose:()=>textures.forEach(texture=>texture.dispose())};
}
