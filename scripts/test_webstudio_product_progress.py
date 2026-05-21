#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "webstudio_product_progress.py"
OUTPUT = Path("/workspace/output")


def test_product_progress_generator_creates_d1_d2_d3_artifacts():
    result = subprocess.run(["python3", str(SCRIPT), "--json"], text=True, capture_output=True, check=True)
    payload = json.loads(result.stdout)
    assert payload["mode"] == "safe_local_artifacts_only"
    lines = {item["product_line"]: item for item in payload["items"]}
    assert set(lines) == {"D1", "D2", "D3"}
    assert lines["D1"]["artifact_type"] == "conversion_qa_pack"
    assert lines["D2"]["artifact_type"] == "offline_scenario_qa"
    assert lines["D3"]["artifact_type"] == "dry_run_exception_matrix"
    for item in payload["items"]:
        p = Path(item["path"])
        assert p.exists()
        text = p.read_text()
        assert "Kanban handoff" in text
        assert item["sha256"]
        assert not any(secret in text.lower() for secret in ["api_key=", "token=", "password="])
    assert (OUTPUT / "webstudio-product-progress-v1.json").exists()
