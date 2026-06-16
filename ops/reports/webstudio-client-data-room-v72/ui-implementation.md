# UI Implementation — V7.2

Changed source files:
- `src/app.js`: added `clientDataRoomView()`, route map entry, route health matrix entry, RU label.
- `src/index.html`: added Client Data Room nav link, hidden static markers, direct `/client-data-room/` fallback renderer.
- `scripts/build_snapshot.py`: added direct route generation for `/client-data-room/`.
- `scripts/smoke_check.py`: added V7.2 route markers and nav smoke assertions.

The route is demo/static only and uses no network write path.
