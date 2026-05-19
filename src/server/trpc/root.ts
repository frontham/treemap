import { router } from './init';
import { treesRouter } from './routers/trees';
import { customFieldsRouter } from './routers/customFields';
import { overlaysRouter } from './routers/overlays';

export const appRouter = router({
  trees: treesRouter,
  customFields: customFieldsRouter,
  overlays: overlaysRouter,
});

export type AppRouter = typeof appRouter;
