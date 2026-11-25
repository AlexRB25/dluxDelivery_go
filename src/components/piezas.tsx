import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { Lugar } from "@/lib/types";

import { C, Row } from "./ui";

export function FilaLugar({ l, onPress, derecha }: { l: Lugar; onPress: () => void; derecha?: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 }, pressed && { opacity: 0.6 }]}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.navySoft, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={(l.icono as keyof typeof Ionicons.glyphMap) ?? "location"} size={18} color={C.navy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "700", color: C.text }} numberOfLines={1}>
          {l.nombre}
        </Text>
        <Text style={{ color: C.muted, fontSize: 13 }} numberOfLines={1}>
          {l.direccion}
        </Text>
      </View>
      {derecha}
    </Pressable>
  );
}

export function AvisoDemo() {
  return (
    <Row style={{ backgroundColor: C.yellowSoft, borderRadius: 12, padding: 10, alignItems: "flex-start" }}>
      <Ionicons name="flask" size={18} color={C.warn} />
      <Text style={{ color: C.warn, flex: 1, fontSize: 13, fontWeight: "600" }}>
        Versión de prueba: conductores y viajes de ejemplo, no se cobra nada y el viaje avanza solo para que veas todo el recorrido.
      </Text>
    </Row>
  );
}

export function Vacio({ icon, titulo, texto }: { icon: keyof typeof Ionicons.glyphMap; titulo: string; texto?: string }) {
  return (
    <View style={{ alignItems: "center", padding: 32, gap: 8 }}>
      <Ionicons name={icon} size={48} color={C.gray} />
      <Text style={{ fontWeight: "800", fontSize: 17, color: C.text, textAlign: "center" }}>{titulo}</Text>
      {texto ? <Text style={{ color: C.muted, textAlign: "center" }}>{texto}</Text> : null}
    </View>
  );
}

/** Tarjeta del conductor con su vehículo. */
export function TarjetaConductor({ c, vehiculo }: { c: { nombre: string; emoji: string; calificacion: number; viajes: number; vehiculo: string; color: string; placas: string }; vehiculo: string }) {
  return (
    <Row>
      <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: C.navySoft, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 30 }}>{c.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "800", color: C.text, fontSize: 16 }}>{c.nombre}</Text>
        <Text style={{ color: C.muted, fontSize: 13 }}>
          ⭐ {c.calificacion} · {c.viajes.toLocaleString("es-MX")} viajes
        </Text>
        <Text style={{ color: C.muted, fontSize: 13 }}>
          {vehiculo} {c.vehiculo} · {c.color}
        </Text>
      </View>
      <View style={{ backgroundColor: C.yellow, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 2, borderColor: C.navy }}>
        <Text style={{ fontWeight: "900", color: C.navy, letterSpacing: 1 }}>{c.placas}</Text>
      </View>
    </Row>
  );
}
