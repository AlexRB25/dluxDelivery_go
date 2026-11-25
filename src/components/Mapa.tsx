import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { datosMapa, MAPA_HTML, type MapaProps } from "./mapa-html";
import { C } from "./ui";

export type { PuntoMapa } from "./mapa-html";

/** Mapa en el celular: Leaflet dentro de un WebView. En el navegador se usa Mapa.web.tsx. */
export function Mapa(props: MapaProps) {
  const web = useRef<WebView>(null);
  const [listo, setListo] = useState(false);
  const datos = datosMapa(props);
  const { alTocar } = props;

  useEffect(() => {
    if (listo) web.current?.injectJavaScript(`window.pintar(${datos});true;`);
  }, [listo, datos]);

  const mensaje = (e: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(e.nativeEvent.data) as { listo?: boolean; lat?: number; lng?: number };
      if (m.listo) setListo(true);
      else if (typeof m.lat === "number" && typeof m.lng === "number") alTocar?.({ lat: m.lat, lng: m.lng });
    } catch {
      // mensaje ajeno
    }
  };

  return (
    <View style={{ height: props.height ?? 220, borderRadius: 14, overflow: "hidden", backgroundColor: C.gray }}>
      <WebView
        ref={web}
        source={{ html: MAPA_HTML, baseUrl: "https://dlux.app" }}
        originWhitelist={["*"]}
        onMessage={mensaje}
        javaScriptEnabled
        setSupportMultipleWindows={false}
        style={{ backgroundColor: "transparent" }}
      />
    </View>
  );
}
