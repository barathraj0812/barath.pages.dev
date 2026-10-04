-- Migration number: 0001 	 2026-10-04T16:17:11.573Z
CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id TEXT NOT NULL UNIQUE,
    first_seen TEXT NOT NULL,
    last_seen TEXT NOT NULL,
    country TEXT,
    region TEXT,
    city TEXT,
    timezone TEXT,
    user_agent TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id TEXT NOT NULL,
    session_id TEXT NOT NULL UNIQUE,
    started_at TEXT NOT NULL,
    last_activity TEXT NOT NULL,
    landing_page TEXT
);

CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    page_url TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_data TEXT,
    page_url TEXT,
    timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS visitor_ips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    first_seen TEXT NOT NULL,
    last_seen TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_visitor
ON sessions(visitor_id);

CREATE INDEX IF NOT EXISTS idx_page_views_visitor
ON page_views(visitor_id);

CREATE INDEX IF NOT EXISTS idx_page_views_session
ON page_views(session_id);

CREATE INDEX IF NOT EXISTS idx_events_visitor
ON events(visitor_id);

CREATE INDEX IF NOT EXISTS idx_events_session
ON events(session_id);

CREATE INDEX IF NOT EXISTS idx_visitor_ips_visitor
ON visitor_ips(visitor_id);