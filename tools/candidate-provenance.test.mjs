import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
test('current candidate in each manifest describes its complete applied source tree', () => {
  for (const target of ['staging-67301b35', 'release-2.156.2']) {
    const manifest = JSON.parse(fs.readFileSync(new URL(`series/${target}/manifest.json`, root)));
    assert.equal(manifest.linuxCandidateValidation.sourceTree, manifest.expectedTree, target);
  }
});
const {verifyCandidates} = await import('./candidate-provenance.mjs');
const index = JSON.parse(fs.readFileSync(new URL('docs/releases/current-candidates.json', root)));
const repo = (await import('node:url')).fileURLToPath(root);
test('indexed receipts, ordered patch bytes, target pins and current references agree', () => {
  assert.equal(verifyCandidates(repo,index).verified,true);
});
test('packaging refuses expired artifacts without invalidating historical evidence checks', () => {
  assert.equal(verifyCandidates(repo,index,{now:new Date('2027-01-01')}).expired,true);
  assert.throws(() => verifyCandidates(repo,index,{now:new Date('2027-01-01'),requireUnexpired:true}),/expired/);
});
for(const [name, change, message] of [
  ['source tree',c => c.sourceTree='0'.repeat(40),/source tree/],
  ['base pin',c => c.baseCommit='0'.repeat(40),/upstream base/],
  ['patch input',c => c.patches[0].sha256='0'.repeat(64),/patch inputs/],
  ['old image reference',c => c.validation.imageID='sha256:'+'0'.repeat(64),/candidate reference/],
  ['executed receipt',c => c.validationReceipt.sha256='0'.repeat(64),/AssertionError/],
  ['current manifest',c => c.deliveryManifestSHA256='0'.repeat(64),/manifest checksum/],
]) test(`packaging rejects ${name} drift`, () => {
  const changed=structuredClone(index); change(changed.candidates[0]);
  assert.throws(()=>verifyCandidates(repo,changed),message);
});
test('reconstructed Docker/lock inputs must match the reviewed source inputs', async () => {
  const os = await import('node:os'), path = await import('node:path');
  const {verifyCandidateSource} = await import('./candidate-provenance.mjs');
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'candidate-source-test-'));
  fs.writeFileSync(path.join(directory,'Dockerfile'),'abc');
  const candidate={target:'fixture',sourceFiles:{Dockerfile:'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'}};
  assert.equal(verifyCandidateSource(candidate,directory).sourceFilesVerified,true);
  fs.writeFileSync(path.join(directory,'Dockerfile'),'changed base');
  assert.throws(()=>verifyCandidateSource(candidate,directory),/source input drift: Dockerfile/);
});
