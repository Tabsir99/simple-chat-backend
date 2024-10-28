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
INSERT INTO "User" (
    "userId",
    "username",
    "email",
    "title",
    "createdAt",
    "profilePicture",
    "bio",
    "lastActive",
    "userStatus"
  )
VALUES (
    '9ab3689f-6788-4209-94cc-e078d948ae2b',
    'mdtabsir0021',
    'mdtabsir0021@gmail.com',
    NULL,
    '2024-10-19 13:54:33.213',
    NULL,
    NULL,
    '2024-10-24 03:17:08.903',
    'offline'
  ),
  (
    '84257c89-a864-4f3c-862e-99c9b1c82429',
    'tabsir348',
    'tabsir348@gmail.com',
    NULL,
    '2024-10-19 13:54:44.978',
    NULL,
    NULL,
    '2024-10-24 03:17:08.903',
    'offline'
  );
INSERT INTO "Friendship" (
    "friendshipId",
    "userId1",
    "userId2",
    "status",
    "senderId",
    "createdAt"
  )
VALUES (
    '09c2ff9e-8254-4b3a-b78b-1eca83728e58',
    '84257c89-a864-4f3c-862e-99c9b1c82429',
    '9ab3689f-6788-4209-94cc-e078d948ae2b',
    'accepted',
    '84257c89-a864-4f3c-862e-99c9b1c82429',
    '2024-10-23 11:38:36.832'
  );
INSERT INTO "ChatRoom" ("chatRoomId")
VALUES ('a6f1c152-6a64-4522-9acf-eb5496e0c37e');
INSERT INTO "Message" ("messageId", "chatRoomId", "type", "content")
VALUES (
    '84257c89-a864-4f3c-862e-99c9b1c82425',
    'a6f1c152-6a64-4522-9acf-eb5496e0c37e',
    'system',
    'Welcome to the chat! Start Messageing...'
  );
UPDATE "ChatRoom"
SET "lastMessageId" = '84257c89-a864-4f3c-862e-99c9b1c82425'
WHERE "chatRoomId" = 'a6f1c152-6a64-4522-9acf-eb5496e0c37e';
INSERT INTO "ChatRoomMember" ("chatRoomId", "userId")
VALUES (
    'a6f1c152-6a64-4522-9acf-eb5496e0c37e',
    '84257c89-a864-4f3c-862e-99c9b1c82429'
  );
INSERT INTO "ChatRoomMember" ("chatRoomId", "userId")
VALUES (
    'a6f1c152-6a64-4522-9acf-eb5496e0c37e',
    '9ab3689f-6788-4209-94cc-e078d948ae2b'
  );

INSERT INTO "MessageReceipt" ("chatRoomId", "userId","lastReadMessageId")
VALUES (
    'a6f1c152-6a64-4522-9acf-eb5496e0c37e',
    '9ab3689f-6788-4209-94cc-e078d948ae2b',
    '84257c89-a864-4f3c-862e-99c9b1c82425'
  ),
  (
    'a6f1c152-6a64-4522-9acf-eb5496e0c37e',
    '84257c89-a864-4f3c-862e-99c9b1c82429',
    '84257c89-a864-4f3c-862e-99c9b1c82425'
  )