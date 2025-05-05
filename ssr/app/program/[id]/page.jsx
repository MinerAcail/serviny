import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";

const MAIN_WEBSITE_URL = "https://notexd.winnemart.com";
const MINIO_BASE_URL = "https://notexd.winnemart.com";

const BOT_REGEX = /(facebookexternalhit|Twitterbot|WhatsApp|Discordbot|LinkedInBot)/i;

// Fetch OG metadata from API
async function getOgMetaData({authorId, program}) {
  try {
    const res = await fetch("https://notexdapi.winnemart.com/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query GetOgmetaDataPrograms($authorId: String, $program: String) {
            getOgmetaDataPrograms(authorId: $authorId, program: $program) {
              id
              title
              content
              imageUrl
              authorName
              updatedAt
            }
          }
        `,
        variables: { authorId, program },
      }),
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Failed to fetch OG metadata");

    const { data } = await res.json();
    return data?.getOgmetaDataPrograms || null;
  } catch (error) {
    console.error("OG metadata fetch error:", error);
    return null;
  }
}

// Generate OpenGraph Metadata for Personal and Grouped Content
export async function generateMetadata({ params }) {
  const { authorId, program } = params;
  const ogData = await getOgMetaData(authorId, program);
  if (!ogData) notFound();

  const imageUrl = ogData.imageUrl?.startsWith("http")
    ? ogData.imageUrl
    : `${MINIO_BASE_URL}${ogData.imageUrl || "/default-image.jpg"}`;

  return {
    title: `${ogData.authorName}'s Notes & Questions in ${program} • Notexd`,
    description: `Explore ${ogData.authorName}'s shared notes and questions on ${program} in Notexd.`,
    openGraph: {
      title: `${ogData.authorName}'s Notes & Questions in ${program}`,
      description: `Check out what ${ogData.authorName} is sharing about ${program} on Notexd.`,
      images: [{ url: imageUrl }],
      type: "article",
    },
  };
}

// Bot-aware Page Rendering with Program Grouping
export default async function OgPage({ params }) {
  const { authorId, program } = params;
  const ogData = await getOgMetaData(authorId, program);
  if (!ogData) notFound();

  const userAgent = headers().get("user-agent") || "";

  // If it's a bot, show the metadata
  if (BOT_REGEX.test(userAgent)) {
    const imageUrl = ogData.imageUrl?.startsWith("http")
      ? ogData.imageUrl
      : `${MINIO_BASE_URL}${ogData.imageUrl || "/default-image.jpg"}`;

    return (
      <html lang="en">
        <head>
          <meta property="og:title" content={`${ogData.authorName}'s Notes & Questions in ${program}`} />
          <meta property="og:description" content={`Check out what ${ogData.authorName} is sharing about ${program} on Notexd.`} />
          <meta property="og:image" content={imageUrl} />
          <meta property="og:url" content={`${MAIN_WEBSITE_URL}${program}`} />
          <meta property="og:type" content="article" />
          <meta property="og:updated_time" content={ogData.updatedAt} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={`${ogData.authorName}'s Notes & Questions in ${program}`} />
          <meta name="twitter:description" content={`Check out what ${ogData.authorName} is sharing about ${program} on Notexd.`} />
          <meta name="twitter:image" content={imageUrl} />
        </head>
        <body>
          <p>OpenGraph metadata loaded for {ogData.authorName}'s notes and questions in {program}.</p>
        </body>
      </html>
    );
  }

  // Redirect normal users to the program page
  redirect(`${MAIN_WEBSITE_URL}/program/${authorId}?program=${encodeURIComponent(program)}`);
  return null;
}
