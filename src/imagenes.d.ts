// Imágenes importadas desde el código (Expo las convierte en recursos)
declare module "*.png" {
  const valor: import("react-native").ImageSourcePropType;
  export default valor;
}
