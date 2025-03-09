/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Only include the Node.js polyfills in the server build
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        fs: false,
        net: false,
        tls: false,
        os: false,
        path: false,
        stream: false,
        util: false,
        events: false,
        crypto: false,
        http: false,
        https: false,
        url: false,
        zlib: false,
        assert: false,
        buffer: false,
        process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
