// Types
export interface Gallery {
  id: string;
  title: string;
  description: string;
  categories: string[];
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

// GraphQL Query
import { gql } from "@apollo/client";
//
export const GET_ALL_GALLERY = gql`
  query GetAllGallery($serviceId: String!) {
    getAllGallery(ServiceId: $serviceId) {
      id
      title
      description
      categories
      imageUrls
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_POLICY = gql`
  mutation CreatePolicy($input: CreatePolicyInput!) {
    createPolicy(input: $input) {
      id
      name
      description
    }
  }
`;
