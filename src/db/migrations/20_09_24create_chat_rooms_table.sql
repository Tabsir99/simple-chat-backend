-- Chat Rooms Table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id SERIAL PRIMARY KEY,
    is_group BOOLEAN DEFAULT FALSE,
    name VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_id INT REFERENCES messages(id),
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_chat_rooms_last_activity ON chat_rooms(last_activity);
CREATE INDEX idx_chat_rooms_last_message_id ON chat_rooms(last_message_id);