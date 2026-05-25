# HyperFrames Brief v32

Composition: `/workspace/output/webstudio-client-004-motion-composition-v32.html`.

Render command, when runtime is available:
```bash
export HOME=/workspace
export PATH=/workspace/.toolchains/node22/bin:/workspace/.toolchains/ffmpeg:/workspace/projects/webstudio-hyperframes-runtime/node_modules/.bin:/workspace/bin:$PATH
cd /workspace/projects/webstudio-hyperframes-runtime
hyperframes lint /workspace/output/webstudio-client-004-motion-composition-v32.html
hyperframes render /workspace/output/webstudio-client-004-motion-composition-v32.html -o /workspace/output/webstudio-client-004-hero-motion-v32.mp4 --fps 30 --quality draft --workers 1 --no-browser-gpu
ffprobe -v error -show_streams /workspace/output/webstudio-client-004-hero-motion-v32.mp4
```
MP4 status in this pass: not claimed until file exists and ffprobe passes.
