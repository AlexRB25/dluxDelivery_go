// Traduce lo que responde la base de Dlux (quote_trip_options, my_trip, my_trips, my_addresses)
// al formato que ya usan las pantallas de Dlux Go.
import type { Conductor, Lugar, Servicio, TipoViaje, Viaje, ViajeReal } from "./types";

type Num = number | string | null;
const n = (v: Num | undefined) => Number(v ?? 0);

/** Cómo se ve cada servicio de la base en la app. */
const ESTILO: Record<string, { emoji: string; vehiculo: string; descripcion: string; asientos?: number }> = {
  ride_moto: { emoji: "🏍️", vehiculo: "🏍️", descripcion: "Rápido y económico, 1 pasajero", asientos: 1 },
  ride_economy: { emoji: "🚗", vehiculo: "🚗", descripcion: "Auto compacto, hasta 4", asientos: 4 },
  ride_xl: { emoji: "🚐", vehiculo: "🚐", descripcion: "Camioneta, hasta 6", asientos: 6 },
  parcel_moto: { emoji: "📦", vehiculo: "🏍️", descripcion: "En moto: sobres, llaves, comida" },
  parcel_car: { emoji: "📦", vehiculo: "🚗", descripcion: "En auto: cajas y bultos" },
};

export type OpcionDB = {
  code: string;
  name: string;
  vehicle_kinds: string[];
  distance_m: number;
  duration_s: number;
  fare: Num;
  discount: Num;
  promotion_title: string | null;
  credit: Num;
  debt: Num;
  cash_to_pay: Num;
  card_fee: Num;
  card_to_pay: Num;
  promo_error: string | null;
  eta_minutes: number | null;
};

export function servicioDesdeDB(o: OpcionDB, tipo: TipoViaje): Servicio {
  const e = ESTILO[o.code] ?? { emoji: tipo === "parcel" ? "📦" : "🚗", vehiculo: "🚗", descripcion: "" };
  return {
    id: o.code,
    tipo,
    nombre: o.name,
    descripcion: e.descripcion,
    emoji: e.emoji,
    vehiculo: e.vehiculo,
    asientos: e.asientos,
    base: 0,
    porKm: 0,
    porMin: 0,
    minimo: 0,
    llega: o.eta_minutes ?? 0,
  };
}

export type DireccionDB = { id: string; label: string | null; address: string; details: string | null; lat: number; lng: number };

export const lugarDesdeDB = (d: DireccionDB): Lugar => ({
  id: d.id,
  nombre: d.label ?? d.address,
  direccion: d.address,
  ubicacion: { lat: d.lat, lng: d.lng },
  icono: /casa|home/i.test(d.label ?? "") ? "home" : /oficina|trabajo/i.test(d.label ?? "") ? "briefcase" : "location",
});

type ConductorDB = { name: string; rating: Num; trips: number; vehicle_kind: string | null; vehicle: string | null; plate: string | null; color: string | null; lat: number | null; lng: number | null };

export type ViajeDB = {
  id: string;
  kind: "ride" | "parcel";
  status: ViajeReal["estado"];
  service: string;
  service_code: string;
  payment_method: "card" | "cash";
  fare: Num;
  discount: Num;
  credit: Num;
  debt: Num;
  extra_charges: Num;
  tip: Num;
  card_fee: Num;
  total: Num;
  cash_due: Num;
  distance_m: number | null;
  duration_s: number | null;
  created_at: string;
  scheduled_for: string | null;
  completed_at: string | null;
  canceled_reason: string | null;
  rating: number | null;
  stops: { seq: number; kind: string; address: string; lat: number; lng: number; contact_name: string | null; contact_phone: string | null; arrived_at: string | null; done_at: string | null }[];
  driver: ConductorDB | null;
  eta_minutes: number | null;
  changes: { id: string; kind: "add_stop" | "change_destination"; address: string; status: "pending" | "approved" | "rejected"; created_at: string }[];
  share_token: string | null;
};

export type ViajeListaDB = {
  id: string;
  kind: "ride" | "parcel";
  status: ViajeReal["estado"];
  service: string;
  service_code: string;
  from: string;
  to: string;
  total: Num;
  payment_method: "card" | "cash";
  created_at: string;
  scheduled_for: string | null;
  rating: number | null;
};

const folio = (id: string) => `GO-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
const COLOR_AUTO = (c: string | null) => c ?? "";
const lugarDeParada = (s: ViajeDB["stops"][number]): Lugar => ({ id: `parada-${s.seq}`, nombre: s.address, direccion: s.address, ubicacion: { lat: s.lat, lng: s.lng } });

function conductorDesdeDB(d: ConductorDB | null): Conductor {
  return {
    nombre: d?.name ?? "Buscando conductor",
    emoji: "🧑",
    calificacion: n(d?.rating),
    viajes: d?.trips ?? 0,
    vehiculo: d?.vehicle ?? (d?.vehicle_kind === "moto" ? "Moto" : "Auto"),
    color: COLOR_AUTO(d?.color ?? null),
    placas: d?.plate ?? "—",
  };
}

/** Viaje con todo su detalle (my_trip). */
export function viajeDesdeDB(v: ViajeDB): Viaje {
  const e = ESTILO[v.service_code] ?? { emoji: "🚗", vehiculo: "🚗", descripcion: "" };
  const paradas = v.stops.map(lugarDeParada);
  const origen = paradas[0];
  const destino = paradas[paradas.length - 1];
  const d = v.driver;
  return {
    id: v.id,
    folio: folio(v.id),
    creado: Date.parse(v.created_at),
    programado: v.scheduled_for ? Date.parse(v.scheduled_for) : undefined,
    tipo: v.kind,
    servicio: { id: v.service_code, tipo: v.kind, nombre: v.service, descripcion: e.descripcion, emoji: e.emoji, vehiculo: e.vehiculo, base: 0, porKm: 0, porMin: 0, minimo: 0, llega: 0 },
    origen,
    paradas: paradas.slice(1, -1),
    destino,
    km: (v.distance_m ?? 0) / 1000,
    minutos: Math.round((v.duration_s ?? 0) / 60),
    tarifa: n(v.fare),
    descuento: n(v.discount),
    cargoTarjeta: n(v.card_fee),
    total: n(v.total),
    metodo: v.payment_method,
    conductor: conductorDesdeDB(d),
    paquete:
      v.kind === "parcel"
        ? { recibe: v.stops[v.stops.length - 1]?.contact_name ?? "", telefono: v.stops[v.stops.length - 1]?.contact_phone ?? "", descripcion: "", tamano: "chico" }
        : undefined,
    cambios: [],
    compartido: !!v.share_token,
    propina: n(v.tip),
    calificacion: v.rating ?? undefined,
    real: {
      estado: v.status,
      conductorPos: d && d.lat != null && d.lng != null ? { lat: d.lat, lng: d.lng } : null,
      hayConductor: !!d,
      eta: v.eta_minutes,
      llego: v.status === "arriving" && !!v.stops[0]?.arrived_at,
      llegoEn: v.stops[0]?.arrived_at ? Date.parse(v.stops[0].arrived_at) : null,
      cambios: v.changes,
      token: v.share_token,
      extras: n(v.extra_charges),
      credito: n(v.credit),
      completo: true,
    },
  };
}

/** Viaje de la lista (my_trips). */
export function viajeDesdeLista(v: ViajeListaDB, previo?: Viaje): Viaje {
  if (previo?.real?.completo) return { ...previo, real: { ...previo.real, estado: v.status }, calificacion: v.rating ?? previo.calificacion };
  const e = ESTILO[v.service_code] ?? { emoji: "🚗", vehiculo: "🚗", descripcion: "" };
  const lugar = (t: string, k: string): Lugar => ({ id: k, nombre: t, direccion: t, ubicacion: { lat: 0, lng: 0 } });
  return {
    id: v.id,
    folio: folio(v.id),
    creado: Date.parse(v.created_at),
    programado: v.scheduled_for ? Date.parse(v.scheduled_for) : undefined,
    tipo: v.kind,
    servicio: { id: v.service_code, tipo: v.kind, nombre: v.service, descripcion: e.descripcion, emoji: e.emoji, vehiculo: e.vehiculo, base: 0, porKm: 0, porMin: 0, minimo: 0, llega: 0 },
    origen: lugar(v.from, "o"),
    paradas: [],
    destino: lugar(v.to, "d"),
    km: 0,
    minutos: 0,
    tarifa: 0,
    descuento: 0,
    cargoTarjeta: 0,
    total: n(v.total),
    metodo: v.payment_method,
    conductor: conductorDesdeDB(null),
    cambios: [],
    calificacion: v.rating ?? undefined,
    real: { estado: v.status, conductorPos: null, hayConductor: false, eta: null, llego: false, llegoEn: null, cambios: [], token: null, extras: 0, credito: 0 },
  };
}
