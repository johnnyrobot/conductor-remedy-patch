import fs from "node:fs";
import assert from "node:assert/strict";
import {
  MongoClient,
  ObjectId,
} from "/usr/src/conductor/server/node_modules/mongodb/lib/index.js";
import bcrypt from "/usr/src/conductor/server/node_modules/bcryptjs/index.js";
const config = JSON.parse(fs.readFileSync("/fixture/app.json")),
  phase = process.argv[2],
  origin = "http://127.0.0.1:5000",
  base = `/project/${config.projectID}/accessibility/workqueue`,
  matrix = "/project/accessibility/remedy";
assert.match(process.version, /^v22\./);
assert.equal(process.env.NODE_ENV, "production");
assert.equal(
  fs.readFileSync("/proc/1/cmdline", "utf8").replaceAll("\0", " ").trim(),
  "node dist/server.js",
);
const client = new MongoClient(config.mongoURI);
await client.connect();
const db = client.db(),
  cookies = {};
if (phase !== "recover") {
  for (const [name, uuid] of Object.entries({
    editor: config.editor,
    auditor: config.auditor,
    outsider: config.outsider,
  }))
    await db
      .collection("users")
      .insertOne({
        uuid,
        centralID: "synthetic-" + name,
        email: name + "@candidate.example.invalid",
        firstName: "Synthetic",
        lastName: name,
        authType: "traditional",
        password: await bcrypt.hash(config.password, 4),
        roles: [{ org: "libretexts", role: "user" }],
        verifiedInstructor: true,
        uxAcknowledgments: {},
      });
  await db
    .collection("organizations")
    .insertOne({
      orgID: "libretexts",
      active: true,
      name: "Synthetic candidate",
      subdomain: "candidate",
      domain: "https://conductor.invalid",
      commonsModules: { projects: { enabled: true, order: 1 } },
    });
  await db
    .collection("projects")
    .insertOne({
      projectID: config.projectID,
      orgID: "libretexts",
      title: "Synthetic compiled runtime",
      status: "open",
      classification: "construction",
      projectURL: "",
      libreLibrary: "",
      libreCoverID: "",
      contentArea: "Synthetic",
      visibility: "private",
      members: [config.editor],
      leads: [],
      liaisons: [],
      auditors: [config.auditor],
      tags: [],
      a11yReview: [
        {
          _id: new ObjectId(config.sectionID),
          sectionTitle: "Synthetic article",
          sectionURL: config.pageURL,
          pageID: "1",
        },
      ],
    });
} else
  await db
    .collection("users")
    .updateOne(
      { uuid: config.auditor },
      { $set: { roles: [{ org: "libretexts", role: "support" }] } },
    );
async function login(name) {
  const response = await fetch(origin + "/api/v1/auth/fallback-auth", {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://conductor.invalid",
    },
    body: JSON.stringify({
      email: name + "@candidate.example.invalid",
      password: config.password,
    }),
  });
  assert.equal(response.status, 302, "actual production fallback session");
  const values = response.headers.getSetCookie();
  assert.ok(values.some((value) => /Secure/i.test(value)));
  assert.ok(values.some((value) => /Domain=conductor.invalid/i.test(value)));
  cookies[name] = values.map((value) => value.split(";")[0]).join("; ");
}
for (const name of ["editor", "auditor", "outsider"]) await login(name);
async function request(path, method = "GET", body, user = "editor") {
  const response = await fetch(origin + "/api/v1" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: "https://conductor.invalid",
      "X-Requested-With": "XMLHttpRequest",
      ...(user ? { cookie: cookies[user] } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = { err: true, errMsg: "Non-JSON response" };
  }
  return { status: response.status, data };
}
async function control(body = {}) {
  const response = await fetch("https://engine:8443/control", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": config.key },
    body: JSON.stringify(body),
  });
  assert.equal(response.status, 200);
  return response.json();
}
const input = {
  projectID: config.projectID,
  sectionID: config.sectionID,
  fixMode: "deterministic",
  findingIDs: [],
};
assert.equal(
  (
    await request(
      matrix + "/health?projectID=" + config.projectID,
      "GET",
      undefined,
      "",
    )
  ).status,
  401,
);
assert.equal(
  (await request("/project?projectID=" + config.projectID)).status,
  200,
  "ordinary authenticated project access",
);
const readiness = await request(
  matrix + "/health?projectID=" + config.projectID,
);
let observation = {
  phase,
  node: process.version,
  compiledEntrypoint: true,
  production: true,
  synthetic: true,
  realSessionAndMongo: true,
};
if (phase === "off") {
  assert.equal(readiness.data.available, false);
  assert.equal((await request(matrix + "/scan", "POST", input)).status, 503);
  const names = (await db.listCollections().toArray()).map(
    (value) => value.name,
  );
  for (const name of [
    "remediationworkitems",
    "conformancerecords",
    "remedyoperationrecords",
  ])
    assert.equal(
      names.includes(name),
      false,
      "default-off must not initialize " + name,
    );
  observation.defaultOffWithoutOptionalCollections = true;
} else if (phase === "enabled") {
  assert.equal(readiness.data.available, true, JSON.stringify(readiness.data));
  assert.equal(
    (await request(matrix + "/scan", "POST", input, "auditor")).status,
    403,
  );
  assert.equal(
    (await request(matrix + "/scan", "POST", input, "outsider")).status,
    403,
  );
  async function review() {
    const response = await request(matrix + "/preview", "POST", input);
    assert.equal(response.status, 200, JSON.stringify(response.data));
    return {
      ...input,
      localReviewID: response.data.localReviewID,
      previewToken: response.data.preview_token,
      previewHash: response.data.preview_hash,
      confirmed: true,
    };
  }
  assert.equal((await request(matrix + "/scan", "POST", input)).status, 200);
  const reviewed = await review();
  assert.equal(
    (
      await request(matrix + "/apply", "POST", {
        ...reviewed,
        confirmed: false,
      })
    ).status,
    409,
  );
  assert.equal((await control()).writes, 0);
  const written = await request(matrix + "/apply", "POST", reviewed);
  assert.equal(written.status, 200, JSON.stringify(written.data));
  assert.equal(written.data.outcome, "known_success");
  assert.equal((await control()).writes, 1);
  assert.equal(
    (await request(matrix + "/apply", "POST", reviewed)).status,
    409,
  );
  assert.equal((await control()).writes, 1);
  const status = await request(
    base +
      "/page/" +
      config.sectionID +
      "/operations/" +
      written.data.localOperationID,
  );
  assert.equal(status.status, 200);
  assert.equal(status.data.pending, false);
  assert.equal(status.data.readOnly, true);
  await control({ mode: "unknown" });
  const unknown = await request(matrix + "/apply", "POST", await review());
  assert.equal(unknown.status, 502);
  assert.equal((await control()).writes, 2);
  assert.equal(
    (
      await request(
        base +
          "/page/" +
          config.sectionID +
          "/operations/" +
          unknown.data.localOperationID,
      )
    ).data.pending,
    true,
  );
  const report = await request(base + "/conformance");
  assert.equal(report.data.report.verifiedCriteria, 0);
  observation = {
    ...observation,
    authBoundaries: true,
    nativeSignedProducerVerified: true,
    writeAheadObservedByFixture: true,
    oneWriteAndReplayDenied: true,
    unknownHeldForRecovery: true,
    humanVerifiedCriteria: 0,
  };
} else if (phase === "recover") {
  assert.equal(readiness.data.capabilities.mutate, false);
  assert.equal(readiness.data.capabilities.operation_status, true);
  const project = await db
      .collection("projects")
      .findOne({ projectID: config.projectID }),
    localID = project.a11yReview[0].remedyPendingOperation,
    intent = (
      await db
        .collection("remedyoperationrecords")
        .findOne({ projectID: config.projectID, localID, kind: "intent" })
    ).event;
  await control({ resolve: intent.issuer + ":" + intent.jti });
  const path = base + "/page/" + config.sectionID + "/operations/" + localID;
  const looked = await request(path, "GET", undefined, "auditor");
  assert.equal(looked.data.pending, true);
  const body = {
    expectedVersion: looked.data.evidenceVersion,
    confirmed: true,
    reason:
      "Synthetic compiled-runtime support fixture consumes modeled durable resolved status.",
  };
  assert.equal((await request(path + "/resolve", "POST", body)).status, 403);
  const resolved = await request(path + "/resolve", "POST", body, "auditor");
  assert.equal(resolved.status, 200, JSON.stringify(resolved.data));
  assert.equal(
    (await control()).writes,
    2,
    "recovery cannot dispatch another write",
  );
  const after = await request(path, "GET", undefined, "auditor");
  assert.equal(after.data.pending, false);
  assert.equal(after.data.localResolution.id, resolved.data.resolutionID);
  assert.equal(after.data.operation.outcome, "unknown_write");
  const exported = await request(
    base + "/operations/report",
    "GET",
    undefined,
    "auditor",
  );
  assert.equal(exported.data.complete, true);
  assert.equal(exported.data.resolutionCommits.length, 1);
  assert.ok(
    exported.data.operationHistory.some(
      (row) =>
        row.kind === "resolution" &&
        row.event.resolutionID === resolved.data.resolutionID,
    ),
  );
  const report = await request(base + "/conformance");
  assert.equal(report.data.report.verifiedCriteria, 0);
  observation = {
    ...observation,
    signerDisabledRecovery: true,
    explicitRoleRequired: true,
    modeledDurableResolvedConsumed: true,
    commitAndExportVerified: true,
    writeRetries: 0,
    humanVerifiedCriteria: 0,
  };
} else throw Error("Unknown fixture phase");
await client.close();
process.stdout.write(JSON.stringify(observation) + "\n");
