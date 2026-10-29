"""Serve the built website and its API together for cross-device demos."""
import argparse
import os
from pathlib import Path

BACKEND = Path(__file__).absolute().parent
FRONTEND = BACKEND.parent / "frontend" / "dist"
os.chdir(BACKEND)

from fastapi.staticfiles import StaticFiles
import uvicorn
from app.main import app


def run():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=5174)
    options = parser.parse_args()
    if not (FRONTEND / "index.html").is_file():
        parser.error("Build the frontend first: cd frontend, then npm.cmd run build")
    # Register static content after API routes so /api keeps its normal behavior.
    app.mount("/", StaticFiles(directory=FRONTEND, html=True), name="website")
    print(f"SwitchDesk sharing server: http://localhost:{options.port}", flush=True)
    uvicorn.run(app, host=options.host, port=options.port)


if __name__ == "__main__":
    run()
