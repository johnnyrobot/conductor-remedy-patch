# Explicit terminal-proof recovery, preserving the full integration

LT-180 consumes `cxone-terminal-v1` from immutable Bridge
`03d961d7fbfbcc36bad885f5ec06d5f289cba09e`:
[`docs/contracts/cxone-terminal-v1.md`](https://github.com/johnnyrobot/libretexts-remedy-bridge-dev/blob/03d961d7fbfbcc36bad885f5ec06d5f289cba09e/docs/contracts/cxone-terminal-v1.md).
Fixture ID is `cxone-terminal-v1-fixtures-r1`; its binding canonical SHA256 is
`be1b286ded8462208d282a6f4e711dee95d0be5235d12ed901b88a1a600499ab`.
The exact published fixture bytes are included in the applied integration suite;
Python independently verifies the committed canonical bytes and Unicode vectors.
No JCS or raw JavaScript-JSON digest is substituted.

## Behavior and operator entry point

The existing authorized `/resolve` action now accepts trusted terminal
known-success/not-attempted proof without a redundant offline ceremony. It matches
stored nonce/issuer/action/canonical target/full binding hash, prior known remote
identity, outer outcome/reason/audit/time, configured epoch and safe store-wide
sequence. A lost reply with no received remote ID can bind the authoritative ID
in new immutable preparation/commit references; old intent/history is unchanged.

The action still requires current support/superadmin plus tenant/project policy,
strict confirmation/reason/local expected version, fresh canonical scan, proof
revalidation and the journaled local evidence-version CAS/commit marker. Current
admin authority is checked again after the final read before CAS. Only the chosen
claim clears. A status GET never clears/retries/scans or appends operation events.
Unknown, including operator-resolved unknown, uses only the existing offline
resolution path with null proof. Pending/404/untrusted/changing observations stay
held. Audit=false stays false, original actor/nonce/outcome remain, and human
conformance is pending after recovery.

Configure non-secret `REMEDY_REVIEWER_TRUST_EPOCH` to the coordinated Bridge epoch,
separately from the seven signer settings. Missing/invalid configuration disables
only terminal-proof recovery. No signer is needed for historical lookup/recovery.
After applying the series read `docs/remedy-terminal-recovery.md` for exact API
body, permissions, expected-version workflow, failure handling, export and
backup/rollback instructions. [README](../../README.md) remains the entry point.

Full signed and optional review-only modes are preserved in the same source and
image. LibreTexts owns vendor atomicity evidence, write enablement and rollout
timing. This receipt neither authorizes writes nor certifies production readiness.

## Component evidence

Both original 28-patch series remain byte-identical, with additive patches29–32.
Fresh detached reconstruction receipts and the actual owned-service report are
in `evidence/lt180/`. Exact final Linux/image/review/merge receipts belong in the
pull request and issue; historical image reports are not current proof.

Local Node22.20.0 checks use unchanged matching lockfile dependencies and isolated
Mongo8.0.5; Linux CI performs fresh installs and uses pinned Mongo7.0.14.

| Target | Server unit | Client unit | Real router/JWT/Session/Mongo |
|---|---:|---:|---:|
| staging `67301b35` | 80 | 299 | 94 |
| v2.156.2 `352a657e` | 50 | 206 | 94 |

Client/server builds pass; standalone server tsc still retains60 inherited
diagnostics and must match the unpatched control under the strict comparator.
New compiled-image phases test lost reply before remote ID, missing-epoch hold,
restart into signer-free historical recovery, original history/audit=false,
immutable preparation/commit and zero remote retries, alongside all existing
default-off/full/recovery/review-only phases. Final exact-head CI must pass before
merge; no assembled production topology or real SSO/vendor proof is implied.

Actual built Conductor → actual Server`3fa8ed592bbe41f1f1a9adab4888dfaa1a9e2d71`
→ actual Bridge03d961d7 used fake external CXone only. Lost replies/restart,
non-ASCII binding, known-success audit failure, no-op/stale, known/missing remote
ID, actual Mongo clear refusal, transport-tampered proof and unreadable store
were exercised. Recovery was signer-free, all original events remained intact,
human conformance stayed pending, and Bridge database/fence bytes were unchanged.
Only original synthetic writes occurred, never mutation retries. Retained failed
setup attempts were not deleted or counted as successful scenarios; an additional
retained setup claim was explicitly recovered under the final role check.

Related small closures: LT-173 marker/preparation actor/local-ID/version assertions;
LT-190 standalone independently healthy status visibility (no query refactor);
LT-191 compiled-image capability-specific denial assertion. No extra TestSprite
run/spend, no old A/B relabel or retry. Earlier automation gaps are unchanged.

Global LT-111/LT-115 package/runtime/security/provider/SSO/tenant/storage and
backup/upgrade/rollback gates remain. No production credentials, live provider,
upstream push, migration, destructive history rewrite or write enablement occurred.
