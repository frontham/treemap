import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router } from '../init';
import { orgProcedure } from '../orgProcedure';

const Corner = z.object({ lng: z.number(), lat: z.number() });

const CreateOverlayInput = z.object({
  name: z.string().min(1),
  storageKey: z.string().url(),
  corners: z.array(Corner).length(4),
  opacityDefault: z.number().min(0).max(1).default(0.7),
});

export type OverlayCorner = { lng: number; lat: number };

export type OverlayView = {
  id: string;
  name: string;
  url: string;
  corners: [OverlayCorner, OverlayCorner, OverlayCorner, OverlayCorner];
  opacityDefault: number;
};

type OverlayRow = {
  id: string;
  name: string;
  storage_key: string;
  corners: OverlayCorner[];
  opacity_default: number;
};

export const overlaysRouter = router({
  list: orgProcedure.query(async ({ ctx }): Promise<OverlayView[]> => {
    const result = await ctx.tx.execute(sql`
      SELECT id, name, storage_key, corners, opacity_default
      FROM overlays
      ORDER BY z_index, created_at DESC
    `);
    const rows = result.rows as OverlayRow[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      url: r.storage_key,
      corners: r.corners as OverlayView['corners'],
      opacityDefault: r.opacity_default,
    }));
  }),

  create: orgProcedure
    .input(CreateOverlayInput)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.tx.execute(sql`
        INSERT INTO overlays (org_id, name, storage_key, corners, opacity_default, created_by)
        VALUES (
          current_org_id(),
          ${input.name},
          ${input.storageKey},
          ${JSON.stringify(input.corners)}::jsonb,
          ${input.opacityDefault},
          current_user_id()
        )
        RETURNING id
      `);
      const row = result.rows[0] as { id: string } | undefined;
      if (!row) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      return { id: row.id };
    }),

  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.tx.execute(sql`DELETE FROM overlays WHERE id = ${input.id}`);
      return { ok: true };
    }),
});
