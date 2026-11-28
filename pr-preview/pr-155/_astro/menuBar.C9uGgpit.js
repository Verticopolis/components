import{a as e,i as t,n,o as r,s as i}from"./icons.DP79BUfy.js";import{n as a,r as o,t as s}from"./directive.BSZPiF1A.js";import{a as c,n as l,o as u,r as d,t as f}from"./directive-helpers.CEcIXpaj.js";var p=e=>e??t,m=(e,t,n)=>{let r=new Map;for(let i=t;i<=n;i++)r.set(e[i],i);return r},h=s(class extends a{constructor(e){if(super(e),e.type!==o.CHILD)throw Error(`repeat() can only be used in text expressions`)}dt(e,t,n){let r;n===void 0?n=t:t!==void 0&&(r=t);let i=[],a=[],o=0;for(let t of e)i[o]=r?r(t,o):o,a[o]=n(t,o),o++;return{values:a,keys:i}}render(e,t,n){return this.dt(e,t,n).values}update(e,[t,n,i]){let a=f(e),{values:o,keys:s}=this.dt(t,n,i);if(!Array.isArray(a))return this.ut=s,o;let p=this.ut??=[],h=[],g,_,v=0,y=a.length-1,b=0,x=o.length-1;for(;v<=y&&b<=x;)if(a[v]===null)v++;else if(a[y]===null)y--;else if(p[v]===s[b])h[b]=c(a[v],o[b]),v++,b++;else if(p[y]===s[x])h[x]=c(a[y],o[x]),y--,x--;else if(p[v]===s[x])h[x]=c(a[v],o[x]),u(e,h[x+1],a[v]),v++,x--;else if(p[y]===s[b])h[b]=c(a[y],o[b]),u(e,a[v],a[y]),y--,b++;else if(g===void 0&&(g=m(s,b,x),_=m(p,v,y)),g.has(p[v])){if(g.has(p[y])){let t=_.get(s[b]),n=t===void 0?null:a[t];if(n===null){let t=u(e,a[v]);c(t,o[b]),h[b]=t}else h[b]=c(n,o[b]),u(e,a[v],n),a[t]=null;b++}else l(a[y]),y--}else l(a[v]),v++;for(;b<=x;){let t=u(e,h[x+1]);c(t,o[b]),h[b++]=t}for(;v<=y;){let e=a[v++];e!==null&&l(e)}return this.ut=s,d(e,h),r}}),g=e=>e.popupId??`${e.id}-menu`,_=(e,t)=>t?`${e} ${t}`:e;function v({label:e,mnemonic:t}){return t===void 0||t<0||t>=e.length?e:i`${e.slice(0,t)}<u>${e[t]}</u>${e.slice(t+1)}`}var y=s(class extends a{constructor(){super(...arguments),this.keys=[]}render(e){return t}update(e,[n]){let r=n??{};for(let t of this.keys)t in r||e.element.removeAttribute(`data-${t}`);for(let[t,n]of Object.entries(r))e.element.setAttribute(`data-${t}`,n);return this.keys=Object.keys(r),t}});function b(e){return i`<hr class=${_(`mb-sep`,e.className)} id=${p(e.id)} ?hidden=${!!e.hidden} />`}var x=e=>e.disabled?t:e.onPick??t,S=e=>e.radio?`menuitemradio`:`menuitemcheckbox`;function C(e){let n=e.checked===void 0?`menuitem`:S(e),r=e.checked===void 0?t:String(e.checked),a=e.disabled?`true`:t,o=i`${e.content??v(e)}${e.shortcut?i`<kbd>${e.shortcut}</kbd>`:t}`;return e.href===void 0?i`<button
    type="button"
    role=${n}
    class=${_(`mb-item`,e.className)}
    id=${p(e.id)}
    title=${p(e.title)}
    aria-checked=${r}
    aria-disabled=${a}
    ?hidden=${!!e.hidden}
    @click=${x(e)}
    ${y(e.data)}
  >${o}</button>`:i`<a
      role=${n}
      class=${_(`mb-item`,e.className)}
      id=${p(e.id)}
      href=${e.href}
      target=${p(e.target)}
      rel=${p(e.rel)}
      title=${p(e.title)}
      aria-checked=${r}
      aria-disabled=${a}
      ?hidden=${!!e.hidden}
      @click=${x(e)}
      ${y(e.data)}
      >${o}</a
    >`}function w(e){let n=g(e);return i`<div class=${_(`mb-sub`,e.className)} role="none" ?hidden=${!!e.hidden}>
    <button
      type="button"
      role="menuitem"
      class="mb-item mb-sub-title"
      id=${e.id}
      aria-haspopup="menu"
      aria-expanded="false"
      aria-controls=${n}
      aria-disabled=${e.disabled?`true`:t}
    >${v(e)}</button>
    <div class="mb-pop mb-subpop" id=${n} role="menu" aria-labelledby=${e.id} hidden>
      ${e.items.map(T)}
    </div>
  </div>`}function T(e){return e.kind===`separator`?b(e):e.kind===`submenu`?w(e):C(e)}function E(e,t){let n=g(e);return i`<div class=${_(`mb-menu`,e.className)} ?hidden=${!!e.hidden}>
    <button
      type="button"
      class="mb-title"
      id=${e.id}
      aria-haspopup="menu"
      aria-expanded="false"
      aria-controls=${n}
      @click=${t.titleClick}
      @pointerenter=${t.titlePointerEnter}
      @keydown=${t.titleKeyDown}
    >${v(e)}</button>
    <div
      class="mb-pop"
      id=${n}
      role="menu"
      aria-labelledby=${e.id}
      hidden
      @keydown=${t.menuKeyDown}
      @click=${t.menuClick}
      @pointerdown=${t.menuPointerDown}
      @pointerover=${t.menuPointerOver}
    >
      ${e.items.map(T)}
    </div>
  </div>`}var D=n(`brand`);function O(e,n){return i`<nav id=${p(e.id)} class=${_(`menubar`,e.className)} aria-label=${e.label}>
    ${e.brand?i`<span class="menubar-brand" aria-hidden="true">${D}</span>`:t}
    ${h(e.menus,e=>e.id,e=>E(e,n))}
  </nav>`}var k=1e3;function A(e){e.style.translate=``;let t=e.getBoundingClientRect(),n=t.right-e.ownerDocument.documentElement.clientWidth,r=Math.max(n>0?-n:0,-t.left);r!==0&&(e.style.translate=`${r}px 0`)}var j=`.mb-item:not([hidden]):not([aria-disabled='true'])`;function M(e){if(!e.isConnected||e.closest(`[hidden]`))return!1;let t=e.parentElement;return!t||t.ownerDocument.defaultView?.getComputedStyle(t).display!==`none`}var N=`.mb-sub-title`,P=`.mb-subpop`,F=class{constructor(e,t,n={}){this.root=e,this.opts=n,this.openTitle=null,this.openSubTitle=null,this.mouseDown=!1,this.swallowUntil=-1/0,this.tripMenus=new Set,this.titleList=[],this.unlisten=[],this.titleClick=e=>{let t=e.currentTarget;this.openTitle===t?this.close(!0,`title`):this.open(t,!1,e.detail===0?`keys`:`click`)},this.titlePointerEnter=e=>{let t=e.currentTarget;e.pointerType===`mouse`&&this.openTitle&&this.openTitle!==t&&this.open(t,!1)},this.titleKeyDown=e=>this.titleKey(e,e.currentTarget),this.menuKeyDown=e=>{let t=this.titleOf(e.currentTarget);t&&this.menuKey(e,t)},this.menuClick=e=>{let t=e.target instanceof Element?e.target.closest(`.mb-item`):null;t&&t.getAttribute(`aria-disabled`)!==`true`&&(t.matches(N)?this.mouseDown&&e.detail>0?this.openSub(t,!1):this.toggleSub(t,e.detail===0):this.close())},this.menuPointerDown=e=>{this.mouseDown=e.pointerType===`mouse`},this.menuPointerOver=e=>{if(e.pointerType!==`mouse`||!(e.target instanceof Element))return;let t=e.target.closest(`.mb-item`);t&&!t.closest(P)&&(t.matches(N)?this.openSub(t,!1):this.closeSub(!1))},this.render(t);let r=e.ownerDocument,i=r.defaultView,a=t=>!(t.target instanceof Node&&e.contains(t.target)),o=(e,t,n,r=!1)=>{e&&(e.addEventListener(t,n,r),this.unlisten.push(()=>e.removeEventListener(t,n,r)))};o(i,`pointerdown`,e=>{this.openTitle&&a(e)&&(this.close(!0,`outside`),this.swallowUntil=e.timeStamp+k,e.preventDefault(),e.stopPropagation())},!0);let s=e=>{e.timeStamp>this.swallowUntil||!a(e)||(e.type===`click`&&(this.swallowUntil=-1/0),e.preventDefault(),e.stopPropagation())};o(i,`pointerup`,s,!0),o(i,`click`,s,!0),n.altKeys!==!1&&o(r,`keydown`,e=>this.accelerator(e)),o(i,`blur`,()=>this.close(!0,`blur`))}dispose(){for(let e of this.unlisten.splice(0))e()}render(t){e(O(t,this),this.root),this.titleList=[...this.root.querySelectorAll(`.mb-title`)]}current(){return this.openTitle}browsed(){return this.tripMenus.size}open(e,t,n=`click`){let r=this.menuOf(e);r&&(this.openTitle&&this.openTitle!==e?this.hide(!1):this.openTitle||(this.tripMenus.clear(),this.opts.onTrip?.(e,n)),this.tripMenus.add(e),this.opts.onOpen?.(r),r.hidden=!1,A(r),e.setAttribute(`aria-expanded`,`true`),this.openTitle=e,t&&this.items(r)[0]?.focus())}close(e=!0,t=`pick`){let n=this.openTitle;n&&(this.hide(e),t!==`pick`&&this.opts.onDismiss?.(n,t,this.tripMenus.size),this.tripMenus.clear())}hide(e){let t=this.openTitle;if(!t)return;let n=this.menuOf(t),r=!!n&&n.contains(this.root.ownerDocument.activeElement);this.closeSub(!1),n&&(n.hidden=!0),t.setAttribute(`aria-expanded`,`false`),this.openTitle=null,e&&r&&t.focus()}titleOf(e){return this.titleList.find(t=>t.getAttribute(`aria-controls`)===e.id)}menuOf(e){let t=e.getAttribute(`aria-controls`);return t?this.root.ownerDocument.getElementById(t):null}items(e){return[...e.querySelectorAll(j)].filter(t=>t.closest(`${P}, .mb-pop`)===e)}subOf(e){let t=e.getAttribute(`aria-controls`);return t?this.root.ownerDocument.getElementById(t):null}openSub(e,t){let n=this.subOf(e);n&&e.getAttribute(`aria-disabled`)!==`true`&&(this.openSubTitle&&this.openSubTitle!==e&&this.closeSub(!1),n.hidden=!1,A(n),e.setAttribute(`aria-expanded`,`true`),this.openSubTitle=e,t&&this.items(n)[0]?.focus())}closeSub(e){let t=this.openSubTitle;if(!t)return;let n=this.subOf(t);n&&(n.hidden=!0),t.setAttribute(`aria-expanded`,`false`),this.openSubTitle=null,e&&t.focus()}toggleSub(e,t){this.openSubTitle===e?this.closeSub(!0):this.openSub(e,t)}neighbor(e,t){let n=this.titleList.filter(M);return n[(n.indexOf(e)+t+n.length)%n.length]??e}titleKey(e,t){if(e.key===`ArrowRight`||e.key===`ArrowLeft`){let n=this.neighbor(t,e.key===`ArrowRight`?1:-1);n.focus(),this.openTitle&&this.open(n,!1)}else if(e.key===`ArrowDown`||e.key===`Enter`||e.key===` `)this.open(t,!0,`keys`);else if(e.key===`Escape`&&this.openTitle)this.close(!0,`escape`),t.focus();else return;e.preventDefault(),e.stopPropagation()}menuKey(e,t){let n=this.menuOf(t);if(!n)return;let r=this.root.ownerDocument.activeElement,i=!!this.openSubTitle&&!!r?.closest(P);if(i&&(e.key===`ArrowLeft`||e.key===`Escape`)){this.closeSub(!0),e.preventDefault(),e.stopPropagation();return}if(!i&&e.key===`ArrowRight`&&r?.matches(N)){this.openSub(r,!0),e.preventDefault(),e.stopPropagation();return}let a=i?this.subOf(this.openSubTitle)??n:n,o=this.items(a),s=o.indexOf(this.root.ownerDocument.activeElement),c=e=>o[(e+o.length)%o.length]?.focus();switch(e.key){case`ArrowDown`:c(s+1);break;case`ArrowUp`:c(s<0?-1:s-1);break;case`Home`:c(0);break;case`End`:c(-1);break;case`ArrowRight`:case`ArrowLeft`:{let n=this.neighbor(t,e.key===`ArrowRight`?1:-1);this.open(n,!0);break}case`Escape`:this.close(!0,`escape`),t.focus();break;case`Tab`:this.close(!1,`tab`);return;default:if(!this.pickByKey(o,e))return}e.preventDefault(),e.stopPropagation()}pickByKey(e,t){if(t.ctrlKey||t.altKey||t.metaKey||t.key.length!==1)return!1;let n=t.key.toLowerCase(),r=e.find(e=>e.querySelector(`u`)?.textContent?.toLowerCase()===n);return r?.click(),!!r}accelerator(e){if(e.defaultPrevented||!e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||e.key.length!==1||this.root.ownerDocument.querySelector(`dialog[open]`))return;let t=e.key.toLowerCase(),n=this.titleList.find(e=>M(e)&&e.querySelector(`u`)?.textContent?.toLowerCase()===t);n&&(e.preventDefault(),this.open(n,!0,`alt`))}};export{h as n,p as r,F as t};