// Synthetic internal protocol fixture, never an accessibility engine certification.
import fs from "node:fs";
import https from "node:https";
import { createHash, randomUUID, verify } from "node:crypto";
import assert from "node:assert/strict";
import { MongoClient } from "/usr/src/conductor/server/node_modules/mongodb/lib/index.js";
const root = "/fixture",
  config = JSON.parse(fs.readFileSync(root + "/engine.json")),
  criteria = JSON.parse(fs.readFileSync(root + "/criteria.json")),
  client = new MongoClient(config.mongoURI);
await client.connect();
const db = client.db();
const hash = (text) => createHash("sha256").update(text).digest("hex"),
  previews = new Map(),
  operations = new Map();
let html = "<p><strong>Chapter</strong></p>",
  mode = "success",
  writes = 0,
  calls = 0,
  scanCalls = 0;
const metadata = (outcome, operationID = randomUUID()) => ({
  operation_id: operationID,
  action: "cxone.apply",
  outcome,
  reason: outcome === "unknown_write" ? "write_outcome_unknown" : null,
  applied: outcome === "unknown_write" ? null : true,
  restored: false,
  audit_recorded: outcome === "unknown_write" ? null : true,
  requires_reconciliation: outcome === "unknown_write",
  reconciliation: outcome === "unknown_write" ? "required" : "none",
  evidence_effect: "invalidate",
  updated_at: new Date().toISOString(),
});
const server = https.createServer(
  {
    key: fs.readFileSync(root + "/tls.key"),
    cert: fs.readFileSync(root + "/tls.pem"),
  },
  async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.headers["x-api-key"] !== config.key) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ err: true }));
    }
    try {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 100000) throw Error("fixture request budget");
      }
      const body = raw ? JSON.parse(raw) : {};
      if (req.url === "/control") {
        if (body.mode) mode = body.mode;
        if (body.resolve) {
          const value = operations.get(body.resolve);
          assert.ok(value);
          assert.equal(value.outcome, "unknown_write");
          operations.set(body.resolve, {
            ...value,
            reconciliation: "resolved",
            requires_reconciliation: false,
            updated_at: new Date().toISOString(),
          });
        }
        return res.end(
          JSON.stringify({
            writes,
            calls,
            scanCalls,
            sourceHash: hash(html).slice(0, 16),
            renderedHash: hash(html),
          }),
        );
      }
      if (req.url === "/v1/cxone/health")
        return res.end(
          JSON.stringify({
            ok: true,
            capabilities: {
              scan: true,
              preview: true,
              mutate: true,
              operation_status: true,
            },
          }),
        );
      calls++;
      if (req.url === "/v1/cxone/page/scan") {
        scanCalls++;
        const at = new Date().toISOString(),
          sourceHash = hash(html).slice(0, 16);
        return res.end(
          JSON.stringify({
            page_id: "1",
            page_path: config.pagePath,
            page_url: config.pageURL,
            scanned_at: at,
            findings: html.includes("<strong>")
              ? [
                  {
                    id: "heading-1",
                    ruleId: "heading-as-bold",
                    fixable: true,
                    message: "Synthetic heading defect",
                  },
                ]
              : [],
            wcag_review: {
              sourceHash,
              scannedAt: at,
              criteria: criteria.map((c) => ({
                ...c,
                status: "manual_review",
              })),
              rendered: {
                state: "complete",
                sourceHash,
                renderedHash: hash(html),
                platformHash: hash("synthetic fixture"),
                browser: "synthetic",
                axeVersion: "synthetic",
                scannedAt: at,
                violations: [],
              },
            },
            doj_exceptions: [],
          }),
        );
      }
      if (req.url === "/v1/cxone/page/preview-fix") {
        const before = html,
          after = `<h3>Chapter ${writes + 1}</h3>`,
          token = randomUUID(),
          binding = {
            action: "cxone.apply",
            target: {
              hostname: "dev.libretexts.org",
              page_id: "1",
              page_path: config.pagePath,
            },
            preview_token: token,
            before_sha256: hash(before),
            after_sha256: hash(after),
            fix_mode: "deterministic",
            tier: null,
            snapshot: null,
          };
        previews.set(token, { binding, after });
        return res.end(
          JSON.stringify({
            before_html: before,
            after_html: after,
            diff: "Synthetic before/after protocol fixture",
            preview_token: token,
            preview_hash: hash(token),
            review_binding: binding,
            review_expires_at: Math.floor(Date.now() / 1000) + 300,
          }),
        );
      }
      if (req.url === "/v1/cxone/page/operation-status") {
        const result = operations.get(body.issuer + ":" + body.jti);
        if (!result) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ err: true }));
        }
        return res.end(JSON.stringify(result));
      }
      if (req.url === "/v1/cxone/page/apply-fix") {
        const preview = previews.get(body.preview_token);
        assert.ok(preview);
        const [header, payload, signature] = body.reviewer_assertion.split("."),
          head = JSON.parse(Buffer.from(header, "base64url")),
          claims = JSON.parse(Buffer.from(payload, "base64url"));
        assert.equal(head.alg, "Ed25519");
        assert.equal(head.kid, config.kid);
        assert.equal(
          verify(
            null,
            Buffer.from(header + "." + payload),
            fs.readFileSync(root + "/signer-public.pem"),
            Buffer.from(signature, "base64url"),
          ),
          true,
        );
        assert.equal(claims.iss, config.issuer);
        assert.equal(claims.aud, config.audience);
        assert.equal(claims.sub, config.editor);
        assert.deepEqual(claims.binding, preview.binding);
        assert.ok(claims.exp > Math.floor(Date.now() / 1000));
        const persisted = await db
          .collection("remedyoperationrecords")
          .findOne({
            projectID: config.projectID,
            kind: "intent",
            issuer: claims.iss,
            jti: claims.jti,
          });
        assert.ok(
          persisted,
          "compiled producer must journal intent before dispatch",
        );
        const project = await db
          .collection("projects")
          .findOne({ projectID: config.projectID });
        assert.equal(project.a11yReview[0].remedyWritePending, true);
        html = preview.after;
        writes++;
        previews.delete(body.preview_token);
        const result = metadata(
          mode === "unknown" ? "unknown_write" : "known_success",
        );
        operations.set(claims.iss + ":" + claims.jti, result);
        return res.end(JSON.stringify(result));
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ err: true }));
    } catch {
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          err: true,
          errMsg: "Synthetic protocol assertion failed.",
        }),
      );
    }
  },
);
server.listen(8443, "0.0.0.0");
process.on("SIGTERM", () =>
  server.close(async () => {
    await client.close();
    process.exit(0);
  }),
);
