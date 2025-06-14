/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      }
    ]
  }
}

module.exports = nextConfig 