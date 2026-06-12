'use client';

import { useT } from '@/lib/i18n/LocaleProvider';
import { formatLngLat } from '@/lib/formatCoord';
import type { BasemapId } from '@/components/map/basemaps';
import { MapSnapshot } from './MapSnapshot';
import { SectionTitle } from './SectionTitle';

const SNAPSHOT_CLASS = 'h-[64mm] w-full overflow-hidden rounded-sm border border-ink/30 bg-panel';

/** Two map snapshots (detail + surroundings) with coordinates + attribution. */
export function LocationSection({
  no,
  location,
  basemapId,
  attribution,
}: {
  no: string;
  location: { lng: number; lat: number };
  basemapId: BasemapId;
  attribution: string;
}) {
  const t = useT();
  return (
    <section className="report-block">
      <SectionTitle no={no}>{t('report.sectionLocation')}</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <figure>
          <MapSnapshot center={location} zoom={17.5} basemapId={basemapId} className={SNAPSHOT_CLASS} />
          <figcaption className="mt-1 text-xs text-muted">{t('report.mapDetail')}</figcaption>
        </figure>
        <figure>
          <MapSnapshot center={location} zoom={14} basemapId={basemapId} className={SNAPSHOT_CLASS} />
          <figcaption className="mt-1 text-xs text-muted">{t('report.mapContext')}</figcaption>
        </figure>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <p className="text-xs text-muted">
          {t('report.coordinates')}:{' '}
          <span className="mono-num text-ink">{formatLngLat(location.lng, location.lat)}</span>
        </p>
        <p className="text-[10px] text-muted">{attribution}</p>
      </div>
    </section>
  );
}
