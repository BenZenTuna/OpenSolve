CREATE UNIQUE INDEX IF NOT EXISTS problems_title_unique ON problems (lower(trim(title)));
