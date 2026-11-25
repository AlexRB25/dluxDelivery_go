import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Mapa, type PuntoMapa } from "@/components/Mapa";
import { FilaLugar } from "@/components/piezas";
import { Button, C, Muted, Row } from "@/components/ui";
import { nuevoId, useApp } from "@/lib/app";
import { LUGARES } from "@/lib/demo";
import type { Lugar } from "@/lib/types";

const MAX_PARADAS = 4;
type Campo = "origen" | "destino" | number;
const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Destino() {
  const router = useRouter();
  const { borrador, cambiarBorrador, guardados, recientes } = useApp();
  const [campo, setCampo] = useState<Campo>("destino");
  const [q, setQ] = useState("");
  const [enMapa, setEnMapa] = useState(false);
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(null);
  const paquete = borrador.tipo === "parcel";

  const n = normal(q.trim());
  const todos = [...guardados, ...recientes, ...LUGARES].filter((l, i, a) => a.findIndex((x) => x.id === l.id) === i);
  const resultados = n ? todos.filter((l) => normal(`${l.nombre} ${l.direccion}`).includes(n)) : todos;

  const poner = (l: Lugar) => {
    const origen = campo === "origen" ? l : borrador.origen;
    const destino = campo === "destino" ? l : borrador.destino;
    const paradas = typeof campo === "number" ? borrador.paradas.map((p, i) => (i === campo ? l : p)) : borrador.paradas;
    cambiarBorrador({ origen, destino, paradas });
    setQ("");
    setEnMapa(false);
    setPunto(null);
    // siguiente campo vacío; si ya está todo, a cotizar
    const vacia = paradas.findIndex((p) => !p.id);
    if (vacia >= 0) setCampo(vacia);
    else if (!destino) setCampo("destino");
    else if (campo !== "origen") router.replace("/cotizar");
    else setCampo("destino");
  };

  const agregarParada = () => {
    if (borrador.paradas.length >= MAX_PARADAS) return;
    cambiarBorrador({ paradas: [...borrador.paradas, { id: "", nombre: "", direccion: "", ubicacion: { lat: 0, lng: 0 } }] });
    setCampo(borrador.paradas.length);
  };

  const quitarParada = (i: number) => {
    cambiarBorrador({ paradas: borrador.paradas.filter((_, k) => k !== i) });
    setCampo("destino");
  };

  const caja = (c: Campo, color: string, letra: string, valor: Lugar | null | undefined, placeholder: string, quitar?: () => void) => {
    const activo = campo === c;
    return (
      <Row key={String(c)}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: color, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 11 }}>{letra}</Text>
        </View>
        {activo ? (
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder={valor?.nombre || placeholder}
            placeholderTextColor={valor?.nombre ? C.text : C.muted}
            style={{ flex: 1, backgroundColor: C.navySoft, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: C.text, borderWidth: 1.5, borderColor: C.navy }}
          />
        ) : (
          <Pressable onPress={() => { setCampo(c); setQ(""); }} style={{ flex: 1, backgroundColor: C.background, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11 }}>
            <Text style={{ fontSize: 16, color: valor?.nombre ? C.text : C.muted }} numberOfLines={1}>
              {valor?.nombre || placeholder}
            </Text>
          </Pressable>
        )}
        {quitar && (
          <Pressable onPress={quitar} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color={C.muted} />
          </Pressable>
        )}
      </Row>
    );
  };

  const puntosMapa: PuntoMapa[] = punto ? [{ ...punto, tipo: "destino" }] : [{ ...borrador.origen.ubicacion, tipo: "origen" }];

  return (
    <View style={{ flex: 1, width: "100%", maxWidth: 760, alignSelf: "center" }}>
      <View style={{ backgroundColor: C.surface, padding: 14, gap: 8, borderBottomWidth: 1, borderColor: C.border }}>
        {caja("origen", C.ok, "A", borrador.origen, paquete ? "¿Dónde lo recogemos?" : "¿Dónde te recogemos?")}
        {borrador.paradas.map((p, i) => caja(i, C.warn, String(i + 1), p, `Parada ${i + 1}`, () => quitarParada(i)))}
        {caja("destino", C.navy, "B", borrador.destino, paquete ? "¿A dónde lo mandas?" : "¿A dónde vas?")}
        <Row style={{ justifyContent: "space-between" }}>
          {borrador.paradas.length < MAX_PARADAS ? (
            <Pressable onPress={agregarParada} style={{ flexDirection: "row", gap: 4, alignItems: "center", padding: 4 }}>
              <Ionicons name="add-circle" size={18} color={C.navy} />
              <Text style={{ color: C.navy, fontWeight: "700" }}>Agregar parada</Text>
            </Pressable>
          ) : (
            <Muted>Máximo {MAX_PARADAS} paradas</Muted>
          )}
          <Pressable onPress={() => setEnMapa((x) => !x)} style={{ flexDirection: "row", gap: 4, alignItems: "center", padding: 4 }}>
            <Ionicons name="map" size={18} color={C.navy} />
            <Text style={{ color: C.navy, fontWeight: "700" }}>{enMapa ? "Ver lista" : "Elegir en el mapa"}</Text>
          </Pressable>
        </Row>
      </View>

      {enMapa ? (
        <View style={{ padding: 14, gap: 10 }}>
          <Muted>Toca el mapa en el punto exacto.</Muted>
          <Mapa height={340} puntos={puntosMapa} alTocar={setPunto} seguir={!!punto} />
          <Button
            variant="yellow"
            title="Usar este punto"
            disabled={!punto}
            onPress={() =>
              poner({ id: nuevoId(), nombre: "Punto en el mapa", direccion: `${punto!.lat.toFixed(5)}, ${punto!.lng.toFixed(5)}`, ubicacion: punto!, icono: "pin" })
            }
          />
        </View>
      ) : (
        <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}>
          {!n && <Text style={{ fontWeight: "800", color: C.muted, marginTop: 12, fontSize: 12 }}>GUARDADOS Y LUGARES POPULARES</Text>}
          {resultados.map((l) => (
            <FilaLugar key={l.id} l={l} onPress={() => poner(l)} />
          ))}
          {n && resultados.length === 0 && <Muted style={{ marginTop: 16 }}>No encontramos “{q}”. Usa “Elegir en el mapa”.</Muted>}
        </ScrollView>
      )}
    </View>
  );
}
