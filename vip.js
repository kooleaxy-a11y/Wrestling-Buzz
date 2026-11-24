/* BUZZ VIP front end for Wrestling Buzz. Loaded by index.html. All VIP decisions are made by Supabase (see buzz-vip.sql). */
(function(){
"use strict";
if(typeof SUPABASE_URL==="undefined" || !SUPABASE_URL || !SUPABASE_KEY) return;
var U = SUPABASE_URL, K = SUPABASE_KEY;
var VIP = {pub:null, me:null, plan:"monthly", showPay:false, clients:{}, pend:[], aTab:"pay", quiz:null};
var ERR = {not_signed_in:"Please log in to your Wrestling Buzz account first.", vip_required:"This is for active BUZZ VIP members.", plan_disabled:"That plan isn't available right now.",
  bad_reference:"Enter the payment reference from your receipt (4 to 64 characters).", already_pending:"You already have a payment waiting for review.",
  duplicate_reference:"That payment reference has already been submitted.", bad_proof:"Payment evidence upload failed. Try again.", already_reviewed:"This payment was already reviewed.",
  reason_required:"Please give a reason.", not_admin:"This account is not a Wrestling Buzz admin.", no_user:"No account found with that email.", benefit_disabled:"This benefit is switched off right now.",
  admin_signin:"Sign in with your admin email first.", cannot_refund:"Only approved payments can be refunded."};
function msgOf(e){ var m = (e && e.message) || ""; return ERR[m] || (m.length<120 && m ? m : "Something went wrong. Please try again."); }
function h(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text!==undefined) e.textContent = text; return e; }
function naira(n){ return "\u20A6"+Number(n||0).toLocaleString("en-NG"); }
function dt(s){ if(!s) return "-"; try{ return new Date(s).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"}); }catch(e){ return "-"; } }
function say(box, text, bad){ box.textContent = text; box.className = "vmsg"+(bad?" err":" ok"); }

/* ---------- network ---------- */
function call(name, args, tok){
  var hd = {"apikey":K, "Content-Type":"application/json"}; if(tok) hd.Authorization = "Bearer "+tok;
  return fetch(U+"/rest/v1/rpc/"+name, {method:"POST", headers:hd, body:JSON.stringify(args||{})}).then(function(r){
    return r.text().then(function(t){ var j = null; try{ j = t ? JSON.parse(t) : null; }catch(e){}
      if(!r.ok) throw new Error((j && j.message) || "error"); return j; }); });
}
function rpcU(name, args){ return getUserToken().then(function(t){ if(!t) throw new Error("not_signed_in"); return call(name, args, t); }); }
function rpcA(name, args){ var t = modToken(); if(!t) return Promise.reject(new Error("admin_signin")); return call(name, args, t); }
function signedIn(){ return !!readSession(); }

/* ---------- styles ---------- */
var css = ".vipw{--g:#EDBA3E;--r:#E01B32;--k:#0b0b0d;max-width:920px;margin:0 auto}.vipw *{box-sizing:border-box}"+
".vhero{text-align:center;padding:26px 14px;border:1px solid #5a4510;border-radius:16px;background:radial-gradient(circle at 50% 0%,#4a0d17,#0b0b0d 70%);animation:vfade .6s both}"+
".vlogo{display:block;width:min(340px,82%);height:auto;margin:0 auto 8px;filter:drop-shadow(0 0 18px rgba(237,186,62,.35));animation:vpop .7s both}.vsr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}@keyframes vpop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}.vhero svg{width:74px;height:74px;filter:drop-shadow(0 0 12px rgba(237,186,62,.5))}.vhero h2{margin:6px 0 2px;font-size:44px;letter-spacing:.06em;color:var(--g)}.vhero h2 b{color:var(--r)}"+
".vtag{color:#f0e6cf;letter-spacing:.12em;font-size:13px;font-weight:700}.vgrid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));margin:14px 0}"+
".vcard{border:1px solid #3a2f12;background:#121014;border-radius:12px;padding:14px;transition:transform .2s,border-color .2s}.vcard:hover{transform:translateY(-2px);border-color:var(--g)}"+
".vcard h4{margin:0 0 6px;color:var(--g)}.vcard p{margin:0;font-size:14px;color:#cfc6b4}.vplan{cursor:pointer;text-align:center;border-width:2px}.vplan.on{border-color:var(--g);box-shadow:0 0 16px rgba(237,186,62,.35)}.vplan.off{opacity:.45;cursor:not-allowed}"+
".vprice{font-size:34px;color:var(--g);font-weight:800}.vsave{display:inline-block;margin-top:6px;padding:2px 10px;border-radius:99px;background:var(--r);color:#fff;font-size:12px;font-weight:700}"+
".vbadge{display:inline-flex;align-items:center;gap:3px;margin-left:6px;padding:1px 7px;border-radius:99px;background:linear-gradient(135deg,#f6d36b,#c58a12);color:#2a1a00;font-size:11px;font-weight:800;vertical-align:middle;letter-spacing:.04em}"+
".vpanel{border:1px solid #3a2f12;background:#0f0d11;border-radius:14px;padding:16px;margin:14px 0;animation:vfade .4s both}.vpanel h3{margin:0 0 10px;color:var(--g)}"+
".vpanel input,.vpanel select,.vpanel textarea{width:100%;padding:10px;margin:4px 0 10px;border-radius:8px;border:1px solid #4a3d18;background:#08080a;color:#f4efe3;font:inherit}"+
".vbtn{display:inline-block;padding:11px 20px;border:0;border-radius:10px;background:linear-gradient(135deg,#f6d36b,#c58a12);color:#241600;font-weight:800;cursor:pointer;font:inherit;font-weight:800}.vbtn.red{background:var(--r);color:#fff}.vbtn.ghost{background:transparent;border:1px solid var(--g);color:var(--g)}.vbtn:disabled{opacity:.5}"+
".vmsg{min-height:20px;font-size:14px;margin-top:6px}.vmsg.err{color:#ff7a88}.vmsg.ok{color:#8be08b}.vkv{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.vkv div{background:#17141a;border-radius:10px;padding:10px}.vkv small{display:block;color:#a99f8b}.vkv b{font-size:18px}"+
".vrow{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid #26202b;font-size:14px}.vst{padding:2px 9px;border-radius:99px;font-size:12px;font-weight:700;background:#444;color:#fff}.vst.pending{background:#b78a12}.vst.approved{background:#1f8a3b}.vst.rejected,.vst.refunded{background:#b3202f}.vst.expired{background:#6a6a6a}"+
".vbanner{padding:12px;border-radius:10px;margin:12px 0;font-size:14px}.vbanner.warn{background:#3a2c05;border:1px solid #b78a12}.vbanner.bad{background:#3a0a12;border:1px solid #b3202f}.vbanner.good{background:#0c2a14;border:1px solid #1f8a3b}"+
".vtabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}.vtabs button{padding:7px 12px;border-radius:99px;border:1px solid #4a3d18;background:#121014;color:#f4efe3;cursor:pointer}.vtabs button[aria-pressed=true]{background:var(--g);color:#241600;font-weight:800}"+
".vprev{height:90px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;margin:6px 0 12px;border:2px solid #333}.vbar{height:10px;border-radius:6px;background:#1e1a22;overflow:hidden}.vbar i{display:block;height:100%;background:linear-gradient(90deg,#c58a12,#f6d36b)}"+
".vopt{display:block;width:100%;text-align:left;margin:6px 0;padding:11px;border-radius:10px;border:1px solid #4a3d18;background:#121014;color:#f4efe3;cursor:pointer;font:inherit}.vopt.good{background:#0c2a14;border-color:#1f8a3b}.vopt.bad{background:#3a0a12;border-color:#b3202f}"+
"@keyframes vfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@media(max-width:520px){.vhero h2{font-size:34px}}@media(prefers-reduced-motion:reduce){.vipw *{animation:none!important;transition:none!important}}";
var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

var CROWN = '<svg viewBox="0 0 64 64" aria-hidden="true"><polygon points="32,3 40,8 40,17 32,22 24,17 24,8" fill="none" stroke="#E01B32" stroke-width="2"/><path d="M8 52 L12 24 L24 36 L32 18 L40 36 L52 24 L56 52 Z" fill="#EDBA3E" stroke="#8a5d08" stroke-width="2"/><rect x="8" y="52" width="48" height="6" rx="2" fill="#C58A12"/><circle cx="12" cy="22" r="3" fill="#E01B32"/><circle cx="32" cy="15" r="3" fill="#E01B32"/><circle cx="52" cy="22" r="3" fill="#E01B32"/></svg>';
function badge(){ var b = h("span","vbadge","\u265B VIP"); b.title = "BUZZ VIP member"; return b; }
window.vipBadge = badge;

/* ---------- view + nav ---------- */
if(typeof VIEWS!=="undefined" && VIEWS.indexOf("vip")<0) VIEWS.push("vip");
var sec = h("section","view"); sec.id = "v-vip"; sec.setAttribute("aria-label","BUZZ VIP");
var host = document.getElementById("v-contact"); host.parentNode.insertBefore(sec, host);
var nav = document.querySelector("nav[aria-label=Main]"); var navA = h("a","","\u265B VIP"); navA.href = "#vip"; navA.setAttribute("data-nav","vip"); navA.style.color = "#EDBA3E";
nav.insertBefore(navA, nav.children[4]||null);

function load(){
  var pubP = call("vip_public", {}, null).then(function(p){ VIP.pub = p; });
  var meP = signedIn() ? rpcU("vip_me", {}).then(function(m){ VIP.me = m; }).catch(function(){ VIP.me = null; }) : Promise.resolve(VIP.me = null);
  return Promise.all([pubP, meP]);
}
function renderVip(){
  sec.innerHTML = ""; var w = h("div","vipw"); sec.appendChild(w); w.appendChild(h("p","hint","Loading BUZZ VIP..."));
  load().then(function(){ draw(w); }).catch(function(){ w.innerHTML = ""; w.appendChild(h("p","hint","BUZZ VIP isn't switched on yet. Run buzz-vip.sql in Supabase to enable it.")); });
}
window.addEventListener("hashchange", function(){
  var hh = (location.hash||"").replace("#","");
  if(hh==="vip"){ document.title = "BUZZ VIP | Wrestling Buzz"; renderVip(); }
});

var BEN = [["badge","Gold VIP badge","A gold crown next to your name on your profile, the leaderboard and chat."],
 ["themes","Profile customization","Exclusive themes, borders and backgrounds for your profile."],
 ["stats","Advanced statistics","Quiz accuracy, performance and XP history, achievements and activity."],
 ["quizzes","VIP exclusive quizzes","A VIP-only question category added by the Wrestling Buzz team."],
 ["achievements","VIP achievements","Exclusive achievements shown on your profile."],
 ["community","VIP community identity","A VIP identity in the community. VIP never gives an edge in public quizzes, predictions or leaderboards."]];

function draw(w){
  w.innerHTML = ""; var me = VIP.me, pub = VIP.pub;
  var hero = h("div","vhero"); var logo = document.createElement("img"); logo.src = "buzz-vip-logo.webp"; logo.alt = "Wrestling Buzz VIP Section"; logo.className = "vlogo"; logo.decoding = "async";
  logo.onerror = function(){ var c = h("div"); c.innerHTML = CROWN; var t = h("h2"); t.innerHTML = "BUZZ <b>VIP</b>"; logo.replaceWith(c); c.after(t); };
  hero.appendChild(logo); var sr = h("h2","vsr","BUZZ VIP"); hero.appendChild(sr);
  hero.appendChild(h("p","vtag","UNLOCK MORE. EXPERIENCE MORE. BE ELITE.")); w.appendChild(hero);
  if(me && me.notifications) drawNotes(w, me);
  if(me && me.active) drawDash(w, me); else if(me && me.status==="expired"){ var b = h("div","vbanner warn"); b.appendChild(h("b","","Your BUZZ VIP has expired. ")); b.appendChild(document.createTextNode("Your account, XP, quiz history and achievements are safe. Renew below to get your VIP perks back.")); w.appendChild(b); }
  if(!(me && me.active) || VIP.showPay){ drawBenefits(w); drawPlans(w); drawPay(w); }
  if(me) drawHistory(w, me);
}
function benOn(k){ var b = (VIP.pub && VIP.pub.benefits) || {}; return b[k]!==false; }
function drawBenefits(w){
  var g = h("div","vgrid"); BEN.forEach(function(b){ var c = h("div","vcard"); c.appendChild(h("h4","",b[1]+(benOn(b[0])?"":" (paused)"))); c.appendChild(h("p","",b[2])); g.appendChild(c); }); w.appendChild(g);
}
function drawPlans(w){
  var p = VIP.pub, g = h("div","vgrid"), mo = p.monthly_price, yr = p.yearly_price, save = Math.max(mo*12-yr, 0);
  [["monthly","Monthly",mo,"30 days",p.monthly_enabled],["yearly","Yearly",yr,"365 days",p.yearly_enabled]].forEach(function(x){
    var c = h("div","vcard vplan"+(VIP.plan===x[0]?" on":"")+(x[4]?"":" off")); c.setAttribute("role","button"); c.tabIndex = 0;
    c.appendChild(h("h4","",x[1])); c.appendChild(h("div","vprice",naira(x[2]))); c.appendChild(h("p","",x[3]+" of VIP. Pay once, renew yourself."));
    if(x[0]==="yearly"){ c.appendChild(h("p","","About "+naira(Math.round(yr/12))+" a month")); if(save>0) c.appendChild(h("span","vsave","SAVE "+naira(save)+" a year")); }
    if(!x[4]) c.appendChild(h("p","","Not available right now"));
    var pick = function(){ if(!x[4]) return; VIP.plan = x[0]; VIP.showPay = true; draw(w.parentNode ? w : w); };
    c.addEventListener("click", pick); c.addEventListener("keydown", function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); pick(); } });
    g.appendChild(c); });
  w.appendChild(h("p","hint","Both plans give the same benefits. There is no automatic charge: you renew by hand when you want to.")); w.appendChild(g);
}
function drawPay(w){
  var p = VIP.pub, me = VIP.me, box = h("div","vpanel"); box.appendChild(h("h3","","Get BUZZ VIP"));
  if(!signedIn()){ box.appendChild(h("p","","Log in or create a free Wrestling Buzz account first, so your membership is tied to your progress."));
    var a = h("a","vbtn","Log in / Sign up"); a.href = "#career"; box.appendChild(a); w.appendChild(box); return; }
  var last = me && me.payments && me.payments[0];
  if(last && last.status==="pending"){ var pb = h("div","vbanner warn"); pb.appendChild(h("b","","Payment waiting for review. ")); pb.appendChild(document.createTextNode("We're checking reference "+last.reference+". VIP turns on only after an admin confirms the money arrived.")); box.appendChild(pb); w.appendChild(box); return; }
  if(last && last.status==="rejected"){ var rb = h("div","vbanner bad"); rb.appendChild(h("b","","Your last payment was rejected. ")); rb.appendChild(document.createTextNode(last.reason||"")); box.appendChild(rb); }
  var plan = VIP.plan, amt = plan==="yearly" ? p.yearly_price : p.monthly_price;
  box.appendChild(h("p","","Step 1. Pay "+naira(amt)+" for the "+plan+" plan using these details:")); var ins = h("div","vcard",""); ins.style.whiteSpace = "pre-wrap"; ins.textContent = p.instructions; box.appendChild(ins);
  box.appendChild(h("p","","Step 2. Tell us about your payment:"));
  var ref = h("input"); ref.placeholder = "Payment reference / transaction ID"; ref.maxLength = 64; ref.setAttribute("aria-label","Payment reference");
  var nm = h("input"); nm.placeholder = "Name on the payment (optional)"; nm.maxLength = 80;
  var note = h("textarea"); note.placeholder = "Anything else we should know (optional)"; note.rows = 2; note.maxLength = 500;
  var f = h("input"); f.type = "file"; f.accept = "image/jpeg,image/png,image/webp"; f.setAttribute("aria-label","Payment screenshot");
  var hint = h("p","hint","Screenshot optional, JPG/PNG/WEBP under 2 MB. A screenshot alone never activates VIP."); var msg = h("p","vmsg"); msg.setAttribute("role","status");
  var go = h("button","vbtn","Submit payment for review"); go.type = "button";
  go.addEventListener("click", function(){
    var file = f.files && f.files[0];
    if(file && (["image/jpeg","image/png","image/webp"].indexOf(file.type)<0 || file.size>2097152)){ say(msg,"Screenshot must be a JPG, PNG or WEBP under 2 MB.",true); return; }
    go.disabled = true; say(msg,"Submitting...");
    var up = Promise.resolve(null);
    if(file){ up = getUserToken().then(function(tok){ var ext = file.type.split("/")[1].replace("jpeg","jpg"), path = readSession().uid+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"."+ext;
      return fetch(U+"/storage/v1/object/vip-proofs/"+path, {method:"POST", headers:{apikey:K, Authorization:"Bearer "+tok, "Content-Type":file.type}, body:file}).then(function(r){ if(!r.ok) throw new Error("bad_proof"); return path; }); }); }
    up.then(function(path){ return rpcU("vip_submit_payment", {p_plan:plan, p_reference:ref.value, p_payer_name:nm.value, p_note:note.value, p_proof_path:path}); })
      .then(function(){ VIP.showPay = false; return load(); }).then(function(){ draw(w); })
      .catch(function(e){ go.disabled = false; say(msg, msgOf(e), true); });
  });
  [ref,nm,note,f,hint,go,msg].forEach(function(x){ box.appendChild(x); }); w.appendChild(box);
}
function drawNotes(w, me){
  var un = me.notifications.filter(function(n){ return !n.read; }); if(!un.length) return;
  var box = h("div","vbanner good"); un.slice(0,4).forEach(function(n){ box.appendChild(h("div","",n.message)); });
  var b = h("button","vbtn ghost","Dismiss"); b.type = "button"; b.style.marginTop = "8px"; b.addEventListener("click", function(){ rpcU("vip_mark_read",{}).then(function(){ box.remove(); }); }); box.appendChild(b); w.appendChild(box);
}
function drawHistory(w, me){
  var box = h("div","vpanel"); box.appendChild(h("h3","","Payment history"));
  if(!me.payments.length) box.appendChild(h("p","hint","No payments yet. When you submit one, its status shows up here."));
  me.payments.forEach(function(p){ var r = h("div","vrow"); r.appendChild(h("span","",dt(p.created_at)+"  "+p.plan+"  "+naira(p.amount)+"  ref "+p.reference)); r.appendChild(h("span","vst "+p.status,p.status.toUpperCase())); box.appendChild(r);
    if(p.status==="rejected" && p.reason) box.appendChild(h("p","hint","Reason: "+p.reason)); });
  w.appendChild(box);
}

/* ---------- dashboard for active members ---------- */
function drawDash(w, me){
  var last = me.payments.filter(function(p){ return p.status==="approved"||p.status==="expired"; })[0];
  var box = h("div","vpanel"); box.appendChild(h("h3","","Your membership")); box.lastChild.appendChild(badge());
  if(me.status==="expiring"){ box.appendChild(h("div","vbanner warn","Your VIP ends in "+me.days_left+" day(s). Renew now and the new time is added after your current expiry.")); }
  var kv = h("div","vkv"); [["Status", me.status==="expiring"?"Active (ending soon)":"Active"],["Plan", me.plan==="manual"?"Granted by admin":(me.plan||"-")],["Payment", last? last.status : "Granted"],["Activated", dt(me.starts_at)],["Expires", dt(me.expires_at)],["Days left", String(me.days_left)]].forEach(function(x){ var d = h("div"); d.appendChild(h("small","",x[0])); d.appendChild(h("b","",x[1])); kv.appendChild(d); }); box.appendChild(kv);
  var bar = h("div","vbar"); var tot = me.plan==="yearly"?365:30; var i = h("i"); i.style.width = Math.min(100,Math.round(me.days_left/tot*100))+"%"; bar.appendChild(i); bar.style.margin = "12px 0"; box.appendChild(bar);
  var rn = h("button","vbtn",VIP.showPay?"Hide renewal":"Renew membership"); rn.type = "button"; rn.addEventListener("click", function(){ VIP.showPay = !VIP.showPay; draw(w); }); box.appendChild(rn);
  w.appendChild(box);
  if(benOn("themes")) drawCustom(w, me); if(benOn("stats")) drawStats(w, me); if(benOn("achievements")) drawAch(w, me); if(benOn("quizzes")) drawQuiz(w);
}
function itemsOf(k){ return VIP.pub.items.filter(function(i){ return i.kind===k; }); }
function styleFor(pr){ var s = {bg:"#17141a", border:"2px solid #333", shadow:"none"}; if(!pr) return s;
  [["theme",pr.theme],["background",pr.background],["border",pr.border]].forEach(function(x){ var it = itemsOf(x[0]).filter(function(i){ return i.code===x[1]; })[0]; if(it){ if(it.style.bg) s.bg = it.style.bg; if(it.style.border) s.border = it.style.border; if(it.style.shadow) s.shadow = it.style.shadow; } }); return s; }
function applyStyle(node, pr){ var s = styleFor(pr); node.style.background = s.bg; node.style.border = s.border; node.style.boxShadow = s.shadow; }
function drawCustom(w, me){
  var box = h("div","vpanel"); box.appendChild(h("h3","","Profile customization")); var pr = me.profile || {};
  var prev = h("div","vprev",(store(NAME_KEY)||"Your profile")); applyStyle(prev, pr); prev.appendChild(badge()); box.appendChild(prev);
  var sel = {}; [["theme","Theme"],["border","Border"],["background","Background"]].forEach(function(k){
    box.appendChild(h("label","hint",k[1])); var s = h("select"); s.appendChild(new Option("None","")); itemsOf(k[0]).forEach(function(i){ s.appendChild(new Option(i.name, i.code)); }); s.value = pr[k[0]]||""; sel[k[0]] = s;
    s.addEventListener("change", function(){ applyStyle(prev,{theme:sel.theme.value,border:sel.border.value,background:sel.background.value}); }); box.appendChild(s); });
  var msg = h("p","vmsg"); var b = h("button","vbtn","Save look"); b.type = "button";
  b.addEventListener("click", function(){ rpcU("vip_set_profile",{p_theme:sel.theme.value,p_border:sel.border.value,p_background:sel.background.value}).then(function(){ me.profile = {theme:sel.theme.value,border:sel.border.value,background:sel.background.value}; say(msg,"Saved. Your profile now shows this look."); }).catch(function(e){ say(msg,msgOf(e),true); }); });
  box.appendChild(b); box.appendChild(msg); w.appendChild(box);
}

/* personal history is kept on this device, one entry per day, from the first visit after this update */
var HKEY = "wb_vip_hist_v1";
function snap(){ try{ var hs = JSON.parse(localStorage.getItem(HKEY)||"{}"), d = new Date().toISOString().slice(0,10);
  hs[d] = {xp:PROF.xp, a:PROF.answered||0, c:PROF.correct||0, r:PROF.rounds||0}; var ks = Object.keys(hs).sort().slice(-90), o = {}; ks.forEach(function(k){ o[k]=hs[k]; }); localStorage.setItem(HKEY, JSON.stringify(o)); }catch(e){} }
function hist(){ try{ return JSON.parse(localStorage.getItem(HKEY)||"{}"); }catch(e){ return {}; } }
function drawStats(w, me){
  snap(); var box = h("div","vpanel"); box.appendChild(h("h3","","Advanced statistics"));
  var a = PROF.answered||0, c = PROF.correct||0, kv = h("div","vkv");
  [["Quiz accuracy", a? Math.round(c/a*100)+"%" : "-"],["Questions answered", String(a)],["Correct answers", String(c)],["Rounds played", String(PROF.rounds||0)],["Best streak", String(PROF.bestStreak||0)],["Survival best", String(PROF.survBest||0)],["Total XP", String(PROF.xp)],["VIP quiz accuracy", me.quiz.answered? Math.round(me.quiz.correct/me.quiz.answered*100)+"%" : "-"]].forEach(function(x){ var d = h("div"); d.appendChild(h("small","",x[0])); d.appendChild(h("b","",x[1])); kv.appendChild(d); }); box.appendChild(kv);
  var hs = hist(), ks = Object.keys(hs).sort(); box.appendChild(h("h4","","XP and quiz performance history")); 
  if(ks.length<2) box.appendChild(h("p","hint","History builds up day by day on this device. Come back tomorrow to see your XP growth."));
  ks.slice(-14).forEach(function(k,i,arr){ var e = hs[k], prev = i? hs[arr[i-1]] : null, r = h("div","vrow"); r.appendChild(h("span","",dt(k))); r.appendChild(h("span","",e.xp+" XP"+(prev? " ("+(e.xp>=prev.xp?"+":"")+(e.xp-prev.xp)+")":"")+"  |  accuracy "+(e.a? Math.round(e.c/e.a*100)+"%":"-"))); box.appendChild(r); });
  box.appendChild(h("h4","","Badges earned")); box.appendChild(h("p","hint",(PROF.badges && PROF.badges.length ? PROF.badges.length+" badge(s) unlocked in total" : "No badges yet")));
  w.appendChild(box);
}
function drawAch(w, me){
  var box = h("div","vpanel"); box.appendChild(h("h3","","VIP achievements")); var got = {}; me.achievements.forEach(function(a){ got[a.code] = a.earned_at; });
  var g = h("div","vgrid"); itemsOf("achievement").forEach(function(i){ var c = h("div","vcard"); c.style.opacity = got[i.code]?1:.45; c.appendChild(h("h4","",(got[i.code]?"\u2605 ":"\uD83D\uDD12 ")+i.name)); c.appendChild(h("p","",i.description+(got[i.code]?"  Unlocked "+dt(got[i.code]):""))); g.appendChild(c); });
  box.appendChild(g); w.appendChild(box);
}

/* ---------- VIP quiz (server serves questions and checks answers) ---------- */
function drawQuiz(w){
  var box = h("div","vpanel"); box.appendChild(h("h3","","VIP exclusive quiz")); box.appendChild(h("p","hint","VIP-only questions. They never give XP or change any public leaderboard.")); var area = h("div"); box.appendChild(area); w.appendChild(box);
  var go = h("button","vbtn","Start VIP quiz"); go.type = "button"; area.appendChild(go);
  go.addEventListener("click", function(){ rpcU("vip_quiz_next",{p_n:10}).then(function(qs){ if(!qs.length){ area.innerHTML = ""; area.appendChild(h("p","hint","No VIP questions have been added yet. Check back soon.")); return; } VIP.quiz = {qs:qs,i:0,ok:0}; ask(area); }).catch(function(e){ area.appendChild(h("p","vmsg err",msgOf(e))); }); });
}
function ask(area){
  var Q = VIP.quiz, q = Q.qs[Q.i]; area.innerHTML = "";
  if(!q){ area.appendChild(h("p","vprice",Q.ok+" / "+Q.qs.length)); area.appendChild(h("p","","Round finished.")); var again = h("button","vbtn","Play again"); again.type = "button"; again.addEventListener("click", function(){ renderVip(); }); area.appendChild(again); return; }
  area.appendChild(h("p","hint","Question "+(Q.i+1)+" of "+Q.qs.length+"  |  "+q.cat)); area.appendChild(h("h4","",q.q)); var btns = [];
  q.o.forEach(function(t,idx){ var b = h("button","vopt",t); b.type = "button"; btns.push(b);
    b.addEventListener("click", function(){ btns.forEach(function(x){ x.disabled = true; });
      rpcU("vip_quiz_answer",{p_id:q.id,p_choice:idx}).then(function(r){ btns[r.answer].classList.add("good"); if(!r.correct){ b.classList.add("bad"); } else Q.ok++;
        var n = h("button","vbtn",Q.i+1<Q.qs.length?"Next":"Finish"); n.type = "button"; n.addEventListener("click", function(){ Q.i++; ask(area); }); area.appendChild(n); })
      .catch(function(e){ area.appendChild(h("p","vmsg err",msgOf(e))); }); });
    area.appendChild(b); });
}

/* ---------- badges in existing areas ---------- */
var _draw = window.drawBoard;
if(typeof _draw==="function") window.drawBoard = function(d){ _draw(d); try{ var rows = document.querySelectorAll("#lb-list .lbrow"); ((d&&d.top)||[]).forEach(function(r,i){ if(r.vip && rows[i]){ var n = rows[i].querySelector(".lbname"); if(n) n.insertBefore(badge(), n.firstChild.nextSibling); } }); }catch(e){} };
var _career = window.renderCareer;
if(typeof _career==="function") window.renderCareer = function(){ _career.apply(this, arguments); snap();
  var old = document.getElementById("vip-career"); if(old) old.remove(); if(!signedIn()) return;
  rpcU("vip_me",{}).then(function(me){ if(!me.active) return; var s = h("div","vprev",(store(NAME_KEY)||"Your profile")); s.id = "vip-career"; applyStyle(s, me.profile); s.appendChild(badge()); var a = h("a","vbadge","Open BUZZ VIP"); a.href = "#vip"; s.appendChild(a); var c = document.getElementById("c-top"); if(c && c.parentNode && !document.getElementById("vip-career")) c.parentNode.insertBefore(s, c); }).catch(function(){}); };
window.vipChatBadge = function(head, r){
  if(!r.client_id) return; var id = r.client_id;
  if(id in VIP.clients){ if(VIP.clients[id]) head.insertBefore(badge(), head.firstChild.nextSibling); return; }
  VIP.pend.push({head:head,id:id}); clearTimeout(VIP.pt);
  VIP.pt = setTimeout(function(){ var ids = VIP.pend.map(function(x){ return x.id; }).filter(function(v,i,a){ return a.indexOf(v)===i; }), items = VIP.pend; VIP.pend = [];
    call("vip_active_clients",{p_ids:ids},null).then(function(on){ ids.forEach(function(i){ VIP.clients[i] = on.indexOf(i)>=0; }); items.forEach(function(x){ if(VIP.clients[x.id] && x.head.isConnected) x.head.insertBefore(badge(), x.head.firstChild.nextSibling); }); }).catch(function(){}); }, 60);
};
if(signedIn()){ rpcU("vip_me",{}).then(function(m){ if(m.active) rpcU("vip_link_identity",{p_client:myId()}); }).catch(function(){}); }
snap();

/* ---------- ADMIN: VIP MANAGEMENT inside the existing admin area ---------- */
var ap = document.getElementById("a-panel");
if(ap){
  var ad = h("div","panel apanel"); ad.id = "vip-admin"; ap.insertBefore(ad, document.getElementById("stats-panel")||null);
  var ab = h("div"); ad.appendChild(h("h3","","VIP MANAGEMENT")); ad.appendChild(ab);
  var tabs = [["pay","Payments"],["mem","Members"],["price","Pricing"],["ben","Benefits"],["stat","Analytics"]];
  function adminDraw(){ ab.innerHTML = ""; ab.className = "vipw";
    if(!modToken()){ var f = h("div"); f.appendChild(h("p","hint","Sign in with your Supabase admin email to manage VIP. Every action is checked again on the server.")); var em = h("input"); em.placeholder = "Admin email"; em.type = "text"; var pw = h("input"); pw.type = "password"; pw.placeholder = "Password"; var m = h("p","vmsg");
      var b = h("button","vbtn","Sign in"); b.type = "button"; b.addEventListener("click", function(){ fetch(U+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:K,"Content-Type":"application/json"},body:JSON.stringify({email:em.value.trim(),password:pw.value})}).then(function(r){ return r.json(); }).then(function(j){ if(!j.access_token) throw new Error("Sign-in failed. Check the email and password."); sessionStorage.setItem(MOD_KEY, JSON.stringify({token:j.access_token, exp:Date.now()+(j.expires_in||3600)*1000-60000})); adminDraw(); }).catch(function(e){ say(m,e.message,true); }); });
      [em,pw,b,m].forEach(function(x){ f.appendChild(x); }); ab.appendChild(f); return; }
    var tb = h("div","vtabs"); tabs.forEach(function(t){ var b = h("button","",t[1]); b.type = "button"; b.setAttribute("aria-pressed", VIP.aTab===t[0]?"true":"false"); b.addEventListener("click", function(){ VIP.aTab = t[0]; adminDraw(); }); tb.appendChild(b); }); ab.appendChild(tb);
    var body = h("div"); ab.appendChild(body); ({pay:aPay,mem:aMem,price:aPrice,ben:aBen,stat:aStat})[VIP.aTab](body); }
  function fail(body,e){ var m = body.querySelector(".vmsg") || body.appendChild(h("p","vmsg")); say(m, msgOf(e), true); if(e.message==="admin_signin"||/JWT|expired/i.test(e.message)){ sessionStorage.removeItem(MOD_KEY); } }
  function aPay(body){ var fl = h("select"); ["pending","approved","rejected","expired","refunded","all"].forEach(function(s){ fl.appendChild(new Option(s,s)); }); fl.value = VIP.pf||"pending"; fl.addEventListener("change", function(){ VIP.pf = fl.value; adminDraw(); }); body.appendChild(fl); var msg = h("p","vmsg"); body.appendChild(msg);
    rpcA("vip_admin_payments",{p_status:fl.value}).then(function(rows){ if(!rows.length) body.appendChild(h("p","hint","No "+fl.value+" payments."));
      rows.forEach(function(p){ var c = h("div","vcard"); c.style.margin = "8px 0"; c.appendChild(h("h4","",p.email+"  |  "+p.plan+"  |  expected "+naira(p.amount_expected))); c.appendChild(h("p","","Reference: "+p.reference+(p.payer_name?"  |  Payer: "+p.payer_name:"")+"  |  "+dt(p.created_at))); if(p.note) c.appendChild(h("p","","Note: "+p.note));
        var s = h("span","vst "+p.status,p.status.toUpperCase()); c.appendChild(s); if(p.reviewed_by) c.appendChild(h("p","hint","Reviewed by "+p.reviewed_by+" on "+dt(p.reviewed_at)+(p.amount_verified!=null?"  |  verified "+naira(p.amount_verified):"")+(p.reject_reason?"  |  "+p.reject_reason:"")));
        if(p.proof_path){ var v = h("button","vbtn ghost","View evidence"); v.type = "button"; v.style.margin = "6px 6px 0 0"; v.addEventListener("click", function(){ fetch(U+"/storage/v1/object/sign/vip-proofs/"+p.proof_path,{method:"POST",headers:{apikey:K,Authorization:"Bearer "+modToken(),"Content-Type":"application/json"},body:JSON.stringify({expiresIn:300})}).then(function(r){ return r.json(); }).then(function(j){ if(!j.signedURL) throw new Error("Could not open the evidence."); window.open(U+"/storage/v1"+j.signedURL,"_blank","noopener"); }).catch(function(e){ fail(body,e); }); }); c.appendChild(v); }
        if(p.status==="pending"){ var amt = h("input"); amt.type = "number"; amt.value = p.amount_expected; amt.title = "Amount actually received"; amt.style.maxWidth = "160px"; c.appendChild(amt);
          var ok = h("button","vbtn","Approve (money received)"); ok.type = "button"; ok.addEventListener("click", function(){ if(!confirm("Confirm that "+naira(amt.value)+" from "+p.email+" really arrived?")) return; ok.disabled = true; rpcA("vip_admin_review",{p_payment:p.id,p_approve:true,p_reason:null,p_amount:parseInt(amt.value,10)}).then(adminDraw).catch(function(e){ ok.disabled = false; fail(body,e); }); });
          var no = h("button","vbtn red","Reject"); no.type = "button"; no.style.marginLeft = "6px"; no.addEventListener("click", function(){ var r = prompt("Reason for rejecting (the user will see this):"); if(!r) return; rpcA("vip_admin_review",{p_payment:p.id,p_approve:false,p_reason:r,p_amount:null}).then(adminDraw).catch(function(e){ fail(body,e); }); }); c.appendChild(ok); c.appendChild(no); }
        if(p.status==="approved"||p.status==="expired"){ var rf = h("button","vbtn red","Mark refunded"); rf.type = "button"; rf.addEventListener("click", function(){ var r = prompt("Reason for refund:"); if(!r) return; rpcA("vip_admin_refund",{p_payment:p.id,p_reason:r}).then(adminDraw).catch(function(e){ fail(body,e); }); }); c.appendChild(rf); }
        body.appendChild(c); }); }).catch(function(e){ fail(body,e); }); }
  function aMem(body){ var q = h("input"); q.placeholder = "Search by email"; var fl = h("select"); ["all","active","expired"].forEach(function(s){ fl.appendChild(new Option(s,s)); }); var msg = h("p","vmsg"); var list = h("div");
    function run(){ list.innerHTML = ""; rpcA("vip_admin_members",{p_search:q.value,p_filter:fl.value}).then(function(rows){ if(!rows.length) list.appendChild(h("p","hint","No members match.")); rows.forEach(function(m){ var r = h("div","vrow"); r.appendChild(h("span","",m.email+"  |  "+m.plan+"  |  "+dt(m.starts_at)+" to "+dt(m.expires_at)+(m.source==="manual"?"  (granted)":""))); var rs = h("span"); rs.appendChild(h("span","vst "+(m.active?"approved":"expired"),m.active?"ACTIVE":"EXPIRED")); if(m.active){ var rv = h("button","vbtn red","Revoke"); rv.type = "button"; rv.style.marginLeft = "6px"; rv.addEventListener("click", function(){ var why = prompt("Reason for revoking VIP for "+m.email+":"); if(!why) return; rpcA("vip_admin_revoke",{p_user:m.user_id,p_reason:why}).then(run).catch(function(e){ fail(body,e); }); }); rs.appendChild(rv); } r.appendChild(rs); list.appendChild(r); }); }).catch(function(e){ fail(body,e); }); }
    q.addEventListener("input", run); fl.addEventListener("change", run); body.appendChild(q); body.appendChild(fl);
    body.appendChild(h("h4","","Grant VIP manually")); var ge = h("input"); ge.placeholder = "User's account email"; var gd = h("input"); gd.type = "number"; gd.value = 30; gd.placeholder = "Days"; var gr = h("input"); gr.placeholder = "Reason (required, saved in the audit log)"; var gb = h("button","vbtn","Grant VIP"); gb.type = "button";
    gb.addEventListener("click", function(){ rpcA("vip_admin_grant",{p_email:ge.value,p_days:parseInt(gd.value,10),p_reason:gr.value}).then(function(){ say(msg,"VIP granted."); run(); }).catch(function(e){ fail(body,e); }); });
    [ge,gd,gr,gb,msg].forEach(function(x){ body.appendChild(x); }); body.appendChild(list); run(); }
  function aPrice(body){ call("vip_public",{},null).then(function(p){ var mo = h("input"), yr = h("input"), ins = h("textarea"); mo.type = yr.type = "number"; mo.value = p.monthly_price; yr.value = p.yearly_price; ins.value = p.instructions; ins.rows = 6;
      var mon = h("input"), yon = h("input"); mon.type = yon.type = "checkbox"; mon.checked = p.monthly_enabled; yon.checked = p.yearly_enabled; mon.style.width = yon.style.width = "auto";
      var msg = h("p","vmsg"); [["Monthly price (\u20A6, 30 days)",mo],["Monthly plan on",mon],["Yearly price (\u20A6, 365 days)",yr],["Yearly plan on",yon],["Payment instructions shown to users",ins]].forEach(function(x){ body.appendChild(h("label","hint",x[0])); body.appendChild(x[1]); });
      var sb = h("button","vbtn","Save pricing"); sb.type = "button"; sb.addEventListener("click", function(){ rpcA("vip_admin_save_settings",{p_monthly:parseInt(mo.value,10),p_yearly:parseInt(yr.value,10),p_monthly_on:mon.checked,p_yearly_on:yon.checked,p_instructions:ins.value,p_benefits:p.benefits}).then(function(){ say(msg,"Saved."); }).catch(function(e){ fail(body,e); }); }); body.appendChild(sb); body.appendChild(msg); }).catch(function(e){ fail(body,e); }); }
  function aBen(body){ var msg = h("p","vmsg"); body.appendChild(msg);
    call("vip_public",{},null).then(function(p){ body.appendChild(h("h4","","Switch benefits on or off")); var b = p.benefits;
      BEN.forEach(function(x){ var r = h("label","vrow"); var cb = h("input"); cb.type = "checkbox"; cb.checked = b[x[0]]!==false; cb.style.width = "auto"; cb.addEventListener("change", function(){ b[x[0]] = cb.checked; rpcA("vip_admin_save_settings",{p_monthly:p.monthly_price,p_yearly:p.yearly_price,p_monthly_on:p.monthly_enabled,p_yearly_on:p.yearly_enabled,p_instructions:p.instructions,p_benefits:b}).then(function(){ say(msg,"Saved."); }).catch(function(e){ cb.checked = !cb.checked; fail(body,e); }); }); r.appendChild(h("span","",x[1])); r.appendChild(cb); body.appendChild(r); });
      body.appendChild(h("h4","","Badges, themes, borders, backgrounds and achievements")); var list = h("div"); body.appendChild(list);
      function items(){ list.innerHTML = ""; fetch(U+"/rest/v1/vip_items?select=*&order=kind,id",{headers:{apikey:K,Authorization:"Bearer "+modToken()}}).then(function(r){ return r.json(); }).then(function(rows){ rows.forEach(function(i){ var r = h("div","vrow"); r.appendChild(h("span","",i.kind+": "+i.name+(i.active?"":" (off)"))); var t = h("button","vbtn ghost",i.active?"Turn off":"Turn on"); t.type = "button"; t.addEventListener("click", function(){ fetch(U+"/rest/v1/vip_items?id=eq."+i.id,{method:"PATCH",headers:{apikey:K,Authorization:"Bearer "+modToken(),"Content-Type":"application/json"},body:JSON.stringify({active:!i.active})}).then(items); }); r.appendChild(t); list.appendChild(r); });
        var k = h("select"); ["theme","border","background","achievement","badge"].forEach(function(x){ k.appendChild(new Option(x,x)); }); var nm = h("input"); nm.placeholder = "Name"; var cd = h("input"); cd.placeholder = "Unique code, e.g. gold_wave"; var ds = h("input"); ds.placeholder = "Description"; var sty = h("input"); sty.placeholder = 'Style JSON, e.g. {"bg":"linear-gradient(#300,#000)"}'; var ad2 = h("button","vbtn","Add item"); ad2.type = "button";
        ad2.addEventListener("click", function(){ var s = {}; try{ s = sty.value ? JSON.parse(sty.value) : {}; }catch(e){ say(msg,"Style must be valid JSON.",true); return; } fetch(U+"/rest/v1/vip_items",{method:"POST",headers:{apikey:K,Authorization:"Bearer "+modToken(),"Content-Type":"application/json"},body:JSON.stringify({kind:k.value,code:cd.value.trim(),name:nm.value.trim(),description:ds.value,style:s})}).then(function(r){ if(!r.ok) throw new Error("Could not add. The code must be unique."); items(); }).catch(function(e){ say(msg,e.message,true); }); });
        [k,nm,cd,ds,sty,ad2].forEach(function(x){ list.appendChild(x); }); }); }
      items();
      body.appendChild(h("h4","","VIP quiz questions")); var ql = h("div"); body.appendChild(ql);
      function qs(){ ql.innerHTML = ""; fetch(U+"/rest/v1/vip_questions?select=*&order=id.desc&limit=100",{headers:{apikey:K,Authorization:"Bearer "+modToken()}}).then(function(r){ return r.json(); }).then(function(rows){
        var cat = h("input"); cat.value = "VIP Exclusive"; var qq = h("input"); qq.placeholder = "Question"; var os = [0,1,2,3].map(function(n){ var i = h("input"); i.placeholder = "Option "+"ABCD"[n]; return i; }); var an = h("select"); ["A","B","C","D"].forEach(function(x,n){ an.appendChild(new Option("Correct: "+x,n)); }); var add = h("button","vbtn","Add question"); add.type = "button";
        add.addEventListener("click", function(){ fetch(U+"/rest/v1/vip_questions",{method:"POST",headers:{apikey:K,Authorization:"Bearer "+modToken(),"Content-Type":"application/json"},body:JSON.stringify({cat:cat.value,q:qq.value.trim(),o:os.map(function(i){ return i.value.trim(); }),a:parseInt(an.value,10)})}).then(function(r){ if(!r.ok) throw new Error("Fill in the question and all four options."); qs(); }).catch(function(e){ say(msg,e.message,true); }); });
        [cat,qq].concat(os,[an,add]).forEach(function(x){ ql.appendChild(x); });
        (Array.isArray(rows)?rows:[]).forEach(function(q){ var r = h("div","vrow"); r.appendChild(h("span","",q.q+"  ["+q.o[q.a]+"]"+(q.active?"":" (off)"))); var rs = h("span"); var t = h("button","vbtn ghost",q.active?"Off":"On"); t.type = "button"; t.addEventListener("click", function(){ fetch(U+"/rest/v1/vip_questions?id=eq."+q.id,{method:"PATCH",headers:{apikey:K,Authorization:"Bearer "+modToken(),"Content-Type":"application/json"},body:JSON.stringify({active:!q.active})}).then(qs); }); var d = h("button","vbtn red","Delete"); d.type = "button"; d.style.marginLeft = "6px"; d.addEventListener("click", function(){ if(confirm("Delete this question?")) fetch(U+"/rest/v1/vip_questions?id=eq."+q.id,{method:"DELETE",headers:{apikey:K,Authorization:"Bearer "+modToken()}}).then(qs); }); rs.appendChild(t); rs.appendChild(d); r.appendChild(rs); ql.appendChild(r); }); }); }
      qs(); }).catch(function(e){ fail(body,e); }); }
  function aStat(body){ rpcA("vip_admin_stats",{}).then(function(s){ var kv = h("div","vkv"); [["Total VIP subscribers",s.subscribers],["Active now",s.active],["Expired",s.expired],["Pending payments",s.pending],["Monthly sales",s.monthly_sales],["Yearly sales",s.yearly_sales],["Verified revenue",naira(s.revenue)],["Refunded",naira(s.refunded)],["Renewing members",s.renewals]].forEach(function(x){ var d = h("div"); d.appendChild(h("small","",x[0])); d.appendChild(h("b","",String(x[1]))); kv.appendChild(d); }); body.appendChild(kv);
      body.appendChild(h("p","hint","Revenue only counts payments an admin approved. Manual grants, pending and rejected submissions are never counted.")); body.appendChild(h("h4","","Recent admin actions")); s.audit.forEach(function(a){ body.appendChild(h("div","vrow",dt(a.created_at)+"  "+a.admin_email+"  "+a.action+"  "+(a.target||""))); }); }).catch(function(e){ fail(body,e); }); }
  var _la = window.loadAdmin; if(typeof _la==="function") window.loadAdmin = function(){ _la.apply(this, arguments); adminDraw(); };
  adminDraw();
}
if((location.hash||"")==="#vip"){ document.title = "BUZZ VIP | Wrestling Buzz"; if(typeof route==="function") route(); renderVip(); }
})();
