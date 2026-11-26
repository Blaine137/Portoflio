/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  distDir: 'dist',
  trailingSlash: true,
  reactStrictMode: true,
  devIndicators: false,
  // The agency has sibling projects with their own lockfiles.
  outputFileTracingRoot: import.meta.dirname,
};
export default config;
