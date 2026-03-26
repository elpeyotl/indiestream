-- Migration 1/2: Add 'listener' value to subscription_tier enum
-- Must be a separate transaction before using the new value
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'listener';
