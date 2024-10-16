-- First, create some chat rooms (both individual and group)
INSERT INTO "ChatRoom" ("chatRoomId", "isGroup", "roomName", "createdAt", "lastActivity")
VALUES 
('f47ac10b-58cc-4372-a567-0e02b2c3d479', false, NULL, '2024-10-09 10:00:00', '2024-10-09 15:30:00'),
('b5f8d450-75d4-4aed-8e38-9e3c7f8b165b', false, NULL, '2024-10-09 10:30:00', '2024-10-09 15:45:00'),
('c6d2a790-3b21-4d37-9a98-5c46c12d503b', true, 'Friends Group', '2024-10-09 11:00:00', '2024-10-09 16:00:00');
INSERT INTO "ChatRoomMember" ("chatRoomMemberId", "chatRoomId", "userId", "userRole", "joinedAt", "unreadCount")
VALUES 
('c6d2a790-3b21-4d37-9a98-5c4dc12d503b', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b', 'member', '2024-10-09 10:00:00', 0),
('c6d2a790-3b21-4d37-9a98-5c45c12d503b', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '5935f4ce-7be1-45b6-aea8-a700b0823b54', 'member', '2024-10-09 10:00:00', 3),
('a6d2a790-3b21-4d37-9a98-5c46c12d503b', 'b5f8d450-75d4-4aed-8e38-9e3c7f8b165b', '0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b', 'member', '2024-10-09 10:30:00', 2),
('d6d2a790-3b21-4d37-9a98-5c46c12d503b', 'b5f8d450-75d4-4aed-8e38-9e3c7f8b165b', '742161ae-7f60-4ce3-af98-e62416818f5a', 'member', '2024-10-09 10:30:00', 0),
('c642a790-3b21-4d37-9a98-5c46c12d503b', 'c6d2a790-3b21-4d37-9a98-5c46c12d503b', '0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b', 'admin', '2024-10-09 11:00:00', 0),
('c6d2b790-3b21-4d37-9a98-5c46c12d503b', 'c6d2a790-3b21-4d37-9a98-5c46c12d503b', '5935f4ce-7be1-45b6-aea8-a700b0823b54', 'member', '2024-10-09 11:00:00', 5),
('c6d6a790-3b21-4d37-9a98-5c46c12d503b', 'c6d2a790-3b21-4d37-9a98-5c46c12d503b', '742161ae-7f60-4ce3-af98-e62416818f5a', 'member', '2024-10-09 11:00:00', 2);
INSERT INTO "Message" ("messageId", "chatRoomId", "senderId", "content", "createdAt", "isRead")
VALUES 
('0a2e9bb2-5318-4da9-9bfc-9e86e19f5c6a', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b', 'Hey, how are you?', '2024-10-09 10:15:00', true),
('0b9d8cc4-564a-4ae7-9b4e-c6e0f8916fc5', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '5935f4ce-7be1-45b6-aea8-a700b0823b54', 'I''m good, thanks! Just finished my project', '2024-10-09 10:20:00', true),
('1c6f8dd3-7a8f-4e18-951d-a8f5d32bc915', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b', 'That''s great! How long did it take?', '2024-10-09 10:25:00', true),
('2d7a9ee4-92b0-4819-97c9-b9f5e23fc025', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '5935f4ce-7be1-45b6-aea8-a700b0823b54', 'About two weeks. It was quite challenging!', '2024-10-09 10:30:00', false),
('3e8bafe5-a3c1-491a-b7d0-caf6124db635', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '5935f4ce-7be1-45b6-aea8-a700b0823b54', 'Would you like to see the demo?', '2024-10-09 15:30:00', false),

('4f9cb0e6-b4d2-4a19-b8e1-dbfe35fcf045', 'b5f8d450-75d4-4aed-8e38-9e3c7f8b165b', '0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b', 'Did you see the latest update?', '2024-10-09 11:00:00', true),
('5f1ab7d7-c6f3-4e0a-9a2f-ed2345f7f056', 'b5f8d450-75d4-4aed-8e38-9e3c7f8b165b', '742161ae-7f60-4ce3-af98-e62416818f5a', 'Yes, the new features are amazing!', '2024-10-09 11:05:00', true),
('6f3bc8d8-d7f5-4f0b-ae4f-fe3467e8f067', 'b5f8d450-75d4-4aed-8e38-9e3c7f8b165b', '0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b', 'The performance improvements are significant', '2024-10-09 11:10:00', true),
('7f5cd9e9-e8f7-4f1c-bf5e-0e4579f9f078', 'b5f8d450-75d4-4aed-8e38-9e3c7f8b165b', '742161ae-7f60-4ce3-af98-e62416818f5a', 'I think this will make our workflow smoother', '2024-10-09 15:45:00', false),

('7f5cd9e9-e8f7-4f1c-bf5e-0e4579c9f078', 'c6d2a790-3b21-4d37-9a98-5c46c12d503b', '0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b', 'Hello everyone! Let’s plan for the weekend.', '2024-10-09 11:20:00', true),
('7f5cd9e9-e8f7-4f1c-bf5e-0e4579a9f078', 'c6d2a790-3b21-4d37-9a98-5c46c12d503b', '5935f4ce-7be1-45b6-aea8-a700b0823b54', 'Sounds good! I’m free on Saturday.', '2024-10-09 11:25:00', true),
('7f5cd9e9-e8f7-4f1c-bf5e-0e4579d9f078', 'c6d2a790-3b21-4d37-9a98-5c46c12d503b', '742161ae-7f60-4ce3-af98-e62416818f5a', 'Same here! Let’s meet in the afternoon', '2024-10-09 11:30:00', true),
('7f5cd9e9-e8f7-4f1c-bf5e-0e457929f078', 'c6d2a790-3b21-4d37-9a98-5c46c12d503b', '0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b', 'Great! I’ll book a place.', '2024-10-09 16:00:00', false);

UPDATE "ChatRoom"
SET "lastMessageId" = '3e8bafe5-a3c1-491a-b7d0-caf6124db635'
WHERE "chatRoomId" = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

UPDATE "ChatRoom"
SET "lastMessageId" = '7f5cd9e9-e8f7-4f1c-bf5e-0e4579f9f078'
WHERE "chatRoomId" = 'b5f8d450-75d4-4aed-8e38-9e3c7f8b165b';

UPDATE "ChatRoom"
SET "lastMessageId" = '7f5cd9e9-e8f7-4f1c-bf5e-0e457929f078'
WHERE "chatRoomId" = 'c6d2a790-3b21-4d37-9a98-5c46c12d503b';


INSERT INTO "MessageReceipt" ("receiptId", "lastReadMessageId", "chatRoomMemberId", "readAt") 
VALUES
('88991122-3344-5566-7788-990011223344', '2d7a9ee4-92b0-4819-97c9-b9f5e23fc025', 'c6d2a790-3b21-4d37-9a98-5c4dc12d503b', '2024-10-09 10:25:00'),
('99001122-3344-5566-7788-990011223355', '3e8bafe5-a3c1-491a-b7d0-caf6124db635', 'c6d2a790-3b21-4d37-9a98-5c45c12d503b', '2024-10-09 11:10:00'),
('00112233-4455-6677-8899-001122334466', '7f5cd9e9-e8f7-4f1c-bf5e-0e4579f9f078', 'a6d2a790-3b21-4d37-9a98-5c46c12d503b', '2024-10-09 14:00:00'),
('11223344-5566-7788-9900-112233445577', '7f5cd9e9-e8f7-4f1c-bf5e-0e4579f9f078', 'd6d2a790-3b21-4d37-9a98-5c46c12d503b', '2024-10-09 15:45:00'),
('22334455-6677-8899-0011-223344556688', '7f5cd9e9-e8f7-4f1c-bf5e-0e4579d9f078', 'c642a790-3b21-4d37-9a98-5c46c12d503b', '2024-10-09 14:00:00'),
('33445566-7788-9900-1122-334455667799', '7f5cd9e9-e8f7-4f1c-bf5e-0e457929f078', 'c6d2b790-3b21-4d37-9a98-5c46c12d503b', '2024-10-09 13:00:00'),
('33445566-7788-9900-1122-334455669799', '7f5cd9e9-e8f7-4f1c-bf5e-0e457929f078', 'c6d6a790-3b21-4d37-9a98-5c46c12d503b', '2024-10-09 13:00:00');


INSERT INTO "MessageReaction" ("messageReactionId","messageId", "userId", "reactionType", "createdAt") 
VALUES
('0a2e9bb2-5318-4da9-9bfc-9e86e39f5c6a','0a2e9bb2-5318-4da9-9bfc-9e86e19f5c6a', '5935f4ce-7be1-45b6-aea8-a700b0823b54', '👍', NOW()),
('0a2e9bb2-5318-4da9-9bfc-9e86e49f5c6a','2d7a9ee4-92b0-4819-97c9-b9f5e23fc025', '742161ae-7f60-4ce3-af98-e62416818f5a', '❤️', NOW()),
('0a2e9bb2-5318-4da9-9bfc-9e86e59f5c6a','0b9d8cc4-564a-4ae7-9b4e-c6e0f8916fc5', '0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b', '😮', NOW()),
('0a2e9bb2-5318-4da9-9bfc-9e86e19f5c6b','1c6f8dd3-7a8f-4e18-951d-a8f5d32bc915', '5935f4ce-7be1-45b6-aea8-a700b0823b54', '👍', NOW()),
('0a2e9bb2-5318-4da9-9bfc-9e86e19f5c6f','3e8bafe5-a3c1-491a-b7d0-caf6124db635', '0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b', '😂', NOW()),
('0a2e9bb2-5318-4da9-9bfc-9e86e19f5c3a','4f9cb0e6-b4d2-4a19-b8e1-dbfe35fcf045', '5935f4ce-7be1-45b6-aea8-a700b0823b54', '😄', NOW()),
('0a2e9bb2-5318-4da9-9bfc-9e86e13f5c6a','5f1ab7d7-c6f3-4e0a-9a2f-ed2345f7f056', '0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b', '😢', NOW()),
('0a2e9bb2-5318-4da9-9bfc-9e86e1925c6a','6f3bc8d8-d7f5-4f0b-ae4f-fe3467e8f067', '742161ae-7f60-4ce3-af98-e62416818f5a', '😡', NOW()),
('7f5cd9e9-e8f7-4f1c-bf5e-0e4579d9f074','7f5cd9e9-e8f7-4f1c-bf5e-0e4579d9f078','742161ae-7f60-4ce3-af98-e62416818f5a','😂',NOW()),
('7f5cd9e9-e8f7-4f1c-bf5e-0e4579d9f075','7f5cd9e9-e8f7-4f1c-bf5e-0e4579d9f078','0d3c9ef4-8e11-45f8-a3dc-9b04404bb00b','😂',NOW()),
('7f5cd9e9-e8f7-4f1c-bf5e-0e4579d9f076','7f5cd9e9-e8f7-4f1c-bf5e-0e4579d9f078','5935f4ce-7be1-45b6-aea8-a700b0823b54','😂',NOW());