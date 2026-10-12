import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Prisma's libSQL adapter and bcrypt rely on native/node modules that must
  // not be bundled by the server compiler.
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql", "bcryptjs"],
};

export default nextConfig;
