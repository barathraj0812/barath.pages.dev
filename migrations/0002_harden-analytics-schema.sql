
-- Migration 0002: Minimize analytics data and improve query performance.
-- Migration 0001 remains unchanged.

-- Remove raw IP storage.
DROP TABLE IF EXISTS visitor_ips;

-- Remove unnecessary visitor-level metadata.
ALTER TABLE visitors DROP COLUMN country;
ALTER TABLE visitors DROP COLUMN region;
ALTER TABLE visitors DROP COLUMN city;
ALTER TABLE visitors DROP COLUMN timezone;
ALTER TABLE visitors DROP COLUMN user_agent;

-- Store country and coarse device information per session instead.
ALTER TABLE sessions ADD COLUMN country TEXT;
ALTER TABLE sessions ADD COLUMN referrer_host TEXT;
ALTER TABLE sessions ADD COLUMN device_class TEXT;

-- Remove redundant page-view fields.
ALTER TABLE page_views DROP COLUMN page_title;
ALTER TABLE page_views DROP COLUMN referrer;

-- Indexes for recent-activity queries and retention cleanup.
CREATE INDEX IF NOT EXISTS idx_visitors_last_seen
ON visitors(last_seen);

CREATE INDEX IF NOT EXISTS idx_sessions_started_at
ON sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_page_views_timestamp
ON page_views(timestamp);

CREATE INDEX IF NOT EXISTS idx_events_timestamp
ON events(timestamp);
