/* Straight From the Band cart. Vanilla JS, no libraries, no cookies.
   The cart lives only in this browser's localStorage; nothing is sent anywhere
   until the fan clicks checkout, which posts a standard PayPal cart-upload form. */
(function(){
// ---- sftb:data:start (pure data + shipping rule; tools/sftb-shipping-test.mjs evaluates this block) ----
// Shipping (USD), set by the band 2026-10-17. Each item has a ship class:
//  'big'  = shirts, drumstick pairs, vinyl: base covers the first, each extra adds PER_EXTRA_BIG.
//  'cd'   = CDs: free with any big item; otherwise base covers the first CD, each extra adds PER_EXTRA_CD.
//  'none' = picks, tins: never add shipping.
// An empty cart has no shipping.
var SFTB_SHIP_BASE = 5;
var SFTB_SHIP_PER_EXTRA_BIG = 2;
var SFTB_SHIP_PER_EXTRA_CD = 1;

// Groups render in this order. Add a group = one entry here (heading '' = no sub-heading).
var SFTB_GROUPS = [
 {id:'merch', heading:''},
 {id:'music', heading:'Physical CDs & Vinyl', cls:'sftb-music-grid'},
 // The four logo EPs, shown as one panel: covers join into the ETA star-and-skull logo (same quadrants
 // as the front page) beside a matching 2x2 grid of buy tiles. Items in this group need a quad field.
 {id:'ep-logo', layout:'ep-logo', heading:'The EP Set', note:'Put the four EPs together and you get the full ETA star and skull logo.'}
];
var SFTB_QUADS = ['top-left','top-right','bottom-left','bottom-right'];

// Items render inside their group in this order. Add an item = one entry here.
//  id (unique, kept in saved carts), group, name (card + cart + PayPal), price (USD), ship ('big'|'cd'|'none'),
//  img, w, h, alt, desc; optional: opt + opts (a required choice such as Size), cartName, dark (black image box),
//  quad (only in an 'ep-logo' group: top-left | top-right | bottom-left | bottom-right).
var SFTB_ITEMS = [
 {id:'ringer', group:'merch', name:'Lawnmower Fist Fight Ringer Tee', price:30, ship:'big', opt:'Size', opts:['M','L','XL','2XL'],
  img:'img/merch/band/lawnmower-fist-fight-ringer-tee.webp', w:417, h:421, alt:'White ringer tee with black trim and a Lawnmower Fist Fight graphic', desc:'White with black trim. Sizes M to 2XL.'},
 {id:'skulltee', group:'merch', name:'Black Skull & Star Tee', price:30, ship:'big', opt:'Size', opts:['M','L','XL','2XL'],
  img:'img/merch/band/black-skull-star-tee.webp', w:500, h:500, alt:'Black tee with a white skull and star East Texas Adrenaline design', desc:'Sizes M to 2XL.'},
 {id:'sticks', group:'merch', name:'Scott Credeur Signature Drumsticks', cartName:'Scott Credeur Signature Drumsticks (pair)', price:15, ship:'big',
  img:'img/merch/band/scott-credeur-drumsticks.webp', w:1000, h:277, alt:'Pair of wood drumsticks printed with East Texas Adrenaline and Scott Credeur', desc:'One pair.'},
 {id:'tin', group:'merch', name:'Pick Tin', price:8, ship:'none', opt:'Color', opts:['Silver','Black'],
  img:'img/merch/band/pick-tin-silver.webp', w:625, h:611, alt:'Brushed silver pick tin with a red skull and star East Texas Adrenaline design', desc:'Choose silver or black. Photo shows silver.'},
 {id:'pick-darrell', group:'merch', name:'Darrell Olbrych Signature Pick', price:2, ship:'none',
  img:'img/merch/band/darrell-olbrych-pick.webp', w:1000, h:493, alt:'Black guitar pick, front with skull and star logo, back with Darrell Olbrych name and signature', desc:'Single pick.'},
 {id:'pick-gedy', group:'merch', name:'Gedy Olbrych Signature Pick', price:2, ship:'none', dark:true,
  img:'img/merch/band/gedy-olbrych-pick.webp', w:1000, h:494, alt:'White guitar pick, front with East Texas Adrenaline skull and star logo, back with Gedy Olbrych name', desc:'Single pick.'},
 // Physical music: titles exactly as in data/releases.json. Knockout is vinyl only (no CD).
 {id:'vinyl-knockout', group:'music', name:'Knockout (Vinyl)', price:30, ship:'big', img:'img/merch/band/covers/knockout.webp', w:600, h:600, alt:'Knockout album cover', desc:'Album on vinyl · 2026'},
 {id:'cd-digital-toys', group:'ep-logo', quad:'bottom-left', name:'Digital Toys (CD)', price:6, ship:'cd', img:'img/merch/band/covers/digital-toys.webp', w:600, h:600, alt:'Digital Toys EP cover', desc:'EP · 2025'},
 {id:'cd-salt', group:'ep-logo', quad:'bottom-right', name:'Salt (CD)', price:6, ship:'cd', img:'img/merch/band/covers/salt.webp', w:600, h:600, alt:'Salt EP cover', desc:'EP · 2024'},
 {id:'cd-1000-miles', group:'ep-logo', quad:'top-right', name:'1000 Miles (CD)', price:6, ship:'cd', img:'img/merch/band/covers/1000-miles.webp', w:600, h:600, alt:'1000 Miles EP cover', desc:'EP · 2023'},
 {id:'cd-die-scared', group:'ep-logo', quad:'top-left', name:'Die Scared (CD)', price:6, ship:'cd', img:'img/merch/band/covers/die-scared.webp', w:600, h:600, alt:'Die Scared EP cover', desc:'EP · 2022'},
 {id:'cd-flossing-of-society', group:'music', name:'Flossing of Society (CD)', price:6, ship:'cd', img:'img/merch/band/covers/flossing-of-society.webp', w:600, h:600, alt:'Flossing of Society album cover', desc:'Album · 2021'},
 {id:'cd-friction', group:'music', name:'Friction (CD)', price:6, ship:'cd', img:'img/merch/band/covers/friction.webp', w:600, h:600, alt:'Friction EP cover', desc:'EP · 2019'},
 {id:'cd-built-to-last', group:'music', name:'Built to Last (CD)', price:6, ship:'cd', img:'img/merch/band/covers/built-to-last.webp', w:600, h:600, alt:'Built to Last album cover', desc:'Album · 2018'},
 {id:'cd-east-texas-adrenaline', group:'music', name:'East Texas Adrenaline (CD)', price:6, ship:'cd', img:'img/merch/band/covers/east-texas-adrenaline.webp', w:600, h:600, alt:'East Texas Adrenaline album cover', desc:'Album · 2017'}
];
var CAT = {};
SFTB_ITEMS.forEach(function(it){ CAT[it.id] = it; });

function shipFor(lines){
 if(!lines.length) return 0;
 var big = 0, cds = 0;
 lines.forEach(function(l){ var c = CAT[l.id]; if(!c) return; if(c.ship === 'big') big += l.qty; else if(c.ship === 'cd') cds += l.qty; });
 return SFTB_SHIP_BASE + SFTB_SHIP_PER_EXTRA_BIG * Math.max(0, big - 1) + (big ? 0 : SFTB_SHIP_PER_EXTRA_CD * Math.max(0, cds - 1));
}
// ---- sftb:data:end ----

var PAYPAL_URL = 'https://www.paypal.com/cgi-bin/webscr';
var PAYPAL_BUSINESS = 'doandjb@sbcglobal.net';
var RETURN_URL = 'https://easttexasadrenaline.com/merch.html?order=thanks'; // after payment
var CANCEL_URL = 'https://easttexasadrenaline.com/merch.html';
var KEY = 'eta_sftb_cart', MAXQ = 10;
var root = document.getElementById('straight-from-band'); if(!root) return;
var $ = function(id){return document.getElementById(id)};
var money = function(n){return '$' + n.toFixed(2)};
var cart = load();
// Back from PayPal after paying: clear the cart, thank the fan, tidy the URL.
var thanked = false;
try{
 if(new URLSearchParams(location.search).get('order') === 'thanks'){
  thanked = true; cart = []; try{ localStorage.removeItem(KEY); }catch(e){}
  var t = $('sftb-thanks'); if(t) t.hidden = false;
  if(history.replaceState) history.replaceState(null, '', location.pathname + location.hash);
 }
}catch(e){}

function load(){
 try{
  var a = JSON.parse(localStorage.getItem(KEY) || '[]'); if(!Array.isArray(a)) return [];
  return a.filter(function(l){
   var c = l && CAT[l.id]; if(!c) return false;
   if(c.opts ? c.opts.indexOf(l.opt) < 0 : l.opt) return false;
   l.qty = Math.min(MAXQ, Math.max(1, parseInt(l.qty, 10) || 1)); return true;
  });
 }catch(e){ return []; }
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(cart)); }catch(e){} }
function cname(c){ return c.cartName || c.name; }
function label(l){ var c = CAT[l.id]; return cname(c) + (c.opt ? ' - ' + c.opt + ' ' + l.opt : ''); }
function subtotal(){ return cart.reduce(function(s,l){ return s + CAT[l.id].price * l.qty; }, 0); }
function total(){ return subtotal() + shipFor(cart); }
function count(){ return cart.reduce(function(s,l){ return s + l.qty; }, 0); }
// Visible confirmation right under the card's Add button (screen readers get the live region instead).
function flash(card, msg, bad){
 var n = card.querySelector('.sftb-added');
 if(!n){ n = document.createElement('p'); n.className = 'sftb-added'; n.setAttribute('aria-hidden', 'true'); card.appendChild(n); }
 clearTimeout(n._t); n.textContent = msg; n.classList.toggle('bad', !!bad); n.hidden = false;
 if(!bad) n._t = setTimeout(function(){ n.hidden = true; }, 4000);
}
function say(msg){ var s = $('sftb-status'); s.textContent = ''; setTimeout(function(){ s.textContent = msg; }, 30); }

function render(){
 var ul = root.querySelector('.sftb-lines'); ul.textContent = '';
 cart.forEach(function(l, i){
  var c = CAT[l.id], li = document.createElement('li');
  var name = document.createElement('span'); name.className = 'sftb-ln';
  name.textContent = cname(c); if(c.opt){ var o = document.createElement('small'); o.textContent = c.opt + ': ' + l.opt; name.appendChild(o); }
  var q = document.createElement('label'); q.className = 'sftb-lq';
  var qs = document.createElement('span'); qs.className = 'vh'; qs.textContent = 'Quantity for ' + label(l);
  var qi = document.createElement('input'); qi.type = 'number'; qi.min = 1; qi.max = MAXQ; qi.value = l.qty; qi.inputMode = 'numeric';
  qi.addEventListener('change', function(){
   var v = Math.min(MAXQ, Math.max(1, parseInt(qi.value, 10) || 1)); l.qty = v; save(); render();
   say(label(l) + ' quantity set to ' + v + '. Total ' + money(total()) + '.');
  });
  q.appendChild(qs); q.appendChild(qi);
  var pr = document.createElement('span'); pr.className = 'sftb-lp'; pr.textContent = money(c.price * l.qty);
  var rm = document.createElement('button'); rm.type = 'button'; rm.className = 'sftb-rm'; rm.textContent = 'Remove';
  rm.setAttribute('aria-label', 'Remove ' + label(l));
  rm.addEventListener('click', function(){
   cart.splice(i, 1); save(); render(); say('Removed ' + label(l) + '. ' + (cart.length ? 'Total ' + money(total()) + '.' : 'Cart is empty.'));
  });
  li.appendChild(name); li.appendChild(q); li.appendChild(pr); li.appendChild(rm); ul.appendChild(li);
 });
 var sub = subtotal(), empty = !cart.length;
 root.querySelector('.sftb-empty').hidden = !empty;
 $('sftb-subtotal').textContent = money(sub);
 $('sftb-shipping').textContent = money(shipFor(cart));
 $('sftb-total').textContent = money(sub + shipFor(cart));
 $('sftb-checkout').disabled = empty;
 $('sftb-count').textContent = count(); $('sftb-pill').hidden = empty || cartInView;
}
// The floating "Cart (n)" shortcut hides while the cart panel or the custom-order line is on screen.
var cartInView = false, seen = {};
if('IntersectionObserver' in window){
 var io = new IntersectionObserver(function(es){
  es.forEach(function(e){ seen[e.target.className] = e.isIntersecting; });
  cartInView = Object.keys(seen).some(function(k){ return seen[k]; });
  $('sftb-pill').hidden = !cart.length || cartInView;
 });
 io.observe($('sftb-cart')); var cu = root.querySelector('.sftb-custom'); if(cu) io.observe(cu);
}

// Build the item cards from SFTB_GROUPS / SFTB_ITEMS.
var esc = function(v){ return String(v).replace(/[&<>"]/g, function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]; }); };
function cardHTML(it, noImg){
 var opt = it.opts ? '<label class="sftb-f"><span>' + esc(it.opt) + '</span><select name="opt"><option value="">Choose</option>' +
  it.opts.map(function(o){ return '<option>' + esc(o) + '</option>'; }).join('') + '</select></label>' : '';
 return '<div class="card prod sftb-item" data-id="' + esc(it.id) + '">' + (noImg ? '' : '<img class="pimg sftb-img' + (it.dark ? ' dark' : '') + '" src="' + esc(it.img) +
  '" width="' + it.w + '" height="' + it.h + '" loading="lazy" alt="' + esc(it.alt) + '">') + '<h3>' + esc(it.name) + '</h3><p class="price">' + whole(it.price) +
  '</p><p class="sub">' + esc(it.desc) + '</p><div class="sftb-opts">' + opt +
  '<label class="sftb-f"><span>Qty</span><input type="number" name="qty" min="1" max="' + MAXQ + '" value="1" inputmode="numeric"></label></div>' +
  '<button type="button" class="btn sm sftb-add">Add to cart</button></div>';
}
var whole = function(n){ return '$' + (n % 1 ? n.toFixed(2) : n); };
// 'ep-logo' layout: one card-style panel, logo (covers edge to edge) beside 2x2 buy tiles in the same positions.
function epLogoHTML(g, items){
 var q = SFTB_QUADS.map(function(p){ return items.filter(function(it){ return it.quad === p; })[0]; }).filter(Boolean);
 var hid = 'sftb-g-' + esc(g.id);
 return '<div class="card sftb-epset" role="group" aria-labelledby="' + hid + '">' +
  '<div class="sftb-epset-head"><h3 id="' + hid + '">' + esc(g.heading || '') + '</h3>' + (g.note ? '<p class="sub">' + esc(g.note) + '</p>' : '') + '</div>' +
  '<div class="sftb-logo4">' + q.map(function(it){
   return '<img src="' + esc(it.img) + '" width="' + it.w + '" height="' + it.h + '" loading="lazy" alt="' + esc(it.alt + ', ' + it.quad.replace('-', ' ') + ' quarter of the ETA logo') + '">';
  }).join('') + '</div>' +
  '<div class="sftb-epset-buy">' + q.map(function(it){
   return '<div class="sftb-item sftb-tile" data-id="' + esc(it.id) + '"><h3>' + esc(it.name) + '</h3><p class="price">' + whole(it.price) + '</p>' +
    '<div class="sftb-tile-row"><label class="sftb-f"><span>Qty</span><input type="number" name="qty" min="1" max="' + MAXQ + '" value="1" inputmode="numeric"></label>' +
    '<button type="button" class="btn sm sftb-add">Add to cart</button></div></div>';
  }).join('') + '</div></div>';
}
var holder = $('sftb-groups');
if(holder) holder.innerHTML = SFTB_GROUPS.map(function(g){
 var items = SFTB_ITEMS.filter(function(it){ return it.group === g.id; }); if(!items.length) return '';
 var head = g.heading ? '<h4 class="sftb-group-h" id="sftb-g-' + esc(g.id) + '">' + esc(g.heading) + '</h4>' : '';
 if(g.layout === 'ep-logo') return epLogoHTML(g, items);
 return head + '<div class="grid shop-grid sftb-grid' + (g.cls ? ' ' + esc(g.cls) : '') + '"' + (g.heading ? ' role="group" aria-labelledby="sftb-g-' + esc(g.id) + '"' : '') + '>' +
  items.map(function(it){ return cardHTML(it); }).join('') + '</div>';
}).join('');
root.querySelectorAll('.sftb-ship-base').forEach(function(e){ e.textContent = whole(SFTB_SHIP_BASE); });
root.querySelectorAll('.sftb-ship-extra').forEach(function(e){ e.textContent = whole(SFTB_SHIP_PER_EXTRA_BIG); });
root.querySelectorAll('.sftb-ship-cd').forEach(function(e){ e.textContent = whole(SFTB_SHIP_PER_EXTRA_CD); });
root.querySelectorAll('.sftb-item').forEach(function(card){
 card.querySelector('.sftb-add').addEventListener('click', function(){
  var id = card.getAttribute('data-id'), c = CAT[id]; if(!c) return;
  var sel = card.querySelector('select[name=opt]'), opt = sel ? sel.value : '';
  if(c.opts && c.opts.indexOf(opt) < 0){ say('Please choose a ' + c.opt.toLowerCase() + ' for the ' + cname(c) + '.'); flash(card, 'Choose a ' + c.opt.toLowerCase() + ' first.', true); sel.focus(); return; }
  var qi = card.querySelector('input[name=qty]'), q = Math.min(MAXQ, Math.max(1, parseInt(qi.value, 10) || 1)); qi.value = q;
  var line = cart.filter(function(l){ return l.id === id && (l.opt || '') === opt; })[0];
  if(line) line.qty = Math.min(MAXQ, line.qty + q); else cart.push({id:id, opt:opt, qty:q});
  save(); render();
  flash(card, '\u2713 Added to cart');
  say('Added ' + q + ' x ' + (c.opt ? cname(c) + ' (' + c.opt + ' ' + opt + ')' : cname(c)) + ' to your cart. ' + count() + ' item' + (count() === 1 ? '' : 's') + ', total ' + money(total()) + '.');
 });
});

$('sftb-checkout').addEventListener('click', function(){
 if(!cart.length) return;
 var f = document.createElement('form'); f.method = 'post'; f.action = PAYPAL_URL; f.style.display = 'none';
 var add = function(n, v){ var i = document.createElement('input'); i.type = 'hidden'; i.name = n; i.value = v; f.appendChild(i); };
 add('cmd', '_cart'); add('upload', '1'); add('business', PAYPAL_BUSINESS); add('currency_code', 'USD'); add('charset', 'utf-8');
 add('no_shipping', '2'); add('return', RETURN_URL); add('cancel_return', CANCEL_URL);
 add('handling_cart', shipFor(cart).toFixed(2));
 cart.forEach(function(l, i){ var n = i + 1;
  add('item_name_' + n, label(l)); add('amount_' + n, CAT[l.id].price.toFixed(2)); add('quantity_' + n, String(l.qty));
 });
 document.body.appendChild(f); f.submit();
});
render();
if(thanked) setTimeout(function(){ root.scrollIntoView(); }, 50);
})();
