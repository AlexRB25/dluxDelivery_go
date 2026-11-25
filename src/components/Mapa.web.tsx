import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import { datosMapa, MAPA_HTML, type MapaProps } from "./mapa-html";
import { C } from "./ui";

export type { PuntoMapa } from "./mapa-html";

/** Mapa en el navegador: el mismo Leaflet, dentro de un iframe. */
export function Mapa(props: MapaProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [listo, setListo] = useState(false);
  const datos = datosMapa(props);
  const tocar = useRef(props.alTocar);
  useEffect(() => {
    tocar.current = props.alTocar;
  });

  useEffect(() => {
    const oir = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data?.dluxMapa !== "string") return;
      const m = JSON.parse(e.data.dluxMapa) as { listo?: boolean; lat?: number; lng?: number };
      if (m.listo) setListo(true);
      else if (typeof m.lat === "number" && typeof m.lng === "number") tocar.current?.({ lat: m.lat, lng: m.lng });
    };
    window.addEventListener("message", oir);
    return () => window.removeEventListener("message", oir);
  }, []);

  useEffect(() => {
    const w = frame.current?.contentWindow as (Window & { pintar?: (d: unknown) => void }) | null | undefined;
    if (listo && w?.pintar) w.pintar(JSON.parse(datos));
  }, [listo, datos]);

  return (
    <View style={[{ borderRadius: 14, overflow: "hidden", backgroundColor: C.gray }, props.llenar ? { flex: 1, minHeight: 300 } : { height: props.height ?? 220 }]}>
      <iframe ref={frame} title="Mapa" srcDoc={MAPA_HTML} style={{ border: 0, width: "100%", height: "100%" }} />
    </View>
  );
}
