/* 1R v1.3 — visual plan details and selected-object dimensions. */
'use strict';
(()=>{
 const main=document.querySelector('#c'),workspace=document.querySelector('.workspace');if(!main||!workspace)return;
 const overlay=document.createElement('canvas');overlay.className='canvas-overlay';workspace.append(overlay);const g=overlay.getContext('2d');
 const mode=document.createElement('div');mode.className='canvas-mode';mode.textContent='평면 · 가구 이동';workspace.append(mode);
 let map={scale:1,panX:0,panY:0},cam={a:-.65,e:.8},view='2d',measure=true,drag3d=null;
 const dpr=()=>Math.max(1,devicePixelRatio||1),rad=n=>n*Math.PI/180;
 function resize(){const r=workspace.getBoundingClientRect(),p=dpr();overlay.width=Math.round(r.width*p);overlay.height=Math.round(r.height*p);overlay.style.width=r.width+'px';overlay.style.height=r.height+'px';g.setTransform(p,0,0,p,0,0);draw();}
 function fitMap(){const s=window.OneR?.getState?.();if(!s)return;const W=main.clientWidth,H=main.clientHeight;map.scale=Math.max(.08,Math.min((W-70)/s.room.w,(H-100)/s.room.d));map.panX=(W-s.room.w*map.scale)/2;map.panY=(H-s.room.d*map.scale)/2;draw();}
 const xy=(x,z)=>({x:map.panX+x*map.scale,y:map.panY+z*map.scale});
 function local(o,lx,lz){const a=rad(o.r||0),c=Math.cos(a),s=Math.sin(a);return{x:o.x+lx*c-lz*s,z:o.z+lx*s+lz*c};}
 function line(points,style='#596657',width=1.5,dash=[]){g.save();g.strokeStyle=style;g.lineWidth=width;g.setLineDash(dash);g.beginPath();points.forEach((p,i)=>{const q=xy(p.x,p.z);i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y)});g.stroke();g.restore();}
 function roundedLabel(x,y,text){g.save();g.font='600 11px system-ui';const w=g.measureText(text).width+12,h=21;g.fillStyle='#fffffff2';g.strokeStyle='#d9dfd5';g.lineWidth=1;roundRect(x-w/2,y-h/2,w,h,7);g.fill();g.stroke();g.fillStyle='#30382f';g.textAlign='center';g.textBaseline='middle';g.fillText(text,x,y+.5);g.restore();}
 function roundRect(x,y,w,h,r){const rr=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+rr,y);g.arcTo(x+w,y,x+w,y+h,rr);g.arcTo(x+w,y+h,x,y+h,rr);g.arcTo(x,y+h,x,y,rr);g.arcTo(x,y,x+w,y,rr);g.closePath();}
 function drawSymbol(o){
  const c=xy(o.x,o.z),s=map.scale,a=rad(o.r||0);g.save();g.translate(c.x,c.y);g.rotate(a);g.strokeStyle='#4b554a';g.fillStyle='#ffffff72';g.lineWidth=Math.max(1,Math.min(2,s*1.4));const w=o.w*s,d=o.d*s;
  if(o.type==='bed'){
   g.strokeRect(-w/2+3,-d/2+3,w-6,d-6);g.beginPath();g.moveTo(-w/2+4,-d/2+d*.28);g.lineTo(w/2-4,-d/2+d*.28);g.stroke();
   const pw=w*.34,ph=Math.min(d*.18,26);g.strokeRect(-w*.4,-d*.43,pw,ph);g.strokeRect(w*.06,-d*.43,pw,ph);
  }else if(['desk','table'].includes(o.type)){
   g.strokeRect(-w/2+3,-d/2+3,w-6,d-6);g.fillStyle='#4b554a';[[.42,.38],[-.42,.38],[.42,-.38],[-.42,-.38]].forEach(([x,z])=>{g.beginPath();g.arc(x*w,z*d,2.2,0,Math.PI*2);g.fill();});
  }else if(o.type==='ldesk'){
   g.beginPath();g.moveTo(-w/2+3,-d/2+3);g.lineTo(w/2-3,-d/2+3);g.lineTo(w/2-3,d/2-3);g.lineTo(w*.18,d/2-3);g.lineTo(w*.18,-d*.05);g.lineTo(-w/2+3,-d*.05);g.closePath();g.stroke();
  }else if(o.type==='chair'){
   g.beginPath();g.ellipse(0,d*.08,w*.32,d*.3,0,0,Math.PI*2);g.stroke();g.beginPath();g.moveTo(-w*.28,-d*.27);g.quadraticCurveTo(0,-d*.48,w*.28,-d*.27);g.stroke();
  }else if(o.type==='sofa'){
   g.strokeRect(-w/2+3,-d/2+3,w-6,d-6);g.beginPath();g.moveTo(-w/2+5,-d*.2);g.lineTo(w/2-5,-d*.2);g.moveTo(0,-d*.2);g.lineTo(0,d/2-5);g.stroke();
  }else if(o.type==='standby'){
   g.beginPath();g.arc(0,d*.2,Math.max(5,Math.min(w,d)*s*.22),0,Math.PI*2);g.stroke();g.beginPath();g.moveTo(0,d*.15);g.lineTo(0,-d*.12);g.stroke();g.strokeRect(-w*.4,-d*.4,w*.8,d*.2);g.beginPath();g.moveTo(0,-d*.42);g.lineTo(0,-d*.72);g.stroke();g.beginPath();g.moveTo(0,-d*.72);g.lineTo(-5,-d*.62);g.moveTo(0,-d*.72);g.lineTo(5,-d*.62);g.stroke();
  }else if(['wardrobe','bookshelf','shelf','drawers'].includes(o.type)){
   g.strokeRect(-w/2+3,-d/2+3,w-6,d-6);const n=o.type==='bookshelf'?4:3;for(let i=1;i<n;i++){g.beginPath();g.moveTo(-w/2+4,-d/2+d*i/n);g.lineTo(w/2-4,-d/2+d*i/n);g.stroke();}
  }else if(o.type==='rack'){
   g.beginPath();g.moveTo(-w*.42,-d*.3);g.lineTo(-w*.42,d*.35);g.moveTo(w*.42,-d*.3);g.lineTo(w*.42,d*.35);g.moveTo(-w*.42,-d*.27);g.lineTo(w*.42,-d*.27);g.stroke();for(let i=-3;i<=3;i++){g.beginPath();g.moveTo(i*w*.11,-d*.26);g.lineTo(i*w*.11,d*.18);g.stroke();}
  }else if(o.type==='door'){
   g.beginPath();g.moveTo(-w/2,0);g.lineTo(w/2,0);g.stroke();g.beginPath();g.arc(-w/2,0,w,0,-Math.PI/2,true);g.strokeStyle='#879283';g.stroke();
  }else if(o.type==='window'){
   g.strokeStyle='#6b9ba3';g.beginPath();g.moveTo(-w/2,0);g.lineTo(w/2,0);g.moveTo(-w/2,4);g.lineTo(w/2,4);g.stroke();
  }else if(o.type==='rug'){
   g.setLineDash([5,4]);g.strokeStyle='#9b9f95';g.strokeRect(-w/2+2,-d/2+2,w-4,d-4);
  }else if(o.type==='monitor'){
   g.strokeRect(-w*.42,-d*.25,w*.84,d*.5);g.beginPath();g.moveTo(0,d*.25);g.lineTo(0,d*.45);g.stroke();
  }else if(o.type==='box'){
   g.strokeRect(-w/2+2,-d/2+2,w-4,d-4);g.beginPath();g.moveTo(-w/2+2,-d/2+2);g.lineTo(w/2-2,d/2-2);g.moveTo(w/2-2,-d/2+2);g.lineTo(-w/2+2,d/2-2);g.stroke();
  }
  if(['fixed'].includes(o.ownership)){g.fillStyle='#394438';g.font='9px system-ui';g.textAlign='center';g.fillText('LOCK',0,3);}
  g.restore();
 }
 function dimension(o){if(!measure||!o)return;const off=14/map.scale;
  const wa=local(o,-o.w/2,-o.d/2-off),wb=local(o,o.w/2,-o.d/2-off),da=local(o,o.w/2+off,-o.d/2),db=local(o,o.w/2+off,o.d/2);
  line([wa,wb],'#496342',1);line([da,db],'#496342',1);[wa,wb,da,db].forEach(p=>{const q=xy(p.x,p.z);g.fillStyle='#496342';g.beginPath();g.arc(q.x,q.y,2.3,0,Math.PI*2);g.fill();});
  let a=xy((wa.x+wb.x)/2,(wa.z+wb.z)/2),b=xy((da.x+db.x)/2,(da.z+db.z)/2);roundedLabel(a.x,a.y,`${Math.round(o.w)} cm`);roundedLabel(b.x,b.y,`${Math.round(o.d)} cm`);
 }
 function selectedOutline(o){if(!o)return;const pts=[local(o,-o.w/2,-o.d/2),local(o,o.w/2,-o.d/2),local(o,o.w/2,o.d/2),local(o,-o.w/2,o.d/2),local(o,-o.w/2,-o.d/2)];line(pts,'#3f5e37',2.4);dimension(o);}
 function iso(x,z,y,state){let ca=Math.cos(cam.a),sa=Math.sin(cam.a),X=x-state.room.w/2,Z=z-state.room.d/2,rx=X*ca-Z*sa,rz=X*sa+Z*ca,s=map.scale*.9;return{x:main.clientWidth/2+map.panX*.12+rx*s,y:main.clientHeight*.62+map.panY*.08+(rz*Math.sin(cam.e)-y*Math.cos(cam.e))*s*.62};}
 function projectLocal(o,lx,lz,y,state){const p=local(o,lx,lz);return iso(p.x,p.z,y,state)}
 function draw3dDetail(o,state){if(!o)return;const y=o.h+1;g.save();g.strokeStyle='#334433';g.lineWidth=1.35;
  if(o.type==='bed'){
   const z=-o.d*.32;[[-.32,-.05],[.05,.32]].forEach(([a,b])=>{const pts=[[a*o.w,z-o.d*.1],[b*o.w,z-o.d*.1],[b*o.w,z+o.d*.1],[a*o.w,z+o.d*.1],[a*o.w,z-o.d*.1]].map(([x,zz])=>projectLocal(o,x,zz,y,state));g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke();});
  }else if(['desk','ldesk'].includes(o.type)){
   const pts=[[-o.w*.18,-o.d*.05],[o.w*.18,-o.d*.05],[o.w*.18,o.d*.12],[-o.w*.18,o.d*.12],[-o.w*.18,-o.d*.05]].map(([x,z])=>projectLocal(o,x,z,y,state));g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke();
  }else if(o.type==='sofa'){
   const a=projectLocal(o,0,-o.d*.35,y,state),b=projectLocal(o,0,o.d*.35,y,state);g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();
  }
  g.restore();
 }
 function draw(){g.clearRect(0,0,overlay.clientWidth,overlay.clientHeight);const state=window.OneR?.getState?.(),selected=window.OneR?.getSelected?.();if(!state)return;
  if(view==='2d'){state.objects.forEach(drawSymbol);selectedOutline(selected);}else{draw3dDetail(selected,state);if(selected){const q=iso(selected.x,selected.z,selected.h+12,state);roundedLabel(q.x,q.y,`${selected.name} · ${Math.round(selected.w)}×${Math.round(selected.d)} cm`);}}
 }
 document.querySelector('#measureToggle')?.addEventListener('click',e=>{measure=!measure;e.currentTarget.classList.toggle('measure-active',measure);e.currentTarget.setAttribute('aria-pressed',String(measure));draw();});
 document.querySelector('#fit')?.addEventListener('click',()=>requestAnimationFrame(fitMap));
 document.querySelector('#v2')?.addEventListener('click',()=>{view='2d';mode.textContent='평면 · 가구 이동';requestAnimationFrame(fitMap);});
 document.querySelector('#v3')?.addEventListener('click',()=>{view='3d';mode.textContent='3D · 시점 회전';draw();});
 main.addEventListener('wheel',e=>{map.scale*=Math.exp(-e.deltaY*.001);map.scale=Math.max(.3,Math.min(3,map.scale));requestAnimationFrame(draw)},{passive:true});
 main.addEventListener('pointerdown',e=>{if(view==='3d')drag3d={x:e.clientX,y:e.clientY,a:cam.a,e:cam.e};});
 main.addEventListener('pointermove',e=>{if(view==='3d'&&drag3d){cam.a=drag3d.a+(e.clientX-drag3d.x)*.008;cam.e=Math.max(.25,Math.min(1.25,drag3d.e+(e.clientY-drag3d.y)*.006));}requestAnimationFrame(draw);});
 main.addEventListener('pointerup',()=>{drag3d=null;requestAnimationFrame(draw)});main.addEventListener('pointercancel',()=>drag3d=null);
 addEventListener('1r:change',()=>{const state=window.OneR?.getState?.();if(state&&!Number.isFinite(map.panX))fitMap();requestAnimationFrame(draw);});
 const ro=new ResizeObserver(()=>resize());ro.observe(workspace);
 requestAnimationFrame(()=>{resize();fitMap();});
})();
