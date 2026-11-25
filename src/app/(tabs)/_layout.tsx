import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import LOGO from "@/assets/images/logo-dlux-go.png";
import { BarraLateral } from "@/components/BarraLateral";
import { C, useEscritorio } from "@/components/ui";
import { useApp } from "@/lib/app";
import { activo } from "@/lib/simulacion";

export default function TabsLayout() {
  // computadora: menú a la izquierda que se abre y se contrae; celular: pestañas abajo
  const escritorio = useEscritorio();
  const { viajes, ahora } = useApp();
  const enCurso = viajes.filter((v) => activo(v, ahora)).length;
  return (
    <Tabs
      tabBar={escritorio ? (props) => <BarraLateral {...props} logo={LOGO} nombre="Dlux Go" /> : undefined}
      screenOptions={{
        tabBarPosition: escritorio ? "left" : "bottom",
        headerStyle: { backgroundColor: C.navy },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
        tabBarActiveTintColor: C.navy,
        tabBarInactiveTintColor: C.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ headerShown: false, title: "Inicio", tabBarIcon: ({ color, size }) => <Ionicons name="car-sport" color={color} size={size} /> }} />
      <Tabs.Screen
        name="viajes"
        options={{
          title: "Mis viajes",
          tabBarLabel: "Viajes",
          tabBarBadge: enCurso || undefined,
          tabBarBadgeStyle: { backgroundColor: C.yellow, color: C.navy, fontWeight: "800" },
          tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="cuenta" options={{ title: "Cuenta", tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" color={color} size={size} /> }} />
    </Tabs>
  );
}
