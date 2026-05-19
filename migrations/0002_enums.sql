CREATE TYPE role AS ENUM ('owner', 'admin', 'editor', 'viewer');

CREATE TYPE tree_health AS ENUM ('healthy', 'fair', 'poor', 'dead', 'unknown');

CREATE TYPE tree_condition AS ENUM ('excellent', 'good', 'fair', 'poor', 'critical', 'unknown');

CREATE TYPE placed_via AS ENUM ('map_click', 'current_location', 'image_overlay', 'import');

CREATE TYPE custom_field_type AS ENUM ('text', 'number', 'boolean', 'select', 'multiselect', 'date');

CREATE TYPE import_status AS ENUM ('pending', 'validating', 'running', 'completed', 'failed', 'cancelled');

CREATE TYPE revision_op AS ENUM ('create', 'update', 'delete', 'restore');
