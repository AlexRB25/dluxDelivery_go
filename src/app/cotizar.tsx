import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Mapa, type PuntoMapa } from "@/components/Mapa";
import { ConMapa, Vacio } from "@/components/piezas";
import { Button, C, Card, Chip, Field, H2, Muted, Notice, Row } from "@/components/ui";
import { useApp, type Opciones } from "@/lib/app";
import { CODIGOS, SERVICIOS } from "@/lib/demo";
import { fechaHora, hora, km as fmtKm, pesos } from "@/lib/format";
import { APARTADO_PCT, CARD_FEE_FIXED, CARD_FEE_PCT, cotizar, recorrido } from "@/lib/reglas";
import type { MetodoPago, Paquete } from "@/lib/types";

/** Horarios para agendar: de 1 h a 3 días (la base permite de 30 min a 5 días). */
function horarios() {
  const base = new Date();
  base.setMinutes(base.getMinutes() < 30 ? 30 : 60, 0, 0);
  const out: number[] = [];
  for (let h = 1; out.length < 8; h += h < 6 ? 1 : 6) out.push(base.getTime() + h * 3600_000);
  return out;
}

export default function Cotizar() {
  const router = useRouter();
  const { borrador, pedir, codigosUsados, ahora, real, sesion, opciones: pedirOpciones } = useApp();
  const paquete = borrador.tipo === "parcel";
  // base real: servicios y precios de quote_trip_options; demo: tarifas de ejemplo
  const [ops, setOps] = useState<Opciones | null>(null);
  const [errorOps, setErrorOps] = useState("");
  const opciones = real ? (ops?.servicios ?? []) : SERVICIOS.filter((s) => s.tipo === borrador.tipo);
  const [servicioId, setServicioId] = useState(real ? "" : (opciones[paquete ? 0 : 1]?.id ?? opciones[0]?.id ?? ""));
  const [metodo, setMetodo] = useState<MetodoPago>("card");
  const [codigoTxt, setCodigoTxt] = useState("");
  const [codigo, setCodigo] = useState<string | null>(null);
  const [errorCodigo, setErrorCodigo] = useState("");
  const [programado, setProgramado] = useState<number | null>(null);
  const [verHoras, setVerHoras] = useState(false);
  const [pagaCon, setPagaCon] = useState("");
  const [pq, setPq] = useState<Paquete>({ recibe: "", telefono: "", descripcion: "", tamano: "chico" });
  const firma = JSON.stringify([borrador.tipo, borrador.origen.ubicacion, borrador.destino?.ubicacion, borrador.paradas.map((x) => x.ubicacion)]);
  useEffect(() => {
    if (!real || !sesion || !borrador.destino) return;
    let vivo = true;
    pedirOpciones(codigo)
      .then((o) => {
        if (!vivo) return;
        setOps(o);
        setErrorOps(o.servicios.length ? "" : "Por ahora no hay servicio de este tipo en tu zona.");
        const err = Object.values(o.precios).find((x) => x.promo_error)?.promo_error;
        if (err && codigo) {
          setErrorCodigo(err);
          setCodigo(null);
        }
        setServicioId((sid) => (o.servicios.some((x) => x.id === sid) ? sid : (o.servicios.find((x) => x.id === "ride_economy") ?? o.servicios[0])?.id ?? ""));
      })
      .catch((e: Error) => {
        if (vivo) setErrorOps(e.message);
      });
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [real, sesion, firma, codigo]);

  if (!borrador.destino) return <Vacio icon="navigate-outline" titulo="Elige primero a dónde vas" />;
  if (real && !sesion) {
    return (
      <Card style={{ margin: 16 }}>
        <H2>Inicia sesión para ver precios</H2>
        <Muted>Con tu cuenta de Dlux pides, pagas y sigues tu viaje. Es la misma cuenta de Dlux Delivery.</Muted>
        <Button icon="person-circle" title="Entrar o crear cuenta" onPress={() => router.push("/entrar")} />
      </Card>
    );
  }

  const ruta = [borrador.origen, ...borrador.paradas.filter((p) => p.id), borrador.destino];
  const { km, minutos } = recorrido(ruta);
  const servicio = opciones.find((s) => s.id === servicioId) ?? opciones[0];
  /** Precio de un servicio: lo de la base (real) o el cálculo de ejemplo. */
  const precio = (sv: NonNullable<typeof servicio>) => {
    const o = ops?.precios[sv.id];
    if (real && o) {
      const total = Number(metodo === "card" ? o.card_to_pay : (o.cash_to_pay ?? o.card_to_pay));
      return { tarifa: Number(o.fare), descuento: Number(o.discount) + Number(o.credit), cargoTarjeta: metodo === "card" ? Number(o.card_fee) : 0, total };
    }
    return cotizar(sv, km, minutos, metodo, codigo);
  };
  const c = servicio ? precio(servicio) : { tarifa: 0, descuento: 0, cargoTarjeta: 0, total: 0 };
  const llegaEn = (sv: NonNullable<typeof servicio>) => (real ? (ops?.precios[sv.id]?.eta_minutes ?? null) : sv.llega);

  const puntos: PuntoMapa[] = ruta.map((l, i) => ({ ...l.ubicacion, tipo: i === 0 ? "origen" : i === ruta.length - 1 ? "destino" : "parada", titulo: l.nombre }));

  const aplicar = () => {
    const k = codigoTxt.trim().toUpperCase();
    setErrorCodigo("");
    if (real) return setCodigo(k); // la base revisa si aplica
    if (!CODIGOS[k]) return setErrorCodigo("Ese código no existe. Prueba GO20 o PRIMERVIAJE.");
    if (codigosUsados.includes(k)) return setErrorCodigo("Ya usaste este código.");
    setCodigo(k);
  };

  const confirmar = async () => {
    if (!servicio) throw new Error("Elige un servicio");
    if (paquete && (pq.recibe.trim().length < 2 || pq.telefono.replace(/\D/g, "").length < 10)) throw new Error("Escribe el nombre y el teléfono (10 dígitos) de quien recibe.");
    if (metodo === "cash" && pagaCon && Number(pagaCon) < c.total) throw new Error(`Con ${pesos(pagaCon)} no alcanza para ${pesos(c.total)}.`);
    const id = await pedir({ servicio, metodo, codigo, programado, pagaCon: pagaCon ? Number(pagaCon) : undefined, paquete: paquete ? pq : undefined });
    router.dismissAll();
    router.push({ pathname: "/viaje/[id]", params: { id } });
  };

  return (
    <ConMapa mapa={(llenar) => <Mapa llenar={llenar} height={200} puntos={puntos} ruta />}>
      <Pressable onPress={() => router.push("/destino")}>
        <Row style={{ justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "700", color: C.text }} numberOfLines={1}>
              {borrador.origen.nombre} → {borrador.destino.nombre}
            </Text>
            <Muted>
              {fmtKm(km)} · {minutos} min{borrador.paradas.filter((p) => p.id).length ? ` · ${borrador.paradas.filter((p) => p.id).length} parada(s)` : ""}
            </Muted>
          </View>
          <Text style={{ color: C.navy, fontWeight: "700" }}>Editar</Text>
        </Row>
      </Pressable>

      {/* Tipos de servicio */}
      {real && !ops && !errorOps && <Muted style={{ textAlign: "center", padding: 12 }}>Calculando precios…</Muted>}
      {errorOps ? <Notice tone="warn" icon="information-circle">{errorOps}</Notice> : null}
      {opciones.map((s) => {
        const q = precio(s);
        const llega = llegaEn(s);
        const sel = s.id === servicio?.id;
        return (
          <Pressable
            key={s.id}
            onPress={() => setServicioId(s.id)}
            style={{ backgroundColor: C.surface, borderRadius: 16, borderWidth: sel ? 2 : 1, borderColor: sel ? C.navy : C.border, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}
          >
            <Text style={{ fontSize: 34 }}>{s.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Row style={{ gap: 6 }}>
                <Text style={{ fontWeight: "800", color: C.text, fontSize: 16 }}>{s.nombre}</Text>
                {s.asientos ? (
                  <Row style={{ gap: 2 }}>
                    <Ionicons name="person" size={12} color={C.muted} />
                    <Text style={{ color: C.muted, fontSize: 12 }}>{s.asientos}</Text>
                  </Row>
                ) : null}
              </Row>
              <Muted>{s.descripcion}</Muted>
              <Text style={{ color: C.ok, fontSize: 12, fontWeight: "700" }}>
                {programado ? "Agendado" : llega != null ? `Llega en ${llega} min · deja ${hora(ahora + (llega + minutos) * 60_000)}` : "Buscamos al conductor más cercano"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontWeight: "900", fontSize: 17, color: C.navy }}>{pesos(q.total)}</Text>
              {q.descuento > 0 && <Text style={{ color: C.muted, textDecorationLine: "line-through", fontSize: 12 }}>{pesos(q.total + q.descuento)}</Text>}
            </View>
          </Pressable>
        );
      })}

      {paquete && (
        <Card>
          <H2>¿Quién lo recibe?</H2>
          <Field label="Nombre" value={pq.recibe} onChangeText={(t) => setPq({ ...pq, recibe: t })} placeholder="Nombre de quien recibe" />
          <Field label="Teléfono" value={pq.telefono} onChangeText={(t) => setPq({ ...pq, telefono: t.replace(/[^\d]/g, "").slice(0, 10) })} keyboardType="phone-pad" placeholder="10 dígitos" />
          <Field label="¿Qué mandas?" value={pq.descripcion} onChangeText={(t) => setPq({ ...pq, descripcion: t })} placeholder="Ej. llaves, documentos, una caja" />
          <Row style={{ flexWrap: "wrap" }}>
            {(["chico", "mediano", "grande"] as const).map((t) => (
              <Chip key={t} label={t[0].toUpperCase() + t.slice(1)} active={pq.tamano === t} onPress={() => setPq({ ...pq, tamano: t })} />
            ))}
          </Row>
          <Muted>Quien recibe obtiene un enlace para seguir el paquete y un código para entregarlo.</Muted>
        </Card>
      )}

      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <H2>¿Cuándo?</H2>
          <Pressable onPress={() => setVerHoras((x) => !x)}>
            <Text style={{ color: C.navy, fontWeight: "700" }}>{verHoras ? "Cerrar" : "Agendar"}</Text>
          </Pressable>
        </Row>
        <Text style={{ color: C.text, fontWeight: "600" }}>{programado ? `Agendado: ${fechaHora(programado)}` : "Ahora mismo"}</Text>
        {verHoras && (
          <Row style={{ flexWrap: "wrap" }}>
            <Chip label="Ahora" active={!programado} onPress={() => setProgramado(null)} />
            {horarios().map((h) => (
              <Chip key={h} label={fechaHora(h)} active={programado === h} onPress={() => setProgramado(h)} />
            ))}
          </Row>
        )}
      </Card>

      <Card>
        <H2>Pago</H2>
        <Row>
          <Chip label="Tarjeta" icon="card" active={metodo === "card"} onPress={() => setMetodo("card")} />
          <Chip label="Efectivo" icon="cash" active={metodo === "cash"} onPress={() => setMetodo("cash")} />
        </Row>
        {metodo === "card" ? (
          <Muted>
            Visa •••• 4242. Se aparta {pesos(Math.round(c.total * (1 + APARTADO_PCT / 100)))} por si hay esperas o paradas, y al terminar se cobra solo lo real.
          </Muted>
        ) : (
          <View style={{ gap: 4 }}>
            <Text style={{ fontWeight: "600", color: C.text }}>¿Con cuánto pagas? (para que lleve cambio)</Text>
            <TextInput
              value={pagaCon}
              onChangeText={(t) => setPagaCon(t.replace(/[^\d]/g, ""))}
              keyboardType="number-pad"
              placeholder={`Ej. ${Math.ceil(c.total / 100) * 100}`}
              placeholderTextColor={C.muted}
              style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 11, fontSize: 16, backgroundColor: C.surface, color: C.text }}
            />
          </View>
        )}
        {codigo ? (
          <Row style={{ justifyContent: "space-between" }}>
            <Text style={{ color: C.ok, fontWeight: "800" }}>✓ {codigo}{CODIGOS[codigo] ? `: ${CODIGOS[codigo].texto}` : c.descuento > 0 ? `: −${pesos(c.descuento)}` : ""}</Text>
            <Pressable onPress={() => setCodigo(null)}>
              <Text style={{ color: C.danger, fontWeight: "700" }}>Quitar</Text>
            </Pressable>
          </Row>
        ) : (
          <Row>
            <TextInput
              value={codigoTxt}
              onChangeText={setCodigoTxt}
              onSubmitEditing={aplicar}
              autoCapitalize="characters"
              placeholder="Código de descuento"
              placeholderTextColor={C.muted}
              style={{ flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 11, fontSize: 15, backgroundColor: C.surface, color: C.text }}
            />
            <Button small variant="outline" title="Aplicar" disabled={!codigoTxt.trim()} onPress={aplicar} />
          </Row>
        )}
        {errorCodigo ? <Text style={{ color: C.danger }}>{errorCodigo}</Text> : null}
      </Card>

      <Card>
        <Linea t={`Tarifa ${servicio?.nombre ?? ""} (${fmtKm(km)}, ${minutos} min)`} v={pesos(c.tarifa)} />
        {c.descuento > 0 && <Linea t={real ? "Descuento y saldo a favor" : "Descuento"} v={`−${pesos(c.descuento)}`} verde />}
        {c.cargoTarjeta > 0 && <Linea t={`Cargo por pago con tarjeta (${CARD_FEE_PCT}% + $${CARD_FEE_FIXED})`} v={pesos(c.cargoTarjeta)} />}
        <Row style={{ justifyContent: "space-between", borderTopWidth: 1, borderColor: C.border, paddingTop: 8 }}>
          <Text style={{ fontWeight: "900", fontSize: 18, color: C.text }}>Total estimado</Text>
          <Text style={{ fontWeight: "900", fontSize: 20, color: C.navy }}>{pesos(c.total)}</Text>
        </Row>
        <Muted>Esperas: {paquete ? "" : "5 min gratis al recogerte, luego $3/min. "}El conductor se queda con su tarifa completa: Dlux no le cobra comisión.</Muted>
      </Card>

      {borrador.paradas.some((p) => !p.id) && <Notice tone="warn">Hay una parada sin dirección: complétala o quítala.</Notice>}
      <Button
        big
        variant="yellow"
        icon={paquete ? "cube" : "car-sport"}
        title={servicio ? `${programado ? "Agendar" : "Pedir"} ${servicio.nombre} · ${pesos(c.total)}` : "Elige un servicio"}
        disabled={!servicio || borrador.paradas.some((p) => !p.id)}
        onPress={confirmar}
      />
    </ConMapa>
  );
}

function Linea({ t, v, verde }: { t: string; v: string; verde?: boolean }) {
  return (
    <Row style={{ justifyContent: "space-between" }}>
      <Text style={{ color: C.muted, flex: 1 }}>{t}</Text>
      <Text style={{ color: verde ? C.ok : C.text, fontWeight: "600" }}>{v}</Text>
    </Row>
  );
}
