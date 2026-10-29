"""Exercise the public offline verifier with real ZIP/tar bytes and tamper cases."""
import copy
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest
import sys
sys.dont_write_bytecode = True
import zipfile

spec = importlib.util.spec_from_file_location("archive_verifier", Path(__file__).with_name("verify-candidate-archive.py"))
verifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verifier)
sha = lambda data: hashlib.sha256(data).hexdigest()


class ArchiveVerification(unittest.TestCase):
    def fixture(self, directory, bad_layer=False):
        tree = "a" * 40
        layer = b"saved layer contents"
        config = {"os":"linux", "architecture":"amd64", "rootfs":{"diff_ids":["sha256:" + sha(layer)]},
                  "config":{"Entrypoint":["node","dist/server.js"],"Labels":{"org.opencontainers.image.revision":tree},"Env":["NODE_VERSION=22.22.3"]}}
        raw = json.dumps(config).encode()
        image = io.BytesIO()
        with tarfile.open(fileobj=image,mode="w:gz") as tar:
            files = {"manifest.json":json.dumps([{"Config":"config.json","Layers":["layer.tar"]}]).encode(),"config.json":raw,"layer.tar":b"tampered" if bad_layer else layer}
            for name, data in files.items():
                info=tarfile.TarInfo(name);info.size=len(data);tar.addfile(info,io.BytesIO(data))
        archive=image.getvalue()
        manifest={"baseCommit":"base","expectedTree":tree,"patches":[]}
        manifest_raw=json.dumps(manifest).encode()
        runtime={"passed":True,"phases":[{"phase":"off"}]}
        report={"passed":True,"deliveryCommit":"checkout","expectedTree":tree,"appliedTree":tree,"image":{"id":"sha256:"+sha(raw),"archiveSHA256":sha(archive)},"runtime":runtime}
        report_raw=json.dumps(report).encode()
        file=Path(directory)/"fixture.zip"
        with zipfile.ZipFile(file,"w") as package:
            for name,data in {"manifest.json":manifest_raw,"validation.json":report_raw,"runtime.json":json.dumps(runtime).encode(),"runtime-pins.json":b"{}","image.tar.gz":archive}.items():package.writestr(name,data)
        candidate={"target":"fixture","sourceTree":tree,"baseCommit":"base","patches":[],"runtimePinsSHA256":sha(b"{}"),"validationReceipt":{"sha256":sha(report_raw)},"compiledProductionPhases":["off"],"validation":{"artifactID":1,"artifactDigest":"sha256:"+sha(file.read_bytes()),"validationManifestSHA256":sha(manifest_raw),"imageID":report["image"]["id"],"archiveSHA256":sha(archive),"archive":"image.tar.gz","runtimeUser":"","runtimeNode":"v22.22.3"}}
        return {"execution":{"checkoutCommit":"checkout"},"candidates":[candidate]},file

    def test_good_saved_image_and_distinct_digest_layers(self):
        with tempfile.TemporaryDirectory() as directory:
            index,file=self.fixture(directory)
            self.assertTrue(verifier.verify(index,"fixture",file)["verified"])
            for field in ["artifactDigest","imageID","archiveSHA256"]:
                changed=copy.deepcopy(index);changed["candidates"][0]["validation"][field]="sha256:"+"0"*64
                with self.assertRaises(AssertionError):verifier.verify(changed,"fixture",file)

    def test_layer_tamper_is_rejected_even_with_matching_config_and_outer_archives(self):
        with tempfile.TemporaryDirectory() as directory:
            index,file=self.fixture(directory,bad_layer=True)
            with self.assertRaisesRegex(AssertionError,"layer mismatch"):verifier.verify(index,"fixture",file)


if __name__=="__main__":unittest.main()
