import{i as e,n as t,t as n}from"./lit-html.Cnzry4jM.js";import{t as r}from"./class-map.SdtVvvRH.js";import{n as i,r as a}from"./icons.XE2s_yoD.js";import{a as o,n as s,o as c}from"./schemeKey.kTKddGB9.js";var l=[{level:0,icon:`pause`,title:`Pause`,label:`Pause`},{level:1,icon:`speed1`,title:`Play (slow speed)`,label:`Play (slow speed)`},{level:2,icon:`speed2`,title:`Medium`,label:`Medium speed`},{level:3,icon:`speed3`,title:`Fast`,label:`Fast speed`}],u=`An update is ready. Tap to review.`,d={brand:i(`brand`),speed:l.map(e=>i(e.icon,{size:14})),undo:i(`undo`),redo:i(`redo`),save:i(`save`),sound:i(`sound`),mute:i(`mute`),update:i(`update`,{size:14}),install:i(`install`,{size:14})};function f(e,t){(t.key===`Enter`||t.key===` `)&&(t.preventDefault(),e.traffic())}var p=new WeakMap;function m(e){let t=p.get(e);return t||(t={speed:l.map(t=>()=>e.speed(t.level)),undo:()=>e.undo(),redo:()=>e.redo(),save:()=>e.save(),mute:()=>e.mute(),update:()=>e.update(),install:()=>e.install(),traffic:()=>e.traffic(),trafficKey:t=>f(e,t)},p.set(e,t)),t}function h(t,i){let a=m(i),o=t.traffic;return e`<div class="brand">
      ${d.brand}<span>VERTICO<b>POLIS</b><span class="brand-tm">™</span></span>
    </div>
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
      <div class="stat" title="Vertical transport traffic: the worst waiting line. Tap to go to it">
        <span class="label">TRAFFIC</span>
        <span
          id="traffic"
          class=${r({value:!0,"traffic-warn":o.warn})}
          role="button"
          tabindex="0"
          aria-live="polite"
          aria-label=${o.spoken}
          @click=${a.traffic}
          @keydown=${a.trafficKey}
          ><span id="traffic-glyph" aria-hidden="true" data-level=${o.level}></span>
          <span id="traffic-label">${o.word}</span><span id="traffic-floor" aria-hidden="true">${o.floor}</span></span
        >
      </div>
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
      <button class="btn" id="btn-undo" title="Undo (Ctrl+Z)" aria-label="Undo" aria-disabled=${t.undoOff?`true`:n} @click=${a.undo}>
        ${d.undo}
      </button>
      <button class="btn" id="btn-redo" title="Redo (Ctrl+Shift+Z)" aria-label="Redo" aria-disabled=${t.redoOff?`true`:n} @click=${a.redo}>
        ${d.redo}
      </button>
      <button class="btn" id="btn-save-top" title="Save (Ctrl+S)" aria-label="Save" @click=${a.save}>
        ${d.save}
      </button>
      <button
        class="btn"
        id="audio-toggle"
        title="Toggle sound"
        aria-label="Mute sound"
        aria-pressed=${t.muted?`true`:`false`}
        @click=${a.mute}
      >
        ${t.muted?d.mute:d.sound}
      </button>
      <button class="btn" id="btn-update" title=${u} aria-label=${u} ?hidden=${!t.update} @click=${a.update}>
        ${d.update}<span class="btn-label">Update</span>
      </button>
      <button
        class="btn"
        id="btn-install"
        title="Install Verticopolis: play offline, fullscreen, from your home screen."
        aria-label="Install Verticopolis"
        ?hidden=${!t.install}
        @click=${a.install}
      >
        ${d.install}<span class="btn-label">Install</span>
      </button>
    </div>`}function g(t){return e`<div id="sb-hint" class="sb-cell sb-grow" aria-hidden="true" ?hidden=${!t.hint}>${t.hint||n}</div>
    <div id="tool-info" class="sb-cell sb-grow">${t.tool}</div>
    <div id="sb-tower" class="sb-cell">${t.tower||n}</div>
    <div id="sb-news" class="sb-cell sb-news" aria-hidden="true" title=${t.news||n}>${t.news?a(t.news):n}</div>`}var _=[{level:`smooth`,word:`Smooth`,floor:``,spoken:`Traffic: Smooth`,warn:!1},{level:`busy`,word:`Busy`,floor:` · 12F`,spoken:`Traffic: Busy, worst line on floor 12`,warn:!1},{level:`backed-up`,word:`Backed up`,floor:` · 1F`,spoken:`Traffic: Backed up, worst line on floor 1`,warn:!0},{level:`gridlock`,word:`Gridlock`,floor:` · B2`,spoken:`Traffic: Gridlock, worst line on floor B2`,warn:!0}],v=[`Pause`,`Slow`,`Medium`,`Fast`];function y(n=document){let r=n.getElementById(`topbar`),i=n.getElementById(`statusbar`),a=n.getElementById(`g-bars-said`);if(!r||!i||!a)return;let o=0,s=`Press a button or the traffic meter.`,c={rating:`★★★☆☆`,date:`2nd WD/3Q/4th Year`,time:`Tue 08:45`,funds:`$1,284,500`,fundsNegative:!1,population:`2,418`,traffic:_[0],speed:1,undoOff:!1,redoOff:!0,muted:!1,update:!0,install:!0},l={hint:``,tool:e`<span class="ti-name">Office</span><span>$40,000</span><span>9 tiles wide</span>`,tower:`Harmony Tower · Classic`,news:`🔥 A fire broke out on floor 12.`},u=e=>{s=e,f()},d={speed:e=>{c={...c,speed:e},u(`${v[e]} pressed.`)},undo:()=>u(`Undo pressed.`),redo:()=>u(`Redo pressed: there is nothing to redo, so the game would do nothing.`),save:()=>u(`Save pressed.`),mute:()=>{c={...c,muted:!c.muted},u(c.muted?`Sound off.`:`Sound on.`)},update:()=>u(`Update pressed.`),install:()=>u(`Install pressed.`),traffic:()=>{o=(o+1)%_.length,c={...c,traffic:_[o]},u(`Traffic pressed: the meter now reads ${_[o].word}.`)}},f=()=>{t(h(c,d),r),t(g(l),i),t(e`${s}`,a)};f(),b(n)}function b(e){let t=e.defaultView;t&&t.addEventListener(`storage`,t=>{t.key===`vc-components-scheme`&&o(c(t.newValue)?t.newValue:s,e.documentElement)})}y();