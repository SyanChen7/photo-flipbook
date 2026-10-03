#!/usr/bin/env python3
"""Download and verify the complete Photo Flipbook v1.0.0 runtime; never execute it."""
import argparse
import hashlib
from pathlib import Path, PurePosixPath
import shutil
import stat
import tempfile
from urllib.request import Request, urlopen
from zipfile import ZipFile

URL = "https://github.com/SyanChen7/photo-flipbook/releases/download/v1.0.0/photo-flipbook-v1.0.0.zip"
SHA256 = "e5b7777dc20fca9b0b6f73c3a8199a4701260b267fd6af6c8f52c33b6cc57ce3"
MAX_BYTES = 20 * 1024 * 1024


def install(output, archive=None):
    output = Path(output).absolute()
    if output.exists() or output.is_symlink():
        raise ValueError("Output already exists; choose a new directory or reuse your existing runtime.")
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".photo-flipbook-", dir=output.parent) as temporary:
        temporary = Path(temporary)
        package = temporary / "runtime.zip"
        digest = hashlib.sha256()
        if archive is None:
            source = urlopen(Request(URL, headers={"User-Agent": "PhotoFlipbook/1.0.0"}), timeout=60)
        else:
            source = Path(archive).open("rb")
        with source, package.open("wb") as target:
            size = 0
            while chunk := source.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_BYTES:
                    raise ValueError("Archive exceeds the expected size limit.")
                digest.update(chunk)
                target.write(chunk)
        if digest.hexdigest() != SHA256:
            raise ValueError("SHA-256 mismatch; no runtime was installed.")
        staged = temporary / "runtime"
        staged.mkdir()
        with ZipFile(package) as bundle:
            entries = bundle.infolist()
            if len(entries) > 200 or sum(item.file_size for item in entries) > MAX_BYTES:
                raise ValueError("Unexpected archive size or file count.")
            for entry in entries:
                path = PurePosixPath(entry.filename)
                if path.is_absolute() or ".." in path.parts or "\\" in entry.filename:
                    raise ValueError("Unsafe archive path.")
                if stat.S_ISLNK(entry.external_attr >> 16):
                    raise ValueError("Archive symlinks are not supported.")
                destination = staged.joinpath(*path.parts)
                if entry.is_dir():
                    destination.mkdir(parents=True, exist_ok=True)
                    continue
                destination.parent.mkdir(parents=True, exist_ok=True)
                with bundle.open(entry) as source, destination.open("xb") as target:
                    shutil.copyfileobj(source, target)
                if destination.suffix in (".command", ".sh"):
                    destination.chmod(0o755)
        for required in ("SKILL.md", "LICENSE.md", "scripts/create-book.py",
                         "assets/html/style/fonts/maoken-handwriting-0.20.ttf",
                         "assets/html/assets/backgrounds/desk.png", "assets/html/assets/audio/page-turn.mp3"):
            if not (staged / required).is_file():
                raise ValueError("Runtime is incomplete: " + required)
        # Reserve the output name exclusively before moving files into it.
        output.mkdir()
        try:
            for item in staged.iterdir():
                shutil.move(str(item), output / item.name)
        except BaseException:
            shutil.rmtree(output)
            raise
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path, help="New runtime directory")
    parser.add_argument("--archive", type=Path, help="Use an already downloaded ZIP; the same SHA-256 is required")
    args = parser.parse_args()
    try:
        output = install(args.output, args.archive)
    except (OSError, ValueError) as error:
        parser.exit(1, f"Installation failed: {error}\n")
    print(f"Verified runtime installed: {output}")
    print(f"Read the full workflow: {output / 'SKILL.md'}")


if __name__ == "__main__":
    main()
