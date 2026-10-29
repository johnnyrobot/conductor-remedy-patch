# LT-178 current candidate provenance

The packaging entry point is [current-candidates.json](current-candidates.json).
Both target manifests now reference the same tested32-patch source trees and
images. Their former24-patch `linuxCandidateValidation` entries are retained as
`historicalLinuxCandidateValidations`; the original
[LT-158 receipts](evidence/lt158/verified-candidates.json) are unchanged.

This correction changes metadata and candidate CI helpers only. All64 original
patch files are unchanged. The indexed images were executed in successful
[run40962740223](https://github.com/johnnyrobot/conductor-remedy-patch/actions/runs/40962740223),
attempt1, against reviewed head `9bccf4806bf5289dc297796ffa770c1ac50935df`.
GitHub's PR merge checkout was `1d264023c12baabe21cd32fc1e4f8a1a7b4b328f`;
both have repository tree `fd9865d97cb89494162999fa1e8c2080f3ef84f1`.
The original executed manifests and validation receipts are preserved byte for
byte in [evidence/lt178](evidence/lt178). Their hashes describe execution inputs,
not the subsequently corrected delivery manifests. The index separately hashes
the current manifests. It does not require a documentation commit to rebuild
an unchanged image or claim that such a rebuild happened.

| Target | Applied source tree | Download artifact | Expiry (UTC) |
|---|---|---|---|
| staging67301b35 | `1edf0ba1516e39731f5c3289e31045bffda311f3` | [12936278741](https://github.com/johnnyrobot/conductor-remedy-patch/actions/runs/40962740223/artifacts/12936278741) | 2026-11-12 22:10:26 |
| release2.156.2 | `a60544214de7d3613e1dad0da99a6c62722c49a8` | [12936304442](https://github.com/johnnyrobot/conductor-remedy-patch/actions/runs/40962740223/artifacts/12936304442) | 2026-11-12 22:13:20 |

The index includes upstream repository/base pins, ordered patch checksums,
Dockerfile/.dockerignore/package/lock hashes, runtime-pins hash, exact Node base
and Mongo fixture digests, original workflow/helper hashes, current/executed
manifest hashes, receipt hashes, test counts and the six compiled phases.
The two pinned targets, modes and operational guides remain in the root README.

## Download and independently verify

Use a reviewed checkout of this delivery repository, Node22, Python3.11 or newer,
GitHub CLI with authorized artifact read access, and enough temporary disk space
(about1GB for both ZIPs plus one temporary saved image). No Docker daemon is
needed for this offline verification. These commands do not execute an image,
start a service, publish it or inject credentials. Use fresh filenames; retain
existing downloaded evidence separately.

```sh
node tools/candidate-provenance.mjs --require-unexpired

gh api repos/johnnyrobot/conductor-remedy-patch/actions/artifacts/12936278741/zip \
  > /tmp/lt178-staging-artifact.zip
python3 tools/verify-candidate-archive.py docs/releases/current-candidates.json \
  staging-67301b35 /tmp/lt178-staging-artifact.zip

gh api repos/johnnyrobot/conductor-remedy-patch/actions/artifacts/12936304442/zip \
  > /tmp/lt178-release-artifact.zip
python3 tools/verify-candidate-archive.py docs/releases/current-candidates.json \
  release-2.156.2 /tmp/lt178-release-artifact.zip
```

Check each command succeeds before using its result. The offline verifier checks
ZIP digest, exact validation/executed-manifest/runtime-pin receipts, source and
patch inputs, saved-image archive digest, Docker configuration digest and every
uncompressed image layer against that configuration. It checks Linux/amd64,
Node version, default `node dist/server.js`, source revision label and absence of
injected private runtime environment. It never extracts arbitrary archive paths
or loads/runs the image. The recorded default Docker user is empty (upstream
root default); no rootless/non-root support is claimed.

These are three **different** identities:

- `artifactDigest`: GitHub ZIP bytes, including reports and logs.
- `archiveSHA256`: contained compressed Docker-save image bytes.
- `imageID`: Docker configuration SHA-256, bound to its uncompressed layers.

None is a published registry manifest digest. Local tags are labels, not rollout
identities; never select `latest`. No registry publication is supplied here.

Artifact expiry is not extended by downloading or copying a ZIP. If either
artifact is expired/unavailable, stop packaging and run the reviewed Linux
workflow on the intended source inputs, independently verify the new artifacts
and update/review the index. New image/build timestamps may produce different
identities even with unchanged source; do not silently substitute them. Normal
structural helper tests can inspect expired historical receipts, but the
`--require-unexpired` packaging check refuses them. The artifact verifier alone
checks bytes, not availability or expiry; run both commands.

## CI changes and evidence limits

LT-178 adds run_attempt to upload names so reruns preserve earlier artifacts,
a safe fixture failure type/known-route diagnostic without messages, stacks,
headers, assertion values or unknown URLs, and an assertion before Docker build
that all three reconstructed stages use the reviewed CONDUCTOR_NODE_IMAGE pin.
It also records source-file hashes and compares them with the selected index.
Regression tests reject stale candidate/tree/base/patch/manifest references,
expired packaging, image/ZIP/archive substitution and tampered image layers.
The original mismatch was reproduced before correction.

The LT-178 workflow run validates these changed CI helpers on both actual Linux
targets; it creates additional evidence, not an implicit replacement for the
explicitly indexed LT-180 image IDs. Index selection changes require review.
Neither a passing helper nor a metadata commit is a new image execution receipt.

The indexed run passed80/299/94 staging and50/206/94 release server/client/
authenticated JWT+Mongo tests, both builds, baseline-relative typecheck and six
compiled production phases: off, enabled, recover, review-only, terminal-write,
terminal-recover. Standalone typecheck still reports60 inherited diagnostic
lines on each target. Internal protocol fixtures are synthetic; actual owned
Conductor→Server→Bridge proof is separately recorded in
[LT-180](lt180-terminal-recovery.md). Full owned-stack Linux topology, production
SSO/providers/config/backup/restore/upgrade/rollback acceptance remain global
gates. This is not production approval.

One full integration is retained, with optional explicitly selected review-only
mode. LibreTexts' integration/deployment team owns vendor atomic conditional-write
validation, write enablement and rollout timing. See the [root README](../../README.md),
[configuration/storage guide](../integration/pinned-targets.md), applied
`docs/remedy-terminal-recovery.md` and `docs/remedy-storage-and-reads.md` for
operator/export/backup/rollback steps, and Server's `deploy/stack/README.md` for
the coordinated deployment entry point. This correction changes none of those
runtime policies.
