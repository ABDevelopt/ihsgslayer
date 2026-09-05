"""
GitHub Webhook & Automated Server Deployment Router.
Receives push events from GitHub and triggers deploy.sh in the background.
"""

import os
import subprocess
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Header, Request, BackgroundTasks
from pydantic import BaseModel

router = APIRouter(prefix="/webhook", tags=["Auto Deploy & Webhooks"])

DEPLOY_SECRET = os.environ.get("DEPLOY_SECRET_KEY", "ihsgslayer_deploy_secret_2026")
DEPLOY_LOG_FILE = "/home/ubuntu/ihsgslayer/deploy.log"
LOCAL_DEPLOY_LOG = os.path.join(os.path.dirname(__file__), "..", "..", "..", "deploy.log")


def _run_deploy_task():
    """Execute deploy.sh in the background."""
    script_path = "/var/www/ihsgslayer/deploy.sh" if os.path.exists("/var/www/ihsgslayer/deploy.sh") else "/home/ubuntu/ihsgslayer/deploy.sh"
    app_cwd = os.path.dirname(script_path)
    log_file = os.path.join(app_cwd, "deploy.log") if os.path.exists(app_cwd) else LOCAL_DEPLOY_LOG

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(log_file, "a", encoding="utf-8") as lf:
        lf.write(f"\n\n=== Triggered Deployment at {timestamp} ===\n")
        lf.flush()

        if os.path.exists(script_path):
            subprocess.Popen(
                ["bash", script_path],
                stdout=lf,
                stderr=subprocess.STDOUT,
                cwd=app_cwd
            )
        else:
            lf.write(f"Notice: Linux deploy script '{script_path}' not found (running on non-server environment).\n")


@router.post("/github-deploy")
async def trigger_github_deploy(
    background_tasks: BackgroundTasks,
    request: Request,
    secret: Optional[str] = Query(None),
    x_deploy_secret: Optional[str] = Header(None, alias="X-Deploy-Secret"),
):
    """
    Endpoint triggered by GitHub Webhook or GitHub Actions on push to main.
    """
    token = secret or x_deploy_secret
    if token != DEPLOY_SECRET:
        raise HTTPException(status_code=403, detail="Invalid deploy secret token.")

    body = {}
    try:
        body = await request.json()
    except Exception:
        pass

    ref = body.get("ref", "")
    commit_msg = body.get("commit_msg") or body.get("head_commit", {}).get("message", "Triggered from GitHub")

    background_tasks.add_task(_run_deploy_task)

    return {
        "status": "success",
        "message": "Deployment initiated successfully in background.",
        "ref": ref,
        "commit": commit_msg,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S WIB")
    }


@router.get("/deploy-logs")
async def get_deploy_logs(lines: int = Query(60, description="Number of log lines to read")):
    """
    Read the latest deploy log lines.
    """
    target = DEPLOY_LOG_FILE if os.path.exists(DEPLOY_LOG_FILE) else LOCAL_DEPLOY_LOG
    if not os.path.exists(target):
        return {"status": "no_logs", "logs": "Belum ada log deployment di server."}

    try:
        with open(target, "r", encoding="utf-8", errors="replace") as f:
            all_lines = f.readlines()
            recent = all_lines[-lines:] if len(all_lines) > lines else all_lines
            return {
                "status": "success",
                "total_lines": len(all_lines),
                "logs": "".join(recent)
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}
