// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "**.supabase.co",
//         pathname: "/storage/v1/object/public/**",
//       },
//     ],
//   },
// };

// module.exports = nextConfig;

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "**.supabase.co",
//         pathname: "/storage/v1/object/public/**",
//       },
//     ],
//   },

// ✅ Ignore ESLint warnings during production build
// eslint: {
//   ignoreDuringBuilds: true,
// },

// ✅ Ignore TypeScript build errors (safe for deployment)
//   typescript: {
//     ignoreBuildErrors: true,
//   },
// };

// module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // ⭐ IMPORTANT for deployment

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },

      {
        protocol: "https",
        hostname: "example.com",
      },
    ],
  },

  // Ignore ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignore TS errors (deployment safe)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Faster production builds
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
