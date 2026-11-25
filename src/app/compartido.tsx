import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { Mapa, type PuntoMapa } from "@/components/Mapa";
import { ConMapa, TarjetaConductor, Vacio } from "@/components/piezas";
import { C, Card, Muted, Notice } from "@/components/ui";
import { useApp } from "@/lib/app";
import { progreso } from "@/lib/simulacion";
import { rpc } from "@/lib/supabase";

/** Lo que ve un familiar con el enlace del viaje: sin cuenta y solo mientras dura. */
export default function Compartido() {
  const { v: id, t: token } = useLocalSearchParams<{ v?: string; t?: string }>();
  if (token) return <CompartidoReal token={token} />;
  return <CompartidoDemo id={id ?? ""} />;
}

type DatosCompartidos = {
  status: string;
  driver_name: string | null;
  driver_rating: number | null;
  vehicle: string | null;
  plate: string | null;
  color: string | null;
  driver_lat: number | null;
  driver_lng: number | null;
  pickup_address: string;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  eta_minutes: number | null;
};

const TITULO: Record<string, string> = {
  searching: "Buscando conductor",
  assigned: "El conductor va por tu contacto",
  arriving: "El conductor va por tu contacto",
  in_progress: "En camino a su destino",
};

/** Base real: shared_trip(token) cada 5 s. */
function CompartidoReal({ token }: { token: string }) {
  const [d, setD] = useState<DatosCompartidos | null | undefined>(undefined);
  useEffect(() => {
    let vivo = true;
    const traer = () =>
      rpc<DatosCompartidos[]>("shared_trip", { p_token: token })
        .then((r) => vivo && setD(r[0] ?? null))
        .catch(() => vivo && setD(null));
    void traer();
    const t = setInterval(traer, 5000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [token]);

  if (d === undefined) return <Vacio icon="time-outline" titulo="Cargando el viaje…" />;
  if (d === null) return <Vacio icon="checkmark-circle-outline" titulo="Este enlace ya no está activo" texto="El viaje terminó o se dejó de compartir." />;

  const puntos: PuntoMapa[] = [{ lat: d.dropoff_lat, lng: d.dropoff_lng, tipo: "destino", titulo: d.dropoff_address }];
  if (d.driver_lat != null && d.driver_lng != null) puntos.push({ lat: d.driver_lat, lng: d.driver_lng, tipo: "conductor" });

  return (
    <ConMapa mapa={(llenar) => <Mapa llenar={llenar} height={300} puntos={puntos} ruta seguir />}>
      <Notice tone="navy" icon="people">Te compartieron este viaje de Dlux Go</Notice>
      <Card style={{ backgroundColor: C.navy, borderColor: C.navy }}>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>{TITULO[d.status] ?? "Viaje en curso"}</Text>
        <Text style={{ color: "#ffffffcc" }}>
          {d.pickup_address} → {d.dropoff_address}
          {d.eta_minutes != null ? ` · ${d.eta_minutes} min` : ""}
        </Text>
      </Card>
      {d.driver_name && (
        <Card>
          <TarjetaConductor
            c={{ nombre: d.driver_name, emoji: "🧑", calificacion: Number(d.driver_rating ?? 0), viajes: 0, vehiculo: d.vehicle ?? "Auto", color: d.color ?? "", placas: d.plate ?? "—" }}
            vehiculo="🚗"
          />
        </Card>
      )}
      <View>
        <Muted style={{ textAlign: "center" }}>Esta página se actualiza sola y deja de funcionar cuando termina el viaje.</Muted>
      </View>
    </ConMapa>
  );
}

/** Demo: el viaje simulado guardado en este navegador. */
function CompartidoDemo({ id }: { id: string }) {
  const { viajes, ahora, nombre } = useApp();
  const v = viajes.find((x) => x.id === id);
  if (!v || !v.compartido) return <Vacio icon="link-outline" titulo="Este enlace ya no está activo" />;
  const pr = progreso(v, ahora);
  if (pr.estado === "terminado" || pr.estado === "cancelado") return <Vacio icon="checkmark-circle-outline" titulo="El viaje ya terminó" texto="El enlace deja de mostrar la ubicación al terminar." />;

  const puntos: PuntoMapa[] = pr.ruta.map((l, i) => ({ ...l.ubicacion, tipo: i === 0 ? "origen" : i === pr.ruta.length - 1 ? "destino" : "parada" }));
  if (pr.conductor) puntos.push({ ...pr.conductor, tipo: "conductor", emoji: v.servicio.vehiculo });

  return (
    <ConMapa mapa={(llenar) => <Mapa llenar={llenar} height={300} puntos={puntos} ruta seguir={!!pr.conductor} />}>
      <Notice tone="navy" icon="people">{`${nombre === "Invitado" ? "Alguien" : nombre} compartió su viaje contigo`}</Notice>
      <Card style={{ backgroundColor: C.navy, borderColor: C.navy }}>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>{pr.titulo.replace("tu destino", "su destino").replace("por ti", "por tu contacto")}</Text>
        <Text style={{ color: "#ffffffcc" }}>
          {v.origen.nombre} → {pr.ruta[pr.ruta.length - 1].nombre}
          {pr.faltan != null ? ` · ${pr.faltan} min` : ""}
        </Text>
      </Card>
      <Card>
        <TarjetaConductor c={v.conductor} vehiculo={v.servicio.vehiculo} />
      </Card>
      <View>
        <Muted style={{ textAlign: "center" }}>Esta página se actualiza sola y deja de funcionar cuando termina el viaje.</Muted>
      </View>
    </ConMapa>
  );
}
