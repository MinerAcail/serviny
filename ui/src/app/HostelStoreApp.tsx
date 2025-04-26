import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useDeviceType } from "@/hooks/useDeviceType";
import { gql } from "@apollo/client";
import CartSidebar from "@/components/custom/CartSidebar";
import ItemGrid from "@/components/custom/ItemGrid";
import ItemCarousel from "@/components/custom/view";
import Loading from "../components/ui/loading.tsx";
import { useCart, Item } from "@/hooks/CartContext.tsx";
import NavBar from "./navBar.tsx";
import { ClearLocalStore } from "@/middleware/bar.tsx";
import { NoItemsFound } from "@/components/custom/Empty.tsx";
// import MultipleCountdown from "@/components/custom/timer.tsx";
// import MultipleCountdown from "@/components/custom/timer.tsx";
// import { WelcomePopupCard } from "@/components/ui/welcome-popup-card.tsx";
import CategoryBar from "@/components/ui/category-bar.tsx";
import { useParams, useSearchParams } from "react-router";
import { LoaderCircle } from "lucide-react";

const GET_PRODUCTS = gql`
  query getAllProducts(
    $query: String
    $vendorId: String
    $limit: Int
    $offset: Int
  ) {
    getAllProducts(
      query: $query
      vendorId: $vendorId
      limit: $limit
      offset: $offset
    ) {
      id
      name
      price
      state
      categories
      imageUrls
      VendorId
      commission
    }
  }
`;

const LIMIT = 10;

const HostelStoreContent: React.FC = () => {
  const { vendorId } = useParams();
  const [searchParams] = useSearchParams();
  const name = searchParams.get("name"); // Get "name" query param
  const { isDesktop } = useDeviceType();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>(name || ""); // Use name if available
  const [selectedProduct, setSelectedProduct] = useState<Item | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const {
    cart,
    hostelDetails,
    setHostelDetails,
    removeFromCart,
    addToCart,
    placeOrder,
  } = useCart();

  const { data, loading, error, fetchMore, refetch } = useQuery(GET_PRODUCTS, {
    variables: {
      query: searchTerm.trim() || null,
      vendorId: vendorId?.trim() || null,
      limit: LIMIT,
      offset: 0,
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "network-only", // Force network request each time
    nextFetchPolicy: "network-only", // Ensure subsequent fetches also hit network
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category") || "All";
    setSelectedCategory(category);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (selectedCategory !== "All") {
      params.set("category", selectedCategory);
    } else {
      params.delete("category");
    }

    window.history.pushState(
      {},
      "",
      `${window.location.pathname}${
        params.toString() ? "?" + params.toString() : ""
      }`
    );
  }, [selectedCategory]);

  function handleSearch(value: string): void {
    setSearchTerm(value);
    refetch({ query: value });
  }

  const loadMoreProducts = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const firstEntry = entries[0];
      if (firstEntry.isIntersecting && data?.getAllProducts.length >= LIMIT) {
        setIsFetchingMore(true); // Set fetching state to true
        fetchMore({
          variables: {
            query: searchTerm,
            vendorId: vendorId?.trim() || null,
            limit: LIMIT,
            offset: data?.getAllProducts.length || 0,
          },
          updateQuery: (prev, { fetchMoreResult }) => {
            setIsFetchingMore(false); // Reset fetching state after fetching
            if (!fetchMoreResult || fetchMoreResult.getAllProducts.length === 0)
              return prev;
            return {
              getAllProducts: [
                ...prev.getAllProducts,
                ...fetchMoreResult.getAllProducts,
              ],
            };
          },
        }).catch(() => setIsFetchingMore(false)); // Handle errors and reset state
      }
    },
    [fetchMore, searchTerm, vendorId, data]
  );

  useEffect(() => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(loadMoreProducts, {
      threshold: 1.0,
    });

    const target = document.getElementById("load-more-trigger");
    if (target) observer.current.observe(target);

    return () => observer.current?.disconnect(); // Cleanup observer
  }, [loadMoreProducts, data]);

  if (error) return <p>Error: {error.message}</p>;

  const products: Item[] = data?.getAllProducts ?? [];
  const filteredItems: Item[] = products.filter(
    (item) =>
      selectedCategory === "All" || item.categories.includes(selectedCategory)
  );

  return (
    <div className="maincontainer mx-auto px-4">
      {/* <WelcomePopupCard onSearch={handleSearch} /> */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full">
          <div className="pb-11">
            <NavBar onSearch={handleSearch} />
          </div>
          <CategoryBar onCategoryChange={handleSearch} />
          {loading && products.length === 0 ? (
            <Loading />
          ) : (
            <>
              {filteredItems.length === 0 ? (
                <NoItemsFound />
              ) : (
                <>
                  <ItemGrid
                    filteredItems={filteredItems}
                    addToCart={addToCart}
                    onItemSelect={setSelectedProduct}
                    className="grid grid-cols-2 pt-20 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4"
                  />
                  <div id="load-more-trigger" className="h-10">
                    {isFetchingMore && (
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                    )}
                    {/* Show spinner only when fetching */}
                  </div>
                </>
              )}
            </>
          )}
          <div id="load-more-trigger" className="h-10" />
          <ItemCarousel
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            addToCart={addToCart}
          />
        </div>
        {filteredItems.length !== 0 && isDesktop && (
          <div className="w-full lg:w-1/4">
            <div className="sticky top-4">
              <CartSidebar
                cart={cart}
                hostelDetails={hostelDetails}
                setHostelDetails={setHostelDetails}
                removeFromCart={removeFromCart}
                placeOrder={placeOrder}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HostelStoreApp: React.FC = () => {
  const rawOrderId = localStorage.getItem("foodie_last_order_id");
  const orderId = rawOrderId ? rawOrderId.replace(/^"|"$/g, "").trim() : null;
  const sanitizedOrderId = orderId && orderId.length > 0 ? orderId : null;

  const [clearLocalStore, { data }] = useMutation(ClearLocalStore);

  useEffect(() => {
    if (!sanitizedOrderId) return;

    clearLocalStore({
      variables: { orderId: sanitizedOrderId },
    });
  }, [sanitizedOrderId, clearLocalStore]);
  // console.log("data",data);

  useEffect(() => {
    if (data?.clearLocalStore) {
      localStorage.removeItem("foodie_last_order_id");
    }
  }, [data]);

  return <HostelStoreContent />;
};
export default HostelStoreApp;
