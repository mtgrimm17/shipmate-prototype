/* ============================================================
   SHIPPY VIVO — the guide panel's octopus, alive.

   Replaces the flat PNG (body + two static tentacle PNGs) with the SVG rig
   from Jaco's editor. The rig, its numbers, its poses and its gestures are
   cut LITERALLY from `shippy-live.html`, which is where they were tuned and
   tested. Two rules carried over from that file and not to be broken:

     1. NEVER `letter-spacing`. Anywhere, ever.
     2. NO MEASUREMENT IS INVENTED. Pieces, radii, colours, poses and gestures
        are the editor's (pulpo-poses-3.html). The three numbers in FIT come
        from measuring the PNG this replaces.

   WHAT THIS FILE CHANGES ABOUT THAT SOURCE, and it is only ever structure:

   · IT IS AN IIFE. The test bench is a bare page and declares `build`, `draw`,
     `step`, `el`, `f`, `clamp`, `arms`, `host`, `nodes`, `R`, `blink`… at the
     top level. Every one of those names is already taken in this app, several
     of them load-bearing (`el`, `clamp`, `f`). One module, one export, the
     same shape OCTO already has next door in shippy.js.

   · THE NODE IS OWNED AND RE-PARENTED, not rebuilt. `renderGuide()` throws the
     column away with innerHTML on every tab change, so `document.getElementById`
     at parse time would find nothing and a rebuild per render would be a fresh
     octopus every time. `mount(hostEl)` moves the one SVG into the new host —
     OCTO's answer, and the reason all the rig's state lives in these closures
     rather than in the DOM.

   · NO ID. The test bench mounts on `#shippy`. This repo renders the guide
     from two call sites and wraps three views, which is why shippy.js's own
     note says an id here would exist more than once; `mount()` is handed the
     node instead.

   · THE BOB IS `element.animate()` WITH `startTime = 0`, not the recipe's CSS
     keyframe. Same movement, same 4.17s, same `--sh-bob` — but a CSS animation
     on a node that has just been re-parented restarts at 0%, which is exactly
     the jump `shippyBreathe()` was written to kill. One shared document clock
     puts every remount at the same phase by definition.

   · The "near" zone reads `.app-guide` (this app's panel) rather than `#guide`.

   Everything else — 14 pieces, 5 arms, the click ladder, the tantrum, the
   boredom, the gaze, the bubbles, the blup — is the source, unaltered.
   ============================================================ */

const SHIPPY_LIVE = (() => {

/* ═══════════════════════════════════════════════════════════════════
   El rig, copiado del editor (pulpo-piezas-37.html) sin tocar un número:
   las piezas, sus coordenadas, sus radios y sus colores son los suyos.
   ═══════════════════════════════════════════════════════════════════ */

const RIG = [
  {name:"manto",              type:"semi",    x:  0, y:212, r:101, color:"#a563f3"},
  {name:"tronco",             type:"capsule", x:  0, y: -7, r:106, w:305, h:305, color:"#a563f3"},
  {name:"noggin",             type:"circle",  x:  0, y:-52, r:158, color:"#a563f3", clipTo:1},
  /* Semicírculo que sube por encima del nacimiento de los brazos para
     taparlo: sin él se ve dónde se enchufan. Va onTop, o sea se pinta
     DESPUÉS de los brazos, y su borde recto queda por debajo de la boca. */
  {name:"faldón",             type:"semi",    x:  0, y:284, r: 88, color:"#a563f3", onTop:true},
  {name:"boca",               type:"arc",     x:  0, y:167, r: 34, w:17, spread:110, color:"#0c1226", onTop:true},
  {name:"Reborde ojo izq",    type:"circle",  x:-70, y:118, r: 65, color:"#a563f3"},
  {name:"blanco izq",         type:"circle",  x:-70, y:118, r: 53, color:"#FFFFFF"},
  {name:"pupila izq",         type:"circle",  x:-70, y:118, r: 30, color:"#0C1226", blink:true, gaze:true},
  {name:"brillo izq",         type:"circle",  x:-64, y:111, r: 11, color:"#FFFFFF",  blink:true, gaze:true},
  {name:"Reborde ojo derecho",type:"circle",  x: 70, y:118, r: 65, color:"#a563f3"},
  {name:"blanco der",         type:"circle",  x: 70, y:118, r: 53, color:"#FFFFFF"},
  {name:"pupila der",         type:"circle",  x: 70, y:118, r: 30, color:"#0C1226", blink:true, gaze:true},
  {name:"brillo der",         type:"circle",  x: 76, y:111, r: 11, color:"#FFFFFF",  blink:true, gaze:true},
  {name:"star",               type:"star",    x:  0, y: 16, r: 69, color:"#d392f7", round:1, vround:0.38, valley:0.4},
];

/* El encaje entre el rig y el espacio del PNG. No es un número inventado:
   sale de tres medidas del propio shippy-body.png, y las tres coinciden.
     · los blancos de los ojos están a 193,2px de distancia → 193,2/140 = 1,380
     · cada blanco mide 146px de diámetro             → 146/106 = 1,377
     · el ancho máximo de la cabeza son 424px         → 424/305 = 1,390
   Con escala 1,38 y centro (255,9 · 219,6), la coronilla cae en y=0, que es
   exactamente donde arranca el alfa del PNG. */
const FIT = { s:1.38, cx:255.9, cy:219.6 };

const AIR = 300;          // aire sobre la cabeza, en unidades del lienzo
const DEG = Math.PI/180;
const f = n => Math.round(n*100)/100;

/* ---- piezas → geometría. Portado literal del editor ---- */
function partD(p){
  switch(p.type){
    case "circle":
      return `M ${f(p.x-p.r)} ${f(p.y)} a ${f(p.r)} ${f(p.r)} 0 1 0 ${f(2*p.r)} 0 a ${f(p.r)} ${f(p.r)} 0 1 0 ${f(-2*p.r)} 0 Z`;
    case "semi":
      return `M ${f(p.x-p.r)} ${f(p.y)} A ${f(p.r)} ${f(p.r)} 0 0 1 ${f(p.x+p.r)} ${f(p.y)} Z`;
    case "capsule":{
      const w=p.w||p.r*2, h=p.h||p.r*2, rr=Math.min(w,h)/2;
      const x=p.x-w/2, y=p.y-h/2;
      return `M ${f(x+rr)} ${f(y)} H ${f(x+w-rr)} A ${f(rr)} ${f(rr)} 0 0 1 ${f(x+w-rr)} ${f(y+h)} `
           + `H ${f(x+rr)} A ${f(rr)} ${f(rr)} 0 0 1 ${f(x+rr)} ${f(y)} Z`;
    }
    case "star":{
      const R0=p.r, vf=(p.valley==null?0.45:p.valley);
      const at=(a,rad)=>({x:p.x+Math.cos(a)*rad, y:p.y+Math.sin(a)*rad});
      const tips=[0,1,2,3].map(k=>at(-Math.PI/2+k*Math.PI/2, R0));
      const vals=[0,1,2,3].map(k=>at(-Math.PI/4+k*Math.PI/2, R0*vf));
      let TR=(p.round||0)*0.49, VR=(p.vround||0)*0.49;
      const sum=TR+VR; if(sum>0.95){ TR*=0.95/sum; VR*=0.95/sum; }
      const back=(from,to,frac)=>{
        const dx=to.x-from.x, dy=to.y-from.y, d=Math.hypot(dx,dy)||1, l=frac*d;
        return {x:from.x+dx/d*l, y:from.y+dy/d*l};
      };
      const A=[],B=[],VA=[],VB=[];
      for(let k=0;k<4;k++){
        A[k]=back(tips[k], vals[(k+3)%4], TR);
        B[k]=back(tips[k], vals[k], TR);
        VA[k]=back(vals[k], tips[k], VR);
        VB[k]=back(vals[k], tips[(k+1)%4], VR);
      }
      let d=`M ${f(A[0].x)} ${f(A[0].y)}`;
      for(let k=0;k<4;k++){
        d+=` Q ${f(tips[k].x)} ${f(tips[k].y)} ${f(B[k].x)} ${f(B[k].y)}`;
        d+=` L ${f(VA[k].x)} ${f(VA[k].y)}`;
        d+=` Q ${f(vals[k].x)} ${f(vals[k].y)} ${f(VB[k].x)} ${f(VB[k].y)}`;
        d+=` L ${f(A[(k+1)%4].x)} ${f(A[(k+1)%4].y)}`;
      }
      return d+" Z";
    }
    case "arc":{
      const s=(p.spread||110)*DEG, a0=Math.PI/2-s/2, a1=Math.PI/2+s/2;
      return `M ${f(p.x+Math.cos(a0)*p.r)} ${f(p.y+Math.sin(a0)*p.r)} `
           + `A ${f(p.r)} ${f(p.r)} 0 ${s>Math.PI?1:0} 1 ${f(p.x+Math.cos(a1)*p.r)} ${f(p.y+Math.sin(a1)*p.r)}`;
    }
  }
  return "";
}

/* ═══ LOS BRAZOS ═══════════════════════════════════════════════════
   Portado del editor sin cambiar un número. Un brazo no es un dibujo: es
   una cadena de 14 articulaciones con un perfil de curvatura (la «pose»)
   interpolado desde 4 claves, más una onda que recorre la cadena de la base
   a la punta. El contorno se saca engordando esa cadena a un lado y a otro.
   Los brazos viven en el MISMO espacio local que las piezas de la cabeza,
   así que el FIT de arriba los coloca igual y enganchan solos. */
const R = { joints:14, hook:9*DEG, mid:2*DEG,
            waveLen:0.40, tipBias:1.5, phaseStep:0.55 };
const AP = { sway:10, speed:1.25, armW:26, armLen:0.64, count:5, handles:3,
             suckPairs:1, suckCount:3, suckSize:0.49, suckFrom:0.61, suckTo:0.96,
             suckOffset:0, armColor:"#a563f3", suckColor:"#d392f7",
             sideLen:1.35, waveLift:1 };
const HEAD = { anchorX:77, anchorY:197, anchorRise:0, fan:44, pivotY:240 };
/* El par externo es más largo que el resto: son los brazos con los que el
   bicho se apoya y saluda, y con la longitud de los de dentro se quedaban
   cortos. Multiplica sólo a |u|>0,75. */
const armLenMul = arm => Math.abs(arm.u)>0.75 ? AP.sideLen : 1;
/* Tres poses de reposo, en grados. Los tres brazos centrales no cambian
   nunca —son los que quedan tapados por el faldón—; sólo varían los dos
   laterales, que son los que se ven asomar por el panel. */
const CENTRO = {"-0.5":[-0.876,-0.682,-0.713,-0.697], "0":[0,0,0,0], "0.5":[0.876,0.682,0.713,0.697]};
const POSES = {
  A:{ label:"Izq. abajo",  "-1":[-3,-3.5,-3.5,-3],            "1":[-3.526,-5.591,-18.584,-16.728] },
  B:{ label:"Ambos abajo", "-1":[-3,-3.5,-3.5,-3],            "1":[3,3.5,3.5,3] },
  C:{ label:"Gancho",      "-1":[3.526,5.591,18.584,16.728],  "1":[-3.526,-5.591,-18.584,-16.728] }
};
let POSE="A";
function poseFor(u){
  const k=(+u.toFixed(3)).toString();
  const p=POSES[POSE];
  return (k in p) ? p[k] : CENTRO[k];
}

/* SALUDAR, literal del GESTURES del editor: el brazo derecho (u=1) va a un
   perfil de curvatura negativa —se abre hacia fuera y sube por el lateral,
   la punta acaba lejos de la cara—, se contrae al 82% para que no sobre
   brazo, y de la mitad hacia la punta oscila a 2,2 Hz con 16° de amplitud. */
/* Recalibrado en el rig nuevo para despejar la cara: el brazo sube por fuera
   y la punta queda a 124px sobre la base, con 26px de holgura respecto a los
   ojos y la boca incluso en el extremo de la oscilación hacia dentro. */
const GEST_WAVE = { dur:2.6, hold:[0.22,0.78], keys:[-10,-14,-10,-8],
                    shrink:0.95, wave:{amp:8, freq:2.2, from:0.5} };
let waveArm=-1, waveT0=0;
function waveSpec(){
  if(waveArm<0) return null;
  const elapsed=(performance.now()-waveT0)/1000, u=elapsed/GEST_WAVE.dur;
  if(u>=1){ waveArm=-1; return null; }
  const [a,b]=GEST_WAVE.hold;
  const w = u<a ? easeInOut(clamp(u/a,0,1))
                : (u<b ? 1 : easeInOut(clamp((1-u)/(1-b),0,1)));
  return {w, el:elapsed};
}

const segLen = () => 22*AP.armLen*shrink;
const segLenOf = arm => segLen()*armLenMul(arm);
let shrink = 1;

/* Girar la cabeza. El giro pasa por el pivote del cuello, no por el centro
   del dibujo, y —esto es lo importante— los anclajes de los brazos giran con
   él: si no, la cabeza se sacude y los brazos se quedan sueltos en el aire. */
let headRot = 0;
function spin(pt){
  if(!headRot) return pt;
  const a=headRot*DEG, c=Math.cos(a), s2=Math.sin(a), dy=pt.y-HEAD.pivotY;
  return {x:pt.x*c - dy*s2, y:HEAD.pivotY + pt.x*s2 + dy*c};
}
const anchorLocal = u => ({x:HEAD.anchorX*u, y:HEAD.anchorY-HEAD.anchorRise*Math.abs(u)});
const baseAngle  = u => Math.PI/2 - u*HEAD.fan*DEG;
const curlFor = u => { const a=Math.abs(u);
  return a>0.75 ? -Math.sign(u)*R.hook : (a>0.15 ? Math.sign(u)*R.mid : 0); };

/* Catmull-Rom sobre claves equiespaciadas: pocos tiradores, curva suave */
function crEval(k,u){
  const m=k.length-1, x=clamp(u,0,1)*m;
  const i=Math.min(Math.floor(x),m-1), t=x-i;
  const p0=k[Math.max(i-1,0)], p1=k[i], p2=k[i+1], p3=k[Math.min(i+2,m)];
  const t2=t*t, t3=t2*t;
  return 0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3);
}
const keysToRest = keys => {
  const N=R.joints, rest=new Array(N);
  for(let i=0;i<N;i++) rest[i]=clamp(crEval(keys,(i+0.5)/N), -34*DEG, 34*DEG);
  return rest;
};

let arms=[];
/* La pose no se reconstruye, se interpola. Cambiar de A a B rehaciendo los
   brazos da un salto; aquí se guarda de dónde venían y a dónde van, y el
   dibujo recorre el camino. */
let poseT=1, poseT0=0, poseDur=0.6;
function setPose(k, dur){
  POSE=k;
  arms.forEach(a=>{
    a.restFrom = a.rest.slice();
    const dp=poseFor(a.u);
    a.keys = (dp && dp.length===AP.handles+1)
      ? dp.map(g=>g*DEG) : new Array(AP.handles+1).fill(curlFor(a.u));
    a.restTo = keysToRest(a.keys);
  });
  poseDur = dur==null ? 0.6 : dur;
  poseT0 = performance.now(); poseT = 0;
}
function buildArms(){
  arms=[];
  for(let i=0;i<AP.count;i++){
    const u = AP.count>1 ? (i/(AP.count-1))*2-1 : 0;
    const dp = poseFor(u);
    const keys = (dp && dp.length===AP.handles+1)
      ? dp.map(g=>g*DEG) : new Array(AP.handles+1).fill(curlFor(u));
    arms.push({u, keys, rest:keysToRest(keys)});
  }
}

/* ángulos = pose de reposo + la onda del idle, más fuerte hacia la punta */
function armAngles(arm, T, wave){
  const N=R.joints, out=new Array(N);
  for(let i=0;i<N;i++){
    const env=Math.pow(i/(N-1),R.tipBias);
    out[i] = arm.rest[i] + (wave===0 ? 0 :
      AP.sway*DEG*env*Math.sin(2*Math.PI*0.3*T - R.waveLen*i + arm.u*R.phaseStep*Math.PI));
  }
  return out;
}
function chain(base, ang0, rel, L){
  const pts=[{x:base.x,y:base.y}];
  let x=base.x, y=base.y, ang=ang0;
  L = L==null ? segLen() : L;
  for(let i=0;i<rel.length;i++){
    ang+=rel[i]; x+=Math.cos(ang)*L; y+=Math.sin(ang)*L;
    pts.push({x,y});
  }
  return pts;
}
function cr(p,move=true){
  let d=(move?"M ":"L ")+f(p[0].x)+" "+f(p[0].y);
  for(let i=0;i<p.length-1;i++){
    const p0=p[i-1]||p[i],p1=p[i],p2=p[i+1],p3=p[i+2]||p[i+1];
    d+=` C ${f(p1.x+(p2.x-p0.x)/6)} ${f(p1.y+(p2.y-p0.y)/6)} `
      +`${f(p2.x-(p3.x-p1.x)/6)} ${f(p2.y-(p3.y-p1.y)/6)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
}
/* la cinta: la cadena engordada a un lado y a otro, con la punta redondeada */
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
  return cr(A)+` A ${f(w)} ${f(w)} 0 0 0 ${f(B[0].x)} ${f(B[0].y)} `+cr(B,false)+" Z";
}
/* Las ventosas van sobre el eje a una posición CONTINUA de la cadena, no
   encajadas en los nodos: si se encajan, al ondear saltan de nodo en nodo. */
function suckerPath(pts,arm,w){
  if(Math.abs(arm.u)<0.999) return "";          // sólo el par más externo
  const n=Math.max(1,Math.round(AP.suckCount));
  const side=-Math.sign(arm.rest[Math.floor(R.joints/2)]||-1);
  const r=Math.max(0.5,w*AP.suckSize), off=w*AP.suckOffset*side;
  let d="";
  for(let s=0;s<n;s++){
    const fr = n===1 ? (AP.suckFrom+AP.suckTo)/2
                     : AP.suckFrom + (AP.suckTo-AP.suckFrom)*(s/(n-1));
    const x=clamp(fr,0,1)*(pts.length-1);
    const i=Math.min(Math.floor(x),pts.length-2), t=x-i;
    const a=pts[i], b=pts[i+1];
    const px=a.x+(b.x-a.x)*t, py=a.y+(b.y-a.y)*t;
    const tx=b.x-a.x, ty=b.y-a.y, dl=Math.hypot(tx,ty)||1;
    const cx=px+(-ty/dl)*off, cy=py+(tx/dl)*off;
    d+=`M ${f(cx-r)} ${f(cy)} a ${f(r)} ${f(r)} 0 1 0 ${f(2*r)} 0 a ${f(r)} ${f(r)} 0 1 0 ${f(-2*r)} 0 `;
  }
  return d;
}

const SVGNS="http://www.w3.org/2000/svg";
const el=(t,a)=>{const n=document.createElementNS(SVGNS,t);for(const k in a)n.setAttribute(k,a[k]);return n;};

/* `host` is the CURRENT `.guide-mascot`, handed to us by mount(). It changes
   on every renderGuide(); `svg` does not. */
let host = null, svg = null, bobG = null;
let nodes=[], rigG, bubG, skinG, topG, armsBackG, armsG, armNodes=[];

/* El orden del editor, de atrás hacia delante:
     1 · el par externo   — nacen por detrás del manto
     2 · la cabeza
     3 · los tres de dentro
     4 · el faldón y la boca, que son onTop y tapan el nacimiento
   Todo en un solo lienzo: ya no hay nada que vaya por delante del panel. */
const armLayer = u => Math.abs(u) > 0.75 ? 'back' : 'front';

function build(){
  /* El lienzo es el espacio del PNG con AIR unidades de aire arriba. Todo lo
     demás —el CSS del panel, las variables --shippy-*— se queda igual. */
  svg=el('svg',{viewBox:`0 ${-AIR} 512 ${783+AIR}`, xmlns:SVGNS,
                'aria-hidden':'true', preserveAspectRatio:'xMidYMax meet'});
  bobG=el('g',{id:'sh-bob'});
  rigG=el('g',{id:'sh-rig'});
  skinG=el('g',{id:'sh-skin'});          // sólo esto recibe el clic
  bubG=el('g',{id:'sh-bub'});

  nodes = RIG.map(p=>{
    let n;
    if(p.type==='arc'){
      /* el trazo de la boca es grosor, no relleno */
      n=el('path',{d:partD(p),fill:'none',stroke:p.color,
                   'stroke-width':p.w||16,'stroke-linecap':'round'});
    }else{
      n=el('path',{d:partD(p),fill:p.color});
    }
    /* La coronilla va recortada contra el tronco: sin esto, la cabeza es un
       círculo suelto que sobresale por arriba en vez de la silueta real. */
    if(Number.isInteger(p.clipTo)){
      const t=RIG[p.clipTo], id='shclip'+p.clipTo;
      if(!rigG.querySelector('#'+id)){
        const cp=el('clipPath',{id});
        cp.appendChild(el('path',{d:partD(t)}));
        rigG.appendChild(cp);
      }
      n.setAttribute('clip-path','url(#'+id+')');
    }
    skinG.appendChild(n);
    return n;
  });
  /* las onTop —faldón y boca— a su propio grupo, que se pinta después de
     los brazos: eso es lo que tapa el nacimiento */
  topG=el('g',{id:'sh-top'});
  RIG.forEach((p,i)=>{ if(p.onTop) topG.appendChild(nodes[i]); });

  armsBackG=el('g',{id:'sh-armsback'});
  armsG=el('g',{id:'sh-arms'});
  rigG.appendChild(armsBackG);
  rigG.appendChild(skinG);
  rigG.appendChild(armsG);
  rigG.appendChild(topG);
  rigG.setAttribute('transform',`translate(${FIT.cx} ${FIT.cy}) scale(${FIT.s})`);
  bobG.appendChild(rigG); bobG.appendChild(bubG);
  svg.appendChild(bobG);

  buildArms();
  armNodes = arms.map(a=>{
    const g=el('g',{});
    const body=el('path',{fill:AP.armColor});
    const suck=el('path',{fill:AP.suckColor,opacity:.85});
    g.appendChild(body); g.appendChild(suck);
    (armLayer(a.u)==='back' ? armsBackG : armsG).appendChild(g);
    return {g,body,suck};
  });
  drawArms(0);

  /* THE CLICK LIVES ON THE SVG, NOT ON THE HOST. The host is thrown away and
     rebuilt by renderGuide(); this node is ours for the life of the page, so
     the listener is attached once and can never go stale. `#sh-skin` still
     decides what counts as a press, exactly as in the source. */
  svg.addEventListener('click', onClick);
}

/* ---- el latido de los brazos ----
   Un rAF permanente, pero sólo mientras la pestaña está visible y el sistema
   no pida menos movimiento: 5 cintas de 14 nodos son baratas, pero no hay
   razón para calcularlas cuando nadie mira. */
const CALMA = window.matchMedia
  ? matchMedia('(prefers-reduced-motion: reduce)') : {matches:false};
let T0=performance.now(), armsOn=true;
function drawArms(T){
  const W = armsOn && !CALMA.matches ? 1 : 0;
  if(poseT<1){
    poseT = Math.min(1,(performance.now()-poseT0)/(poseDur*1000));
    const e = easeInOut(poseT);
    arms.forEach(a=>{ if(a.restFrom) a.rest=a.restFrom.map((v,j)=>v+(a.restTo[j]-v)*e); });
  }
  arms.forEach((arm,i)=>{
    const n=armNodes[i]; if(!n) return;
    const base=spin(anchorLocal(arm.u)), ang=baseAngle(arm.u)+headRot*DEG;
    let rel;
    const g = waveArm===i ? waveSpec() : null;
    if(g){
      /* el gesto: la pose objetivo mezclada con el idle según su peso, y la
         oscilación extra sólo de la mitad del brazo hacia la punta */
      shrink = 1+(GEST_WAVE.shrink-1)*g.w;
      const goal = keysToRest(GEST_WAVE.keys.map(d=>d*AP.waveLift*DEG));
      const idle = armAngles(arm,T,W);
      rel = idle.map((v,j)=>v+(goal[j]-v)*g.w);
      const s=Math.sin(2*Math.PI*GEST_WAVE.wave.freq*g.el);
      for(let j=0;j<rel.length;j++){
        const u=j/(rel.length-1);
        if(u>=GEST_WAVE.wave.from)
          rel[j]+=GEST_WAVE.wave.amp*DEG*g.w*s*((u-GEST_WAVE.wave.from)/(1-GEST_WAVE.wave.from));
      }
    }else{
      shrink=1;
      rel = armAngles(arm,T,W);
    }
    const pts=chain(base,ang,rel,segLenOf(arm));
    shrink=1;
    n.body.setAttribute('d', ribbon(pts,AP.armW));
    n.suck.setAttribute('d', suckerPath(pts,arm,AP.armW));
  });
}
let Tnow=0, Tprev=0;
function tick(now){
  Tnow=(now-T0)/1000*AP.speed;
  const dt=Math.min(0.05, Tnow-Tprev); Tprev=Tnow;
  /* `isConnected` is this repo's addition, and it is the collapsed-rail case:
     the guide can render without a mascot host at all, which leaves this node
     detached. Five ribbons of fourteen nodes are cheap, but there is no reason
     to solve them for an octopus that is not in the document. */
  if(!document.hidden && svg && svg.isConnected){
    drawArms(Tnow);
    if(nodes.length){ paintMouth(); gazeStep(Tnow, dt); }
  }
  requestAnimationFrame(tick);
}

/* ═══ gestos ═══════════════════════════════════════════════════════ */

let blink=1;                    // 1 abierto, 0.08 cerrado (el valor del editor)
let gaze={x:0,y:0}, gazeOn=true;

/* El parpadeo y la mirada son el MISMO transform: la mirada empuja la pupila,
   el parpadeo la aplasta contra su propio centro. El orden importa —empujar
   primero y aplastar después, como en el editor. */
function applyEyes(){
  RIG.forEach((p,i)=>{
    const ops=[];
    const gs=nodes[i].getAttribute('data-gs');   // lo que haya puesto un gesto
    if(gs) ops.push(gs);
    if(p.gaze && gazeOn && (gaze.x||gaze.y)) ops.push(`translate(${f(gaze.x)} ${f(gaze.y)})`);
    if(p.blink && blink!==1) ops.push(`translate(0 ${f(p.y*(1-blink))}) scale(1 ${f(blink)})`);
    const tr=ops.join(' ');
    if(tr) nodes[i].setAttribute('transform',tr); else nodes[i].removeAttribute('transform');
  });
}

let blinkT=0;
function doBlink(){
  clearTimeout(blinkT);
  blink=0.08; applyEyes();
  blinkT=setTimeout(()=>{ blink=1; applyEyes(); },120);
}

/* Parpadeo de reposo: irregular a propósito. A intervalo fijo deja de leerse
   como un ser vivo y pasa a leerse como una animación en bucle. */
let idleBlink;
function scheduleBlink(){
  clearTimeout(idleBlink);
  idleBlink=setTimeout(()=>{ doBlink(); if(Math.random()<0.22) setTimeout(doBlink,340);
                             scheduleBlink(); }, 3200+Math.random()*4200);
}

/* ── LA MIRADA, EN DOS MODOS ──
   Cerca del panel te mira a ti. Lejos, hace el recorrido en bucle del editor
   —se va a un lado, espera, vuelve, espera— con sus mismos números: 9px de
   recorrido, 1,2s parado en cada extremo y 0,4s de viaje.

   Lo que une los dos modos es que ninguno escribe la mirada directamente:
   los dos proponen un DESTINO y el ojo va hacia él con una constante de
   tiempo. Sin eso, al salir el ratón del panel la pupila daría un salto de
   «te miro» a «miro a la pared», que es lo que delata el truco. */
const GAZE = { dx:-9, dy:0, hold:1.2, ramp:0.4 };   // los del editor
const GAZE_MAX = 13;        // cuánto se puede mover la pupila, en unidades de rig
let NEAR = 150;             // margen alrededor del panel que cuenta como «cerca»
let pointer = null;         // último sitio del ratón, o null si se fue
let gazeMode = 'bucle';

/* THE PANEL IS `.app-guide`, and it is looked up per call rather than cached:
   renderGuide() does not replace that element, but nothing here should depend
   on that — the host does get replaced, and asking the DOM costs nothing at
   rAF rate next to five ribbons. */
const guideEl = () => (host && host.closest('.app-guide')) || document.getElementById('app-guide');

/* el área «cerca» es el panel MÁS el pulpo, que asoma por encima: si sólo
   contase la card, acercarte a la cara no contaría como acercarte */
function zone(){
  const g=guideEl();
  const b=host.getBoundingClientRect();
  if(!g) return b;
  const a=g.getBoundingClientRect();
  return {left:Math.min(a.left,b.left), right:Math.max(a.right,b.right),
          top:Math.min(a.top,b.top),   bottom:Math.max(a.bottom,b.bottom)};
}
function cerca(p){
  const z=zone();
  const dx=Math.max(z.left-p.x, 0, p.x-z.right);
  const dy=Math.max(z.top-p.y, 0, p.y-z.bottom);
  return Math.hypot(dx,dy) <= NEAR;
}
/* el recorrido en bucle: ida, espera, vuelta, espera */
function gazeBucle(T){
  const ramp=Math.max(0.08,GAZE.ramp), hold=Math.max(0,GAZE.hold);
  const per=2*(hold+ramp), tt=((T%per)+per)%per;
  let k;
  if(tt < hold)               k = 0;
  else if(tt < hold+ramp)     k = easeInOut((tt-hold)/ramp);
  else if(tt < 2*hold+ramp)   k = 1;
  else                        k = 1 - easeInOut((tt-2*hold-ramp)/ramp);
  return { x:GAZE.dx*k, y:GAZE.dy*k };
}
/* mirar a un punto de la pantalla: el ángulo desde el centro de los ojos */
function gazeHacia(p){
  const b=host.getBoundingClientRect();
  if(!b.width) return {x:0,y:0};
  const k=b.width/512;
  const ex=b.left + FIT.cx*k;
  const ey=b.top + (AIR + FIT.cy + 118*FIT.s)*k;
  const dx=p.x-ex, dy=p.y-ey, d=Math.hypot(dx,dy)||1;
  const pull=Math.min(1, d/180);
  return { x:(dx/d)*GAZE_MAX*pull, y:(dy/d)*GAZE_MAX*pull };
}
function gazeStep(T, dt){
  if(!gazeOn){ gazeMode='—'; return; }
  const sigue = pointer && cerca(pointer);
  if(sigue) poke();              // rondarle también cuenta como hacerle caso
  gazeMode = sigue ? 'te sigue' : 'bucle';
  const aim = sigue ? gazeHacia(pointer) : gazeBucle(T);
  /* tau 0,11s: lo bastante rápido para no emborronar el bucle del editor y
     lo bastante lento para que el cambio de modo no se vea */
  const k = 1 - Math.exp(-dt/0.11);
  gaze.x += (aim.x-gaze.x)*k;
  gaze.y += (aim.y-gaze.y)*k;
  applyEyes();
}

/* ---- las pompas ---- */
/* Las constantes son las del editor (BUB): mismo tamaño, misma velocidad,
   mismo bamboleo. Aquí sólo cambia que salen de una en una al clic. */
const BUB={ size:9, spread:26, speed:135, wobble:14, round:0.32, alpha:0.85,
            sizeVar:0.85, fadeTo:-AIR+60,
            /* la O de la boca al soplar */
            oDur:0.55, oHold:0.15, oAmt:0.72 };
const MOUTH={ x:0, y:167+34*0.5 };       // boca.y + r/2, como en el editor
let bubbles=[], raf=0, last=0;

function blow(n){
  const N=n||1;
  for(let i=0;i<N;i++){
    const w=MOUTH.x+(Math.random()-0.5)*BUB.spread, h=MOUTH.y+(Math.random()-0.5)*8;
    const p=rig2png(w,h);
    bubbles.push({x:p.x, y:p.y, y0:p.y,
      r:Math.max(1.5, BUB.size*(1-BUB.sizeVar*0.5+Math.random()*BUB.sizeVar))*FIT.s,
      v:BUB.speed*(0.7+Math.random()*0.6)*FIT.s,
      ph:Math.random()*Math.PI*2, wob:BUB.wobble*(0.5+Math.random())*FIT.s,
      /* la ráfaga se reparte DENTRO del tiempo que la boca está abierta,
         para que ninguna pompa salga con la boca ya cerrada */
      life:0, delay:(N>1 ? (i/(N-1))*BUB.oDur*0.62 : 0) + Math.random()*0.04});
  }
  blowT = Tnow;                     // dispara la O
  if(!raf){ last=performance.now(); raf=requestAnimationFrame(step); }
}

/* ── LA O ──
   La boca hace una O justo al soplar. En el editor es un gesto de pieza con
   su propia curva, independiente del sistema de gestos, y aquí igual: abre,
   se mantiene abierta la fracción oHold del ciclo y cierra. Ese mantener
   existe para que a duraciones cortas no sea un parpadeo sino un gesto que
   se lee. Los tres números —0,55s, 0,15 y 0,72— son los suyos. */
let blowT=-99;
function mouthO(){
  const d=Math.max(0.06,BUB.oDur), u=(Tnow-blowT)/d;
  if(u<0||u>1) return 0;
  const h=clamp(BUB.oHold,0,0.8), ramp=(1-h)/2;
  if(u<ramp)   return Math.sin((u/ramp)*Math.PI*0.5);
  if(u<ramp+h) return 1;
  return Math.sin(((1-u)/ramp)*Math.PI*0.5);
}
/* La boca se pinta en un solo sitio, porque dos cosas la tocan: el gesto en
   curso y la O. Si cada una escribiese su propio path, la última en correr
   borraría a la otra. */
const BOCA = RIG.findIndex(p=>p.name==='boca');
let gMouth=null;
function paintMouth(){
  const p=RIG[BOCA], o=mouthO();
  let spread=p.spread, r=p.r, wd=p.w;
  if(gMouth){ spread*=gMouth.spread; r*=gMouth.r; }
  if(o>0.001){
    spread *= (1 - BUB.oAmt*o);     // se cierra de lados: de sonrisa a O
    r      *= (1 - 0.30*o);
    wd     *= (1 + 1.15*o);         // y engorda el trazo
  }
  nodes[BOCA].setAttribute('d', partD({...p, spread, r}));
  nodes[BOCA].setAttribute('stroke-width', f(wd));
}
const rig2png=(x,y)=>({x:FIT.cx+x*FIT.s, y:FIT.cy+y*FIT.s});

function step(now){
  const dt=Math.min(0.05,(now-last)/1000); last=now;
  for(let i=bubbles.length-1;i>=0;i--){
    const b=bubbles[i];
    if(b.delay>0){ b.delay-=dt; continue; }
    b.life+=dt;
    /* aceleran al subir y se ensanchan, con el tope del editor: sin él, a
       velocidad alta cruzaban el lienzo en un fotograma */
    b.y -= b.v*dt*(1.0+Math.min(b.life*0.35,0.8));
    b.x += Math.sin(b.life*2.2+b.ph)*b.wob*dt;
    b.r += dt*0.6*FIT.s;
    if(b.y<=BUB.fadeTo) bubbles.splice(i,1);
  }
  draw();
  raf = bubbles.length ? requestAnimationFrame(step) : 0;
}

function draw(){
  bubG.textContent='';
  bubbles.forEach(b=>{
    if(b.delay>0) return;
    /* Se apagan por ALTURA, no por tiempo: así una pompa lenta y una rápida
       se deshacen en el mismo sitio y ninguna llega viva al borde. */
    const climbed=Math.min(1,Math.max(0,(b.y0-b.y)/Math.max(1,b.y0-BUB.fadeTo)));
    const op=BUB.alpha*Math.pow(1-climbed,1.5);
    if(op<=0.01) return;
    bubG.appendChild(el('rect',{
      x:f(b.x-b.r), y:f(b.y-b.r), width:f(b.r*2), height:f(b.r*2),
      rx:f(b.r*2*BUB.round), fill:'#d392f7', opacity:f(op)}));
  });
}

/* pompas solas de vez en cuando, para que esté vivo sin que le toques */
let idleBub, idleOn=true;
function scheduleBub(){
  clearTimeout(idleBub);
  idleBub=setTimeout(()=>{ if(idleOn && !document.hidden) blow(1); scheduleBub(); },
                     7000+Math.random()*9000);
}

/* ---- el blup ---- */
/* Sintetizado, no un archivo: nada que cargar y se afina desde aquí. Sólo se
   crea al primer clic, que es el gesto que el navegador exige para dejar
   sonar nada. Una sinusoide que sube = el ruido de soltar una burbuja. */
let ac=null, soundOn=true;
function blup(){
  if(!soundOn) return;
  try{
    ac = ac || new (window.AudioContext||window.webkitAudioContext)();
    if(ac.state==='suspended') ac.resume();
    const t0=ac.currentTime, o=ac.createOscillator(), g=ac.createGain();
    o.type='sine';
    o.frequency.setValueAtTime(380,t0);
    o.frequency.exponentialRampToValueAtTime(1020,t0+0.085);
    g.gain.setValueAtTime(0.0001,t0);
    g.gain.exponentialRampToValueAtTime(0.05,t0+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+0.17);
    o.connect(g).connect(ac.destination);
    o.start(t0); o.stop(t0+0.19);
  }catch(e){}
}

/* ═══ los gestos del editor ═══════════════════════════════════════
   Del GESTURES del editor, tres se pueden traer tal cual porque su efecto no
   está en los brazos sino en las piezas de la cara y en la altura de la
   cabeza. El cuarto —taparse los ojos— sí necesita brazos, y los brazos aún
   no están portados, así que ése no está.
   Los números (dur, los factores de escala, el lift) son literalmente los
   suyos; el peso sube, se mantiene y baja como su gestureWeight. */
const GESTURES={
  saludar :{dur:2.6, wave:'rig'},         /* el brazo u=1 del rig */
  /* Sacudir la cabeza: oscilación AMORTIGUADA, tres vaivenes que van
     perdiendo fuerza. Una oscilación plana se lee como un mecanismo; la que
     decae se lee como una sacudida. */
  sacudir :{dur:2.2, hold:[0.12,0.60], shake:{deg:13, cycles:3, damp:2.4}}
};
const easeInOut = x => x<0.5 ? 2*x*x : 1-Math.pow(-2*x+2,2)/2;
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
let gest=null, gestRaf=0;

function playGesture(k){
  const g=GESTURES[k]; if(!g) return;
  if(g.wave==='rig'){
    waveArm = arms.findIndex(a=>a.u>0.999);
    waveT0 = performance.now();
    return;
  }
  gest={g, t0:performance.now()};
  if(!gestRaf) gestRaf=requestAnimationFrame(gestStep);
}
function gestStep(now){
  if(!gest){ gestRaf=0; return; }
  const {g,t0}=gest, u=(now-t0)/(g.dur*1000);
  if(u>=1){ gest=null; headRot=0;
            skinG.removeAttribute('transform'); topG.removeAttribute('transform');
            applyGesture(null,0); gestRaf=0; return; }
  const [a,b]=g.hold||[0.25,0.75];
  const w = u<a ? easeInOut(clamp(u/a,0,1)) : (u<b ? 1 : easeInOut(clamp((1-u)/(1-b),0,1)));
  if(g.shake){
    const sh=g.shake, env=Math.exp(-sh.damp*u);
    headRot = sh.deg*env*Math.sin(2*Math.PI*sh.cycles*u);
    const rt=`rotate(${f(headRot)} 0 ${HEAD.pivotY})`;
    skinG.setAttribute('transform',rt); topG.setAttribute('transform',rt);
  }
  applyGesture(g,w);
  gestRaf=requestAnimationFrame(gestStep);
}
/* Las piezas son círculos, así que escalar el radio y escalar la pieza sobre
   su propio centro es lo mismo: una línea en vez de rehacer el path. La boca
   no, que es un arco con apertura propia, y ésa sí se vuelve a dibujar. */
function applyGesture(g,w){
  RIG.forEach((p,i)=>{
    const k = g && g.parts && g.parts[p.name];
    if(k){
      const s=1+(k-1)*w;
      nodes[i].setAttribute('data-gs',`translate(${f(p.x)} ${f(p.y)}) scale(${f(s)}) translate(${f(-p.x)} ${f(-p.y)})`);
    } else nodes[i].removeAttribute('data-gs');
  });
  /* el gesto no pinta la boca: sólo dice cuánto la quiere, y paintMouth la
     compone con la O */
  const m=g&&g.mouth;
  gMouth = m ? {spread:1+(m.spread-1)*w, r:1+(m.r-1)*w} : null;
  paintMouth();
  applyEyes();
}

/* ── EL CLIC, POR ETAPAS ──
   Toda la reacción vive en una escalera de tres peldaños, y el peldaño en el
   que estás lo dice la pose:

     en reposo (A)  ·  un toque    → baja los dos brazos y sacude la cabeza
     en B, sacudiendo · más toques → se harta y se esconde
     al volver        ·            → saluda y vuelve a bajar los brazos

   El estado no es una variable aparte que haya que mantener sincronizada:
   es la pose más si hay un gesto corriendo. Una fuente de verdad, no dos. */
let clicks=0, lastClick=0, hideT=0, panicking=false;
const sacudiendo = () => !!gest && gest.g.shake;

function onClick(e){
  if(!e.target.closest('#sh-skin')) return;
  if(panicking) return;

  blow(1); blup(); doBlink(); scheduleBlink(); poke();

  const now=performance.now();
  clicks = (now-lastClick < 1400) ? clicks+1 : 1;
  lastClick = now;

  if(POSE!=='B'){                      // primer peldaño: se pone alerta
    setPose('B', 0.55);
    playGesture('sacudir');
    clicks=1;
    return;
  }
  if(sacudiendo() && clicks>=3){       // segundo: insistir mientras sacude
    clicks=0; panic();
    return;
  }
  playGesture('sacudir');              // si no, vuelve a sacudir y ya
}

/* ── EL BERRINCHE ──
   Se hunde tras el panel y suelta pompas a todo trapo dos segundos. Las
   pompas nacen de la boca, que ahora está detrás de la card, así que salen
   por el canto: sólo se ve el borboteo, que es la gracia. */
/* `hidden` / `flee` are classes on the HOST, which renderGuide() replaces —
   so they are mirrored here and re-applied by mount(). A tab change during
   the tantrum used to be the one way to leave him stranded above the panel
   with the sulk still running. */
/* `is-hiding` / `is-fleeing`, NOT the bench's `hidden` / `flee`: this app has
   a global `.hidden { display: none !important }` (style.css ~428), so the
   bench's name deleted the box instead of sliding it behind the card. */
let cls = { 'is-hiding':false, 'is-fleeing':false };
function setCls(k, on){
  cls[k] = on;
  if(host) host.classList.toggle(k, on);
  if(k === 'is-hiding') bob(!on);
}
let panicIv=0;
function panic(){
  panicking=true;
  clearTimeout(hideT); clearInterval(panicIv);
  setCls('is-hiding',true); setCls('is-fleeing',true);
  blow(4); blup();
  panicIv=setInterval(()=>blow(3), 130);
  setTimeout(()=>{
    clearInterval(panicIv); panicIv=0;
    setCls('is-fleeing',false); setCls('is-hiding',false);   // la vuelta, con su propia curva
    doBlink();
    /* Asoma, y ya arriba saluda; al acabar el saludo los brazos caen solos a
       la pose B, que es donde estaban. Las paces, básicamente. */
    setTimeout(()=>{
      playGesture('saludar');
      setTimeout(()=>{ setPose('B', 0.8); panicking=false; clicks=0; }, 2600);
    }, 760);
  }, 2000);
}

/* ── EL ABURRIMIENTO ──
   Si pasa mucho rato sin que nadie lo toque, se estira solo: baja los brazos
   y sacude la cabeza. Y un rato después los vuelve a subir, o sea que la pose
   de reposo se restaura sola y el gesto se puede volver a leer igual la vez
   siguiente.

   El intervalo es irregular a propósito. Un bicho que se sacude cada 30,0s
   clavados es un temporizador; entre 26 y 40 es un bicho que se aburre. */
let IDLE_MIN=26, IDLE_VAR=14;
let lastPoke=performance.now(), nextBored=IDLE_MIN+Math.random()*IDLE_VAR;
const poke = () => { lastPoke=performance.now(); };

function boredom(){
  if(panicking || gest || document.hidden) return;
  if(!svg || !svg.isConnected) return;
  if((performance.now()-lastPoke)/1000 < nextBored) return;
  poke();
  nextBored = IDLE_MIN+Math.random()*IDLE_VAR;
  setPose('B', 0.7);
  playGesture('sacudir');
  /* Y al rato se relaja, si nadie ha vuelto a tocarlo. La espera se saca del
     propio intervalo, no es un 6 fijo: con intervalos cortos, un 6 fijo llega
     después del siguiente aburrimiento y el relajo no ocurre nunca. */
  const relax=Math.min(6, IDLE_MIN*0.45);
  setTimeout(()=>{ if(!panicking && (performance.now()-lastPoke)/1000 > relax-0.5) setPose('A', 1.2); },
             relax*1000);
}

/* ── EL VAIVÉN ──
   The recipe declares this as a CSS keyframe on #sh-bob. Here it is built with
   element.animate() and pinned to `startTime = 0`, for shippyBreathe()'s own
   reason one file over: re-parenting this node into the freshly rendered guide
   restarts a CSS animation at 0%, and the whole point of owning the node is
   that nothing restarts. The document timeline is one shared clock, so every
   remount lands at the same phase by definition — no arithmetic to get wrong.

   The amplitude is `--sh-bob`, in CANVAS units rather than screen pixels, so
   it does not change when the octopus is rescaled: a translate inside the SVG
   is in user units. 16 rather than the editor's 9 because the rig sits inside
   at 1.38 (9 → 12.4 of canvas) and at 57px wide 12.4 does not read. */
let bobAnim = null;
function bob(on){
  if(bobAnim){ bobAnim.cancel(); bobAnim = null; }
  if(!on || !bobG || typeof bobG.animate !== 'function') return;
  if(CALMA.matches) return;
  const raw = host ? getComputedStyle(host).getPropertyValue('--sh-bob') : '';
  const rise = parseFloat(raw) || 16;
  bobAnim = bobG.animate(
    [{ transform: 'translateY(0)' },
     { transform: `translateY(${-rise}px)` },
     { transform: 'translateY(0)' }],
    { duration: 4170, iterations: Infinity, easing: 'ease-in-out' },
  );
  try { bobAnim.startTime = 0; } catch (e) { /* not on a timeline yet; harmless */ }
}

/* ── ARRANQUE ──
   Everything the test bench ran at parse time — the rAF, the window listeners,
   the boredom interval, the first blink and the first bubble — is armed on the
   first mount instead, because `.guide-mascot` does not exist until
   renderGuide() has run. */
let armed = false;
function arm(){
  if(armed) return;
  armed = true;
  addEventListener('pointermove', e=>{ pointer={x:e.clientX,y:e.clientY}; });
  addEventListener('pointerleave', ()=>{ pointer=null; });
  document.addEventListener('mouseleave', ()=>{ pointer=null; });
  setInterval(boredom, 1000);
  requestAnimationFrame(tick);
}

return {
  /* El nodo es siempre el mismo: appendChild lo traslada al panel recién
     pintado. Las clases de estado se vuelven a poner porque viven en el host,
     y el vaivén se recrea anclado al reloj del documento. */
  mount(node){
    if(!node) return;
    host = node;
    if(!svg) build();
    if(svg.parentNode !== host) host.appendChild(svg);
    host.classList.toggle('is-hiding',  cls['is-hiding']);
    host.classList.toggle('is-fleeing', cls['is-fleeing']);
    bob(!cls['is-hiding']);
    applyEyes();
    if(!armed){ arm(); scheduleBlink(); scheduleBub(); }
  },
};
})();
