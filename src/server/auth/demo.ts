/**
 * Hardcoded demo identity used until real auth is wired.
 * Every API request resolves to this org + user, so reads and writes work
 * end-to-end against the real DB without a login flow.
 */
export const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000002';
