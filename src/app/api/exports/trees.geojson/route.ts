import { DEMO_ORG_ID, DEMO_USER_ID } from '@/server/auth/demo';
import { fetchTreesForExport } from '@/server/exports/fetchTreesForExport';
import { rowsToGeoJson } from '@/server/exports/toGeoJson';

export async function GET() {
  const rows = await fetchTreesForExport({
    orgId: DEMO_ORG_ID,
    userId: DEMO_USER_ID,
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
