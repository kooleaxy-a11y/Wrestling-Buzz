/* WRESTLING BUZZ FREE WORLD: game rules shared by the browser and (later) the multiplayer server.
   Pure logic only (no drawing), so the server can run the exact same movement and collision rules. */
(function(root, factory){ if(typeof module==="object" && module.exports) module.exports = factory(); else root.FWCore = factory(); })(this, function(){
"use strict";
var PLAYER_R = 0.5, WALK = 3.6, RUN = 7.2, TURN = 10, ACCEL = 10;
/* x runs east, z runs south. Boxes are centred: {x,z,w (east-west size),d (north-south size)}. */
var WORLD = {
  bounds: {minX:-118, maxX:118, minZ:-118, maxZ:118},
  spawn: {x:0, z:12},
  boxes: [
    {id:"motors",   x:-42, z:-24, w:26, d:18},
    {id:"fashion",  x: 42, z:-24, w:26, d:18},
    {id:"training", x:-42, z: 26, w:26, d:18},
    {id:"hq",       x: 42, z: 26, w:26, d:18},
    {id:"arena",    x:  0, z:-66, w:44, d:30},
    /* plaza benches */
    {id:"bench", x:-16, z:-16, w:1.2, d:3.6}, {id:"bench", x:16, z:-16, w:1.2, d:3.6}, {id:"bench", x:-16, z:16, w:1.2, d:3.6}, {id:"bench", x:16, z:16, w:1.2, d:3.6},
    /* a few houses between the town and the ring road */
    {id:"house", x:-72, z:-40, w:12, d:10}, {id:"house", x:-72, z:38, w:12, d:10}, {id:"house", x:72, z:-36, w:12, d:10}, {id:"house", x:72, z:42, w:12, d:10},
    {id:"house", x:-72, z:64, w:12, d:10}, {id:"house", x:72, z:66, w:12, d:10}, {id:"house", x:-32, z:70, w:12, d:10}, {id:"house", x:34, z:72, w:12, d:10},
    /* parked cars */
    {id:"car", x:17, z:-13, w:4.4, d:2.2}, {id:"car", x:23, z:-13, w:4.4, d:2.2}, {id:"car", x:29, z:-13, w:4.4, d:2.2},
    {id:"car", x:-17, z:13, w:4.4, d:2.2}, {id:"car", x:-23, z:13, w:4.4, d:2.2}, {id:"car", x:-29, z:13, w:4.4, d:2.2}
  ],
  cylinders: [
    {id:"fountain", x:0, z:0, r:8},
    {id:"tower", x:68, z:-62, r:3.2}
  ],
  /* where a player can interact. door = where the entrance is, r = how close you need to be */
  spots: [
    {id:"centre",   name:"BUZZ CITY CENTRE", x:0,   z:-14, r:7,   interact:false},
    {id:"motors",   name:"BUZZ MOTORS",      x:-42, z:-11, r:4.8, interact:true, label:"ENTER BUZZ MOTORS"},
    {id:"fashion",  name:"BUZZ FASHION",     x:42,  z:-11, r:4.8, interact:true, label:"ENTER BUZZ FASHION"},
    {id:"hq",       name:"MY HEADQUARTERS",  x:42,  z:13,  r:4.8, interact:true, label:"VISIT MY HEADQUARTERS"},
    {id:"arena",    name:"BUZZ ARENA",       x:0,   z:-46, r:6.5, interact:true, label:"ENTER BUZZ ARENA"},
    {id:"training", name:"BUZZ TRAINING CENTRE", x:-42, z:13, r:4.8, interact:true, label:"ENTER BUZZ TRAINING CENTRE"}
  ]
};
(function(){ for(var i=0;i<WORLD.boxes.length;i++){ var b = WORLD.boxes[i]; b.x0 = b.x-b.w/2; b.x1 = b.x+b.w/2; b.z0 = b.z-b.d/2; b.z1 = b.z+b.d/2; } })();
/* trees and street lights are solid posts too (positions shared with the renderer) */
WORLD.posts = [];
(function(){ var xs = [-78,-66,-54,-30,-20,20,30,54,66,78];
  xs.forEach(function(x){ WORLD.posts.push({kind:"tree", x:x, z:-9.5, r:0.7}, {kind:"tree", x:x, z:9.5, r:0.7}); });
  [-34,34,56,70].forEach(function(z){ WORLD.posts.push({kind:"tree", x:-9.5, z:z, r:0.7}, {kind:"tree", x:9.5, z:z, r:0.7}); });
  [-18,18,-36,36,-60,60,-76,76].forEach(function(v){ WORLD.posts.push({kind:"lamp", x:v, z:7.5, r:0.35}, {kind:"lamp", x:v, z:-7.5, r:0.35}); });
  [-12,12].forEach(function(v){ WORLD.posts.push({kind:"lamp", x:12, z:v, r:0.35}, {kind:"lamp", x:-12, z:v, r:0.35}); });
  /* the ring road: lamps along its inside edge, trees along its outside edge */
  [-80,-62,-44,-26,26,44,62,80].forEach(function(v){ WORLD.posts.push({kind:"lamp", x:v, z:-92.5, r:0.35}, {kind:"lamp", x:v, z:92.5, r:0.35}, {kind:"lamp", x:-92.5, z:v, r:0.35}, {kind:"lamp", x:92.5, z:v, r:0.35}); });
  for(var t=-112; t<=112; t+=14){ WORLD.posts.push({kind:"tree", x:t, z:-110, r:0.7}, {kind:"tree", x:t, z:110, r:0.7}); if(t>-112 && t<112) WORLD.posts.push({kind:"tree", x:-110, z:t, r:0.7}, {kind:"tree", x:110, z:t, r:0.7}); }
})();
/* drivable surfaces (anywhere else is grass, which slows cars down) */
WORLD.roads = [
  {x0:-106,x1:106,z0:-6,z1:6}, {x0:-6,x1:6,z0:-106,z1:106},                                            /* the two main roads */
  {x0:-106,x1:106,z0:-106,z1:-94}, {x0:-106,x1:106,z0:94,z1:106}, {x0:-106,x1:-94,z0:-106,z1:106}, {x0:94,x1:106,z0:-106,z1:106},   /* the ring road */
  {x0:12,x1:34,z0:-16.25,z1:-9.75}, {x0:-34,x1:-12,z0:9.75,z1:16.25}                                  /* the two parking lots */
];
WORLD.plazaR = 16;
/* approved places where your car can be parked and spawned (rot = direction the car faces) */
WORLD.parking = [
  {name:"Buzz Motors", x:-46, z:-4.2, rot:Math.PI/2}, {name:"Buzz Motors", x:-38, z:-4.2, rot:Math.PI/2},
  {name:"Buzz Fashion", x:46, z:-4.2, rot:Math.PI/2}, {name:"Buzz Fashion", x:38, z:-4.2, rot:Math.PI/2},
  {name:"Buzz Training Centre", x:-46, z:4.2, rot:-Math.PI/2}, {name:"Buzz Training Centre", x:-38, z:4.2, rot:-Math.PI/2},
  {name:"Headquarters", x:46, z:4.2, rot:-Math.PI/2}, {name:"Headquarters", x:38, z:4.2, rot:-Math.PI/2},
  {name:"Buzz Arena", x:4.2, z:-40, rot:Math.PI}, {name:"Buzz Arena", x:-4.2, z:-40, rot:0}
];
function onRoad(x, z){
  if(x*x+z*z < WORLD.plazaR*WORLD.plazaR) return true;
  for(var i=0;i<WORLD.roads.length;i++){ var r = WORLD.roads[i]; if(x>=r.x0 && x<=r.x1 && z>=r.z0 && z<=r.z1) return true; }
  return false;
}
/* ---------- cars (driving rules shared with the server) ---------- */
var CAR_STATS = {   /* speed and handling are 1 to 5 stars, len and wid in metres */
  car_pup:{speed:2,handling:4,len:3.4,wid:1.8}, car_rookie:{speed:3,handling:3,len:4.3,wid:1.9}, car_van:{speed:2,handling:2,len:4.6,wid:2.0}, car_main:{speed:4,handling:4,len:4.3,wid:1.9},
  car_heavy:{speed:3,handling:2,len:5.0,wid:2.0}, car_suv:{speed:3,handling:3,len:4.7,wid:2.0}, car_gt:{speed:5,handling:5,len:4.5,wid:1.95}, car_limo:{speed:2,handling:1,len:7.2,wid:1.95}
};
function carSpec(id){ var c = CAR_STATS[id]; if(!c) return null; return {id:id, max:12+c.speed*3.4, accel:6+c.speed*1.4, brake:20, rev:7, turn:1.1+c.handling*0.22, len:c.len, wid:c.wid, r:c.wid/2+0.05}; }
function createCar(x, z, rot){ return {x:x, z:z, rot:rot||0, vx:0, vz:0, speed:0, steer:0, hit:false}; }
function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
function angDiff(a,b){ var d = b-a; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; return d; }
function pushCircleOutOfBox(p, b, r){
  var cx = clamp(p.x,b.x0,b.x1), cz = clamp(p.z,b.z0,b.z1), dx = p.x-cx, dz = p.z-cz, d2 = dx*dx+dz*dz;
  if(d2 >= r*r) return;
  if(d2 > 1e-9){ var d = Math.sqrt(d2), k = (r-d)/d; p.x += dx*k; p.z += dz*k; return; }
  var l = p.x-b.x0, rr = b.x1-p.x, t = p.z-b.z0, bt = b.z1-p.z, m = Math.min(l,rr,t,bt);
  if(m===l) p.x = b.x0-r; else if(m===rr) p.x = b.x1+r; else if(m===t) p.z = b.z0-r; else p.z = b.z1+r;
}
function pushCircleOutOfCircle(p, c, r){
  var dx = p.x-c.x, dz = p.z-c.z, d = Math.sqrt(dx*dx+dz*dz), min = r+c.r; if(d >= min) return;
  if(d < 1e-6){ p.x = c.x+min; return; } var k = min/d; p.x = c.x+dx*k; p.z = c.z+dz*k;
}
/* keeps a position inside the map and out of solid things */
function resolve(p, r){
  r = r || PLAYER_R;
  for(var pass=0; pass<2; pass++){
    for(var i=0;i<WORLD.boxes.length;i++) pushCircleOutOfBox(p, WORLD.boxes[i], r);
    for(var j=0;j<WORLD.cylinders.length;j++) pushCircleOutOfCircle(p, WORLD.cylinders[j], r);
    for(var k=0;k<WORLD.posts.length;k++) pushCircleOutOfCircle(p, WORLD.posts[k], r);
  }
  var bd = WORLD.bounds; p.x = clamp(p.x, bd.minX+r, bd.maxX-r); p.z = clamp(p.z, bd.minZ+r, bd.maxZ-r);
  return p;
}
function createState(x, z){ return {x:x==null?WORLD.spawn.x:x, z:z==null?WORLD.spawn.z:z, rot:Math.PI, vx:0, vz:0, speed:0, running:false}; }
/* one movement step. input = {dx,dz,run}: the direction the player wants to go in the world (length 0 to 1) */
function step(s, input, dt){
  dt = clamp(dt, 0, 0.05);
  var dx = input.dx||0, dz = input.dz||0, mag = Math.sqrt(dx*dx+dz*dz), max = input.run ? RUN : WALK, tvx = 0, tvz = 0;
  if(mag > 0.05){ var m = Math.min(mag,1); tvx = dx/mag*max*m; tvz = dz/mag*max*m; }
  var k = Math.min(1, dt*ACCEL); s.vx += (tvx-s.vx)*k; s.vz += (tvz-s.vz)*k;
  var ox = s.x, oz = s.z; s.x += s.vx*dt; s.z += s.vz*dt; resolve(s);
  s.speed = dt>0 ? Math.sqrt((s.x-ox)*(s.x-ox)+(s.z-oz)*(s.z-oz))/dt : 0;
  s.running = !!input.run && s.speed > WALK*1.1;
  if(mag > 0.05){ var tr = Math.atan2(dx, dz), d = angDiff(s.rot, tr), mx = TURN*dt; s.rot += clamp(d, -mx, mx); }
  return s;
}
function nearestSpot(x, z){ var best = null, bd = 1e9; WORLD.spots.forEach(function(sp){ var d = Math.sqrt((sp.x-x)*(sp.x-x)+(sp.z-z)*(sp.z-z)); if(d < sp.r && d < bd){ bd = d; best = sp; } }); return best; }
/* one driving step. input = {thr:-1..1 (gas positive), steer:-1..1 (right positive), hb:handbrake} */
function stepCar(c, inp, dt, sp){
  dt = clamp(dt, 0, 0.05);
  var thr = clamp(inp.thr||0, -1, 1), st = clamp(inp.steer||0, -1, 1), hb = !!inp.hb, fx = Math.sin(c.rot), fz = Math.cos(c.rot);
  var along = c.vx*fx + c.vz*fz, lx = c.vx - along*fx, lz = c.vz - along*fz, surf = onRoad(c.x, c.z) ? 1 : 0.55, max = sp.max*surf;
  c.steer += (st - c.steer) * Math.min(1, dt*9);
  if(thr > 0.01){ if(along < -0.5) along += sp.brake*dt; else if(along < max) along += sp.accel*thr*dt*(1 - Math.max(0, along)/(max*1.05)); }
  else if(thr < -0.01){ if(along > 0.5) along -= sp.brake*(-thr)*dt; else along = Math.max(-sp.rev*surf, along - sp.accel*0.8*(-thr)*dt); }
  else { var dr = (2.2 + along*along*0.006)*dt; along = Math.abs(along) <= dr ? 0 : along - (along>0?1:-1)*dr; }
  if(along > max) along -= (along-max) * Math.min(1, dt*3);
  if(hb){ var hd = 16*dt; along = Math.abs(along) <= hd ? 0 : along - (along>0?1:-1)*hd; }
  var av = Math.abs(along), fall = 1/(1 + 0.6*(av/sp.max)*(av/sp.max));
  c.rot -= c.steer * sp.turn * Math.min(1, av/4) * fall * (along >= 0 ? 1 : -1) * (hb ? 1.5 : 1) * dt;
  var nfx = Math.sin(c.rot), nfz = Math.cos(c.rot), k = Math.exp(-(hb ? 1.6 : 9)*dt); lx *= k; lz *= k;
  c.vx = nfx*along + lx; c.vz = nfz*along + lz; c.x += c.vx*dt; c.z += c.vz*dt;
  /* collisions: two circles, one at each end of the car */
  var off = Math.max(0, sp.len/2 - sp.r), push = 0;
  for(var pass=0; pass<2; pass++) for(var e=-1; e<=1; e+=2){
    var q = {x:c.x + nfx*off*e, z:c.z + nfz*off*e}, ox = q.x, oz = q.z; resolve(q, sp.r);
    var ddx = q.x-ox, ddz = q.z-oz; if(ddx !== 0 || ddz !== 0){ c.x += ddx; c.z += ddz; push += Math.sqrt(ddx*ddx+ddz*ddz); }
  }
  c.hit = push > 0.02; if(c.hit){ var kk = Math.pow(0.04, dt); c.vx *= kk; c.vz *= kk; }
  c.speed = c.vx*nfx + c.vz*nfz; return c;
}
return {WORLD:WORLD, onRoad:onRoad, carSpec:carSpec, CAR_STATS:CAR_STATS, createCar:createCar, stepCar:stepCar, PLAYER_R:PLAYER_R, WALK:WALK, RUN:RUN, step:step, resolve:resolve, createState:createState, nearestSpot:nearestSpot, angDiff:angDiff};
});
