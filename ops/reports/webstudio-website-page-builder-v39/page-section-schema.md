# V3.9 Page Section Schema

Schema version: webstudio.website-page-builder.v39

Core fields:
- page: visible page name, e.g. Home page / Services page / FAQ page.
- slug: static page slug.
- status: READY_DEMO or REVIEW_ONLY.
- sections[]:
  - block: section type.
  - headline: generated safe marketing headline.
  - subheadline: safe generic support copy.
  - cta: demo CTA label; no live submission.
  - component: recommended UI component.
- qa_checklist[]: per-page validation items.

Machine-readable snapshot is embedded in `state.json` and copied into `public/data/webstudio-control-plane-state.json` by `npm run build`.
