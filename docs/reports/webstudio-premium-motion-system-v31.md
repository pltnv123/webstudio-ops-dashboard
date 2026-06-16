# Premium Motion System v31

## Status
PASS_WITH_HTML_MOTION_COMPOSITION; MP4 render not executed in this pass.

## Choreography
- Page load: 180ms calm fade of canvas, 420ms hero visual reveal.
- Hero reveal: headline lines enter with opacity/translateY only.
- Text stagger: max 80ms intervals, never split letters for screen readers.
- CTA emphasis: subtle lift and light sweep on hover/focus.
- Card hover: 1–2px lift, border light, no tilt on mobile.
- Trust reveal: intersection fade/slide, one group at a time.
- Scroll transitions: gentle parallax via CSS variables only, disabled on reduced motion.

## Performance budget
- no blocking external JS in prototype
- CSS transform/opacity only for core motion
- target 60fps, no layout thrashing
- prefers-reduced-motion respected

## HyperFrames
HTML composition is production-ready input. Render requires approved HyperFrames runtime pass and ffprobe verification.
