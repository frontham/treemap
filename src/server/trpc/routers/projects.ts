import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router } from '../init';
import { orgProcedure } from '../orgProcedure';
import { requireOrgRole } from '../requireRole';
import type { Role } from '../context';

export type ProjectView = {
  id: string;
  name: string;
  slug: string;
  role: Role;
};

type ProjectRow = { id: string; name: string; slug: string; role: Role };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

const adminProcedure = orgProcedure.use(requireOrgRole('admin'));

export const projectsRouter = router({
  /** Projects in the active org the user can access (admins/owners see all). */
  list: orgProcedure.query(async ({ ctx }): Promise<ProjectView[]> => {
    const result = await ctx.tx.execute(sql`
      SELECT p.id, p.name, p.slug, COALESCE(pm.role, ${ctx.org.role}::role) AS role
      FROM projects p
      LEFT JOIN project_memberships pm
        ON pm.project_id = p.id AND pm.user_id = current_user_id()
      WHERE p.org_id = current_org_id()
        AND (pm.user_id IS NOT NULL OR ${ctx.org.role} IN ('owner', 'admin'))
      ORDER BY p.name
    `);
    return result.rows as ProjectRow[];
  }),

  create: adminProcedure
    .input(z.object({ name: z.string().min(1), slug: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const slug = slugify(input.slug || input.name);
      if (!slug) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid name' });
      const dup = await ctx.tx.execute(sql`
        SELECT 1 FROM projects WHERE org_id = current_org_id() AND slug = ${slug} LIMIT 1
      `);
      if (dup.rows[0]) {
        throw new TRPCError({ code: 'CONFLICT', message: `A project "${slug}" already exists` });
      }
      const res = await ctx.tx.execute(sql`
        INSERT INTO projects (org_id, name, slug)
        VALUES (current_org_id(), ${input.name}, ${slug})
        RETURNING id
      `);
      const row = res.rows[0] as { id: string };
      // Creator becomes project owner.
      await ctx.tx.execute(sql`
        INSERT INTO project_memberships (project_id, user_id, role)
        VALUES (${row.id}, current_user_id(), 'owner')
        ON CONFLICT (project_id, user_id) DO UPDATE SET role = excluded.role
      `);
      return { id: row.id, slug };
    }),

  rename: adminProcedure
    .input(z.object({ id: z.string().uuid(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.tx.execute(sql`
        UPDATE projects SET name = ${input.name}
        WHERE id = ${input.id} AND org_id = current_org_id()
        RETURNING id
      `);
      if (!res.rows[0]) throw new TRPCError({ code: 'NOT_FOUND' });
      return { ok: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Cascades to the project's trees, overlays, custom fields, etc.
      await ctx.tx.execute(sql`
        DELETE FROM projects WHERE id = ${input.id} AND org_id = current_org_id()
      `);
      return { ok: true };
    }),
});
