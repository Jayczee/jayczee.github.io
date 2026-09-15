import argparse
import hashlib
import json
from pathlib import Path
import re
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
args = parser.parse_args()
root = args.source.resolve()
output = Path(__file__).resolve().parents[1] / 'public/downloads/order-seckill-demo.zip'
entries = ['pom.xml', 'README.md', '.gitignore', '.dockerignore', 'Dockerfile', 'compose.yaml',
           'nginx.conf', 'src', 'scripts', 'evidence']
excluded = {'target', 'secrets', '.git', '__pycache__', '.DS_Store'}
files = {}
for entry in entries:
    source = root / entry
    if not source.exists():
        raise SystemExit('Missing source: ' + entry)
    for file in ([source] if source.is_file() else sorted(source.rglob('*'))):
        relative = file.relative_to(root)
        if any(part in excluded or part.startswith('._') or part.startswith('.env') for part in relative.parts):
            continue
        if file.is_symlink():
            raise SystemExit('Refusing symlink: ' + str(relative))
        if not file.is_file() or file.suffix in ('.pyc', '.log', '.jar'):
            continue
        content = file.read_bytes()
        if re.search(rb'BEGIN (?:OPENSSH|RSA|EC) PRIVATE KEY|www\.jayczee\.top|jhkd[0-9]+', content):
            raise SystemExit('Possible credential or private host: ' + str(relative))
        files[relative.as_posix()] = content
manifest = {name: hashlib.sha256(content).hexdigest() for name, content in sorted(files.items())}
files['SOURCE-SHA256.json'] = (json.dumps(manifest, indent=2) + '\n').encode()
output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for name, content in sorted(files.items()):
        info = zipfile.ZipInfo('order-seckill-demo/' + name, date_time=(2026, 9, 15, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, content)
print(f'Packaged {len(files)} files, {output.stat().st_size} bytes: {output}')
