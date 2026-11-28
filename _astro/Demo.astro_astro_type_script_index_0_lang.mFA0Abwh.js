const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["_astro/ToneAudioEngine.iuDO7Wk5.js","_astro/rolldown-runtime.pP25SEvz.js"])))=>i.map(i=>d[i]);
import{C as e,E as t,S as n,T as r,_ as i,a,b as o,c as s,d as c,f as l,g as u,h as d,l as f,m as p,o as m,p as h,r as g,s as _,u as v,v as y,w as b,x,y as S}from"./palette.DwIam8xR.js";import{a as C,i as w,l as T,n as E,o as D,s as O,t as k}from"./icons.DP79BUfy.js";import{f as A,p as j}from"./overviewMapInput.DmshDoDc.js";import{t as M}from"./menuBar.C9uGgpit.js";import{t as N}from"./preload-helper.DygEbaNj.js";import{a as ee,c as te,d as ne,l as re,s as P,t as F,u as ie}from"./deskTaskbar.B-v1zGhI.js";import{n as ae,r as I,t as L}from"./directive.BSZPiF1A.js";import{i as oe,r as se}from"./directive-helpers.CEcIXpaj.js";import{a as ce,c as le,i as ue,r as de,s as fe,t as pe}from"./schemeKey.CWRjHFw-.js";import{t as me}from"./class-map.BBN9sn2d.js";import{r as he,t as ge}from"./deskControlPanel.C_R5RhcX.js";var _e=class{constructor(e=()=>N(()=>import(`./ToneAudioEngine.iuDO7Wk5.js`),__vite__mapDeps([0,1]))){this.loadEngine=e,this.muted=!1,this.musicVolume=1,this.ambienceVolume=1,this.sfxVolume=1,this.musicDucked=!1,this.away=!1,this.program=`game`,this.started=!1,this.impl=null,this.loading=!1,this.generation=0,this.lastFocus=null,this.handover=null,this.pendingCue=null}start(){if(this.impl){this.impl.start(),this.started=this.impl.started;return}if(this.loading)return;let e=globalThis;if(e.AudioContext===void 0&&e.webkitAudioContext===void 0)return;this.loading=!0;let t=++this.generation;this.loadEngine().then(({ToneAudioEngine:e})=>{if(t!==this.generation)return;this.loading=!1;let n=new e;this.impl=n,n.setMuted(this.muted),n.setVolumes(this.heardMusic(),this.ambienceVolume,this.sfxVolume),n.setProgram(this.program),this.handover&&n.continueMusic(this.handover.seconds,this.handover.asOf),this.handover=null,n.setAway(this.away),n.start(),this.started=n.started,this.lastFocus&&n.update(this.lastFocus);let r=this.takePendingCue();r&&n.sfx(r)}).catch(()=>{t===this.generation&&(this.loading=!1,this.pendingCue=null)})}setMuted(e){this.muted=e,this.impl?.setMuted(e)}setAway(e){this.away=e,this.impl?.setAway(e)}setProgram(e){this.program=e,this.impl?.setProgram(e)}get musicTime(){return this.impl?.musicTime??null}continueMusic(e,t){Number.isFinite(e)&&Number.isFinite(t)&&(this.impl?this.impl.continueMusic(e,t):this.handover={seconds:e,asOf:t})}setVolumes(e,t,n){this.musicVolume=xe(e,this.musicVolume),this.ambienceVolume=xe(t,this.ambienceVolume),this.sfxVolume=xe(n,this.sfxVolume),this.impl?.setVolumes(this.heardMusic(),this.ambienceVolume,this.sfxVolume)}setMusicDucked(e){e!==this.musicDucked&&(this.musicDucked=e,this.impl?.setVolumes(this.heardMusic(),this.ambienceVolume,this.sfxVolume))}heardMusic(){return this.musicDucked?this.musicVolume*be:this.musicVolume}update(e){this.lastFocus=e,this.impl?.update(e)}sfx(e){this.impl?this.impl.sfx(e):this.loading&&(this.pendingCue={name:e,at:ye()})}takePendingCue(){let e=this.pendingCue;return this.pendingCue=null,e&&ye()-e.at<=ve?e.name:null}dispose(){this.generation++,this.loading=!1,this.pendingCue=null,this.handover=null,this.impl?.dispose(),this.impl=null,this.started=!1}},ve=1e3,ye=()=>performance.now(),be=.5;function xe(e,t){return Number.isFinite(e)?Math.max(0,Math.min(1,e)):t}function Se(e,t){let{win:n,doc:r}=e,i=()=>r.visibilityState!==`visible`||!r.hasFocus(),a=i();t(a);let o=()=>{let e=i();e!==a&&(a=e,t(a))};return n.addEventListener(`blur`,o),n.addEventListener(`focus`,o),r.addEventListener(`visibilitychange`,o),()=>{n.removeEventListener(`blur`,o),n.removeEventListener(`focus`,o),r.removeEventListener(`visibilitychange`,o)}}var Ce=[{name:`click`,label:`Click`},{name:`build`,label:`Build`},{name:`sell`,label:`Sell`},{name:`money`,label:`Money`},{name:`promote`,label:`Promotion`},{name:`notify`,label:`Notice`},{name:`error`,label:`Error`},{name:`tick`,label:`Countdown tick`}],we=[{program:`splash`,label:`Title music`},{program:`game`,label:`Tower music`}],Te=[{label:`Lobby`,focus:{dominant:`lobby`}},{label:`Offices`,focus:{dominant:`office`,hour:11}},{label:`Condos`,focus:{dominant:`condo`,hour:18}},{label:`Hotel`,focus:{dominant:`hotelDouble`,hour:21,night:!0}},{label:`Restaurants`,focus:{dominant:`restaurant`,hour:19}},{label:`Shops`,focus:{dominant:`shop`,hour:15}},{label:`Cinema`,focus:{dominant:`cinema`,hour:20}},{label:`Metro`,focus:{dominant:`metro`,centerFloor:-9}},{label:`Street`,focus:{dominant:`outside`,centerFloor:1}},{label:`Street in the rain`,focus:{dominant:`outside`,centerFloor:1,weather:`rain`}},{label:`Whole tower`,focus:{dominant:`office`,zoom:.1}}],Ee={centerFloor:5,dominant:`lobby`,night:!1,zoom:2,weather:`clear`,hour:12,crowd:.7},De=250,Oe=e=>O`<button type="button" class="btn" aria-pressed=${e.pressed===void 0?w:String(e.pressed)} @click=${e.onPress}>${e.label}</button>`,ke=(e,t)=>O`<div class="g-sound-row"><h3>${e}</h3><div class="g-row" role="group" aria-label=${e}>${t.map(Oe)}</div></div>`;function Ae(e){let t=new _e;Se({win:window,doc:document},e=>t.setAway(e));let n=0,r=0,i=Ee,a=null,o=null,s=null,c=()=>{t.start(),t.setVolumes(n,r,1)},l=Ce.map(({name:e,label:n})=>({label:n,onPress:()=>{c(),t.sfx(e)}})),u=we.map(({program:e,label:r})=>({label:r,onPress:()=>{n=1,t.setProgram(e),c(),o=r,m()}})),d={label:`Stop music`,onPress:()=>{n=0,c(),o=null,m()}},f=Te.map(({label:e,focus:n})=>({label:e,onPress:()=>{r=1,i={...Ee,...n},c(),t.update(i),a??=setInterval(()=>t.update(i),De),s=e,m()}})),p={label:`Stop ambience`,onPress:()=>{r=0,c(),a!==null&&clearInterval(a),a=null,s=null,m()}};function m(){let t=u.map(e=>({...e,pressed:e.label===o})),n=f.map(e=>({...e,pressed:e.label===s}));C(O`<div>${[ke(`Effects`,l),ke(`Music`,[...t,d]),ke(`Places`,[...n,p])]}</div>`,e)}m()}var je=`https://help.verticopolis.com/`;function Me(e){return je+e}var Ne=e=>O`<a class="g-manual" href=${Me(e)}>In the manual</a>`,Pe={office:`rooms/offices/`,condo:`rooms/homes/#condominiums`,rentalStudio:`rooms/homes/#studios-and-apartments-modern`,rentalApartment:`rooms/homes/#studios-and-apartments-modern`,hotelSingle:`rooms/hotels/#the-three-rooms`,hotelDouble:`rooms/hotels/#the-three-rooms`,hotelSuite:`rooms/hotels/#the-three-rooms`,housekeeping:`rooms/hotels/#housekeeping`,fastFood:`rooms/food-and-shops/#fast-food`,restaurant:`rooms/food-and-shops/#restaurants`,foodHall:`rooms/food-and-shops/#food-hall-modern`,shop:`rooms/food-and-shops/#retail-shops`,boutiqueBay:`rooms/food-and-shops/#boutique-bay-modern`,clinic:`rooms/food-and-shops/#clinic-modern`,cinema:`rooms/venues/#cinema`,partyHall:`rooms/venues/#party-hall`,amusements:`rooms/venues/#amusements`,fitnessClub:`rooms/venues/#fitness-club`,nightclub:`rooms/venues/#nightclub`,spa:`rooms/venues/#spa`,skyBar:`rooms/venues/#sky-bar`,aquaticCenter:`rooms/venues/#aquatic-center`,daycare:`rooms/venues/#daycare`,parkingRamp:`rooms/services/#parking`,parking:`rooms/services/#parking`,security:`rooms/services/#security`,medical:`rooms/services/#medical-center`,recycling:`rooms/services/#recycling-center`,metro:`rooms/services/#metro-station`,weddingHall:`rooms/wedding-hall/`},Fe=3,R=26,Ie=8,z=33,Le=`#2A2E38`,Re=`#3A3E48`;function ze(e,t,n){return m(e*Fe,120,t,e=>{e.scale(Fe,Fe),n(e)},`${e*Fe}px`)}function B(e,t,n,r){let i=n.length>0&&r.length>0?Ie:0,a=(n.length+r.length)*R+i,o=ze(a,`${e}: ${t}`,e=>{e.fillStyle=Re,e.fillRect(0,34,a,1),e.fillStyle=Le,e.fillRect(0,35,a,5),n.forEach((t,n)=>b(e,n*R+7,z,t.look,t.o)),r.forEach((t,r)=>b(e,(n.length+r)*R+i+7,z,t.look,t.o))});return _(o,e,t)}function Be(t,n=`walk`){return[Array.from({length:e.lit},(e,r)=>({look:t,o:{lit:!0,frame:r,pose:n}})),Array.from({length:e.flat},(e,i)=>({look:t,o:{lit:!1,frame:r(!1,i),pose:n}}))]}function Ve(e,t){return[[{look:e,o:{...t,lit:!0}}],[{look:e,o:{...t,lit:!1}}]]}var He={short:`short hair`,crop:`cropped hair`,long:`long hair`,bob:`a bob`,bun:`a bun`,curly:`curly hair`,bald:`bald`,cap:`a cap`,guardCap:`a guard's cap`,beanie:`a beanie`,hardhat:`a hard hat`},Ue={none:`empty hands`,briefcase:`a briefcase`,bag:`a handbag`,suitcase:`a suitcase`,coffee:`a coffee`,cart:`a cart`,flashlight:`a flashlight`,vacuum:`a vacuum`,sack:`a sack`},We={suit:`suit`,blouse:`blouse`,tee:`T-shirt`,sweater:`sweater`,uniform:`uniform`};function Ge(e){return`${We[e.topKind]+(e.skirt?` and skirt`:``)}, ${He[e.hairStyle]}, ${Ue[e.carry]}`}function V(e,t,n,r){let i=r?O` ${Ne(r)}`:w;return O`<section class="g-people-section"><h3>${e}</h3><p>${t}${i}</p><div class="g-people">${n}</div></section>`}function Ke(){return V(`Tenants and visitors`,`The civilian cast walking: four lit frames, then the two flat ones.`,S.map((e,t)=>B(`Visitor ${t+1}`,Ge(e),...Be(e))),`tower/people/#who-is-in-your-tower`)}function qe(){let e=o.housekeeperCleaning-o.housekeeper;return V(`Housekeeping crew`,`One uniform on six different people, with the cart and the vacuum.`,Array.from({length:e},(e,t)=>{let n=x[o.housekeeper+t],r=x[o.housekeeperCleaning+t],i=[{look:n,o:{lit:!0,frame:0,pose:`push`}},{look:n,o:{lit:!0,frame:2,pose:`push`}},{look:r,o:{lit:!0,frame:0,pose:`push`}},{look:r,o:{lit:!0,frame:1,pose:`push`}},{look:n,o:{lit:!0,pose:`bend`}}],a=[{look:n,o:{lit:!1,frame:0,pose:`push`}},{look:r,o:{lit:!1,frame:0,pose:`push`}}];return B(`Housekeeper ${t+1}`,`${Ge(n)}: pushing the cart, vacuuming, making a bed`,i,a)}),`rooms/hotels/#housekeeping`)}function Je(){let e=n.security,t=n.maintenance,r=n.thief,[i,a]=Be(r,`run`);return V(`Staff and the thief`,`The guard, the maintenance crew and the thief.`,[B(`Security guard`,`${Ge(e)}, walking`,...Be(e)),B(`Security guard on the stairs`,`climbing during a search`,...Be(e,`climb`)),B(`Maintenance`,`${Ge(t)}, walking`,...Be(t)),B(`Thief`,`${Ge(r)}, running`,i,a),B(`Thief, caught`,`hands up, the sack dropped`,...Ve(r,{pose:`caught`,empty:!0}))],`tower/events/#thieves`)}var Ye=[{pose:`walk`,title:`Walk`,caption:`arms swing with the stride`},{pose:`stand`,title:`Stand`,caption:`arms at the sides`},{pose:`watch`,title:`Watch`,caption:`checks the time while waiting`},{pose:`hips`,title:`Hips`,caption:`hands on hips, impatient`},{pose:`armsUp`,title:`Arms up`,caption:`both arms thrown up, fed up`},{pose:`climb`,title:`Climb`,caption:`on the emergency stairs`},{pose:`push`,title:`Push`,caption:`pushing a cart or a vacuum`},{pose:`bend`,title:`Bend`,caption:`leaning over a bed`},{pose:`run`,title:`Run`,caption:`a longer stride`},{pose:`caught`,title:`Caught`,caption:`hands up`}];function Xe(){let e=S[2];return V(`Poses`,`Every pose, lit and flat, on one visitor with nothing in hand.`,Ye.map(t=>B(t.title,t.caption,...Ve(e,{pose:t.pose,frame:0,empty:!0}))),`tower/people/#what-the-people-are-doing`)}var Ze=[{mood:`content`,pose:`stand`,title:`Content`,caption:`their own clothes`},{mood:`impatient`,pose:`hips`,title:`Impatient`,caption:`an orange top, hands on hips`},{mood:`fedUp`,pose:`armsUp`,title:`Fed up`,caption:`a red top, arms thrown up`}];function Qe(){return V(`Moods`,`How a wait shows: the top takes the mood's color.`,Ze.map(e=>{let t=S.slice(0,3).map(t=>({look:t,o:{lit:!0,pose:e.pose,mood:e.mood}})),n=S.slice(0,3).map(t=>({look:t,o:{lit:!1,pose:e.pose,mood:e.mood}}));return B(e.title,e.caption,t,n)}),`tower/people/#when-people-wait-too-long`)}function $e(){let e=[[`Seated`,`at a table or a desk`,(e,t,n)=>d(e,t,27,n)],[`Standing`,`at a counter`,(e,t,n)=>u(e,t,z,n)],[`Walking`,`across a room`,(e,t,n)=>i(e,t,z,n)],[`Tradesperson`,`hard hat and stripe`,(e,t,n)=>p(e,t,z,n)]].map(([e,t,n])=>_(ze(130,`${e}: ${t}`,t=>{t.fillStyle=Le,t.fillRect(0,35,130,5);for(let r=0;r<5;r++)e===`Seated`&&(t.fillStyle=`#6E4A30`,t.fillRect(r*R+4,27,14,2),t.fillRect(r*R+5,29,1,6),t.fillRect(r*R+16,29,1,6)),n(t,r*R+7,r)}),e,t)),t=ze(130,`Asleep: a guest in bed at night`,e=>{for(let t=0;t<3;t++){let n=t*42+3;e.fillStyle=`#5A4030`,e.fillRect(n,29,38,6),e.fillStyle=`#E8E4DA`,e.fillRect(n+1,26,8,3),y(e,n+2,23,30,[`#5A6E8C`,`#8C4A5A`,`#4A7A5A`][t],t)}});return e.push(_(t,`Asleep`,`a guest in bed at night`)),V(`In rooms`,`The builds the rooms draw their guests in, and a sleeper.`,e)}var et=()=>O`<div class="g-people-page">${[Ke(),qe(),Je(),Xe(),Qe(),$e()]}</div>`,tt=`desk-win-help`,nt=(e,t)=>O`<div class="desk-help-bar" role="group" aria-label="Help"><button type="button" class="btn" @click=${e.contents}>Contents</button><button type="button" class="btn" ?disabled=${!t.back} @click=${e.back}>Back</button><button type="button" class="btn" ?disabled=${!t.forward} @click=${e.forward}>Forward</button><button type="button" class="btn" @click=${e.openInBrowser}>Open in Browser</button></div>`;function rt(e,t,n,r,i=ee){let a=P(e,tt,t,n.close,i),o=A(e,O`<div class="desk-help-menu"></div>`).elements[0];a.body.append(o);let s=new M(o,r.model,{altKeys:!1,onOpen:r.onOpen}),c=A(e,nt(n,{back:!1,forward:!1}));a.body.append(...c.elements);let l=A(e,O`<iframe class="desk-help-page" title="Player's Manual" referrerpolicy="strict-origin-when-cross-origin"></iframe>`).elements[0];return a.body.append(l),{...a,page:l,menus:s,setNav:e=>c.update(nt(n,e)),dispose:()=>s.dispose()}}var it=28,at=new Date(2026,10,15,9,15),H=`${`/`.replace(/\/?$/,`/`)}favicon.png`,ot={tools:{x:8,y:8,w:132,h:250},info:{x:148,y:8,w:352,h:0},tower:{x:148,y:62,w:352,h:300},bulletin:{x:508,y:8,w:204,h:0},help:{x:180,y:24,w:480,h:360}},st=[`tower`,`info`,`tools`,`bulletin`,`help`],ct=[`tower`,`info`,`tools`,`bulletin`],lt={contents:{title:`Contents`,text:`Pick a topic to read about it.`},elevators:{title:`Elevators`,text:`If a tower has a heart, it is the elevators. Every worker, resident and guest above the lobby rides one.`},offices:{title:`Offices`,text:`Offices rent by the quarter and fill with workers who come and go on weekdays.`}},ut=(e,t,n)=>({label:`Player's Manual menu`,menus:[{id:`g-hw-file`,label:`File`,mnemonic:0,items:[{label:`Open in Browser`},{label:`Print Topic…`},{kind:`separator`},{label:`Exit`,onPick:n}]},{id:`g-hw-edit`,label:`Edit`,mnemonic:0,items:[{label:`Find…`},{label:`Copy Link to This Page`}]},{id:`g-hw-options`,label:`Options`,mnemonic:0,items:[`Light`,`Dark`,`Match My Device`].map(n=>({label:n,radio:!0,checked:n===e,onPick:()=>t(n)}))},{id:`g-hw-help`,label:`Help`,mnemonic:0,items:[{label:`What's New`},{label:`Report a Problem…`},{kind:`separator`},{label:`Sponsor Verticopolis`}]}]}),dt=(e,t)=>O`<style>
      body { font: 14px/1.5 system-ui, sans-serif; margin: 16px; color: #111; background: #fff; }
      h1 { font-size: 20px; margin: 0 0 8px; }
    </style>
    <h1>${lt[e].title}</h1>
    <p>${lt[e].text}</p>
    <ul>
      ${Object.keys(lt).filter(t=>t!==e).map(e=>O`<li><a href="#" @click=${n=>(n.preventDefault(),t(e))}>${lt[e].title}</a></li>`)}
    </ul>`;function ft(e){let t=f(e),n=t.find(e=>e.title===`Halls of two heights`)??t[0],{w:r,h:i}=l(n),a=m(r,i,n.title,t=>c({ctx:t,lit:!0,anim:0,hour:19,parkingUse:.7,recycleFill:.66},n,e));return O`<div class="g-desk-stage">${a}</div>`}var pt=O`<div class="g-desk-info">
  <span><b>Funds</b> $2,450,000</span><span><b>Population</b> 1,204</span><span><b>Time</b> 9:15 AM</span>
</div>`,mt=O`<div class="g-desk-tools">
  ${[`Lobby`,`Floor`,`Office`,`Condo`,`Hotel room`,`Stairs`,`Elevator`].map(e=>O`<button type="button" class="btn">${e}</button>`)}
</div>`,ht=e=>O`<section id="g-desk-bulletin" class="win win-closable g-desk-bulletin" aria-labelledby="g-desk-bulletin-title">
    <div class="win-title">
      <span class="desk-title-text" id="g-desk-bulletin-title">Bulletin</span
      ><button type="button" class="btn xs" aria-label="Close Bulletin" @click=${e}>×</button>
    </div>
    <div class="well g-desk-news">
      <div>8:00 AM: the lobby opened.</div>
      <div>9:15 AM: an office tenant moved in.</div>
    </div>
  </section>`;function gt(e,t){document.body.classList.add(`desk`);let n=e.ownerDocument,r={},i=e=>()=>void(r[e].hidden=!1),o=e=>()=>void(r[e].hidden=!0),s={tower:()=>k.show(`tower`),bulletin:()=>k.show(`bulletin`),help:()=>k.show(`help`),arrange:()=>{for(let e of ct)k.show(e);k.arrange(),k.bringUp(`tower`)}},c=null,l=()=>c??=k.windowMenu(),u=!0,d=new F(n,{items:[{id:`tower`,label:`Sample Tower`},{id:`bulletin`,label:`Bulletin`},{id:`help`,label:`Player's Manual`},null,{id:`arrange`,label:`Arrange Windows`}],icon:H,now:()=>at,task:e=>k.taskPressed(e),start:e=>s[e]?.(),sound:()=>d.setSound(u=!u),windowMenu:{state:e=>l().state(e),run:(e,t)=>l().run(e,t)}}),f=e=>{let t=k.titleBarOf(e.target);t&&(e.preventDefault(),d.openWindowMenu(t,e.clientX,e.clientY))},p=P(n,`g-desk-tools`,`Tools`,void 0,H);C(mt,p.body);let m=P(n,`g-desk-info`,`Info`,void 0,H);C(pt,m.body);let h=P(n,`g-desk-tower`,`Sample Tower`,{label:`Close Sample Tower`,onClick:o(`tower`)},H),g;C(O`<div class="g-desk-menu" ${j(e=>e&&(g=e))}></div>${ft(t)}`,h.body),new M(g,_t(e=>k.show(e)),{altKeys:!1});let _=[`contents`],v=0,y=()=>{let e=_[v];T.setTitle(e===`contents`?`Player's Manual`:`${lt[e].title} - Player's Manual`),T.setNav({back:v>0,forward:v<_.length-1});let t=T.page.contentDocument?.body;t&&C(dt(e,b),t)},b=e=>{_=[..._.slice(0,v+1),e],v=_.length-1,y()},x=e=>{v=Math.min(_.length-1,Math.max(0,v+e)),y()},S=`Match My Device`,w=e=>{S=e,T.menus.render(ut(S,w,o(`help`)))},T=rt(n,`Player's Manual`,{contents:()=>b(`contents`),back:()=>x(-1),forward:()=>x(1),openInBrowser:()=>void 0,close:{label:`Close the Player's Manual`,onClick:o(`help`)}},{model:ut(S,w,o(`help`))},H);T.root.hidden=!0;let E=A(n,ht(o(`bulletin`))).elements[0];Object.assign(r,{tools:p.root,info:m.root,tower:h.root,bulletin:E,help:T.root});let D;C(O`<div class="g-desk-scroll">
      <div class="g-desk" style=${`width: 720px; height: 460px;`}>
        <div
          class="desk-area"
          style=${`bottom: ${it}px;`}
          @contextmenu=${f}
          ${j(e=>e&&(D=e))}
        >
          ${[p.root,m.root,h.root,E,T.root]}
        </div>
        ${d.root}
      </div>
    </div>`,e),d.start();let k=new a({desk:D,order:st,places:()=>ot,chrome:e=>e===`tower`?g:null,refreshed:e=>d.render(e)}),N=(e,t,n={})=>({id:e,el:r[e],label:()=>t,icon:H,layer:`tool`,limits:null,canMax:!1,isOpen:()=>!r[e].hidden,...n});k.add(N(`tools`,`Tools`,{limits:re,heightOnly:!0})),p.root.style.width=`${ot.tools.w}px`,k.add(N(`info`,`Info`)),m.root.style.width=`${ot.info.w}px`,k.add(N(`tower`,`Sample Tower`,{layer:`app`,limits:ie,canMax:!0,open:i(`tower`),close:o(`tower`)})),k.add(N(`bulletin`,`Bulletin`,{open:i(`bulletin`),close:o(`bulletin`)})),k.add(N(`help`,`Player's Manual`,{limits:te,canMax:!0,open:i(`help`),close:o(`help`)})),y(),k.start()}function _t(e){return{label:`Sample Tower menu`,menus:[{id:`g-desk-window`,label:`Window`,mnemonic:0,items:[{label:`Tools`,onPick:()=>e(`tools`)},{label:`Info`,onPick:()=>e(`info`)},{label:`Bulletin`,onPick:()=>e(`bulletin`)}]},{id:`g-desk-help`,label:`Help`,mnemonic:0,items:[{label:`Player's Manual`,shortcut:`F1`,onPick:()=>e(`help`)}]}]}}var vt=[{label:`1024 × 600, the smallest desk`,w:1024,h:572},{label:`1366 × 768`,w:1366,h:740},{label:`1920 × 1080`,w:1920,h:1052}],yt=[{id:`tower`,label:`Tower`},{id:`tools`,label:`Tools`},{id:`info`,label:`Info`},{id:`map`,label:`Map`},{id:`bulletin`,label:`Bulletin`}];function bt(e,t){return e===`info`?{...t,h:64}:e===`map`?{...t,w:300,h:310}:e===`bulletin`?{...t,w:300,h:222}:t}function xt(e){let t=ne(e.w,e.h),n=Math.round(e.w/48),r=yt.map(({id:e,label:r})=>{let i=bt(e,t[e]);return T`<g class=${`g-layout-${e}`}>
      <rect x=${i.x} y=${i.y} width=${i.w} height=${i.h}></rect>
      <text x=${i.x+n/2} y=${i.y+n*1.3}>${r}</text>
      <text class="g-layout-size" x=${i.x+n/2} y=${i.y+n*2.4}>${`${i.w} × ${i.h} at ${i.x}, ${i.y}`}</text>
    </g>`});return O`<figure class="g-layout">
    <svg viewBox=${`0 0 ${e.w} ${e.h}`} style=${`--g-layout-text: ${n}px`} role="img" aria-label=${`Where the windows open on a ${e.label} desk`}>
      <rect class="g-layout-desk" width=${e.w} height=${e.h}></rect>
      ${r}
    </svg>
    <figcaption><strong>${e.label}</strong></figcaption>
  </figure>`}var St=()=>O`<div class="g-layouts">${vt.map(xt)}</div>`,Ct=L(class extends ae{constructor(){super(...arguments),this.key=w}render(e,t){return this.key=e,t}update(e,[t,n]){return t!==this.key&&(se(e),this.key=t),n}}),wt=class{constructor(){this.displaceable=!1,this.leash=null,this.pendingNotice=null,this.onDisplaced=null}opening(e,t){if(e){this.breakLeash(`displaced`);let e=this.onDisplaced;this.onDisplaced=null,e?.()}this.displaceable=t.displaceable===!0,this.onDisplaced=t.onDisplaced??null}closed(e){if(this.displaceable=!1,this.onDisplaced=null,this.pendingNotice=null,!e)return;let t=this.leash;this.leash=null,t?.onResolve()}ownsPendingWork(e){return e&&!this.displaceable}wait(e,t){this.breakLeash(`superseded`),this.leash={onResolve:e,onBroken:t}}towerSwapped(){this.breakLeash(`tower-swapped`)}deferNotice(e,t=`bad`){this.pendingNotice={text:e,kind:t}}takeNotice(){let e=this.pendingNotice;return this.pendingNotice=null,e}breakLeash(e){let t=this.leash;this.leash=null,t?.onBroken(e)}},Tt=`verticopolis-modal-title`;function Et(e,t){let n=t===`bad`;return O`<p class=${n?`modal-notice`:`modal-notice modal-notice-calm`} role=${n?`alert`:`status`}>${e}</p>`}function Dt(e,t,n,r){let i=n?O`<button type="button" class="modal-x btn xs" aria-label="Close" @click=${r}>✕</button>`:w,a=t?Ct(t.serial,Et(t.text,t.kind)):w;return O`<div class="modal-box win win-closable"><h2 class="win-title"><span id=${Tt}>${e.title}</span>${i}</h2>${a}${e.body}</div>`}var U=class{constructor(e,t){this.dialog=e,this.deps=t,this.precedence=new wt,this.view=null,this.notice=null,this.serial=0,this.closeShown=!1,this.cancel=()=>{this.dialog.dispatchEvent(new Event(`cancel`,{cancelable:!0}))}}open(e,t={}){let n=this.dialog,r=n.open;this.view=null,this.notice=null,this.closeShown=!1,C(w,n),this.precedence.opening(r,t);let i=this.precedence.takeNotice();return i&&(this.notice={...i,serial:++this.serial}),this.view=e,this.draw(),n.setAttribute(`aria-labelledby`,Tt),!n.open&&!this.deps.gameStopped()&&n.showModal(),this.closeShown=!0,this.draw(),n.onclick=e=>{e.target===n&&this.close()},n.oncancel=()=>this.close(),n.querySelector(`:scope > .modal-box`)}render(e){this.view&&(this.view=e,this.draw())}close(){let e=this.dialog,t=e.open;t&&e.close(),this.view=null,this.notice=null,C(w,e),e.removeAttribute(`aria-labelledby`),this.precedence.closed(t)}say(e,t=!0,n=`bad`){this.dialog.open?this.view?(t||!this.notice)&&(this.notice={text:e,kind:n,serial:++this.serial},this.draw()):t&&this.precedence.deferNotice(e,n):this.deps.toast(e,n)}draw(){this.view&&C(Dt(this.view,this.notice,this.closeShown,this.cancel),this.dialog)}};function Ot(e){return O`<div class="modal-actions modal-footer">
    ${e.map(e=>{let t=e.primary?`btn primary`:`btn`,n=e.act??w,r=e.autofocus===!0;return O`<button type="button" class=${t} data-act=${n} ?autofocus=${r} @click=${e.onPress}>${e.label}</button>`})}
  </div>`}function kt(e){let t=Array.isArray(e.text)?e.text:[e.text];return O`${t.map(e=>O`<p>${e}</p>`)}${Ot(e.buttons)}`}function At(e){return{title:e.icon?O`${E(e.icon,{size:e.iconSize??16})}${e.title}`:e.title,body:kt(e)}}var jt=[{button:`A message…`,view:e=>At({title:`About Verticopolis components`,text:`The windows, menus, sprites and sounds of Verticopolis, in one package.`,buttons:[{label:`OK`,primary:!0,onPress:e}]})},{button:`A question…`,view:e=>At({title:`Sample Tower`,text:`Save the changes to Sample Tower before closing it?`,buttons:[{label:`Save`,primary:!0,onPress:e},{label:`Don't Save`,onPress:e},{label:`Cancel`,onPress:e}]})},{button:`A warning…`,view:e=>At({title:`Sample Tower`,icon:`warning`,text:[`Sample Tower could not be saved.`,`This browser's storage is full.`],buttons:[{label:`OK`,primary:!0,onPress:e}]})},{button:`A notice…`,view:e=>At({title:`Open`,text:`Pick a tower file to open.`,buttons:[{label:`Close`,onPress:e}]}),notice:`That file is not a tower. Pick another one.`}];function Mt(){let e=null,t=t=>{t instanceof HTMLDialogElement&&!e&&(e=new U(t,{gameStopped:()=>!1,toast:()=>void 0}))},n=t=>{if(!e)return;let n=e;n.open(t.view(()=>n.close())),t.notice&&n.say(t.notice)};return O`<div class="g-row">
      ${jt.map(e=>O`<button type="button" class="btn" @click=${()=>n(e)}>${e.button}</button>`)}
    </div>
    <dialog id="modal" ${j(t)}></dialog>`}var Nt=e=>e.preventDefault();function Pt(e,t){let n=e.primary?`btn primary`:`btn`;return e.href===void 0?O`<button type="button" class=${n} data-act=${e.act} ?disabled=${e.disabled===!0} ?autofocus=${t===e.act} @click=${e.onPress??w}>${e.label}</button>`:O`<a class=${n} data-act=${e.act} target="_blank" rel="noopener noreferrer" href=${e.href} @click=${e.onPress??w}>${e.label}</a>`}function Ft(e,t,n=!1,r){let i=`${e}-title`,a=t.kind===`wait`?`status`:w,o=t.buttons??[],s=t.status===void 0?w:O`<p class="crash-status" aria-live="polite">${t.status}</p>`,c=o.length?O`<div class="modal-actions">${o.map(e=>Pt(e,t.focus))}</div>`:w;return O`<dialog
    id=${e}
    class="win crash-card"
    role=${t.kind===`alert`?`alertdialog`:w}
    aria-labelledby=${i}
    ?open=${n}
    @cancel=${Nt}
    @close=${r??w}
  ><h2 id=${i} class="win-title">${t.title}</h2>${t.text.map(e=>O`<p role=${a}>${e}</p>`)}${s}${c}</dialog>`}var It=class{constructor(e,t,n){this.id=t,this.fallback=!1,this.closing=!1,this.closed=()=>{this.closing||this.show()},this.view=n,this.drawn=A(e,Ft(t,n,!1,this.closed)),this.dialog=this.drawn.elements[0],e.body.append(this.dialog),this.show()}update(e){this.view=e,this.draw()}button(e){return this.dialog.querySelector(`[data-act="${e}"]`)}close(){this.closing=!0,this.dialog.open&&this.dialog.close(),this.dialog.remove()}show(){try{this.dialog.showModal()}catch{this.fallback=!1,this.draw(),this.fallback=!0,this.draw()}this.view.focus!==void 0&&this.button(this.view.focus)?.focus()}draw(){this.drawn.update(Ft(this.id,this.view,this.fallback,this.closed))}},Lt=`whatsnew-title`;function Rt(e,t){return O`<div class="whatsnew"><h3 class="win-title sm" id=${Lt}>${e}</h3><div
      class="well whatsnew-log"
      tabindex="0"
      role="region"
      aria-labelledby=${Lt}
    >${t}</div></div>`}var zt=e=>O`<ul>${e.map(e=>O`<li>${e}</li>`)}</ul>`;function Bt(e){let t=e.releases??[];if(t.length>=2||t.length===1&&t[0].version!==e.version)return Rt(e.since?`What's new since ${e.since}`:`What's new`,O`${t.map(e=>O`<h4 class="whatsnew-ver">${e.version}</h4>${zt(e.notes)}`)}${e.more?O`<p class="whatsnew-more">Earlier updates are not listed here.</p>`:w}`)}function Vt(e){return e.notes.length===0?w:e.notes.length<=e.shortNotes?O`<div class="whatsnew"><h3 class="win-title sm">What's new</h3>${zt(e.notes)}</div>`:Rt(`What's new`,zt(e.notes))}function Ht(e){return O`<p class="whatsnew-all"><a href=${e} target="_blank" rel="noopener noreferrer" data-act="release-notes">All release notes<span class="visually-hidden"> (opens in a new tab)</span></a></p>`}function Ut(e,t){let n=Bt(e)??Vt(e),r=n!==w&&e.allNotesHref?Ht(e.allNotesHref):w,i=e.kind?O`<p class="update-kind"><strong>${e.kind}</strong></p>`:w;return{title:e.title,body:O`
      ${i} ${e.text.map(e=>O`<p>${e}</p>`)} ${n} ${r}
      ${(e.buildLines??[]).map(e=>O`<p class="build-id">${e}</p>`)}
      <div class="modal-actions modal-footer">
        <button type="button" class="btn" data-act="later" autofocus @click=${()=>t.later()}>${e.laterLabel??`Later`}</button>
        <button type="button" class="btn primary" data-act="update" @click=${()=>t.update()}>${e.updateLabel??`Update now`}</button>
      </div>
    `}}var Wt=`g-crash-card`,Gt=`g-wait-card`,Kt=3e3;function qt(){if(document.getElementById(Wt))return;let e=null,t=(t,r=!1)=>({title:`The program stopped`,kind:`alert`,text:[`The graphics driver reset while the program was running.`,`Your tower was saved. Nothing is lost.`,`A report helps fix this. Nothing is sent anywhere until you attach it to a bug report yourself.`],status:t,buttons:[{label:`Download report`,act:`download`,disabled:r,onPress:n},{label:O`Report a bug<span class="visually-hidden"> (opens in a new tab)</span>`,act:`report`,href:`https://github.com/Verticopolis/components/issues/new`},{label:`Close`,act:`reload`,primary:!0,onPress:()=>e?.close()}],focus:`reload`});function n(){e?.update(t(`Packing the report…`,!0)),setTimeout(()=>e?.update(t(`The report is ready. Check your downloads.`)),800)}e=new It(document,Wt,t(``))}function Jt(){if(document.getElementById(Gt))return;let e=new It(document,Gt,{title:`Recovering graphics`,kind:`wait`,text:[`The device reset the graphics. They are restarting, which takes a few seconds. Your tower is safe.`]});setTimeout(()=>e.close(),Kt)}var Yt=[`Saves are faster on a large tower.`,`The map remembers where it was.`,`A new cinema look.`],Xt=[{button:`An update…`,view:{title:`Update available`,kind:`Game update`,text:[`A newer version is ready. Update now saves your tower and reloads onto it.`,`Or keep playing: it applies next time you reopen.`],version:`2.1.0`,notes:Yt,shortNotes:3,allNotesHref:`https://github.com/Verticopolis/components/releases`,buildLines:[`Build 2.1.0 · 1a2b3c4`]}},{button:`An update after several versions…`,view:{title:`Update available`,text:[`A newer version is ready. Update now saves your tower and reloads onto it.`,`Or keep playing: it applies next time you reopen.`],version:`2.1.0`,notes:Yt,releases:[{version:`2.1.0`,notes:Yt},{version:`2.0.2`,notes:[`Fixes a stuck elevator car.`]},{version:`2.0.1`,notes:[`Fixes the Tools window on a short phone.`,`Clearer funds color.`]}],since:`2.0.0`,more:!0,shortNotes:3,buildLines:[`Build 2.1.0 · 1a2b3c4`]}}];function Zt(){let e=null,t=t=>{t instanceof HTMLDialogElement&&!e&&(e=new U(t,{gameStopped:()=>!1,toast:()=>void 0}))},n=t=>{let n=e;n&&n.open(Ut(t,{later:()=>n.close(),update:()=>n.close()}))};return O`<div class="g-row">
      <button type="button" class="btn" @click=${qt}>A crash card…</button>
      <button type="button" class="btn" @click=${Jt}>A wait card…</button>
      ${Xt.map(e=>O`<button type="button" class="btn" @click=${()=>n(e.view)}>${e.button}</button>`)}
    </div>
    <dialog id="modal" ${j(t)}></dialog>`}function Qt(e,t,n=`Changes the windows, menus and buttons only.`){return O`
    <fieldset class="appearance-group">
      <legend>Scheme</legend>
      <div class="appearance-samples" role="radiogroup" aria-label="Scheme">
        ${de.map(n=>O`
            <label class="appearance-choice" data-scheme-choice=${n}>
              <input
                type="radio"
                name="appearance-scheme"
                value=${n}
                .checked=${e===n}
                @change=${()=>t.onPick(n)}
              />
              <span class="appearance-sample" data-sample=${n} aria-hidden="true">
                <span class="appearance-sample-title">Tower</span>
                <span class="appearance-sample-body"><span class="appearance-sample-btn">OK</span></span>
              </span>
              <span class="appearance-name">${ue[n]}</span>
            </label>
          `)}
      </div>
    </fieldset>
    <p class="appearance-note">${n}</p>
    <div class="modal-actions modal-footer">
      <button type="button" class="btn primary" data-appearance="ok" @click=${t.onOk}>OK</button>
      <button type="button" class="btn" data-appearance="cancel" @click=${t.onCancel}>Cancel</button>
    </div>
  `}function $t(e,t,n){return{title:`Appearance`,body:Qt(e,t,n)}}function en(e,t,n,r={}){let i=t,a=e.open($t(t,{onPick:e=>{i=e},onOk:()=>{e.close(),n(i)},onCancel:()=>e.close()},r.note),{displaceable:r.displaceable??!0});return a.querySelector(`input[value="${t}"]`)?.focus(),a}function tn(){let e=null;return O`<div class="g-row">
      <button type="button" class="btn" @click=${()=>{if(!e)return;let t=document.documentElement;en(e,le(t),e=>{ce(e,t),fe(pe,e)})}}>Appearance…</button>
    </div>
    <dialog id="modal" ${j(t=>{t instanceof HTMLDialogElement&&!e&&(e=new U(t,{gameStopped:()=>!1,toast:()=>void 0}))})}></dialog>`}var nn=`local`;function rn(){return nn}function an(e){nn=e}function on(){return typeof matchMedia==`function`&&matchMedia(`(pointer: coarse)`).matches?`device`:`computer`}function sn(e){let t=()=>e.find(`.fd-look-item:not([aria-disabled="true"])`),n=e=>{let n=t();n[(e+n.length)%n.length]?.focus()},r=()=>{e.set({look:!0,menu:null}),n(0)};return{toggleLook(t){t.stopPropagation(),e.state().look?e.set({look:!1}):r()},lookKey(i){let a=t().indexOf(document.activeElement),o={ArrowDown:1,ArrowUp:-1}[i.key]??0;e.state().look?o===0?i.key===`Home`||i.key===`End`?(i.preventDefault(),n(i.key===`Home`?0:-1)):i.key===`Tab`&&e.set({look:!1}):(i.preventDefault(),n(a<0?0:a+o)):(o!==0||i.key===`F4`)&&(i.preventDefault(),r())},choose(t){e.remember(t),e.set({place:t,look:!1,selected:null,line:null}),t===`linked`&&e.linked?.refresh().catch(()=>{}),e.focusList()},link(){let t=e.linked;t&&(e.set({look:!1}),e.run(async()=>{let n=await t.link();return n===`linked`?(e.remember(`linked`),e.set({place:`linked`,selected:null}),null):n===`cancel`?null:n}))},unlink(){let t=e.linked,n=t?.state()?.name;t&&n&&(e.set({look:!1}),e.run(async()=>await t.unlink()||(e.remember(`local`),e.set({place:`local`,selected:null}),{text:`Unlinked "${n}". Its files are still there.`,kind:`info`})))},toggleMirror(){let t=e.linked;t?.state()&&(e.set({look:!1}),e.run(()=>t.setMirror(!t.mirror())))}}}var cn=e=>e.target instanceof Element&&e.target.closest(`input, textarea`)!==null;function ln(e,t=()=>{},n=Date.now){let r=null,i=null,a=0,o=0,s=!1,c=null,l=()=>{r!==null&&clearTimeout(r),r=null},u=()=>{l(),i=null,s=!1,c=null},d=()=>s&&c!==null&&n()-c<800;function f(e){e.pointerId===i&&(l(),i=null,s&&(c=n()))}function p(e){e.pointerId===i&&r!==null&&Math.abs(e.clientX-a)+Math.abs(e.clientY-o)>10&&l()}return{down(n,c){c.pointerType!==`mouse`&&c.isPrimary&&!cn(c)&&(i=c.pointerId,a=c.clientX,o=c.clientY,r=setTimeout(()=>{r=null,s=!0,e(n,a,o),t(`hold`)},500))},contextMenu(n,r){if(cn(r))return;r.preventDefault();let a=i!==null;s&&(a||d())||(a&&(l(),s=!0),e(n,r.clientX,r.clientY),t(a?`hold`:`pointer`))},key:()=>t(`key`),watch:{capture:!0,handleEvent(e){e.type===`pointerdown`?u():e.type===`pointermove`?p(e):e.type===`pointerup`||e.type===`pointercancel`?f(e):e.type===`click`&&e.detail>0&&d()&&(s=!1,c=null,e.preventDefault(),e.stopPropagation())}}}}function un(e,t){return t?{count:e.count+1,bytes:e.bytes+(t.size??0)}:e}function dn(e,t,n,r,i){let a=t.filter(e=>r===`all`||e.kind===r).map(e=>({id:e.id,name:e.name,kind:e.kind,size:e.size,modified:e.modified})),o=e=>{let t=n.findIndex(t=>t.id===e);return t<0?n.length:t},s={name:(e,t)=>e.name.localeCompare(t.name,void 0,{sensitivity:`base`,numeric:!0}),type:(e,t)=>o(e.kind)-o(t.kind),size:(e,t)=>(e.size??0)-(t.size??0),modified:(e,t)=>(e.modified??0)-(t.modified??0)};return a.sort((e,t)=>(i.down?-1:1)*s[i.key](e,t)||s.name(e,t)),e&&r===`all`?[e,...a]:a}var fn=L(class extends ae{constructor(e){if(super(e),e.type!==I.PROPERTY&&e.type!==I.ATTRIBUTE&&e.type!==I.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!oe(e))throw Error("`live` bindings can only contain a single expression")}render(e){return e}update(e,[t]){if(t===D||t===w)return t;let n=e.element,r=e.name;if(e.type===I.PROPERTY){if(t===n[r])return D}else if(e.type===I.BOOLEAN_ATTRIBUTE){if(!!t===n.hasAttribute(r))return D}else if(e.type===I.ATTRIBUTE&&n.getAttribute(r)===t+``)return D;return se(e),t}}),W=`#000`,G=`#fff`,pn=`#808080`,mn=T`
  <path d="M3.5 1.5h6l3 3v10h-9z" fill=${G} stroke=${W} />
  <path d="M9.5 1.5v3h3" fill=${pn} stroke=${W} />`,hn=T`
    <rect x="6" y="6" width="4" height="8" fill="#000080" />
    <rect x="7" y="7" width="1" height="1" fill="#ffd400" /><rect x="8" y="9" width="1" height="1" fill="#ffd400" />
    <rect x="7" y="11" width="1" height="1" fill="#ffd400" />`,gn=T`
    <rect x="5" y="12" width="6" height="2" fill=${pn} />
    <rect x="6" y="6" width="4" height="6" fill="#008080" />
    <rect x="7" y="7" width="2" height="1" fill=${G} /><rect x="7" y="9" width="2" height="1" fill=${G} />`,_n=T`
    <rect x="5" y="7" width="6" height="6" fill="#008000" />
    <rect x="7" y="8" width="1" height="3" fill=${G} /><rect x="8" y="10" width="2" height="1" fill=${G} />`;function vn(e){return T`<svg class="fd-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" shape-rendering="crispEdges">${mn}${e}</svg>`}function yn(){return T`<svg class="fd-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" shape-rendering="crispEdges">
    <path d="M1.5 3.5h5l1 2h7v8h-13z" fill="#ffd400" stroke=${W} />
    <path d="M2 6h12" stroke="#fff4a0" />
  </svg>`}function bn(){return T`<svg class="fd-ask-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" shape-rendering="crispEdges">
    <path d="M16 2.5 30.5 29.5h-29z" fill="#ffd400" stroke=${W} stroke-linejoin="miter" />
    <path d="M3.5 28.5h26" stroke=${pn} />
    <rect x="14" y="10" width="4" height="11" fill=${W} />
    <rect x="14" y="23" width="4" height="4" fill=${W} />
  </svg>`}function xn(){return T`<svg class="fd-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" shape-rendering="crispEdges">
    <path d="M1.5 3.5h5l1 2h7v8h-13z" fill="#ffd400" stroke=${W} />
    <path d="M2 6h12" stroke="#fff4a0" />
    <rect x="8.5" y="9.5" width="7" height="5" fill="#c0c0c0" stroke=${W} />
    <rect x="10" y="12" width="2" height="1" fill="#008000" />
  </svg>`}function Sn(){return T`<svg class="fd-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" shape-rendering="crispEdges">
    <path d="M1.5 3.5h5l1 2h7v8h-13z" fill=${G} stroke=${W} />
    <path d="M10 8v5M7.5 10.5h5" stroke="#000080" stroke-width="2" />
  </svg>`}function Cn(e,t){return t===`linked`&&e.linked?O`${xn()}<span class="fd-look-name">${e.linked.name}</span><span class="fd-look-sub">on this ${e.where}</span>`:O`${yn()}<span class="fd-look-name">${e.words.home}</span><span class="fd-look-sub">${e.words.homeWhere}</span>`}function wn(e,t){let n=e.mode===`open`,r=(t,n,r={},i=!0)=>O`<button type="button" role="menuitem" class=${me({"fd-look-item":!0,...r})} aria-disabled=${i?`false`:`true`}
      ?disabled=${e.busy&&i} @click=${e=>{e.stopPropagation(),i&&n()}}>${t}</button>`;return O`<div class="fd-where">
    <span class="fd-where-label" id="fd-look-label">${n?`Look in:`:`Save in:`}</span>
    <button type="button" class="fd-look field" aria-haspopup="menu" aria-expanded=${e.lookOpen?`true`:`false`}
      aria-labelledby="fd-look-label fd-look-now" @click=${t.toggleLook} @keydown=${t.lookKey}>
      <span class="fd-look-now" id="fd-look-now">${Cn(e,e.place)}</span><span class="fd-look-arrow" aria-hidden="true">▼</span>
    </button>
    <span class="fd-usage">${e.usage}</span>
    ${e.lookOpen?O`<div class="fd-look-pop well" role="menu" aria-label=${n?`Look in`:`Save in`} @keydown=${t.lookKey}>
          ${r(Cn(e,`local`),()=>t.choose(`local`),{selected:e.place===`local`})}
          ${e.linked?r(Cn(e,`linked`),()=>t.choose(`linked`),{selected:e.place===`linked`}):w}
          <div class="fd-look-sep" role="separator"></div>
          ${e.canLink?O`${r(O`${Sn()}<span>${e.linked?`Link a different folder…`:`Link a folder on this ${e.where}…`}</span>`,t.link)}
              ${e.linked?Tn(e.words.mirror,e.linked.mirror,e.busy,t.toggleMirror):w}
              ${e.linked?r(O`<span class="fd-icon-pad"></span><span>Unlink "${e.linked.name}"</span><span class="fd-look-sub">its files stay</span>`,t.unlink):w}`:r(O`<span class="fd-icon-pad"></span><span>This browser can't link a folder</span>`,()=>{},{quiet:!0},!1)}
        </div>`:w}
  </div>`}function Tn(e,t,n,r){return O`<button type="button" role="menuitemcheckbox" class="fd-look-item fd-mirror" aria-checked=${t?`true`:`false`} ?disabled=${n}
    @click=${e=>{e.stopPropagation(),r()}}><span class="fd-icon-pad fd-check" aria-hidden="true">${t?`✓`:``}</span><span>${e}</span></button>`}function En(e,t){return O`<div class="fd-allow">
    ${xn()}
    <p>Your browser needs your OK to open <b>${e.linked?.name??`the folder`}</b> again.</p>
    <button type="button" class="btn primary" ?disabled=${e.busy} @click=${t}>Allow access…</button>
  </div>`}var Dn=(e,t)=>e.kinds.find(e=>e.id===t),On=(e,t)=>Dn(e,t)?.label??t,kn=[{key:`name`,label:`Name`},{key:`type`,label:`Type`},{key:`size`,label:`Size`},{key:`modified`,label:`Modified`}];function An(e){if(e>=1048576)return`${(e/1048576).toFixed(1)} MB`;let t=e/1024;return`${t<10?t.toFixed(1):Math.round(t)} KB`}function jn(e){return new Date(e).toLocaleString(void 0,{month:`numeric`,day:`numeric`,hour:`numeric`,minute:`2-digit`})}function Mn(e,t){let n=e.count===1?`1 ${t.one}`:`${e.count} ${t.many}`;return e.count===0?`No ${t.many} yet`:`${n}, ${An(e.bytes)}`}var Nn=e=>e.place===`linked`&&e.linked?e.linked.name:e.words.home,Pn=e=>`fd-row-${e.replace(/[^A-Za-z0-9-]/g,e=>`_${e.codePointAt(0).toString(16)}_`)}`;function Fn(e){return e.place===`linked`?e.linked?.allowed?Mn(e.usage,e.words):`Needs your OK`:e.loading?`Opening ${e.words.home}…`:Mn(e.usage,e.words)}var In=e=>e.place===`linked`&&!e.linked?.allowed;function Ln(e,t){let n=e.mode===`open`,r=e.rows.find(t=>t.id===e.selected)??null,i=!!r&&!r.pinned,a=e.words;return O`
    <div class=${me({fd:!0,"fd-dropping":e.dropping})} @pointerdown=${t.press.watch} @pointermove=${t.press.watch}
      @pointerup=${t.press.watch} @pointercancel=${t.press.watch} @click=${t.press.watch} @keydown=${t.windowKey}
      @dragenter=${t.drag.enter} @dragover=${t.drag.over} @dragleave=${t.drag.leave} @drop=${t.drag.drop}>
      ${wn({...e,usage:Fn(e)},t.places)}
      <div class="fd-list well" @click=${t.closeMenu}>
        <div class="fd-head" role="presentation">
          ${kn.map(n=>O`<button type="button" class="fd-col fd-col-${n.key}" @click=${()=>t.sort(n.key)}
              aria-label="Sort by ${n.label}">${n.label}${Bn(e,n.key)}</button>`)}
        </div>
        <div class="fd-rows" role="listbox" tabindex="0" aria-label=${Nn(e)}
          aria-activedescendant=${r?Pn(r.id):w} @keydown=${t.listKey}>
          ${Rn(e,t)}
        </div>
        ${e.dropping?O`<div class="fd-drop-note">Drop ${a.one} files here to add them to ${a.home}</div>`:w}
      </div>
      ${e.menu?Kn(e,t):w}
      ${e.kept&&n?zn(a.kept,t):w}
      <div class="fd-fields">
        <label class="fd-label" for="fd-name">File name:</label>
        <input id="fd-name" class="field fd-name" type="text" maxlength=${e.nameMax} autocomplete="off" spellcheck="false" placeholder="File name"
          .value=${fn(e.name)} @input=${e=>t.name(e.target.value)}
          @keydown=${e=>{e.key===`Enter`&&(e.preventDefault(),t.primary())}} />
        <button type="button" class="btn primary fd-primary" ?disabled=${e.busy||e.loading||In(e)} @click=${t.primary}>${n?`Open`:`Save`}</button>
        <label class="fd-label" for="fd-type">${n?`Files of type:`:`Save as type:`}</label>
        ${n?O`<select id="fd-type" class="field fd-type" .value=${e.filter}
              @change=${e=>t.filter(e.target.value)}>
              <option value="all" ?selected=${e.filter===`all`}>${a.all}</option>
              ${e.kinds.map(t=>t.filter?O`<option value=${t.id} ?selected=${e.filter===t.id}>${t.filter}</option>`:w)}
            </select>`:O`<select id="fd-type" class="field fd-type"><option>${Dn(e,e.saveKind)?.filter??On(e,e.saveKind)}</option></select>`}
        <button type="button" class="btn fd-cancel" @click=${t.cancel}>Cancel</button>
      </div>
      ${e.line?O`<p class=${`fd-line fd-line-${e.line.kind}`} role="alert">${e.line.text}</p>`:w}
      ${Wn(n,i,e,t)}
      ${e.ask?Gn(e.ask,a,t):w}
      <input class="fd-folder-input" type="file" multiple webkitdirectory hidden tabindex="-1"
        @change=${e=>{let n=e.target;t.folderPicked(Array.from(n.files??[])),n.value=``}} />
    </div>`}function Rn(e,t){return In(e)?En({...e,usage:``},t.allow):e.rows.length===0?O`<div class="fd-empty">${Vn(e)}</div>`:e.rows.map(n=>Hn(n,e,t))}function zn(e,t){return O`<p class="fd-kept">
    ${e}
    <button type="button" class="btn" @click=${t.downloadKept}>Download it</button>
  </p>`}function Bn(e,t){return e.sort.key===t?e.sort.down?` ▼`:` ▲`:``}function Vn(e){let t=e.words.many;return e.place===`linked`?e.filter===`all`?e.mode===`open`?`No ${t} in this folder yet.`:`No ${t} in this folder yet. Save one here.`:`No ${t} of this type in this folder.`:e.loading?`Opening ${e.words.home}…`:e.filter===`all`?e.mode===`open`?`No ${t} yet. Add one from a file, or drop it here.`:`No ${t} yet.`:`No ${t} of this type.`}function Hn(e,t,n){let r=e.id===t.selected,i=e.pinned?e.name:`${e.name}, ${On(t,e.kind)}`,a=Dn(t,e.kind)?.mark;return O`<div id=${Pn(e.id)} role="option" aria-selected=${r?`true`:`false`} aria-label=${i}
    class=${me({"fd-row":!0,[`fd-row-${e.kind}`]:!0,"fd-row-pinned":!!e.pinned,selected:r})}
    draggable="false"
    @click=${()=>n.select(e.id)} @dblclick=${()=>n.activate(e.id)}
    @pointerdown=${t=>n.press.down(e.id,t)}
    @contextmenu=${t=>n.press.contextMenu(e.id,t)}>
    ${a?vn(a):w}
    ${t.renaming===e.id?Un(e,t.nameMax,n):O`<span class="fd-cell fd-name-cell">${e.name}</span>`}
    <span class="fd-cell fd-type-cell">${On(t,e.kind)}</span>
    <span class="fd-cell fd-size-cell">${e.size===void 0?``:An(e.size)}</span>
    <span class="fd-cell fd-when-cell">${e.modified===void 0?``:jn(e.modified)}</span>
  </div>`}function Un(e,t,n){return O`<input class="field fd-rename" type="text" maxlength=${t} aria-label="New name for ${e.name}" .value=${e.name}
    @click=${e=>e.stopPropagation()}
    @dblclick=${e=>e.stopPropagation()}
    @keydown=${e=>{e.stopPropagation(),e.key===`Enter`?n.renameDone(e.target.value):e.key===`Escape`&&(e.preventDefault(),n.renameDone(null))}}
    @blur=${e=>n.renameDone(e.target.value)} />`}function Wn(e,t,n,r){let i=n.place===`local`;return O`<div class="fd-tools">
    ${i?O`<button type="button" class="btn" ?disabled=${!t||n.busy} @click=${r.rename}>Rename</button>`:w}
    <button type="button" class="btn" ?disabled=${!t||n.busy} @click=${r.duplicate}>Duplicate</button>
    ${i?O`<button type="button" class="btn" ?disabled=${!t||n.busy} @click=${r.remove}>Delete</button>`:w}
    <button type="button" class="btn fd-computer" @click=${r.fromComputer}>
      <span class="fd-on-desktop">${e?`From a file on your computer…`:`To a file on your computer…`}</span>
      <span class="fd-on-phone">${e?`From your device…`:`To your device…`}</span>
    </button>
    ${e&&n.canPickFolder?O`<button type="button" class="btn fd-from-folder" ?disabled=${n.busy} @click=${r.fromFolder}>From a folder…</button>`:w}
  </div>`}function Gn(e,t,n){let r=e.kind===`replace`,[i,a,o]=r?[`Save As`,`"${e.name}" already exists.`,e.alt?`Save this ${t.one} as "${e.alt}", or replace it?`:`Do you want to replace it?`]:[`Confirm File Delete`,`Are you sure you want to delete "${e.name}"?`,`It can't be undone.`],s=(e,t)=>O`<button type="button" class="btn" data-fd-ask=${e} @click=${()=>n.answer(e)}>${t}</button>`;return O`<div class="fd-ask-layer" @click=${e=>e.stopPropagation()}>
    <div class="win fd-ask" role="alertdialog" aria-modal="true" aria-labelledby="fd-ask-title" aria-describedby="fd-ask-text">
      <div class="win-title" id="fd-ask-title">${i}</div>
      <div class="fd-ask-body">
        ${bn()}
        <p id="fd-ask-text">${a}<br />${o}</p>
      </div>
      <div class="fd-ask-buttons">
        ${r&&e.alt?O`${s(`alt`,`Save as "${e.alt}"`)}${s(`yes`,`Replace`)}${s(`no`,`Cancel`)}`:O`${s(`yes`,`Yes`)}${s(`no`,`No`)}`}
      </div>
    </div>
  </div>`}function Kn(e,t){let n=e.menu,r=e.rows.find(e=>e.id===n.id),i=!!r&&!r.pinned,a=e.place===`local`,o=(e,n,r=!0)=>O`<button type="button" role="menuitem" class="mb-item" aria-disabled=${r?`false`:`true`}
      @click=${()=>{t.closeMenu(),r&&n()}}>${e}</button>`;return O`<div class="mb-pop fd-menu" role="menu" aria-label="File" style="left:${n.x}px;top:${n.y}px">
    ${o(e.mode===`open`?`Open`:`Save`,()=>t.activate(n.id))}
    ${i&&a?o(`Rename`,t.rename):w}
    ${i&&a?o(`Copy`,t.copy):w}
    ${a?o(`Paste`,t.paste,e.canPaste):w}
    ${i?o(`Duplicate`,t.duplicate):w}
    ${i&&a?o(`Delete`,t.remove):w}
    ${r?.kind===e.saveKind&&i&&a&&e.canVersions?o(`Previous versions…`,t.versions):w}
  </div>`}var qn=null,Jn=e=>!!e.dataTransfer&&Array.from(e.dataTransfer.types).includes(`Files`);function Yn(e,t,n){let r=t.mode===`open`,i=t.words,a=r?`Open`:`Save As`,o={selected:n?.selected??null,name:n?.name??t.initialName,filter:n?.filter??`all`,sort:n?.sort??{key:`modified`,down:!0},line:null,ask:null,renaming:null,menu:null,busy:!1,dropping:!1,place:n?.place??t.startIn??rn(),look:!1},s=t.linked??null,c=()=>o.place===`linked`&&!!s?.state(),l=()=>c()?s.files():t.files(),u=()=>!c()||s.state()?.access===`granted`,d=()=>c()?`"${s.state().name}"`:i.home,f=(e,t)=>e.toLocaleLowerCase()===t.toLocaleLowerCase(),p=null,m=()=>!!p?.isConnected,h=[],g=e=>h.find(t=>t.id===e)??null,_=e=>{let t=g(e);return t&&!t.pinned?t:null},v=e=>p?.querySelector(e)??null;function y(){let e=c(),n=r&&!e?t.pinned():null;h=dn(n,l(),t.kinds,o.filter,o.sort),o.selected!==null&&!g(o.selected)&&(o.selected=null);let a=s?.state()??null;return Ln({...o,mode:t.mode,words:i,kinds:t.kinds,saveKind:t.saveKind,nameMax:t.nameMax,rows:h,usage:e?s.usage():un(t.usage(),n),loading:!e&&t.loading(),canPaste:qn!==null,canVersions:!!t.versions,kept:t.downloadKept!==null,place:e?`linked`:`local`,linked:a?{name:a.name,allowed:a.access===`granted`,mirror:s.mirror()}:null,canLink:!!s?.canLink,canPickFolder:!!t.canPickFolder,where:on(),lookOpen:o.look},se)}function b(){m()?e.render({title:a,body:y()}):C()}let x=()=>{},S=()=>{},C=()=>{x(),S()};function w(e){Object.assign(o,e),b()}async function T(e){w({busy:!0,line:null,menu:null});let t;try{t=await e()}catch(e){t={text:e instanceof Error?e.message:String(e),kind:`bad`}}return m()&&w({busy:!1,line:t}),t}function E(e){let t=g(e);t&&(w({selected:e,name:t.name,menu:null,line:null}),v(`#${Pn(e)}`)?.scrollIntoView?.({block:`nearest`}))}function D(n){let i=g(n);i&&(r?(e.close(),c()?s.open(i):t.open(i)):i.pinned||(w({selected:n,name:i.name}),O()))}function O(){if(o.busy||o.ask||!c()&&t.loading()||!u())return;let e=t.cleanName(o.name);if(!e){w({line:{text:`Type a name for the ${i.one}.`,kind:`bad`}});return}let n=h.find(t=>f(t.name,e));if(r){n?D(n.id):w({line:{text:`There's no ${i.one} named "${e}" in ${d()}.`,kind:`bad`}});return}let a=l().filter(e=>!c()||e.kind===t.saveKind);a.some(t=>f(t.name,e))?A({kind:`replace`,name:e,alt:t.freeName(e,a)}):k(e,!1)}async function k(n,r){await T(()=>c()?s.save(n,r):t.save(n,r))===null&&m()&&e.close()}function A(e){w({ask:e,menu:null}),v(e.alt?`[data-fd-ask="alt"]`:`[data-fd-ask="no"]`)?.focus(),t.asked?.(e.kind)}function j(e){let n=o.ask;if(w({ask:null}),e===`no`||!n)ie(n);else if(n.kind===`replace`)e===`alt`&&n.alt?k(n.alt,!1):k(n.name,!0);else{let e=_(o.selected);e&&T(()=>t.remove(e.id))}}function M(){let e=_(o.selected);if(!e||o.busy||c())return;w({renaming:e.id,menu:null,line:null});let t=v(`.fd-rename`);t?.focus(),t?.select()}function N(e){let n=o.renaming;if(n===null)return;w({renaming:null}),F();let r=g(n);e!==null&&r&&t.cleanName(e)!==r.name&&T(()=>t.rename(n,e)).then(n=>{n===null&&m()&&w({name:t.cleanName(e)})})}function ee(){let e=_(o.selected);e&&!o.busy&&!c()&&A({kind:`delete`,name:e.name})}function te(){let e=_(o.selected);e&&!c()&&(qn=e.id,w({line:{text:`Copied "${e.name}". Paste makes a copy of it here.`,kind:`info`},menu:null}))}function ne(){let e=qn;e===null||o.busy||c()||(t.files().some(t=>t.id===e)?T(()=>t.duplicate(e)):(qn=null,w({line:{text:`The ${i.one} you copied has been deleted.`,kind:`bad`}})))}function re(){let e=_(o.selected);e&&!o.busy&&T(()=>c()?s.duplicate(e.id):t.duplicate(e.id))}function P(){let n=_(o.selected);if(n?.kind!==t.saveKind||c()||!t.versions)return;let{selected:r,name:i,filter:a,sort:s,place:l}=o,u=v(`.fd-rows`)?.scrollTop??0;t.versions(n.id,()=>Yn(e,t,{selected:r,name:i,filter:a,sort:s,place:l,scroll:u}))}function F(){v(`.fd-rows`)?.focus()}function ie(e){e?.kind===`replace`?v(`#fd-name`)?.focus():F()}function ae(e){let t=h.findIndex(e=>e.id===o.selected),n=t=>{e.preventDefault();let n=h[Math.max(0,Math.min(h.length-1,t))];n&&E(n.id)},r=e.ctrlKey||e.metaKey;if(e.key===`ArrowDown`)n(t+1);else if(e.key===`ArrowUp`)n(t<0?0:t-1);else if(e.key===`Home`)n(0);else if(e.key===`End`)n(h.length-1);else if(e.key===`Enter`&&o.selected)e.preventDefault(),D(o.selected);else if(e.key===`F2`)e.preventDefault(),M();else if(e.key===`Delete`)e.preventDefault(),ee();else if(r&&e.key.toLowerCase()===`c`)e.preventDefault(),te();else if(r&&e.key.toLowerCase()===`v`)e.preventDefault(),ne();else if((e.key===`ContextMenu`||e.shiftKey&&e.key===`F10`)&&o.selected){e.preventDefault();let t=v(`#${Pn(o.selected)}`)?.getBoundingClientRect();L(o.selected,t?t.left+24:0,t?t.bottom:0),se.press.key()}}function I(e){if(e.key===`Tab`&&o.ask){e.preventDefault();let t=[...p?.querySelectorAll(`.fd-ask .btn`)??[]];t[(t.indexOf(document.activeElement)+(e.shiftKey?t.length-1:1))%t.length]?.focus();return}if(e.key!==`Escape`||!(o.menu||o.ask||o.look))return;e.preventDefault(),e.stopPropagation();let t=o.ask,n=o.look&&!t;w({menu:null,ask:null,look:!1}),n?v(`.fd-look`)?.focus():ie(t)}function L(e,t,n){let r=(v(`.fd`)??p)?.getBoundingClientRect();if(!r)return;w({selected:e,name:g(e)?.name??o.name,menu:{id:e,x:t-r.left,y:n-r.top}});let i=v(`.fd-menu`);if(i){let a=(e,t,n)=>Math.max(0,Math.min(e,n-t)),s={id:e,x:a(t-r.left,i.offsetWidth,r.width),y:a(n-r.top,i.offsetHeight,r.height)};(s.x!==o.menu?.x||s.y!==o.menu?.y)&&w({menu:s})}v(`.fd-menu .mb-item`)?.focus()}function oe(e,n){T(()=>t.add(e,n)).then(()=>w({place:`local`}))}let se={select:E,activate:D,name:e=>{let t=g(o.selected);w({name:e,selected:t&&t.name===e?t.id:null,line:null})},filter:e=>w({filter:e}),sort:e=>w({sort:{key:e,down:o.sort.key===e?!o.sort.down:e===`modified`}}),primary:O,cancel:()=>e.close(),rename:M,renameDone:N,copy:te,paste:ne,duplicate:re,remove:ee,versions:P,answer:j,openMenu:L,press:ln(L,e=>t.menuOpened?.(e)),closeMenu:()=>{(o.menu||o.look)&&w({menu:null,look:!1})},listKey:ae,windowKey:I,drag:{enter:e=>{Jn(e)&&(e.preventDefault(),o.dropping||w({dropping:!0}))},over:e=>{Jn(e)&&(e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect=`copy`))},leave:e=>{let t=e.relatedTarget;o.dropping&&!(t instanceof Node&&e.currentTarget.contains(t))&&w({dropping:!1})},drop:e=>{if(!Jn(e))return;e.preventDefault(),e.stopPropagation(),w({dropping:!1});let t=Array.from(e.dataTransfer?.files??[]);t.length>0&&oe(t,`drop`)}},fromComputer:()=>{e.close(),t.fromComputer()},downloadKept:()=>{e.close(),t.downloadKept?.()},fromFolder:()=>v(`.fd-folder-input`)?.click(),folderPicked:e=>{if(!m())return;let n=e.filter(e=>t.folderFile(e.name));n.length===0?w({line:{text:i.noneInFolder,kind:`bad`}}):oe(n,`folder`)},allow:()=>void T(()=>s.allow()),places:sn({state:()=>o,set:w,linked:s,run:T,find:e=>[...p?.querySelectorAll(e)??[]],focusList:F,remember:an})};if(p=e.open({title:a,body:y()},{displaceable:r}),x=t.onChange(b),S=s?.onChange(b)??(()=>{}),c()&&s.refresh().catch(()=>{}),n){let e=v(`.fd-rows`);e&&(e.scrollTop=n.scroll),F()}else if(r)F();else{let e=v(`#fd-name`);e?.focus(),e?.select()}}function Xn(e,t=Date.now()){let n=new Date(e),r=n.toLocaleTimeString(void 0,{hour:`numeric`,minute:`2-digit`}),i=new Date(t),a=(e,t)=>e.toDateString()===t.toDateString();return a(n,i)?`Today, ${r}`:(i.setDate(i.getDate()-1),a(n,i)?`Yesterday, ${r}`:`${n.toLocaleDateString(void 0,{month:`short`,day:`numeric`})}, ${r}`)}var Zn=`Previous Versions`;function Qn(e,t){let n={selected:t.versions[0]?.key??null,busy:!1,line:null},r=()=>t.versions.find(e=>e.key===n.selected)??null,i=()=>{n.busy||(t.back?t.back():e.close())};async function a(e){if(!e||n.busy)return;n.busy=!0,l();let r=await t.open(e);n.busy=!1,r&&(n.line=r,l())}let o={select:e=>{n.selected=e,l()},open:a,cancel:i,picked:r},s=()=>$n(t,n,o),c=e.open({title:Zn,body:s()});function l(){c.isConnected&&e.render({title:Zn,body:s()})}let u=e.dialog;u.oncancel=t=>{if(!t.cancelable)return e.close();t.preventDefault(),i()},u.onclick=e=>{e.target===u&&i()},c.querySelector(`.pv-row.selected`)?.focus()}function $n(e,t,n){let r=e.versions.map(r=>O`<button type="button" role="option" aria-selected=${r.key===t.selected?`true`:`false`}
      class=${me({"fd-row":!0,"pv-row":!0,selected:r.key===t.selected})}
      @click=${()=>n.select(r.key)} @dblclick=${()=>n.open(r)}>
      ${vn(e.mark)}
      <span class="fd-cell">${Xn(r.at)}</span>
      <span class="fd-cell pv-how">${r.how}</span>
      <span class="fd-cell fd-size-cell">${An(r.size)}</span>
    </button>`);return O`<div class="pv">
    <p class="pv-intro">${e.intro}</p>
    <div class="fd-list well">
      <div class="fd-rows pv-rows" role="listbox" aria-label="Previous versions of ${e.name}">
        ${r.length>0?r:O`<div class="fd-empty">${e.empty}</div>`}
      </div>
    </div>
    ${t.line?O`<p class=${`fd-line fd-line-${t.line.kind}`} role="alert">${t.line.text}</p>`:w}
    <div class="pv-buttons">
      <button type="button" class="btn primary" ?disabled=${!n.picked()||t.busy} @click=${()=>n.open(n.picked())}>Open</button>
      <button type="button" class="btn" @click=${n.cancel}>Cancel</button>
    </div>
  </div>`}var er={one:`tower`,many:`towers`,home:`My Towers`,homeWhere:`in this browser`,all:`All towers`,noneInFolder:`There are no tower files (.vctower or .TDT) in that folder.`,mirror:`Keep a copy of my towers here too`,kept:`An autosave this version couldn't read is kept.`},tr=[{id:`auto`,label:`Auto-save`,mark:_n},{id:`tower`,label:`Tower`,filter:`Tower (*.vctower)`,mark:hn},{id:`tdt`,label:`SimTower 1994`,filter:`SimTower 1994 (*.TDT)`,mark:gn}],nr=60,K=new Date(2026,10,20,15,30).getTime(),q=36e5,rr=()=>[{id:`1`,name:`Harbor Point`,kind:`tower`,size:49152,modified:K-2*q},{id:`2`,name:`Skyline Plaza`,kind:`tower`,size:217088,modified:K-26*q},{id:`3`,name:`Garden Court`,kind:`tower`,size:9216,modified:K-72*q},{id:`4`,name:`OLDTOWER`,kind:`tdt`,size:31744,modified:K-900*q}],ir=e=>e.replace(/[/\\:*?"<>|]/g,``).replace(/\s+/g,` `).trim().slice(0,nr),ar=(e,t)=>e.toLocaleLowerCase()===t.toLocaleLowerCase();function or(){let e=null,t=rr(),n=10,r=new Set,i=()=>r.forEach(e=>e()),a=t=>{t instanceof HTMLDialogElement&&!e&&(e=new U(t,{gameStopped:()=>!1,toast:()=>void 0}))},o=(e,t)=>{for(let n=1;;n++){let r=n===1?e:`${e} (${n})`;if(!t.some(e=>ar(e.name,r)))return r}},s=(e,r=`tower`)=>(t=[...t.filter(t=>!ar(t.name,e)),{id:String(n++),name:e,kind:r,size:40960,modified:K}],i(),null),c=e=>[{key:`a`,at:K-q,size:48128,how:`Saved by you`},{key:`b`,at:K-3*q,size:46080,how:`Autosaved`},{key:`c`,at:K-30*q,size:40960,how:e===`Harbor Point`?`Original`:`Autosaved`}],l=(n,r)=>{let i=t.find(e=>e.id===n);e&&i&&Qn(e,{name:i.name,versions:c(i.name),mark:hn,intro:`Earlier versions of "${i.name}". Open one to make it a new tower file beside this one; the tower itself doesn't change.`,empty:`No earlier versions yet.`,open:async n=>(s(o(`${i.name} (${n.how})`,t)),e?.close(),null),back:r})},u=e=>({mode:e,words:er,kinds:tr,saveKind:`tower`,nameMax:nr,cleanName:ir,freeName:o,folderFile:e=>/\.(vctower|tdt)$/i.test(e),initialName:e===`saveAs`?`Harbor Point`:``,pinned:()=>e===`open`?{id:`auto`,name:`Auto-save (Harbor Point)`,kind:`auto`,pinned:!0,size:48128,modified:K}:null,files:()=>t,usage:()=>({count:t.length,bytes:t.reduce((e,t)=>e+t.size,0)}),loading:()=>!1,onChange:e=>(r.add(e),()=>r.delete(e)),open:()=>void 0,save:async e=>s(e),rename:async(e,n)=>{let r=ir(n);return t.some(t=>t.id!==e&&ar(t.name,r))?{text:`There's already a tower named "${r}".`,kind:`bad`}:(t=t.map(t=>t.id===e?{...t,name:r}:t),i(),null)},duplicate:async e=>{let n=t.find(t=>t.id===e);return n?s(o(`Copy of ${n.name}`,t),n.kind):null},remove:async e=>(t=t.filter(t=>t.id!==e),i(),null),versions:l,add:async()=>({text:`This sample folder keeps no files.`,kind:`info`}),fromComputer:()=>void 0,downloadKept:null}),d=t=>{e&&Yn(e,u(t))},f=()=>({canLink:!0,state:()=>({name:`Towers`,access:`prompt`}),files:()=>[],usage:()=>({count:0,bytes:0}),onChange:()=>()=>{},refresh:async()=>{},link:async()=>`cancel`,allow:async()=>({text:`This sample folder can't be opened.`,kind:`info`}),unlink:async()=>null,mirror:()=>!1,setMirror:async()=>null,open:()=>void 0,save:async()=>null,duplicate:async()=>null});return O`<div class="g-row">
      <button type="button" class="btn" @click=${()=>d(`open`)}>Open…</button>
      <button type="button" class="btn" @click=${()=>d(`saveAs`)}>Save As…</button>
      <button type="button" class="btn" @click=${()=>l(`1`)}>Previous Versions…</button>
      <button type="button" class="btn" @click=${()=>{e&&Yn(e,{...u(`open`),linked:f(),startIn:`linked`})}}>Open a linked folder…</button>
      <button type="button" class="btn" @click=${()=>{t=rr(),i()}}>Put the sample folder back</button>
    </div>
    <dialog id="modal" ${j(a)}></dialog>`}var sr=[`Goal`,`Better`,`Best`];function cr(e){return e.locked===null?e.best===0?`Not finished yet`:`Best result: ${sr[e.best-1]}`:`Locked`}function lr(e){let t=e.best===0?`Not won yet`:sr[e.best-1];return O`<span class="scn-trophies" role="img" aria-label=${cr(e)}
    ><span class="scn-trophy-row" aria-hidden="true"
      >${sr.map((t,n)=>O`<span class=${e.best>n?`scn-trophy on`:`scn-trophy`} title=${t}
            >${E(`trophy`,{size:16})}</span
          >`)}</span
    ><span class="scn-trophy-word" aria-hidden="true">${t}</span></span
  >`}function ur(e){return O`<table class="scn-goals">
    <thead>
      <tr>
        <th scope="col"><span class="scn-hidden">Goal</span></th>
        ${sr.map(e=>O`<th scope="col">${e}</th>`)}
      </tr>
    </thead>
    <tbody>
      ${e.map(e=>O`<tr>
            <th scope="row">${e.label}</th>
            ${sr.map((t,n)=>{let r=e.marks[n];return r?O`<td class=${r.earned?`earned`:w}>
                <span class="scn-tick" aria-hidden="true">${r.earned?`✓`:``}</span>${r.text}${r.earned?O`<span class="scn-hidden"> (reached)</span>`:w}
              </td>`:O`<td></td>`})}
          </tr>`)}
    </tbody>
  </table>`}function dr(e){return O`<div class="scn-details">
    <h3 class="scn-h">${e.title}</h3>
    <dl class="scn-facts">
      ${e.facts.map(e=>O`<dt>${e.label}</dt><dd>${e.value}</dd>`)}
      <dt>Result</dt>
      <dd>${e.locked===null?lr(e):`Locked`}</dd>
    </dl>
    ${e.locked===null?O`<fieldset class="scn-group">
            <legend>Situation</legend>
            <p>${e.brief}</p>
          </fieldset>
          <fieldset class="scn-group">
            <legend>Goals</legend>
            ${ur(e.goals)}
          </fieldset>`:O`<p class="scn-lock">${e.locked}</p>`}
  </div>`}function fr(e,t,n){let r=e.locked!==null;return O`<li class=${r?`scn-row locked`:`scn-row`}>
    <span class="scn-num" aria-hidden="true">${t}</span>
    <div class="scn-main">
      <div class="scn-head">
        <b class="scn-title">${e.title}</b>
        <span class="scn-meta">${e.facts.map(e=>e.value).join(` · `)}</span>
      </div>
      <p class="scn-brief">${r?e.locked:e.brief}</p>
    </div>
    <div class="scn-side">
      ${r?O`<span class="scn-locked">Locked</span>`:O`${lr(e)}<button
              type="button"
              class="btn primary"
              aria-label=${`Play ${e.title}`}
              @click=${()=>n.play(e.id)}
            >
              Play
            </button>`}
    </div>
  </li>`}function pr(e,t){return O`<ol class="scn-rows well">
    ${e.map((e,n)=>fr(e,n+1,t))}
  </ol>`}function mr(e,t){return O`<section class="win scn-launch" aria-labelledby="scn-launch-title">
    <div class="win-title">
      ${e.icon?E(e.icon,{size:16}):w}<span id="scn-launch-title">${e.title}</span>
    </div>
    <div class="scn-launch-body">
      <h2 class="scn-launch-h">${e.heading}</h2>
      ${pr(e.entries,t)}
      ${e.foot?O`<div class="scn-foot">${e.foot}</div>`:w}
    </div>
  </section>`}var hr=e=>`scn-opt-${e}`;function gr(e){if(e.lead?.some(t=>t.id===e.picked))return!0;let t=e.entries.find(t=>t.id===e.picked);return t!==void 0&&t.locked===null}function _r(e){return[...(e.lead??[]).map(e=>e.id),...e.entries.map(e=>e.id)]}function vr(e,t){let n=_r(e);if(n.length===0)return null;let r=n.indexOf(e.picked);switch(t){case`ArrowDown`:return r<0?n[0]:n[Math.min(n.length-1,r+1)];case`ArrowUp`:return r<0?n[0]:n[Math.max(0,r-1)];case`Home`:return n[0];case`End`:return n[n.length-1];default:return null}}var yr=e=>e?.scrollIntoView?.({block:`nearest`}),br=()=>{};function xr(e,t,n,r,i,a){return O`<li
    id=${hr(e)}
    class=${r?`scn-option selected`:`scn-option`}
    role="option"
    aria-selected=${r?`true`:`false`}
    ${j(r?yr:br)}
    @click=${()=>a.pick(e)}
    @dblclick=${()=>{a.pick(e),i&&a.play()}}
  >
    <span class="scn-option-name">${t}</span>${n}
  </li>`}function Sr(e,t){let n=gr(e),r=e.lead??[],i=r.find(t=>t.id===e.picked),a=e.entries.find(t=>t.id===e.picked),o=w;i?o=O`<div class="scn-details"><h3 class="scn-h">${i.title}</h3>${i.details}</div>`:a&&(o=dr(a));let s=r=>{if(r.key===`Enter`){r.preventDefault(),n&&t.play();return}let i=vr(e,r.key);i!==null&&(r.preventDefault(),i!==e.picked&&t.pick(i))},c=_r(e).includes(e.picked)?hr(e.picked):w;return{title:O`${E(e.icon??`folder`,{size:16})}${e.title??`New Scenario`}`,body:O`<div class="scn-dialog">
        <ul
          class="scn-listbox well"
          role="listbox"
          aria-label="Scenarios"
          tabindex="0"
          aria-activedescendant=${c}
          @keydown=${s}
        >
          ${r.map(n=>xr(n.id,n.title,O`<span class="scn-note">${n.note}</span>`,n.id===e.picked,!0,t))}
          ${e.entries.map(n=>xr(n.id,n.title,n.locked===null?lr(n):O`<span class="scn-note">Locked</span>`,n.id===e.picked,n.locked===null,t))}
        </ul>
        <div class="scn-pane">${o}</div>
      </div>
      <div class="modal-actions modal-footer">
        <button type="button" class="btn primary" data-act="play" ?disabled=${!n} @click=${t.play}>
          Play
        </button>
        <button type="button" class="btn" data-act="cancel" @click=${t.cancel}>Cancel</button>
      </div>`}}var Cr=.1,J={sky:`#0b1030`,skyLow:`#141a44`,ground:`#06081a`,star:`#e6dcc0`,faintStar:`#3a4266`,moon:`#f3eacb`,darkRoom:`#1b2238`,slab:`#2a3150`,shaft:`#262b40`,car:`#c0c0c0`,carDoor:`#9a9a9a`,carInside:`#2a2f45`,amber:`#ffc94a`},Y={office:`#bfe0ff`,home:`#ffc94a`,hotel:`#ff9a6a`,shop:`#7cff6a`,lobby:`#e6dcc0`},wr=[Y.office,Y.home,Y.hotel,Y.home,Y.office,Y.shop];function X(e,t,n){return t+Math.floor(e()*(n-t+1))}function Z(e,t){return t[Math.floor(e()*t.length)]??t[0]}var Tr=3;function Er(e,t,n,r=window){let i=e.getContext(`2d`);if(!i)return()=>{};if(i.imageSmoothingEnabled=!1,n){for(let e=0;e<Tr;e+=1/30)t.step(1/30);return t.draw(i),()=>{}}t.draw(i);let a=-1,o=0,s=0,c=n=>{if(!e.isConnected)return;s=r.requestAnimationFrame(c);let l=a<0?0:(n-a)/1e3;a=n,o+=l,o<1/30||(t.step(Math.min(Cr,o)),o=0,t.draw(i))};return s=r.requestAnimationFrame(c),()=>r.cancelAnimationFrame(s)}function Dr(e,t){e.width=Math.max(1,Math.ceil(t.innerWidth/4)),e.height=Math.max(1,Math.ceil(t.innerHeight/4))}function Or(e,t=document){let n=t.defaultView??window,r=()=>n.performance.now(),i=r(),a=t.activeElement instanceof HTMLElement?t.activeElement:null,o=A(t,O`<div id="screensaver" role="dialog" aria-modal="true" aria-label="Screen saver" tabindex="-1">
      <canvas aria-hidden="true"></canvas>
      <p class="screensaver-hint" role="status">${e.hint??`Screen saver. Press any key or move the mouse to go back.`}</p>
    </div>`).elements[0],s=o.querySelector(`canvas`);t.body.appendChild(o),o.focus({preventScroll:!0});let c=()=>{},l=()=>{c(),Dr(s,n),c=Er(s,e.makeScene(s.width,s.height),e.still,n)};l();let u=!1,d=null,f={capture:!0,passive:!1},p=e=>{e.preventDefault(),e.stopImmediatePropagation()},m=()=>{if(u)return;u=!0,c();for(let e of kr)n.removeEventListener(e,h,f);n.removeEventListener(`pointermove`,g,f),n.removeEventListener(`resize`,l),o.remove();let t=r()+600,s=e=>{r()<t&&p(e)};for(let e of Ar)n.addEventListener(e,s,f);n.setTimeout(()=>{for(let e of Ar)n.removeEventListener(e,s,f)},600),a?.focus({preventScroll:!0}),e.onEnd(r()-i)},h=e=>{p(e),r()-i>=400&&m()},g=e=>{let t=e;t.pointerType!==`touch`&&(d?Math.hypot(t.clientX-d.x,t.clientY-d.y)>8&&r()-i>=400&&m():d={x:t.clientX,y:t.clientY})};for(let e of kr)n.addEventListener(e,h,f);return n.addEventListener(`pointermove`,g,f),n.addEventListener(`resize`,l),m}var kr=[`keydown`,`pointerdown`,`mousedown`,`touchstart`,`wheel`,`click`,`contextmenu`],Ar=[`click`,`keyup`,`keypress`,`pointerup`,`mouseup`,`touchend`,`contextmenu`];function jr(e,t,n){let r=e>0?e:n.innerWidth,i=t>0?t:n.innerHeight;return{w:Math.max(1,Math.ceil(r/4)),h:Math.max(1,Math.ceil(i/4))}}function Mr(e,t,n=window){let r=()=>{},i=0,a=()=>{r();let{w:i,h:a}=jr(e.clientWidth,e.clientHeight,n);e.width=i,e.height=a,r=Er(e,t.makeScene(i,a),t.still,n)},o=()=>{r(),n.cancelAnimationFrame(i),i=0,n.removeEventListener(`resize`,c)},s=()=>{i=0,e.isConnected?a():o()};function c(){if(!e.isConnected)return o();i===0&&(i=n.requestAnimationFrame(s))}return e.isConnected?a():i=n.requestAnimationFrame(s),n.addEventListener(`resize`,c),o}var Nr=[`night`,`stars`,`express`,`endless`,`marquee`],Pr={night:`Night Shift`,stars:`Skyline Starfield`,express:`Express Elevators`,endless:`Endless Tower`,marquee:`Bulletin Marquee`},Fr=`none`,Ir=[1,3,5,10,15];function Lr(e){return{saver:`night`,waitMinutes:5,onReturn:!e}}var Rr={waitCaption:`minutes`,note:`Any key, click or tap, or moving the mouse, ends it, and that input goes nowhere else.`};function zr(e,t,n={}){let r={...Rr,...n},i=e.saver===Fr;return O`
    <div class="saver-monitor" aria-hidden="true">
      <div class="saver-bezel"><canvas class="saver-screen" width=${88} height=${66}></canvas></div>
      <div class="saver-stand"></div>
    </div>
    <fieldset class="saver-group">
      <legend>Screen saver</legend>
      <div class="saver-row">
        <select
          id="saver-pick"
          aria-label="Screen saver"
          @change=${e=>t.onPick(e.target.value)}
        >
          <option value=${Fr} .selected=${i}>(None)</option>
          ${Nr.map(t=>O`<option value=${t} .selected=${e.saver===t}>${Pr[t]}</option>`)}
        </select>
        <button type="button" class="btn" data-saver="preview" ?disabled=${i} @click=${t.onPreview}>
          Preview
        </button>
      </div>
      <div class="saver-row">
        <label for="saver-wait">Wait:</label>
        <select
          id="saver-wait"
          ?disabled=${i}
          @change=${e=>t.onWait(Number(e.target.value))}
        >
          ${Ir.map(t=>O`<option value=${t} .selected=${e.waitMinutes===t}>${t}</option>`)}
        </select>
        <span>${r.waitCaption}</span>
      </div>
      <label class="saver-check">
        <input
          type="checkbox"
          id="saver-return"
          ?disabled=${i}
          .checked=${e.onReturn}
          @change=${e=>t.onReturn(e.target.checked)}
        />
        Also when I come back to this tab after that long
      </label>
    </fieldset>
    <p class="saver-note">${r.note}</p>
    ${Ot([{label:`OK`,primary:!0,act:`ok`,onPress:t.onOk},{label:`Cancel`,act:`cancel`,onPress:t.onCancel}])}
  `}function Br(e,t,n){return{title:`Screen Saver`,body:zr(e,t,n)}}function Vr(e,t,n,r={}){let i={...t},a=()=>{},o=null,s=()=>{a(),a=()=>{};let e=o?.querySelector(`.saver-screen`);if(e){if(i.saver===`none`){let t=e.getContext(`2d`);t&&(t.fillStyle=`#000`,t.fillRect(0,0,88,66))}else a=Er(e,n.makeScene(i.saver,88,66),n.still())}},c=()=>{a(),e.close()},l={onPick:t=>{i.saver=t,e.render(Br(i,l,r)),s()},onWait:e=>{i.waitMinutes=e},onReturn:e=>{i.onReturn=e},onPreview:()=>{if(i.saver===`none`)return;let t=i.saver;c(),n.preview(t,()=>Vr(e,i,n,r))},onOk:()=>{n.save({...i}),c()},onCancel:c};o=e.open(Br(i,l,r),{displaceable:!0});let u=o.querySelector(`#saver-pick`),d=o.querySelector(`#saver-wait`);u&&(u.value=i.saver),d&&(d.value=String(i.waitMinutes)),s()}function Hr(e,t,n=Math.random){let r=e/2,i=t/2,a=Math.max(40,Math.floor(e*t/40)),o=e=>({x:n()*2-1,y:n()*2-1,z:e?.6+n()*.4:.05+n()*.95,color:Z(n,wr)}),s=Array.from({length:a},()=>o(!1));return{step(n){for(let a=0;a<s.length;a++){let c=s[a];c.z-=n*.22;let l=r+c.x/c.z*r,u=i+c.y/c.z*i;(c.z<=.03||l<-4||l>e+4||u<-4||u>t+4)&&(s[a]=o(!0))}},draw(n){n.fillStyle=J.sky,n.fillRect(0,0,e,t);for(let e of s){let t=Math.round(r+e.x/e.z*r),a=Math.round(i+e.y/e.z*i),o=Math.max(1,Math.round((1-e.z)*4));n.globalAlpha=Math.min(1,(1-e.z)*1.6),o>2?(n.fillStyle=J.faintStar,n.fillRect(t,a,o+1,o),n.fillStyle=e.color,n.fillRect(t+1,a+1,o-1,o-2)):(n.fillStyle=e.color,n.fillRect(t,a,o+ +(o>1),o))}n.globalAlpha=1}}}var Ur=[`#ffc94a`,`#ff9a6a`,`#bfe0ff`,`#7cff6a`,`#ff6ad5`];function Wr(e,t,n=Math.random){let r=Math.max(5,Math.floor(e*t/700)),i=r=>{let i=Z(n,[1,1,2,2,3]);return{x:r?n()*(e+20):e*.3+n()*(e*.7+30),y:r?n()*(t+20)-20:-30+n()*22,scale:i,speed:5+i*4,door:0,doorDir:0,wait:1+n()*4,rider:Z(n,Ur)}},a=Array.from({length:r},()=>i(!0)).sort((e,t)=>e.scale-t.scale),o=Array.from({length:Math.floor(e*t/120)},()=>({x:X(n,0,e-1),y:X(n,0,t-1)}));return{step(e){for(let r=0;r<a.length;r++){let o=a[r];o.x-=o.speed*e,o.y+=o.speed*e*.55,o.doorDir===0?(o.wait-=e,o.wait<=0&&(o.doorDir=1)):(o.door+=o.doorDir*e*1.2,o.door>=1?(o.door=1,o.doorDir=-1):o.door<=0&&(o.door=0,o.doorDir=0,o.wait=2+n()*4)),(o.x<-8*o.scale||o.y>t+12*o.scale)&&(a[r]=i(!1),a[r].scale=o.scale,a[r].speed=o.speed)}},draw(n){n.fillStyle=J.sky,n.fillRect(0,0,e,t),n.fillStyle=J.faintStar;for(let e of o)n.fillRect(e.x,e.y,1,1);for(let e of a)Gr(n,e)}}}function Gr(e,t){let n=t.scale,r=Math.round(t.x),i=Math.round(t.y),a=5*n,o=7*n;e.fillStyle=`#0a0a0a`,e.fillRect(r-1,i-1,a+2,o+2),e.fillStyle=J.car,e.fillRect(r,i,a,o),e.fillStyle=J.amber,e.fillRect(r+Math.floor(a/2)-n,i+n,2*n,n);let s=r+n,c=i+2*n,l=a-2*n,u=o-3*n;e.fillStyle=J.carInside,e.fillRect(s,c,l,u),e.fillStyle=t.rider,e.fillRect(s+Math.floor(l/2)-Math.ceil(n/2),c+n,n,n),e.fillRect(s+Math.floor(l/2)-n,c+2*n,2*n,u-2*n);let d=l/2,f=Math.round(d*t.door);e.fillStyle=J.carDoor,e.fillRect(s,c,Math.ceil(d)-f,u),e.fillRect(s+Math.floor(d)+f,c,Math.ceil(d)-f,u)}var Kr=[`#ffc94a`,`#50e0ff`,`#7cff6a`,`#ff6ad5`,`#e6dcc0`];function qr(e,t,n,r=Math.random){let i=n.length>0?n:[`Verticopolis`],a=Math.max(7,Math.round(t*.16)),o=`bold ${a}px Tahoma, Verdana, sans-serif`,s=0,c=Math.round(e*.15),l=X(r,a+2,Math.max(a+2,t-4)),u=-1;return{step(n){c-=n*Math.max(16,e*.22),u>=0&&c<-u-4&&(s=(s+1)%i.length,c=e,l=X(r,a+2,Math.max(a+2,t-4)),u=-1)},draw(n){n.fillStyle=`#000`,n.fillRect(0,0,e,t),n.font=o,u<0&&(u=n.measureText(i[s]).width),n.fillStyle=Kr[s%Kr.length],n.fillText(i[s],Math.round(c),l)}}}function Jr(e,t,n){let r=1/0,i=-1/0,a=1/0,o=-1/0;for(let t of e.structure)r=Math.min(r,t.x),i=Math.max(i,t.x+t.width),a=Math.min(a,t.floor),o=Math.max(o,t.floor);let s=n-3,c=o-a+1,l=Math.max(1,Math.min(4,Math.floor(n*.8/c))),u=Math.min(2,t*.86/Math.max(1,i-r)),d=Math.floor((t-(i-r)*u)/2);return{ground:s,rowH:l,px:e=>d+Math.floor((e-r)*u),span:(e,t)=>Math.max(1,Math.floor((e-r+t)*u)-Math.floor((e-r)*u)),py:e=>s-(e-a+1)*l}}function Yr(e){let t=X(e,30,60),n=[],r=[],i=0,a=X(e,60,90);for(let o=0;o<t;o++){o>2&&e()<.12&&a-i>20&&(e()<.5?i+=X(e,3,8):a-=X(e,3,8)),n.push({floor:o,x:i,width:a-i});for(let t=i;t<a;){let n=Math.min(a-t,X(e,3,9));r.push({floor:o,x:t,width:n,color:o===0?Y.lobby:Z(e,wr),lit:o===0||e()<.55}),t+=n+1}}let o=Math.floor(a/2);return{structure:n,rooms:r,shafts:[{x:o-12,width:4,bottom:0,top:t-1},{x:o+10,width:4,bottom:0,top:Math.floor(t*.6)}]}}function Xr(e,t,n,r=Math.random,i=()=>null){let a=n&&n.rooms.length>0?n:Yr(r),o=Jr(a,e,t),s=o.rowH>1?o.rowH-1:1,c=a.rooms.map(e=>({x:o.px(e.x),y:o.py(e.floor),w:o.span(e.x,e.width),h:s,color:e.color,lit:e.lit})),l=a.shafts.map(e=>{let t=o.py(e.bottom),n=o.py(e.top);return{x:o.px(e.x),w:Math.max(1,o.span(e.x,e.width)),bottom:t,top:n,pos:t,target:n+Math.floor(r()*(t-n+1)),wait:r()*2}}),u=Array.from({length:Math.floor(e*t/90)},()=>({x:X(r,0,e-1),y:X(r,0,Math.floor(t*.75)),phase:r()*6.28,rate:.3+r()*.6})),d=i();d&&(d.canvas.width=e,d.canvas.height=t);let f=(e,t)=>{e.fillStyle=t.lit?t.color:J.darkRoom,e.fillRect(t.x,t.y,t.w,t.h)},p=n=>{n.clearRect(0,0,e,t),n.fillStyle=J.slab;for(let e of a.structure)n.fillRect(o.px(e.x),o.py(e.floor),o.span(e.x,e.width),o.rowH);for(let e of c)f(n,e);n.fillStyle=J.shaft;for(let e of l)n.fillRect(e.x,e.top,e.w,e.bottom-e.top+o.rowH)};d&&p(d);let m=Math.max(1,Math.min(60,c.length/30)),h=0,g=0,_=null;return{step(e){for(h+=e,g+=e*m;g>=1&&c.length>0;){--g;let e=c[Math.floor(r()*c.length)];e.lit=!e.lit,d&&f(d,e)}for(let t of l){if(t.wait>0){t.wait-=e;continue}let n=t.target-t.pos,i=6*o.rowH*e;Math.abs(n)<=i?(t.pos=t.target,t.wait=.6+r()*1.6,t.target=t.top+Math.floor(r()*(t.bottom-t.top+1))):t.pos+=Math.sign(n)*i}},draw(n){_||(_=n.createLinearGradient(0,0,0,t),_.addColorStop(0,J.sky),_.addColorStop(1,J.skyLow)),n.fillStyle=_,n.fillRect(0,0,e,t),n.fillStyle=J.star;for(let e of u)n.globalAlpha=.45+.4*Math.sin(h*e.rate+e.phase),n.fillRect(e.x,e.y,1,1);n.globalAlpha=1;let r=Math.floor(h*1.5%(e+20)-10),i=Math.floor(t*.12);n.fillStyle=J.moon,n.fillRect(r,i,4,4),n.fillRect(r+1,i-1,2,6),n.fillRect(r-1,i+1,6,2),n.fillStyle=J.ground,n.fillRect(0,o.ground,e,t-o.ground),d?n.drawImage(d.canvas,0,0):p(n),n.fillStyle=J.car;for(let e of l)n.fillRect(e.x,Math.round(e.pos),e.w,s)}}}function Zr(e,t,n=Math.random,r=()=>null){let i=t-3,a=r();a&&(a.canvas.width=e,a.canvas.height=t);let o=(e,t)=>{e.fillStyle=J.slab,e.fillRect(t.l,t.y+3-1,t.r-t.l,1)},s=(e,t,n)=>{e.fillStyle=n.color,e.fillRect(n.x,t.y,n.w,2)},c=e=>{l.push(e),a&&o(a,e)},l=[],u=[],d=0,f=Y.lobby,p=0,m=0,h=0,g=()=>{let r=Math.max(18,Math.floor((.4+n()*.3)*e)),o=Math.floor(4+n()*Math.max(1,e-r-8));l=[],a?.clearRect(0,0,e,t),c({y:i-3,l:o,r:o+r,rooms:[]});let s=Math.max(1,Math.floor(r/22));u=Array.from({length:s},(e,t)=>o+Math.floor((t+1)*r/(s+1))),d=o,f=Y.lobby,p=0,m=0,h=0};g();let _=()=>l[l.length-1];return{step(e){if(p>0)p-=e,p<=0&&(m=1);else if(m>0)m-=e*.8,m<=0&&g();else for(h+=e*18;h>=1&&p<=0;){--h;let e=_();if(d>=e.r){let t=e.y-3;if(t<6){p=2.5;break}let{l:r,r:i}=e;l.length>2&&n()<.15&&i-r>12&&(n()<.5?r+=X(n,2,4):i-=X(n,2,4)),c({y:t,l:r,r:i,rooms:[]}),d=r,f=Z(n,wr);continue}let t=Math.min(e.r-d,X(n,2,6)),r={x:d,w:t,color:n()<.7?f:Z(n,wr)};e.rooms.push(r),a&&s(a,e,r),d+=t+1}},draw(n){if(n.fillStyle=J.sky,n.fillRect(0,0,e,t),n.fillStyle=J.ground,n.fillRect(0,i,e,t-i),a)n.drawImage(a.canvas,0,0);else for(let e of l){o(n,e);for(let t of e.rooms)s(n,e,t)}let r=_();n.fillStyle=J.shaft;for(let e of u)e>=r.l&&e<r.r&&n.fillRect(e,r.y,2,i-r.y);if(p<=0&&m<=0){let e=r.l+Math.floor((r.r-r.l)/2),t=Math.max(1,r.y-12);n.fillStyle=J.amber,n.fillRect(e,t,1,r.y-t),n.fillRect(e-10,t,22,1),n.fillStyle=J.star,n.fillRect(Math.max(e-10,Math.min(e+11,d)),t+1,1,Math.max(1,r.y-t-3))}m>0&&(n.globalAlpha=1-m,n.fillStyle=`#000`,n.fillRect(0,0,e,t),n.globalAlpha=1)}}}var Qr=[`Sample Tower`,`Population 1,234`,`Three stars`,`The hotel is full tonight`];function $r(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function ei(e,t,n,r=Math.random){switch(e){case`night`:return Xr(t,n,null,r);case`stars`:return Hr(t,n,r);case`express`:return Wr(t,n,r);case`endless`:return Zr(t,n,r);case`marquee`:return qr(t,n,Qr,r)}}var ti=88,ni=66;function ri(e){return O`<figure class="g-saver">
    <div class="saver-monitor" aria-hidden="true">
      <div class="saver-bezel">
        <canvas class="saver-screen" width=${ti} height=${ni} ${j(t=>{t instanceof HTMLCanvasElement&&Er(t,ei(e,ti,ni,$r(7)),!0)})}></canvas>
      </div>
      <div class="saver-stand"></div>
    </div>
    <figcaption><strong>${Pr[e]}</strong></figcaption>
  </figure>`}function ii(){return O`<div class="g-row">${Nr.map(ri)}</div>`}function ai(){let e=null,t=Lr(!1),n=()=>window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;return O`<div class="g-row">
      <button type="button" class="btn" @click=${()=>{e&&Vr(e,t,{makeScene:(e,t,n)=>ei(e,t,n),still:n,save:e=>{t=e},preview:(e,t)=>{Or({makeScene:(t,n)=>ei(e,t,n),still:n(),onEnd:t})}})}}>Screen Saver…</button>
    </div>
    <dialog id="modal" ${j(t=>{t instanceof HTMLDialogElement&&!e&&(e=new U(t,{gameStopped:()=>!1,toast:()=>void 0}))})}></dialog>`}var oi=(e,t)=>t.map((t,n)=>({text:t,earned:e>n})),si=[{id:`morning`,title:`Morning Crush`,facts:[{label:`Rules`,value:`Classic`},{label:`Length`,value:`6 days`}],brief:`Every office is rented and one elevator carries everyone. Bring the morning wait down before the week ends.`,best:2,locked:null,goals:[{label:`Load in the busiest hour`,marks:oi(2,[`At most 50%`,`At most 25%`,`At most 18%`])},{label:`Funds`,marks:oi(3,[`At least $1M`,`At least $1.5M`,`At least $2M`])}]},{id:`noon`,title:`Noon Rush`,facts:[{label:`Rules`,value:`Modern`},{label:`Length`,value:`4 days`}],brief:`A small tower with a food court and $300,000. Keep the lunch crowd moving.`,best:0,locked:null,goals:[{label:`Population`,marks:oi(0,[`At least 600`,`At least 900`,`At least 1,200`])}]},{id:`night`,title:`Night Line`,facts:[{label:`Rules`,value:`Modern`},{label:`Length`,value:`60 days`}],brief:`Three stations and a parking problem.`,best:0,locked:`Meet the Goal in Noon Rush to open it.`,goals:[]}];function ci(){let e=null,t=null,n=`Press Play, or open the dialog.`,r={lead:[{id:`sandbox`,title:`Sandbox`,note:`No goals`,details:O`<p>Every tool and no money limit. There is nothing to win.</p>`}],entries:si,picked:`morning`},i=e=>{n=e,c()},a=e=>[...r.lead??[],...si].find(t=>t.id===e)?.title??e,o={pick:t=>{r={...r,picked:t},e?.render(Sr(r,o))},play:()=>{e?.close(),i(`Play ${a(r.picked)}.`)},cancel:()=>e?.close()},s=()=>e?.open(Sr(r,o));function c(){t&&C(O`<div class="g-backdrop">
          <canvas class="scene-backdrop" aria-hidden="true" ${j(u)}></canvas>
          ${mr({title:`Sample Game`,icon:`brand`,heading:`Choose a scenario`,entries:si,foot:O`<span><b>Sandbox.</b> Every tool and no money limit.</span>
              <button type="button" class="btn" @click=${()=>i(`Sandbox pressed.`)}>New Sandbox</button>`},{play:e=>i(`Play ${a(e)}.`)})}
        </div>
        <div class="g-row">
          <button type="button" class="btn" @click=${s}>New Scenario…</button>
        </div>
        <p class="g-title-said" role="status">${n}</p>`,t)}let l=null,u=e=>{if(!(e instanceof HTMLCanvasElement)||e===l)return;l=e;let t=()=>document.createElement(`canvas`).getContext(`2d`);Mr(e,{makeScene:(e,n)=>Zr(e,n,$r(7),t),still:window.matchMedia(`(prefers-reduced-motion: reduce)`).matches})};return O`<div class="g-scenarios" ${j(e=>{e instanceof HTMLElement&&e!==t&&(t=e,c())})}></div>
    <dialog id="modal" ${j(t=>{t instanceof HTMLDialogElement&&!e&&(e=new U(t,{gameStopped:()=>!1,toast:()=>void 0}))})}></dialog>`}var li=[{icon:`display`,label:`Display`,hint:`Screen saver`},{icon:`appearance`,label:`Appearance`,hint:`Windows, menus and buttons`},{icon:`sounds`,label:`Sounds: On`,hint:`Sound on or off`},{icon:`settings`,label:`Settings`,hint:`Game settings`}],ui=`${`/`.replace(/\/?$/,`/`)}favicon.png`,di={display:`Display`,appearance:`Appearance`,sounds:`Sounds`,settings:`Settings`};function fi(){let e=`Press an icon.`,t=!0,n=null,r=()=>{n&&C(O`<span class="g-control-said" role="status">${e}</span>
          <button type="button" class="btn" ?disabled=${a.isOpen()} @click=${i}>
            Open Control Panel
          </button>`,n)},i=()=>{a.open(),e=`Opened.`,r()},a=new ge(document,{items:li,closeLabel:`Close Control Panel`,icon:ui,picked:n=>{n===`sounds`&&(t=!t,a.setLabel(`sounds`,`Sounds: ${t?`On`:`Off`}`)),e=`${di[n]} pressed.`,r()},closed:()=>{e=`Closed.`,r()}});return a.open(),O`<div class="g-control">${a.root}</div>
    <p class="g-control-line" ${j(e=>{e instanceof HTMLElement&&!n&&(n=e,r())})}></p>`}var pi=42,mi=300,hi=.05,Q=[`#ffc94a`,`#e6dcc0`,`#ff5050`,`#50e0ff`,`#ff6ad5`,`#7cff6a`];function gi(e,t){return{width:e,height:t,elapsedMs:0,sinceLaunchMs:mi,rockets:[],sparks:[]}}function _i(e,t,n,r,i){let a=Math.min(40,480-e.sparks.length),o=Math.min(e.width,e.height)*.3;for(let s=0;s<a;s++){let a=s/40*Math.PI*2,c=o*(.3+i()*.7);e.sparks.push({x:t,y:n,vx:Math.cos(a)*c,vy:Math.sin(a)*c,life:1.1+i()*.4,color:r})}}function vi(e,t,n){let r=Math.min(t/1e3,hi);e.elapsedMs+=r*1e3,e.sinceLaunchMs+=r*1e3,e.elapsedMs<=5500&&e.sinceLaunchMs>=mi&&(e.sinceLaunchMs=0,e.rockets.push({x:e.width*(.15+n()*.7),y:e.height,vy:-e.height*(.85+n()*.2),burstY:e.height*(.15+n()*.35),color:Q[Math.floor(n()*Q.length)]??Q[0]}));let i=0;for(let t of e.rockets)t.y+=t.vy*r,t.y<=t.burstY?_i(e,t.x,t.y,t.color,n):e.rockets[i++]=t;e.rockets.length=i;let a=0;for(let t of e.sparks)t.life-=r,t.life<=0||(t.vy+=pi*r,t.vx*=.985,t.x+=t.vx*r,t.y+=t.vy*r,e.sparks[a++]=t);e.sparks.length=a}function yi(e){return e.elapsedMs>5500&&e.rockets.length===0&&e.sparks.length===0}function bi(e){let t=e*2654435761;return()=>(t=Math.imul(t,1103515245)+12345>>>0,t/4294967296)}function xi(e,t){let n=gi(e,t);[[.2,.3],[.45,.18],[.7,.32],[.86,.16]].forEach(([r,i],a)=>{let o=Q[a%Q.length]??Q[0];_i(n,e*r,t*i,o,bi(a+1))});for(let e of n.sparks)e.x+=e.vx*.35,e.y+=e.vy*.35;return n}function Si(e,t){e.clearRect(0,0,t.width,t.height);for(let n of t.rockets)e.fillStyle=n.color,e.fillRect(Math.round(n.x),Math.round(n.y),1,2);for(let n of t.sparks)e.globalAlpha=n.life>.5?1:.5,e.fillStyle=n.color,e.fillRect(Math.round(n.x),Math.round(n.y),1,1);e.globalAlpha=1}function Ci(e,t,n){let r=n.rand??Math.random,i=n.raf??(e=>requestAnimationFrame(e)),a=Math.max(1,Math.ceil(n.width/4)),o=Math.max(1,Math.ceil(n.height/4)),s=A(e,O`<canvas class="launch-fireworks-sky" aria-hidden="true" width=${a} height=${o}></canvas>`).elements[0];t.prepend(s);let c=!1,l={canvas:s,stop:()=>{c=!0,s.remove()}},u=s.getContext(`2d`);if(!u)return l;if(u.imageSmoothingEnabled=!1,n.reducedMotion)return Si(u,xi(a,o)),l;let d=gi(a,o),f=-1,p=e=>{!c&&s.isConnected&&(vi(d,f<0?0:e-f,r),f=e,Si(u,d),yi(d)||i(p))};return i(p),l}function wi(){let e=null,t=null;return O`<div class="g-row">
      <button type="button" class="btn" @click=${()=>{let n=e;n&&(n.open(At({title:`Welcome to the gallery`,text:[`Every window, menu, sound and room of the game, drawn from the package.`,`Have a look around.`],buttons:[{label:`OK`,primary:!0,autofocus:!0,onPress:()=>n.close()}]})),t?.stop(),t=Ci(document,n.dialog,{reducedMotion:window.matchMedia(`(prefers-reduced-motion: reduce)`).matches,width:window.innerWidth,height:window.innerHeight}))}}>Celebrate…</button>
    </div>
    <dialog id="modal" ${j(t=>{t instanceof HTMLDialogElement&&!e&&(e=new U(t,{gameStopped:()=>!1,toast:()=>void 0}))})} @close=${()=>{t?.stop(),t=null}}></dialog>`}var Ti=260,Ei=200,Di=2,Oi=O`<div class="g-row">
  <button type="button" class="btn">Button</button>
  <button type="button" class="btn primary">Primary</button>
  <button type="button" class="btn danger">Danger</button>
  <button type="button" class="btn" aria-disabled="true">Grayed</button>
  <button type="button" class="btn xs">xs</button>
  <a class="btn" href="#">Link button</a>
</div>`,ki=O`<div class="g-row">
  <div class="win g-win">
    <div class="win-title">Window</div>
    <div class="g-pad">A window with a title bar.</div>
  </div>
  <div class="win win-closable g-win">
    <div class="win-title">Closable window <button type="button" class="btn xs" aria-label="Close">×</button></div>
    <div class="g-pad">Its title bar carries a close button.</div>
  </div>
  <div class="win g-win">
    <div class="win-title sm">Small title</div>
    <div class="g-pad">The compact title bar.</div>
  </div>
</div>`,Ai=O`<div class="g-row">
  <div class="win g-win">
    <div class="win-title">Tower Info</div>
    <div class="g-pad">
      <div class="well g-well">
        <div>8:00 AM: the lobby opened.</div>
        <div>9:15 AM: an office tenant moved in.</div>
        <div>11:40 AM: a fast food shop opened.</div>
      </div>
      <input class="field g-field" type="text" value="A text field" aria-label="Sample text field" />
      <dl class="kv">
        <dt class="k">Population</dt><dd class="v">1,204</dd>
        <dt class="k">Funds</dt><dd class="v">$2,450,000</dd>
        <dt class="k">Rating</dt><dd class="v">3 stars</dd>
      </dl>
    </div>
  </div>
</div>`,ji={label:`Sample menu`,menus:[{id:`g-file`,label:`File`,mnemonic:0,items:[{label:`New…`},{label:`Open…`,shortcut:`Ctrl+O`},{kind:`separator`},{label:`Save`,shortcut:`Ctrl+S`},{label:`Grayed item`,disabled:!0}]},{id:`g-options`,label:`Options`,mnemonic:0,items:[{label:`Sound`,checked:!0},{label:`Music`,checked:!1}]},{id:`g-help`,label:`Help`,mnemonic:0,items:[{label:`About…`}]}]},Mi=e=>O`<figure>${E(e,{size:24})}<figcaption>${e}</figcaption></figure>`,Ni=()=>O`<div class="g-icons">${k.map(Mi)}</div>`;function Pi(e,t){return{ctx:e,lit:!0,anim:0,hour:t,parkingUse:.7,recycleFill:.66}}function Fi(e){let t=m(Ti,Ei,e.label,t=>e.draw(Pi(t,e.hour),Ti,Ei)),n=Pe[e.kind],r=n?O` ${Ne(n)}`:w;return O`<figure>${t}<figcaption><span class="g-name">${e.label}</span>${r}</figcaption></figure>`}var Ii=e=>O`<div class="g-sprites">${e.map(Fi)}</div>`;function Li(e,t){let n=e.map(e=>{let{w:n,h:r}=l(e),i=m(n*Di,r*Di,e.title,n=>{n.scale(Di,Di),c(Pi(n,19),e,t)});return _(i,e.title,e.caption,e.manual?Ne(e.manual):void 0)});return O`<div class="g-scenes">${n}</div>`}var Ri=()=>O`<div class="g-menu-sample" ${j(e=>e&&new M(e,ji,{altKeys:!1}))}></div>`,$=e=>t=>C(e(),t),zi={buttons:$(()=>Oi),windows:$(()=>ki),wells:$(()=>Ai),"menu-bar":$(Ri),"message-boxes":$(Mt),"alert-cards":$(Zt),appearance:$(tn),"file-dialog":$(or),"scenario-list":$(ci),"title-screen":$(he),fireworks:$(wi),palette:$(g),"saver-scenes":$(ii),"saver-dialog":$(ai),desk:e=>gt(e,t().facts),"desk-layout":$(St),"control-panel":$(fi),icons:$(Ni),sounds:Ae,people:$(et),lobbies:$(()=>{let{facts:e}=t();return Li(f(e),e)}),stairs:$(()=>{let{facts:e}=t();return Li(v(e),e)}),elevators:$(()=>{let{facts:e}=t();return Li(s(e),e)}),rooms:$(()=>Ii(h(t().cat.facilities)))};function Bi(e=document){for(let t of e.querySelectorAll(`[data-demo]`)){let e=t.dataset.demo,n=zi[e];if(!n)throw Error(`The gallery has no demo named ${e}.`);n(t)}window.galleryReady=!0}Bi();