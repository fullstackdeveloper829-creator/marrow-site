/** @type {import('next').NextConfig} */
const config = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/index.html' },
        { source: '/features', destination: '/features.html' },
        { source: '/reviews', destination: '/reviews.html' },
        { source: '/pricing', destination: '/pricing.html' },
      ],
    };
  },
};
module.exports = config;
