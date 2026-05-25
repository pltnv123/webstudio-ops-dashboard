# Background Video Policy v34

- Use MP4/WebM, not GIF.
- Muted, playsinline, poster, dimensions/aspect-ratio set.
- Lazy-load below fold; poster/preload image above fold.
- No autoplay when prefers-reduced-motion is reduce.
- Pause/stop/hide control if motion lasts >5s near other content.
- Healthcare default: static poster unless motion improves trust.
