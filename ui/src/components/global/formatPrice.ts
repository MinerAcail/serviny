import { Production } from "@/index";
import { type Libraries } from "@react-google-maps/api";

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(price);
}
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const libraries: Libraries = ["places"];

//
export const GOOGLE_MAPS_CONFIG = {
  id: "google-map-script",
  googleMapsApiKey: googleMapsApiKey,
  libraries: libraries,
};
// const Production = true; 

const API_URL = Production ? `https://files.winnemart.com/` : `http://localhost:9000`;
// const API_URL = 'http://localhost:9000';

export const getImageUrl = (dpfilePath: string | null | undefined): string | null => {
  if (!dpfilePath) return null;
  
  // Remove /minio prefix and prepend files domain
  // return dpfilePath;

  return dpfilePath.replace('/minio/', API_URL);
};