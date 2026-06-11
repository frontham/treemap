'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { formatLngLat } from '@/lib/formatCoord';
import { getBasemap, type BasemapId } from '@/components/map/basemaps';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { PrinterIcon } from '@/components/icons';
import type { TreePhotoView } from '@/components/trees/TreeView';
import { MapSnapshot } from './MapSnapshot';
import './report.css';

type Props = { orgSlug: string; projectSlug: string; treeId: string };

/**
 * Basemaps that work on paper (light, print-friendly, licensing OK), with the
 * attribution line printed under the snapshots (the report has no live
 * attribution control). The PDOK pair is NL-only and offered only when the
 * tree is in the Netherlands.
 */
const PRINT_BASEMAPS: { id: BasemapId; nlOnly?: boolean; attribution: string }[] = [
  { id: 'topo-nl', nlOnly: true, attribution: '© Kadaster / PDOK (BRT Achtergrondkaart)' },
  { id: 'aerial-nl', nlOnly: true, attribution: 'Luchtfoto © Beeldmateriaal Nederland / PDOK' },
  { id: 'streets', attribution: '© OpenFreeMap · © OpenMapTiles · © OpenStreetMap contributors' },
  { id: 'light', attribution: '© OpenFreeMap · © OpenMapTiles · © OpenStreetMap contributors' },
];

const inNetherlands = (loc: { lng: number; lat: number }) =>
  loc.lng > 3.2 && loc.lng < 7.3 && loc.lat > 50.7 && loc.lat < 53.6;

function formatVal(v: unknown): string {
  if (Array.isArray(v)) return v.join(', ');
  if (v != null && typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

const nonEmptyEntries = (fields: Record<string, unknown>) =>
  Object.entries(fields).filter(
    ([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0),
  );

function toggled(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/**
 * Printable per-tree report (e.g. for a municipal permit filing): tree facts,
 * the selected inspections, the selected photos, and two map snapshots (detail
 * + surroundings) with the tree marked. The left rail configures what goes in
 * and is hidden in print; the sheet itself is laid out for A4.
 */
export function TreeReport({ orgSlug, projectSlug, treeId }: Props) {
  const { t, locale } = useLocale();

  const treeQ = trpc.trees.get.useQuery({ id: treeId }, { retry: false });
  const inspectionsQ = trpc.inspections.list.useQuery({ treeId }, { retry: false });
  const { data: defs = [] } = trpc.customFields.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();

  const tree = treeQ.data;
  const inspections = inspectionsQ.data;
  const projectName = projects.find((p) => p.slug === projectSlug)?.name ?? projectSlug;
  const labelFor = (key: string) => defs.find((d) => d.key === key)?.label ?? key;

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [locale],
  );
  const fmtDate = (d: string | Date | undefined) => (d ? dateFmt.format(new Date(d)) : undefined);
  const yearsUnit = locale === 'nl' ? 'jr' : 'yrs';

  const [basemapId, setBasemapId] = useState<BasemapId>('streets');
  const [selectedInspections, setSelectedInspections] = useState<Set<string>>(new Set());
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  // Defaults once both queries land: latest inspection, its evidence photos +
  // the general tree photos, and the Dutch topo map when the tree is in NL.
  useEffect(() => {
    if (ready || !tree || !inspections) return;
    const latest = inspections[0];
    setSelectedInspections(new Set(latest ? [latest.id] : []));
    setSelectedPhotos(
      new Set([...tree.photos, ...(latest?.photos ?? [])].map((p) => p.id)),
    );
    setBasemapId(inNetherlands(tree.location) ? 'topo-nl' : 'streets');
    setReady(true);
  }, [ready, tree, inspections]);

  // All selectable photos, grouped by where they live (tree vs. inspection).
  const photoGroups = useMemo(() => {
    const groups: { id: string; label: string; photos: TreePhotoView[] }[] = [];
    if (tree?.photos.length) {
      groups.push({ id: 'general', label: t('report.photosGeneral'), photos: tree.photos });
    }
    for (const i of inspections ?? []) {
      if (i.photos.length) {
        groups.push({
          id: i.id,
          label: t('report.photosInspection', { date: fmtDate(i.inspectedOn) ?? '' }),
          photos: i.photos,
        });
      }
    }
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, inspections, t, locale]);

  const printPhotos = photoGroups.flatMap((g) =>
    g.photos.filter((p) => selectedPhotos.has(p.id)).map((p) => ({ ...p, groupLabel: g.label })),
  );

  // Thumbnails are capped at 400px — fetch the full-size rendition of each
  // selected photo so the printed page stays sharp.
  const fullPhotoQs = trpc.useQueries((q) => printPhotos.map((p) => q.trees.photo({ id: p.id })));

  if (treeQ.error || inspectionsQ.error) {
    return (
      <Shell orgSlug={orgSlug} projectSlug={projectSlug}>
        <p className="text-sm text-muted">{t('report.notFound')}</p>
      </Shell>
    );
  }
  if (!ready || !tree || !inspections) {
    return (
      <Shell orgSlug={orgSlug} projectSlug={projectSlug}>
        <Spinner size={24} />
      </Shell>
    );
  }

  const basemaps = PRINT_BASEMAPS.filter((b) => !b.nlOnly || inNetherlands(tree.location));
  const attribution =
    PRINT_BASEMAPS.find((b) => b.id === basemapId)?.attribution ?? '© OpenStreetMap contributors';
  const printInspections = inspections.filter((i) => selectedInspections.has(i.id));

  let sectionCount = 0;
  const sectionNo = () => String(++sectionCount).padStart(2, '0');

  return (
    <div className="min-h-screen bg-panel text-ink print:bg-white">
      <div className="mx-auto flex max-w-[1240px] items-start gap-8 px-4 py-8 print:block print:max-w-none print:p-0">
        {/* ----- config rail (screen only) ----- */}
        <aside className="sticky top-8 w-72 shrink-0 print:hidden">
          <Link
            href={`/orgs/${orgSlug}/projects/${projectSlug}/map` as Route}
            className="text-sm text-accent hover:underline"
          >
            ← {projectName}
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">{t('report.title')}</h1>

          <Button onClick={() => window.print()} className="mt-4 w-full">
            <PrinterIcon size={16} />
            {t('report.print')}
          </Button>
          <p className="mt-2 text-xs text-muted">{t('report.printHint')}</p>

          <div className="mt-6 flex flex-col gap-6 border-t border-hairline pt-5">
            {/* map style */}
            <fieldset>
              <legend className="text-xs font-medium uppercase tracking-wider text-muted">
                {t('report.mapType')}
              </legend>
              <div className="mt-2 flex flex-col gap-1">
                {basemaps.map((b) => (
                  <label
                    key={b.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors',
                      basemapId === b.id ? 'bg-paper hairline' : 'hover:bg-paper/60',
                    )}
                  >
                    <input
                      type="radio"
                      name="report-basemap"
                      className="accent-accent"
                      checked={basemapId === b.id}
                      onChange={() => setBasemapId(b.id)}
                    />
                    {getBasemap(b.id).label}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* inspections */}
            {inspections.length > 0 ? (
              <fieldset>
                <legend className="text-xs font-medium uppercase tracking-wider text-muted">
                  {t('report.inspections')}
                </legend>
                <div className="mt-2 flex flex-col gap-1">
                  {inspections.map((i) => (
                    <label
                      key={i.id}
                      className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-paper/60"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 accent-accent"
                        checked={selectedInspections.has(i.id)}
                        onChange={() => setSelectedInspections((s) => toggled(s, i.id))}
                      />
                      <span className="min-w-0">
                        {fmtDate(i.inspectedOn)}
                        <span className="block text-xs text-muted">
                          {t(`health.${i.health}`)} · {t(`condition.${i.condition}`)}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {/* photos */}
            {photoGroups.length > 0 ? (
              <fieldset>
                <legend className="text-xs font-medium uppercase tracking-wider text-muted">
                  {t('report.photos')}
                </legend>
                {photoGroups.map((g) => (
                  <div key={g.id} className="mt-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xs text-muted">{g.label}</p>
                      <p className="shrink-0 text-xs">
                        <button
                          type="button"
                          className="text-accent hover:underline"
                          onClick={() =>
                            setSelectedPhotos(
                              (s) => new Set([...s, ...g.photos.map((p) => p.id)]),
                            )
                          }
                        >
                          {t('report.all')}
                        </button>
                        {' · '}
                        <button
                          type="button"
                          className="text-accent hover:underline"
                          onClick={() =>
                            setSelectedPhotos((s) => {
                              const next = new Set(s);
                              for (const p of g.photos) next.delete(p.id);
                              return next;
                            })
                          }
                        >
                          {t('report.none')}
                        </button>
                      </p>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {g.photos.map((p) => {
                        const on = selectedPhotos.has(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setSelectedPhotos((s) => toggled(s, p.id))}
                            className={cn(
                              'h-14 w-14 overflow-hidden rounded border transition-all',
                              on
                                ? 'border-accent ring-2 ring-accent/30'
                                : 'border-hairline opacity-50 grayscale hover:opacity-80',
                            )}
                          >
                            {p.thumbnailUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.thumbnailUrl}
                                alt={p.caption ?? ''}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </fieldset>
            ) : null}
          </div>
        </aside>

        {/* ----- the sheet ----- */}
        <main className="min-w-0 flex-1 overflow-x-auto print:overflow-visible">
          <article className="report-sheet mx-auto">
            {/* masthead */}
            <header className="report-block">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                  {t('report.title')} · {projectName}
                </p>
                <p className="mono-num text-xs text-muted">{fmtDate(new Date())}</p>
              </div>
              <div className="mt-4 flex items-end justify-between gap-6 border-b-2 border-ink pb-4">
                <div className="min-w-0">
                  <h1 className="text-[26px] font-semibold italic leading-tight tracking-tighter">
                    {tree.scientificName ?? tree.commonName}
                  </h1>
                  {tree.scientificName ? (
                    <p className="mt-1 text-md text-muted">{tree.commonName}</p>
                  ) : null}
                </div>
                {tree.treeNo != null ? (
                  <div className="shrink-0 text-right">
                    <p className="text-xs uppercase tracking-wider text-muted">
                      {t('field.treeNo')}
                    </p>
                    <p className="mono-num text-[26px] font-medium leading-none">{tree.treeNo}</p>
                  </div>
                ) : null}
              </div>
            </header>

            {/* location */}
            <section className="report-block">
              <SectionTitle no={sectionNo()}>{t('report.sectionLocation')}</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <figure>
                  <MapSnapshot
                    center={tree.location}
                    zoom={17.5}
                    basemapId={basemapId}
                    className="h-[64mm] w-full overflow-hidden rounded-sm border border-ink/30 bg-panel"
                  />
                  <figcaption className="mt-1 text-xs text-muted">
                    {t('report.mapDetail')}
                  </figcaption>
                </figure>
                <figure>
                  <MapSnapshot
                    center={tree.location}
                    zoom={14}
                    basemapId={basemapId}
                    className="h-[64mm] w-full overflow-hidden rounded-sm border border-ink/30 bg-panel"
                  />
                  <figcaption className="mt-1 text-xs text-muted">
                    {t('report.mapContext')}
                  </figcaption>
                </figure>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-4">
                <p className="text-xs text-muted">
                  {t('report.coordinates')}:{' '}
                  <span className="mono-num text-ink">
                    {formatLngLat(tree.location.lng, tree.location.lat)}
                  </span>
                </p>
                <p className="text-[10px] text-muted">{attribution}</p>
              </div>
            </section>

            {/* details */}
            <section className="report-block">
              <SectionTitle no={sectionNo()}>{t('report.sectionDetails')}</SectionTitle>
              <dl className="grid grid-cols-2 gap-x-10">
                <Fact label={t('field.treeNo')} value={tree.treeNo?.toString()} mono />
                <Fact label={t('field.scientificName')} value={tree.scientificName} />
                <Fact label={t('field.commonName')} value={tree.commonName} />
                <Fact label={t('field.planted')} value={fmtDate(tree.plantedDate)} />
                <Fact
                  label={t('field.age')}
                  value={
                    tree.estimatedAgeYears != null
                      ? `±${tree.estimatedAgeYears} ${yearsUnit}`
                      : undefined
                  }
                  mono
                />
                <Fact
                  label={t('field.dbh')}
                  value={tree.dbhCm != null ? `${tree.dbhCm} cm` : undefined}
                  mono
                />
                <Fact
                  label={t('field.height')}
                  value={tree.heightM != null ? `${tree.heightM} m` : undefined}
                  mono
                />
                <Fact
                  label={t('field.canopy')}
                  value={tree.canopyRadiusM != null ? `${tree.canopyRadiusM} m` : undefined}
                  mono
                />
                <Fact
                  label={t('field.health')}
                  value={tree.health ? t(`health.${tree.health}`) : undefined}
                />
                <Fact
                  label={t('field.condition')}
                  value={tree.condition ? t(`condition.${tree.condition}`) : undefined}
                />
                <Fact label={t('field.risk')} value={tree.risk ? t(`risk.${tree.risk}`) : undefined} />
                <Fact label={t('field.lastInspected')} value={fmtDate(tree.lastInspectedOn)} />
                <Fact label={t('field.nextDue')} value={fmtDate(tree.nextInspectionOn)} />
                {nonEmptyEntries(tree.customFields).map(([k, v]) => (
                  <Fact key={k} label={labelFor(k)} value={formatVal(v)} />
                ))}
              </dl>
            </section>

            {/* inspections */}
            {printInspections.length > 0 || inspections.length === 0 ? (
              <section>
                <SectionTitle no={sectionNo()}>{t('report.sectionInspections')}</SectionTitle>
                {inspections.length === 0 ? (
                  <p className="text-xs text-muted">{t('report.noInspections')}</p>
                ) : (
                  printInspections.map((i) => (
                    <article
                      key={i.id}
                      className="report-block mt-3 rounded-sm border border-hairline first:mt-0"
                    >
                      <header className="flex items-baseline justify-between gap-4 border-b border-hairline px-3 py-2">
                        <h3 className="text-sm font-semibold">{fmtDate(i.inspectedOn)}</h3>
                        <p className="text-xs text-muted">
                          {t('report.inspector')}:{' '}
                          {i.userName || i.inspectorName || i.userEmail || t('common.unknown')}
                        </p>
                      </header>
                      <dl className="grid grid-cols-3 gap-x-6 px-3 pb-1 pt-0.5">
                        <Fact label={t('field.health')} value={t(`health.${i.health}`)} />
                        <Fact label={t('field.condition')} value={t(`condition.${i.condition}`)} />
                        <Fact
                          label={t('field.dbh')}
                          value={i.dbhCm != null ? `${i.dbhCm} cm` : undefined}
                          mono
                        />
                        <Fact
                          label={t('field.height')}
                          value={i.heightM != null ? `${i.heightM} m` : undefined}
                          mono
                        />
                        <Fact
                          label={t('field.canopy')}
                          value={i.canopyRadiusM != null ? `${i.canopyRadiusM} m` : undefined}
                          mono
                        />
                        <Fact
                          label={t('field.age')}
                          value={
                            i.estimatedAgeYears != null
                              ? `±${i.estimatedAgeYears} ${yearsUnit}`
                              : undefined
                          }
                          mono
                        />
                      </dl>
                      {i.notes ? (
                        <p className="whitespace-pre-wrap px-3 pb-2 pt-1 text-xs text-ink">
                          {i.notes}
                        </p>
                      ) : null}
                      {nonEmptyEntries(i.customFields ?? {}).length > 0 ? (
                        <dl className="grid grid-cols-2 gap-x-6 border-t border-hairline px-3 py-1.5">
                          {nonEmptyEntries(i.customFields ?? {}).map(([k, v]) => (
                            <Fact key={k} label={labelFor(k)} value={formatVal(v)} />
                          ))}
                        </dl>
                      ) : null}
                    </article>
                  ))
                )}
              </section>
            ) : null}

            {/* photos */}
            {printPhotos.length > 0 ? (
              <section>
                <SectionTitle no={sectionNo()}>{t('report.sectionPhotos')}</SectionTitle>
                <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                  {printPhotos.map((p, idx) => (
                    <figure key={p.id} className="report-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={fullPhotoQs[idx]?.data?.url ?? p.thumbnailUrl}
                        alt={p.caption ?? ''}
                        className="max-h-[110mm] w-full rounded-sm border border-hairline object-cover"
                      />
                      <figcaption className="mt-1 flex items-baseline justify-between gap-3 text-xs text-muted">
                        <span className="min-w-0">{p.caption ?? ''}</span>
                        <span className="shrink-0">{p.groupLabel}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            ) : null}

            {/* colophon */}
            <footer className="mt-10 flex items-baseline justify-between gap-4 border-t border-ink pt-2 text-[10px] text-muted">
              <span>{t('report.generated', { date: fmtDate(new Date()) ?? '' })}</span>
              <span className="mono-num">{tree.id}</span>
            </footer>
          </article>
        </main>
      </div>
    </div>
  );
}

/** Numbered, ruled section header — the dossier backbone of the sheet. */
function SectionTitle({ no, children }: { no: string; children: ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-baseline gap-3 border-b border-ink pb-1.5">
      <span className="mono-num text-xs text-muted">{no}</span>
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">{children}</h2>
    </div>
  );
}

/** One label/value line in a facts grid. Empty values print as an em dash so
 *  the document reads as "checked, not applicable" rather than omitted. */
function Fact({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-hairline py-1.5">
      <dt className="shrink-0 text-xs text-muted">{label}</dt>
      <dd className={cn('min-w-0 break-words text-right text-xs text-ink', mono && 'mono-num')}>
        {value ?? '—'}
      </dd>
    </div>
  );
}

/** Centered fallback frame (loading / not found) with a way back to the map. */
function Shell({
  orgSlug,
  projectSlug,
  children,
}: {
  orgSlug: string;
  projectSlug: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-panel">
      {children}
      <Link
        href={`/orgs/${orgSlug}/projects/${projectSlug}/map` as Route}
        className="text-sm text-accent hover:underline"
      >
        ← TreeMap
      </Link>
    </div>
  );
}
