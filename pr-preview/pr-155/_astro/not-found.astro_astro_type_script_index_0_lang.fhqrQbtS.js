import{a as e,i as t,n,s as r}from"./icons.DP79BUfy.js";function i(e){let t=e.getHours(),n=String(e.getMinutes()).padStart(2,`0`);return`${t%12||12}:${n} ${t<12?`AM`:`PM`}`}function a(e){return(60-e.getSeconds())*1e3-e.getMilliseconds()+50}var o=r`<svg class="nf-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
  <path
    d="M15 2h2v2h1v3h1v3h1v3h1v3h1v3h1v3h1v3h1v3H5v-3h1v-3h1v-3h1v-3h1v-3h1v-3h1v-3h1V7h1V4h1z"
    fill="#000"
  />
  <path
    d="M15.5 5h1v3h1v3h1v3h1v3h1v3h1v3h1v2H7v-2h1v-3h1v-3h1v-3h1v-3h1v-3h1V8h1V5z"
    fill="#ffd400"
  />
  <path d="M15 10h2v9h-2zM15 21h2v2h-2z" fill="#000" />
</svg>`,s=r`<div class="nf-sky" aria-hidden="true">
  <span class="nf-star" style="left:12%;top:18%"></span>
  <span class="nf-star" style="left:34%;top:9%"></span>
  <span class="nf-star" style="left:71%;top:14%"></span>
  <span class="nf-star" style="left:88%;top:30%"></span>
  <span class="nf-sun"></span>
  <span class="nf-bldg" style="left:3%;width:15%;height:52%;--lit:0.35"></span>
  <span class="nf-bldg" style="left:20%;width:11%;height:70%;--lit:0.6"></span>
  <span class="nf-tower">
    <span class="nf-tower-top"></span>
    <span class="nf-gap"><span class="nf-tag">404</span></span>
    <span class="nf-tower-base"></span>
  </span>
  <span class="nf-bldg" style="left:63%;width:13%;height:62%;--lit:0.45"></span>
  <span class="nf-bldg" style="left:80%;width:17%;height:44%;--lit:0.3"></span>
</div>`;function c(e){let n=e.onPick;return n?{click:e=>n(e,`click`),aux:e=>{e.button===1&&n(e,`middle`)}}:{click:t,aux:t}}function l(e,n){let i=c(e);return r`<a
    class=${n?`btn primary`:`btn`}
    href=${e.href}
    data-act=${e.act??t}
    @click=${i.click}
    @auxclick=${i.aux}
    >${e.label}</a
  >`}function u(e){let i=e.icon??`brand`,a=c(e.close),u=c(e.start);return r`
    <div class="nf-desk">
      <main class="nf-win win" aria-labelledby="nf-heading">
        <div class="win-title">
          <span class="nf-title-icon" aria-hidden="true">${n(i,{size:16})}</span>
          <span class="nf-title-text">${e.title}</span>
          <a
            class="btn xs nf-close"
            href=${e.close.href}
            data-act=${e.close.act??t}
            aria-label=${e.close.label}
            @click=${a.click}
            @auxclick=${a.aux}
            >✕</a
          >
        </div>
        ${s}
        <div class="nf-body">
          ${e.note??t}
          <div class="nf-msg">
            ${o}
            <div>
              <h1 id="nf-heading">${e.heading}</h1>
              <p>There is no page at <code>${e.path}</code>.</p>
              ${(e.lines??[]).map(e=>r`<p>${e}</p>`)}
            </div>
          </div>
          <nav class="nf-buttons" aria-label="Pages">${e.links.map((e,t)=>l(e,t===0))}</nav>
        </div>
      </main>
    </div>
    <footer class="nf-taskbar">
      <a
        class="nf-start"
        href=${e.start.href}
        data-act=${e.start.act??t}
        @click=${u.click}
        @auxclick=${u.aux}
        >${n(i,{size:16})}<span>${e.start.label}</span></a
      >
      <span class="nf-task" aria-hidden="true">${n(`warning`,{size:14})}<span>${e.task}</span></span>
      <span class="nf-tray"><time>${e.clock}</time></span>
    </footer>
  `}function d(){let t=document.getElementById(`app`);if(!t)return;let n=`Page not found`,r=(e,t)=>({act:e,label:t,href:`#`,onPick:(e,r)=>{e.preventDefault(),n=r===`middle`?`${t} (new tab)`:t,o()}}),o=()=>e(u({title:`Verticopolis components`,heading:`Floor 404 hasn't been built yet.`,path:`/controls/elevator-music/`,lines:[`The link may be mistyped, or the page may have moved.`],links:[r(`gallery`,`Browse the gallery`),r(`game`,`Play the game`),r(`docs`,`Read the docs`)],close:r(`close`,`Close and go to the gallery`),start:r(`start`,`Start`),task:n,clock:i(new Date)}),t);o();let s=()=>{o(),setTimeout(s,a(new Date))};setTimeout(s,a(new Date)),window.galleryReady=!0}d();