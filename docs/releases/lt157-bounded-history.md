# LT-157 bounded reads and immutable operation storage

Patch0022 externalizes new operation history into indexed immutable records,
retains only bounded active pointers in Project, and preserves legacy embedded
history without a migration. It adds journaled write-ahead intent/response
records before the corresponding Project CAS, proven on standalone Mongo7.0.14.
No replica-set transaction is required. Failed appends/CAS retain fail-closed
pending state; status/history reads never unlock or retry writes.

Default page, criterion-history, work-item, section and finding lists return at
most100 entries, with a maximum requested limit of200 and explicit cursors.
Summary responses omit raw scans/notes/history; selected detail and history are
loaded separately by the mounted UI. The authenticated500-page/25k-review summary
is196126bytes. Concurrent final target runs measured median293.62ms staging and
298.47ms released; the earlier uncontended probe measured249.73ms. These include
HTTP/auth/Mongo work, distinct from LT-156's7.38ms pure-projection median; no
universal wall-clock test assertion is introduced.

Conformance, work-item and administrative operation exports stream complete
JSON with backpressure, cancellation and a120second deadline. Only completed
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

New conformance/operation/task events have an explicit64KiB budget. Existing
work-item arrays retain their schema with refusal at1000 events per array or
8MiB before append, guarded atomically below Mongo's16MiB ceiling. Existing
oversized history remains readable/exportable; nothing is truncated/deleted.
The read-only legacy inventory emits counts and a BSON SHA256, with no apply mode.

After applying, read `docs/remedy-storage-and-reads.md` for exact routes, indexes,
privileges, budgets, backup and rollback. Enabled preflight requires collection
and index creation privileges; disabled Remedy initializes no optional model.
Backups must capture Projects, all three feature collections, user identities
and Bridge's ledger/fence/snapshot/trust epoch consistently after draining writes.
A runtime downgrade to21 patches cannot read newly externalized intents: preserve
all stores and keep the new runtime available for read-only recovery. No live
migration, destructive rollback or automatic repair is authorized.

## Checks actually run

| Target | Server unit | Client unit | Real auth/router/Mongo | Builds |
|---|---:|---:|---:|---|
| Staging | 61 pass | 291 pass | 59 pass | Server/client pass |
| Released floor | 31 pass | 198 pass | 59 pass | Server/client pass |

Node22.20.0/npm10.9.3, isolated loopback Mongo7.0.14 standalone, unchanged
matching target lockfile dependencies. Standalone server typecheck still fails
with exactly60 inherited diagnostic lines, normalized only for positions and
equivalent scratch roots. [Check records](evidence/lt157) retain exact exit codes
and baseline comparison. The expanded suite paces requests inside unchanged
upstream rate limits, without retrying mutations or waiving authentication.
The old in-memory conformance API success test was replaced by the same
assertions through actual authenticated Mongo routes; the unit seam retains
pre-storage denial checks. No passing assertion was silently dropped.

Fresh original21-patch application plus the staged delta matches both tested
source trees. Final22-patch application/tool checks, three-axis review and the
single CodeRabbit/fallback outcome will be recorded in the PR. The one approved
actual-service signed TestSprite A plus existing C pair is pending; no paid B
retry or weak-assertion certification is authorized.

LT-148 documentation is included: top-level README names all seven signer
settings, read-only recovery remains available without a local signer, and
manifests now describe current Mongo7.0.14 validation. Historical Mongo8.0.5
compatibility evidence remains unchanged. Production readiness/write hold,
LT-127 explicit resolution, LT-158 actual Linux image/CI and the global LT-111
assembled deployment/rollback gates remain open.
