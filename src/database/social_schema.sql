-- ==========================================
-- SALONEBIZ SOCIAL DATABASE
-- ==========================================

-- POSTS
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    image_url TEXT NOT NULL,

    caption TEXT,

    location TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ==========================================
-- LIKES
-- ==========================================

CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    post_id UUID NOT NULL
        REFERENCES posts(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(post_id, user_id)
);


-- ==========================================
-- FAVORITES
-- ==========================================

CREATE TABLE IF NOT EXISTS post_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    post_id UUID NOT NULL
        REFERENCES posts(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(post_id, user_id)
);


-- ==========================================
-- FOLLOWS / FRIENDS
-- ==========================================

CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    follower_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    following_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(follower_id, following_id),

    CHECK(follower_id <> following_id)
);


-- ==========================================
-- COMMENTS
-- ==========================================

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    post_id UUID NOT NULL
        REFERENCES posts(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    content TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ==========================================
-- SHARES
-- ==========================================

CREATE TABLE IF NOT EXISTS post_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    post_id UUID NOT NULL
        REFERENCES posts(id)
        ON DELETE CASCADE,

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ==========================================
-- PRIVATE MESSAGES
-- ==========================================

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sender_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    receiver_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    content TEXT NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS posts_user_id_idx
ON posts(user_id);

CREATE INDEX IF NOT EXISTS posts_created_at_idx
ON posts(created_at DESC);

CREATE INDEX IF NOT EXISTS likes_post_id_idx
ON post_likes(post_id);

CREATE INDEX IF NOT EXISTS favorites_post_id_idx
ON post_favorites(post_id);

CREATE INDEX IF NOT EXISTS follows_follower_idx
ON follows(follower_id);

CREATE INDEX IF NOT EXISTS follows_following_idx
ON follows(following_id);

CREATE INDEX IF NOT EXISTS comments_post_id_idx
ON comments(post_id);

CREATE INDEX IF NOT EXISTS messages_receiver_idx
ON messages(receiver_id);

CREATE INDEX IF NOT EXISTS messages_sender_idx
ON messages(sender_id);
