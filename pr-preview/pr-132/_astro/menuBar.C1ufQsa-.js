import{i as e,n as t,r as n,t as r}from"./lit-html.Cnzry4jM.js";import{d as i,l as a,u as o}from"./schemeKey.kTKddGB9.js";import{a as s,n as c,o as l,r as u,t as d}from"./directive-helpers.CEf_-u1Z.js";var f=e=>e??r,p=(e,t,n)=>{let r=new Map;for(let i=t;i<=n;i++)r.set(e[i],i);return r},m=a(class extends o{constructor(e){if(super(e),e.type!==i.CHILD)throw Error(`repeat() can only be used in text expressions`)}dt(e,t,n){let r;n===void 0?n=t:t!==void 0&&(r=t);let i=[],a=[],o=0;for(let t of e)i[o]=r?r(t,o):o,a[o]=n(t,o),o++;return{values:a,keys:i}}render(e,t,n){return this.dt(e,t,n).values}update(e,[t,r,i]){let a=d(e),{values:o,keys:f}=this.dt(t,r,i);if(!Array.isArray(a))return this.ut=f,o;let m=this.ut??=[],h=[],g,_,v=0,y=a.length-1,b=0,x=o.length-1;for(;v<=y&&b<=x;)if(a[v]===null)v++;else if(a[y]===null)y--;else if(m[v]===f[b])h[b]=s(a[v],o[b]),v++,b++;else if(m[y]===f[x])h[x]=s(a[y],o[x]),y--,x--;else if(m[v]===f[x])h[x]=s(a[v],o[x]),l(e,h[x+1],a[v]),v++,x--;else if(m[y]===f[b])h[b]=s(a[y],o[b]),l(e,a[v],a[y]),y--,b++;else if(g===void 0&&(g=p(f,b,x),_=p(m,v,y)),g.has(m[v])){if(g.has(m[y])){let t=_.get(f[b]),n=t===void 0?null:a[t];if(n===null){let t=l(e,a[v]);s(t,o[b]),h[b]=t}else h[b]=s(n,o[b]),l(e,a[v],n),a[t]=null;b++}else c(a[y]),y--}else c(a[v]),v++;for(;b<=x;){let t=l(e,h[x+1]);s(t,o[b]),h[b++]=t}for(;v<=y;){let e=a[v++];e!==null&&c(e)}return this.ut=f,u(e,h),n}}),h=e=>e.popupId??`${e.id}-menu`,g=(e,t)=>t?`${e} ${t}`:e;function _({label:t,mnemonic:n}){return n===void 0||n<0||n>=t.length?t:e`${t.slice(0,n)}<u>${t[n]}</u>${t.slice(n+1)}`}var v=a(class extends o{constructor(){super(...arguments),this.keys=[]}render(e){return r}update(e,[t]){let n=t??{};for(let t of this.keys)t in n||e.element.removeAttribute(`data-${t}`);for(let[t,r]of Object.entries(n))e.element.setAttribute(`data-${t}`,r);return this.keys=Object.keys(n),r}});function y(t){return e`<hr class=${g(`mb-sep`,t.className)} id=${f(t.id)} ?hidden=${!!t.hidden} />`}var b=e=>e.disabled?r:e.onPick??r,x=e=>e.radio?`menuitemradio`:`menuitemcheckbox`;function S(t){let n=t.checked===void 0?`menuitem`:x(t),i=t.checked===void 0?r:String(t.checked),a=t.disabled?`true`:r,o=e`${t.content??_(t)}${t.shortcut?e`<kbd>${t.shortcut}</kbd>`:r}`;return t.href===void 0?e`<button
    type="button"
    role=${n}
    class=${g(`mb-item`,t.className)}
    id=${f(t.id)}
    title=${f(t.title)}
    aria-checked=${i}
    aria-disabled=${a}
    ?hidden=${!!t.hidden}
    @click=${b(t)}
    ${v(t.data)}
  >${o}</button>`:e`<a
      role=${n}
      class=${g(`mb-item`,t.className)}
      id=${f(t.id)}
      href=${t.href}
      target=${f(t.target)}
      rel=${f(t.rel)}
      title=${f(t.title)}
      aria-checked=${i}
      aria-disabled=${a}
      ?hidden=${!!t.hidden}
      @click=${b(t)}
      ${v(t.data)}
      >${o}</a
    >`}function C(t){let n=h(t);return e`<div class=${g(`mb-sub`,t.className)} role="none" ?hidden=${!!t.hidden}>
    <button
      type="button"
      role="menuitem"
      class="mb-item mb-sub-title"
      id=${t.id}
      aria-haspopup="menu"
      aria-expanded="false"
      aria-controls=${n}
      aria-disabled=${t.disabled?`true`:r}
    >${_(t)}</button>
    <div class="mb-pop mb-subpop" id=${n} role="menu" aria-labelledby=${t.id} hidden>
      ${t.items.map(w)}
    </div>
  </div>`}function w(e){return e.kind===`separator`?y(e):e.kind===`submenu`?C(e):S(e)}function T(t,n){let r=h(t);return e`<div class=${g(`mb-menu`,t.className)} ?hidden=${!!t.hidden}>
    <button
      type="button"
      class="mb-title"
      id=${t.id}
      aria-haspopup="menu"
      aria-expanded="false"
      aria-controls=${r}
      @click=${n.titleClick}
      @pointerenter=${n.titlePointerEnter}
      @keydown=${n.titleKeyDown}
    >${_(t)}</button>
    <div
      class="mb-pop"
      id=${r}
      role="menu"
      aria-labelledby=${t.id}
      hidden
      @keydown=${n.menuKeyDown}
      @click=${n.menuClick}
      @pointerdown=${n.menuPointerDown}
      @pointerover=${n.menuPointerOver}
    >
      ${t.items.map(w)}
    </div>
  </div>`}function E(t,n){return e`<nav id=${f(t.id)} class=${g(`menubar`,t.className)} aria-label=${t.label}>
    ${t.brand?e`<span class="menubar-brand" aria-hidden="true"></span>`:r}
    ${m(t.menus,e=>e.id,e=>T(e,n))}
  </nav>`}var D=1e3;function O(e){e.style.translate=``;let t=e.getBoundingClientRect(),n=t.right-e.ownerDocument.documentElement.clientWidth,r=Math.max(n>0?-n:0,-t.left);r!==0&&(e.style.translate=`${r}px 0`)}var k=`.mb-item:not([hidden]):not([aria-disabled='true'])`;function A(e){if(!e.isConnected||e.closest(`[hidden]`))return!1;let t=e.parentElement;return!t||t.ownerDocument.defaultView?.getComputedStyle(t).display!==`none`}var j=`.mb-sub-title`,M=`.mb-subpop`,N=class{constructor(e,t,n={}){this.root=e,this.opts=n,this.openTitle=null,this.openSubTitle=null,this.mouseDown=!1,this.swallowUntil=-1/0,this.tripMenus=new Set,this.titleList=[],this.unlisten=[],this.titleClick=e=>{let t=e.currentTarget;this.openTitle===t?this.close(!0,`title`):this.open(t,!1,e.detail===0?`keys`:`click`)},this.titlePointerEnter=e=>{let t=e.currentTarget;e.pointerType===`mouse`&&this.openTitle&&this.openTitle!==t&&this.open(t,!1)},this.titleKeyDown=e=>this.titleKey(e,e.currentTarget),this.menuKeyDown=e=>{let t=this.titleOf(e.currentTarget);t&&this.menuKey(e,t)},this.menuClick=e=>{let t=e.target instanceof Element?e.target.closest(`.mb-item`):null;t&&t.getAttribute(`aria-disabled`)!==`true`&&(t.matches(j)?this.mouseDown&&e.detail>0?this.openSub(t,!1):this.toggleSub(t,e.detail===0):this.close())},this.menuPointerDown=e=>{this.mouseDown=e.pointerType===`mouse`},this.menuPointerOver=e=>{if(e.pointerType!==`mouse`||!(e.target instanceof Element))return;let t=e.target.closest(`.mb-item`);t&&!t.closest(M)&&(t.matches(j)?this.openSub(t,!1):this.closeSub(!1))},this.render(t);let r=e.ownerDocument,i=r.defaultView,a=t=>!(t.target instanceof Node&&e.contains(t.target)),o=(e,t,n,r=!1)=>{e&&(e.addEventListener(t,n,r),this.unlisten.push(()=>e.removeEventListener(t,n,r)))};o(i,`pointerdown`,e=>{this.openTitle&&a(e)&&(this.close(!0,`outside`),this.swallowUntil=e.timeStamp+D,e.preventDefault(),e.stopPropagation())},!0);let s=e=>{e.timeStamp>this.swallowUntil||!a(e)||(e.type===`click`&&(this.swallowUntil=-1/0),e.preventDefault(),e.stopPropagation())};o(i,`pointerup`,s,!0),o(i,`click`,s,!0),n.altKeys!==!1&&o(r,`keydown`,e=>this.accelerator(e)),o(i,`blur`,()=>this.close(!0,`blur`))}dispose(){for(let e of this.unlisten.splice(0))e()}render(e){t(E(e,this),this.root),this.titleList=[...this.root.querySelectorAll(`.mb-title`)]}current(){return this.openTitle}browsed(){return this.tripMenus.size}open(e,t,n=`click`){let r=this.menuOf(e);r&&(this.openTitle&&this.openTitle!==e?this.hide(!1):this.openTitle||(this.tripMenus.clear(),this.opts.onTrip?.(e,n)),this.tripMenus.add(e),this.opts.onOpen?.(r),r.hidden=!1,O(r),e.setAttribute(`aria-expanded`,`true`),this.openTitle=e,t&&this.items(r)[0]?.focus())}close(e=!0,t=`pick`){let n=this.openTitle;n&&(this.hide(e),t!==`pick`&&this.opts.onDismiss?.(n,t,this.tripMenus.size),this.tripMenus.clear())}hide(e){let t=this.openTitle;if(!t)return;let n=this.menuOf(t),r=!!n&&n.contains(this.root.ownerDocument.activeElement);this.closeSub(!1),n&&(n.hidden=!0),t.setAttribute(`aria-expanded`,`false`),this.openTitle=null,e&&r&&t.focus()}titleOf(e){return this.titleList.find(t=>t.getAttribute(`aria-controls`)===e.id)}menuOf(e){let t=e.getAttribute(`aria-controls`);return t?this.root.ownerDocument.getElementById(t):null}items(e){return[...e.querySelectorAll(k)].filter(t=>t.closest(`${M}, .mb-pop`)===e)}subOf(e){let t=e.getAttribute(`aria-controls`);return t?this.root.ownerDocument.getElementById(t):null}openSub(e,t){let n=this.subOf(e);n&&e.getAttribute(`aria-disabled`)!==`true`&&(this.openSubTitle&&this.openSubTitle!==e&&this.closeSub(!1),n.hidden=!1,O(n),e.setAttribute(`aria-expanded`,`true`),this.openSubTitle=e,t&&this.items(n)[0]?.focus())}closeSub(e){let t=this.openSubTitle;if(!t)return;let n=this.subOf(t);n&&(n.hidden=!0),t.setAttribute(`aria-expanded`,`false`),this.openSubTitle=null,e&&t.focus()}toggleSub(e,t){this.openSubTitle===e?this.closeSub(!0):this.openSub(e,t)}neighbor(e,t){let n=this.titleList.filter(A);return n[(n.indexOf(e)+t+n.length)%n.length]??e}titleKey(e,t){if(e.key===`ArrowRight`||e.key===`ArrowLeft`){let n=this.neighbor(t,e.key===`ArrowRight`?1:-1);n.focus(),this.openTitle&&this.open(n,!1)}else if(e.key===`ArrowDown`||e.key===`Enter`||e.key===` `)this.open(t,!0,`keys`);else if(e.key===`Escape`&&this.openTitle)this.close(!0,`escape`),t.focus();else return;e.preventDefault(),e.stopPropagation()}menuKey(e,t){let n=this.menuOf(t);if(!n)return;let r=this.root.ownerDocument.activeElement,i=!!this.openSubTitle&&!!r?.closest(M);if(i&&(e.key===`ArrowLeft`||e.key===`Escape`)){this.closeSub(!0),e.preventDefault(),e.stopPropagation();return}if(!i&&e.key===`ArrowRight`&&r?.matches(j)){this.openSub(r,!0),e.preventDefault(),e.stopPropagation();return}let a=i?this.subOf(this.openSubTitle)??n:n,o=this.items(a),s=o.indexOf(this.root.ownerDocument.activeElement),c=e=>o[(e+o.length)%o.length]?.focus();switch(e.key){case`ArrowDown`:c(s+1);break;case`ArrowUp`:c(s<0?-1:s-1);break;case`Home`:c(0);break;case`End`:c(-1);break;case`ArrowRight`:case`ArrowLeft`:{let n=this.neighbor(t,e.key===`ArrowRight`?1:-1);this.open(n,!0);break}case`Escape`:this.close(!0,`escape`),t.focus();break;case`Tab`:this.close(!1,`tab`);return;default:if(!this.pickByKey(o,e))return}e.preventDefault(),e.stopPropagation()}pickByKey(e,t){if(t.ctrlKey||t.altKey||t.metaKey||t.key.length!==1)return!1;let n=t.key.toLowerCase(),r=e.find(e=>e.querySelector(`u`)?.textContent?.toLowerCase()===n);return r?.click(),!!r}accelerator(e){if(e.defaultPrevented||!e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||e.key.length!==1||this.root.ownerDocument.querySelector(`dialog[open]`))return;let t=e.key.toLowerCase(),n=this.titleList.find(e=>A(e)&&e.querySelector(`u`)?.textContent?.toLowerCase()===t);n&&(e.preventDefault(),this.open(n,!0,`alt`))}};export{m as n,f as r,N as t};