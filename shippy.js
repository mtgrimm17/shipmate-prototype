/* ============================================================
   SHIPPY — the guide panel's mascot, its bubbles and its chrome.

   Ported verbatim out of shipmate-nav-prototype.html. This is a
   self-contained renderer: the octopus is procedural SVG driven by one
   requestAnimationFrame loop, and OCTO.mount(host) is the only entry point.

   Why its own file rather than app.js: it is ~250 lines that nothing else
   touches, it must not be re-initialised on every render, and keeping it
   isolated means a future swap of the mascot changes one file.

   NOTE — there are now two octopuses in this repo. This procedural SVG one
   drives the guide panel; the layered DOM/CSS one in index.html drives the
   splash. They are separate implementations of the same character and should
   be reconciled at some point; doing it now would mean redoing the splash.

   Loaded before render.js and app.js, which call OCTO.mount(), applyMascot(),
   bubbleLoop() and SM_HEAD.
   ============================================================ */


const OCTO=(()=>{
  const D={"v":3,"P":{"sway":10,"speed":1.25,"bob":9,"squash":0,"armW":26,"armLen":0.64,"count":5,"handles":3,"opacity":1,"armColor":"#a563f3","suckColor":"#D6B4F5","grain":0.07,"grainSize":0.8,"blink":true,"suckPairs":1,"suckCount":3,"suckSize":0.24,"suckFrom":0.52,"suckTo":0.84,"suckOffset":0,"bobFreq":0.24,"grainMask":false},"head":{"anchorX":77,"anchorY":197,"anchorRise":0,"fan":44,"pivotY":240,"parts":[{"rot":0,"op":1,"clip":false,"blink":false,"name":"manto","type":"semi","x":0,"y":212,"r":101,"color":"#a563f3"},{"rot":0,"op":1,"clip":false,"blink":false,"name":"tronco","type":"capsule","x":0,"y":-7,"r":106,"w":305,"h":305,"color":"#9a43f7"},{"name":"noggin","type":"circle","x":0,"y":-52,"rot":0,"op":1,"clip":false,"blink":false,"color":"#a563f3","r":158,"clipTo":1},{"rot":0,"op":1,"clip":false,"blink":false,"name":"boca","type":"arc","x":0,"y":167,"r":34,"w":17,"spread":110,"color":"#610e76"},{"rot":0,"op":1,"clip":false,"blink":false,"name":"Reborde ojo izq","type":"circle","x":-70,"y":118,"r":65,"color":"#9a43f7"},{"name":"circle","type":"circle","x":-70,"y":118,"rot":0,"op":1,"clip":false,"blink":false,"color":"#FFFFFF","r":53},{"rot":0,"op":1,"clip":false,"blink":true,"name":"pupila izq","type":"circle","x":-70,"y":118,"r":30,"color":"#0C1226"},{"rot":0,"op":1,"clip":false,"blink":true,"name":"brillo izq","type":"circle","x":-64,"y":111,"r":11,"color":"#FFFFFF"},{"rot":0,"op":1,"clip":false,"blink":false,"name":"Reborde ojo derecho","type":"circle","x":70,"y":118,"r":65,"color":"#9a43f7"},{"name":"circle","type":"circle","x":70,"y":118,"rot":0,"op":1,"clip":false,"blink":false,"color":"#FFFFFF","r":53},{"rot":0,"op":1,"clip":false,"blink":true,"name":"pupila der","type":"circle","x":70,"y":118,"r":30,"color":"#0C1226"},{"rot":0,"op":1,"clip":false,"blink":true,"name":"brillo der","type":"circle","x":82,"y":111,"r":11,"color":"#FFFFFF"},{"name":"star","type":"star","x":0,"y":-10,"rot":0,"op":1,"clip":false,"blink":false,"color":"#d392f7","r":76,"round":1}]},"symmetry":true,"suckersOn":false,"arms":[{"u":-1,"keys":[3.526,5.591,18.584,16.728]},{"u":-0.5,"keys":[-0.876,-0.682,-0.713,-0.697]},{"u":0,"keys":[0,0,0,0]},{"u":0.5,"keys":[0.876,0.682,0.713,0.697]},{"u":1,"keys":[-3.526,-5.591,-18.584,-16.728]}]};
  const NS='http://www.w3.org/2000/svg', DEG=Math.PI/180;
  const cl=(v,a,b)=>v<a?a:v>b?b:v;
  const f=v=>Math.round(v*100)/100, fs=v=>Math.round(v*100000)/100000;
  const svgEl=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;};

  const R={joints:14,cx:450,cy:230,waveLen:.40,tipBias:1.5,phaseStep:.55,squashPhase:-90*DEG};
  const P=D.P, head=D.head;
  const VB='192 5 515 659';                   // bbox medido + 6px de margen

  /* ---- brazos: perfil de curvatura → cadena de puntos ---- */
  function crEval(k,u){
    const m=k.length-1, x=cl(u,0,1)*m, i=Math.min(Math.floor(x),m-1), t=x-i;
    const p0=k[Math.max(i-1,0)],p1=k[i],p2=k[i+1],p3=k[Math.min(i+2,m)];
    const t2=t*t,t3=t2*t;
    return .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3);
  }
  const keysToRest=keys=>{
    const N=R.joints,r=new Array(N);
    for(let i=0;i<N;i++) r[i]=cl(crEval(keys,(i+.5)/N),-34*DEG,34*DEG);
    return r;
  };
  const arms=D.arms.map(a=>({u:a.u, rest:keysToRest(a.keys.map(v=>v*DEG))}));
  const segLen=()=>22*P.armLen;
  const anchorLocal=u=>({x:head.anchorX*u, y:head.anchorY-head.anchorRise*Math.abs(u)});
  const baseAngle=u=>Math.PI/2-u*head.fan*DEG;

  const headState=t=>{
    const ph=2*Math.PI*P.bobFreq*t, bob=Math.sin(ph)*P.bob;
    const sy=1+P.squash*Math.sin(ph+R.squashPhase);
    return {cx:R.cx, cy:R.cy+bob, sx:1/sy, sy, pY:head.pivotY,
            blink:(P.blink && (t%4.8)<0.12)?0.08:1};
  };
  const toWorld=(p,H)=>({x:H.cx+p.x*H.sx, y:H.cy+H.pY+(p.y-H.pY)*H.sy});

  function solve(arm,base,ang0,t){
    const N=R.joints, pts=[{x:base.x,y:base.y}];
    let x=base.x,y=base.y,ang=ang0,L=segLen();
    for(let i=0;i<N;i++){
      const env=Math.pow(i/(N-1),R.tipBias);
      ang+=arm.rest[i]+P.sway*DEG*env*Math.sin(2*Math.PI*.3*t-R.waveLen*i+arm.u*R.phaseStep*Math.PI);
      x+=Math.cos(ang)*L; y+=Math.sin(ang)*L; pts.push({x,y});
    }
    return pts;
  }

  /* ---- piezas de la cabeza → path ---- */
  function partD(p){
    switch(p.type){
      case 'circle':
        return `M ${f(p.x-p.r)} ${f(p.y)} a ${f(p.r)} ${f(p.r)} 0 1 0 ${f(2*p.r)} 0 a ${f(p.r)} ${f(p.r)} 0 1 0 ${f(-2*p.r)} 0 Z`;
      case 'semi':
        return `M ${f(p.x-p.r)} ${f(p.y)} A ${f(p.r)} ${f(p.r)} 0 0 1 ${f(p.x+p.r)} ${f(p.y)} Z`;
      case 'capsule':{
        const w=p.w||p.r*2,h=p.h||p.r*2,rr=Math.min(w,h)/2,x=p.x-w/2,y=p.y-h/2;
        return `M ${f(x+rr)} ${f(y)} H ${f(x+w-rr)} A ${f(rr)} ${f(rr)} 0 0 1 ${f(x+w-rr)} ${f(y+h)} `
             + `H ${f(x+rr)} A ${f(rr)} ${f(rr)} 0 0 1 ${f(x+rr)} ${f(y)} Z`;
      }
      case 'star':{
        const R0=p.r, vf=(p.valley==null?0.45:p.valley);
        const at=(a,rad)=>({x:p.x+Math.cos(a)*rad, y:p.y+Math.sin(a)*rad});
        const tips=[0,1,2,3].map(k=>at(-Math.PI/2+k*Math.PI/2,R0));
        const vals=[0,1,2,3].map(k=>at(-Math.PI/4+k*Math.PI/2,R0*vf));
        let TR=(p.round||0)*0.49, VR=(p.vround||0)*0.49;
        const sum=TR+VR; if(sum>0.95){TR*=0.95/sum;VR*=0.95/sum;}
        const back=(from,to,frac)=>{
          const dx=to.x-from.x,dy=to.y-from.y,d=Math.hypot(dx,dy)||1,l=frac*d;
          return {x:from.x+dx/d*l, y:from.y+dy/d*l};
        };
        const A=[],B=[],VA=[],VB=[];
        for(let k=0;k<4;k++){
          A[k]=back(tips[k],vals[(k+3)%4],TR); B[k]=back(tips[k],vals[k],TR);
          VA[k]=back(vals[k],tips[k],VR);      VB[k]=back(vals[k],tips[(k+1)%4],VR);
        }
        let d=`M ${f(A[0].x)} ${f(A[0].y)}`;
        for(let k=0;k<4;k++){
          d+=` Q ${f(tips[k].x)} ${f(tips[k].y)} ${f(B[k].x)} ${f(B[k].y)}`;
          d+=` L ${f(VA[k].x)} ${f(VA[k].y)}`;
          d+=` Q ${f(vals[k].x)} ${f(vals[k].y)} ${f(VB[k].x)} ${f(VB[k].y)}`;
          d+=` L ${f(A[(k+1)%4].x)} ${f(A[(k+1)%4].y)}`;
        }
        return d+' Z';
      }
      case 'arc':{
        const sp=(p.spread||110)*DEG, a0=Math.PI/2-sp/2, a1=Math.PI/2+sp/2;
        return `M ${f(p.x+Math.cos(a0)*p.r)} ${f(p.y+Math.sin(a0)*p.r)} `
             + `A ${f(p.r)} ${f(p.r)} 0 ${sp>Math.PI?1:0} 1 ${f(p.x+Math.cos(a1)*p.r)} ${f(p.y+Math.sin(a1)*p.r)}`;
      }
    }
    return '';
  }
  const partRot=p=>p.rot?`rotate(${f(p.rot)} ${f(p.x)} ${f(p.y)})`:'';
  const clipTarget=(p,i)=>
    (Number.isInteger(p.clipTo)&&p.clipTo>=0&&p.clipTo<head.parts.length&&p.clipTo!==i) ? p.clipTo
    : (p.clip&&i>0) ? i-1 : -1;

  /* ---- cinta del brazo ---- */
  function cr(p,move){
    let d=(move===false?'L ':'M ')+f(p[0].x)+' '+f(p[0].y);
    for(let i=0;i<p.length-1;i++){
      const p0=p[i-1]||p[i],p1=p[i],p2=p[i+1],p3=p[i+2]||p[i+1];
      d+=` C ${f(p1.x+(p2.x-p0.x)/6)} ${f(p1.y+(p2.y-p0.y)/6)} `
        +`${f(p2.x-(p3.x-p1.x)/6)} ${f(p2.y-(p3.y-p1.y)/6)} ${f(p2.x)} ${f(p2.y)}`;
    }
    return d;
  }
  function ribbon(pts,w){
    const A=[],B=[];
    for(let i=0;i<pts.length;i++){
      const p=pts[i]; let tx,ty;
      if(i===0){tx=pts[1].x-p.x;ty=pts[1].y-p.y;}
      else if(i===pts.length-1){tx=p.x-pts[i-1].x;ty=p.y-pts[i-1].y;}
      else {tx=pts[i+1].x-pts[i-1].x;ty=pts[i+1].y-pts[i-1].y;}
      const d=Math.hypot(tx,ty)||1,nx=-ty/d,ny=tx/d;
      A.push({x:p.x+nx*w,y:p.y+ny*w}); B.push({x:p.x-nx*w,y:p.y-ny*w});
    }
    B.reverse();
    return cr(A)+` A ${f(w)} ${f(w)} 0 0 0 ${f(B[0].x)} ${f(B[0].y)} `+cr(B,false)+' Z';
  }

  /* ---- escena, una sola vez ---- */
  let svg=null, armNodes=[], partNodes=[], headG=null, headInner=null, partBaseT=[];
  let lastPartT=[], lastBobT='', lastSqT='', t=0, prev=0, raf=0;

  function grainURL(){
    const S=180,c=document.createElement('canvas'); c.width=c.height=S;
    const ctx=c.getContext('2d'); if(!ctx) return '';
    const img=ctx.createImageData(S,S),d=img.data;
    for(let i=0;i<S*S;i++){const v=Math.random()*255; d[i*4]=d[i*4+1]=d[i*4+2]=v; d[i*4+3]=255;}
    ctx.putImageData(img,0,0);
    return c.toDataURL();
  }

  function build(){
    svg=svgEl('svg',{viewBox:VB,'aria-hidden':'true',preserveAspectRatio:'xMidYMid meet'});
    const defs=svgEl('defs',{});
    const figure=svgEl('g',{id:'octo-figure',opacity:P.opacity});
    const armsL=svgEl('g',{}), headL=svgEl('g',{});
    figure.appendChild(armsL); figure.appendChild(headL);

    armNodes=arms.map(()=>{
      const g=svgEl('g',{}), body=svgEl('path',{fill:P.armColor});
      g.appendChild(body); armsL.appendChild(g); return {body};
    });
    headG=svgEl('g',{}); headInner=svgEl('g',{});
    headG.appendChild(headInner); headL.appendChild(headG);

    partNodes=head.parts.map((p,i)=>{
      const node = p.type==='arc'
        ? svgEl('path',{d:partD(p),fill:'none',stroke:p.color,'stroke-width':p.w||16,'stroke-linecap':'round'})
        : svgEl('path',{d:partD(p),fill:p.color});
      partBaseT[i]='';
      node.setAttribute('opacity', p.op==null?1:p.op);
      const ti=clipTarget(p,i);
      if(ti>=0){
        const tp=head.parts[ti], cid='octoclip'+i, cp=svgEl('clipPath',{id:cid});
        const sh=svgEl('path',{d:partD(tp)});
        if(partRot(tp)) sh.setAttribute('transform',partRot(tp));
        cp.appendChild(sh); defs.appendChild(cp);
        node.setAttribute('clip-path','url(#'+cid+')');
      }
      headInner.appendChild(node);
      return node;
    });

    svg.appendChild(defs); svg.appendChild(figure);

    /* grano: recortado a la silueta, para no manchar el hueco del recuadro */
    if(P.grain>0.005){
      const url=grainURL();
      if(url){
        const pat=svgEl('pattern',{id:'octoGrain',patternUnits:'userSpaceOnUse',
          width:180,height:180,patternTransform:'scale('+f(P.grainSize)+')'});
        pat.appendChild(svgEl('image',{href:url,width:180,height:180,preserveAspectRatio:'none'}));
        const mask=svgEl('mask',{id:'octoMask',style:'mask-type:alpha'});
        mask.appendChild(svgEl('use',{href:'#octo-figure'}));
        defs.appendChild(pat); defs.appendChild(mask);
        const g=svgEl('g',{mask:'url(#octoMask)',style:'mix-blend-mode:overlay',opacity:f(P.grain*0.55)});
        const vb=VB.split(' ');
        g.appendChild(svgEl('rect',{x:vb[0],y:vb[1],width:vb[2],height:vb[3],fill:'url(#octoGrain)'}));
        svg.appendChild(g);
      }
    }
    draw();
  }

  function draw(){
    const H=headState(t);
    const bobT=`translate(${f(H.cx)} ${f(H.cy+H.pY)})`;
    if(bobT!==lastBobT){ lastBobT=bobT; headG.setAttribute('transform',bobT); }
    const sqT=(H.sx===1&&H.sy===1) ? `translate(0 ${f(-H.pY)})`
              : `scale(${fs(H.sx)} ${fs(H.sy)}) translate(0 ${f(-H.pY)})`;
    if(sqT!==lastSqT){ lastSqT=sqT; headInner.setAttribute('transform',sqT); }

    head.parts.forEach((p,i)=>{
      const ops=[];
      if(p.rigid&&(H.sx!==1||H.sy!==1))
        ops.push(`translate(${f(p.x)} ${f(p.y)}) scale(${fs(1/H.sx)} ${fs(1/H.sy)}) translate(${f(-p.x)} ${f(-p.y)})`);
      if(p.rot) ops.push(partRot(p));
      if(p.blink&&H.blink!==1)
        ops.push(`translate(0 ${f(p.y*(1-H.blink))}) scale(1 ${fs(H.blink)})`);
      if(partBaseT[i]) ops.push(partBaseT[i]);
      const tr=ops.join(' ');
      if(tr===lastPartT[i]) return;
      lastPartT[i]=tr;
      if(tr) partNodes[i].setAttribute('transform',tr); else partNodes[i].removeAttribute('transform');
    });

    arms.forEach((arm,i)=>{
      const base=toWorld(anchorLocal(arm.u),H);
      armNodes[i].body.setAttribute('d',ribbon(solve(arm,base,baseAngle(arm.u),t),P.armW));
    });
  }

  function loop(now){
    const dt=Math.min(0.05,(now-prev)/1000); prev=now;
    if(svg&&svg.isConnected){ t+=dt*P.speed; draw(); }
    raf=requestAnimationFrame(loop);
  }

  return {
    /* el nodo es siempre el mismo: appendChild lo traslada al panel recién
       pintado y la animación no se reinicia en cada render */
    mount(host){
      if(!host) return;
      if(!svg) build();
      if(svg.parentNode!==host) host.appendChild(svg);
      if(!raf && typeof requestAnimationFrame==='function'){
        prev=(typeof performance!=='undefined'?performance.now():Date.now());
        raf=requestAnimationFrame(loop);
      }
    }
  };
})();

const CHEV='<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4 L6 8 L10 4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const BUBBLES=[
  {size:11, opacity:.85, dx:4,   rise:62, dur:1050, delay:0},
  {size:8,  opacity:.60, dx:23,  rise:52, dur:1200, delay:100},
  {size:6,  opacity:.45, dx:-11, rise:42, dur:1350, delay:190},
];
function blowBubbles(){
  const host=document.querySelector('.sm-bubbles');
  if(!host) return;
  const jx=(Math.random()-.5)*18;
  const wrap=document.createElement('div');
  wrap.style.cssText='position:absolute;bottom:0;pointer-events:none;'
    +'right:calc(var(--mascot-x) + '+(14+jx).toFixed(1)+'px)';
  host.appendChild(wrap);
  BUBBLES.forEach(b=>{
    const s=document.createElement('span'), j=(Math.random()-.5)*10;
    s.style.cssText='position:absolute;display:block;background:var(--octo-body);opacity:0'
      +';bottom:'+(-b.size/2)+'px;right:'+(b.dx+j-b.size/2).toFixed(1)+'px'
      +';width:'+b.size+'px;height:'+b.size+'px'
      +';border-radius:'+Math.round(b.size*.28)+'px';
    wrap.appendChild(s);
    if(s.animate) s.animate([
      {transform:'translateY(0) scale(.4)',                  opacity:0},
      {transform:`translateY(-${b.rise*.25}px) scale(1)`,    opacity:b.opacity, offset:.18},
      {transform:`translateY(-${b.rise}px) scale(.9)`,       opacity:0},
    ],{duration:b.dur, delay:b.delay, easing:'cubic-bezier(.1,.75,.25,1)', fill:'forwards'});
  });
  setTimeout(()=>wrap.remove(),2400);
}
/* «de vez en cuando»: la pausa entre tiradas es aleatoria, y solo salen
   mientras el panel está plegado (que es cuando existe el carril) */
function bubbleLoop(){
  const tick=()=>{
    blowBubbles();
    setTimeout(tick, 2400+Math.random()*3600);
  };
  setTimeout(tick, 900+Math.random()*1400);
}

/* Tinte de la variante 8: mezcla el gris #1D1D1D con el #66617A del panel de

/* ---- mascot placement: scale, offset and which corner it peeks from ---- */
const mascot={w:83,x:26,y:-73,anchor:'tr'};
function applyMascot(){
  const r=document.documentElement.style;
  r.setProperty('--mascot-w',mascot.w+'px');
  r.setProperty('--mascot-x',mascot.x+'px');
  r.setProperty('--mascot-y',mascot.y+'px');
  document.querySelectorAll('.sm-wrap').forEach(w=>w.dataset.anchor=mascot.anchor);
}

/* The prototype's SM_HEAD, with one change: the id is gone.
   This repo wraps three views (details, broadcast, performance), so anything
   carrying an id here would exist three times over and getElementById would
   always return the copy belonging to whichever view sits first in the DOM.
   The class was already there; everything now queries by class, scoped to the
   active view. */
const SM_HEAD='<div class="sm-titlerow"><span class="sm-title">Shippy guide</span><span class="sm-toggle" title="Collapse">'+CHEV+'</span></div>';
