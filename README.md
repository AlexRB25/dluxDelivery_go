# Dlux Go

App de usuarios de Dlux para pedir **viajes** (moto, económico, comfort, XL) y **mandar paquetes** (Expo SDK 57 + expo-router). Corre en Android, iPhone y **navegador**.

Por ahora corre en **modo demo**: lugares conocidos de Guadalajara, conductores de ejemplo y viajes que avanzan solos (unos 2.5 minutos; mantener presionada la tarjeta de estado lo adelanta). La interfaz ya no dice "demo": en computadora el mapa ocupa la pantalla con el panel al lado, y en celular se adapta. Sirve para enseñarla a clientes con un link.

## Correr

```bash
npm install
npm run web             # en el navegador
npx expo start          # en el celular con Expo Go
npm run build:web       # genera dist/ (sitio estático; vercel.json ya lo configura)
npm run typecheck
```

## Qué se puede probar

- **Inicio**: mapa, "¿A dónde vas?", viaje o paquete, lugares guardados y recientes, servicios, promociones y la sección pequeña "¿Hambre?" que abre Dlux Delivery (`EXPO_PUBLIC_DELIVERY_URL`).
- **Origen, destino y hasta 4 paradas**: buscador de lugares o tocar el mapa.
- **Elegir servicio**: precio de cada tipo (base + km + minuto, con mínimo, como `service_rates`), cuánto tarda en llegar y a qué hora llegas; agendar; tarjeta (se aparta la tarifa + 30 % y se cobra lo real; el cargo de tarjeta de 3.6 % + $3 lo paga el usuario) o efectivo con cambio; códigos `GO20` y `PRIMERVIAJE`.
- **Paquetes**: quién recibe, teléfono, qué se manda y tamaño; código de entrega.
- **Viaje en curso**: buscando conductor → va por ti (auto moviéndose en el mapa, placas) → llegó (5 min de espera gratis, luego $3/min) → en camino → llegaste. Agregar parada o cambiar destino (el conductor acepta y la tarifa se recalcula), compartir el viaje (vista de quien recibe el enlace, sin cuenta), botón de ayuda (911, Dlux, contactos de confianza), cancelar (gratis hasta que llega el conductor; después $30).
- **Al terminar**: cobro real con paradas y cambios, propina (solo tarjeta, completa al conductor), calificación y reporte.
- **Viajes**: en curso y anteriores, "repetir".
- **Cuenta**: nombre, contactos de confianza, accesos a lo que tendrá la app real y "empezar el demo de cero".

## Cómo está hecho

- `src/lib/demo.ts`: servicios y tarifas, lugares, conductores, códigos.
- `src/lib/reglas.ts`: distancia, tiempo, tarifa, descuentos y cargo de tarjeta (como `quote_route` y `card_fee_for`).
- `src/lib/simulacion.ts`: estados del viaje, cambios aceptados y cobro final.
- `src/lib/app.tsx`: estado (borrador del viaje, viajes, lugares), guardado en el dispositivo.
- `src/components/Mapa.tsx` / `Mapa.web.tsx`: Leaflet + OpenStreetMap.

## Falta para la app real

- Supabase: login (misma cuenta que Dlux Delivery), `quote_trip`, `request_trip` (con `p_extra_stops` y `p_promo_code`), seguimiento con Realtime, `request_trip_change`, `share_trip` / `shared_trip`, `cancel_trip`, `add_tip`, `open_ticket`, saldo con `my_balance`.
- Buscador de direcciones real (Google Places) y rutas reales.
- Cobro con Stripe (apartar y capturar), push de estados y deep link a Dlux Delivery con token de un solo uso.
