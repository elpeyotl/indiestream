-- Add lyrics_language column to tracks table
-- Stores ISO 639-1 language code or 'instrumental' for tracks without lyrics
ALTER TABLE tracks ADD COLUMN lyrics_language text;
