import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const command = fileURLToPath(new URL('./apply-series.mjs', import.meta.url));
function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lt130-series-test-'));
  const source = path.join(dir, 'source'), checkout = path.join(dir, 'checkout');
  fs.mkdirSync(source);
  const git = (...args) => execFileSync('git', ['-C', source, '-c', 'user.name=Series test', '-c', 'user.email=series@example.invalid', ...args], { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).trim();
  git('init', '--object-format=sha1');
  fs.writeFileSync(path.join(source, 'example.txt'), 'before\n'); git('add', 'example.txt'); git('commit', '-m', 'test: base');
  const base = git('rev-parse', 'HEAD');
  fs.writeFileSync(path.join(source, 'example.txt'), 'after\n'); git('add', 'example.txt'); git('commit', '-m', 'test: change');
  const tree = git('rev-parse', 'HEAD^{tree}');
  const patch = path.join(dir, 'change.patch');
  fs.writeFileSync(patch, execFileSync('git', ['-C', source, 'format-patch', '-1', '--stdout']));
  execFileSync('git', ['clone', '--no-hardlinks', source, checkout], { stdio: 'pipe' });
  execFileSync('git', ['-C', checkout, 'checkout', '--detach', base], { stdio: 'pipe' });
  execFileSync('git', ['-C', checkout, 'config', 'user.name', 'Series test']);
  execFileSync('git', ['-C', checkout, 'config', 'user.email', 'series@example.invalid']);
  const manifest = path.join(dir, 'manifest.json');
  const data = { formatVersion: 1, target: 'fixture', baseCommit: base, expectedTree: tree,
    patches: [{ path: 'change.patch', sha256: createHash('sha256').update(fs.readFileSync(patch)).digest('hex') }] };
  fs.writeFileSync(manifest, JSON.stringify(data));
  return { dir, checkout, base, tree, manifest, data, patch };
}
function run(f, ...flags) { return spawnSync(process.execPath, [command, ...flags, f.manifest, f.checkout], { encoding: 'utf8' }); }

test('the integrator command applies a checked series to its pinned base', () => {
  const f = fixture();
  const result = run(f);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(path.join(f.checkout, 'example.txt'), 'utf8'), 'after\n');
  assert.equal(execFileSync('git', ['-C', f.checkout, 'rev-parse', 'HEAD^{tree}'], { encoding: 'utf8' }).trim(), f.tree);
});

test('changed patch bytes are rejected before any checkout mutation', () => {
  const f = fixture(); fs.appendFileSync(f.patch, '\nchanged\n');
  const result = run(f); assert.notEqual(result.status, 0); assert.match(result.stderr, /checksum mismatch/);
  assert.equal(execFileSync('git', ['-C', f.checkout, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), f.base);
  assert.equal(fs.readFileSync(path.join(f.checkout, 'example.txt'), 'utf8'), 'before\n');
});
test('dirty files remain untouched and an active branch is refused', () => {
  const f = fixture(); fs.writeFileSync(path.join(f.checkout, 'example.txt'), 'retain my work\n');
  const dirty = run(f); assert.notEqual(dirty.status, 0); assert.match(dirty.stderr, /not clean/);
  assert.equal(fs.readFileSync(path.join(f.checkout, 'example.txt'), 'utf8'), 'retain my work\n');
  const other = fixture(); execFileSync('git', ['-C', other.checkout, 'switch', '-c', 'active'], { stdio: 'pipe' });
  const active = run(other); assert.notEqual(active.status, 0); assert.match(active.stderr, /detached checkout/);
});
test('preflight does not apply patches and escaping files are refused', () => {
  const f = fixture(); assert.equal(run(f, '--check').status, 0);
  assert.equal(fs.readFileSync(path.join(f.checkout, 'example.txt'), 'utf8'), 'before\n');
  f.data.patches[0].path = '../change.patch'; fs.writeFileSync(f.manifest, JSON.stringify(f.data));
  const result = run(f); assert.notEqual(result.status, 0); assert.match(result.stderr, /Invalid patch path/);
});

test('a different pinned base is rejected without applying anything', () => {
  const f = fixture(); f.data.baseCommit = '0'.repeat(40); fs.writeFileSync(f.manifest, JSON.stringify(f.data));
  const result = run(f); assert.notEqual(result.status, 0); assert.match(result.stderr, /does not match the pinned base/);
  assert.equal(execFileSync('git', ['-C', f.checkout, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), f.base);
  assert.equal(fs.readFileSync(path.join(f.checkout, 'example.txt'), 'utf8'), 'before\n');
});
