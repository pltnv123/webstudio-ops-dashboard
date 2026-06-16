# WebStudio V3.6 Client Request Schema

Status: READY

```json
{
  "schema_version": "webstudio.lead_capture_demo.v36",
  "request_id": "demo-lead-v36-001",
  "source": "static_browser_demo",
  "safety": {
    "demo_only": true,
    "live_submission": false,
    "real_private_data": false,
    "browser_side_supabase_secret": false,
    "external_writes": false
  },
  "lead_snapshot": {
    "business_type": "boutique wellness studio demo",
    "project_goal": "launch a premium website and intake flow demo",
    "website_or_service_needed": "D1 website + D2 AI-intake bot + D3 automation preview",
    "budget_range": "$5k-$15k demo range",
    "timeline": "2-4 weeks demo planning window",
    "current_website": "demo-current-site.example.invalid",
    "required_pages": ["Home", "Services", "About", "FAQ", "Contact"],
    "content_assets_readiness": "outline ready; real assets approval-gated",
    "preferred_contact_method_demo_placeholder": "demo-only owner review queue",
    "notes_sanitized_demo_text": "Sanitized demo note; no real client data."
  },
  "qualification_preview": {
    "score": 86,
    "routes": ["D1 website", "D2 AI-intake bot", "D3 automation"],
    "next_safe_action": "Review generated request in Order Builder; no live send."
  }
}
```

## Persistence
For V3.6 MVP the request exists only as static fixture + client-side preview. Future persistence requires approved Supabase schema/migration and backend-only service role handling.
