#!/usr/bin/env python3
"""Validate a Planora skill bundle and write deterministic quality reports."""

from __future__ import annotations

import argparse
import ast
import re
import sys
from pathlib import Path

from bundle_common import (
    CERTIFIED_TARGETS, INVOCATION_MODES, MARKER, RISK_CLASSES, bundle_files,
    file_hash, parse_frontmatter, read_json, refresh_hashes, safe_relative,
    slugify, write_text,
)

REQUIRED = (
    "README.md", "manifest.json", "intake.json", "architecture.md",
    "evals/scenarios.json", "evals/results.json", "reports/compatibility.md", "reports/conflicts.md",
    "reports/security.md", "reports/quality.md", "install-plan.json",
)
LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
WINDOWS_PATH_RE = re.compile(r"(?i)(?:\b[A-Z]:[\\/](?:Users|Windows|Program Files)[\\/]|/Users/[^/]+/|/home/[^/]+/)")
CREDENTIAL_RE = re.compile(r"(?i)(?:api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]{8,}['\"]")
DANGEROUS_RE = re.compile(r"(?i)(?:rm\s+-rf\s+(?:/|~)|git\s+reset\s+--hard|format\s+[A-Z]:)")
HOST_KEYS = {"disable-model-invocation", "user-invocable", "allow_implicit_invocation"}


def _add(findings: list[dict[str, str]], category: str, severity: str, message: str) -> None:
    findings.append({"category": category, "severity": severity, "message": message})


def inspect_bundle(bundle: Path) -> list[dict[str, str]]:
    bundle = bundle.expanduser().resolve()
    findings: list[dict[str, str]] = []
    if bundle.name != ".SKILLS":
        _add(findings, "structure", "critical", "bundle directory must use the fixed name .SKILLS")
    for relative in REQUIRED:
        if not (bundle / relative).is_file():
            _add(findings, "structure", "critical", f"missing required file: {relative}")
    if not (bundle / "manifest.json").is_file():
        return findings
    try:
        manifest = read_json(bundle / "manifest.json")
    except (ValueError, OSError) as error:
        _add(findings, "structure", "critical", f"invalid manifest: {error}")
        return findings
    if manifest.get("formatVersion") != "1.0":
        _add(findings, "structure", "critical", "manifest formatVersion must be 1.0")
    for key in ("bundle", "author", "license", "provenance", "targetAgents", "skills", "policy", "blockers", "files", "fileHashes"):
        if key not in manifest:
            _add(findings, "structure", "critical", f"manifest missing field: {key}")

    expected_files = bundle_files(bundle)
    listed = manifest.get("files", [])
    if not isinstance(listed, list):
        _add(findings, "structure", "critical", "manifest files must be a list")
        listed = []
    if len(listed) != len(set(str(value) for value in listed)):
        _add(findings, "structure", "critical", "manifest files contains duplicate entries")
    for relative in listed:
        if not isinstance(relative, str) or not safe_relative(relative):
            _add(findings, "safety", "critical", f"unsafe manifest path: {relative}")
    string_listed = {value for value in listed if isinstance(value, str)}
    for relative in sorted(set(expected_files) - string_listed):
        _add(findings, "structure", "critical", f"file missing from manifest: {relative}")
    for relative in sorted(string_listed - set(expected_files)):
        _add(findings, "structure", "critical", f"manifest references missing file: {relative}")
    hashes = manifest.get("fileHashes", {})
    if not isinstance(hashes, dict):
        _add(findings, "structure", "critical", "manifest fileHashes must be an object")
        hashes = {}
    for relative in string_listed:
        path = bundle / relative if safe_relative(relative) else None
        if path and path.is_file() and hashes.get(relative) != file_hash(path):
            _add(findings, "structure", "critical", f"hash mismatch: {relative}")

    skills = manifest.get("skills", [])
    if not isinstance(skills, list) or not skills:
        _add(findings, "decomposition", "critical", "manifest must declare at least one skill")
        skills = []
    ids: list[str] = []
    names: list[str] = []
    descriptions: list[str] = []
    canonical: dict[str, tuple[dict[str, str], str, str, Path]] = {}
    for skill in skills:
        if not isinstance(skill, dict):
            _add(findings, "structure", "critical", "skill entries must be objects")
            continue
        skill_id, name, source = skill.get("id"), skill.get("name"), skill.get("source")
        if isinstance(skill_id, str): ids.append(skill_id)
        if isinstance(name, str): names.append(name)
        try:
            valid_name = isinstance(name, str) and slugify(name) == name
        except ValueError:
            valid_name = False
        if not valid_name:
            _add(findings, "structure", "critical", f"invalid skill name: {name}")
        if skill.get("invocationMode") not in INVOCATION_MODES:
            _add(findings, "decomposition", "critical", f"invalid invocation mode: {skill_id}")
        risk = skill.get("riskClass")
        if risk not in RISK_CLASSES:
            _add(findings, "safety", "critical", f"invalid risk class: {skill_id}")
        if risk in {"mutating", "high-risk"} and not skill.get("sideEffects"):
            _add(findings, "safety", "critical", f"mutating skill lacks side-effect disclosure: {skill_id}")
        if not isinstance(source, str) or not safe_relative(source):
            _add(findings, "safety", "critical", f"unsafe skill source: {skill_id}")
            continue
        skill_file = bundle / source / "SKILL.md"
        if not skill_file.is_file():
            _add(findings, "structure", "critical", f"missing canonical SKILL.md: {source}")
            continue
        try:
            fields, body = parse_frontmatter(skill_file)
        except ValueError as error:
            _add(findings, "structure", "critical", str(error))
            continue
        if fields.get("name") != name:
            _add(findings, "traceability", "critical", f"frontmatter name mismatch: {skill_id}")
        description = fields.get("description", "")
        descriptions.append(description.casefold().strip())
        if len(description) < 30:
            _add(findings, "decomposition", "major", f"description is not discriminating: {skill_id}")
        if HOST_KEYS.intersection(fields) or (bundle / source / "agents/openai.yaml").exists():
            _add(findings, "portability", "critical", f"host metadata leaked into canonical source: {skill_id}")
        if body.count("```") % 2:
            _add(findings, "structure", "major", f"unbalanced code fence: {skill_file.relative_to(bundle).as_posix()}")
        canonical[name] = (fields, body, skill_file.read_text(encoding="utf-8"), bundle / source)
        if risk in {"mutating", "high-risk"} and not re.search(r"(?im)^##\s+(?:side effects|dampak)", body):
            _add(findings, "safety", "major", f"mutating skill does not disclose side effects in SKILL.md: {skill_id}")
        if re.search(r"(?i)all repository work|always in this repository|seluruh pekerjaan repositor", body):
            _add(findings, "decomposition", "major", f"repository-wide invariant appears inside skill: {skill_id}")

        declared_dependencies = {
            value if isinstance(value, str) else value.get("name")
            for value in skill.get("dependencies", [])
            if isinstance(value, (str, dict))
        }
        local_modules = {path.stem for path in (bundle / source).rglob("*.py")}
        for script in (bundle / source).rglob("*.py"):
            try:
                tree = ast.parse(script.read_text(encoding="utf-8"))
            except (SyntaxError, UnicodeDecodeError) as error:
                _add(findings, "structure", "critical", f"invalid Python script {script.relative_to(bundle).as_posix()}: {error}")
                continue
            imports = {
                node.names[0].name.split(".", 1)[0]
                for node in ast.walk(tree)
                if isinstance(node, ast.Import) and node.names
            }
            imports.update(
                node.module.split(".", 1)[0]
                for node in ast.walk(tree)
                if isinstance(node, ast.ImportFrom) and node.module
            )
            external = imports - set(sys.stdlib_module_names) - local_modules
            for dependency in sorted(external - declared_dependencies):
                _add(findings, "safety", "major", f"undeclared Python dependency '{dependency}' in {script.relative_to(bundle).as_posix()}")
    if len(ids) != len(set(ids)):
        _add(findings, "decomposition", "critical", "duplicate skill ID")
    if len(names) != len(set(names)):
        _add(findings, "decomposition", "critical", "duplicate skill name")
    if any(value and descriptions.count(value) > 1 for value in descriptions):
        _add(findings, "decomposition", "major", "duplicate or overlapping skill trigger descriptions")
    tokenized = [set(re.findall(r"[a-z0-9]+", value)) for value in descriptions]
    for left in range(len(tokenized)):
        for right in range(left + 1, len(tokenized)):
            union = tokenized[left] | tokenized[right]
            if union and len(tokenized[left] & tokenized[right]) / len(union) >= 0.8:
                _add(findings, "decomposition", "major", f"high trigger overlap: {names[left]} and {names[right]}")

    try:
        intake = read_json(bundle / "intake.json")
    except (ValueError, OSError) as error:
        _add(findings, "traceability", "critical", f"invalid intake ledger: {error}")
        intake = {}
    capabilities = intake.get("capabilities", []) if isinstance(intake, dict) else []
    mapped_ids = {item.get("skillId") for item in capabilities if isinstance(item, dict)}
    for skill_id in ids:
        if skill_id not in mapped_ids:
            _add(findings, "traceability", "major", f"skill is not mapped from an intake capability: {skill_id}")
    for capability in capabilities:
        if not isinstance(capability, dict):
            _add(findings, "traceability", "major", "capability entries must be objects")
            continue
        skill_id = capability.get("skillId")
        matches = [item for item in skills if isinstance(item, dict) and item.get("id") == skill_id]
        if not matches:
            _add(findings, "traceability", "critical", f"capability references unknown skill: {skill_id}")
            continue
        skill = matches[0]
        if capability.get("invocationMode") != skill.get("invocationMode") or capability.get("riskClass") != skill.get("riskClass"):
            _add(findings, "traceability", "major", f"capability metadata differs from manifest skill: {skill_id}")

    policy = manifest.get("policy", {})
    policy_path = bundle / "source/policy.yaml"
    if policy_path.exists() and policy.get("status") == "not-required":
        _add(findings, "decomposition", "critical", "policy file exists but manifest marks it not-required")
    if not policy_path.exists() and policy.get("status") == "required":
        _add(findings, "structure", "critical", "manifest requires a missing policy file")
    if policy_path.exists():
        policy_text = policy_path.read_text(encoding="utf-8")
        if re.search(r"(?m)^\s*\d+[.)]\s+", policy_text) or re.search(r"(?i)step[- ]by[- ]step|then run|next task", policy_text):
            _add(findings, "decomposition", "major", "procedural workflow appears in repository policy")

    for path in bundle.rglob("*"):
        if path.is_symlink():
            _add(findings, "safety", "critical", f"symlink is not allowed in bundle: {path.relative_to(bundle).as_posix()}")
            continue
        if not path.is_file() or path.name == "manifest.json": continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        relative = path.relative_to(bundle).as_posix()
        unresolved_marker = any(
            MARKER in line and not re.match(r"^\s*MARKER\s*=", line)
            for line in text.splitlines()
        )
        if unresolved_marker: _add(findings, "structure", "blocker", f"unresolved template marker: {relative}")
        if CREDENTIAL_RE.search(text): _add(findings, "safety", "critical", f"possible hardcoded credential: {relative}")
        if DANGEROUS_RE.search(text): _add(findings, "safety", "critical", f"dangerous command: {relative}")
        has_platform_path = any(
            WINDOWS_PATH_RE.search(line) and not re.match(r"^\s*WINDOWS_PATH_RE\s*=", line)
            for line in text.splitlines()
        )
        if relative.startswith("source/") and has_platform_path:
            _add(findings, "portability", "major", f"personal or platform-specific path in canonical source: {relative}")
        if path.suffix.lower() == ".md":
            for match in LINK_RE.finditer(text):
                value = match.group(1).split("#", 1)[0]
                if not value or re.match(r"^[a-z]+://", value, re.I) or value.startswith("mailto:"): continue
                if not safe_relative(value) or not (path.parent / value).resolve().exists():
                    _add(findings, "structure", "major", f"broken or unsafe relative link in {relative}: {value}")

    try:
        scenarios = read_json(bundle / "evals/scenarios.json")
    except (ValueError, OSError) as error:
        _add(findings, "scenarios", "critical", f"invalid scenarios: {error}")
        scenarios = {}
    scenario_skills = scenarios.get("skills", {}) if isinstance(scenarios, dict) else {}
    for name in names:
        cases = scenario_skills.get(name, {}) if isinstance(scenario_skills, dict) else {}
        for kind in ("positive", "negativeTrigger", "forbiddenAction"):
            if not isinstance(cases.get(kind), list) or not cases[kind]:
                _add(findings, "scenarios", "critical", f"missing {kind} scenario for {name}")

    expected_runs: set[tuple[str, str, str, str]] = set()
    for target in manifest.get("compiledTargets", []):
        if target not in CERTIFIED_TARGETS:
            continue
        for name in names:
            cases = scenario_skills.get(name, {}) if isinstance(scenario_skills, dict) else {}
            for kind in ("positive", "negativeTrigger", "forbiddenAction"):
                for scenario in cases.get(kind, []):
                    expected_runs.add((target, name, kind, scenario.get("id")))
    try:
        results_doc = read_json(bundle / "evals/results.json")
    except (ValueError, OSError) as error:
        _add(findings, "scenarios", "critical", f"invalid evaluation results: {error}")
        results_doc = {}
    if results_doc.get("status") != "passed" or results_doc.get("synthetic") is not False:
        _add(findings, "scenarios", "blocker", "behavioral evaluation has not passed with a real runner")
    try:
        from bundle_common import evaluation_fingerprint
        if results_doc.get("fingerprint") != evaluation_fingerprint(bundle):
            _add(findings, "scenarios", "blocker", "behavioral evaluation results are stale")
    except (ValueError, OSError, KeyError):
        _add(findings, "scenarios", "blocker", "behavioral evaluation fingerprint cannot be verified")
    actual_runs: list[tuple[str, str, str, str]] = []
    for result in results_doc.get("results", []):
        if not isinstance(result, dict):
            continue
        key = (result.get("target"), result.get("skill"), result.get("kind"), result.get("scenarioId"))
        actual_runs.append(key)
        if result.get("passed") is not True or not result.get("evidence"):
            _add(findings, "scenarios", "critical", f"scenario did not pass with evidence: {'/'.join(str(value) for value in key)}")
    if len(actual_runs) != len(set(actual_runs)):
        _add(findings, "scenarios", "critical", "evaluation results contain duplicate scenario runs")
    for missing in sorted(expected_runs - set(actual_runs)):
        _add(findings, "scenarios", "blocker", f"missing evaluation result: {'/'.join(str(value) for value in missing)}")
    for extra in sorted(set(actual_runs) - expected_runs):
        _add(findings, "scenarios", "major", f"unexpected evaluation result: {'/'.join(str(value) for value in extra)}")

    declared_targets = {item.get("id") for item in manifest.get("targetAgents", []) if isinstance(item, dict)}
    compiled_targets = set(manifest.get("compiledTargets", []))
    actual_target_dirs = {path.name for path in (bundle / "targets").iterdir() if path.is_dir()} if (bundle / "targets").is_dir() else set()
    if actual_target_dirs != compiled_targets:
        _add(findings, "portability", "critical", "compiledTargets does not match directories under targets/")
    compatibility_results = {
        item.get("target"): item for item in manifest.get("compatibilityResults", []) if isinstance(item, dict)
    }
    for target in CERTIFIED_TARGETS:
        if target not in declared_targets:
            _add(findings, "portability", "critical", f"missing certified target declaration: {target}")
        declaration = next((item for item in manifest.get("targetAgents", []) if isinstance(item, dict) and item.get("id") == target), {})
        if declaration.get("certificationScope") != "format-structure-and-adapter-output":
            _add(findings, "portability", "critical", f"certification scope is missing or overstated: {target}")
        target_root = bundle / "targets" / target
        if not target_root.is_dir():
            _add(findings, "portability", "critical", f"missing compiled target: {target}")
            continue
        compatibility = compatibility_results.get(target, {})
        if compatibility.get("certificationScope") != "format-structure-and-adapter-output" or compatibility.get("status") not in {"pass", "pass-with-limitations"}:
            _add(findings, "portability", "critical", f"missing scoped compatibility result: {target}")
        for name in names:
            if name not in canonical:
                continue
            source_fields, source_body, source_text, _ = canonical[name]
            if target == "claude":
                native = target_root / f".claude/skills/{name}/SKILL.md"
            else:
                native = target_root / f".agents/skills/{name}/SKILL.md"
            if not native.is_file():
                _add(findings, "portability", "critical", f"missing native skill: {target}/{name}")
                continue
            try:
                native_fields, native_body = parse_frontmatter(native)
            except ValueError as error:
                _add(findings, "portability", "critical", str(error))
                continue
            if native_fields.get("name") != source_fields.get("name") or native_fields.get("description") != source_fields.get("description"):
                _add(findings, "portability", "critical", f"native frontmatter diverges from canonical source: {target}/{name}")
            if native_body.strip() != source_body.strip():
                _add(findings, "portability", "critical", f"native instructions diverge from canonical source: {target}/{name}")
            mode = next(item.get("invocationMode") for item in skills if isinstance(item, dict) and item.get("name") == name)
            if target in {"codex", "antigravity"} and native.read_text(encoding="utf-8") != source_text:
                _add(findings, "portability", "critical", f"native skill content must equal canonical source: {target}/{name}")
            if target == "codex":
                metadata = native.parent / "agents/openai.yaml"
                expected = "false" if mode == "explicit" else "true"
                if not metadata.is_file() or f"allow_implicit_invocation: {expected}" not in metadata.read_text(encoding="utf-8"):
                    _add(findings, "portability", "critical", f"invalid Codex invocation metadata: {name}")
            elif target == "claude":
                if mode == "explicit" and native_fields.get("disable-model-invocation") != "true":
                    _add(findings, "portability", "critical", f"invalid Claude explicit invocation mapping: {name}")
                if mode == "implicit" and native_fields.get("user-invocable") != "false":
                    _add(findings, "portability", "critical", f"invalid Claude implicit invocation mapping: {name}")
                if (native.parent / "agents/openai.yaml").exists():
                    _add(findings, "portability", "critical", f"Codex metadata leaked into Claude output: {name}")
            elif (native.parent / "agents/openai.yaml").exists():
                _add(findings, "portability", "critical", f"Codex metadata leaked into Antigravity output: {name}")

            source_root = canonical[name][3]
            source_resources = {
                path.relative_to(source_root).as_posix(): path.read_bytes()
                for path in source_root.rglob("*")
                if path.is_file() and path.name != "SKILL.md" and not path.is_symlink()
            }
            native_resources = {
                path.relative_to(native.parent).as_posix(): path.read_bytes()
                for path in native.parent.rglob("*")
                if path.is_file()
                and path.name != "SKILL.md"
                and not path.is_symlink()
                and not (target == "codex" and path.relative_to(native.parent).as_posix() == "agents/openai.yaml")
            }
            if source_resources != native_resources:
                _add(findings, "portability", "critical", f"native resources diverge from canonical source: {target}/{name}")

        policy_required = manifest.get("policy", {}).get("status") == "required"
        instruction = target_root / ("CLAUDE.md" if target == "claude" else "AGENTS.md")
        if policy_required:
            bundle_id = manifest.get("bundle", {}).get("id")
            if not instruction.is_file() or f"PLANORA:BUNDLE:{bundle_id}:START" not in instruction.read_text(encoding="utf-8"):
                _add(findings, "portability", "critical", f"missing native repository policy: {target}")
        elif instruction.exists():
            _add(findings, "portability", "major", f"unexpected repository policy output: {target}")

    license_info = manifest.get("license", {})
    if license_info.get("spdx") == "UNLICENSED" and not any("license" in str(value).lower() for value in manifest.get("blockers", [])):
        _add(findings, "traceability", "blocker", "UNLICENSED must remain a publication blocker")
    author = manifest.get("author", {})
    if author.get("status") != "confirmed" and not any("author" in str(value).lower() for value in manifest.get("blockers", [])):
        _add(findings, "traceability", "blocker", "unconfirmed author must remain a publication blocker")
    return findings


def validate_bundle(bundle: Path) -> list[str]:
    return [f"{item['severity']}: {item['message']}" for item in inspect_bundle(bundle)]


def _score(findings: list[dict[str, str]]) -> dict[str, int]:
    groups = {
        "structure and traceability": {"structure", "traceability"},
        "trigger clarity and decomposition": {"decomposition"},
        "safety and side-effect handling": {"safety"},
        "portability": {"portability"},
        "scenario coverage": {"scenarios"},
    }
    weights = {"critical": 20, "blocker": 5, "major": 5, "minor": 2}
    return {label: max(0, 20 - sum(weights[item["severity"]] for item in findings if item["category"] in categories)) for label, categories in groups.items()}


def write_reports(bundle: Path, findings: list[dict[str, str]]) -> tuple[int, str]:
    manifest = read_json(bundle / "manifest.json")
    scores = _score(findings)
    total = sum(scores.values())
    critical = any(item["severity"] == "critical" for item in findings)
    blocked = any(item["severity"] == "blocker" for item in findings)
    blockers = manifest.get("blockers", [])
    status = "ready" if total >= 85 and not critical and not blocked and not blockers else ("invalid" if critical else "draft")
    quality = ["# Quality report", "", f"Status: **{status}**", f"Score: **{total}/100**", "", "## Scorecard", ""]
    quality.extend(f"- {label}: {score}/20" for label, score in scores.items())
    quality.extend(["", "## Findings", ""])
    quality.extend([f"- **{item['severity']}** [{item['category']}] {item['message']}" for item in findings] or ["- No validation findings."])
    if blockers: quality.extend(["", "## Publication blockers", ""] + [f"- {value}" for value in blockers])
    write_text(bundle / "reports/quality.md", "\n".join(quality))
    conflicts = [item for item in findings if item["category"] == "decomposition"]
    write_text(bundle / "reports/conflicts.md", "# Conflict report\n\n" + ("\n".join(f"- {item['message']}" for item in conflicts) if conflicts else "- No conflicts detected."))
    security = [item for item in findings if item["category"] == "safety"]
    write_text(bundle / "reports/security.md", "# Security report\n\n" + ("\n".join(f"- **{item['severity']}** — {item['message']}" for item in security) if security else "- No security findings detected."))
    refresh_hashes(bundle, validation_status=status)
    return total, status


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bundle", type=Path)
    args = parser.parse_args()
    findings = inspect_bundle(args.bundle)
    total, status = write_reports(args.bundle.resolve(), findings)
    print(f"{status}: {total}/100 ({len(findings)} findings)")
    for finding in findings: print(f"- {finding['severity']}: {finding['message']}")
    return 1 if any(item["severity"] == "critical" for item in findings) else 0


if __name__ == "__main__":
    raise SystemExit(main())
