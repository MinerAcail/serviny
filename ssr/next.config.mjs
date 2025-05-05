/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "notexdfiles.winnemart.com",
      },
    ],
  },
};

export default nextConfig;
