import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { C, Loading } from "@/components/ui";
import { AppProvider, useApp } from "@/lib/app";

function Pantallas() {
  const { cargando } = useApp();
  if (cargando) return <Loading />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: C.navy },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: C.background },
        headerBackTitle: "Atrás",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="destino" options={{ title: "¿A dónde vas?" }} />
      <Stack.Screen name="cotizar" options={{ title: "Elige tu viaje" }} />
      <Stack.Screen name="viaje/[id]" options={{ title: "Tu viaje" }} />
      <Stack.Screen name="compartido" options={{ title: "Viaje compartido" }} />
      <Stack.Screen name="entrar" options={{ title: "Tu cuenta Dlux" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <Pantallas />
    </AppProvider>
  );
}
