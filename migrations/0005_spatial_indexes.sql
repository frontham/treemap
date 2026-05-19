-- Spatial GIST index for bounding-box queries
CREATE INDEX trees_location_idx ON trees USING GIST (location);

-- Partial index for the common "alive trees" query path
CREATE INDEX trees_org_alive_idx ON trees (org_id) WHERE deleted_at IS NULL;
