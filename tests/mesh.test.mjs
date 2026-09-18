import test from 'node:test';import assert from 'node:assert/strict';
import {DEFINITIONS,makeObject,newDocument} from '../shared/planner-model.mjs';
import {Builder,model,scene,clipNear} from '../assets/mesh.js';
import {safeView} from '../shared/layouts.mjs';
for(const type of Object.keys(DEFINITIONS))test('mesh finite and dimension-bounded: '+type,()=>{
 const o=makeObject(type),b=new Builder();b.set(o,1);model(b,o);
 assert.ok(b.p.length>0);assert.equal(b.n.length,b.p.length);assert.equal(b.c.length,b.p.length);assert.equal(b.ids.length,b.p.length);
 assert.ok(b.p.every(Number.isFinite));for(let i=0;i<b.p.length;i+=3){assert.ok(Math.abs(b.p[i])<=o.w/2+.02,`${type} x ${b.p[i]}`);assert.ok(b.p[i+1]>=o.e-.02&&b.p[i+1]<=o.e+o.h+.02,`${type} y ${b.p[i+1]}`);assert.ok(Math.abs(b.p[i+2])<=o.d/2+.02,`${type} z ${b.p[i+2]}`);}
});
test('cutaway and camera rebuild never change saved coordinates',()=>{const d=newDocument();d.objects=[makeObject('window',{x:400,z:180,r:90}),makeObject('door',{x:190,z:550}),makeObject('box',{placed:false}),makeObject('bath',{x:300,z:450})];const old=JSON.stringify(d);const mesh=scene(d,safeView(),true);assert.equal(mesh.ids.size,3);assert.equal(JSON.stringify(d),old);assert.ok(mesh.b.p.every(Number.isFinite));});
test('perspective near-plane clipping discards behind-camera faces',()=>{assert.deepEqual(clipNear([[1,1,-3,-1],[2,1,-3,-1],[2,2,-3,-1]]),[]);const points=clipNear([[-1,0,-3,1],[1,0,0,2],[0,1,0,2]]);assert.ok(points.length>=3);assert.ok(points.every(p=>p[3]>.0009&&p[2]+p[3]>-1e-8));});
