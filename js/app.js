(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sb=supabase.createClient('https://ikjqsaosfnwanhhclgut.supabase.co','sb_publishable_NoZSRorQaC-Z79aUOwybkA_brGD7rUI');
const ADMIN='email.istiaqahmed2019@gmail.com',STATIC=new Set(['books','anatomy','physiology','biochemistry','histology','others']);
const PAL=['#38bdf8','#6366f1','#2dd4bf','#f59e0b','#fb7185','#a78bfa','#34d399','#e879f9'];
const ICONS='stethoscope monitor_heart local_hospital medical_services vaccines medication bloodtype healing biotech science psychology school menu_book auto_stories quiz library_books edit_note draw lightbulb folder category bookmark radiology skeleton genetics microbiology dna labs clinical_notes mental_health nutrition book import_contacts local_library description summarize note_stack slideshow video_library image translate public star favorite trophy rocket_launch accessibility_new vital_signs'.split(' ');
const sl=t=>String(t||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,55)||'category-'+Date.now();
const say=t=>$('#msg').textContent=t||'';
let shelves=[],cats=[],dbPosts=[],gone=[],editKey=null,editCat=null,isAdmin=false;

/* ---------- data: built-in posts + Supabase posts, overrides, ordering ---------- */
async function load(){
 const q=t=>sb.from(t).select('*').then(r=>r.error?[]:r.data||[],()=>[]);
 const [c,p,ov,so,co]=await Promise.all(['post_categories','posts','static_post_overrides','static_post_order','category_order'].map(q));
 cats=c;dbPosts=[...p].sort((a,b)=>(a.order_no||1)-(b.order_no||1));gone=[];
 const O={},SO={},CO={},used=new Set();
 ov.forEach(x=>O[x.card_key]=x);so.forEach(x=>SO[x.card_key]=x.position);co.forEach(x=>CO[x.slug]=x.position);
 const list=window.STATIC_SHELVES.map((s,i)=>{const cs=[];
  s.cards.forEach(c=>{const b='s-'+s.slug+'-'+sl(c.title);let k=b,n=2;while(used.has(k))k=b+'-'+n++;used.add(k);
   const o=O[k]||{},card={key:k,cat:s.slug,title:o.title||c.title,desc:o.description||c.desc,img:o.thumbnail_url||c.img,badge:o.category_badge||c.badge,fmt:o.card_format||c.fmt,link:o.download_link||c.link,tags:o.searchable_keywords||c.tags,pos:SO[k]};
   o.is_deleted?gone.push(card):cs.push(card)});
  cs.sort((a,b)=>(a.pos??1e6)-(b.pos??1e6));
  return{slug:s.slug,name:s.name,icon:s.icon,desc:s.desc,color:PAL[i%PAL.length],static:1,cards:cs,i}});
 cats.forEach(c=>{if(!list.some(s=>s.slug===c.slug))list.push({slug:c.slug,name:c.name,icon:c.icon||'folder',desc:c.description||'',color:c.theme_color||PAL[list.length%PAL.length],id:c.id,cards:[],i:list.length})});
 dbPosts.forEach(p=>{const slug=String(p.category_slug||'').toLowerCase();let s=list.find(x=>x.slug===slug);
  if(!s){s={slug,name:slug,icon:'folder',desc:'',color:PAL[0],cards:[],i:list.length};list.push(s)}
  s.cards.push({key:p.id,db:1,cat:slug,title:p.title,desc:p.description,img:p.thumbnail_url,badge:p.category_badge||s.name,fmt:p.card_format,link:p.download_link||p.destination_link,tags:p.searchable_keywords,created:p.created_at,dl:p.download_count,order:p.order_no})});
 shelves=list.sort((a,b)=>(CO[a.slug]??1e3+a.i)-(CO[b.slug]??1e3+b.i));
}
async function refresh(){await load();window.LIB.build(shelves);drawMarquee();checkNew();if(isAdmin)drawAdmin()}
Object.assign(window.LIB,{openAdmin:()=>openAdmin(),open:c=>{if(c.db)try{sb.rpc('increment_download',{post_id:c.key}).then(()=>{},()=>{})}catch(_){}window.open(c.link||'#','_blank','noopener')}});

/* ---------- admin: Google sign-in, authorized email + admin_users check ---------- */
const show=(ok,t)=>{isAdmin=ok;$('#login').hidden=ok;$('#dash').hidden=!ok;say(t)};
async function check(){
 const {data}=await sb.auth.getSession(),u=data?.session?.user;if(!u)return show(false,'');
 if((u.email||'').toLowerCase()!==ADMIN){
  sb.functions.invoke('unauthorized-login-alert',{body:{attempted_email:u.email,reason:'Unauthorized Google account',attempted_at:new Date().toISOString(),page_url:location.href,user_agent:navigator.userAgent}}).catch(()=>{});
  await sb.auth.signOut();return show(false,'This Google account is not authorized.')}
 const {data:a}=await sb.from('admin_users').select('user_id').eq('user_id',u.id).maybeSingle();
 if(!a){await sb.auth.signOut();return show(false,'This account is not on the admin list.')}
 show(true,'Signed in as '+u.email);drawAdmin();
}
const openAdmin=()=>{if(window.LIB.goPad)window.LIB.goPad();if(innerWidth<760)$('#padUI').classList.add('full');check()};
document.addEventListener('click',e=>{if(e.target.closest('.openAdmin'))openAdmin()});
$('#google').onclick=async()=>{const {error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname,queryParams:{access_type:'offline',prompt:'select_account'}}});if(error)say(error.message)};
$('#signout').onclick=async()=>{await sb.auth.signOut();show(false,'Signed out.')};
$('#refresh').onclick=async()=>{await refresh();say('Refreshed.')};
sb.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_IN'&&/code=|access_token/.test(location.search+location.hash)&&!$('#padUI').classList.contains('full'))openAdmin()});
$$('.tabs [data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
function tab(n){$$('.tabs [data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab===n));$$('.tab').forEach(t=>t.hidden=t.id!=='t_'+n)}

function drawAdmin(){drawPosts();drawCats();drawStats();fillSelects()}
function fillSelects(){
 $('#f_cat').innerHTML=shelves.map(s=>`<option value="${esc(s.slug)}">${esc(s.name)}</option>`).join('');
 $('#c_pos').innerHTML='<option value="end">At the end (last shelf)</option><option value="start">At the start (first shelf)</option>'+shelves.map(s=>`<option value="after:${esc(s.slug)}">After “${esc(s.name)}”</option>`).join('');
 $('#c_icons').innerHTML=ICONS.map(i=>`<option value="${i}">`).join('');
}
function drawPosts(){
 $('#t_posts').innerHTML=shelves.map(s=>`<h3>${esc(s.name)} <small>${s.cards.length}</small></h3><ul class="plist">${s.cards.map(c=>`<li><span>${esc(c.title)}<em>${c.db?'admin post':'built-in'}</em></span><button data-mv="${esc(c.key)}" data-d="-1" title="Move up">↑</button><button data-mv="${esc(c.key)}" data-d="1" title="Move down">↓</button><button data-ed="${esc(c.key)}">Edit</button><button data-rm="${esc(c.key)}">Delete</button></li>`).join('')||'<li><span>No posts yet.</span></li>'}</ul>`).join('')
  +(gone.length?`<h3>Deleted built-in posts</h3><ul class="plist">${gone.map(c=>`<li><span>${esc(c.title)}</span><button data-rs="${esc(c.key)}">Restore</button></li>`).join('')}</ul>`:'');
}
const find=k=>shelves.flatMap(s=>s.cards).find(c=>String(c.key)===k);
$('#t_posts').onclick=async e=>{
 const d=e.target.dataset,k=d.mv||d.ed||d.rm||d.rs;if(!k)return;
 if(d.ed){const c=find(k);if(!c)return;editKey=c.db?null:c.key;$('#f_id').value=c.db?c.key:'';
  $('#f_cat').value=c.cat;$('#f_cat').disabled=!c.db;$('#f_ord').disabled=!c.db;
  $('#f_title').value=c.title||'';$('#f_desc').value=c.desc||'';$('#f_link').value=c.link||'';$('#f_img').value=c.img||'';$('#f_badge').value=c.badge||'';$('#f_fmt').value=c.fmt||'';$('#f_ord').value=c.order||1;$('#f_tags').value=c.tags||'';
  $('#f_head').textContent=c.db?'Edit post':'Edit built-in post';say('Editing "'+c.title+'"');return tab('form')}
 let r;
 if(d.rm){const c=find(k);if(!confirm('Delete "'+c.title+'"?'))return;r=c.db?await sb.from('posts').delete().eq('id',k):await sb.from('static_post_overrides').upsert({card_key:k,is_deleted:true},{onConflict:'card_key'})}
 if(d.rs)r=await sb.from('static_post_overrides').upsert({card_key:k,is_deleted:false},{onConflict:'card_key'});
 if(d.mv){const c=find(k),s=shelves.find(x=>x.slug===c.cat),g=s.cards.filter(x=>!!x.db===!!c.db),i=g.indexOf(c),j=i+ +d.d;if(j<0||j>=g.length)return;[g[i],g[j]]=[g[j],g[i]];
  const rs=c.db?await Promise.all(g.map((x,n)=>sb.from('posts').update({order_no:n+1}).eq('id',x.key))):[await sb.from('static_post_order').upsert(g.map((x,n)=>({card_key:x.key,position:n})),{onConflict:'card_key'})];r=rs.find(x=>x.error)||{}}
 if(r?.error)return say(r.error.message+' (the related table may need to be created in Supabase)');
 say('Done.');await refresh();
};
function resetForm(){editKey=null;$('#f_id').value='';$('#f_cat').disabled=false;$('#f_ord').disabled=false;$('#f_head').textContent='New post';$('#pf').reset()}
$('#f_reset').onclick=()=>{resetForm();say('')};
$('#pf').onsubmit=async e=>{
 e.preventDefault();const f=id=>$('#'+id).value.trim();let img=f('f_img');const file=$('#f_file').files[0];
 if(file){const path='posts/'+Date.now()+'-'+sl(file.name.replace(/\.[^.]+$/,''))+'.'+file.name.split('.').pop();
  const up=await sb.storage.from('thumbnails').upload(path,file);if(up.error)return say(up.error.message);img=sb.storage.from('thumbnails').getPublicUrl(path).data.publicUrl}
 let r;
 if(editKey){const o={card_key:editKey,title:f('f_title'),description:f('f_desc'),category_badge:f('f_badge'),card_format:f('f_fmt')||null,download_link:f('f_link'),searchable_keywords:f('f_tags'),is_deleted:false};if(img)o.thumbnail_url=img;
  r=await sb.from('static_post_overrides').upsert(o,{onConflict:'card_key'})}
 else{const row={category_slug:f('f_cat'),title:f('f_title'),description:f('f_desc'),download_link:f('f_link'),destination_link:f('f_link'),thumbnail_url:img,category_badge:f('f_badge')||null,card_format:f('f_fmt')||null,order_no:+f('f_ord')||1,searchable_keywords:f('f_tags')},id=f('f_id');
  r=id?await sb.from('posts').update(row).eq('id',id):await sb.from('posts').insert(row)}
 if(r.error)return say(r.error.message);
 resetForm();say('Saved.');await refresh();tab('posts');
};

/* ---------- categories ---------- */
function drawCats(){
 $('#clist').innerHTML=`<ul class="plist">${shelves.map(s=>`<li><span class="material-symbols-outlined" style="color:${esc(s.color)}">${esc(s.icon)}</span><span>${esc(s.name)}<em>${s.cards.length} posts${s.static?' · built-in':''}</em></span><button data-cu="${esc(s.slug)}">↑</button><button data-cd="${esc(s.slug)}">↓</button>${s.static?'':`<button data-ce="${esc(s.slug)}">Edit</button><button data-cx="${esc(s.slug)}">Delete</button>`}</li>`).join('')}</ul>`;
}
async function saveOrder(slugs){const r=await sb.from('category_order').upsert(slugs.map((slug,position)=>({slug,position})),{onConflict:'slug'});if(r.error)say(r.error.message);return !r.error}
$('#clist').onclick=async e=>{
 const d=e.target.dataset,slug=d.cu||d.cd||d.ce||d.cx;if(!slug)return;const list=shelves.map(s=>s.slug),i=list.indexOf(slug),s=shelves[i];
 if(d.cu||d.cd){const j=i+(d.cu?-1:1);if(j<0||j>=list.length)return;[list[i],list[j]]=[list[j],list[i]];if(await saveOrder(list))await refresh()}
 if(d.ce){editCat=s;$('#c_name').value=s.name;$('#c_desc').value=s.desc;$('#c_icon').value=s.icon;$('#c_color').value=s.color;$('#c_head').textContent='Edit category';say('Editing category "'+s.name+'"')}
 if(d.cx){if(!confirm('Delete category "'+s.name+'"? Its posts will no longer show on any shelf.'))return;
  const r=await sb.from('post_categories').delete().eq('id',s.id);if(r.error)return say(r.error.message);
  try{await sb.from('category_order').delete().eq('slug',slug)}catch(_){}say('Category deleted.');await refresh()}
};
$('#cf').onsubmit=async e=>{
 e.preventDefault();const v=id=>$('#'+id).value.trim(),name=v('c_name'),o={name,description:v('c_desc'),icon:v('c_icon')||'folder',theme_color:v('c_color')};let r;
 if(editCat){r=await sb.from('post_categories').update(o).eq('id',editCat.id)}
 else{const slug=sl(name);if(shelves.some(s=>s.slug===slug))return say('A category with this name already exists.');
  r=await sb.from('post_categories').insert({...o,slug});
  if(!r.error){const list=shelves.map(s=>s.slug).filter(x=>x!==slug),p=v('c_pos');if(p==='start')list.unshift(slug);else if(p.startsWith('after:')){const k=list.indexOf(p.slice(6));list.splice(k<0?list.length:k+1,0,slug)}else list.push(slug);await saveOrder(list)}}
 if(r.error)return say(r.error.message);
 editCat=null;$('#cf').reset();$('#c_head').textContent='New category';say('Category saved.');await refresh();
};
$('#c_reset').onclick=()=>{editCat=null;$('#cf').reset();$('#c_head').textContent='New category';say('')};

/* ---------- stats ---------- */
function drawStats(){
 const all=shelves.flatMap(s=>s.cards),wk=all.filter(c=>c.created&&Date.now()-new Date(c.created)<6048e5).length,hasDl=all.some(c=>c.dl!=null),top=hasDl?[...all].sort((a,b)=>(b.dl||0)-(a.dl||0))[0]:null;
 $('#t_stats').innerHTML=`<div class="stats"><div><b>${all.length}</b>posts on shelves</div><div><b>${shelves.length}</b>shelves</div><div><b>${dbPosts.length}</b>admin posts</div><div><b>${wk}</b>added this week</div>${hasDl?`<div><b>${all.reduce((a,c)=>a+(c.dl||0),0)}</b>downloads</div>`:''}</div>${top&&top.dl?`<p>Most downloaded: <b>${esc(top.title)}</b> (${top.dl})</p>`:''}`;
}

/* ---------- marquee: recent posts, click flies to the card ---------- */
const isNew=c=>c.created&&Date.now()-new Date(c.created)<6048e5;
function drawMarquee(){
 const el=$('#marq'),tr=$('#mqTrack');if(!el||!tr)return;
 let items=shelves.flatMap(s=>s.cards).filter(c=>c.created).sort((a,b)=>new Date(b.created)-new Date(a.created)).slice(0,8);
 if(!items.length)items=shelves.flatMap(s=>s.cards.slice(-2)).slice(0,8); /* no dated posts yet: latest built-in ones */
 if(!items.length){el.hidden=true;return}
 let arr=items;while(arr.length<8)arr=arr.concat(items);
 const html=arr.map(c=>`<button type="button" data-k="${esc(c.key)}">${esc(c.title)}</button>`).join('');
 tr.innerHTML=html+html.replace(/<button /g,'<button tabindex="-1" aria-hidden="true" ');tr.style.setProperty('--d',arr.length*6+'s');el.hidden=false;
}
$('#marq').addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(b&&window.LIB.goCard)window.LIB.goCard(b.dataset.k)});

/* ---------- notifications: browser alerts for new posts (permission is asked only when the button is pressed) ---------- */
const NK='a139-notify',SEEN='a139-seen',canN='Notification' in window,ls={get:k=>{try{return localStorage.getItem(k)}catch(_){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(_){}}};
const notifyOn=()=>canN&&Notification.permission==='granted'&&ls.get(NK)==='1';
function paintN(){const b=$('#notifyBtn');if(!b)return;const t=b.querySelector('.t'),on=notifyOn();b.classList.toggle('on',on);b.disabled=!canN||Notification.permission==='denied';
 t.textContent=!canN?'Not supported':Notification.permission==='denied'?'Blocked in browser':on?'Notifications on':'Enable notifications'}
function pushN(title,body,tag){const o={body,icon:'assets/website/logo.jpg',tag};
 try{if(navigator.serviceWorker)return navigator.serviceWorker.getRegistration().then(r=>r?r.showNotification(title,o):new Notification(title,o)).catch(()=>{try{new Notification(title,o)}catch(_){}});new Notification(title,o)}catch(_){}}
$('#notifyBtn').onclick=async()=>{
 if(!canN)return;
 if(notifyOn()){ls.set(NK,'0');paintN();return}
 const p=Notification.permission==='granted'?'granted':await Notification.requestPermission();
 if(p==='granted'){ls.set(NK,'1');const n=dbPosts.map(x=>x.created_at).filter(Boolean).sort().pop();if(n)ls.set(SEEN,n);pushN('Notifications are on','You will be alerted when a new MediNote post is added.','a139-welcome')}
 paintN()};
function announce(p){if(!notifyOn()||!p)return;pushN('New in MediNote',p.title||'A new post was added','a139-'+p.id)}
function checkNew(){const n=[...dbPosts].filter(x=>x.created_at).sort((a,b)=>a.created_at<b.created_at?1:-1)[0];paintN();
 if(!n)return;const seen=ls.get(SEEN);if(seen&&n.created_at>seen)announce(n);ls.set(SEEN,n.created_at)}
setInterval(async()=>{if(!notifyOn()||document.hidden)return;
 try{const {data}=await sb.from('posts').select('id,title,created_at').order('created_at',{ascending:false}).limit(1);const n=data&&data[0],seen=ls.get(SEEN);
  if(n&&n.created_at&&(!seen||n.created_at>seen)){ls.set(SEEN,n.created_at);announce(n)}}catch(_){}},18e4);

refresh();
})();
