import { Helmet } from "react-helmet-async";
import { useQuery, gql } from "@apollo/client";
import { useParams } from "react-router";

const GET_SHARED_VENDOR = gql`
  query getSharedVendor($Vendor: String!) {
    getSharedVendor(VendorId: $Vendor) {
      id
      name
      number
      type
      dpfile
    }
  }
`;

const SocialMediaHelmet = () => {
  const { Vendorid } = useParams();
  const { data, loading, error } = useQuery(GET_SHARED_VENDOR, {
    variables: { Vendor: Vendorid },
  });

  if (loading || error) return null;

  const vendorData = data?.getSharedVendor;
  const pageUrl = typeof window !== "undefined"
    ? window.location.href
    : `https://winnemart.com/vendor/${Vendorid}`;

  const pageTitle = vendorData?.name
    ? `${vendorData.name} | Vendor Profile`
    : "Vendor Profile";
  const pageDescription = vendorData?.type
    ? `${vendorData.name} - ${vendorData.type} Vendor Profile`
    : "Check out this vendor profile.";

  const pageImage = vendorData?.dpfile?.startsWith("http")
    ? vendorData.dpfile
    : `https://winnemart.com${vendorData.dpfile || "/default-image.jpg"}`;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:type" content="profile" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
    </Helmet>
  );
};

export default SocialMediaHelmet;
