"""
Evidence checker for validating workflow step evidence.
Ported from Kraken Ultra TypeScript to Python.
"""

import json
from pathlib import Path
from typing import List, Literal, Optional, Set
from pydantic import BaseModel

StepType = Literal["PLAN", "BUILD", "TEST", "VERIFY", "SHIP"]


class EvidenceChecks(BaseModel):
    exists: bool = False
    has_content: bool = False
    parseable: bool = False
    has_required_fields: bool = False


class EvidenceResult(BaseModel):
    valid: bool = False
    step: StepType = "PLAN"
    evidence_path: str
    checks: EvidenceChecks = EvidenceChecks()
    issues: List[str] = []


class EvidenceChecker:
    def __init__(self):
        self.parseable_extensions: Set[str] = {
            ".json",
            ".md",
            ".ts",
            ".js",
            ".txt",
            ".py",
        }

    def verify_plan_evidence(self, plan_path: str) -> EvidenceResult:
        return self._verify_evidence(
            "PLAN", plan_path, ["title", "description", "steps"]
        )

    def verify_build_evidence(self, code_path: str) -> EvidenceResult:
        return self._verify_evidence("BUILD", code_path, ["name", "version"])

    def verify_test_evidence(self, test_log_path: str) -> EvidenceResult:
        return self._verify_evidence(
            "TEST", test_log_path, ["tests", "passed", "failed", "duration"]
        )

    def verify_verify_evidence(self, verify_path: str) -> EvidenceResult:
        return self._verify_evidence("VERIFY", verify_path, ["gates", "status"])

    def verify_ship_evidence(self, ship_report_path: str) -> EvidenceResult:
        return self._verify_evidence(
            "SHIP", ship_report_path, ["version", "artifacts", "deployed"]
        )

    def _verify_evidence(
        self, step: StepType, evidence_path: str, required_fields: List[str]
    ) -> EvidenceResult:
        result = EvidenceResult(step=step, evidence_path=evidence_path)
        path = Path(evidence_path)

        try:
            if not path.exists():
                result.issues.append("File does not exist")
                return result

            result.checks.exists = True

            if path.stat().st_size == 0:
                result.issues.append("File is empty")
                return result

            result.checks.has_content = True
            content = path.read_text()
            ext = path.suffix.lower()

            if ext in self.parseable_extensions:
                if ext == ".json":
                    try:
                        parsed = json.loads(content)
                        result.checks.parseable = True
                    except json.JSONDecodeError:
                        result.issues.append("Invalid JSON")
                        return result
                else:
                    parsed = content
                    result.checks.parseable = True

                missing_fields = self._check_required_fields(parsed, required_fields)
                if not missing_fields:
                    result.checks.has_required_fields = True
                else:
                    result.issues.append(
                        f"Missing required fields: {', '.join(missing_fields)}"
                    )
            else:
                result.checks.parseable = True
                result.checks.has_required_fields = True

            result.valid = all(
                getattr(result.checks, f) for f in result.checks.model_fields
            )
        except Exception as e:
            result.issues.append(str(e))

        return result

    def _check_required_fields(self, data, required_fields: List[str]) -> List[str]:
        missing = []
        for field in required_fields:
            if isinstance(data, str):
                if field not in data:
                    missing.append(field)
            elif isinstance(data, dict):
                if field not in data:
                    missing.append(field)
        return missing

    def verify_glob_pattern(self, pattern: str) -> List[EvidenceResult]:
        from glob import glob

        files = glob(pattern, recursive=True)
        return [
            EvidenceResult(
                valid=True,
                step="BUILD",
                evidence_path=f,
                checks=EvidenceChecks(
                    exists=True,
                    has_content=True,
                    parseable=True,
                    has_required_fields=True,
                ),
                issues=[],
            )
            for f in files
        ]
