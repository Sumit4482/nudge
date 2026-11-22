import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lets you open the local preview from a phone on the same Wi-Fi (development only).
  allowedDevOrigins: ['192.168.1.4', '192.168.*.*', '10.*.*.*'],
};

export default nextConfig;
