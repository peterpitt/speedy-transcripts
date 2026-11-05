-- M4: idempotency key for the serverless distributor.
-- The stateless Lambda can't keep "already spawned" in memory, so it records the
-- launched Fargate task ARN here and only spawns sessions WHERE fargate_task_arn IS NULL.
ALTER TABLE job_sessions ADD COLUMN IF NOT EXISTS fargate_task_arn TEXT;
CREATE INDEX IF NOT EXISTS idx_job_sessions_unspawned
  ON job_sessions (id) WHERE fargate_task_arn IS NULL;
