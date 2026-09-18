# 1R Studio v1.4 acceptance record

## Tested source

All six Studio feature groups are integrated in the root application: inventory/unplaced belongings, eight layout alternatives and shared-camera comparison, structure locks and entry/bed cameras, height-aware StanbyME viewing lines, parametric 3D geometry, and start/command UI.

The application source in integration commit `382e50b7e26d33b8e4c7e135a51cb6a4b4dc87dc` passed the following GitHub-hosted run:

- Run: https://github.com/nimdalkr/1R/actions/runs/35362439909
- Node tests: 143 passed. HTTP transport test always creates a fresh build before testing public assets and private-file protection.
- Browser acceptance: 48 passed; zero uncaught JavaScript errors.
- Browser mode: real HTTP at `127.0.0.1:4173`, Chromium/Playwright 1.57.0.
- Desktop and mobile viewport checks, WebGL path through Chromium SwiftShader, and explicit JavaScript software-renderer fallback.
- API-independent editor startup, ten-box inventory, ownership/UUID handling, geometry locks, camera non-mutation, JSON/PNG export, layout comparisons, command palette, empty catalog and verified test-fixture product replacement.
- Production catalog remains empty. Controlled product fixtures were supplied only to a separate test context. No real Coupang purchase or real-account API request was made.

`studio-http-qa` contains the 48-result JSON report, screenshots and tested commit ID. The transferred application source was independently compared byte-for-byte to the local reviewed source (20/20 transferred files; updated HTTP transport test also matched).

## Visual review

Reviewed rendered desktop 3D, mobile 3D and A/B comparison screenshots. Furniture forms, wall openings, canvas controls and inventory counts are visible; mobile controls stay in the viewport. These are generic dimensional models, not real product models or a measured reconstruction of a particular user's room.

## Limits

- Native GPU/drivers, Safari/iOS and Firefox have not been manually tested.
- Automatic room measurement, arbitrary wall-outline editing, realistic materials and vendor-specific 3D models are not claimed.
- Viewing-line calculations use conservative outer envelopes, not transparent material or shelf/slat gaps, and do not certify comfort or installation safety.
- Live Coupang authentication remains pending operator keys and actual product review.
- Deployment success must be confirmed separately using the deployed `/build-info.json` and its exact commit/source digest.

Permanent `Studio browser checks` runs on main pushes and pull requests with read-only repository permissions. Temporary integration transfer workflows were removed after acceptance; production builds contain no private references, transfer payload, test fixture or credentials.
