'use client';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useRole } from '@/components/auth/useRole';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useImport } from '@/components/imports/useImport';

// Anchor styled like a secondary sm Button (downloads need a real <a download>).
const downloadBtn =
  'inline-flex h-7 items-center justify-center rounded bg-panel px-2.5 text-sm font-medium text-ink hairline transition-colors hover:bg-paper';

/**
 * Project data export/import, on the settings page (moved off the map chrome).
 * Exports stream from /api/exports/*; imports read a file and open the mapping
 * dialog via useImport.
 */
export function ProjectDataActions() {
  const t = useT();
  const { can } = useRole();
  const canImport = can('editor');
  const { openGeoJson, openCsv, importUi } = useImport();

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">
        {t('data.menu')}
      </h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">{t('data.export')}</p>
          <div className="flex flex-wrap gap-2">
            <a href="/api/exports/trees.geojson" download className={cn(downloadBtn)}>
              {t('data.exportGeojson')}
            </a>
            <a href="/api/exports/trees.csv" download className={cn(downloadBtn)}>
              {t('data.exportCsv')}
            </a>
          </div>
        </div>

        {canImport ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-ink">{t('data.import')}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={openGeoJson}>
                {t('data.importGeojson')}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={openCsv}>
                {t('data.importCsv')}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {importUi}
    </section>
  );
}
