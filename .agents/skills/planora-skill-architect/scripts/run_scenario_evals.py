#!/usr/bin/env python3
"""Run every skill scenario through an isolated external evaluation runner."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Callable

from bundle_common import CERTIFIED_TARGETS, evaluation_fingerprint, read_json, refresh_hashes, write_json


Evaluator = Callable[[dict], dict]


def _skill_path(bundle: Path, target: str, skill_name: str) -> Path:
    if target == "claude":
        return bundle / f"targets/{target}/.claude/skills/{skill_name}"
    return bundle / f"targets/{target}/.agents/skills/{skill_name}"


def run_evaluations(bundle: Path, evaluator: Evaluator, runner_name: str) -> dict:
    bundle = bundle.expanduser().resolve()
    manifest = read_json(bundle / "manifest.json")
    scenarios = read_json(bundle / "evals/scenarios.json")
    targets = [value for value in manifest.get("compiledTargets", []) if value in CERTIFIED_TARGETS]
    if not targets:
        raise ValueError("No certified compiled targets are available for evaluation")
    results: list[dict] = []
    for target in targets:
        for skill in manifest.get("skills", []):
            name = skill["name"]
            cases = scenarios.get("skills", {}).get(name, {})
            for kind in ("positive", "negativeTrigger", "forbiddenAction"):
                for scenario in cases.get(kind, []):
                    with tempfile.TemporaryDirectory(prefix="planora-eval-") as workspace:
                        payload = {
                            "protocolVersion": "1.0",
                            "bundle": str(bundle),
                            "target": target,
                            "skill": name,
                            "skillPath": str(_skill_path(bundle, target, name)),
                            "workspace": workspace,
                            "scenarioKind": kind,
                            "scenario": scenario,
                        }
                        outcome = evaluator(payload)
                    if not isinstance(outcome, dict) or not isinstance(outcome.get("passed"), bool):
                        raise ValueError(f"Runner returned an invalid result for {target}/{name}/{scenario.get('id')}")
                    if not outcome.get("evidence"):
                        raise ValueError(f"Runner omitted evidence for {target}/{name}/{scenario.get('id')}")
                    results.append(
                        {
                            "target": target,
                            "skill": name,
                            "kind": kind,
                            "scenarioId": scenario.get("id"),
                            "passed": outcome["passed"],
                            "observed": outcome.get("observed", ""),
                            "evidence": outcome["evidence"],
                        }
                    )
    status = "passed" if results and all(item["passed"] for item in results) else "failed"
    document = {
        "formatVersion": "1.0",
        "status": status,
        "runner": runner_name,
        "synthetic": False,
        "fingerprint": evaluation_fingerprint(bundle),
        "results": results,
    }
    write_json(bundle / "evals/results.json", document)
    refresh_hashes(bundle, validation_status="not-run")
    return document


def _resolve_runner(command: list[str]) -> list[str]:
    executable = shutil.which(command[0])
    if not executable:
        candidate = Path(command[0]).expanduser()
        if not candidate.is_file():
            raise ValueError(f"Runner executable not found: {command[0]}")
        executable = str(candidate.resolve())
    resolved = [executable]
    for argument in command[1:]:
        candidate = Path(argument).expanduser()
        resolved.append(str(candidate.resolve()) if candidate.exists() else argument)
    return resolved


def subprocess_evaluator(command: list[str], timeout: int) -> Evaluator:
    resolved = _resolve_runner(command)

    def evaluate(payload: dict) -> dict:
        completed = subprocess.run(
            resolved,
            input=json.dumps(payload, ensure_ascii=False),
            text=True,
            capture_output=True,
            timeout=timeout,
            check=False,
            cwd=payload["workspace"],
        )
        if completed.returncode != 0:
            raise ValueError(f"Runner failed ({completed.returncode}): {completed.stderr.strip()}")
        try:
            result = json.loads(completed.stdout)
        except json.JSONDecodeError as error:
            raise ValueError(f"Runner returned invalid JSON: {error}") from error
        return result

    return evaluate


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bundle", type=Path)
    parser.add_argument("--timeout", type=int, default=120)
    parser.add_argument("--runner", nargs="+", required=True, help="Command implementing the JSON stdin/stdout runner protocol")
    args = parser.parse_args()
    if args.timeout < 1 or args.timeout > 3600:
        parser.error("timeout must be between 1 and 3600 seconds")
    try:
        document = run_evaluations(
            args.bundle,
            subprocess_evaluator(args.runner, args.timeout),
            " ".join(args.runner),
        )
    except (ValueError, KeyError, OSError, subprocess.TimeoutExpired) as error:
        parser.exit(2, f"error: {error}\n")
    print(f"{document['status']}: {len(document['results'])} scenario runs")
    return 0 if document["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
