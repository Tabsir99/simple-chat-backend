-- Add search_vector column to Message table
ALTER TABLE "Message"
ADD COLUMN search_vector tsvector;

-- Create function for updating search_vector
CREATE OR REPLACE FUNCTION message_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating search_vector
CREATE TRIGGER message_search_vector_update
BEFORE INSERT OR UPDATE ON "Message"
FOR EACH ROW EXECUTE FUNCTION message_search_vector_update();

-- Create the GIN index on the search_vector column
CREATE INDEX message_search_idx ON "Message" USING GIN (search_vector);

-- Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram index on User.username
CREATE INDEX idx_username_trgm ON "User" USING gin (username gin_trgm_ops);
















-- -- Recreate User table inserts
-- INSERT INTO "User" (
--     "userId", 
--     "username", 
--     "email", 
--     "title", 
--     "createdAt", 
--     "profilePicture", 
--     "bio", 
--     "lastActive", 
--     "userStatus"
-- ) VALUES 
-- (
--     '283964d5-1126-4509-a02a-e2f52d8e595d', 
--     'mdtabsir0021', 
--     'mdtabsir0021@gmail.com', 
--     NULL, 
--     '2024-10-19 13:54:33.213', 
--     NULL, 
--     NULL, 
--     NULL, 
--     'online'
-- ),
-- (
--     'cc20b868-a488-4ba5-9574-7ba4b1f37314', 
--     'tabsir348', 
--     'tabsir348@gmail.com', 
--     NULL, 
--     '2024-10-19 13:54:44.978', 
--     NULL, 
--     NULL, 
--     NULL, 
--     'online'
-- ),
-- (
--     'a74a68b8-17cd-4be9-ae38-c8d9c6756d06', 
--     'tabsirsfc', 
--     'tabsirsfc@gmail.com', 
--     NULL, 
--     '2024-10-20 06:44:15.75', 
--     NULL, 
--     NULL, 
--     NULL, 
--     'online'
-- );
