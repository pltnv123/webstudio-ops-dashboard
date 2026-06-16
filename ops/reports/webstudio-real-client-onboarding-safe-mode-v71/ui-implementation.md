# UI Implementation v7.1

Changed source files:

- `src/app.js`
  - Added `realClientOnboardingView()` route.
  - Added direct route handling for `/real-client-onboarding/`.
  - Added route-health matrix entry and safety marker.
  - Added safe aliases for linked workflow routes.
- `src/index.html`
  - Added nav link and hidden static smoke markers.
- `scripts/build_snapshot.py`
  - Added direct static path generation.
- `scripts/smoke_check.py`
  - Added route and marker assertions.

No live forms, API calls, external writes, or secrets were added.
