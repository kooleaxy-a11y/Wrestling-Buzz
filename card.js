// Public BUZZ CARD page: /card/WB-XXXXXXXX  (served by Vercel via vercel.json)
// Reads one card from Supabase (no secrets needed: it uses the public key) and prints a page
// with Open Graph / Twitter tags so WhatsApp, Facebook, X and Telegram show the card image.
const SB = "https://sheoflmhrduorwwkpfup.supabase.co";
const KEY = "sb_publishable_is9jpm6XhpDuOlwwPFqU7A_CvSuhdLj";
const SITE = "https://lwrestlingbuzz.vercel.app";
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = async (req, res) => {
  const id = String((req.query && req.query.id) || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
  let card = null;
  try {
    const r = await fetch(SB + "/rest/v1/rpc/legend_card_public", {
      method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify({ p_card: id }) });
    if (r.ok) card = await r.json();
  } catch (e) {}
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  if (!card) {
    res.statusCode = 404;
    res.setHeader("Cache-Control", "public, max-age=60");
    return res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Card not found | Wrestling Buzz</title><body style="background:#0b0b0d;color:#fff;font-family:sans-serif;text-align:center;padding:48px 16px"><h1>Card not found</h1><p>This card does not exist.</p><p><a style="color:#EDBA3E" href="' + SITE + '">Play Wrestling Buzz</a></p></body>');
  }
  const img = card.image_path ? SB + "/storage/v1/object/public/legend-cards/" + card.image_path
    : (card.art_url && /^https?:/.test(card.art_url) ? card.art_url : SITE + "/" + String(card.art_url || "icon-512.png").replace(/^\//, ""));
  const url = SITE + "/card/" + card.card_id;
  const join = SITE + "/join?ref=" + encodeURIComponent(card.ref_code || "");
  const title = esc(card.username) + " unlocked " + esc(card.legend) + " on Wrestling Buzz";
  const desc = "A " + esc(card.rarity) + " BUZZ CARD. Play Wrestling Buzz: quizzes, predictions and your own wrestling promotion. Join the game!";
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Wrestling Buzz"><meta property="og:url" content="${url}">
<meta property="og:title" content="${title}"><meta property="og:description" content="${desc}">
<meta property="og:image" content="${esc(img)}"><meta property="og:image:alt" content="${esc(card.legend)} BUZZ CARD owned by ${esc(card.username)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${desc}"><meta name="twitter:image" content="${esc(img)}">
<style>body{margin:0;background:radial-gradient(circle at 50% 0,#4a0d17,#0b0b0d 65%);color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px 14px 48px}
img{max-width:min(420px,92vw);height:auto;border-radius:18px;box-shadow:0 0 40px rgba(237,186,62,.35)}h1{font-size:22px;margin:18px 0 6px}p{color:#d8cfbd;max-width:460px;margin:8px auto}
a.b{display:inline-block;margin-top:14px;padding:14px 28px;border-radius:12px;background:linear-gradient(135deg,#f6d36b,#c58a12);color:#241600;font-weight:800;text-decoration:none;font-size:18px}small{display:block;margin-top:18px;color:#8d8576}</style></head>
<body><img src="${esc(img)}" alt="${esc(card.legend)} BUZZ CARD"><h1>${esc(card.username)} unlocked ${esc(card.legend)}</h1>
<p>${esc(card.rarity)} BUZZ CARD. Join Wrestling Buzz: quizzes, predictions and your own wrestling promotion.</p>
<a class="b" href="${esc(join)}">JOIN THE GAME</a><small>Card ${esc(card.card_id)}</small></body></html>`);
};
