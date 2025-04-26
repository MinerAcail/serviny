import { gql } from "@apollo/client";

// Define the mutation
export const CREATE_ORDER_ITEMS = gql`
  mutation CreateOrderItems($input: OrderInput) {
    createOrderItems(input: $input) {
      id
      customerNumber
      status
      deliveryAddress
      estimatedDeliveryDate
      items {
        id
        productId
        quantity
        orderId
      }
    }
  }
`;

// Type definitions
export interface OrderItem {
  ProductID: string;
  quantity: number;
}

export interface OrderInput {
  customerNumber: string;
  deliveryAddress: string;
  item: OrderItem[];
}
