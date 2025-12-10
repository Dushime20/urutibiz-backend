-- UrutiBiz Database Initialization Script
-- This script runs automatically when the database container is first created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS extension (for geospatial data)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable pgvector extension (for vector similarity search)
-- Note: Requires pgvector to be installed in the PostgreSQL image
-- If using postgis/postgis image, you may need to use pgvector/pgvector or custom image
CREATE EXTENSION IF NOT EXISTS vector;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE '✅ Database initialized with required extensions: uuid-ossp, postgis, vector';
END $$;

