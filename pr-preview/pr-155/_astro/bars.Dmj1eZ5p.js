import{a as e,i as t,n,o as r,r as i,s as a}from"./icons.DP79BUfy.js";import{t as o}from"./class-map.BBN9sn2d.js";import{n as s,t as c}from"./directive.BSZPiF1A.js";import{a as l,n as u,o as d}from"./schemeKey.CWRjHFw-.js";var f={},p=c(class extends s{constructor(){super(...arguments),this.ot=f}render(e,t){return t()}update(e,[t,n]){if(Array.isArray(t)){if(Array.isArray(this.ot)&&this.ot.length===t.length&&t.every((e,t)=>e===this.ot[t]))return r}else if(this.ot===t)return r;return this.ot=Array.isArray(t)?Array.from(t):t,this.render(t,n)}}),m=[{level:0,icon:`pause`,title:`Pause`,label:`Pause`},{level:1,icon:`speed1`,title:`Play (slow speed)`,label:`Play (slow speed)`},{level:2,icon:`speed2`,title:`Medium`,label:`Medium speed`},{level:3,icon:`speed3`,title:`Fast`,label:`Fast speed`}],h=`An update is ready. Tap to review.`,g={brand:n(`brand`),speed:m.map(e=>n(e.icon,{size:14})),undo:n(`undo`),redo:n(`redo`),save:n(`save`),sound:n(`sound`),mute:n(`mute`),update:n(`update`,{size:14}),install:n(`install`,{size:14})};function _(e,t){(t.key===`Enter`||t.key===` `)&&(t.preventDefault(),e.traffic?.())}var v=new WeakMap;function y(e){let t=v.get(e);return t||(t={speed:m.map(t=>()=>e.speed(t.level)),undo:()=>e.undo?.(),redo:()=>e.redo?.(),save:()=>e.save?.(),mute:()=>e.mute?.(),update:()=>e.update?.(),install:()=>e.install?.(),traffic:()=>e.traffic?.(),trafficKey:t=>_(e,t)},v.set(e,t)),t}var b=a`<div class="brand">
  ${g.brand}<span>VERTICO<b>POLIS</b><span class="brand-tm">™</span></span>
</div>`;function x(e,t){return a`<div class="stat" title="Vertical transport traffic: the worst waiting line. Tap to go to it">
    <span class="label">TRAFFIC</span>
    <span
      id="traffic"
      class=${o({value:!0,"traffic-warn":e.warn})}
      role="button"
      tabindex="0"
      aria-live="polite"
      aria-label=${e.spoken}
      @click=${t.traffic}
      @keydown=${t.trafficKey}
      ><span id="traffic-glyph" aria-hidden="true" data-level=${e.level}></span>
      <span id="traffic-label">${e.word}</span><span id="traffic-floor" aria-hidden="true">${e.floor}</span></span
    >
  </div>`}function S(e,t){return m.map((n,r)=>a`<button
        class=${o({btn:!0,active:e===n.level})}
        data-speed=${n.level}
        title=${n.title}
        aria-label=${n.label}
        @click=${t.speed[r]}
      >
        ${g.speed[r]}
      </button>`)}function C(e,n,r){return a`${n.undo?a`<button class="btn" id="btn-undo" title="Undo (Ctrl+Z)" aria-label="Undo" aria-disabled=${e.undoOff?`true`:t} @click=${r.undo}>
        ${g.undo}
      </button>`:t}${n.redo?a`<button class="btn" id="btn-redo" title="Redo (Ctrl+Shift+Z)" aria-label="Redo" aria-disabled=${e.redoOff?`true`:t} @click=${r.redo}>
        ${g.redo}
      </button>`:t}${n.save?a`<button class="btn" id="btn-save-top" title="Save (Ctrl+S)" aria-label="Save" @click=${r.save}>${g.save}</button>`:t}${n.mute?a`<button
        class="btn"
        id="audio-toggle"
        title="Toggle sound"
        aria-label="Mute sound"
        aria-pressed=${e.muted?`true`:`false`}
        @click=${r.mute}
      >
        ${e.muted?g.mute:g.sound}
      </button>`:t}${n.update?a`<button class="btn" id="btn-update" title=${h} aria-label=${h} ?hidden=${!e.update} @click=${r.update}>
        ${g.update}<span class="btn-label">Update</span>
      </button>`:t}${n.install?a`<button
        class="btn"
        id="btn-install"
        title="Install Verticopolis: play offline, fullscreen, from your home screen."
        aria-label="Install Verticopolis"
        ?hidden=${!e.install}
        @click=${r.install}
      >
        ${g.install}<span class="btn-label">Install</span>
      </button>`:t}`}function w(e,n){let r=y(n);return a`${e.brand===!1?t:b}
    <div id="status">
      <div class="stat" title="Star rating">
        <span class="label">RATING</span>
        <span id="stat-star" class="value stars">${e.rating}</span>
      </div>
      <div class="stat stat-date" title="Date">
        <span class="label">DATE</span>
        <span id="stat-date" class="value">${e.date}</span>
      </div>
      <div class="stat" title="Time of day">
        <span class="label">TIME</span>
        <span id="stat-time" class="value">${e.time}</span>
      </div>
      <div class="stat" title="Cash on hand">
        <span class="label">FUND</span>
        <span id="stat-money" class="value money" style="color: ${e.fundsNegative?`var(--bad)`:`var(--money)`}"
          >${e.funds}</span
        >
      </div>
      <div class="stat" title="Total population">
        <span class="label">POP</span>
        <span id="stat-pop" class="value">${e.population}</span>
      </div>
      ${p([e.traffic,r],()=>e.traffic&&n.traffic?x(e.traffic,r):t)}
    </div>
    <div id="speed">
      ${p([e.speed,r],()=>S(e.speed,r))}
      ${p([e.undoOff,e.redoOff,e.muted,e.update,e.install,r],()=>C(e,n,r))}
    </div>`}function T(e){return a`<div id="sb-hint" class="sb-cell sb-grow" aria-hidden="true" ?hidden=${!e.hint}>${e.hint||t}</div>
    <div id="tool-info" class="sb-cell sb-grow">${e.tool}</div>
    <div id="sb-tower" class="sb-cell">${e.tower||t}</div>
    <div id="sb-news" class="sb-cell sb-news" aria-hidden="true" title=${e.news||t}>${e.news?i(e.news):t}</div>`}var E=[{level:`smooth`,word:`Smooth`,floor:``,spoken:`Traffic: Smooth`,warn:!1},{level:`busy`,word:`Busy`,floor:` · 12F`,spoken:`Traffic: Busy, worst line on floor 12`,warn:!1},{level:`backed-up`,word:`Backed up`,floor:` · 1F`,spoken:`Traffic: Backed up, worst line on floor 1`,warn:!0},{level:`gridlock`,word:`Gridlock`,floor:` · B2`,spoken:`Traffic: Gridlock, worst line on floor B2`,warn:!0}],D=[`Pause`,`Slow`,`Medium`,`Fast`],O={rating:`★★★☆☆`,date:`2nd WD/3Q/4th Year`,time:`Tue 08:45`,funds:`$1,284,500`,fundsNegative:!1,population:`2,418`,traffic:E[0],speed:1,undoOff:!1,redoOff:!0,muted:!1,update:!0,install:!0};function k(t=document){let n=t.getElementById(`topbar`),r=t.getElementById(`statusbar`),i=t.getElementById(`g-bars-said`),o=t.getElementById(`g-bars-trim`);if(!n||!r||!i||!o)return;let s=!1,c=0,l=`Press a button or the traffic meter.`,u=O,d={hint:``,tool:a`<span class="ti-name">Office</span><span>$40,000</span><span>9 tiles wide</span>`,tower:`Harmony Tower · Classic`,news:`🔥 A fire broke out on floor 12.`},f=e=>{l=e,g()},p={speed:e=>{u={...u,speed:e},f(`${D[e]} pressed.`)},undo:()=>f(`Undo pressed.`),redo:()=>f(`Redo pressed: there is nothing to redo, so the game would do nothing.`),save:()=>f(`Save pressed.`),mute:()=>{u={...u,muted:!u.muted},f(u.muted?`Sound off.`:`Sound on.`)},update:()=>f(`Update pressed.`),install:()=>f(`Install pressed.`),traffic:()=>{c=(c+1)%E.length,u={...u,traffic:E[c]},f(`Traffic pressed: the meter now reads ${E[c].word}.`)}},m={speed:p.speed},h=e=>{s=e.target.checked,f(s?`Trimmed to the meters and the speeds.`:`Every control is back.`)},g=()=>{e(s?w({...u,brand:!1},m):w(u,p),n),e(a`<label
        ><input type="checkbox" .checked=${s} @change=${h} /> Speeds only (a page with no undo, save, sound
        or traffic)</label
      >`,o),e(T(d),r),e(a`${l}`,i)};g(),A(t)}function A(e){let t=e.defaultView;t&&t.addEventListener(`storage`,t=>{t.key===`vc-components-scheme`&&l(d(t.newValue)?t.newValue:u,e.documentElement)})}export{w as i,A as n,k as r,O as t};