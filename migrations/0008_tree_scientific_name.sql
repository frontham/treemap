-- Denormalized scientific name on the tree itself.
-- We still keep species_id for proper catalog linkage; this is the free-text
-- value when the user hasn't picked a catalog entry yet.
ALTER TABLE trees ADD COLUMN scientific_name text;
