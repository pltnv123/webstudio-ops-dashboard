#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "webstudio_product_progress.py"
OUTPUT = Path("/workspace/output")


def test_product_progress_generator_preserves_v12_showcase_and_simulation():
    result = subprocess.run(["python3", str(SCRIPT), "--json"], text=True, capture_output=True, check=True)
    payload = json.loads(result.stdout)
    assert payload["mode"] == "safe_local_artifacts_only"
    assert payload["schema_version"] == "webstudio.product-progress.v12"
    assert payload["phase"] == "v12"
    lines = {item["product_line"]: item for item in payload["items"]}
    assert set(lines) == {"D1", "D2", "D3"}
    assert lines["D1"]["artifact_type"] == "client_showcase_landing_sites"
    assert lines["D2"]["artifact_type"] == "client_showcase_ai_intake_bot"
    assert lines["D3"]["artifact_type"] == "client_showcase_business_automation"
    for item in payload["items"]:
        for key in ["path", "qa_path", "handoff_path"]:
            if item.get(key):
                assert Path(item[key]).exists(), f"missing {key}: {item[key]}"
        assert item["readiness_score"] >= 94
        assert item["next_action"]
        assert not any(secret in json.dumps(item).lower() for secret in ["api_key=", "token=", "password="])
    sim = payload["client_simulation"]
    assert sim["id"] == "client-sim-001"
    for key in ["brief_path", "d1_path", "d2_path", "d3_path", "delivery_pack_path"]:
        assert Path(sim[key]).exists(), f"missing simulation artifact: {sim[key]}"
    assert (OUTPUT / "webstudio-product-progress-v1.json").exists()
