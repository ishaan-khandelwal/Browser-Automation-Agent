/** @type {import('next').NextConfig} */

// Sent with every page. The one that matters most here is framing: this app has
// Approve and "I've paid, continue" buttons, so another site must not be able to
// load it in a hidden frame and steer a click onto one. frame-ancestors is the
// modern control and X-Frame-Options covers older browsers. A fuller CSP is left
// out on purpose: one that is wrong breaks Next's scripts or the live stream.
const securityHeaders = [
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  reactCompiler: true,
  // The Docker image sets NEXT_OUTPUT=standalone to get a self-contained server
  // without node_modules. Off otherwise, so `npm run start` keeps working.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  // No reason to tell every visitor which framework, and which version, serves this.
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
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
