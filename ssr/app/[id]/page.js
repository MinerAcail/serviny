import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";

const MAIN_WEBSITE_URL = "https://winnemart.com";
const MINIO_BASE_URL = "https://winnemart.com";

async function getProvider(id) {
  const res = await fetch("https://api.winnemart.com/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query GetProvider($serviceID: String!) {
          getProvider(ServiceId: $serviceID) {
            id
            name
            number
            type
            dpfile
            profession
          }
        }
      `,
      variables: { serviceID: id },
    }),
    cache: "no-store",
  });

  const json = await res.json();
  return json?.data?.getProvider;
}

export async function generateMetadata({ params }) {
  const provider = await getProvider(params.id);
  if (!provider) notFound();

  const imageUrl = provider.dpfile?.startsWith("http")
    ? provider.dpfile
    : `${MINIO_BASE_URL}${provider.dpfile || "/default-avatar.jpg"}`;

  const professions = provider.profession?.join(", ") || "Service Provider";

  return {
    title: `Meet ${provider.name} on winnemart!`,
    description: `${provider.name} specializes in ${professions}. Explore more on winnemart.`,
    openGraph: {
      title: `Meet ${provider.name} on winnemart`,
      description: `${provider.name} offers services in ${professions}.`,
      images: [{ url: imageUrl }],
      type: "profile",
    },
  };
}

export default async function SharedProviderPage({ params }) {
  const provider = await getProvider(params.id);
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
          <meta property="og:title" content={`${provider.name} • Profile on winnemart`} />
          <meta
            property="og:description"
            content={`Discover ${provider.name}'s services in ${professions} on winnemart.`}
          />
          <meta property="og:image" content={imageUrl} />
          <meta property="og:url" content={`${MAIN_WEBSITE_URL}/${params.id}`} />
          <meta property="og:type" content="profile" />
        </head>
        <body>
          <p>OpenGraph preview metadata loaded.</p>
        </body>
      </html>
    );
  }

  redirect(`${MAIN_WEBSITE_URL}/providers/${params.id}`);
  // return null;
}
