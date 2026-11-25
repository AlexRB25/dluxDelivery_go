export type PuntoMapa = { lat: number; lng: number; tipo: "origen" | "destino" | "parada" | "conductor"; titulo?: string; emoji?: string };

export type MapaProps = {
  puntos: PuntoMapa[];
  /** Modo elegir: al tocar el mapa devuelve el punto. */
  alTocar?: (p: { lat: number; lng: number }) => void;
  /** Línea del recorrido entre origen, paradas y destino. */
  ruta?: boolean;
  /** Volver a encuadrar cada vez que cambian los puntos (por defecto solo la primera vez). */
  seguir?: boolean;
  height?: number;
};

export const datosMapa = (p: MapaProps) =>
  JSON.stringify({ puntos: p.puntos, elegir: !!p.alTocar, ruta: !!p.ruta, seguir: !!p.seguir });

// Leaflet + OpenStreetMap, igual que el panel y el driver. Se pinta con window.pintar(datos).
// Habla con la app por ReactNativeWebView.postMessage (celular) o parent.postMessage (navegador).
export const MAPA_HTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#m{margin:0;height:100%;background:#DFDFDF}
.pin{width:30px;height:30px;border-radius:50%;border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font:700 13px sans-serif;color:#fff}
.car{width:38px;height:38px;border-radius:50%;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font-size:22px}</style>
</head><body><div id="m"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
function enviar(o){var s=JSON.stringify(o);if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(s);else if(window.parent!==window)window.parent.postMessage({dluxMapa:s},'*');}
var map=L.map('m',{zoomControl:false}).setView([20.6736,-103.344],13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
var capa=L.layerGroup().addTo(map),primera=true,elegir=false,auto=null;
function icono(p,i){if(p.tipo==='conductor')return L.divIcon({className:'',html:'<div class="car">'+(p.emoji||'🚗')+'</div>',iconSize:[38,38],iconAnchor:[19,19]});
var c={origen:['#16a34a','A'],destino:['#001F3F','B'],parada:['#b45309',String(i)]}[p.tipo];
return L.divIcon({className:'',html:'<div class="pin" style="background:'+c[0]+'">'+c[1]+'</div>',iconSize:[30,30],iconAnchor:[15,15]});}
window.pintar=function(d){elegir=!!d.elegir;var b=[];var linea=[];var n=0;
var fijos=d.puntos.filter(function(p){return p.tipo!=='conductor'});var c=d.puntos.filter(function(p){return p.tipo==='conductor'})[0];
capa.clearLayers();
fijos.forEach(function(p){if(p.tipo==='parada')n++;var m=L.marker([p.lat,p.lng],{icon:icono(p,n)});if(p.titulo)m.bindPopup(p.titulo);m.addTo(capa);b.push([p.lat,p.lng]);linea.push([p.lat,p.lng]);});
if(d.ruta&&linea.length>1)L.polyline(linea,{color:'#001F3F',weight:5,opacity:.75}).addTo(capa);
if(c){if(!auto)auto=L.marker([c.lat,c.lng],{icon:icono(c),zIndexOffset:1000}).addTo(map);else{auto.setLatLng([c.lat,c.lng]);auto.setIcon(icono(c));}b.push([c.lat,c.lng]);}
else if(auto){map.removeLayer(auto);auto=null;}
if((primera||d.seguir)&&b.length){primera=false;if(b.length===1)map.setView(b[0],15);else map.fitBounds(b,{padding:[45,45],maxZoom:16});}};
map.on('click',function(e){if(elegir)enviar({lat:e.latlng.lat,lng:e.latlng.lng});});
enviar({listo:true});
</script></body></html>`;
