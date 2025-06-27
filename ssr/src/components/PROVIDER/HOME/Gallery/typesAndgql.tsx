import { gql } from "@apollo/client";

export interface Gallery {
  id: string;
  title: string;
  description: string;
  categories: string[];
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}
// GraphQL Queries and Mutations
export const GET_ALL_GALLERY = gql`
   query GetAllGallery(
    $serviceId: String!
    $query: String
    $limit: Int
    $offset: Int
  ) {
    getAllGallery(
      ServiceId: $serviceId
      query: $query
      limit: $limit
      offset: $offset
    ) {
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
export const GET_ALL_CATEGORIES = gql`
  query GetAllCategoriesFromGallery($serviceId: String!) {
    getAllCategoriesFromGallery(ServiceId: $serviceId)
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

export const UPDATE_GALLERY = gql`
  mutation UpdateGallery(
    $galleryID: String!
    $files: [Upload]
    $input: GalleryProfessionInput!
    $removeUrl: [String]
  ) {
    updateGallery(
      galleryID: $galleryID
      files: $files
      input: $input
      removeUrl: $removeUrl
    ) {
      id
      title
      description
      categories
      imageUrls
    }
  }
`;

export const DELETE_GALLERY = gql`
  mutation DeleteGallery($id: String!) {
    deleteGallery(id: $id)
  }
`;

export interface GalleryCardProps {
  gallery?: Gallery;
  onClick?: (gallery: Gallery) => void;
}

export interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  serviceId: string;
}