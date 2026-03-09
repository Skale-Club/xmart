-- Add per-user ownership to cameras without requiring env vars per camera.
-- This uses an app-level owner id (UUID) sent by the frontend.

ALTER TABLE cameras
ADD COLUMN IF NOT EXISTS owner_id UUID;

-- Backfill legacy rows to a deterministic placeholder owner.
UPDATE cameras
SET owner_id = '00000000-0000-0000-0000-000000000000'
WHERE owner_id IS NULL;

ALTER TABLE cameras
ALTER COLUMN owner_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cameras_owner_id ON cameras(owner_id);
