# Example Client #003 Motion Plan

- generated_at: 2026-05-24T22:10:41Z
- status: READY

## Hero motion
8–12 sec loop: brass line reveal, chair silhouette, service cards, Telegram booking CTA. Slow, premium, no flashy template effects.

## 9:16 teaser
Scene 1: club door / headline. Scene 2: master ritual. Scene 3: booking CTA. Scene 4: Telegram intake proof.

## Poster workflow
Auto-pick frame around CTA reveal; fallback poster is static SVG/HTML frame with high contrast text.

## Reduced motion
`prefers-reduced-motion` disables parallax/reveals, keeps opacity-only micro transitions and static hero poster.

## Render command
HyperFrames safe command template: `hyperframes render webstudio-client-example-003-motion-composition.html --out /workspace/output/webstudio-client-example-003-motion-preview.mp4 --fps 30 --duration 12 --size 1080x1920`. MP4 not rendered in this Docker pass because ffmpeg/hyperframes binary is unavailable here.
