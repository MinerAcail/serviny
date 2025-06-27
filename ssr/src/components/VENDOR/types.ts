import { gql } from "@apollo/client";

  export interface Product {
  id: string;
  name: string;
  description: string;
  categories: string[];
  imageUrls: string[];
  itemsType: string[];
  createdAt: string;
  updatedAt: string;
  price: number;
  state: string;
}
  export interface getAllProducts {
    id: string
    name: string
    price: number
    state: string
    categories: string[]
    images: string[]
  }
  
  export const GET_ALL_PRODUCT = gql`
     query getAllProducts($vendorId:String){
      getAllProducts(vendorId:$vendorId){
        id
        name
        description
        categories
        imageUrls
        createdAt
        updatedAt
      }
    }
  `;