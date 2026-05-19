import { DEMO_ORG_ID, DEMO_USER_ID } from '@/server/auth/demo';

export type Context = {
  orgId: string;
  userId: string;
};

/**
 * Resolves the acting org + user for the request. Currently hardcoded to the
 * demo identity; once auth lands this reads the session cookie and looks up
 * the user's active membership.
 */
export async function createContext(): Promise<Context> {
  return { orgId: DEMO_ORG_ID, userId: DEMO_USER_ID };
}
