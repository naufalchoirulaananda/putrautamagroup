/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        fontkit: "fontkit",
        pdfkit: "pdfkit",
      });
    }
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "putrautamagroup.site",
        pathname: "/uploads/**",
      },
    ],
  },
};

module.exports = nextConfig;
