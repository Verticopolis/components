import{a as e,i as t,l as n,n as r,s as i}from"./icons.DP79BUfy.js";import{p as a}from"./overviewMapInput.DmshDoDc.js";import{s as o}from"./deskTaskbar.B-v1zGhI.js";var s=`0 0 460 200`,c=[`M-5 200 V120 h34 V98 h16 V120 h40 V200 z`,`M95 200 V80 h26 V56 h12 V80 h26 V200 z`,`M200 200 V54 h20 V30 h9 V10 h9 V30 h9 V54 h20 V200 z`,`M310 200 V92 h30 V68 h15 V92 h30 V200 z`,`M410 200 V60 h20 V36 h11 V60 h34 V200 z`],l=[[8,130],[8,146],[104,92],[104,112],[214,66],[214,90],[320,100],[424,72]],u={width:3,height:4},d=`#ffdca0`;function f(){return i`<div class="splash-stars" aria-hidden="true"></div>
    <div class="splash-sun" aria-hidden="true"></div>
    <svg class="splash-skyline" aria-hidden="true" viewBox=${s} preserveAspectRatio="xMidYMax slice">
      <g class="buildings" stroke-width="1">${c.map(e=>n`<path d=${e} />`)}</g>
      <g fill=${d}>${l.map(([e,t])=>n`<rect x=${e} y=${t} width=${u.width} height=${u.height} />`)}</g>
    </svg>`}function p(){return i`<svg class="splash-word" viewBox="0 0 400 66" role="img" aria-label="Verticopolis">
      <text x="194" y="52" text-anchor="middle" textLength="380" lengthAdjust="spacingAndGlyphs"><tspan class="a">VERTICO</tspan><tspan class="b">POLIS</tspan></text><text class="tm" x="386" y="24">™</text>
    </svg>
    <svg class="splash-tag" viewBox="0 0 360 20" role="img" aria-label="the vertical metropolis">
      <text x="180" y="15" text-anchor="middle" textLength="330" lengthAdjust="spacingAndGlyphs">THE VERTICAL METROPOLIS</text>
    </svg>`}function m(e){let n=e.look?`splash-btn ${e.look}`:`splash-btn`;return i`<button class=${n} data-splash=${e.id} @click=${()=>e.onPress()}>${e.icon?r(e.icon,{size:14}):t}${e.label}</button>`}function h(e,t){e.button===1&&t.onOpen?.(e)}function g(e){let{mute:n,install:a,sponsor:o}=e;return i`${f()}
    <div class="splash-brand">
      ${p()}
      ${e.premise?i`<p class="splash-premise">${e.premise}</p>`:t}
    </div>
    <div class="splash-actions">${e.actions.map(m)}</div>
    ${e.attribution?i`<p class="splash-attrib">${e.attribution}</p>`:t}
    ${e.version?i`<p class="splash-version">${e.version}</p>`:t}
    ${e.badge?i`<p class="splash-founder">${e.badge}</p>`:t}
    ${n?i`<button class="splash-mute" data-splash="mute" aria-pressed=${n.muted?`true`:`false`} aria-label=${n.label} @click=${n.onToggle}>${r(n.muted?`mute`:`sound`,{size:16})}</button>`:t}
    ${a?i`<button class="splash-install" data-splash="install" aria-label=${a.name} title=${a.title} @click=${()=>a.onPress()}>${r(`install`,{size:14})}${a.label}</button>`:t}
    ${o?i`<a class="splash-sponsor" data-splash="sponsor" href=${o.href} target="_blank" rel="noopener noreferrer" title=${o.title} @click=${o.onOpen} @auxclick=${e=>h(e,o)}>${r(`heart`,{size:14})}${o.label}</a>`:t}`}function _(e,t=!1,n=()=>{}){let r=t=>()=>e(`${t} pressed.`);return{premise:`Build a tower, one floor at a time, and keep its people happy.`,actions:[{id:`continue`,label:`Continue`,icon:`play`,look:`primary`,onPress:r(`Continue`)},{id:`load`,label:`Open Tower…`,icon:`folder`,onPress:r(`Open Tower…`)},{id:`new`,label:`New Tower`,icon:`plus`,onPress:r(`New Tower`)},{id:`help`,label:`How to Play`,icon:`help`,look:`ghost`,onPress:r(`How to Play`)}],attribution:`Sample small print along the bottom.`,version:`v0.0.0 (gallery)`,badge:`★ Ground floor`,mute:{muted:t,label:`Mute sound`,onToggle:n},install:{label:`Install`,name:`Install the game`,title:`A sample install button.`,onPress:r(`Install`)},sponsor:{href:`#`,label:`Sponsor`,title:`A sample sponsor link.`,onOpen:e=>{e.preventDefault(),r(`Sponsor`)()}}}}function v(){let t=null,n=`Press a button.`,r=!1,o=e=>{n=e,l()},s=()=>{r=!r,o(r?`Muted.`:`Sound on.`)},c=()=>_(o,r,s);function l(){t&&e(i`<div id="splash">${g(c())}</div><p class="g-title-said" role="status">${n}</p>`,t)}return i`<div class="g-title" ${a(e=>{e instanceof HTMLElement&&e!==t&&(t=e,l())})}></div>`}var y=`desk-win-control`,b={display:n`<rect x="4" y="4" width="24" height="18" fill="#c0c0c0" stroke="#000"/><rect x="7" y="7" width="18" height="12" fill="#008080"/><rect x="12" y="22" width="8" height="3" fill="#808080"/><rect x="8" y="25" width="16" height="3" fill="#c0c0c0" stroke="#000"/>`,appearance:n`<rect x="3" y="5" width="22" height="17" fill="#c0c0c0" stroke="#000"/><rect x="4" y="6" width="20" height="4" fill="#000080"/><rect x="9" y="11" width="20" height="16" fill="#ebe7dc" stroke="#000"/><rect x="10" y="12" width="18" height="4" fill="#5c66c9"/><rect x="23" y="13" width="3" height="2" fill="#c65a63"/>`,sounds:n`<path d="M5 12h6l7-6v20l-7-6H5z" fill="#c0c0c0" stroke="#000"/><path d="M21 11q3 5 0 10M24 8q5 8 0 16" fill="none" stroke="#000080" stroke-width="2"/>`,settings:n`<circle cx="16" cy="16" r="9" fill="#c0c0c0" stroke="#000"/><circle cx="16" cy="16" r="3" fill="#fff" stroke="#000"/><path d="M16 3v5M16 24v5M3 16h5M24 16h5M7 7l3 3M22 22l3 3M25 7l-3 3M10 22l-3 3" stroke="#000" stroke-width="2"/>`};function x(e,t,n,r){return i`<div class="desk-control-icons" role="group" aria-label=${r}>
      ${e.map(e=>i`<button
            type="button"
            class="desk-control-icon"
            data-control=${e.icon}
            title=${e.hint}
            @click=${()=>n(e.icon)}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">
              ${b[e.icon]}</svg
            ><span>${t.get(e.icon)??e.label}</span>
          </button>`)}
    </div>
    <div class="desk-control-status">${e.length} object(s)</div>`}var S=class{constructor(t,n){this.labels=new Map;let r=n.title??`Control Panel`,i={label:n.closeLabel,onClick:()=>{this.close(),n.closed?.()}},a=o(t,y,r,i,n.icon??`./favicon.png`);this.root=a.root,this.root.classList.add(`desk-control`),this.root.hidden=!0,this.draw=()=>e(x(n.items,this.labels,n.picked,r),a.body),this.draw()}isOpen(){return!this.root.hidden}open(){this.root.hidden=!1}close(){this.root.hidden=!0}setLabel(e,t){this.labels.get(e)!==t&&(this.labels.set(e,t),this.draw())}};export{g as i,_ as n,v as r,S as t};