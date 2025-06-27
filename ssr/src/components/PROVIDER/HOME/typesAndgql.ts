import { gql } from "@apollo/client";

export const GET_PROVIDER = gql`
  query getProvider($serviceId: String!) {
    getProvider(ServiceId: $serviceId) {
      id
      dpfile
      name
      number
      email
      profession
      categories
      aboutMe
      location
      createdAt
      businessType
      coordinates
    }
  }
`;