"use client";
import {useState} from 'react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {LOCATION_LIST} from './locations';
export function LocationMap({open,onOpenChange}:{open:boolean;onOpenChange:(open:boolean)=>void}){
 const [selected,setSelected]=useState('GATE-01');
 const current=LOCATION_LIST.find(item=>item.id===selected)!;
 const px=(x:number)=>145+x*5,py=(p:number)=>570-p*4.6;
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent style={{maxWidth:900,width:'calc(100vw - 24px)',maxHeight:'90dvh',overflowY:'auto',background:'#20382f',color:'#f5ead7'}}>
 <DialogTitle>Konum kodları</DialogTitle><DialogDescription style={{color:'#d3c7ae'}}>Bir alan seç; AI’a tarif ederken kodunu ve adını kullan. Noktalar yaklaşık referans konumlarıdır.</DialogDescription>
 <div style={{display:'flex',flexWrap:'wrap',gap:20}}>
 <svg viewBox="0 0 310 640" role="img" aria-label="Giriş aşağıda, arka avlu yukarıda: konak haritası" style={{width:260,maxWidth:'100%',height:440,background:'#172b24',borderRadius:8}}>
 <rect x={px(-18)} y={py(106)} width={145} height={487.6} fill="none" stroke="#bcab89"/>
 <rect x={px(-5)} y={py(88)} width={75} height={211.6} fill="#776e59"/>
 <rect x={px(-14.5)} y={py(78)} width={47.5} height={49.91} fill="#8c8066"/>
 <line x1={px(0)} x2={px(0)} y1={py(0)} y2={py(38)} stroke="#8c8066" strokeWidth="15"/>
 {LOCATION_LIST.map((item,i)=><g key={item.id} onClick={()=>setSelected(item.id)} style={{cursor:'pointer'}}><title>{item.id} — {item.name}</title><circle cx={px(item.x)} cy={py(item.planY)} r={item.id===selected?7:4} fill={item.id===selected?'#ffd17e':'#e1cfab'} stroke="#172b24"/><text x={px(item.x)+6} y={py(item.planY)-5} fill="#fff" fontSize="12">{i+1}</text></g>)}
 <text x="145" y="627" textAnchor="middle" fill="#e1cfab" fontSize="14">ANA KAPI / DIŞ TARAF</text></svg>
 <div style={{flex:'1 1 270px',minWidth:0}}><label htmlFor="location-picker">Yapı veya alan</label><select id="location-picker" value={selected} onChange={e=>setSelected(e.target.value)} style={{width:'100%',padding:10,margin:'8px 0 16px',background:'#172b24',color:'#fff',fontSize:16}}>{LOCATION_LIST.map((item,i)=><option key={item.id} value={item.id}>{i+1}. {item.id} — {item.name}</option>)}</select>
 <h3 style={{fontSize:20}}>{current.id} · {current.name}</h3><p style={{margin:'12px 0',lineHeight:1.6}}>{current.description}</p>
 <p style={{fontSize:14}}>Yükseklik: {current.height} m · x: {current.x} · planY: {current.planY}</p>
 <p style={{fontSize:14,marginTop:12}}>Kaynak: components/game/{current.source}</p>
 <p style={{marginTop:20}}>Örnek: “{current.id} — {current.name} bölümünü ekteki fotoğrafa göre düzenle.”</p>
 </div></div></DialogContent></Dialog>;
}
