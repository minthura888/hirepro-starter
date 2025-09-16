/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't block the build on stray type/eslint issues
  typescript: { ignoreBuildErrors: false }, // set true only if you still get unrelated TS errors
  eslint: { ignoreDuringBuilds: true }
};
module.exports = nextConfig;
