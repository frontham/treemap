'use client';

import { TreeSearch } from '@/components/map/TreeSearch';
import { AddTreeButton } from '@/components/map/AddTreeButton';
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
    <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex flex-wrap items-start justify-between gap-2 px-3">
      <div className="pointer-events-auto flex items-center gap-2">
        <ProjectSwitcher />
        <TreeSearch />
      </div>

      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
        <PendingIndicator />
        {/* Same desktop chrome on every size for now; export/import lives on the
            project settings page. (MobileMenu kept for a later mobile pass.) */}
        {canEdit ? <MapToolsMenu /> : null}
        {canEdit ? <AddTreeButton /> : null}
        <UserMenu />
      </div>
    </div>
  );
}
