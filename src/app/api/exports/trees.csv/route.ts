import { DEMO_ORG_ID, DEMO_USER_ID } from '@/server/auth/demo';
import { fetchTreesForExport } from '@/server/exports/fetchTreesForExport';
import { rowsToCsv } from '@/server/exports/toCsv';

export async function GET() {
  const rows = await fetchTreesForExport({
    orgId: DEMO_ORG_ID,
    userId: DEMO_USER_ID,
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
