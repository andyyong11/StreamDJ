-- Create streams table
CREATE TABLE IF NOT EXISTS streams (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    dj VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    image_url TEXT,
    current_track VARCHAR(255),
    next_track VARCHAR(255),
    upcoming_tracks TEXT[],
    listeners INTEGER DEFAULT 0,
    current_track_duration INTEGER,
    current_position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    stream_id INTEGER REFERENCES streams(id),
    user_id VARCHAR(255),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample stream data
INSERT INTO streams (title, dj, genre, image_url, current_track, next_track, upcoming_tracks, listeners, current_track_duration, current_position)
VALUES (
    'Late Night Vibes',
    'DJ Awesome',
    'Electronic/Chill',
    'https://picsum.photos/400/400',
    'Midnight Drive - ChillWave',
    'Ocean Breeze - LoFi Dreams',
    ARRAY['Starlight - Ambient Flow', 'Sunset - Deep House'],
    142,
    180,
    45
); 