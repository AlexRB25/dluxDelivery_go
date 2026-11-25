import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";
import * as Location from "expo-location";
import { createContext, use, useCallback, useEffect, useState, type PropsWithChildren } from "react";

import { CONDUCTORES, LUGARES } from "./demo";
import { lugarDesdeDB, servicioDesdeDB, viajeDesdeDB, viajeDesdeLista, type DireccionDB, type OpcionDB, type ViajeDB, type ViajeListaDB } from "./real";
import { cotizar, flota, recorrido } from "./reglas";
import { MODO_REAL, rpc, supabase } from "./supabase";
import type { Borrador, Lugar, MetodoPago, Paquete, Servicio, TipoViaje, Viaje } from "./types";

const CLAVE = MODO_REAL ? "dlux-go-v1" : "dlux-go-demo-v1";

/** Base real sin ubicación todavía: centro de Guadalajara hasta que el teléfono diga dónde estás. */
const MI_UBICACION: Lugar = { id: "mi-ubicacion", nombre: "Mi ubicación", direccion: "Ubicación actual", ubicacion: { lat: 20.6736, lng: -103.36 }, icono: "navigate" };

type Guardado = {
  nombre: string;
  guardados: Lugar[];
  recientes: Lugar[];
  viajes: Viaje[];
  codigosUsados: string[];
  contactos: string[];
};

const INICIAL: Guardado = MODO_REAL
  ? { nombre: "Invitado", guardados: [], recientes: [], viajes: [], codigosUsados: [], contactos: [] }
  : { nombre: "Invitado", guardados: LUGARES.slice(0, 2), recientes: [LUGARES[2], LUGARES[3], LUGARES[7]], viajes: [], codigosUsados: [], contactos: [] };

export type DatosViaje = {
  servicio: Servicio;
  metodo: MetodoPago;
  codigo: string | null;
  programado: number | null;
  pagaCon?: number;
  paquete?: Paquete;
};

export type Opciones = { servicios: Servicio[]; precios: Record<string, OpcionDB> };

type AppState = Guardado & {
  cargando: boolean;
  /** true = base real de Dlux; false = viajes de ejemplo. */
  real: boolean;
  sesion: Session | null;
  ahora: number;
  borrador: Borrador;
  nuevoBorrador: (tipo: TipoViaje, destino?: Lugar | null) => void;
  cambiarBorrador: (cambio: Partial<Borrador>) => void;
  /** Servicios con su precio para el borrador (solo modo real: quote_trip_options). */
  opciones: (codigo: string | null) => Promise<Opciones>;
  pedir: (d: DatosViaje) => Promise<string>;
  seguir: (id: string) => Promise<void>;
  refrescarViajes: () => Promise<void>;
  pedirCambio: (id: string, tipo: "parada" | "destino", lugar: Lugar) => Promise<void>;
  cancelar: (id: string) => Promise<void>;
  compartir: (id: string) => Promise<string | null>;
  calificar: (id: string, estrellas: number, comentario?: string) => Promise<void>;
  darPropina: (id: string, monto: number) => Promise<void>;
  actualizarViaje: (id: string, cambio: Partial<Viaje> | ((v: Viaje) => Partial<Viaje>)) => void;
  setNombre: (n: string) => Promise<void>;
  guardarLugar: (l: Lugar) => void;
  agregarContacto: (c: string) => void;
  salir: () => Promise<void>;
  reiniciar: () => void;
};

const Ctx = createContext<AppState | null>(null);

export function useApp() {
  const v = use(Ctx);
  if (!v) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return v;
}

export const nuevoId = () => Math.random().toString(36).slice(2, 10);

const paradasDB = (l: Lugar[]) => l.filter((p) => p.id).map((p) => ({ lat: p.ubicacion.lat, lng: p.ubicacion.lng, address: p.direccion || p.nombre }));

export function AppProvider({ children }: PropsWithChildren) {
  const [g, setG] = useState<Guardado>(INICIAL);
  const [cargando, setCargando] = useState(true);
  const [ahora, setAhora] = useState(() => Date.now());
  const [sesion, setSesion] = useState<Session | null>(null);
  const [borrador, setBorrador] = useState<Borrador>({ tipo: "ride", origen: MODO_REAL ? MI_UBICACION : LUGARES[0], destino: null, paradas: [] });

  useEffect(() => {
    AsyncStorage.getItem(CLAVE)
      .then((s) => {
        if (s) setG({ ...INICIAL, ...(JSON.parse(s) as Partial<Guardado>) });
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (cargando) return;
    const local = MODO_REAL ? { ...g, viajes: [], guardados: [] } : g;
    AsyncStorage.setItem(CLAVE, JSON.stringify(local)).catch(() => {});
  }, [g, cargando]);

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Modo real: sesión, ubicación, lugares guardados y viajes ──
  useEffect(() => {
    if (!MODO_REAL) return;
    const { data } = supabase().auth.onAuthStateChange((_e, s) => {
      setSesion(s);
      if (!s) setG((x) => ({ ...x, nombre: "Invitado", viajes: [], guardados: [] }));
    });
    // dónde estás: para recogerte ahí
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const aqui = { ...MI_UBICACION, ubicacion: { lat: p.coords.latitude, lng: p.coords.longitude } };
        setBorrador((b) => (b.origen.id === MI_UBICACION.id ? { ...b, origen: aqui } : b));
      } catch {
        // sin permiso: se elige el origen a mano
      }
    })();
    return () => data.subscription.unsubscribe();
  }, []);

  const refrescarViajes = useCallback(async () => {
    if (!MODO_REAL) return;
    const lista = await rpc<ViajeListaDB[]>("my_trips");
    setG((x) => ({ ...x, viajes: lista.map((v) => viajeDesdeLista(v, x.viajes.find((y) => y.id === v.id))) }));
  }, []);

  const uid = sesion?.user.id;
  useEffect(() => {
    if (!MODO_REAL || cargando || !uid) return;
    void (async () => {
      const { data } = await supabase().from("profiles").select("full_name").eq("id", uid).maybeSingle();
      const dirs = await rpc<DireccionDB[]>("my_addresses").catch(() => []);
      setG((x) => ({ ...x, nombre: (data?.full_name as string | null) || "Pasajero", guardados: dirs.map(lugarDesdeDB) }));
      await refrescarViajes().catch(() => {});
    })();
  }, [uid, cargando, refrescarViajes]);

  const seguir = useCallback(async (vid: string) => {
    if (!MODO_REAL) return;
    const v = viajeDesdeDB(await rpc<ViajeDB>("my_trip", { p_trip: vid }));
    setG((x) => ({ ...x, viajes: x.viajes.some((y) => y.id === vid) ? x.viajes.map((y) => (y.id === vid ? v : y)) : [v, ...x.viajes] }));
  }, []);

  const opciones = useCallback(
    async (codigo: string | null): Promise<Opciones> => {
      if (!sesion) throw new Error("Inicia sesión para ver precios y pedir");
      const b = borrador;
      if (!b.destino) throw new Error("Elige a dónde vas");
      const lista = await rpc<OpcionDB[]>("quote_trip_options", {
        p_category: b.tipo,
        p_from_lat: b.origen.ubicacion.lat,
        p_from_lng: b.origen.ubicacion.lng,
        p_to_lat: b.destino.ubicacion.lat,
        p_to_lng: b.destino.ubicacion.lng,
        p_extra_stops: paradasDB(b.paradas),
        p_promo_code: codigo?.trim() || null,
      });
      return { servicios: lista.map((o) => servicioDesdeDB(o, b.tipo)), precios: Object.fromEntries(lista.map((o) => [o.code, o])) };
    },
    [sesion, borrador],
  );

  const pedir = useCallback(
    async (d: DatosViaje): Promise<string> => {
      const b = borrador;
      if (!b.destino) throw new Error("Elige a dónde vas");
      const paradas = b.paradas.filter((p) => p.id);
      if (MODO_REAL) {
        if (!sesion) throw new Error("Inicia sesión para pedir");
        const vid = await rpc<string>("request_trip", {
          p_service_code: d.servicio.id,
          p_payment_method: d.metodo,
          p_from_lat: b.origen.ubicacion.lat,
          p_from_lng: b.origen.ubicacion.lng,
          p_from_address: b.origen.direccion || b.origen.nombre,
          p_to_lat: b.destino.ubicacion.lat,
          p_to_lng: b.destino.ubicacion.lng,
          p_to_address: b.destino.direccion || b.destino.nombre,
          p_contact_name: d.paquete?.recibe || null,
          p_contact_phone: d.paquete?.telefono || null,
          p_notes: [d.paquete?.descripcion, d.paquete ? `Tamaño ${d.paquete.tamano}` : null, d.metodo === "cash" && d.pagaCon ? `Paga con $${d.pagaCon}` : null].filter(Boolean).join(" · ") || null,
          p_scheduled_for: d.programado ? new Date(d.programado).toISOString() : null,
          p_extra_stops: paradasDB(paradas),
          p_promo_code: d.codigo?.trim() || null,
        });
        setG((x) => ({ ...x, recientes: [b.destino!, ...x.recientes.filter((r) => r.id !== b.destino!.id)].slice(0, 5) }));
        setBorrador({ tipo: b.tipo, origen: b.origen, destino: null, paradas: [] });
        await seguir(vid);
        return vid;
      }
      const ruta = [b.origen, ...paradas, b.destino];
      const { km, minutos } = recorrido(ruta);
      if (km < 0.3) throw new Error("El origen y el destino están demasiado cerca");
      const c = cotizar(d.servicio, km, minutos, d.metodo, d.codigo);
      const lista = CONDUCTORES[flota(d.servicio)];
      const v: Viaje = {
        id: nuevoId(),
        folio: `GO-${Math.floor(100000 + Math.random() * 900000)}`,
        creado: Date.now(),
        programado: d.programado ?? undefined,
        tipo: b.tipo,
        servicio: d.servicio,
        origen: b.origen,
        paradas,
        destino: b.destino,
        km,
        minutos,
        tarifa: c.tarifa,
        descuento: c.descuento,
        cargoTarjeta: c.cargoTarjeta,
        total: c.total,
        metodo: d.metodo,
        pagaCon: d.pagaCon,
        codigo: c.descuento > 0 ? (d.codigo ?? undefined) : undefined,
        conductor: lista[Math.floor(Math.random() * lista.length)],
        paquete: d.paquete,
        cambios: [],
      };
      setG((x) => ({
        ...x,
        viajes: [v, ...x.viajes],
        recientes: [b.destino!, ...x.recientes.filter((r) => r.id !== b.destino!.id)].slice(0, 5),
        codigosUsados: v.codigo ? [...x.codigosUsados, v.codigo] : x.codigosUsados,
      }));
      setBorrador({ tipo: b.tipo, origen: b.origen, destino: null, paradas: [] });
      return v.id;
    },
    [borrador, sesion, seguir],
  );

  const actualizarViaje = useCallback(
    (vid: string, cambio: Partial<Viaje> | ((v: Viaje) => Partial<Viaje>)) =>
      setG((x) => ({ ...x, viajes: x.viajes.map((v) => (v.id === vid ? { ...v, ...(typeof cambio === "function" ? cambio(v) : cambio) } : v)) })),
    [],
  );

  const value: AppState = {
    ...g,
    cargando,
    real: MODO_REAL,
    sesion,
    ahora,
    borrador,
    nuevoBorrador: (tipo, destino = null) => setBorrador((b) => ({ tipo, origen: b.origen, destino, paradas: [] })),
    cambiarBorrador: (cambio) => setBorrador((b) => ({ ...b, ...cambio })),
    opciones,
    pedir,
    seguir,
    refrescarViajes,
    pedirCambio: async (vid, tipo, lugar) => {
      if (MODO_REAL) {
        await rpc("request_trip_change", {
          p_trip: vid,
          p_kind: tipo === "parada" ? "add_stop" : "change_destination",
          p_lat: lugar.ubicacion.lat,
          p_lng: lugar.ubicacion.lng,
          p_address: lugar.direccion || lugar.nombre,
        });
        await seguir(vid);
        return;
      }
      actualizarViaje(vid, (x) => ({ cambios: [...x.cambios, { id: nuevoId(), tipo, lugar, pedido: Date.now() + (x.adelanto ?? 0) }] }));
    },
    cancelar: async (vid) => {
      if (MODO_REAL) {
        await rpc("cancel_trip", { p_trip: vid, p_reason: "Lo canceló el pasajero" });
        await seguir(vid);
      } else actualizarViaje(vid, { cancelado: true });
    },
    compartir: async (vid) => {
      if (MODO_REAL) {
        const token = await rpc<string>("share_trip", { p_trip: vid });
        await seguir(vid);
        return token;
      }
      actualizarViaje(vid, { compartido: true });
      return null;
    },
    calificar: async (vid, estrellas, comentario) => {
      if (MODO_REAL) await rpc("rate_trip", { p_trip: vid, p_rating: estrellas, p_comment: comentario ?? null });
      actualizarViaje(vid, { calificacion: estrellas, comentario });
    },
    darPropina: async (vid, monto) => {
      if (MODO_REAL) {
        if (monto > 0) await rpc("add_tip", { p_trip: vid, p_amount: monto });
        await seguir(vid);
      } else actualizarViaje(vid, { propina: monto });
    },
    actualizarViaje,
    setNombre: async (nombre) => {
      if (MODO_REAL && sesion) await rpc("update_my_profile", { p_name: nombre, p_phone: null });
      setG((x) => ({ ...x, nombre }));
    },
    guardarLugar: (l) => setG((x) => ({ ...x, guardados: [...x.guardados.filter((y) => y.id !== l.id), l] })),
    agregarContacto: (c) => setG((x) => ({ ...x, contactos: [...x.contactos, c] })),
    salir: async () => {
      if (MODO_REAL) await supabase().auth.signOut();
    },
    reiniciar: () => setG(INICIAL),
  };

  return <Ctx value={value}>{children}</Ctx>;
}
