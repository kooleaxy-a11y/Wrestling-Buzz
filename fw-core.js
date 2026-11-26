/* WRESTLING BUZZ FREE WORLD: game rules shared by the browser and (later) the multiplayer server.
   Pure logic only (no drawing), so the server can run the exact same movement and collision rules. */
(function(root, factory){ if(typeof module==="object" && module.exports) module.exports = factory(); else root.FWCore = factory(); })(this, function(){
"use strict";
var PLAYER_R = 0.5, WALK = 3.6, RUN = 7.2, TURN = 10, ACCEL = 10;
/* x runs east, z runs south. Boxes are centred: {x,z,w (east-west size),d (north-south size)}. */
var WORLD = {
  bounds: {minX:-86, maxX:86, minZ:-86, maxZ:86},
  spawn: {x:0, z:12},
  boxes: [
    {id:"motors",   x:-42, z:-24, w:26, d:18},
    {id:"fashion",  x: 42, z:-24, w:26, d:18},
    {id:"training", x:-42, z: 26, w:26, d:18},
    {id:"hq",       x: 42, z: 26, w:26, d:18},
    {id:"arena",    x:  0, z:-66, w:44, d:30},
    /* plaza benches */
    {id:"bench", x:-9, z:0, w:1.2, d:3.6}, {id:"bench", x:9, z:0, w:1.2, d:3.6}, {id:"bench", x:0, z:-9, w:3.6, d:1.2}, {id:"bench", x:0, z:9, w:3.6, d:1.2},
    /* parked cars */
    {id:"car", x:17, z:-13, w:4.4, d:2.2}, {id:"car", x:23, z:-13, w:4.4, d:2.2}, {id:"car", x:29, z:-13, w:4.4, d:2.2},
    {id:"car", x:-17, z:13, w:4.4, d:2.2}, {id:"car", x:-23, z:13, w:4.4, d:2.2}, {id:"car", x:-29, z:13, w:4.4, d:2.2}
  ],
  cylinders: [
    {id:"fountain", x:0, z:0, r:3.4},
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
  [-70,-56,-34,34,56,70].forEach(function(z){ WORLD.posts.push({kind:"tree", x:-9.5, z:z, r:0.7}, {kind:"tree", x:9.5, z:z, r:0.7}); });
  [-18,18,-36,36,-60,60,-76,76].forEach(function(v){ WORLD.posts.push({kind:"lamp", x:v, z:7.5, r:0.35}, {kind:"lamp", x:v, z:-7.5, r:0.35}); });
  [-12,12].forEach(function(v){ WORLD.posts.push({kind:"lamp", x:7.5, z:v, r:0.35}, {kind:"lamp", x:-7.5, z:v, r:0.35}); });
})();
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
return {WORLD:WORLD, PLAYER_R:PLAYER_R, WALK:WALK, RUN:RUN, step:step, resolve:resolve, createState:createState, nearestSpot:nearestSpot, angDiff:angDiff};
});
