import { cookies } from 'next/headers';
import { resolveRequestContext } from '@/server/auth/resolveContext';
import { fetchTreesForExport } from '@/server/exports/fetchTreesForExport';
import { rowsToGeoJson } from '@/server/exports/toGeoJson';

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
  const fc = rowsToGeoJson(rows);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(fc, null, 2), {
    headers: {
      'Content-Type': 'application/geo+json',
      'Content-Disposition': `attachment; filename="trees-${stamp}.geojson"`,
    },
  });
}
