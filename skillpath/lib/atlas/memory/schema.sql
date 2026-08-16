-- SKILLPATH ATLAS 2.0 SUPABASE DATABASE SCHEMA WITH PGVECTOR
-- Enable pgvector extension for episodic RAG memory retrieval

CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  full_name TEXT,
  target_role TEXT,
  preferred_location TEXT,
  learning_hours_per_week INT DEFAULT 10,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_goal TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Vector Memories Table (Episodic + Semantic Memory)
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  memory_type TEXT CHECK (memory_type IN ('profile', 'episodic', 'procedural', 'feedback')),
  content TEXT NOT NULL,
  embedding vector(768),
  relevance_score FLOAT DEFAULT 1.0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_user_type ON memories(user_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 4. Agent States Table (Session snapshots)
CREATE TABLE IF NOT EXISTS agent_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  step_name TEXT NOT NULL,
  state_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User Feedback Table
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT,
  agent_id TEXT NOT NULL,
  item_target TEXT,
  feedback_type TEXT CHECK (feedback_type IN ('like', 'reject', 'correction')),
  user_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Skill Progress Tracking Table
CREATE TABLE IF NOT EXISTS skill_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  proficiency_level INT CHECK (proficiency_level BETWEEN 1 AND 10),
  status TEXT CHECK (status IN ('planned', 'in_progress', 'mastered')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Job Interactions Table
CREATE TABLE IF NOT EXISTS job_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company_name TEXT,
  action TEXT CHECK (action IN ('viewed', 'saved', 'applied', 'rejected', 'flagged_scam')),
  match_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
