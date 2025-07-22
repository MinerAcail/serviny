import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";

const MINIO_BASE_URL = "https://files.winnemart.com";

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

function getImageUrl(dpfile) {
  if (!dpfile) return `${MINIO_BASE_URL}/default-avatar.jpg`;

  if (dpfile.startsWith("http")) return dpfile;

  if (dpfile.startsWith("/minio/")) {
    return `${MINIO_BASE_URL}${dpfile.replace("/minio", "")}`;
  }

  return `${MINIO_BASE_URL}${dpfile.startsWith("/") ? dpfile : "/" + dpfile}`;
}

export default async function BookingRedirectPage({ params }) {
  const headersList = headers();
  const host = headersList.get("host") || "";
  const userAgent = headersList.get("user-agent") || "";

  const subdomain = host.split(".")[0];

  if (!subdomain || subdomain === "www" || subdomain === "winnemart") {
    notFound();
  }

  const provider = await getProviderBySubdomain(subdomain);
  if (!provider) notFound();

  const bots = [
    "facebookexternalhit",
    "Twitterbot",
    "WhatsApp",
    "Discordbot",
    "LinkedInBot",
    "TelegramBot",
    "SkypeUriPreview",
  ];
  const isBot = bots.some((bot) =>
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );

  const imageUrl = getImageUrl(provider.dpfile);
  const professions =
    provider.profession?.join(", ") || "a verified professional";

  if (isBot) {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{`Booking details`}</title>
          <meta
            name="description"
            content={`${provider.name} on winnemart`}
          />

          <meta
            property="og:title"
            content={`Booking details from ${provider.name}`}
          />
          <meta
            property="og:description"
            content={`${provider.name} on winnemart`}
          />
          <meta property="og:image" content={imageUrl} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:url" content={`https://${host}/${params.bookID}`} />
          <meta property="og:type" content="profile" />
          <meta property="og:site_name" content="winnemart" />

          <meta name="twitter:card" content="summary_large_image" />
          <meta
            name="twitter:title"
            content={`Booking details from ${provider.name}`}
          />
          <meta
            name="twitter:description"
            content={`${provider.name} on winnemart`}
          />
          <meta name="twitter:image" content={imageUrl} />

          <meta name="robots" content="index, follow" />
          <link
            rel="canonical"
            href={`https://${host}/${params.bookID}`}
          />
        </head>
        <body>
          <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1>Booking for {provider.name}</h1>
            <p>Specializes in: {professions}</p>
            <img
              src={imageUrl}
              alt={provider.name}
              style={{ maxWidth: "300px", height: "auto" }}
            />
            <p>
              View booking on{" "}
              <a
                href={`https://${subdomain}.r.winnemart.com/vob/${params.bookID}/?provider=${provider.id}`}
              >
                winnemart
              </a>
            </p>
          </div>
        </body>
      </html>
    );
  }

  redirect(
    `https://${subdomain}.r.winnemart.com/vob/${params.bookID}/?provider=${provider.id}`
  );
}
