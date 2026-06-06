import { router } from './init';
import { authRouter } from './routers/auth';
import { treesRouter } from './routers/trees';
import { customFieldsRouter } from './routers/customFields';
import { overlaysRouter } from './routers/overlays';
import { projectsRouter } from './routers/projects';
import { membersRouter } from './routers/members';

export const appRouter = router({
  auth: authRouter,
  trees: treesRouter,
  customFields: customFieldsRouter,
  overlays: overlaysRouter,
  projects: projectsRouter,
  members: membersRouter,
});

export type AppRouter = typeof appRouter;
