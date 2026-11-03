#!/usr/bin/env python3
"""Compile canonical Planora skills into host-native preview trees."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

from bundle_common import (
    CERTIFIED_TARGETS,
    INVOCATION_MODES,
    copy_tree,
    parse_frontmatter,
    policy_rules,
    read_json,
    refresh_hashes,
    render_frontmatter,
    render_policy,
    safe_relative,
    write_json,
    write_text,
)


def _managed_policy(bundle_id: str, rendered: str) -> str:
    return (
        f"<!-- PLANORA:BUNDLE:{bundle_id}:START -->\n"
        f"{rendered.rstrip()}\n"
        f"<!-- PLANORA:BUNDLE:{bundle_id}:END -->\n"
    )


def _compile_skill(source: Path, destination: Path, target: str, mode: str) -> None:
    copy_tree(source, destination)
    skill_path = destination / "SKILL.md"
    fields, body = parse_frontmatter(skill_path)
    if target == "claude":
        if mode == "explicit":
            fields["disable-model-invocation"] = "true"
        elif mode == "implicit":
            fields["user-invocable"] = "false"
        rendered = render_frontmatter(fields, body)
        rendered = rendered.replace('disable-model-invocation: "true"', "disable-model-invocation: true")
        rendered = rendered.replace('user-invocable: "false"', "user-invocable: false")
        write_text(skill_path, rendered)
        shutil.rmtree(destination / "agents", ignore_errors=True)
    elif target == "codex":
        allow_implicit = "false" if mode == "explicit" else "true"
        write_text(
            destination / "agents/openai.yaml",
            "interface:\n"
            f"  display_name: \"{fields['name'].replace('-', ' ').title()}\"\n"
            f"  short_description: \"Portable workflow for {fields['name']}.\"\n"
            f"  default_prompt: \"Use ${fields['name']} to perform this workflow.\"\n\n"
            "policy:\n"
            f"  allow_implicit_invocation: {allow_implicit}\n",
        )
    elif target == "antigravity":
        shutil.rmtree(destination / "agents", ignore_errors=True)


def compile_bundle(bundle: Path, targets: list[str]) -> list[str]:
    bundle = bundle.expanduser().resolve()
    manifest = read_json(bundle / "manifest.json")
    bundle_id = manifest["bundle"]["id"]
    previous_targets = set(manifest.get("compiledTargets", []))
    current_targets = set(targets)
    compatibility: list[str] = ["# Compatibility report", ""]
    compatibility_results: list[dict[str, object]] = []

    targets_root = bundle / "targets"
    targets_root.mkdir(parents=True, exist_ok=True)
    for stale in targets_root.iterdir():
        if stale.name not in current_targets:
            if stale.is_symlink():
                raise ValueError(f"Refusing to remove symlinked target: {stale.name}")
            if stale.is_dir():
                shutil.rmtree(stale)
            else:
                stale.unlink()

    for target in targets:
        if not target or any(char not in "abcdefghijklmnopqrstuvwxyz0123456789-" for char in target):
            raise ValueError(f"Unsafe target name: {target}")
        target_root = bundle / "targets" / target
        if target_root.exists():
            if target_root.is_symlink():
                raise ValueError(f"Refusing to replace symlinked target: {target}")
            shutil.rmtree(target_root)
        if target == "claude":
            skills_root = target_root / ".claude/skills"
        elif target in {"codex", "antigravity"}:
            skills_root = target_root / ".agents/skills"
        else:
            skills_root = target_root / "skills"

        for skill in manifest.get("skills", []):
            source_value = skill.get("source", "")
            if not safe_relative(source_value):
                raise ValueError(f"Unsafe skill source: {source_value}")
            source = bundle / source_value
            if not source.is_dir():
                raise FileNotFoundError(f"Missing skill source: {source}")
            resolved_source = source.resolve()
            if not resolved_source.is_relative_to((bundle / "source").resolve()):
                raise ValueError(f"Skill source escapes canonical source directory: {source_value}")
            if source.is_symlink() or any(path.is_symlink() for path in source.rglob("*")):
                raise ValueError(f"Symlinks are not allowed in canonical skill source: {source_value}")
            mode = skill.get("invocationMode")
            if mode not in INVOCATION_MODES:
                raise ValueError(f"Invalid invocation mode for {skill.get('id')}: {mode}")
            _compile_skill(source, skills_root / skill["name"], target, mode)

        rules = policy_rules(bundle / "source/policy.yaml")
        if rules:
            instruction_name = "CLAUDE.md" if target == "claude" else "AGENTS.md"
            rendered = render_policy(rules, "Planora managed repository policy")
            write_text(target_root / instruction_name, _managed_policy(bundle_id, rendered))

        certification = "certified" if target in CERTIFIED_TARGETS else "best-effort"
        limitations: list[str] = []
        if target == "codex":
            note = "Native skill path and invocation metadata generated."
            if any(skill.get("invocationMode") == "implicit" for skill in manifest.get("skills", [])):
                limitations.append("Codex cannot represent implicit-only while hiding direct user invocation.")
        elif target == "claude":
            note = "Native skill path and invocation frontmatter generated."
        elif target == "antigravity":
            note = "Native skill path generated; invocation enforcement may depend on host behavior."
            if any(skill.get("invocationMode") == "explicit" for skill in manifest.get("skills", [])):
                limitations.append("Antigravity has no generated native field that guarantees explicit-only invocation.")
        else:
            note = "Canonical Open Agent Skills layout only; host behavior is not certified."
            limitations.append("This target is best-effort and has no native behavior certification.")
        result_status = "pass-with-limitations" if limitations else "pass"
        compatibility.append(f"- **{target}** — {certification} ({result_status}). {note}")
        compatibility.extend(f"  - Limitation: {value}" for value in limitations)
        compatibility_results.append(
            {
                "target": target,
                "certification": certification,
                "certificationScope": "format-structure-and-adapter-output",
                "status": result_status,
                "limitations": limitations,
            }
        )

        if target not in {item.get("id") for item in manifest.get("targetAgents", []) if isinstance(item, dict)}:
            manifest.setdefault("targetAgents", []).append(
                {
                    "id": target,
                    "certification": certification,
                    "certificationScope": "format-structure-and-adapter-output",
                }
            )

    compatibility.extend(["", "## Compatibility diff", ""])
    added = sorted(current_targets - previous_targets)
    removed = sorted(previous_targets - current_targets)
    compatibility.append("- Added targets: " + (", ".join(added) if added else "none"))
    compatibility.append("- Removed targets: " + (", ".join(removed) if removed else "none"))
    manifest["compiledTargets"] = sorted(current_targets)
    manifest["compatibilityResults"] = compatibility_results
    write_json(bundle / "manifest.json", manifest)
    write_text(bundle / "reports/compatibility.md", "\n".join(compatibility))
    refresh_hashes(bundle, validation_status="not-run")
    return targets


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bundle", type=Path)
    parser.add_argument("--targets", default=",".join(CERTIFIED_TARGETS))
    args = parser.parse_args()
    targets = [value.strip().lower() for value in args.targets.split(",") if value.strip()]
    if len(targets) != len(set(targets)):
        parser.error("targets must be unique")
    try:
        compile_bundle(args.bundle, targets)
    except (ValueError, KeyError, FileNotFoundError, OSError) as error:
        parser.exit(2, f"error: {error}\n")
    print("Compiled: " + ", ".join(targets))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
