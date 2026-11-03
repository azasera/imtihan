#!/usr/bin/env python3
"""Package one compiled skill as an uploadable .skill ZIP archive."""

from __future__ import annotations

import argparse
import zipfile
from pathlib import Path

from bundle_common import CERTIFIED_TARGETS, read_json, safe_relative


EXCLUDED_PARTS = {"__pycache__", ".pytest_cache", ".mypy_cache", ".git"}


def _skill_directory(bundle: Path, agent: str, skill_name: str) -> Path:
    if agent == "claude":
        return bundle / f"targets/{agent}/.claude/skills/{skill_name}"
    return bundle / f"targets/{agent}/.agents/skills/{skill_name}"


def package_skill(
    bundle: Path,
    agent: str,
    skill_name: str,
    output: Path,
    *,
    include_tests: bool = False,
) -> Path:
    bundle = bundle.expanduser().resolve()
    output = output.expanduser().resolve()
    if agent not in CERTIFIED_TARGETS:
        raise ValueError(f"agent must be one of: {', '.join(CERTIFIED_TARGETS)}")
    if not safe_relative(skill_name) or "/" in skill_name:
        raise ValueError(f"unsafe skill name: {skill_name}")
    manifest = read_json(bundle / "manifest.json")
    declared = {item.get("name") for item in manifest.get("skills", []) if isinstance(item, dict)}
    if skill_name not in declared:
        raise ValueError(f"skill is not declared in manifest: {skill_name}")
    source = _skill_directory(bundle, agent, skill_name)
    if not source.is_dir() or not (source / "SKILL.md").is_file():
        raise FileNotFoundError(f"compiled skill is missing: {source}")
    if source.is_symlink() or any(path.is_symlink() for path in source.rglob("*")):
        raise ValueError("symlinks are not allowed in .skill packages")
    output.mkdir(parents=True, exist_ok=True)
    destination = output / f"{skill_name}.skill"
    if destination.exists():
        raise FileExistsError(f"refusing to overwrite existing package: {destination}")

    files: list[Path] = []
    for path in source.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(source)
        if any(part in EXCLUDED_PARTS for part in relative.parts):
            continue
        if not include_tests and "tests" in relative.parts:
            continue
        if path.suffix.lower() in {".pyc", ".pyo"}:
            continue
        files.append(path)
    if not files or files[0].name == "":
        raise ValueError("package contains no runtime files")

    with zipfile.ZipFile(destination, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(files, key=lambda value: value.relative_to(source).as_posix()):
            relative = path.relative_to(source).as_posix()
            archive_name = f"{skill_name}/{relative}"
            info = zipfile.ZipInfo(archive_name, date_time=(2020, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, path.read_bytes())

    with zipfile.ZipFile(destination) as archive:
        names = archive.namelist()
        if f"{skill_name}/SKILL.md" not in names:
            destination.unlink(missing_ok=True)
            raise ValueError("generated package is missing root SKILL.md")
        if any(not name.startswith(f"{skill_name}/") or ".." in Path(name).parts for name in names):
            destination.unlink(missing_ok=True)
            raise ValueError("generated package contains an unsafe archive path")
    return destination


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bundle", type=Path)
    parser.add_argument("--agent", required=True, choices=CERTIFIED_TARGETS)
    parser.add_argument("--skill", required=True)
    parser.add_argument("--output", type=Path, default=Path.cwd())
    parser.add_argument("--include-tests", action="store_true")
    args = parser.parse_args()
    try:
        print(package_skill(args.bundle, args.agent, args.skill, args.output, include_tests=args.include_tests))
    except (ValueError, FileNotFoundError, FileExistsError, OSError, zipfile.BadZipFile) as error:
        parser.exit(2, f"error: {error}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
