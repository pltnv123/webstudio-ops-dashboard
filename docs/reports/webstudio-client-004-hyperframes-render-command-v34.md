# HyperFrames Render Command v34

Status: RENDER_COMMAND_READY_NOT_CLAIMED until rendered MP4 + ffprobe proof exists.

```bash
export HOME=/workspace
export npm_config_cache=/workspace/.npm
export PUPPETEER_CACHE_DIR=/workspace/.cache/hyperframes-puppeteer
export PUPPETEER_HOME=/workspace/.cache/hyperframes-puppeteer
export LD_LIBRARY_PATH=/workspace/.toolchains/chrome-libs/root/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
export PATH=/workspace/.toolchains/node22/bin:/workspace/.toolchains/ffmpeg:/workspace/projects/webstudio-hyperframes-runtime/node_modules/.bin:/workspace/bin:$PATH
cd /workspace/projects/webstudio-hyperframes-runtime
hyperframes lint compositions/client004-v34-hero-loop
hyperframes render compositions/client004-v34-hero-loop -o /workspace/output/webstudio-client-004-hero-loop-v34.mp4 --fps 30 --quality draft --workers 1 --no-browser-gpu
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,duration,nb_frames -of default=noprint_wrappers=1 /workspace/output/webstudio-client-004-hero-loop-v34.mp4
```
