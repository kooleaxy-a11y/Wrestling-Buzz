/* BUZZ LEGENDS front end for Wrestling Buzz. Every purchase, unlock and reward is decided by Supabase (see legends-sql). */
(function(){
"use strict";
if(typeof SUPABASE_URL==="undefined" || !SUPABASE_URL || !SUPABASE_KEY) return;
var U = SUPABASE_URL, K = SUPABASE_KEY, SITE = "https://lwrestlingbuzz.vercel.app";
var L = {pub:null, me:null, ref:null, tab:"legends", at:"lg", modal:null};
var ERR = {not_signed_in:"Please log in to your Wrestling Buzz account first.", bank_disabled:"Bank transfer is switched off right now.", cash_disabled:"BUZZ CASH purchases are switched off right now.",
  no_legend:"That superstar isn't available.", already_owned:"You already own this superstar.", bad_reference:"Enter the payment reference from your receipt (4 to 64 characters).",
  bad_proof:"Payment evidence upload failed. Try again.", already_pending:"You already have a payment waiting for review for this superstar.", duplicate_reference:"That payment reference has already been submitted.",
  no_promotion:"Create your Promoter Mode promotion first to use BUZZ CASH.", not_enough_cash:"You don't have enough BUZZ CASH.", not_admin:"This account is not a Wrestling Buzz admin.",
  already_reviewed:"This was already reviewed.", reason_required:"Please give a reason.", no_user:"No account found with that email.", cannot_refund:"Only approved purchases can be refunded.",
  admin_signin:"Sign in with your admin email first.", bad_action:"That action isn't allowed for this referral."};
function msgOf(e){ var m = (e && e.message) || ""; return ERR[m] || (m && m.length<120 ? m : "Something went wrong. Please try again."); }
function h(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text!==undefined) e.textContent = text; return e; }
function naira(n){ return "\u20A6"+Number(n||0).toLocaleString("en-NG"); }
function dt(s){ if(!s) return "-"; try{ return new Date(s).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"}); }catch(e){ return "-"; } }
function say(box, text, bad){ box.textContent = text; box.className = "lmsg"+(bad?" err":" ok"); }
function call(name, args, tok){
  var hd = {"apikey":K, "Content-Type":"application/json"}; if(tok) hd.Authorization = "Bearer "+tok;
  return fetch(U+"/rest/v1/rpc/"+name, {method:"POST", headers:hd, body:JSON.stringify(args||{})}).then(function(r){
    return r.text().then(function(t){ var j = null; try{ j = t ? JSON.parse(t) : null; }catch(e){} if(!r.ok) throw new Error((j && j.message) || "error"); return j; }); });
}
function rpcU(name, args){ return getUserToken().then(function(t){ if(!t) throw new Error("not_signed_in"); return call(name, args, t); }); }
function rpcA(name, args){ var t = modToken(); if(!t) return Promise.reject(new Error("admin_signin")); return call(name, args, t); }
function signedIn(){ return !!readSession(); }
function artSrc(u){ if(!u) return ""; return /^https?:|^data:/.test(u) ? u : SITE+"/"+u.replace(/^\//,""); }
function copy(text, box){ var done = function(){ if(box) say(box,"Copied!"); }; if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function(){ prompt("Copy this:", text); }); else prompt("Copy this:", text); }

/* ---------- QR code (own encoder: byte mode, error level M, versions 1-6) ---------- */
var QR = (function(){
  var ECC = [0,10,16,26,18,24,16], BLK = [0,1,1,1,2,2,4], ALIGN = [[],[],[6,18],[6,22],[6,26],[6,30],[6,34]];
  function rawModules(v){ var r = (16*v+128)*v+64; if(v>=2){ var n = Math.floor(v/7)+2; r -= (25*n-10)*n-55; } return r; }
  var EXP = [], LOG = []; (function(){ var x = 1; for(var i=0;i<255;i++){ EXP[i] = x; LOG[x] = i; x <<= 1; if(x & 256) x ^= 0x11D; } })();
  function gmul(a,b){ return (a===0||b===0) ? 0 : EXP[(LOG[a]+LOG[b])%255]; }
  function rsDiv(n){ var r = []; for(var i=0;i<n-1;i++) r.push(0); r.push(1); var root = 1;
    for(var i=0;i<n;i++){ for(var j=0;j<n;j++){ r[j] = gmul(r[j], root); if(j+1<n) r[j] ^= r[j+1]; } root = gmul(root, 2); } return r; }
  function rsRem(data, div){ var r = div.map(function(){ return 0; }); data.forEach(function(b){ var f = b ^ r.shift(); r.push(0); div.forEach(function(c,i){ r[i] ^= gmul(c, f); }); }); return r; }
  function make(text){
    var bytes = unescape(encodeURIComponent(text)).split("").map(function(c){ return c.charCodeAt(0); }), ver = 0, v;
    for(v=1; v<=6; v++){ var cap = Math.floor(rawModules(v)/8) - ECC[v]*BLK[v]; if(bytes.length + 2 <= cap){ ver = v; break; } }
    if(!ver) throw new Error("qr_too_long");
    var cap = Math.floor(rawModules(ver)/8) - ECC[ver]*BLK[ver], bits = [];
    function put(val, len){ for(var i=len-1;i>=0;i--) bits.push((val>>>i)&1); }
    put(4,4); put(bytes.length,8); bytes.forEach(function(b){ put(b,8); });
    for(var t=0; t<4 && bits.length < cap*8; t++) bits.push(0);
    while(bits.length % 8) bits.push(0);
    for(var pad=0xEC; bits.length < cap*8; pad ^= 0xEC ^ 0x11) put(pad,8);
    var data = []; for(var i=0;i<bits.length;i+=8){ var b = 0; for(var j=0;j<8;j++) b = (b<<1)|bits[i+j]; data.push(b); }
    var nb = BLK[ver], el = ECC[ver], raw = Math.floor(rawModules(ver)/8), ns = nb - raw % nb, sl = Math.floor(raw/nb), div = rsDiv(el), blocks = [], k = 0;
    for(var i=0;i<nb;i++){ var d = data.slice(k, k + sl - el + (i<ns?0:1)); k += d.length; var e = rsRem(d, div); if(i<ns) d.push(0); blocks.push(d.concat(e)); }
    var all = []; for(var i=0;i<blocks[0].length;i++) for(var j=0;j<nb;j++) if(i !== sl-el || j >= ns) all.push(blocks[j][i]);
    var size = ver*4+17, m = [], fn = []; for(var y=0;y<size;y++){ m.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function setF(x,y,d){ m[y][x] = d; fn[y][x] = true; }
    for(var i=0;i<size;i++){ setF(6,i,i%2===0); setF(i,6,i%2===0); }
    [[3,3],[size-4,3],[3,size-4]].forEach(function(c){ for(var dy=-4;dy<=4;dy++) for(var dx=-4;dx<=4;dx++){ var x = c[0]+dx, y = c[1]+dy; if(x>=0&&x<size&&y>=0&&y<size){ var dist = Math.max(Math.abs(dx),Math.abs(dy)); setF(x,y,dist!==2&&dist!==4); } } });
    var ap = ALIGN[ver]; for(var a=0;a<ap.length;a++) for(var b=0;b<ap.length;b++){ if((a===0&&b===0)||(a===0&&b===ap.length-1)||(a===ap.length-1&&b===0)) continue;
      for(var dy=-2;dy<=2;dy++) for(var dx=-2;dx<=2;dx++) setF(ap[a]+dx, ap[b]+dy, Math.max(Math.abs(dx),Math.abs(dy))!==1); }
    function fmt(mask){ var d = mask, r = d; for(var i=0;i<10;i++) r = (r<<1) ^ ((r>>>9)*0x537); var bt = ((d<<10)|r) ^ 0x5412; function bit(i){ return ((bt>>>i)&1)!==0; }
      for(var i=0;i<=5;i++) setF(8,i,bit(i)); setF(8,7,bit(6)); setF(8,8,bit(7)); setF(7,8,bit(8)); for(var i=9;i<15;i++) setF(14-i,8,bit(i));
      for(var i=0;i<8;i++) setF(size-1-i,8,bit(i)); for(var i=8;i<15;i++) setF(8,size-15+i,bit(i)); setF(8,size-8,true); }
    fmt(0);
    var idx = 0; for(var right=size-1; right>=1; right-=2){ if(right===6) right = 5; for(var vert=0; vert<size; vert++) for(var j=0;j<2;j++){ var x = right-j, up = ((right+1)&2)===0, y = up ? size-1-vert : vert;
      if(!fn[y][x] && idx < all.length*8){ m[y][x] = ((all[idx>>>3]>>>(7-(idx&7)))&1)!==0; idx++; } } }
    function mask(k){ for(var y=0;y<size;y++) for(var x=0;x<size;x++){ var inv; switch(k){ case 0: inv=(x+y)%2===0; break; case 1: inv=y%2===0; break; case 2: inv=x%3===0; break; case 3: inv=(x+y)%3===0; break;
      case 4: inv=(Math.floor(x/3)+Math.floor(y/2))%2===0; break; case 5: inv=x*y%2+x*y%3===0; break; case 6: inv=(x*y%2+x*y%3)%2===0; break; default: inv=((x+y)%2+x*y%3)%2===0; }
      if(!fn[y][x] && inv) m[y][x] = !m[y][x]; } }
    function penalty(){ var p = 0, dark = 0;
      function runs(get){ for(var a=0;a<size;a++){ var run = 1; for(var b=1;b<size;b++){ if(get(a,b)===get(a,b-1)){ run++; if(run===5) p += 3; else if(run>5) p++; } else run = 1; } } }
      runs(function(a,b){ return m[a][b]; }); runs(function(a,b){ return m[b][a]; });
      for(var y=0;y<size-1;y++) for(var x=0;x<size-1;x++){ var c = m[y][x]; if(c===m[y][x+1]&&c===m[y+1][x]&&c===m[y+1][x+1]) p += 3; }
      for(var y=0;y<size;y++) for(var x=0;x<size;x++) if(m[y][x]) dark++;
      var tot = size*size; p += (Math.ceil(Math.abs(dark*20-tot*10)/tot)-1)*10; return p; }
    var best = 0, bp = 1e9; for(var k2=0;k2<8;k2++){ mask(k2); fmt(k2); var pp = penalty(); if(pp < bp){ bp = pp; best = k2; } mask(k2); }
    mask(best); fmt(best); return m;
  }
  return {make:make};
})();
window.BuzzQR = QR;

/* ---------- the collectible card, drawn on a canvas (1080 x 1500) ---------- */
function loadImg(src){ return new Promise(function(res){ var i = new Image(); i.crossOrigin = "anonymous"; i.onload = function(){ res(i); }; i.onerror = function(){ res(null); }; i.src = src; }); }
function rr(c,x,y,w,hh,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+hh,r); c.arcTo(x+w,y+hh,x,y+hh,r); c.arcTo(x,y+hh,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function fitText(c, text, maxW, size, font){ do{ c.font = font.replace("{s}", size); size -= 4; }while(c.measureText(text).width > maxW && size > 30); }
function drawCard(lg, o){
  var W = 1080, H = 1500, cv = document.createElement("canvas"); cv.width = W; cv.height = H; var c = cv.getContext("2d");
  var link = SITE+"/join?ref="+(L.me ? L.me.ref_code : ""), cardUrl = SITE+"/card/"+o.card_id;
  return loadImg(artSrc(lg.art_url)).then(function(img){
    var g = c.createLinearGradient(0,0,W,H); g.addColorStop(0,"#1a0509"); g.addColorStop(.5,"#0b0b0d"); g.addColorStop(1,"#2a0610"); c.fillStyle = g; c.fillRect(0,0,W,H);
    var gold = c.createLinearGradient(0,0,W,H); gold.addColorStop(0,"#fff0a8"); gold.addColorStop(.25,"#EDBA3E"); gold.addColorStop(.5,"#9c6a0c"); gold.addColorStop(.75,"#f6d36b"); gold.addColorStop(1,"#b8860b");
    c.strokeStyle = gold; c.lineWidth = 14; rr(c,14,14,W-28,H-28,46); c.stroke(); c.strokeStyle = "#E01B32"; c.lineWidth = 5; rr(c,40,40,W-80,H-80,34); c.stroke();
    c.textAlign = "center"; c.fillStyle = "#fff"; c.font = "italic 900 54px Impact, 'Arial Black', sans-serif"; c.fillText("WRESTLING", W/2-130, 118); c.fillStyle = "#E01B32"; c.fillText("BUZZ", W/2+150, 118);
    c.fillStyle = gold; rr(c,W/2-170,140,340,56,28); c.fill(); c.fillStyle = "#241600"; c.font = "900 34px Arial, sans-serif"; c.fillText("\u2605 "+(lg.rarity||"LEGENDARY")+" \u2605", W/2, 180);
    var ax = 70, ay = 224, aw = W-140, ah = 700;
    c.save(); rr(c,ax,ay,aw,ah,30); c.clip(); var rg = c.createRadialGradient(W/2,ay+ah*.45,60,W/2,ay+ah*.45,aw*.8); rg.addColorStop(0,"#7a1020"); rg.addColorStop(.55,"#2a0710"); rg.addColorStop(1,"#0b0b0d"); c.fillStyle = rg; c.fillRect(ax,ay,aw,ah);
    if(img){ var sc = Math.max(aw/img.width, ah/img.height), dw = img.width*sc, dh = img.height*sc, dx = ax+(aw-dw)/2, dy = ay-(dh-ah)*0.15; c.drawImage(img,dx,dy,dw,dh); }
    var sh = c.createLinearGradient(0,ay,aw,ay+ah); sh.addColorStop(0,"rgba(255,255,255,.18)"); sh.addColorStop(.35,"rgba(255,255,255,0)"); sh.addColorStop(1,"rgba(237,186,62,.14)"); c.fillStyle = sh; c.fillRect(ax,ay,aw,ah); c.restore();
    c.strokeStyle = gold; c.lineWidth = 8; rr(c,ax,ay,aw,ah,30); c.stroke();
    c.fillStyle = "#fff"; c.shadowColor = "#EDBA3E"; c.shadowBlur = 18; fitText(c, lg.name.toUpperCase(), W-160, 104, "italic 900 {s}px Impact, 'Arial Black', sans-serif"); c.fillText(lg.name.toUpperCase(), W/2, 1024); c.shadowBlur = 0;
    c.fillStyle = "#cfc6b4"; c.font = "700 30px Arial, sans-serif"; c.fillText("OWNED BY", W/2, 1078); c.fillStyle = "#EDBA3E"; fitText(c, o.username, W-200, 60, "900 {s}px Arial, sans-serif"); c.fillText(o.username, W/2, 1140);
    c.strokeStyle = "rgba(237,186,62,.5)"; c.lineWidth = 2; c.beginPath(); c.moveTo(110,1174); c.lineTo(W-110,1174); c.stroke();
    var q = QR.make(link), qs = 6, qn = q.length, qw = (qn+4)*qs, qx = W-110-qw, qy = 1200;
    c.fillStyle = "#fff"; rr(c,qx,qy,qw,qw,14); c.fill(); c.fillStyle = "#000"; for(var y=0;y<qn;y++) for(var x=0;x<qn;x++) if(q[y][x]) c.fillRect(qx+(x+2)*qs, qy+(y+2)*qs, qs, qs);
    c.textAlign = "left"; c.fillStyle = "#fff"; c.font = "italic 900 46px Impact, 'Arial Black', sans-serif"; c.fillText("PLAY WRESTLING BUZZ", 110, 1262);
    c.fillStyle = "#cfc6b4"; c.font = "600 28px Arial, sans-serif"; c.fillText("Scan the code to join the game", 110, 1308); c.fillStyle = "#EDBA3E"; c.font = "700 26px Arial, sans-serif"; c.fillText(link.replace("https://",""), 110, 1352);
    c.fillStyle = "#8d8576"; c.font = "600 24px Arial, sans-serif"; c.fillText("CARD "+o.card_id, 110, 1398);
    return cv; });
}
function cvBlob(cv, type, q){ return new Promise(function(res){ cv.toBlob(res, type, q); }); }

/* ---------- styles ---------- */
var css = ".lgw{--g:#EDBA3E;--r:#E01B32;max-width:960px;margin:0 auto}.lgw *{box-sizing:border-box}"+
".lhero{text-align:center;padding:24px 12px;border:1px solid #5a4510;border-radius:16px;background:radial-gradient(circle at 50% 0,#4a0d17,#0b0b0d 70%)}.lhero h2{margin:0;font-size:40px;letter-spacing:.06em;color:var(--g)}.lhero h2 b{color:#fff}.lhero p{margin:6px 0 0;color:#f0e6cf;font-weight:700;letter-spacing:.08em;font-size:13px}"+
".ltabs{display:flex;gap:6px;flex-wrap:wrap;margin:14px 0}.ltabs button{padding:9px 14px;border-radius:99px;border:1px solid #4a3d18;background:#121014;color:#f4efe3;cursor:pointer;font:inherit;font-weight:700}.ltabs button[aria-pressed=true]{background:var(--g);color:#241600}"+
".lgrid{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}.lcard{position:relative;border:2px solid #6b5115;border-radius:16px;overflow:hidden;background:linear-gradient(160deg,#2a0610,#0b0b0d);animation:lglow 3s ease-in-out infinite;transition:transform .2s}.lcard:hover{transform:translateY(-3px)}"+
".lcard.own{border-color:var(--g)}.lart{height:210px;background:radial-gradient(circle at 50% 40%,#7a1020,#14070a);display:flex;align-items:flex-end;justify-content:center;overflow:hidden}.lart img{height:100%;width:100%;object-fit:cover;object-position:50% 15%}.lcard.lock .lart img{filter:brightness(.55) saturate(.8)}"+
".llock{position:absolute;top:10px;right:10px;background:rgba(0,0,0,.7);border-radius:99px;padding:4px 10px;font-size:12px;font-weight:800;color:var(--g)}.lrar{position:absolute;top:10px;left:10px;background:linear-gradient(135deg,#f6d36b,#c58a12);color:#241600;border-radius:99px;padding:3px 10px;font-size:11px;font-weight:900;letter-spacing:.06em}"+
".lbody{padding:12px}.lbody h4{margin:0 0 4px;font-size:20px;color:#fff;font-style:italic}.lprice{color:var(--g);font-weight:800;font-size:18px}.lbtn{display:inline-block;margin-top:8px;padding:10px 16px;border:0;border-radius:10px;background:linear-gradient(135deg,#f6d36b,#c58a12);color:#241600;font:inherit;font-weight:800;cursor:pointer;text-decoration:none}.lbtn.red{background:var(--r);color:#fff}.lbtn.ghost{background:transparent;border:1px solid var(--g);color:var(--g)}.lbtn:disabled{opacity:.5}"+
".lpanel{border:1px solid #3a2f12;background:#0f0d11;border-radius:14px;padding:16px;margin:14px 0}.lpanel h3{margin:0 0 10px;color:var(--g)}.lpanel input,.lpanel select,.lpanel textarea,.lmodal input,.lmodal select,.lmodal textarea{width:100%;padding:10px;margin:4px 0 10px;border-radius:8px;border:1px solid #4a3d18;background:#08080a;color:#f4efe3;font:inherit}"+
".lmsg{min-height:20px;font-size:14px;margin-top:6px}.lmsg.err{color:#ff7a88}.lmsg.ok{color:#8be08b}.lkv{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}.lkv div{background:#17141a;border-radius:10px;padding:10px}.lkv small{display:block;color:#a99f8b}.lkv b{font-size:18px}"+
".lrow{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid #26202b;font-size:14px}.lst{padding:2px 9px;border-radius:99px;font-size:12px;font-weight:700;background:#444;color:#fff}.lst.pending,.lst.flagged{background:#b78a12}.lst.approved,.lst.rewarded{background:#1f8a3b}.lst.rejected,.lst.refunded,.lst.reversed{background:#b3202f}"+
".lover{position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:9000;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:14px}.lmodal{width:min(520px,100%);background:#0f0d11;border:2px solid var(--g);border-radius:18px;padding:16px;margin:auto}"+
".lmodal img.lm{width:100%;max-height:260px;object-fit:cover;object-position:50% 15%;border-radius:12px}.lcv{width:100%;height:auto;border-radius:14px;box-shadow:0 0 26px rgba(237,186,62,.3)}.lcol{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}"+
".lbanner{padding:12px;border-radius:10px;margin:10px 0;font-size:14px;background:#3a2c05;border:1px solid #b78a12}.lbanner.good{background:#0c2a14;border-color:#1f8a3b}.lbanner.bad{background:#3a0a12;border-color:#b3202f}.lpill{display:inline-block;margin:3px 4px 3px 0;padding:8px 12px;border-radius:99px;background:#1b171d;border:1px solid #4a3d18;color:#f4efe3;text-decoration:none;cursor:pointer;font:inherit;font-size:14px}"+
"@keyframes lglow{0%,100%{box-shadow:0 0 6px rgba(237,186,62,.25)}50%{box-shadow:0 0 20px rgba(237,186,62,.55)}}@media(prefers-reduced-motion:reduce){.lcard{animation:none!important;transition:none!important}}";
var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

/* ---------- view + nav ---------- */
if(typeof VIEWS!=="undefined" && VIEWS.indexOf("legends")<0) VIEWS.push("legends");
var sec = h("section","view"); sec.id = "v-legends"; sec.setAttribute("aria-label","BUZZ LEGENDS");
var host = document.getElementById("v-contact"); host.parentNode.insertBefore(sec, host);
var nav = document.querySelector("nav[aria-label=Main]"); var navA = h("a","","\u2605 Legends"); navA.href = "#legends"; navA.setAttribute("data-nav","legends"); navA.style.color = "#EDBA3E";
nav.insertBefore(navA, nav.children[2]||null);
window.addEventListener("hashchange", function(){ if((location.hash||"")==="#legends"){ document.title = "BUZZ LEGENDS | Wrestling Buzz"; render(); } });
var _pm = window.renderPromoter;
if(typeof _pm==="function") window.renderPromoter = function(){ _pm.apply(this, arguments); var r = document.getElementById("pm-root"); if(!r || !r.children.length || document.getElementById("pm-legends-link")) return;
  var b = h("div","lbanner good"); b.id = "pm-legends-link"; b.appendChild(h("b","","\u2605 BUZZ LEGENDS: ")); b.appendChild(document.createTextNode("unlock premium superstars and collect your shareable BUZZ CARDS. ")); var a = h("a","lbtn","Open BUZZ LEGENDS"); a.href = "#legends"; b.appendChild(a); r.insertBefore(b, r.firstChild); };

function load(){
  var p = call("legends_public",{},null).then(function(x){ L.pub = x; });
  var m = signedIn() ? rpcU("legends_me",{}).then(function(x){ L.me = x; }).catch(function(){ L.me = null; }) : Promise.resolve(L.me = null);
  return Promise.all([p,m]);
}
function render(){
  sec.innerHTML = ""; var w = h("div","lgw"); sec.appendChild(w); w.appendChild(h("p","hint","Loading BUZZ LEGENDS..."));
  load().then(function(){ draw(w); }).catch(function(){ w.innerHTML = ""; w.appendChild(h("p","hint","BUZZ LEGENDS isn't switched on yet. Run the legends-sql files in Supabase first.")); });
}
function byId(id){ return L.pub.legends.filter(function(x){ return x.id===id; })[0]; }
function ownedOf(id){ return L.me && L.me.owned.filter(function(o){ return o.legend_id===id; })[0]; }
function pendingOf(id){ return L.me && L.me.purchases.filter(function(p){ return p.legend_id===id && p.status==="pending"; })[0]; }
function draw(w){
  w.innerHTML = ""; var hero = h("div","lhero"); var t = h("h2"); t.innerHTML = "BUZZ <b>LEGENDS</b>"; hero.appendChild(t); hero.appendChild(h("p","","UNLOCK. COLLECT. SHARE. INVITE.")); w.appendChild(hero);
  var tb = h("div","ltabs"); [["legends","Legends"],["mine","My Legendary Collection"],["invite","Invite & Earn"]].forEach(function(x){ var b = h("button","",x[1]); b.type = "button"; b.setAttribute("aria-pressed", L.tab===x[0]?"true":"false"); b.addEventListener("click", function(){ L.tab = x[0]; draw(w); }); tb.appendChild(b); }); w.appendChild(tb);
  if(L.tab==="legends") drawGrid(w); else if(L.tab==="mine") drawMine(w); else drawInvite(w);
  if(L.modal) drawModal(w);
}
function drawGrid(w){
  var g = h("div","lgrid"); if(!L.pub.legends.length) g.appendChild(h("p","hint","No superstars are available yet."));
  L.pub.legends.forEach(function(lg){
    var own = ownedOf(lg.id), pend = pendingOf(lg.id), c = h("div","lcard "+(own?"own":"lock")), a = h("div","lart"), im = document.createElement("img"); im.src = artSrc(lg.art_url); im.alt = lg.name; im.loading = "lazy"; a.appendChild(im); c.appendChild(a);
    c.appendChild(h("span","lrar","\u2605 "+lg.rarity)); c.appendChild(h("span","llock", own?"UNLOCKED":"\uD83D\uDD12 LOCKED"));
    var b = h("div","lbody"); b.appendChild(h("h4","",lg.name)); b.appendChild(h("div","lprice",naira(lg.price_naira)+(L.pub.cash_enabled && lg.price_cash>0 ? "  or  B "+Number(lg.price_cash).toLocaleString() : "")));
    var btn;
    if(own){ btn = h("button","lbtn ghost","View my card"); btn.type = "button"; btn.addEventListener("click", function(){ L.tab = "mine"; draw(w); }); }
    else if(pend){ btn = h("button","lbtn ghost","Payment under review"); btn.disabled = true; }
    else { btn = h("button","lbtn","Unlock"); btn.type = "button"; btn.addEventListener("click", function(){ L.modal = {id:lg.id, method:"bank"}; draw(w); }); }
    b.appendChild(btn); c.appendChild(b); g.appendChild(c); });
  w.appendChild(g);
  if(L.me){ var rej = L.me.purchases.filter(function(p){ return p.status==="rejected"; })[0]; if(rej){ var bn = h("div","lbanner bad"); bn.textContent = "A payment was rejected"+(rej.reason?": "+rej.reason:"")+". You can submit again."; w.appendChild(bn); } }
  var box = h("div","lpanel"); box.appendChild(h("h3","","Your purchases"));
  if(!L.me || !L.me.purchases.length) box.appendChild(h("p","hint","No purchases yet. Pick a superstar above to unlock them."));
  else L.me.purchases.forEach(function(p){ var lg = byId(p.legend_id), r = h("div","lrow"); r.appendChild(h("span","",dt(p.created_at)+"  "+(lg?lg.name:"Superstar")+"  "+(p.method==="cash"?"B "+p.amount:naira(p.amount)))); r.appendChild(h("span","lst "+p.status,p.status.toUpperCase())); box.appendChild(r); });
  w.appendChild(box);
}
function drawModal(w){
  var M = L.modal, lg = byId(M.id), ov = h("div","lover"), md = h("div","lmodal"); ov.appendChild(md); ov.setAttribute("role","dialog"); ov.setAttribute("aria-label","Unlock "+lg.name);
  var close = function(reload){ L.modal = null; if(reload) load().then(function(){ draw(w); }); else draw(w); };
  var im = document.createElement("img"); im.className = "lm"; im.src = artSrc(lg.art_url); im.alt = lg.name; md.appendChild(im);
  md.appendChild(h("h3","","Unlock "+lg.name)); md.lastChild.style.color = "#EDBA3E"; md.appendChild(h("p","","\u2605 "+lg.rarity+" superstar and a personal BUZZ CARD you can share."));
  if(!signedIn()){ md.appendChild(h("p","","Log in or create a free account first so your card is saved to you.")); var a = h("a","lbtn","Log in / Sign up"); a.href = "#career"; a.addEventListener("click", function(){ L.modal = null; }); md.appendChild(a); }
  else {
    var canCash = L.pub.cash_enabled && lg.price_cash>0, canBank = L.pub.bank_enabled;
    if(!canCash && !canBank) md.appendChild(h("p","lbanner","Unlocking is paused right now. Check back soon."));
    if(canCash && canBank){ var sel = h("select"); sel.appendChild(new Option("Bank transfer ("+naira(lg.price_naira)+")","bank")); sel.appendChild(new Option("BUZZ CASH (B "+lg.price_cash.toLocaleString()+")","cash")); sel.value = M.method; sel.addEventListener("change", function(){ M.method = sel.value; draw(w); }); md.appendChild(h("label","hint","Payment method")); md.appendChild(sel); }
    else M.method = canCash ? "cash" : "bank";
    var msg = h("p","lmsg"); msg.setAttribute("role","status");
    if(M.method==="cash"){
      md.appendChild(h("p","","Price: B "+lg.price_cash.toLocaleString()+(L.me.cash_balance!=null?"   |   Your balance: B "+Number(L.me.cash_balance).toLocaleString():"")));
      var go = h("button","lbtn","Pay with BUZZ CASH"); go.type = "button"; go.addEventListener("click", function(){ go.disabled = true; say(msg,"Processing..."); rpcU("legend_buy_cash",{p_legend:lg.id}).then(function(){ L.tab = "mine"; close(true); }).catch(function(e){ go.disabled = false; say(msg,msgOf(e),true); }); });
      md.appendChild(go);
    } else if(canBank){
      md.appendChild(h("p","","Price: "+naira(lg.price_naira)+". Pay by bank transfer, then tell us about it. The superstar unlocks only after an admin confirms the money arrived."));
      var ins = h("div","lbanner"); ins.style.whiteSpace = "pre-wrap"; ins.textContent = L.pub.instructions; md.appendChild(ins);
      var ref = h("input"); ref.placeholder = "Payment reference / transaction ID"; ref.maxLength = 64; var nm = h("input"); nm.placeholder = "Name on the payment (optional)"; nm.maxLength = 80;
      var f = h("input"); f.type = "file"; f.accept = "image/jpeg,image/png,image/webp"; var go2 = h("button","lbtn","Submit payment for review"); go2.type = "button";
      go2.addEventListener("click", function(){ var file = f.files && f.files[0];
        if(file && (["image/jpeg","image/png","image/webp"].indexOf(file.type)<0 || file.size>2097152)){ say(msg,"Screenshot must be a JPG, PNG or WEBP under 2 MB.",true); return; }
        go2.disabled = true; say(msg,"Submitting...");
        var up = Promise.resolve(null);
        if(file) up = getUserToken().then(function(tok){ var path = readSession().uid+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"."+file.type.split("/")[1].replace("jpeg","jpg");
          return fetch(U+"/storage/v1/object/legend-proofs/"+path,{method:"POST",headers:{apikey:K,Authorization:"Bearer "+tok,"Content-Type":file.type},body:file}).then(function(r){ if(!r.ok) throw new Error("bad_proof"); return path; }); });
        up.then(function(path){ return rpcU("legend_submit_purchase",{p_legend:lg.id,p_reference:ref.value,p_payer:nm.value,p_proof:path}); })
          .then(function(){ close(true); }).catch(function(e){ go2.disabled = false; say(msg,msgOf(e),true); }); });
      [ref,nm,h("p","hint","Screenshot optional (under 2 MB). A screenshot alone never unlocks anything."),f,go2].forEach(function(x){ md.appendChild(x); });
    }
    md.appendChild(msg);
  }
  var cn = h("button","lbtn ghost","Cancel"); cn.type = "button"; cn.style.marginTop = "10px"; cn.addEventListener("click", function(){ close(false); }); md.appendChild(cn);
  ov.addEventListener("click", function(e){ if(e.target===ov) close(false); }); w.appendChild(ov);
}

/* ---------- My Legendary Collection ---------- */
function cardImageDone(o){ return !!o.image_path; }
function ensureImage(o, lg, cv){
  if(cardImageDone(o)) return;
  var name = (o.username && o.username!=="Wrestling Buzz Fan") ? o.username : (store(NAME_KEY)||o.username);
  cvBlob(cv, "image/jpeg", .9).then(function(blob){ return getUserToken().then(function(tok){ var path = o.card_id+"/card.jpg";
    return fetch(U+"/storage/v1/object/legend-cards/"+path,{method:"POST",headers:{apikey:K,Authorization:"Bearer "+tok,"Content-Type":"image/jpeg","x-upsert":"true"},body:blob}).then(function(r){ if(!r.ok) throw new Error("up"); return rpcU("legend_card_save",{p_card:o.card_id,p_username:name,p_image_path:path}); }).then(function(){ o.image_path = path; }); }); }).catch(function(){});
}
function drawMine(w){
  if(!signedIn()){ var p = h("div","lpanel"); p.appendChild(h("p","","Log in to see your collection.")); var a = h("a","lbtn","Log in / Sign up"); a.href = "#career"; p.appendChild(a); w.appendChild(p); return; }
  var col = h("div","lcol"), owned = L.me.owned;
  if(!owned.length){ var e = h("div","lpanel"); e.appendChild(h("h3","","Your collection is empty"));
    e.appendChild(h("p","","Unlock a BUZZ LEGEND to get your personal card, then share it with friends.")); var b = h("button","lbtn","See the Legends"); b.type = "button"; b.addEventListener("click", function(){ L.tab = "legends"; draw(w); }); e.appendChild(b); w.appendChild(e); }
  owned.forEach(function(o){ var lg = byId(o.legend_id); if(!lg) return; var box = h("div","lpanel"); box.style.margin = "0";
    var wrap = h("div"); wrap.appendChild(h("p","hint","Drawing your card...")); box.appendChild(wrap);
    var name = (o.username && o.username!=="Wrestling Buzz Fan") ? o.username : (store(NAME_KEY)||o.username), oo = {card_id:o.card_id, username:name};
    drawCard(lg, oo).then(function(cv){ cv.className = "lcv"; wrap.innerHTML = ""; wrap.appendChild(cv); ensureImage(o, lg, cv);
      var row = h("div"); row.style.marginTop = "10px"; var msg = h("p","lmsg");
      if(L.pub.sharing_enabled){ var sb = h("button","lbtn","SHARE CARD"); sb.type = "button"; sb.style.fontSize = "17px"; sb.addEventListener("click", function(){ shareCard(o, lg, cv, w); }); row.appendChild(sb); }
      var dl = h("button","lbtn ghost","Download image"); dl.type = "button"; dl.style.marginLeft = "6px"; dl.addEventListener("click", function(){ cvBlob(cv,"image/png").then(function(bl){ var a = document.createElement("a"); a.href = URL.createObjectURL(bl); a.download = "buzz-card-"+o.card_id+".png"; a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); }, 4000); }); });
      row.appendChild(dl); box.appendChild(row); box.appendChild(msg); });
    var kv = h("div","lkv"); kv.style.marginTop = "10px"; [["Rarity",lg.rarity],["Unlocked",dt(o.acquired_at)],["Shares",String(o.shares)],["Card ID",o.card_id]].forEach(function(x){ var d = h("div"); d.appendChild(h("small","",x[0])); d.appendChild(h("b","",x[1])); kv.appendChild(d); }); box.appendChild(kv);
    col.appendChild(box); });
  w.appendChild(col);
  var locked = L.pub.legends.filter(function(l){ return !ownedOf(l.id); });
  if(locked.length){ var lp = h("div","lpanel"); lp.appendChild(h("h3","","Still locked")); locked.forEach(function(l){ var r = h("div","lrow"); r.appendChild(h("span","","\uD83D\uDD12 "+l.name+"  "+naira(l.price_naira))); var b = h("button","lbtn","Unlock"); b.type = "button"; b.style.margin = "0"; b.addEventListener("click", function(){ L.tab = "legends"; L.modal = {id:l.id, method:"bank"}; draw(w); }); r.appendChild(b); lp.appendChild(r); }); w.appendChild(lp); }
}

/* ---------- sharing ---------- */
function shareCard(o, lg, cv, w){
  var url = SITE+"/card/"+o.card_id, text = "I unlocked "+lg.name+" on Wrestling Buzz! Play and join me:";
  var log = function(ch){ rpcU("legend_share_log",{p_card:o.card_id,p_channel:ch}).catch(function(){}); };
  cvBlob(cv,"image/png").then(function(blob){
    var file = null; try{ file = new File([blob], "buzz-card-"+o.card_id+".png", {type:"image/png"}); }catch(e){}
    if(file && navigator.canShare && navigator.canShare({files:[file]})){ return navigator.share({files:[file], title:"BUZZ CARD: "+lg.name, text:text+" "+url}).then(function(){ log("native"); }).catch(function(e){ if(e && e.name!=="AbortError") sharePanel(o, lg, cv, url, text, log); }); }
    if(navigator.share){ return navigator.share({title:"BUZZ CARD: "+lg.name, text:text, url:url}).then(function(){ log("native"); }).catch(function(e){ if(e && e.name!=="AbortError") sharePanel(o, lg, cv, url, text, log); }); }
    sharePanel(o, lg, cv, url, text, log); });
}
function sharePanel(o, lg, cv, url, text, log){
  var ov = h("div","lover"), md = h("div","lmodal"); ov.appendChild(md); md.appendChild(h("h3","","Share your card")); md.lastChild.style.color = "#EDBA3E";
  md.appendChild(h("p","hint","Links show your card picture in the preview on apps that support it."));
  var ref = SITE+"/join?ref="+L.me.ref_code, enc = encodeURIComponent, msg = h("p","lmsg");
  var links = [["WhatsApp","https://wa.me/?text="+enc(text+" "+url),"whatsapp"],["Facebook","https://www.facebook.com/sharer/sharer.php?u="+enc(url),"facebook"],["X","https://twitter.com/intent/tweet?text="+enc(text)+"&url="+enc(url),"x"],["Telegram","https://t.me/share/url?url="+enc(url)+"&text="+enc(text),"telegram"]];
  links.forEach(function(x){ var a = h("a","lpill",x[0]); a.href = x[1]; a.target = "_blank"; a.rel = "noopener"; a.addEventListener("click", function(){ log(x[2]); }); md.appendChild(a); });
  var ig = h("button","lpill","Instagram"); ig.type = "button"; ig.addEventListener("click", function(){ cvBlob(cv,"image/png").then(function(bl){ var a = document.createElement("a"); a.href = URL.createObjectURL(bl); a.download = "buzz-card-"+o.card_id+".png"; a.click(); }); copy(url); say(msg,"Image saved and link copied. Post the image in Instagram and paste the link in your bio or story."); log("instagram"); }); md.appendChild(ig);
  var dl = h("button","lpill","Download image"); dl.type = "button"; dl.addEventListener("click", function(){ cvBlob(cv,"image/png").then(function(bl){ var a = document.createElement("a"); a.href = URL.createObjectURL(bl); a.download = "buzz-card-"+o.card_id+".png"; a.click(); log("download"); }); }); md.appendChild(dl);
  var c1 = h("button","lpill","Copy card link"); c1.type = "button"; c1.addEventListener("click", function(){ copy(url, msg); log("copy_card"); }); md.appendChild(c1);
  var c2 = h("button","lpill","Copy referral link"); c2.type = "button"; c2.addEventListener("click", function(){ copy(ref, msg); log("copy_ref"); }); md.appendChild(c2);
  md.appendChild(msg); var cl = h("button","lbtn ghost","Close"); cl.type = "button"; cl.addEventListener("click", function(){ ov.remove(); }); md.appendChild(cl);
  ov.addEventListener("click", function(e){ if(e.target===ov) ov.remove(); }); document.body.appendChild(ov);
}

/* ---------- Invite & Earn ---------- */
function drawInvite(w){
  if(!signedIn()){ var p = h("div","lpanel"); p.appendChild(h("p","","Log in to get your personal invite link.")); var a = h("a","lbtn","Log in / Sign up"); a.href = "#career"; p.appendChild(a); w.appendChild(p); return; }
  var box = h("div","lpanel"); box.appendChild(h("h3","","Invite & Earn")); var body = h("div"); body.appendChild(h("p","hint","Loading...")); box.appendChild(body); w.appendChild(box);
  rpcU("legends_ref_dashboard",{}).then(function(d){ L.ref = d; body.innerHTML = "";
    var link = SITE+"/join?ref="+d.code; var inp = h("input"); inp.readOnly = true; inp.value = link; body.appendChild(inp);
    var msg = h("p","lmsg"); var cp = h("button","lbtn","Copy my link"); cp.type = "button"; cp.addEventListener("click", function(){ copy(link, msg); }); body.appendChild(cp);
    var sh = h("button","lbtn ghost","Share"); sh.type = "button"; sh.style.marginLeft = "6px"; sh.addEventListener("click", function(){ var t = "Join me on Wrestling Buzz: quizzes, predictions and your own wrestling promotion!"; if(navigator.share) navigator.share({title:"Wrestling Buzz", text:t, url:link}).catch(function(){}); else copy(t+" "+link, msg); }); body.appendChild(sh); body.appendChild(msg);
    var kv = h("div","lkv"); [["Link clicks",d.clicks],["Unique visitors",d.unique_clicks],["Sign-ups",d.registrations],["Successful referrals",d.successful],["BUZZ CASH earned","B "+Number(d.earned).toLocaleString()],["Card shares",d.shares]].forEach(function(x){ var e = h("div"); e.appendChild(h("small","",x[0])); e.appendChild(h("b","",String(x[1]))); kv.appendChild(e); }); body.appendChild(kv);
    body.appendChild(h("p","hint", d.enabled ? "You earn B "+Number(d.reward).toLocaleString()+" when a friend signs up with your link, confirms their email and runs their first show in Promoter Mode. Limits: "+d.daily_limit+" a day, "+d.monthly_limit+" a month. Clicking the link alone earns nothing." : "Referral rewards are switched off right now."));
    if(!d.friends.length) body.appendChild(h("p","hint","No sign-ups yet. Share your link or your BUZZ CARD to get started."));
    d.friends.forEach(function(f){ var r = h("div","lrow"); r.appendChild(h("span","",f.name+"  "+dt(f.at))); r.appendChild(h("span","lst "+f.status,f.status==="pending"?"WAITING":f.status.toUpperCase())); body.appendChild(r); });
  }).catch(function(e){ body.innerHTML = ""; body.appendChild(h("p","lmsg err",msgOf(e))); });
}

/* ---------- referral links: remember the code, count the click, attach after sign-up ---------- */
function captureRef(){
  var q = (new URLSearchParams(location.search).get("ref")||"").toUpperCase(); if(!/^[A-Z0-9]{8}$/.test(q)) return;
  try{ localStorage.setItem("wb_ref", q); }catch(e){}
  call("ref_click",{p_code:q,p_visitor:myId()},null).catch(function(){});
  try{ history.replaceState(null,"","/"); }catch(e){}
  location.hash = "#career";
  if(!signedIn()){ var b = h("div","lbanner good"); b.style.cssText = "position:fixed;left:8px;right:8px;top:8px;z-index:9500;text-align:center"; b.textContent = "You were invited to Wrestling Buzz! Create a free account below to join the game."; var x = h("button","lbtn ghost","OK"); x.type = "button"; x.style.marginLeft = "8px"; x.addEventListener("click", function(){ b.remove(); }); b.appendChild(x); document.body.appendChild(b); setTimeout(function(){ b.remove(); }, 15000); }
}
function attachRef(){
  var code = null; try{ code = localStorage.getItem("wb_ref"); }catch(e){} if(!code || !signedIn()) return;
  rpcU("ref_attach",{p_code:code,p_visitor:myId()}).then(function(){ try{ localStorage.removeItem("wb_ref"); }catch(e){} }).catch(function(e){ if(e && e.message!=="error" && e.message!=="not_signed_in" && !/fetch|network/i.test(e.message)){ try{ localStorage.removeItem("wb_ref"); }catch(x){} } });
}
captureRef(); attachRef(); setInterval(attachRef, 5000); window.addEventListener("hashchange", attachRef);
if((location.hash||"")==="#legends"){ document.title = "BUZZ LEGENDS | Wrestling Buzz"; if(typeof route==="function") route(); render(); }

/* ---------- ADMIN: BUZZ LEGENDS management inside the existing admin area ---------- */
var ap = document.getElementById("a-panel");
if(ap){
  var ad = h("div","panel apanel"); ad.id = "legends-admin"; ap.insertBefore(ad, document.getElementById("stats-panel")||null);
  ad.appendChild(h("h3","","BUZZ LEGENDS MANAGEMENT")); var ab = h("div"); ad.appendChild(ab);
  var TABS = [["lg","Superstars"],["buy","Purchases"],["own","Owners"],["ref","Referrals"],["set","Settings"]];
  function tokH(extra){ var o = {apikey:K, Authorization:"Bearer "+modToken()}; Object.keys(extra||{}).forEach(function(k){ o[k] = extra[k]; }); return o; }
  function fail(body,e){ var m = body.querySelector(".lmsg") || body.appendChild(h("p","lmsg")); say(m, msgOf(e), true); if(/JWT|expired/i.test(e.message)) sessionStorage.removeItem(MOD_KEY); }
  function adminDraw(){ ab.innerHTML = ""; ab.className = "lgw";
    if(!modToken()){ var f = h("div"); f.appendChild(h("p","hint","Sign in with your Supabase admin email to manage BUZZ LEGENDS. Every action is checked again on the server.")); var em = h("input"); em.placeholder = "Admin email"; var pw = h("input"); pw.type = "password"; pw.placeholder = "Password"; var m = h("p","lmsg");
      var b = h("button","lbtn","Sign in"); b.type = "button"; b.addEventListener("click", function(){ fetch(U+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:K,"Content-Type":"application/json"},body:JSON.stringify({email:em.value.trim(),password:pw.value})}).then(function(r){ return r.json(); }).then(function(j){ if(!j.access_token) throw new Error("Sign-in failed. Check the email and password."); sessionStorage.setItem(MOD_KEY, JSON.stringify({token:j.access_token, exp:Date.now()+(j.expires_in||3600)*1000-60000})); adminDraw(); }).catch(function(e){ say(m,e.message,true); }); });
      [em,pw,b,m].forEach(function(x){ f.appendChild(x); }); ab.appendChild(f); return; }
    var tb = h("div","ltabs"); TABS.forEach(function(t){ var b = h("button","",t[1]); b.type = "button"; b.setAttribute("aria-pressed", L.at===t[0]?"true":"false"); b.addEventListener("click", function(){ L.at = t[0]; adminDraw(); }); tb.appendChild(b); }); ab.appendChild(tb);
    var body = h("div"); ab.appendChild(body); ({lg:aLg,buy:aBuy,own:aOwn,ref:aRef,set:aSet})[L.at](body); }
  function upArt(file, slug){ if(!file) return Promise.resolve(null); if(["image/jpeg","image/png","image/webp"].indexOf(file.type)<0 || file.size>3145728) return Promise.reject(new Error("Artwork must be JPG, PNG or WEBP under 3 MB."));
    var path = slug+"-"+Date.now()+"."+file.type.split("/")[1].replace("jpeg","jpg");
    return fetch(U+"/storage/v1/object/legend-art/"+path,{method:"POST",headers:tokH({"Content-Type":file.type}),body:file}).then(function(r){ if(!r.ok) throw new Error("Artwork upload failed."); return U+"/storage/v1/object/public/legend-art/"+path; }); }
  function aLg(body){ var msg = h("p","lmsg"); body.appendChild(msg); var list = h("div"); body.appendChild(list);
    fetch(U+"/rest/v1/legends?select=*&order=sort,id",{headers:tokH()}).then(function(r){ return r.json(); }).then(function(rows){ if(!Array.isArray(rows)) throw new Error("not_admin");
      rows.forEach(function(l){ var c = h("div","lpanel"); c.style.margin = "8px 0"; var im = document.createElement("img"); im.src = artSrc(l.art_url); im.style.cssText = "height:90px;border-radius:8px;float:right"; c.appendChild(im);
        var nm = h("input"); nm.value = l.name; var pn = h("input"); pn.type = "number"; pn.value = l.price_naira; var pc = h("input"); pc.type = "number"; pc.value = l.price_cash; var ac = h("input"); ac.type = "checkbox"; ac.checked = l.active; ac.style.width = "auto"; var fl = h("input"); fl.type = "file"; fl.accept = "image/jpeg,image/png,image/webp";
        [["Name",nm],["Price in naira (bank transfer)",pn],["Price in BUZZ CASH (0 = not for sale with BUZZ CASH)",pc],["Active",ac],["Replace artwork",fl]].forEach(function(x){ c.appendChild(h("label","hint",x[0])); c.appendChild(x[1]); });
        var sv = h("button","lbtn","Save"); sv.type = "button"; sv.addEventListener("click", function(){ upArt(fl.files[0], l.slug).then(function(url){ var p = {name:nm.value.trim(), price_naira:parseInt(pn.value,10)||0, price_cash:parseInt(pc.value,10)||0, active:ac.checked}; if(url) p.art_url = url;
          return fetch(U+"/rest/v1/legends?id=eq."+l.id,{method:"PATCH",headers:tokH({"Content-Type":"application/json",Prefer:"return=minimal"}),body:JSON.stringify(p)}); }).then(function(r){ if(r && !r.ok) throw new Error("Could not save."); say(msg,"Saved "+l.name+"."); }).catch(function(e){ say(msg,e.message,true); }); }); c.appendChild(sv); list.appendChild(c); });
      var n = h("div","lpanel"); n.appendChild(h("h3","","Add a new superstar")); var sl = h("input"); sl.placeholder = "Short id, e.g. john-cena (letters, numbers, dashes)"; var nn = h("input"); nn.placeholder = "Name"; var np = h("input"); np.type = "number"; np.placeholder = "Price in naira"; var nc = h("input"); nc.type = "number"; nc.placeholder = "Price in BUZZ CASH (optional)"; var nf = h("input"); nf.type = "file"; nf.accept = "image/jpeg,image/png,image/webp";
      var ab2 = h("button","lbtn","Add superstar"); ab2.type = "button"; ab2.addEventListener("click", function(){ var slug = sl.value.trim().toLowerCase(); upArt(nf.files[0], slug||"x").then(function(url){ if(!url) throw new Error("Choose the artwork first.");
        return fetch(U+"/rest/v1/legends",{method:"POST",headers:tokH({"Content-Type":"application/json",Prefer:"return=minimal"}),body:JSON.stringify({slug:slug,name:nn.value.trim(),art_url:url,price_naira:parseInt(np.value,10)||0,price_cash:parseInt(nc.value,10)||0,sort:100+rows.length})}); }).then(function(r){ if(r && !r.ok) throw new Error("Could not add. Check the short id is new and uses only letters, numbers and dashes."); adminDraw(); }).catch(function(e){ say(msg,e.message,true); }); });
      [sl,nn,np,nc,nf,ab2].forEach(function(x){ n.appendChild(x); }); body.appendChild(n);
      var g = h("div","lpanel"); g.appendChild(h("h3","","Grant a superstar manually")); g.appendChild(h("p","hint","Use this to fix a genuine payment problem. It is saved in the audit log.")); var ge = h("input"); ge.placeholder = "Player's account email"; var gs = h("select"); rows.forEach(function(l){ gs.appendChild(new Option(l.name,l.id)); }); var gr = h("input"); gr.placeholder = "Reason (required)"; var gb = h("button","lbtn","Grant"); gb.type = "button";
      gb.addEventListener("click", function(){ rpcA("legend_admin_grant",{p_email:ge.value,p_legend:parseInt(gs.value,10),p_reason:gr.value}).then(function(){ say(msg,"Granted."); }).catch(function(e){ fail(body,e); }); }); [ge,gs,gr,gb].forEach(function(x){ g.appendChild(x); }); body.appendChild(g);
    }).catch(function(e){ fail(body,e); }); }
  function aBuy(body){ var fl = h("select"); ["pending","approved","rejected","refunded","all"].forEach(function(s){ fl.appendChild(new Option(s,s)); }); fl.value = L.bf||"pending"; fl.addEventListener("change", function(){ L.bf = fl.value; adminDraw(); }); body.appendChild(fl); body.appendChild(h("p","lmsg"));
    rpcA("legends_admin_purchases",{p_status:fl.value}).then(function(rows){ if(!rows.length) body.appendChild(h("p","hint","Nothing here."));
      rows.forEach(function(p){ var c = h("div","lpanel"); c.style.margin = "8px 0"; c.appendChild(h("b","",p.email+"  |  "+p.legend)); c.appendChild(h("p","",(p.method==="cash"?"B "+p.amount:naira(p.amount))+"  |  "+p.method+(p.reference?"  |  ref "+p.reference:"")+(p.payer_name?"  |  "+p.payer_name:"")+"  |  "+dt(p.created_at)));
        c.appendChild(h("span","lst "+p.status,p.status.toUpperCase())); if(p.reviewed_by) c.appendChild(h("p","hint","By "+p.reviewed_by+(p.reject_reason?"  |  "+p.reject_reason:"")));
        if(p.proof_path){ var v = h("button","lbtn ghost","View evidence"); v.type = "button"; v.style.marginRight = "6px"; v.addEventListener("click", function(){ fetch(U+"/storage/v1/object/sign/legend-proofs/"+p.proof_path,{method:"POST",headers:tokH({"Content-Type":"application/json"}),body:JSON.stringify({expiresIn:300})}).then(function(r){ return r.json(); }).then(function(j){ if(!j.signedURL) throw new Error("Could not open the evidence."); window.open(U+"/storage/v1"+j.signedURL,"_blank","noopener"); }).catch(function(e){ fail(body,e); }); }); c.appendChild(v); }
        if(p.status==="pending"){ var ok = h("button","lbtn","Approve (money received)"); ok.type = "button"; ok.addEventListener("click", function(){ if(!confirm("Confirm "+naira(p.amount)+" from "+p.email+" really arrived?")) return; ok.disabled = true; rpcA("legend_admin_review",{p_purchase:p.id,p_approve:true,p_reason:null}).then(adminDraw).catch(function(e){ ok.disabled = false; fail(body,e); }); });
          var no = h("button","lbtn red","Reject"); no.type = "button"; no.style.marginLeft = "6px"; no.addEventListener("click", function(){ var r = prompt("Reason for rejecting (the player sees this):"); if(!r) return; rpcA("legend_admin_review",{p_purchase:p.id,p_approve:false,p_reason:r}).then(adminDraw).catch(function(e){ fail(body,e); }); }); c.appendChild(ok); c.appendChild(no); }
        if(p.status==="approved"){ var rf = h("button","lbtn red","Refund and remove card"); rf.type = "button"; rf.addEventListener("click", function(){ var r = prompt("Reason for refund:"); if(!r) return; rpcA("legend_admin_refund",{p_purchase:p.id,p_reason:r}).then(adminDraw).catch(function(e){ fail(body,e); }); }); c.appendChild(rf); }
        body.appendChild(c); }); }).catch(function(e){ fail(body,e); }); }
  function aOwn(body){ body.appendChild(h("p","lmsg")); rpcA("legends_admin_owners",{}).then(function(rows){ if(!rows.length) body.appendChild(h("p","hint","No one owns a superstar yet.")); rows.forEach(function(o){ var r = h("div","lrow"); r.appendChild(h("span","",o.email+"  |  "+o.legend+"  |  "+o.card_id)); r.appendChild(h("span","",dt(o.acquired_at)+"  |  "+o.shares+" shares")); body.appendChild(r); }); }).catch(function(e){ fail(body,e); }); }
  function aRef(body){ body.appendChild(h("p","lmsg")); rpcA("legends_admin_refs",{}).then(function(s){ var kv = h("div","lkv"); [["Link clicks",s.clicks],["Sign-ups",s.registrations],["Rewarded",s.rewarded],["Paid out","B "+Number(s.paid_out).toLocaleString()],["Needs review",s.flagged]].forEach(function(x){ var d = h("div"); d.appendChild(h("small","",x[0])); d.appendChild(h("b","",String(x[1]))); kv.appendChild(d); }); body.appendChild(kv);
      s.rows.forEach(function(g){ var r = h("div","lrow"); r.appendChild(h("span","",g.referrer+" invited "+g.referred+(g.note?"  ("+g.note+")":""))); var rs = h("span"); rs.appendChild(h("span","lst "+g.status,g.status.toUpperCase()+(g.reward?" B"+g.reward:"")));
        function act(label, action, cls){ var b = h("button","lbtn "+cls,label); b.type = "button"; b.style.cssText = "margin:0 0 0 6px;padding:6px 10px"; b.addEventListener("click", function(){ var why = prompt("Reason:"); if(!why) return; rpcA("legends_admin_ref_decide",{p_reg:g.id,p_action:action,p_reason:why}).then(adminDraw).catch(function(e){ fail(body,e); }); }); rs.appendChild(b); }
        if(g.status==="flagged") act("Clear","approve","ghost"); if(g.status==="flagged"||g.status==="pending") act("Reject","reject","red"); if(g.status==="rewarded") act("Reverse reward","reverse","red"); r.appendChild(rs); body.appendChild(r); }); }).catch(function(e){ fail(body,e); }); }
  function aSet(body){ var msg = h("p","lmsg"); call("legends_public",{},null).then(function(p){ return fetch(U+"/rest/v1/legends_settings?select=*",{headers:tokH()}).then(function(r){ return r.json(); }); }).then(function(rows){ var s = rows[0]; if(!s) throw new Error("not_admin");
      function cb(label, v){ var i = h("input"); i.type = "checkbox"; i.checked = v; i.style.width = "auto"; body.appendChild(h("label","hint",label)); body.appendChild(i); return i; }
      function num(label, v){ var i = h("input"); i.type = "number"; i.value = v; body.appendChild(h("label","hint",label)); body.appendChild(i); return i; }
      var bank = cb("Bank transfer purchases on", s.bank_enabled), cash = cb("BUZZ CASH purchases on", s.cash_enabled), share = cb("Sharing features on", s.sharing_enabled), ref = cb("Referral rewards on", s.ref_enabled);
      var rw = num("Reward per successful referral (BUZZ CASH)", s.ref_reward), dl = num("Referral rewards per day (per player)", s.ref_daily_limit), ml = num("Referral rewards per month (per player)", s.ref_monthly_limit);
      body.appendChild(h("label","hint","Payment instructions shown to buyers (bank name, account number, account name)")); var ins = h("textarea"); ins.rows = 6; ins.value = s.instructions; body.appendChild(ins);
      var sv = h("button","lbtn","Save settings"); sv.type = "button"; sv.addEventListener("click", function(){ rpcA("legends_admin_save_settings",{p_bank:bank.checked,p_cash:cash.checked,p_share:share.checked,p_ref:ref.checked,p_reward:parseInt(rw.value,10)||0,p_daily:parseInt(dl.value,10)||0,p_monthly:parseInt(ml.value,10)||0,p_instructions:ins.value}).then(function(){ say(msg,"Saved."); }).catch(function(e){ fail(body,e); }); }); body.appendChild(sv); body.appendChild(msg); }).catch(function(e){ fail(body,e); }); }
  var _la = window.loadAdmin; if(typeof _la==="function") window.loadAdmin = function(){ _la.apply(this, arguments); adminDraw(); };
  adminDraw();
}
})();
