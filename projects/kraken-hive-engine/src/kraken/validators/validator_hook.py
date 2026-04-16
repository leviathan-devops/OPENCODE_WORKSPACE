"""
Validator hook for intercepting and validating agent output.
Ported from Kraken Ultra TypeScript to Python.
Integrates with Hive framework for real-time validation.
"""

from typing import Dict, List, Optional, Any, Callable
from pathlib import Path
from pydantic import BaseModel

from .mechanical_validator import MechanicalValidator, ValidationResult
from .evidence_checker import EvidenceChecker, EvidenceResult


class InterceptResult(BaseModel):
    valid: bool
    blocked: bool
    reason: Optional[str] = None


class ValidatorHook:
    def __init__(self, sandbox_dir: Optional[str] = None, enabled: bool = True):
        self.validator = MechanicalValidator(sandbox_dir)
        self.checker = EvidenceChecker()
        self.enabled = enabled
        self._nemotron_service: Optional[Any] = None
        self._intercept_callbacks: List[Callable] = []

    def intercept_output(self, agent_id: str, output: str) -> InterceptResult:
        if not self.enabled:
            return InterceptResult(valid=True, blocked=False)

        patterns = self.validator.detect_theatrical(output)

        if patterns:
            return InterceptResult(
                valid=False,
                blocked=True,
                reason=f"Theatrical patterns detected: {', '.join(patterns)}",
            )

        return InterceptResult(valid=True, blocked=False)

    def block_theatrical(self, agent_id: str, patterns: List[str]) -> None:
        error = f"BLOCKED: Theatrical code detected in agent {agent_id}. Patterns: {', '.join(patterns)}"

        for callback in self._intercept_callbacks:
            try:
                callback(agent_id, error)
            except Exception:
                pass

    def register_intercept_callback(self, callback: Callable[[str, str], None]) -> None:
        self._intercept_callbacks.append(callback)

    def validate_agent_output(
        self, agent_id: str, output: str, evidence_path: Optional[str] = None
    ) -> ValidationResult:
        result = ValidationResult()

        if evidence_path:
            result = self.validator.validate_workflow_step("BUILD", evidence_path)

        output_patterns = self.validator.detect_theatrical(output)
        if output_patterns:
            result.theatrical_detected = True
            result.theatrical_patterns = list(
                set(result.theatrical_patterns + output_patterns)
            )
            result.passed = False

        return result

    def validate_evidence(self, step: str, evidence_path: str) -> EvidenceResult:
        step_upper = step.upper()
        method_map = {
            "PLAN": self.checker.verify_plan_evidence,
            "BUILD": self.checker.verify_build_evidence,
            "TEST": self.checker.verify_test_evidence,
            "VERIFY": self.checker.verify_verify_evidence,
            "SHIP": self.checker.verify_ship_evidence,
        }

        method = method_map.get(step_upper)
        if method:
            return method(evidence_path)

        return EvidenceResult(
            valid=False,
            step="PLAN",
            evidence_path=evidence_path,
            issues=[f"Unknown step: {step}"],
        )

    def validate_workflow(self, workspace_dir: str) -> List[Dict[str, Any]]:
        results = []
        base = Path(workspace_dir)

        steps = [
            {"name": "PLAN", "evidence": ".shark/plan.md", "type": "evidence"},
            {"name": "BUILD", "evidence": "package.json", "type": "evidence"},
            {"name": "TEST", "evidence": ".shark/test-results", "type": "validator"},
            {
                "name": "VERIFY",
                "evidence": ".shark/verification-gates.md",
                "type": "evidence",
            },
            {"name": "SHIP", "evidence": ".shark/SHIP_REPORT.md", "type": "evidence"},
        ]

        for step in steps:
            full_path = str(base / step["evidence"])
            valid = False
            result: Any

            if step["type"] == "evidence":
                result = self.validate_evidence(step["name"], full_path)
                valid = result.valid
            else:
                result = self.validator.validate_directory(full_path, step["name"])
                valid = result.passed

            results.append(
                {
                    "step": step["name"],
                    "result": result.model_dump()
                    if hasattr(result, "model_dump")
                    else result,
                    "valid": valid,
                }
            )

        return results

    def enable(self) -> None:
        self.enabled = True

    def disable(self) -> None:
        self.enabled = False

    def is_enabled(self) -> bool:
        return self.enabled

    def get_validator(self) -> MechanicalValidator:
        return self.validator

    def get_checker(self) -> EvidenceChecker:
        return self.checker
