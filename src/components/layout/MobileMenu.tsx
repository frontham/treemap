'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { IconButton } from '@/components/ui/IconButton';
import { MoreIcon } from '@/components/icons';
import { useMap } from '@/components/map/MapContext';
import { addTreeLayer } from '@/components/map/treeLayer';
import {
  BASEMAPS,
  carryAppLayers,
  getBasemap,
  readStoredBasemapId,
  storeBasemapId,
  type BasemapId,
} from '@/components/map/basemaps';
import { UserLocationButton } from '@/components/map/UserLocationButton';
import { PinColorControl } from '@/components/map/PinColorControl';
import { DeadTreesControl } from '@/components/map/DeadTreesControl';
import { TreeFilterControl } from '@/components/map/TreeFilterControl';
import { useAlign, type CalibrateTool } from '@/components/map/AlignContext';
import { OverlayRow } from '@/components/overlays/OverlayRow';
import { useImport } from '@/components/imports/useImport';
import { useRole } from '@/components/auth/useRole';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/cn';
import { useLocale, useT } from '@/lib/i18n/LocaleProvider';
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/config';

/**
 * Mobile-only "..." menu (the desktop top-bar buttons and bottom control cluster
 * are hidden below `sm`). One flat sheet of actions — location, layers, basemap,
 * data, tools, account — with a single drill-down for the basemap list. No
 * nested dropdowns: tapping an action runs it and closes the sheet.
 */
export function MobileMenu() {
  const t = useT();
  const { map } = useMap();
  const { can, me, isOrgAdmin } = useRole();
  const { tool, setTool } = useAlign();
  const { locale, setLocale } = useLocale();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { openGeoJson, openCsv, importUi } = useImport();
  const { data: overlays = [] } = trpc.overlays.list.useQuery();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'root' | 'basemap' | 'layers'>('root');
  const [basemapId, setBasemapId] = useState<BasemapId>(() => readStoredBasemapId());
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

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const selectBasemap = (next: BasemapId) => {
    setView('root');
    if (!map || next === basemapId) return;
    setBasemapId(next);
    storeBasemapId(next);
    map.setStyle(getBasemap(next).style, { transformStyle: carryAppLayers });
    map.once('styledata', () => addTreeLayer(map));
  };

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
              <>
                <BackHeader label={t('controls.layers')} onBack={() => setView('root')} />
                <div className="border-b border-hairline p-3">
                  <PinColorControl />
                </div>
                <div className="border-b border-hairline p-3">
                  <DeadTreesControl />
                </div>
                <div className="border-b border-hairline p-3">
                  <TreeFilterControl />
                </div>
                <div className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-muted">
                  {t('layers.overlays')}
                </div>
                <div className="flex flex-col gap-1.5 p-2 pt-1">
                  {overlays.length === 0 ? (
                    <p className="px-1.5 py-3 text-center text-xs text-muted">{t('layers.empty')}</p>
                  ) : (
                    overlays.map((o) => <OverlayRow key={o.id} overlay={o} />)
                  )}
                </div>
              </>
            ) : view === 'basemap' ? (
              <>
                <BackHeader label={t('controls.basemap')} onBack={() => setView('root')} />
                {BASEMAPS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => selectBasemap(b.id)}
                    className={cn(
                      'flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left hover:bg-panel',
                      b.id === basemapId && 'bg-panel',
                    )}
                  >
                    <span className="min-w-0">
                      <span className={cn('block text-sm text-ink', b.id === basemapId && 'font-medium')}>
                        {b.label}
                      </span>
                      {b.note ? <span className="block text-xs text-muted">{b.note}</span> : null}
                    </span>
                    {b.id === basemapId ? (
                      <span className="mt-0.5 shrink-0 text-xs text-accent">✓</span>
                    ) : null}
                  </button>
                ))}
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
                  <div className="grid grid-cols-2 gap-1 rounded bg-panel p-0.5 hairline">
                    {LOCALES.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLocale(l)}
                        className={cn(
                          'rounded px-2 py-1 text-xs transition-colors',
                          locale === l ? 'bg-paper font-medium text-ink' : 'text-muted hover:text-ink',
                        )}
                      >
                        {LOCALE_LABELS[l]}
                      </button>
                    ))}
                  </div>
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

/** Sub-view header with a back affordance, returning to the root list. */
function BackHeader({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex w-full items-center gap-1.5 border-b border-hairline px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-panel"
    >
      <span className="text-muted">‹</span>
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-3 text-xs font-medium uppercase tracking-wider text-muted">
      {children}
    </div>
  );
}

function Divider() {
  return <div className="mt-1 h-px bg-hairline" />;
}

/** A row whose right side hosts a self-contained control (e.g. the location toggle). */
function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <span className="text-sm text-ink">{label}</span>
      {children}
    </div>
  );
}

/** Full-width action; optionally shows an "on" marker when its tool/state is active. */
function ActionRow({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-ink transition-colors hover:bg-panel',
        active && 'font-medium',
      )}
    >
      {label}
      {active ? <span className="text-xs text-accent">on</span> : null}
    </button>
  );
}

/** Full-width row that drills into a sub-view; shows the current value + chevron. */
function DrillRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-ink transition-colors hover:bg-panel"
    >
      {label}
      <span className="flex min-w-0 items-center gap-1 text-muted">
        <span className="min-w-0 truncate text-xs">{value}</span>
        <span>›</span>
      </span>
    </button>
  );
}

function LinkRow(
  props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode },
) {
  return (
    <a
      download
      {...props}
      className="block px-3 py-2.5 text-sm text-ink transition-colors hover:bg-panel"
    />
  );
}

function LinkRoute({
  href,
  onClick,
  children,
}: {
  href: Route;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2.5 text-sm text-ink transition-colors hover:bg-panel"
    >
      {children}
    </Link>
  );
}
