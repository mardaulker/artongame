import * as THREE from 'three';

// An approximate, hand-authored likeness from the portrait references, not a
// photo projection. Coordinates below are Rocketbox model-space centimetres.
function adaptFace(model:THREE.Group){
 model.updateMatrixWorld(true);
 const toModel=new THREE.Matrix4().copy(model.matrixWorld).invert();
 model.traverse(object=>{
  if(!(object instanceof THREE.Mesh))return;
  const geometry:THREE.BufferGeometry=object.geometry;
  const position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
  if(!position||!uv)return;
  const materials=Array.isArray(object.material)?object.material:[object.material];
  const transform=new THREE.Matrix4().multiplyMatrices(toModel,object.matrixWorld),inverse=transform.clone().invert();
  const point=new THREE.Vector3(),indices:number[]=[],visited=new Set<number>();
  const groups=geometry.groups.map(group=>({...group}));
  const sourceIndex=geometry.index;
  const vertexAt=(offset:number)=>sourceIndex?sourceIndex.getX(offset):offset;
    const bell=(value:number,center:number,width:number)=>Math.exp(-(((value-center)/width)**2));
  geometry.clearGroups();
  for(const group of groups){
   const name=materials[group.materialIndex??0]?.name??'';
   const isHead=name.includes('head'),isHair=name.includes('opacity'),start=indices.length;
   for(let offset=group.start;offset<group.start+group.count;offset+=3){
    const triangle=[vertexAt(offset),vertexAt(offset+1),vertexAt(offset+2)];
    // Remove only the rear bun and its flyaway cards, never the eyelashes,
    // scalp, eyes, neck, or clothing that share the same mesh/materials.
    const oldBun=(isHead||isHair)&&triangle.every(index=>{
     point.fromBufferAttribute(position,index).applyMatrix4(transform);
     return point.y>149&&point.z<-13&&(isHair||(uv.getX(index)>.48&&uv.getY(index)<.22));
    });
    if(oldBun)continue;
    indices.push(...triangle);
    if(!isHead)continue;
    for(const index of triangle){
     if(visited.has(index))continue;visited.add(index);
     const u=uv.getX(index),v=uv.getY(index);
     // The face occupies the central atlas island; eyeballs and teeth do not.
     if(u<.29||u>.71||v<.44||v>.87)continue;
     point.fromBufferAttribute(position,index).applyMatrix4(transform);
     const {x,y,z}=point;
     const front=THREE.MathUtils.smoothstep(z,-2,2);
     const cheek=bell(y,156.5,3.4)*bell(Math.abs(x),4.4,2);
     const jaw=bell(y,150.2,2.5);
     const smile=bell(y,153.3,1.15)*bell(Math.abs(x),2.2,.85);
     // Softer cheeks, a less angular jaw and a restrained smiling mouth.
     point.x+=front*(Math.sign(x)*cheek*.38-x*jaw*.025);
     point.y+=front*(smile*.48+bell(y,148.5,1.5)*.2);
     point.z+=front*(cheek*.22-bell(y,157.5,1.7)*bell(x,0,1.15)*.18);
     point.applyMatrix4(inverse);position.setXYZ(index,point.x,point.y,point.z);
    }
   }
   if(indices.length>start)geometry.addGroup(start,indices.length-start,group.materialIndex);
  }
  geometry.setIndex(indices);position.needsUpdate=true;
  // Keep the authored smooth normals: recomputing a non-welded FBX would
  // introduce hard edges on the skin. The facial offsets are sub-centimetre.
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
 });
}

function hairTexture(){
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=512;
 const context=canvas.getContext('2d');
 if(!context)throw new Error('Hair texture canvas is unavailable');
 const pixels=context.createImageData(canvas.width,canvas.height);
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
  const t=y/(canvas.height-1),highlight=THREE.MathUtils.smoothstep(t,.3,1);
  const streak=Math.sin(x*2.3+Math.sin(t*8)*.3)*.07+Math.sin(x*.61)*.1+Math.sin(x*.17)*.08;
  const shade=.86+streak,index=(y*canvas.width+x)*4;
  // Dark brown roots, muted light-brown lengths, fine longitudinal strands.
  pixels.data[index]=(55+highlight*43)*shade;
  pixels.data[index+1]=(36+highlight*35)*shade;
  pixels.data[index+2]=(27+highlight*25)*shade;
  pixels.data[index+3]=255;
 }
 context.putImageData(pixels,0,0);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 texture.name='Portrait shoulder-length brown hair';return texture;
}

function addPortraitHair(model:THREE.Group){
 const head=model.getObjectByName('Bip01_Head');if(!head)return;
 const hair=new THREE.Group();hair.name='Portrait shoulder-length parted hair';
 const material=new THREE.MeshStandardMaterial({map:hairTexture(),roughness:.78,side:THREE.DoubleSide});
 function surface(name:string,rows:number,columns:number,sample:(t:number,u:number)=>THREE.Vector3){
  const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
  for(let row=0;row<=rows;row++)for(let column=0;column<=columns;column++){
   const t=row/rows,u=column/columns;
   positions.push(...sample(t,u).toArray());uvs.push(u,1-t);
  }
  for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
   const a=row*(columns+1)+column,b=a+columns+1;
   indices.push(a,b,a+1,b,b+1,a+1);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;hair.add(mesh);
 }
 // A fitted crown covers the original swept-back scalp, leaving the forehead
 // and face exposed. A narrow groove suggests a slightly off-centre part.
 surface('Parted crown',20,64,(t,u)=>{
  const angle=u*Math.PI*2,front=Math.cos(angle);
  const limit=front>0?1.55-front*.62:1.55-front*.45,theta=t*limit;
  const x=Math.sin(angle)*Math.sin(theta)*8.9;
    const part=.22*Math.exp(-(((x+.65)/.48)**2));
  return new THREE.Vector3(x,161.7+Math.cos(theta)*11.2-part,-5.9+Math.cos(angle)*Math.sin(theta)*9.5);
 });
 // Layered, gently bent sheets instead of thick cylindrical "rope" locks.
 for(let i=0;i<22;i++){
  const angle=.65+i/21*(Math.PI*2-1.3),side=Math.sin(angle),back=Math.cos(angle);
  const endY=132+3*Math.cos(angle*2)+1.2*Math.sin(i*2.4);
  const curve=new THREE.CatmullRomCurve3([
   new THREE.Vector3(side*7.6,167,-5.9+back*7.8),
   new THREE.Vector3(side*9.3,157,-5.9+back*9.2),
   new THREE.Vector3(side*10.7,145,-5.1+back*9.9),
   new THREE.Vector3(side*11.5,endY,-3.6+back*9.5),
  ]);
  surface('Shoulder-length hair layer',26,6,(t,u)=>{
   const point=curve.getPoint(t),across=(u-.5)*3.5*(1-.75*t**7);
   const wave=Math.sin(t*8+i*.55)*.55*t;
   point.x+=Math.cos(angle)*across+side*wave;
   point.z-=Math.sin(angle)*across;point.z+=back*(wave+Math.sin(u*Math.PI)*.28);
   return point;
  });
 }
 for(const side of [-1,1]){
  const curve=new THREE.CatmullRomCurve3([
   new THREE.Vector3(-.65+side*.55,172,0),
   new THREE.Vector3(side*6.3,167,2.8),
   new THREE.Vector3(side*8.5,155,3.2),
   new THREE.Vector3(side*9.8,143,4.2),
   new THREE.Vector3(side*11,133.5,5.1),
  ]);
  surface('Face-framing parted lock',32,8,(t,u)=>{
   const point=curve.getPoint(t),width=2.7*(.4+.6*Math.sin(Math.PI*t))*(1-.75*t**8);
   point.x+=(u-.5)*width;point.z+=Math.sin(u*Math.PI)*.3+Math.sin(t*9)*.28;
   return point;
  });
 }
 model.add(hair);model.updateMatrixWorld(true);head.attach(hair);
}

export function applyPortraitAppearance(model:THREE.Group){
 adaptFace(model);addPortraitHair(model);
}