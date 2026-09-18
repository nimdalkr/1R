import {rotate,number,clone} from './planner-model.mjs';import {safeView} from './layouts.mjs';
export function cameraPreset(doc,preset,current={}){
 const v=safeView(current),w=doc.room.w,d=doc.room.d,placed=doc.objects.filter(o=>o.placed!==false);
 if(preset==='top')return {...v,mode:'2d',projection:'orthographic'};
 if(preset==='orbit')return{...v,mode:'3d',projection:'orthographic',theta:-.55,phi:.72,target:[w/2,35,d/2],scale:Math.max(w,d)*1.65};
 if(preset==='entry'){
  const door=placed.find(o=>o.type==='door');if(!door)throw Error('현관문을 먼저 배치하세요.');
  const edges=[{dist:Math.abs(door.x),dx:1,dz:0},{dist:Math.abs(w-door.x),dx:-1,dz:0},{dist:Math.abs(door.z),dx:0,dz:1},{dist:Math.abs(d-door.z),dx:0,dz:-1}].sort((a,b)=>a.dist-b.dist),n=edges[0];
  const eye=[door.x+n.dx*25,Math.min(150,doc.room.h-15),door.z+n.dz*25];return{...v,mode:'3d',projection:'perspective',eye,target:[eye[0]+n.dx*300,eye[1]-18,eye[2]+n.dz*300],cut:false};
 }
 if(preset==='bed'){
  const bed=placed.find(o=>o.type==='bed');if(!bed)throw Error('침대를 먼저 배치하세요.');const head=rotate(0,-bed.d*.32,bed.r),direction=rotate(0,1,bed.r),y=bed.e+bed.h+35;const eye=[bed.x+head.x,Math.min(y,doc.room.h-10),bed.z+head.z];return {...v,mode:'3d',projection:'perspective',eye,target:[eye[0]+direction.x*300,eye[1]-15,eye[2]+direction.z*300],cut:false};
 }
 throw Error('지원하지 않는 시점입니다.');
}
export function lookAround(view,dx,dy){const v=clone(view);if(v.projection==='perspective'){const x=v.target[0]-v.eye[0],y=v.target[1]-v.eye[1],z=v.target[2]-v.eye[2],distance=Math.hypot(x,y,z)||300;let yaw=Math.atan2(x,z)-dx*.005,pitch=Math.asin(y/distance)+dy*.004;pitch=Math.max(-1.35,Math.min(1.35,pitch));v.target=[v.eye[0]+Math.sin(yaw)*Math.cos(pitch)*distance,v.eye[1]+Math.sin(pitch)*distance,v.eye[2]+Math.cos(yaw)*Math.cos(pitch)*distance];}else{v.theta-=dx*.006;v.phi=Math.max(.05,Math.min(1.48,v.phi+dy*.005));}return v;}
