"""
M4 Lambda distributor — replaces M1's distributor.py (the tmux poll loop on EC2).

EventBridge fires this every minute. It polls Supabase for pending jobs and
launches one ECS Fargate task per job via ecs:RunTask (fire-and-forget). The
launched task's ARN is written to job_sessions.fargate_task_arn, which is the
idempotency key the stateless Lambda can't keep in memory: a session that
already has an ARN is skipped on later ticks.

Imports only boto3 + supabase. It does NOT call OpenAI itself — it forwards the
OpenAI / Supabase creds to the Fargate task via containerOverrides[].environment.

Scope (M4 = pass 1 only): spawn pending jobs. Stuck-job recovery and storage
cleanup are a v2 roadmap item and are intentionally not implemented here.

Env vars (set on the Lambda function):
  SUPABASE_URL, SUPABASE_SECRET_KEY, OPENAI_API_KEY
  ECS_CLUSTER, TASK_DEFINITION, SUBNETS (comma-separated)
  SECURITY_GROUPS (optional, comma-separated), CONTAINER_NAME (default "worker")
"""
import os

import boto3
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SECRET_KEY = os.environ["SUPABASE_SECRET_KEY"]
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]

ECS_CLUSTER = os.environ["ECS_CLUSTER"]
TASK_DEFINITION = os.environ["TASK_DEFINITION"]
SUBNETS = [s.strip() for s in os.environ["SUBNETS"].split(",") if s.strip()]
SECURITY_GROUPS = [s.strip() for s in os.environ.get("SECURITY_GROUPS", "").split(",") if s.strip()]
CONTAINER_NAME = os.environ.get("CONTAINER_NAME", "worker")

db = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
ecs = boto3.client("ecs")


def _ensure_session(job_id: str) -> str:
    """Return the job's current session id, creating + LINKING one if absent.

    The jobs.update(current_session_id=...) line is load-bearing: without it a
    direct-INSERT test job has a null current_session_id and worker.py crashes at
    its first update_session(...). Production (POST /api/jobs) already links them.
    """
    job = db.table("jobs").select("current_session_id").eq("id", job_id).single().execute().data
    if job and job.get("current_session_id"):
        return job["current_session_id"]
    row = db.table("job_sessions").insert({"job_id": job_id, "session_number": 1}).execute().data[0]
    db.table("jobs").update({"current_session_id": row["id"]}).eq("id", job_id).execute()
    return row["id"]


def _already_spawned(session_id: str) -> bool:
    row = (
        db.table("job_sessions").select("fargate_task_arn").eq("id", session_id)
        .single().execute().data
    )
    return bool(row and row.get("fargate_task_arn"))


def _run_task(job_id: str) -> str:
    awsvpc = {"subnets": SUBNETS, "assignPublicIp": "ENABLED"}
    if SECURITY_GROUPS:
        awsvpc["securityGroups"] = SECURITY_GROUPS
    resp = ecs.run_task(
        cluster=ECS_CLUSTER,
        taskDefinition=TASK_DEFINITION,
        launchType="FARGATE",
        count=1,
        networkConfiguration={"awsvpcConfiguration": awsvpc},
        overrides={
            "containerOverrides": [
                {
                    "name": CONTAINER_NAME,
                    "environment": [
                        {"name": "JOB_ID", "value": job_id},
                        {"name": "SUPABASE_URL", "value": SUPABASE_URL},
                        {"name": "SUPABASE_SECRET_KEY", "value": SUPABASE_SECRET_KEY},
                        {"name": "OPENAI_API_KEY", "value": OPENAI_API_KEY},
                    ],
                }
            ]
        },
    )
    tasks = resp.get("tasks") or []
    if not tasks:
        raise RuntimeError(f"RunTask launched no task for {job_id}: {resp.get('failures')}")
    return tasks[0]["taskArn"]


def handler(event, context):
    pending = db.table("jobs").select("id").eq("status", "pending").execute().data or []
    spawned = []
    for job in pending:
        job_id = job["id"]
        session_id = _ensure_session(job_id)
        if _already_spawned(session_id):
            continue  # idempotency: a Fargate task already launched for this session
        task_arn = _run_task(job_id)
        db.table("job_sessions").update({"fargate_task_arn": task_arn}).eq("id", session_id).execute()
        spawned.append({"job_id": job_id, "task_arn": task_arn})
        print(f"spawned {task_arn} for job {job_id}", flush=True)
    print(f"distributor: {len(pending)} pending, {len(spawned)} spawned", flush=True)
    return {"pending": len(pending), "spawned": len(spawned)}
