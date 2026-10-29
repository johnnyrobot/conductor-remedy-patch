import { createHash } from "node:crypto";
/** Compare complete compiler output, preserving every diagnostic and context line. */
export function compareTypecheck({ baseline, patched }) {
  const normalize = ({ text, root }) =>
    text
      .replace(/\u001b\[[0-9;]*m/g, "")
      .split(root)
      .join("<checkout>")
      .replace(/(\.[cm]?[jt]sx?)\(\d+,\d+\)/g, "$1(<position>)")
      .trim();
  const a = normalize(baseline),
    b = normalize(patched);
  const count = (text) => (text.match(/\berror TS\d+:/g) || []).length;
  const ac = count(a),
    bc = count(b),
    valid = (status, n) =>
      Number.isInteger(status) &&
      ((status === 0 && n === 0) || (status === 2 && n > 0));
  return {
    matches:
      valid(baseline.status, ac) &&
      valid(patched.status, bc) &&
      baseline.status === patched.status &&
      a === b,
    standalonePass:
      baseline.status === 0 && patched.status === 0 && ac === 0 && bc === 0,
    baselineStatus: baseline.status,
    patchedStatus: patched.status,
    baselineDiagnostics: ac,
    patchedDiagnostics: bc,
    baselineNormalizedSHA256: createHash("sha256").update(a).digest("hex"),
    patchedNormalizedSHA256: createHash("sha256").update(b).digest("hex"),
  };
}
