import * as THREE from 'three';
import {buildWorld} from './world';
import {createCharacter} from './character';
import {Sky} from 'three/addons/objects/Sky.js';
import {clamp,movePlayer,type Player} from './physics';
import {StartupError} from './startup-error';
import {ENTRANCE,PLAYER_SPAWN} from './entrance';

export type Snapshot={x:number;planY:number;height:number;zone:string;level:string;playing:boolean};
export type Direction='forward'|'backward'|'left'|'right';
export class GameEngine {
 readonly canvas:HTMLCanvasElement;
 readonly ready:Promise<void>;
 private renderer:THREE.WebGLRenderer;
 private scene=new THREE.Scene();
 private camera=new THREE.PerspectiveCamera(50,1,.12,520);
 private world:ReturnType<typeof buildWorld>;
 private character:ReturnType<typeof createCharacter>;
 private player:Player={...PLAYER_SPAWN};
 private keys=new Set<string>();
 private running=false;private started=false;private disposed=false;private raf=0;
 private last=0;private time=0;private reportTime=0;private yaw=0;private pitch=.05;private distance=5.4;
 private pointer:{id:number;x:number;y:number;downX:number;downY:number;dragging:boolean}|null=null;
 private joystick={x:0,y:0};private touchRun=false;
 private listeners:(()=>void)[]=[];
 private cameraTarget=new THREE.Vector3();private desiredCamera=new THREE.Vector3();private ray=new THREE.Raycaster();
 private movementOverride:{x:number;y:number;remaining:number;run:boolean;resolve:(s:Snapshot)=>void}|null=null;
 constructor(container:HTMLElement,private mapCanvas:HTMLCanvasElement,private report:(s:Snapshot)=>void,private pauseRequest:()=>void,private error:(message:string)=>void){
  try{this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}
  catch(cause){throw new StartupError('graphics',cause);}
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.88;
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.canvas=this.renderer.domElement;this.canvas.tabIndex=0;this.canvas.setAttribute('aria-label','Kadın karakterle konağı keşfet. WASD ile hareket et, fareyi sürükleyerek kamerayı çevir.');
  container.appendChild(this.canvas);
  this.scene.background=new THREE.Color('#b9c8d1');this.scene.fog=new THREE.Fog('#c6c9c8',105,330);
  const sky=new Sky();sky.scale.setScalar(450);sky.material.uniforms.turbidity.value=7;sky.material.uniforms.rayleigh.value=1.4;sky.material.uniforms.mieCoefficient.value=.007;sky.material.uniforms.mieDirectionalG.value=.82;sky.material.uniforms.sunPosition.value.set(-.48,.72,.2);this.scene.add(sky);
  this.scene.add(new THREE.HemisphereLight('#e4edf4','#a09b90',1.25));
  const sun=new THREE.DirectionalLight('#fff6e5',2.65);sun.position.set(-48,76,8);sun.target.position.set(0,0,-48);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-72,right:72,top:72,bottom:-72,near:1,far:180});
  sun.shadow.normalBias=.025;sun.shadow.bias=-.00012;this.scene.add(sun,sun.target);
  this.world=buildWorld(this.scene);this.character=createCharacter();this.scene.add(this.character.root);
  this.ready=Promise.all([
   this.world.ready.catch(cause=>{throw new StartupError('materials',cause);}),
   this.character.ready.catch(cause=>{throw new StartupError('character',cause);})
  ]).then(()=>{
   if(this.disposed)return;
   try{this.renderer.compile(this.scene,this.camera);}
   catch(cause){throw new StartupError('scene',cause);}
   this.raf=requestAnimationFrame(this.tick);
  });
  this.character.root.position.set(this.player.x,0,this.player.z);this.character.root.rotation.y=this.player.angle;
  this.camera.position.set(-6.2,3.5,16);this.camera.lookAt(0,2.6,0);
  const resize=()=>{const w=container.clientWidth,h=container.clientHeight;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);};
  const ro=new ResizeObserver(resize);ro.observe(container);this.listeners.push(()=>ro.disconnect());resize();
  this.listen(window,'keydown',(event:Event)=>{
   const e=event as KeyboardEvent;if((e.target as HTMLElement)?.closest('input,textarea,select,[role="dialog"]'))return;
   if(e.code==='Escape'){if(this.started){this.pause();this.pauseRequest();}return;}
   if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Space'].includes(e.code)){
    if(this.running)e.preventDefault();this.keys.add(e.code);
   }
  });
  this.listen(window,'keyup',(event:Event)=>this.keys.delete((event as KeyboardEvent).code));
  this.listen(window,'blur',()=>{this.clearInput();if(this.running){this.pause();this.pauseRequest();}});
  this.listen(document,'visibilitychange',()=>{if(document.hidden&&this.running){this.pause();this.pauseRequest();}});
  this.listen(this.canvas,'contextmenu',(e:Event)=>e.preventDefault());
  this.listen(this.canvas,'pointerdown',(event:Event)=>{
    if(!this.running)return;const e=event as PointerEvent;this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,downX:e.clientX,downY:e.clientY,dragging:false};if(e.isTrusted)this.canvas.setPointerCapture(e.pointerId);this.canvas.focus({preventScroll:true});
  });
  this.listen(this.canvas,'pointermove',(event:Event)=>{
   const e=event as PointerEvent;if(!this.running||!this.pointer||e.pointerId!==this.pointer.id)return;
   if(!this.pointer.dragging){if(Math.hypot(e.clientX-this.pointer.downX,e.clientY-this.pointer.downY)<14)return;this.pointer.dragging=true;}
   this.yaw-=(e.clientX-this.pointer.x)*.004;this.pitch=clamp(this.pitch+(e.clientY-this.pointer.y)*.003,-.15,.95);
   this.pointer.x=e.clientX;this.pointer.y=e.clientY;
  });
    this.listen(this.canvas,'pointerup',()=>{this.pointer=null;});
    this.listen(this.canvas,'pointercancel',()=>{this.pointer=null;});
  this.listen(this.canvas,'wheel',(event:Event)=>{if(!this.running)return;const e=event as WheelEvent;e.preventDefault();this.distance=clamp(this.distance+e.deltaY*.005,3.1,8.5);},{passive:false});
  this.listen(this.canvas,'webglcontextlost',(e:Event)=>{e.preventDefault();this.pause();this.error('3D görüntü durdu. Sayfayı yenileyerek yeniden başlayabilirsin.');});
  this.report(this.snapshot());this.drawMap();
 }
 private listen(target:EventTarget,event:string,callback:(e:Event)=>void,options?:AddEventListenerOptions){target.addEventListener(event,callback,options);this.listeners.push(()=>target.removeEventListener(event,callback,options));}
 private clearInput(){this.keys.clear();this.joystick={x:0,y:0};this.touchRun=false;this.pointer=null;}
 start(){this.started=true;this.running=true;this.clearInput();this.canvas.focus({preventScroll:true});this.report(this.snapshot());}
 pause(){this.running=false;this.clearInput();if(this.movementOverride){this.movementOverride.resolve(this.snapshot());this.movementOverride=null;}this.report(this.snapshot());}
 reset(){this.player={...PLAYER_SPAWN};this.yaw=0;this.pitch=.05;this.distance=5.4;this.start();this.report(this.snapshot());}
 resetCamera(){this.yaw=this.player.angle+Math.PI;this.pitch=this.player.z>0?.05:.31;this.distance=5.4;}
 setJoystick(x:number,y:number){this.joystick={x,y};}
 setRunning(value:boolean){this.touchRun=value;}
 snapshot():Snapshot{
  const p=-this.player.z,h=this.player.y;
  let zone='Bahçe yolu';if(p<-.6)zone='Ana kapı önü';else if(p<3)zone='Ana kapı';else if(p<31&&this.player.x<-5)zone='Asmalı bahçe';else if(p>31)zone='Taş avlu';
  if(h>1.0&&h<4.4)zone='Avlu merdiveni';
  if(h>=4.4&&h<5)zone=this.player.x>-5.3?'Kemerli revak':'Alt teras';
  if(h>=5&&h<9.4)zone='Teras merdiveni';if(h>=9.4)zone='Üst teras';
  if(p>79)zone='Arka avlu ve teraslar';
  return {x:Math.round(this.player.x*100)/100,planY:Math.round(p*100)/100,height:Math.round(h*100)/100,zone,level:p<0?'KONAK GİRİŞİ':h>9?'ÜST TERAS':h>4?'REVAK KATI':'BAHÇE KATI',playing:this.running};
 }
 async walk(direction:Direction,seconds:number,run:boolean):Promise<Snapshot>{
  if(!this.running)throw new Error('Önce keşfi başlat.');
  if(this.movementOverride)throw new Error('Karakter zaten hareket ediyor.');
  if(!['forward','backward','left','right'].includes(direction)||!Number.isFinite(seconds)||seconds<.1||seconds>6||typeof run!=='boolean')throw new Error('Yön ve süre geçerli olmalı; süre 0.1–6 saniye arasında olmalı.');
  const values={forward:[0,1],backward:[0,-1],left:[-1,0],right:[1,0]}[direction];
  return new Promise(resolve=>{this.movementOverride={x:values[0],y:values[1],remaining:seconds,run,resolve};});
 }
 private tick=(now:number)=>{
  if(this.disposed)return;this.raf=requestAnimationFrame(this.tick);
  const dt=this.last?Math.min((now-this.last)/1000,.05):.016;this.last=now;this.time+=dt;
  let actualSpeed=0;
  if(this.running){
   let ix=(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0)+this.joystick.x;
   let iz=(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0)-(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)+this.joystick.y;
   let running=this.touchRun||this.keys.has('ShiftLeft')||this.keys.has('ShiftRight');
   if(this.movementOverride){ix=this.movementOverride.x;iz=this.movementOverride.y;running=this.movementOverride.run;}
   const len=Math.hypot(ix,iz);if(len>1){ix/=len;iz/=len;}if(len<.08){ix=0;iz=0;}
   const speed=running?4.0:1.65;
   const dx=(ix*Math.cos(this.yaw)-iz*Math.sin(this.yaw))*speed*dt;
   const dz=(-ix*Math.sin(this.yaw)-iz*Math.cos(this.yaw))*speed*dt;
   const beforeX=this.player.x,beforeZ=this.player.z;
   movePlayer(this.player,dx,dz,dt,this.world.surfaces,this.world.colliders);
   actualSpeed=Math.hypot(this.player.x-beforeX,this.player.z-beforeZ)/dt;
   if(Math.hypot(dx,dz)>.0001){const angle=Math.atan2(dx,dz);const delta=Math.atan2(Math.sin(angle-this.player.angle),Math.cos(angle-this.player.angle));this.player.angle+=delta*(1-Math.exp(-12*dt));}
   if(this.movementOverride){this.movementOverride.remaining-=dt;if(this.movementOverride.remaining<=0){const complete=this.movementOverride.resolve;this.movementOverride=null;this.report(this.snapshot());complete(this.snapshot());}}
  }
  this.character.root.position.set(this.player.x,this.player.y,this.player.z);this.character.root.rotation.y=this.player.angle;
  this.character.animate(dt,actualSpeed,this.time);
  if(this.started){
   this.cameraTarget.set(this.player.x,this.player.y+1.42,this.player.z);
   this.desiredCamera.set(this.player.x+Math.sin(this.yaw)*Math.cos(this.pitch)*this.distance,this.player.y+1.7+Math.sin(this.pitch)*this.distance,this.player.z+Math.cos(this.yaw)*Math.cos(this.pitch)*this.distance);
   const dir=this.desiredCamera.clone().sub(this.cameraTarget);const length=dir.length();dir.normalize();this.ray.set(this.cameraTarget,dir);this.ray.far=length;
   const hit=this.ray.intersectObjects(this.world.occluders,false)[0];
   if(hit&&hit.distance<length)this.desiredCamera.copy(this.cameraTarget).addScaledVector(dir,Math.max(.75,hit.distance-.3));
   this.desiredCamera.y=Math.max(this.player.y+.5,this.desiredCamera.y);
   this.camera.position.lerp(this.desiredCamera,1-Math.exp(-6*dt));this.camera.lookAt(this.cameraTarget);
  } else {
   const drift=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:Math.sin(this.time*.07)*.35;
   this.camera.position.set(-6.2+drift,3.5,16);this.camera.lookAt(0,2.6,0);
  }
  this.world.water.forEach((w,i)=>{const m=w.material as THREE.MeshStandardMaterial;m.opacity=.79+Math.sin(this.time*2+i)*.06;});
  this.renderer.render(this.scene,this.camera);
  this.reportTime+=dt;if(this.reportTime>.16){this.reportTime=0;this.report(this.snapshot());this.drawMap();}
 };
 private drawMap(){
  const ctx=this.mapCanvas.getContext('2d');if(!ctx)return;
  const w=270,h=420;if(this.mapCanvas.width!==w){this.mapCanvas.width=w;this.mapCanvas.height=h;}
  ctx.clearRect(0,0,w,h);const px=(x:number)=>35+(x+17)*6.35,py=(p:number)=>374-p*3.2;
  const rect=(x:number,p:number,width:number,depth:number,color:string)=>{ctx.fillStyle=color;ctx.fillRect(px(x),py(p+depth),width*6.35,depth*3.2);};
  rect(-16.5,-12,27.3,12,'#b4a38944');
  ctx.strokeStyle='#e4d5b8aa';ctx.lineWidth=2;ctx.strokeRect(px(-17),py(107),29*6.35,107*3.2);
  rect(-16,1,12.7,30,'#75826966');rect(3.3,1,7.5,26,'#75826966');rect(-3,0,6,33,'#ded1b999');
  rect(-15,2,8,11,'#ac9e7266');rect(-5,42,15,36,'#c9b28b');rect(-5,42,7,22,'#f0deaf');rect(-14.5,67.15,9.5,10.85,'#b09c75');rect(-7.7,59.8,2.7,18.2,'#b09c75');rect(-5,78,15,9.8,'#b7a68c');rect(-14.3,80,6.2,18,'#a08f73');rect(-7,88.5,17.8,17,'#8e876f');
  ctx.strokeStyle='#9dc7b6';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px(-5),py(42));ctx.lineTo(px(-5),py(64));ctx.stroke();
  ctx.strokeStyle='#f7eaca';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px(-12.8),py(66));ctx.lineTo(px(-12.8),py(61));ctx.lineTo(px(-5),py(61));ctx.stroke();
  ctx.fillStyle='#75b6ba';ctx.beginPath();ctx.arc(px(7.6),py(35.5),4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f3dbab';ctx.fillRect(px(-3.75),py(0)-2,(3.75+ENTRANCE.wicketLeft)*6.35,4);ctx.fillRect(px(ENTRANCE.wicketRight),py(0)-2,(3.75-ENTRANCE.wicketRight)*6.35,4);
  ctx.save();ctx.translate(px(this.player.x),py(-this.player.z));ctx.rotate(Math.PI-this.player.angle);
  ctx.fillStyle='#ffffff';ctx.shadowColor='#26362c';ctx.shadowBlur=7;ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,6);ctx.lineTo(0,3);ctx.lineTo(-6,6);ctx.closePath();ctx.fill();ctx.restore();
 }
 dispose(){this.disposed=true;cancelAnimationFrame(this.raf);this.listeners.forEach(fn=>fn());this.pause();
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
  this.scene.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.character.dispose();this.world.dispose();this.renderer.dispose();this.canvas.remove();
 }
}
