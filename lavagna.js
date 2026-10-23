/* Lavagna per Schemi pallavolo mista.
   Si carica DOPO lo script principale: <script src="lavagna.js"></script> prima di </body>.
   Disegni e posizioni restano salvati in S.board finche' non premi "Pulisci". */
(function(){
if(typeof S==="undefined"||typeof cur!=="function")return;

var st=document.createElement("style");
st.textContent=
"#board{position:fixed;inset:0;z-index:60;background:var(--bg);display:flex;flex-direction:column;padding:env(safe-area-inset-top,0px) 8px env(safe-area-inset-bottom,0px)}"+
"#board[hidden]{display:none}"+
"#btool{display:flex;gap:6px;flex-wrap:wrap;padding:8px 0;align-items:center}"+
"#btool button{padding:12px 14px;font-weight:600}"+
"#btool button.on{background:var(--sel);color:#fff;border-color:var(--sel)}"+
"#btool .sw{width:44px;height:44px;border-radius:50%;padding:0;border:3px solid var(--line)}"+
"#btool .sw.on{border-color:var(--ink)}"+
"#bsvg{flex:1;min-height:0;height:100%;touch-action:none;user-select:none;-webkit-user-select:none}";
st.textContent+=
"#back{background:#ffd43b;border-color:#e0a800;color:#15202b;font-weight:600}"+
"#back:hover{background:#ffca1a;border-color:#c99700}"+
".wbtn{background:#1b5cb0;border-color:#144a8f;color:#fff;font-weight:600}"+
".wbtn:hover{background:#174f98;border-color:#103d75}";
document.head.appendChild(st);

document.body.insertAdjacentHTML("beforeend",
'<div id="board" hidden><div id="btool">'+
'<button type="button" data-bt="pen">\u270E Penna</button>'+
'<button type="button" data-bt="arrow">\u279C Freccia</button>'+
'<button type="button" data-bt="move">\u2725 Sposta</button>'+
'<button type="button" class="sw" data-bc="#ffffff" style="background:#fff" aria-label="Bianco"></button>'+
'<button type="button" class="sw" data-bc="#ffe066" style="background:#ffe066" aria-label="Giallo"></button>'+
'<button type="button" class="sw" data-bc="#ff6b6b" style="background:#ff6b6b" aria-label="Rosso"></button>'+
'<button type="button" class="sw" data-bc="#74c0fc" style="background:#74c0fc" aria-label="Azzurro"></button>'+
'<button type="button" id="bundo">\u21B6 Annulla</button>'+
'<button type="button" id="bclr" class="x">\u2715 Pulisci</button>'+
'<button type="button" id="bpng">\u2B07 PNG</button>'+
'<button type="button" id="bclose">Chiudi</button>'+
'</div><svg id="bsvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 392"></svg></div>');

function mkBtn(){var b=document.createElement("button");b.type="button";b.className="wbtn";b.textContent="\u270E Lavagna";b.addEventListener("click",openBoard);return b}
var nav=document.querySelector(".nav"),menu=document.querySelector(".nav .menu"),hd=document.querySelector("#home .head");
if(nav&&menu)nav.insertBefore(mkBtn(),menu);
if(hd)hd.appendChild(mkBtn());

var bt="pen",bc="#ffe066",bd=null,wl=null,bs=document.getElementById("bsvg");
function BB(){return S.board=S.board||{s:[],p:{}}}
function bpos(id){var z=zoneOf(id);return BB().p[id]||[20+COLX[z]*120+60,(FRONT.indexOf(z)>=0?40:210)+85]}
function bpt(e){var p=bs.createSVGPoint();p.x=e.clientX;p.y=e.clientY;var q=p.matrixTransform(bs.getScreenCTM().inverse());return[Math.round(q.x),Math.round(q.y)]}
function bui(){
document.querySelectorAll("#btool [data-bt]").forEach(function(b){b.classList.toggle("on",b.dataset.bt===bt)});
document.querySelectorAll("#btool [data-bc]").forEach(function(b){b.classList.toggle("on",b.dataset.bc===bc)});
}
function drawBoard(){
var c=cur(),b=BB();
var g='<rect width="400" height="392" fill="#2f5d45"/><rect x="20" y="40" width="360" height="340" fill="#d9541f" stroke="#fff" stroke-width="3"/><line x1="20" y1="210" x2="380" y2="210" stroke="#fff" stroke-width="3"/><rect x="14" y="30" width="372" height="10" fill="#fff" opacity=".8"/>';
for(var z=1;z<=6;z++){
var p=pl(c.pos[z]);if(!p)continue;
var d=bpos(p.id);
g+='<g data-t="'+p.id+'" transform="translate('+d[0]+' '+d[1]+')" style="cursor:grab"><path d="M-11,-30 Q0,-21 11,-30 L32,-19 L26,-3 L17,-7 L17,30 L-17,30 L-17,-7 L-26,-3 L-32,-19 Z" fill="#15202b" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></g>';
}
b.s.forEach(function(k){
var P=k.p,sty='fill="none" stroke="'+k.c+'" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"';
g+='<path d="M'+P.map(function(q){return q.join(" ")}).join("L")+'" '+sty+'/>';
if(k.a&&P.length>1){
var a=P[Math.max(0,P.length-6)],e=P[P.length-1],t=Math.atan2(e[1]-a[1],e[0]-a[0]);
var h=function(r){return[Math.round(e[0]-16*Math.cos(t+r)),Math.round(e[1]-16*Math.sin(t+r))]};
g+='<path d="M'+h(.5).join(" ")+'L'+e.join(" ")+'L'+h(-.5).join(" ")+'" '+sty+'/>';
}
});
bs.innerHTML=g;
}
async function openBoard(){
if(!cur())return;
document.getElementById("board").hidden=false;bui();drawBoard();
try{wl=await navigator.wakeLock.request("screen")}catch(e){}
}
function closeBoard(){document.getElementById("board").hidden=true;if(wl){wl.release();wl=null}}
document.getElementById("bclose").addEventListener("click",closeBoard);
document.getElementById("btool").addEventListener("click",function(e){
var t=e.target.closest("[data-bt]"),c=e.target.closest("[data-bc]");
if(t)bt=t.dataset.bt;
if(c){bc=c.dataset.bc;if(bt==="move")bt="pen"}
bui();
});
document.getElementById("bundo").addEventListener("click",function(){BB().s.pop();save();drawBoard()});
document.getElementById("bclr").addEventListener("click",function(){
S.board={s:[],p:{}};save();drawBoard();
});
bs.addEventListener("pointerdown",function(e){
e.preventDefault();bs.setPointerCapture(e.pointerId);
var q=bpt(e);
if(bt==="move"){
var t=e.target.closest("[data-t]");
if(t){var o=bpos(t.dataset.t);bd={m:t.dataset.t,ox:o[0]-q[0],oy:o[1]-q[1]}}
}else{
var k={c:bc,a:bt==="arrow"?1:0,p:[q]};
BB().s.push(k);bd={k:k};
}
});
bs.addEventListener("pointermove",function(e){
if(!bd)return;
var q=bpt(e);
if(bd.k)bd.k.p.push(q);else BB().p[bd.m]=[q[0]+bd.ox,q[1]+bd.oy];
drawBoard();
});
function bend(){if(bd){bd=null;save();drawBoard()}}
bs.addEventListener("pointerup",bend);
bs.addEventListener("pointercancel",bend);
document.getElementById("bpng").addEventListener("click",function(){
var s=new XMLSerializer().serializeToString(bs),i=new Image();
i.onload=function(){
var c=document.createElement("canvas");c.width=1200;c.height=1176;
c.getContext("2d").drawImage(i,0,0,1200,1176);
c.toBlob(function(b){var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="lavagna.png";a.click()});
};
i.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(s);
});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!document.getElementById("board").hidden)closeBoard()});
})();
