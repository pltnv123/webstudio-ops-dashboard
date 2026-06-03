# V4.0 Assembly Design

Status: LOCAL_READY

Goal: assemble V3.9 Website Page Builder generated pages/sections into a client-facing static demo website preview.

Design model:
- source: `website_page_builder_v39.generated_pages`
- output route: `/one-click-demo-assembly/`
- visual style: warm editorial client preview, not ops dashboard cards
- content policy: sanitized/static only
- CTA policy: demo-only button, no form action, no booking/contact write

Required sections:
- full assembled landing page preview
- hero section
- problem/solution
- services/packages
- process section
- proof/trust section
- FAQ
- CTA
- visible “demo only / no live booking” safety note

Internal links:
- `/website-page-builder/`
- `/order-package-generator/`
- `/generated-demo-site-v35/`
