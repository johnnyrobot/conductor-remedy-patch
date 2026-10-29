# Conductor Remedy patch audit — 2026-10-28

[LT-101](https://linear.app/johnnyrobot/issue/LT-101) · Historical audit: October 28, 2026, Pacific time. The audit phase made no application fixes, commits, pushes, PRs, paid reviews, live page calls or TestSprite runs.

Archive note: this report and the [subsequent TestSprite results](./2026-10-28-testsprite-results.md) are the documentation archive. Raw evidence and operational setup instructions remain local-only and are not included in GitHub. Recommendations below remain proposed and unimplemented; archiving does not fix or revalidate the product.

## Verdict

Fix the divergence between the matrix and work-queue page-action paths first. The legacy matrix path admits auditors, accepts page targets outside the authorized project's stored sections, omits reviewer attribution, and leaves old verification evidence current after a write until the browser rescans. A separate React probe confirms that reviewer confirmation can survive changed evidence. Large conformance reports also block the Node event loop for seconds with ordinary one-review-per-criterion synthetic data.

No critical finding was confirmed. Five major findings and three lesser findings follow. These are audit results. The Chief subsequently selected authorization/invalidation first, reviewer confirmation next, then conformance projection and bounded summaries; see the follow-up section. No implementation is included here.

A local-only HTML architecture report contains four before/after candidates and the top recommendation. Its presentation was inspected at 1280px and in 360px frames, with dark and light palettes and no measured horizontal document overflow. This validates the report presentation, not the Conductor UI. The HTML is not part of this archive.

## Scope and provenance

| Item | Value |
|---|---|
| Delivery repo | [johnnyrobot/conductor-remedy-patch](https://github.com/johnnyrobot/conductor-remedy-patch) |
| Branch / initial status | `main`, clean |
| Audited delivery HEAD | [`832da9358a95cf6c0ebb981b351336b131bd5dee`](https://github.com/johnnyrobot/conductor-remedy-patch/commit/832da9358a95cf6c0ebb981b351336b131bd5dee) |
| Pinned upstream base | `1c1a5ec103b76b6f47de9917204784fc3bba1eb0` (2.144.0) |
| Base tree | `ba1ce3159ea36c314440d6daf720d684d746a241` |
| Fresh clone | Disposable local audit checkout |
| Patched scratch HEAD / tree | `01702c49494e574c716b313c648c2e7688a8c2ef` / `d2960fdbdd37100421e9b4649f7b4b8b90e9aebf` |
| Fetched upstream master | `352a657ec6de7b317a70ad3f8f744bc6d5054d9d` (2.156.2) |
| Drift scratch worktree | Separate disposable local drift checkout |
| Drift patched HEAD / tree | `22e92e1a0643c159e19245ea3623c1f8f0124eb6` / `ac9b5d5f30282fee386a4a7956a4ae69e785f86a` |
| Baseline control worktree | Separate local checkout at pinned base |
| Machine | macOS 26.6.2, arm64, Node 24.12.0, npm 11.6.2 |

Patched commit IDs include audit application timestamps; the tree and the patch checksums are the reproducibility references. All source line references below refer to the pinned patched tree, not this delivery repo's patch-file line numbers. Neither live `conductor` nor `conductor-idea` was opened or modified. Scratch source changes consist only of patch application and one additional audit test file; the baseline tests/builds ran before that file was added. Control worktree dependency symlink points only into the fresh scratch installation.

The audit used source inspection, a read-only architecture exploration subagent and focused synthetic probes; findings were checked against source and the probes below. No named teammate review is claimed. Recent delivery history concentrates changes in patches 0004–0014; the latest commits at the audited SHA only change repo references and automatic review configuration. No dependency manifest or lockfile changes are introduced by the series except the server test script.

## Baseline commands and results

Commands ran in the fresh clone unless stated. Full outputs, failures, warnings, probe sources and patch checksums are retained in the local-only evidence directory `docs/audits/2026-10-28-evidence/`; they are not published or linked as GitHub artifacts.

| Command | Result | Wall time |
|---|---|---:|
| Clone `LibreTexts/conductor` into disposable scratch | Success; no push | — |
| Pinned checkout `1c1a5ec1`, then `git am -3` of all delivery patches | All 14 apply cleanly | 0.14 s (checkout + apply) |
| `git diff --check 1c1a5ec1 HEAD` | Pass | — |
| `cd server; npm ci --no-audit --no-fund` | 915 packages, success | 9.81 s |
| `cd client; npm ci --no-audit --no-fund` | 1278 packages, success | 14.05 s |
| `cd server; npm test` | 24/24 pass | 1.07 s |
| `cd client; npm test` | 19/19 pass, four files | 2.29 s |
| `cd server; npm run build` | Pass, bundle + declarations | 5.81 s |
| `cd client; npm run build` | Pass, includes client TypeScript check | 24.77 s |
| `cd server; ./node_modules/.bin/tsc --noEmit` | Fail: 129 diagnostics | 13.11 s |
| Same `tsc` on unpatched base with identical installed dependencies | Fail: same 129 normalized diagnostic headers | 13.02 s |
| `cd server; ./node_modules/.bin/eslint api/remediationactions.ts api/remediationqueue.ts api/conformance.ts` | Fail: parser rejects TypeScript in all three files | 0.53 s |
| `vitest run src/audit-reviewer-state.test.tsx` (scratch client; audit probe below) | 1/1 pass **confirming the defect**, not a fix | 0.88 s |

Actual failure excerpts:

```text
api/assettagframeworks.ts(217,52): error TS2345: Argument of type 'ObjectId' is not assignable to parameter of type 'string'.
api/services/ai-service.ts(4,28): error TS2307: Cannot find module 'openai/core' or its corresponding type declarations.
api/services/stripe-service.ts(6,9): error TS2322: Type '"2025-05-28.basil"' is not assignable to type '"2025-08-27.basil"'.

api/conformance.ts
  9:43  error  Parsing error: Unexpected token :
api/remediationactions.ts
  2:50  error  Parsing error: Unexpected token :
api/remediationqueue.ts
  22:48  error  Parsing error: Unexpected token :
```

The typecheck failures are inherited at this pinned base under this dependency/runtime environment; no patch-specific diagnostic header was added. Normalization removes scratch-root paths, the control symlink prefix and output ordering, and compares all 129 headers. Builds succeeding does not imply full server typechecking succeeds. There is no lint script or TypeScript parser configuration for these files. Existing tests warn `Not implemented: Window's scrollTo() method`. Builds warn about an undefined `KBUUIDParams` import, duplicate `createdBy`, missing optional SWC, deprecated Sass functions and oversized chunks. The first two warnings point outside Remedy changes. The largest emitted client chunk is 3,411.82 kB (474.16 kB gzip); no browser loading benchmark was performed, so no Remedy-specific bundle regression is asserted.

CI limitation: upstream build workflows use Node 22; this local baseline used Node 24. Patch delivery repo has no workflow that reconstructs the patched tree and runs its tests; upstream workflows build but do not run these suites. No hosted CI or deployment was triggered. No vulnerability scan was run; reproducible installs and no added dependencies are established, vulnerability absence is not.

### Drift

At fetched master, initial `git am -3` stops at patch 0001:

```text
CONFLICT (content): Merge conflict in server/package.json
error: Failed to merge in the changes.
Patch failed at 0001 feat(a11y): carry CXone pageID on review sections, extract TOC build/merge
```

Applied the README's documented resolution in the drift scratch worktree only: kept upstream's `tsx watch --clear-screen=false server.ts | pino-pretty` dev script, kept the patch's added test script, staged that one resolved file, and continued `git am`. All remaining patches applied. This validates reapplication with one known conflict, **not** build/runtime compatibility with current master; only the pinned tree was installed/built/tested. README's unpinned quickstart therefore still requires manual handling. The heading says “twelve commits” while fourteen are delivered; documentation issue only.

## Ranked findings

| Rank | Severity | Finding / impact | Effort | Confidence |
|---:|---|---|---|---|
| F1 | Major | Legacy matrix actions authorize the wrong scope and admit auditors | Medium | High; source + handler probe |
| F2 | Major | Matrix writes can leave old conformance evidence current | Medium | High; source + zero persistence writes in probe |
| F3 | Major | Old reviewer confirmation rebinds to changed evidence | Small | High; real React form probe |
| F4 | Major | Conformance projection consumes seconds of synchronous CPU and large responses | Medium | High; measured synthetic production functions |
| F5 | Major | Legacy dependency calls have no deadline/cancellation; batches can stall indefinitely | Medium | High for configuration, runtime outage not simulated |
| F6 | Moderate | Queue returns and renders all work items, history and evidence | Medium | High for unbounded read/render, latency unmeasured |
| F7 | Minor | Matrix reports a write when bridge says `applied:false` | Small | High; direct rendering code |
| F8 | Minor | No automated patch reconstruction/test gate; current-master quickstart conflicts | Small–Medium | High; repo/workflow inspection + reapplication |

### F1 — Conductor target and edit authorization differ by caller

Evidence: `server/api/projects.js:3036`, `:3041`, `:3080`, `:3088`, `:3878`; validators at `:4306` and `:4326`; registrations at `server/api.js:2333` and `:2343`. Legacy preview/apply check membership of the supplied project, then forward browser `sectionURL`/`pageID`. Membership includes auditors. The queue path excludes auditors on non-GET at `server/api/remediationqueue.ts:29` and resolves the stored section plus strict sandbox at `server/api/remediationactions.ts:6–24`.

Concrete case: an auditor of project A submits matrix apply for a different page under the bridge's allowed sandbox. Conductor authorizes A and forwards that other target. The audit-only legacy handler probe (local-only `legacy-handler-probe.mjs`) evaluates exact source declarations with in-memory persistence/transport. Both auditor and editor preview/apply accepted the nonproject target; no `requested_by` was forwarded. It uses valid-shaped input but does not run Express validation/auth middleware or make any real write. Bridge safeguards remain independent protection; this is **not** proof of unrestricted writes or a bypass of the bridge.

Acceptance proposal: through both production route registrations, deny auditors' mutations and foreign section IDs with zero bridge calls; ignore/reject browser page overrides; use the stored target and authenticated reviewer; preserve support/superadmin policy. Matching bridge attribution support is a cross-repo dependency.

### F2 — Server does not invalidate matrix evidence on write

Evidence: `server/api/projects.js:3072–3100` only relays the apply result. The handler probe observes zero persistence writes. The client must then call `refreshSectionAfterApply` at `ProjectAccessibility.jsx:1349`. Queue writes already unset source/rendered fingerprints at `server/api/remediationactions.ts:36–38`.

Concrete case: a page has valid source/rendered evidence and a signed evaluation; matrix apply writes new content, then the tab closes before its rescan request. Conductor's stored evidence and corresponding conformance digest still describe old content until a subsequent scan or expiry. Whole-app Mongo/signoff execution was not run; the missing invalidation is directly observed in the handler and source.

Acceptance proposal: after a successful or uncertain write, server-side evidence must become noncurrent without any browser follow-up; report the write outcome separately from rescan/persistence outcomes. Test success, rescan failure, persistence failure and disconnected browser. Do not retry uncertain writes automatically.

### F3 — Review draft and confirmation outlive their evidence

Evidence: local state at `client/src/components/projects/ConformanceReview.tsx:7`, submission using current props at `:8`, form key at `:78` omits fingerprint. React probe (local-only `reviewer-state.test.tsx`) renders the actual form with a synthetic HTTP adapter: fill notes/environment/checklist, confirm, refresh with a changed fingerprint, submit. Captured submission has `fingerprint: after-change`, `confirmed: true`, and the old notes/checklist. Assertions passed in 109 ms; no network or alternate UI was used.

Acceptance proposal: changing fingerprint or scope invalidates checklist and confirmation before saving; drafts may remain only if labeled stale and explicitly reconfirmed. Keep selected page/criterion stable. Regression must exercise a refresh of the same mounted form, not just a fresh mount.

### F4 — Conformance projection repeatedly scans all review history

Evidence: `server/util/conformance.ts:40–44` filters the entire review list for every page and criterion; complexity O(P × 50 × R). `server/api/conformance.ts:11–17` loads and transforms complete append-only history for every read and mutation. For one current review per page/criterion, R = 50P and the projection is quadratic in page count. It runs synchronously on the request's Node event loop.

Measured actual `conformanceReport`, three calls per size, synthetic complete source/rendered evidence, 50 criteria/page, one passing review per criterion. Fixture construction and JSON serialization are outside the timing; bytes measure uncompressed JSON separately. No DB, network, rendering or concurrency cost is included.

| Pages | Reviews | Median projection | Response bytes |
|---:|---:|---:|---:|
| 10 | 500 | 3.57 ms | 402,965 |
| 50 | 2,500 | 75.36 ms | 2,016,087 |
| 100 | 5,000 | 304.90 ms | 4,032,487 |
| 250 | 12,500 | 1,162.84 ms | 10,097,439 |
| 500 | 25,000 | 4,800.46 ms | 20,205,689 |

This is a reproducible synthetic scaling result, not observed production traffic. Repeated historical reviews would enlarge R; no extrapolated timing is claimed. Candidate de-duplication also uses repeated `.some` (`server/util/remediationqueue.ts:21`): median 0.23/5.23/115.18/455.93 ms at 100/1,000/5,000/10,000 distinct findings. Last 10,000 sample was 258.43 ms; retain raw timings rather than implying stable absolute latency. Lower priority than conformance and authorization.

Acceptance proposal: preserve newest matching scope/fingerprint semantics and append-only history while indexing current review selection once. Chief to approve a budget such as <250 ms at 500 pages/25,000 reviews on this machine and <3× increase when fixture doubles, plus a bounded summary response (<1 MB) and separately selected page/history detail. These are proposed budgets, not current product requirements. Keep complete authenticated exports available separately.

### F5 — Dependency and batch lifecycle is unbounded in the legacy path

Evidence: legacy axios calls at `server/api/projects.js:2892–2899` and `:2935–2938` supply no timeout or abort signal; audit transport probe confirms both absent. No global timeout override found. Matrix client requests likewise lack deadlines; cleanup only clears the score debounce (`ProjectAccessibility.jsx:620–626`). Retry waits are fixed 65 seconds twice for 429 (`:997`, `:1020`), and the sequential loop (`:1045`, `:1077`) has no navigation cancellation. Queue transport has a 600-second deadline (`server/api/remediationactions.ts:68`) but does not connect it to request disconnect.

A dependency that accepts a connection and never returns can hold health/scan/apply indefinitely. Closing the view does not cancel its remaining batch. No periodic polling exists in these new panels: they reload after mount/actions, so proposed polling changes would address an invented mechanism. A successful 500-page batch already schedules 499 × 1.1 s = 548.9 s of intentional spacing, excluding all scan work; this is calculated, not a measured batch run.

Acceptance proposal: define action-specific deadlines with bridge owners, cancel reads/batch scheduling on unmount, keep intentional rate limiting, use bounded retry respecting retry advice, and represent unknown write outcomes without automatic replay. Deterministic tests should cover hung health/read, cancellation during 429 wait, and an ambiguous apply result.

### F6–F8 — Additional candidates

* **F6:** `server/api/remediationqueue.ts:43` returns all rows, including mixed scan evidence and history; `RemediationWorkQueue.tsx:80–84` eagerly maps rows and details. Every section selection reloads the whole queue. Propose server-side status/cursor filtering and separately loaded history, with stable ordering and project-scope tests. Database/document size, browser memory and scroll latency remain unmeasured.
* **F7:** `ProjectAccessibility.jsx:395–397` unconditionally says “Remedy wrote the selected changes.” The queue handles `applied:false` at `RemediationPageActions.tsx:55`. Share explicit outcome presentation and test no-op vs write vs write-with-rescan-failure. Static confirmation only for the matrix panel.
* **F8:** repository has no patch reconstruction workflow; upstream `.github/workflows/build_{client,server}.yml` build without `npm test`. Propose a pinned-base apply/install/test/build gate with retained patch SHA evidence and a separate nonblocking upstream-drift check. Fix the README heading and make the pinned checkout explicit. Any runbook/workflow implementation later needs the shared review gate.

## Architecture candidates and deletion test

1. **Strong: deepen the page-action module.** Files: both `server/api/projects.js` Remedy handlers and `server/api/remediationactions.ts`, their callers and tests. Two real callers already vary across this seam. Concentrate authorization, stored target, reviewer attribution, deadline, invalidation and explicit outcomes in one implementation. Do not create a pass-through module that leaves callers responsible for sequencing. Deletion test: removing the common implementation should force these rules back into both callers; that is useful depth and leverage. Top next slice is the F1/F2 production-interface regression and minimal correction, before any broad rewrite.
2. **Strong: deepen the conformance projection module.** Files: `server/api/conformance.ts`, `server/util/conformance.ts`, `ConformanceReview.tsx`. Put current selection and bounded read representation together, retain immutable evidence storage. Tests should use the same interface as callers and preserve ordering, stale evidence, latest failed review and scope-change behavior. Deletion test: current-record knowledge would scatter between query, projection and UI; concentrate that knowledge for locality.
3. **Worth exploring: deepen reviewer-session state.** File: `ConformanceReview.tsx`. Make evidence identity own the draft/checklist/confirmation lifecycle. Confirmed F3 warrants a focused change; a generic form framework does not. Deletion test: without this module, each evidence refresh path must remember invalidation.
4. **Worth exploring: deepen patch validation.** Files: delivery README, patches and future CI. Hide scratch reconstruction/check orchestration behind a repeatable validation entry. Real adapters are local validation and CI; no deployment abstraction is needed. The installation/baseline checks above supply the first concrete behavior.

Retain the existing scoring and remediation-handoff modules: deleting them scatters score-denominator and delivery-versus-conformance invariants. Their tests provide useful depth. Avoid splitting functions just to reduce file length.

## Historical TestSprite preflight and subsequent execution

At the LT-101 audit cutoff, CLI 0.15.0 authenticated to the Starter workspace; all five existing projects were enumerated and none matched Conductor. No matching tests or environment existed. Balance was **491.8 → 491.8**, audit spend **0 credits**. Three authored frontend plans passed local dry-run validation, which explicitly used sample responses and did not create or run tests. There were no test/run IDs, dashboard verdicts or execution artifacts at that cutoff. The isolated authenticated full-product target and synthetic transport seam still required design and approval.

The Chief later approved that target and the three plans under [LT-108](https://linear.app/johnnyrobot/issue/LT-108). Execution completed with **2 passes and 1 confirmed product failure**, spending **1.5 credits**. The [TestSprite results summary](./2026-10-28-testsprite-results.md) preserves IDs, dashboards, assertion/replay limitations and cleanup. Those results supplement this historical audit; they do not establish a product fix. Bootstrap instructions, executable fixtures and raw execution artifacts remain local-only.

## Follow-up proposals for Chief selection

At audit time, the repo-label search found LT-101 only; no bulk issues were created. The Chief subsequently selected F1/F2 first, F3 next, then F4 and bounded summaries. [LT-109](https://linear.app/johnnyrobot/issue/LT-109) now tracks the confirmed F3 defect. The proposals below remain unimplemented in this archive:

* **First:** close legacy page-action authorization/evidence gaps (F1/F2, high priority, medium effort), acceptance above. Agree route seam, use focused failure regressions, regenerate patches in scratch. Include reviewer attribution and explicit outcomes if they fit the slice; coordinate contract with Bridge Dev through Chief.
* Reset reviewer confirmation on changed evidence (F3, high, small; LT-109); include mounted-form regression.
* Bound current conformance projection and summary responses (F4, high, medium); preserve append-only history and export.
* Bound/cancel Remedy reads and scan-batch scheduling (F5, high, medium); choose deadline/unknown-write policy with bridge/server owners.
* Queue pagination/history detail (F6, medium); measure actual DB and browser behavior before choosing limits.
* Patch validation CI/docs and lint readiness (F8, medium); keep broad upstream typecheck debt outside this patch slice.

At the audit cutoff, complete product runtime and TestSprite terminal results were unverified; the subsequent LT-108 summary records the narrower authenticated synthetic runtime checks actually completed. Mongo atomicity/index behavior, Node 22 CI, browser keyboard/screen-reader/large-matrix behavior, full upstream-master builds, real bridge contracts/guards and vulnerabilities remain unverified. No deployment or live-server validation is implied. Scratch evidence and the operational runbook remain local-only; this archive publishes only the two Markdown reports.
