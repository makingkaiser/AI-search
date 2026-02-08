/** @type {import('next').NextConfig} */

const nextConfig = {
    // basePath: "/deepseekchat", // Uncomment for production deployment to demo.exa.ai
    experimental: {
      serverActions: {
        allowedOrigins: ["demo.exa.ai"],
        allowedForwardedHosts: ["demo.exa.ai"],
      },
    },
  };
  
export default nextConfig;