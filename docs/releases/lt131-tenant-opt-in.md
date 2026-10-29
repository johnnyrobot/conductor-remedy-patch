# LT-131: explicit tenant opt-in and optional feature readiness

Patch0019 follows LT-126 on both pinned targets. Remedy now defaults disabled.
It is enabled only when `REMEDY_ENABLED=true`, `REMEDY_ORG_ID` matches startup
`ORG_ID`, and the accessed stored Project has that organization. Support access
to another organization's project never opts that organization in. Additional
multi-organization mappings need a separately approved design.

Both backend action paths require an explicit `REMEDY_API_BASE_URL` origin and
`REMEDY_API_KEY`. Legacy aliases and implicit localhost are removed. Off-host
HTTP, credentials/path/query/fragment in the URL, missing keys and redirects are
rejected. Explicit loopback HTTP supports same-host local fixtures. No actual
key provisioning or deployment is included.

Authenticated project capability preflights feature storage and the configured
engine's authenticated `/v1/cxone/health`. Scan/preview/mutate readiness is
required; public liveness cannot enable the UI. Responses expose fixed safe
messages/capabilities, never configured URLs, credentials or upstream errors.
The actual mounted Project Accessibility page follows this server result while
ordinary matrix controls and unrelated Conductor functionality remain usable.

Feature models compile lazily. Automatic collection/index creation is disabled;
the first enabled health preflight or authorized work-queue request creates the two
collections and declared indexes. Privilege, duplicate-data or storage failures
report feature unavailable without crashing unrelated startup or deleting data.
The [target guide](../integration/pinned-targets.md) and delivered
`docs/remediation-integration.md` cover indexes, growth, consistent backups,
pending-write reconciliation and actual deployment assumptions still unknown.

## Executed checks

Node22.20.0/npm10.9.3, macOS arm64, isolated loopback Mongo7.0.14. Unchanged
target lockfiles and dependency installs were reused. Both complete19-patch
series applied to fresh upstream clones and matched their expected trees.
All preceding patches retain their bytes; the application tool passes6/6.

| Check | Staging | Released floor |
|---|---:|---:|
| Actual router, bcrypt login/JWT/Session, Mongo, external HTTP fixtures | 24 pass | 24 pass |
| Server unit | 55 pass | 25 pass |
| Client unit, including mounted Project page and failed-scan reviewer form | 272 pass | 179 pass |
| Client/server build | pass/pass | pass/pass |
| Actual built production-mode Conductor health, optional Remedy disabled | 200 | 200 |
| Standalone server typecheck | fails:60 baseline errors | fails:60 baseline errors |

Typecheck diagnostics match the control multiset after source positions and
equivalent scratch/dependency-root prefixes are normalized. No clean full server
typecheck is claimed. Existing chunk/Sass warnings remain.

The default-off route and mounted full Project page tests ran red before the
policy implementation and green afterward. Route controls cover missing/false
opt-in, invalid enabled configuration, both outbound action paths, cross-tenant
projects, ordinary project reads, authorization and effective authenticated
readiness. Disabled/misconfigured cases make zero external calls. A further
passing control verifies synthetic credentials/address echoed by an upstream
error never reach either public action response; it did not require a new fix.

## Authorized existing TestSprite A+C pair

Only the local Conductor frontend was exposed; external dependencies were
deterministic local fixtures. Each existing test ran once after its own reset.
No paid B repeat, generated plan, suite or signed-flow plan was run.

| Flow | Result | Run |
|---|---|---|
| A: reviewed preview, apply and rescan | passed,16/16 steps | `847ba4db-e3b6-47e8-bb4b-6eba6b8139bd` |
| C: persisted work-item verification stays separate | passed,17/17 steps | `1243de3b-b292-473d-b938-0540e24420f6` |

[A dashboard](https://www.testsprite.com/dashboard-v3/o/c66ab795-72b2-5244-b0a2-0c60b1512705/projects/4e433799-7c02-442f-8d07-1a99dce6620c/test-cases/5b5f8d0b-1f54-44f3-aa02-4e680d3d9a4d),
[C dashboard](https://www.testsprite.com/dashboard-v3/o/c66ab795-72b2-5244-b0a2-0c60b1512705/projects/4e433799-7c02-442f-8d07-1a99dce6620c/test-cases/c3691d8c-3935-46a7-be87-1d2805f36561).

Trace inspection found meaningful final assertions and no action starvation.
A's runtime trace did not separately assert the intermediate disabled state;
recorded real browser DOM snapshots show Apply disabled with acknowledgement
off and enabled with it on, including an on/off/on toggle before the one write.
Its final assertions show no findings/failed criteria and WCAG still pending.
For C, supplemental authenticated API reads confirm exactly one criterion1.1.1
item Verified with two history entries and the submitted note, while conformance
remains pending with zero verified criteria. Those are supplemental assertions,
not an invented extra TestSprite step. Paid B's earlier control assertions remain
inconclusive; mounted form/API regressions cover the corrected failure directly.

Usage485.3→484.3:1.0 credit, task cumulative7.5/20,12.5 remaining. Fixture sessions
were invalidated, synthetic password hashes cleared, the isolated UI database
dropped, local secrets rotated, TestSprite credentials cleared, and the owned
product/adapter processes stopped. Final tunnel listing is empty. Raw traces
contain disposable credentials/signed artifact links and remain private locally;
only sanitized observations are described here. No such raw artifact is committed.

## Limits

The paid runtime matches the delivered product code; the final source tree adds
only an additional passing error-redaction regression after that build. Local
unit/router/fixture checks do not establish production readiness. LT-140/LT-127
signing/status, actual owned-service integration, LT-128 read/performance bounds,
Linux/container, patch CI, immutable deployment images and reviewed rollback
remain open under LT-115/LT-111. No live service, real provider, real credentials,
upstream push or deployment was touched.
