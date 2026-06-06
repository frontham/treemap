import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { router } from '../init';
import { orgProcedure } from '../orgProcedure';
import { projectProcedure } from '../projectProcedure';
import { requireOrgRole, requireRole } from '../requireRole';
import { hashPassword } from '@/server/auth/password';
import type { Role } from '../context';

const RoleEnum = z.enum(['owner', 'admin', 'editor', 'viewer']);

export type MemberView = {
  userId: string;
  email: string;
  name: string | null;
  role: Role;
};

const orgAdmin = orgProcedure.use(requireOrgRole('admin'));
const projectAdmin = projectProcedure.use(requireRole('admin'));

export const membersRouter = router({
  // ---- org-level ----
  listOrg: orgAdmin.query(async ({ ctx }): Promise<MemberView[]> => {
    const res = await ctx.tx.execute(sql`
      SELECT m.user_id AS "userId", u.email, u.name, m.role
      FROM memberships m JOIN users u ON u.id = m.user_id
      WHERE m.org_id = current_org_id()
      ORDER BY u.email
    `);
    return res.rows as MemberView[];
  }),

  addOrg: orgAdmin
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
        password: z.string().min(8),
        role: RoleEnum.default('viewer'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase();
      const hash = await hashPassword(input.password);
      // users has no RLS; upsert via the org tx is fine.
      const userRes = await ctx.tx.execute(sql`
        INSERT INTO users (email, name, password_hash, email_verified_at)
        VALUES (${email}, ${input.name ?? null}, ${hash}, now())
        ON CONFLICT (email) DO UPDATE SET name = COALESCE(excluded.name, users.name)
        RETURNING id
      `);
      const userId = (userRes.rows[0] as { id: string }).id;
      await ctx.tx.execute(sql`
        INSERT INTO memberships (org_id, user_id, role)
        VALUES (current_org_id(), ${userId}, ${input.role}::role)
        ON CONFLICT (org_id, user_id) DO UPDATE SET role = excluded.role
      `);
      return { userId };
    }),

  updateOrgRole: orgAdmin
    .input(z.object({ userId: z.string().uuid(), role: RoleEnum }))
    .mutation(async ({ ctx, input }) => {
      await ctx.tx.execute(sql`
        UPDATE memberships SET role = ${input.role}::role
        WHERE org_id = current_org_id() AND user_id = ${input.userId}
      `);
      return { ok: true };
    }),

  removeOrg: orgAdmin
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.tx.execute(sql`
        DELETE FROM memberships
        WHERE org_id = current_org_id() AND user_id = ${input.userId}
      `);
      return { ok: true };
    }),

  // ---- project-level (overrides) ----
  listProject: projectAdmin.query(async ({ ctx }): Promise<MemberView[]> => {
    const res = await ctx.tx.execute(sql`
      SELECT pm.user_id AS "userId", u.email, u.name, pm.role
      FROM project_memberships pm JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = current_project_id()
      ORDER BY u.email
    `);
    return res.rows as MemberView[];
  }),

  setProjectRole: projectAdmin
    .input(z.object({ userId: z.string().uuid(), role: RoleEnum }))
    .mutation(async ({ ctx, input }) => {
      await ctx.tx.execute(sql`
        INSERT INTO project_memberships (project_id, user_id, role)
        VALUES (current_project_id(), ${input.userId}, ${input.role}::role)
        ON CONFLICT (project_id, user_id) DO UPDATE SET role = excluded.role
      `);
      return { ok: true };
    }),

  removeProject: projectAdmin
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.tx.execute(sql`
        DELETE FROM project_memberships
        WHERE project_id = current_project_id() AND user_id = ${input.userId}
      `);
      return { ok: true };
    }),
});
