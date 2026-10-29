# Pinned Conductor targets and operating assumptions

LT-130 / LT-132 implement the target decision under LT-115 and LT-111. These
workstreams do not establish production readiness. Actual production version,
Atlas tier, cluster topology and orchestrator are unknown.

## Selected targets and deterministic application

| Role | Upstream commit | Version context | Delivered tree |
|---|---|---|---|
| Primary staging | `67301b35c3784ed73ba1a65011ef5a1d689abca1` | Root package says 2.156.2; Chief assessment reported image label 2.157.0-rc.4 | `ef76457706e242dade7be7d4d5dae9fb0f22e26f` |
| Secondary released floor | `352a657ec6de7b317a70ad3f8f744bc6d5054d9d` | v2.156.2 | `96e14fc333d2006d2d7f26bb611ae1ed517d2bfa` |

The image label is assessment context, not a pulled/booted image or observation of
production. Do not use `latest`; approved deployment must pin compatible image
versions and digests. This work preserves the upstream Dockerfile and supplies
source/patch integrity manifests, not a finished image/deployment bundle.

Use the explicit fresh detached-checkout command in the repository README. Each
manifest binds the full base commit, twenty-two ordered patch files, SHA-256s and
final Git tree. The application tool checks those inputs and repository state
before `git am --3way`, then checks the resulting tree. It makes no network call,
reset, abort, branch deletion or push. On unexpected Git failure it preserves the
checkout for inspection. `--check` checks input/checkout preconditions only; it
does not run tests or simulate the whole application.

Applied commit hashes can vary with committer metadata. Source-tree identity and
patch checksums are the deterministic contract. The zero-commit mail headers in
regenerated series avoid treating a reconstruction's committer hash as a runtime
version. Original authors and patch descriptions are retained. The historical
root `patches/` and old base `1c1a5ec1` remain unchanged for reproduction, but are
retired as the recommendation for new integration.

## Preserved upstream behavior and missing fork delta

Both targets retain their existing server/client dev, test and visual scripts,
all dependency declarations, and lockfiles. Staging already has
`node --import tsx --test "util/**/*.test.ts"`; it is retained. The released floor
has no server test script or upstream util test cases, so the series adds that
native command. The separately added Remedy integration command is retained.

The fork delta `c0fb69de87f9cb90b9af87aa174d13b32ec6bed5` and `5312d58d` resolve to
identical tree `068d3ab70838f0fc9f8b7df6773188c5385a0ccf`. Existing patch 0015
already routes matrix actions through stored targets and session-derived
`requested_by`. The new target patch 0017 preserves the omitted actual matrix
no-op presentation test, displays a non-success no-op result, and verifies matrix
apply attribution through the real registered/authenticated route. It does not
copy the old mocked direct-handler test, symlink removals or unrelated fork work.
The matrix no-op regression was run red before the presentation correction.

Staging has two inherited test-harness defects, reproduced on its unpatched
control and corrected explicitly in its target patch 0017:

- Vitest collects three `visual-tests` Playwright suites and fails before running
  them. Default Vitest exclusions plus that directory keep those suites with
  their existing, unchanged Playwright commands. No visual test is deleted and
  no passing unit test is excluded. Those separate visual journeys were not run.
- A reference sanitizer test expects script text to remain, although the shared
  sanitizer uses the installed `sanitize-html` default `nonTextTags`, documented
  to discard script contents. The strict expected plain text is corrected from
  `Introalert(1) to Bio` to `Intro to Bio`; markup rejection remains asserted.
  Sanitizer runtime code is unchanged. The dependency's README documents the
  policy under “Discarding the entire contents of a disallowed tag.”

The released target does not need those staging-only corrections.

## Validation actually performed

Fresh client/server `npm ci --no-audit --no-fund` ran independently on both targets
under Node **22.20.0**, npm **10.9.3**, macOS arm64. Control checkouts reused the
identical target's installed dependency tree by symlink after lockfile equality
was checked; no baseline dependency substitution was made.

| Check | Staging | Released floor |
|---|---|---|
| Unpatched server baseline | 29/30 pass; stale expectation above | No upstream util tests/test script |
| Delivered server unit runner | 55/55 pass | 25/25 pass |
| Unpatched client baseline | 252 unit cases pass; 3 framework collection failures | 159/159 pass |
| Delivered client unit runner | 270/270 pass | 177/177 pass |
| Actual router, bcrypt login, signed JWT/Session, Mongo and fake external provider | 12/12 pass | 12/12 pass |
| Client/server builds | Pass/pass | Pass/pass |
| Standalone server typecheck | 60 diagnostic lines, same normalized multiset as control | 60 diagnostic lines, same normalized multiset as control |
| Real built-server health | HTTP 200, Mongo connected | HTTP 200, Mongo connected |

Typecheck normalization removes source line/column shifts and equivalent absolute
or dependency-symlink prefixes only. Full standalone server typecheck remains
failing; a successful bundle is not a typecheck pass. Client typechecking is part
of each successful build. The application command also passed Node 22 tests for
successful real Git application, checksum rejection before mutation, dirty-file
preservation, active-branch refusal, preflight-only behavior and path containment.

The real built servers were started with the upstream Node entrypoint in
`NODE_ENV=production`, synthetic config, telemetry disabled and non-fixture egress
denied. Initial boot correctly failed on missing upstream Mailgun configuration;
synthetic `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` values satisfied the constructor
without sending mail. Each real `/health` returned 200 with Mongo readyState 1,
then the fixture was stopped. Mongo **8.0.5** was a disposable loopback standalone.
The upstream log wording “MongoDB Atlas” is not evidence that Atlas was tested.

Docker daemon was unavailable (missing socket); no desktop activation, image
pull/build/boot, musl runtime or production TLS/cookie test is claimed. No live
CAS, CXone, ADAPT, Remedy or AI provider was used. External guard/preflight evidence
and focused authorized TestSprite run IDs/verdicts are recorded in LT-130 and the
compatibility PR; those runs do not verify the unresolved release gates.

To replay the route tests, use a dedicated loopback MongoDB with no retained data.
The suite requires a URI named with `conductor_test_` and drops that database.
In the patched checkout, choose a private temporary HOME and explicit Node 22 PATH
so unrelated service credentials are not inherited. For example, from its root:

```bash
conductor_test_home=$(mktemp -d /tmp/conductor-test-home.XXXXXX)
conductor_node22=/absolute/path/to/node22/bin
cd server
env -i PATH="$conductor_node22:/usr/bin:/bin" HOME="$conductor_test_home" \
  NODE_ENV=test CONDUCTOR_TEST_MONGO_URI=mongodb://127.0.0.1:27130/conductor_test_remedy \
  npm run test:remedy-integration
```

Provision only that disposable local database before the command. Do not copy real
keys into the test environment. Full stack/provider and deployment validation is
separate; unit and route fixtures cannot certify it.

## Open PR #1014 composition

Compatibility used immutable head `650f408f5bdd1ba575080eeec90338b0b0ba8d89` while
[upstream PR #1014](https://github.com/LibreTexts/conductor/pull/1014) was open.
A local scratch composition of the selected staging pin plus that one PR commit
accepted all seventeen patches cleanly. Compared with the patched staging target,
only the PR's seven files changed; all four “Accessibility Remediation” title,
heading and breadcrumb occurrences survived, as did the renamed client route and
server redirect preserving query strings. Its 270 client tests, client/server
builds and real health/302 redirect boot passed. This composition is not shipped
as a third target and no upstream merge or push was performed.

## Tenant configuration policy — LT-131

New server Remedy behavior must be explicitly enabled per deployment/tenant,
default disabled. A client-only visibility flag is not authorization. Enabled
production use requires an explicit engine URL and API key; container-local
localhost is not an implicit engine address. Missing or invalid optional config
must produce a useful feature-unavailable/preflight result without crashing
unrelated Conductor functionality or enabling every campus.

Patch0019 implements this policy on both pinned targets. Set `REMEDY_ENABLED=true`
and `REMEDY_ORG_ID` exactly matching startup `ORG_ID`; each accessed Project must
also have that stored organization. Cross-tenant support access cannot enable
another organization. Missing/false opt-in or missing/invalid explicit engine
origin/key produces unavailable responses with zero external calls. No legacy
alias or implicit localhost is used. Off-host engine URLs require HTTPS; explicit
same-host HTTP loopback is allowed for local fixtures. Redirects are refused.

The authenticated project-scoped health route returns safe effective capability
and fixed messages. It preflights feature storage and authenticated engine
`/v1/cxone/health`, requiring scan/preview/mutate capabilities rather than public
liveness. The mounted UI follows that result. Disabled or unavailable optional
Remedy does not prevent ordinary project reads or real Conductor health boot.
A multi-organization process needs an explicitly approved mapping; this delivery
opts in only its one named deployment organization. Production credential
provisioning and rollout remain owner-only.

[LT-131 validation](../releases/lt131-tenant-opt-in.md) records current checks and
config controls; the compatibility table above remains historical evidence.

## Mongo collections, indexes and backup implications

| Collection/data | Required index or relationship |
|---|---|
| `remediationworkitems` | Automatic `_id`; unique compound `{projectID:1,key:1}` for import deduplication |
| `conformancerecords` | Automatic `_id`; lookup `{projectID:1,kind:1,createdAt:-1}` for append-only scope/review/sign-off records |
| Private `projects.remedyOperations` | Atomic append-only intent/response history, excluded from ordinary project reads; grows within the Mongo document limit |
| Existing `projects.a11yReview` | Stable section `_id`, source/rendered fingerprints, evidence revision and pending-write state |

These models compile lazily and disable automatic collection/index creation.
Configured health preflight and authorized work-queue requests explicitly create the two
collections and declared indexes; failures report unavailable and do not crash
unrelated startup. Successful readiness is cached in-process; external index
changes require operator preflight/restart. Generic Mongo connection health alone
does not establish feature-index readiness. Confirm collection/index creation privileges and index readiness before
enabling the feature; identify duplicate project/key pairs before creating a
unique index on retained data. No automatic deduplication/deletion is authorized.
Disabled optional Remedy does not compile either feature model at route import.
The first enabled feature request needs collection/index creation privileges;
no automatic retained-data repair or index deletion is performed.

Work-item history/evidence arrays and append-only conformance records grow; no
retention or compaction policy is introduced here. Back up Projects, work items,
conformance records and referenced user identities consistently. A restore must
preserve section identity, current evidence versions and pending claims and must
be reconciled with Bridge's operation/snapshot ledger and trust epoch. Never clear
an uncertain claim or replay a write just because a backup was restored. Actual
Atlas service tier, Mongo version/sharding, index-build windows, storage, backups
and orchestrator are unknown and require the deployment owner's assessment.

## Remaining release gates

Patch 0018 addresses LT-126 stale TOC overwrite and failed standalone-scan parent
refresh; [current regression evidence](../releases/lt126-evidence-import.md) records
both target checks separately from the compatibility evidence above. Patch0020
implements the approved signed producer, matched no-op preservation and scoped
read-only recovery; LT-127 retains separately audited administrative resolution.
[actual integration evidence](../releases/lt140-reviewed-operations.md) records
precisely which service commits/runtime/scenarios passed. Audited administrative
resolution remains separate. LT-128 performance/read bounds, deadlines/cancellation, automated patch CI, full-stack Linux/auth/provider
failure/restore coverage, immutable image bundle and reviewed upgrade/rollback
handoff remain open under LT-115/LT-111. Compatibility validation retires the old
recommended source base; it does not clear those production gates.
