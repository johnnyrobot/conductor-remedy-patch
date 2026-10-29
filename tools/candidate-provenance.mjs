import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function verifyCandidates(repo, index, {requireUnexpired=false, now=new Date()}={}) {
  assert.equal(index.formatVersion, 1);
  assert.equal(index.candidates.length, 2);
  const seen = new Set();
  for (const candidate of index.candidates) {
    const target = candidate.target;
    assert.ok(['staging-67301b35','release-2.156.2'].includes(target) && !seen.has(target), 'unexpected/duplicate target');
    seen.add(target);
    const bytes = fs.readFileSync(path.join(repo, `series/${target}/manifest.json`));
    const manifest = JSON.parse(bytes);
    assert.equal(candidate.deliveryManifestSHA256, sha256(bytes), `${target}: current manifest checksum`);
    assert.equal(candidate.sourceTree, manifest.expectedTree, `${target}: source tree drift`);
    assert.equal(candidate.upstreamRepository, manifest.upstreamRepository, `${target}: upstream repository drift`);
    assert.equal(candidate.baseCommit, manifest.baseCommit, `${target}: upstream base drift`);
    assert.deepEqual(candidate.patches, manifest.patches, `${target}: ordered patch inputs drift`);
    assert.equal(candidate.patches.length, 32);
    for (const patch of candidate.patches)
      assert.equal(sha256(fs.readFileSync(path.join(repo, `series/${target}`, patch.path))), patch.sha256, `${target}: patch checksum`);
    assert.deepEqual(manifest.linuxCandidateValidation, candidate.validation, `${target}: current candidate reference drift`);
    const record = JSON.parse(fs.readFileSync(path.join(repo, candidate.validationReceipt.path)));
    assert.equal(sha256(fs.readFileSync(path.join(repo, candidate.validationReceipt.path))), candidate.validationReceipt.sha256);
    assert.equal(record.deliveryCommit, index.execution.checkoutCommit);
    assert.equal(record.expectedTree, candidate.sourceTree);
    assert.equal(record.appliedTree, candidate.sourceTree);
    assert.equal(record.passed, true);
    assert.equal(record.manifestSHA256, candidate.validation.validationManifestSHA256);
    assert.equal(record.image.id, candidate.validation.imageID);
    assert.equal(record.image.archiveSHA256, candidate.validation.archiveSHA256);
    const originalBytes = fs.readFileSync(path.join(repo, candidate.executedManifest.path));
    assert.equal(sha256(originalBytes), candidate.validation.validationManifestSHA256);
    const original = JSON.parse(originalBytes);
    assert.deepEqual(original.patches, candidate.patches);
    assert.equal(original.expectedTree, candidate.sourceTree);
    assert.deepEqual(original.baselineLockfiles, manifest.baselineLockfiles);
    assert.deepEqual(candidate.sourceFiles['server/package-lock.json'], manifest.baselineLockfiles['server/package-lock.json']);
    assert.deepEqual(candidate.sourceFiles['client/package-lock.json'], manifest.baselineLockfiles['client/package-lock.json']);
    assert.equal(candidate.validation.sourceTree, candidate.sourceTree);
    assert.equal(candidate.validation.workflowRun, index.execution.workflowRun);
    assert.equal(candidate.validation.platform, 'linux/amd64');
    const pins = fs.readFileSync(path.join(repo, 'tools/ci/runtime-pins.json'));
    assert.equal(candidate.runtimePinsSHA256, sha256(pins), 'runtime pins drift');
    assert.equal(candidate.nodeBase, JSON.parse(pins).node);
    assert.equal(candidate.mongoFixture, JSON.parse(pins).mongo);
    const expiry = new Date(candidate.validation.artifactExpiresAt);
    assert.ok(Number.isFinite(expiry.valueOf()), 'invalid artifact expiry');
    if(requireUnexpired) assert.ok(expiry > now, `${target}: artifacts expired; revalidation required`);
  }
  return {verified:true, sourceInputsUnchanged:true, expired:index.candidates.some(c => new Date(c.validation.artifactExpiresAt) <= now)};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const repo = fileURLToPath(new URL('../',import.meta.url));
  const index = JSON.parse(fs.readFileSync(path.join(repo,'docs/releases/current-candidates.json')));
  console.log(JSON.stringify(verifyCandidates(repo,index,{requireUnexpired:process.argv.includes('--require-unexpired')})));
}

// Called against a freshly reconstructed source checkout, never a live worktree.
export function verifyCandidateSource(candidate, source) {
  for (const [file, checksum] of Object.entries(candidate.sourceFiles))
    assert.equal(sha256(fs.readFileSync(path.join(source,file))), checksum, `${candidate.target}: source input drift: ${file}`);
  return {target:candidate.target, sourceFilesVerified:true};
}
