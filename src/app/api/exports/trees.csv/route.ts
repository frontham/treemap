import { cookies } from 'next/headers';
import { resolveRequestContext } from '@/server/auth/resolveContext';
import { fetchTreesForExport } from '@/server/exports/fetchTreesForExport';
import { rowsToCsv } from '@/server/exports/toCsv';

export async function GET() {
  const jar = await cookies();
  const header = jar.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const ctx = await resolveRequestContext(header);
  if (!ctx.user || !ctx.org) return new Response('Unauthorized', { status: 401 });

  const rows = await fetchTreesForExport({
    orgId: ctx.org.id,
    userId: ctx.user.id,
    projectId: ctx.project?.id,
  });
  const csv = rowsToCsv(rows);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="trees-${stamp}.csv"`,
    },
  });
}
