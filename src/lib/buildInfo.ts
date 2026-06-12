/**
 * Build identity baked in by next.config.mjs at build time. Shown by the
 * BuildInfo component so any device can tell which deploy it's running.
 * The version follows semver and is bumped in package.json per release
 * (minor = features, patch = fixes).
 */
export const buildInfo = {
  version: process.env.NEXT_PUBLIC_BUILD_VERSION ?? '0.0.0',
  commit: process.env.NEXT_PUBLIC_BUILD_COMMIT ?? 'dev',
  /** ISO timestamp of the build; render in local time on the client. */
  builtAt: process.env.NEXT_PUBLIC_BUILD_TIME ?? '',
};
