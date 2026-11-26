/* WRESTLING BUZZ FREE WORLD, Phase 1: the 3D city, your manager, camera, controls and collisions.
   Needs three.min.js (r128) and fw-core.js, both loaded on demand when a player enters Free World. */
(function(){
"use strict";
var VERSION = "phase-1", GFX_KEY = "wb_fw_gfx", T = null, C = null, A = null;   /* T = THREE, C = FWCore, A = active session */
function h(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text!==undefined) e.textContent = text; return e; }
function isTouch(){ return window.matchMedia && matchMedia("(pointer:coarse)").matches; }
function loadScript(src){ return new Promise(function(ok, no){ var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = function(){ no(new Error("load "+src)); }; document.head.appendChild(s); }); }

/* ---------- styles ---------- */
var css = "body.fwlock{overflow:hidden}#fw-root{position:fixed;inset:0;height:100dvh;z-index:8500;background:#0b0b0d;color:#fff;font-family:inherit;touch-action:none;user-select:none;-webkit-user-select:none}#fw-root>canvas.fwgl{display:block;width:100%;height:100%}"+
".fwhud *{box-sizing:border-box}.fwcard{position:absolute;left:10px;top:calc(10px + env(safe-area-inset-top,0px));display:flex;gap:8px;align-items:center;background:rgba(10,10,14,.72);border:1px solid #E01B32;border-radius:14px;padding:7px 10px;backdrop-filter:blur(4px)}"+
".fwav{flex:none;width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#E01B32,#7a0b19);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px}.fwcard b{display:block;font-size:14px;max-width:118px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fwcard small{display:block;color:#EDBA3E;font-weight:700;font-size:12px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"+
".fwtr{position:absolute;right:10px;top:calc(10px + env(safe-area-inset-top,0px));display:flex;gap:6px}.fwtr .fwbtn{padding:9px 0;width:44px;font-size:18px;text-align:center}.fwbtn{border:1px solid #4a4a55;background:rgba(10,10,14,.72);color:#fff;border-radius:12px;padding:10px 13px;font:inherit;font-weight:700;cursor:pointer;touch-action:manipulation}.fwbtn.red{background:#E01B32;border-color:#E01B32}.fwbtn[disabled]{opacity:.45;cursor:default}"+
"#fw-joy{position:absolute;left:18px;bottom:calc(26px + env(safe-area-inset-bottom,0px));width:132px;height:132px;border-radius:50%;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.28);touch-action:none}#fw-knob{position:absolute;left:41px;top:41px;width:50px;height:50px;border-radius:50%;background:rgba(224,27,50,.85);border:2px solid #fff;pointer-events:none}"+
".fwbr{position:absolute;right:14px;bottom:calc(26px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:10px;align-items:flex-end}.fwbr .fwbtn{min-width:96px;min-height:46px;font-size:15px}.fwbtn.on{background:#EDBA3E;color:#241600;border-color:#EDBA3E}"+
"#fw-prompt{position:absolute;left:50%;bottom:calc(215px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);display:none;white-space:nowrap;font-size:17px;padding:13px 22px;border-radius:14px;background:#E01B32;border:2px solid #fff}#fw-where{pointer-events:none;position:absolute;left:50%;top:calc(64px + env(safe-area-inset-top,0px));transform:translateX(-50%);padding:6px 14px;border-radius:99px;background:rgba(10,10,14,.7);font-weight:800;letter-spacing:.06em;font-size:13px;color:#EDBA3E;opacity:0;transition:opacity .4s}"+
"#fw-load{position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,#4a0d17,#0b0b0d 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;z-index:5;text-align:center;padding:20px}#fw-load h2{margin:0;font-size:34px;letter-spacing:.06em;color:#EDBA3E}#fw-load h2 b{color:#fff}.fwbar{width:min(260px,70vw);height:8px;border-radius:5px;background:#26202b;overflow:hidden}.fwbar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#E01B32,#EDBA3E);transition:width .25s}"+
".fwpanel{position:absolute;inset:0;background:rgba(0,0,0,.72);z-index:4;display:flex;align-items:center;justify-content:center;padding:14px}.fwbox{width:min(380px,100%);background:#101014;border:2px solid #E01B32;border-radius:16px;padding:16px;max-height:90dvh;overflow:auto}.fwbox h3{margin:0 0 10px;color:#EDBA3E}.fwbox p{color:#d8cfbd;font-size:14px;margin:8px 0}.fwbox .fwbtn{display:block;width:100%;margin:8px 0}.fwbox select{width:100%;padding:10px;border-radius:8px;background:#08080a;color:#fff;border:1px solid #4a4a55;font:inherit}"+
"#fw-map{position:absolute;right:10px;top:calc(66px + env(safe-area-inset-top,0px));width:168px;height:168px;border-radius:12px;border:2px solid #E01B32;background:rgba(10,10,14,.82);display:none}.fwerr{color:#ff7a88;font-weight:700}";
var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

/* ---------- 3D helpers (low-poly, shared materials to keep it light) ---------- */
var mats = {};
function M(c){ if(!mats[c]) mats[c] = new T.MeshLambertMaterial({color:c, flatShading:true}); return mats[c]; }
function MB(c){ var k = "b"+c; if(!mats[k]) mats[k] = new T.MeshBasicMaterial({color:c}); return mats[k]; }
function box(g, w, hh, d, mat, x, y, z){ var m = new T.Mesh(new T.BoxGeometry(w,hh,d), mat); m.position.set(x,y,z); g.add(m); return m; }
function cyl(g, rt, rb, hh, seg, mat, x, y, z){ var m = new T.Mesh(new T.CylinderGeometry(rt,rb,hh,seg), mat); m.position.set(x,y,z); g.add(m); return m; }
function textTex(text, w, hh, bg, fg, sub){
  var c = document.createElement("canvas"); c.width = w; c.height = hh; var x = c.getContext("2d"); x.fillStyle = bg; x.fillRect(0,0,w,hh);
  x.strokeStyle = "#EDBA3E"; x.lineWidth = 8; x.strokeRect(6,6,w-12,hh-12); x.fillStyle = fg; x.textAlign = "center"; x.textBaseline = "middle";
  var size = Math.floor(hh*(sub?0.42:0.5)); do{ x.font = "900 "+size+"px Impact, 'Arial Black', sans-serif"; size -= 4; }while(x.measureText(text).width > w-40 && size > 16);
  x.fillText(text, w/2, sub ? hh*0.4 : hh/2); if(sub){ x.font = "700 "+Math.floor(hh*0.18)+"px Arial, sans-serif"; x.fillStyle = "#EDBA3E"; x.fillText(sub, w/2, hh*0.78); }
  var t = new T.CanvasTexture(c); t.anisotropy = 2; return t;
}
function sign(g, text, sub, w, hh, x, y, z, rotY, bg){ var m = new T.Mesh(new T.PlaneGeometry(w,hh), new T.MeshBasicMaterial({map:textTex(text, 512, Math.round(512*hh/w), bg||"#101014", "#ffffff", sub)})); m.position.set(x,y,z); m.rotation.y = rotY||0; g.add(m); return m; }
function label(text, scale){
  var c = document.createElement("canvas"); c.width = 512; c.height = 96; var x = c.getContext("2d"); x.font = "800 52px Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
  var tw = Math.min(480, x.measureText(text).width+36); x.fillStyle = "rgba(10,10,14,.78)"; x.fillRect(256-tw/2, 10, tw, 76); x.strokeStyle = "#E01B32"; x.lineWidth = 4; x.strokeRect(256-tw/2, 10, tw, 76);
  x.fillStyle = "#fff"; x.fillText(text, 256, 49, 460);
  var s = new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c), transparent:true, depthWrite:false})); s.scale.set(scale||3.4, (scale||3.4)*96/512, 1); return s;
}
function carMesh(color){
  var g = new T.Group(); box(g,4.2,0.8,2,M(color),0,0.75,0); box(g,2.2,0.75,1.8,M(0x1d2a38),-0.2,1.5,0); box(g,0.15,0.5,1.5,MB(0xfff3b0),2.12,0.85,0);
  [[1.3,0.45,1],[1.3,0.45,-1],[-1.3,0.45,1],[-1.3,0.45,-1]].forEach(function(p){ var w = cyl(g,0.45,0.45,0.35,10,M(0x15151a),p[0],p[1],p[2]); w.rotation.x = Math.PI/2; });
  return g;
}

/* ---------- Buzz City ---------- */
function buildCity(scene){
  var W = C.WORLD, g = new T.Group(); scene.add(g);
  var ground = new T.Mesh(new T.PlaneGeometry(520,520), M(0x4cae6c)); ground.rotation.x = -Math.PI/2; g.add(ground);
  var road = M(0x2b2d33), side = M(0xc9ccd3);
  box(g,172,0.1,12,road,0,0.05,0); box(g,12,0.1,172,road,0,0.05,0);
  [-7.5,7.5].forEach(function(z){ box(g,172,0.16,3,side,0,0.08,z); }); [-7.5,7.5].forEach(function(x){ box(g,3,0.16,172,side,x,0.08,0); });
  for(var i=-80;i<=80;i+=8){ if(Math.abs(i)<14) continue; box(g,3,0.02,0.3,MB(0xffffff),i,0.11,0); box(g,0.3,0.02,3,MB(0xffffff),0,0.11,i); }
  var plaza = new T.Mesh(new T.CircleGeometry(16,40), M(0xdcd5c6)); plaza.rotation.x = -Math.PI/2; plaza.position.y = 0.2; g.add(plaza);
  var ring = new T.Mesh(new T.RingGeometry(10,10.7,40), MB(0xE01B32)); ring.rotation.x = -Math.PI/2; ring.position.y = 0.22; g.add(ring);
  var ring2 = new T.Mesh(new T.RingGeometry(15.2,16,40), MB(0xEDBA3E)); ring2.rotation.x = -Math.PI/2; ring2.position.y = 0.22; g.add(ring2);
  /* fountain */
  cyl(g,3.4,3.6,0.9,18,M(0xb9c3cf),0,0.65,0); cyl(g,2.9,2.9,0.2,18,MB(0x4fc3f7),0,1.15,0); cyl(g,0.4,0.5,2.6,8,M(0xb9c3cf),0,2.2,0);
  var top = new T.Mesh(new T.SphereGeometry(0.7,8,6), MB(0x9be3ff)); top.position.set(0,3.7,0); g.add(top);
  var cl = label("BUZZ CITY CENTRE", 7); cl.position.set(0,7,0); g.add(cl);
  /* benches */
  W.boxes.filter(function(b){ return b.id==="bench"; }).forEach(function(b){ var long = b.d > b.w;
    box(g, b.w, 0.35, b.d, M(0x8a5a2b), b.x, 0.6, b.z); box(g, long?0.3:b.w, 0.9, long?b.d:0.3, M(0x6e4520), b.x+(long?(b.x<0?-0.5:0.5):0), 1.1, b.z+(long?0:(b.z<0?-0.5:0.5)));
    box(g, long?1:b.w, 0.4, long?b.d:1, M(0x333333), b.x, 0.2, b.z); });
  /* parked cars + lots */
  box(g,22,0.06,6.5,M(0x3a3d45),23,0.12,-13); box(g,22,0.06,6.5,M(0x3a3d45),-23,0.12,13);
  var cc = [0xE01B32,0xf2f2f2,0x2f6fdb,0xEDBA3E,0x222222,0x27ae60]; W.boxes.filter(function(b){ return b.id==="car"; }).forEach(function(b,i){ var c = carMesh(cc[i%cc.length]); c.position.set(b.x,0.12,b.z); g.add(c); });
  /* buildings */
  function building(o){
    var f = o.face, fz = o.z + f*o.d/2, bg = new T.Group(); g.add(bg);
    box(bg,o.w,o.h,o.d,M(o.color),o.x,o.h/2,o.z); box(bg,o.w+1,0.7,o.d+1,M(o.roof),o.x,o.h+0.35,o.z);
    box(bg,4.4,5.2,0.5,M(0x15151a),o.x,2.6,fz+f*0.1); box(bg,3.6,0.25,0.6,MB(0xEDBA3E),o.x,5.35,fz+f*0.2);
    [-1,1].forEach(function(s){ box(bg,5.5,3,0.3,MB(0x9fd8ff),o.x+s*8,4.2,fz+f*0.1); box(bg,5.5,3,0.3,MB(0x9fd8ff),o.x+s*8,4.2+(o.h>8?4:0),fz+f*0.1); });
    box(bg,9,0.35,2.8,M(o.accent),o.x,6.3,fz+f*1.4);
    sign(bg,o.sign,o.sub,16,3.6,o.x,o.h+2.4,fz+f*0.8,f<0?Math.PI:0,o.signBg);
    return bg;
  }
  building({x:-42,z:-24,w:26,d:18,h:8,face:1,color:0xd9363e,roof:0x7a0b19,accent:0xf2f2f2,sign:"BUZZ MOTORS",sub:"CARS FOR MANAGERS",signBg:"#7a0b19"});
  building({x:42,z:-24,w:26,d:18,h:8,face:1,color:0xeeeef4,roof:0x9a9aa8,accent:0xE01B32,sign:"BUZZ FASHION",sub:"LOOK LIKE A CHAMPION",signBg:"#101014"});
  building({x:-42,z:26,w:26,d:18,h:9,face:-1,color:0x2c2f3a,roof:0x15151a,accent:0xE01B32,sign:"BUZZ TRAINING",sub:"CENTRE",signBg:"#101014"});
  /* headquarters: your plot, fenced, with a starter building and construction cones */
  var hq = new T.Group(); g.add(hq); box(hq,16,6,10,M(0xe0b43a),42,3,29); box(hq,17,0.6,11,M(0x7a5a10),42,6.3,29); box(hq,3.6,4.4,0.5,M(0x15151a),42,2.2,23.9);
  [-1,1].forEach(function(s){ box(hq,4.5,2.6,0.3,MB(0x9fd8ff),42+s*5.2,3.6,23.9); });
  sign(hq,"MY HQ","LEVEL 1  |  YOUR COMPANY",12,3,42,8.6,23.6,Math.PI,"#7a5a10");
  var fm = M(0x8a8a95); [[42,17.2,26,0.4],[42,34.8,26,0.4]].forEach(function(p){ box(hq,p[2],1.2,p[3],fm,p[0],0.7,p[1]); }); [[29.2,26,0.4,18],[54.8,26,0.4,18]].forEach(function(p){ box(hq,p[2],1.2,p[3],fm,p[0],0.7,p[1]); });
  [[32,19],[52,19],[32,33],[52,33]].forEach(function(p){ cyl(hq,0.1,0.55,1.3,8,M(0xff7a1a),p[0],0.75,p[1]); });
  /* arena */
  var ar = new T.Group(); g.add(ar); box(ar,44,12,30,M(0x1b1b22),0,6,-66); var dome = cyl(ar,20,22,5,28,M(0x2a2a34),0,14.5,-66); dome.scale.z = 0.72;
  box(ar,40,0.7,0.7,MB(0xE01B32),0,8,-50.6); box(ar,40,0.7,0.7,MB(0xEDBA3E),0,10,-50.6); box(ar,6,6,0.6,M(0x15151a),0,3,-50.7); box(ar,5,0.3,0.7,MB(0xEDBA3E),0,6.2,-50.6);
  [-1,1].forEach(function(s){ [0,1,2].forEach(function(i){ box(ar,3,3,0.3,MB(0x9fd8ff),s*(9+i*5.4),4.5,-50.6); }); });
  sign(ar,"BUZZ ARENA","LIVE WRESTLING",24,5.6,0,18.5,-50.8,0,"#7a0b19");
  [-20,20].forEach(function(x){ cyl(ar,0.5,0.5,17,8,M(0xEDBA3E),x,8.5,-50.2); var b = new T.Mesh(new T.SphereGeometry(0.9,8,6), MB(0xfff3b0)); b.position.set(x,17.4,-50.2); ar.add(b); });
  /* landmark tower */
  cyl(g,2.2,3.2,22,8,M(0xc9ccd3),68,11,-62); cyl(g,2.6,2.6,3,8,M(0xE01B32),68,23,-62); var gb = new T.Mesh(new T.SphereGeometry(2,10,8), MB(0xEDBA3E)); gb.position.set(68,26.5,-62); g.add(gb);
  var tl = label("BUZZ TOWER", 6); tl.position.set(68,31,-62); g.add(tl);
  /* trees and street lights (same spots as the collision posts) */
  var trunkG = new T.CylinderGeometry(0.25,0.32,2.2,6), leafG = new T.ConeGeometry(1.7,3.4,7), greens = [0x2e9c55,0x39b062,0x278a4b];
  W.posts.forEach(function(p,i){
    if(p.kind==="tree"){ var t = new T.Mesh(trunkG, M(0x6b4423)); t.position.set(p.x,1.1,p.z); g.add(t); var l = new T.Mesh(leafG, M(greens[i%3])); l.position.set(p.x,3.7,p.z); g.add(l); var l2 = new T.Mesh(leafG, M(greens[(i+1)%3])); l2.scale.set(0.75,0.75,0.75); l2.position.set(p.x,5.3,p.z); g.add(l2); }
    else { cyl(g,0.12,0.16,5.2,6,M(0x3a3a44),p.x,2.6,p.z); var b = new T.Mesh(new T.SphereGeometry(0.4,8,6), MB(0xfff3b0)); b.position.set(p.x,5.5,p.z); g.add(b); }
  });
  /* border hedge */
  var hm = M(0x2a7a44), b = W.bounds; box(g,180,2.2,1.2,hm,0,1.1,b.minZ-0.6); box(g,180,2.2,1.2,hm,0,1.1,b.maxZ+0.6); box(g,1.2,2.2,180,hm,b.minX-0.6,1.1,0); box(g,1.2,2.2,180,hm,b.maxX+0.6,1.1,0);
  return g;
}

/* ---------- the manager character (low-poly, animated) ---------- */
function makeHuman(o){
  o = o || {}; var g = new T.Group(), skin = o.skin||0xe0ac82, shirt = o.shirt||0xE01B32, pants = o.pants||0x22232b, shoes = o.shoes||0xf2f2f2, hair = o.hair||0x1a1410;
  var body = new T.Group(); g.add(body);
  box(body,0.72,0.95,0.4,M(shirt),0,1.4,0); var head = box(body,0.5,0.5,0.5,M(skin),0,2.18,0); box(body,0.54,0.2,0.54,M(hair),0,2.46,-0.02); box(body,0.5,0.1,0.1,M(0x111111),0,2.2,0.25);
  function limb(x, y, w, hh, mat, endMat){ var piv = new T.Group(); piv.position.set(x,y,0); body.add(piv); var m = box(piv,w,hh,w+0.04,mat,0,-hh/2,0); if(endMat) box(piv,w+0.02,0.22,w+0.2,endMat,0,-hh+0.08,0.05); return piv; }
  var aL = limb(-0.5,1.82,0.22,0.85,M(shirt)), aR = limb(0.5,1.82,0.22,0.85,M(shirt));
  [aL,aR].forEach(function(a){ box(a,0.2,0.2,0.22,M(skin),0,-0.9,0); });
  var lL = limb(-0.18,0.95,0.3,0.95,M(pants),M(shoes)), lR = limb(0.18,0.95,0.3,0.95,M(pants),M(shoes));
  var lbl = label(o.name||"Manager", 3.0); lbl.position.set(0,3.15,0); g.add(lbl);
  var t = 0, wave = 0;
  g.userData.update = function(dt, speed, running){
    var moving = speed > 0.4; t += dt*(moving ? (running?13:8.5) : 2); var amp = moving ? (running?0.95:0.6) : 0;
    lL.rotation.x = Math.sin(t)*amp; lR.rotation.x = -Math.sin(t)*amp; aL.rotation.x = -Math.sin(t)*amp*0.9; aR.rotation.x = Math.sin(t)*amp*0.9;
    body.position.y = moving ? Math.abs(Math.sin(t))*0.07 : Math.sin(t)*0.015;
    if(wave > 0){ wave -= dt; aR.rotation.x = Math.PI*0.92; aR.rotation.z = -0.35+Math.sin(performance.now()/90)*0.5; } else aR.rotation.z = 0;
  };
  g.userData.wave = function(){ wave = 2; };
  return g;
}

/* ---------- session ---------- */
function userName(){ try{ var n = store(NAME_KEY); if(n && n.trim()) return n.trim().slice(0,20); }catch(e){} return "Manager"; }
function gfx(){ var v = null; try{ v = localStorage.getItem(GFX_KEY); }catch(e){} if(v==="low"||v==="medium"||v==="high") return v; return isTouch() ? "medium" : "high"; }
function enter(){
  if(A) return; document.body.classList.add("fwlock"); document.title = "Free World | Wrestling Buzz";
  var root = h("div"); root.id = "fw-root"; root.className = "fwhud"; document.body.appendChild(root);
  var s = A = {root:root, raf:0, alive:true, paused:false, yaw:0, pitch:0.42, dist:10, keys:{}, joy:{x:0,y:0,id:null}, drag:null, run:false, fps:60, frames:0, last:performance.now()};
  var load = h("div"); load.id = "fw-load"; var lt = h("h2"); lt.innerHTML = "FREE <b>WORLD</b>"; load.appendChild(lt); var lm = h("p","","Loading the 3D engine..."); lm.style.color = "#d8cfbd"; load.appendChild(lm);
  var bar = h("div","fwbar"); var bi = h("i"); bar.appendChild(bi); load.appendChild(bar); root.appendChild(load);
  var prog = function(p, text){ bi.style.width = p+"%"; if(text) lm.textContent = text; };
  var fail = function(msg){ lm.className = "fwerr"; lm.textContent = msg; var b = h("button","fwbtn red","Back"); b.type = "button"; b.addEventListener("click", exit); load.appendChild(b); };
  prog(10);
  var needs = [];
  if(!window.THREE) needs.push(loadScript("three.min.js")); if(!window.FWCore) needs.push(loadScript("fw-core.js"));
  Promise.all(needs).then(function(){ T = window.THREE; C = window.FWCore; if(!s.alive) return; prog(45,"Building Buzz City..."); return new Promise(function(r){ setTimeout(r, 30); }); })
  .then(function(){ if(!s.alive) return; start(s, prog, fail); })
  .catch(function(){ if(s.alive) fail("Could not load the 3D engine. Check your connection and try again."); });
}
function exit(){
  if(!A) return; var s = A; A = null; s.alive = false; cancelAnimationFrame(s.raf);
  window.removeEventListener("resize", s.onResize); window.removeEventListener("keydown", s.onKD); window.removeEventListener("keyup", s.onKU);
  try{ if(s.renderer){ s.renderer.dispose(); } }catch(e){} if(s.root.parentNode) s.root.parentNode.removeChild(s.root);
  if(window.__fw === s) window.__fw = null;
  document.body.classList.remove("fwlock"); if(location.hash === "#freeworld") location.hash = "#promoter";
}
function restart(){ var hs = location.hash; exit(); location.hash = "#freeworld"; if(hs === "#freeworld") enter(); }

function start(s, prog, fail){
  var q = gfx(), touch = isTouch(), root = s.root, canvas, renderer;
  try{
    canvas = document.createElement("canvas"); canvas.className = "fwgl"; root.insertBefore(canvas, root.firstChild);
    renderer = new T.WebGLRenderer({canvas:canvas, antialias: q==="high" && !touch, powerPreference:"high-performance"});
  }catch(e){ return fail("Your device can't show the 3D world (WebGL isn't available)."); }
  s.renderer = renderer; renderer.setPixelRatio(q==="low" ? 1 : Math.min(window.devicePixelRatio||1, q==="high" ? 2 : 1.5)); renderer.setSize(innerWidth, innerHeight, false);
  renderer.shadowMap.enabled = q==="high"; if(q==="high") renderer.shadowMap.type = T.PCFShadowMap;
  var scene = new T.Scene(); scene.background = new T.Color(0x9ad7ff); scene.fog = new T.Fog(0x9ad7ff, q==="low" ? 45 : 70, q==="low" ? 130 : 210);
  var cam = new T.PerspectiveCamera(58, innerWidth/innerHeight, 0.3, 320); s.cam = cam;
  scene.add(new T.HemisphereLight(0xffffff, 0x6f8a78, 0.95)); var sun = new T.DirectionalLight(0xfff2d6, 0.65); sun.position.set(-40,70,30); scene.add(sun);
  var city = buildCity(scene);
  if(q==="high"){ sun.castShadow = true; sun.shadow.mapSize.set(1024,1024); var sc = sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.far = 160; city.traverse(function(o){ if(o.isMesh){ o.castShadow = true; o.receiveShadow = true; } }); }
  prog(75,"Creating your manager...");
  var me = makeHuman({name:userName()}); scene.add(me); if(q==="high") me.traverse(function(o){ if(o.isMesh) o.castShadow = true; });
  var P = s.p = C.createState(); me.position.set(P.x,0.15,P.z); me.rotation.y = P.rot;
  s.scene = scene; s.me = me; s.camPos = new T.Vector3(P.x, 6, P.z+10);
  buildHud(s); prog(100);
  var ld = document.getElementById("fw-load"); setTimeout(function(){ if(ld && ld.parentNode) ld.parentNode.removeChild(ld); showWhere(s, "WELCOME TO BUZZ CITY"); }, 250);
  s.onResize = function(){ renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth/innerHeight; cam.updateProjectionMatrix(); }; window.addEventListener("resize", s.onResize);
  s.onKD = function(e){ var k = e.key.toLowerCase(); if(["arrowup","arrowdown","arrowleft","arrowright"," "].indexOf(k)>=0) e.preventDefault(); s.keys[k] = true; if(e.repeat) return;
    if(k==="e") interact(s); else if(k==="f") me.userData.wave(); else if(k==="m") toggleMap(s); else if(k==="escape") togglePause(s); };
  s.onKU = function(e){ s.keys[e.key.toLowerCase()] = false; }; window.addEventListener("keydown", s.onKD); window.addEventListener("keyup", s.onKU);
  /* camera drag (finger on the right side or mouse) and wheel zoom */
  canvas.addEventListener("pointerdown", function(e){ if(s.drag) return; s.drag = {id:e.pointerId, x:e.clientX, y:e.clientY}; try{ canvas.setPointerCapture(e.pointerId); }catch(x){} });
  canvas.addEventListener("pointermove", function(e){ if(!s.drag || s.drag.id!==e.pointerId) return; s.yaw -= (e.clientX-s.drag.x)*0.006; s.pitch = Math.max(0.12, Math.min(1.15, s.pitch + (e.clientY-s.drag.y)*0.005)); s.drag.x = e.clientX; s.drag.y = e.clientY; });
  var endDrag = function(e){ if(s.drag && s.drag.id===e.pointerId) s.drag = null; }; canvas.addEventListener("pointerup", endDrag); canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("wheel", function(e){ e.preventDefault(); s.dist = Math.max(5, Math.min(16, s.dist + e.deltaY*0.01)); }, {passive:false});
  window.__fw = s; s.last = performance.now(); (function loop(now){ if(!s.alive) return; s.raf = requestAnimationFrame(loop); frame(s, now); })(s.last);
}

function frame(s, now){
  var dt = Math.min(0.05, (now - s.last)/1000); s.last = now; s.frames++; s.fps = s.fps*0.95 + (dt>0 ? 1/dt : 60)*0.05;
  var P = s.p, k = s.keys, f = (k.w||k.arrowup?1:0) - (k.s||k.arrowdown?1:0), r = (k.d||k.arrowright?1:0) - (k.a||k.arrowleft?1:0);
  if(s.joy.id!==null){ f += -s.joy.y; r += s.joy.x; }
  var sn = Math.sin(s.yaw), cs = Math.cos(s.yaw), dx = f*(-sn) + r*cs, dz = f*(-cs) + r*(-sn), run = !!(k.shift || s.run);
  if(!s.paused) C.step(P, {dx:dx, dz:dz, run:run}, dt);
  s.me.position.set(P.x, 0.15, P.z); s.me.rotation.y = P.rot; s.me.userData.update(dt, s.paused?0:P.speed, P.running);
  /* follow camera */
  var tx = P.x, ty = 2.1, tz = P.z, cp = Math.cos(s.pitch), want = new T.Vector3(tx + Math.sin(s.yaw)*cp*s.dist, ty + Math.sin(s.pitch)*s.dist, tz + Math.cos(s.yaw)*cp*s.dist);
  s.camPos.lerp(want, 1 - Math.exp(-dt*9)); s.cam.position.copy(s.camPos); s.cam.lookAt(tx, ty, tz);
  s.renderer.render(s.scene, s.cam);
  /* places */
  var sp = C.nearestSpot(P.x, P.z); if((sp && sp.id) !== s.spotId){ s.spotId = sp && sp.id; if(sp) showWhere(s, sp.name); updatePrompt(s, sp); }
  if(s.mapOn && s.frames%3===0) drawMap(s);
}

/* ---------- HUD ---------- */
function showWhere(s, text){ var w = document.getElementById("fw-where"); if(!w) return; w.textContent = text; w.style.opacity = 1; clearTimeout(s.wt); s.wt = setTimeout(function(){ w.style.opacity = 0; }, 2400); }
function updatePrompt(s, sp){ var p = document.getElementById("fw-prompt"); if(!p) return; if(sp && sp.interact){ p.textContent = sp.label; p.style.display = "block"; } else p.style.display = "none"; }
function panel(s, build){ closePanel(s); var p = h("div","fwpanel"); p.id = "fw-panel"; var b = h("div","fwbox"); p.appendChild(b); build(b); s.root.appendChild(p); s.paused = true; }
function closePanel(s){ var p = document.getElementById("fw-panel"); if(p) p.parentNode.removeChild(p); s.paused = false; }
function interact(s){
  var sp = C.nearestSpot(s.p.x, s.p.z); if(!sp || !sp.interact) return;
  panel(s, function(b){ b.appendChild(h("h3","",sp.name)); b.appendChild(h("p","","You made it to the door. The inside of this building opens in the next update of Free World, so there is nothing to do in here yet."));
    var ok = h("button","fwbtn red","OK"); ok.type = "button"; ok.addEventListener("click", function(){ closePanel(s); }); b.appendChild(ok); });
}
function togglePause(s){ if(document.getElementById("fw-panel")){ closePanel(s); return; }
  panel(s, function(b){ b.appendChild(h("h3","","Paused"));
    var r = h("button","fwbtn red","Resume"); r.type = "button"; r.addEventListener("click", function(){ closePanel(s); }); b.appendChild(r);
    b.appendChild(h("p","","Graphics quality")); var sel = h("select"); [["auto","Auto (best for this device)"],["low","Low (fastest)"],["medium","Medium"],["high","High (shadows)"]].forEach(function(o){ sel.appendChild(new Option(o[1],o[0])); });
    var cur = null; try{ cur = localStorage.getItem(GFX_KEY); }catch(e){} sel.value = (cur==="low"||cur==="medium"||cur==="high") ? cur : "auto";
    sel.addEventListener("change", function(){ try{ if(sel.value==="auto") localStorage.removeItem(GFX_KEY); else localStorage.setItem(GFX_KEY, sel.value); }catch(e){} restart(); }); b.appendChild(sel);
    ["Character customisation","Inventory","Garage"].forEach(function(t){ var d = h("button","fwbtn",t+"  (coming soon)"); d.type = "button"; d.disabled = true; b.appendChild(d); });
    var ex = h("button","fwbtn","Exit Free World"); ex.type = "button"; ex.addEventListener("click", exit); b.appendChild(ex); });
}
function toggleMap(s){ s.mapOn = !s.mapOn; var m = document.getElementById("fw-map"); m.style.display = s.mapOn ? "block" : "none"; if(s.mapOn) drawMap(s); }
function drawMap(s){
  var c = document.getElementById("fw-map"), x = c.getContext("2d"), W = C.WORLD, S = c.width/172, ox = c.width/2, oy = c.height/2;
  x.clearRect(0,0,c.width,c.height); x.fillStyle = "#1f5c34"; x.fillRect(0,0,c.width,c.height); x.fillStyle = "#3a3d45"; x.fillRect(0,oy-6*S,c.width,12*S); x.fillRect(ox-6*S,0,12*S,c.height);
  x.fillStyle = "#cfc8b8"; x.beginPath(); x.arc(ox,oy,16*S,0,7); x.fill();
  W.boxes.forEach(function(b){ if(b.id==="bench"||b.id==="car") return; x.fillStyle = "#E01B32"; x.fillRect(ox+b.x0*S, oy+b.z0*S, b.w*S, b.d*S); });
  x.fillStyle = "#EDBA3E"; W.spots.forEach(function(sp){ if(sp.interact){ x.beginPath(); x.arc(ox+sp.x*S, oy+sp.z*S, 2.2, 0, 7); x.fill(); } });
  x.save(); x.translate(ox+s.p.x*S, oy+s.p.z*S); x.rotate(Math.PI - s.p.rot); x.fillStyle = "#fff"; x.strokeStyle = "#000"; x.beginPath(); x.moveTo(0,-5); x.lineTo(4,4); x.lineTo(-4,4); x.closePath(); x.fill(); x.stroke(); x.restore();
}
function buildHud(s){
  var root = s.root, nm = userName();
  var card = h("div","fwcard"); var av = h("div","fwav",nm.charAt(0).toUpperCase()); card.appendChild(av); var tx = h("div"); tx.appendChild(h("b","",nm)); var bal = h("small","","BUZZ CASH: ..."); tx.appendChild(bal); card.appendChild(tx); root.appendChild(card);
  (function(){ try{ if(!readSession()){ bal.textContent = "BUZZ CASH: log in"; return; } getUserToken().then(function(t){ return fetch(SUPABASE_URL+"/rest/v1/rpc/legends_me",{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+t,"Content-Type":"application/json"},body:"{}"}); }).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ bal.textContent = (j && j.cash_balance!=null) ? "BUZZ CASH: B "+Number(j.cash_balance).toLocaleString() : "BUZZ CASH: -"; }).catch(function(){ bal.textContent = "BUZZ CASH: -"; }); }catch(e){ bal.textContent = "BUZZ CASH: -"; } })();
  var tr = h("div","fwtr"); function tb(t, f){ var b = h("button","fwbtn",t); b.type = "button"; b.addEventListener("click", f); tr.appendChild(b); return b; }
  tb("\uD83D\uDDFA", function(){ toggleMap(s); }).setAttribute("aria-label","Map");
  tb("\uD83D\uDC65", function(){ panel(s, function(b){ b.appendChild(h("h3","","Players nearby")); b.appendChild(h("p","","1. "+nm+" (you)")); b.appendChild(h("p","","Other managers will show up here when multiplayer opens in the next phase.")); var ok = h("button","fwbtn red","Close"); ok.type = "button"; ok.addEventListener("click", function(){ closePanel(s); }); b.appendChild(ok); }); }).setAttribute("aria-label","Players");
  tb("\u2630", function(){ togglePause(s); }).setAttribute("aria-label","Menu"); root.appendChild(tr);
  var map = h("canvas"); map.id = "fw-map"; map.width = 336; map.height = 336; root.appendChild(map);
  var wh = h("div"); wh.id = "fw-where"; root.appendChild(wh);
  var pr = h("button","fwbtn","ENTER"); pr.id = "fw-prompt"; pr.type = "button"; pr.addEventListener("click", function(){ interact(s); }); root.appendChild(pr);
  /* joystick */
  var joy = h("div"); joy.id = "fw-joy"; var knob = h("div"); knob.id = "fw-knob"; joy.appendChild(knob); root.appendChild(joy);
  function jmove(e){ var r = joy.getBoundingClientRect(), dx = e.clientX-(r.left+r.width/2), dy = e.clientY-(r.top+r.height/2), m = Math.sqrt(dx*dx+dy*dy), max = 46; if(m > max){ dx = dx/m*max; dy = dy/m*max; } knob.style.transform = "translate("+dx+"px,"+dy+"px)"; s.joy.x = dx/max; s.joy.y = dy/max; if(Math.abs(s.joy.x)<0.12 && Math.abs(s.joy.y)<0.12){ s.joy.x = 0; s.joy.y = 0; } }
  joy.addEventListener("pointerdown", function(e){ if(s.joy.id!==null) return; s.joy.id = e.pointerId; try{ joy.setPointerCapture(e.pointerId); }catch(x){} jmove(e); e.preventDefault(); });
  joy.addEventListener("pointermove", function(e){ if(s.joy.id===e.pointerId) jmove(e); });
  var jend = function(e){ if(s.joy.id===e.pointerId){ s.joy.id = null; s.joy.x = 0; s.joy.y = 0; knob.style.transform = ""; } }; joy.addEventListener("pointerup", jend); joy.addEventListener("pointercancel", jend);
  /* right-hand buttons */
  var br = h("div","fwbr"); var wv = h("button","fwbtn","Wave"); wv.type = "button"; wv.addEventListener("click", function(){ s.me.userData.wave(); }); br.appendChild(wv);
  var rn = h("button","fwbtn","Run"); rn.type = "button"; rn.setAttribute("aria-pressed","false"); rn.addEventListener("click", function(){ s.run = !s.run; rn.classList.toggle("on", s.run); rn.setAttribute("aria-pressed", s.run?"true":"false"); }); br.appendChild(rn);
  root.appendChild(br);
}

/* ---------- entry points ---------- */
if(typeof VIEWS!=="undefined" && VIEWS.indexOf("freeworld")<0) VIEWS.push("freeworld");
var sec = document.createElement("section"); sec.className = "view"; sec.id = "v-freeworld"; var host = document.getElementById("v-contact"); if(host) host.parentNode.insertBefore(sec, host);
function onHash(){ if((location.hash||"")==="#freeworld") enter(); else if(A) exit(); }
window.addEventListener("hashchange", onHash);
var _pm = window.renderPromoter;
if(typeof _pm==="function") window.renderPromoter = function(){ _pm.apply(this, arguments); var r = document.getElementById("pm-root"); if(!r || !r.children.length || document.getElementById("pm-fw-link")) return;
  var b = h("div"); b.id = "pm-fw-link"; b.style.cssText = "padding:12px;border-radius:10px;margin:10px 0;background:#0c2a14;border:1px solid #1f8a3b;font-size:14px"; b.appendChild(h("b","","WRESTLING BUZZ FREE WORLD: ")); b.appendChild(document.createTextNode("walk around Buzz City with your manager. "));
  var a = h("a","","Enter Free World"); a.href = "#freeworld"; a.style.cssText = "display:inline-block;margin-top:6px;padding:9px 16px;border-radius:10px;background:#E01B32;color:#fff;font-weight:800;text-decoration:none"; b.appendChild(a); r.insertBefore(b, r.firstChild); };
window.FreeWorld = {version:VERSION, enter:enter, exit:exit};
if((location.hash||"")==="#freeworld") enter();
})();
