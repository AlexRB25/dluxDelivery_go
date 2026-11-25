import { Ionicons } from "@expo/vector-icons";
import { useState, type PropsWithChildren, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Aviso simple que también funciona en el navegador (Alert no hace nada en web). */
export function avisar(titulo: string, mensaje = "") {
  if (Platform.OS === "web") window.alert(mensaje ? `${titulo}

${mensaje}` : titulo);
  else Alert.alert(titulo, mensaje);
}

// Marca Dlux: azul marino, amarillo, gris y blanco
export const C = {
  navy: "#001F3F",
  navySoft: "#E6ECF3",
  yellow: "#FFD700",
  yellowSoft: "#FFF6CC",
  gray: "#DFDFDF",
  background: "#F3F4F6",
  surface: "#FFFFFF",
  border: "#E2E5EA",
  text: "#0B1320",
  muted: "#5F6B7A",
  ok: "#15803D",
  okSoft: "#DCFCE7",
  warn: "#B45309",
  warnSoft: "#FEF3C7",
  danger: "#B91C1C",
  dangerSoft: "#FEE2E2",
};

export function Screen({ children, scroll = true, padded = true }: PropsWithChildren<{ scroll?: boolean; padded?: boolean }>) {
  const inner = <View style={[{ gap: 12 }, padded && { padding: 16 }]}>{children}</View>;
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: C.background }}>
      {scroll ? <ScrollView keyboardShouldPersistTaps="always">{inner}</ScrollView> : inner}
    </SafeAreaView>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function H1({ children }: PropsWithChildren) {
  return <Text style={styles.h1}>{children}</Text>;
}
export function H2({ children }: PropsWithChildren) {
  return <Text style={styles.h2}>{children}</Text>;
}
export function T({ children, style, bold }: PropsWithChildren<{ style?: object; bold?: boolean }>) {
  return <Text style={[{ color: C.text, fontSize: 15 }, bold && { fontWeight: "700" }, style]}>{children}</Text>;
}
export function Muted({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

export function Row({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap: 8 }, style]}>{children}</View>;
}

/** Botón que muestra "cargando" mientras su acción corre, y el error de la base si falla. */
export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  small,
  icon,
  big,
}: {
  title: string;
  onPress: () => unknown;
  variant?: "primary" | "yellow" | "outline" | "danger" | "ok";
  disabled?: boolean;
  small?: boolean;
  big?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const [busy, setBusy] = useState(false);
  const bg = { primary: C.navy, yellow: C.yellow, outline: "transparent", danger: C.danger, ok: C.ok }[variant];
  const color = variant === "yellow" ? C.navy : variant === "outline" ? C.navy : "#fff";
  return (
    <Pressable
      disabled={disabled || busy}
      onPress={async () => {
        setBusy(true);
        try {
          await onPress();
        } catch (e) {
          avisar("No se pudo", e instanceof Error ? e.message : String(e));
        } finally {
          setBusy(false);
        }
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        variant === "outline" && { borderWidth: 1.5, borderColor: C.navy },
        small && { paddingVertical: 8, paddingHorizontal: 12 },
        big && { paddingVertical: 18 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={color} />
      ) : (
        <Row style={{ justifyContent: "center" }}>
          {icon && <Ionicons name={icon} size={small ? 16 : 20} color={color} />}
          <Text style={{ color, fontWeight: "700", fontSize: big ? 18 : small ? 14 : 16 }}>{title}</Text>
        </Row>
      )}
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontWeight: "600", color: C.text }}>{label}</Text>
      <TextInput placeholderTextColor={C.muted} {...props} style={[styles.input, props.style]} />
      {hint ? <Muted>{hint}</Muted> : null}
    </View>
  );
}

export function Badge({ children, tone = "muted" }: PropsWithChildren<{ tone?: "ok" | "warn" | "danger" | "muted" | "navy" }>) {
  const map = {
    ok: [C.okSoft, C.ok],
    warn: [C.warnSoft, C.warn],
    danger: [C.dangerSoft, C.danger],
    muted: [C.background, C.muted],
    navy: [C.navySoft, C.navy],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: "flex-start" }}>
      <Text style={{ color: fg, fontWeight: "700", fontSize: 12 }}>{children}</Text>
    </View>
  );
}

export function Notice({ children, tone = "warn", icon }: { children: ReactNode; tone?: "warn" | "danger" | "ok" | "navy"; icon?: keyof typeof Ionicons.glyphMap }) {
  const map = { warn: [C.warnSoft, C.warn], danger: [C.dangerSoft, C.danger], ok: [C.okSoft, C.ok], navy: [C.navySoft, C.navy] } as const;
  const [bg, fg] = map[tone];
  return (
    <Row style={{ backgroundColor: bg, padding: 12, borderRadius: 12, alignItems: "flex-start" }}>
      {icon && <Ionicons name={icon} size={20} color={fg} />}
      <View style={{ flex: 1 }}>{typeof children === "string" ? <Text style={{ color: fg, fontWeight: "600" }}>{children}</Text> : children}</View>
    </Row>
  );
}

/** Fila de lista que se toca (menú de cuenta, pasos pendientes). */
export function Item({ icon, title, subtitle, onPress, right }: { icon?: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; onPress?: () => void; right?: ReactNode }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}>
      {icon && <Ionicons name={icon} size={22} color={C.navy} />}
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "600", color: C.text, fontSize: 15 }}>{title}</Text>
        {subtitle ? <Muted>{subtitle}</Muted> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={C.muted} /> : null)}
    </Pressable>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.background }}>
      <ActivityIndicator size="large" color={C.navy} />
    </View>
  );
}

export function Money({ children, size = 28 }: PropsWithChildren<{ size?: number }>) {
  return <Text style={{ fontSize: size, fontWeight: "800", color: C.navy }}>{children}</Text>;
}

/** Chip seleccionable (categorías, horarios, propina). */
export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: active ? C.navy : C.border, backgroundColor: active ? C.navy : C.surface },
        pressed && { opacity: 0.8 },
      ]}
    >
      {icon && <Ionicons name={icon} size={16} color={active ? C.yellow : C.navy} />}
      <Text style={{ color: active ? "#fff" : C.navy, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

/** − cantidad + */
export function Stepper({ value, onChange, min = 0 }: { value: number; onChange: (n: number) => void; min?: number }) {
  const btn = (icon: "remove" | "add" | "trash-outline", n: number) => (
    <Pressable onPress={() => onChange(n)} hitSlop={8} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.navySoft, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={icon} size={18} color={icon === "trash-outline" ? C.danger : C.navy} />
    </Pressable>
  );
  return (
    <Row style={{ gap: 10 }}>
      {btn(value - 1 <= 0 && min === 0 ? "trash-outline" : "remove", Math.max(min, value - 1))}
      <Text style={{ fontWeight: "800", fontSize: 16, minWidth: 18, textAlign: "center", color: C.text }}>{value}</Text>
      {btn("add", value + 1)}
    </Row>
  );
}

/** Cuadro de color con un emoji grande: portada de comercio o foto de producto del demo. */
export function Tile({ emoji, color, size = 64, radius = 14, style }: { emoji: string; color: string; size?: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ width: size, height: size, borderRadius: radius, backgroundColor: color, alignItems: "center", justifyContent: "center" }, style]}>
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: C.border },
  h1: { fontSize: 24, fontWeight: "800", color: C.text },
  h2: { fontSize: 18, fontWeight: "700", color: C.text },
  muted: { color: C.muted, fontSize: 14 },
  button: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16, backgroundColor: C.surface, color: C.text },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border },
});
