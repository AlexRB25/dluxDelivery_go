import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Con la URL y la llave publicable de Supabase la app usa la base real de Dlux (cuentas, comercios, pedidos).
 * Sin ellas corre con el catálogo y los pedidos de ejemplo (así sigue funcionando el link de presentación).
 */
export const MODO_REAL = Boolean(url && key);

const client = createClient(url || "https://sin-configurar.supabase.co", key || "sin-configurar", {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

// En el celular la sesión se renueva solo con la app abierta
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") client.auth.startAutoRefresh();
    else client.auth.stopAutoRefresh();
  });
}

export const supabase = () => client;

/** Mensaje de un error de Supabase para el cliente: los que lanza el SQL ya vienen en español. */
export function dbError(error: { message: string; code?: string } | null | undefined) {
  if (!error) return "";
  if (/row-level security|permission denied/i.test(error.message)) return "Inicia sesión para continuar.";
  if (/fetch|network/i.test(error.message)) return "No se pudo conectar. Revisa tu internet.";
  return error.message;
}

/** Llama una función de la base y lanza el error ya en español. */
export async function rpc<T = unknown>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new Error(dbError(error));
  return data as T;
}

export function authErrorMessage(error: { code?: string; message: string }): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Correo o contraseña incorrectos.";
    case "user_already_exists":
    case "email_exists":
      return "Ya existe una cuenta con ese correo.";
    case "weak_password":
      return "La contraseña es muy débil. Usa al menos 8 caracteres.";
    case "email_not_confirmed":
      return "Confirma tu correo con el enlace que te enviamos antes de entrar.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Demasiados intentos. Espera un momento y vuelve a probar.";
    case "email_address_invalid":
      return "Ese correo no parece válido.";
    default:
      if (/fetch|network/i.test(error.message)) return "No se pudo conectar. Revisa tu internet.";
      return `Algo salió mal: ${error.message}`;
  }
}
