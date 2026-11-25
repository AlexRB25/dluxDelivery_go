import { CODIGOS } from "./demo";
import type { Lugar, MetodoPago, Punto, Servicio } from "./types";

// Mismas reglas que la base de Dlux (quote_route, card_fee_for), simplificadas para el demo.
export const CARD_FEE_PCT = 3.6; // card_fee_pct: lo paga el usuario
export const CARD_FEE_FIXED = 3;
/** Al pedir con tarjeta se aparta la tarifa + 30 % (esperas, paradas, propina) y se cobra lo real al terminar. */
export const APARTADO_PCT = 30;
const KMH = 24; // velocidad promedio en ciudad

const r2 = (n: number) => Math.round(n * 100) / 100;

export function distanciaKm(a: Punto, b: Punto) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h)) * 1.3; // ×1.3: por calles, no en línea recta
}

/** Distancia y tiempo de origen → paradas → destino. */
export function recorrido(puntos: Lugar[]) {
  let km = 0;
  for (let i = 1; i < puntos.length; i++) km += distanciaKm(puntos[i - 1].ubicacion, puntos[i].ubicacion);
  return { km: r2(km), minutos: Math.max(3, Math.round((km / KMH) * 60) + 2 * (puntos.length - 2)) };
}

export const tarifa = (s: Servicio, km: number, minutos: number) => Math.round(Math.max(s.minimo, s.base + s.porKm * km + s.porMin * minutos));

export const cargoTarjeta = (monto: number) => r2((monto * CARD_FEE_PCT) / 100 + CARD_FEE_FIXED);

export function descuentoCodigo(codigo: string | null | undefined, monto: number) {
  const c = codigo ? CODIGOS[codigo] : undefined;
  if (!c) return 0;
  if (c.monto) return Math.min(c.monto, monto);
  if (c.pct) return Math.min(c.tope ?? Infinity, Math.round((monto * c.pct) / 100));
  return 0;
}

export function cotizar(s: Servicio, km: number, minutos: number, metodo: MetodoPago, codigo?: string | null) {
  const t = tarifa(s, km, minutos);
  const descuento = descuentoCodigo(codigo, t);
  const base = t - descuento;
  const cargo = metodo === "card" ? cargoTarjeta(base) : 0;
  return { tarifa: t, descuento, cargoTarjeta: cargo, total: r2(base + cargo) };
}

/** Tipo de vehículo de los conductores para cada servicio. */
export const flota = (s: Servicio) => (s.vehiculo === "🏍️" ? "moto" : s.vehiculo === "🚐" ? "van" : "car");
