// Candidate-only policy; no product behavior or secret-bearing diagnostics.
export function assertDockerBase(recipe, expected) {
  const args = [...recipe.matchAll(/^ARG CONDUCTOR_NODE_IMAGE=(\S+)\s*$/gm)];
  const stages = recipe.match(/^FROM .+$/gm) || [];
  if (args.length !== 1 || args[0][1] !== expected || stages.length !== 3 ||
      stages.some(line => !/^FROM \$\{CONDUCTOR_NODE_IMAGE\}(?: AS [\w-]+)?$/.test(line)))
    throw Error('Reconstructed Dockerfile base pin differs from reviewed runtime-pins.json.');
}
const routes = new Set(['/control', '/v1/cxone/health', '/v1/cxone/page/scan',
  '/v1/cxone/page/preview-fix', '/v1/cxone/page/operation-status', '/v1/cxone/page/apply-fix']);
export function fixtureDiagnostic(error, route) {
  const type = error instanceof SyntaxError ? 'SyntaxError' :
    error instanceof Error && error.name === 'AssertionError' ? 'AssertionError' : 'Error';
  // Never serialize message/stack/actual/expected, headers, bodies or unknown URLs.
  return JSON.stringify({event:'protocol-fixture-failure', type, route: routes.has(route) ? route : 'other'});
}
