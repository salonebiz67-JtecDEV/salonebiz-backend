-- ============================================================
-- 🇸🇱 SALONEBIZ DATABASE
-- Initial Schema - Version 0.2.0
-- Complete / Safe / Repeatable Migration
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,

    phone VARCHAR(30) UNIQUE NOT NULL,

    email VARCHAR(255) UNIQUE,

    password_hash TEXT NOT NULL,

    role VARCHAR(30) NOT NULL DEFAULT 'CUSTOMER',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_role_check
        CHECK (
            role IN (
                'CUSTOMER',
                'BUSINESS_OWNER',
                'ADMIN'
            )
        )
);


-- ============================================================
-- BUSINESSES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE RESTRICT,

    name VARCHAR(150) NOT NULL,

    description TEXT,

    category VARCHAR(100) NOT NULL,

    phone VARCHAR(30) NOT NULL,

    address TEXT NOT NULL,

    latitude DECIMAL(10, 7),

    longitude DECIMAL(10, 7),

    logo_url TEXT,

    is_open BOOLEAN NOT NULL DEFAULT TRUE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    opening_time TIME,

    closing_time TIME,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    business_id UUID NOT NULL
        REFERENCES public.businesses(id)
        ON DELETE CASCADE,

    name VARCHAR(150) NOT NULL,

    description TEXT,

    price DECIMAL(12, 2) NOT NULL,

    image_url TEXT,

    category VARCHAR(100),

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT products_price_check
        CHECK (price >= 0)
);


-- ============================================================
-- POSTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    caption TEXT,

    image_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE RESTRICT,

    business_id UUID NOT NULL
        REFERENCES public.businesses(id)
        ON DELETE RESTRICT,

    status VARCHAR(40) NOT NULL DEFAULT 'PENDING',

    customer_name VARCHAR(100) NOT NULL,

    customer_phone VARCHAR(30) NOT NULL,

    delivery_address TEXT NOT NULL,

    delivery_latitude DECIMAL(10, 7),

    delivery_longitude DECIMAL(10, 7),

    delivery_instructions TEXT,

    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,

    rejection_reason TEXT,

    accepted_at TIMESTAMPTZ,

    estimated_arrival_at TIMESTAMPTZ,

    delivered_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT orders_status_check
        CHECK (
            status IN (
                'PENDING',
                'ACCEPTED',
                'PREPARING',
                'READY',
                'OUT_FOR_DELIVERY',
                'DELIVERED',
                'REJECTED',
                'CANCELLED'
            )
        ),

    CONSTRAINT orders_total_check
        CHECK (total_amount >= 0)
);


-- ============================================================
-- ORDER ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL
        REFERENCES public.orders(id)
        ON DELETE CASCADE,

    product_id UUID NOT NULL
        REFERENCES public.products(id)
        ON DELETE RESTRICT,

    product_name VARCHAR(150) NOT NULL,

    quantity INTEGER NOT NULL,

    unit_price DECIMAL(12, 2) NOT NULL,

    subtotal DECIMAL(12, 2) NOT NULL,

    CONSTRAINT order_items_quantity_check
        CHECK (quantity > 0),

    CONSTRAINT order_items_price_check
        CHECK (unit_price >= 0),

    CONSTRAINT order_items_subtotal_check
        CHECK (subtotal >= 0)
);


-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    order_id UUID
        REFERENCES public.orders(id)
        ON DELETE CASCADE,

    title VARCHAR(200) NOT NULL,

    message TEXT NOT NULL,

    type VARCHAR(50) NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- DEVICE TOKENS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    token TEXT NOT NULL UNIQUE,

    platform VARCHAR(30),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_businesses_owner
    ON public.businesses(owner_id);

CREATE INDEX IF NOT EXISTS idx_businesses_category
    ON public.businesses(category);


CREATE INDEX IF NOT EXISTS idx_products_business
    ON public.products(business_id);

CREATE INDEX IF NOT EXISTS idx_products_available
    ON public.products(is_available);


CREATE INDEX IF NOT EXISTS idx_posts_user
    ON public.posts(user_id);

CREATE INDEX IF NOT EXISTS idx_posts_created
    ON public.posts(created_at DESC);


CREATE INDEX IF NOT EXISTS idx_orders_customer
    ON public.orders(customer_id);

CREATE INDEX IF NOT EXISTS idx_orders_business
    ON public.orders(business_id);

CREATE INDEX IF NOT EXISTS idx_orders_status
    ON public.orders(status);


CREATE INDEX IF NOT EXISTS idx_notifications_user
    ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read
    ON public.notifications(is_read);


CREATE INDEX IF NOT EXISTS idx_device_tokens_user
    ON public.device_tokens(user_id);


-- ============================================================
-- FINISHED
-- ============================================================

SELECT
    '🇸🇱 SaloneBiz database schema is ready!' AS message;
