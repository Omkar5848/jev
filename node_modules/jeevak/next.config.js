/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  
  reactStrictMode: true,
  basePath: process.env.GITHUB_ACTIONS ? '/Jee' : '',
  images: { unoptimized: true },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Force all imports to use the ROOT node_modules
      react: path.resolve(__dirname, '../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
    };
    return config;
  }
}
module.exports = nextConfig

