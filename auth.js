"use strict";
/* Checks a player's Supabase sign-in token. The token is never trusted from the browser: we ask Supabase who it belongs to.
   Set SUPABASE_URL and SUPABASE_KEY (the same public "anon" key your website already uses) as environment variables.
   Without them everybody simply joins as a guest. */
var URL_ = (process.env.SUPABASE_URL || "").replace(/\/+$/, ""), KEY = process.env.SUPABASE_KEY || "";
function enabled(){ return !!(URL_ && KEY); }
async function verify(token){
  if(!enabled() || typeof token !== "string" || token.length < 20 || token.length > 4000) return null;
  var ctl = new AbortController(), timer = setTimeout(function(){ ctl.abort(); }, 4000);
  try{
    var r = await fetch(URL_ + "/auth/v1/user", {headers: {apikey: KEY, Authorization: "Bearer " + token}, signal: ctl.signal});
    if(!r.ok) return null;
    var u = await r.json(); return (u && typeof u.id === "string" && u.id) ? {uid: u.id} : null;
  }catch(e){ return null; }
  finally{ clearTimeout(timer); }
}
/* The player's saved outfit, read with THEIR token (so the database decides what they own). Returns {top:"top_red", ...} or {}. */
var LOOK_KEYS = ["top","jacket","trousers","shoes","cap"];
async function fetchMe(token){
  if(!enabled() || typeof token !== "string" || !token) return null;
  var ctl = new AbortController(), timer = setTimeout(function(){ ctl.abort(); }, 4000);
  try{
    var r = await fetch(URL_ + "/rest/v1/rpc/fw_me", {method: "POST", headers: {apikey: KEY, Authorization: "Bearer " + token, "Content-Type": "application/json"}, body: "{}", signal: ctl.signal});
    if(!r.ok) return null;
    var j = await r.json(), look = {}, l = j && j.look;
    if(l && typeof l === "object") LOOK_KEYS.forEach(function(k){ if(typeof l[k] === "string" && /^[a-z_]{1,20}$/.test(l[k])) look[k] = l[k]; });
    var owned = Array.isArray(j && j.owned) ? j.owned.filter(function(x){ return typeof x === "string" && /^[a-z_]{1,20}$/.test(x); }) : [];
    var car = j && typeof j.active_car === "string" && /^[a-z_]{1,20}$/.test(j.active_car) ? j.active_car : null;
    return {look: look, owned: owned, car: car};
  }catch(e){ return null; }
  finally{ clearTimeout(timer); }
}
async function fetchLook(token){
  if(!enabled() || typeof token !== "string" || !token) return {};
  var ctl = new AbortController(), timer = setTimeout(function(){ ctl.abort(); }, 4000);
  try{
    var r = await fetch(URL_ + "/rest/v1/rpc/fw_me", {method: "POST", headers: {apikey: KEY, Authorization: "Bearer " + token, "Content-Type": "application/json"}, body: "{}", signal: ctl.signal});
    if(!r.ok) return null;
    var j = await r.json(), out = {}, l = j && j.look;
    if(l && typeof l === "object") LOOK_KEYS.forEach(function(k){ if(typeof l[k] === "string" && /^[a-z_]{1,20}$/.test(l[k])) out[k] = l[k]; });
    return out;
  }catch(e){ return null; }
  finally{ clearTimeout(timer); }
}
/* Free World is for signed-in accounts only. Set REQUIRE_LOGIN=0 to allow guests (local testing). */
function requireLogin(){ return process.env.REQUIRE_LOGIN !== "0"; }
module.exports = {verify: verify, fetchLook: fetchLook, fetchMe: fetchMe, enabled: enabled, requireLogin: requireLogin};
