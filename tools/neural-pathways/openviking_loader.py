#!/usr/bin/env python3
"""
Phase 3: OpenViking Bulk Loader
Reads T2_SYNTHESIZED/*.md files and bulk-ingests into OpenViking.
"""

import os
import time
import httpx
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

OPENVIKING_URL = "http://localhost:1933"
API_KEY = os.environ.get("OPENVIKING_API_KEY", "hive-mind-key")
SOURCE_BASE = "/home/leviathan/OPENCODE_WORKSPACE/knowledge-base/AGI_Neural_Pathways/T2_SYNTHESIZED"
TARGET_BASE = "viking://resources/hive-mind/shared/knowledge"
MAX_WORKERS = 1
DELAY_BETWEEN_BATCHES = 0.5


def upload_temp(client: httpx.Client, filepath: Path) -> str:
    """Upload file to temp storage, return temp_file_id."""
    with open(filepath, "rb") as f:
        files = {"file": (filepath.name, f, "text/markdown")}
        r = client.post(
            f"{OPENVIKING_URL}/api/v1/resources/temp_upload",
            headers={
                "X-API-Key": API_KEY,
                "X-OpenViking-Account": "default",
                "X-OpenViking-User": "hive-mind",
            },
            files=files,
            timeout=60.0,
        )
    if r.status_code != 200:
        raise RuntimeError(f"Temp upload failed {r.status_code}: {r.text}")
    return r.json()["result"]["temp_file_id"]


def add_resource(client: httpx.Client, temp_file_id: str, target_uri: str) -> bool:
    """Add resource from temp file to OpenViking."""
    r = client.post(
        f"{OPENVIKING_URL}/api/v1/resources",
        headers={
            "X-API-Key": API_KEY,
            "X-OpenViking-Account": "default",
            "X-OpenViking-User": "hive-mind",
            "Content-Type": "application/json",
        },
        json={
            "temp_file_id": temp_file_id,
            "to": target_uri,
            "reason": "Phase 3 Hive Mind OS T2 synthesis",
        },
        timeout=60.0,
    )
    if r.status_code != 200:
        raise RuntimeError(f"Add resource failed {r.status_code}: {r.text}")
    return r.json()["result"]["status"] == "success"


def ingest_file(client: httpx.Client, filepath: Path, category: str) -> dict:
    """Ingest a single file: upload temp → add resource."""
    filename = filepath.name
    target_uri = f"{TARGET_BASE}/{category}/{filename}"

    try:
        temp_id = upload_temp(client, filepath)
        success = add_resource(client, temp_id, target_uri)
        return {"status": "success", "file": filename, "uri": target_uri}
    except Exception as e:
        return {"status": "failed", "file": filename, "error": str(e)}


def main():
    """Main loader function."""
    source_path = Path(SOURCE_BASE)
    if not source_path.exists():
        print(f"ERROR: Source directory not found: {SOURCE_BASE}")
        return

    md_files = list(source_path.rglob("*.md"))
    if not md_files:
        print(f"WARNING: No .md files found in {SOURCE_BASE}")
        return

    by_category = {}
    for f in md_files:
        cat = f.parent.name
        by_category.setdefault(cat, []).append(f)

    print(f"OPENVIKING LOADER — Phase 3")
    print(f"Source: {SOURCE_BASE}")
    print(f"Target: {TARGET_BASE}")
    print(f"Total files: {len(md_files)}")
    for cat, files in sorted(by_category.items()):
        print(f"  {cat}: {len(files)} files")
    print()

    total_success = 0
    total_failed = 0

    with httpx.Client(timeout=httpx.Timeout(120.0)) as client:
        for category, files in sorted(by_category.items()):
            print(f"[{category}] Ingesting {len(files)} files...")

            with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
                futures = {
                    pool.submit(ingest_file, client, f, category): f for f in files
                }
                for i, future in enumerate(as_completed(futures), 1):
                    result = future.result()
                    if result["status"] == "success":
                        total_success += 1
                        print(f"  ✓ {result['file']}")
                    else:
                        total_failed += 1
                        print(f"  ✗ {result['file']}: {result['error']}")

            time.sleep(DELAY_BETWEEN_BATCHES)

    print()
    print(f"DONE — Success: {total_success} | Failed: {total_failed}")


if __name__ == "__main__":
    main()
