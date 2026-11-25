import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, use, useCallback, useEffect, useState, type PropsWithChildren } from "react";

import { CONDUCTORES, LUGARES } from "./demo";
import { cotizar, flota, recorrido } from "./reglas";
import type { Borrador, Lugar, MetodoPago, Paquete, Servicio, TipoViaje, Viaje } from "./types";

const CLAVE = "dlux-go-demo-v1";

type Guardado = {
  nombre: string;
  guardados: Lugar[];
  recientes: Lugar[];
  viajes: Viaje[];
  codigosUsados: string[];
  contactos: string[];
};

const INICIAL: Guardado = {
  nombre: "Invitado",
  guardados: LUGARES.slice(0, 2),
  recientes: [LUGARES[2], LUGARES[3], LUGARES[7]],
  viajes: [],
  codigosUsados: [],
  contactos: [],
};

export type DatosViaje = {
  servicio: Servicio;
  metodo: MetodoPago;
  codigo: string | null;
  programado: number | null;
  pagaCon?: number;
  paquete?: Paquete;
};

type AppState = Guardado & {
  cargando: boolean;
  ahora: number;
  borrador: Borrador;
  nuevoBorrador: (tipo: TipoViaje, destino?: Lugar | null) => void;
  cambiarBorrador: (cambio: Partial<Borrador>) => void;
  pedir: (d: DatosViaje) => string;
  actualizarViaje: (id: string, cambio: Partial<Viaje> | ((v: Viaje) => Partial<Viaje>)) => void;
  setNombre: (n: string) => void;
  guardarLugar: (l: Lugar) => void;
  agregarContacto: (c: string) => void;
  reiniciar: () => void;
};

const Ctx = createContext<AppState | null>(null);

export function useApp() {
  const v = use(Ctx);
  if (!v) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return v;
}

export const nuevoId = () => Math.random().toString(36).slice(2, 10);

export function AppProvider({ children }: PropsWithChildren) {
  const [g, setG] = useState<Guardado>(INICIAL);
  const [cargando, setCargando] = useState(true);
  const [ahora, setAhora] = useState(() => Date.now());
  const [borrador, setBorrador] = useState<Borrador>({ tipo: "ride", origen: LUGARES[0], destino: null, paradas: [] });

  useEffect(() => {
    AsyncStorage.getItem(CLAVE)
      .then((s) => {
        if (s) setG({ ...INICIAL, ...(JSON.parse(s) as Partial<Guardado>) });
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!cargando) AsyncStorage.setItem(CLAVE, JSON.stringify(g)).catch(() => {});
  }, [g, cargando]);

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const pedir = useCallback(
    (d: DatosViaje) => {
      const b = borrador;
      if (!b.destino) throw new Error("Elige a dónde vas");
      const paradas = b.paradas.filter((p) => p.id);
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
    [borrador],
  );

  const value: AppState = {
    ...g,
    cargando,
    ahora,
    borrador,
    nuevoBorrador: (tipo, destino = null) => setBorrador((b) => ({ tipo, origen: b.origen, destino, paradas: [] })),
    cambiarBorrador: (cambio) => setBorrador((b) => ({ ...b, ...cambio })),
    pedir,
    actualizarViaje: (id, cambio) =>
      setG((x) => ({ ...x, viajes: x.viajes.map((v) => (v.id === id ? { ...v, ...(typeof cambio === "function" ? cambio(v) : cambio) } : v)) })),
    setNombre: (nombre) => setG((x) => ({ ...x, nombre })),
    guardarLugar: (l) => setG((x) => ({ ...x, guardados: [...x.guardados.filter((y) => y.id !== l.id), l] })),
    agregarContacto: (c) => setG((x) => ({ ...x, contactos: [...x.contactos, c] })),
    reiniciar: () => setG(INICIAL),
  };

  return <Ctx value={value}>{children}</Ctx>;
}
