#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';

function fail(message) { throw new Error(message); }
function inside(root, candidate) { return candidate.startsWith(root + path.sep); }
function main() {
  if (Number(process.versions.node.split('.')[0]) < 22) fail('Node 22 or newer is required.');
  const args = process.argv.slice(2);
  const checkOnly = args[0] === '--check';
  if (checkOnly) args.shift();
  if (args.length !== 2 || args.some(a => a.startsWith('--'))) {
    fail('Usage: node tools/apply-series.mjs [--check] <manifest.json> <fresh-detached-checkout>');
  }
  const manifestFile = fs.realpathSync(args[0]);
  const directory = path.dirname(manifestFile);
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  if (manifest.formatVersion !== 1 || !/^[a-z0-9][a-z0-9._-]+$/.test(manifest.target || '')
      || !/^[a-f0-9]{40}$/.test(manifest.baseCommit || '')
      || !/^[a-f0-9]{40}$/.test(manifest.expectedTree || '')
      || !Array.isArray(manifest.patches) || !manifest.patches.length) fail('Invalid series manifest.');
  const seen = new Set();
  const patches = manifest.patches.map(entry => {
    if (typeof entry.path !== 'string' || path.isAbsolute(entry.path)
        || entry.path.split(/[\\/]/).includes('..') || !/^[a-f0-9]{64}$/.test(entry.sha256 || '')) {
      fail('Invalid patch path or checksum in manifest.');
    }
    const file = fs.realpathSync(path.resolve(directory, entry.path));
    if (!inside(directory, file) || !fs.statSync(file).isFile() || seen.has(file)) fail('Patch escapes the series directory or is duplicated.');
    seen.add(file);
    if (createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== entry.sha256) fail(`Patch checksum mismatch: ${entry.path}`);
    return file;
  });
  const checkout = fs.realpathSync(args[1]);
  const git = (...gitArgs) => execFileSync('git', ['-C', checkout, ...gitArgs], { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).trim();
  if (fs.realpathSync(git('rev-parse', '--show-toplevel')) !== checkout) fail('Checkout must name the repository root.');
  if (git('rev-parse', 'HEAD') !== manifest.baseCommit) fail('Checkout HEAD does not match the pinned base. Use a fresh clone at the manifest commit.');
  if (spawnSync('git', ['-C', checkout, 'symbolic-ref', '--quiet', 'HEAD'], { stdio: 'ignore' }).status === 0) fail('Use a fresh detached checkout so an existing branch cannot be changed.');
  if (git('status', '--porcelain=v1', '--untracked-files=all')) fail('Checkout is not clean. Preserve its files and use a fresh clone.');
  for (const state of ['rebase-apply','rebase-merge','MERGE_HEAD','CHERRY_PICK_HEAD']) {
    if (fs.existsSync(path.resolve(checkout, git('rev-parse', '--git-path', state)))) fail('Checkout has an unfinished Git operation.');
  }
  if (checkOnly) {
    console.log(JSON.stringify({ node: process.versions.node, target: manifest.target, baseCommit: manifest.baseCommit, patches: patches.length, status: 'preflight-valid', applied: false }));
    return;
  }
  const applied = spawnSync('git', ['-C', checkout, 'am', '--3way', ...patches], { encoding: 'utf8' });
  if (applied.status !== 0) fail(`Git am failed. Checkout state is preserved for inspection; no automatic reset or abort was performed.\n${applied.stderr || applied.stdout}`);
  const tree = git('rev-parse', 'HEAD^{tree}');
  if (tree !== manifest.expectedTree) fail(`Applied tree mismatch: expected ${manifest.expectedTree}, got ${tree}. Checkout is preserved for inspection.`);
  console.log(JSON.stringify({ node: process.versions.node, target: manifest.target, baseCommit: manifest.baseCommit, head: git('rev-parse','HEAD'), tree, patches: patches.length, status: 'applied-and-verified' }));
}
try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
