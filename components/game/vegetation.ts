import * as THREE from 'three';

// Real silhouettes are formed by tapered branching and individual curved leaves.
// All twigs/leaves share instance batches, keeping the garden inexpensive to draw.
export function createVegetation(root:THREE.Group,random:()=>number){
 const bark=new THREE.MeshStandardMaterial({color:'#625951',roughness:1});
 const leafMaterial=new THREE.MeshStandardMaterial({color:'#69765a',roughness:.94,side:THREE.DoubleSide,envMapIntensity:.3});
 const twigGeometry=new THREE.CylinderGeometry(.56,1,1,7,1);
 const leafGeometry=new THREE.BufferGeometry();
 leafGeometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.35,.32,.08,0,.45,.13,.35,.32,.08,0,1,0],3));
 leafGeometry.setIndex([0,1,2,0,2,3,1,4,2,2,4,3]);leafGeometry.computeVertexNormals();
 const branches:THREE.Matrix4[]=[],leaves:THREE.Matrix4[]=[],colors:THREE.Color[]=[];
 const transform=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
 function branch(a:THREE.Vector3,b:THREE.Vector3,r:number){
  transform.position.copy(a).add(b).multiplyScalar(.5);
  transform.quaternion.setFromUnitVectors(up,b.clone().sub(a).normalize());
  transform.scale.set(r,a.distanceTo(b),r);transform.updateMatrix();branches.push(transform.matrix.clone());
 }
 function leaf(x:number,y:number,z:number,size:number,shade=1){
  transform.position.set(x,y,z);transform.rotation.set(random()*6.28,random()*6.28,random()*6.28);
  transform.scale.set(size,size*(.8+random()*.5),size);transform.updateMatrix();leaves.push(transform.matrix.clone());
  colors.push(new THREE.Color().setHSL(.21+random()*.06,.16+random()*.14,(.28+random()*.20)*shade));
 }
 function winterTree(x:number,p:number,r:number){
  const h=4.1+r*.7,base=new THREE.Vector3(x,0,-p);
  const top=base.clone().add(new THREE.Vector3((random()-.5)*.3,h,0));
  const elbow=base.clone().lerp(top,.54).add(new THREE.Vector3(.12,0,-.10));
  branch(base,elbow,.13);branch(elbow,top,.085);
  for(let i=0;i<11;i++){
   const angle=i*2.399+random()*.45,level=.30+i*.045;
   const start=base.clone().lerp(top,level);
   const reach=r*(.7+random()*.55)*(1-level*.3);
   const end=start.clone().add(new THREE.Vector3(Math.cos(angle)*reach,1.0+random()*1.7,Math.sin(angle)*reach));
   const mid=start.clone().lerp(end,.55).add(new THREE.Vector3(0,-.1,0));
   branch(start,mid,.045*(1-level*.5));branch(mid,end,.024);
   for(let j=0;j<5;j++){
    const a=angle+(random()-.5)*2.4,s=mid.clone().lerp(end,j/5),q=s.clone().add(new THREE.Vector3(Math.cos(a)*(.35+random()*.45),.35+random()*.9,Math.sin(a)*(.35+random()*.45)));
    branch(s,q,.008+random()*.007);
    for(let k=0;k<3;k++){
     const aa=a+(random()-.5)*2,tip=q.clone().add(new THREE.Vector3(Math.cos(aa)*.35,.25+random()*.3,Math.sin(aa)*.35));branch(q,tip,.004);
    }
   }
  }
 }
 function shrub(x:number,p:number,y:number,r:number,tall=1){
  branch(new THREE.Vector3(x,y,-p),new THREE.Vector3(x,y+r*tall,-p),.025*r);
  const count=Math.round(900*r*r*tall);
  for(let i=0;i<count;i++){
   const a=random()*Math.PI*2,cos=1-random()*2,sin=Math.sqrt(1-cos*cos),radius=r*Math.cbrt(random());
   leaf(x+Math.cos(a)*sin*radius,y+r*tall+cos*radius*tall,-p+Math.sin(a)*sin*radius,.095+random()*.11);
  }
 }
 function cypress(x:number,p:number,h=3.2){
  branch(new THREE.Vector3(x,0,-p),new THREE.Vector3(x,h,-p),.075);
  for(let i=0;i<2300;i++){
   const t=random(),radius=(.1+Math.sin(t*Math.PI)**.75*.62)*Math.sqrt(random()),a=random()*6.28;
   leaf(x+Math.cos(a)*radius,.3+t*h,-p+Math.sin(a)*radius,.14+random()*.14,.7);
  }
 }
 function grass(x:number,p:number){
  for(let i=0;i<9;i++){
   transform.position.set(x+(random()-.5)*.16,.10,-p+(random()-.5)*.16);transform.rotation.set((random()-.5)*.3,random()*6.28,(random()-.5)*.6);
   transform.scale.set(.035,.15+random()*.22,.06);transform.updateMatrix();leaves.push(transform.matrix.clone());colors.push(new THREE.Color('#6d7254'));
  }
 }
 function vine(x1:number,p1:number,x2:number,p2:number,h:number){
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x1,0,-p1),new THREE.Vector3(x1+.1,h-.8,-p1-.2),new THREE.Vector3(x1,h,-p1),new THREE.Vector3(x2,h-.12,-p2)]);
  for(let i=0;i<16;i++)branch(curve.getPoint(i/16),curve.getPoint((i+1)/16),.018);
  for(let i=3;i<16;i+=2){const a=curve.getPoint(i/16),b=a.clone().add(new THREE.Vector3((random()-.5)*1.6,(random()-.5)*.3,(random()-.5)*1.6));branch(a,b,.008);}
 }
 function finish(){
  for(const [geometry,material,matrices] of [[twigGeometry,bark,branches],[leafGeometry,leafMaterial,leaves]] as const){
   const instanced=new THREE.InstancedMesh(geometry,material,matrices.length);
   matrices.forEach((m,i)=>{instanced.setMatrixAt(i,m);if(matrices===leaves)instanced.setColorAt(i,colors[i]);});
   instanced.castShadow=true;instanced.receiveShadow=true;instanced.computeBoundingSphere();root.add(instanced);
  }
 }
 return {winterTree,shrub,cypress,grass,vine,finish};
}
