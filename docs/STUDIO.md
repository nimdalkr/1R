# 1R Studio integration

The live entry point is `index.html` → `assets/studio.js`. Legacy prototype files remain in Git history/source but are not loaded by this entry point.

## Implemented

1. **Inventory:** individually sized items, ownership, placed/unplaced state, ten-box batch entry and a seven-item workstation batch. Moving an item out of the plan does not delete it. Elevation and parent linkage are retained in JSON.
2. **Alternatives:** up to eight immutable project snapshots. Same-camera two-pane comparison, moved/resized/added/removed counts and unplaced counts. Files contain both the active project and alternatives.
3. **Locks and cameras:** fixed-structure lock, per-object locks, entry/bed/overall presets derived from existing coordinates. Switching cameras never changes the room. Lock checks also guard indirect parent moves.
4. **Viewing lines:** choose a placed chair, bed or sofa for StanbyME, inspect distance/direction and height-aware obstacle envelopes, optionally rotate the display towards that seat.
5. **3D:** dimension-bounded parametric models, orthographic and perspective views, actual door/window wall openings, WebGL depth testing and a software z-buffer fallback. Model style: material, sketch lines, white model.
6. **Workspace:** first-use screen, template preview before replacement, blank-room entry, Ctrl/Cmd+K command palette, undo/redo, contextual inspector, mobile bottom sheets, PNG and JSON export.

## Important limits

- Starter structures and furniture dimensions are examples, not measured plans or audited installation drawings. Existing projects are not transformed to match templates.
- A 3D shape is a placement model, not an exact product replica. The current room envelope is rectangular; arbitrary polygon wall drawing is not part of this release.
- Sightlines use conservative outer envelopes. Open shelves/slats, transparency, comfort, structural capacity and delivery access are not inferred. A missing obstacle finding is not an installation guarantee.
- Work is stored in the current browser only. Export JSON before moving devices or clearing browser storage. The previous project is recoverable through quick actions; it is not cloud backup.
- Production catalog remains empty until exact real product options are reviewed. No API keys, private photos or fake sale products are included. The existing server API remains available for later key registration.

## Verification commands

```
npm test
npm run catalog:check
npm run build
python tests/studio_browser.py
```

`studio_browser.py` defaults to in-memory loading of exact ES module sources with explicit storage/API test doubles; it does not alter managed Chromium network policy. For actual local HTTP E2E, start `npm start` and set `STUDIO_URL=http://127.0.0.1:4173`. `CHROMIUM_PATH` can point to an installed Chromium/Chrome executable. `ONE_R_TEST_OUTPUT` controls screenshot/report output.

The acceptance suite covers template preview cancellation, unplaced inventory retention, UUID product binding, exact-option application, alternative roundtrip, structure lock paths, camera non-mutation, comparison panes, mobile editing, software rendering and visible storage errors. Commerce fixture data is clearly test-only and never copied into the public catalog.

Local verification for this integration: **143 Node tests and 48 offline Chromium acceptance checks passed**. HTTP CI and production deployment status are separate checks; a passing Node suite alone does not certify the browser or deployment.

## Build provenance

The build writes `build-info.json` with its Git commit (when supplied by the build environment) and SHA-256 digest of the allowlisted source assets. No environment variable values other than public commit IDs enter the browser bundle.
