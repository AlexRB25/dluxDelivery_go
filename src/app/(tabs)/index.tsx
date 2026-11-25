import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Mapa } from "@/components/Mapa";
import { FilaLugar } from "@/components/piezas";
import { C, H2, Row, useEscritorio } from "@/components/ui";
import { useApp } from "@/lib/app";
import { PROMOS } from "@/lib/demo";
import { DELIVERY_URL } from "@/lib/format";
import { activo, progreso } from "@/lib/simulacion";
import type { Lugar, TipoViaje } from "@/lib/types";

export default function Inicio() {
  const router = useRouter();
  const { borrador, nuevoBorrador, guardados, recientes, viajes, ahora, nombre } = useApp();
  const enCurso = viajes.find((v) => activo(v, ahora));
  const tipo = borrador.tipo;
  const escritorio = useEscritorio();
  const mapaOrigen = [{ ...borrador.origen.ubicacion, tipo: "origen" as const, titulo: "Estás aquí" }];

  const ir = (t: TipoViaje, destino?: Lugar) => {
    nuevoBorrador(t, destino ?? null);
    router.push(destino ? "/cotizar" : "/destino");
  };

  const encabezado = (
        <View style={{ backgroundColor: C.navy, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 }}>
          <Row style={{ justifyContent: "space-between" }}>
            {escritorio ? <Text style={{ color: "#fff", fontWeight: "800", fontSize: 20 }}>¿A dónde vamos hoy?</Text> : <Text style={{ color: C.yellow, fontWeight: "900", fontSize: 24, letterSpacing: 0.5 }}>Dlux Go</Text>}
            <Text style={{ color: "#ffffffaa" }}>Hola{nombre !== "Invitado" ? `, ${nombre.split(" ")[0]}` : ""} 👋</Text>
          </Row>
        </View>
  );

  const panel = (
    <>

          {/* ¿A dónde vas? */}
          <View style={{ backgroundColor: C.surface, borderRadius: 20, padding: 14, gap: 12, borderWidth: 1, borderColor: C.border, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, elevation: 4 }}>
            <Row style={{ backgroundColor: C.background, borderRadius: 14, padding: 4 }}>
              {(
                [
                  ["ride", "🚗 Viaje"],
                  ["parcel", "📦 Paquete"],
                ] as const
              ).map(([t, label]) => (
                <Pressable key={t} onPress={() => nuevoBorrador(t)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: tipo === t ? C.navy : "transparent", alignItems: "center" }}>
                  <Text style={{ fontWeight: "800", color: tipo === t ? "#fff" : C.navy }}>{label}</Text>
                </Pressable>
              ))}
            </Row>
            <Pressable onPress={() => ir(tipo)} style={{ backgroundColor: C.background, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name="search" size={20} color={C.navy} />
              <Text style={{ fontSize: 17, fontWeight: "800", color: C.text, flex: 1 }}>{tipo === "ride" ? "¿A dónde vas?" : "¿A dónde lo mandas?"}</Text>
              <View style={{ backgroundColor: C.surface, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, flexDirection: "row", gap: 4, alignItems: "center" }}>
                <Ionicons name="time-outline" size={14} color={C.navy} />
                <Text style={{ fontWeight: "700", color: C.navy, fontSize: 12 }}>Ahora</Text>
              </View>
            </Pressable>
            {[...guardados, ...recientes.filter((r) => !guardados.some((g) => g.id === r.id))].slice(0, 4).map((l) => (
              <FilaLugar key={l.id} l={l} onPress={() => ir(tipo, l)} derecha={<Ionicons name="chevron-forward" size={18} color={C.muted} />} />
            ))}
          </View>

          {enCurso && (
            <Pressable
              onPress={() => router.push({ pathname: "/viaje/[id]", params: { id: enCurso.id } })}
              style={{ backgroundColor: C.navy, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Text style={{ fontSize: 28 }}>{enCurso.servicio.vehiculo}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.yellow, fontWeight: "800" }}>{progreso(enCurso, ahora).titulo}</Text>
                <Text style={{ color: "#fff" }} numberOfLines={1}>
                  A {enCurso.destino.nombre} · toca para ver
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </Pressable>
          )}

          {/* Servicios */}
          <H2>Servicios</H2>
          <Row style={{ gap: 10 }}>
            {(
              [
                ["🏍️", "Moto", "ride"],
                ["🚗", "Auto", "ride"],
                ["🚐", "XL", "ride"],
                ["📦", "Paquete", "parcel"],
              ] as const
            ).map(([e, t, k]) => (
              <Pressable key={t} onPress={() => ir(k)} style={{ flex: 1, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, paddingVertical: 14, alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 30 }}>{e}</Text>
                <Text style={{ fontWeight: "800", color: C.text, fontSize: 13 }}>{t}</Text>
              </Pressable>
            ))}
          </Row>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {PROMOS.map((p) => (
              <View key={p.titulo} style={{ width: 250, backgroundColor: p.color, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: "#fff", fontWeight: "900", fontSize: 17 }}>{p.titulo}</Text>
                  <Text style={{ color: "#ffffffdd", fontSize: 13 }}>{p.texto}</Text>
                </View>
                <Text style={{ fontSize: 36 }}>{p.emoji}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Sección pequeña: abre Dlux Delivery */}
          <Pressable
            onPress={() => Linking.openURL(DELIVERY_URL)}
            style={{ backgroundColor: C.yellowSoft, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: C.yellow }}
          >
            <Text style={{ fontSize: 30 }}>🍔</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "800", color: C.navy }}>¿Hambre? Pide comida, súper o farmacia</Text>
              <Text style={{ color: C.muted, fontSize: 13 }}>Se abre Dlux Delivery con tu misma cuenta</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={C.navy} />
          </Pressable>
    </>
  );

  // Computadora: mapa a toda la altura a la izquierda y el panel a la derecha
  if (escritorio) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.navy }}>
        {encabezado}
        <View style={{ flex: 1, flexDirection: "row", backgroundColor: C.background }}>
          <View style={{ flex: 1, padding: 16, paddingRight: 0 }}>
            <Mapa llenar puntos={mapaOrigen} />
          </View>
          <ScrollView style={{ width: 470, flexGrow: 0 }} contentContainerStyle={{ padding: 16, gap: 14 }}>
            {panel}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.navy }}>
      <ScrollView style={{ flex: 1, backgroundColor: C.background }} contentContainerStyle={{ paddingBottom: 24 }}>
        {encabezado}
        <View style={{ marginTop: -2 }}>
          <Mapa height={230} puntos={mapaOrigen} />
        </View>
        <View style={{ padding: 16, gap: 14, marginTop: -26 }}>{panel}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
