-- Backfill per-project tree numbers for trees that have none, so every tree is
-- numbered (matching the now-unconditional auto-numbering on create). Assigns
-- sequential numbers after each project's current max, oldest-first. The max is
-- taken over ALL rows including soft-deleted ones (the partial unique index
-- counts them), so the new numbers can't collide. Idempotent: only fills NULLs.
WITH base AS (
  SELECT project_id, COALESCE(MAX(tree_no), 0) AS max_no
  FROM trees
  WHERE project_id IS NOT NULL
  GROUP BY project_id
),
numbered AS (
  SELECT t.id,
         b.max_no + row_number() OVER (
           PARTITION BY t.project_id ORDER BY t.created_at, t.id
         ) AS new_no
  FROM trees t
  JOIN base b ON b.project_id = t.project_id
  WHERE t.tree_no IS NULL
    AND t.project_id IS NOT NULL
    AND t.deleted_at IS NULL
)
UPDATE trees t
SET tree_no = n.new_no
FROM numbered n
WHERE t.id = n.id;
