/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable server actions for form handling
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb", // RFP files can be large
    },
  },
};

module.exports = nextConfig;
