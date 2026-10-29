# Conductor Remedy TestSprite results — 2026-10-28

[LT-108](https://linear.app/johnnyrobot/issue/LT-108) completed October 28, 2026, Pacific time, following the [LT-101 audit](./2026-10-28-conductor-remedy-audit.md). **Two tests passed; one confirmed a product failure.** No application fix was made. This is a documentation archive of completed execution, not a runnable regression suite or setup guide.

## Target and limits

The isolated real Conductor product used all 14 delivery patches from audited delivery commit [`832da9358a95cf6c0ebb981b351336b131bd5dee`](https://github.com/johnnyrobot/conductor-remedy-patch/commit/832da9358a95cf6c0ebb981b351336b131bd5dee), applied cleanly to upstream base `1c1a5ec103b76b6f47de9917204784fc3bba1eb0`. Its tracked product tree was `d2960fdbdd37100421e9b4649f7b4b8b90e9aebf`, matching LT-101. Existing product UI, routes, signed-session authentication and isolated Mongo persistence ran with synthetic accounts and deterministic external bridge responses. Only the disposable frontend was exposed to TestSprite; the bridge adapter remained local, with live egress denied. No live Conductor checkout or deployed service was used.

Local smoke checks confirmed ordinary login and rejection of wrong passwords, tampered/expired/wrong-issuer/wrong-audience tokens and invalidated sessions. Actual queue routes denied anonymous/outsider access, auditor mutations and foreign-section mutations, while allowing the synthetic editor. These queue checks do not clear the separate legacy matrix authorization finding in LT-101. A fresh client build passed; the prior 43 unit-test results and build baseline were not rerun for this test-only harness.

## Runs

CLI 0.15.0, Starter/V3. Project `4e433799-7c02-442f-8d07-1a99dce6620c`. Each Chief-reviewed test ran once after an independent synthetic reset; there were no retries, generated plans or full-suite runs.

| Flow | Terminal result | Test ID | Run ID | Dashboard |
|---|---|---|---|---|
| A: reviewed queue preview, apply and rescan | Passed; exit 0; 13/13 steps | `5b5f8d0b-1f54-44f3-aa02-4e680d3d9a4d` | `3d27e829-6d86-457e-b033-99c2124db7e0` | [A](https://www.testsprite.com/dashboard-v3/o/c66ab795-72b2-5244-b0a2-0c60b1512705/projects/4e433799-7c02-442f-8d07-1a99dce6620c/test-cases/5b5f8d0b-1f54-44f3-aa02-4e680d3d9a4d) |
| B: reconfirm after evidence changes | Failed; exit 1; 16 passed/1 failed steps | `5989a9bc-4b1c-4a89-b920-6bcb78987bce` | `dcc53b16-5692-4adc-82c8-ab8235f73771` | [B](https://www.testsprite.com/dashboard-v3/o/c66ab795-72b2-5244-b0a2-0c60b1512705/projects/4e433799-7c02-442f-8d07-1a99dce6620c/test-cases/5989a9bc-4b1c-4a89-b920-6bcb78987bce) |
| C: persist work-item verification separately | Passed; exit 0; 17/17 steps | `c3691d8c-3935-46a7-be87-1d2805f36561` | `b44a17cd-95f7-4f90-a8fd-82c83a32b30d` | [C](https://www.testsprite.com/dashboard-v3/o/c66ab795-72b2-5244-b0a2-0c60b1512705/projects/4e433799-7c02-442f-8d07-1a99dce6620c/test-cases/c3691d8c-3935-46a7-be87-1d2805f36561) |

**A:** Runtime assertions covered completed write/rescan, zero findings/failed matrix criteria and pending WCAG verification. Artifact inspection independently confirmed Apply was disabled before acknowledgement and enabled afterward; the runner did not emit that intermediate assertion. Persisted synthetic evidence and the adapter trace confirmed scan → preview → apply → scan, reviewer attribution and no conformance review records. No failure bundle existed for this passed run; run-specific snapshots/video were reviewed instead. Saved replay code was unavailable (`NOT_FOUND`, null code version).

**B:** After two rendered scans changed evidence A → B in the same selected section/criterion/scope, three boxes stayed checked, old notes/environment remained, and Save reviewer evidence stayed enabled. Before/after DOM, persisted rendered hash and video corroborated the runtime failure. No review was saved: this demonstrates stale form confirmation, not a stored invalid review. Source inspection found retained local form state and a key omitting the fingerprint. [LT-109](https://linear.app/johnnyrobot/issue/LT-109) tracks the unfixed defect. Its generated replay's final assertion only locates unreviewed text and was marked unevaluated at export; it does not encode the runtime confirmation-state judgment. The replay was not run and needs correction before adoption as a regression test.

**C:** The flow created/edited one work item, saved Verified status and the requested note, then filtered, refreshed and inspected history. Runtime assertions focused on the item/history. Supplemental authenticated API assertions, DOM and Mongo evidence established two history entries, correct reviewer/note, verification pending, zero verified criteria and criterion 1.1.1 still unreviewed, with no review/signoff records. Conformance independence was supported by those supplemental checks rather than a separate runner assertion. No adapter call or conformance mutation occurred.

The successful runs do not imply all requirements are encoded in exported replay assertions. No repeated click loop or action-count starvation was observed. Real scanner/AI accuracy, external service contracts, real accounts, deployments, full assistive-technology review and stored-code replay remain unverified.

## Credits, cleanup and retained evidence

Usage receipts recorded **491.8 → 490.3 credits: 1.5 credits**, exactly three runs at 0.5 each. There were no retries, upgrades or paid code reviews during execution.

Recorded cleanup invalidated synthetic sessions, removed stored synthetic password hashes, rotated generated signing/password files and cleared TestSprite environment credentials (`hasCredentials=false`). All owned tunnels were closed; final tunnel listings were empty. Only the owned product, adapter and Mongo processes were stopped; socket checks found no remaining listeners on their three local ports. No product source changes or fixes were introduced.

Detailed REPORT, bootstrap/cleanup instructions, raw receipts, logs, traces, snapshots, database projections and videos remain local-only under `docs/audits/2026-10-28-lt108-evidence/` and the disposable harness. They are excluded from this archive. Sensitive raw harness traces were protected locally; copied evidence had password inputs and signed artifact query strings redacted. No credentials, signed artifact URLs, executable harnesses or operational runbook are published here. This archive does not rerun execution or cleanup checks.
