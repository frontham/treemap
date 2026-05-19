CREATE TABLE species (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid REFERENCES organizations(id) ON DELETE CASCADE,
  scientific_name  text NOT NULL,
  common_name      text,
  family           text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX species_org_idx ON species (org_id);

CREATE TABLE custom_field_defs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key            text NOT NULL,
  label          text NOT NULL,
  type           custom_field_type NOT NULL,
  options        jsonb,
  required       boolean NOT NULL DEFAULT false,
  display_order  integer NOT NULL DEFAULT 0,
  archived_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX custom_field_defs_org_key_idx ON custom_field_defs (org_id, key);

CREATE TABLE trees (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location              geography(Point, 4326) NOT NULL,
  location_accuracy_m   real,
  placed_via            placed_via NOT NULL,
  species_id            uuid REFERENCES species(id) ON DELETE SET NULL,
  common_name           text,
  health                tree_health NOT NULL DEFAULT 'unknown',
  condition             tree_condition NOT NULL DEFAULT 'unknown',
  estimated_age_years   integer,
  dbh_cm                real,
  height_m              real,
  canopy_radius_m       real,
  planted_date          date,
  notes                 text,
  custom_fields         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by            uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by            uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz
);
CREATE INDEX trees_org_idx ON trees (org_id);

CREATE TABLE tree_revisions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id     uuid NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  changed_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  changed_at  timestamptz NOT NULL DEFAULT now(),
  operation   revision_op NOT NULL,
  diff        jsonb NOT NULL
);
CREATE INDEX tree_revisions_tree_idx ON tree_revisions (tree_id, changed_at);

CREATE TABLE tree_photos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id        uuid NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  org_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  storage_key    text NOT NULL,
  thumbnail_key  text,
  mime_type      text NOT NULL,
  size_bytes     integer NOT NULL,
  width          integer,
  height         integer,
  caption        text,
  taken_at       timestamptz,
  uploaded_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tree_photos_tree_idx ON tree_photos (tree_id);

CREATE TABLE overlays (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             text NOT NULL,
  storage_key      text NOT NULL,
  opacity_default  real NOT NULL DEFAULT 0.7,
  corners          jsonb NOT NULL,
  z_index          integer NOT NULL DEFAULT 0,
  created_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX overlays_org_idx ON overlays (org_id);

CREATE TABLE import_jobs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  started_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  source       text NOT NULL,
  status       import_status NOT NULL DEFAULT 'pending',
  stats        jsonb,
  error        jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  finished_at  timestamptz
);
CREATE INDEX import_jobs_org_idx ON import_jobs (org_id, created_at);
