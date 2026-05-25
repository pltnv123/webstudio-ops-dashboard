# HyperFrames Render Command v34

```bash
export HOME=/workspace
export npm_config_cache=/workspace/.npm
export PUPPETEER_CACHE_DIR=/workspace/.cache/hyperframes-puppeteer
export PUPPETEER_HOME=/workspace/.cache/hyperframes-puppeteer
export LD_LIBRARY_PATH=/workspace/.toolchains/chrome-libs/root/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
export PATH=/workspace/.toolchains/node22/bin:/workspace/.toolchains/ffmpeg:/workspace/projects/webstudio-hyperframes-runtime/node_modules/.bin:/workspace/bin:$PATH
cd /workspace/projects/webstudio-hyperframes-runtime
hyperframes render compositions/client-004-premium-dental-v34 -o /workspace/output/webstudio-client-004-hero-loop-v34.mp4 --fps 30 --quality draft --workers 1 --no-browser-gpu
ffprobe -v error -show_streams /workspace/output/webstudio-client-004-hero-loop-v34.mp4
```

Publication gate: owner/client approval required.
