export type Punto = { lat: number; lng: number };

export type Lugar = { id: string; nombre: string; direccion: string; ubicacion: Punto; icono?: string };

export type TipoViaje = "ride" | "parcel";

export type Servicio = {
  id: string;
  tipo: TipoViaje;
  nombre: string;
  descripcion: string;
  emoji: string;
  /** Emoji del vehículo en el mapa. */
  vehiculo: string;
  asientos?: number;
  base: number;
  porKm: number;
  porMin: number;
  minimo: number;
  /** Minutos que tarda en llegar por ti (demo). */
  llega: number;
};

export type Conductor = {
  nombre: string;
  emoji: string;
  calificacion: number;
  viajes: number;
  vehiculo: string;
  color: string;
  placas: string;
};

export type MetodoPago = "card" | "cash";

export type Paquete = { recibe: string; telefono: string; descripcion: string; tamano: "chico" | "mediano" | "grande" };

export type Cambio = { id: string; tipo: "parada" | "destino"; lugar: Lugar; pedido: number };

/** Lo que llega de la base para seguir un viaje real (my_trip). */
export type ViajeReal = {
  estado: "scheduled" | "searching" | "assigned" | "arriving" | "in_progress" | "completed" | "canceled";
  conductorPos: Punto | null;
  hayConductor: boolean;
  eta: number | null;
  /** El conductor ya marcó que llegó al origen (desde cuándo espera). */
  llego: boolean;
  llegoEn: number | null;
  cambios: { id: string; kind: "add_stop" | "change_destination"; address: string; status: "pending" | "approved" | "rejected"; created_at: string }[];
  token: string | null;
  extras: number;
  credito: number;
  completo?: boolean;
};

export type Viaje = {
  id: string;
  folio: string;
  creado: number;
  programado?: number;
  tipo: TipoViaje;
  servicio: Servicio;
  origen: Lugar;
  paradas: Lugar[];
  destino: Lugar;
  km: number;
  minutos: number;
  tarifa: number;
  descuento: number;
  cargoTarjeta: number;
  total: number;
  metodo: MetodoPago;
  pagaCon?: number;
  codigo?: string;
  conductor: Conductor;
  paquete?: Paquete;
  cambios: Cambio[];
  compartido?: boolean;
  cancelado?: boolean;
  /** Demo: milisegundos que se adelantó la simulación. */
  adelanto?: number;
  propina?: number;
  calificacion?: number;
  comentario?: string;
  real?: ViajeReal;
};

/** Lo que el usuario va armando antes de pedir. */
export type Borrador = { tipo: TipoViaje; origen: Lugar; destino: Lugar | null; paradas: Lugar[] };
