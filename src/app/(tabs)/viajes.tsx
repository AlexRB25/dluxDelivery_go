import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { Vacio } from "@/components/piezas";
import { Badge, Button, C, H2, Muted, Row, Screen } from "@/components/ui";
import { useApp } from "@/lib/app";
import { fechaHora, pesos } from "@/lib/format";
import { activo, cuentaFinal, progreso } from "@/lib/simulacion";
import type { Viaje } from "@/lib/types";

export default function Viajes() {
  const router = useRouter();
  const { viajes, ahora, nuevoBorrador, cambiarBorrador } = useApp();
  const enCurso = viajes.filter((v) => activo(v, ahora));
  const antes = viajes.filter((v) => !activo(v, ahora));

  if (!viajes.length) {
    return (
      <Screen>
        <Vacio icon="car-sport-outline" titulo="Aún no tienes viajes" texto="Pide uno y aquí lo sigues en vivo." />
        <Button title="Pedir un viaje" onPress={() => router.navigate("/")} />
      </Screen>
    );
  }

  const repetir = (v: Viaje) => {
    nuevoBorrador(v.tipo, v.destino);
    cambiarBorrador({ origen: v.origen, paradas: v.paradas });
    router.push("/cotizar");
  };

  const fila = (v: Viaje) => {
    const pr = progreso(v, ahora);
    const total = pr.estado === "terminado" ? cuentaFinal(v, ahora).total : v.total;
    return (
      <Pressable
        key={v.id}
        onPress={() => router.push({ pathname: "/viaje/[id]", params: { id: v.id } })}
        style={{ backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 12, gap: 8 }}
      >
        <Row>
          <Text style={{ fontSize: 30 }}>{v.servicio.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "800", color: C.text }} numberOfLines={1}>
              {v.destino.nombre}
            </Text>
            <Muted>
              {fechaHora(v.programado ?? v.creado)} · {v.servicio.nombre} · {pr.estado === "cancelado" ? "sin cobro" : pesos(total)}
            </Muted>
          </View>
        </Row>
        <Row style={{ justifyContent: "space-between" }}>
          <Badge tone={pr.estado === "terminado" ? "ok" : pr.estado === "cancelado" ? "danger" : "navy"}>{pr.titulo}</Badge>
          {!activo(v, ahora) && <Button small variant="outline" icon="repeat" title="Repetir" onPress={() => repetir(v)} />}
        </Row>
      </Pressable>
    );
  };

  return (
    <Screen>
      {enCurso.length > 0 && <H2>En curso</H2>}
      {enCurso.map(fila)}
      {antes.length > 0 && <H2>Anteriores</H2>}
      {antes.map(fila)}
    </Screen>
  );
}
