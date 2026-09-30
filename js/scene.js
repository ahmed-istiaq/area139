(()=>{'use strict';
const T=THREE,V=T.Vector3,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),ss=x=>x*x*(3-2*x);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isTg=u=>{try{const h=new URL(u).hostname;return h==='t.me'||h.endsWith('.t.me')||h==='telegram.me'}catch(e){return false}};
window.LIB={build:()=>{}};const PROG=$('#prog'),TIP=$('#tip'),LAP=$('#laptopUI'),PHN=$('#padUI'),HINT=$('#hint'),LOWP=matchMedia('(pointer:coarse)').matches||(navigator.hardwareConcurrency||8)<=4;
const L=6.6,PER=8,ROWS=3,CAP=PER*ROWS,SP=.72,CH=11.6,LEAN=.09,CW=LOWP?256:384,CHT=Math.round(CW*344/256);

/* ---------- physically based renderer: shadows, tone mapping, image-based light ---------- */
const renderer=new T.WebGLRenderer({canvas:$('#gl'),antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,LOWP?1.25:1.75));
renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.8;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();scene.background=new T.Color(0x77736b);scene.fog=new T.Fog(0x77736b,12,46);
const cam=new T.PerspectiveCamera(50,1,.1,90);
{const pm=new T.PMREMGenerator(renderer),es=new T.Scene();es.background=new T.Color(0x4b4f55);
 const lb=(w,h,d,x,y,z,i)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshBasicMaterial({color:new T.Color(i,i,i)}));m.position.set(x,y,z);es.add(m)};
 lb(30,.5,30,0,12,0,2.6);lb(.5,10,30,-12,3,0,1.3);lb(.5,10,30,12,3,0,1.3);lb(30,10,.5,0,3,-12,.8);
 scene.environment=pm.fromScene(es,.03).texture;}
{const envSet=t=>{const pm=new T.PMREMGenerator(renderer);scene.environment=pm.fromEquirectangular(t).texture;t.dispose()};
 const hdr=()=>{if(T.RGBELoader)new T.RGBELoader().setDataType(T.UnsignedByteType).load('assets/hdri/library.hdr',envSet,undefined,()=>{})};
 if(T.EXRLoader)new T.EXRLoader().setDataType(T.HalfFloatType).load('assets/hdri/library.exr',envSet,undefined,hdr);else hdr()}
scene.add(new T.HemisphereLight(0xf3f0ea,0x8a7f72,LOWP?.5:.16));
/* soft rectangular ceiling lights that travel with the camera (archviz-style area lighting) */
const areas=[];if(T.RectAreaLightUniformsLib){T.RectAreaLightUniformsLib.init();for(let k=0;k<(LOWP?0:2);k++){const a=new T.RectAreaLight(0xfff1de,4.6,2.4,.5);a.rotation.x=-Math.PI/2;a.position.set(0,CH-.6,0);scene.add(a);areas.push(a)}}
/* drifting dust in the light */
const dustN=LOWP?150:320,dustA=new Float32Array(dustN*3),dust=(()=>{for(let i=0;i<dustN;i++){dustA[i*3]=(Math.random()-.5)*7;dustA[i*3+1]=.3+Math.random()*(CH-1.2);dustA[i*3+2]=(Math.random()-.5)*30}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(dustA,3));const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d'),r=x.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,244,220,1)');r.addColorStop(1,'rgba(255,244,220,0)');x.fillStyle=r;x.fillRect(0,0,32,32);
 const m=new T.Points(g,new T.PointsMaterial({size:.045,map:new T.CanvasTexture(c),transparent:true,opacity:.4,depthWrite:false,blending:T.AdditiveBlending,fog:false}));m.frustumCulled=false;scene.add(m);return m})();
function driftDust(cz,t){for(let i=0;i<dustN;i++){const k=i*3;dustA[k+1]+=Math.sin(t*.3+i)*.0006+.0004;if(dustA[k+1]>CH-.8)dustA[k+1]=.3;dustA[k]+=Math.sin(t*.2+i*1.7)*.0005;
 if(dustA[k+2]>cz+15)dustA[k+2]-=30;else if(dustA[k+2]<cz-15)dustA[k+2]+=30}dust.geometry.attributes.position.needsUpdate=true}
const PB={map:['color','albedo','diffuse'],normalMap:['normal','normal_gl'],roughnessMap:['rough','roughness']},HIT={},MISS={};
function pbr(m,dir,rx,ry){const TL=new T.TextureLoader();
 Object.entries(PB).forEach(([k,names])=>{const key=dir+'/'+k;if(MISS[key])return;const urls=HIT[key]?[HIT[key]]:names.flatMap(n=>['jpg','png'].map(e=>'assets/pbr/'+dir+'/'+n+'.'+e));
  const next=i=>{if(i>=urls.length){MISS[key]=1;if(k==='map')console.warn('[PBR] no color texture in assets/pbr/'+dir+'/ - using procedural material');return}
   TL.load(urls[i],t=>{HIT[key]=urls[i];t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=8;if(k==='map')t.encoding=T.sRGBEncoding;m[k]=t;if(k==='map')m.color.set(m.userData.tint||0xffffff);if(k==='roughnessMap')m.roughness=1;m.needsUpdate=true},undefined,()=>next(i+1))};next(0)});return m}
const sun=new T.DirectionalLight(0xffeedd,1.05);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:40});sun.shadow.radius=4;sun.shadow.bias=-.0005;sun.shadow.normalBias=.03;scene.add(sun,sun.target);

const ENV_I=.35,EX=.85,INV={value:0};
/* flat UI planes skip the grade's ACES: pre-invert it so photos/text keep their true brightness */
const undo=m=>{m.onBeforeCompile=s=>{s.uniforms.uInv=INV;s.fragmentShader='uniform float uInv;vec3 invA(vec3 y){y=clamp(y,0.,.985);vec3 a=2.51-2.43*y,b=.03-.59*y,c=-.14*y;return(-b+sqrt(b*b-4.*a*c))/(2.*a);}\n'+s.fragmentShader.replace('#include <tonemapping_fragment>','if(uInv>.5)gl_FragColor.rgb=invA(gl_FragColor.rgb)/'+EX.toFixed(2)+';\n#include <tonemapping_fragment>')};return m};const tx=t=>{t.encoding=T.sRGBEncoding;t.anisotropy=8;return t};
const std=(c,r=.6,m=0,o={})=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:r,metalness:m,envMapIntensity:ENV_I},o));
function woodTex(rx,ry){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');
 for(let i=0;i<8;i++){const h=26+Math.random()*10,l=34+Math.random()*12;x.fillStyle=`hsl(${h},42%,${l}%)`;x.fillRect(0,i*64,512,64);
  for(let k=0;k<70;k++){x.strokeStyle=`hsla(${h},40%,${l-9}%,.28)`;x.beginPath();const y=i*64+Math.random()*64;x.moveTo(0,y);x.lineTo(512,y+(Math.random()-.5)*7);x.stroke()}
  x.fillStyle='#0005';x.fillRect(0,i*64,512,2);x.fillRect(Math.random()*512,i*64,2,64)}
 const t=tx(new T.CanvasTexture(c));t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx,ry);return t}
const WHITE=std(0xd4d1ca,.55),BACK=std(0xb5afa4,.85),WOOD=std(0xd6cbbd,.6,0,{map:woodTex(1.3,.7)}),DARK=std(0x1f2024,.55,.35),
 LED=new T.MeshBasicMaterial({color:0x9a8a6c,toneMapped:false}),GLOW=std(0xffffff,.4,0,{emissive:0xffffff,emissiveIntensity:1.1});
WOOD.userData.tint=0xd6cbbd;pbr(WOOD,'wood',1.3,.7);

function walnutTex(rx,ry){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');
 x.fillStyle='#4a2f1d';x.fillRect(0,0,512,512);
 for(let i=0;i<260;i++){const y=Math.random()*512,l=16+Math.random()*14;x.strokeStyle=`hsla(22,${38+Math.random()*14}%,${l}%,${.25+Math.random()*.35})`;x.lineWidth=.6+Math.random()*2.2;x.beginPath();x.moveTo(0,y);
  x.bezierCurveTo(150,y+(Math.random()-.5)*26,340,y+(Math.random()-.5)*26,512,y+(Math.random()-.5)*10);x.stroke()}
 for(let k=0;k<3;k++){const cx=Math.random()*512,cy=Math.random()*512;for(let r=4;r<26;r+=4){x.strokeStyle='hsla(20,45%,14%,.35)';x.beginPath();x.ellipse(cx,cy,r*2.4,r*.8,0,0,7);x.stroke()}}
 const t=tx(new T.CanvasTexture(c));t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx,ry);return t}
const LAPDESK=std(0xe8d6c0,.38,.02,{map:walnutTex(1.2,1)});LAPDESK.userData.tint=0xe8d6c0;pbr(LAPDESK,'desk',1.2,1);
const SHELF=std(0xcdbfae,.6,0,{map:woodTex(1,1)});SHELF.userData.tint=0xcdbfae;pbr(SHELF,'wood',1,1);
const WALL=pbr(std(0xd8d4cb,.92),'plaster',3,3);WALL.userData.tint=0xd8d4cb;
let P=scene;
/* bevelled box: 4 segments per axis, outer ring pulled onto a rounded edge with matching normals */
const RB={};function rbox(w,h,d){const off=Math.floor(Math.random()*4),key=w+'|'+h+'|'+d+'|'+off;if(RB[key])return RB[key];
 const r=Math.min(.012,Math.min(w,h,d)/4.5),g=new T.BoxGeometry(w,h,d,4,4,4),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,D=[w,h,d],H=[w/2,h/2,d/2],v=new V(),a=new V(),o=new V(),
  mp=(c,e)=>{const t=Math.abs(c)/e;return Math.sign(c)*(t>.9?e:t>.4?e-r:0)};
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);v.set(mp(v.x,H[0]),mp(v.y,H[1]),mp(v.z,H[2]));
  {const fa=Math.abs(n.getX(i))>.5?0:Math.abs(n.getY(i))>.5?1:2,ax=[0,1,2].filter(q=>q!==fa),c=[v.x,v.y,v.z];if(D[ax[0]]<D[ax[1]])ax.reverse();uv.setXY(i,(c[ax[0]]+off*.37)*.5,(c[ax[1]]+off*.61)*.5)}
  a.set(clamp(v.x,-(H[0]-r),H[0]-r),clamp(v.y,-(H[1]-r),H[1]-r),clamp(v.z,-(H[2]-r),H[2]-r));o.copy(v).sub(a);
  if(o.lengthSq()>1e-12){o.normalize();n.setXYZ(i,o.x,o.y,o.z);v.copy(a).addScaledVector(o,r)}p.setXYZ(i,v.x,v.y,v.z)}
 g.userData.keep=1;return RB[key]=g}
const box=(w,h,d,m,x,y,z,p=P)=>{const o=new T.Mesh(rbox(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o};
const plane=(w,h,m,x,y,z,ry=0,p=P)=>{const o=new T.Mesh(new T.PlaneGeometry(w,h),m);o.position.set(x,y,z);o.rotation.y=ry;o.receiveShadow=true;p.add(o);return o};

/* ---------- canvas helpers ---------- */
function wrap(x,t,mw,ml){const w=String(t||'').split(/\s+/),R=[];let l='';for(const a of w){const n=l?l+' '+a:a;if(x.measureText(n).width>mw&&l){R.push(l);l=a;if(R.length===ml)return R}else l=n}if(l&&R.length<ml)R.push(l);return R}
const src=u=>/^(https?:|data:|blob:)/.test(u)?u:encodeURI(u);
function drawCard(x,c,img){
 const k=x.canvas.width/256;x.setTransform(k,0,0,k,0,0);
 x.fillStyle='#f6ead0';x.fillRect(0,0,256,344);
 if(img){const r=Math.max(256/img.width,150/img.height),w=img.width*r,h=img.height*r;x.save();x.beginPath();x.rect(0,0,256,150);x.clip();x.drawImage(img,(256-w)/2,(150-h)/2,w,h);x.restore()}else{x.fillStyle='#cdbd94';x.fillRect(0,0,256,150)}
 /* soft top shade (keeps badge + share button legible) and a faint gloss sweep */
 {const g=x.createLinearGradient(0,0,0,58);g.addColorStop(0,'rgba(0,0,0,.36)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,256,58);
  const g2=x.createLinearGradient(0,0,256,150);g2.addColorStop(0,'rgba(255,255,255,.14)');g2.addColorStop(.45,'rgba(255,255,255,0)');g2.addColorStop(1,'rgba(255,255,255,.05)');x.fillStyle=g2;x.fillRect(0,0,256,150);
  const g3=x.createLinearGradient(0,142,0,158);g3.addColorStop(0,'rgba(60,40,20,.28)');g3.addColorStop(1,'rgba(60,40,20,0)');x.fillStyle=g3;x.fillRect(0,150,256,8)}
 x.font='bold 13px sans-serif';let b=(c.badge||'').slice(0,26);while(b.length>2&&x.measureText(b).width>166)b=b.slice(0,-2).trimEnd()+'…';
 if(b){const bw=x.measureText(b).width+14;x.fillStyle='#24170e';x.fillRect(8,8,bw,22);x.fillStyle='#d9b05a';x.fillText(b,15,24)}
 if(c.created&&Date.now()-new Date(c.created)<6048e5){x.fillStyle='#c0392b';x.fillRect(8,122,52,22);x.fillStyle='#fff';x.font='bold 13px sans-serif';x.fillText('NEW',21,138)}
 /* share button, top-right corner: circle centred (231,24) r15 */
 x.beginPath();x.arc(231,24,15,0,7);x.fillStyle='rgba(23,19,16,.84)';x.fill();x.lineWidth=1.5;x.strokeStyle='#d9b05a';x.stroke();
 x.strokeStyle='#fff';x.fillStyle='#fff';x.lineWidth=1.6;x.beginPath();x.moveTo(237,17.5);x.lineTo(225,24);x.lineTo(237,30.5);x.stroke();
 [[237,17.5],[225,24],[237,30.5]].forEach(([a,b2])=>{x.beginPath();x.arc(a,b2,3.2,0,7);x.fill()});
 x.fillStyle='#24170e';x.font='bold 19px Georgia,serif';wrap(x,c.title,234,3).forEach((l,i)=>x.fillText(l,11,178+i*22));
 x.fillStyle='#5b4632';x.font='12px sans-serif';wrap(x,c.desc,234,3).forEach((l,i)=>x.fillText(l,11,254+i*15));
 x.fillStyle='#8a5a35';x.fillRect(0,302,256,42);x.fillStyle='rgba(255,255,255,.12)';x.fillRect(0,302,256,2);x.fillStyle='#fff';x.font='bold 14px sans-serif';x.fillText(isTg(c.link)?'Open in Telegram ↗':'Download ↗',12,329);
 x.strokeStyle='rgba(184,137,58,.7)';x.lineWidth=2;x.strokeRect(1,1,254,342);
}
function cardMesh(c){
 const cv=document.createElement('canvas');cv.width=CW;cv.height=CHT;const x=cv.getContext('2d');
 const tex=tx(new T.CanvasTexture(cv));drawCard(x,c,null);
 if(c.img){const im=new Image();if(/^https?:/.test(c.img)&&!c.img.startsWith(location.origin))im.crossOrigin='anonymous';im.onload=()=>{drawCard(x,c,im);tex.needsUpdate=true};im.src=src(c.img)}
 const front=std(0xffffff,.42,0,{map:tex,emissiveMap:tex,emissive:0xffffff,emissiveIntensity:.2}),edge=std(0xe6d9b8,.8);
 const m=new T.Mesh(new T.BoxGeometry(.6,.8,.035),[edge,edge,edge,edge,front,edge]);m.castShadow=true;m.userData={card:c,front,hay:(c.title+' '+c.badge+' '+c.tags+' '+c.desc).toLowerCase(),base:new V()};return m;
}
const flat=(w,h,cw,ch,paint)=>{const cv=document.createElement('canvas');cv.width=cw;cv.height=ch;paint(cv.getContext('2d'));
 return new T.Mesh(new T.PlaneGeometry(w,h),undo(new T.MeshBasicMaterial({map:tx(new T.CanvasTexture(cv)),transparent:true,toneMapped:false})))};

/* ---------- shelves ---------- */
/* ---------- realistic books: baked spine textures (cloth, leather bands, gold foil, title labels), one InstancedMesh per variant ---------- */
const BK=[],BOOKS=[],BOOKGEO=new T.BoxGeometry(1,1,1);BOOKGEO.userData.keep=1;
const TITLES=['ANATOMY','PHYSIOLOGY','BIOCHEMISTRY','PATHOLOGY','PHARMACOLOGY','MICROBIOLOGY','CLINICAL MEDICINE','SURGERY','HISTOLOGY','EMBRYOLOGY','NEUROANATOMY','FORENSIC MEDICINE','PAEDIATRICS','OBSTETRICS','COMMUNITY MEDICINE','ORTHOPAEDICS','DERMATOLOGY','RADIOLOGY','MEDICAL ATLAS','GENETICS'];
const BPAL=[['#5b1a22','#d8b45c'],['#1b2f4d','#d8b45c'],['#1f3d2e','#d9c27a'],['#3a2616','#c9a45a'],['#171717','#c8c8c8'],['#7a4a1c','#ecd9a0'],['#204c52','#e2d3a0'],['#4a2a52','#d8b45c'],['#8a2f2a','#f0e3c0'],['#2b2f36','#d8b45c'],['#a48c62','#3b2a18'],['#e4dcc8','#24303f']];
function spineCanvas(w,h,pal,style,title){
 const W=Math.round(w*1600),H=Math.round(h*1600),c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),[base,foil]=pal,light=/^#e|^#a4/.test(base);
 x.fillStyle=base;x.fillRect(0,0,W,H);
 for(let i=0;i<W*H/55;i++){x.fillStyle=Math.random()<.5?'rgba(255,255,255,.04)':'rgba(0,0,0,.055)';x.fillRect(Math.random()*W,Math.random()*H,1+Math.random()*2,1)}
 const band=(y,t)=>{const g=x.createLinearGradient(0,y,0,y+t);g.addColorStop(0,foil);g.addColorStop(.5,'#ffffffcc');g.addColorStop(1,foil);x.fillStyle=g;x.fillRect(W*.06,y,W*.88,t)};
 const vtext=(t,cy,maxLen,col,font,fs0)=>{let fs=fs0;x.save();x.translate(W/2,cy);x.rotate(Math.PI/2);x.textAlign='center';x.textBaseline='middle';x.fillStyle=col;do{x.font=font(fs);fs--}while(x.measureText(t).width>maxLen&&fs>6);x.fillText(t,0,0);x.restore()};
 if(style===0){band(H*.05,H*.009);band(H*.07,H*.004);band(H*.925,H*.009);band(H*.945,H*.004);
  x.fillStyle=light?'#20303f':'#efe3c4';x.fillRect(W*.1,H*.14,W*.8,H*.5);x.strokeStyle=foil;x.lineWidth=Math.max(1,W*.03);x.strokeRect(W*.13,H*.15,W*.74,H*.48);
  vtext(title,H*.39,H*.44,light?'#f2e6c4':'#1c140d',f=>'bold '+f+'px Georgia,serif',W*.4);
  x.strokeStyle=foil;x.lineWidth=Math.max(1.2,W*.035);x.beginPath();x.arc(W/2,H*.8,W*.2,0,7);x.stroke();vtext(['I','II','III','IV','V'][Math.random()*5|0],H*.8,W*.3,foil,f=>'bold '+f+'px Georgia,serif',W*.3)}
 else if(style===1){for(let k=0;k<5;k++){const y=H*(.09+.19*k);x.fillStyle='rgba(0,0,0,.55)';x.fillRect(0,y+H*.012,W,H*.006);const g=x.createLinearGradient(0,y-H*.006,0,y+H*.016);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,.28)');g.addColorStop(1,'rgba(0,0,0,.45)');x.fillStyle=g;x.fillRect(0,y-H*.006,W,H*.022);band(y-H*.003,H*.004)}
  x.fillStyle='#6f1c1c';x.fillRect(W*.12,H*.115,W*.76,H*.36);x.strokeStyle=foil;x.lineWidth=Math.max(1,W*.025);x.strokeRect(W*.15,H*.125,W*.7,H*.34);
  vtext(title,H*.295,H*.31,foil,f=>'bold '+f+'px Georgia,serif',W*.38);
  vtext(['I','II','III','IV'][Math.random()*4|0],H*.7,H*.14,foil,f=>'italic '+f+'px Georgia,serif',W*.3)}
 else{x.fillStyle=foil;x.fillRect(0,H*.03,W,H*.05);x.fillRect(0,H*.9,W,H*.07);
  vtext(title,H*.5,H*.7,light?'#1c2733':'#fbf5e6',f=>'800 '+f+'px "Plus Jakarta Sans",Arial,sans-serif',W*.44);
  x.fillStyle=light?'#1c2733':'#fbf5e6';x.fillRect(W*.25,H*.12,W*.5,W*.5);x.fillStyle=base;x.fillRect(W*.34,H*.12+W*.09,W*.32,W*.32)}
 const g=x.createLinearGradient(0,0,W,0);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(.16,'rgba(0,0,0,.06)');g.addColorStop(.42,'rgba(255,255,255,.12)');g.addColorStop(.62,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.55)');x.fillStyle=g;x.fillRect(0,0,W,H);
 const g2=x.createLinearGradient(0,0,0,H);g2.addColorStop(0,'rgba(0,0,0,.3)');g2.addColorStop(.035,'rgba(0,0,0,0)');g2.addColorStop(.965,'rgba(0,0,0,0)');g2.addColorStop(1,'rgba(0,0,0,.35)');x.fillStyle=g2;x.fillRect(0,0,W,H);
 return c}
function makeBooks(){if(BK.length)return;
 for(let v=0;v<16;v++){const w=.038+Math.random()*.055,h=.52+Math.random()*.36,pal=BPAL[v%BPAL.length],style=v%3,t=tx(new T.CanvasTexture(spineCanvas(w,h,pal,style,TITLES[(v*7+3)%TITLES.length])));
  const spine=std(0xffffff,.5,0,{map:t,bumpMap:t,bumpScale:.7,emissiveMap:t,emissive:0xffffff,emissiveIntensity:.13}),cover=std(new T.Color(pal[0]).multiplyScalar(.85),.72);
  spine.userData.keep=cover.userData.keep=1;BK.push({w,h,mats:[cover,spine,cover,cover,cover,cover]})}}
const resetBooks=()=>{makeBooks();BOOKS.length=0;BK.forEach(()=>BOOKS.push([]))};
const _q=new T.Quaternion(),_e=new T.Euler(),_m=new T.Matrix4();
function addBook(v,px,py,pz,ry,rx,sx,sy,sz){_q.setFromEuler(_e.set(rx,ry,0,'YXZ'));_m.compose(new V(px,py,pz),_q,new V(sx,sy,sz));BOOKS[v].push(_m.clone())}
/* fill one shelf row with standing books (occasional leaning book, gap, or flat stack), starting s0 metres from the card end */
function fillRow(gx,zc,side,len,r,s0){const dir=side>0?1:-1,base=.125+r,end=len-.12,ry0=side>0?0:Math.PI,zAt=s=>zc+dir*(-len/2+s),rnd=Math.random;let s=s0;
 while(s<end-.05){
  if(rnd()<.03&&end-s>.9){const n=2+(rnd()*3|0);let yy=base;const v0=rnd()*BK.length|0,L=Math.min(.55,BK[v0].h*.75);
   for(let k=0;k<n;k++){const v=rnd()*BK.length|0,t=BK[v].w*1.1,dp=.3+rnd()*.08;addBook(v,gx-side*(.36-dp/2)+(rnd()-.5)*.02,yy+t/2,zAt(s+L/2)+(rnd()-.5)*.02,ry0+(rnd()-.5)*.1,Math.PI/2,dp,L,t);yy+=t}
   s+=L+.07;continue}
  const v=rnd()*BK.length|0,B=BK[v],w=B.w*(.92+rnd()*.16),h=Math.min(.93,B.h*(.96+rnd()*.06)),dp=.3+rnd()*.12,lean=rnd()<.05?(rnd()-.5)*.16:(rnd()-.5)*.012;
  if(s+w>end)break;addBook(v,gx-side*(.36-dp/2)+(rnd()-.5)*.02,base+h/2,zAt(s+w/2),ry0,lean,dp,h,w);
  s+=w+.004+(rnd()<.08?rnd()*.06:0)+(rnd()<.03?.12+rnd()*.15:0)}}
function flushBooks(){BK.forEach((v,i)=>{const a=BOOKS[i];if(!a||!a.length)return;const im=new T.InstancedMesh(BOOKGEO,v.mats,a.length);a.forEach((m,k)=>im.setMatrixAt(k,m));im.castShadow=im.receiveShadow=true;im.frustumCulled=false;dyn.add(im)});BOOKS.length=0}

/* ---------- tubs with trees (replace the old demo book shelves); one InstancedMesh per part keeps draw calls low ---------- */
const PL={tub:[],soil:[],trunk:[],lf:[[],[],[]]},PG={},PM={};
function pmat(arr,px,py,pz,sx,sy,sz,ry){_q.setFromEuler(_e.set(0,ry||0,0));_m.compose(new V(px,py,pz),_q,new V(sx,sy,sz));arr.push(_m.clone())}
function planters(zc,side,len){
 if(!PG.tub){PG.tub=new T.CylinderGeometry(.34,.26,.5,20);PG.soil=new T.CylinderGeometry(.31,.31,.03,20);PG.trunk=new T.CylinderGeometry(.045,.075,1,8);PG.leaf=new T.IcosahedronGeometry(1,1);
  PM.tub=std(0xa4552f,.75);PM.soil=std(0x2b1d14,1);PM.trunk=std(0x5a3d26,.9);PM.lf=[0x2f6b3a,0x3e8446,0x25592f].map(c=>std(c,.85));
  Object.values(PG).forEach(g=>g.userData.keep=1);[PM.tub,PM.soil,PM.trunk,...PM.lf].forEach(m=>m.userData.keep=1)}
 const n=Math.max(2,Math.round(len/2.7));
 for(let i=0;i<n;i++){const z=zc-len/2+(i+.5)*len/n,x=side*3.9,h=1.4+Math.random()*1.0,top=.5+h,r=Math.random()*6;PLPOS.push({x,z,r});
  pmat(PL.tub,x,.25,z,1,1,1,r);pmat(PL.soil,x,.5,z,1,1,1,r);pmat(PL.trunk,x,.5+h/2,z,1,h,1,r);
  pmat(PL.lf[0],x-side*.15,top+.05,z,.66,.56,.66,r);pmat(PL.lf[1],x+side*.05,top+.5,z+.2,.56,.5,.56,r);
  pmat(PL.lf[2],x-side*.3,top+.32,z-.25,.5,.45,.5,r);pmat(PL.lf[0],x-side*.05,top+.85,z-.05,.42,.4,.42,r)}}
function flushPlanters(){
 const mk=(geo,mat,a)=>{if(!a.length)return;const im=new T.InstancedMesh(geo,mat,a.length);a.forEach((m,k)=>im.setMatrixAt(k,m));im.castShadow=im.receiveShadow=true;im.frustumCulled=false;dyn.add(im);PROC.push(im);a.length=0};
 mk(PG.tub,PM.tub,PL.tub);mk(PG.soil,PM.soil,PL.soil);mk(PG.trunk,PM.trunk,PL.trunk);PL.lf.forEach((a,k)=>mk(PG.leaf,PM.lf[k],a));plantModels()}
const FULL=[.1,.1,.1,.1];

/* ---------- shelves ---------- */
/* fill: per-row start (metres from the card end) where books take over; falsy = leave the shelf bare */
/* flower pots for the shelf tops: one InstancedMesh per part, per-instance colours for pots and blooms */
const FLW={pot:[],soil:[],stem:[],leaf:[],bloom:[],pc:[],bc:[]},FG={},FMT={},_qi=new T.Quaternion(),UP=new V(0,1,0),BLOOM=['#f4a3b8','#ffffff','#f6c453','#e8785a','#b79ae8','#ff8fa3'],POTC=['#d8ccb6','#a4552f','#e6dfd2','#8fa48a'];
function flowerPot(x,y,z,sc){const rnd=Math.random;
 if(!FG.pot){FG.pot=new T.CylinderGeometry(.14,.1,.22,18);FG.soil=new T.CylinderGeometry(.125,.125,.02,18);FG.stem=new T.CylinderGeometry(.005,.007,1,5);FG.leaf=new T.IcosahedronGeometry(1,1);FG.bloom=new T.IcosahedronGeometry(1,1);
  FMT.pot=std(0xffffff,.5);FMT.soil=std(0x2b1d14,1);FMT.stem=std(0x3f6b3a,.8);FMT.leaf=std(0x2f6b3a,.85);FMT.bloom=std(0xffffff,.65,0,{emissive:0x331a22,emissiveIntensity:.12});
  Object.values(FG).forEach(g=>g.userData.keep=1);Object.values(FMT).forEach(m=>m.userData.keep=1)}
 const pm=(a,px,py,pz,sx,sy,sz,q)=>{_m.compose(new V(px,py,pz),q||_qi,new V(sx,sy,sz));a.push(_m.clone())};
 pm(FLW.pot,x,y+.11*sc,z,sc,sc,sc);FLW.pc.push(new T.Color(POTC[rnd()*POTC.length|0]));pm(FLW.soil,x,y+.22*sc,z,sc,sc,sc);
 const y0=y+.23*sc,n=6+(rnd()*3|0);
 for(let k=0;k<n;k++){const ang=rnd()*6.283,rad=rnd()*.06*sc,bx=x+Math.cos(ang)*rad,bz=z+Math.sin(ang)*rad,h=(.3+rnd()*.25)*sc,
   dir=new V(Math.cos(ang)*(.15+rnd()*.3),1,Math.sin(ang)*(.15+rnd()*.3)).normalize(),q=new T.Quaternion().setFromUnitVectors(UP,dir);
  pm(FLW.stem,bx+dir.x*h/2,y0+dir.y*h/2,bz+dir.z*h/2,sc,h,sc,q);
  pm(FLW.bloom,bx+dir.x*h,y0+dir.y*h+.01*sc,bz+dir.z*h,.05*sc,.032*sc,.05*sc);FLW.bc.push(new T.Color(BLOOM[rnd()*BLOOM.length|0]));
  pm(FLW.leaf,bx+dir.x*h*.5,y0+dir.y*h*.5,bz+dir.z*h*.5,.05*sc,.012*sc,.022*sc,new T.Quaternion().setFromEuler(new T.Euler(0,rnd()*6.283,.4)))}
 for(let k=0;k<5;k++){const a=k/5*6.283+rnd(),r=.06*sc;pm(FLW.leaf,x+Math.cos(a)*r,y0+.03*sc,z+Math.sin(a)*r,.075*sc,.02*sc,.032*sc,new T.Quaternion().setFromEuler(new T.Euler(0,-a,.35)))}}
function flowers(x,y,zc,len,side,mode){if(!mode)return;const ends=mode>=2?[-1,1]:[Math.random()<.5?-1:1];
 ends.forEach(e=>{flowerPot(x,y,zc+e*(len/2-.62),1);if(mode>=2)flowerPot(x+side*.02,y,zc+e*(len/2-.3),.72)})}
function flushFlowers(){const mk=(geo,mat,a,cols)=>{if(!a.length)return;const im=new T.InstancedMesh(geo,mat,a.length);a.forEach((m,k)=>{im.setMatrixAt(k,m);if(cols)im.setColorAt(k,cols[k])});im.castShadow=im.receiveShadow=true;im.frustumCulled=false;dyn.add(im);a.length=0};
 mk(FG.pot,FMT.pot,FLW.pot,FLW.pc);mk(FG.soil,FMT.soil,FLW.soil);mk(FG.stem,FMT.stem,FLW.stem);mk(FG.leaf,FMT.leaf,FLW.leaf);mk(FG.bloom,FMT.bloom,FLW.bloom,FLW.bc);FLW.pc.length=FLW.bc.length=0}
const AOM=(()=>{const c=document.createElement('canvas');c.width=8;c.height=128;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,128);
 g.addColorStop(0,'rgba(255,205,140,.34)');g.addColorStop(.2,'rgba(255,205,140,.07)');g.addColorStop(.5,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.42)');x.fillStyle=g;x.fillRect(0,0,8,128);
 const m=new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-8});m.userData.keep=1;return m})();
function unit(zc,side,len,fill,fm){
 const g=new T.Group();g.position.set(side*4,0,zc);P.add(g);
 const SH=ROWS+.4;box(.06,SH,len,BACK,side*.42,SH/2,0,g);
 [-1,1].forEach(s=>box(.9,SH,.06,SHELF,0,SH/2,s*len/2,g));
 for(let r=0;r<=ROWS;r++){box(.86,.05,len-.06,SHELF,0,.1+r,0,g);if(r)box(.02,.012,len-.14,LED,-side*.4,.075+r,0,g).castShadow=false}
 box(.8,.08,len,DARK,-side*.02,.04,0,g);box(.94,.05,len+.04,SHELF,0,ROWS+.425,0,g);
 /* warm LED wash + occlusion on the back panel, brass nosing on every board, brass display lip in front of each card row, brass crown trim, flower pots on top */
 for(let r=0;r<ROWS;r++){plane(len-.06,.95,AOM,side*.389,r+.6,0,-side*Math.PI/2,g).receiveShadow=false;box(.02,.04,len-.16,BRASS,-side*.235,.125+r+.02,0,g).castShadow=false}
 for(let r=0;r<=ROWS;r++)box(.012,.05,len-.06,BRASS,-side*.436,.1+r,0,g).castShadow=false;
 box(.014,.05,len+.04,BRASS,-side*.47,ROWS+.425,0,g).castShadow=false;
 flowers(side*4,ROWS+.45,zc,len,side,fm);
 if(fill)fill.forEach((s0,r)=>{if(s0<len-.2)fillRow(side*4,zc,side,len,r,s0)});
}
/* rows where cards stand keep their slots; every empty slot (or a whole empty shelf) is filled with books */
const fillFor=n=>n>CAP?null:[0,1,2].map(r=>{const c=clamp(n-(ROWS-1-r)*PER,0,PER);return c>=PER?1e9:c===0?.1:.4+c*SP+.04});

/* ---------- desk, laptop (static) ---------- */
const PW=.42,PH=.3,PD=.014,PSW=.394,PSH=.274,PTILT=-1.0;
const lapParts=[];let lapModel=false,lapWH=[.82,.5];const lapC=new V(0,.29,.0115),phoneC=new V(0,0,.0046);
const lapG=new T.Group();lapG.position.set(0,.78,-.41);lapG.rotation.x=-.32;scene.add(lapG);lapParts.push(lapG);
box(2.6,.06,1.3,LAPDESK,0,.72,-.15,scene);
[[-1.2,-.55],[1.2,-.55],[-1.2,.25],[1.2,.25]].forEach(([x,z])=>box(.07,.72,.07,DARK,x,.36,z,scene));
[-.55,.25].forEach(z=>box(2.4,.08,.05,LAPDESK,0,.66,z,scene));[-1.2,1.2].forEach(x=>box(.05,.08,.8,LAPDESK,x,.66,-.15,scene));
lapParts.push(box(.9,.03,.62,std(0xc9ccd2,.32,.9),0,.765,-.1,scene));
{const kb=flat(.8,.28,640,224,x=>{x.fillStyle='#15161a';x.fillRect(0,0,640,224);for(let r=0;r<5;r++)for(let c=0;c<14;c++){const kx=10+c*44,ky=10+r*42,gg=x.createLinearGradient(0,ky,0,ky+36);gg.addColorStop(0,'#3a3d46');gg.addColorStop(1,'#202228');x.fillStyle=gg;x.fillRect(kx,ky,38,36);x.fillStyle='#ffffff14';x.fillRect(kx+3,ky+2,32,2)}});kb.rotation.x=-Math.PI/2;kb.position.set(0,.7805,-.2);scene.add(kb);lapParts.push(kb);
 const tp=flat(.3,.17,60,34,x=>{x.fillStyle='#b4b8c0';x.fillRect(0,0,60,34)});tp.rotation.x=-Math.PI/2;tp.position.set(0,.7805,.13);scene.add(tp);lapParts.push(tp)}
box(.9,.58,.02,DARK,0,.29,0,lapG);
const paintScreen=x=>{const g=x.createLinearGradient(0,0,410,250);g.addColorStop(0,'#08142b');g.addColorStop(1,'#0f3a66');x.fillStyle=g;x.fillRect(0,0,410,250);x.fillStyle='#0b1220';x.fillRect(14,14,382,222);x.fillStyle='#1a2540';x.fillRect(14,14,382,20);['#ff5f57','#febc2e','#28c840'].forEach((c,i)=>{x.fillStyle=c;x.beginPath();x.arc(28+i*14,24,4,0,7);x.fill()});x.fillStyle='#e6eefc';x.font='bold 22px Georgia,serif';x.fillText('MediNote',30,74);x.fillStyle='#7fb8ff';x.fillRect(30,90,150,8);x.fillStyle='#3a4a6b';for(let i=0;i<4;i++)x.fillRect(30,112+i*18,300-i*30,8)};
const lapScreen=flat(.82,.5,410,250,paintScreen);lapScreen.position.set(0,.29,.0115);lapG.add(lapScreen);
{const gl=new T.PointLight(0x8fb4ff,.5,1.8,2);gl.position.set(0,.2,.5);lapG.add(gl)}
const lapCorners=[[-.41,.54],[.41,.54],[.41,.04],[-.41,.04]].map(([x,y])=>new V(x,y,.0115));
[[0xb5523b,0],[0x2f6f6a,.05],[0xc79a3b,.1]].forEach(([c,y],i)=>box(.5-i*.05,.05,.34,std(c,.6),-.95,.775+y,.05,scene).rotation.y=i*.2);
{const mug=new T.Mesh(new T.CylinderGeometry(.05,.045,.1,24),std(0xffffff,.25));mug.position.set(.95,.8,.12);mug.castShadow=true;scene.add(mug)}

/* ---------- state ---------- */
let navBtns=[],lastNav=-1,linked=false,dyn=null,S=[],lay=[],shelfStop=[],roomIdx=0,titles=[],cardMs=[],clicks=[],phoneG=null,phoneCorners=[],zW=-40,hover=null,cur=0,shelvesData=[],pg=[],cm=null,mix=0,font=null,fs=-1,barKey='';
const cmP=new V(),cmT=new V();
let REV=false;try{REV=localStorage.getItem('a139-rev')==='1'}catch(_){}
const scMax=()=>Math.max(1,document.documentElement.scrollHeight-innerHeight),scrollFor=idx=>{const p=idx/Math.max(1,S.length-1);return scMax()*(REV?1-p:p)},syncScroll=p=>scrollTo(0,scMax()*(REV?1-p:p));
const CUT=document.createElement('div');CUT.id='cut';document.body.appendChild(CUT);let jt=0;
/* jump straight to a stop (short fade, no camera travel) */
function jump(idx){if(cm)leave();CUT.classList.add('on');clearTimeout(jt);jt=setTimeout(()=>{scrollTo(0,scrollFor(idx));cur=clamp(idx/Math.max(1,S.length-1));requestAnimationFrame(()=>CUT.classList.remove('on'))},170)}
const dispose=g=>g.traverse(o=>{if(o.geometry&&!o.geometry.userData.keep)o.geometry.dispose();const m=o.material;(Array.isArray(m)?m:m?[m]:[]).forEach(x=>{if(x.userData.keep)return;x.map&&x.map.dispose();x.dispose()})});

function titleObj(s,i){
 const g=new T.Group();
 if(font&&T.TextGeometry){
  const mk=(txt,size,h,col,ro)=>{const geo=new T.TextGeometry(txt,{font,size,height:h,curveSegments:8,bevelEnabled:true,bevelThickness:size*.05,bevelSize:size*.03,bevelSegments:3});geo.center();
   geo.computeBoundingBox();const w=geo.boundingBox.max.x*2,m=new T.Mesh(geo,std(col,ro,.55));m.castShadow=true;m.scale.setScalar(Math.min(1,6.6/w));return m};
  g.add(mk(s.name,.52,.16,new T.Color(s.color).multiplyScalar(.75),.28));
  const sub=mk(s.cards.length+(s.cards.length===1?' book':' books'),.2,.06,0x8a5a35,.4);sub.position.y=-.55;g.add(sub);
 }else{const p=flat(4.6,1.15,1024,256,x=>{x.textAlign='center';x.fillStyle=s.color;x.font='bold 130px Georgia,serif';x.fillText(s.name.slice(0,22),512,140);x.font='54px sans-serif';x.fillText(s.cards.length+' books',512,224)});g.add(p)}
 return g;
}

/* optional glTF models: assets/models/<name>/<name>.gltf (+ .bin + textures) or <name>.glb - procedural versions stay if missing */
const GL={},gltf=T.GLTFLoader?new T.GLTFLoader():null;
function model(name,cb){if(!gltf)return;
 GL[name]=GL[name]||new Promise(res=>{const d='assets/models/',u=[d+name+'/'+name+'.gltf',d+name+'/'+name+'.glb',d+name+'/scene.gltf',d+name+'/scene.glb',d+name+'.glb',d+name+'.gltf'];
  /* GLTFLoader resolves .bin and texture paths relative to the .gltf file's own folder; any failure (404, bad JSON, Draco/Meshopt) moves on to the next candidate, then to the procedural fallback */
  const next=i=>{if(i>=u.length)return res(null);try{gltf.load(u[i],g=>{console.info('[model] loaded '+u[i]);res(g.scene)},undefined,()=>next(i+1))}catch(e){next(i+1)}};next(0)});
 GL[name].then(o=>{if(o)try{cb(o.clone(true))}catch(e){console.warn('[model] '+name+' could not be placed, keeping fallback',e)}})}
function fitObj(o,size,axis){const b=new T.Box3().setFromObject(o),k=size/b.getSize(new V())[axis];o.scale.multiplyScalar(k);b.setFromObject(o);const c=b.getCenter(new V()),w=new T.Group();o.position.set(-c.x,-b.min.y,-c.z);w.add(o);
 o.traverse(m=>{if(m.isMesh){m.castShadow=m.receiveShadow=true;m.geometry.userData.keep=1;[].concat(m.material).forEach(q=>{if(q){q.userData.keep=1;if('envMapIntensity' in q)q.envMapIntensity=ENV_I}})}});return w}
/* the model's mesh named "screen" gives the 4 corners the HTML interface is projected onto */
function screenCorners(w,g){w.updateMatrixWorld(true);g.updateMatrixWorld(true);let sm=null;w.traverse(m=>{if(m.isMesh&&/screen|display/i.test(m.name))sm=m});if(!sm)return null;
 sm.geometry.computeBoundingBox();const b=sm.geometry.boundingBox,e=b.getSize(new V()),c=b.getCenter(new V()),K=['x','y','z'].sort((p,q)=>e[p]-e[q]),[u,v]=[K[1],K[2]],P=[];
 [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([a,d])=>{const p=c.clone();p[u]+=a*e[u]/2;p[v]+=d*e[v]/2;P.push(g.worldToLocal(sm.localToWorld(p)))});
 P.sort((a,b)=>b.y-a.y);const t=P.slice(0,2).sort((a,b)=>a.x-b.x),m=P.slice(2).sort((a,b)=>a.x-b.x);return[t[0],t[1],m[1],m[0]]}
function loadLaptop(){model('laptop',o=>{const w=fitObj(o,.9,'x');w.position.set(0,.75,-.15);scene.add(w);const cs=screenCorners(w,lapG);if(!cs){scene.remove(w);return}
 lapParts.forEach(p=>p.visible=false);lapModel=true;cs.forEach((p,i)=>lapCorners[i].copy(p));lapC.copy(cs[0]).add(cs[2]).multiplyScalar(.5);lapWH=[cs[0].distanceTo(cs[1]),cs[0].distanceTo(cs[3])];computeStops()})}
const LEATHER=std(0x4a382b,.55,0,{envMapIntensity:.5});[WHITE,BACK,WOOD,DARK,LED,GLOW,SHELF,WALL,LEATHER,LAPDESK].forEach(m=>m.userData.keep=1);
chair(0,.9,0,scene);
function chair(x,z,ry,p){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=ry;p.add(g);
 box(.46,.06,.44,LEATHER,0,.45,0,g);box(.36,.3,.045,LEATHER,0,.8,.2,g);
 [[-.2,-.18],[.2,-.18],[-.2,.18]].forEach(([a,b])=>box(.04,.42,.04,WOOD,a,.21,b,g));box(.04,.96,.04,WOOD,-.2,.48,.2,g);box(.04,.96,.04,WOOD,.2,.48,.2,g);box(.36,.04,.03,WOOD,0,.35,-.18,g);model('chair',o=>{const w=fitObj(o,.95,'y');w.rotation.y=Math.PI;g.children.forEach(c=>c.visible=false);g.add(w)})}
/* clerestory windows above the shelves (overcast sky panes in dark steel frames) + a window wall at the far end */
function addWindows(zW){
 const gw=3.2,gh=2.4,fw=.1,fd=.14,cy=CH-2.6,F=[],G={L:[],R:[],E:[]},sc=document.createElement('canvas');sc.width=256;sc.height=160;
 const c2=sc.getContext('2d'),gr=c2.createLinearGradient(0,0,0,160);gr.addColorStop(0,'#a9c0da');gr.addColorStop(1,'#eef1f2');c2.fillStyle=gr;c2.fillRect(0,0,256,160);
 for(let i=0;i<9;i++){const px=Math.random()*256,py=20+Math.random()*110,r=c2.createRadialGradient(px,py,0,px,py,50);r.addColorStop(0,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');c2.fillStyle=r;c2.fillRect(0,0,256,160)}
 const sky=new T.MeshBasicMaterial({map:tx(new T.CanvasTexture(sc)),color:new T.Color(1.5,1.5,1.55)}),
 add=(k,X,Z)=>{const t=k==='E',sz=(a,b,c)=>t?[c,b,a]:[a,b,c];G[k].push([X,cy,Z]);
  [[-gh/2-fw/2,fw,gw+2*fw],[gh/2+fw/2,fw,gw+2*fw],[0,.05,gw]].forEach(([dy,b,c])=>F.push([X,cy+dy,Z,...sz(fd,b,c)]));
  [-gw/2-fw/2,0,gw/2+fw/2].forEach((o,i)=>F.push([X+(t?o:0),cy,Z+(t?0:o),...sz(fd,gh,i===1?.05:fw)]))};
 for(let q=-3-L/2;q>zW+2;q-=L){add('L',-4.43,q);add('R',4.43,q)}
 add('E',0,zW+.07);
 const M=new T.Matrix4(),Q=new T.Quaternion(),mk=(geo,mat,a)=>{if(!a.length)return;const im=new T.InstancedMesh(geo,mat,a.length);a.forEach((v,i)=>{M.compose(new V(v[0],v[1],v[2]),Q,new V(v[3]||1,v[4]||1,v[5]||1));im.setMatrixAt(i,M)});im.frustumCulled=false;dyn.add(im)};
 mk(new T.BoxGeometry(1,1,1),std(0x2b2a29,.5,.6),F);
 [['L',Math.PI/2],['R',-Math.PI/2],['E',0]].forEach(([k,r])=>mk(new T.PlaneGeometry(gw,gh).rotateY(r),sky,G[k]));
 ['L','R'].forEach(k=>G[k].forEach(([X,Y,Z])=>{const q=-Math.sign(X),n=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[X+q*.1,Y+b*gh/2,Z+a*gw/2]),f=n.map(p=>[p[0]+q*3.4,p[1]-(Y+gh/2)*.98,p[2]+1.1]);const m=new T.Mesh(shaft(n,f),beamMat(0xdfeaff,.03));m.frustumCulled=false;dyn.add(m)}));
}
/* category plaque: same charcoal board, brass border, ivory serif name and book count on every shelf */
function sign(s,side,zc){
 const W=4.6,Hh=.7,cv=document.createElement('canvas');cv.width=1180;cv.height=180;const x=cv.getContext('2d');
 x.fillStyle='#1c1814';x.fillRect(0,0,1180,180);x.strokeStyle='#b8893a';x.lineWidth=4;x.strokeRect(10,10,1160,160);x.fillStyle=s.color;x.fillRect(28,28,14,124);
 const nm=String(s.name).toUpperCase();let fs=84;x.font='bold '+fs+'px Georgia,serif';while(x.measureText(nm).width>800&&fs>34){fs-=4;x.font='bold '+fs+'px Georgia,serif'}
 x.textBaseline='middle';x.fillStyle='#f3e7cf';x.fillText(nm,70,90);x.textAlign='right';x.fillStyle='#d9b05a';x.font='600 40px "Plus Jakarta Sans",sans-serif';x.fillText(s.cards.length+(s.cards.length===1?' BOOK':' BOOKS'),1146,92);
 const t=tx(new T.CanvasTexture(cv)),g=new T.Group();box(W,Hh,.05,DARK,0,0,0,g);
 const f=new T.Mesh(new T.PlaneGeometry(W-.06,(W-.06)*180/1180),std(0xffffff,.5,0,{map:t,emissiveMap:t,emissive:0xffffff,emissiveIntensity:.35}));f.position.z=.027;g.add(f);
 g.position.set(side*4,ROWS+.47+Hh/2,zc);g.rotation.y=-side*Math.PI/2;dyn.add(g)}

/* medical textbooks on the reading table: hardcover boards, paged block, spine. Drop real scans in assets/books/<key>.jpg (front cover) and <key>_spine.jpg to replace the drawn ones: grays, lipp, guyton, ganong */
const BOOKDEF={
 grays:{t:"Gray's Anatomy",sub:'THE ANATOMICAL BASIS OF CLINICAL PRACTICE',col:'#7a1e2a',foil:'#d9b562',w:.27,d:.36,h:.075},
 lipp:{t:'Lippincott Illustrated Reviews',sub:'BIOCHEMISTRY',col:'#f2efe6',foil:'#2a4d8f',w:.25,d:.32,h:.045},
 guyton:{t:'Guyton and Hall',sub:'TEXTBOOK OF MEDICAL PHYSIOLOGY',col:'#1d4a7a',foil:'#f1e2b0',w:.26,d:.345,h:.07},
 ganong:{t:"Ganong's Review of Medical Physiology",sub:'',col:'#2c6b57',foil:'#efe6c2',w:.24,d:.31,h:.05}};
function medBook(k,x,y,z,ry){const D=BOOKDEF[k],{w,d,h}=D,g=new T.Group(),cw=384,ch=Math.round(cw*d/w),cv=document.createElement('canvas');cv.width=cw;cv.height=ch;const c=cv.getContext('2d');
 c.fillStyle=D.col;c.fillRect(0,0,cw,ch);for(let i=0;i<cw*ch/40;i++){c.fillStyle=Math.random()<.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.06)';c.fillRect(Math.random()*cw,Math.random()*ch,2,1)}
 c.strokeStyle=D.foil;c.fillStyle=D.foil;c.lineWidth=4;c.strokeRect(16,16,cw-32,ch-32);c.lineWidth=1.5;c.strokeRect(24,24,cw-48,ch-48);c.textAlign='center';
 c.font='bold 40px Georgia,serif';wrap(c,D.t,cw-90,4).forEach((l,i)=>c.fillText(l,cw/2,ch*.3+i*46));c.fillRect(cw/2-40,ch*.62,80,3);c.font='600 15px sans-serif';wrap(c,D.sub,cw-100,3).forEach((l,i)=>c.fillText(l,cw/2,ch*.7+i*22));
 const sw=512,sh=Math.max(48,Math.round(sw*h/d)),sv=document.createElement('canvas');sv.width=sw;sv.height=sh;const q=sv.getContext('2d');q.fillStyle=D.col;q.fillRect(0,0,sw,sh);
 for(let i=0;i<sw*sh/30;i++){q.fillStyle=Math.random()<.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.06)';q.fillRect(Math.random()*sw,Math.random()*sh,2,1)}
 q.fillStyle=D.foil;q.fillRect(0,4,sw,3);q.fillRect(0,sh-7,sw,3);q.textAlign='center';q.textBaseline='middle';let fs=sh*.5,tt=D.t;q.font='bold '+fs+'px Georgia,serif';while(q.measureText(tt).width>sw*.86&&fs>8){fs-=2;q.font='bold '+fs+'px Georgia,serif'}q.fillText(tt,sw/2,sh/2);
 const pc=document.createElement('canvas');pc.width=64;pc.height=64;const p=pc.getContext('2d');for(let i=0;i<64;i+=2){p.fillStyle=i%4?'#e9e1c8':'#d6ccae';p.fillRect(0,i,64,2)}
 const tex=tx(new T.CanvasTexture(cv)),spt=tx(new T.CanvasTexture(sv)),pgT=tx(new T.CanvasTexture(pc)),cover=std(D.col,.6),
  topM=std(0xffffff,.55,0,{map:tex,bumpMap:tex,bumpScale:.3}),spM=std(0xffffff,.6,0,{map:spt}),pgM=std(0xffffff,.9,0,{map:pgT});
 const add=(gw,gh,gd,mat,px,py)=>{const m=new T.Mesh(new T.BoxGeometry(gw,gh,gd),mat);m.position.set(px,py,0);m.castShadow=m.receiveShadow=true;g.add(m)};
 add(w-.016,h-.011,d-.014,pgM,.004,0);add(w,.0055,d,[cover,cover,topM,cover,cover,cover],0,h/2-.00275);add(w,.0055,d,cover,0,-h/2+.00275);add(.012,h,d,[cover,spM,cover,cover,cover,cover],-w/2+.006,0);
 const TL=new T.TextureLoader(),tryTex=(u,cb)=>TL.load(u,t=>{tx(t);cb(t)},undefined,()=>{});
 tryTex('assets/books/'+k+'.jpg',t=>{topM.map=t;topM.bumpMap=null;topM.needsUpdate=true});tryTex('assets/books/'+k+'_spine.jpg',t=>{spM.map=t;spM.needsUpdate=true});
 g.position.set(x,y+h/2,z);g.rotation.y=ry;dyn.add(g);return h}
function medBooks(zW){const TOP=.785;let y=TOP;
 ['grays','guyton','lipp'].forEach((k,i)=>{y+=medBook(k,-1+(i%2?.012:-.01),y,zW+1.3+(i-1)*.004,.05*(i-1)+.03)});
 medBook('ganong',-.78,TOP,zW+1.95,-.35)}
const FRAMEM=std(0xb8893a,.32,.85);FRAMEM.userData.keep=1;
function adminFrame(zW){
 const W=3,H=1.93,cw=1800,ch=Math.round(cw*H/W),cv=document.createElement('canvas');cv.width=cw;cv.height=ch;const x=cv.getContext('2d');
 const draw=img=>{x.fillStyle='#f6ead0';x.fillRect(0,0,cw,ch);x.strokeStyle='#b8893a';x.lineWidth=8;x.strokeRect(22,22,cw-44,ch-44);
  const px=90,py=100,pw=560,ph=ch-200;x.fillStyle='#d8c9a8';x.fillRect(px,py,pw,ph);
  if(img){const r=Math.max(pw/img.width,ph/img.height),w=img.width*r,h=img.height*r;x.save();x.beginPath();x.rect(px,py,pw,ph);x.clip();x.drawImage(img,px+(pw-w)/2,py+(ph-h)/2,w,h);x.restore()}
  x.strokeStyle='#24170e';x.lineWidth=10;x.strokeRect(px,py,pw,ph);
  const tx0=740;x.textAlign='left';x.fillStyle='#8a5a35';x.font='bold 36px sans-serif';x.fillText('ADMIN · CURATOR OF MEDINOTE',tx0,170);
  x.fillStyle='#24170e';x.font='bold 100px Georgia,serif';x.fillText('Ahmed Istiaq',tx0,285);
  x.fillStyle='#8a5a35';x.font='bold 44px sans-serif';x.fillText('RpMC-54 · Clinical trainee',tx0,355);
  x.fillStyle='#b8893a';x.fillRect(tx0,392,220,6);
  x.fillStyle='#3d2b1c';x.font='44px sans-serif';wrap(x,'Systems architect and curator of MediNote: handwritten anatomy, physiology and biochemistry notes, MBBS books and question banks, all in one library.',cw-tx0-90,7).forEach((l,i)=>x.fillText(l,tx0,470+i*66))};
 draw(null);const t=tx(new T.CanvasTexture(cv)),cx=0,cy=2.3,cz=zW+.05;
 box(W+.3,H+.3,.08,FRAMEM,cx,cy,cz,dyn);box(W+.08,H+.08,.075,std(0x2a1a0e,.6),cx,cy,cz+.005,dyn);
 {const py=cy+H/2+.42;box(1.4,.07,.16,BRASS,cx,py,cz+.2,dyn);box(1.3,.03,.12,LED,cx,py-.04,cz+.2,dyn).castShadow=false;box(.03,.32,.03,BRASS,cx,py-.14,cz+.1,dyn);const sl=new T.SpotLight(0xffe0b0,.7,6,.75,.9,1);sl.position.set(cx,py,cz+.3);sl.target.position.set(cx,cy-.2,cz);dyn.add(sl,sl.target)}
 const p=new T.Mesh(new T.PlaneGeometry(W,H),undo(new T.MeshBasicMaterial({map:t,toneMapped:false})));p.position.set(cx,cy,cz+.045);dyn.add(p);
 const srcs=['assets/website/personal_photo.jpg','assets/website/personal_photo.jpeg','assets/website/personal_photo.png','assets/website/logo.jpg'],tryImg=k=>{if(k>=srcs.length)return;const im=new Image();im.onload=()=>{draw(im);t.needsUpdate=true};im.onerror=()=>tryImg(k+1);im.src=srcs[k]};tryImg(0)}
/* ================= v2 environment: plants (glTF), reading-room windows + sun shafts + dust, ceiling, iPad ================= */
const PLPOS=[],PROC=[],BT={value:0},WY0=1.5,WY1=4.9,HW=1.2,WCY=(WY0+WY1)/2;let beamDust=null,CLOCK=null;
const GLOW2=std(0xffe6c0,.4,0,{emissive:0xffe0b0,emissiveIntensity:.38}),BRASS=std(0xc9a24e,.3,.9),BEAM=std(0xd9c2a8,.5,0,{map:walnutTex(3,.4)}),NAVY=std(0x1f2b45,.6),FRAME2=std(0x4a2f1d,.5),SILL=std(0xe3ddd2,.4);
[GLOW2,BRASS,BEAM,NAVY,FRAME2,SILL].forEach(m=>m.userData.keep=1);
const DUSTTEX=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d'),r=x.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,240,210,1)');r.addColorStop(1,'rgba(255,240,210,0)');x.fillStyle=r;x.fillRect(0,0,32,32);return new T.CanvasTexture(c)})();
/* potted plants: put 2-3 models at assets/models/plant1|plant2|plant3 (.gltf/.glb); the procedural tubs are replaced when any loads */
function plantModels(){const dd=dyn,names=['plant1','plant2','plant3'];
 Promise.all(names.map(n=>{model(n,()=>{});return GL[n]})).then(r=>{const ok=r.map((o,i)=>o?i:-1).filter(i=>i>=0);if(!ok.length||dyn!==dd)return;
  PROC.forEach(m=>{dyn.remove(m);m.dispose&&m.dispose()});
  PLPOS.forEach((p,k)=>{const w=fitObj(r[ok[k%ok.length]].clone(true),1.5+((k*37)%10)/10*.9,'y');w.position.set(p.x,0,p.z);w.rotation.y=p.r;dyn.add(w)})})}
/* volumetric light shaft between two quads (near, far corners) */
function shaft(n,f){const pos=[],uv=[],idx=[];for(let i=0;i<4;i++){const j=(i+1)%4,b=i*4;pos.push(...n[i],...n[j],...f[j],...f[i]);uv.push(0,0,1,0,1,1,0,1);idx.push(b,b+1,b+2,b,b+2,b+3)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);return g}
function beamMat(col,op){return new T.ShaderMaterial({uniforms:{c:{value:new T.Color(col)},op:{value:op},t:BT},transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,fog:false,
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform vec3 c;uniform float op,t;varying vec2 vUv;void main(){float a=pow(1.-vUv.y,1.5)*(smoothstep(0.,.08,vUv.y)*.85+.15);float s=.75+.25*sin(vUv.x*38.+t*.35)*sin(vUv.x*11.-t*.2+vUv.y*3.);gl_FragColor=vec4(c*a*s*op,1.);}'})}
function viewTex(){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,512);g.addColorStop(0,'#6fa9e6');g.addColorStop(.55,'#cfe4f4');g.addColorStop(1,'#eef3e6');x.fillStyle=g;x.fillRect(0,0,512,512);
 let r=x.createRadialGradient(390,90,0,390,90,200);r.addColorStop(0,'rgba(255,248,220,.95)');r.addColorStop(1,'rgba(255,248,220,0)');x.fillStyle=r;x.fillRect(0,0,512,512);
 for(let i=0;i<70;i++){const px=Math.random()*512,fg=i>40,py=fg?430+Math.random()*90:300+Math.random()*90,rad=(fg?60:40)+Math.random()*60,gr=(fg?40:90)+Math.random()*50|0,q=x.createRadialGradient(px,py,0,px,py,rad);q.addColorStop(0,`rgba(${gr/2|0},${gr+40},55,.9)`);q.addColorStop(1,'rgba(60,120,70,0)');x.fillStyle=q;x.fillRect(px-rad,py-rad,rad*2,rad*2)}
 return tx(new T.CanvasTexture(c))}
function rWindow(s,zc,VIEW,CURT){const g=new T.Group();g.position.set(s*4.42,0,zc);g.rotation.y=-s*Math.PI/2;dyn.add(g);const H=WY1-WY0,fb=(w,h,d,x,y,z,m=FRAME2)=>box(w,h,d,m,x,y,z,g);
 fb(.16,H+.2,.18,-HW-.08,WCY,0);fb(.16,H+.2,.18,HW+.08,WCY,0);fb(2*HW+.32,.18,.18,0,WY1+.09,0);fb(2*HW+.7,.07,.36,0,WY0-.035,.12,SILL);
 const v=new T.Mesh(new T.PlaneGeometry(2*HW,H),new T.MeshBasicMaterial({map:VIEW,color:new T.Color(1.25,1.25,1.25),fog:false}));v.position.set(0,WCY,-.07);g.add(v);
 [-1,1].forEach(k=>{const p=new T.Group();p.position.set(k*HW,WCY,.02);p.rotation.y=k*1.15;g.add(p);const cx=-k*HW/2,sh=H-.06;
  [sh/2,-sh/2].forEach(y=>box(HW,.06,.05,FRAME2,cx,y,0,p));[-1,1].forEach(q=>box(.06,sh,.05,FRAME2,cx+q*(HW/2-.03),0,0,p));box(.03,sh,.03,FRAME2,cx,0,0,p);box(HW,.03,.03,FRAME2,cx,.3,0,p);
  const gl=new T.Mesh(new T.PlaneGeometry(HW-.1,sh-.1),new T.MeshPhysicalMaterial({color:0xdfeeff,transparent:true,opacity:.1,roughness:.04,clearcoat:1,depthWrite:false}));gl.position.x=cx;p.add(gl);
  const c=new T.Mesh(new T.PlaneGeometry(.75,H+.8),CURT);c.position.set(k*(HW+.5),WCY,.3);g.add(c)});
 const rod=new T.Mesh(new T.CylinderGeometry(.018,.018,2*HW+1.8,10),BRASS);rod.rotation.z=Math.PI/2;rod.position.set(0,WY1+.5,.3);g.add(rod)}
/* two open windows either side of the reading desk: warm sun spot with mullion shadows, soft shafts, drifting dust */
function sunlight(zW){const zc=zW+1.5,VIEW=viewTex(),cv=document.createElement('canvas');cv.width=128;cv.height=4;const x=cv.getContext('2d');for(let i=0;i<128;i++){x.fillStyle=`rgba(255,250,240,${.35+.4*Math.abs(Math.sin(i*.35))})`;x.fillRect(i,0,1,4)}
 const CURT=new T.MeshStandardMaterial({map:tx(new T.CanvasTexture(cv)),transparent:true,opacity:.55,roughness:.95,side:T.DoubleSide,depthWrite:false});
 [-1,1].forEach(s=>{rWindow(s,zc,VIEW,CURT);
  const sp=new T.SpotLight(0xffe2b4,LOWP?.7:1.0,18,.5,.9,1);sp.position.set(s*4.75,WCY,zc);sp.target.position.set(-s*.2,.8,zc+.5);sp.castShadow=!LOWP;sp.shadow.mapSize.set(1024,1024);sp.shadow.bias=-.0004;sp.shadow.normalBias=.03;sp.shadow.camera.near=.3;sp.shadow.camera.far=16;dyn.add(sp,sp.target);
  const nz=[[-HW,WY0],[HW,WY0],[HW,WY1],[-HW,WY1]],X=s*4.3,n=nz.map(([a,y])=>[X,y,zc+a]),f=nz.map(([a,y])=>[X-s*4.35*1.05,y-2.52,zc+a*1.15+.55]);
  const m=new T.Mesh(shaft(n,f),beamMat(0xffe2b0,.075));m.frustumCulled=false;m.renderOrder=3;dyn.add(m)});
 const N=LOWP?70:130,arr=new Float32Array(N*6),par=[];for(let k=0;k<N*2;k++)par.push({s:k<N?-1:1,u:Math.random(),v:Math.random(),t:Math.random(),sp:.02+Math.random()*.03,ph:Math.random()*6.28});
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(arr,3));const pts=new T.Points(g,new T.PointsMaterial({size:.05,map:DUSTTEX,transparent:true,opacity:.45,depthWrite:false,blending:T.AdditiveBlending,fog:false,color:0xfff0d0}));pts.frustumCulled=false;dyn.add(pts);beamDust={arr,par,g,zc}}
function updBeamDust(t,dt){const b=beamDust;if(!b)return;const{arr,par,zc}=b;par.forEach((p,i)=>{p.t+=p.sp*dt*.6;if(p.t>1)p.t-=1;const tt=p.t*1.05,ph=p.ph+t*.4;
 arr[i*3]=p.s*4.3-p.s*4.35*tt+Math.sin(ph)*.06;arr[i*3+1]=WY0+(WY1-WY0)*p.v-2.4*tt+Math.cos(ph*1.3)*.05;arr[i*3+2]=zc+(p.u-.5)*2*HW*(1+.15*tt)+.55*tt+Math.sin(ph*.7)*.05});b.g.attributes.position.needsUpdate=true}
/* tall coffered ceiling: walnut beams, brass-framed light panels, cove LEDs, hanging globe clusters */
function ceiling(zW,mz,len){
 for(let q=-2;q>zW;q-=4){box(9,.6,.42,BEAM,0,CH-.3,q-2,dyn);[-1.9,0,1.9].forEach(x=>{box(.62,.04,3.1,BRASS,x,CH-.02,q,dyn).castShadow=false;box(.5,.05,3,GLOW2,x,CH-.06,q,dyn).castShadow=false})}
 [-1,1].forEach(s=>{box(.22,.34,len,WHITE,s*4.39,CH-.17,mz,dyn);box(.1,.05,len,LED,s*4.2,CH-.36,mz,dyn).castShadow=false});
 const gs=[],rs=[];for(let q=-8;q>zW+6;q-=8)[[-.35,-2.6],[.35,-3.4],[0,-3]].forEach(([x,dy])=>{gs.push([x,CH+dy,q]);rs.push([x,CH+dy/2,q,-dy])});
 const M=new T.Matrix4(),Q=new T.Quaternion(),ins=(geo,mat,a)=>{const im=new T.InstancedMesh(geo,mat,a.length);a.forEach((v,i)=>{M.compose(new V(v[0],v[1],v[2]),Q,new V(1,v[3]||1,1));im.setMatrixAt(i,M)});im.frustumCulled=false;dyn.add(im)};
 ins(new T.SphereGeometry(.2,16,12),GLOW2,gs);ins(new T.CylinderGeometry(.008,.008,1,6),BRASS,rs)}
/* statement light over the reading desk: brass ring chandelier, glass globe, warm pool on the table */
function deskLight(zW){const zc=zW+1.5,y=5;
 const ring=new T.Mesh(new T.TorusGeometry(.85,.022,10,48),BRASS);ring.rotation.x=Math.PI/2;ring.position.set(0,y,zc);dyn.add(ring);
 for(let i=0;i<8;i++){const a=i/8*6.283,px=Math.cos(a)*.85,pz=zc+Math.sin(a)*.85,b=new T.Mesh(new T.SphereGeometry(.075,14,10),GLOW2);b.position.set(px,y+.09,pz);dyn.add(b);box(.012,.1,.012,BRASS,px,y+.04,pz,dyn)}
 [0,1,2,3].forEach(i=>{const a=i*1.5708+.785;box(.012,CH-y,.012,BRASS,Math.cos(a)*.6,(CH+y)/2,zc+Math.sin(a)*.6,dyn)});
 const sh=new T.Mesh(new T.SphereGeometry(.24,24,16),std(0xfff2d8,.3,0,{emissive:0xffd9a0,emissiveIntensity:.6}));sh.position.set(0,y-.3,zc);dyn.add(sh);
 const pl=new T.PointLight(0xffd39a,2.6,10,2);pl.position.set(0,y-.3,zc);dyn.add(pl);
 const sp=new T.SpotLight(0xffe0b0,.95,9,.6,1,1.1);sp.position.set(0,y-.3,zc);sp.target.position.set(0,.8,zc);dyn.add(sp,sp.target);
 const cg=new T.CylinderGeometry(.25,1.45,y-1.1,28,1,true),uv=cg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,1-uv.getY(i));
 const c=new T.Mesh(cg,beamMat(0xffdca0,.045));c.position.set(0,(y-.3+.8)/2,zc);c.renderOrder=3;dyn.add(c)}
/* iPad (landscape, on a folio stand) + Apple Pencil on the reading table; screen = #padUI */
function buildPad(zW){const TOP=.785,PX=-.12,PZ=zW+1.72,rr=(w,h,r)=>{const q=new T.Shape(),x=-w/2,y=-h/2;q.moveTo(x+r,y);q.lineTo(x+w-r,y);q.quadraticCurveTo(x+w,y,x+w,y+r);q.lineTo(x+w,y+h-r);q.quadraticCurveTo(x+w,y+h,x+w-r,y+h);q.lineTo(x+r,y+h);q.quadraticCurveTo(x,y+h,x,y+h-r);q.lineTo(x,y+r);q.quadraticCurveTo(x,y,x+r,y);return q};
 phoneG=new T.Group();phoneG.rotation.x=PTILT;phoneG.position.set(PX,TOP+.088,PZ);dyn.add(phoneG);
 const dp=PD-.0024,bg=new T.ExtrudeGeometry(rr(PW,PH,.022),{depth:dp,bevelEnabled:true,bevelThickness:.0012,bevelSize:.0012,bevelSegments:4,curveSegments:14});bg.translate(0,0,-dp/2);
 const body=new T.Mesh(bg,new T.MeshPhysicalMaterial({color:0xa7abb2,metalness:.95,roughness:.3,clearcoat:.2,envMapIntensity:1.1}));body.castShadow=body.receiveShadow=true;phoneG.add(body);
 const bz=new T.Mesh(new T.ShapeGeometry(rr(PW-.012,PH-.012,.017),12),new T.MeshPhysicalMaterial({color:0x050608,roughness:.08,clearcoat:1,clearcoatRoughness:.05}));bz.position.z=PD/2+.0003;phoneG.add(bz);
 const gl=new T.Mesh(new T.ShapeGeometry(rr(PSW,PSH,.01),10),new T.MeshBasicMaterial({color:0x04060c}));gl.position.z=PD/2+.0006;phoneG.add(gl);
 const cam=new T.Mesh(new T.CircleGeometry(.0035,16),new T.MeshBasicMaterial({color:0x10151f}));cam.position.set(0,PH/2-.009,PD/2+.0008);phoneG.add(cam);
 phoneC.set(0,0,PD/2+.0008);phoneCorners=[[-PSW/2,PSH/2],[PSW/2,PSH/2],[PSW/2,-PSH/2],[-PSW/2,-PSH/2]].map(([x,y])=>new V(x,y,PD/2+.0008));
 const sh=new T.Shape();sh.moveTo(0,0);sh.lineTo(.25,0);sh.lineTo(0,.155);sh.lineTo(0,0);const wg=new T.ExtrudeGeometry(sh,{depth:.3,bevelEnabled:false});wg.rotateY(-Math.PI/2);wg.translate(.15,0,0);
 const wd=new T.Mesh(wg,NAVY);wd.position.set(PX,TOP,PZ-.13);wd.castShadow=wd.receiveShadow=true;dyn.add(wd);
 const pen=new T.Group(),W1=std(0xf4f4f2,.28,.05,{envMapIntensity:.9}),len=.27,pr=.0072,pb=new T.Mesh(new T.CylinderGeometry(pr,pr,len,28),W1);pb.rotation.z=Math.PI/2;
 const cone=new T.Mesh(new T.CylinderGeometry(.0028,pr,.03,28),W1);cone.rotation.z=-Math.PI/2;cone.position.x=len/2+.015;
 const nib=new T.Mesh(new T.CylinderGeometry(.0009,.0028,.008,16),std(0x2a2a2e,.4));nib.rotation.z=-Math.PI/2;nib.position.x=len/2+.034;pen.add(pb,cone,nib);
 pen.position.set(PX+.33,TOP+pr,PZ+.03);pen.rotation.y=Math.PI/2-.14;pen.traverse(o=>{o.castShadow=true});dyn.add(pen);
 const pgl=new T.PointLight(0x8fb4ff,.35,.9,2);pgl.position.set(PX,TOP+.18,PZ+.12);dyn.add(pgl)}
/* corridor runner rug + wall clock that shows real time */
function extras(zW,mz,len){const c=document.createElement('canvas');c.width=128;c.height=512;const x=c.getContext('2d');x.fillStyle='#5d1f24';x.fillRect(0,0,128,512);x.strokeStyle='#d0a85c';x.lineWidth=5;x.strokeRect(6,6,116,500);x.lineWidth=2;x.strokeRect(16,16,96,480);
 for(let i=0;i<8;i++){x.beginPath();x.moveTo(64,20+i*60);x.lineTo(92,50+i*60);x.lineTo(64,80+i*60);x.lineTo(36,50+i*60);x.closePath();x.stroke()}
 const t=tx(new T.CanvasTexture(c));t.wrapS=t.wrapT=T.RepeatWrapping;t.wrapS=T.ClampToEdgeWrapping;t.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());t.repeat.set(1,(len-6)/4);const r=plane(1.5,len-6,std(0xffffff,.95,0,{map:t,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-8}),0,.012,mz+.5,0,dyn);r.rotation.set(-Math.PI/2,0,0);
 const ck=new T.Group();ck.position.set(-3.5,3.4,zW+.1);dyn.add(ck);const proc=new T.Group();ck.add(proc);
 proc.add(flat(1,1,256,256,q=>{q.fillStyle='#f6ead0';q.beginPath();q.arc(128,128,122,0,7);q.fill();q.strokeStyle='#24170e';for(let i=0;i<12;i++){const a=i*Math.PI/6;q.lineWidth=i%3?3:7;q.beginPath();q.moveTo(128+Math.sin(a)*98,128-Math.cos(a)*98);q.lineTo(128+Math.sin(a)*114,128-Math.cos(a)*114);q.stroke()}}));
 proc.add(new T.Mesh(new T.TorusGeometry(.5,.03,10,48),BRASS));
 const hand=(l,w,m)=>{const h=new T.Group(),k=new T.Mesh(new T.BoxGeometry(w,l,.008),m);k.position.y=l/2;h.add(k);h.position.z=.012;ck.add(h);return h};
 const RED=std(0xb32020,.4);CLOCK={h:hand(.24,.03,DARK),m:hand(.36,.018,DARK),s:hand(.42,.006,RED),mod:null};
 /* optional model: assets/models/clock/clock.glb (front facing +Z). Nodes named hour / min / sec are driven by the real time */
 const dd=dyn;model('clock',o=>{if(dyn!==dd)return;const w=fitObj(o,1.1,'x'),b=new T.Box3().setFromObject(w),sz=b.getSize(new V());w.position.y=-sz.y/2;ck.add(w);proc.visible=false;
  const find=re=>{let r=null;w.traverse(n=>{if(!r&&re.test(n.name))r=n});return r},H=find(/hour/i),M=find(/min/i),S=find(/sec/i);
  if(H||M||S){const ax=sz.x<sz.y?(sz.x<sz.z?'x':'z'):(sz.y<sz.z?'y':'z');CLOCK.mod={H,M,S,ax,q:[H,M,S].map(n=>n&&n.quaternion.clone())};[CLOCK.h,CLOCK.m,CLOCK.s].forEach(h=>h.visible=false)}else[CLOCK.h,CLOCK.m,CLOCK.s].forEach(h=>h.position.z=sz.z*.5+.02)})}
function tickClock(){if(!CLOCK)return;const d=new Date(),sec=d.getSeconds()+d.getMilliseconds()/1e3,min=d.getMinutes()+sec/60,hr=d.getHours()%12+min/60,A={s:sec*Math.PI/30,m:min*Math.PI/30,h:hr*Math.PI/6};
 CLOCK.s.rotation.z=-A.s;CLOCK.m.rotation.z=-A.m;CLOCK.h.rotation.z=-A.h;const M=CLOCK.mod;
 if(M)[['H','h',0],['M','m',1],['S','s',2]].forEach(([k,a,i])=>{const n=M[k];if(!n)return;const q=new T.Quaternion().setFromAxisAngle(new V(M.ax==='x'?1:0,M.ax==='y'?1:0,M.ax==='z'?1:0),-A[a]);n.quaternion.copy(M.q[i]).multiply(q)})}

function build(shelves){
 shelvesData=shelves;if(dyn){scene.remove(dyn);dispose(dyn)}dyn=new T.Group();scene.add(dyn);P=dyn;
 lay=[];titles=[];cardMs=[];clicks=[];barKey='';if(pg.length!==shelves.length)pg=shelves.map(()=>0);
 PLPOS.length=0;PROC.length=0;beamDust=null;CLOCK=null;planters(-.5,1,5);planters(-.5,-1,5);
 let z=-3;
 shelves.forEach((s,i)=>{
  const side=i%2?-1:1,zc=z-L/2,dir=side>0?1:-1;
  unit(zc,side,L,null,[2,0,1][i%3]);planters(zc,-side,L);lay.push({side,zc,dir});
  s.cards.forEach((c,j)=>{const m=cardMesh(c);m.rotation.order='YXZ';m.rotation.set(-LEAN,-side*Math.PI/2,0);m.userData.j=j;m.userData.shelf=i;dyn.add(m);cardMs.push(m)});
  sign(s,side,zc);
  z-=L;
 });
 layoutCards();flushPlanters();flushFlowers();
 const zEnd=z;zW=zEnd-9;const len=3.4-zW,mz=(3.4+zW)/2;
 const fl=plane(9,len,pbr(new T.MeshPhysicalMaterial({color:0xcfc9c0,roughness:.55,clearcoat:.12,clearcoatRoughness:.45,envMapIntensity:ENV_I,userData:{tint:0xcfc9c0},map:woodTex(2,len/4.5)}),'floor',2,len/4.5),0,0,mz,0,dyn);fl.rotation.set(-Math.PI/2,0,0);
 plane(9,len,std(0xcdc9c1,.92),0,CH,mz,0,dyn).rotation.set(Math.PI/2,0,0);
 ceiling(zW,mz,len);
 [-1,1].forEach(s=>plane(len,CH,WALL,s*4.5,CH/2,mz,-s*Math.PI/2,dyn).rotation.y=-s*Math.PI/2);
 plane(9,CH,WALL,0,CH/2,zW-.05,0,dyn);plane(9,CH,WALL,0,CH/2,3.4,Math.PI,dyn);
 {const ac=document.createElement('canvas');ac.width=64;ac.height=4;const ax=ac.getContext('2d'),ag=ax.createLinearGradient(0,0,64,0);ag.addColorStop(0,'rgba(0,0,0,0)');ag.addColorStop(1,'rgba(0,0,0,.34)');ax.fillStyle=ag;ax.fillRect(0,0,64,4);
  const am=new T.MeshBasicMaterial({map:new T.CanvasTexture(ac),transparent:true,depthWrite:false,toneMapped:false,fog:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4});
  [-1,1].forEach(q=>{const o=plane(.6,len,am,q*3.25,.006,mz,0,dyn);o.rotation.set(-Math.PI/2,0,0);o.scale.x=q;o.receiveShadow=false})}
 addWindows(zW);adminFrame(zW);medBooks(zW);sunlight(zW);extras(zW,mz,len);
 const adm=flat(1.5,.9,600,360,x=>{x.fillStyle='#171310';x.fillRect(0,0,600,360);x.strokeStyle='#d9b05a';x.lineWidth=8;x.strokeRect(6,6,588,348);x.fillStyle='#d9b05a';x.textAlign='center';x.font='bold 66px Georgia,serif';x.fillText('Admin',300,160);x.font='40px sans-serif';x.fillText('Tap to sign in',300,240)});
 adm.position.set(3.1,2.2,zW+.02);adm.userData.fn=()=>LIB.openAdmin();dyn.add(adm);clicks.push(adm);
 const tb=new T.Group();dyn.add(tb);box(3,.07,1.5,WOOD,0,.75,zW+1.5,tb);[zW+.85,zW+2.15].forEach(z=>box(2.7,.09,.05,WOOD,0,.66,z,tb));[-1.4,1.4].forEach(x=>box(.05,.09,1.2,WOOD,x,.66,zW+1.5,tb));
 [[-.75,zW+2.85,0],[.7,zW+2.75,.09],[-.1,zW+.42,Math.PI+.06]].forEach(([x,z,r])=>chair(x,z,r,dyn));
 [[-1.4,zW+.9],[1.4,zW+.9],[-1.4,zW+2.1],[1.4,zW+2.1]].forEach(([x,zz])=>box(.07,.75,.07,DARK,x,.37,zz,tb));
 {const dd=dyn;model('table',o=>{if(dyn!==dd)return;const w=fitObj(o,3,'x');w.position.set(0,0,zW+1.5);tb.children.forEach(c=>c.visible=false);tb.add(w)});
  model('lamp',o=>{if(dyn!==dd)return;const w=fitObj(o,.5,'y');w.position.set(1.05,.785,zW+1.35);w.rotation.y=-.6;dyn.add(w);const l=new T.PointLight(0xffd39a,1.1,4,2);l.position.set(1.05,1.2,zW+1.35);dyn.add(l)})}
 {const rc=document.createElement('canvas');rc.width=rc.height=256;const x=rc.getContext('2d');x.fillStyle='#5a2a2a';x.fillRect(0,0,256,256);x.strokeStyle='#c9a45a';x.lineWidth=6;x.strokeRect(14,14,228,228);for(let i=0;i<900;i++){x.fillStyle=`rgba(${60+Math.random()*60|0},30,30,.25)`;x.fillRect(Math.random()*256,Math.random()*256,2,2)}
  const rt=tx(new T.CanvasTexture(rc));rt.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());const rug=plane(4,2.8,std(0xffffff,.95,0,{map:rt,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-8}),0,.012,zW+1.7,0,dyn);rug.rotation.set(-Math.PI/2,0,0);
  deskLight(zW)}
 buildPad(zW);
 P=scene;computeStops();
 const btn=(t,ic,n,st,c)=>`<button type="button" data-stop="${st}" style="--c:${esc(c||'#d9b05a')}"><span class="material-symbols-outlined">${esc(ic)}</span>${esc(t)}<b>${n}</b></button>`;
 $('#dnav').innerHTML=btn('Home','home','',0)+'<small class="sec">Bookshelves</small>'+shelves.map((s,i)=>btn(s.name,s.icon,s.cards.length,shelfStop[i],s.color)).join('')+'<small class="sec">Around the library</small>'+btn('Reading desk','menu_book','',roomIdx)+btn('Contact phone','call','',S.length-1);
 navBtns=$$('#dnav button');lastNav=-1;
 if(!linked&&shelves.length&&location.hash.length>1){const k=shelves.findIndex(x=>x.slug===decodeURIComponent(location.hash.slice(1)));if(k>=0){linked=true;setTimeout(()=>jump(shelfStop[k]),700)}}
  const total=shelves.reduce((a,s)=>a+s.cards.length,0);$('#lchips').innerHTML=`<button type="button" class="on" data-stop="${shelfStop[0]??2}">All Syntheses<b>${total}</b></button>`+shelves.map((s,i)=>`<button type="button" data-stop="${shelfStop[i]}">${esc(s.name)}<b>${s.cards.length}</b></button>`).join('');
 const bks=shelves.find(x=>x.slug==='books');$('#nBooks').textContent=bks?bks.cards.length:0;
 $('#nPosts').textContent=shelves.reduce((a,s)=>a+s.cards.length,0);$('#nShelves').textContent=shelves.length;
 $('#scroll').style.height=S.length*80+'vh';if(REV)syncScroll(cur)
 }
LIB.build=build;
/* a row fills completely before the next row starts; more than one full shelf becomes carousel pages */
function layoutCards(){cardMs.forEach(m=>{const{j,shelf:i}=m.userData,l=lay[i],pgi=Math.floor(j/CAP),k=j%CAP,r=Math.floor(k/PER),col=k%PER;
 m.visible=pgi===pg[i];m.userData.base.set(l.side*(3.8+.4*Math.sin(LEAN)),.125+(ROWS-1-r)+.4*Math.cos(LEAN),l.zc+l.dir*(-L/2+.4+(col+.5)*SP));m.userData.k=k;if(m.visible&&!m.userData.placed)m.position.copy(m.userData.base)})}
function setPage(i,d){const pages=Math.ceil(shelvesData[i].cards.length/CAP);pg[i]=clamp(pg[i]+d,0,pages-1);cardMs.forEach(m=>{if(m.userData.shelf===i)m.userData.placed=false});layoutCards();barKey=''}

/* ---------- camera stops: focus shelf → walk down the corridor → focus opposite shelf ---------- */
function view(){const asp=innerWidth/innerHeight,fov=asp<1?62:50;return{asp,fov,th:Math.tan(fov*Math.PI/360)}}
function computeStops(){
 const{asp,fov,th}=view();lapG.updateMatrixWorld(true);
 const sc=lapC.clone().applyMatrix4(lapG.matrixWorld),d0=Math.max(lapWH[1]*1.25/(2*th),lapWH[0]*1.12/(2*th*asp));
 /* stop 0: whole desk (laptop with keyboard, table, chair); stop 1: screen close-up */
 const wt=new V(0,.86,-.12),wd=Math.min(3.1,Math.max(1.9/(2*th),3.3/(2*th*asp)));
 S=[{p:new V(0,wt.y+.34*wd,wt.z+.94*wd),t:wt,fov,sh:-1},{p:new V(0,sc.y+.02,sc.z+d0),t:sc,fov,sh:-1}];shelfStop=[];
 const walk=z=>S.push({p:new V(0,1.75,z),t:new V(0,2.2,z-9),fov,sh:-1});
 lay.forEach((s,i)=>{
  walk(i?lay[i-1].zc-L/2+1.2:-2.2);
  const d=Math.min(6.3,Math.max(4.8/(2*th),L*1.02/(2*th*asp))),vw=Math.min(L,2*d*th*asp),m=vw>=L?1:Math.ceil((L-vw)/(vw*.6))+1;
  shelfStop.push(S.length);
  for(let k=0;k<m;k++){const off=m===1?0:(-L/2+vw/2)+k*(L-vw)/(m-1),zk=s.zc+s.side*off;
   S.push({p:new V(s.side*(3.55-d),1.95,zk),t:new V(s.side*3.55,1.95,zk),fov,sh:i})}});
 walk(zW+11);roomIdx=S.length;
 S.push({p:new V(0,2.2,zW+Math.min(9,Math.max(4.8/(2*th),7.4/(2*th*asp)))),t:new V(0,2,zW),fov,sh:-1});
 if(phoneG){phoneG.updateMatrixWorld(true);const pc=phoneC.clone().applyMatrix4(phoneG.matrixWorld),nr=new V(0,0,1).transformDirection(phoneG.matrixWorld),dp=Math.max(PSH*1.08/(2*th),PSW*1.2/(2*th*asp));
  S.push({p:pc.clone().addScaledVector(nr,dp),t:pc,fov,sh:-1})}
}

/* ---------- close-up browsing mode ---------- */
function closeAim(){const l=lay[cm.i],{asp,th}=view(),d=asp<1?2.9:2.5,vis=2*d*th*asp/SP,half=vis/2,lo=half-.5,hi=PER-half-.5;
 cm.col=lo>hi?(PER-1)/2:clamp(cm.col,lo,hi);
 const cnt=Math.min(CAP,shelvesData[cm.i].cards.length-pg[cm.i]*CAP),rows=Math.max(1,Math.ceil(cnt/PER));cm.row=clamp(Math.round(cm.row),0,rows-1);
 const z=l.zc+l.dir*(-L/2+.4+(cm.col+.5)*SP),y=.125+(ROWS-1-cm.row)+.4;
 return{p:new V(l.side*(3.55-d),y+.1,z),t:new V(l.side*3.8,y,z),vis}}
function enter(i){cm={i,col:0,row:0,ry:0};document.documentElement.style.overflow='hidden';barKey='';const a=closeAim();if(mix<.01){cmP.copy(cam.position);cmT.copy(a.t)}}
function leave(){cm=null;document.documentElement.style.overflow='';barKey=''}
/* fly to a specific card: walk to its shelf, flip to its page, then browse closely with the card highlighted */
function goCard(key){const m=cardMs.find(x=>String(x.userData.card.key)===String(key));if(!m)return false;
 const i=m.userData.shelf,j=m.userData.j,k=j%CAP;if(cm)leave();
 if(pg[i]!==Math.floor(j/CAP)){pg[i]=Math.floor(j/CAP);cardMs.forEach(x=>{if(x.userData.shelf===i)x.userData.placed=false});layoutCards()}
 setMenu(false);jump(shelfStop[i]);
 setTimeout(()=>{enter(i);cm.col=k%PER;cm.row=Math.floor(k/PER);m.userData.flash=performance.now()+4000},450);return true}
LIB.goCard=goCard;
const nudge=(dc,dr)=>{if(!cm)return;cm.col+=dc;cm.row+=dr;closeAim()};

/* ---------- project a 3D quad to a CSS matrix3d ---------- */
function solve(A,B){const n=8;for(let i=0;i<n;i++){let m=i;for(let r=i+1;r<n;r++)if(Math.abs(A[r][i])>Math.abs(A[m][i]))m=r;[A[i],A[m]]=[A[m],A[i]];[B[i],B[m]]=[B[m],B[i]];
 for(let r=i+1;r<n;r++){const f=A[r][i]/A[i][i];for(let c=i;c<n;c++)A[r][c]-=f*A[i][c];B[r]-=f*B[i]}}
 const h=new Array(n);for(let i=n-1;i>=0;i--){let s=B[i];for(let c=i+1;c<n;c++)s-=A[i][c]*h[c];h[i]=s/A[i][i]}return h}
function fit(el,g,corners){
 const w=el.offsetWidth,h=el.offsetHeight,pts=[];
 for(const c of corners){const v=c.clone().applyMatrix4(g.matrixWorld).project(cam);if(v.z>1)return false;pts.push([(v.x+1)/2*innerWidth,(1-v.y)/2*innerHeight])}
 const s=[[0,0],[w,0],[w,h],[0,h]],A=[],B=[];
 for(let i=0;i<4;i++){const[x,y]=s[i],[u,v]=pts[i];A.push([x,y,1,0,0,0,-x*u,-y*u]);B.push(u);A.push([0,0,0,x,y,1,-x*v,-y*v]);B.push(v)}
 const k=solve(A,B);el.style.transform=`matrix3d(${k[0]},${k[3]},0,${k[6]},${k[1]},${k[4]},0,${k[7]},0,0,1,0,${k[2]},${k[5]},0,1)`;return true;
}

/* ---------- render loop ---------- */
const lookV=new V(),bp=new V(),bt=new V(),ray=new T.Raycaster(),mouse=new T.Vector2();
function frame(){
 requestAnimationFrame(frame);
 const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);{const raw=clamp(scrollY/max),sp=REV?1-raw:raw;if(!cm)cur+=(sp-cur)*.09}
 const n=S.length;if(n<2)return;
 const u=cur*(n-1),i=Math.min(n-2,Math.floor(u)),f=u-i,e=ss(clamp((f-.12)/.76)),a=S[i],b=S[i+1];
 bp.lerpVectors(a.p,b.p,e);bt.lerpVectors(a.t,b.t,e);bp.y+=Math.sin(e*Math.PI)*.08;
 const fv=a.fov+(b.fov-a.fov)*e+Math.sin(e*Math.PI)*2;
 mix+=((cm?1:0)-mix)*.08;
 if(cm){const q=closeAim();cmP.lerp(q.p,.12);cmT.lerp(q.t,.12)}
 const tt=performance.now()/1000,hh=1-clamp(mix);
 if(mix>.002){const w=ss(clamp(mix));cam.position.lerpVectors(bp,cmP,w);lookV.lerpVectors(bt,cmT,w)}else{cam.position.copy(bp);lookV.copy(bt)}
 cam.position.x+=Math.sin(tt*.9)*.0015*hh;cam.position.y+=Math.sin(tt*1.3)*.0012*hh;cam.lookAt(lookV);
 if(Math.abs(cam.fov-fv)>.01)cam.fov=fv;
 cam.updateMatrixWorld(true);cam.updateProjectionMatrix();
 const sx=Math.round(cam.position.x),sz=Math.round(cam.position.z);sun.position.set(sx+5,11,sz+4);sun.target.position.set(sx,0,sz);
 /* HTML screens on the laptop and phone */
 const lo=clamp((1.5-u)/.5),po=clamp(1-(n-1-u)/.5),lap=LAP,ph=PHN;
 const on=(el,o,g,c)=>{if(el.classList.contains('full')){el.style.visibility='visible';el.style.opacity=1;el.style.pointerEvents='auto';return}const ok=o>.02&&fit(el,g,c);el.style.visibility=ok?'visible':'hidden';el.style.opacity=o;el.style.pointerEvents=o>.6?'auto':'none'};
 lapG.updateMatrixWorld(true);on(lap,lo,lapG,lapCorners);if(phoneG){phoneG.updateMatrixWorld(true);on(ph,po,phoneG,phoneCorners)}
 lapScreen.visible=!lapModel&&lo<.98;HINT.classList.toggle('gone',cur>.01);PROG.style.transform='scaleX('+clamp(cur)+')';
 /* which shelf is in focus → control bar */
 const ci=Math.round(u);if(ci!==lastNav){lastNav=ci;let best=-1,bv=-1;navBtns.forEach((b,k)=>{const st=+b.dataset.stop;if(st<=ci&&st>bv){bv=st;best=k}});navBtns.forEach((b,k)=>b.classList.toggle('on',k===best))}
 const idx=Math.round(u),nf=cm?cm.i:(Math.abs(u-idx)<.18?S[idx].sh:-1);
 const key=nf+'|'+!!cm+'|'+(nf>=0?pg[nf]:'');if(key!==barKey){barKey=key;fs=nf;if(nf>=0&&shelvesData[nf])try{history.replaceState(null,'','#'+shelvesData[nf].slug)}catch(_){}const bar=$('#bar');bar.hidden=nf<0;bar.classList.toggle('close',!!cm);
  if(nf>=0){const cnt=shelvesData[nf].cards.length,pages=Math.ceil(cnt/CAP);['pgPrev','pgInfo','pgNext'].forEach(id=>$('#'+id).style.display=pages>1?'':'none');$('#pgInfo').textContent=(pg[nf]+1)+' / '+pages;$('#browse').style.display=cnt?'':'none'}}
 const t=performance.now()/1000;
 titles.forEach(o=>{const near=Math.abs(cam.position.z-o.zc)<9?1:.001;o.sc+=(near-o.sc)*.07;o.g.scale.setScalar(Math.max(.001,o.sc));o.g.position.y=5.05+Math.sin(t*1.3+o.i)*.05;o.g.rotation.x=Math.sin(t*.7+o.i)*.03*o.sc});
 const nowMs=performance.now();cardMs.forEach(m=>{if(!m.visible)return;const fl=m.userData.flash>nowMs,h=(m===hover||fl)?.12:0;m.userData.front.emissiveIntensity=fl?.65:.2;const s=Math.sign(m.userData.base.x),bs=m.userData.base;
  if(!m.userData.placed){m.position.set(bs.x-s*1.4,bs.y,bs.z);m.userData.placed=true}
  m.position.x+=((bs.x-s*h)-m.position.x)*.14;m.position.y+=(bs.y-m.position.y)*.14;m.position.z+=(bs.z-m.position.z)*.14});
 areas.forEach((a,k)=>a.position.z=Math.round(cam.position.z/4)*4-k*4);driftDust(cam.position.z,tt);BT.value=tt;if(cam.position.z<zW+18)updBeamDust(tt,.016);tickClock();
 if(fx){const u2=fx.grade.uniforms;u2.t.value=tt%100;u2.asp.value=cam.aspect;u2.fade.value=ss(clamp((tt-t0)/2.4));if(fx.bokeh)fx.bokeh.uniforms.focus.value=cam.position.distanceTo(lookV);fx.composer.render()}else renderer.render(scene,cam);
}
const GRADE={uniforms:{tDiffuse:{value:null},t:{value:0},fade:{value:0},asp:{value:1},ex:{value:EX}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float t,fade,asp,ex;varying vec2 vUv;
 float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233))+t)*43758.5453);}
 void main(){vec2 c=vUv-.5;float r=dot(c,c);vec2 o=c*r*.0;
  vec3 col=vec3(texture2D(tDiffuse,vUv+o).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-o).b);
  col=max(col,0.)*ex;col=clamp((col*(2.51*col+.03))/(col*(2.43*col+.59)+.14),0.,1.);col=pow(col,vec3(1./2.2));
  float l=dot(col,vec3(.2126,.7152,.0722));
  col=mix(col,col*vec3(1.05,1.,.93),smoothstep(.45,1.,l));
  col=mix(col,col*vec3(.94,.99,1.05),1.-smoothstep(0.,.4,l));
  col=(col-.5)*1.02+.5;
  col*=1.-smoothstep(.12,.7,r*1.9)*.28;
  col+=(h(vUv*vec2(asp*900.,900.))-.5)*.018;
  gl_FragColor=vec4(col*fade,1.);}`};
const t0=performance.now()/1000,low=matchMedia('(pointer:coarse)').matches||(navigator.hardwareConcurrency||8)<=4;let fx=null;
function initFX(){try{
 if(!T.EffectComposer||!T.RenderPass||!T.ShaderPass)return;
 const pr=renderer.getPixelRatio(),w=innerWidth,h=innerHeight,rt=new T.WebGLMultisampleRenderTarget(w*pr,h*pr,{format:T.RGBAFormat,type:T.HalfFloatType});rt.samples=2;
 const c=new T.EffectComposer(renderer,rt);c.addPass(new T.RenderPass(scene,cam));
 let bokeh=null;
 if(!low&&T.UnrealBloomPass)c.addPass(new T.UnrealBloomPass(new T.Vector2(w/2,h/2),low?.03:.05,.5,.97));
 const grade=new T.ShaderPass(GRADE);c.addPass(grade);fx={composer:c,bokeh,grade};INV.value=1;
}catch(e){console.warn('Cinematic post-processing disabled:',e);fx=null}}
function resize(){renderer.setSize(innerWidth,innerHeight,false);if(fx){const pr=renderer.getPixelRatio();fx.composer.setSize(innerWidth*pr,innerHeight*pr)}cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();{const l=$('#laptopUI'),sm=innerWidth/innerHeight<1.05||innerWidth<720;l.style.width=(sm?620:1000)+'px';l.style.height=(sm?378:610)+'px';l.classList.toggle('sm',sm)}if(phoneG){const p0=clamp(scrollY/scMax());computeStops();$('#scroll').style.height=S.length*80+'vh';if(REV)scrollTo(0,p0*scMax())}}
addEventListener('resize',resize);

/* ---------- interaction ---------- */
const go=idx=>{if(cm)leave();scrollTo({top:scrollFor(idx),behavior:'smooth'})};
LIB.goStop=go;LIB.goPad=()=>{let n=0;const t=()=>{if(S.length>3)jump(S.length-1);else if(n++<20)setTimeout(t,300)};t()};
const setMenu=o=>{$('#drawer').classList.toggle('on',o);$('#veil').classList.toggle('on',o);$('#menuBtn').setAttribute('aria-expanded',o);$('#drawer').setAttribute('aria-hidden',!o)};
$('#menuBtn').onclick=()=>setMenu(!$('#drawer').classList.contains('on'));$('#veil').onclick=()=>setMenu(false);
addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!$('#adm').open){e.preventDefault();setMenu(true);setTimeout(()=>$('.dsearch input').focus(),120);return}if(e.key==='Escape'){setMenu(false);PHN.classList.remove('full');if(cm)leave()}
 if(cm&&e.key.startsWith('Arrow')){e.preventDefault();nudge(e.key==='ArrowRight'?3:e.key==='ArrowLeft'?-3:0,e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0)}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-stop]');if(b){setMenu(false);PHN.classList.remove('full');jump(+b.dataset.stop);return}if(e.target.closest('.openAdmin'))setMenu(false)});
$('.who').onclick=e=>{e.preventDefault();jump(0)};
const RB_=$('#revBtn'),paintRev=()=>{document.body.classList.toggle('revd',REV);if(RB_){RB_.setAttribute('aria-pressed',REV);RB_.title=REV?'Reverse scroll is ON: scrolling down goes back':'Reverse scroll is OFF'}};
function setRev(v){const p=cur;REV=v;try{localStorage.setItem('a139-rev',v?'1':'0')}catch(_){}paintRev();syncScroll(p)}
if(RB_)RB_.onclick=()=>setRev(!REV);paintRev();
/* reverse scroll: the scroll position itself is mirrored (see frame/scrollFor), so wheel, touch, keyboard, scrollbar and trackpad all reverse without intercepting events */
$('#browse').onclick=()=>fs>=0&&enter(fs);$('#mBack').onclick=leave;
$('#mL').onclick=()=>nudge(-3,0);$('#mR').onclick=()=>nudge(3,0);$('#mU').onclick=()=>nudge(0,-1);$('#mD').onclick=()=>nudge(0,1);
$('#pgPrev').onclick=()=>fs>=0&&setPage(fs,-1);$('#pgNext').onclick=()=>fs>=0&&setPage(fs,1);
function pickHit(e){const r=$('#gl').getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(mouse,cam);
 return ray.intersectObjects([...cardMs.filter(m=>m.visible),...clicks],false)[0]}
const pick=e=>{const h=pickHit(e);return h&&h.object};
/* front face = material 4; share button is the top-right circle of the card texture */
const onShare=h=>!!(h&&h.object.userData.card&&h.face&&h.face.materialIndex===4&&h.uv&&h.uv.x>.81&&h.uv.y>.87);
const toast=(()=>{let el,t;const st=document.createElement('style');st.textContent='#toast{position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom));z-index:60;translate:-50% 12px;opacity:0;pointer-events:none;background:#171310ee;color:#f6ead0;border:1px solid #d9b05a88;border-radius:99px;padding:9px 18px;font:600 13px "Plus Jakarta Sans",sans-serif;transition:opacity .25s,translate .25s}#toast.on{opacity:1;translate:-50% 0}';document.head.appendChild(st);
 return m=>{if(!el){el=document.createElement('div');el.id='toast';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=m;el.classList.add('on');clearTimeout(t);t=setTimeout(()=>el.classList.remove('on'),2200)}})();
function shareCard(c){const url=c.link||location.href,data={title:c.title,text:c.title+' · MediNote by Ahmed Istiaq',url};
 const copy=()=>{const done=()=>toast('Link copied to clipboard'),fb=()=>{const ta=document.createElement('textarea');ta.value=url;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done()}catch(_){toast(url)}ta.remove()};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(url).then(done,fb);else fb()};
 if(navigator.share)navigator.share(data).catch(err=>{if(!err||err.name!=='AbortError')copy()});else copy()}
LIB.share=shareCard;
let drag=null;
$('#gl').addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,moved:0}});
$('#gl').addEventListener('pointermove',e=>{
 if(drag&&cm&&e.buttons){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved+=Math.abs(dx)+Math.abs(dy);drag.x=e.clientX;
  const v=closeAim().vis;cm.col-=dx/(innerWidth/v);cm.ry+=dy;if(Math.abs(cm.ry)>90){nudge(0,cm.ry>0?-1:1);cm.ry=0}return}
 if(e.pointerType==='touch')return;const H=pickHit(e),o=H&&H.object;hover=o&&o.userData.card?o:null;$('#gl').style.cursor=o?'pointer':'';const hc=hover&&hover.userData.card;if(hc){TIP.hidden=false;TIP.textContent=onShare(H)?'Share this book':hc.title+(hc.badge?' · '+hc.badge:'');TIP.style.transform='translate('+(e.clientX+14)+'px,'+(e.clientY+16)+'px)'}else TIP.hidden=true});
$('#gl').addEventListener('click',e=>{if(drag&&drag.moved>8)return;const H=pickHit(e),o=H&&H.object;if(!o)return;if(o.userData.card){if(onShare(H))shareCard(o.userData.card);else LIB.open(o.userData.card)}else if(o.userData.fn)o.userData.fn()});
/* search: dim non-matching books, flip to the right page and fly to the first shelf with a match */
let st;
function searchNow(){const q=($('.qs').value||'').trim().toLowerCase();if(!q)return;const m=cardMs.find(x=>x.userData.hay.includes(q));if(m){try{document.activeElement.blur()}catch(_){}setMenu(false);LIB.goCard(m.userData.card.key)}}
document.addEventListener('input',e=>{if(!e.target.matches('.qs'))return;const q=e.target.value.trim().toLowerCase();
 $$('.qs').forEach(i=>{if(i!==e.target)i.value=e.target.value});let n=0;
 cardMs.forEach(m=>{const ok=!q||m.userData.hay.includes(q);m.userData.front.color.setHex(ok?0xffffff:0x444444);if(ok&&q)n++});
 $$('.hits').forEach(h=>h.textContent=q?n+' found':'');clearTimeout(st);st=setTimeout(searchNow,750)});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches&&e.target.matches('.qs')){e.preventDefault();clearTimeout(st);searchNow()}});

const LD=$('#loader'),LB=$('#loader u');let ldDone=false;const hideLd=()=>{if(ldDone||!LD)return;ldDone=true;LD.classList.add('off');setTimeout(()=>LD.remove(),700)};
T.DefaultLoadingManager.onProgress=(u,i,n)=>{if(LB)LB.style.width=Math.max(8,i/n*100)+'%'};T.DefaultLoadingManager.onLoad=hideLd;addEventListener('load',()=>setTimeout(hideLd,500));setTimeout(hideLd,4500);
$('#pdFull').onclick=()=>PHN.classList.toggle('full');const clk=()=>{const c=$('#pdClock');if(c)c.textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};clk();setInterval(clk,2e4);
initFX();resize();build([]);frame();loadLaptop();
})();
