-- Widen api_key_prefix from varchar(8) to varchar(16)
-- Safe operation: no data loss, existing 8-char prefixes remain valid
ALTER TABLE users ALTER COLUMN api_key_prefix TYPE varchar(16);
