import { gql } from "@apollo/client"

// ============== QUERIES ==============

export const GET_PRICE_CARDS = gql`
  query GetPriceCards($serviceId: String) {
    getpriceCardsinformation(serviceId: $serviceId) {
      card {
        id
        title
        description
      }
      prices {
        id
        label
        value
      }
      amenities {
        id
        text
      }
    }
  }
`

export const GET_POLICY_INFORMATION = gql`
  query GetPolicyInformation($ServiceID: String!) {
    getPolicyInformation(ServiceID: $ServiceID) {
      policy {
        id
        name
        description
      }
      policyDetails {
        id
        title
        content
        listItems
      }
    }
  }
`

export const GET_INVOICE = gql`
  query GetInvoice($cargoId: String!) {
    getInvoice(cargoId: $cargoId) {
      id
      serviceId
      cargoId
      userId
      notes
      policyId
      priceId
      createdAt
      updatedAt
    }
  }
`

export const GET_CARGO_POLICY = gql`
  query GetCargoPolicy($cargoId: String!) {
    getCargoPolicy(cargoId: $cargoId) {
      policy {
        id
        name
        description
      }
      policyDetails {
        id
        title
        content
        listItems
      }
    }
  }
`

export const GET_CARGO_PRICE_CARD = gql`
  query GetCargoPriceCard($cardId: String!) {
    getCargoPriceCardById(cardId: $cardId) {
      card {
        id
        title
        description
      }
      prices {
        id
        label
        value
      }
      amenities {
        id
        text
      }
    }
  }
`

export const GET_RIDERS = gql`
  query GetRiders {
    riders {
      id
      name
      number
      location
      state
    }
  }
`

// ============== MUTATIONS ==============

export const UPDATE_CARGO_WITH_RIDER = gql`
  mutation UpdateCargoWithRider($riderId: String!, $cargoId: String!) {
    updateCargoWithRider(riderId: $riderId, cargoId: $cargoId) {
      id
      riderId
      status
    }
  }
`

export const CREATE_CARGO_PRICE_CARD = gql`
  mutation CreateCargoPriceCard($input: PriceCardInput!, $cargoId: String!) {
    createCargoPriceCard(input: $input, cargoId: $cargoId) {
      card {
        id
        title
        description
      }
      prices {
        id
        label
        value
      }
      amenities {
        id
        text
      }
    }
  }
`

export const CREATE_CARGO_POLICY = gql`
  mutation CreateCargoPolicy($input: CreatePolicyInput!, $cargoId: String!) {
    createCargoPolicy(input: $input, cargoId: $cargoId) {
      id
      name
      description
    }
  }
`

export const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: InvoiceInput!) {
    createInvoice(input: $input) {
      id
      serviceId
      cargoId
      userId
      notes
      policyId
      priceId
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice($invoiceId: String!, $input: UpdateInvoiceInput!) {
    updateInvoice(invoiceId: $invoiceId, input: $input) {
      id
      serviceId
      cargoId
      userId
      notes
      policyId
      priceId
      createdAt
      updatedAt
    }
  }
`

export const DELETE_INVOICE = gql`
  mutation DeleteInvoice($invoiceId: String!) {
    deleteInvoice(invoiceId: $invoiceId)
  }
`
