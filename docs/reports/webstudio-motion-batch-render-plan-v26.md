# WebStudio Motion Batch Render Plan v26

Updated: 2026-05-24T21:01:53Z

## Batch stages
1. Validate `client brief JSON` against schema.
2. Resolve selected motion style and template pack.
3. Generate composition data for each requested output.
4. Run `hyperframes lint` for all compositions.
5. Render small/safe subset first.
6. Render full batch only after subset PASS.
7. Run `ffprobe` and poster auto-pick.
8. Generate QA report and handoff packet.

## Stable render command
```bash
cd /workspace/projects/webstudio-hyperframes-runtime
export HOME=/workspace
export npm_config_cache=/workspace/.npm
export PUPPETEER_CACHE_DIR=/workspace/.cache/hyperframes-puppeteer
export PUPPETEER_HOME=/workspace/.cache/hyperframes-puppeteer
export LD_LIBRARY_PATH=/workspace/.toolchains/chrome-libs/root/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
export PATH=/workspace/.toolchains/node22/bin:/workspace/.toolchains/ffmpeg:/workspace/projects/webstudio-hyperframes-runtime/node_modules/.bin:/workspace/bin:$PATH
hyperframes render compositions/<composition> -o /workspace/output/<asset>.mp4 --fps 30 --quality draft --workers 1 --no-browser-gpu
```

## Heavy render guard
Full batch is not run unless subset is green and output durations/formats are confirmed.
