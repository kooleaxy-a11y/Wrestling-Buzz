/* WRESTLING BUZZ FREE WORLD, Phase 6: live wrestling in Buzz Arena, on top of Phase 5 driving, a bigger road network and parking, Phase 4 shops (BUZZ CASH checked on the server), Phase 3 locations, Phase 2 multiplayer and the Phase 1 city.
   Needs three.min.js (r128) and fw-core.js, both loaded on demand when a player enters Free World. */
(function(){
"use strict";
var VERSION = "phase-6", GFX_KEY = "wb_fw_gfx", T = null, C = null, A = null;   /* T = THREE, C = FWCore, A = active session */
function h(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text!==undefined) e.textContent = text; return e; }
function isTouch(){ return window.matchMedia && matchMedia("(pointer:coarse)").matches; }
function loadScript(src){ return new Promise(function(ok, no){ var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = function(){ no(new Error("load "+src)); }; document.head.appendChild(s); }); }

/* Where the multiplayer server lives, for example "wss://wb-freeworld.onrender.com". Empty = single player.
   For testing you can also run  localStorage.wb_fw_server = "ws://localhost:2567"  in the browser console. */
var FW_SERVER = "";
function serverUrl(){ var v = window.FW_SERVER || ""; try{ v = v || localStorage.getItem("wb_fw_server") || ""; }catch(e){} return String(v || FW_SERVER || "").trim(); }

/* ---------- styles ---------- */
var css = "body.fwlock{overflow:hidden}#fw-root{position:fixed;inset:0;height:100dvh;z-index:8500;background:#0b0b0d;color:#fff;font-family:inherit;touch-action:none;user-select:none;-webkit-user-select:none}#fw-root>canvas.fwgl{display:block;width:100%;height:100%}"+
".fwhud *{box-sizing:border-box}.fwcard{position:absolute;left:10px;top:calc(10px + env(safe-area-inset-top,0px));display:flex;gap:8px;align-items:center;background:rgba(10,10,14,.72);border:1px solid #E01B32;border-radius:14px;padding:7px 10px;backdrop-filter:blur(4px)}"+
".fwav{flex:none;width:54px;height:54px;border-radius:50%;overflow:hidden;border:2px solid #EDBA3E;background:linear-gradient(135deg,#E01B32,#7a0b19);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px}.fwcard b{display:block;font-size:14px;max-width:118px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fwcard small{display:block;color:#EDBA3E;font-weight:700;font-size:12px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"+
".fwtr{position:absolute;right:10px;top:calc(10px + env(safe-area-inset-top,0px));display:flex;gap:6px}.fwtr .fwbtn{padding:9px 0;width:44px;font-size:18px;text-align:center}.fwbtn{border:1px solid #4a4a55;background:rgba(10,10,14,.72);color:#fff;border-radius:12px;padding:10px 13px;font:inherit;font-weight:700;cursor:pointer;touch-action:manipulation}.fwbtn.red{background:#E01B32;border-color:#E01B32}.fwbtn[disabled]{opacity:.45;cursor:default}"+
"#fw-joy{position:absolute;left:18px;bottom:calc(26px + env(safe-area-inset-bottom,0px));width:132px;height:132px;border-radius:50%;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.28);touch-action:none}#fw-knob{position:absolute;left:41px;top:41px;width:50px;height:50px;border-radius:50%;background:rgba(224,27,50,.85);border:2px solid #fff;pointer-events:none}"+
".fwbr{position:absolute;right:14px;bottom:calc(26px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:10px;align-items:flex-end}.fwbr .fwbtn{min-width:96px;min-height:46px;font-size:15px}.fwbtn.on{background:#EDBA3E;color:#241600;border-color:#EDBA3E}"+
"#fw-prompt{position:absolute;left:50%;bottom:calc(215px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);display:none;white-space:nowrap;font-size:17px;padding:13px 22px;border-radius:14px;background:#E01B32;border:2px solid #fff}#fw-where{pointer-events:none;position:absolute;left:50%;top:calc(64px + env(safe-area-inset-top,0px));transform:translateX(-50%);padding:6px 14px;border-radius:99px;background:rgba(10,10,14,.7);font-weight:800;letter-spacing:.06em;font-size:13px;color:#EDBA3E;opacity:0;transition:opacity .4s}"+
"#fw-load{position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,#4a0d17,#0b0b0d 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;z-index:5;text-align:center;padding:20px}#fw-load h2{margin:0;font-size:34px;letter-spacing:.06em;color:#EDBA3E}#fw-load h2 b{color:#fff}.fwbar{width:min(260px,70vw);height:8px;border-radius:5px;background:#26202b;overflow:hidden}.fwbar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#E01B32,#EDBA3E);transition:width .25s}"+
".fwpanel{position:absolute;inset:0;background:rgba(0,0,0,.72);z-index:4;display:flex;align-items:center;justify-content:center;padding:14px}.fwbox{width:min(380px,100%);background:#101014;border:2px solid #E01B32;border-radius:16px;padding:16px;max-height:90dvh;overflow:auto}.fwbox h3{margin:0 0 10px;color:#EDBA3E}.fwbox p{color:#d8cfbd;font-size:14px;margin:8px 0}.fwbox .fwbtn{display:block;width:100%;margin:8px 0}.fwbox select{width:100%;padding:10px;border-radius:8px;background:#08080a;color:#fff;border:1px solid #4a4a55;font:inherit}"+
"#fw-map{position:absolute;right:10px;top:calc(66px + env(safe-area-inset-top,0px));width:168px;height:168px;border-radius:12px;border:2px solid #E01B32;background:rgba(10,10,14,.82);display:none}.fwerr{color:#ff7a88;font-weight:700}.fwcard small.fwnet{font-size:11px;color:#9a9aa8}.fwcard small.fwnet.on{color:#7be39b}.fwcard small.fwnet.wait{color:#EDBA3E}.fwcard small.fwnet.bad{color:#ff7a88}.fwrow{display:flex;gap:8px}.fwrow .fwbtn{margin:8px 0}.fwtabs{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.fwtabs .fwbtn{width:auto;flex:1;margin:0;padding:8px 6px;font-size:13px}.fwitem{display:flex!important;justify-content:space-between;gap:8px;text-align:left}.fwitem span:last-child{color:#EDBA3E;white-space:nowrap}.fwitem.on span:last-child{color:#241600}.fwstat{font-size:13px;color:#d8cfbd;letter-spacing:2px}.fwprice{color:#EDBA3E;font-weight:800;font-size:18px}.fwcv{width:100%;display:block;border-radius:12px;background:linear-gradient(#22222c,#0b0b0f)}.fwdrive{position:absolute;right:14px;bottom:calc(26px + env(safe-area-inset-bottom,0px));display:none;flex-direction:column;gap:10px;align-items:flex-end}.fwdrive .fwbtn{min-width:104px;min-height:58px;font-size:16px;user-select:none;-webkit-user-select:none}.fwdriving .fwdrive{display:flex}.fwdriving .fwbr,.fwdriving #fw-prompt{display:none!important}#fw-speed{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(26px + env(safe-area-inset-bottom,0px));display:none;padding:8px 16px;border-radius:12px;background:rgba(10,10,14,.72);border:1px solid #4a4a55;color:#fff;font-weight:800;font-size:20px;letter-spacing:1px}.fwdriving #fw-speed{display:block}.fwwatching>*:not(canvas.fwgl):not(.fwwatchui){display:none!important}.fwwatchui{position:absolute;inset:0;pointer-events:none}.fwwatchui>*{pointer-events:auto}.fwwtop{position:absolute;left:0;right:0;top:0;padding:calc(10px + env(safe-area-inset-top,0px)) 12px 12px;display:flex;align-items:center;flex-wrap:wrap;gap:10px;background:linear-gradient(rgba(0,0,0,.8),transparent);pointer-events:none}.fwlive{background:#E01B32;color:#fff;font-weight:900;font-size:12px;letter-spacing:2px;padding:4px 8px;border-radius:6px;animation:fwblink 1.4s infinite}@keyframes fwblink{50%{opacity:.5}}.fwwtop b{font-size:17px}.fwwtop small{color:#EDBA3E;font-weight:700}#fww-count{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);font-size:130px;font-weight:900;color:#fff;text-shadow:0 0 26px #E01B32,0 5px 0 #000;display:none;pointer-events:none}#fww-cap{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(74px + env(safe-area-inset-bottom,0px));max-width:min(92vw,720px);padding:10px 16px;border-radius:12px;background:rgba(8,8,12,.8);border:1px solid #EDBA3E;font-weight:800;font-size:16px;text-align:center;pointer-events:none}.fwwbar{position:absolute;left:0;right:0;bottom:calc(10px + env(safe-area-inset-bottom,0px));display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:0 8px}.fwwbar .fwbtn{width:auto;min-width:74px;margin:0;padding:10px 12px;font-size:14px}.fwwres{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}";
var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

/* ---------- 3D helpers (low-poly, shared materials to keep it light) ---------- */
var mats = {};
function M(c){ if(!mats[c]) mats[c] = new T.MeshLambertMaterial({color:c, flatShading:true}); return mats[c]; }
function MB(c){ var k = "b"+c; if(!mats[k]) mats[k] = new T.MeshBasicMaterial({color:c}); return mats[k]; }
function box(g, w, hh, d, mat, x, y, z){ var m = new T.Mesh(new T.BoxGeometry(w,hh,d), mat); m.position.set(x,y,z); g.add(m); return m; }
function cyl(g, rt, rb, hh, seg, mat, x, y, z){ var m = new T.Mesh(new T.CylinderGeometry(rt,rb,hh,seg), mat); m.position.set(x,y,z); g.add(m); return m; }
/* many copies of one shape drawn in a single call (keeps trees, lamps and road paint cheap on phones). list items: [x,y,z, sx,sy,sz, rotY, colourHex] */
function instanced(g, geo, mat, list){
  var im = new T.InstancedMesh(geo, mat, list.length), m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3(), sc = new T.Vector3(), col = new T.Color();
  list.forEach(function(it, i){ e.set(0, it[6]||0, 0); q.setFromEuler(e); p.set(it[0], it[1], it[2]); sc.set(it[3]==null?1:it[3], it[4]==null?1:it[4], it[5]==null?1:it[5]); m.compose(p, q, sc); im.setMatrixAt(i, m); if(it[7] != null){ col.setHex(it[7]); im.setColorAt(i, col); } });
  im.instanceMatrix.needsUpdate = true; if(im.instanceColor) im.instanceColor.needsUpdate = true; im.frustumCulled = false; g.add(im); return im;
}
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
  box(g,212,0.1,12,road,0,0.05,0); box(g,12,0.1,212,road,0,0.05,0);   /* the two main roads */
  box(g,212,0.1,12,road,0,0.05,-100); box(g,212,0.1,12,road,0,0.05,100); box(g,12,0.1,212,road,-100,0.05,0); box(g,12,0.1,212,road,100,0.05,0);   /* the ring road */
  [-7.5,7.5].forEach(function(z){ box(g,184,0.16,3,side,0,0.08,z); }); [-7.5,7.5].forEach(function(x){ box(g,3,0.16,184,side,x,0.08,0); });
  var dh = [], dv = [];
  for(var i=-88;i<=88;i+=8){ if(Math.abs(i)>=18){ dh.push([i,0.11,0]); dv.push([0,0.11,i]); } if(Math.abs(i)>=10){ dh.push([i,0.11,-100],[i,0.11,100]); dv.push([-100,0.11,i],[100,0.11,i]); } }
  instanced(g, new T.BoxGeometry(3,0.02,0.3), MB(0xffffff), dh); instanced(g, new T.BoxGeometry(0.3,0.02,3), MB(0xffffff), dv);
  var plaza = new T.Mesh(new T.CircleGeometry(16,40), M(0xdcd5c6)); plaza.rotation.x = -Math.PI/2; plaza.position.y = 0.2; g.add(plaza);
  var ring = new T.Mesh(new T.RingGeometry(10,10.7,40), MB(0xE01B32)); ring.rotation.x = -Math.PI/2; ring.position.y = 0.22; g.add(ring);
  var ring2 = new T.Mesh(new T.RingGeometry(15.2,16,40), MB(0xEDBA3E)); ring2.rotation.x = -Math.PI/2; ring2.position.y = 0.22; g.add(ring2);
  /* fountain */
  cyl(g,8,8.4,1.1,28,M(0xb9c3cf),0,0.75,0); cyl(g,7.3,7.3,0.2,28,MB(0x4fc3f7),0,1.3,0); cyl(g,3.6,3.9,1.0,20,M(0xb9c3cf),0,1.6,0); cyl(g,3.0,3.0,0.2,20,MB(0x4fc3f7),0,2.15,0); cyl(g,0.7,0.9,3.2,10,M(0xb9c3cf),0,3.6,0);
  var top = new T.Mesh(new T.SphereGeometry(1.1,10,8), MB(0x9be3ff)); top.position.set(0,5.5,0); g.add(top);
  var cl = label("BUZZ CITY CENTRE", 7); cl.position.set(0,7,0); g.add(cl);
  /* benches */
  W.boxes.filter(function(b){ return b.id==="bench"; }).forEach(function(b){ var long = b.d > b.w;
    box(g, b.w, 0.35, b.d, M(0x8a5a2b), b.x, 0.6, b.z); box(g, long?0.3:b.w, 0.9, long?b.d:0.3, M(0x6e4520), b.x+(long?(b.x<0?-0.5:0.5):0), 1.1, b.z+(long?0:(b.z<0?-0.5:0.5)));
    box(g, long?1:b.w, 0.4, long?b.d:1, M(0x333333), b.x, 0.2, b.z); });
  /* parked cars + lots */
  box(g,22,0.06,6.5,M(0x3a3d45),23,0.12,-13); box(g,22,0.06,6.5,M(0x3a3d45),-23,0.12,13);
  var cc = [0xE01B32,0xf2f2f2,0x2f6fdb,0xEDBA3E,0x222222,0x27ae60]; W.boxes.filter(function(b){ return b.id==="car"; }).forEach(function(b,i){ var c = carMesh(cc[i%cc.length]); c.position.set(b.x,0.12,b.z); g.add(c); });
  /* painted parking bays */
  var bl = [];
  W.parking.forEach(function(b){ var sn = Math.sin(b.rot), cs = Math.cos(b.rot); function L(lx, lz, sx, sz){ bl.push([b.x + lx*cs + lz*sn, 0.115, b.z - lx*sn + lz*cs, sx, 1, sz, b.rot]); } L(1.5,0,0.12,5.4); L(-1.5,0,0.12,5.4); L(0,2.7,3.1,0.12); L(0,-2.7,3.1,0.12); });
  instanced(g, new T.BoxGeometry(1,0.02,1), MB(0xffffff), bl);
  /* houses */
  var hc = [[0xe8d9b8,0xb5483a],[0xc9d6e3,0x5a6a8a],[0xe3c9c9,0x7a3a3a],[0xd6e3c9,0x4a6a4a]];
  W.boxes.filter(function(b){ return b.id==="house"; }).forEach(function(b, i){ var c = hc[i%4], f = b.z < 0 ? 1 : -1, hg = new T.Group(); g.add(hg);
    box(hg,b.w,5,b.d,M(c[0]),b.x,2.5,b.z); box(hg,b.w+1,0.8,b.d+1,M(c[1]),b.x,5.4,b.z); box(hg,b.w-2.5,1.6,b.d-1.5,M(c[1]),b.x,6.6,b.z);
    box(hg,1.6,2.8,0.3,M(0x5a3a1f),b.x,1.4,b.z+f*b.d/2); [-1,1].forEach(function(sd){ box(hg,1.8,1.6,0.3,MB(0x9fd8ff),b.x+sd*3.4,2.8,b.z+f*b.d/2); }); });
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
  var trees = W.posts.filter(function(p){ return p.kind==="tree"; }), lamps = W.posts.filter(function(p){ return p.kind==="lamp"; });
  instanced(g, trunkG, M(0x6b4423), trees.map(function(p){ return [p.x,1.1,p.z]; }));
  instanced(g, leafG, M(0xffffff), trees.map(function(p,i){ return [p.x,3.7,p.z,1,1,1,0,greens[i%3]]; }));
  instanced(g, leafG, M(0xffffff), trees.map(function(p,i){ return [p.x,5.3,p.z,0.75,0.75,0.75,0,greens[(i+1)%3]]; }));
  instanced(g, new T.CylinderGeometry(0.12,0.16,5.2,6), M(0x3a3a44), lamps.map(function(p){ return [p.x,2.6,p.z]; }));
  instanced(g, new T.SphereGeometry(0.4,8,6), MB(0xfff3b0), lamps.map(function(p){ return [p.x,5.5,p.z]; }));
  /* border hedge */
  var hm = M(0x2a7a44), b = W.bounds, hw = b.maxX-b.minX+10; box(g,hw,2.2,1.2,hm,0,1.1,b.minZ-0.6); box(g,hw,2.2,1.2,hm,0,1.1,b.maxZ+0.6); box(g,1.2,2.2,hw,hm,b.minX-0.6,1.1,0); box(g,1.2,2.2,hw,hm,b.maxX+0.6,1.1,0);
  return g;
}

/* ---------- faces ---------- */
function cssHex(c){ return "#"+("000000"+Number(c).toString(16)).slice(-6); }
function drawFace(x, n, skin, hair){
  var k = n/128, sk = cssHex(skin), hr = cssHex(hair);
  function el(cx, cy, rx, ry){ x.beginPath(); x.ellipse(cx*k, cy*k, rx*k, ry*k, 0, 0, 6.2832); x.fill(); }
  x.fillStyle = sk; x.fillRect(0, 0, n, n);
  x.fillStyle = "rgba(0,0,0,0.10)"; x.fillRect(0, 0, n, 12*k);                       /* shadow under the fringe */
  x.fillStyle = "rgba(255,80,80,0.20)"; el(24, 88, 13, 8); el(104, 88, 13, 8);       /* cheeks */
  [32, 96].forEach(function(ex){
    x.fillStyle = "#ffffff"; el(ex, 60, 16, 12);                                      /* eye white */
    x.fillStyle = "#3a2412"; el(ex, 61, 8.5, 9); x.fillStyle = "#050505"; el(ex, 61, 4.6, 5); x.fillStyle = "#ffffff"; el(ex-3, 57, 2.4, 2.4);   /* iris, pupil, shine */
    x.strokeStyle = "rgba(20,10,10,0.85)"; x.lineWidth = 3*k; x.lineCap = "round"; x.beginPath(); x.moveTo((ex-16)*k, 58*k); x.quadraticCurveTo(ex*k, 44*k, (ex+16)*k, 58*k); x.stroke();   /* upper lid */
    x.strokeStyle = hr; x.lineWidth = 7*k; x.beginPath(); x.moveTo((ex-15)*k, (ex < 64 ? 36 : 41)*k); x.lineTo((ex+15)*k, (ex < 64 ? 41 : 36)*k); x.stroke();                                  /* eyebrow */
  });
  x.fillStyle = "rgba(0,0,0,0.17)"; x.beginPath(); x.moveTo(64*k, 62*k); x.lineTo(54*k, 86*k); x.quadraticCurveTo(64*k, 92*k, 74*k, 86*k); x.closePath(); x.fill();   /* nose */
  x.fillStyle = "rgba(0,0,0,0.30)"; el(59, 88, 2.6, 2); el(69, 88, 2.6, 2);
  x.fillStyle = "#ffffff"; x.beginPath(); x.moveTo(40*k, 100*k); x.quadraticCurveTo(64*k, 128*k, 88*k, 100*k); x.closePath(); x.fill();                                              /* smile with teeth */
  x.strokeStyle = "#7a2630"; x.lineWidth = 4.5*k; x.lineCap = "round"; x.beginPath(); x.moveTo(40*k, 100*k); x.quadraticCurveTo(64*k, 128*k, 88*k, 100*k); x.quadraticCurveTo(64*k, 106*k, 40*k, 100*k); x.stroke();
}
var faceCache = {};
function faceCanvas(skin, hair){ var key = skin+"_"+hair; if(!faceCache[key]){ var cv = document.createElement("canvas"); cv.width = cv.height = 256; drawFace(cv.getContext("2d"), 256, skin, hair); faceCache[key] = {cv:cv, mat:null}; } return faceCache[key]; }
function faceMat(skin, hair){ var f = faceCanvas(skin, hair); if(!f.mat){ var tex = new T.CanvasTexture(f.cv); tex.anisotropy = 4; f.mat = new T.MeshLambertMaterial({map:tex}); } return f.mat; }
/* the round face picture in the top-left box */
function drawPortrait(cv, o){
  o = o || {}; var x = cv.getContext("2d"), skin = o.skin||0xe0ac82, hair = o.hair||0x1a1410, top = o.jacket||o.shirt||0xE01B32;
  x.fillStyle = "#23232d"; x.fillRect(0, 0, 96, 96);
  x.fillStyle = cssHex(top); x.beginPath(); x.moveTo(6, 100); x.quadraticCurveTo(10, 66, 34, 64); x.lineTo(62, 64); x.quadraticCurveTo(86, 66, 90, 100); x.closePath(); x.fill();
  x.fillStyle = cssHex(skin); x.fillRect(40, 56, 16, 14); x.fillRect(20, 34, 5, 11); x.fillRect(71, 34, 5, 11);
  x.drawImage(faceCanvas(skin, hair).cv, 24, 14, 48, 50);
  x.fillStyle = cssHex(hair); x.fillRect(22, 6, 52, 12); x.fillRect(22, 12, 5, 26); x.fillRect(69, 12, 5, 26); x.fillRect(26, 14, 44, 4);
  if(o.cap){ x.fillStyle = cssHex(o.cap); x.fillRect(20, 2, 56, 15); x.fillRect(24, 14, 48, 5); x.fillStyle = "rgba(0,0,0,0.25)"; x.fillRect(24, 18, 48, 2); }
}
/* ---------- the manager character (low-poly, animated) ---------- */
function makeHuman(o){
  o = o || {}; var g = new T.Group(), skin = o.skin||0xe0ac82, shirt = o.shirt||0xE01B32, pants = o.pants||0x22232b, shoes = o.shoes||0xf2f2f2, hair = o.hair||0x1a1410;
  var body = new T.Group(); g.add(body);
  box(body,0.72,0.95,0.4,M(shirt),0,1.4,0);
  var sm = M(skin), head = new T.Mesh(new T.BoxGeometry(0.6,0.6,0.58), [sm, sm, sm, sm, faceMat(skin, hair), sm]); head.position.set(0,2.24,0); body.add(head);
  box(body,0.2,0.16,0.2,sm,0,1.93,0);
  box(body,0.66,0.2,0.64,M(hair),0,2.62,-0.02); box(body,0.66,0.48,0.14,M(hair),0,2.4,-0.28); box(body,0.07,0.24,0.5,M(hair),-0.325,2.46,-0.02); box(body,0.07,0.24,0.5,M(hair),0.325,2.46,-0.02); box(body,0.54,0.09,0.06,M(hair),0,2.57,0.3);
  [-1,1].forEach(function(sd){ box(body,0.06,0.16,0.1,sm,sd*0.33,2.2,0); });
  if(o.jacket) box(body,0.8,0.8,0.46,M(o.jacket),0,1.42,0);
  if(o.cap){ box(body,0.7,0.16,0.68,M(o.cap),0,2.75,-0.02); box(body,0.58,0.05,0.36,M(o.cap),0,2.68,0.42); }
  function limb(x, y, w, hh, mat, endMat){ var piv = new T.Group(); piv.position.set(x,y,0); body.add(piv); var m = box(piv,w,hh,w+0.04,mat,0,-hh/2,0); if(endMat) box(piv,w+0.02,0.22,w+0.2,endMat,0,-hh+0.08,0.05); return piv; }
  var aL = limb(-0.5,1.82,0.22,0.85,M(o.jacket||shirt)), aR = limb(0.5,1.82,0.22,0.85,M(o.jacket||shirt));
  [aL,aR].forEach(function(a){ box(a,0.2,0.2,0.22,M(skin),0,-0.9,0); });
  var lL = limb(-0.18,0.95,0.3,0.95,M(pants),M(shoes)), lR = limb(0.18,0.95,0.3,0.95,M(pants),M(shoes));
  var lbl = label(o.name||"Manager", 3.0); lbl.position.set(0,3.4,0); g.add(lbl);
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
  if(!A) return; var s = A; A = null; s.alive = false; cancelAnimationFrame(s.raf); try{ endWatch(s); }catch(e){}
  netClose(s); window.removeEventListener("resize", s.onResize); window.removeEventListener("keydown", s.onKD); window.removeEventListener("keyup", s.onKU);
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
  buildHud(s); netStart(s); dbLoad(s); prog(100);
  var ld = document.getElementById("fw-load"); setTimeout(function(){ if(ld && ld.parentNode) ld.parentNode.removeChild(ld); showWhere(s, "WELCOME TO BUZZ CITY"); }, 250);
  s.onResize = function(){ renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth/innerHeight; cam.updateProjectionMatrix(); }; window.addEventListener("resize", s.onResize);
  s.onKD = function(e){ var k = e.key.toLowerCase(); if(["arrowup","arrowdown","arrowleft","arrowright"," "].indexOf(k)>=0) e.preventDefault(); s.keys[k] = true; if(e.repeat) return;
    if(k==="e") interact(s); else if(k==="f") doWave(s); else if(k==="m") toggleMap(s); else if(k==="escape") togglePause(s); };
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
  if(s.watch){ stepWatch(s, dt); netSend(s, now); if(s.watch) s.renderer.render(s.watch.scene, s.watch.cam); return; }
  var P = s.p, k = s.keys, f = (k.w||k.arrowup?1:0) - (k.s||k.arrowdown?1:0), r = (k.d||k.arrowright?1:0) - (k.a||k.arrowleft?1:0);
  if(s.joy.id!==null){ f += -s.joy.y; r += s.joy.x; }
  var sn = Math.sin(s.yaw), cs = Math.cos(s.yaw), dx = f*(-sn) + r*cs, dz = f*(-cs) + r*(-sn), run = !!(k.shift || s.run);
  var drv = !!(s.car && s.car.driving);
  if(drv) stepDrive(s, dt); else if(!s.paused) C.step(P, {dx:dx, dz:dz, run:run}, dt);
  s.me.visible = !drv; s.me.position.set(P.x, 0.15, P.z); s.me.rotation.y = P.rot; s.me.userData.update(dt, s.paused||drv?0:P.speed, P.running);
  updateRemotes(s, dt); netSend(s, now);
  /* follow camera (swings in behind the car when driving) */
  if(s.faceCam && !drv){ if(P.speed > 0.8 || s.paused) faceCam(s, false); else if(!s.drag) s.yaw += C.angDiff(s.yaw, P.rot) * (1 - Math.exp(-dt*5)); }
  var tx = P.x, ty = drv ? 1.7 : (s.faceCam ? 2.35 : 2.2), tz = P.z;
  if(drv){ var cst = s.car.st, sp2 = Math.abs(cst.speed); if(!s.drag && sp2 > 1){ s.yaw += C.angDiff(s.yaw, cst.rot + Math.PI) * (1 - Math.exp(-dt*2.6)); } s.dist = 9 + Math.min(4, sp2*0.12); tx += Math.sin(cst.rot)*2.5; tz += Math.cos(cst.rot)*2.5;
    var fov = 58 + Math.min(1, sp2/s.car.spec.max)*12; if(Math.abs(s.cam.fov - fov) > 0.15){ s.cam.fov += (fov - s.cam.fov)*Math.min(1, dt*4); s.cam.updateProjectionMatrix(); } }
  var cp = Math.cos(s.pitch), want = new T.Vector3(tx + Math.sin(s.yaw)*cp*s.dist, ty + Math.sin(s.pitch)*s.dist, tz + Math.cos(s.yaw)*cp*s.dist);
  s.camPos.lerp(want, 1 - Math.exp(-dt*(drv ? 7 : 9))); s.cam.position.copy(s.camPos); s.cam.lookAt(tx, ty, tz);
  s.renderer.render(s.scene, s.cam);
  /* places */
  var sp = drv ? null : C.nearestSpot(P.x, P.z), cn = !drv && carNear(s), pr = cn ? {id:"mycar", interact:true, label:"GET IN "+(carDefOf(s.car.id) || {name:"CAR"}).name.toUpperCase()} : sp;
  if((pr && pr.id) !== s.spotId){ s.spotId = pr && pr.id; if(sp && !cn) showWhere(s, sp.name); updatePrompt(s, pr); }
  if(s.mapOn && s.frames%3===0) drawMap(s);
}

/* ---------- driving (Phase 5) ---------- */
function carDefOf(id){ for(var i=0;i<CARS.length;i++) if(CARS[i].id === id) return CARS[i]; return null; }
function placeCarMesh(m, x, z, rot){ var pr = C.WORLD.plazaR; m.position.set(x, x*x+z*z < pr*pr ? 0.2 : 0.12, z); m.rotation.y = rot - Math.PI/2; }
function carNear(s){ var c = s.car; if(!c || c.driving) return false; var dx = s.p.x-c.st.x, dz = s.p.z-c.st.z; return dx*dx+dz*dz < 25; }
function bayFree(s, b){
  var n = s.net, id, r; if(!n) return true;
  for(id in n.remotes){ r = n.remotes[id]; if(Math.sqrt((r.x-b.x)*(r.x-b.x)+(r.z-b.z)*(r.z-b.z)) < 2.6) return false; if(r.cm && Math.sqrt((r.cx-b.x)*(r.cx-b.x)+(r.cz-b.z)*(r.cz-b.z)) < 3.6) return false; }
  return true;
}
function pickBay(s){ var P = s.p, best = -1, bd = 1e9; C.WORLD.parking.forEach(function(b, i){ if(!bayFree(s, b)) return; var d = Math.sqrt((b.x-P.x)*(b.x-P.x)+(b.z-P.z)*(b.z-P.z)); if(d < bd){ bd = d; best = i; } }); return best; }
function makeOwnCar(s, id, x, z, rot){
  removeOwnCar(s); var def = carDefOf(id), spec = C.carSpec(id); if(!def || !spec) return;
  var mesh = carModel(def); placeCarMesh(mesh, x, z, rot); s.scene.add(mesh); if(s.renderer.shadowMap.enabled) mesh.traverse(function(o){ if(o.isMesh) o.castShadow = true; });
  s.car = {id:id, spec:spec, st:C.createCar(x, z, rot), mesh:mesh, driving:false};
}
function removeOwnCar(s){ var c = s.car; if(!c) return; if(c.driving) leaveDrivingUi(s); s.scene.remove(c.mesh); disposeObj(c.mesh); s.car = null; }
function leaveDrivingUi(s){ s.root.classList.remove("fwdriving"); if(s.walkDist) s.dist = s.walkDist; if(s.cam && s.cam.fov !== 58){ s.cam.fov = 58; s.cam.updateProjectionMatrix(); } }
function netCar(s, msg){ var n = s.net; if(n && n.live && n.room){ try{ n.room.send("car", msg); }catch(e){} n.lastSent = null; return true; } return false; }
/* the Car button: bring your car to the nearest free parking bay, or get in if it is right here */
function carButton(s){
  var d = D(s); if(s.car && s.car.driving) return;
  if(!dbReady(s) || !d.car){ showWhere(s, d.err === "login" ? "LOG IN TO USE YOUR CAR" : "BUY A CAR AT BUZZ MOTORS"); return; }
  if(s.car && s.car.id === d.car && carNear(s)){ enterCar(s); return; }
  var bi = pickBay(s); if(bi < 0){ showWhere(s, "NO FREE PARKING NEARBY"); return; }
  var b = C.WORLD.parking[bi];
  if(netCar(s, {op:"spawn", bay:bi})){ showWhere(s, "CALLING YOUR CAR..."); return; }
  makeOwnCar(s, d.car, b.x, b.z, b.rot); showWhere(s, "YOUR CAR IS AT "+b.name.toUpperCase());
}
function faceCam(s, on){
  if(on === !!s.faceCam) return; s.faceCam = on;
  if(on){ s.faceSave = {dist:s.dist, pitch:s.pitch}; s.dist = 4.4; s.pitch = 0.1; } else if(s.faceSave){ s.dist = s.faceSave.dist; s.pitch = s.faceSave.pitch; s.faceSave = null; }
}
function enterCar(s){
  var c = s.car; if(!c || c.driving) return; faceCam(s, false); c.driving = true; var P = s.p; P.x = c.st.x; P.z = c.st.z; P.rot = c.st.rot; P.vx = 0; P.vz = 0; P.speed = 0; P.running = false;
  netCar(s, {op:"in"}); s.walkDist = s.dist; s.dist = 9.5; s.pitch = 0.3; s.root.classList.add("fwdriving"); showWhere(s, "DRIVING: "+(carDefOf(c.id) || {name:""}).name.toUpperCase());
}
function exitCar(s){
  var c = s.car; if(!c || !c.driving) return; if(Math.abs(c.st.speed) > 4){ showWhere(s, "SLOW DOWN TO GET OUT"); return; }
  var st = c.st, sp = c.spec, sn = Math.sin(st.rot), cs = Math.cos(st.rot), side = sp.wid/2 + 1.1, end = sp.len/2 + 1.1, cand = [[cs,-sn,side],[-cs,sn,side],[-sn,-cs,end],[sn,cs,end]], pos = null;
  for(var i = 0; i < cand.length && !pos; i++){ var q = {x:st.x+cand[i][0]*cand[i][2], z:st.z+cand[i][1]*cand[i][2]}, o = {x:q.x, z:q.z}; C.resolve(q); if(Math.abs(q.x-o.x) < 0.05 && Math.abs(q.z-o.z) < 0.05) pos = q; }
  if(!pos){ showWhere(s, "NO ROOM TO GET OUT"); return; }
  c.driving = false; st.vx = 0; st.vz = 0; st.speed = 0; var P = s.p; P.x = pos.x; P.z = pos.z; P.rot = st.rot; P.vx = 0; P.vz = 0; P.speed = 0;
  placeCarMesh(c.mesh, st.x, st.z, st.rot); leaveDrivingUi(s); netCar(s, {op:"out"});
}
function stepDrive(s, dt){
  var c = s.car, k = s.keys, pd = s.pedal || (s.pedal = {gas:false, brake:false, hb:false}), P = s.p, j = s.joy, jy = (j.id !== null && Math.abs(j.y) > 0.3) ? j.y : 0, jx = (j.id !== null && Math.abs(j.x) > 0.12) ? j.x : 0;
  if(!s.paused){
    var thr = (k.w||k.arrowup ? 1 : 0) - (k.s||k.arrowdown ? 1 : 0) + (pd.gas ? 1 : 0) - (pd.brake ? 1 : 0) - jy, steer = (k.d||k.arrowright ? 1 : 0) - (k.a||k.arrowleft ? 1 : 0) + jx;
    C.stepCar(c.st, {thr:thr, steer:steer, hb:!!(k[" "] || pd.hb)}, dt, c.spec);
  }
  P.x = c.st.x; P.z = c.st.z; P.rot = c.st.rot; P.speed = Math.abs(c.st.speed); P.running = false; P.vx = c.st.vx; P.vz = c.st.vz;
  placeCarMesh(c.mesh, c.st.x, c.st.z, c.st.rot);
  var e = document.getElementById("fw-speed"); if(e && s.frames % 3 === 0) e.textContent = Math.round(Math.abs(c.st.speed)*3.6)+" km/h";
}
function refreshCarBtn(s){
  var d = D(s), b = document.getElementById("fw-carbtn"); if(b) b.style.display = d.car ? "block" : "none";
  if(s.car && !s.car.driving && s.car.id !== d.car){ removeOwnCar(s); netCar(s, {op:"remove"}); }
}

/* ---------- multiplayer (Phase 2) ---------- */
var COLYSEUS_SRCS = ["https://cdn.jsdelivr.net/npm/colyseus.js@0.15.28/dist/colyseus.js", "https://unpkg.com/colyseus.js@0.15.28/dist/colyseus.js"];
var LOOK_SHIRTS = [0x2f6fdb,0x27ae60,0xEDBA3E,0x8e44ad,0xf2f2f2,0xff7a1a,0x16a5a5,0xd35fa0], LOOK_SKINS = [0xe0ac82,0xc68642,0x8d5524,0xf1c27d,0xffdbac], LOOK_HAIR = [0x1a1410,0x4a2c12,0x0e0e0e,0x8a6a2a];
var SEND_MS = 66, HEARTBEAT_MS = 1000, SHOW_DIST2 = 75*75;
function ensureColyseus(){
  if(window.Colyseus && window.Colyseus.Client) return Promise.resolve();
  var list = window.FW_COLYSEUS_SRC ? [window.FW_COLYSEUS_SRC] : COLYSEUS_SRCS, i = 0;
  return new Promise(function(ok, no){ (function next(){ if(i >= list.length) return no(new Error("colyseus")); loadScript(list[i++]).then(function(){ if(window.Colyseus && window.Colyseus.Client) ok(); else next(); }).catch(next); })(); });
}
function netStatus(cls, text){ var e = document.getElementById("fw-net"); if(!e) return; e.className = "fwnet "+cls; e.textContent = text; }
function remoteCount(s){ var c = 0; if(s.net) for(var k in s.net.remotes) c++; return c; }
function refreshNet(s){ if(s.net && s.net.live) netStatus("on", "ONLINE: "+(remoteCount(s)+1)+" in city"); }
function disposeObj(o){ o.traverse(function(c){ if(c.geometry) c.geometry.dispose(); var m = c.material; if(m && !Array.isArray(m) && m.map && m.map.dispose){ m.map.dispose(); m.dispose(); } }); }
function remoteMesh(p){
  var id = p[0], look = p[2]|0, o = {name:p[1]+(p[6] ? " \u2713" : ""), shirt:LOOK_SHIRTS[look%LOOK_SHIRTS.length], skin:LOOK_SKINS[(look+id)%LOOK_SKINS.length], hair:LOOK_HAIR[(look*3+id)%LOOK_HAIR.length]};
  if(p[7]) Object.assign(o, lookProps(p[7]));   /* their saved outfit, as checked by the server */
  return makeHuman(o);
}
function setRemoteCar(s, r, id, x, z, rot, d){
  if(r.cm && r.cid !== id){ s.scene.remove(r.cm); disposeObj(r.cm); r.cm = null; }
  r.cid = id || null; r.drv = !!d; if(!id) return;
  if(!r.cm){ var def = carDefOf(id); if(!def) return; r.cm = carModel(def); s.scene.add(r.cm); }
  r.cx = x; r.cz = z; r.crot = rot; if(!d) placeCarMesh(r.cm, x, z, rot);
}
function addRemote(s, p){
  var n = s.net, id = p[0], look = p[2]|0; if(!n || n.remotes[id]) return;
  var mesh = remoteMesh(p);
  mesh.position.set(p[3], 0.15, p[4]); mesh.rotation.y = p[5]; s.scene.add(mesh);
  if(s.renderer.shadowMap.enabled) mesh.traverse(function(o){ if(o.isMesh) o.castShadow = true; });
  n.remotes[id] = {id:id, raw:p[1], ver:p[6], idx:look, name:p[1]+(p[6] ? " \u2713" : ""), mesh:mesh, x:p[3], z:p[4], rot:p[5], tx:p[3], tz:p[4], trot:p[5], run:false, sp:0};
  if(p[8]) setRemoteCar(s, n.remotes[id], p[8].id, p[8].x, p[8].z, p[8].rot, p[8].d);
  refreshNet(s);
}
function removeRemote(s, id){ var n = s.net, r = n && n.remotes[id]; if(!r) return; s.scene.remove(r.mesh); disposeObj(r.mesh); if(r.cm){ s.scene.remove(r.cm); disposeObj(r.cm); } delete n.remotes[id]; refreshNet(s); }
function clearRemotes(s){ if(!s.net) return; Object.keys(s.net.remotes).forEach(function(id){ removeRemote(s, id); }); }
function signedIn(){ try{ return typeof readSession === "function" && !!readSession(); }catch(e){ return false; } }
function netStart(s){
  var url = serverUrl(); if(!url){ netStatus("", "OFFLINE (single player)"); return; }
  if(!signedIn()){ s.net = {remotes:{}, live:false, closed:true, guest:true, room:null}; netStatus("", "Log in to see other players"); return; }
  s.net = {room:null, remotes:{}, live:false, tries:0, sendT:0, lastSent:null, closed:false, idle:false, myId:0, timer:0};
  netStatus("wait", "Connecting...");
  ensureColyseus().then(function(){ if(s.alive && s.net && !s.net.closed) netJoin(s, url); }).catch(function(){ if(s.alive){ s.net.closed = true; netStatus("bad", "Online play unavailable"); } });
}
function netJoin(s, url){
  var n = s.net; if(!n || n.closed || n.room) return;
  netStatus("wait", n.tries ? "Reconnecting..." : "Connecting...");
  var client; try{ client = new window.Colyseus.Client(url); }catch(e){ n.closed = true; return netStatus("bad", "Bad server address"); }
  var tokenP = Promise.resolve(null); try{ if(typeof readSession === "function" && typeof getUserToken === "function" && readSession()) tokenP = getUserToken().catch(function(){ return null; }); }catch(e){}
  tokenP.then(function(token){ return client.joinOrCreate("freeworld", {name:userName(), token:token || "", v:VERSION, x:Math.round(s.p.x*100)/100, z:Math.round(s.p.z*100)/100}); }).then(function(room){
    if(!s.alive || n.closed){ try{ room.leave(); }catch(e){} return; }
    n.room = room; n.live = true; n.tries = 0; n.lastSent = null; n.idle = false;
    room.onMessage("welcome", function(m){ n.myId = m.id; clearRemotes(s); (m.players||[]).forEach(function(p){ if(p[0] === m.id){ n.me = {name:p[1], verified:!!p[6]}; } else addRemote(s, p); }); refreshNet(s); });
    room.onMessage("join", function(p){ addRemote(s, p); });
    room.onMessage("leave", function(id){ removeRemote(s, id); });
    room.onMessage("snap", function(rows){ rows.forEach(function(r){ var o = n.remotes[r[0]]; if(o){ o.tx = r[1]; o.tz = r[2]; o.trot = r[3]; o.run = !!r[4]; if(o.cm) o.drv = !!r[5]; } }); });
    room.onMessage("wave", function(id){ var o = n.remotes[id]; if(o) o.mesh.userData.wave(); });
    room.onMessage("look", function(m){ var r = n.remotes[m[0]]; if(!r) return; var old = r.mesh, nm = remoteMesh([m[0], r.raw, r.idx, 0, 0, 0, r.ver, m[1]]); nm.position.copy(old.position); nm.rotation.y = old.rotation.y; s.scene.remove(old); disposeObj(old); s.scene.add(nm); r.mesh = nm; });
    room.onMessage("fix", function(m){ s.p.x = m.x; s.p.z = m.z; s.p.vx = 0; s.p.vz = 0; n.lastSent = null; if(s.car && s.car.driving){ s.car.st.x = m.x; s.car.st.z = m.z; s.car.st.vx = 0; s.car.st.vz = 0; s.car.st.speed = 0; } });
    room.onMessage("car", function(m){ var pid = m[0], id = m[1];
      if(pid === n.myId){ if(!id){ if(s.car && !s.car.driving) removeOwnCar(s); return; } if(s.car && s.car.driving) return;
        if(!s.car || s.car.id !== id || Math.abs(s.car.st.x-m[2]) > 0.5 || Math.abs(s.car.st.z-m[3]) > 0.5){ makeOwnCar(s, id, m[2], m[3], m[4]); if(!s.carSeen){ showWhere(s, "YOUR CAR IS READY"); } } return; }
      var r = n.remotes[pid]; if(r) setRemoteCar(s, r, id, m[2], m[3], m[4], m[5]); });
    room.onMessage("carno", function(why){ if(s.car && s.car.driving){ s.car.driving = false; leaveDrivingUi(s); }
      showWhere(s, why === "nocar" ? "BUY A CAR AT BUZZ MOTORS" : why === "busy" ? "THAT SPOT IS TAKEN, TRY AGAIN" : why === "login" ? "LOG IN TO USE YOUR CAR" : "COULDN'T GET YOUR CAR, TRY AGAIN"); });
    room.onError(function(){});
    room.send("hello");
    room.onLeave(function(code){ n.live = false; n.room = null; clearRemotes(s); if(!s.alive || n.closed) return;
      if(code === 4001){ n.idle = true; netStatus("", "Disconnected (idle)"); } else if(code === 4003){ n.closed = true; netStatus("bad", "Signed in somewhere else"); } else if(code === 4002){ n.closed = true; netStatus("bad", "Disconnected by server"); } else netRetry(s); });
  }).catch(function(e){ if(!s.alive || n.closed) return; if(e && /login_required/.test(String(e.message || e))){ n.closed = true; n.guest = true; netStatus("", "Log in to see other players"); return; } netRetry(s); });
}
function netRetry(s){
  var n = s.net; if(!n || n.closed) return; n.tries++;
  if(n.tries > 6){ netStatus("bad", "OFFLINE (can't reach server)"); return; }
  netStatus("wait", "Reconnecting..."); clearTimeout(n.timer); n.timer = setTimeout(function(){ if(s.alive && !n.closed) netJoin(s, serverUrl()); }, Math.min(8000, 700*n.tries*n.tries));
}
function netRetryNow(s){ var n = s.net; if(!n){ netStart(s); return; } if(n.live || n.room) return; n.closed = false; n.tries = 0; clearTimeout(n.timer); if(window.Colyseus && window.Colyseus.Client) netJoin(s, serverUrl()); else netStart(s); }
function netClose(s){ var n = s.net; if(!n) return; n.closed = true; clearTimeout(n.timer); try{ if(n.room) n.room.leave(); }catch(e){} n.room = null; n.live = false; clearRemotes(s); }
function netSend(s, now){
  var n = s.net; if(!n) return;
  if(n.idle && !n.room && !n.closed){ n.idle = false; n.tries = 0; netJoin(s, serverUrl()); return; }   /* the frame loop only runs while the tab is visible, so this rejoins on return */
  if(!n.live || !n.room) return;
  var P = s.p, l = n.lastSent, moved = !l || Math.abs(P.x-l.x) > 0.02 || Math.abs(P.z-l.z) > 0.02 || Math.abs(C.angDiff(l.rot, P.rot)) > 0.05 || l.run !== P.running;
  if(now - n.sendT < SEND_MS || (!moved && now - n.sendT < HEARTBEAT_MS)) return;
  n.sendT = now; n.lastSent = {x:P.x, z:P.z, rot:P.rot, run:P.running};
  try{ n.room.send("move", {x:Math.round(P.x*100)/100, z:Math.round(P.z*100)/100, rot:Math.round(P.rot*100)/100, run:P.running ? 1 : 0}); }catch(e){}
}
function updateRemotes(s, dt){
  var n = s.net; if(!n) return; var k = 1 - Math.exp(-dt*11), P = s.p;
  for(var id in n.remotes){
    var r = n.remotes[id], ox = r.x, oz = r.z, dx = r.tx-r.x, dz = r.tz-r.z;
    if(dx*dx+dz*dz > 36){ r.x = r.tx; r.z = r.tz; } else { r.x += dx*k; r.z += dz*k; }
    r.rot += C.angDiff(r.rot, r.trot)*k;
    var sp = dt > 0 ? Math.sqrt((r.x-ox)*(r.x-ox)+(r.z-oz)*(r.z-oz))/dt : 0; r.sp = r.sp*0.7 + sp*0.3;
    var m = r.mesh, ex = r.x-P.x, ez = r.z-P.z; m.position.set(r.x, 0.15, r.z); m.rotation.y = r.rot; m.visible = ex*ex+ez*ez < SHOW_DIST2;
    m.userData.update(dt, r.sp, r.run);
    if(r.cm){ if(r.drv){ placeCarMesh(r.cm, r.x, r.z, r.rot); m.visible = false; r.cm.visible = ex*ex+ez*ez < SHOW_DIST2; } else { var cx = r.cx-P.x, cz = r.cz-P.z; r.cm.visible = cx*cx+cz*cz < SHOW_DIST2; } }
  }
}
function doWave(s){ s.me.userData.wave(); var n = s.net; if(n && n.live && n.room){ try{ n.room.send("wave"); }catch(e){} } }
function n0(s){ return s.net && s.net.me; }
function playersPanel(s){
  panel(s, function(b){
    var n = s.net, names = [((n0(s) && n0(s).name) || userName())+(n0(s) && n0(s).verified ? " \u2713" : "")+" (you)"]; if(n) for(var id in n.remotes) names.push(n.remotes[id].name);
    b.appendChild(h("h3","","Players in Buzz City ("+names.length+")")); names.forEach(function(t, i){ b.appendChild(h("p","",(i+1)+". "+t)); });
    if(!serverUrl()) b.appendChild(h("p","","Multiplayer is switched off because no server address is set yet."));
    else if(n && n.guest) b.appendChild(h("p","","Log in to your Wrestling Buzz account to walk the city with other players."));
    else if(!n || !n.live){ b.appendChild(h("p","","Not connected to the multiplayer server right now.")); var rt = h("button","fwbtn","Try again"); rt.type = "button"; rt.addEventListener("click", function(){ closePanel(s); netRetryNow(s); }); b.appendChild(rt); }
    var ok = h("button","fwbtn red","Close"); ok.type = "button"; ok.addEventListener("click", function(){ closePanel(s); }); b.appendChild(ok);
  });
}

/* ---------- HUD ---------- */
function showWhere(s, text){ var w = document.getElementById("fw-where"); if(!w) return; w.textContent = text; w.style.opacity = 1; clearTimeout(s.wt); s.wt = setTimeout(function(){ w.style.opacity = 0; }, 2400); }
function updatePrompt(s, sp){ var p = document.getElementById("fw-prompt"); if(!p) return; if(sp && sp.interact){ p.textContent = sp.label; p.style.display = "block"; } else p.style.display = "none"; }
function panel(s, build){ closePanel(s); var p = h("div","fwpanel"); p.id = "fw-panel"; var b = h("div","fwbox"); p.appendChild(b); build(b); s.root.appendChild(p); s.paused = true; }
function closePanel(s){ if(s.panelCleanup){ try{ s.panelCleanup(); }catch(e){} s.panelCleanup = null; } var p = document.getElementById("fw-panel"); if(p) p.parentNode.removeChild(p); s.paused = false; }
/* ---------- locations and shops (Phase 3 and 4) ---------- */
function money(n){ return "B "+Number(n).toLocaleString(); }
function stars(n){ return new Array(n+1).join("\u25A0")+new Array(6-n).join("\u25A1"); }
function bar(n, total){ return new Array(n+1).join("\u25A0")+new Array(total-n+1).join("\u25A1"); }
function closeBtn(s, b, text){ var ok = h("button","fwbtn red",text||"Close"); ok.type = "button"; ok.addEventListener("click", function(){ closePanel(s); }); b.appendChild(ok); return ok; }
function infoPanel(s, title, lines, rows){ panel(s, function(b){ b.appendChild(h("h3","",title)); lines.forEach(function(t){ b.appendChild(h("p","",t)); }); (rows||[]).forEach(function(r){ var d = h("div","fwitem fwbtn"); d.style.cursor = "default"; d.appendChild(h("span","",r[0])); d.appendChild(h("span","",r[1])); b.appendChild(d); }); closeBtn(s, b); }); }

/* a small spinning 3D preview that lives inside a panel and is disposed when the panel closes */
function miniView(s, b, hgt){
  var cv = h("canvas","fwcv"), W = 340, dpr = Math.min(window.devicePixelRatio||1, 2); cv.width = W*dpr; cv.height = hgt*dpr; cv.style.aspectRatio = W+" / "+hgt; b.appendChild(cv);
  var r; try{ r = new T.WebGLRenderer({canvas:cv, antialias:true, alpha:true}); }catch(e){ cv.style.display = "none"; return {set:function(){}, dispose:function(){}}; }
  r.setPixelRatio(1); r.setSize(W*dpr, hgt*dpr, false);
  var sc = new T.Scene(), cam = new T.PerspectiveCamera(40, W/hgt, 0.1, 60), holder = new T.Group(); sc.add(holder);
  sc.add(new T.HemisphereLight(0xffffff, 0x555566, 1)); var dl = new T.DirectionalLight(0xfff2d6, 0.7); dl.position.set(3,6,5); sc.add(dl);
  var floor = new T.Mesh(new T.CylinderGeometry(3.4,3.4,0.1,28), M(0x2a2a34)); floor.position.y = -0.05; sc.add(floor);
  var mv = {alive:true, raf:0, cur:null};
  (function loop(){ if(!mv.alive) return; mv.raf = requestAnimationFrame(loop); holder.rotation.y += 0.014; r.render(sc, cam); })();
  mv.set = function(obj, dist, camY, lookY){ if(mv.cur){ holder.remove(mv.cur); disposeObj(mv.cur); } mv.cur = obj; holder.add(obj); cam.position.set(0, camY, dist); cam.lookAt(0, lookY, 0); };
  mv.dispose = function(){ mv.alive = false; cancelAnimationFrame(mv.raf); if(mv.cur) disposeObj(mv.cur); disposeObj(floor); try{ r.dispose(); r.forceContextLoss(); }catch(e){} };
  s.panelCleanup = mv.dispose; return mv;
}

/* ---- what exists (names and looks here; PRICES live only on the server) ---- */
var CARS = [
  {id:"car_pup", name:"Buzz Pup", type:"Hatchback", speed:2, handling:4, color:0x27ae60, len:3.4, wid:1.8, bodyH:0.7, cabinLen:2.0, cabinH:0.7, cabinX:-0.15, wheel:0.4},
  {id:"car_rookie", name:"Rookie Rider", type:"Sedan", speed:3, handling:3, color:0x2f6fdb, len:4.3, wid:1.9, bodyH:0.75, cabinLen:2.2, cabinH:0.7, cabinX:-0.2, wheel:0.42},
  {id:"car_van", name:"Tag Team Van", type:"Van", speed:2, handling:2, color:0xf2f2f2, len:4.6, wid:2.0, bodyH:0.8, cabinLen:3.6, cabinH:1.1, cabinX:-0.3, wheel:0.45},
  {id:"car_main", name:"Main Event", type:"Coupe", speed:4, handling:4, color:0xE01B32, len:4.3, wid:1.9, bodyH:0.65, cabinLen:1.7, cabinH:0.55, cabinX:-0.3, wheel:0.42},
  {id:"car_heavy", name:"Heavyweight", type:"Pickup", speed:3, handling:2, color:0xEDBA3E, len:5.0, wid:2.0, bodyH:0.85, cabinLen:1.8, cabinH:0.8, cabinX:0.9, wheel:0.5, bed:true},
  {id:"car_suv", name:"Champion SUV", type:"SUV", speed:3, handling:3, color:0x222228, len:4.7, wid:2.0, bodyH:0.95, cabinLen:3.2, cabinH:0.8, cabinX:-0.2, wheel:0.52},
  {id:"car_gt", name:"Hall of Fame GT", type:"Sports car", speed:5, handling:5, color:0xff7a1a, len:4.5, wid:1.95, bodyH:0.55, cabinLen:1.6, cabinH:0.5, cabinX:-0.25, wheel:0.42, spoiler:true},
  {id:"car_limo", name:"Title Belt Limo", type:"Limousine", speed:2, handling:1, color:0x101014, len:7.2, wid:1.95, bodyH:0.8, cabinLen:5.2, cabinH:0.65, cabinX:-0.3, wheel:0.44}
];
function carModel(c){
  var g = new T.Group(), w = c.wheel, by = w + c.bodyH/2 - 0.1;
  box(g, c.len, c.bodyH, c.wid, M(c.color), 0, by, 0);
  box(g, c.cabinLen, c.cabinH, c.wid-0.15, M(0x1d2a38), c.cabinX, by + c.bodyH/2 + c.cabinH/2, 0);
  box(g, c.cabinLen-0.2, 0.08, c.wid-0.1, M(c.color), c.cabinX, by + c.bodyH/2 + c.cabinH + 0.02, 0);
  [-1,1].forEach(function(z){ box(g,0.12,0.2,0.4,MB(0xfff3b0), c.len/2, by+0.1, z*(c.wid/2-0.35)); box(g,0.12,0.2,0.4,MB(0xff2a2a), -c.len/2, by+0.1, z*(c.wid/2-0.35)); });
  if(c.bed) box(g, c.len-c.cabinLen-0.6, 0.35, c.wid-0.1, M(0x2a2a34), -c.len/2+(c.len-c.cabinLen-0.6)/2+0.05, by+c.bodyH/2+0.15, 0);
  if(c.spoiler){ box(g,0.5,0.08,c.wid-0.2,M(0x101014),-c.len/2+0.25,by+c.bodyH/2+0.55,0); [-1,1].forEach(function(z){ box(g,0.1,0.5,0.1,M(0x101014),-c.len/2+0.25,by+c.bodyH/2+0.25,z*(c.wid/2-0.4)); }); }
  var xs = c.len > 6 ? [c.len/2-1.2, -c.len/2+1.2] : [c.len/2-0.95, -c.len/2+0.95];
  xs.forEach(function(x){ [-1,1].forEach(function(z){ var wh = cyl(g, w, w, 0.38, 12, M(0x15151a), x, w, z*(c.wid/2)); wh.rotation.x = Math.PI/2; }); });
  return g;
}
var SHOP = {   /* [id, name, colour] */
  Tops: {kind:"top", items:[["top_red","Buzz Red Tee",0xE01B32],["top_white","White Tee",0xf2f2f2],["top_black","Black Tee",0x1b1b22],["top_gold","Champion Gold Tee",0xEDBA3E],["top_blue","Promoter Blue Polo",0x2f6fdb],["top_mint","Mint Polo",0x27ae60]]},
  Jackets: {kind:"jacket", items:[["jkt_leather","Black Leather",0x15151a],["jkt_satin","Red Satin",0xb3122a],["jkt_denim","Denim",0x3b5f8f],["jkt_bomber","Gold Bomber",0xc9962a]]},
  Trousers: {kind:"trousers", items:[["trs_black","Black Jeans",0x22232b],["trs_blue","Blue Jeans",0x2f4f86],["trs_grey","Grey Slacks",0x6b6e78],["trs_white","White Suit Trousers",0xe8e8ee]]},
  Shoes: {kind:"shoes", items:[["shoe_white","White Trainers",0xf2f2f2],["shoe_boots","Black Boots",0x0e0e12],["shoe_gold","Gold Sneakers",0xEDBA3E],["shoe_red","Red High-tops",0xE01B32]]},
  Caps: {kind:"cap", items:[["cap_red","Buzz Red Cap",0xE01B32],["cap_black","Black Cap",0x15151a],["cap_gold","Gold Cap",0xEDBA3E]]}
};
var HQ_ITEMS = [["hq_basic","Basic headquarters","A solid building on your plot."],["hq_upgraded","Upgraded headquarters","A bigger, better building."],["hq_locker","Superstar locker room","Somewhere for your talent to get ready."],["hq_training","Training room","A gym and ring for your roster."],["hq_office","Office","Where you run the business."],["hq_trophy","Trophy room","Show off your wins."],["hq_arena","Arena expansion","Extra seating for your shows."]];
var ITEMS = {}, LOOK_PROP = {top:"shirt", jacket:"jacket", trousers:"pants", shoes:"shoes", cap:"cap"};
CARS.forEach(function(c){ ITEMS[c.id] = {id:c.id, kind:"car", name:c.name}; });
Object.keys(SHOP).forEach(function(t){ SHOP[t].items.forEach(function(it){ ITEMS[it[0]] = {id:it[0], kind:SHOP[t].kind, name:it[1], color:it[2]}; }); });
HQ_ITEMS.forEach(function(it){ ITEMS[it[0]] = {id:it[0], kind:"hq", name:it[1]}; });
/* ids saved on the account ({top:"top_red"}) -> colours the character model understands ({shirt:0xE01B32}) */
function lookProps(ids){ var o = {}; for(var k in (ids||{})){ var it = ITEMS[ids[k]], pk = LOOK_PROP[k]; if(it && pk && it.color != null) o[pk] = it.color; } return o; }
function setLook(s, look){
  var old = s.me, pos = old.position.clone(), rot = old.rotation.y; s.scene.remove(old); disposeObj(old);
  var m = makeHuman(Object.assign({name:userName()}, look)); m.position.copy(pos); m.rotation.y = rot; s.scene.add(m);
  if(s.renderer.shadowMap.enabled) m.traverse(function(o){ if(o.isMesh) o.castShadow = true; });
  s.me = m; s.look = look; var pc = document.getElementById("fw-avatar"); if(pc) drawPortrait(pc, look);
}

/* ---- your Free World account on the server (prices, ownership, saved look) ---- */
function D(s){ if(!s.db) s.db = {ready:false, cat:{}, owned:{}, look:{}, car:null, cash:null, err:null}; return s.db; }
function dbReady(s){ return !!(s.db && s.db.ready); }
function price(s, id){ var c = s.db && s.db.cat[id]; return c ? c.price : null; }
function dbRpc(name, args){
  return getUserToken().then(function(t){ if(!t) throw new Error("not_signed_in");
    return fetch(SUPABASE_URL+"/rest/v1/rpc/"+name, {method:"POST", headers:{apikey:SUPABASE_KEY, Authorization:"Bearer "+t, "Content-Type":"application/json"}, body:JSON.stringify(args||{})}); })
  .then(function(r){ return r.json().catch(function(){ return null; }).then(function(j){ if(!r.ok) throw new Error((j && (j.message || j.hint)) || "error"); return j; }); });
}
function setCash(s, n){ var e = document.getElementById("fw-cash"); if(e && n != null) e.textContent = "BUZZ CASH: "+money(n); }
function dbApply(s, me){ var d = D(s); d.owned = {}; (me.owned||[]).forEach(function(id){ d.owned[id] = true; }); d.look = me.look || {}; d.car = me.active_car || null; if(me.cash != null){ d.cash = me.cash; setCash(s, me.cash); } refreshCarBtn(s); }
function dbLoad(s){
  var d = D(s); d.err = null;
  if(!signedIn()){ d.err = "login"; return Promise.resolve(); }
  return Promise.all([dbRpc("fw_catalog_list"), dbRpc("fw_me")]).then(function(r){
    if(!s.alive) return; d.cat = {}; r[0].forEach(function(it){ d.cat[it.id] = it; }); dbApply(s, r[1]); d.ready = true;
    var props = lookProps(d.look); if(Object.keys(props).length) setLook(s, props);
  }).catch(function(e){ d.err = String(e && e.message || e); });
}
function errMsg(e){
  var m = String(e && e.message || e);
  if(/not_enough_cash/.test(m)) return "Not enough BUZZ CASH.";
  if(/already_owned/.test(m)) return "You already own that.";
  if(/no_promotion|promoter/.test(m)) return "Start Promoter Mode first to get your BUZZ CASH wallet.";
  if(/not_signed_in|JWT/.test(m)) return "Log in to buy things.";
  if(/requirement_missing/.test(m)) return "Build the Basic headquarters first.";
  if(/no_item/.test(m)) return "That item isn't for sale.";
  if(/fetch|network|Failed/i.test(m)) return "No connection. Try again.";
  return "Couldn't complete that. Try again.";
}
function newKey(){ try{ return crypto.randomUUID(); }catch(e){ return "k"+Date.now().toString(36)+Math.random().toString(36).slice(2,12); } }
var SERVER_NO = /not_enough_cash|already_owned|no_promotion|requirement_missing|no_item|bad_/;
/* one "Buy" button: first tap arms it, second tap pays. getIds() says what is being bought; the server decides the price. */
function buyFlow(s, b, getIds, onDone){
  var bt = h("button","fwbtn red"), msg = h("p"), armed = false, busy = false, key = null, keySig = ""; bt.type = "button"; msg.style.color = "#ff7a88"; b.appendChild(bt); b.appendChild(msg);
  function toBuy(){ var d = D(s); return getIds().filter(function(id){ return d.cat[id] && !d.owned[id]; }); }
  function sum(l){ return l.reduce(function(t, id){ return t + s.db.cat[id].price; }, 0); }
  function draw(){ var l = toBuy(); bt.style.display = l.length ? "block" : "none"; bt.disabled = busy; if(l.length) bt.textContent = busy ? "Buying..." : (armed ? "Tap again to confirm: "+money(sum(l)) : "Buy for "+money(sum(l))); }
  bt.addEventListener("click", function(){
    var l = toBuy(); if(!l.length || busy) return; msg.textContent = "";
    if(!armed){ armed = true; draw(); setTimeout(function(){ if(!busy && armed){ armed = false; draw(); } }, 5000); return; }
    var sig = JSON.stringify(l.slice().sort()); if(sig !== keySig){ key = newKey(); keySig = sig; }   /* same key on a retry = never charged twice */
    busy = true; draw();
    dbRpc("fw_buy", {p_items:l, p_key:key}).then(function(me){ dbApply(s, me); key = null; keySig = ""; armed = false; busy = false; draw(); onDone(l); })
    .catch(function(e){ busy = false; armed = false; msg.textContent = errMsg(e); if(SERVER_NO.test(String(e && e.message || e))){ key = null; keySig = ""; } draw(); });
  });
  draw(); return {draw:draw, reset:function(){ armed = false; msg.textContent = ""; draw(); }};
}
function needDb(s, title){
  if(dbReady(s)) return false; var d = D(s); if(d.err !== "login") dbLoad(s);
  infoPanel(s, title, [d.err === "login" ? "Log in to your Wrestling Buzz account to use this." : "Couldn't reach your Free World account. Close this and try again in a moment."]); return true;
}

/* ---- Buzz Motors ---- */
function motorsPanel(s){
  var d = D(s), i = Math.max(0, CARS.findIndex(function(c){ return c.id === d.car; }));
  panel(s, function(b){
    b.appendChild(h("h3","","BUZZ MOTORS")); var mv = miniView(s, b, 190);
    var nm = h("h3"), tp = h("p"), pr = h("div","fwprice"), sp = h("p","fwstat"), hd = h("p","fwstat"), st = h("p"); nm.style.marginTop = "12px"; st.style.color = "#7be39b"; [nm, tp, pr, sp, hd, st].forEach(function(e){ b.appendChild(e); });
    var row = h("div","fwrow"); [["\u25C0 Previous",-1],["Next \u25B6",1]].forEach(function(o){ var bt = h("button","fwbtn",o[0]); bt.type = "button"; bt.addEventListener("click", function(){ i = (i+o[1]+CARS.length)%CARS.length; show(); }); row.appendChild(bt); }); b.appendChild(row);
    var use = h("button","fwbtn","Use this car"), umsg = h("p"); use.type = "button"; umsg.style.color = "#ff7a88"; b.appendChild(use); b.appendChild(umsg);
    use.addEventListener("click", function(){ dbRpc("fw_set_car", {p_car:CARS[i].id}).then(function(me){ dbApply(s, me); show(); }).catch(function(e){ umsg.textContent = errMsg(e); }); });
    var flow = buyFlow(s, b, function(){ return [CARS[i].id]; }, function(){ show(); });
    b.appendChild(h("p","", dbReady(s) ? "Cars you buy stay on your account. Driving them around Buzz City opens in a later update." : (d.err === "login" ? "Log in to buy cars." : "Prices are loading. Close and reopen the shop in a moment.")));
    closeBtn(s, b);
    function show(){ var c = CARS[i], own = dbReady(s) && d.owned[c.id], pc = price(s, c.id);
      mv.set(carModel(c), Math.max(8, c.len*1.7), 3.2, 0.9); nm.textContent = c.name+"  ("+(i+1)+"/"+CARS.length+")"; tp.textContent = c.type;
      pr.textContent = own ? "Owned \u2713" : (pc != null ? money(pc) : "\u2013"); sp.textContent = "Speed     "+stars(c.speed); hd.textContent = "Handling  "+stars(c.handling);
      use.style.display = own && d.car !== c.id ? "block" : "none"; st.textContent = own && d.car === c.id ? "Your active car" : ""; umsg.textContent = ""; flow.reset(); }
    show();
  });
}

/* ---- Buzz Fashion and the Wardrobe (wd = only things you already own) ---- */
function sameLook(a, b){ var ka = Object.keys(a).sort(), kb = Object.keys(b).sort(); return ka.length === kb.length && ka.every(function(k, i){ return k === kb[i] && a[k] === b[k]; }); }
function netLook(s){ var n = s.net; if(n && n.live && n.room){ try{ n.room.send("look"); }catch(e){} } }
function fashionPanel(s, wd){
  if(wd && needDb(s, "WARDROBE")) return;
  var d = D(s), pick = Object.assign({}, d.look || {}), tab = "Tops";
  panel(s, function(b){
    b.appendChild(h("h3","", wd ? "WARDROBE" : "BUZZ FASHION")); var mv = miniView(s, b, 230), tabs = h("div","fwtabs"), list = h("div"), total = h("div","fwprice"), wmsg = h("p"); total.style.margin = "10px 0 2px"; wmsg.style.color = "#ff7a88";
    b.appendChild(tabs); b.appendChild(list); b.appendChild(total);
    var wear = h("button","fwbtn red","Wear this"); wear.type = "button"; b.appendChild(wear); b.appendChild(wmsg);
    function owned(id){ return dbReady(s) && !!d.owned[id]; }
    function ids(){ var a = []; for(var k in pick) if(pick[k]) a.push(pick[k]); return a; }
    function saveLook(){
      return dbRpc("fw_set_look", {p_look:pick}).then(function(me){ dbApply(s, me); setLook(s, lookProps(d.look)); netLook(s); closePanel(s); showWhere(s, "LOOKING GOOD"); }).catch(function(e){ wmsg.textContent = errMsg(e); });
    }
    wear.addEventListener("click", function(){ saveLook(); });
    var flow = wd ? {reset:function(){}} : buyFlow(s, b, ids, function(){ saveLook(); });
    function sync(){
      mv.set(makeHuman(Object.assign({name:userName()}, lookProps(pick))), 6.4, 2.2, 1.45);
      var u = ids().filter(function(id){ return !owned(id); }), sum = 0, known = true; u.forEach(function(id){ var p = price(s, id); if(p == null) known = false; else sum += p; });
      total.textContent = wd ? "" : (u.length ? (known ? "To buy: "+money(sum) : "Log in to see prices") : "");
      wear.style.display = (!u.length && dbReady(s) && !sameLook(pick, d.look)) ? "block" : "none"; wmsg.textContent = ""; flow.reset();
    }
    function draw(){
      tabs.innerHTML = ""; Object.keys(SHOP).forEach(function(t){ var bt = h("button","fwbtn"+(t === tab ? " on" : ""), t); bt.type = "button"; bt.addEventListener("click", function(){ tab = t; draw(); }); tabs.appendChild(bt); });
      list.innerHTML = ""; var kind = SHOP[tab].kind, none = h("button","fwbtn"+(!pick[kind] ? " on" : ""), "Default"); none.type = "button"; none.addEventListener("click", function(){ delete pick[kind]; draw(); sync(); }); list.appendChild(none);
      SHOP[tab].items.forEach(function(it){ var own = owned(it[0]); if(wd && !own) return;
        var bt = h("button","fwbtn fwitem"+(pick[kind] === it[0] ? " on" : "")); bt.type = "button"; bt.appendChild(h("span","",it[1])); var pc = price(s, it[0]); bt.appendChild(h("span","", own ? "Owned \u2713" : (pc != null ? money(pc) : "\u2013")));
        bt.addEventListener("click", function(){ pick[kind] = it[0]; draw(); sync(); }); list.appendChild(bt); });
    }
    b.appendChild(h("p","", wd ? "Pick from the clothes you own." : (dbReady(s) ? "Try anything on for free. What you buy is saved to your account and worn straight away." : (d.err === "login" ? "Log in to buy clothes. You can still try things on." : "Prices are loading. Close and reopen the shop in a moment."))));
    closeBtn(s, b, wd ? "Close" : "Leave the shop"); draw(); sync();
  });
}
function wardrobePanel(s){ fashionPanel(s, true); }

/* ---- Inventory and Garage ---- */
function inventoryPanel(s){
  if(needDb(s, "INVENTORY")) return; var d = D(s), any = false;
  panel(s, function(b){
    b.appendChild(h("h3","","INVENTORY")); if(d.cash != null) b.appendChild(h("p","","BUZZ CASH: "+money(d.cash)));
    [["Cars","car"],["Tops","top"],["Jackets","jacket"],["Trousers","trousers"],["Shoes","shoes"],["Caps","cap"],["Headquarters","hq"]].forEach(function(g){
      var names = Object.keys(d.owned).filter(function(id){ return ITEMS[id] && ITEMS[id].kind === g[1]; }).map(function(id){ return ITEMS[id].name; }); if(!names.length) return; any = true;
      var hd = h("p","fwstat",g[0].toUpperCase()); hd.style.marginBottom = "0"; b.appendChild(hd); b.appendChild(h("p","",names.join(", "))); });
    if(!any) b.appendChild(h("p","","Nothing yet. Visit Buzz Motors and Buzz Fashion to spend your BUZZ CASH.")); closeBtn(s, b);
  });
}
function garagePanel(s){
  if(needDb(s, "GARAGE")) return; var d = D(s), cars = CARS.filter(function(c){ return d.owned[c.id]; });
  if(!cars.length) return infoPanel(s, "GARAGE", ["You don't own a car yet. Visit Buzz Motors to buy one."]);
  var i = Math.max(0, cars.findIndex(function(c){ return c.id === d.car; }));
  panel(s, function(b){
    b.appendChild(h("h3","","GARAGE")); var mv = miniView(s, b, 190), nm = h("h3"), st = h("p"), msg = h("p"); nm.style.marginTop = "12px"; st.style.color = "#7be39b"; msg.style.color = "#ff7a88"; b.appendChild(nm); b.appendChild(st);
    if(cars.length > 1){ var row = h("div","fwrow"); [["\u25C0 Previous",-1],["Next \u25B6",1]].forEach(function(o){ var bt = h("button","fwbtn",o[0]); bt.type = "button"; bt.addEventListener("click", function(){ i = (i+o[1]+cars.length)%cars.length; show(); }); row.appendChild(bt); }); b.appendChild(row); }
    var use = h("button","fwbtn red","Use this car"); use.type = "button"; b.appendChild(use); b.appendChild(msg);
    use.addEventListener("click", function(){ dbRpc("fw_set_car", {p_car:cars[i].id}).then(function(me){ dbApply(s, me); show(); }).catch(function(e){ msg.textContent = errMsg(e); }); });
    b.appendChild(h("p","","Driving around Buzz City opens in a later update.")); closeBtn(s, b);
    function show(){ var c = cars[i]; mv.set(carModel(c), Math.max(8, c.len*1.7), 3.2, 0.9); nm.textContent = c.name+"  ("+(i+1)+"/"+cars.length+")"; st.textContent = d.car === c.id ? "Your active car" : ""; use.style.display = d.car === c.id ? "none" : "block"; msg.textContent = ""; }
    show();
  });
}

/* ---- My Headquarters (real, saved building upgrades) ---- */
function hqPanel(s){
  var d = D(s), sel = null;
  panel(s, function(b){
    b.appendChild(h("h3","","MY HEADQUARTERS")); b.appendChild(h("p","","Owner: "+userName()));
    var prog = h("p","fwstat"), list = h("div"), info = h("p"); b.appendChild(prog); b.appendChild(list); b.appendChild(info);
    function own(id){ return dbReady(s) && !!d.owned[id]; }
    function need(id){ var c = d.cat[id], rq = c && c.requires; return rq && !own(rq) ? rq : null; }
    var flow = buyFlow(s, b, function(){ return sel && !need(sel) ? [sel] : []; }, function(){ draw(); });
    function draw(){
      var n = HQ_ITEMS.filter(function(it){ return own(it[0]); }).length; prog.textContent = "Built "+n+" of "+HQ_ITEMS.length+"   "+bar(n, HQ_ITEMS.length);
      list.innerHTML = ""; HQ_ITEMS.forEach(function(it){ var o = own(it[0]), pc = price(s, it[0]); var bt = h("button","fwbtn fwitem"+(sel === it[0] ? " on" : "")); bt.type = "button"; bt.appendChild(h("span","",it[1])); bt.appendChild(h("span","", o ? "Built \u2713" : (pc != null ? money(pc) : "\u2013")));
        bt.addEventListener("click", function(){ sel = it[0]; draw(); }); list.appendChild(bt); });
      var it = HQ_ITEMS.filter(function(x){ return x[0] === sel; })[0];
      info.textContent = !dbReady(s) ? (d.err === "login" ? "Log in to build your headquarters." : "Prices are loading. Close and reopen in a moment.") : !it ? "Tap an upgrade to see it." : it[2]+(own(sel) ? "  You have built this." : (need(sel) ? "  Build the "+ITEMS[need(sel)].name+" first." : ""));
      flow.reset();
    }
    closeBtn(s, b); draw();
  });
}
function trainingPanel(s){
  infoPanel(s, "BUZZ TRAINING CENTRE", ["Where future superstars will be developed and where managers will take on challenges.", "Training sessions and manager challenges open in a later update."]);
}

/* ---------- live wrestling at Buzz Arena (Phase 6) ---------- */
var RING_Y = 1.25;
function hash32(str){ var h = 2166136261; for(var i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mkRng(seed){ var a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shadeHex(c, k){ return (Math.min(255, Math.round(((c>>16)&255)*k)) << 16) | (Math.min(255, Math.round(((c>>8)&255)*k)) << 8) | Math.min(255, Math.round((c&255)*k)); }
var SKINS6 = [0xe0ac82,0xc68642,0x8d5524,0xf1c27d,0xffdbac,0x6b4423], HAIRS6 = [0x1a1410,0x4a2c12,0x0e0e0e,0x8a6a2a,0xb5651d,0x3a3a3a];
var GEAR = [[0xE01B32,0xf2f2f2],[0x2f6fdb,0xEDBA3E],[0x15151a,0xE01B32],[0x27ae60,0x15151a],[0x8e44ad,0xf2f2f2],[0xEDBA3E,0x15151a],[0xf2f2f2,0xE01B32],[0xff7a1a,0x15151a]];
var FINISHERS = ["Thunder Bomb","Buzz Driver","Crown Slam","Final Rumble","Iron Clutch","Skyfall","Golden Spear","Title Shot"];
/* the same name always gives the same look and fighting style */
function wrestlerLook(name){ var hh = hash32(name), g = GEAR[hh % GEAR.length];
  return {name:name, skin:SKINS6[(hh>>3) % SKINS6.length], hair:HAIRS6[(hh>>6) % HAIRS6.length], trunks:g[0], trim:g[1], boots:((hh>>9) % 2) ? 0x15151a : g[1], tights:((hh>>11) % 3) === 0, finisher:FINISHERS[(hh>>15) % FINISHERS.length], style:(hh>>18) % 3}; }

/* ---- a wrestler you can pose: torso, head, two arms, two legs ---- */
var STAND = {rx:0, rz:0, y:0, tor:0, torz:0, hx:0, aLx:-0.45, aLz:0.14, aRx:-0.45, aRz:-0.14, lLx:0, lLz:0.06, lRx:0, lRz:-0.06};
var GUARD = {aLx:-0.95, aRx:-0.95, aLz:0.25, aRz:-0.25, tor:0.12, lLx:-0.12, lRx:0.12};
function pz(o){ var p = {}, k; for(k in STAND) p[k] = STAND[k]; if(o) for(k in o) p[k] = o[k]; return p; }
function makeWrestler(o){
  var g = new T.Group(), root = new T.Group(), sm = M(o.skin), tr = M(o.trunks), tm = M(o.trim), bt = M(o.boots), legM = o.tights ? tr : sm, top = o.shirt != null ? M(o.shirt) : sm;
  root.position.y = 1.0; g.add(root);
  box(root,0.8,0.36,0.46,tr,0,0,0); box(root,0.82,0.07,0.48,tm,0,0.18,0);
  var tor = new T.Group(); tor.position.set(0,0.1,0); root.add(tor); box(tor,0.86,0.95,0.44,top,0,0.5,0);
  if(o.shirt == null){ var dk = M(shadeHex(o.skin, 0.82)); box(tor,0.4,0.05,0.05,dk,-0.2,0.62,0.23); box(tor,0.4,0.05,0.05,dk,0.2,0.62,0.23); box(tor,0.05,0.5,0.05,dk,0,0.5,0.23); box(tor,0.36,0.04,0.05,dk,0,0.46,0.23); box(tor,0.36,0.04,0.05,dk,0,0.3,0.23); }
  else if(o.stripes){ var bk = M(0x0b0b0f); [0.2,0.46,0.72].forEach(function(y){ box(tor,0.88,0.1,0.46,bk,0,y,0); }); }
  box(tor,0.22,0.16,0.22,sm,0,1.06,0);
  var hd = new T.Group(); hd.position.set(0,1.22,0); tor.add(hd);
  var head = new T.Mesh(new T.BoxGeometry(0.62,0.62,0.6), [sm,sm,sm,sm,faceMat(o.skin, o.hair),sm]); head.position.y = 0.2; hd.add(head);
  var hm = M(o.hair); box(hd,0.68,0.2,0.66,hm,0,0.58,-0.02); box(hd,0.68,0.5,0.14,hm,0,0.36,-0.3); box(hd,0.07,0.26,0.52,hm,-0.335,0.42,-0.02); box(hd,0.07,0.26,0.52,hm,0.335,0.42,-0.02); box(hd,0.56,0.09,0.06,hm,0,0.53,0.31);
  [-1,1].forEach(function(sd){ box(hd,0.06,0.16,0.1,sm,sd*0.34,0.18,0); });
  function arm(sd){ var pv = new T.Group(); pv.position.set(sd*0.58,0.88,0); tor.add(pv); box(pv,0.28,0.9,0.3,o.shirt != null ? top : sm,0,-0.45,0); box(pv,0.32,0.2,0.34,tm,0,-0.42,0); box(pv,0.3,0.1,0.32,M(0xf2f2f2),0,-0.78,0); box(pv,0.26,0.2,0.28,sm,0,-0.96,0); return pv; }
  function leg(sd){ var pv = new T.Group(); pv.position.set(sd*0.2,-0.18,0); root.add(pv); box(pv,0.36,0.82,0.4,legM,0,-0.41,0); box(pv,0.4,0.2,0.44,tm,0,-0.42,0.02); box(pv,0.4,0.38,0.5,bt,0,-0.64,0.05); return pv; }
  var aL = arm(-1), aR = arm(1), lL = leg(-1), lR = leg(1);
  if(o.label !== false){ var lbl = label(o.name, 3.2); lbl.position.set(0,3.4,0); g.add(lbl); }
  var Q = pz(), Tg = pz(), rate = 12, wt = 0;
  var w = {g:g, id:o.id || 0, name:o.name, walking:false, hdg:0, tw:null, ac:null, lf:null, ly:0, base:0, joints:{root:root, tor:tor, hd:hd, aL:aL, aR:aR, lL:lL, lR:lR}};
  w.set = function(p, r){ for(var k in p) Tg[k] = p[k]; rate = r || 12; };
  w.snap = function(p){ for(var k in p){ Tg[k] = p[k]; Q[k] = p[k]; } };
  w.go = function(x, z, d, now){ w.tw = {t0:now, t1:now + Math.max(0.05, d), x0:g.position.x, z0:g.position.z, x1:x, z1:z}; };
  w.look = function(x, z){ w.hdg = Math.atan2(x - g.position.x, z - g.position.z); };
  w.arc = function(hh, d, now){ w.ac = {t0:now, t1:now + d, h:hh}; };
  w.lift = function(y, d, now){ w.lf = {t0:now, t1:now + Math.max(0.05, d), y0:w.ly, y1:y}; };
  w.update = function(dt, now){
    var k = 1 - Math.exp(-dt*rate), key; for(key in Tg) Q[key] += (Tg[key] - Q[key]) * k;
    var sw = 0; if(w.walking){ wt += dt*7.5; sw = Math.sin(wt); }
    root.rotation.x = Q.rx; root.rotation.z = Q.rz; root.position.y = 1.0 + Q.y; tor.rotation.x = Q.tor; tor.rotation.z = Q.torz; hd.rotation.x = Q.hx;
    aL.rotation.x = Q.aLx - sw*0.6; aR.rotation.x = Q.aRx + sw*0.6; aL.rotation.z = Q.aLz; aR.rotation.z = Q.aRz; lL.rotation.x = Q.lLx + sw*0.7; lR.rotation.x = Q.lRx - sw*0.7; lL.rotation.z = Q.lLz; lR.rotation.z = Q.lRz;
    if(w.tw){ var u = Math.max(0, Math.min(1, (now - w.tw.t0)/(w.tw.t1 - w.tw.t0))), e = u*u*(3 - 2*u); g.position.x = w.tw.x0 + (w.tw.x1 - w.tw.x0)*e; g.position.z = w.tw.z0 + (w.tw.z1 - w.tw.z0)*e; if(u >= 1) w.tw = null; }
    if(w.lf){ var u2 = Math.max(0, Math.min(1, (now - w.lf.t0)/(w.lf.t1 - w.lf.t0))), e2 = u2*u2*(3 - 2*u2); w.ly = w.lf.y0 + (w.lf.y1 - w.lf.y0)*e2; if(u2 >= 1) w.lf = null; }
    var ar = 0; if(w.ac){ var u3 = Math.max(0, Math.min(1, (now - w.ac.t0)/(w.ac.t1 - w.ac.t0))); ar = Math.sin(Math.PI*u3)*w.ac.h; if(u3 >= 1) w.ac = null; }
    g.position.y = w.base + w.ly + ar; g.rotation.y += C.angDiff(g.rotation.y, w.hdg) * (1 - Math.exp(-dt*9));
  };
  return w;
}

/* ---- the arena: ring, stage and ramp, stands full of fans, lights ---- */
function buildArena(info){
  var sc = new T.Scene(); sc.background = new T.Color(0x07070c); sc.fog = new T.Fog(0x07070c, 45, 120);
  sc.add(new T.AmbientLight(0x8a8aaa, 0.9)); var key = new T.DirectionalLight(0xffffff, 0.45); key.position.set(6,20,10); sc.add(key);
  var ringLight = new T.PointLight(0xfff1dc, 1.15, 60); ringLight.position.set(0,11,0); sc.add(ringLight);
  var redL = new T.PointLight(0xff2a40, 0.9, 40); redL.position.set(0,6,-24); sc.add(redL); var blueL = new T.PointLight(0x3a6bff, 0.7, 50); blueL.position.set(0,8,14); sc.add(blueL);
  var floor = new T.Mesh(new T.PlaneGeometry(200,200), M(0x14141c)); floor.rotation.x = -Math.PI/2; sc.add(floor);
  var wall = new T.Mesh(new T.CylinderGeometry(52,52,40,40,1,true), new T.MeshLambertMaterial({color:0x0c0c14, side:T.BackSide})); wall.position.y = 18; sc.add(wall);
  /* ring */
  box(sc,8.4,1.2,8.4,M(0xb3122a),0,0.6,0); box(sc,7.8,0.12,7.8,M(0x24366e),0,1.2,0);
  var logo = new T.Mesh(new T.PlaneGeometry(4.6,1.6), new T.MeshBasicMaterial({map:textTex("BUZZ", 512, 180, "#24366e", "#ffffff", null), transparent:true})); logo.rotation.x = -Math.PI/2; logo.position.set(0,1.27,0); sc.add(logo);
  [[0,4.22,0],[Math.PI,-4.22,0],[Math.PI/2,0,4.22],[-Math.PI/2,0,-4.22]].forEach(function(f,i){ var sg = new T.Mesh(new T.PlaneGeometry(7,0.9), new T.MeshBasicMaterial({map:textTex("WRESTLING BUZZ", 512, 66, "#b3122a", "#ffffff", null)})); if(i < 2){ sg.position.set(0,0.6,i === 0 ? 4.22 : -4.22); sg.rotation.y = i === 0 ? 0 : Math.PI; } else { sg.position.set(i === 2 ? 4.22 : -4.22,0.6,0); sg.rotation.y = i === 2 ? Math.PI/2 : -Math.PI/2; } sc.add(sg); });
  var pads = [0xE01B32,0xf2f2f2,0x2f6fdb,0xf2f2f2];
  [[-3.7,-3.7],[3.7,-3.7],[3.7,3.7],[-3.7,3.7]].forEach(function(c, i){ cyl(sc,0.17,0.17,2.5,10,M(0x9a9aa8),c[0],RING_Y+1.25,c[1]); box(sc,0.5,1.5,0.5,M(pads[i]),c[0],RING_Y+1.15,c[1]); });
  [0.65,1.2,1.75].forEach(function(hh, i){ var col = M(i === 1 ? 0xf2f2f2 : 0xE01B32); box(sc,7.4,0.07,0.07,col,0,RING_Y+hh,-3.7); box(sc,7.4,0.07,0.07,col,0,RING_Y+hh,3.7); box(sc,0.07,0.07,7.4,col,-3.7,RING_Y+hh,0); box(sc,0.07,0.07,7.4,col,3.7,RING_Y+hh,0); });
  /* stage, screen, ramp */
  box(sc,20,1.2,7,M(0x15151d),0,0.6,-27.5); box(sc,3.6,0.2,19.5,M(0x23232e),0,0.1,-14.2);
  var scr = new T.Mesh(new T.PlaneGeometry(20,9), new T.MeshBasicMaterial({map:textTex(String(info.a).toUpperCase()+"  VS  "+String(info.b).toUpperCase(), 1024, 460, "#0a0a12", "#ffffff", info.title ? String(info.title).toUpperCase() : (info.show || "LIVE FROM BUZZ ARENA").toString().toUpperCase())})); scr.position.set(0,6.6,-31); sc.add(scr);
  var strips = []; for(var zz = -22; zz <= -6; zz += 1.6){ strips.push([-1.75,0.22,zz,1,1,1,0,0xEDBA3E],[1.75,0.22,zz,1,1,1,0,0xEDBA3E]); } instanced(sc, new T.BoxGeometry(0.12,0.05,0.5), MB(0xffffff), strips);
  /* stands and fans (a horseshoe round the ring, open at the stage end) */
  var TIERS = 4, ARC = 2.35, bases = [], cols = [0xE01B32,0xf2f2f2,0x2f6fdb,0x15151a,0xEDBA3E,0x27ae60,0x8e44ad,0xff7a1a], skins = SKINS6;
  var barrier = new T.Mesh(new T.CylinderGeometry(9,9,1.1,40,1,true,-ARC,ARC*2), new T.MeshLambertMaterial({color:0x1e3a8a, side:T.DoubleSide})); barrier.position.y = 0.55; sc.add(barrier);
  for(var ti = 0; ti < TIERS; ti++){
    var R = 13 + ti*2.6, H = (ti + 1)*0.9; var st = new T.Mesh(new T.CylinderGeometry(R+1.3,R+1.3,H,48,1,false,-ARC,ARC*2), M(0x22222c)); st.position.y = H/2; sc.add(st);
    var n = Math.floor(R*ARC*2/1.05); for(var i = 0; i < n; i++){ var th = -ARC + (i + 0.5)/n*ARC*2, rr = R - 0.2; bases.push({x:Math.sin(th)*rr, z:Math.cos(th)*rr, y:H + 0.4, ry:th + Math.PI, ph:Math.random()*6.28, k:Math.random()}); }
  }
  var bl = bases.map(function(b, i){ return [b.x,b.y,b.z,1,1,1,0,cols[(i*7 + (i>>2)) % cols.length]]; }), hl = bases.map(function(b, i){ return [b.x,b.y + 0.62,b.z,1,1,1,0,skins[(i*5) % skins.length]]; });
  var bodies = instanced(sc, new T.BoxGeometry(0.5,0.8,0.4), M(0xffffff), bl), heads = instanced(sc, new T.BoxGeometry(0.34,0.34,0.34), M(0xffffff), hl);
  var crowd = {bases:bases, bodies:bodies, heads:heads, m:new T.Matrix4(), q:new T.Quaternion(), p:new T.Vector3(), s:new T.Vector3(1,1,1), up:new T.Vector3(0,1,0)};
  /* light beams and truss */
  var beams = []; for(var bi = 0; bi < 6; bi++){ var ang = bi/6*Math.PI*2, bx = Math.sin(ang)*10, bz = Math.cos(ang)*10, grp = new T.Group(); grp.position.set(bx,14,bz);
    var cone = new T.Mesh(new T.ConeGeometry(2.4,13,18,1,true), new T.MeshBasicMaterial({color:bi % 2 ? 0xff5a6a : 0x7aa6ff, transparent:true, opacity:0.09, blending:T.AdditiveBlending, side:T.DoubleSide, depthWrite:false})); cone.position.y = -6.5; grp.add(cone); sc.add(grp); beams.push({g:grp, dx:-bx/10, dz:-bz/10, ph:bi}); }
  var trussL = []; for(var li = 0; li < 14; li++){ var la = li/14*Math.PI*2; trussL.push([Math.sin(la)*8,14.3,Math.cos(la)*8,1,1,1,0,0xfff3b0]); } instanced(sc, new T.BoxGeometry(0.5,0.3,0.5), MB(0xffffff), trussL); cyl(sc,8.2,8.2,0.25,24,M(0x2a2a34),0,14.6,0);
  return {scene:sc, crowd:crowd, beams:beams};
}
function crowdUpdate(cr, tms, ex){
  var n = cr.bases.length, m = cr.m, q = cr.q, p = cr.p, sc = cr.s;
  for(var i = 0; i < n; i++){ var b = cr.bases[i], bob = Math.max(0, Math.sin(tms*(4 + b.k*3) + b.ph)) * (0.03 + ex*0.32); q.setFromAxisAngle(cr.up, b.ry);
    p.set(b.x, b.y + bob, b.z); m.compose(p, q, sc); cr.bodies.setMatrixAt(i, m); p.set(b.x, b.y + 0.62 + bob*1.1, b.z); m.compose(p, q, sc); cr.heads.setMatrixAt(i, m); }
  cr.bodies.instanceMatrix.needsUpdate = true; cr.heads.instanceMatrix.needsUpdate = true;
}

/* ---- sound: a synthesised crowd, hits and a bell (nothing to download) ---- */
function makeAudio(){
  var AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null;
  try{
    var c = new AC(), out = c.createGain(); out.gain.value = 0.9; out.connect(c.destination);
    var nb = c.createBuffer(1, c.sampleRate*2, c.sampleRate), d = nb.getChannelData(0); for(var i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1;
    var cs = c.createBufferSource(); cs.buffer = nb; cs.loop = true; var bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 600; bp.Q.value = 0.6; var cg = c.createGain(); cg.gain.value = 0.02; cs.connect(bp); bp.connect(cg); cg.connect(out); cs.start();
    function burst(freq, dur, vol, type){ var s = c.createBufferSource(); s.buffer = nb; var f = c.createBiquadFilter(); f.type = type || "lowpass"; f.frequency.value = freq; var g = c.createGain(), t = c.currentTime; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.05); }
    function tone(freq, dur, vol){ var o = c.createOscillator(); o.type = "sine"; o.frequency.value = freq; var g = c.createGain(), t = c.currentTime; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05); }
    return {ctx:c, crowd:function(level){ cg.gain.setTargetAtTime(0.025 + level*0.2, c.currentTime, 0.25); bp.frequency.setTargetAtTime(500 + level*700, c.currentTime, 0.3); },
      hit:function(k){ burst(k >= 3 ? 140 : k === 2 ? 230 : 450, k >= 3 ? 0.5 : k === 2 ? 0.34 : 0.16, k >= 3 ? 0.95 : k === 2 ? 0.7 : 0.4); }, slap:function(){ burst(1100, 0.1, 0.45, "bandpass"); },
      bell:function(){ tone(880, 1.8, 0.35); tone(1320, 1.3, 0.2); setTimeout(function(){ tone(880, 1.4, 0.3); }, 380); }, mute:function(m){ out.gain.value = m ? 0 : 0.9; }, close:function(){ try{ c.close(); }catch(e){} }};
  }catch(e){ return null; }
}

/* ---- the match: a scripted timeline built from the real result ---- */
var LINES = {
  strike:["{a} fires off a hard strike!","A stiff shot to the jaw from {a}!","Big right hand from {a}!"], chop:["Listen to that chop echo! {a} lays it in.","{a} cuts across the chest of {v}!"],
  clothesline:["{a} runs in... CLOTHESLINE!","Down goes {v}! What a clothesline from {a}!"], slam:["{a} hoists {v} up high... and SLAMS {v} down!","What a body slam from {a}!"],
  dropkick:["{a} takes flight... DROPKICK!","High flying dropkick from {a}!"], whip:["{a} sends {v} to the ropes...","{v} is whipped hard into the ropes!"],
  tie:["Collar and elbow tie-up in the middle of the ring.","The two lock up, each looking for an early edge."], taunt:["{a} fires up the crowd!","The fans are on their feet for {a}!"], near:["That was CLOSE! {v} kicks out!","So close! Another two count!"], gasp:["How did {v} kick out of that?!","The crowd can't believe it!"]
};
function scriptMatch(m){
  var A = m.A, B = m.B, R = m.ref, rng = m.rng, info = m.info, ev = [], pos = {}, lyingDir = {};
  var winner = info.winner === info.a ? A : B, loser = winner === A ? B : A, rating = Math.max(1, Math.min(99, info.rating|0 || 60));
  function E(t, f){ ev.push({t:t, f:f}); }
  function P_(w){ return pos[w.id]; }
  function cl(v){ return Math.max(-2.9, Math.min(2.9, v)); }
  function pose(t, w, p, r){ var pp = pz(p); E(t, function(){ w.set(pp, r); }); }
  function goFree(t, w, x, z, d){ pos[w.id] = {x:x, z:z}; E(t, function(now){ w.go(x, z, d, now); }); }
  function go(t, w, x, z, d){ goFree(t, w, cl(x), cl(z), d); }
  function face(t, w, x, z){ E(t, function(){ w.look(x, z); }); }
  function cap(t, text){ E(t, function(){ m.ui.cap(text); }); }
  function fx(t, kind){ E(t, function(){ m.fx(kind); }); }
  function shot(t, name){ E(t, function(){ m.shot(name); }); }
  function line(arr, a, v){ return arr[Math.floor(rng()*arr.length)].replace(/\{a\}/g, a ? a.name : "").replace(/\{v\}/g, v ? v.name : ""); }
  function dirAV(a, v){ var pa = P_(a), pv = P_(v), dx = pv.x - pa.x, dz = pv.z - pa.z, d = Math.sqrt(dx*dx + dz*dz); if(d < 0.2){ dx = 1; dz = 0; d = 1; } return {x:dx/d, z:dz/d}; }
  function refTo(t, mx, mz, ux, uz, side){ go(t, R, mx + (-uz)*2.2*side, mz + ux*2.2*side, 0.7); face(t, R, mx, mz); pose(t, R, {aLx:-0.4, aRx:-0.4}, 8); }
  /* both step to a fighting distance around the middle of the ring */
  function place(t, a, v, dist){ var pa = P_(a), pv = P_(v), mx = (pa.x + pv.x)/4, mz = (pa.z + pv.z)/4, u = dirAV(a, v);
    go(t, a, mx - u.x*dist/2, mz - u.z*dist/2, 0.35); go(t, v, mx + u.x*dist/2, mz + u.z*dist/2, 0.35); face(t, a, mx + u.x*dist/2, mz + u.z*dist/2); face(t, v, mx - u.x*dist/2, mz - u.z*dist/2);
    pose(t, a, GUARD, 10); pose(t, v, GUARD, 10); refTo(t, mx, mz, u.x, u.z, rng() < 0.5 ? 1 : -1); return u; }
  function fall(t, v, u, slide){ var pv = P_(v); E(t, function(){ v.hdg = Math.atan2(-u.x, -u.z); });
    pose(t, v, {rx:-1.5708, y:-0.73, aLx:-0.15, aRx:-0.15, aLz:0.7, aRz:-0.7, lLx:0.05, lRx:-0.05}, 16); go(t, v, pv.x + u.x*slide, pv.z + u.z*slide, 0.4); lyingDir[v.id] = u; }
  function rise(t, v){ pose(t, v, GUARD, 4.5); delete lyingDir[v.id]; return 1.3; }
  function bigShot(t){ shot(t, rng() < 0.5 ? "close" : "hard"); }

  function lockup(t, a, v){ var u = place(t, a, v, 1.0); bigShot(t); var s = t + 0.5; pose(s, a, {aLx:-1.25, aRx:-1.25, aLz:0.1, aRz:-0.1, tor:0.35}, 10); pose(s, v, {aLx:-1.25, aRx:-1.25, aLz:0.1, aRz:-0.1, tor:0.35}, 10);
    cap(s, line(LINES.tie, a, v)); var pv = P_(v); pose(s + 1.5, v, {tor:-0.35, aLx:-0.5, aRx:-0.5}, 8); go(s + 1.5, v, pv.x + u.x*0.8, pv.z + u.z*0.8, 0.4); fx(s + 1.55, "hit1"); pose(s + 2.0, a, GUARD, 8); pose(s + 2.4, v, GUARD, 6); return 2.9; }
  function strike(t, a, v){ var u = place(t, a, v, 1.4), s = t + 0.45, pa = P_(a), pv = P_(v); bigShot(t);
    pose(s, a, {aRx:-1.75, tor:0.3, aLx:-0.6, lLx:-0.3}, 18); go(s, a, pa.x + u.x*0.3, pa.z + u.z*0.3, 0.18); cap(s, line(LINES.strike, a, v));
    pose(s + 0.14, v, {tor:-0.4, hx:-0.4, aLx:-0.3, aRx:-0.3}, 18); go(s + 0.14, v, pv.x + u.x*0.45, pv.z + u.z*0.45, 0.35); fx(s + 0.14, "hit1"); pose(s + 0.5, a, GUARD, 8); pose(s + 0.95, v, GUARD, 7); return 1.9; }
  function chop(t, a, v){ var u = place(t, a, v, 1.3), s = t + 0.45, pv = P_(v); bigShot(t);
    pose(s, a, {aRx:-0.9, aRz:1.5, tor:0.2}, 16); pose(s + 0.16, a, {aRx:-0.9, aRz:-0.5, tor:0.3}, 20); cap(s, line(LINES.chop, a, v));
    pose(s + 0.2, v, {tor:0.55, hx:0.3, aLx:-0.6, aRx:-0.6}, 16); go(s + 0.2, v, pv.x + u.x*0.4, pv.z + u.z*0.4, 0.3); fx(s + 0.2, "hit1"); pose(s + 0.55, a, GUARD, 8); pose(s + 1.0, v, GUARD, 6); return 1.9; }
  function clothesline(t, a, v, keep){ var u = place(t, a, v, 1.4), s = t + 0.45, pa = P_(a), pv = P_(v); shot(s, "close");
    go(s, a, pa.x - u.x*1.6, pa.z - u.z*1.6, 0.55); var run = s + 0.75; cap(s, line(LINES.clothesline, a, v));
    var hx = pv.x - u.x*0.8, hz = pv.z - u.z*0.8; E(run, function(){ a.walking = true; }); pose(run, a, {aRx:-1.3, aRz:1.25, tor:0.35, aLx:-0.4}, 9); go(run, a, hx, hz, 0.5); E(run + 0.5, function(){ a.walking = false; });
    var ht = run + 0.42; fall(ht, v, u, 0.7); fx(ht, "hit2"); pose(run + 0.9, a, GUARD, 6); go(run + 0.55, a, hx + u.x*0.5, hz + u.z*0.5, 0.5);
    if(keep) return run + 1.2 - t; var rt = run + 2.4; return rt + rise(rt, v) - t; }
  function slam(t, a, v, keep, big, name){ var u = place(t, a, v, 1.2), s = t + 0.45, pa = P_(a); shot(s, "close");
    pose(s, a, {aLx:-0.95, aRx:-0.95, tor:0.35}, 10); cap(s, name ? name.replace("{a}", a.name).replace("{v}", v.name) : line(LINES.slam, a, v)); go(s + 0.2, v, pa.x + u.x*0.1, pa.z + u.z*0.1, 0.5); E(s + 0.2, function(){ v.hdg = Math.atan2(-u.x, -u.z); });
    pose(s + 0.2, v, {rx:-1.5708, y:-0.3, aLx:-0.2, aRx:-0.2, aLz:0.6, aRz:-0.6}, 11); var up = big ? 2.9 : 2.5; E(s + 0.9, function(now){ v.lift(up, 0.6, now); });
    pose(s + 0.9, a, {aLx:-2.9, aRx:-2.9, aLz:0.12, aRz:-0.12, tor:-0.22}, 9); var sl = s + 2.0 + (big ? 0.6 : 0);
    go(sl - 0.3, v, pa.x + u.x*1.0, pa.z + u.z*1.0, 0.3); E(sl, function(now){ v.lift(0, 0.22, now); }); pose(sl, v, {rx:-1.5708, y:-0.73, aLx:-0.15, aRx:-0.15, aLz:0.7, aRz:-0.7}, 18); pose(sl + 0.05, a, {tor:0.6, aLx:-0.5, aRx:-0.5}, 12);
    fx(sl + 0.22, big ? "hit3" : "hit2"); lyingDir[v.id] = u; pose(sl + 0.8, a, GUARD, 6); if(keep) return sl + 1.0 - t; var rt = sl + 1.8; return rt + rise(rt, v) - t; }
  function dropkick(t, a, v, keep){ var u = place(t, a, v, 1.4), s = t + 0.45, pa = P_(a), pv = P_(v); shot(s, "hard");
    go(s, a, pa.x - u.x*1.0, pa.z - u.z*1.0, 0.4); cap(s + 0.3, line(LINES.dropkick, a, v)); var j = s + 0.6, hx = pv.x - u.x*0.95, hz = pv.z - u.z*0.95;
    E(j, function(now){ a.arc(0.95, 0.6, now); }); pose(j, a, {rx:-0.85, lLx:-1.45, lRx:-1.45, aLx:-0.6, aRx:-0.6, aLz:0.8, aRz:-0.8}, 14); go(j, a, hx, hz, 0.5);
    var ht = j + 0.42; fall(ht, v, u, 0.9); fx(ht, "hit2"); pose(j + 0.62, a, {rx:-1.5708, y:-0.73, aLz:0.7, aRz:-0.7}, 14); go(j + 0.62, a, hx - u.x*0.3, hz - u.z*0.3, 0.3);
    var ra = j + 1.7; pose(ra, a, GUARD, 4.5); if(keep) return ra + 1.0 - t; var rt = ra + 0.2; return rt + rise(rt, v) - t; }
  function whipLine(t, a, v){ var u = place(t, a, v, 1.5), s = t + 0.45, pv = P_(v); bigShot(t); cap(s, line(LINES.whip, a, v)); pose(s, a, {aRx:-1.0, aLx:-1.0, tor:0.2}, 10);
    var rx = pv.x + u.x*2.2, rz = pv.z + u.z*2.2; E(s + 0.3, function(){ v.walking = true; }); pose(s + 0.3, v, {tor:0.2, aLx:-0.4, aRx:-0.4}, 8); go(s + 0.3, v, rx, rz, 0.9); fx(s + 1.25, "hit1");
    pose(s + 1.25, v, {tor:-0.4, aLx:-0.7, aRx:-0.7}, 14); var ba = P_(a), bx = ba.x + u.x*0.9, bz = ba.z + u.z*0.9; pose(s + 1.45, v, {tor:0.2, aLx:-0.4, aRx:-0.4}, 9); go(s + 1.45, v, bx, bz, 0.9); face(s + 1.45, v, ba.x, ba.z);
    pose(s + 1.7, a, {aRx:-1.3, aRz:1.25, tor:0.3}, 12); E(s + 2.35, function(){ v.walking = false; }); fall(s + 2.3, v, u, 0.7); fx(s + 2.3, "hit2"); pose(s + 2.6, a, GUARD, 8); var rt = s + 4.0; return rt + rise(rt, v) - t; }
  function kick(t, a, v, keep, name){ var u = place(t, a, v, 1.6), s = t + 0.45, pv = P_(v); shot(s, "close"); cap(s, name.replace("{a}", a.name).replace("{v}", v.name));
    pose(s, a, {tor:-0.35, lRx:0, aLx:-0.9, aRx:-0.9}, 10); pose(s + 0.55, a, {tor:-0.6, lRx:-1.75, aLx:-0.5, aRx:-0.5, rx:-0.2}, 20); pose(s + 0.55, v, {tor:0.1}, 10);
    fall(s + 0.7, v, u, 0.8); fx(s + 0.7, "hit3"); pose(s + 1.3, a, GUARD, 7); if(keep) return s + 1.6 - t; var rt = s + 2.6; return rt + rise(rt, v) - t; }
  /* pin: v is lying (face up). count = how far the ref gets; 3 = it is over */
  function pin(t, a, v, count){ var u = lyingDir[v.id] || {x:1, z:0}, pv = P_(v), p = {x:-u.z, z:u.x}; shot(t, "close");
    go(t, a, pv.x + p.x*1.3, pv.z + p.z*1.3, 0.5); face(t, a, pv.x, pv.z); pose(t, a, GUARD, 9);
    var s = t + 0.7, ax = pv.x - u.x*0.15, az = pv.z - u.z*0.15; go(s, a, ax, az, 0.3); E(s, function(){ a.hdg = Math.atan2(u.x, u.z); }); pose(s, a, {rx:1.5708, y:-0.32, aLx:-0.4, aRx:-0.4}, 12);
    go(t, R, pv.x - p.x*1.7, pv.z - p.z*1.7, 0.7); face(t, R, pv.x, pv.z); var kneel = {y:-0.55, lLx:-1.35, lRx:-1.35, tor:0.45, aLx:-0.5, aRx:-1.4, hx:0.2};
    pose(s, R, kneel, 8); cap(s, count >= 3 ? "{a} hooks the leg for the pin!".replace("{a}", a.name) : "{a} goes for the cover!".replace("{a}", a.name)); shot(s, "low");
    var end = s;
    for(var i = 1; i <= count; i++){ (function(n){ var ct = s + 0.55 + n*0.85; pose(ct - 0.42, R, {y:-0.55, lLx:-1.35, lRx:-1.35, tor:0.45, aLx:-0.5, aRx:-1.95, hx:0.2}, 20); pose(ct, R, kneel, 22); E(ct, function(){ m.ui.count(n); }); fx(ct, "slap"); end = ct; })(i); }
    if(count < 3){ var kt = end + 0.45; pose(kt, v, {rx:-1.05, y:-0.55, aLx:-0.2, aRx:-0.2, aLz:0.7, aRz:-0.7}, 22); pose(kt, a, STAND, 14); E(kt, function(){ a.hdg = Math.atan2(u.x, u.z); }); go(kt, a, ax - p.x*1.4, az - p.z*1.4, 0.35);
      cap(kt, line(LINES.near, null, v).replace("{v}", v.name)); fx(kt, "gasp"); shot(kt, "ring"); pose(kt + 1.3, a, GUARD, 5); var rr = kt + 1.0; delete lyingDir[v.id]; pose(rr, v, GUARD, 4); pose(kt, R, {aLx:-0.4, aRx:-0.4}, 8); return rr + 1.3 - t; }
    return end - t + 0.6; }

  /* ---- entrances ---- */
  var T0 = 2.0;
  function entrance(t, w, cx, who){
    E(t, function(now){ w.g.visible = true; w.base = 0.2; w.g.position.set(cx, 0.2, -23); w.walking = true; w.hdg = 0; w.set(pz({aLx:-0.45, aRx:-0.45}), 8); m.focus(w); m.shot("ramp"); m.ui.cap("Making their way to the ring... " + w.name + "!"); m.fx("cheer"); });
    goFree(t, w, cx*0.5, -17, 2.4); E(t + 2.5, function(){ w.walking = false; w.set(pz({aLx:-2.6, aRx:-2.6, aLz:0.45, aRz:-0.45}), 7); m.fx("cheer"); });
    E(t + 4.1, function(now){ w.walking = true; w.set(pz({}), 8); w.go(0, -5.4, 3.6, now); }); pos[w.id] = {x:0, z:-5.4};
    var inT = t + 7.8; E(inT, function(now){ w.walking = false; w.lift(RING_Y - 0.2, 0.8, now); w.arc(0.5, 0.8, now); w.go(cx, -2.3, 0.9, now); m.shot("close"); });
    E(inT + 0.4, function(){ w.base = 0.2; }); pos[w.id] = {x:cx, z:-2.3};
    E(inT + 1.0, function(now){ w.base = RING_Y; w.ly = 0; w.lf = null; w.hdg = Math.PI*(cx < 0 ? 0.18 : -0.18); w.set(pz({aLx:-2.7, aRx:-2.7, aLz:0.5, aRz:-0.5}), 7); m.fx("cheer"); });
    return inT + 2.6; }
  // the wrestlers keep their ring height once in the ring: base is raised at the step-in moment
  E(0.2, function(){ m.ui.cap("Welcome to Buzz Arena! " + (info.show ? info.show + " is LIVE!" : "Tonight's main event is next!")); m.fx("cheer"); m.shot("crowd"); });
  if(info.title) E(1.2, function(){ m.ui.cap("The " + info.title + " is on the line!"); });
  var inA = entrance(T0, A, -2.4, "a"), inB = entrance(T0 + 9.5, B, 2.4, "b"), bellT = inB + 2.2;
  go(0, R, 2.6, 1.8, 0.1); E(0, function(){ R.g.visible = true; R.base = RING_Y; R.g.position.set(2.6, RING_Y, 1.8); R.hdg = Math.PI*1.2; });
  E(bellT - 1.2, function(){ m.ui.cap("The referee calls for the bell..."); m.shot("ring"); });
  E(bellT, function(){ m.fx("bell"); m.ui.cap("DING DING DING! The match is underway!"); m.ui.live(); });
  go(bellT - 0.9, A, -1.1, 0, 0.8); go(bellT - 0.9, B, 1.1, 0, 0.8); face(bellT - 0.9, A, 1.1, 0); face(bellT - 0.9, B, -1.1, 0); pose(bellT - 0.9, A, GUARD, 8); pose(bellT - 0.9, B, GUARD, 8);

  /* ---- the fight, shaped by the real result ---- */
  var t = bellT + 0.8;
  function pick(w){ var s = w.style, pool = s === 1 ? ["slam","clothesline","whip","chop"] : s === 2 ? ["dropkick","strike","whip","clothesline"] : ["strike","chop","clothesline","strike"]; return pool[Math.floor(rng()*pool.length)]; }
  function doMove(name, a, v, keep){
    var d; if(name === "strike") d = strike(t, a, v); else if(name === "chop") d = chop(t, a, v); else if(name === "clothesline") d = clothesline(t, a, v, keep); else if(name === "slam") d = slam(t, a, v, keep, false); else if(name === "dropkick") d = dropkick(t, a, v, keep); else d = whipLine(t, a, v);
    t += d; return d; }
  var KO = {clothesline:1, slam:1, dropkick:1};
  function offence(a, v, nearFall){
    var name = pick(a), knock = !!KO[name] || name === "whip"; if(name === "whip"){ doMove(name, a, v, false); return; }
    if(nearFall && KO[name]){ doMove(name, a, v, true); t += pin(t, a, v, 2); }
    else doMove(name, a, v, false); }
  t += lockup(t, loser, winner);                                         /* the other side takes the early lead */
  var n1 = 2 + (rating > 55 ? 1 : 0); for(var i = 0; i < n1; i++) offence(loser, winner, i === n1 - 1 && rating >= 35);
  E(t, function(){ m.ui.cap("The crowd is rallying behind " + winner.name + "!"); m.fx("cheer"); m.shot("crowd"); }); pose(t, winner, {aLx:-2.6, aRx:-2.6, aLz:0.45, aRz:-0.45}, 8); t += 1.4;   /* the comeback */
  var pv0 = P_(winner); pose(t, winner, GUARD, 8);
  doMove("strike", winner, loser); doMove(winner.style === 2 ? "dropkick" : "strike", winner, loser); offence(winner, loser, rating >= 55);
  var n3 = Math.max(0, Math.floor((rating - 45)/14)); for(var j = 0; j < n3; j++){ var atk = rng() < 0.5 ? loser : winner, vic = atk === winner ? loser : winner; offence(atk, vic, rating >= 70 && j === n3 - 1); }
  if(rating >= 80){ E(t, function(){ m.ui.cap("This is a classic! Both of them have given everything!"); m.fx("cheer"); }); t += 1.4; }
  /* the finish */
  E(t, function(){ m.ui.cap(winner.name + " is setting up for the " + winner.finisher + "!"); m.fx("gasp"); m.shot("close"); });
  var fin = winner.style === 0 ? kick(t + 1.2, winner, loser, true, "{a} hits the " + winner.finisher + "!!!") : slam(t + 1.2, winner, loser, true, true, "{a} hits the " + winner.finisher + "!!!");
  t += 1.2 + fin; t += pin(t, winner, loser, 3);
  E(t, function(){ m.ui.cap("ONE... TWO... THREE! It's over!"); m.fx("bell"); m.fx("cheer"); m.shot("close"); });
  var wp = P_(winner); go(t + 0.4, R, wp.x - 1.4, wp.z + 0.4, 0.8); face(t + 0.4, R, wp.x, wp.z); pose(t + 0.4, R, {aRx:-2.9, aRz:-0.2, aLx:-0.4}, 8);
  pose(t + 0.5, winner, {aLx:-2.8, aRx:-2.8, aLz:0.5, aRz:-0.5, rx:0, y:0}, 7); E(t + 0.5, function(){ winner.hdg = 0; });
  E(t + 1.5, function(){ m.ui.cap("Your winner... " + winner.name + "!"); m.shot("ring"); });
  var endT = t + 6.5; E(endT, function(){ m.done(); });
  ev.sort(function(x, y){ return x.t - y.t; });
  return {ev:ev, bellT:bellT, end:endT, winner:winner, loser:loser};
}

/* ---- watching: camera, sound, captions and buttons ---- */
var EXH = [{a:"Blaze Carter", b:"Iron Mike Thunder", winner:"Blaze Carter", rating:82, show:"Buzz Arena Exhibition"}, {a:"Nova Knight", b:"Crimson Fury", winner:"Crimson Fury", rating:68, title:"Buzz Championship"}, {a:"Big Tommy Steel", b:"Sky Dancer", winner:"Sky Dancer", rating:91, show:"Main Event"}];
function starsOf(r){ var n = Math.max(1, Math.min(5, Math.round(r/20))), o = ""; for(var i = 0; i < 5; i++) o += i < n ? "\u2605" : "\u2606"; return o; }
function watchUi(s, wt){
  var ui = h("div","fwwatchui"), top = h("div","fwwtop"), live = h("span","fwlive","LIVE"); live.style.display = "none"; top.appendChild(live);
  top.appendChild(h("b","", wt.info.a+"  vs  "+wt.info.b)); top.appendChild(h("small","", wt.info.title ? wt.info.title : (wt.info.show || ""))); ui.appendChild(top);
  var cnt = h("div"); cnt.id = "fww-count"; ui.appendChild(cnt); var cp = h("div"); cp.id = "fww-cap"; cp.style.display = "none"; ui.appendChild(cp);
  var bar = h("div","fwwbar"), shots = ["auto","ring","close","hard","crowd"], speeds = [1,2,4];
  function btn(label, fn){ var b = h("button","fwbtn",label); b.type = "button"; b.addEventListener("click", fn); bar.appendChild(b); return b; }
  var cb = btn("Camera: Auto", function(){ var i = (shots.indexOf(wt.shotMode)+1) % shots.length; wt.shotMode = shots[i]; if(shots[i] !== "auto") wt.shotName = shots[i]; cb.textContent = "Camera: "+shots[i].charAt(0).toUpperCase()+shots[i].slice(1); });
  var sb = btn("Sound: On", function(){ wt.mute = !wt.mute; if(wt.audio) wt.audio.mute(wt.mute); sb.textContent = "Sound: "+(wt.mute ? "Off" : "On"); });
  var pb = btn("Speed: 1x", function(){ var i = (speeds.indexOf(wt.speed)+1) % speeds.length; wt.speed = speeds[i]; pb.textContent = "Speed: "+speeds[i]+"x"; });
  var kb = btn("Skip intro", function(){ skipIntro(wt); });
  btn("Leave", function(){ endWatch(s); });
  ui.appendChild(bar);
  var res = h("div","fwwres"); ui.appendChild(res);
  wt.ui = {root:ui, live:live, cnt:cnt, cap:cp, skip:kb, res:res, capT:0, cntT:0};
  s.root.appendChild(ui);
  return {
    cap:function(text){ var e = wt.ui.cap; e.textContent = text; e.style.display = "block"; },
    count:function(n){ var e = wt.ui.cnt; e.textContent = String(n); e.style.display = "block"; clearTimeout(wt.ui.cntT); wt.ui.cntT = setTimeout(function(){ e.style.display = "none"; }, 750); },
    live:function(){ wt.ui.live.style.display = "inline-block"; wt.ui.skip.style.display = "none"; }
  };
}
function showResult(s, wt){
  var r = wt.ui.res, info = wt.info; r.innerHTML = ""; r.style.display = "flex"; var bx = h("div","fwbox");
  bx.appendChild(h("h3","","WINNER: "+String(info.winner).toUpperCase())); bx.appendChild(h("p","", info.a+" vs "+info.b+(info.title ? "  \u2022  "+info.title : "")));
  var rt = h("div","fwprice", "Match rating "+Math.round(info.rating)+" / 100"); bx.appendChild(rt); bx.appendChild(h("p","fwstat", starsOf(info.rating)));
  var again = h("button","fwbtn red","Watch again"); again.type = "button"; again.addEventListener("click", function(){ startWatch(s, info); }); bx.appendChild(again);
  var back = h("button","fwbtn","Leave the arena"); back.type = "button"; back.addEventListener("click", function(){ endWatch(s); }); bx.appendChild(back); r.appendChild(bx);
}
function stepScript(wt, d){
  wt.t += d; var sc = wt.sc;
  while(wt.i < sc.ev.length && sc.ev[wt.i].t <= wt.t){ var e = sc.ev[wt.i++]; e.f(e.t); }
  wt.A.update(d, wt.t); wt.B.update(d, wt.t); wt.R.update(d, wt.t);
}
function skipIntro(wt){
  if(wt.t >= wt.sc.bellT - 0.5) return; wt.skipping = true; var guard = 0;
  while(wt.t < wt.sc.bellT - 0.4 && guard++ < 2000) stepScript(wt, 0.05);
  wt.skipping = false;
}
function watchCam(wt, dt){
  var A = wt.A.g.position, B = wt.B.g.position, cam = wt.cam, tp = wt.tp, lk = wt.lp, name = wt.shotName;
  var mx = (A.x + B.x)/2, mz = (A.z + B.z)/2, my = RING_Y + 1.5, dx = B.x - A.x, dz = B.z - A.z, dd = Math.sqrt(dx*dx + dz*dz) || 1, px = -dz/dd*wt.side, pz2 = dx/dd*wt.side;
  if(name === "ramp" && wt.focus){ var f = wt.focus.g.position; tp.set(f.x + 5.2*wt.side, f.y + 2.3, f.z + 5.6); lk.set(f.x, f.y + 1.9, f.z); }
  else if(name === "close"){ tp.set(mx + px*5.2, my + 0.5, mz + pz2*5.2); lk.set(mx, my, mz); }
  else if(name === "low"){ tp.set(mx + px*3.4, RING_Y + 0.5, mz + pz2*3.4); lk.set(mx, RING_Y + 0.4, mz); }
  else if(name === "hard"){ tp.set(8.4*wt.side, RING_Y + 1.8, 8.4); lk.set(mx, my, mz); }
  else if(name === "crowd"){ tp.set(0, 8.6, 17.5); lk.set(0, 3.2, -3); }
  else { wt.ang += dt*0.14; tp.set(Math.cos(wt.ang)*11.5, RING_Y + 4.8, Math.sin(wt.ang)*11.5 - 2); lk.set(mx*0.5, my - 0.4, mz*0.5); }
  cam.position.lerp(tp, 1 - Math.exp(-dt*2.6)); wt.lk.lerp(lk, 1 - Math.exp(-dt*4)); 
  if(wt.shake > 0.01){ cam.position.x += (Math.random() - 0.5)*wt.shake; cam.position.y += (Math.random() - 0.5)*wt.shake; wt.shake *= Math.exp(-dt*5); }
  cam.lookAt(wt.lk);
}
function stepWatch(s, dt){
  var wt = s.watch, d = wt.done ? dt : dt*wt.speed, cam = wt.cam;
  if(Math.abs(cam.aspect - innerWidth/innerHeight) > 0.01){ cam.aspect = innerWidth/innerHeight; cam.updateProjectionMatrix(); }
  if(!wt.done) stepScript(wt, d);
  wt.ex += (0.22 - wt.ex) * Math.min(1, dt*0.35); wt.cf = (wt.cf||0) + 1; if(wt.cf % 2 === 0) crowdUpdate(wt.ar.crowd, wt.clock, wt.ex); wt.clock += dt;
  wt.ar.beams.forEach(function(b){ var sw = Math.sin(wt.clock*0.6 + b.ph)*0.18; b.g.rotation.x = -(0.62 + sw)*b.dz; b.g.rotation.z = (0.62 + Math.cos(wt.clock*0.5 + b.ph)*0.18)*b.dx; });
  if(wt.audio){ wt.ca = (wt.ca||0) + dt; if(wt.ca > 0.25){ wt.ca = 0; wt.audio.crowd(wt.ex); } }
  watchCam(wt, dt);
}
function startWatch(s, info){
  closePanel(s); if(s.watch) endWatch(s, true); faceCam(s, false); s.keys = {}; s.pedal = s.pedal || {}; s.pedal.gas = s.pedal.brake = s.pedal.hb = false;
  var la = wrestlerLook(info.a), lb = wrestlerLook(info.b), ar = buildArena(info);
  var A = makeWrestler(Object.assign({id:1}, la)), B = makeWrestler(Object.assign({id:2}, lb)), R = makeWrestler({id:3, name:"Referee", skin:0xe0ac82, hair:0x1a1410, trunks:0x0b0b0f, trim:0xf2f2f2, boots:0x0b0b0f, tights:true, shirt:0xf2f2f2, stripes:true, label:false});
  A.style = la.style; A.finisher = la.finisher; B.style = lb.style; B.finisher = lb.finisher;
  [A, B, R].forEach(function(w){ ar.scene.add(w.g); w.g.visible = false; });
  var cam = new T.PerspectiveCamera(52, innerWidth/innerHeight, 0.1, 220); cam.position.set(0, 9, 24);
  var wt = {scene:ar.scene, cam:cam, ar:ar, A:A, B:B, R:R, info:info, t:0, i:0, speed:1, shotMode:"auto", shotName:"crowd", ang:0.6, focus:null, side:1, tp:new T.Vector3(), lp:new T.Vector3(), lk:new T.Vector3(0,3,-3), ex:0.22, shake:0, clock:0, done:false, skipping:false, mute:false, audio:null};
  s.watch = wt; s.root.classList.add("fwwatching"); var ui = watchUi(s, wt); wt.audio = makeAudio(); if(wt.audio) wt.audio.crowd(0.22);
  var rng = mkRng(hash32(String(info.id || "")+"|"+info.a+"|"+info.b));
  var mctx = {A:A, B:B, ref:R, rng:rng, info:info, ui:ui,
    fx:function(kind){ if(wt.skipping) return; var a = wt.audio;
      if(kind === "hit1"){ if(a) a.hit(1); wt.ex = Math.min(1, wt.ex + 0.1); } else if(kind === "hit2"){ if(a) a.hit(2); wt.shake = 0.3; wt.ex = Math.min(1, wt.ex + 0.28); }
      else if(kind === "hit3"){ if(a) a.hit(3); wt.shake = 0.65; wt.ex = 1; } else if(kind === "bell"){ if(a) a.bell(); } else if(kind === "slap"){ if(a) a.slap(); }
      else if(kind === "cheer"){ wt.ex = Math.min(1, wt.ex + 0.45); } else if(kind === "gasp"){ wt.ex = Math.min(1, wt.ex + 0.35); } },
    shot:function(name){ if(wt.shotMode === "auto"){ wt.shotName = name; if(name === "close" || name === "hard" || name === "low") wt.side = rng() < 0.5 ? 1 : -1; } },
    focus:function(w){ wt.focus = w; },
    done:function(){ wt.done = true; showResult(s, wt); }};
  wt.sc = scriptMatch(mctx); wt.A.update(0.016, 0); wt.B.update(0.016, 0); wt.R.update(0.016, 0);
}
function endWatch(s, keepUi){
  var wt = s.watch; if(!wt) return; s.watch = null;
  try{ if(wt.audio) wt.audio.close(); }catch(e){} clearTimeout(wt.ui && wt.ui.cntT);
  try{ disposeObj(wt.scene); }catch(e){} if(wt.ui && wt.ui.root.parentNode) wt.ui.root.parentNode.removeChild(wt.ui.root);
  s.root.classList.remove("fwwatching"); s.last = performance.now();
}

/* ---- Buzz Arena: pick a match to watch ---- */
function arenaPanel(s){
  panel(s, function(b){
    b.appendChild(h("h3","","BUZZ ARENA")); b.appendChild(h("p","","Watch live wrestling from ringside. Turn your sound up for the crowd."));
    var real = h("div"), st = h("p"), ex = h("div"); st.textContent = signedIn() ? "Loading the matches from your shows..." : "Log in to see the matches from your own shows."; b.appendChild(real); b.appendChild(st);
    function add(box, info, tag){ var bt = h("button","fwbtn fwitem"); bt.type = "button"; bt.appendChild(h("span","", info.a+" vs "+info.b)); bt.appendChild(h("span","", tag)); bt.addEventListener("click", function(){ startWatch(s, info); }); box.appendChild(bt); }
    var hd = h("p","fwstat","EXHIBITION MATCHES"); b.appendChild(hd); b.appendChild(ex); EXH.forEach(function(m){ add(ex, m, "\u2605 "+m.rating); });
    if(signedIn()) dbRpc("promoter_booking").then(function(r){
      var rows = (r && r.history) || []; if(!document.getElementById("fw-panel")) return;
      if(!rows.length){ st.textContent = "Run a show in Promoter Mode and its matches will appear here to watch."; return; }
      st.textContent = ""; var t = h("p","fwstat","FROM YOUR SHOWS"); real.appendChild(t);
      rows.slice(0, 8).forEach(function(x){ add(real, {id:x.id, a:x.a_name, b:x.b_name, winner:x.winner_name, rating:x.rating, title:x.title_name, show:x.show_name}, "\u2605 "+x.rating); });
    }).catch(function(e){ st.textContent = /ppv|promotion|open/i.test(String(e && e.message)) ? "Start Promoter Mode to see matches from your own shows." : "Couldn't load your shows right now."; });
    closeBtn(s, b);
  });
}


function interact(s){
  if(s.car && s.car.driving){ exitCar(s); return; }
  if(carNear(s)){ enterCar(s); return; }
  var sp = C.nearestSpot(s.p.x, s.p.z); if(!sp || !sp.interact) return;
  if(sp.id==="motors") return motorsPanel(s); if(sp.id==="fashion") return fashionPanel(s); if(sp.id==="hq") return hqPanel(s); if(sp.id==="arena") return arenaPanel(s); if(sp.id==="training") return trainingPanel(s);
}
function togglePause(s){ if(document.getElementById("fw-panel")){ closePanel(s); return; }
  panel(s, function(b){ b.appendChild(h("h3","","Paused"));
    var r = h("button","fwbtn red","Resume"); r.type = "button"; r.addEventListener("click", function(){ closePanel(s); }); b.appendChild(r);
    b.appendChild(h("p","","Graphics quality")); var sel = h("select"); [["auto","Auto (best for this device)"],["low","Low (fastest)"],["medium","Medium"],["high","High (shadows)"]].forEach(function(o){ sel.appendChild(new Option(o[1],o[0])); });
    var cur = null; try{ cur = localStorage.getItem(GFX_KEY); }catch(e){} sel.value = (cur==="low"||cur==="medium"||cur==="high") ? cur : "auto";
    sel.addEventListener("change", function(){ try{ if(sel.value==="auto") localStorage.removeItem(GFX_KEY); else localStorage.setItem(GFX_KEY, sel.value); }catch(e){} restart(); }); b.appendChild(sel);
    [["Wardrobe",wardrobePanel],["Inventory",inventoryPanel],["Garage",garagePanel]].forEach(function(o){ var d = h("button","fwbtn",o[0]); d.type = "button"; d.addEventListener("click", function(){ o[1](s); }); b.appendChild(d); });
    var ex = h("button","fwbtn","Exit Free World"); ex.type = "button"; ex.addEventListener("click", exit); b.appendChild(ex); });
}
function toggleMap(s){ s.mapOn = !s.mapOn; var m = document.getElementById("fw-map"); m.style.display = s.mapOn ? "block" : "none"; if(s.mapOn) drawMap(s); }
function drawMap(s){
  var c = document.getElementById("fw-map"), x = c.getContext("2d"), W = C.WORLD, SPAN = (W.bounds.maxX-W.bounds.minX), S = c.width/SPAN, ox = c.width/2, oy = c.height/2;
  x.clearRect(0,0,c.width,c.height); x.fillStyle = "#1f5c34"; x.fillRect(0,0,c.width,c.height); x.fillStyle = "#3a3d45";
  W.roads.forEach(function(r){ x.fillRect(ox+r.x0*S, oy+r.z0*S, (r.x1-r.x0)*S, (r.z1-r.z0)*S); });
  x.fillStyle = "#cfc8b8"; x.beginPath(); x.arc(ox,oy,16*S,0,7); x.fill(); x.fillStyle = "#4fc3f7"; x.beginPath(); x.arc(ox,oy,8*S,0,7); x.fill();
  W.boxes.forEach(function(b){ if(b.id==="bench"||b.id==="car") return; x.fillStyle = b.id==="house" ? "#8a8a95" : "#E01B32"; x.fillRect(ox+b.x0*S, oy+b.z0*S, b.w*S, b.d*S); });
  x.fillStyle = "#ffffff"; W.parking.forEach(function(b){ x.fillRect(ox+b.x*S-1.5, oy+b.z*S-1.5, 3, 3); });
  x.fillStyle = "#EDBA3E"; W.spots.forEach(function(sp){ if(sp.interact){ x.beginPath(); x.arc(ox+sp.x*S, oy+sp.z*S, 2.6, 0, 7); x.fill(); } });
  if(s.net){ x.fillStyle = "#7bc4ff"; for(var rid in s.net.remotes){ var rm = s.net.remotes[rid]; x.beginPath(); x.arc(ox+rm.x*S, oy+rm.z*S, 3, 0, 7); x.fill(); if(rm.cm && !rm.drv){ x.fillRect(ox+rm.cx*S-2, oy+rm.cz*S-2, 4, 4); } } }
  if(s.car && !s.car.driving){ x.fillStyle = "#EDBA3E"; x.fillRect(ox+s.car.st.x*S-3, oy+s.car.st.z*S-3, 6, 6); }
  x.save(); x.translate(ox+s.p.x*S, oy+s.p.z*S); x.rotate(Math.PI - s.p.rot); x.fillStyle = "#fff"; x.strokeStyle = "#000"; x.beginPath(); x.moveTo(0,-5); x.lineTo(4,4); x.lineTo(-4,4); x.closePath(); x.fill(); x.stroke(); x.restore();
}
function buildHud(s){
  var root = s.root, nm = userName();
  var card = h("div","fwcard"); var av = h("div","fwav"), avc = h("canvas"); avc.id = "fw-avatar"; avc.width = 96; avc.height = 96; avc.style.cssText = "width:100%;height:100%;display:block"; av.appendChild(avc); card.appendChild(av); drawPortrait(avc, s.look || {}); var tx = h("div"); tx.appendChild(h("b","",nm)); var bal = h("small","","BUZZ CASH: ..."); bal.id = "fw-cash"; tx.appendChild(bal); var nt = h("small","fwnet","OFFLINE (single player)"); nt.id = "fw-net"; tx.appendChild(nt); card.appendChild(tx); root.appendChild(card);
  (function(){ try{ if(!readSession()){ bal.textContent = "BUZZ CASH: log in"; return; } getUserToken().then(function(t){ return fetch(SUPABASE_URL+"/rest/v1/rpc/legends_me",{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+t,"Content-Type":"application/json"},body:"{}"}); }).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ bal.textContent = (j && j.cash_balance!=null) ? "BUZZ CASH: B "+Number(j.cash_balance).toLocaleString() : "BUZZ CASH: -"; }).catch(function(){ bal.textContent = "BUZZ CASH: -"; }); }catch(e){ bal.textContent = "BUZZ CASH: -"; } })();
  var tr = h("div","fwtr"); function tb(t, f){ var b = h("button","fwbtn",t); b.type = "button"; b.addEventListener("click", f); tr.appendChild(b); return b; }
  tb("\uD83D\uDDFA", function(){ toggleMap(s); }).setAttribute("aria-label","Map");
  tb("\uD83D\uDC65", function(){ playersPanel(s); }).setAttribute("aria-label","Players");
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
  var br = h("div","fwbr"); var wv = h("button","fwbtn","Wave"); wv.type = "button"; wv.addEventListener("click", function(){ doWave(s); }); br.appendChild(wv);
  var rn = h("button","fwbtn","Run"); rn.type = "button"; rn.setAttribute("aria-pressed","false"); rn.addEventListener("click", function(){ s.run = !s.run; rn.classList.toggle("on", s.run); rn.setAttribute("aria-pressed", s.run?"true":"false"); }); br.appendChild(rn);
  var fb = h("button","fwbtn","Face"); fb.type = "button"; fb.addEventListener("click", function(){ faceCam(s, !s.faceCam); }); br.appendChild(fb);
  var cb = h("button","fwbtn","Car"); cb.id = "fw-carbtn"; cb.type = "button"; cb.style.display = "none"; cb.addEventListener("click", function(){ carButton(s); }); br.appendChild(cb);
  root.appendChild(br);
  /* driving controls (shown only while you drive) */
  var dv = h("div","fwdrive"); s.pedal = {gas:false, brake:false, hb:false};
  function hold(label, key, cls){ var b = h("button","fwbtn"+(cls ? " "+cls : ""), label); b.type = "button"; var on = function(e){ s.pedal[key] = true; try{ b.setPointerCapture(e.pointerId); }catch(x){} e.preventDefault(); }, off = function(){ s.pedal[key] = false; }; b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointercancel", off); b.addEventListener("lostpointercapture", off); dv.appendChild(b); return b; }
  hold("GAS", "gas", "red"); hold("BRAKE", "brake"); hold("HANDBRAKE", "hb");
  var ex = h("button","fwbtn","Get out"); ex.type = "button"; ex.addEventListener("click", function(){ exitCar(s); }); dv.appendChild(ex); root.appendChild(dv);
  var spd = h("div","","0 km/h"); spd.id = "fw-speed"; root.appendChild(spd);
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
