# v34 Screenshot Job Follow-up

Generated: 2026-05-26T07:34:22Z

Requested job id: `72cafc3a-d682-467c-ac6d-96f268c88799`

## Status

**Status:** NOT_FOUND_IN_VISIBLE_SCREENSHOT_STATUS

`webstudio_status` returned host-bridge projects `deploy`, `deployments`, and `screenshots`, each with `screenshots: 0`. The exact job id was not found in Docker-visible `/workspace` or `/output` search.

## Safe rerun / evidence captured

Because the queued job result was not visible, browser QA captured fresh evidence via the production-deployed file URL:

- 1920 screenshot: `/home/hermes/.hermes/cache/screenshots/browser_screenshot_833779914fcf45c8bece1f8534e3f7fb.png`
- 1440 screenshot: `/home/hermes/.hermes/cache/screenshots/browser_screenshot_1d975408f53e44eb8b8ed80781105add.png`
- 1366 screenshot: `/home/hermes/.hermes/cache/screenshots/browser_screenshot_18b41c5a2bb94977866615c32826e586.png`
- 390 screenshot: `/home/hermes/.hermes/cache/screenshots/browser_screenshot_ab65120128c54aec863ed532114b5646.png`

## Result

Fresh browser screenshots exist, but they show the production asset-loading blocker.
