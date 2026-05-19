import { customType } from 'drizzle-orm/pg-core';

export type LngLat = { lng: number; lat: number };

/**
 * geography(Point, 4326) — WGS84 lon/lat on a sphere.
 * Reads should go through SQL helpers using ST_X/ST_Y or ST_AsGeoJSON,
 * not raw column selects, so we deliberately don't implement fromDriver.
 */
export const geographyPoint = customType<{ data: LngLat; driverData: string }>({
  dataType() {
    return 'geography(Point, 4326)';
  },
  toDriver(value) {
    return `SRID=4326;POINT(${value.lng} ${value.lat})`;
  },
});
