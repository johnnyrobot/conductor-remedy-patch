// Test-process egress guard. Dependency installation is a separate networked step.
const net = require("node:net"),
  tls = require("node:tls");
const uri = process.env.CONDUCTOR_TEST_MONGO_URI || "";
const matched = /^mongodb:\/\/127\.0\.0\.1:(\d+)\/conductor_test_[\w-]+$/.exec(
  uri,
);
if (!matched)
  throw Error("A named isolated loopback test database is required.");
const ports = new Set([Number(matched[1])]),
  hosts = new Set(["127.0.0.1", "localhost", "::1"]);
function check(host, port) {
  if (!hosts.has(String(host)) || !ports.has(Number(port)))
    throw Object.assign(Error("Non-fixture test egress refused."), {
      code: "CONDUCTOR_TEST_EGRESS_DENIED",
    });
}
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  let value = args[0];
  if (Array.isArray(value)) value = value[0];
  if (value && typeof value === "object") {
    if (!value.path)
      check(value.host || value.hostname || "localhost", value.port);
  } else if (typeof value === "number")
    check(typeof args[1] === "string" ? args[1] : "localhost", value);
  return connect.apply(this, args);
};
const tlsConnect = tls.connect;
tls.connect = function (...args) {
  const value = args[0];
  if (value && typeof value === "object")
    check(value.host || value.hostname || "localhost", value.port);
  else check(typeof args[1] === "string" ? args[1] : "localhost", value);
  return tlsConnect.apply(this, args);
};
const listen = net.Server.prototype.listen;
net.Server.prototype.listen = function (...args) {
  const value = args[0];
  if (
    value &&
    typeof value === "object" &&
    value.host &&
    !hosts.has(value.host)
  )
    throw Error("Fixture listener must use loopback.");
  if (typeof args[1] === "string" && !hosts.has(args[1]))
    throw Error("Fixture listener must use loopback.");
  this.once("listening", () => {
    const address = this.address();
    if (address && typeof address === "object") ports.add(address.port);
  });
  return listen.apply(this, args);
};
require("node:module").syncBuiltinESMExports();
