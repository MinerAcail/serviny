// import { Libraries } from "./types"
import { ZONE_COLORS } from "@/components/config/map"
import { gql } from "@apollo/client"
import {  type Libraries } from "@react-google-maps/api"

// Libraries to load with the Google Maps API
export const GOOGLE_MAPS_LIBRARIES: Libraries = ["places"]

// GraphQL query for isochrones
export const GET_ISOCHRONE_RESULT = gql`
  query GetIsochroneResult($uuid: String!, $location: [Float!]!) {
    getIsochroneResult(uuid: $uuid, location: $location) {
      geojson
      range
      transportMode
      address
      uuid
      locations
    }
  }
`

// Conversion speeds in km/h
export const SPEED_MAPPING = {
  walking: 5,
  bike: 15,
  motorbike: 30,
  car: 60,
}


// Default center coordinates (example: Accra, Ghana)
export const DEFAULT_CENTER = [-0.2649412, 5.5582733]

// Default zoom level
export const DEFAULT_ZOOM = 12

// Default isochrone UUID (would come from props in real app)
export const DEFAULT_ISOCHRONE_UUID = "72bf2db2-dffc-46f8-86dc-edfbb6b960ef"