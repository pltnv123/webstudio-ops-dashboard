# WebStudio Reduced Motion Fallback Snippets v26

Updated: 2026-05-24T21:01:53Z

## HTML
```html
<video class="motion-hero" poster="/assets/posters/hero.jpg" playsinline muted preload="metadata" aria-label="Короткое видео о продукте">
  <source src="/assets/video/hero.mp4" type="video/mp4" />
</video>
<img class="motion-hero-fallback" src="/assets/posters/hero.jpg" alt="Статичный кадр видео" loading="eager" />
```

## CSS
```css
.motion-hero { width:100%; height:auto; display:block; object-fit:cover; }
.motion-hero-fallback { display:none; width:100%; height:auto; object-fit:cover; }
@media (prefers-reduced-motion: reduce) {
  .motion-hero { display:none; }
  .motion-hero-fallback { display:block; }
  *, *::before, *::after { animation-duration:0.001ms !important; animation-iteration-count:1 !important; transition-duration:0.001ms !important; scroll-behavior:auto !important; }
}
@media (max-width: 640px) { .motion-hero { max-height:56vh; } }
```

## JS autoplay guard
```js
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('video.motion-hero').forEach(video => {
  if (reduce) { video.removeAttribute('autoplay'); video.pause(); return; }
  video.muted = true; video.playsInline = true; video.preload = 'metadata';
});
```

## Budget
- Hero MP4 target: ≤ 2.5 MB draft/demo, ≤ 5 MB final unless owner approves.
- Mobile: poster-first, `preload=metadata`, no scroll traps.
- Reduced motion: static poster is primary experience.
