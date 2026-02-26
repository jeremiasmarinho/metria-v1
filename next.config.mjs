/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer", "chartjs-node-canvas"],
  },
};

export default nextConfig;
