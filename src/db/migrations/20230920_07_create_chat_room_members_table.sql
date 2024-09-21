CREATE TYPE chat_role_enum AS ENUM ('member','admin');

CREATE TABLE IF NOT EXISTS chat_room_members (
    id SERIAL PRIMARY KEY,
    chat_room_id INT REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    user_role chat_role_enum NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mute_until TIMESTAMP,
    UNIQUE (chat_room_id, user_id)
);

-- Indexes
CREATE INDEX idx_chat_room_members_chat_room_id ON chat_room_members(chat_room_id);
CREATE INDEX idx_chat_room_members_user_id ON chat_room_members(user_id);
CREATE INDEX idx_chat_room_members_mute_until ON chat_room_members(mute_until);
