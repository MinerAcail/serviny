import { gql } from "@apollo/client";

export const GET_PRODUCTS = gql`
  query getAllProducts ($query: String,$vendorId: String){
    getAllProducts(query: $query,vendorId: $vendorId) {
      id
      name
      price
      state
      categories
      imageUrls
    }
  }
`;