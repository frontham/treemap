/**
 * Hardcoded demo identity used until real auth is wired.
 * Every API request resolves to this org + user, so reads and writes work
 * end-to-end against the real DB without a login flow.
 */
export const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000002';
/** A second seeded user (org-level viewer) used to exercise role enforcement. */
export const VIEWER_USER_ID = '00000000-0000-0000-0000-000000000003';

/** Fixed project ids created by migration 0011 / the seed script. */
export const OEGSTGEEST_PROJECT_ID = '00000000-0000-0000-0000-000000000010';
export const DEMO_TREES_PROJECT_ID = '00000000-0000-0000-0000-000000000011';
