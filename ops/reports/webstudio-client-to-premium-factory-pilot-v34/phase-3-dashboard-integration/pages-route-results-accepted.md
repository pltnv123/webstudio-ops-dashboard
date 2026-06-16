# Pages Verification Accepted

Status: PASS_WITH_STATIC_DATA_PROOF

Evidence:
- `/premium-factory-v34/`: HTTP 200.
- `/data/webstudio-control-plane-state.json`: HTTP 200 and contains `Northstar Executive Wellness Studio`, `webstudio-v34-demo-client-order`, `PACKAGE_READY`, `client_order_pilot`.
- `/premium-factory-v34/data/webstudio-control-plane-state.json`: same markers present.
- `/order-builder/`: HTTP 200 and contains Order Builder/public demo markers.

Note: the page body is client-rendered, so source HTML does not contain the visible card title `V3.4 Client Order`. The deployed state JSON and app bundle contain the route data and renderer symbols.
