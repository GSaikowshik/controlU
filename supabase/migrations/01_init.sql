-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    generation_tier VARCHAR(50) NOT NULL,
    aura_points INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Urge Categories Table
CREATE TABLE IF NOT EXISTS urge_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    UNIQUE (user_id, name)
);

-- 3. Intervention Logs Table
CREATE TABLE IF NOT EXISTS intervention_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES urge_categories(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_full_session BOOLEAN NOT NULL DEFAULT FALSE,
    duration_seconds INT NOT NULL
);

-- Indices for performance optimization
CREATE INDEX IF NOT EXISTS idx_urge_categories_user ON urge_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_intervention_logs_user ON intervention_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_intervention_logs_category ON intervention_logs(category_id);
