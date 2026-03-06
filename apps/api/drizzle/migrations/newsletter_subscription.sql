-- Migration: Add newsletter subscription fields to users table
-- Session B: Newsletter infrastructure
-- Applied: manually via psql on production
-- psql $DATABASE_URL -f apps/api/drizzle/migrations/newsletter_subscription.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS newsletter_subscribed        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS newsletter_subscribed_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS newsletter_consent_ip        VARCHAR(45),
  ADD COLUMN IF NOT EXISTS newsletter_consent_method    VARCHAR(50),
  ADD COLUMN IF NOT EXISTS newsletter_unsubscribe_token VARCHAR(128);

CREATE UNIQUE INDEX IF NOT EXISTS users_newsletter_unsubscribe_token_idx
  ON users (newsletter_unsubscribe_token)
  WHERE newsletter_unsubscribe_token IS NOT NULL;
