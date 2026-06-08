# V6.6 Case study schema

```json
{
  "schema_version": "webstudio.proof_case_study.v66",
  "case_study_id": "LOCAL-DEMO",
  "status": "PROOF_REQUIRED | CLIENT_APPROVAL_REQUIRED | DEMO_PLACEHOLDER | BLOCKED_NO_PROOF | READY_FOR_CASE_STUDY | DO_NOT_FAKE",
  "outline": ["client_context", "problem", "intervention", "proof_artifacts", "outcome", "approval_record"],
  "proof_artifacts": ["public_url", "before_screenshot", "after_screenshot", "metric_source", "testimonial_approval", "logo_permission", "handoff_pack"],
  "safety": {
    "no_fake_testimonials": true,
    "no_fake_metrics": true,
    "no_fake_logos": true,
    "no_private_client_data": true
  }
}
```

All fields are static/sanitized placeholders until owner/client approval is present.
