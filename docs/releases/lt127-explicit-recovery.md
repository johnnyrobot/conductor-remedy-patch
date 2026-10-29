# LT-127 explicit administrative local resolution

Patch 0023 adds an authenticated support/superadmin POST on a stored operation
identity, with current project/tenant policy, strict Zod input validation,
explicit confirmation/reason and expected local evidence version. It requires
fresh authenticated Bridge `unknown_write / reconciliation:resolved` status,
performs a fresh actual canonical source scan, rechecks durable status and role,
then persists an immutable preparation before a journaled evidence/version CAS.
Only that claim is released. Original actor, nonce, action and unknown outcome
remain immutable. No remote mutation/retry or global unlock is added.

A private bounded append-only Project commit marker identifies the winning
preparation in the same CAS, even after a section is later removed. Failed or
losing preparations remain explicitly uncommitted. An evidence epoch prevents
old human reviews reviving when identical bytes recur. Explicit limits (1,000
markers, Project below 12 MiB before CAS, new scan at most 1 MiB) preserve history
and refuse before Mongo's document ceiling. No transaction/replica prerequisite,
startup migration, destructive cleanup or disabled-feature initialization occurs.
After applying, read `docs/remedy-explicit-recovery.md` for exact schema, operator
order, audit/commit distinction, quotas and rollback rules.

## Verification

| Target | Server unit | Client unit | Actual auth/Mongo routes | Builds |
|---|---:|---:|---:|---|
| Staging | 62 pass | 293 pass | 66 pass | Client/server pass |
| Released floor | 32 pass | 200 pass | 66 pass | Client/server pass |

Node 22.20.0 / npm 10.9.3, isolated MongoDB 7.0.14 standalone, unchanged matching
lockfile dependencies. Standalone tsc still fails with exactly 60 inherited
normalized diagnostics; no clean typecheck is claimed. Fresh original 22-patch
application plus the delta matches both tested trees. Final 23-patch proof and
the complete shared review gate are recorded in the PR.

Component cases cover ordinary actor/outsider/foreign project denial, strict
browser-field rejection, confirmation/reason/version, unresolved or changed
status, signer absence, failed scan, role revocation, preparation persistence
failure, version CAS race, competing resolvers, independent claims, immutable
original history, quota refusal and persistent commit proof. The API absence,
missing durable commit marker and old-human-review revival were reproduced red
against their prior source. Raw logs: `/tmp/conductor-lt127-evidence`.

Actual owned Conductor → Server `3fa8ed5` → Bridge `60be7d0` HTTP tests used only
fake external CXone and generated development credentials, with non-fixture
egress denied. They created two uncertain writes and one known-success/lost-local-
reply case. The Bridge writer actually stopped/drained, its real offline CLI
appended a durable resolution with exclusive ownership/report hash/fence, and
restarted. Conductor restarted with signing disabled. Read-only lookup kept the
claim pending; scan failure and an actual concurrent Mongo version change kept
it held. A later valid source scan and CAS released only the selected claim,
with one commit marker, two preparations (one losing race), six original events
unchanged, zero mutation retries and both other claims still pending. Remote
outcome remains unknown and human verification remains pending. Sanitized
[actual-service observations](evidence/lt127/actual-services.json) contain no keys,
session credentials or private assertion material. This is macOS development
proof, not Linux/live provider/production CAS certification.

The approved paid UI A+C pair was already completed on the unchanged UI in
LT-157 for exactly one credit. No additional paid test, B retry or fabricated
product service was used for this REST-only recovery slice.

## Open contract/release gate

Bridge LT-159 only resolves active terminal unknown_write operations. A locally
pending known_success, not_attempted or absent remote operation cannot obtain
resolved through that tool. The actual known-success/lost-Conductor-reply case
therefore still refuses local release. This is an evidenced Chief decision gate;
no source-equality, generic status or unconditional unlock is substituted.
LT-127's broader ticket and release parents remain open. LT-158 compiled Linux
image/CI, assembled topology, vendor atomic-write evidence, real credential
rollout and deployment/rollback acceptance remain separate. Production writes
and deploymentReady remain false; no live deployment is performed.
