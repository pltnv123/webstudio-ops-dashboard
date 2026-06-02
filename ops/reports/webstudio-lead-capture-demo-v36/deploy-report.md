# WebStudio V3.6 Deploy Report

Status: PASS

## GitHub Actions
Latest run for branch/commit:
```json
{"id": 26813989585, "name": "Deploy staging to GitHub Pages", "head_branch": "webstudio/product-build-v31", "head_sha": "5230adcbe4a84afe25572d56610e0fdff172b7a4", "status": "completed", "conclusion": "success", "html_url": "https://github.com/pltnv123/webstudio-ops-dashboard/actions/runs/26813989585", "created_at": "2026-06-02T10:30:13Z", "updated_at": "2026-06-02T10:30:39Z"}
```

## Public route
- URL: https://pltnv123.github.io/webstudio-ops-dashboard/lead-capture-demo/
- Cache-busted smoke: https://pltnv123.github.io/webstudio-ops-dashboard/lead-capture-demo/?v=5230adcbe4a8
- HTTP 200: PASS
- Required markers: PASS

## Route smoke
```json
{
  "attempt": 2,
  "url": "https://pltnv123.github.io/webstudio-ops-dashboard/lead-capture-demo/?v=5230adcbe4a8",
  "http_status": 200,
  "markers": {
    "lead-capture-demo-v36": true,
    "Demo only": true,
    "D1 website": true,
    "D2 AI-intake bot": true,
    "D3 automation": true
  },
  "sha256": "38991f6dadbb08b3eb08036abb3d0c40c214fcdd8bd3958ca761a7adc3107505",
  "checked_at": "2026-06-02T10:30:43.140361Z",
  "bytes": 131681,
  "status": "PASS"
}
```
