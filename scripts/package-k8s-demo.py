import argparse
from pathlib import Path
import re
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
args = parser.parse_args()
root = args.source.resolve()
output = Path(__file__).resolve().parents[1] / "public/downloads/architecture-k8s-demo.zip"
entries = ["pom.xml", "README.md", ".gitignore", "compose.yaml", "demo-contracts", "demo-support",
           "monolith-service", "order-service", "inventory-service", "payment-service", "gateway-service",
           "scripts", "docs", "k8s"]
excluded = {"target", "secrets", ".git", "__pycache__", ".idea", ".DS_Store"}
files = []
for entry in entries:
    source = root / entry
    if not source.exists():
        raise SystemExit("Missing source: " + entry)
    for file in ([source] if source.is_file() else sorted(source.rglob("*"))):
        relative = file.relative_to(root)
        if any(part in excluded or part.startswith("._") for part in relative.parts):
            continue
        if file.is_symlink():
            raise SystemExit("Refusing symlink: " + str(relative))
        if not file.is_file():
            continue
        if file.suffix in (".pyc", ".log") or file.name.startswith(".env"):
            continue
        content = file.read_bytes()
        if re.search(rb"BEGIN (?:OPENSSH|RSA|EC) PRIVATE KEY|www\.jayczee\.top|jhkd[0-9]+", content):
            raise SystemExit("Possible private credential or host in: " + str(relative))
        files.append((relative, content))
output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    for relative, content in files:
        info = zipfile.ZipInfo("architecture-demo/" + relative.as_posix(), date_time=(2026, 9, 14, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, content)
print(f"Packaged {len(files)} source files: {output}")
