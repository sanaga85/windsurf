-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for random UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create function for generating random UUIDs
CREATE OR REPLACE FUNCTION gen_random_uuid() RETURNS uuid AS $$
BEGIN
    RETURN uuid_generate_v4();
END;
$$ LANGUAGE plpgsql;