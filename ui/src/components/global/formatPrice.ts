import { Production } from "@/index";
import { gql, useQuery } from "@apollo/client";
import { type Libraries } from "@react-google-maps/api";
import { useEffect } from "react";
import { ServiceData } from "../custom/USER_MAP_WORK/types";

export const formatPrice = (price: number | string) => {
  const numericPrice = Number(price);
  if (isNaN(numericPrice)) return "₵0.00";

  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(numericPrice);
};


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

  // If '/minio/' is present, replace it; otherwise, return the original string
  if (!Production) return dpfilePath;
  
  if (dpfilePath.includes('/minio/')) {
    return dpfilePath.replace('/minio/', API_URL);
  }
  
  return dpfilePath;
};

export const GET_PROVIDER = gql`
  query getProvider($serviceId: String) {
    getProvider(ServiceId: $serviceId) {
      id
      name
      businessType
    }
  }
`;

export function useGetProvider({ serviceId }: { serviceId: string }) {
  const { data } = useQuery(GET_PROVIDER, {
    variables: { serviceId }
  });

  useEffect(() => {
    if (data?.getProvider?.id) {
      localStorage.setItem("serviceId", data.getProvider.id);
    }
  }, [data?.getProvider?.id]);

  return {
    id: data?.getProvider?.id ?? null,
    name: data?.getProvider?.name ?? null,
    businessType: data?.getProvider?.businessType ?? null
  };
}

export function WordTruncateText(text: string, maxLength: number): string {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}



  // Calculates the total price of all products in the order
  const calculateSelectedItemTotalPrice = (selectedItem:ServiceData) => {
    if (
      !selectedItem ||
      selectedItem.type !== "ORDER" ||
      !selectedItem.orderData
    )
      return 0;

    const orderData = selectedItem.orderData;
    if (!orderData.productInfor) return 0;

    return orderData.productInfor.reduce((total, item) => {
      const productTotal = item.product.reduce((sum, product) => {
        const price =
          typeof product.price === "string"
            ? parseFloat(product.price)
            : product.price ?? 0;

        return sum + price;
      }, 0);

      return total + productTotal * item.quantity;
    }, 0);
  };

  const calculateSelectedRequestItemTotalPrice = (selectedItem:ServiceData) => {
    if (
      !selectedItem ||
      selectedItem.type !== "REQUESTITEM" ||
      !selectedItem.requestItemData
    )
      return 0;

    const requestItemData = selectedItem.requestItemData;
    if (!requestItemData.requestItem) return 0;

    return parseFloat(
      (
        Number(requestItemData?.requestItem?.price) *
        Number(requestItemData?.requestItem?.quantity || 0)
      ).toFixed(2)
    );
  };
  const calculateSelectedRequestItemDeliveryPrice = (selectedItem:ServiceData) => {
    if (
      !selectedItem ||
      selectedItem.type !== "REQUESTITEM" ||
      !selectedItem.requestItemData
    )
      return 0;

    const requestItemData = selectedItem.requestItemData;
    if (!requestItemData.requestItem) return 0;

    return parseFloat(requestItemData?.requestItem?.deliveryFee ?? "0");
  };
  const calculateSelectedItemsWithdeliveryPrice = (selectedItem:ServiceData) => {
    if (
      !selectedItem ||
      selectedItem.type !== "ORDER" ||
      !selectedItem.orderData
    )
      return 0;

    const orderData = selectedItem.orderData;
    if (!orderData.productInfor) return 0;

    return parseFloat(
      (
        Number(calculateSelectedItemTotalPrice(selectedItem)) +
        Number(orderData.serviceFee || 0)
      ).toFixed(2)
    );
  };
  const calculateSelectedItemsTotal = (selectedItem:ServiceData) => {
    if (
      !selectedItem ||
      selectedItem.type !== "REQUESTITEM" ||
      !selectedItem.requestItemData
    )
      return 0;

    const requestItemData = selectedItem.requestItemData;
    if (!requestItemData.requestItem) return 0;

    return parseFloat(
      (
        Number(calculateSelectedRequestItemDeliveryPrice(selectedItem)) +
        Number(calculateSelectedRequestItemTotalPrice(selectedItem))
      ).toFixed(2)
    );
  };
  // Calculates total quantity of items in the order
  export const calculateSelectedItemItemsCount = (selectedItem:ServiceData) => {
    if (
      !selectedItem ||
      selectedItem.type !== "ORDER" ||
      !selectedItem.orderData
    )
      return 0;

    const orderData = selectedItem.orderData;
    if (!orderData.productInfor) return 0;

    return orderData.productInfor.reduce((count, item) => {
      return count + item.quantity;
    }, 0);
  };
  // Helper function to get service ID display
  export const getServiceIdDisplay = (selectedItem:ServiceData) => {
    if (selectedItem?.type === "ORDER") {
      return selectedItem?.orderData?.orderId?.slice(-6) || "N/A";
    } else if (selectedItem?.type === "BOOKING") {
      return selectedItem?.bookingData?.bookingId?.slice(-6) || "N/A";
    } else {
      return selectedItem?.requestItemData?.requestId?.slice(-6) || "N/A";
    }
  };

  export const DisplayTotalProductPriceData = (selectedItem:ServiceData) => {
    if (selectedItem?.type === "ORDER") {
      return calculateSelectedItemTotalPrice(selectedItem) ?? 0;
    } else if (selectedItem?.type === "REQUESTITEM") {
      return calculateSelectedRequestItemTotalPrice(selectedItem) ?? 0;
    } else {
      return 0;
    }
  };
  export const DisplayAllTotalData = (selectedItem:ServiceData) => {
    if (selectedItem?.type === "ORDER") {
      return calculateSelectedItemsWithdeliveryPrice(selectedItem) ?? 0;
    } else if (selectedItem?.type === "REQUESTITEM") {
      return calculateSelectedItemsTotal(selectedItem) ?? 0;
    } else {
      return 0;
    }
  };
  export const DisplayDeliveryTotalData = (selectedItem:ServiceData) => {
    if (selectedItem?.type === "ORDER") {
      return Number(selectedItem?.orderData?.serviceFee || 0);
    } else if (selectedItem?.type === "REQUESTITEM") {
      return calculateSelectedRequestItemDeliveryPrice(selectedItem) ?? 0;
    } else {
      return 0;
    }
  };
  // Helper function to get service name
  export const getServiceName = (selectedItem:ServiceData) => {
    if (selectedItem?.type === "ORDER") return "Order";
    if (selectedItem?.type === "BOOKING") return "Booking";
    return "Request";
  };
  // const getServiceIcon = (selectedItem:ServiceData) => {
  //   if (selectedItem?.type === "ORDER") {
  //     return <Package className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />;
  //   } else if (selectedItem?.type === "BOOKING") {
  //     return <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />;
  //   } else {
  //     return (
  //       <PictureInPicture className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
  //     );
  //   }
  // };