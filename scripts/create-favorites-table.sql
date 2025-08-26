-- =====================================================
-- CREATE USER_FAVORITES TABLE MANUALLY
-- =====================================================

-- Drop table if exists (for clean start)
DROP TABLE IF EXISTS user_favorites;

-- Create user_favorites table
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    metadata JSONB NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint - user can only favorite a product once
    CONSTRAINT uk_user_product_favorite UNIQUE (user_id, product_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_product_id ON user_favorites(product_id);
CREATE INDEX idx_user_favorites_created_at ON user_favorites(created_at);

-- Add table comment
COMMENT ON TABLE user_favorites IS 'User favorite products with optimized querying';

-- Add column comments
COMMENT ON COLUMN user_favorites.id IS 'Primary key UUID';
COMMENT ON COLUMN user_favorites.user_id IS 'Reference to users table';
COMMENT ON COLUMN user_favorites.product_id IS 'Reference to products table';
COMMENT ON COLUMN user_favorites.metadata IS 'Additional favorite metadata like tags, notes, etc.';
COMMENT ON COLUMN user_favorites.created_at IS 'When the favorite was created';
COMMENT ON COLUMN user_favorites.updated_at IS 'When the favorite was last updated';

-- Display success message
SELECT 'user_favorites table created successfully!' AS result;
