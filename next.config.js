/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const isProd = process.env.NODE_ENV === 'production';

// Monta lista restrita de origens de imagem autorizadas
const remotePatterns = [
  { protocol: 'https', hostname: 'upload.wikimedia.org' },
  { protocol: 'https', hostname: 'images.unsplash.com' },
  { protocol: 'http', hostname: 'localhost', port: '1337' },
  { protocol: 'http', hostname: '127.0.0.1', port: '1337' },
];

if (process.env.NEXT_PUBLIC_STRAPI_URL) {
  try {
    const strapiUrl = new URL(process.env.NEXT_PUBLIC_STRAPI_URL);
    remotePatterns.push({
      protocol: strapiUrl.protocol.replace(':', ''),
      hostname: strapiUrl.hostname,
      ...(strapiUrl.port ? { port: strapiUrl.port } : {}),
    });
  } catch {
    // Ignora URL inválida de ambiente
  }
}

const imgSrcSources = [
  "'self'",
  'data:',
  'blob:',
  'https://upload.wikimedia.org',
  'https://images.unsplash.com',
  'http://localhost:1337',
  'http://127.0.0.1:1337',
];
if (process.env.NEXT_PUBLIC_STRAPI_URL) {
  imgSrcSources.push(process.env.NEXT_PUBLIC_STRAPI_URL);
}

const connectSrcSources = ["'self'", 'https://api.stripe.com'];
if (process.env.NEXT_PUBLIC_STRAPI_URL) {
  connectSrcSources.push(process.env.NEXT_PUBLIC_STRAPI_URL);
}

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  ...(isGithubPages
    ? {
        output: 'export',
        basePath: '/marketplace',
        assetPrefix: '/marketplace',
        trailingSlash: true,
      }
    : {
        // ═══════════════════════════════════════════════════════════
        // PILAR II - SEGURANÇA: Headers HTTP de proteção (Servidor)
        // ═══════════════════════════════════════════════════════════
        async headers() {
          const scriptSrc = isProd
            ? "script-src 'self' 'unsafe-inline' https://js.stripe.com"
            : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com";

          return [
            {
              source: '/(.*)',
              headers: [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains; preload',
                },
                {
                  key: 'Content-Security-Policy',
                  value: [
                    "default-src 'self'",
                    scriptSrc,
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                    "font-src 'self' https://fonts.gstatic.com",
                    `img-src ${imgSrcSources.join(' ')}`,
                    `connect-src ${connectSrcSources.join(' ')}`,
                    "frame-src https://js.stripe.com",
                    "object-src 'none'",
                    "base-uri 'self'",
                  ].join('; '),
                },
                {
                  key: 'X-Frame-Options',
                  value: 'DENY',
                },
                {
                  key: 'X-Content-Type-Options',
                  value: 'nosniff',
                },
                {
                  key: 'Referrer-Policy',
                  value: 'strict-origin-when-cross-origin',
                },
                {
                  key: 'Permissions-Policy',
                  value: 'camera=(), microphone=(), geolocation=(self)',
                },
              ],
            },
          ];
        },
      }),
  images: {
    unoptimized: isGithubPages,
    remotePatterns,
  },
};

module.exports = nextConfig;
