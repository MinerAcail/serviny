import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";

const MAIN_WEBSITE_URL = "https://serviny.com";
const MINIO_BASE_URL = "https://serviny.com";

async function getProviderBySubdomain(subDomain) {
  const res = await fetch("https://api.serviny.com/query", {
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
      variables: {subDomain },
    }),
    cache: "no-store",
  });

  const json = await res.json();
  return json?.data?.getProviderByUsername;
}

export async function generateMetadata() {
  const host = headers().get("host") || "";
  const subdomain = host.split(".")[0];
console.log("subdomain",subdomain);

  if (!subdomain || subdomain === "www" || subdomain === "serviny") notFound();

  const provider = await getProviderBySubdomain(subdomain);
  console.log("subDomain",provider);
  
  if (!provider) notFound();

  const imageUrl = provider.dpfile?.startsWith("http")
    ? provider.dpfile
    : `${MINIO_BASE_URL}${provider.dpfile || "/default-avatar.jpg"}`;

  const professions = provider.profession?.join(", ") || "Service Provider";

  return {
    title: `${provider.name}`,
    description: `${provider.name} specializes in ${professions}. Explore more on SERVINY.`,
    openGraph: {
      title: `${provider.name}`,
      description: `Offers services in ${professions}.`,
      images: [{ url: imageUrl }],
      type: "profile",
    },
  };
}

export default async function SharedProviderPage() {
  const host = headers().get("host") || "";
  const subdomain = host.split(".")[0];

  if (!subdomain || subdomain === "www" || subdomain === "serviny") notFound();

  const provider = await getProviderBySubdomain(subdomain);
  if (!provider) notFound();

  const userAgent = headers().get("user-agent") || "";
  const bots = [
    "facebookexternalhit",
    "Twitterbot",
    "WhatsApp",
    "Discordbot",
    "LinkedInBot",
  ];
  const isBot = bots.some((bot) => userAgent.includes(bot));

  const imageUrl = provider.dpfile?.startsWith("http")
    ? provider.dpfile
    : `${MINIO_BASE_URL}${provider.dpfile || "/default-avatar.jpg"}`;

  const professions = provider.profession?.join(", ") || "a verified professional";

  if (isBot) {
    return (
      <html>
        <head>
          <meta property="og:title" content={`${provider.name} • Profile on SERVINY`} />
          <meta
            property="og:description"
            content={`Discover ${provider.name}'s services in ${professions} on SERVINY.`}
          />
          <meta property="og:image" content={imageUrl} />
          <meta property="og:url" content={`https://${host}`} />
          <meta property="og:type" content="profile" />
        </head>
        <body>
          <p>OG metadata served for {provider.name}</p>
        </body>
      </html>
    );
  }

  // redirect(`${provider.subDomain.MAIN_WEBSITE_URL}/providers/${provider.id}`);
  redirect(`https://${host}/providers/${provider.id}`);

}