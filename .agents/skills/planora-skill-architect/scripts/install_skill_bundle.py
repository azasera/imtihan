#!/usr/bin/env python3
"""Preview or safely install compiled Planora skill targets into a repository."""

from __future__ import annotations

import argparse
import os
import re
import tempfile
from pathlib import Path

from bundle_common import CERTIFIED_TARGETS, read_json, refresh_hashes, safe_relative, write_json


def _inside(root: Path, candidate: Path) -> bool:
    try:
        candidate.relative_to(root)
        return True
    except ValueError:
        return False


def _merge_managed(existing: str, incoming: str, bundle_id: str) -> str:
    start = f"<!-- PLANORA:BUNDLE:{bundle_id}:START -->"
    end = f"<!-- PLANORA:BUNDLE:{bundle_id}:END -->"
    if incoming.count(start) != 1 or incoming.count(end) != 1:
        raise ValueError("compiled instruction file has invalid managed markers")
    block = incoming[incoming.index(start) : incoming.index(end) + len(end)]
    if start in existing or end in existing:
        if existing.count(start) != 1 or existing.count(end) != 1 or existing.index(start) > existing.index(end):
            raise ValueError("existing instruction file has malformed bundle markers")
        return (existing[: existing.index(start)] + block + existing[existing.index(end) + len(end) :]).rstrip() + "\n"
    separator = "\n\n" if existing.strip() else ""
    return existing.rstrip() + separator + block + "\n"


def build_plan(bundle: Path, target: Path, agent: str) -> tuple[dict, dict[Path, bytes]]:
    bundle = bundle.expanduser().resolve()
    target = target.expanduser().resolve()
    if not target.is_dir():
        raise ValueError(f"target repository must exist: {target}")
    manifest = read_json(bundle / "manifest.json")
    bundle_id = manifest["bundle"]["id"]
    candidates: dict[str, bytes] = {}
    origins: dict[str, str] = {}
    conflicts: list[str] = []

    if agent not in {*CERTIFIED_TARGETS, "all"}:
        raise ValueError(f"agent must be one of: {', '.join(CERTIFIED_TARGETS)}, all")
    selected_agents = CERTIFIED_TARGETS if agent == "all" else (agent,)
    for selected_agent in selected_agents:
        root = bundle / "targets" / selected_agent
        if not root.is_dir():
            conflicts.append(f"missing compiled target: {selected_agent}")
            continue
        for source in root.rglob("*"):
            if not source.is_file():
                continue
            if source.is_symlink():
                conflicts.append(f"symlink source rejected: {source.relative_to(bundle).as_posix()}")
                continue
            relative = source.relative_to(root).as_posix()
            if not safe_relative(relative):
                conflicts.append(f"unsafe compiled path: {relative}")
                continue
            content = source.read_bytes()
            if relative in candidates and candidates[relative] != content:
                conflicts.append(f"target adapters disagree for {relative}: {origins[relative]} vs {selected_agent}")
            else:
                candidates[relative] = content
                origins[relative] = selected_agent

    writes: dict[Path, bytes] = {}
    operations: list[dict[str, str]] = []
    rejected_prefixes: set[str] = set()
    skill_prefixes = sorted(
        {
            "/".join(relative.split("/")[:3])
            for relative in candidates
            if relative.startswith(".agents/skills/") or relative.startswith(".claude/skills/")
        }
    )
    for prefix in skill_prefixes:
        destination_dir = target / Path(prefix)
        if not destination_dir.exists():
            continue
        if not destination_dir.is_dir():
            conflicts.append(f"skill destination is not a directory: {prefix}")
            rejected_prefixes.add(prefix)
            continue
        desired = {
            relative[len(prefix) + 1 :]: content
            for relative, content in candidates.items()
            if relative.startswith(prefix + "/")
        }
        actual = {
            path.relative_to(destination_dir).as_posix(): path.read_bytes()
            for path in destination_dir.rglob("*")
            if path.is_file() and not path.is_symlink()
        }
        if actual != desired:
            conflicts.append(f"skill name or content conflict: {prefix}")
            rejected_prefixes.add(prefix)

    for relative, content in sorted(candidates.items()):
        if any(relative == prefix or relative.startswith(prefix + "/") for prefix in rejected_prefixes):
            continue
        destination = target / Path(relative)
        resolved_parent = destination.parent.resolve()
        if not _inside(target, resolved_parent):
            conflicts.append(f"path escapes target repository: {relative}")
            continue
        if destination.is_symlink() or any(parent.is_symlink() for parent in destination.parents if _inside(target, parent)):
            conflicts.append(f"symlink destination rejected: {relative}")
            continue
        if destination.name in {"AGENTS.md", "CLAUDE.md"}:
            existing = destination.read_text(encoding="utf-8") if destination.exists() else ""
            try:
                merged = _merge_managed(existing, content.decode("utf-8"), bundle_id).encode("utf-8")
            except (UnicodeDecodeError, ValueError) as error:
                conflicts.append(f"cannot merge {relative}: {error}")
                continue
            action = "update-managed-block" if destination.exists() else "add"
            writes[destination] = merged
            operations.append({"action": action, "path": relative, "source": origins[relative]})
        elif destination.exists():
            if not destination.is_file():
                conflicts.append(f"destination is not a file: {relative}")
            elif destination.read_bytes() == content:
                operations.append({"action": "unchanged", "path": relative, "source": origins[relative]})
            else:
                conflicts.append(f"refusing to overwrite unmanaged or conflicting file: {relative}")
        else:
            writes[destination] = content
            operations.append({"action": "add", "path": relative, "source": origins[relative]})

    plan = {
        "mode": "dry-run",
        "bundleId": bundle_id,
        "agent": agent,
        "target": str(target),
        "operations": operations,
        "conflicts": sorted(set(conflicts)),
        "safeToApply": not conflicts,
    }
    return plan, writes


def install(bundle: Path, target: Path, agent: str, *, apply: bool = False) -> dict:
    bundle = bundle.expanduser().resolve()
    plan, writes = build_plan(bundle, target, agent)
    if apply and not plan["safeToApply"]:
        raise ValueError("preflight failed; no files were changed")
    if apply:
        target = target.expanduser().resolve()
        with tempfile.TemporaryDirectory(prefix="planora-install-", dir=target) as temp_name:
            stage = Path(temp_name)
            staged: list[tuple[Path, Path]] = []
            for destination, content in writes.items():
                relative = destination.relative_to(target)
                staged_path = stage / relative
                staged_path.parent.mkdir(parents=True, exist_ok=True)
                staged_path.write_bytes(content)
                staged.append((staged_path, destination))
            for staged_path, destination in staged:
                destination.parent.mkdir(parents=True, exist_ok=True)
                os.replace(staged_path, destination)
        plan["mode"] = "apply"
        plan["applied"] = True
    else:
        plan["applied"] = False
    write_json(bundle / "install-plan.json", plan)
    refresh_hashes(bundle)
    return plan


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bundle", type=Path)
    parser.add_argument("--target", required=True, type=Path)
    parser.add_argument("--agent", required=True, choices=(*CERTIFIED_TARGETS, "all"))
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true")
    mode.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    try:
        plan = install(args.bundle, args.target, args.agent, apply=args.apply)
    except (ValueError, KeyError, OSError) as error:
        parser.exit(2, f"error: {error}\n")
    print(f"{plan['mode']}: {len(plan['operations'])} operations, {len(plan['conflicts'])} conflicts")
    return 0 if plan["safeToApply"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
