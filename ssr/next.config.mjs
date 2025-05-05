/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "files.serviny.com",
      },
    ],
  },
};

export default nextConfig;
