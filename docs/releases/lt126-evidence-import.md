# LT-126: stale imports and failed-scan observers

LT-126 appends patch 0018 to both selected target series. The historical root
patches and target patches 0001–0017 are unchanged. LT-115/LT-111 remain open;
this correction is not production deployment approval.

A TOC import uses one external TOC response and one optimistic atomic update.
The update matches the full original section array plus the stored book binding.
Any concurrent section/evidence/claim change produces HTTP409 and asks the user
to refresh and review before another import. An initially pending/uncertain page
refuses merge and replacement before fetching the TOC. There is no automatic
refetch or mutation retry. Unchanged merges preserve section IDs, human review
metadata and scan evidence. This does not reconcile uncertain writes.

A failed standalone queue scan now notifies the mounted parent to reload stored
evidence, as failed writes already did. The actual mounted reviewer panel drops
its checklist/confirmation and disables Save when the new fingerprint is absent.
No external scan is repeated by that observer refresh.

## Executed evidence

Fresh upstream scratch clones at the two README pins applied the complete
18-patch manifests with Node22 and matched each expected source tree. The six
application-tool checks pass. Target patches 0001–0017 retain their prior bytes.

| Check | Staging | Released floor |
|---|---:|---:|
| Server unit | 55 pass | 25 pass |
| Client unit (includes mounted real panels) | 271 pass | 178 pass |
| Actual registered router, bcrypt login/JWT/Session, isolated Mongo | 16 pass | 16 pass |
| Client/server build | pass/pass | pass/pass |
| Built production-mode server `/health` | 200, Mongo connected | 200, Mongo connected |

Node22.20.0/npm10.9.3, macOS arm64, loopback Mongo7.0.14. Dependency directories
were reused from the identical target's earlier `npm ci`; dependency declarations
and lockfiles were unchanged. No new dependency install or standalone server full
typecheck is claimed. The compatibility slice's known 60-line server typecheck
baseline remains an open limitation.

Before the fix, both stale TOC race tests failed (`200 !== 409`); the real mounted
failed-scan test failed because the confirmation stayed checked. After the fix,
the route tests assert the exact public section response is unchanged, including
pending claim/evidence version, old review is stale, and overlapping scan/write
requests remain409 with one external mutation and one TOC request. The unchanged
merge control retains the original section ID/fingerprint and current review.
The mounted form regression passes with checklist and confirmation cleared and
Save disabled.

The first released-target health attempt preceded completion of its client build
and failed with `ENOENT .../client/dist/index.html`. After that build completed,
the same real server boot passed. Initial scratch commit hooks also failed on
missing `.husky/_/husky.sh`; scratch-only commits then used an explicit per-command
empty hook path after the recorded test/build checks. No repository hook settings
were changed. Raw logs remain in `/tmp/conductor-lt126-evidence` on the test host.

## Remaining gates

The Chief authorized one existing TestSprite A+C run after LT-126 and LT-131;
that combined check has not run in this slice. Paid B is not repeated: its earlier
control assertions were inconclusive. Mounted form tests provide targeted B
regressions, not a replacement claim that its earlier paid run passed.

Tenant opt-in/configuration LT-131, signer and authenticated outcome recovery
LT-140/LT-127, LT-128 performance, Linux/container and patch CI, actual coordinated
services, production topology/auth, immutable images and upgrade/rollback remain
release gates. No live server/provider/credential provisioning, upstream push,
public Bridge access or deployment occurred.
