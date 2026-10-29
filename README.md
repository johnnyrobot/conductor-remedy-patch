# conductor-remedy-patch

The **Conductor side** of the LibreTexts Remedy accessibility matrix, shipped as
target-specific twenty-four-patch `git am` series against upstream Conductor, with
the original sixteen-patch delivery retained for history.

This repository contains no Conductor source of its own. It is a delivery
vehicle: you clone the real Conductor, apply these commits, and you have the
Project Accessibility WCAG matrix, the remediation work queue and the WCAG
verification panel wired to a Remedy server.

---

## Apply a validated target series

The recommended integration base is now upstream **staging pinned to
`67301b35c3784ed73ba1a65011ef5a1d689abca1`**. The secondary released floor is
**v2.156.2 at `352a657ec6de7b317a70ad3f8f744bc6d5054d9d`**. These are delivery
targets selected by the Chief, not observations of the running production version.

| Target | Manifest | Resulting source tree |
|---|---|---|
| Primary staging | [staging manifest](series/staging-67301b35/manifest.json) | `03589d94ffba9b3ee79a97dcb71100ed7e0f92c3` |
| Released floor | [release manifest](series/release-2.156.2/manifest.json) | `90ef990f17c53d45c3d25404b19f1a55ea1c20f8` |

Each manifest lists its own twenty-four ordered patches and SHA-256 checksums. Use
Node 22 and a fresh **detached** clone; the command refuses a wrong base, dirty
checkout, active branch, changed patch or escaping path before application.

```bash
conductor_delivery=/absolute/path/to/conductor-remedy-patch
conductor_checkout=/tmp/conductor-remedy-staging

git clone https://github.com/LibreTexts/conductor.git "$conductor_checkout"
git -C "$conductor_checkout" checkout --detach 67301b35c3784ed73ba1a65011ef5a1d689abca1
node "$conductor_delivery/tools/apply-series.mjs" \
  "$conductor_delivery/series/staging-67301b35/manifest.json" "$conductor_checkout"
```

For the released floor, select commit `352a657ec6de7b317a70ad3f8f744bc6d5054d9d`
and `series/release-2.156.2/manifest.json` in a separate fresh clone. `--check`
performs the manifest/checkout preflight without applying patches. A successful
application verifies the final tree; it is not a production deployment approval.
Applied commit IDs may vary with committer metadata; the expected source tree is
fixed. No automatic fetch, reset, abort, cleanup or push occurs.

[Compatibility evidence, config policy and Mongo operations](docs/integration/pinned-targets.md)
explain the preserved upstream scripts, target-specific test corrections and open
release gates. **Production readiness is false** in both manifests. Patch0019 implements default-disabled, server-enforced tenant opt-in and explicit
engine configuration. Patch0020 supplies signed operations and read-only status lookup; production
release still requires the remaining operational/deployment gates. Never deploy an image selected by `latest`.

[LT-158 Linux candidate validation](docs/releases/lt158-linux-candidate.md) documents
the automated matrix and candidate artifact contract. Patch0024 pins the actual
upstream Node22 Docker stages to one immutable base. Linux execution is pending
until that report records successful CI; deployment approval remains separate.

[LT-127 explicit recovery evidence](docs/releases/lt127-explicit-recovery.md) records
patch0023 and actual offline Bridge resolution followed by fresh local scan/CAS.
Only support/superadmin plus project policy may invoke it; status lookup never
unlocks. Known remote success after a lost local reply remains a contract gate.

[LT-156 indexed projection evidence](docs/releases/lt156-indexed-projection.md) records
patch0021, unchanged ordered selection and same-host sizing. Patch0022 adds bounded detail/history reads and immutable write-ahead operation
records; [LT-157 evidence and storage handoff](docs/releases/lt157-bounded-history.md)
describe explicit limits, complete exports and downgrade constraints.

[LT-140 signed-operation and integration evidence](docs/releases/lt140-reviewed-operations.md)
records patch0020, actual three-service HTTP validation and remaining gates.

[LT-131 config and validation evidence](docs/releases/lt131-tenant-opt-in.md) records
the server-owned opt-in/config/readiness policy in patch0019.

[LT-126 regression evidence](docs/releases/lt126-evidence-import.md) records the
atomic TOC guard and failed standalone-scan observer correction in patch 0018.

The original sixteen patches in [`patches/`](patches/) and their old
`1c1a5ec1` base remain intact for historical reproduction of PR #3. That base is
retired as the recommendation for new integration. Do not apply the historical
root glob to either new target. The old first-wave report is historical evidence,
not the current target procedure.

---

## Features preserved from the original sixteen commits

Three layers. Each layer is usable without the ones after it.

**Matrix (0001–0003)** — the original delivery.

| # | Commit | What it does |
|---|---|---|
| 1 | `feat(a11y): carry CXone pageID on review sections, extract TOC build/merge` | Adds `pageID` to review sections so a section can be traced back to a real CXone page, and pulls TOC build/merge out into reusable functions. |
| 2 | `feat(a11y): add Remedy scan/preview/apply endpoints and bulk section updates` | The server half. Four new routes plus bulk section item updates. |
| 3 | `feat(a11y): add WCAG matrix, scoring, and Remedy review UI to Project Accessibility` | The client half. The matrix itself, the scoring module, and the preview/apply workflow. |

**Work queue (0004–0007)** — scan findings become persistent work items.

| # | Commit | What it does |
|---|---|---|
| 4 | `feat: connect remediation tasks to reviewed fixes and recovery` | `RemediationWorkItem` model, `GET/POST/PATCH …/accessibility/workqueue`, per-page actions (`scan`, `rendered-scan`, `apply`, `restore`) proxied to the bridge, and the queue + page-action UI under the matrix. |
| 5 | `docs: document remediation release integration and validation limits` | `docs/remediation-integration.md`. |
| 6 | `Refresh remediation matrix and support reviewed complex-image descriptions` | Matrix refreshes only after the scan persisted; evidence attaches to the selected task; reviewed long descriptions for complex images. |
| 7 | `Document book remediation acceptance and static scanner limitations` | Docs: what a static scan cannot see. |

**WCAG verification (0008–0010)** — human evidence, separate from the automated score.

| # | Commit | What it does |
|---|---|---|
| 8 | `feat: require reviewer evidence for WCAG conformance` | `ConformanceRecord` (append-only), the 50-criterion checklist (`conformanceCriteria.json`), `GET …/workqueue/conformance`, `POST …/conformance/{scope,review,signoff}`, and the `ConformanceReview` panel. Reviewer identity and time are set server-side. |
| 9 | `fix: invalidate failed scans and serve authenticated report downloads` | A failed scan cannot count as evidence; `GET …/conformance/report` is authenticated. |
| 10 | `feat: separate remediation handoff acceptance from WCAG verification` | "Delivery accepted" is a distinct state from "criterion verified"; one cannot imply the other. |

**Deployment fixes (0011–0012)**

| # | Commit | What it does |
|---|---|---|
| 11 | `fix: honor configured Conductor browser origins` | CORS seeds its allow-list from `PRODUCTIONURLS` even when `NODE_ENV` is unset. Without this, browser-driven scans from a deployed Commons origin are rejected. |
| 12 | `test(a11y): run RemediationPageActions under vitest` | The React test used `node:test`, which vitest cannot bundle; `npm test` in `client/` now passes. |

**Apply-path safeguards (0013–0014)**

| # | Commit | What it does |
|---|---|---|
| 13 | `fix(a11y): require a reviewed preview before apply and report empty writes` | The matrix Fix modal now requires the same "I reviewed this preview" acknowledgement the work queue already had, and the work queue reports "No changes were written" when the bridge's `applied` flag is false instead of claiming success. |
| 14 | `feat(a11y): name the Conductor reviewer in bridge write requests` | Page actions forward `requested_by` (the authenticated Conductor uuid) so the bridge audit log names the reviewer, not just the server account. Needs the matching bridge change (`requested_by` support); harmless without it. |

**Release evidence lifecycle (0015–0016)**

| # | Commit | What it does |
|---|---|---|
| 15 | `fix(a11y): bind page actions and reviews to current evidence` | Matrix and queue share stored-section targeting and session-derived attribution. Auditor/foreign mutations are denied; evidence is invalidated before possible writes, and delayed pre-write scans cannot restore it. Known no-op and uncertain outcomes stay distinct. Reviewer checklists reset when evidence or scope changes. |
| 16 | `fix(a11y): keep pending writes and reviewer refresh fail closed` | Persist a write-pending claim to block overlapping actions and certification of interrupted/uncertain writes; refresh the mounted reviewer form even after a failed rescan. |

Patches 0015–0016 retain the existing Johnny sandbox restriction. Matrix scan/preview/apply
callers must now send `sectionID`; browser URLs and page IDs are ignored.
See [first-wave validation and remaining release gates](docs/releases/lt115-first-wave.md).
This is a release fix, not a declaration that the whole stack is ready to deploy.

Install the complete selected manifest. The layer list describes historical
provenance, not supported partial installations.

### Original fourteen-patch footprint

```
client/src/components/projects/ProjectAccessibility.jsx    +1417   the matrix UI
client/src/components/projects/RemediationWorkQueue.tsx     +87   work queue panel (new)
client/src/components/projects/RemediationPageActions.tsx  +114   per-page scan/apply/restore (new)
client/src/components/projects/ConformanceReview.tsx        +90   WCAG verification panel (new)
client/src/components/projects/accessibilityScore.ts       +155   scoring (new)
client/src/components/projects/Projects.css                +382   matrix styles
client/src/types/a11y.ts                                    +82   review shape (new)
client/src/remediation-queue-entry.tsx                      +26   queue mount point (new)
client/src/components/projects/*.test.ts                   +215   tests
server/api/projects.js                                     +426   scan/preview/apply
server/api/remediationqueue.ts                              +83   work-item routes (new)
server/api/remediationactions.ts                            +76   page actions → bridge (new)
server/api/conformance.ts                                   +53   verification routes (new)
server/util/a11yreviewutils.ts                             +105   schema + TOC merge
server/util/remediationqueue.ts                             +42   RemediationWorkItem model (new)
server/util/conformance.ts                                  +60   ConformanceRecord model (new)
server/util/conformanceCriteria.json                       +452   WCAG 2.1 A/AA checklist (new)
server/util/remediationHandoff.ts                           +40   handoff acceptance rules (new)
server/util/*.test.ts                                      +424   tests
server/api.js                                               +55   route registration + CORS
server/models/project.ts                                     +5   stored remedy fields
server/package.json                                          +1   server `npm test`
docs/remediation-integration.md                             +77   (new)
docs/accessibility-verification.md                          +19   (new)
```

Roughly 4,400 lines across 31 files. No dependencies are added — the Remedy
client is plain `fetch` against the server's HTTP API.

---

## Integration surface

### Routes added

All under the existing authenticated project API:

| Method | Path | Purpose |
|---|---|---|
| GET | `/project/accessibility/remedy/health?projectID=<projectID>` | Authenticated project readiness and effective scan/preview/mutate/status capability. |
| POST | `/project/accessibility/remedy/scan` | Scan a section's CXone page, store findings + WCAG summary. |
| POST | `/project/accessibility/remedy/preview` | Ask Remedy for a proposed fix. Returns an HTML diff and a `previewToken`. |
| POST | `/project/accessibility/remedy/apply` | Apply a previously previewed fix. Requires the `previewToken`. |
| PUT | `/project/accessibility/review/section/items` | Bulk-update checkbox matrix items for a section. |
| GET / POST | `/project/:projectID/accessibility/workqueue` | List / create work items (page, criterion, finding evidence, owner, status). |
| PATCH | `/project/:projectID/accessibility/workqueue/:itemID` | Change status, owner, note; history is appended, not rewritten. |
| GET | `/project/:projectID/accessibility/workqueue/page/:sectionID/operations/:localID` | Authorized read-only lookup through the stored operation mapping; never unlocks or retries. |
| POST | `/project/:projectID/accessibility/workqueue/page/:sectionID/:action` | `scan`, `rendered-scan`, `apply`, `restore` — proxied to the Remedy bridge; evidence attaches to an `itemID` if given. |
| GET | `/project/:projectID/accessibility/workqueue/conformance` | The scoped WCAG verification report. |
| GET | `/project/:projectID/accessibility/workqueue/conformance/report` | Authenticated export of that report. |
| POST | `/project/:projectID/accessibility/workqueue/conformance/:action` | `scope`, `review`, `signoff`. Reviewer identity and timestamp are server-set; records are append-only. |

Matrix, work-queue and conformance mutations require project edit permission.
Work-queue and conformance GET requests provide read access to authorized project
users. Operation lookup additionally requires current edit permission and the
original actor or existing support/superadmin policy. Nothing in them writes to CXone directly — every write goes through the
bridge, which enforces its own sandbox guard.

**A write must be bound to a stored reviewed preview.** Preview/revision responses
provide an opaque `localReviewID`, authoritative binding and integer expiry.
Confirmation sends that ID, unchanged token/hash and `confirmed=true`. The server
checks current permission, user/session, stored target, inputs and expiry, then
persists issuer/jti intent atomically before dispatching a native Node22 Ed25519
assertion. Browser subject/binding/nonce claims never override stored values.
A proven changed source/TOC target invalidates old evidence. Matched no-ops preserve
current evidence without rescanning; actual/unknown writes invalidate it. A status
lookup is read-only and cannot clear a pending claim or repeat a write.

### Production configuration policy

Remedy must be explicitly enabled for the intended deployment/tenant, default
disabled, with an explicit engine base and API key in production. LT-131 tracks
the server enforcement and useful unavailable/preflight responses. Patch0019 enforces that policy on both backend action paths and uses authenticated
project capability to gate the UI; the broader stack is **not approved for production**. `CLIENT__REMEDY_ENABLED` alone cannot enforce this policy.

Required settings are `REMEDY_ENABLED=true`, `REMEDY_ORG_ID` equal to this
process's `ORG_ID` and stored `Project.orgID`, `REMEDY_API_BASE_URL` (explicit origin)
and `REMEDY_API_KEY`. Legacy `PROJECT_REMEDY_*` aliases no longer enable Remedy. Do not infer that a missing key or a localhost
fallback is acceptable in production. Do not expose a Bridge staff panel. See the
[configuration and storage requirements](docs/integration/pinned-targets.md).

Reviewed writes additionally require these signer settings (LT-148):

| Setting | Prerequisite |
|---|---|
| `REMEDY_REVIEWER_SIGNING_KEY_FILE` | Protected Ed25519 private-key file path; never browser configuration. |
| `REMEDY_REVIEWER_KEY_ID` | Enabled key ID present in the coordinated Bridge keyring. |
| `REMEDY_REVIEWER_ISSUER` | Reviewed Conductor issuer matching Bridge trust policy. |
| `REMEDY_REVIEWER_AUDIENCE` | Reviewed audience matching Bridge policy. |
| `REMEDY_REVIEWER_KEY_ENABLED` | Explicitly `true`. |
| `REMEDY_REVIEWER_KEY_NOT_BEFORE` | Coordinated validity-window start, in epoch seconds. |
| `REMEDY_REVIEWER_KEY_NOT_AFTER` | Coordinated validity-window end, in epoch seconds. |

Missing, disabled or expired signing material leaves reviewed external writes unavailable while
healthy authenticated read-only operation lookup remains usable; lookup never
releases a pending claim. After applying the series, see the full
`docs/remediation-integration.md` and `docs/remedy-storage-and-reads.md` guides.
Keyring/trust-epoch coordination and real key rollout remain part of the reviewed
deployment bundle; no real values or key material are supplied here.

The approved full-stack deployment bundle must supply immutable image digests,
network/auth/origin settings, backup/upgrade and rollback details; this repository
does not yet provide that completed bundle.

---

## The rest of the stack

Conductor is one client of a four-part system. The other three are separate
repositories:

| Repository | Role |
|---|---|
| `libretexts-remedy-server` | The engine. All checking and remediation behind `/v1/*`. Everything else is a client of it. |
| `libretexts-remedy-bridge` | CXone Expert page I/O — reads page HTML, writes approved revisions through guarded APIs. |
| `adapt-a11y-scanner` | Renders ADAPT questions in headless Chromium (MathJax-aware) and posts the real DOM to the server. |

**Read `deploy/stack/README.md` in `libretexts-remedy-server` before deploying.**
It has the only compose file that runs all three together, and the failure modes
that are not obvious from the individual READMEs. The Conductor matrix uses the engine and Bridge; ADAPT scanner covers ADAPT
question flows. Full release validation still covers the coordinated stack.

---

## Validation

| Target | Server unit | Client unit | Authenticated route/Mongo | Builds |
|---|---:|---:|---:|---|
| Staging pinned `67301b35` | 62 pass | 293 pass | 66 pass | Client/server pass |
| Released floor `352a657e` | 32 pass | 200 pass | 66 pass | Client/server pass |

The current table records LT-127 checks; LT-140 historical checks used Node 22.20.0 / npm 10.9.3 with the matching target's
previously installed, unchanged lockfile dependencies. Both built servers reached
real `/health` 200 under production mode with synthetic configuration and isolated
MongoDB **7.0.14**. These were macOS process boots. The earlier compatibility
checks used MongoDB 8.0.5; their standalone server typecheck retained 60 baseline
diagnostic lines on each target. LT-140 reran them: all60 diagnostics match the control after source-position
and equivalent scratch/dependency-root normalization; full server typecheck still fails. Linux/container, real providers,
production auth/topology and deployment remain unverified.

```bash
# In this delivery repo, Node 22; no npm dependency installation is needed:
node --test tools/apply-series.test.mjs

# In the freshly patched Conductor checkout:
cd server
npm ci --no-audit --no-fund
npm test
npm run build
cd ../client
npm ci --no-audit --no-fund
npm test
npm run build
```

The route integration suite requires an isolated loopback database named with
`conductor_test_`; it drops that test database on teardown. See the guide before
running it. The default unit runners do not run the independent Playwright visual
journey. All upstream dev/test/visual commands and dependencies are retained.

---

## Historical provenance

The branch these came from lives in a private development fork alongside
unrelated deployment work. Exporting the three commits keeps the delivery to
exactly the accessibility matrix and nothing else.

Patches 0001–0003 are byte-identical to that branch, with one deliberate
change: two `node_modules` symlinks pointing at an absolute local path were
committed by accident and have been stripped. They resolved on one machine and
would have broken every other checkout.

Patches 0004–0010 are cherry-picks of the fork's later remediation commits onto
that base (`-x` trailers name the originals). 0011 drops the fork's
`docker-compose.yml` hunk, which belonged to one deployment, and the test that
read it. 0012 was new to this set.

0013–0014 come from `fix/a11y-apply-guards` (johnnyrobot/conductor-dev
PR #8). 0013 drops that commit's removal of the two committed `node_modules`
symlinks, because this patch set never carried them.
