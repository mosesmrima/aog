/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      // Backward compatibility redirects for old URLs
      {
        source: '/marriages',
        destination: '/departments/marriages/manage',
        permanent: true,
      },
      {
        source: '/government-cases',
        destination: '/departments/legal-affairs/manage',
        permanent: true,
      },
      // Additional legacy routes that might exist
      {
        source: '/legal',
        destination: '/departments/legal-affairs/dashboard',
        permanent: true,
      },
      {
        source: '/societies',
        destination: '/departments/societies/dashboard',
        permanent: true,
      },
      {
        source: '/administration',
        destination: '/departments/administration/dashboard',
        permanent: true,
      },
      // Department main page redirects
      {
        source: '/departments/societies',
        destination: '/departments/societies/dashboard',
        permanent: true,
      },
      {
        source: '/departments/legal-affairs',
        destination: '/departments/legal-affairs/dashboard',
        permanent: true,
      },
      {
        source: '/departments/marriages',
        destination: '/departments/marriages/dashboard',
        permanent: true,
      },
      {
        source: '/departments/administration',
        destination: '/departments/administration/dashboard',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;