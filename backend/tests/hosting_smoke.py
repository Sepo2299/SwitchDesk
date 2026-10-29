"""Check a running hosted image, including data persistence after a restart."""
import argparse
import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--record", type=Path, required=True)
parser.add_argument("--verify", action="store_true")
args = parser.parse_args()
base = os.getenv("SMOKE_BASE_URL", "http://127.0.0.1:10000")

for attempt in range(60):
    try:
        with urllib.request.urlopen(base + "/api/health", timeout=2) as response:
            if json.load(response)["status"] == "ok":
                break
    except (urllib.error.URLError, TimeoutError):
        time.sleep(1)
else:
    raise RuntimeError("The hosted service did not become healthy")

with urllib.request.urlopen(base + "/", timeout=10) as response:
    page = response.read().decode()
assert "<title>SwitchDesk" in page
for asset in re.findall(r'<script[^>]+src="([^"]+)"', page):
    with urllib.request.urlopen(base + asset, timeout=10) as response:
        assert "Admin123!" not in response.read().decode(), "Local demo passwords must not be included in the hosted build"


def request(path, payload=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    body = json.dumps(payload).encode() if payload is not None else None
    with urllib.request.urlopen(urllib.request.Request(base + path, data=body, headers=headers), timeout=15) as response:
        return json.load(response)


session = request("/api/auth/login", {
    "email": os.environ["SMOKE_ADMIN_EMAIL"],
    "password": os.environ["SMOKE_ADMIN_PASSWORD"],
})
assert session["user"]["role"] == "admin"
token = session["access_token"]
if args.verify:
    ticket_id = json.loads(args.record.read_text())["ticket_id"]
    ticket = request(f"/api/tickets/{ticket_id}", token=token)
    assert ticket["title"] == "Hosted deployment smoke test"
    print("PASS: hosted page, private administrator, and PostgreSQL persistence after restart")
else:
    ticket = request("/api/tickets", {
        "title": "Hosted deployment smoke test",
        "description": "Confirm that a hosted request persists when the web container restarts.",
        "category": "Network",
        "priority": "Medium",
    }, token)
    args.record.write_text(json.dumps({"ticket_id": ticket["id"]}))
    print("PASS: hosted page, private administrator, and ticket creation")
