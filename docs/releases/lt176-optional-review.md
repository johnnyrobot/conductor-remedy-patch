# Optional review-only rollout in the full Conductor integration

LT-176 adds explicit authenticated `cxone-review-v1` consumption while preserving
the signed apply/restore, status, explicit recovery, exports and reviewer flows.
LibreTexts chooses rollout timing; automatic production writes remain held for
vendor-supported revision-atomic conditional edits and authorized validation.
The integration/deployment team owns that enablement. This is no CAS workaround.

## Exact compatibility references and configuration

Bridge contract: `28f37e2b57d3cf05308c19f5e363ff6f782cd837`,
[`docs/release/lt-174-review-only-profile.md`](https://github.com/johnnyrobot/libretexts-remedy-bridge-dev/blob/28f37e2b57d3cf05308c19f5e363ff6f782cd837/docs/release/lt-174-review-only-profile.md).
Actual Server HTTP forwarding used
`3fa8ed592bbe41f1f1a9adab4888dfaa1a9e2d71`. Those services were real snapshots;
only external CXone behavior was synthetic. This does not finish LT-175 packaging
or certify a production topology.

Select `REMEDY_BRIDGE_PROFILE=review-only` on Bridge; Conductor introduces no
second mode flag. Keep the existing explicit default-off tenant/project/engine
opt-in, private service authentication and authorized CXone read configuration
listed in the [root README](../../README.md#feature-opt-in-and-mode-configuration).
Scan and preview require no Conductor signer or writable Bridge claim ledger.
Historical operation status remains optional and independently authorized.
Omitted profile metadata is legacy full-write, never inferred as review-only;
unknown/inconsistent profiles or nonboolean capabilities fail closed.

Conductor checks authenticated readiness again before page actions. Review-only
apply/restore stop before signing, immutable intent, preview consumption or remote
mutation dispatch. The matrix retains scans/previews and reviewer tools, disables
apply, and directs manual edits to the normal book editor. Page tools hide apply
and restore controls. Changed manual content requires fresh canonical evidence;
previews/task checkboxes never certify content or human conformance. Optional AI
and rendered-browser tools retain their actual request-specific failures.

## Component checks actually performed

Both target series preserve the first 24 patch bytes and add patches 25–28.
Fresh detached scratch checkouts reconstructed through the shipped manifest CLI (current receipts are staging-apply28.json and release-apply28.json; earlier receipts retain the earlier review candidate):

| Target | Final source tree | Server | Client | Actual router/JWT/Session/Mongo |
|---|---|---:|---:|---:|
| staging `67301b35` | `fcfb5e47581bf08ff89747f9e0d5527efcc0ab3e` | 62 | 298 | 74 |
| v2.156.2 `352a657e` | `7081093bf9f53adee74a0fbb0803140fa37b574c` | 32 | 205 | 74 |

Client/server builds pass with Node22.20.0. Local unchanged-lockfile dependencies
were reused from each independently installed matching target; Linux CI performs
fresh installs. Local Mongo8.0.5 was isolated loopback; Linux uses pinned7.0.14.
Baseline-relative standalone typecheck and new compiled-image phase results must
be recorded before merge; the existing60 inherited diagnostics are not a pass.

The actual readiness regression failed before the change, as did valid-preview
crafted-write denial and the mounted review-only restore-control test, then
passed. Full signed-write/recovery regressions remain. Malformed capability and
unknown profile cases, manual source-change freshness and permission failures are
covered through actual registered routes. Review identified a latched read-failure retry blocker, including the matrix readiness helper and standalone API initialization; an authenticated deliberate scan/preview retry now reaches Bridge without declaring it healthy or allowing mutation. New dependency-retry regression ran red then green, and actual three-service recovery now retries through Conductor itself. The standalone demo entry uses the typed API and React Query rather than ad-hoc component fetching. Both actual matrix and page tools are
mounted in UI regressions.

[Actual three-service observations](evidence/lt176/actual-owned-http.json) prove
source scan/preview with no configured Conductor signer, normal authentication,
crafted Conductor apply/restore denied without intent or preview consumption,
cryptographically valid Bridge mutation requests rejected, zero external writes,
read-dependency failure/recovery and human conformance still pending. The local
owned-worker fixture startup required its real dependency directory and inherited
external-adapter loader; failed fixture attempts were retained, not reported as
product passes. All nonfixture network egress was denied.

## Remaining gates

Both compiled Linux image phases and the required review gates must pass before merge; exact CI and review receipts belong on the pull request. The focused TestSprite verdict/artifact assessment is recorded below. Existing
full-write A/B are not relabeled or rerun. The new UI flow has a separate name.

LT-180 terminal-proof recovery still awaits LT-179. Read-only lookup cannot release
claims; unknown operations still require the existing durable operator resolution
and explicit authorized fresh-scan/CAS path. No signing/claim/retry policy is
weakened. Server lifecycle/submission, Scanner host-security proof, LT-175 full
owned-stack topology/package, immutable compatible image bundle, real provider/
SSO/tenant policy and operator backup/upgrade/rollback acceptance remain global
gates. The applied `docs/remedy-storage-and-reads.md` and
`docs/remediation-integration.md` retain storage/rollback requirements. Both
manifests continue to state `deploymentReady:false`.


## Focused TestSprite assessment

Separate review-only test `cb75f5e0-aca6-47c3-a554-3981fcf000d8`, run
`42805ec7-f535-4938-8fa8-938292482d4c`, ended **blocked at sign-in**. The six-step
trace never reached the feature: login remained busy and direct project
navigation reached the login/internal-error page. Actual local authentication
and product routes passed on both targets, but that does not turn the tunneled
run green. The run's result, authored plan and redacted steps are adjacent in
`evidence/lt176`; failure bundle/video were inspected separately as private
artifacts. The synthetic tunnel was only Conductor, never Bridge. No paid retry,
old A/B relabeling or claim of full UI automation coverage is made.
Observed usage was466.8 before and466.8 after the blocked run: net delta0.0; the
CLI reports0.5 credits per run. Remaining authorized1.5-credit allowance was not
used to repeat an environment failure. Earlier B remains inconclusive.
