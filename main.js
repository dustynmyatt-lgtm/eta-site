// Renders the changeable parts of the page from the JSON files in /data.
// Edit content in Pages CMS (or the JSON files) — no need to touch this file.
(function(){
document.getElementById('yr').textContent=new Date().getFullYear();
const menu=document.getElementById('menu'),links=document.getElementById('links');
menu.onclick=()=>menu.setAttribute('aria-expanded',links.classList.toggle('open'));links.onclick=()=>{links.classList.remove('open');menu.setAttribute('aria-expanded','false')};
document.querySelectorAll('.yt').forEach(y=>y.querySelector('button').onclick=()=>{y.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${y.dataset.id}?autoplay=1" title="Misfortune video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`});

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const src=p=>esc(p||'');
const $=id=>document.getElementById(id);
const load=n=>{if(window.ETA_DATA&&window.ETA_DATA[n]!=null)return Promise.resolve(window.ETA_DATA[n]);return fetch('data/'+n+'.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(n);return r.json()})};
const fmtDate=d=>{if(/^\d{4}-\d{2}$/.test(d))return new Date(d+'-15T12:00:00').toLocaleDateString('en-US',{month:'short',year:'numeric'});const t=new Date(d+'T12:00:00');return isNaN(t)?esc(d):t.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})};
const todo=t=>t?`<p class="todo">${/^TODO/.test(t)?esc(t):'TODO: '+esc(t)}</p>`:'';
const fail=(id,what)=>{const e=$(id);if(e)e.innerHTML=`<p class="sub">${what} unavailable right now.</p>`};
const today=new Date().toISOString().slice(0,10);

load('members').then(ms=>{$('members-grid').innerHTML=ms.map(m=>`<div class="card">${m.photo?`<img class="head" src="${src(m.photo)}" loading="lazy" width="600" height="600" alt="${esc(m.name)}, East Texas Adrenaline">`:'<div class="ph">?</div>'}<h3>${esc(m.name)}</h3><p class="role">${esc(m.role)}</p>${m.bio?`<p class="bio">${esc(m.bio)}</p>`:''}${todo(m.todo)}</div>`).join('')}).catch(()=>fail('members-grid','Band info'));

load('releases').then(rs=>{
 const card=r=>`<a class="rel${/NEW/i.test(r.note)?' new':''}" href="${esc(r.link||'#')}" target="_blank" rel="noopener"><img class="cov" src="${src(r.cover)}" loading="lazy" width="600" height="600" alt="${esc(r.title)} cover art"><b>${esc(r.title)}</b><span>${esc(r.year)}${r.note?' · '+esc(r.note):''}</span></a>`;
 $('albums').innerHTML=rs.filter(r=>r.type==='album').sort((a,b)=>b.year-a.year).map(card).join('');
 const vinyl=rs.filter(r=>r.type!=='album'&&r.type!=='ep').sort((a,b)=>b.year-a.year);
 const v=$('vinyl'); if(v){v.innerHTML=vinyl.length?vinyl.map(card).join(''):'<p class="sub">No vinyl releases listed.</p>';}
 const order=['top-left','top-right','bottom-left','bottom-right'];
 const q=order.map(p=>rs.find(r=>r.type==='ep'&&r.logo_position===p)).filter(Boolean);
 if(q.length===4){$('logo4').innerHTML=q.map(r=>`<a class="q" href="${esc(r.link||'#')}" target="_blank" rel="noopener" title="${esc(r.title)} (${esc(r.year)})"><img src="${src(r.cover)}" loading="lazy" width="600" height="600" alt="${esc(r.title)} EP cover (${esc(r.year)}), one quarter of the ETA logo"><span>${esc(r.title)} · ${esc(r.year)}</span></a>`).join('');
  $('logo-cap').textContent='Put the four EPs together and you get the full ETA star and skull logo: '+q.map(r=>r.title).join(', ')+'.';}
 else $('logo4').parentElement.style.display='none';
 $('eps-other').innerHTML=rs.filter(r=>r.type==='ep'&&!q.includes(r)).sort((a,b)=>b.year-a.year).map(card).join('');
}).catch(()=>fail('albums','Discography'));

load('news').then(ns=>{ns.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 $('news-list').innerHTML=ns.length?ns.map(n=>`<article class="post">${n.image?`<img src="${src(n.image)}" loading="lazy" alt="${esc(n.title)}">`:''}<div class="post-body"><p class="post-date">${fmtDate(n.date)}</p><h3>${esc(n.title)}</h3><div class="post-text">${n.body||''}</div></div></article>`).join(''):'<p class="sub">No news yet.</p>';
}).catch(()=>fail('news-list','News'));

load('gallery').then(gs=>{$('gallery-grid').innerHTML=gs.map(g=>`<figure><a href="${src(g.image)}" target="_blank" rel="noopener"><img src="${src(g.image)}" loading="lazy" alt="${esc(g.alt||g.caption)}"></a>${g.caption?`<figcaption>${esc(g.caption)}</figcaption>`:''}</figure>`).join('')}).catch(()=>fail('gallery-grid','Photos'));

load('gigs').then(gs=>{const up=$('up'),pa=$('past');gs.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 const li=(x,past)=>`<li class="${past?'past':x.tba?'tba':''}"><span class="d">${esc(x.display||fmtDate(x.date))}</span><span class="v"><b>${esc(x.venue)}</b>${x.city?' · '+esc(x.city):''}${x.with?'<br><small>with '+esc(x.with)+'</small>':''}${x.note&&!past?'<br><small>'+esc(x.note)+'</small>':''}</span>${x.tba&&!past?'<span class="badge">TBA</span>':''}</li>`;
 const U=gs.filter(x=>x.date>=today),P=gs.filter(x=>x.date<today).reverse();
 up.innerHTML=U.length?U.map(x=>li(x,false)).join(''):'<li class="empty-up"><span class="v"><b>New dates coming soon.</b><br>Booking all-ages and family-friendly shows first, plus bars and clubs, across SETX, Houston, Lake Charles and beyond.</span><a class="btn sm" href="#contact">Book Us</a></li>';
 pa.innerHTML=P.length?P.map(x=>li(x,true)).join(''):'<li>No past shows listed.</li>';
}).catch(()=>fail('up','Gig list'));

load('merch').then(ms=>{const real=ms.filter(m=>m.available&&m.url);
 if(!real.length){const s=$('merch-grid');s.innerHTML='';s.hidden=true;return;}
 $('merch-grid').innerHTML=real.map(m=>`<div class="card prod">${m.image?`<img class="pimg" src="${src(m.image)}" loading="lazy" width="600" height="600" alt="${esc(m.title)}">`:'<div class="ph">ETA</div>'}<h3>${esc(m.title)}</h3>${m.description?`<p class="sub">${esc(m.description)}</p>`:''}${m.price?`<p class="price">${esc(m.price)}</p>`:''}<a class="btn sm" href="${esc(m.url)}" target="_blank" rel="noopener">Buy on ${esc(m.vendor||'store')}</a></div>`).join('')}).catch(()=>fail('merch-grid','Merch'));
load('press').then(ps=>{ps.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 $('press-list').innerHTML=ps.map(p=>`<article class="pr ${esc(p.type)}"><p class="k">${esc(p.type)} · ${esc(p.outlet)}${p.date?' · '+fmtDate(p.date):''}</p><h3>${esc(p.headline)}</h3>${p.detail?`<p>${esc(p.detail)}</p>`:''}${p.quote?`<blockquote>“${esc(p.quote)}”</blockquote>`:''}${p.url?`<a href="${esc(p.url)}" target="_blank" rel="noopener">Read source →</a>`:''}${todo(p.todo)}</article>`).join('')}).catch(()=>fail('press-list','Press'));
})();
