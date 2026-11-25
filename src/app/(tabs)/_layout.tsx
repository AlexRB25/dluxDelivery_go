import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { C } from "@/components/ui";
import { useApp } from "@/lib/app";
import { activo } from "@/lib/simulacion";

export default function TabsLayout() {
  const { viajes, ahora } = useApp();
  const enCurso = viajes.filter((v) => activo(v, ahora)).length;
  return (
    <Tabs
      screenOptions={{
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
