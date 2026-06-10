-- Link photos to inspections so a photo can serve as dated evidence for a
-- specific assessment. Nullable: photos with inspection_id IS NULL are general
-- tree photos (the Details strip); linked photos appear under their inspection.
-- ON DELETE SET NULL: deleting an inspection keeps its photos on the tree as
-- general photos rather than destroying them.
ALTER TABLE tree_photos
  ADD COLUMN inspection_id uuid REFERENCES tree_inspections(id) ON DELETE SET NULL;
CREATE INDEX tree_photos_inspection_idx ON tree_photos (inspection_id);
