-- Retire the species catalog: it was never wired into the app (trees use
-- free-text common/scientific names), so the table + FK are dead weight.
ALTER TABLE trees DROP COLUMN species_id;
DROP TABLE species;
