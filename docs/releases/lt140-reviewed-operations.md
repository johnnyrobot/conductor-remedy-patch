# LT-140 / LT-127: signed operations and read-only recovery

Patch0020 implements the Chief-approved LT1 r2 contract at immutable Bridge
proposal `a67d9d8b7efd9189f76885ecbd6394a9f3d92f54` plus the expiry, readiness and
stale-evidence addendum. Both pinned targets include the same behavior. Earlier
patches and historical evidence are unchanged. Production readiness remains false.

## Delivered behavior

- A preview stores exact authoritative binding, expiry, controls, target and
  verified user/session association. Confirmation rechecks current project edit
  permission and stored review identity. Browser actor/binding/nonce overrides
  cannot select an operation or signed content.
- Native Node22 Ed25519 signs the approved compact JWS. Assertion expiry is capped
  by60seconds, authoritative preview expiry and key-not-after; missing/invalid
  signer blocks mutation without breaking ordinary Conductor startup. Three
  frozen positive vectors match exact bytes; production rejects the public test
  key even when renamed. No JOSE algorithm fallback or new dependency is added.
- One atomic Project update consumes the review, claims the section and appends
  issuer/jti intent BEFORE dispatch. Private append-only `remedyOperations` history
  survives TOC replacement and is excluded from ordinary project reads. It grows
  within Mongo's document limit; LT-128 storage/read bounds remain a release gate.
- Typed outcomes keep pending/hold, matched no-op, known write and unknown write
  distinct. A matched no-op preserves current evidence without a rescan. Proven
  stale source/target invalidates even when no write was attempted. Actual or
  unknown writes invalidate. Generic HTTP4xx/false booleans cannot unlock claims.
- Validated previews also invalidate earlier evidence when authoritative source
  differs from the stored16/64-character SHA256 representation. Unknown legacy
  hashes fail closed; absent evidence stays absent. Source-hash CAS rejects a
  concurrent scan change. A changed TOC URL/pageID clears old scan/review state
  while retaining section IDs, manual metadata and history.
- Actual mounted matrix/queue forms refresh after preview invalidation, expire
  confirmations and expose explicit read-only status. Only `no_change` is called
  a no-op; stale source/target and other rejected operations receive distinct safe
  messages. A no-scan response never claims a completed rescan.
- GET status requires current edit permission and original actor or existing
  support/superadmin policy. It uses the saved issuer/jti mapping and exposes only
  safe durable metadata. It never mutates local history, releases a pending claim,
  repairs audits, rescans or retries a write. Administrative resolution remains
  separate under LT-127.

See delivered `docs/remediation-integration.md` for signer configuration names,
key-window requirements, immutable protocol provenance, collection/index policy,
backup coordination and pending-claim operator handoff. Health preflight requires
authenticated scan/preview/mutate/**operation_status** capability and a valid local
signer. A public liveness response cannot enable reviewed writes.

## Executed target checks

Node22.20.0/npm10.9.3, macOS arm64, isolated loopback Mongo7.0.14, synthetic
credentials/data only. Matching unchanged target dependency installs were reused;
no dependency or lockfile change was introduced.

| Check | Primary staging | Released floor |
|---|---:|---:|
| Actual registered router, bcrypt login, JWT/current Session, Mongo |49pass|49pass|
| Server unit |60pass|30pass|
| Client unit, including mounted real panels |287pass|194pass|
| Client/server build |pass/pass|pass/pass|
| Built production-mode Conductor `/health`, optional Remedy disabled |200|200|
| Full standalone server typecheck |60baseline errors|60baseline errors|

Both complete20-patch manifests apply to fresh upstream clones and match their
expected source trees. The application tool passes6/6. Earlier19 target patches
and the historical root series retain their hashes.

Regression failures were reproduced before fixes: an unstored browser preview
was accepted; in-flight target changes could preserve old scan evidence; recovery
capability was omitted from readiness; changed/unknown source and TOC URL/ID
could retain old evidence; mounted reviewer controls stayed confirmed; rejected
outcomes could falsely claim a rescan or wrong rejection reason. Final suites
cover those behaviors through real routes or mounted panels. The full typecheck
also caught four new TS2339 field-typing diagnostics; an explicit existing section
interface annotation removed them. Its final normalized diagnostic multiset is
identical to the earlier60-error control. Builds do not imply a clean full tsc.

## Actual three-service HTTP evidence

The primary patched **built Conductor** communicated with actual Remedy Server
`beff73252ce8c715ba5d2579b15512543490ac5d` and actual Bridge
`9ceb699de81cb4431e63ac2ef0d94cb7f9ff8c41`. Both service sources were fresh tracked
archives; ignored private environments were excluded. The archived Bridge core
was compiled and its workspace resolved to that archive. Server used its full
owned FastAPI app/router/lifespan with existing Python3.13 dependencies. Both
service authentication hops, Bridge verifier, real SQLite/POSIX helper, independent
fence, snapshots and audit code ran unchanged on loopback.

Only the **external CXone SDK adapter** was synthetic. A separate local transport
fixture forwarded actual Server responses and deliberately dropped one real reply
or tampered one assertion; no owned service response was fabricated. Canonical
dev-sandbox URLs were data identities, with non-fixture egress denied. Deterministic
heading remediation required no AI provider. No public Bridge or tunnel was used.

Executed evidence includes:

1. Authenticated readiness through all services, four missing/wrong hop-auth cases,
   real static scan finding, exact reviewed signed write once, verified reviewer
   audit attribution, denied replay and no automatic WCAG verification.
2. Matched no-op preserves exact source evidence/revision/time with zero writes
   and zero extra scans. Stale source and canonical target moves produce proven
   not-attempted/invalidate outcomes with zero writes.
3. External write followed by response loss produces unknown-write quarantine.
   Dropping a real Server success reply before Conductor receives an operation ID
   still allows lookup using its pre-persisted issuer/jti. Lookup returns known
   success while retaining pending state and byte-equivalent section/history;
   retries remain409 with exactly one write.
4. Signature tampering reaches real Bridge401 and causes zero external writes;
   Conductor conservatively retains its claim. Real snapshot restore submits the
   exact reviewed bytes and returns known success.
5. A graceful actual Bridge restart reuses the same ledger/fence/epoch. Unknown
   status persists; even a fresh valid signed operation through Server receives
   claim-conflict on the quarantined target, independently of Conductor's guard.
6. After the final functional evidence fixes, rebuilt Conductor was restarted:
   a fresh exact signed write passed, and a source changed BEFORE a no-op preview
   invalidated old evidence and kept it invalid with zero external writes.

Initial and extended flow observations remain under the private local
`/tmp/conductor-lt140-fullstack-20261029` fixture; detailed component logs remain
under `/tmp/conductor-lt140-evidence`. An initial no-op harness request selected
the matrix endpoint with empty finding IDs and correctly received400; the corrected
queue-route harness passed. A fixture TypeScript startup initially lacked ESM
configuration; adding its private package type fixed the harness. These were setup
corrections, not hidden product failures. Raw credentials/assertions are not part
of this report or repository.

## Release limits

The HTTP integration used local test/development modes with authentication
enabled. It did not validate production TLS/cookies/SSO, Linux/container execution,
actual providers, rendered browser evidence or a deployed stack. The separate
production-mode health boots prove ordinary startup with optional Remedy disabled.
The final UI outcome changes were verified by mounted tests/builds; no new signed
TestSprite/browser plan was created. The authorized A+C pair remains LT-131
evidence:1credit, task cumulative7.5/20,12.5remaining; paid B was not repeated.

LT-127 audited administrative resolution, LT-128 performance/read bounds,
deadlines/cancellation, automated patch CI, final service/image bundle, actual
deployment topology/auth and reviewed backup/upgrade/rollback remain open under
LT-115/LT-111. No real key provisioning, live server/provider, upstream push or
deployment occurred. A known outcome observed by read-only lookup does not itself
authorize an unlock.
