import test from 'node:test';
import assert from 'node:assert/strict';
import { assertDockerBase, fixtureDiagnostic } from './candidate-policy.mjs';
const pin = 'node:22-alpine3.22@sha256:' + 'a'.repeat(64);
test('a reconstructed Docker recipe cannot silently override the reviewed base pin', () => {
  const recipe = `ARG CONDUCTOR_NODE_IMAGE=${pin}\nFROM \${CONDUCTOR_NODE_IMAGE} AS client\nFROM \${CONDUCTOR_NODE_IMAGE} AS server\nFROM \${CONDUCTOR_NODE_IMAGE} AS runtime\n`;
  assert.doesNotThrow(() => assertDockerBase(recipe, pin));
  assert.throws(() => assertDockerBase(recipe.replace(pin, 'node:22-alpine'), pin), /base pin/);
  assert.throws(() => assertDockerBase(recipe.replace('FROM ${CONDUCTOR_NODE_IMAGE} AS runtime', 'FROM node:latest AS runtime'), pin), /base pin/);
});
test('fixture failures identify safe error class and known route without assertion values or request secrets', () => {
  const error = new assert.AssertionError({message:'private-key synthetic-secret',actual:'Bearer synthetic-token',expected:'private-key',operator:'equal'});
  const record = JSON.parse(fixtureDiagnostic(error, '/v1/cxone/page/apply-fix'));
  assert.deepEqual(record, {event:'protocol-fixture-failure', type:'AssertionError', route:'/v1/cxone/page/apply-fix'});
  assert.equal(fixtureDiagnostic({name:'secret-name',message:'secret'}, '/control?key=secret'), '{"event":"protocol-fixture-failure","type":"Error","route":"other"}');
});
test('workflow reruns preserve earlier artifacts by naming the upload with its attempt', async () => {
  const fs = await import('node:fs');
  const workflow = fs.readFileSync(new URL('../../.github/workflows/conductor-candidate.yml', import.meta.url),'utf8');
  assert.match(workflow, /name: conductor-candidate-\$\{\{ matrix.target \}\}-\$\{\{ github.run_id \}\}-\$\{\{ github.run_attempt \}\}/);
});
