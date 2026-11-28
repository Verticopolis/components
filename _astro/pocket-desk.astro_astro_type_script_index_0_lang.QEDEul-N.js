import{a as e,s as t}from"./icons.DP79BUfy.js";import{f as n,p as r}from"./overviewMapInput.DmshDoDc.js";import{s as i,t as ee,u as a}from"./deskTaskbar.B-v1zGhI.js";import{E as o,a as s,d as c,f as l,i as u,l as d,n as f,o as p,t as m}from"./palette.DwIam8xR.js";import{t as h}from"./menuBar.C9uGgpit.js";import{i as g,n as _,t as v}from"./bars.Dmj1eZ5p.js";var y=`desk-touch`,b=`desk-pocket`,x=`desk-pocket-body`;function S(e){let[r]=n(e,t`<div class=${x}></div>`).elements;return r}var C=new Date(2026,10,15,9,15),w=`${`/`.replace(/\/?$/,`/`)}favicon.png`,te=`(max-width: 767px), (max-width: 1023px) and (max-height: 599px)`,ne=`(max-width: 1023px) and (max-height: 339.98px) and (orientation: landscape), (max-width: 539.98px) and (orientation: landscape)`,re=3,ie=1284500,T=e=>t`<section id="bulletin-win" class="win win-closable" aria-labelledby="bulletin-win-title" hidden>
    <div class="win-title">
      <span class="desk-title-text" id="bulletin-win-title">Bulletin</span
      ><button type="button" class="btn xs" aria-label="Close Bulletin" @click=${e}>×</button>
    </div>
    <div class="well g-pocket-news">
      <div>8:00 AM: the lobby opened.</div>
      <div>9:15 AM: an office tenant moved in.</div>
    </div>
  </section>`,E=e=>({label:`Sample Tower menu`,brand:!0,menus:[{id:`g-pocket-window`,label:`Window`,mnemonic:0,items:[{label:`Bulletin`,onPick:e}]}]});function D(x=document){let D=x.getElementById(`app`);if(!D)return;x.body.classList.add(`desk`,y,b);let{facts:O}=o(),k=x.defaultView,A=e=>k?.matchMedia(e)??null,j=i(x,`desk-win-tower`,`Sample Tower`,void 0,w),M=S(x),N;e(t`<div id="menubar-host" ${r(e=>e&&(N=e))}></div>
      ${M}`,j.body);let P=v,F,I,L,R=d(O),z=R.find(e=>e.title===`Halls of two heights`)??R[0],{w:B,h:V}=l(z);e(t`<header id="topbar" ${r(e=>e&&(F=e))}></header>
      <aside id="palette" class="win docked">
        <div class="win-title">Tools</div>
        <div
          class="palette-tabs"
          id="palette-tabs"
          role="tablist"
          aria-label="Build categories"
          ${r(e=>e&&(L=e))}
        ></div>
        <div class="palette-scroll" id="palette-scroll" ${r(e=>e&&(I=e))}></div>
      </aside>
      <section id="stage" class="g-pocket-stage">
        ${p(B,V,z.title,e=>c({ctx:e,lit:!0,anim:0,hour:19,parkingUse:.7,recycleFill:.66},z,O))}
      </section>`,M);let H=()=>e(g(P,{speed:e=>{P={...P,speed:e},H()},mute:()=>{P={...P,muted:!P.muted},H()}}),F);H();let U=`inspect`,W=new u({list:I,tabs:L,pinnedTitle:`Tools`,tabMedia:A(te),stripMedia:A(ne),pick:e=>{U=e.key,G()}}),G=()=>W.update({pinned:m,groups:f(re,ie),active:U});G();let K=n(x,T(()=>void(K.hidden=!0))).elements[0],q={tower:j.root,bulletin:K},J=()=>Q.show(`bulletin`);new h(N,E(J),{altKeys:!1});let Y=!0,X=new ee(x,{items:[{id:`bulletin`,label:`Bulletin`}],icon:w,now:()=>C,task:e=>Q.taskPressed(e),start:e=>e===`bulletin`&&J(),sound:()=>X.setSound(Y=!Y)}),Z;e(t`<div id="desk" class="desk-area" ${r(e=>e&&(Z=e))}>
        ${[j.root,K]}
      </div>
      ${X.root}`,D),X.start();let Q=new s({desk:Z,order:[`tower`,`bulletin`],places:(e,t)=>({tower:{x:0,y:0,w:e,h:t},bulletin:{x:0,y:0,w:e,h:t}}),refreshed:e=>X.render(e)}),$=(e,t,n={})=>({id:e,el:q[e],label:()=>t,icon:w,layer:`tool`,limits:null,canMax:!1,isOpen:()=>!q[e].hidden,...n});Q.add($(`tower`,`Sample Tower`,{layer:`app`,limits:a})),Q.add($(`bulletin`,`Bulletin`,{open:()=>void(K.hidden=!1),close:()=>void(K.hidden=!0)})),Q.start(),_(x)}D();