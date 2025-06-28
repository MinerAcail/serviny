export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(price);
}
import {  type Libraries } from "@react-google-maps/api";
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const libraries: Libraries = ["places"];

//
export const GOOGLE_MAPS_CONFIG = {
  id: "google-map-script",
  googleMapsApiKey: googleMapsApiKey,
  libraries: libraries,
};