/* ETA outbound-link counter. Privacy: no cookies, no storage, no IDs, no IP/UA/screen data.
   Sends only: link category, destination host+path (no query string), this page's path,
   utm_source/utm_campaign of this page's URL (if any), and the referring site's host name.
   Details: ANALYTICS.md. */
(function(){
if(!/^https?:$/.test(location.protocol)||!navigator.sendBeacon)return;
var EP='/api/click',H=location.hostname;
var RULES=[
 [/(^|\.)spotify\.com$/,'spotify'],[/(^|\.)music\.apple\.com$|(^|\.)itunes\.apple\.com$/,'apple_music'],
 [/(^|\.)youtube(-nocookie)?\.com$|(^|\.)youtu\.be$/,'youtube'],[/(^|\.)bandcamp\.com$/,'bandcamp'],
 [/(^|\.)tiktok\.com$/,'tiktok'],[/^m\.me$|(^|\.)messenger\.com$/,'messenger'],
 [/(^|\.)printful\.me$/,'merch'],
 [/(^|\.)(deezer|tidal|soundcloud|pandora|iheart|audiomack|reverbnation|amazon|napster|qobuz|shazam)\.com$|^music\.amazon\./,'music_other'],
 [/(^|\.)fortherecordtx\.com$/,'venue']
];
function cat(a,host){
 if(/(^|\.)facebook\.com$|(^|\.)fb\.com$|(^|\.)fb\.me$/.test(host))return /\/wrongtrackrecords\/?$/i.test(a.pathname)?'label':'facebook';
 for(var i=0;i<RULES.length;i++)if(RULES[i][0].test(host))return RULES[i][1];
 return a.closest&&a.closest('#press,.press,.press-feature,.arch')?'press':'other';
}
var q=new URLSearchParams(location.search),slug=function(v){v=(v||'').trim().toLowerCase();return /^[a-z0-9._-]{1,64}$/.test(v)?v:''};
var US=slug(q.get('utm_source')),UC=slug(q.get('utm_campaign')),R='';
try{var rh=document.referrer?new URL(document.referrer).hostname.toLowerCase():'';if(rh&&rh!==H)R=rh}catch(e){}
function send(o){o.p=location.pathname;o.us=US;o.uc=UC;o.r=R;try{navigator.sendBeacon(EP,JSON.stringify(o))}catch(e){}}
if(US||UC)send({t:'land',c:'campaign',d:location.pathname});
function onClick(e){
 try{
  if(e.type==='auxclick'&&e.button!==1)return;
  var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a)return;
  var d;
  if(a.protocol==='mailto:'){d='mailto:'+a.href.slice(7).split('?')[0];send({c:'email',d:d});return}
  if(!/^https?:$/.test(a.protocol)||a.hostname===H)return;
  var host=a.hostname.toLowerCase(),path=a.pathname,v=a.search.match(/[?&]v=([\w-]{6,20})/);
  if(v&&/youtube\.com$/.test(host)&&path==='/watch')path+='/'+v[1];// keep which video, drop the rest of the query
  send({c:cat(a,host),d:(host+path).slice(0,200)});
 }catch(err){}
}
document.addEventListener('click',onClick,true);
document.addEventListener('auxclick',onClick,true);
})();
