import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { compareTypecheck } from "./compare-typecheck.mjs";
const [manifestArg, workspaceArg, mongo] = process.argv.slice(2),
  delivery = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
if (
  process.platform !== "linux" ||
  process.versions.node.split(".")[0] !== "22"
)
  throw Error(
    "Validation requires Linux with Node22 and a working Docker daemon. No host-runtime substitute is supported.",
  );
if (
  !manifestArg ||
  !workspaceArg ||
  !/^mongodb:\/\/127\.0\.0\.1:\d+\/conductor_test_[\w-]+$/.test(mongo || "")
)
  throw Error(
    "Usage: node tools/validate-target.mjs manifest.json fresh-workspace isolated-loopback-mongo-uri",
  );
const manifestFile = fs.realpathSync(manifestArg),
  relative = path.relative(delivery, manifestFile);
if (relative.startsWith("..") || path.isAbsolute(relative))
  throw Error("Manifest must be inside this delivery checkout.");
const manifest = JSON.parse(fs.readFileSync(manifestFile));
if (
  manifest.upstreamRepository !== "https://github.com/LibreTexts/conductor.git"
)
  throw Error("Unexpected upstream repository.");
const workspace = path.resolve(workspaceArg);
if (fs.existsSync(workspace))
  throw Error("Preserve the existing workspace and choose a fresh path.");
fs.mkdirSync(workspace);
for (const name of ["logs", "output", "home", "tmp"])
  fs.mkdirSync(path.join(workspace, name));
const logs = path.join(workspace, "logs"),
  output = path.join(workspace, "output"),
  control = path.join(workspace, "control"),
  patched = path.join(workspace, "patched");
const environment = {
  PATH: process.env.PATH,
  HOME: path.join(workspace, "home"),
  TMPDIR: path.join(workspace, "tmp"),
  CI: "true",
  NO_COLOR: "1",
  NEW_RELIC_ENABLED: "false",
  TZ: "UTC",
  OPENAI_API_KEY: "synthetic-not-real",
  STRIPE_SECRET_KEY: "sk_test_synthetic_not_real",
  MAILGUN_API_KEY: "synthetic-not-real",
  MAILGUN_DOMAIN: "fixture.example.invalid",
};
fs.copyFileSync(manifestFile, path.join(output, "manifest.json"));
fs.copyFileSync(
  path.join(delivery, "tools/ci/runtime-pins.json"),
  path.join(output, "runtime-pins.json"),
);
const checks = [];
let count = 0;
function run(
  label,
  command,
  args,
  {
    cwd = workspace,
    env = environment,
    allowFailure = false,
    capture = false,
  } = {},
) {
  process.stdout.write(`[${manifest.target}] ${label} started\n`);
  const file = path.join(
      logs,
      `${String(++count).padStart(2, "0")}-${label}.log`,
    ),
    fd = fs.openSync(file, "w");
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: ["ignore", fd, fd],
  });
  fs.closeSync(fd);
  const record = {
    label,
    status: result.status,
    signal: result.signal,
    log: path.basename(file),
  };
  checks.push(record);
  process.stdout.write(`[${manifest.target}] ${label} exit=${result.status}\n`);
  if (result.error || (result.status !== 0 && !allowFailure))
    throw Error(`${label} failed: exit=${result.status}; inspect ${file}`);
  return {
    ...record,
    text: capture ? fs.readFileSync(file, "utf8") : undefined,
  };
}
function read(command, args, cwd = workspace) {
  const result = spawnSync(command, args, {
    cwd,
    env: environment,
    encoding: "utf8",
  });
  if (result.status !== 0) throw Error(`${command} metadata failed`);
  return result.stdout.trim();
}
let report = {
  target: manifest.target,
  baseCommit: manifest.baseCommit,
  expectedTree: manifest.expectedTree,
  manifestSHA256: createHash("sha256")
    .update(fs.readFileSync(manifestFile))
    .digest("hex"),
  deploymentReady: false,
  deliveryCommit: read("git", ["rev-parse", "HEAD"], delivery),
};
try {
  run("docker-daemon", "docker", ["info", "--format", "{{.ServerVersion}}"]);
  run("clone-control", "git", [
    "clone",
    "--quiet",
    manifest.upstreamRepository,
    control,
  ]);
  run("pin-control", "git", [
    "-C",
    control,
    "checkout",
    "--detach",
    manifest.baseCommit,
  ]);
  run("clone-patched", "git", [
    "clone",
    "--quiet",
    "--shared",
    control,
    patched,
  ]);
  run("pin-patched", "git", [
    "-C",
    patched,
    "checkout",
    "--detach",
    manifest.baseCommit,
  ]);
  run("committer-name", "git", [
    "-C",
    patched,
    "config",
    "user.name",
    "Conductor candidate CI",
  ]);
  run("committer-email", "git", [
    "-C",
    patched,
    "config",
    "user.email",
    "candidate-ci@users.noreply.github.com",
  ]);
  run("apply-series", process.execPath, [
    path.join(delivery, "tools/apply-series.mjs"),
    manifestFile,
    patched,
  ]);
  report.appliedCommit = read("git", ["rev-parse", "HEAD"], patched);
  report.appliedTree = read("git", ["rev-parse", "HEAD^{tree}"], patched);
  if (report.appliedTree !== manifest.expectedTree)
    throw Error("Applied tree mismatch.");
  for (const root of [control, patched])
    for (const component of ["server", "client"])
      run(
        `${path.basename(root)}-${component}-ci`,
        "npm",
        ["ci", "--no-audit", "--no-fund"],
        { cwd: path.join(root, component) },
      );
  for (const [file, digest] of Object.entries(manifest.baselineLockfiles)) {
    const actual = createHash("sha256")
      .update(fs.readFileSync(path.join(patched, file)))
      .digest("hex");
    if (actual !== digest) throw Error("Lockfile changed: " + file);
  }
  const baseline = run("baseline-typecheck", "npm", ["run", "typecheck"], {
    cwd: path.join(control, "server"),
    allowFailure: true,
    capture: true,
  });
  const current = run("patched-typecheck", "npm", ["run", "typecheck"], {
    cwd: path.join(patched, "server"),
    allowFailure: true,
    capture: true,
  });
  report.typecheck = compareTypecheck({
    baseline: { ...baseline, root: control },
    patched: { ...current, root: patched },
  });
  if (!report.typecheck.matches)
    throw Error(
      "Baseline-relative typecheck differs; no diagnostic suppression is permitted.",
    );
  const isolated = {
    ...environment,
    NODE_ENV: "test",
    CONDUCTOR_TEST_MONGO_URI: mongo,
    NODE_OPTIONS:
      "--require=" +
      JSON.stringify(path.join(delivery, "tools/ci/loopback-only.cjs")),
  };
  run("server-tests", "npm", ["test"], {
    cwd: path.join(patched, "server"),
    env: isolated,
  });
  run("authenticated-routes", "npm", ["run", "test:remedy-integration"], {
    cwd: path.join(patched, "server"),
    env: isolated,
  });
  run("server-build", "npm", ["run", "build"], {
    cwd: path.join(patched, "server"),
    env: environment,
  });
  run("client-tests", "npm", ["test"], {
    cwd: path.join(patched, "client"),
    env: isolated,
  });
  run("client-build", "npm", ["run", "build"], {
    cwd: path.join(patched, "client"),
  });
  const image = `johnnyrobot/conductor-remedy-candidate:${manifest.target}-${manifest.expectedTree.slice(0, 12)}`;
  run("actual-dockerfile", "docker", [
    "build",
    "--platform",
    "linux/amd64",
    "--tag",
    image,
    "--build-arg",
    `VERSION=candidate-${manifest.target}`,
    "--build-arg",
    `VCS_REF=${manifest.expectedTree}`,
    "--build-arg",
    `BUILD_DATE=${new Date().toISOString()}`,
    "--file",
    path.join(patched, "Dockerfile"),
    patched,
  ]);
  const imageInfo = JSON.parse(read("docker", ["image", "inspect", image]))[0];
  if (
    JSON.stringify(imageInfo.Config.Entrypoint) !==
    JSON.stringify(["node", "dist/server.js"])
  )
    throw Error("Unexpected shipping entrypoint.");
  report.image = {
    tag: image,
    id: imageInfo.Id,
    architecture: imageInfo.Architecture,
    os: imageInfo.Os,
    user: imageInfo.Config.User,
    entrypoint: imageInfo.Config.Entrypoint,
  };
  run("compiled-production-runtime", process.execPath, [
    path.join(delivery, "tools/ci/verify-image.mjs"),
    image,
    patched,
    path.join(workspace, "runtime"),
    path.join(output, "runtime.json"),
  ]);
  report.runtime = JSON.parse(
    fs.readFileSync(path.join(output, "runtime.json"), "utf8"),
  );
  const tar = path.join(output, `conductor-candidate-${manifest.target}.tar`);
  run("save-candidate", "docker", ["image", "save", "--output", tar, image]);
  run("compress-candidate", "gzip", ["-1", tar]);
  const artifact = tar + ".gz";
  report.image.archive = path.basename(artifact);
  report.image.archiveSHA256 = createHash("sha256")
    .update(fs.readFileSync(artifact))
    .digest("hex");
  report.passed = true;
} catch (error) {
  report.passed = false;
  report.error = error.message;
  process.exitCode = 1;
} finally {
  report.checks = checks;
  fs.writeFileSync(
    path.join(output, "validation.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  fs.cpSync(logs, path.join(output, "logs"), { recursive: true });
  process.stdout.write(
    JSON.stringify({
      target: report.target,
      passed: report.passed,
      standaloneTypecheckPass: report.typecheck?.standalonePass,
      report: path.join(output, "validation.json"),
      error: report.error,
    }) + "\n",
  );
}
