# V6.6 Proof system design

- component: `webstudio-proof-case-study-system`
- version: `v6.6`
- route: `/proof-case-study/`
- marker: `proof-case-study-v66`
- mode: static/sanitized only

## Purpose

Create an approval-first proof/case-study system that turns real delivery artifacts into case studies only when proof is verified. The UI intentionally blocks fake proof, fake testimonials, fake metrics, fake logos, fabricated credentials, and regulated overclaims.

## UI sections

- case study outline
- allowed proof checklist
- missing proof checklist
- before/after placeholder policy
- metrics policy
- testimonial approval policy
- proof artifact checklist
- no fake proof warning
- approval gates
- linked safe routes

## Safety

No private client data, no live writes, no browser-side secrets.
