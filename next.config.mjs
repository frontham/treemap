import withSerwistInit from '@serwist/next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
};

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // Dev uses live reload + uncached modules; the SW would only get in the way.
  disable: process.env.NODE_ENV === 'development',
});

export default withSerwist(nextConfig);
