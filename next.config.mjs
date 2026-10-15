/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Proxy API calls to the FastAPI backend (avoids CORS in dev)
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

