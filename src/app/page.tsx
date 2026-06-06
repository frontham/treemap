import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/server/auth/cookies';

/**
 * Root entry: send signed-in users to their projects, everyone else to login.
 * (Real session verification happens downstream; this only checks presence.)
 */
export default async function Home() {
  const jar = await cookies();
  redirect(jar.get(SESSION_COOKIE) ? '/orgs/demo' : '/login');
}
