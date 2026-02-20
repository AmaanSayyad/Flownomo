-- Bet History Table
-- Stores all bet results for persistent history and leaderboard

CREATE TABLE IF NOT EXISTS bet_history (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  asset TEXT NOT NULL DEFAULT 'BNB',
  direction TEXT NOT NULL CHECK (direction IN ('UP', 'DOWN')),
  amount NUMERIC(20, 8) NOT NULL,
  multiplier NUMERIC(10, 4) NOT NULL DEFAULT 1.9,
  strike_price NUMERIC(20, 8) NOT NULL DEFAULT 0,
  end_price NUMERIC(20, 8) NOT NULL DEFAULT 0,
  payout NUMERIC(20, 8) NOT NULL DEFAULT 0,
  won BOOLEAN NOT NULL DEFAULT false,
  mode TEXT NOT NULL DEFAULT 'binomo',
  network TEXT DEFAULT 'BNB',
  resolved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fetching user history by wallet
CREATE INDEX IF NOT EXISTS idx_bet_history_wallet ON bet_history (wallet_address, resolved_at DESC);

-- Index for leaderboard queries (top winners)
CREATE INDEX IF NOT EXISTS idx_bet_history_leaderboard ON bet_history (won, payout DESC);

-- Index for asset filtering
CREATE INDEX IF NOT EXISTS idx_bet_history_asset ON bet_history (asset);

-- Enable Row Level Security
ALTER TABLE bet_history ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (for leaderboard)
CREATE POLICY "Allow public read" ON bet_history
  FOR SELECT USING (true);

-- Allow anyone to insert (server-side, anon key)
CREATE POLICY "Allow public insert" ON bet_history
  FOR INSERT WITH CHECK (true);
