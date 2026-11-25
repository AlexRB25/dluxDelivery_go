import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, View } from "react-native";

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
    </Stack>
  );
}

export default function RootLayout() {
  // En computadora se ve como un celular al centro, para enseñarla igual que en el teléfono
  return (
    <AppProvider>
      <StatusBar style="light" />
      {Platform.OS === "web" ? (
        <View style={{ flex: 1, backgroundColor: C.navy, alignItems: "center" }}>
          <View style={{ flex: 1, width: "100%", maxWidth: 460, backgroundColor: C.background, overflow: "hidden" }}>
            <Pantallas />
          </View>
        </View>
      ) : (
        <Pantallas />
      )}
    </AppProvider>
  );
}
