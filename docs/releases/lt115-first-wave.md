# First Conductor release slice: target authorization and evidence lifecycle

Historical PR #3 evidence at `1c1a5ec1`. Current target delivery and validation
are in [the pinned-target guide](../integration/pinned-targets.md).

LT-115 / LT-117 / LT-109; parent release LT-111 remains open.

This slice fixes the matrix/queue policy divergence and stale reviewer draft. It
retains base `1c1a5ec103b76b6f47de9917204784fc3bba1eb0`; do not substitute current
upstream master until its integration assessment is complete. Apply all sixteen
patches in order. Patches 0001–0014 are unchanged.

## Behavior and caller compatibility

- Matrix `POST …/remedy/{scan,preview,apply}` requires a valid project `sectionID`.
  It accepts only project editors, or the existing LibreTexts support/superadmin
  policy. Auditors can read the work queue but cannot run actions that mutate
  evidence. Browser page URL/ID and reviewer overrides are ignored. A section
  outside the selected project is rejected before any external request.
- Matrix and queue use the same page-action implementation. Targets come from
  stored sections and remain limited to `https://dev.libretexts.org/Sandboxes/johnnyphung`.
  This slice does not widen that write scope or provision real credentials.
- Before dispatching apply/restore, Conductor persists evidence invalidation. A
  persistence failure prevents dispatch. After a known acknowledgement it invalidates again and
  releases the claim for rescan. An uncertain success-shaped reply retains the
  initial invalidation and pending claim; a transport failure retains/reasserts it. Rescan runs server-side after a known result; closing a
  browser cannot leave the old approval current. A scan started before the write
  cannot overwrite post-write evidence: persistence compares the section's
  `remedyEvidenceVersion`. A persisted `remedyWritePending` claim blocks concurrent
  scans/writes and makes verification unavailable if a worker exits mid-write.
  Existing documents without those fields start at zero/false;
  no destructive data migration is needed. The competing TOC writer remains a
  release blocker under LT-126, so these direct-action guards are not a complete
  release-safety claim.
- Responses distinguish `writeOutcome`: `not_started`, `not_written`, `written`,
  or `uncertain`. `applied:false` / `restored:false` is a known no-op. A missing
  acknowledgement or failed transport is uncertain, retains invalid evidence,
  and is not retried or automatically rescanned. Its pending marker stays set, so
  further scans/writes return 409 until an authorized operator reconciles the
  external page and bridge audit. Do not clear that marker on a timeout or guess;
  an authenticated reconciliation workflow is a remaining release gate. A known write with a failed rescan
  remains a known write plus `scanError`; repeat the scan, not the write.
- Verification-form identity includes section, criterion, scope version and page
  fingerprint. A change clears the checklist, confirmation and draft; page and
  criterion selection stay in place. Missing evidence disables saving. An
  unchanged identity preserves editing. Work-item status/history and conformance
  approval remain separate; page actions never mark an item Verified.

`requested_by` remains session-derived attribution, not a signed downstream
identity assertion. The signed producer must use the Chief-approved LT-1 wire
contract; it is not implemented here. Do not expose the Bridge staff panel or
remove its loopback protection.

## Reproducible checks

In a fresh scratch clone, apply the series pinned above, then install with
`npm ci --no-audit --no-fund` separately in `server` and `client`.

```sh
cd server
npm test
npm run build
cd ../client
npm test
npm run build
```

The added route regression mounts the actual `server/api.js` router with its
normal bcrypt login, signed JWT/session validation, project handlers and Mongo
models. Only the external bridge responses are synthetic. It requires a
**disposable loopback MongoDB** database, has no default URI, rejects credentials
or non-loopback hosts, and drops its own test database during teardown. Never
point it at retained data, even if the name happens to match the test prefix.
With that dedicated MongoDB already running, continue from `client` above:

```sh
cd ../server
CONDUCTOR_TEST_MONGO_URI=mongodb://127.0.0.1:27115/conductor_test_remedy npm run test:remedy-integration
```

The route checks cover auditor/outsider/anonymous denial, stored targets/reviewer,
foreign sections/sandbox rejection, known writes with failed rescan, no-op,
uncertain transport without retry, a delayed pre-write scan, and scans/overlapping writes while a write is outstanding. The mounted-form
suite checks changed/unchanged evidence, scope change, missing evidence and a fresh
explicit review submission. The small database-failure adapter test checks that
failed invalidation prevents external dispatch.

First-slice evidence: 25 server unit tests, 23 client tests, 11 registered-route
integration tests and both builds pass on macOS/Node 24. The initial reconstruction matched tree `aca076f1fc42008104e4151a2f6d16662cf36f16`;
review fixes reconstruct to tree `37f44774ba0c1f4a29711d67757d47b1c7f4a8f8`.
Standalone server `tsc --noEmit` still fails with the same 129 normalized baseline
diagnostic headers; a successful server bundle is not a full typecheck pass.
Post-fix TestSprite IDs, traces, review disposition and exact delivery SHA are
recorded in the implementation PR and LT-115. No live provider was used.

## Remaining release gates and rollback

LT-111 and LT-115 remain open. Next slices still need measured conformance
projection indexing and bounded summaries/queue reads, action deadlines and
cancellation, and automated pinned patch reconstruction. Full authenticated
exports and append-only review history must be preserved. An authenticated, audited reconciliation workflow for pending/unknown writes is
also required before production use; no automatic unlock is provided here. Signed reviewer
assertions await LT-1; the upstream integration target awaits LibreTexts Chief.

Full-stack Linux/container scan→preview→review→write→invalidation→rescan/restore,
replay/auth/failure checks, runtime/config/ports/origins, immutable images/SHAs,
storage/backup/upgrade order and a coordinated rollback handoff are outstanding.
The local Docker daemon was unavailable; this PR does not establish those gates.

Rollback is a reviewed code rollback to the previous patch delivery and matching
client/server pair, without deleting Mongo history. Older code ignores the added
fields. It also restores the audited authorization/evidence defects, so do not
resume writes on a rollback until the release owner approves containment. Never
restore database backups or replay an uncertain external write automatically.
