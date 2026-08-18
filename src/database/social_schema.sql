-- ==========================================
-- SALONEBIZ SOCIAL DATABASE
-- ==========================================

CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    business_name VARCHAR(150) NOT NULL,

    description TEXT,

    image_url TEXT NOT NULL,

    location VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    follower_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    following_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (follower_id, following_id),

    CHECK (follower_id <> following_id)
);


CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    post_id UUID NOT NULL
        REFERENCES posts(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (post_id, user_id)
);


CREATE TABLE IF NOT EXISTS post_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    post_id UUID NOT NULL
        REFERENCES posts(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (post_id, user_id)
);


CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    post_id UUID NOT NULL
        REFERENCES posts(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    text TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS posts_created_at_idx
ON posts(created_at DESC);

CREATE INDEX IF NOT EXISTS posts_user_id_idx
ON posts(user_id);

CREATE INDEX IF NOT EXISTS follows_follower_idx
ON follows(follower_id);

CREATE INDEX IF NOT EXISTS follows_following_idx
ON follows(following_id);

CREATE INDEX IF NOT EXISTS likes_post_idx
ON post_likes(post_id);

CREATE INDEX IF NOT EXISTS favorites_post_idx
ON post_favorites(post_id);
