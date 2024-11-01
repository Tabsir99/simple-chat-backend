-- Add search_vector column to Message table
ALTER TABLE "Message"
ADD COLUMN search_vector tsvector;
-- Create function for updating search_vector
CREATE OR REPLACE FUNCTION message_search_vector_update() RETURNS trigger AS $$ BEGIN NEW.search_vector := setweight(
    to_tsvector('english', coalesce(NEW.content, '')),
    'A'
  );
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger for updating search_vector
CREATE TRIGGER message_search_vector_update BEFORE
INSERT
  OR
UPDATE ON "Message" FOR EACH ROW EXECUTE FUNCTION message_search_vector_update();
-- Create the GIN index on the search_vector column
CREATE INDEX message_search_idx ON "Message" USING GIN (search_vector);
-- Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- Create trigram index on User.username
CREATE INDEX idx_username_trgm ON "User" USING gin (username gin_trgm_ops);
-- Recreate User table inserts