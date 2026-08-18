-- ============================================================
-- 🇸🇱 SALONEBIZ SOCIAL DATABASE
-- Social Features - Version 0.2.0
-- Safe / Repeatable Migration
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- USER PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    username VARCHAR(50) UNIQUE,

    bio TEXT,

    avatar_url TEXT,

    cover_url TEXT,

    location VARCHAR(255),

    website TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- POSTS
-- IMAGE ONLY
-- ============================================================

CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    business_name VARCHAR(150) NOT NULL,

    description TEXT,

    image_url TEXT NOT NULL,

    location VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- FOLLOWS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    follower_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    following_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (follower_id, following_id),

    CHECK (follower_id <> following_id)
);


-- ============================================================
-- FRIEND REQUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sender_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    receiver_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (sender_id, receiver_id),

    CHECK (sender_id <> receiver_id),

    CONSTRAINT friend_request_status_check
        CHECK (
            status IN (
                'PENDING',
                'ACCEPTED',
                'REJECTED',
                'CANCELLED'
            )
        )
);


-- ============================================================
-- POST LIKES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    post_id UUID NOT NULL
        REFERENCES public.posts(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (post_id, user_id)
);


-- ============================================================
-- POST FAVORITES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.post_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    post_id UUID NOT NULL
        REFERENCES public.posts(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (post_id, user_id)
);


-- ============================================================
-- COMMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    post_id UUID NOT NULL
        REFERENCES public.posts(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    text TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- POST SHARES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.post_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    post_id UUID NOT NULL
        REFERENCES public.posts(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (post_id, user_id)
);


-- ============================================================
-- MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sender_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    receiver_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    message TEXT NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (sender_id <> receiver_id)
);


-- ============================================================
-- NOTIFICATION TYPE SUPPORT
-- ============================================================

-- The existing notifications table from 001_initial_schema.sql
-- is reused for social notifications as well.


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username
    ON public.profiles(username);

CREATE INDEX IF NOT EXISTS idx_profiles_user
    ON public.profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_posts_created_at
    ON public.posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_user
    ON public.posts(user_id);

CREATE INDEX IF NOT EXISTS idx_posts_location
    ON public.posts(location);

CREATE INDEX IF NOT EXISTS idx_follows_follower
    ON public.follows(follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_following
    ON public.follows(following_id);

CREATE INDEX IF NOT EXISTS idx_friend_requests_sender
    ON public.friend_requests(sender_id);

CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver
    ON public.friend_requests(receiver_id);

CREATE INDEX IF NOT EXISTS idx_friend_requests_status
    ON public.friend_requests(status);

CREATE INDEX IF NOT EXISTS idx_post_likes_post
    ON public.post_likes(post_id);

CREATE INDEX IF NOT EXISTS idx_post_likes_user
    ON public.post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_post_favorites_post
    ON public.post_favorites(post_id);

CREATE INDEX IF NOT EXISTS idx_post_favorites_user
    ON public.post_favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_comments_post
    ON public.comments(post_id);

CREATE INDEX IF NOT EXISTS idx_comments_user
    ON public.comments(user_id);

CREATE INDEX IF NOT EXISTS idx_post_shares_post
    ON public.post_shares(post_id);

CREATE INDEX IF NOT EXISTS idx_post_shares_user
    ON public.post_shares(user_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender
    ON public.messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_receiver
    ON public.messages(receiver_id);

CREATE INDEX IF NOT EXISTS idx_messages_created
    ON public.messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_unread
    ON public.messages(receiver_id, is_read);


-- ============================================================
-- DONE
-- ============================================================

SELECT
    '🇸🇱 SaloneBiz social database schema is ready!' AS message;
