-- Create schemas for geospatial analytics MVP
-- internal: base tables (geo, fact)
-- public_api: read-only views for API and tiles

CREATE SCHEMA IF NOT EXISTS internal;
CREATE SCHEMA IF NOT EXISTS public_api;

-- Enable PostGIS if not already
CREATE EXTENSION IF NOT EXISTS postgis;
