/* Runs without installing anything: node test.js  (colyseus is stubbed, only our own rules are tested) */
"use strict";
var assert = require("assert"), Module = require("module");
var origLoad = Module._load;
Module._load = function(req){ if(req === "colyseus") return {Room: class Room { constructor(){ this.clients = []; this.sent = []; } setPatchRate(){} setSimulationInterval(f){ this.sim = f; } onMessage(t, f){ (this.h = this.h || {})[t] = f; } broadcast(t, m, o){ this.sent.push([t, m, o]); } }}; return origLoad.apply(this, arguments); };
var C = require("./fw-core.js"), sim = require("./sim.js"), room = require("./room.js");

/* 1. an honest client (60 fps prediction, sends every 66 ms, runs around the plaza) is never rejected */
var p = sim.createPlayer(1, "Test", 0, 0), me = C.createState(p.x, p.z), t = 0, last = 0, bad = 0, sent = 0;
for(var f = 0; f < 60 * 40; f++){ t += 1000 / 60; var a = f / 60 * 0.6; C.step(me, {dx: Math.cos(a), dz: Math.sin(a), run: f % 600 < 300}, 1 / 60);
  if(t - last >= 66){ last = t; var r = sim.applyMove(p, {x: me.x, z: me.z, rot: me.rot, run: me.running}, t); sent++; if(r !== "ok") bad++; } }
assert.strictEqual(bad, 0, "honest client was rejected " + bad + " of " + sent);
/* 1b. honest client that walks into a building while the server resolves the same way */
var w = sim.createPlayer(2, "Walker", 0, 0), me2 = C.createState(w.x, w.z); t = 0; last = 0; bad = 0;
for(f = 0; f < 60 * 20; f++){ t += 1000 / 60; C.step(me2, {dx: 1, dz: -0.2, run: true}, 1 / 60); if(t - last >= 66){ last = t; if(sim.applyMove(w, {x: me2.x, z: me2.z, rot: me2.rot, run: true}, t) !== "ok") bad++; } }
assert.strictEqual(bad, 0, "walking into walls caused rejects");
/* 2. teleport is rejected and position stays */
var c = sim.createPlayer(3, "Cheat", 0, 0), x0 = c.x, z0 = c.z;
assert.strictEqual(sim.applyMove(c, {x: x0 + 60, z: z0, rot: 0, run: 1}, 100), "reject"); assert.strictEqual(c.x, x0);
/* 3. speed hack (3x run speed) is capped over time */
var h = sim.createPlayer(4, "Hax", 0, 0), hx = h.x, rejects = 0; t = 0;
for(f = 0; f < 150; f++){ t += 66; hx += C.RUN * 3 * 0.066; if(hx > 80) hx = -80; if(sim.applyMove(h, {x: hx, z: h.z, rot: 0, run: 1}, t) === "reject") rejects++; }
assert.ok(rejects > 80, "speed hack mostly passed: " + rejects + " rejects");
/* 4. inside a building gets pushed out; junk is ignored */
var b = sim.createPlayer(5, "Wall", 0, 0); b.x = -42; b.z = -9; b.t = 0;   /* just outside the motors building (z -15..-33 is inside) */
var rr = sim.applyMove(b, {x: -42, z: -14.2, rot: 0, run: 0}, 100); var inside = C.WORLD.boxes[0]; assert.ok(b.z > inside.z1 - 1e-6, "pushed out of building");
assert.strictEqual(sim.applyMove(b, {x: "a", z: NaN}, 500), "ignore"); assert.strictEqual(sim.applyMove(b, null, 600), "ignore");
assert.strictEqual(sim.cleanName("  <b>Hi</b>\n  there  "), "bHi/b there"); assert.strictEqual(sim.cleanName(""), "Manager"); assert.strictEqual(sim.cleanName("x".repeat(40)).length, 20);
/* 5. the room: join, welcome, snap, wave, leave, idle kick */
var R = new room.FreeWorldRoom(); R.onCreate();
function client(id){ return {sessionId: id, msgs: [], send: function(t, m){ this.msgs.push([t, m]); }, leave: function(c){ this.left = c; }}; }
var c1 = client("a"), c2 = client("b"); R.clients.push(c1, c2);
R.onJoin(c1, {name: "One", x: 5, z: 12}); R.onJoin(c2, {name: "Two"});
R.h.hello(c1); R.h.hello(c2); var wl = c1.msgs.filter(function(m){ return m[0] === "welcome"; })[0]; assert.ok(wl && wl[1].x === 5, "welcome keeps the start position"); assert.strictEqual(c2.msgs.filter(function(m){ return m[0] === "welcome"; })[0][1].players.length, 2);
assert.ok(R.sent.some(function(s){ return s[0] === "join" && s[1][1] === "Two"; }));
R.sent.length = 0; var now = Date.now(); var orig = Date.now; Date.now = function(){ return now + 200; };
R.h.move(c1, {x: 6, z: 12, rot: 1, run: 0}); R.sim(); var snap = R.sent.filter(function(s){ return s[0] === "snap"; })[0]; assert.ok(snap && snap[1].length === 1 && snap[1][0][0] === 1, "snap has only the mover");
R.sent.length = 0; R.sim(); assert.strictEqual(R.sent.length, 0, "no snap when nobody moved");
R.h.wave(c1); assert.ok(R.sent.some(function(s){ return s[0] === "wave" && s[1] === 1; })); R.sent.length = 0; R.h.wave(c1); assert.strictEqual(R.sent.length, 0, "wave rate limited");
Date.now = function(){ return now + 400; }; R.h.move(c1, {x: 90, z: 12, rot: 1, run: 0}); assert.ok(c1.msgs.some(function(m){ return m[0] === "fix"; }), "cheater corrected");
Date.now = function(){ return now + 60000; }; R.sim(); assert.strictEqual(c2.left, 4001, "idle player is kicked"); Date.now = orig;
R.onLeave(c1); assert.ok(R.sent.some(function(s){ return s[0] === "leave" && s[1] === 1; }));
/* 6. accounts: verified flag, one session per account, unique names */
var R2 = new room.FreeWorldRoom(); R2.onCreate(); var k1 = client("k1"), k2 = client("k2"), k3 = client("k3"), k4 = client("k4"); R2.clients.push(k1, k2, k3, k4);
R2.onJoin(k1, {name: "Bob"}, {uid: "u1"}); R2.onJoin(k2, {name: "Bob"}, {uid: null}); R2.onJoin(k3, {name: "bob"}, {uid: null});
var rows = []; R2.players.forEach(function(q){ rows.push(sim.fullRow(q)); });
assert.deepStrictEqual(rows.map(function(r){ return r[1]; }), ["Bob", "Bob 2", "bob 3"]); assert.deepStrictEqual(rows.map(function(r){ return r[6]; }), [1, 0, 0]);
R2.onJoin(k4, {name: "Bob"}, {uid: "u1"}); assert.strictEqual(k1.left, 4003, "same account elsewhere is kicked"); assert.strictEqual(k4.left, undefined);
var auth = require("./auth.js"); assert.strictEqual(auth.enabled(), false); auth.verify("x".repeat(50)).then(function(v){ assert.strictEqual(v, null); console.log("all server tests passed"); });
