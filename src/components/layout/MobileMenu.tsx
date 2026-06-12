'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { IconButton } from '@/components/ui/IconButton';
import {
  ActionRow,
  BackHeader,
  ControlRow,
  Divider,
  DrillRow,
  LinkRow,
  LinkRoute,
  SectionLabel,
} from '@/components/ui/menu';
import { MoreIcon } from '@/components/icons';
import { getBasemap } from '@/components/map/basemaps';
import { BasemapList } from '@/components/map/BasemapList';
import { useBasemapSelection } from '@/components/map/useBasemapSelection';
import { UserLocationButton } from '@/components/map/UserLocationButton';
import { useAlign, type CalibrateTool } from '@/components/map/AlignContext';
import { useImport } from '@/components/imports/useImport';
import { useRole } from '@/components/auth/useRole';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useClickOutside } from '@/lib/useClickOutside';
import { LocaleSwitcher } from './LocaleSwitcher';
import { LayersView } from './mobileMenu/LayersView';

/**
 * Mobile-only "..." menu (the desktop top-bar buttons and bottom control cluster
 * are hidden below `sm`). One flat sheet of actions — location, layers, basemap,
 * data, tools, account — with a single drill-down for the basemap list. No
 * nested dropdowns: tapping an action runs it and closes the sheet.
 */
export function MobileMenu() {
  const t = useT();
  const { can, me, isOrgAdmin } = useRole();
  const { tool, setTool } = useAlign();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { openGeoJson, openCsv, importUi } = useImport();
  const { data: overlays = [] } = trpc.overlays.list.useQuery();
  const { basemapId, selectBasemap } = useBasemapSelection();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'root' | 'basemap' | 'layers'>('root');
  const rootRef = useRef<HTMLDivElement>(null);

  const canEdit = can('editor');
  const canAdmin = can('admin');
  const canImport = canEdit;
  const orgSlug = me?.org?.slug;

  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      router.push('/login');
      router.refresh();
    },
  });

  const close = () => {
    setOpen(false);
    setView('root');
  };

  useClickOutside(rootRef, close, open);

  const pickTool = (next: CalibrateTool) => {
    setTool(tool === next ? 'none' : next);
    close();
  };

  return (
    <>
      {importUi}
      <div ref={rootRef} className="relative">
        <IconButton
          label={t('controls.menu')}
          onClick={() => (open ? close() : setOpen(true))}
          className={cn(
            'rounded-full bg-panel/85 hairline shadow-floating backdrop-blur-md',
            open && 'bg-paper text-accent',
          )}
        >
          <MoreIcon size={18} />
        </IconButton>

        {open ? (
          <div className="absolute right-0 mt-1.5 max-h-[70vh] w-80 max-w-[calc(100vw-1.5rem)] overflow-y-auto overflow-x-hidden rounded-lg bg-paper hairline shadow-floating">
            {view === 'layers' ? (
              <LayersView overlays={overlays} onBack={() => setView('root')} />
            ) : view === 'basemap' ? (
              <>
                <BackHeader label={t('controls.basemap')} onBack={() => setView('root')} />
                <BasemapList
                  value={basemapId}
                  onSelect={(id) => {
                    setView('root');
                    selectBasemap(id);
                  }}
                />
              </>
            ) : (
              <>
                <SectionLabel>{t('menu.map')}</SectionLabel>
                <ControlRow label={t('controls.location')}>
                  <UserLocationButton />
                </ControlRow>
                <DrillRow
                  label={t('controls.layers')}
                  value={overlays.length ? String(overlays.length) : ''}
                  onClick={() => setView('layers')}
                />
                <DrillRow
                  label={t('controls.basemap')}
                  value={getBasemap(basemapId).label}
                  onClick={() => setView('basemap')}
                />

                <Divider />
                <SectionLabel>{t('data.menu')}</SectionLabel>
                <LinkRow href="/api/exports/trees.geojson" onClick={close}>
                  {t('data.exportGeojson')}
                </LinkRow>
                <LinkRow href="/api/exports/trees.csv" onClick={close}>
                  {t('data.exportCsv')}
                </LinkRow>
                {canImport ? (
                  <>
                    <ActionRow
                      label={t('data.importGeojson')}
                      onClick={() => {
                        close();
                        openGeoJson();
                      }}
                    />
                    <ActionRow
                      label={t('data.importCsv')}
                      onClick={() => {
                        close();
                        openCsv();
                      }}
                    />
                  </>
                ) : null}

                {canEdit ? (
                  <>
                    <Divider />
                    <SectionLabel>{t('tools.menu')}</SectionLabel>
                    <ActionRow
                      label={t('tools.reference')}
                      active={tool === 'reference'}
                      onClick={() => pickTool('reference')}
                    />
                    {canAdmin ? (
                      <>
                        <ActionRow
                          label={t('tools.calibrate')}
                          active={tool === 'sliders'}
                          onClick={() => pickTool('sliders')}
                        />
                        <ActionRow
                          label={t('tools.alignDrag')}
                          active={tool === 'points'}
                          onClick={() => pickTool('points')}
                        />
                      </>
                    ) : null}
                  </>
                ) : null}

                <Divider />
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium text-ink">
                    {me?.user?.name ?? t('account.title')}
                  </p>
                  <p className="truncate text-xs text-muted">{me?.user?.email}</p>
                </div>
                {isOrgAdmin && orgSlug ? (
                  <LinkRoute href={`/orgs/${orgSlug}/members` as Route} onClick={close}>
                    {t('account.members')}
                  </LinkRoute>
                ) : null}
                <div className="px-3 py-2">
                  <p className="mb-1.5 text-xs text-muted">{t('account.language')}</p>
                  <LocaleSwitcher />
                </div>
                <ActionRow
                  label={logout.isPending ? t('account.signingout') : t('account.signout')}
                  onClick={() => logout.mutate()}
                />
              </>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
