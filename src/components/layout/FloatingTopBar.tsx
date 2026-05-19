import { Pill } from '@/components/ui/Pill';
import { IconButton } from '@/components/ui/IconButton';
import {
  ChevronDownIcon,
  SearchIcon,
  UserIcon,
} from '@/components/icons';
import { AddTreeButton } from '@/components/map/AddTreeButton';
import { AddOverlayButton } from '@/components/overlays/AddOverlayButton';
import { DataMenu } from './DataMenu';
import { PendingIndicator } from './PendingIndicator';

type Props = { orgName: string };

/**
 * The top floating chrome: org switcher + search pill on the left,
 * primary "+ Tree" action and account button on the right.
 */
export function FloatingTopBar({ orgName }: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex items-start justify-between px-3">
      <Pill className="pointer-events-auto">
        <span className="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden />
        <span className="text-sm font-medium">{orgName}</span>
        <ChevronDownIcon size={14} className="text-muted" />
        <span className="mx-1 h-4 w-px bg-hairline" />
        <SearchIcon size={14} className="text-muted" />
        <input
          aria-label="Search trees"
          placeholder="Search trees…"
          className="w-44 bg-transparent text-sm placeholder:text-muted focus:outline-none"
        />
      </Pill>

      <div className="pointer-events-auto flex items-center gap-2">
        <PendingIndicator />
        <DataMenu />
        <AddOverlayButton />
        <AddTreeButton />
        <IconButton
          label="Account"
          className="rounded-full bg-panel/85 hairline shadow-floating backdrop-blur-md"
        >
          <UserIcon size={16} />
        </IconButton>
      </div>
    </div>
  );
}
