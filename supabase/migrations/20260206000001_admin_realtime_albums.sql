-- Enable realtime for albums table (safe: skip if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'albums'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.albums;
  END IF;
END $$;
