#!/usr/bin/env python3
"""Scaffold a safe Planora skill bundle at <output>/.SKILLS."""

from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path

from bundle_common import CERTIFIED_TARGETS, MARKER, refresh_hashes, slugify, write_json, write_text


LOCALES = ("id-ID", "en-US")


def _render_template(name: str, **values: str) -> str:
    path = Path(__file__).resolve().parent.parent / "assets" / "templates" / name
    rendered = path.read_text(encoding="utf-8")
    for key, value in values.items():
        rendered = rendered.replace("{{" + key + "}}", value)
    return rendered


def scaffold(name: str, output: Path, locale: str = "id-ID") -> Path:
    if locale not in LOCALES:
        raise ValueError(f"locale must be one of: {', '.join(LOCALES)}")
    slug = slugify(name)
    target = output.expanduser().resolve() / ".SKILLS"
    if target.exists() and (not target.is_dir() or any(target.iterdir())):
        raise FileExistsError(f"Refusing to overwrite non-empty target: {target}")
    target.mkdir(parents=True, exist_ok=True)

    description = (
        f"Gunakan saat pengguna meminta workflow {name}. Jangan gunakan untuk tugas di luar scope yang dikonfirmasi."
        if locale == "id-ID"
        else f"Use when the user requests the {name} workflow. Do not use for work outside the confirmed scope."
    )
    purpose = MARKER
    skill = _render_template(
        "canonical-skill.md.tmpl",
        SKILL_NAME=slug,
        DESCRIPTION=description,
        DISPLAY_NAME=name,
        PURPOSE=purpose,
        SIDE_EFFECTS_SECTION="",
    )
    write_text(target / f"source/skills/{slug}/SKILL.md", skill)

    intake = {
        "facts": [],
        "assumptions": [
            {"id": "ASM-001", "statement": f"Bundle name is {name}", "impact": "Naming only"},
            {"id": "ASM-002", "statement": "Author is not confirmed", "impact": "Publication metadata"},
            {"id": "ASM-003", "statement": "License is not confirmed", "impact": "Publish readiness"},
        ],
        "decisions": [
            {"id": "DEC-001", "statement": "Certified targets are Codex, Claude Code, and Antigravity"}
        ],
        "openQuestions": [],
        "requiredTools": ["python>=3.10"],
        "sideEffects": ["Creates a preview bundle; installation is a separate explicit operation"],
        "targetAgents": list(CERTIFIED_TARGETS),
        "questionRoundLimit": 3,
        "capabilities": [
            {
                "id": "CAP-001",
                "name": name,
                "class": "reusable-knowledge",
                "skillId": slug,
                "invocationMode": "explicit",
                "riskClass": "read-only",
            }
        ],
    }
    write_json(target / "intake.json", intake)
    write_text(
        target / "architecture.md",
        f"# Skill architecture — {name}\n\n## Capability map\n\n- `CAP-001` → `{slug}` (draft)\n\n## Decomposition rationale\n\n{MARKER}\n",
    )
    scenarios = {
        "version": "1.0",
        "skills": {
            slug: {
                "positive": [{"id": "POS-001", "prompt": MARKER, "expected": "skill is selected"}],
                "negativeTrigger": [{"id": "NEG-001", "prompt": MARKER, "expected": "skill is not selected"}],
                "forbiddenAction": [{"id": "FORBID-001", "prompt": MARKER, "expected": "action is refused"}],
            }
        },
    }
    write_json(target / "evals/scenarios.json", scenarios)
    write_json(
        target / "evals/results.json",
        {
            "formatVersion": "1.0",
            "status": "not-run",
            "runner": None,
            "results": [],
        },
    )
    write_text(target / "README.md", f"# {name} skill bundle\n\nCanonical source and native preview outputs for portable agent skills.\n")
    for report, heading in {
        "compatibility.md": "Compatibility report",
        "conflicts.md": "Conflict report",
        "security.md": "Security report",
        "quality.md": "Quality report",
    }.items():
        write_text(target / f"reports/{report}", f"# {heading}\n\nStatus: not evaluated.\n")
    write_json(
        target / "install-plan.json",
        {"mode": "dry-run", "bundleId": slug, "target": None, "operations": [], "conflicts": [], "safeToApply": False},
    )
    manifest = {
        "formatVersion": "1.0",
        "bundle": {"id": slug, "name": name, "version": "0.1.0", "locale": locale},
        "author": {"name": None, "status": "assumption"},
        "license": {"spdx": "UNLICENSED", "status": "assumption"},
        "provenance": {"generator": "planora-skill-architect", "generatedDate": date.today().isoformat()},
        "targetAgents": [
            {
                "id": value,
                "certification": "certified",
                "certificationScope": "format-structure-and-adapter-output",
            }
            for value in CERTIFIED_TARGETS
        ],
        "skills": [
            {
                "id": slug,
                "name": slug,
                "source": f"source/skills/{slug}",
                "invocationMode": "explicit",
                "riskClass": "read-only",
                "sideEffects": [],
                "dependencies": [],
            }
        ],
        "policy": {"status": "not-required", "source": None},
        "blockers": ["Confirm author", "Select a publication license", "Resolve template markers"],
        "validationStatus": "not-run",
        "files": [],
        "fileHashes": {},
    }
    write_json(target / "manifest.json", manifest)
    refresh_hashes(target)
    return target


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", required=True)
    parser.add_argument("--output", type=Path, default=Path.cwd())
    parser.add_argument("--locale", choices=LOCALES, default="id-ID")
    args = parser.parse_args()
    try:
        print(scaffold(args.name, args.output, args.locale))
    except (ValueError, FileExistsError, OSError) as error:
        parser.exit(2, f"error: {error}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
