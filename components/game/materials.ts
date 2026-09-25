import * as THREE from 'three';

// Photographed CC0 surfaces. World coordinates preserve their physical scale on
// long walls, bevelled trim, rotated arches and instanced architectural details.
export function createStonePalette(loadTextures=typeof document!=='undefined'){
 const pending:Promise<unknown>[]=[];
 const textures=new Set<THREE.Texture>();
 const cache=new Map<string,THREE.Texture>();
 const loader=loadTextures?new THREE.TextureLoader():null;
 function texture(set:string,channel:string,size:string){
  const url=`/assets/materials/${set}/${set}_${channel}_${size}.jpg`;
  const cached=cache.get(url);if(cached)return cached;
  const result=new THREE.Texture();cache.set(url,result);textures.add(result);
  result.wrapS=result.wrapT=THREE.RepeatWrapping;result.anisotropy=8;
  if(channel==='diff')result.colorSpace=THREE.SRGBColorSpace;
  if(loader)pending.push(loader.loadAsync(url).then(loaded=>{result.image=loaded.image;result.needsUpdate=true;loaded.dispose();}));
  return result;
 }
 function surface(set:string,size:string,meters:number,color:string,normal=.55){
  const m=new THREE.MeshStandardMaterial({color,roughness:.94,envMapIntensity:.3});
  if(loadTextures){
   m.map=texture(set,'diff',size);m.normalMap=texture(set,'nor_gl',size);
   m.roughnessMap=texture(set,'rough',size);m.aoMap=texture(set,'ao',size);
   m.normalScale.set(normal,normal);m.aoMapIntensity=.48;
  }
  m.onBeforeCompile=shader=>{
   shader.uniforms.surfaceMeters={value:meters};
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSurfaceWorld;');
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    vec4 surfacePosition=vec4(transformed,1.0);
    #ifdef USE_INSTANCING
     surfacePosition=instanceMatrix*surfacePosition;
    #endif
    vSurfaceWorld=(modelMatrix*surfacePosition).xyz;`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vSurfaceWorld;\nuniform float surfaceMeters;');
   const uvCode=`vec3 surfaceN=abs(normalize(cross(dFdx(vSurfaceWorld),dFdy(vSurfaceWorld))));
    vec2 surfaceUv=(surfaceN.y>0.58?vSurfaceWorld.xz:(surfaceN.x>surfaceN.z?vSurfaceWorld.zy:vSurfaceWorld.xy))/surfaceMeters;`;
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',uvCode+'\n'+THREE.ShaderChunk.map_fragment.replaceAll('vMapUv','surfaceUv'));
   for(const name of ['normal_fragment_begin','normal_fragment_maps','roughnessmap_fragment','aomap_fragment'] as const){
    shader.fragmentShader=shader.fragmentShader.replace(`#include <${name}>`,THREE.ShaderChunk[name].replaceAll('vNormalMapUv','surfaceUv').replaceAll('vRoughnessMapUv','surfaceUv').replaceAll('vAoMapUv','surfaceUv'));
   }
  };
  m.userData={textureSet:set,textureSize:size,surfaceMeters:meters};
    m.customProgramCacheKey=()=>`arton-photo-pbr-v2-${meters}`;
  return m;
 }
 const stone=surface('stone_tile_wall','1k',2.6,'#e9e5d9',.4);
 const oldStone=surface('rustic_stone_wall_02','1k',3,'#ddd7c9',.7);
 const paving=surface('medieval_blocks_03','2k',2.3,'#e1ddd1',.5);
 const trim=surface('stone_tile_wall','1k',3.1,'#f1eee6',.14);
 return {stone,oldStone,paving,trim,ready:Promise.all(pending).then(()=>{}),dispose:()=>textures.forEach(t=>t.dispose())};
}
