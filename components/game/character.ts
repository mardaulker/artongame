import * as THREE from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {applyPortraitAppearance} from './character-appearance';

// Microsoft Rocketbox Female Adult 07, MIT. Real skin/clothing textures and
// matched motion-capture clips replace the former assembled primitive figure.
export function createCharacter(){
 const root=new THREE.Group();root.name='Female explorer';
 let mixer:THREE.AnimationMixer|undefined,active:THREE.AnimationAction|undefined,disposed=false;
 const actions=new Map<string,THREE.AnimationAction>();
 const manager=new THREE.LoadingManager();
 const textureReady=new Promise<void>((resolve,reject)=>{manager.onLoad=()=>resolve();manager.onError=url=>reject(new Error('Character asset failed: '+url));});
 manager.setURLModifier(url=>{
  if(/\.tga$/i.test(url)){
   const name=url.replaceAll('\\','/').split('/').pop()!.replace(/\.tga$/i,'.webp');
   // A new filename avoids reusing the empty texture cached by the prior release.
   const replacements:Record<string,string>={
    'f007_head_specular.webp':'f007_head_specular_v2.webp',
    'f007_head_color.webp':'f007_head_color_v2.webp',
    'f007_body_color.webp':'f007_body_color_v2.webp',
   };
   return '/assets/character/'+(replacements[name]??name);
  }
  return url;
 });
 manager.addHandler(/\.tga$/i,new THREE.TextureLoader(manager));
 const loader=new FBXLoader(manager);
 async function clip(name:string){
  const response=await fetch(`/assets/character/${name}.json`);
  if(!response.ok)throw new Error('Animation could not load: '+name);
  return THREE.AnimationClip.parse(await response.json());
 }
 const ready=Promise.all([loader.loadAsync('/assets/character/female.fbx'),clip('idle'),clip('walk'),clip('run'),textureReady]).then(([model,idle,walk,run])=>{
  const lights:THREE.Object3D[]=[];
  model.traverse(o=>{
   if(o instanceof THREE.Light)lights.push(o);
   if(o instanceof THREE.Mesh){
    o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;
    const originals=Array.isArray(o.material)?o.material:[o.material];
    const materials=originals.map(original=>{
     const old=original as THREE.MeshPhongMaterial,hair=old.name.includes('opacity');
        const m=new THREE.MeshStandardMaterial({name:old.name,color:'#ffffff',map:old.map,normalMap:hair?null:old.normalMap,roughness:old.name.includes('head')?.65:.83,envMapIntensity:.35,side:hair?THREE.DoubleSide:THREE.FrontSide,alphaTest:hair?.28:0});
     if(m.map)m.map.colorSpace=THREE.SRGBColorSpace;
     m.normalScale.set(.45,.45);old.dispose();return m;
    });
    o.material=Array.isArray(o.material)?materials:materials[0];
   }
  });
   lights.forEach(o=>o.removeFromParent());applyPortraitAppearance(model);model.scale.setScalar(.01);model.position.y=.003;
  root.add(model);mixer=new THREE.AnimationMixer(model);
  for(const motion of [idle,walk,run])actions.set(motion.name,mixer.clipAction(motion));
  active=actions.get('idle')!;active.play();mixer.update(.01);
  if(disposed)dispose();
 });
 function animate(dt:number,speed:number,_time:number){
  if(!mixer||disposed)return;
  const name=speed<.08?'idle':speed<2.7?'walk':'run',next=actions.get(name)!;
  if(next!==active){next.reset().setEffectiveWeight(1).play();if(active)next.crossFadeFrom(active,.22,false);active=next;}
  next.setEffectiveTimeScale(name==='idle'?1:THREE.MathUtils.clamp(speed/(name==='walk'?1.214:2.765),.55,1.65));
  mixer.update(dt);
 }
 function dispose(){disposed=true;mixer?.stopAllAction();
   const textures=new Set<THREE.Texture>(),materials=new Set<THREE.Material>(),geometries=new Set<THREE.BufferGeometry>();
   root.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const value of Object.values(m))if(value instanceof THREE.Texture)textures.add(value);}}});
   textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());
 }
 return {root,ready,animate,dispose};
}
