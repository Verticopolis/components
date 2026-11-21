import{i as e,n as t,t as n}from"./lit-html.Cnzry4jM.js";import{t as r}from"./class-map.SdtVvvRH.js";import{n as i,r as a}from"./icons.XE2s_yoD.js";import{a as o,n as s,o as c}from"./schemeKey.kTKddGB9.js";var l=[{level:0,icon:`pause`,title:`Pause`,label:`Pause`},{level:1,icon:`speed1`,title:`Play (slow speed)`,label:`Play (slow speed)`},{level:2,icon:`speed2`,title:`Medium`,label:`Medium speed`},{level:3,icon:`speed3`,title:`Fast`,label:`Fast speed`}],u=`An update is ready. Tap to review.`,d={brand:i(`brand`),speed:l.map(e=>i(e.icon,{size:14})),undo:i(`undo`),redo:i(`redo`),save:i(`save`),sound:i(`sound`),mute:i(`mute`),update:i(`update`,{size:14}),install:i(`install`,{size:14})};function f(e,t){(t.key===`Enter`||t.key===` `)&&(t.preventDefault(),e.traffic?.())}var p=new WeakMap;function m(e){let t=p.get(e);return t||(t={speed:l.map(t=>()=>e.speed(t.level)),undo:()=>e.undo?.(),redo:()=>e.redo?.(),save:()=>e.save?.(),mute:()=>e.mute?.(),update:()=>e.update?.(),install:()=>e.install?.(),traffic:()=>e.traffic?.(),trafficKey:t=>f(e,t)},p.set(e,t)),t}var h=e`<div class="brand">
  ${d.brand}<span>VERTICO<b>POLIS</b><span class="brand-tm">™</span></span>
</div>`;function g(t,n){return e`<div class="stat" title="Vertical transport traffic: the worst waiting line. Tap to go to it">
    <span class="label">TRAFFIC</span>
    <span
      id="traffic"
      class=${r({value:!0,"traffic-warn":t.warn})}
      role="button"
      tabindex="0"
      aria-live="polite"
      aria-label=${t.spoken}
      @click=${n.traffic}
      @keydown=${n.trafficKey}
      ><span id="traffic-glyph" aria-hidden="true" data-level=${t.level}></span>
      <span id="traffic-label">${t.word}</span><span id="traffic-floor" aria-hidden="true">${t.floor}</span></span
    >
  </div>`}function _(t,r,i){return e`${r.undo?e`<button class="btn" id="btn-undo" title="Undo (Ctrl+Z)" aria-label="Undo" aria-disabled=${t.undoOff?`true`:n} @click=${i.undo}>
        ${d.undo}
      </button>`:n}${r.redo?e`<button class="btn" id="btn-redo" title="Redo (Ctrl+Shift+Z)" aria-label="Redo" aria-disabled=${t.redoOff?`true`:n} @click=${i.redo}>
        ${d.redo}
      </button>`:n}${r.save?e`<button class="btn" id="btn-save-top" title="Save (Ctrl+S)" aria-label="Save" @click=${i.save}>${d.save}</button>`:n}${r.mute?e`<button
        class="btn"
        id="audio-toggle"
        title="Toggle sound"
        aria-label="Mute sound"
        aria-pressed=${t.muted?`true`:`false`}
        @click=${i.mute}
      >
        ${t.muted?d.mute:d.sound}
      </button>`:n}${r.update?e`<button class="btn" id="btn-update" title=${u} aria-label=${u} ?hidden=${!t.update} @click=${i.update}>
        ${d.update}<span class="btn-label">Update</span>
      </button>`:n}${r.install?e`<button
        class="btn"
        id="btn-install"
        title="Install Verticopolis: play offline, fullscreen, from your home screen."
        aria-label="Install Verticopolis"
        ?hidden=${!t.install}
        @click=${i.install}
      >
        ${d.install}<span class="btn-label">Install</span>
      </button>`:n}`}function v(t,i){let a=m(i);return e`${t.brand===!1?n:h}
    <div id="status">
      <div class="stat" title="Star rating">
        <span class="label">RATING</span>
        <span id="stat-star" class="value stars">${t.rating}</span>
      </div>
      <div class="stat stat-date" title="Date">
        <span class="label">DATE</span>
        <span id="stat-date" class="value">${t.date}</span>
      </div>
      <div class="stat" title="Time of day">
        <span class="label">TIME</span>
        <span id="stat-time" class="value">${t.time}</span>
      </div>
      <div class="stat" title="Cash on hand">
        <span class="label">FUND</span>
        <span id="stat-money" class="value money" style="color: ${t.fundsNegative?`var(--bad)`:`var(--money)`}"
          >${t.funds}</span
        >
      </div>
      <div class="stat" title="Total population">
        <span class="label">POP</span>
        <span id="stat-pop" class="value">${t.population}</span>
      </div>
      ${t.traffic&&i.traffic?g(t.traffic,a):n}
    </div>
    <div id="speed">
      ${l.map((n,i)=>e`<button
            class=${r({btn:!0,active:t.speed===n.level})}
            data-speed=${n.level}
            title=${n.title}
            aria-label=${n.label}
            @click=${a.speed[i]}
          >
            ${d.speed[i]}
          </button>`)}
      ${_(t,i,a)}
    </div>`}function y(t){return e`<div id="sb-hint" class="sb-cell sb-grow" aria-hidden="true" ?hidden=${!t.hint}>${t.hint||n}</div>
    <div id="tool-info" class="sb-cell sb-grow">${t.tool}</div>
    <div id="sb-tower" class="sb-cell">${t.tower||n}</div>
    <div id="sb-news" class="sb-cell sb-news" aria-hidden="true" title=${t.news||n}>${t.news?a(t.news):n}</div>`}var b=[{level:`smooth`,word:`Smooth`,floor:``,spoken:`Traffic: Smooth`,warn:!1},{level:`busy`,word:`Busy`,floor:` · 12F`,spoken:`Traffic: Busy, worst line on floor 12`,warn:!1},{level:`backed-up`,word:`Backed up`,floor:` · 1F`,spoken:`Traffic: Backed up, worst line on floor 1`,warn:!0},{level:`gridlock`,word:`Gridlock`,floor:` · B2`,spoken:`Traffic: Gridlock, worst line on floor B2`,warn:!0}],x=[`Pause`,`Slow`,`Medium`,`Fast`];function S(n=document){let r=n.getElementById(`topbar`),i=n.getElementById(`statusbar`),a=n.getElementById(`g-bars-said`),o=n.getElementById(`g-bars-trim`);if(!r||!i||!a||!o)return;let s=!1,c=0,l=`Press a button or the traffic meter.`,u={rating:`★★★☆☆`,date:`2nd WD/3Q/4th Year`,time:`Tue 08:45`,funds:`$1,284,500`,fundsNegative:!1,population:`2,418`,traffic:b[0],speed:1,undoOff:!1,redoOff:!0,muted:!1,update:!0,install:!0},d={hint:``,tool:e`<span class="ti-name">Office</span><span>$40,000</span><span>9 tiles wide</span>`,tower:`Harmony Tower · Classic`,news:`🔥 A fire broke out on floor 12.`},f=e=>{l=e,g()},p={speed:e=>{u={...u,speed:e},f(`${x[e]} pressed.`)},undo:()=>f(`Undo pressed.`),redo:()=>f(`Redo pressed: there is nothing to redo, so the game would do nothing.`),save:()=>f(`Save pressed.`),mute:()=>{u={...u,muted:!u.muted},f(u.muted?`Sound off.`:`Sound on.`)},update:()=>f(`Update pressed.`),install:()=>f(`Install pressed.`),traffic:()=>{c=(c+1)%b.length,u={...u,traffic:b[c]},f(`Traffic pressed: the meter now reads ${b[c].word}.`)}},m={speed:p.speed},h=e=>{s=e.target.checked,f(s?`Trimmed to the meters and the speeds.`:`Every control is back.`)},g=()=>{t(s?v({...u,brand:!1},m):v(u,p),r),t(e`<label
        ><input type="checkbox" .checked=${s} @change=${h} /> Speeds only (a page with no undo, save, sound
        or traffic)</label
      >`,o),t(y(d),i),t(e`${l}`,a)};g(),C(n)}function C(e){let t=e.defaultView;t&&t.addEventListener(`storage`,t=>{t.key===`vc-components-scheme`&&o(c(t.newValue)?t.newValue:s,e.documentElement)})}S();