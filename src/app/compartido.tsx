import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { Mapa, type PuntoMapa } from "@/components/Mapa";
import { TarjetaConductor, Vacio } from "@/components/piezas";
import { C, Card, Muted, Notice, Screen } from "@/components/ui";
import { useApp } from "@/lib/app";
import { progreso } from "@/lib/simulacion";

/** Lo que ve un familiar con el enlace del viaje (shared_trip en la base): sin cuenta y solo mientras dura. */
export default function Compartido() {
  const { v: id } = useLocalSearchParams<{ v: string }>();
  const { viajes, ahora, nombre } = useApp();
  const v = viajes.find((x) => x.id === id);
  if (!v || !v.compartido) return <Vacio icon="link-outline" titulo="Este enlace ya no está activo" />;
  const pr = progreso(v, ahora);
  if (pr.estado === "terminado" || pr.estado === "cancelado") return <Vacio icon="checkmark-circle-outline" titulo="El viaje ya terminó" texto="El enlace deja de mostrar la ubicación al terminar." />;

  const puntos: PuntoMapa[] = pr.ruta.map((l, i) => ({ ...l.ubicacion, tipo: i === 0 ? "origen" : i === pr.ruta.length - 1 ? "destino" : "parada" }));
  if (pr.conductor) puntos.push({ ...pr.conductor, tipo: "conductor", emoji: v.servicio.vehiculo });

  return (
    <Screen>
      <Notice tone="navy" icon="people">{`${nombre === "Invitado" ? "Alguien" : nombre} compartió su viaje contigo`}</Notice>
      <Card style={{ backgroundColor: C.navy, borderColor: C.navy }}>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>{pr.titulo.replace("tu destino", "su destino").replace("por ti", "por tu contacto")}</Text>
        <Text style={{ color: "#ffffffcc" }}>
          {v.origen.nombre} → {pr.ruta[pr.ruta.length - 1].nombre}
          {pr.faltan != null ? ` · ${pr.faltan} min` : ""}
        </Text>
      </Card>
      <Mapa height={300} puntos={puntos} ruta seguir={!!pr.conductor} />
      <Card>
        <TarjetaConductor c={v.conductor} vehiculo={v.servicio.vehiculo} />
      </Card>
      <View>
        <Muted style={{ textAlign: "center" }}>Esta página se actualiza sola y deja de funcionar cuando termina el viaje.</Muted>
      </View>
    </Screen>
  );
}
