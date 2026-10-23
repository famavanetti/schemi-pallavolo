/* Collega manifest e icone e registra il service worker (installazione + uso offline). */
(function(){
var h=document.head;
function add(t,a){var n=document.createElement(t);for(var k in a)n.setAttribute(k,a[k]);h.appendChild(n)}
if(!document.querySelector('link[rel="manifest"]'))add("link",{rel:"manifest",href:"manifest.webmanifest"});
if(!document.querySelector('link[rel="apple-touch-icon"]'))add("link",{rel:"apple-touch-icon",href:"icon-180.png"});
if(!document.querySelector('link[rel="icon"]'))add("link",{rel:"icon",type:"image/png",href:"icon-192.png"});
if(!document.querySelector('meta[name="theme-color"]'))add("meta",{name:"theme-color",content:"#15202b"});
if("serviceWorker" in navigator)window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})});
})();
