-- Promote two broadly-useful arboriculture attributes to first-class fields:
-- a risk rating and a next-inspection-due date.
CREATE TYPE tree_risk AS ENUM ('low', 'moderate', 'high', 'unknown');

ALTER TABLE trees ADD COLUMN risk tree_risk NOT NULL DEFAULT 'unknown';
ALTER TABLE trees ADD COLUMN next_inspection_on date;
