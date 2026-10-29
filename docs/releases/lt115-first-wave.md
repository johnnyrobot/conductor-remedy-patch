# First Conductor release slice: target authorization and evidence lifecycle

LT-115 / LT-117 / LT-109; parent release LT-111 remains open.

This slice fixes the matrix/queue policy divergence and stale reviewer draft. It
retains base `1c1a5ec103b76b6f47de9917204784fc3bba1eb0`; do not substitute current
upstream master until its integration assessment is complete. Apply all fifteen
patches in order. Earlier patches are unchanged.

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
  persistence failure prevents dispatch. It invalidates again after the reply or
  an uncertain failure. Rescan runs server-side after a known result; closing a
  browser cannot leave the old approval current. A scan started before the write
  cannot overwrite post-write evidence: persistence compares the section's
  `remedyEvidenceVersion`. Existing documents without that number start at zero;
  no destructive data migration is needed.
- Responses distinguish `writeOutcome`: `not_started`, `not_written`, `written`,
  or `uncertain`. `applied:false` / `restored:false` is a known no-op. A missing
  acknowledgement or failed transport is uncertain, retains invalid evidence,
  and is not retried or automatically rescanned. Reconcile the external page
  and bridge audit before any further write. A known write with a failed rescan
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
With that dedicated MongoDB already running:

```sh
cd server
CONDUCTOR_TEST_MONGO_URI=mongodb://127.0.0.1:27115/conductor_test_remedy npm run test:remedy-integration
```

The route checks cover auditor/outsider/anonymous denial, stored targets/reviewer,
foreign sections/sandbox rejection, known writes with failed rescan, no-op,
uncertain transport without retry, and a delayed pre-write scan. The mounted-form
suite checks changed/unchanged evidence, scope change, missing evidence and a fresh
explicit review submission. The small database-failure adapter test checks that
failed invalidation prevents external dispatch.

First-slice evidence: 25 server unit tests, 22 client tests, 10 registered-route
integration tests and both builds pass on macOS/Node 24. The independent
reconstruction matches implementation tree `aca076f1fc42008104e4151a2f6d16662cf36f16`.
Standalone server `tsc --noEmit` still fails with the same 129 normalized baseline
diagnostic headers; a successful server bundle is not a full typecheck pass.
Post-fix TestSprite IDs, traces, review disposition and exact delivery SHA are
recorded in the implementation PR and LT-115. No live provider was used.

## Remaining release gates and rollback

LT-111 and LT-115 remain open. Next slices still need measured conformance
projection indexing and bounded summaries/queue reads, action deadlines and
cancellation, and automated pinned patch reconstruction. Full authenticated
exports and append-only review history must be preserved. Signed reviewer
assertions await LT-1; the upstream integration target awaits LibreTexts Chief.

Full-stack Linux/container scan→preview→review→write→invalidation→rescan/restore,
replay/auth/failure checks, runtime/config/ports/origins, immutable images/SHAs,
storage/backup/upgrade order and a coordinated rollback handoff are outstanding.
The local Docker daemon was unavailable; this PR does not establish those gates.

Rollback is a reviewed code rollback to the previous patch delivery and matching
client/server pair, without deleting Mongo history. Older code ignores the added
number. It also restores the audited authorization/evidence defects, so do not
resume writes on a rollback until the release owner approves containment. Never
restore database backups or replay an uncertain external write automatically.
