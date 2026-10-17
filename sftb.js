/* Straight From the Band cart. Vanilla JS, no libraries, no cookies.
   The cart lives only in this browser's localStorage; nothing is sent anywhere
   until the fan clicks checkout, which posts a standard PayPal cart-upload form. */
(function(){
// Shipping (USD), set by Dustyn 2026-10-17: base charge once per order, plus a charge
// for each BIG unit (tees, drumstick pairs) after the first. Picks and tins add nothing.
var SFTB_SHIP_BASE = 5;
var SFTB_SHIP_PER_EXTRA_BIG = 2;
var PAYPAL_URL = 'https://www.paypal.com/cgi-bin/webscr';
var PAYPAL_BUSINESS = 'doandjb@sbcglobal.net';
var RETURN_URL = 'https://easttexasadrenaline.com/merch.html?order=thanks'; // after payment
var CANCEL_URL = 'https://easttexasadrenaline.com/merch.html';
var KEY = 'eta_sftb_cart', MAXQ = 10;
// Catalog is the source of truth for names and prices (stored cart only keeps id, option, qty).
var CAT = {
 'ringer':      {name:'Lawnmower Fist Fight Ringer Tee', price:30, big:true, opt:'Size',  opts:['M','L','XL','2XL']},
 'skulltee':    {name:'Black Skull & Star Tee',          price:30, big:true, opt:'Size',  opts:['M','L','XL','2XL']},
 'sticks':      {name:'Scott Credeur Signature Drumsticks (pair)', price:15, big:true},
 'tin':         {name:'Pick Tin',                        price:8,  big:false,  opt:'Color', opts:['Silver','Black']},
 'pick-darrell':{name:'Darrell Olbrych Signature Pick',  price:2, big:false},
 'pick-gedy':   {name:'Gedy Olbrych Signature Pick',     price:2, big:false}
};
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
function label(l){ var c = CAT[l.id]; return c.name + (c.opt ? ' - ' + c.opt + ' ' + l.opt : ''); }
function subtotal(){ return cart.reduce(function(s,l){ return s + CAT[l.id].price * l.qty; }, 0); }
// ship = base + per * max(0, bigUnits - 1); an empty cart has no shipping.
function shipFor(lines){
 if(!lines.length) return 0;
 var big = lines.reduce(function(s,l){ return s + (CAT[l.id] && CAT[l.id].big ? l.qty : 0); }, 0);
 return SFTB_SHIP_BASE + SFTB_SHIP_PER_EXTRA_BIG * Math.max(0, big - 1);
}
function total(){ return subtotal() + shipFor(cart); }
function count(){ return cart.reduce(function(s,l){ return s + l.qty; }, 0); }
function say(msg){ var s = $('sftb-status'); s.textContent = ''; setTimeout(function(){ s.textContent = msg; }, 30); }

function render(){
 var ul = root.querySelector('.sftb-lines'); ul.textContent = '';
 cart.forEach(function(l, i){
  var c = CAT[l.id], li = document.createElement('li');
  var name = document.createElement('span'); name.className = 'sftb-ln';
  name.textContent = c.name; if(c.opt){ var o = document.createElement('small'); o.textContent = c.opt + ': ' + l.opt; name.appendChild(o); }
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

var whole = function(n){ return '$' + (n % 1 ? n.toFixed(2) : n); };
root.querySelectorAll('.sftb-ship-base').forEach(function(e){ e.textContent = whole(SFTB_SHIP_BASE); });
root.querySelectorAll('.sftb-ship-extra').forEach(function(e){ e.textContent = whole(SFTB_SHIP_PER_EXTRA_BIG); });
root.querySelectorAll('.sftb-item').forEach(function(card){
 card.querySelector('.sftb-add').addEventListener('click', function(){
  var id = card.getAttribute('data-id'), c = CAT[id]; if(!c) return;
  var sel = card.querySelector('select[name=opt]'), opt = sel ? sel.value : '';
  if(c.opts && c.opts.indexOf(opt) < 0){ say('Please choose a ' + c.opt.toLowerCase() + ' for the ' + c.name + '.'); sel.focus(); return; }
  var qi = card.querySelector('input[name=qty]'), q = Math.min(MAXQ, Math.max(1, parseInt(qi.value, 10) || 1)); qi.value = q;
  var line = cart.filter(function(l){ return l.id === id && (l.opt || '') === opt; })[0];
  if(line) line.qty = Math.min(MAXQ, line.qty + q); else cart.push({id:id, opt:opt, qty:q});
  save(); render();
  say('Added ' + q + ' x ' + (c.opt ? c.name + ' (' + c.opt + ' ' + opt + ')' : c.name) + ' to your cart. ' + count() + ' item' + (count() === 1 ? '' : 's') + ', total ' + money(total()) + '.');
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
