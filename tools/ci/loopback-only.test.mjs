import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
test("test guard permits owned loopback listeners and refuses non-fixture sockets before connection", () => {
  const guard = fileURLToPath(new URL("./loopback-only.cjs", import.meta.url));
  const code = `import assert from 'node:assert/strict';import http from 'node:http';import net from 'node:net';const server=http.createServer((_q,r)=>r.end('owned'));await new Promise(r=>server.listen(0,'127.0.0.1',r));assert.equal(await(await fetch('http://127.0.0.1:'+server.address().port)).text(),'owned');assert.throws(()=>net.connect({host:'203.0.113.1',port:443}),/Non-fixture/);await new Promise(r=>server.close(r));`;
  const result = spawnSync(
    process.execPath,
    ["--require", guard, "--input-type=module", "-e", code],
    {
      encoding: "utf8",
      env: {
        PATH: process.env.PATH,
        CONDUCTOR_TEST_MONGO_URI:
          "mongodb://127.0.0.1:27158/conductor_test_guard",
      },
    },
  );
  assert.equal(result.status, 0, result.stderr);
});
