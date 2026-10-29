# LT-157 bounded reads and immutable operation storage

Patch 0022 externalizes new operation history into indexed immutable records,
retains only bounded active pointers in Project, and preserves legacy embedded
history without a migration. It adds journaled write-ahead intent/response
records before the corresponding Project CAS, proven on standalone MongoDB 7.0.14.
No replica-set transaction is required. Failed appends/CAS retain fail-closed
pending state; status/history reads never unlock or retry writes.

Default page, criterion-history, work-item, section and finding lists return at
most 100 entries, with a maximum requested limit of 200 and explicit cursors.
Summary responses omit raw scans/notes/history; selected detail and history are
loaded separately by the mounted UI. The authenticated 500-page/25,000-review summary
is 196,126 bytes. Concurrent final target runs measured median 293.62 ms staging and
298.47 ms released; the earlier uncontended probe measured 249.73 ms. These include
HTTP/auth/Mongo work, distinct from LT-156's 7.38 ms pure-projection median; no
universal wall-clock test assertion is introduced.

Conformance, work-item and administrative operation exports stream complete
JSON with backpressure, cancellation and a 120 second deadline. Only completed
streams carry complete:true. Conformance history has an explicit record-ID
boundary; work-item fields remain per-document reads. Private operation export
requires support/superadmin plus current project policy. Original actor-scoped
operation history remains private to authorized editors/support. No ordinary
conformance report discloses operation bindings/session associations.

A real HTTP cancellation regression checks Mongo server cursors. It first found
an idle-cursor leak despite a cancelled browser response: concurrent cleanup
calls ended the driver's implicit session before killCursors. Idempotent cursor
disposal fixes it; the server-side inventory reaches zero. All debug probes were
removed. Original/red logs and terminal results remain in
`/tmp/conductor-lt157-evidence`.

New conformance/operation/task events have an explicit 64 KiB budget. Existing
work-item arrays retain their schema with refusal at 1,000 events per array or
8 MiB before append, guarded atomically below MongoDB's 16 MiB ceiling. Existing
oversized history remains readable/exportable; nothing is truncated/deleted.
The read-only legacy inventory emits counts and a BSON SHA-256, with no apply mode.

After applying, read `docs/remedy-storage-and-reads.md` for exact routes, indexes,
privileges, budgets, backup and rollback. Enabled preflight requires collection
and index creation privileges; disabled Remedy initializes no optional model.
Backups must capture Projects, all three feature collections, user identities
and Bridge's ledger/fence/snapshot/trust epoch consistently after draining writes.
A runtime downgrade to 21 patches cannot read newly externalized intents: preserve
all stores and keep the new runtime available for read-only recovery. No live
migration, destructive rollback or automatic repair is authorized.

## Checks actually run

| Target | Server unit | Client unit | Real auth/router/Mongo | Builds |
|---|---:|---:|---:|---|
| Staging | 61 pass | 293 pass | 59 pass | Server/client pass |
| Released floor | 31 pass | 200 pass | 59 pass | Server/client pass |

Node 22.20.0 / npm 10.9.3, isolated loopback MongoDB 7.0.14 standalone, unchanged
matching target lockfile dependencies. Standalone server typecheck still fails
with exactly 60 inherited diagnostic lines, normalized only for positions and
equivalent scratch roots. [Check records](evidence/lt157) retain exact exit codes
and baseline comparison. The expanded suite paces requests inside unchanged
upstream rate limits, without retrying mutations or waiving authentication.
The old in-memory conformance API success test was replaced by the same
assertions through actual authenticated Mongo routes; the unit seam retains
pre-storage denial checks. No passing assertion was silently dropped.

Fresh original 21-patch application plus the staged delta matches both tested
source trees. Both final 22-patch applications verify the manifests and delivery-tool 6/6 tests
pass. First native Standards/Spec/Correctness review found no critical/major
defects. Two minors (duplicate-ID pagination and mounted continuation coverage)
are fixed; four broader upstream API/frontend convention migrations are tracked
in LT-167. The scoped second review and single CodeRabbit/fallback outcome are
recorded in the PR. The actual-service TestSprite runs completed all automated steps; human verification remains pending:

| Flow | Run | Recorded result |
|---|---|---|
| Signed deterministic heading apply/rescan (A) | `29567d92-a584-42b0-a3ea-e9d0c1705ade` | 14/14 steps; explicit successful write, corrected finding and pending human conformance assertions |
| Existing note/history flow (C) | `86ec6117-08a0-46b7-957f-dab1fb67ccaa` | 17/17 steps; persisted single verified work item/note and pending WCAG assertions |

A's pinned pre-ack and pre-apply HTML snapshots independently show the actual
bold paragraph to `<h3>` diff and disabled-before/enabled-after acknowledgement gate. The
recorded final assertions have concrete subjects, not a bare visible-element
claim. Supplemental actual API/Mongo/Bridge SQLite evidence proves exactly one
external fake-CXone write, the verified reviewer/operation match, immutable local
history after status reads and zero human-verified criteria. C uses a controlled
stored manual-task starting state, not a fabricated engine result; it does not
certify scanning. A runs real product services: Bridge `60be7d0` and Server `3fa8ed5`,
with only the external CXone adapter replaced and non-fixture egress denied.

Exactly 1 credit was spent (0.5 per run; CLI balance 484.3 → 483.3). No B run/retry or
second paid attempt was made. The existing environment was restored to its prior
local URL with credentials cleared. Owned tunnels ended with their runs; the
local services remain only for the subsequent LT-127 synthetic HTTP work and
will be cleaned afterward. Sanitized run/step/ledger observations are in the
[evidence directory](evidence/lt157); private keys, login credentials and signed
artifact URLs are excluded. These are macOS development tests, not Linux/live
provider/production CAS approval.

LT-148 documentation is included: top-level README names all seven signer
settings, read-only recovery remains available without a local signer, and
manifests now describe current MongoDB 7.0.14 validation. Historical MongoDB 8.0.5
compatibility evidence remains unchanged. Production readiness/write hold,
LT-127 explicit resolution, LT-158 actual Linux image/CI and the global LT-111
assembled deployment/rollback gates remain open.
