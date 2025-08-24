/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // appDir is now stable in Next.js 14+
  },
  images: {
    domains: [
      'pub-your-r2-domain.r2.dev', // Replace with your R2 domain
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
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
}

module.exports = nextConfig
