/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // appDir is now stable in Next.js 14+
  },
  images: {
    domains: [
      'media.vixter.com.br', // Replace with your R2 domain
      'lh3.googleusercontent.com', // Google OAuth profile images
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },

}

module.exports = nextConfig
