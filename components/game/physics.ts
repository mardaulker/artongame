import {OUTSIDE_LIMIT} from './entrance';
export type Collider = {minX:number;maxX:number;minZ:number;maxZ:number;bottom:number;top:number};
export type Surface = {minX:number;maxX:number;minZ:number;maxZ:number;height:number;endHeight?:number;axis?:'x'|'z';reverse?:boolean};
export type Player = {x:number;y:number;z:number;vy:number;angle:number};
export const RADIUS=.27;
export const PLAYER_HEIGHT=1.78;
export const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
export function surfaceHeight(s:Surface,x:number,z:number) {
  if(s.endHeight===undefined) return s.height;
  let t=s.axis==='x'?(x-s.minX)/(s.maxX-s.minX):(z-s.minZ)/(s.maxZ-s.minZ);
  if(s.reverse)t=1-t;
  return s.height+(s.endHeight-s.height)*clamp(t,0,1);
}
export function supportAt(surfaces:Surface[],x:number,z:number,limit:number) {
  let best=0;
  for(const s of surfaces)if(x>=s.minX-.03&&x<=s.maxX+.03&&z>=s.minZ-.03&&z<=s.maxZ+.03){
    const h=surfaceHeight(s,x,z); if(h<=limit+.001&&h>best)best=h;
  }
  return best;
}
export function solveHorizontal(x:number,z:number,y:number,colliders:Collider[]) {
  for(let pass=0;pass<3;pass++)for(const c of colliders){
    if(y>=c.top-.34 || y+PLAYER_HEIGHT<=c.bottom+.03)continue;
    const cx=clamp(x,c.minX,c.maxX),cz=clamp(z,c.minZ,c.maxZ),dx=x-cx,dz=z-cz;
    const d2=dx*dx+dz*dz;
    if(d2>=RADIUS*RADIUS)continue;
    if(d2>1e-10){const factor=(RADIUS-Math.sqrt(d2))/Math.sqrt(d2);x+=dx*factor;z+=dz*factor;}
    else {
      const distances=[x-c.minX,c.maxX-x,z-c.minZ,c.maxZ-z];const m=Math.min(...distances);
      if(m===distances[0])x=c.minX-RADIUS;else if(m===distances[1])x=c.maxX+RADIUS;
      else if(m===distances[2])z=c.minZ-RADIUS;else z=c.maxZ+RADIUS;
    }
  }
  return {x,z};
}
export function movePlayer(p:Player,dx:number,dz:number,dt:number,surfaces:Surface[],colliders:Collider[]){
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));
  let foot=supportAt(surfaces,p.x,p.z,p.y+.34);
  for(let i=0;i<steps;i++){
    const nx=p.x+dx/steps,nz=p.z+dz/steps;
    const ground=supportAt(surfaces,nx,nz,p.y+.34);
    const elevated=ground>p.y && ground-p.y<=.34;
    const resolved=solveHorizontal(nx,nz,elevated?ground:p.y,colliders);
    p.x=resolved.x;p.z=resolved.z;
    foot=supportAt(surfaces,p.x,p.z,p.y+.34);
    if(foot>p.y&&foot-p.y<=.34){p.y=foot;p.vy=0;}
  }
  p.vy-=22*dt;p.y+=p.vy*dt;
  if(p.y<=foot){p.y=foot;p.vy=0;}
  p.x=clamp(p.x,-16.5,10.8);p.z=clamp(p.z,-105,OUTSIDE_LIMIT);
}
