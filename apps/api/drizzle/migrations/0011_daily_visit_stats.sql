CREATE TABLE IF NOT EXISTS daily_visit_stats (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  path VARCHAR(255) NOT NULL DEFAULT '/',
  page_views INTEGER NOT NULL DEFAULT 0,
  bot_requests INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, path)
);

CREATE INDEX idx_daily_visit_stats_date ON daily_visit_stats(date);
CREATE INDEX idx_daily_visit_stats_path ON daily_visit_stats(path);
