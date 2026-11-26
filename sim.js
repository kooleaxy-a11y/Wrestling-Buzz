/* Free World server rules: validates what each client says about its own movement.
   Uses the exact same fw-core.js collision and speed rules as the browser. Pure logic, no networking. */
"use strict";
var C = require("./fw-core.js");

var MAX_SPEED = C.RUN * 1.3;   /* a little above run speed so lag and frame jitter never punish honest players */
var SLACK = 0.75;              /* metres of free movement on top of the speed limit */
var MIN_GAP_MS = 30;           /* ignore moves that arrive faster than ~33 per second */
var MAX_GAP_S = 1.5;           /* after a long silence, at most this much travel is allowed */
var LOOKS = 8;

function num(v){ return (typeof v === "number" && isFinite(v)) ? v : null; }
function cleanName(n){
  n = String(n == null ? "" : n).replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 20);
  return n || "Manager";
}
/* two players never share a name: the second "Bob" becomes "Bob 2" */
function uniqueName(name, taken){
  var low = taken.map(function(t){ return t.toLowerCase(); }), n = name, i = 1;
  while(low.indexOf(n.toLowerCase()) >= 0){ i++; var suf = " " + i; n = name.slice(0, 20 - suf.length) + suf; }
  return n;
}
function createPlayer(id, name, look, now, startX, startZ, uid){
  var p = {id: id, name: cleanName(name), look: look % LOOKS, t: now, lastMsg: now, strikes: 0, dirty: false, waveAt: 0, uid: uid || null, verified: !!uid};
  var s = C.createState(num(startX), num(startZ)); C.resolve(s);
  p.x = s.x; p.z = s.z; p.rot = Math.PI; p.run = false;
  return p;
}
/* m = {x, z, rot, run}. Returns "ok", "ignore" (dropped quietly), "reject" (too far, too fast) or "fix" (was inside a wall, pushed out) */
function applyMove(p, m, now){
  p.lastMsg = now;
  if(!m || typeof m !== "object") return "ignore";
  var x = num(m.x), z = num(m.z), rot = num(m.rot);
  if(x === null || z === null) return "ignore";
  var gap = now - p.t; if(gap < MIN_GAP_MS) return "ignore";
  var dt = Math.min(gap / 1000, MAX_GAP_S);
  var dist = Math.sqrt((x - p.x) * (x - p.x) + (z - p.z) * (z - p.z));
  if(dist > MAX_SPEED * dt + SLACK){ p.strikes++; return "reject"; }   /* p.t is not advanced, so the allowance keeps growing with real time */
  var q = {x: x, z: z}; C.resolve(q);
  var fixed = Math.sqrt((q.x - x) * (q.x - x) + (q.z - z) * (q.z - z)) > 0.25;
  var run = !!m.run, r = rot === null ? p.rot : rot;
  if(Math.abs(q.x - p.x) > 0.004 || Math.abs(q.z - p.z) > 0.004 || Math.abs(C.angDiff(p.rot, r)) > 0.02 || run !== p.run) p.dirty = true;
  p.x = q.x; p.z = q.z; p.rot = r; p.run = run; p.t = now;
  if(p.strikes > 0) p.strikes = Math.max(0, p.strikes - 0.25);
  return fixed ? "fix" : "ok";
}
function r2(v){ return Math.round(v * 100) / 100; }
function snapRow(p){ return [p.id, r2(p.x), r2(p.z), r2(p.rot), p.run ? 1 : 0]; }
function fullRow(p){ return [p.id, p.name, p.look, r2(p.x), r2(p.z), r2(p.rot), p.verified ? 1 : 0]; }

module.exports = {applyMove: applyMove, createPlayer: createPlayer, cleanName: cleanName, uniqueName: uniqueName, snapRow: snapRow, fullRow: fullRow, MAX_SPEED: MAX_SPEED, LOOKS: LOOKS};
