import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Text, View } from "react-native";

import { Button, C, Card, Field, H2, Item, Muted, pronto as muyPronto, Screen } from "@/components/ui";
import { useApp } from "@/lib/app";
import { DELIVERY_URL } from "@/lib/format";

export default function Cuenta() {
  const router = useRouter();
  const { nombre, setNombre, viajes, guardados, contactos, agregarContacto, real, sesion, salir } = useApp();
  const [txt, setTxt] = useState(nombre === "Invitado" ? "" : nombre);
  const [contacto, setContacto] = useState("");
  const pronto = (que: string) => () => muyPronto(que);

  return (
    <Screen>
      {real && !sesion && (
        <Card style={{ borderColor: C.navy, borderWidth: 2 }}>
          <H2>Entra a tu cuenta Dlux</H2>
          <Muted>La misma cuenta sirve en Dlux Go y Dlux Delivery.</Muted>
          <Button icon="person-circle" title="Entrar o crear cuenta" onPress={() => router.push("/entrar")} />
        </Card>
      )}
      <Card style={{ alignItems: "center" }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: C.yellow, fontSize: 30, fontWeight: "900" }}>{(nombre[0] ?? "D").toUpperCase()}</Text>
        </View>
        <H2>{nombre}</H2>
        <Muted>{real ? "" : "⭐ 4.9 como pasajero · "}{viajes.length} viajes</Muted>
      </Card>
      <Card>
        <Field label="¿Cómo te llamas?" value={txt} onChangeText={setTxt} placeholder="Tu nombre" />
        <Button small title="Guardar" disabled={!txt.trim()} onPress={() => setNombre(txt.trim())} />
      </Card>
      <Card>
        <H2>Contactos de confianza</H2>
        <Muted>Les mandamos tu viaje en vivo cuando tocas “Ayuda”.</Muted>
        {contactos.map((c) => (
          <Text key={c} style={{ color: C.text }}>
            • {c}
          </Text>
        ))}
        <Field label="Agregar contacto" value={contacto} onChangeText={setContacto} placeholder="Nombre y teléfono" />
        <Button
          small
          variant="outline"
          title="Agregar"
          disabled={contacto.trim().length < 3}
          onPress={() => {
            agregarContacto(contacto.trim());
            setContacto("");
          }}
        />
      </Card>
      <Item icon="bookmark" title="Lugares guardados" subtitle={guardados.map((g) => g.nombre).join(", ")} onPress={pronto("Editar lugares guardados")} />
      <Item icon="card" title="Métodos de pago" subtitle="Tarjeta y efectivo" onPress={pronto("Guardar tus tarjetas")} />
      <Item icon="wallet" title="Saldo Dlux" subtitle="$0.00 · cambio a favor y adeudos de efectivo" onPress={pronto("El saldo a favor")} />
      <Item icon="business" title="Viajes de empresa" subtitle="Factura y cobro a tu empresa" onPress={pronto("Las cuentas de empresa")} />
      <Item icon="fast-food" title="Dlux Delivery" subtitle="Comida, súper y farmacia" onPress={() => Linking.openURL(DELIVERY_URL)} />
      <Item icon="car" title="Maneja con Dlux" subtitle="Sin comisión: solo una membresía al mes" onPress={pronto("Registrarte como conductor desde aquí")} />
      <Item icon="help-buoy" title="Ayuda" subtitle="Reportes, objetos olvidados y preguntas" onPress={pronto("El centro de ayuda")} />
      {real && sesion && (
        <>
          <Muted style={{ textAlign: "center" }}>{sesion.user.email}</Muted>
          <Button variant="outline" icon="log-out" title="Cerrar sesión" onPress={salir} />
        </>
      )}
    </Screen>
  );
}
