CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,

  name TEXT NOT NULL,

  email TEXT NOT NULL UNIQUE,

  password_hash TEXT NOT NULL,

  password_history JSONB
    NOT NULL
    DEFAULT '[]'::jsonb,

  role TEXT NOT NULL
    CHECK (
      role IN (
        'super_admin',
        'admin',
        'manager',
        'staff',
        'viewer'
      )
    ),

  status TEXT NOT NULL
    DEFAULT 'active'
    CHECK (
      status IN (
        'active',
        'inactive'
      )
    ),

  must_change_password BOOLEAN
    NOT NULL
    DEFAULT TRUE,

  failed_login_attempts INTEGER
    NOT NULL
    DEFAULT 0,

  locked_until TIMESTAMPTZ NULL,

  session_version INTEGER
    NOT NULL
    DEFAULT 1,

  last_login_at TIMESTAMPTZ NULL,

  password_changed_at TIMESTAMPTZ
    NOT NULL
    DEFAULT NOW(),

  created_at TIMESTAMPTZ
    NOT NULL
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    NOT NULL
    DEFAULT NOW(),

  created_by TEXT NULL,

  updated_by TEXT NULL
);

CREATE INDEX IF NOT EXISTS
app_users_status_idx
ON app_users(status);

CREATE TABLE IF NOT EXISTS
auth_audit_logs (
  id TEXT PRIMARY KEY,

  timestamp TIMESTAMPTZ
    NOT NULL
    DEFAULT NOW(),

  actor_user_id TEXT NULL,

  actor_email TEXT NOT NULL,

  action TEXT NOT NULL,

  target_user_id TEXT NULL,

  target_email TEXT NULL,

  ip_address TEXT NULL,

  user_agent TEXT NULL,

  result TEXT NOT NULL
    CHECK (
      result IN (
        'success',
        'failure'
      )
    ),

  details TEXT
    NOT NULL
    DEFAULT ''
);

CREATE INDEX IF NOT EXISTS
auth_audit_timestamp_idx
ON auth_audit_logs(
  timestamp DESC
);

-- The user_sessions table is created automatically
-- by connect-pg-simple.