"""Offline standard-library verification of an indexed GitHub artifact ZIP and saved image.

Never loads/runs the image or extracts paths from an untrusted archive.
"""
import hashlib
import json
import shutil
import sys
import tarfile
import tempfile
import zipfile
from pathlib import Path


def digest(stream):
    return hashlib.file_digest(stream, "sha256").hexdigest()


def verify(index, target, zip_path):
    if not __debug__:
        raise RuntimeError("Verification requires Python without -O/PYTHONOPTIMIZE.")
    candidate = next(c for c in index["candidates"] if c["target"] == target)
    expected = candidate["validation"]
    with Path(zip_path).open("rb") as stream:
        assert "sha256:" + digest(stream) == expected["artifactDigest"], "artifact ZIP digest mismatch"
    with zipfile.ZipFile(zip_path) as artifact:
        assert len(artifact.namelist()) == len(set(artifact.namelist())), "duplicate ZIP members"
        report_raw = artifact.read("validation.json")
        assert hashlib.sha256(report_raw).hexdigest() == candidate["validationReceipt"]["sha256"], "validation receipt mismatch"
        report = json.loads(report_raw)
        assert report["passed"] is True
        assert report["deliveryCommit"] == index["execution"]["checkoutCommit"]
        assert report["expectedTree"] == report["appliedTree"] == candidate["sourceTree"]
        manifest_raw = artifact.read("manifest.json")
        assert hashlib.sha256(manifest_raw).hexdigest() == expected["validationManifestSHA256"], "executed manifest mismatch"
        manifest = json.loads(manifest_raw)
        assert manifest["patches"] == candidate["patches"]
        assert manifest["baseCommit"] == candidate["baseCommit"]
        assert manifest["expectedTree"] == candidate["sourceTree"]
        assert hashlib.sha256(artifact.read("runtime-pins.json")).hexdigest() == candidate["runtimePinsSHA256"]
        assert report["image"]["id"] == expected["imageID"]
        assert report["image"]["archiveSHA256"] == expected["archiveSHA256"]
        assert report["runtime"] == json.loads(artifact.read("runtime.json"))
        assert report["runtime"]["passed"] is True
        assert [p["phase"] for p in report["runtime"]["phases"]] == candidate["compiledProductionPhases"]
        with tempfile.TemporaryDirectory(prefix="conductor-image-verification-") as directory:
            archive = Path(directory) / "image.tar.gz"
            # The local destination is fixed; no ZIP or tar path is ever extracted.
            with artifact.open(expected["archive"]) as source, archive.open("wb") as dest:
                shutil.copyfileobj(source, dest)
            with archive.open("rb") as stream:
                assert digest(stream) == expected["archiveSHA256"], "saved-image archive mismatch"
            with tarfile.open(archive, "r:gz") as saved:
                def member(name):
                    item = saved.getmember(name)
                    assert item.isfile(), "non-file image member"
                    return saved.extractfile(item)
                entries = json.load(member("manifest.json"))
                assert len(entries) == 1
                raw = member(entries[0]["Config"]).read()
                assert "sha256:" + hashlib.sha256(raw).hexdigest() == expected["imageID"], "image config ID mismatch"
                config = json.loads(raw)
                assert config["os"] == "linux" and config["architecture"] == "amd64"
                assert config["config"]["Entrypoint"] == ["node", "dist/server.js"]
                assert config["config"]["Labels"]["org.opencontainers.image.revision"] == candidate["sourceTree"]
                assert config["config"].get("User", "") == expected["runtimeUser"]
                environment = dict(value.split("=", 1) for value in config["config"]["Env"])
                assert all(key not in environment for key in ["SECRETKEY", "REMEDY_API_KEY", "OPENAI_API_KEY", "REMEDY_REVIEWER_SIGNING_KEY_FILE"])
                assert "v" + environment["NODE_VERSION"] == expected["runtimeNode"]
                layers = entries[0]["Layers"]
                assert len(layers) == len(config["rootfs"]["diff_ids"])
                for layer, diff_id in zip(layers, config["rootfs"]["diff_ids"]):
                    with member(layer) as stream:
                        assert "sha256:" + digest(stream) == diff_id, "saved image layer mismatch"
    return {"target": target, "verified": True, "artifactID": expected["artifactID"],
            "sourceTree": candidate["sourceTree"], "imageID": expected["imageID"],
            "archiveSHA256": expected["archiveSHA256"], "imageExecuted": False}


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit("Usage: python3 tools/verify-candidate-archive.py current-candidates.json target downloaded-artifact.zip")
    print(json.dumps(verify(json.loads(Path(sys.argv[1]).read_text()), sys.argv[2], sys.argv[3]), indent=2))
