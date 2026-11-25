/* Background music upgrades for Wrestling Buzz:
   - lock-screen / notification controls (Media Session), so music keeps playing when the visitor leaves for another app
   - a skip button, and the next song is pre-loaded so tracks flow without gaps
   Tracks are managed in Admin > Music library (upload mp3, switch on/off, delete). */
(function(){
"use strict";
if(typeof setNowPlaying!=="function" || typeof musLoadTrack!=="function") return;
var ms = navigator.mediaSession || null, warm = null;
function icon(){ var l = document.querySelector('link[rel="apple-touch-icon"]') || document.querySelector('link[rel="icon"]'); return l ? l.href : ""; }
function meta(title, credit){
  if(!ms || typeof MediaMetadata==="undefined") return;
  try{ var art = icon(); ms.metadata = new MediaMetadata({title:title, artist:credit||"Wrestling Buzz", album:"Wrestling Buzz", artwork: art ? [{src:art, sizes:"192x192", type:"image/png"},{src:art, sizes:"512x512", type:"image/png"}] : []}); }catch(e){}
}
function preload(){
  try{ if(musMode!=="playlist" || musTracks.length<2) return; var n = musTracks[(musIdx+1)%musTracks.length]; if(!warm) warm = new Audio(); warm.preload = "auto"; warm.muted = true; warm.src = trackUrl(n.path); }catch(e){}
}
var _np = setNowPlaying;
window.setNowPlaying = function(t){ _np(t); meta(t.title, t.credit); preload(); };
function skip(d){
  if(musMode!=="playlist" || !musTracks.length) return;
  musIdx = (musIdx + d + musTracks.length) % musTracks.length;
  if(musAudio){ musLoadTrack(); if(mOn){ var q = musAudio.play(); if(q && q.catch) q.catch(function(){}); } }
  else setNowPlaying(musTracks[musIdx]);
}
window.musSkip = skip;
if(ms){
  var set = function(a, f){ try{ ms.setActionHandler(a, f); }catch(e){} };
  set("play", function(){ store(MUS_KEY,"0"); if(!mOn) musOn(); });
  set("pause", function(){ store(MUS_KEY,"1"); if(mOn) musOff(); });
  set("nexttrack", function(){ skip(1); });
  set("previoustrack", function(){ skip(-1); });
  var _ui = musSetUI;
  window.musSetUI = function(on){ _ui(on); try{ ms.playbackState = on ? "playing" : "paused"; }catch(e){} if(on && musMode!=="playlist") meta("Wrestling Buzz theme", "Wrestling Buzz"); };
}
/* skip button next to the Music button (only useful when tracks were uploaded) */
var b = document.createElement("button"); b.type = "button"; b.id = "mus-next"; b.className = "mus"; b.setAttribute("aria-label","Next song"); b.textContent = "\u23ED"; b.hidden = true;
b.style.cssText = "right:auto;left:14px;padding:10px 14px;font-size:18px";
b.addEventListener("click", function(){ skip(1); if(!mOn){ store(MUS_KEY,"0"); musOn(); } });
document.body.appendChild(b);
setInterval(function(){ b.hidden = !(musMode==="playlist" && musTracks.length>1); }, 1500);
})();
