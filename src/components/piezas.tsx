import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import type { Lugar } from "@/lib/types";

import { C, Row, Screen, useEscritorio } from "./ui";

export function FilaLugar({ l, onPress, derecha }: { l: Lugar; onPress: () => void; derecha?: ReactNode }) {
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

/**
 * Mapa + contenido. En celular: lo de arriba, el mapa y el resto en una columna.
 * En computadora: mapa grande a la izquierda y panel con scroll a la derecha.
 */
export function ConMapa({ arriba, mapa, children }: { arriba?: ReactNode; mapa: ((llenar: boolean) => ReactNode) | null; children?: ReactNode }) {
  const escritorio = useEscritorio();
  if (!escritorio || !mapa) {
    return (
      <Screen>
        {arriba}
        {mapa?.(false)}
        {children}
      </Screen>
    );
  }
  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: C.background }}>
      <View style={{ flex: 1, padding: 16, paddingRight: 0 }}>{mapa(true)}</View>
      <ScrollView style={{ width: 470, flexGrow: 0 }} contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="always">
        {arriba}
        {children}
      </ScrollView>
    </View>
  );
}
