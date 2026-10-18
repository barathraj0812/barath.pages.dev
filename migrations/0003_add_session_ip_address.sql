-- Migration number: 0003
-- Store the Cloudflare-provided client IP on the session record. Nullable so
-- requests without a valid CF-Connecting-IP remain usable.
ALTER TABLE sessions ADD COLUMN ip_address TEXT;
