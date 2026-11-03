#!/usr/bin/env python3
"""Shared, dependency-free helpers for Planora skill bundles."""

from __future__ import annotations

import hashlib
import json
import re
import shutil
import unicodedata
from pathlib import Path, PurePosixPath, PureWindowsPath


CERTIFIED_TARGETS = ("codex", "claude", "antigravity")
INVOCATION_MODES = ("explicit", "implicit", "both")
RISK_CLASSES = ("read-only", "mutating", "high-risk")
MARKER = "__PLANORA_REQUIRED__"


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")
    slug = re.sub(r"-+", "-", slug)[:64].rstrip("-")
    reserved = {".", "..", "con", "prn", "aux", "nul", "com1", "lpt1"}
    if not slug or slug in reserved:
        raise ValueError("Name cannot produce a safe skill slug")
    return slug


def safe_relative(value: str) -> bool:
    if not value or "\\" in value:
        return False
    posix = PurePosixPath(value)
    windows = PureWindowsPath(value)
    return not (posix.is_absolute() or windows.is_absolute() or ".." in posix.parts)


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8", newline="\n")


def write_json(path: Path, value: object) -> None:
    write_text(path, json.dumps(value, ensure_ascii=False, indent=2))


def read_json(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object: {path}")
    return data


def file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def evaluation_fingerprint(bundle: Path) -> str:
    """Bind behavioral results to scenarios, skill declarations, and compiled skills."""
    manifest = read_json(bundle / "manifest.json")
    payload = {
        "skills": manifest.get("skills", []),
        "compiledTargets": manifest.get("compiledTargets", []),
        "scenarios": json.loads((bundle / "evals/scenarios.json").read_text(encoding="utf-8")),
        "compiledSkillHashes": {
            path.relative_to(bundle).as_posix(): file_hash(path)
            for path in sorted((bundle / "targets").rglob("SKILL.md"))
            if path.is_file()
        },
    }
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def bundle_files(bundle: Path) -> list[str]:
    return sorted(
        path.relative_to(bundle).as_posix()
        for path in bundle.rglob("*")
        if path.is_file() and path.name != "manifest.json"
    )


def refresh_hashes(bundle: Path, *, validation_status: str | None = None) -> dict:
    manifest_path = bundle / "manifest.json"
    manifest = read_json(manifest_path)
    files = bundle_files(bundle)
    manifest["files"] = files
    manifest["fileHashes"] = {relative: file_hash(bundle / relative) for relative in files}
    if validation_status is not None:
        manifest["validationStatus"] = validation_status
    write_json(manifest_path, manifest)
    return manifest


def parse_frontmatter(path: Path) -> tuple[dict[str, str], str]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise ValueError(f"Missing YAML frontmatter: {path}")
    end = text.find("\n---\n", 4)
    if end < 0:
        raise ValueError(f"Unclosed YAML frontmatter: {path}")
    fields: dict[str, str] = {}
    for line in text[4:end].splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if ":" not in line:
            raise ValueError(f"Unsupported frontmatter line in {path}: {line}")
        key, value = line.split(":", 1)
        fields[key.strip()] = value.strip().strip('"').strip("'")
    return fields, text[end + 5 :]


def render_frontmatter(fields: dict[str, str], body: str) -> str:
    lines = ["---"] + [f"{key}: {json.dumps(value)}" for key, value in fields.items()] + ["---", "", body.lstrip()]
    return "\n".join(lines).rstrip() + "\n"


def copy_tree(source: Path, destination: Path) -> None:
    if destination.exists():
        shutil.rmtree(destination)
    shutil.copytree(source, destination)


def policy_rules(path: Path) -> list[dict[str, str]]:
    """Parse the intentionally small policy.yaml schema without PyYAML."""
    if not path.is_file():
        return []
    rules: list[dict[str, str]] = []
    current: dict[str, str] | None = None
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line.startswith("- id:"):
            if current:
                rules.append(current)
            current = {"id": line.split(":", 1)[1].strip().strip('"')}
        elif current is not None and ":" in line:
            key, value = line.split(":", 1)
            current[key.strip()] = value.strip().strip('"')
    if current:
        rules.append(current)
    return rules


def render_policy(rules: list[dict[str, str]], title: str) -> str:
    lines = [f"# {title}", "", "This section is generated from `.SKILLS/source/policy.yaml`.", ""]
    for rule in rules:
        lines.append(f"- **{rule.get('id', 'policy')}** — {rule.get('statement', '')}")
        if rule.get("rationale"):
            lines.append(f"  Rationale: {rule['rationale']}")
    return "\n".join(lines).rstrip() + "\n"
