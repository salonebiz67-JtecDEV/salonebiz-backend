-- ============================================================
-- 🇸🇱 SALONEBIZ DATABASE
-- Initial Schema - Version 0.1.0
-- ============================================================

-- =========================
-- USERS
-- =========================

CREATE TABLE users (
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
        CHECK (role IN ('CUSTOMER', 'BUSINESS_OWNER', 'ADMIN'))
);


-- =========================
-- BUSINESSES
-- =========================

CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_id UUID NOT NULL
        REFERENCES users(id)
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


-- =========================
-- PRODUCTS
-- =========================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    business_id UUID NOT NULL
        REFERENCES businesses(id)
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


-- =========================
-- ORDERS
-- =========================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    business_id UUID NOT NULL
        REFERENCES businesses(id)
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


-- =========================
-- ORDER ITEMS
-- =========================

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL
        REFERENCES orders(id)
        ON DELETE CASCADE,

    product_id UUID NOT NULL
        REFERENCES products(id)
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


-- =========================
-- NOTIFICATIONS
-- =========================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    order_id UUID
        REFERENCES orders(id)
        ON DELETE CASCADE,

    title VARCHAR(200) NOT NULL,

    message TEXT NOT NULL,

    type VARCHAR(50) NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================
-- DEVICE TOKENS
-- Used later for push notifications
-- =========================

CREATE TABLE device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    token TEXT NOT NULL UNIQUE,

    platform VARCHAR(30),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================
-- INDEXES
-- =========================

CREATE INDEX idx_businesses_owner
    ON businesses(owner_id);

CREATE INDEX idx_businesses_category
    ON businesses(category);

CREATE INDEX idx_products_business
    ON products(business_id);

CREATE INDEX idx_products_available
    ON products(is_available);

CREATE INDEX idx_orders_customer
    ON orders(customer_id);

CREATE INDEX idx_orders_business
    ON orders(business_id);

CREATE INDEX idx_orders_status
    ON orders(status);

CREATE INDEX idx_notifications_user
    ON notifications(user_id);

CREATE INDEX idx_notifications_read
    ON notifications(is_read);
