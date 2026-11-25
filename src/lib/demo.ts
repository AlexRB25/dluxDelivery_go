import type { Conductor, Lugar, Servicio } from "./types";

// Datos de ejemplo para enseñar Dlux Go en Guadalajara. Tarifas como service_rates de la base:
// base + por km + por minuto, con mínimo. El cargo de la tarjeta lo paga el usuario aparte.

export const SERVICIOS: Servicio[] = [
  { id: "moto", tipo: "ride", nombre: "Dlux Moto", descripcion: "Rápido y económico, 1 pasajero", emoji: "🏍️", vehiculo: "🏍️", asientos: 1, base: 12, porKm: 4.5, porMin: 0.8, minimo: 30, llega: 3 },
  { id: "economico", tipo: "ride", nombre: "Dlux Económico", descripcion: "Auto compacto, hasta 4", emoji: "🚗", vehiculo: "🚗", asientos: 4, base: 22, porKm: 6.8, porMin: 1.4, minimo: 45, llega: 4 },
  { id: "comfort", tipo: "ride", nombre: "Dlux Comfort", descripcion: "Autos nuevos y amplios, hasta 4", emoji: "🚙", vehiculo: "🚙", asientos: 4, base: 30, porKm: 8.5, porMin: 1.8, minimo: 60, llega: 6 },
  { id: "xl", tipo: "ride", nombre: "Dlux XL", descripcion: "Camioneta, hasta 6", emoji: "🚐", vehiculo: "🚐", asientos: 6, base: 38, porKm: 10.5, porMin: 2, minimo: 80, llega: 8 },
  { id: "paquete_moto", tipo: "parcel", nombre: "Paquete chico", descripcion: "En moto: sobres, llaves, comida, hasta 10 kg", emoji: "📦", vehiculo: "🏍️", base: 18, porKm: 5.5, porMin: 0.8, minimo: 40, llega: 4 },
  { id: "paquete_auto", tipo: "parcel", nombre: "Paquete grande", descripcion: "En auto: cajas y bultos, hasta 40 kg", emoji: "📦", vehiculo: "🚗", base: 40, porKm: 9, porMin: 1.4, minimo: 85, llega: 7 },
];

/** Lugares que el buscador del demo conoce (sin servicio de mapas). */
export const LUGARES: Lugar[] = [
  { id: "casa", nombre: "Casa", direccion: "Calle Marsella 180, Col. Americana", ubicacion: { lat: 20.6707, lng: -103.3598 }, icono: "home" },
  { id: "oficina", nombre: "Oficina", direccion: "Av. Chapultepec Sur 480, Col. Obrera", ubicacion: { lat: 20.6675, lng: -103.3694 }, icono: "briefcase" },
  { id: "aeropuerto", nombre: "Aeropuerto de Guadalajara", direccion: "Carretera a Chapala km 17.5", ubicacion: { lat: 20.5218, lng: -103.3112 }, icono: "airplane" },
  { id: "andares", nombre: "Plaza Andares", direccion: "Blvd. Puerta de Hierro 4965, Zapopan", ubicacion: { lat: 20.7101, lng: -103.4126 }, icono: "bag" },
  { id: "galerias", nombre: "Galerías Guadalajara", direccion: "Av. Vallarta 3959, Zapopan", ubicacion: { lat: 20.6769, lng: -103.4329 }, icono: "bag" },
  { id: "akron", nombre: "Estadio Akron", direccion: "Circuito JVC 2800, Zapopan", ubicacion: { lat: 20.6818, lng: -103.4627 }, icono: "football" },
  { id: "catedral", nombre: "Catedral de Guadalajara", direccion: "Av. Alcalde 10, Centro", ubicacion: { lat: 20.6767, lng: -103.3475 }, icono: "business" },
  { id: "minerva", nombre: "Glorieta La Minerva", direccion: "Av. Vallarta y López Mateos", ubicacion: { lat: 20.6741, lng: -103.3891 }, icono: "flag" },
  { id: "expo", nombre: "Expo Guadalajara", direccion: "Av. Mariano Otero 1499, Verde Valle", ubicacion: { lat: 20.6528, lng: -103.392 }, icono: "easel" },
  { id: "tlaquepaque", nombre: "Centro de Tlaquepaque", direccion: "Calle Independencia, San Pedro Tlaquepaque", ubicacion: { lat: 20.6407, lng: -103.311 }, icono: "color-palette" },
  { id: "central", nombre: "Nueva Central Camionera", direccion: "Carretera Zapotlanejo, Tlaquepaque", ubicacion: { lat: 20.6157, lng: -103.2858 }, icono: "bus" },
  { id: "sanjuan", nombre: "Mercado San Juan de Dios", direccion: "Calzada Independencia Sur, Centro", ubicacion: { lat: 20.675, lng: -103.3393 }, icono: "storefront" },
  { id: "chapultepec", nombre: "Av. Chapultepec (zona de bares)", direccion: "Av. Chapultepec y Av. Vallarta, Americana", ubicacion: { lat: 20.6738, lng: -103.3683 }, icono: "wine" },
  { id: "udg", nombre: "Universidad de Guadalajara (CUCEA)", direccion: "Periférico Norte 799, Zapopan", ubicacion: { lat: 20.7417, lng: -103.3811 }, icono: "school" },
  { id: "hospital", nombre: "Hospital Civil Fray Antonio Alcalde", direccion: "Calle Hospital 278, El Retiro", ubicacion: { lat: 20.6869, lng: -103.3474 }, icono: "medkit" },
];

export const CONDUCTORES: Record<string, Conductor[]> = {
  moto: [
    { nombre: "Iván Torres", emoji: "🧑🏽", calificacion: 4.9, viajes: 2140, vehiculo: "Italika FT150", color: "Negra", placas: "Z4-8KJ" },
    { nombre: "Daniela Ruiz", emoji: "👩🏻", calificacion: 4.8, viajes: 980, vehiculo: "Honda Cargo 150", color: "Roja", placas: "A1-7PM" },
  ],
  car: [
    { nombre: "Roberto Sánchez", emoji: "👨🏽", calificacion: 4.9, viajes: 3412, vehiculo: "Nissan Versa 2022", color: "Gris", placas: "JNS-482-A" },
    { nombre: "Mariana López", emoji: "👩🏽", calificacion: 4.95, viajes: 1876, vehiculo: "Chevrolet Aveo 2023", color: "Blanco", placas: "JKL-217-C" },
    { nombre: "Fernando Díaz", emoji: "👨🏻", calificacion: 4.8, viajes: 5120, vehiculo: "Toyota Yaris 2021", color: "Azul", placas: "JRT-903-B" },
  ],
  van: [{ nombre: "Héctor Navarro", emoji: "🧔🏽", calificacion: 4.9, viajes: 1290, vehiculo: "Toyota Avanza 2022", color: "Plata", placas: "JMX-551-D" }],
};

export const CODIGOS: Record<string, { texto: string; monto?: number; pct?: number; tope?: number }> = {
  GO20: { texto: "$20 de descuento", monto: 20 },
  PRIMERVIAJE: { texto: "50 % en tu primer viaje (tope $80)", pct: 50, tope: 80 },
};

export const PROMOS = [
  { titulo: "50 % en tu primer viaje", texto: "Con el código PRIMERVIAJE", color: "#001F3F", emoji: "🎉" },
  { titulo: "Al aeropuerto sin estrés", texto: "Agenda tu viaje con días de anticipación", color: "#15803D", emoji: "✈️" },
  { titulo: "Manda paquetes", texto: "Llaves, documentos o cajas en minutos", color: "#B45309", emoji: "📦" },
];

// Esperas (como en la base): 5 min gratis al recoger, luego $3/min; paradas 2 min gratis
export const ESPERA_GRATIS_MIN = 5;
export const ESPERA_POR_MIN = 3;
