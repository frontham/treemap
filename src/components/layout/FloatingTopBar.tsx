'use client';

import { TreeSearch } from '@/components/map/TreeSearch';
import { AddTreeButton } from '@/components/map/AddTreeButton';
import { DataMenu } from './DataMenu';
import { MapToolsMenu } from './MapToolsMenu';
import { MobileMenu } from './MobileMenu';
import { PendingIndicator } from './PendingIndicator';
import { ProjectSwitcher } from './ProjectSwitcher';
import { UserMenu } from './UserMenu';
import { useRole } from '@/components/auth/useRole';

/**
 * Top floating chrome: project switcher + search on the left; data, editor-only
 * "+ Overlay"/"+ Tree" actions, and the account menu on the right. Editing
 * controls are hidden for users below the editor role on the active project.
 */
export function FloatingTopBar() {
  const { can } = useRole();
  const canEdit = can('editor');

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex flex-wrap items-start justify-between gap-2 px-3">
      <div className="pointer-events-auto flex items-center gap-2">
        <ProjectSwitcher />
        <TreeSearch />
      </div>

      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
        <PendingIndicator />
        {/* Desktop: each control on the bar. */}
        <div className="hidden items-center gap-2 sm:flex">
          <DataMenu />
          {canEdit ? <MapToolsMenu /> : null}
        </div>
        {/* +Tree stays prominent on every size. */}
        {canEdit ? <AddTreeButton /> : null}
        <div className="hidden sm:block">
          <UserMenu />
        </div>
        {/* Mobile: everything else folds into one menu. */}
        <div className="sm:hidden">
          <MobileMenu />
        </div>
      </div>
    </div>
  );
}
