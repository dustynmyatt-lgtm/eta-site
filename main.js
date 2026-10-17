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
const fmtShort=(d,part)=>{const t=new Date(d+'T12:00:00');if(isNaN(t))return part==='day'?d:'';return part==='month'?t.toLocaleDateString('en-US',{month:'short'}):part==='day'?String(t.getDate()):String(t.getFullYear())};
const fail=(id,what)=>{const e=$(id);if(e)e.innerHTML=`<p class="sub">${what} unavailable right now.</p>`};
const today=(d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)(new Date());

load('members').then(ms=>{$('members-grid').innerHTML=ms.map(m=>`<div class="card">${m.photo?`<img class="head" src="${src(m.photo)}" loading="lazy" width="600" height="600" alt="${esc(m.name)}, East Texas Adrenaline">`:''}<h3>${esc(m.name)}</h3><p class="role">${esc(m.role)}</p>${m.bio?`<p class="bio">${esc(m.bio)}</p>`:''}</div>`).join('')}).catch(()=>fail('members-grid','Band info'));

load('releases').then(rs=>{
 // Music: one row per release, newest first. The four logo EPs also build the small ETA logo, each row showing its corner.
 const order=['top-left','top-right','bottom-left','bottom-right'];
 const q=order.map(p=>rs.find(r=>r.type==='ep'&&r.logo_position===p)).filter(Boolean);
 const kind=r=>r.type==='album'?'Album':r.type==='ep'?'EP':r.type;
 const corner=r=>q.includes(r)?`<span class="sftb-qi q-${esc(r.logo_position)}" title="${esc(r.logo_position.replace('-',' '))} of the EP logo" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`:'';
 $('discography').innerHTML='<ol class="yr-list" aria-label="Releases by year, newest first">'+rs.slice().sort((a,b)=>b.year-a.year).map(r=>`<li><a class="yr-row${/NEW/i.test(r.note)?' new':''}" href="${esc(r.link||'#')}" target="_blank" rel="noopener"><span class="yr-y">${esc(r.year)}</span><img src="${src(r.cover)}" loading="lazy" width="600" height="600" alt="${esc(r.title)} cover art"><span class="yr-t"><b>${esc(r.title)}${corner(r)}</b><small>${esc(kind(r))}${r.note?' · '+esc(r.note):''}</small></span></a></li>`).join('')+'</ol>';
 if(q.length===4){$('logo4').innerHTML=q.map(r=>`<a href="${esc(r.link||'#')}" target="_blank" rel="noopener" title="${esc(r.title)} (${esc(r.year)})"><img src="${src(r.cover)}" loading="lazy" width="600" height="600" alt="${esc(r.title)} EP cover (${esc(r.year)}), one quarter of the ETA logo"></a>`).join('');
  $('logo-cap').textContent='Put the four EPs together and you get the full ETA star and skull logo: '+q.map(r=>r.title).join(', ')+'.';}
 else $('logo-box').style.display='none';
}).catch(()=>fail('discography','Discography'));

load('news').then(ns=>{ns.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 $('news-list').innerHTML=ns.length?ns.map(n=>`<article class="post">${n.image?`<img src="${src(n.image)}" loading="lazy" alt="${esc(n.title)}">`:''}<div class="post-body"><p class="post-date">${fmtDate(n.date)}</p><h3>${esc(n.title)}</h3><div class="post-text">${n.body||''}</div>${n.url?`<p class="post-link"><a href="${esc(n.url)}" target="_blank" rel="noopener">View on Facebook</a></p>`:''}</div></article>`).join(''):'<p class="sub">No news yet.</p>';
}).catch(()=>fail('news-list','News'));

load('gallery').then(gs=>{const dim=g=>(+g.width>0&&+g.height>0)?` width="${+g.width}" height="${+g.height}"`:'';$('gallery-grid').innerHTML=gs.map(g=>`<figure><a href="${src(g.image)}" target="_blank" rel="noopener"><img src="${src(g.image)}" loading="lazy" decoding="async"${dim(g)} alt="${esc(g.alt||g.caption)}"></a>${g.caption?`<figcaption>${esc(g.caption)}</figcaption>`:''}</figure>`).join('');galleryScroller()}).catch(()=>fail('gallery-grid','Photos'));
// Photo gallery: horizontal scroller. Native swipe/scroll + CSS scroll-snap; arrow buttons and keyboard arrows step one photo.
function galleryScroller(){
 const g=$('gallery-grid'),w=g&&g.parentElement;if(!w)return;
 const prev=w.querySelector('.gal-prev'),next=w.querySelector('.gal-next');
 const rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)');
 const items=()=>[...g.children];
 const update=()=>{const max=g.scrollWidth-g.clientWidth;const none=max<=2;w.classList.toggle('no-scroll',none);if(prev)prev.disabled=none||g.scrollLeft<=2;if(next)next.disabled=none||g.scrollLeft>=max-2};
 const step=dir=>{const it=items();if(!it.length)return;const pad=parseFloat(getComputedStyle(g).scrollPaddingLeft)||0,x=g.scrollLeft+pad;
  let i=it.findIndex(el=>el.offsetLeft>=x-2);if(i<0)i=it.length-1;
  const t=dir>0?it[Math.min(i+1,it.length-1)]:it[Math.max(i-1,0)];
  g.scrollTo({left:Math.max(t.offsetLeft-pad,0),behavior:rm&&rm.matches?'auto':'smooth'})};
 if(prev)prev.onclick=()=>step(-1);if(next)next.onclick=()=>step(1);
 g.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();step(e.key==='ArrowRight'?1:-1)}});
 let raf=0;g.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;update()})},{passive:true});
 window.addEventListener('resize',update);g.querySelectorAll('img').forEach(im=>im.complete||im.addEventListener('load',update,{once:true}));update();
}

load('gigs').then(gs=>{const up=$('up'),pa=$('past');gs.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 const li=x=>`<li class="${x.tba?'tba':''}"><span class="d">${esc(x.display||fmtDate(x.date))}</span><span class="v"><b>${esc(x.venue)}</b>${x.city?' · '+esc(x.city):''}${x.with?'<br><small>with '+esc(x.with)+'</small>':''}${x.note?'<br><small>'+esc(x.note)+'</small>':''}</span>${x.tba?'<span class="badge">TBA</span>':''}</li>`;
 const dbox=x=>{const m=/^([A-Za-z]+)\s+(\d{4})$/.exec(x.display||'');if(m)return `<span class="ps-m">${esc(m[1].slice(0,3))}</span><span class="ps-day">—</span><span class="ps-y">${esc(m[2])}</span>`;if(x.display)return `<span class="ps-y">${esc(x.display)}</span>`;return `<span class="ps-m">${esc(fmtShort(x.date,'month'))}</span><span class="ps-day">${esc(fmtShort(x.date,'day'))}</span><span class="ps-y">${esc(fmtShort(x.date,'year'))}</span>`};
 const yt=u=>/^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(u||'');
 const pli=(x,i)=>`<li class="ps${i>=SHOW?' ps-more':''}"><time class="ps-d" datetime="${esc(x.display?String(x.date).slice(0,7):x.date)}" title="${esc(x.display||fmtDate(x.date))}">${dbox(x)}</time><span class="ps-v"><b>${esc(x.venue||x.city)}</b>${x.venue&&x.city?'<span class="ps-c">'+esc(x.city)+'</span>':''}${x.with?'<small>with '+esc(x.with)+'</small>':''}${x.note?'<small class="ps-n">★ '+esc(x.note)+'</small>':''}</span>${yt(x.video)?`<a class="ps-w" href="${esc(x.video)}" target="_blank" rel="noopener" aria-label="Watch video from ${esc(x.display||fmtDate(x.date))}">▶ Watch</a>`:''}</li>`;
 const SHOW=6,U=gs.filter(x=>x.date>=today),P=gs.filter(x=>x.date<today).reverse();
 up.innerHTML=U.length?U.map(li).join(''):'<li class="empty-up"><span class="v"><b>New dates coming soon.</b><br>Booking all-ages and family-friendly shows first, plus bars and clubs, across SETX, Houston, Lake Charles and beyond.</span><a class="btn sm" href="#contact">Book Us</a></li>';
 pa.innerHTML=P.length?P.map(pli).join(''):'<li class="ps">No past shows listed.</li>';
 const tg=$('past-toggle');
 if(tg&&P.length>SHOW){tg.hidden=false;const lbl=()=>tg.textContent=pa.classList.contains('all')?'Show fewer':`Show all ${P.length} shows`;lbl();tg.onclick=()=>{tg.setAttribute('aria-expanded',pa.classList.toggle('all'));lbl()}}
}).catch(()=>fail('up','Gig list'));

if($('merch-grid'))load('merch').then(ms=>{const real=ms.filter(m=>m.available&&m.url);
 if(!real.length){const s=$('merch-grid');s.innerHTML='';s.hidden=true;return;}
 $('merch-grid').innerHTML=real.map(m=>`<div class="card prod">${m.image?`<img class="pimg" src="${src(m.image)}" loading="lazy" width="600" height="600" alt="${esc(m.title)}">`:''}<h3>${esc(m.title)}</h3>${m.description?`<p class="sub">${esc(m.description)}</p>`:''}${m.price?`<p class="price">${esc(m.price)}</p>`:''}<a class="btn sm" href="${esc(m.url)}" target="_blank" rel="noopener">Buy on ${esc(m.vendor||'store')}</a></div>`).join('')}).catch(()=>fail('merch-grid','Merch'));
load('press').then(ps=>{
 const byDate=(a,b)=>String(b.date).localeCompare(String(a.date));ps.sort(byDate);
 const fd=d=>{if(!d)return'';if(/^\d{4}-\d{2}$/.test(d))return new Date(d+'-15T12:00:00').toLocaleDateString('en-US',{month:'short',year:'numeric'});const t=new Date(d+'T12:00:00');return isNaN(t)?esc(d):t.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})};
 const src_=p=>p.url?`<a class="pr-src" href="${esc(p.url)}" target="_blank" rel="noopener">${p.type==='review'?'Read the full review':'Read source'} →</a>`:'';
 const score=s=>{if(!s)return'';const m=String(s).match(/^([^/]+)\/(.+)$/);return `<span class="pq-score" aria-label="Score ${esc(s)}">${m?esc(m[1])+'<small>/'+esc(m[2])+'</small>':esc(s)}</span>`};
 const feat=ps.filter(p=>p.featured),arch=ps.filter(p=>!p.featured);
 const chart=feat.find(p=>p.type==='chart');
 const ones=feat.filter(p=>p.type==='radio'&&/#1\b/.test(p.headline||''));
 const quotes=feat.filter(p=>p.quote&&p.type!=='chart');
 const rest=feat.filter(p=>p!==chart&&!ones.includes(p)&&!quotes.includes(p));
 const qcard=p=>`<article class="pq"><div class="pq-top"><span class="pq-outlet">${esc(p.outlet)}</span>${score(p.score)}</div><p class="k">${esc(p.type)}${p.release?' · <em>'+esc(p.release)+'</em>':''}${p.writer?' · '+esc(p.writer):''}${p.date?' · '+fd(p.date):''}</p><blockquote>“${esc(p.quote)}”</blockquote>${p.detail?`<p class="pq-detail">${esc(p.detail)}</p>`:''}${src_(p)}</article>`;
 const ccard=c=>`<article class="chart-hl"><p class="k">Radio · ${esc(c.outlet)}</p><h3>${esc(c.headline)}</h3>${(c.stats||[]).length?`<div class="stats">${c.stats.map(s=>`<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}</div>`:''}${c.detail?`<p class="chart-detail">${esc(c.detail)}</p>`:''}${ones.length?`<ul class="ones">${ones.map(o=>`<li><span class="n1">#1</span><span><b>${esc(o.detail||o.headline)}</b><small>${fd(o.date)}</small></span></li>`).join('')}</ul>`:''}${src_(c)}</article>`;
 const card=p=>`<article class="pr ${esc(p.type)}"><p class="k">${esc(p.type)} · ${esc(p.outlet)}${p.date?' · '+fd(p.date):''}</p><h3>${esc(p.headline)}</h3>${p.detail?`<p>${esc(p.detail)}</p>`:''}${src_(p)}</article>`;
 const row=p=>`<li><span class="ad">${fd(p.date)}</span><span class="at"><b>${esc(p.outlet)}</b> · ${esc(p.headline)}${p.writer?' <small>by '+esc(p.writer)+'</small>':''}${p.detail?'<br><small>'+esc(p.detail)+'</small>':''}${p.quote?`<q>${esc(p.quote)}</q>`:''}</span>${p.url?`<a href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="Source: ${esc(p.outlet)}">Source →</a>`:''}</li>`;
 let h='<div class="press-feature">'+quotes.map(qcard).join('')+(chart?ccard(chart):ones.map(card).join(''))+'</div>';
 if(rest.length)h+='<div class="press">'+rest.map(card).join('')+'</div>';
 if(arch.length)h+=`<details class="press-more"><summary>More press <span>(${arch.length})</span></summary><ul class="arch">${arch.map(row).join('')}</ul></details>`;
 $('press-list').innerHTML=h;
}).catch(()=>fail('press-list','Press'));
})();
