import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import withSerwistInit from '@serwist/next';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// Vercel provides the commit during builds; fall back to git locally.
let commit = process.env.VERCEL_GIT_COMMIT_SHA ?? '';
if (!commit) {
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD']).toString().trim();
  } catch {
    commit = 'unknown';
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Baked in at build time and shown in the UI (BuildInfo) so any device can
  // tell exactly which version/commit/build is deployed.
  env: {
    NEXT_PUBLIC_BUILD_VERSION: pkg.version,
    NEXT_PUBLIC_BUILD_COMMIT: commit.slice(0, 7),
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // Dev uses live reload + uncached modules; the SW would only get in the way.
  disable: process.env.NODE_ENV === 'development',
});

export default withSerwist(nextConfig);
