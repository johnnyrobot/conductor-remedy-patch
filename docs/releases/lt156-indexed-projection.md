# LT-156 indexed conformance projection

Patch0021 adds one ordered section/criterion/fingerprint index to the actual
conformanceReport projection. Selection still uses the first matching record in
caller order (the authenticated route sorts createdAt descending, then _id
 descending), regardless of the review's `at` timestamp. Stale records cannot
mask a later current match. Missing scope, null fingerprints, failed scans,
pending claims, sign-off digest, full export and authorization keep their prior
semantics. No API, UI or storage contract changes in this slice.

## Same-host measurement

Node22.20.0/npm10.9.3, macOS arm64, same installed lockfile dependencies. The
original audit probe was run on both old and new actual production functions.
Three samples per size; these are timings, not portable CI thresholds.

| Pages / reviews | Before median ms | After median ms | Output bytes (both) |
|---|---:|---:|---:|
| 10 / 500 | 3.43 | 0.32 | 402965 |
| 50 / 2500 | 64.27 | 1.28 | 2016087 |
| 100 / 5000 | 183.17 | 1.79 | 4032487 |
| 250 / 12500 | 1109.69 | 3.72 | 10097439 |
| 500 / 25000 | 4504.79 | 7.38 | 20205689 |

The comparable-host250ms target passes. Growth of the new selector is consistent
with one history pass plus pages×50; the old selector scanned all reviews for
every page/criterion. Exact sample arrays and response sizes are in
[evidence/lt156](evidence/lt156). The delivered synthetic probe is reproducible
from patched server with `node --import tsx scripts/benchmarkConformance.ts`.
The response remains about20MB at500pages: LT-157 must bound reads/storage.

## Verification actually run

| Target | Server unit | Client unit | Actual auth/router/Mongo | Builds |
|---|---:|---:|---:|---|
| Staging | 61 pass | 289 pass | 50 pass | Server/client pass |
| Released floor | 31 pass | 196 pass | 50 pass | Server/client pass |

Compatibility oracle cases compare the old filter/find behavior with production
projection over reordered and repeated histories, scope changes, stale/current
fingerprints, distinct IDs, missing evidence, failed scans and pending claims.
They passed before and after the optimization; the same-host slow baseline is
the performance regression signal. Actual authenticated route/export tests add
250 ordered records, verify current/fail/stale selection and complete export,
retain every history record and reject outsider/unauthenticated downloads.

Both target trees were reconstructed fresh from the preserved twenty-patch
series plus the delta and matched the tested trees. Dependencies were reused
only after matching each target's unchanged lockfile. Full21-patch application
and delivery-tool checks are recorded in the PR gate. Standalone server tsc still
fails with60 diagnostic lines, exactly matching the prior validated baseline
after source-position and equivalent scratch-root normalization. It is not a
clean standalone typecheck. Raw logs are in `/tmp/conductor-lt156-evidence`.

Scratch commit initially failed with the inherited missing hook helper:
`.husky/commit-msg: line 2: .husky/_/husky.sh: No such file or directory`.
Scratch-only source commits used per-command core.hooksPath=/dev/null after all
checks; no shared configuration or source hook was changed.

No TestSprite credit was spent for this backend-only optimization; the one
approved signed A+C UI pair remains for subsequent behavior changes. No live
server/provider, deployment or production credential was used. Linux compiled
image, bounded storage/read/export, explicit administrative resolution and the
assembled deployment bundle remain release gates under LT-157/LT-127/LT-158 and
LT-111. Production write hold and manifest deploymentReady=false remain.
