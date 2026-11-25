import { ESPERA_GRATIS_MIN } from "./demo";
import { cargoTarjeta, descuentoCodigo, distanciaKm, recorrido, tarifa } from "./reglas";
import type { Cambio, Lugar, Punto, Viaje } from "./types";

// Simulación del viaje en el demo: avanza sola (unos 2.5 min de principio a fin) y se puede adelantar.
// En la app real los estados los ponen el reparto (dispatch_tick) y el conductor (advance_trip).

const S = 1000;
const BUSCA = 7 * S; // buscando conductor
const LLEGA = 35 * S; // el conductor llega al origen
const SUBE = 50 * S; // empieza el viaje
const DURA = 100 * S; // recorrido
const APRUEBA = 4 * S; // el conductor acepta una parada o cambio de destino

export type Estado = "agendado" | "buscando" | "en_camino" | "llego" | "en_viaje" | "terminado" | "cancelado";

export type Progreso = {
  estado: Estado;
  titulo: string;
  texto: string;
  avance: number;
  conductor: Punto | null;
  /** Minutos (reales) que faltan para que llegue el conductor o para llegar al destino. */
  faltan: number | null;
  /** Minutos de espera que lleva el conductor en el origen (demo: 15 s = 5 min). */
  espera: number;
  ruta: Lugar[];
  pendientes: Cambio[];
  km: number;
};

const tiempo = (v: Viaje, ahora: number) => ahora - v.creado + (v.adelanto ?? 0);

/** Origen → paradas → destino con los cambios que el conductor ya aceptó. */
export function rutaEfectiva(v: Viaje, ahora: number) {
  const t = tiempo(v, ahora);
  const paradas = [...v.paradas];
  let destino = v.destino;
  const pendientes: Cambio[] = [];
  for (const c of v.cambios) {
    const aceptado = t - (c.pedido - v.creado) >= APRUEBA || t >= SUBE + DURA;
    if (!aceptado) {
      pendientes.push(c);
      continue;
    }
    if (c.tipo === "parada") paradas.push(c.lugar);
    else destino = c.lugar;
  }
  return { ruta: [v.origen, ...paradas, destino], pendientes };
}

function sobreRuta(ruta: Lugar[], f: number): Punto {
  const tramos = ruta.slice(1).map((l, i) => distanciaKm(ruta[i].ubicacion, l.ubicacion));
  const total = tramos.reduce((s, x) => s + x, 0) || 1;
  let falta = Math.min(1, Math.max(0, f)) * total;
  for (let i = 0; i < tramos.length; i++) {
    if (falta <= tramos[i] || i === tramos.length - 1) {
      const k = tramos[i] ? Math.min(1, falta / tramos[i]) : 1;
      const a = ruta[i].ubicacion;
      const b = ruta[i + 1].ubicacion;
      const curva = Math.sin(k * Math.PI) * 0.0015;
      return { lat: a.lat + (b.lat - a.lat) * k + curva, lng: a.lng + (b.lng - a.lng) * k - curva };
    }
    falta -= tramos[i];
  }
  return ruta[ruta.length - 1].ubicacion;
}

/** Viaje real: el estado viene de la base (reparto, conductor y cambios de ruta). */
function progresoReal(v: Viaje, ahora: number): Progreso {
  const x = v.real!;
  const ruta = [v.origen, ...v.paradas, v.destino];
  const pendientes: Cambio[] = x.cambios
    .filter((c) => c.status === "pending")
    .map((c) => ({ id: c.id, tipo: c.kind === "add_stop" ? "parada" : "destino", lugar: { id: c.id, nombre: c.address, direccion: c.address, ubicacion: { lat: 0, lng: 0 } }, pedido: Date.parse(c.created_at) }));
  const base = { ruta, pendientes, km: v.km, espera: 0, conductor: null as Punto | null, faltan: null as number | null };
  const nombre = v.conductor.nombre.split(" ")[0];
  const paquete = v.tipo === "parcel";
  switch (x.estado) {
    case "canceled":
      return { ...base, estado: "cancelado", titulo: "Viaje cancelado", texto: "", avance: 0 };
    case "scheduled": {
      const h = v.programado ? new Date(v.programado).toLocaleString("es-MX", { weekday: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
      return { ...base, estado: "agendado", titulo: "Viaje agendado", texto: `Te recogemos el ${h}. Buscamos conductor antes de la hora.`, avance: 0.03 };
    }
    case "searching":
      return { ...base, estado: "buscando", titulo: "Buscando conductor…", texto: `Le avisamos a los conductores de ${v.servicio.nombre} más cercanos.`, avance: 0.08 };
    case "assigned":
    case "arriving":
      if (x.llego) {
        return {
          ...base,
          estado: "llego",
          titulo: paquete ? `${nombre} llegó por el paquete` : `${nombre} llegó`,
          texto: paquete ? "Entrégale el paquete." : `Busca el ${v.conductor.vehiculo} ${v.conductor.color.toLowerCase()} con placas ${v.conductor.placas}.`,
          avance: 0.32,
          conductor: x.conductorPos,
          espera: x.llegoEn ? Math.max(0, Math.floor((ahora - x.llegoEn) / 60000)) : 0,
        };
      }
      return {
        ...base,
        estado: "en_camino",
        titulo: `${nombre} va por ${paquete ? "el paquete" : "ti"}`,
        texto: [v.conductor.vehiculo, v.conductor.color.toLowerCase(), v.conductor.placas].filter(Boolean).join(" · "),
        avance: 0.2,
        conductor: x.conductorPos,
        faltan: x.eta,
      };
    case "in_progress":
      return {
        ...base,
        estado: "en_viaje",
        titulo: paquete ? "Tu paquete va en camino" : "En camino a tu destino",
        texto: x.eta ? `Llegada aprox. ${new Date(ahora + x.eta * 60000).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}` : "",
        avance: 0.6,
        conductor: x.conductorPos,
        faltan: x.eta,
      };
    default:
      return { ...base, estado: "terminado", titulo: paquete ? "Paquete entregado" : "Llegaste a tu destino", texto: "Gracias por viajar con Dlux.", avance: 1 };
  }
}

export function progreso(v: Viaje, ahora: number): Progreso {
  if (v.real) return progresoReal(v, ahora);
  const { ruta, pendientes } = rutaEfectiva(v, ahora);
  const { km } = recorrido(ruta);
  const base = { ruta, pendientes, km, espera: 0, conductor: null as Punto | null, faltan: null as number | null };
  const nombre = v.conductor.nombre.split(" ")[0];
  const paquete = v.tipo === "parcel";
  if (v.cancelado) return { ...base, estado: "cancelado", titulo: "Viaje cancelado", texto: "", avance: 0 };
  if (v.programado && ahora < v.programado - 15 * 60 * S) {
    const h = new Date(v.programado).toLocaleString("es-MX", { weekday: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
    return { ...base, estado: "agendado", titulo: "Viaje agendado", texto: `Te recogemos el ${h}. Buscamos conductor 15 minutos antes.`, avance: 0.03 };
  }
  const t = tiempo(v, ahora);
  const salida: Punto = { lat: v.origen.ubicacion.lat + 0.009, lng: v.origen.ubicacion.lng + 0.008 };
  if (t < BUSCA) return { ...base, estado: "buscando", titulo: "Buscando conductor…", texto: `Le avisamos a los ${v.servicio.nombre} más cercanos.`, avance: 0.08 };
  if (t < LLEGA) {
    const f = (t - BUSCA) / (LLEGA - BUSCA);
    return {
      ...base,
      estado: "en_camino",
      titulo: `${nombre} va por ${paquete ? "el paquete" : "ti"}`,
      texto: `${v.conductor.vehiculo} ${v.conductor.color.toLowerCase()} · ${v.conductor.placas}`,
      avance: 0.1 + 0.2 * f,
      conductor: sobreRuta([{ ...v.origen, ubicacion: salida }, v.origen], f),
      faltan: Math.max(1, Math.round(v.servicio.llega * (1 - f))),
    };
  }
  if (t < SUBE) {
    const espera = Math.floor(((t - LLEGA) / (15 * S)) * ESPERA_GRATIS_MIN);
    return {
      ...base,
      estado: "llego",
      titulo: paquete ? `${nombre} llegó por el paquete` : `${nombre} llegó`,
      texto: paquete ? "Entrégale el paquete." : `Busca el ${v.conductor.vehiculo} ${v.conductor.color.toLowerCase()} con placas ${v.conductor.placas}.`,
      avance: 0.32,
      conductor: v.origen.ubicacion,
      espera,
    };
  }
  if (t < SUBE + DURA) {
    const f = (t - SUBE) / DURA;
    return {
      ...base,
      estado: "en_viaje",
      titulo: paquete ? "Tu paquete va en camino" : "En camino a tu destino",
      texto: `Llegada aprox. ${new Date(ahora + (1 - f) * recorrido(ruta).minutos * 60 * S).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`,
      avance: 0.35 + 0.65 * f,
      conductor: sobreRuta(ruta, f),
      faltan: Math.max(1, Math.round(recorrido(ruta).minutos * (1 - f))),
    };
  }
  return { ...base, estado: "terminado", titulo: paquete ? "Paquete entregado" : "Llegaste a tu destino", texto: "Gracias por viajar con Dlux.", avance: 1 };
}

/** Cobro final: con la ruta que realmente se hizo (paradas y cambios incluidos) y la propina. */
export function cuentaFinal(v: Viaje, ahora: number) {
  // real: lo que dice la base (paradas, esperas y propina ya incluidas)
  if (v.real) return { tarifa: v.tarifa + v.real.extras, descuento: v.descuento + v.real.credito, propina: v.propina ?? 0, cargoTarjeta: v.cargoTarjeta, total: v.total, km: v.km, minutos: v.minutos };
  const { ruta } = rutaEfectiva(v, ahora);
  const r = recorrido(ruta);
  const t = tarifa(v.servicio, r.km, r.minutos);
  const descuento = descuentoCodigo(v.codigo, t);
  const propina = v.propina ?? 0;
  const base = t - descuento + propina;
  const cargo = v.metodo === "card" ? cargoTarjeta(base) : 0;
  return { tarifa: t, descuento, propina, cargoTarjeta: cargo, total: Math.round((base + cargo) * 100) / 100, km: r.km, minutos: r.minutos };
}

export const activo = (v: Viaje, ahora: number) => !["terminado", "cancelado"].includes(progreso(v, ahora).estado);

/** Cancelar es gratis hasta que el conductor llega; después se cobra la tarifa de "no se presentó". */
export const CARGO_CANCELAR = 30;
export const cancelarCuesta = (v: Viaje, ahora: number) => ["llego"].includes(progreso(v, ahora).estado);
