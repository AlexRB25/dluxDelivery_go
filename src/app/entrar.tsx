import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";

import { Button, C, Card, Field, Muted, Notice } from "@/components/ui";
import { authErrorMessage, MODO_REAL, supabase } from "@/lib/supabase";
import LOGO from "@/assets/images/logo-dlux-go.png";

/** Entrar o crear cuenta. La misma cuenta sirve en Dlux Delivery y Dlux Go. */
export default function Entrar() {
  const router = useRouter();
  const [modo, setModo] = useState<"entrar" | "crear">("entrar");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [aviso, setAviso] = useState("");

  const listo = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const enviar = async () => {
    setAviso("");
    const auth = supabase().auth;
    if (modo === "entrar") {
      const { error } = await auth.signInWithPassword({ email: correo.trim(), password: clave });
      if (error) throw new Error(authErrorMessage(error));
      listo();
      return;
    }
    if (nombre.trim().length < 3) throw new Error("Escribe tu nombre completo");
    if (telefono.replace(/\D/g, "").length !== 10) throw new Error("Escribe tu celular a 10 dígitos");
    const { data, error } = await auth.signUp({
      email: correo.trim(),
      password: clave,
      options: { data: { full_name: nombre.trim(), phone: telefono.replace(/\D/g, "") } },
    });
    if (error) throw new Error(authErrorMessage(error));
    if (!data.session) {
      setAviso("Te mandamos un correo para confirmar tu cuenta. Ábrelo y luego entra aquí.");
      setModo("entrar");
      return;
    }
    listo();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: C.navy }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, flexGrow: 1, justifyContent: "center", width: "100%", maxWidth: 460, alignSelf: "center" }} keyboardShouldPersistTaps="always">
        <View style={{ alignItems: "center", gap: 8 }}>
          <Image source={LOGO} style={{ width: 84, height: 84, borderRadius: 22 }} />
          <Text style={{ color: "#fff", fontSize: 28, fontWeight: "800" }}>
            Dlux <Text style={{ color: C.yellow }}>Go</Text>
          </Text>
          <Text style={{ color: C.gray, textAlign: "center" }}>Viajes y paquetes en minutos.</Text>
        </View>
        {!MODO_REAL && <Notice tone="danger">Esta versión no está conectada a la base de Dlux.</Notice>}
        <Card>
          {aviso ? <Notice tone="ok">{aviso}</Notice> : null}
          {modo === "crear" && (
            <>
              <Field label="Nombre completo" value={nombre} onChangeText={setNombre} autoComplete="name" />
              <Field label="Celular" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" maxLength={14} hint="Para que el conductor te pueda avisar" />
            </>
          )}
          <Field label="Correo" value={correo} onChangeText={setCorreo} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Field label="Contraseña" value={clave} onChangeText={setClave} secureTextEntry autoComplete={modo === "crear" ? "new-password" : "current-password"} />
          <Button title={modo === "entrar" ? "Entrar" : "Crear cuenta"} onPress={enviar} disabled={!correo || clave.length < 6} />
          <Button variant="outline" title={modo === "entrar" ? "Soy nuevo: crear cuenta" : "Ya tengo cuenta"} onPress={() => setModo(modo === "entrar" ? "crear" : "entrar")} />
          <Muted style={{ textAlign: "center" }}>Si ya usas Dlux Delivery, entra con la misma cuenta.</Muted>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
