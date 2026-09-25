"use client";
import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent} from 'react';
import {ArrowUpRight,Maximize,Mouse,Pause,RotateCcw,MapPin,MoveUpRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import type {GameEngine,Snapshot,Direction} from './engine';
import {startupErrorMessage} from './startup-error';
import {PLAYER_SPAWN} from './entrance';
import {LocationMap} from './LocationMap';
import {LOCATION_LIST} from './locations';

const initial:Snapshot={x:PLAYER_SPAWN.x,planY:-PLAYER_SPAWN.z,height:PLAYER_SPAWN.y,zone:'Ana kapı önü',level:'KONAK GİRİŞİ',playing:false};
type ModelContext={registerTool:(tool:{name:string;title:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown|Promise<unknown>},options:{signal:AbortSignal})=>void|Promise<void>};

function Mark(){return <svg className="brand-mark" viewBox="0 0 40 48" fill="none" aria-hidden="true"><path d="M6 43V20a14 14 0 0 1 28 0v23M1 43h38M12 42V21a8 8 0 0 1 16 0v21M2 47h36" stroke="currentColor" strokeWidth="1.3"/><path d="M20 4V0M8 9 5 6M32 9l3-3" stroke="currentColor"/></svg>}

export default function Game(){
 const [locationsOpen,setLocationsOpen]=useState(false);
 const resumeAfterMap=useRef(false);
 const worldRef=useRef<HTMLDivElement>(null),mapRef=useRef<HTMLCanvasElement>(null),engine=useRef<GameEngine|null>(null);
 const [ready,setReady]=useState(false),[started,setStarted]=useState(false),[paused,setPaused]=useState(false),[error,setError]=useState(''),[snapshot,setSnapshot]=useState(initial);
 const [knob,setKnob]=useState({x:0,y:0});const joystickPointer=useRef<number|null>(null);
 const startRef=useRef<()=>void>(()=>{});
 const start=()=>{engine.current?.start();setStarted(true);setPaused(false);};startRef.current=start;
 const pause=(open:boolean)=>{setPaused(open);if(open)engine.current?.pause();else if(started)engine.current?.start();};
 const reset=()=>{engine.current?.reset();setStarted(true);setPaused(false);};
 const toggleLocations=(open:boolean)=>{if(open){resumeAfterMap.current=!!engine.current?.snapshot().playing;engine.current?.pause();}else if(resumeAfterMap.current){engine.current?.start();}setLocationsOpen(open);};
 useEffect(()=>{
  let cancelled=false;let unregister:AbortController|undefined;
  import('./engine').then(async({GameEngine})=>{
   if(cancelled||!worldRef.current||!mapRef.current)return;
   try{
    const instance=new GameEngine(worldRef.current,mapRef.current,setSnapshot,()=>setPaused(true),setError);engine.current=instance;await instance.ready;if(cancelled)return;setReady(true);
    const ctx=(document as Document&{modelContext?:ModelContext}).modelContext;
    if(ctx?.registerTool){
     unregister=new AbortController();const options={signal:unregister.signal};
     const register=(tool:Parameters<ModelContext['registerTool']>[0])=>{try{void Promise.resolve(ctx.registerTool(tool,options)).catch(()=>{});}catch{/* Browser support is optional. */}};
     register({name:'list_mansion_locations',title:'Konak konum kodlarını oku',description:'Read stable IDs, Turkish descriptions and reference coordinates. World position is x, height, -planY; anchors are not teleport targets.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>LOCATION_LIST});
     register({name:'get_exploration_state',title:'Konumdaki keşif durumunu oku',description:'Read the character location, terrace level and whether the game is running. Does not move the character.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>instance.snapshot()});
     register({name:'start_exploration',title:'Konakta keşfe başla',description:'Start or resume the same third-person exploration as the visible start / continue button.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async()=>{startRef.current();await new Promise(r=>requestAnimationFrame(r));return instance.snapshot();}});
     register({name:'walk_character',title:'Karakteri yürüt',description:'Walk the character relative to the camera using the normal movement and collision rules. The game must be running. Cannot teleport or pass through walls.',inputSchema:{type:'object',properties:{direction:{type:'string',enum:['forward','backward','left','right']},seconds:{type:'number',minimum:.1,maximum:6},run:{type:'boolean'}},required:['direction','seconds','run'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async(input:unknown)=>{if(!input||typeof input!=='object')throw new Error('Invalid movement.');const p=input as Record<string,unknown>;if(typeof p.direction!=='string'||typeof p.seconds!=='number'||typeof p.run!=='boolean')throw new Error('Invalid direction, duration or run value.');return instance.walk(p.direction as Direction,p.seconds,p.run);}});
    }
   }catch(e){console.error(e);engine.current?.dispose();engine.current=null;if(!cancelled)setError(startupErrorMessage(e));}
  }).catch(e=>{console.error(e);setError('Oyun yüklenemedi. Sayfayı yenileyerek yeniden deneyebilirsin.');});
  return()=>{cancelled=true;unregister?.abort();engine.current?.dispose();engine.current=null;};
 },[]);
 function stick(e:ReactPointerEvent<HTMLDivElement>){
  if(joystickPointer.current!==e.pointerId)return;
  const b=e.currentTarget.getBoundingClientRect();let x=(e.clientX-b.left-b.width/2)/38,y=(e.clientY-b.top-b.height/2)/38;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}
  setKnob({x:x*33,y:y*33});engine.current?.setJoystick(x,-y);
 }
 function endStick(){joystickPointer.current=null;setKnob({x:0,y:0});engine.current?.setJoystick(0,0);}
 async function fullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{/* Fullscreen may be unavailable in an embedded browser. */}}
 return <main className={`game ${started?'is-playing':''}`} aria-label="Arton konağında üçüncü şahıs keşif oyunu">
  <div ref={worldRef} className="world" />
  <LocationMap open={locationsOpen} onOpenChange={toggleLocations}/>
  <div className="cinema-shade"/><div className="top-shade"/>
  <header className="game-header">
  <div className="brand"><Mark/><div><span className="brand-name">ARTON</span></div></div>
   <div className="header-actions">

    {started&&<Button variant="ghost" size="icon" className="icon-btn" title="Kamerayı arkana al" aria-label="Kamerayı arkana al" onClick={()=>engine.current?.resetCamera()}><RotateCcw size={17}/></Button>}
    <Button variant="ghost" size="icon" className="icon-btn" title="Tam ekran" aria-label="Tam ekran" onClick={fullscreen}><Maximize size={17}/></Button>
    {started&&<Button variant="ghost" size="icon" className="icon-btn" title="Duraklat ve kontrolleri göster" aria-label="Duraklat ve kontrolleri göster" onClick={()=>pause(true)}><Pause size={17}/></Button>}
   </div>
  </header>
  {!started&&<>
   <section className="intro"><span className="intro-label">Canımın doğum günü için hazırlanmıştır.</span><h1>Arton<br/><em>Group</em></h1><Button className="start-button" disabled={!ready||!!error} onClick={start}>Gezmeye başla <ArrowUpRight size={19}/></Button></section>
   <footer className="intro-footer"></footer>
  </>}
  {started&&<>
   <output className="location" id="game-status" data-x={snapshot.x} data-plan-y={snapshot.planY} data-height={snapshot.height} data-playing={snapshot.playing}><span className="eyebrow"><MapPin size={12}/>{snapshot.level}</span><strong>{snapshot.zone}</strong><span className="keys"><span className="key-group"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Yürü</span><span className="key-group"><kbd>Shift</kbd> Koş</span><span className="key-group"><Mouse size={14}/> Sürükle · Etrafa bak</span></span></output>
   <div className="mouse-hint">WASD ile yürü · Fareyi sürükleyerek etrafa bak</div>
   <div className="touch-controls"><div className="joystick" aria-label="Hareket çubuğu" onPointerDown={e=>{joystickPointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);stick(e);}} onPointerMove={stick} onPointerUp={endStick} onPointerCancel={endStick}><div className="joystick-knob" style={{transform:`translate(${knob.x}px,${knob.y}px)`}}/></div><button className="touch-run" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);engine.current?.setRunning(true);}} onPointerUp={()=>engine.current?.setRunning(false)} onPointerCancel={()=>engine.current?.setRunning(false)}>Koş</button></div>
  </>}
  <aside className="minimap" style={{visibility:started?'visible':'hidden'}} aria-label="Konağın krokisi ve karakterin konumu"><canvas ref={mapRef}/><span className="minimap-label"><span>KROKİ</span><MoveUpRight size={12}/></span></aside>
  {!ready&&!error&&<div className="loading-overlay" role="status"><Mark/><span>Konak hazırlanıyor</span><span className="loading-line"/></div>}
  {error&&<div className="loading-overlay" role="alert"><p style={{maxWidth:420,padding:24,textAlign:'center',lineHeight:1.7}}>{error}</p><Button onClick={()=>window.location.reload()}>Yeniden dene</Button></div>}
    <Dialog open={paused} onOpenChange={pause}><DialogContent className="pause-dialog" showCloseButton={false}><DialogTitle className="pause-title">Kısa bir mola.</DialogTitle><DialogDescription>Hazır olduğunda kaldığın yerden devam et.</DialogDescription><ul className="control-list"><li><span>Yürü</span><span><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd></span></li><li><span>Koş</span><kbd>Shift</kbd></li><li><span>Etrafa bak</span><span>Fareyi sürükle</span></li><li><span>Kamerayı yakınlaştır</span><span>Fare tekerleği</span></li><li><span>Duraklat</span><kbd>Esc</kbd></li></ul><p className="reference-note">Telefonda sol çubukla yürü, sağ tarafta parmağını sürükleyerek etrafa bak. Bu sürümde dış alanlar ve açık teraslar gezilebilir; iç odalar kapalıdır.</p><div className="pause-actions"><Button onClick={()=>pause(false)}>Keşfe devam et</Button><Button variant="outline" onClick={reset}>Alt terasa dön</Button></div></DialogContent></Dialog>
 </main>;
}
