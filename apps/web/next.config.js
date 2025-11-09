/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Allow loading Streamlit from Snowflake domain in iframes
  // Note: Update this list when you configure your custom domain
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.snowflakecomputing.com',
      },
      {
        protocol: 'https',
        hostname: 'snowflake.concon.build',
      },
    ],
  },
};

export default nextConfig;
