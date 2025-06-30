import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";

const MAIN_WEBSITE_URL = "https://winnemart.com";
const MINIO_BASE_URL = "https://files.winnemart.com"; // Fixed: Use the correct MinIO domain

async function getProviderBySubdomain(subDomain) {
  const res = await fetch("https://api.winnemart.com/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query GetProviderByUsername($subDomain: String!) {
          getProviderByUsername(subDomain: $subDomain) {
            id
            name
            number
            type
            dpfile
            profession
            subDomain
          }
        }
      `,
      variables: { subDomain },
    }),
    cache: "no-store",
  });

  const json = await res.json();
  return json?.data?.getProviderByUsername;
}

// Helper function to construct image URL properly
function getImageUrl(dpfile) {
  if (!dpfile) return `${MINIO_BASE_URL}/default-avatar.jpg`;
  
  // If it's already a full URL, use it as is
  if (dpfile.startsWith("http")) return dpfile;
  
  // If it starts with /minio/, replace it with the correct base URL
  if (dpfile.startsWith("/minio/")) {
    return `${MINIO_BASE_URL}${dpfile.replace("/minio", "")}`;
  }
  
  // If it's just a path, prepend the base URL
  return `${MINIO_BASE_URL}${dpfile.startsWith("/") ? dpfile : "/" + dpfile}`;
}

export async function generateMetadata() {
  const host = headers().get("host") || "";
  const subdomain = host.split(".")[0];

  if (!subdomain || subdomain === "www" || subdomain === "winnemart") notFound();

  const provider = await getProviderBySubdomain(subdomain);
  if (!provider) notFound();

  const imageUrl = getImageUrl(provider.dpfile);
  const professions = provider.profession?.join(", ") || "Service Provider";

  return {
    title: `${provider.name}`,
    description: `${provider.name} specializes in ${professions}. Explore more on winnemart.`,
    openGraph: {
      title: `${provider.name}`,
      description: `Offers services in ${professions}.`,
      images: [{ url: imageUrl }],
      type: "profile",
      url: `https://${host}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${provider.name}`,
      description: `Offers services in ${professions}.`,
      images: [imageUrl],
    },
  };
}

export default async function SharedProviderPage() {
  const host = headers().get("host") || "";
  const subdomain = host.split(".")[0];

  if (!subdomain || subdomain === "www" || subdomain === "winnemart") notFound();

  const provider = await getProviderBySubdomain(subdomain);
  if (!provider) notFound();

  const userAgent = headers().get("user-agent") || "";
  const bots = [
    "facebookexternalhit",
    "Twitterbot",
    "WhatsApp",
    "Discordbot",
    "LinkedInBot",
    "TelegramBot",
    "SkypeUriPreview",
  ];
  
  const isBot = bots.some((bot) => userAgent.toLowerCase().includes(bot.toLowerCase()));

  const imageUrl = getImageUrl(provider.dpfile);
  const professions = provider.profession?.join(", ") || "a verified professional";

  if (isBot) {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{`${provider.name} • Profile on winnemart`}</title>
          <meta name="description" content={`Discover ${provider.name}'s services in ${professions} on winnemart.`} />
          
          {/* Open Graph tags */}
          <meta property="og:title" content={`${provider.name} • Profile on winnemart`} />
          <meta property="og:description" content={`Discover ${provider.name}'s services in ${professions} on winnemart.`} />
          <meta property="og:image" content={imageUrl} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:url" content={`https://${host}`} />
          <meta property="og:type" content="profile" />
          <meta property="og:site_name" content="winnemart" />
          
          {/* Twitter Card tags */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={`${provider.name} • Profile on winnemart`} />
          <meta name="twitter:description" content={`Discover ${provider.name}'s services in ${professions} on winnemart.`} />
          <meta name="twitter:image" content={imageUrl} />
          
          {/* Additional meta tags */}
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href={`https://${host}`} />
        </head>
        <body>
          <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1>{provider.name}</h1>
            <p>Specializes in: {professions}</p>
            <img src={imageUrl} alt={provider.name} style={{ maxWidth: "300px", height: "auto" }} />
            <p>Visit {provider.name}'s profile on <a href={`https://${subdomain}.r.winnemart.com/providers/${provider.id}`}>winnemart</a></p>
          </div>
        </body>
      </html>
    );
  }

  // Redirect human users to Vite frontend via subdomain.r.winnemart.com
  redirect(`https://${subdomain}.r.winnemart.com/providers/${provider.id}`);
}