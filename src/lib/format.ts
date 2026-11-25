const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
export const pesos = (v: number | string | null | undefined) => mxn.format(Number(v ?? 0));
export const hora = (ms: number) => new Date(ms).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
export const fechaHora = (ms: number) =>
  new Date(ms).toLocaleString("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const km = (k: number) => (k < 1 ? `${Math.round(k * 1000)} m` : `${k.toFixed(1)} km`);

/** Link a Dlux Delivery (en el celular sería el deep link dluxdelivery://, o la tienda si no está instalada). */
export const DELIVERY_URL = process.env.EXPO_PUBLIC_DELIVERY_URL || "https://dlux-delivery-demo.vercel.app";
