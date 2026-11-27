"use strict";
var colyseus = require("colyseus");
var sim = require("./sim.js"), auth = require("./auth.js");

var MAX_PLAYERS = Number(process.env.FW_MAX_PLAYERS) || 15, TICK_MS = 100, IDLE_MS = 45000, KICK_STRIKES = 40, CODE_IDLE = 4001, CODE_CHEAT = 4002, CODE_ELSEWHERE = 4003;

/* One shared city. Players send where they are (about 15 times a second); the server checks it against the
   shared rules and tells everyone else (10 times a second). No schema state, only small messages. */
class FreeWorldRoom extends colyseus.Room {
  onCreate(){
    this.maxClients = MAX_PLAYERS;
    this.players = new Map();   /* sessionId -> player */
    this.nextId = 1; this.nextLook = 0;
    this.setPatchRate(null);    /* we do not use synced state */
    this.setSimulationInterval(this.tick.bind(this), TICK_MS);
    this.onMessage("move", (client, m) => {
      var p = this.players.get(client.sessionId); if(!p) return;
      var res = sim.applyMove(p, m, Date.now());
      if(res === "reject" || res === "fix") client.send("fix", {x: Math.round(p.x * 100) / 100, z: Math.round(p.z * 100) / 100});
      if(p.strikes >= KICK_STRIKES) client.leave(CODE_CHEAT);
    });
    this.onMessage("hello", (client) => {
      var p = this.players.get(client.sessionId); if(!p) return;
      var all = []; this.players.forEach(function(q){ all.push(sim.fullRow(q)); });
      client.send("welcome", {id: p.id, x: Math.round(p.x * 100) / 100, z: Math.round(p.z * 100) / 100, players: all});
    });
    /* the player changed clothes: ask the database what they now wear (never trust the browser) and tell everyone else */
    this.onMessage("look", async (client) => {
      var p = this.players.get(client.sessionId), now = Date.now(); if(!p || !p.token || now - p.lookAt < 2000) return;
      p.lookAt = now; var o = await auth.fetchLook(p.token); if(!o || !this.players.has(client.sessionId)) return;
      p.outfit = o; this.broadcast("look", [p.id, o], {except: client});
    });
    /* cars: spawn in an approved bay, get in, get out, put it away. The database says which car you own. */
    this.onMessage("car", async (client, m) => {
      var p = this.players.get(client.sessionId), now = Date.now(); if(!p || !m || typeof m !== "object" || now - p.carAt < 400) return; p.carAt = now;
      var res;
      if(m.op === "spawn"){
        if(!p.token) return client.send("carno", "login");
        var me = await auth.fetchMe(p.token); if(!me) return client.send("carno", "slow"); if(!this.players.has(client.sessionId)) return;
        if(!me.car || me.owned.indexOf(me.car) < 0) return client.send("carno", "nocar");
        res = sim.trySpawn(p, Array.from(this.players.values()), m.bay, me.car);
      } else if(m.op === "in") res = sim.tryEnter(p, now);
      else if(m.op === "out") res = sim.tryExit(p);
      else if(m.op === "remove"){ if(p.car && !p.car.d){ p.car = null; res = "ok"; } else res = "bad"; }
      else return;
      if(res !== "ok") return client.send("carno", res);
      this.broadcast("car", sim.carRow(p));
    });
    this.onMessage("wave", (client) => {
      var p = this.players.get(client.sessionId), now = Date.now(); if(!p || now - p.waveAt < 1000) return;
      p.waveAt = now; this.broadcast("wave", p.id, {except: client});
    });
  }
  /* a valid Supabase token makes the player a verified account holder; without one they are turned away (unless REQUIRE_LOGIN=0, then guest) */
  async onAuth(client, options){
    var tk = options && options.token, a = await auth.verify(tk); if(!a && auth.requireLogin()) throw new Error("login_required");
    return {uid: a ? a.uid : null, token: a ? tk : null, outfit: a ? ((await auth.fetchLook(tk)) || {}) : {}};
  }
  onJoin(client, options, authData){
    options = options || {}; var uid = authData && authData.uid || null, self = this, names = [];
    if(uid) this.players.forEach(function(q, sid){ if(q.uid === uid){ var old = self.clients.find(function(c){ return c.sessionId === sid; }); if(old) old.leave(CODE_ELSEWHERE); } });   /* one session per account */
    this.players.forEach(function(q){ if(q.uid !== uid || !uid) names.push(q.name); });
    var p = sim.createPlayer(this.nextId++, options.name, this.nextLook++, Date.now(), options.x, options.z, uid, authData && authData.outfit);
    p.token = authData && authData.token || null;
    p.name = sim.uniqueName(p.name, names);
    this.players.set(client.sessionId, p);
    this.broadcast("join", sim.fullRow(p), {except: client});
  }
  onLeave(client){
    var p = this.players.get(client.sessionId); if(!p) return;
    this.players.delete(client.sessionId); this.broadcast("leave", p.id);
  }
  tick(){
    var now = Date.now(), rows = [], self = this;
    this.players.forEach(function(p, sid){
      if(now - p.lastMsg > IDLE_MS){ var c = self.clients.find(function(x){ return x.sessionId === sid; }); if(c) c.leave(CODE_IDLE); return; }
      if(p.dirty){ p.dirty = false; rows.push(sim.snapRow(p)); }
    });
    if(rows.length) this.broadcast("snap", rows);
  }
}
module.exports = {FreeWorldRoom: FreeWorldRoom, MAX_PLAYERS: MAX_PLAYERS};
