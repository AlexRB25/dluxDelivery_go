import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";

import { Mapa, type PuntoMapa } from "@/components/Mapa";
import { FilaLugar, TarjetaConductor, Vacio } from "@/components/piezas";
import { avisar, Button, C, Card, Chip, H2, Muted, Notice, Row, Screen } from "@/components/ui";
import { nuevoId, useApp } from "@/lib/app";
import { ESPERA_GRATIS_MIN, LUGARES } from "@/lib/demo";
import { hora, km as fmtKm, pesos } from "@/lib/format";
import { CARGO_CANCELAR, cancelarCuesta, cuentaFinal, progreso } from "@/lib/simulacion";

const PROPINAS = [0, 10, 20, 30];

export default function ViajePantalla() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { viajes, ahora, actualizarViaje } = useApp();
  const v = viajes.find((x) => x.id === id);
  const [cambiando, setCambiando] = useState<"parada" | "destino" | null>(null);
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [ayuda, setAyuda] = useState(false);

  if (!v) return <Vacio icon="car-outline" titulo="No encontramos este viaje" />;
  const pr = progreso(v, ahora);
  const paquete = v.tipo === "parcel";
  const nombre = v.conductor.nombre.split(" ")[0];
  const conConductor = ["en_camino", "llego", "en_viaje"].includes(pr.estado);
  const codigoEntrega = String(1000 + (parseInt(v.id.slice(0, 6), 36) % 9000));

  const puntos: PuntoMapa[] = pr.ruta.map((l, i) => ({ ...l.ubicacion, tipo: i === 0 ? "origen" : i === pr.ruta.length - 1 ? "destino" : "parada", titulo: l.nombre }));
  if (pr.conductor) puntos.push({ ...pr.conductor, tipo: "conductor", emoji: v.servicio.vehiculo, titulo: v.conductor.nombre });

  const pedirCambio = (tipo: "parada" | "destino", lugarId: string) => {
    const lugar = LUGARES.find((l) => l.id === lugarId)!;
    actualizarViaje(v.id, (x) => ({ cambios: [...x.cambios, { id: nuevoId(), tipo, lugar, pedido: Date.now() + (x.adelanto ?? 0) }] }));
    setCambiando(null);
  };

  const cancelar = () => {
    const cuesta = cancelarCuesta(v, ahora);
    const msg = cuesta ? `${nombre} ya llegó: cancelar cuesta ${pesos(CARGO_CANCELAR)} (se le pagan a él por su tiempo).` : "Cancelar ahora no tiene costo.";
    const ok = Platform.OS === "web" ? window.confirm(`¿Cancelar el viaje?\n\n${msg}`) : true;
    if (ok) actualizarViaje(v.id, { cancelado: true });
  };

  const compartir = () => {
    actualizarViaje(v.id, { compartido: true });
    avisar(
      "Enlace para compartir",
      `Quien lo abra ve en vivo dónde vas, el conductor, las placas y la hora de llegada, sin necesidad de cuenta. Deja de funcionar al terminar el viaje.\n\nEn la app real se manda por WhatsApp. Aquí puedes verlo en “Ver como lo ve tu contacto”.`,
    );
  };

  const final = pr.estado === "terminado" ? cuentaFinal(v, ahora) : null;

  return (
    <Screen>
      {/* Estado */}
      <Card style={{ backgroundColor: C.navy, borderColor: C.navy }}>
        <Row style={{ justifyContent: "space-between" }}>
          <Text style={{ color: "#ffffffaa", fontWeight: "700" }}>
            {v.servicio.emoji} {v.servicio.nombre} · {v.folio}
          </Text>
          {pr.faltan != null && <Text style={{ color: C.yellow, fontWeight: "900" }}>{pr.faltan} min</Text>}
        </Row>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>{pr.titulo}</Text>
        {pr.texto ? <Text style={{ color: "#ffffffcc" }}>{pr.texto}</Text> : null}
        {pr.estado !== "cancelado" && (
          <View style={{ height: 8, backgroundColor: "#ffffff33", borderRadius: 4, overflow: "hidden", marginTop: 4 }}>
            <View style={{ width: `${Math.round(pr.avance * 100)}%`, height: 8, backgroundColor: C.yellow }} />
          </View>
        )}
      </Card>

      {pr.estado !== "terminado" && pr.estado !== "cancelado" && <Mapa height={260} puntos={puntos} ruta seguir={!!pr.conductor} />}

      {pr.estado === "buscando" && <Notice tone="navy" icon="radio">Estamos avisando a los conductores cercanos. Normalmente tarda menos de un minuto.</Notice>}

      {pr.estado === "llego" && (
        <Notice tone={pr.espera >= ESPERA_GRATIS_MIN ? "warn" : "ok"} icon="time">
          {paquete
            ? `${nombre} te espera para recoger el paquete.`
            : `${nombre} te espera · ${pr.espera} de ${ESPERA_GRATIS_MIN} min gratis. Después se cobran $3 por minuto.`}
        </Notice>
      )}

      {conConductor && (
        <Card>
          <TarjetaConductor c={v.conductor} vehiculo={v.servicio.vehiculo} />
          <Row>
            <View style={{ flex: 1 }}>
              <Button small variant="outline" icon="call" title="Llamar" onPress={() => avisar("Versión de prueba", "En la app real llamas al conductor sin que ninguno vea el número del otro.")} />
            </View>
            <View style={{ flex: 1 }}>
              <Button small variant="outline" icon="chatbubbles" title="Mensaje" onPress={() => avisar("Versión de prueba", `En la app real le escribes a ${nombre} por el chat del viaje.`)} />
            </View>
          </Row>
        </Card>
      )}

      {paquete && pr.estado !== "terminado" && pr.estado !== "cancelado" && v.paquete && (
        <Card>
          <H2>Entrega</H2>
          <Muted>
            Recibe {v.paquete.recibe} · {v.paquete.telefono} · {v.paquete.descripcion || "paquete"} ({v.paquete.tamano})
          </Muted>
          <Row style={{ justifyContent: "space-between" }}>
            <Muted>Código que da quien recibe:</Muted>
            <Text style={{ fontSize: 24, fontWeight: "900", letterSpacing: 6, color: C.navy }}>{codigoEntrega}</Text>
          </Row>
        </Card>
      )}

      {/* Durante el viaje */}
      {pr.pendientes.map((c) => (
        <Notice key={c.id} tone="navy" icon="hourglass">
          {`Le preguntamos a ${nombre} si acepta ${c.tipo === "parada" ? "la parada en" : "cambiar el destino a"} ${c.lugar.nombre}…`}
        </Notice>
      ))}
      {(pr.estado === "en_viaje" || pr.estado === "llego" || pr.estado === "en_camino") && !paquete && (
        <>
          <Row>
            <View style={{ flex: 1 }}>
              <Button small variant="outline" icon="add-circle" title="Agregar parada" onPress={() => setCambiando(cambiando === "parada" ? null : "parada")} />
            </View>
            <View style={{ flex: 1 }}>
              <Button small variant="outline" icon="swap-vertical" title="Cambiar destino" onPress={() => setCambiando(cambiando === "destino" ? null : "destino")} />
            </View>
          </Row>
          {cambiando && (
            <Card>
              <H2>{cambiando === "parada" ? "¿Dónde quieres parar?" : "¿Cuál es tu nuevo destino?"}</H2>
              <Muted>El conductor lo acepta y la tarifa se recalcula con la nueva ruta.</Muted>
              {LUGARES.filter((l) => !pr.ruta.some((r) => r.id === l.id))
                .slice(0, 8)
                .map((l) => (
                  <FilaLugar key={l.id} l={l} onPress={() => pedirCambio(cambiando, l.id)} />
                ))}
            </Card>
          )}
          <Row>
            <View style={{ flex: 1 }}>
              <Button small variant="outline" icon="share-social" title={v.compartido ? "Compartido ✓" : "Compartir viaje"} onPress={compartir} />
            </View>
            <View style={{ flex: 1 }}>
              <Button small variant="danger" icon="shield-checkmark" title="Ayuda" onPress={() => setAyuda((x) => !x)} />
            </View>
          </Row>
          {v.compartido && (
            <Pressable onPress={() => router.push({ pathname: "/compartido", params: { v: v.id } })}>
              <Text style={{ color: C.navy, fontWeight: "700", textAlign: "center" }}>Ver como lo ve tu contacto →</Text>
            </Pressable>
          )}
          {ayuda && (
            <Card style={{ borderColor: C.danger }}>
              <H2>¿Necesitas ayuda?</H2>
              <Button variant="danger" icon="call" title="Llamar al 911" onPress={() => avisar("Versión de prueba", "En la app real marca al 911 y manda tu ubicación y los datos del viaje.")} />
              <Button variant="outline" icon="headset" title="Hablar con Dlux" onPress={() => avisar("Versión de prueba", "En la app real te comunica con el equipo de Dlux al momento.")} />
              <Button variant="outline" icon="people" title="Avisar a mis contactos de confianza" onPress={compartir} />
            </Card>
          )}
        </>
      )}

      {/* Ruta */}
      <Card>
        {pr.ruta.map((l, i) => (
          <Row key={`${l.id}-${i}`} style={{ alignItems: "flex-start" }}>
            <View style={{ alignItems: "center", width: 22 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: i === 0 ? C.ok : i === pr.ruta.length - 1 ? C.navy : C.warn, marginTop: 3 }} />
              {i < pr.ruta.length - 1 && <View style={{ width: 2, height: 22, backgroundColor: C.gray }} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", color: C.text }}>{l.nombre}</Text>
              <Muted>{l.direccion}</Muted>
            </View>
          </Row>
        ))}
        <Muted>
          {fmtKm(pr.km)} · pedido a las {hora(v.creado)}
        </Muted>
      </Card>

      {/* Final */}
      {final && (
        <>
          <Card>
            <H2>{paquete ? "Resumen del envío" : "Resumen del viaje"}</H2>
            <Fila t={`Tarifa (${fmtKm(final.km)}, ${final.minutos} min)`} v={pesos(final.tarifa)} />
            {final.descuento > 0 && <Fila t={`Descuento ${v.codigo ?? ""}`} v={`−${pesos(final.descuento)}`} />}
            {final.propina > 0 && <Fila t="Propina" v={pesos(final.propina)} />}
            {final.cargoTarjeta > 0 && <Fila t="Cargo por tarjeta" v={pesos(final.cargoTarjeta)} />}
            <Fila t="Total" v={pesos(final.total)} fuerte />
            <Muted>
              {v.metodo === "card" ? "Cobrado a tu Visa 4242 (demo)" : v.pagaCon ? `Efectivo: pagaste con ${pesos(v.pagaCon)}, cambio ${pesos(v.pagaCon - final.total)}` : "Pagado en efectivo"}
            </Muted>
            {v.cambios.length > 0 && <Muted>Incluye las paradas o cambios de destino que pediste en el camino.</Muted>}
          </Card>
          {v.calificacion == null ? (
            <Card>
              <H2>¿Cómo estuvo {paquete ? "el envío" : `tu viaje con ${nombre}`}?</H2>
              <Row style={{ justifyContent: "center", gap: 6 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => setEstrellas(n)} hitSlop={4}>
                    <Ionicons name={n <= estrellas ? "star" : "star-outline"} size={36} color="#F59E0B" />
                  </Pressable>
                ))}
              </Row>
              {v.metodo === "card" && (
                <>
                  <Muted>Propina para {nombre} (se la lleva completa)</Muted>
                  <Row style={{ flexWrap: "wrap" }}>
                    {PROPINAS.map((n) => (
                      <Chip key={n} label={n ? pesos(n) : "Ahora no"} active={(v.propina ?? 0) === n} onPress={() => actualizarViaje(v.id, { propina: n })} />
                    ))}
                  </Row>
                </>
              )}
              <TextInput
                value={comentario}
                onChangeText={setComentario}
                placeholder="Cuéntanos (opcional)"
                placeholderTextColor={C.muted}
                style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 11, backgroundColor: C.surface, color: C.text }}
              />
              <Button title="Enviar calificación" disabled={!estrellas} onPress={() => actualizarViaje(v.id, { calificacion: estrellas, comentario: comentario.trim() || undefined })} />
            </Card>
          ) : (
            <Notice tone="ok" icon="star">{`Calificaste con ${v.calificacion} estrellas. ¡Gracias!`}</Notice>
          )}
          <Button variant="outline" icon="flag" title="Reportar un problema" onPress={() => avisar("Versión de prueba", "En la app real abres un reporte (cobro, objeto olvidado, seguridad…) y Dlux responde en menos de 24 h.")} />
        </>
      )}

      {pr.estado === "cancelado" && <Notice tone="danger" icon="close-circle">Cancelaste este viaje.</Notice>}

      {pr.estado !== "terminado" && pr.estado !== "cancelado" && (
        <>
          <Pressable onPress={() => actualizarViaje(v.id, { adelanto: (v.adelanto ?? 0) + 15_000, programado: undefined })} style={{ alignSelf: "center", padding: 8 }}>
            <Text style={{ color: C.muted, fontWeight: "700" }}>⏩ Adelantar el viaje (demo)</Text>
          </Pressable>
          {pr.estado !== "en_viaje" && <Button variant="outline" icon="close-circle" title="Cancelar viaje" onPress={cancelar} />}
        </>
      )}
    </Screen>
  );
}

function Fila({ t, v, fuerte }: { t: string; v: string; fuerte?: boolean }) {
  return (
    <Row style={{ justifyContent: "space-between" }}>
      <Text style={{ color: fuerte ? C.text : C.muted, fontWeight: fuerte ? "900" : "400", flex: 1 }}>{t}</Text>
      <Text style={{ color: C.text, fontWeight: fuerte ? "900" : "600" }}>{v}</Text>
    </Row>
  );
}
