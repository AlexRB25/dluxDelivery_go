import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

import { Vacio } from "@/components/piezas";
import { Badge, Button, C, H2, Muted, Row, Screen } from "@/components/ui";
import { useApp } from "@/lib/app";
import { fechaHora, pesos } from "@/lib/format";
import { viajeDesdeDB, type ViajeDB } from "@/lib/real";
import { activo, cuentaFinal, progreso } from "@/lib/simulacion";
import { rpc } from "@/lib/supabase";
import type { Viaje } from "@/lib/types";

export default function Viajes() {
  const router = useRouter();
  const { viajes, ahora, nuevoBorrador, cambiarBorrador, real, sesion, refrescarViajes } = useApp();
  useEffect(() => {
    void refrescarViajes().catch(() => {});
  }, [refrescarViajes]);
  const enCurso = viajes.filter((v) => activo(v, ahora));
  const antes = viajes.filter((v) => !activo(v, ahora));

  if (real && !sesion) {
    return (
      <Screen>
        <Vacio icon="person-circle-outline" titulo="Entra a tu cuenta" texto="Aquí ves tus viajes y los sigues en vivo." />
        <Button title="Entrar o crear cuenta" onPress={() => router.push("/entrar")} />
      </Screen>
    );
  }

  if (!viajes.length) {
    return (
      <Screen>
        <Vacio icon="car-sport-outline" titulo="Aún no tienes viajes" texto="Pide uno y aquí lo sigues en vivo." />
        <Button title="Pedir un viaje" onPress={() => router.navigate("/")} />
      </Screen>
    );
  }

  const repetir = async (v0: Viaje) => {
    // la lista no trae coordenadas: en la base real se pide el viaje completo
    const v = real && !v0.real?.completo ? viajeDesdeDB(await rpc<ViajeDB>("my_trip", { p_trip: v0.id })) : v0;
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
