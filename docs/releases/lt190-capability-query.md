# LT-190 project capability query

The matrix and standalone entry now share one typed, project-scoped React Query
hook over the authenticated capability API. The matrix no longer keeps a second
Axios/effect/useState health model. Explicit checks and fresh pre-action checks
update the same query state. Focus/reconnect events do not retry it automatically.
A delayed response or a cached prior project's status cannot enable the next
project; a delayed preflight cannot continue after its project is left.

The API validates strict capability booleans, the published profile contract,
required capability list and unavailable reasons. Missing profile metadata keeps
legacy full-mode requirements. Invalid profile, booleans, availability, readRetry
or JSON fails closed with fixed feedback. No raw malformed JSON error is shown.
A valid explicit review-only read-dependency failure retains deliberate readRetry;
a write still requires fresh overall readiness and mutate=true.

Independently healthy historical status stays available when overall readiness
is false, including missing signer or review-only preview capacity. Both entries
use the existing recovery-only view in that case. With no read/status capability,
the standalone entry shows availability feedback instead of loading ordinary page
tools. An operation lookup remains explicit and read-only, retains the pending
hold, and never retries or clears a write. Full signed integration and optional
review mode remain in the same implementation. Server authorization, target,
preview binding, write/no-op/uncertain, conformance and recovery sources are
unchanged; no database or service configuration migration is introduced.

## Verification and delivery

Actual mounted matrix and standalone tests cover signer/preview-capacity readiness
with status true and false, malformed responses, delayed and cached project
changes, no automatic lookup/retry/write, and explicit lookup retaining the hold.
Existing full reviewed preview/expiry/evidence-change, optional review and degraded
read-retry cases remain. A fresh write-readiness drop prevents apply dispatch even
when the earlier cached availability allowed confirmation. Public API tests also
check authenticated transport and sanitized malformed-JSON failure.

The API initially accepted an unknown profile, and the actual mounted matrix
initially enabled Scan with Remedy on an incompatible profile. Both regressions
were run red before the shared validated query correction. Local check receipts,
including transient host-load and test-typecheck failures, are recorded separately;
no runtime assertion or test deadline was relaxed.

Select complete `manifest-lt190.json` for the intended pinned target using the
root README's fresh detached checkout procedure. Earlier patches and the original
32-patch `manifest.json`, LT-137 `manifest-lt137.json`, accepted candidate index and
all prior artifact bytes remain intact. Current compiled candidates require their
own exact-source execution and download verification; they do not inherit the
original LT-197 package's assembled acceptance.

Exact-head and exact-main Linux CI must pass both actual compiled Node22 targets,
all existing full/review/recovery phases, tests/builds and baseline-relative server
typecheck. The inherited standalone typecheck is still failing and is never
presented as a standalone pass. Final separate versioned candidate records include
both ZIPs, executed manifests, runtime/validation receipts, source/workflow and
checkout pins, execution-input hashes and ZIP/archive/image identities. Durable
acquisition preserves original expiry metadata and has its own byte binding.

Server LT-212 owns consumer integration and a newly refreshed assembled package
with synchronized reviewed component inputs and complete new Linux/import/
operational proof. Original-byte retention is separate from new acceptance. The
production deployment/write/provider/SSO/owner flags remain false. No live provider,
paid TestSprite, new credentials or upstream push is part of this change.
