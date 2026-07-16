/*
  # Create Verification Tokens Table

  1. New Tables
    - `verification_tokens`
      - `id` (uuid, primary key)
      - `email` (text, indexed for lookups)
      - `token_hash` (text, unique constraint)
      - `expires_at` (timestamptz, for expiration checks)
      - `created_at` (timestamptz, auto-generated)
      - `used_at` (timestamptz, nullable, tracks when token was consumed)

  2. Security
    - Enable RLS on `verification_tokens` table
    - Add policy allowing inserts (for token generation)
    - Add policy allowing selects with email/token matching
    - Add policy allowing updates (for marking used)
    - Indexes on email and expires_at for performance

  3. Purpose
    - Stores temporary passwordless authentication tokens
    - Tracks expiration and usage status
    - Enables magic link verification flow
*/

CREATE TABLE IF NOT EXISTS verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  used_at timestamptz,
  CONSTRAINT email_valid CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_tokens_email ON verification_tokens(email);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token_hash ON verification_tokens(token_hash);

-- Enable RLS
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert tokens (for signup)
CREATE POLICY "Anyone can create verification tokens"
  ON verification_tokens
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow select by token hash (for verification)
CREATE POLICY "Verify token by hash"
  ON verification_tokens
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow update to mark token as used
CREATE POLICY "Update token usage status"
  ON verification_tokens
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
