import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs } from "expo-router";
import { useEffect, useState, type ComponentProps } from "react";
import { Image, Pressable, Text, View, type ImageSourcePropType } from "react-native";

import { C } from "./ui";

type PropsBarra = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

const CLAVE = "dlux-barra-abierta";
const ABIERTA = 236;
const CERRADA = 76;

/** Menú lateral de la versión de computadora: logo, secciones con icono y botón para abrirlo o contraerlo. */
export function BarraLateral({ state, descriptors, navigation, logo, nombre }: PropsBarra & { logo: ImageSourcePropType; nombre: string }) {
  const [abierta, setAbierta] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(CLAVE)
      .then((v) => v === "0" && setAbierta(false))
      .catch(() => {});
  }, []);

  const alternar = () => {
    setAbierta((a) => {
      AsyncStorage.setItem(CLAVE, a ? "0" : "1").catch(() => {});
      return !a;
    });
  };

  return (
    <View style={{ width: abierta ? ABIERTA : CERRADA, backgroundColor: C.navy, paddingVertical: 16, paddingHorizontal: 12, gap: 6, borderRightWidth: 1, borderColor: "#ffffff14" }}>
      {/* Logo */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 2, marginBottom: 18, minHeight: 48 }}>
        <Image source={logo} style={{ width: 48, height: 48, borderRadius: 12 }} />
        {abierta && (
          <Text numberOfLines={1} style={{ color: C.yellow, fontWeight: "900", fontSize: 19, flex: 1 }}>
            {nombre}
          </Text>
        )}
      </View>

      {/* Secciones */}
      {state.routes.map((route, i) => {
        const { options } = descriptors[route.key];
        const activa = state.index === i;
        const color = activa ? C.navy : "#ffffffcc";
        const etiqueta = typeof options.tabBarLabel === "string" ? options.tabBarLabel : (options.title ?? route.name);
        const badge = options.tabBarBadge;
        const ir = () => {
          const e = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!activa && !e.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return (
          <Pressable
            key={route.key}
            onPress={ir}
            accessibilityRole="button"
            accessibilityLabel={etiqueta}
            style={({ hovered, pressed }: { hovered?: boolean; pressed: boolean }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 11,
              paddingHorizontal: abierta ? 12 : 0,
              justifyContent: abierta ? "flex-start" : "center",
              borderRadius: 12,
              backgroundColor: activa ? C.yellow : hovered || pressed ? "#ffffff1a" : "transparent",
            })}
          >
            <View>
              {options.tabBarIcon?.({ focused: activa, color, size: 22 })}
              {badge != null && !abierta && (
                <View style={{ position: "absolute", right: -8, top: -6, backgroundColor: C.yellow, borderRadius: 999, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.navy }}>
                  <Text style={{ color: C.navy, fontWeight: "900", fontSize: 10 }}>{badge}</Text>
                </View>
              )}
            </View>
            {abierta && <Text style={{ color, fontWeight: activa ? "800" : "600", fontSize: 15, flex: 1 }}>{etiqueta}</Text>}
            {abierta && badge != null && (
              <View style={{ backgroundColor: activa ? C.navy : C.yellow, borderRadius: 999, minWidth: 22, height: 22, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 }}>
                <Text style={{ color: activa ? C.yellow : C.navy, fontWeight: "900", fontSize: 12 }}>{badge}</Text>
              </View>
            )}
          </Pressable>
        );
      })}

      <View style={{ flex: 1 }} />

      {/* Abrir / contraer */}
      <Pressable
        onPress={alternar}
        accessibilityLabel={abierta ? "Contraer menú" : "Abrir menú"}
        style={({ hovered }: { hovered?: boolean; pressed: boolean }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: abierta ? "flex-start" : "center",
          gap: 10,
          paddingVertical: 10,
          paddingHorizontal: abierta ? 12 : 0,
          borderRadius: 12,
          backgroundColor: hovered ? "#ffffff1a" : "transparent",
        })}
      >
        <Ionicons name={abierta ? "chevron-back-circle" : "chevron-forward-circle"} size={24} color="#ffffffaa" />
        {abierta && <Text style={{ color: "#ffffffaa", fontWeight: "600" }}>Contraer menú</Text>}
      </Pressable>
    </View>
  );
}
