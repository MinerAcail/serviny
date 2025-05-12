/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "files.winnemart.com",
      },
    ],
  },
};

export default nextConfig;
