# LT-158 pinned Linux candidate pipeline

**Historical 24-patch execution only.** Do not select these artifacts for the
current32-patch delivery. Use the [current index and verification instructions](lt178-current-candidates.md).
The receipts below are preserved; later terminal-proof recovery does not rewrite this history.

Both Linux matrix targets passed [run 40928445744](https://github.com/johnnyrobot/conductor-remedy-patch/actions/runs/40928445744).
The downloaded image archives, configuration IDs, entrypoint, architecture,
Node version, source tree/manifest binding and absence of injected runtime
credentials were independently checked. The local Docker daemon is unavailable;
all image execution was real GitHub-hosted Linux, with no host/tsx substitute.

| Target | Server / client / real auth-Mongo tests | Compiled production phases | Artifact |
|---|---|---|---|
| Staging | 62 / 293 / 66 pass | default-off, enabled, signer-disabled recovery pass | [12921309459](https://github.com/johnnyrobot/conductor-remedy-patch/actions/runs/40928445744/artifacts/12921309459) |
| Released floor | 32 / 200 / 66 pass | default-off, enabled, signer-disabled recovery pass | [12922860330](https://github.com/johnnyrobot/conductor-remedy-patch/actions/runs/40928445744/artifacts/12922860330) |

Both client/server builds pass under host Node 22.20.0; actual final images run
Node 22.22.3 on Linux/amd64. Both controls and delivered source retain exactly
60 standalone typecheck diagnostic lines and exit 2, with identical normalized
full-output hashes. That is baseline-relative success, not a standalone pass.
Exact image/archive IDs, SHA-256, input-manifest SHA, tested delivery merge
commit, artifact digests/expiry, runtime-user value and counts are in
[verified-candidates.json](evidence/lt158/verified-candidates.json). The tested
input manifests originally said Docker boot unverified; these metadata-only
results now reference the same unchanged source trees/checksums. Full raw logs
are retained in artifacts and downloaded under `/tmp/conductor-lt158-evidence`.

The first run failed honestly: release used an invalid dotted database name;
staging correctly rejected an empty finding selection in the protocol fixture.
No product validation was weakened. Explicit valid database names and an actual
current nonempty fixture finding corrected both failures. Persisted post-write
scan evidence and partial-startup cleanup assertions were also strengthened.

The GitHub workflow reconstructs each pinned target from fresh control/patched
clones, applies its complete manifest, independently installs unchanged lockfile
dependencies, runs Node 22 tests/builds and real authenticated Mongo routes, and
compares the complete standalone server typecheck output with its control.
Normalization removes only corresponding absolute checkout roots, ANSI format
and shifted source positions; every diagnostic/context line and exit status
remains. A failed command without compiler diagnostics cannot masquerade as an
inherited typecheck. Current standalone errors remain explicit, never suppressed
with skipLibCheck/exclusions or presented as a full typecheck pass.

Patch 0024 changes only the existing upstream Dockerfile's three Node 22 Alpine
FROM references to one reviewed immutable digest via a global argument. All
builder/copy/runtime/health/entrypoint steps remain the actual upstream recipe.
Official registry index and linux/amd64 child digests are recorded in
[evidence](evidence/lt158/registry-pins.json), and test MongoDB is pinned too.
Do not override the base argument or use latest without new validation.

The actual final image runs its default `node dist/server.js` entrypoint in
NODE_ENV=production against a standalone MongoDB 7.0.14 fixture on a Docker
internal network. No development loader, host source server or replacement app
answers its health/API checks. Native Node scripts inside that image seed only
synthetic users/projects and exercise real fallback sessions, Mongo permissions,
default-off/no optional collection initialization, enabled project capabilities,
actor/auditor/foreign denial, reviewed acknowledgement, native Ed25519 producer,
intent-before-dispatch observation, apply/rescan, replay denial, unknown hold and
signer-disabled explicit local resolution/complete export. The internal HTTPS
engine is a deliberately synthetic protocol fixture; it verifies signatures and
persistence rather than pretending to be the real Server/Bridge. Full assembled
owned-service Linux topology remains the Server-owned LT-111 gate. The actual
three-service/offline Bridge proof on macOS is separate LT-127 evidence.

Private test signer/TLS/account files stay outside the build context and artifact
output. Only the app mounts the private reviewer key; the fixture engine receives
its public key. Containers/volumes/network and generated credential files are
cleaned by the verifier. Sources/failure logs/reports remain for inspection. No
registry push, live provider, credentials rollout or production cutover occurs.

## Replay and artifacts

On an isolated Linux Docker host, using Node 22 and a disposable loopback MongoDB
named with conductor_test_:

```sh
node --test tools/apply-series.test.mjs tools/compare-typecheck.test.mjs tools/ci/loopback-only.test.mjs
node tools/validate-target.mjs series/staging-67301b35/manifest.json \
  /tmp/fresh-conductor-candidate \
  mongodb://127.0.0.1:27158/conductor_test_candidate
```

Choose a fresh directory: the script refuses existing workspaces and never
resets/deletes an existing checkout. It leaves reports/logs after failure. The
workflow runs the same command for both supported targets and preserves candidate
image archives, their SHA-256, image ID/architecture/entrypoint, exact manifest,
runtime pins, complete check logs and explicit typecheck statuses. Artifacts live
only in johnnyrobot/conductor-remedy-patch, labeled candidate with 14-day retention.
Archive expiry requires a new run; an unverified replacement is never deployment
approval. No upstream image/repository is overwritten.

## Runtime assumptions and remaining gates

- The upstream final image's default user is recorded exactly; no untested
  non-root behavior is claimed. Mount signer material with suitable permissions.
- Remedy defaults off and requires tenant/org, explicit authenticated HTTPS
  engine origin and the seven signer settings before reviewed writes. Test HTTPS
  uses a generated trusted CA, never disabled certificate verification.
- Upstream currently uses the first PRODUCTIONURLS entry as JWT issuer/audience
  and cookie domain. The fixture uses a hostname first and an explicit HTTPS
  origin next. Production must coordinate valid cookie domain/origin/TLS and real
  identity configuration; native API session tests are not browser/SSO proof.
- Persist Projects (including private resolution commit markers), work items,
  conformance and immutable operation records consistently with Bridge's
  independent ledger/fence/snapshots/trust epoch. Index/preflight privileges and
  backup/drain/upgrade/downgrade rules are in the applied storage/recovery guides.
- Known-success/lost-local-reply settlement still lacks a durable resolved
  contract. Vendor conditional-write proof, real providers/auth/topology,
  credential provisioning and operator deployment/rollback acceptance remain
  global release gates. Candidate artifacts do not remove the production hold.

Both original twenty-patch deliveries, later patch history, historical evidence
and retained branches remain preserved. deploymentReady stays false.
