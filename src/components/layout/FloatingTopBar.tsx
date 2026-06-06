'use client';

import { Pill } from '@/components/ui/Pill';
import { SearchIcon } from '@/components/icons';
import { AddTreeButton } from '@/components/map/AddTreeButton';
import { DataMenu } from './DataMenu';
import { MapToolsMenu } from './MapToolsMenu';
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
    <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex items-start justify-between px-3">
      <div className="pointer-events-auto flex items-center gap-2">
        <ProjectSwitcher />
        <Pill className="hidden sm:inline-flex">
          <SearchIcon size={14} className="text-muted" />
          <input
            aria-label="Search trees"
            placeholder="Search trees…"
            className="w-40 bg-transparent text-sm placeholder:text-muted focus:outline-none"
          />
        </Pill>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        <PendingIndicator />
        <DataMenu />
        {canEdit ? <MapToolsMenu /> : null}
        {canEdit ? <AddTreeButton /> : null}
        <UserMenu />
      </div>
    </div>
  );
}
