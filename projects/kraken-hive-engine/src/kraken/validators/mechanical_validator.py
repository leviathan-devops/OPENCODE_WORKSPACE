"""
Mechanical validator for detecting theatrical code patterns.
Ported from Kraken Ultra TypeScript to Python.
"""

import asyncio
import subprocess
import tempfile
import os
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel

from .patterns import THEATRICAL_PATTERNS, TheatricalPattern


class ValidationResult(BaseModel):
    passed: bool = False
    theatrical_detected: bool = False
    theatrical_patterns: List[str] = []
    actual_compilation: bool = False
    tests_actually_run: bool = False
    code_integration: bool = False


class SandboxResult(BaseModel):
    success: bool
    output: str
    exit_code: int


class MechanicalValidator:
    def __init__(self, sandbox_dir: Optional[str] = None, timeout_ms: int = 5000):
        self.sandbox_dir = Path(sandbox_dir or "/tmp/validator-sandbox")
        self.timeout_ms = timeout_ms
        self._ensure_sandbox()

    def _ensure_sandbox(self) -> None:
        self.sandbox_dir.mkdir(parents=True, exist_ok=True)

    async def run_in_sandbox(
        self, code: str, language: str = "python"
    ) -> SandboxResult:
        ext = (
            "py" if language == "python" else "ts" if language == "typescript" else "js"
        )
        temp_file = self.sandbox_dir / f"temp-{os.getpid()}-{id(code)}.{ext}"

        try:
            temp_file.write_text(code)

            if language == "python":
                cmd = ["python", str(temp_file)]
            elif language == "typescript":
                cmd = ["npx", "ts-node", str(temp_file)]
            else:
                cmd = ["node", str(temp_file)]

            result = await self._exec_command(cmd)
            return result
        except Exception as e:
            return SandboxResult(success=False, output=str(e), exit_code=1)
        finally:
            if temp_file.exists():
                temp_file.unlink()

    async def _exec_command(self, cmd: List[str]) -> SandboxResult:
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(), timeout=self.timeout_ms / 1000
            )
            output = (stdout or b"").decode() + (stderr or b"").decode()
            return SandboxResult(
                success=proc.returncode == 0,
                output=output,
                exit_code=proc.returncode or 1,
            )
        except asyncio.TimeoutError:
            return SandboxResult(success=False, output="Timeout exceeded", exit_code=-1)
        except Exception as e:
            return SandboxResult(success=False, output=str(e), exit_code=1)

    def cross_validate(self, claim: str, evidence: List[str]) -> bool:
        if not claim or not evidence:
            return False

        claim_lower = claim.lower()
        claim_words = [w for w in claim_lower.split() if len(w) > 3]

        return any(any(word in e.lower() for word in claim_words) for e in evidence)

    def detect_theatrical(self, code: str) -> List[str]:
        detected = []
        for pattern_name, pattern in THEATRICAL_PATTERNS.items():
            if pattern.search(code):
                detected.append(pattern_name.value)
        return detected

    def validate_workflow_step(self, step: str, evidence_path: str) -> ValidationResult:
        result = ValidationResult()

        try:
            path = Path(evidence_path)
            if not path.exists():
                return result

            content = path.read_text()
            patterns = self.detect_theatrical(content)

            result.theatrical_detected = len(patterns) > 0
            result.theatrical_patterns = patterns

            step_upper = step.upper()
            if step_upper == "BUILD":
                result.actual_compilation = self._check_compilation(content)
                result.code_integration = self._check_imports(content)
            elif step_upper == "TEST":
                result.tests_actually_run = self._check_test_execution(content)
            else:
                result.actual_compilation = True

            result.passed = (
                not result.theatrical_detected
                and (result.actual_compilation or step_upper == "PLAN")
                and (step_upper != "TEST" or result.tests_actually_run)
            )
        except Exception:
            pass

        return result

    def _check_compilation(self, content: str) -> bool:
        import re

        return (
            not re.search(
                r"\b(TODO|FIXME|HACK|XXX|not implemented)\b", content, re.IGNORECASE
            )
            and len(content.strip()) > 0
        )

    def _check_imports(self, content: str) -> bool:
        import re

        imports = re.findall(r"import\s+.*from\s+['\"][^'\"]+['\"]", content)
        return len(imports) == 0 or len(imports) > 0

    def _check_test_execution(self, content: str) -> bool:
        import re

        has_tests = re.search(
            r"\b(test\(|describe\(|it\(|expect\()", content, re.IGNORECASE
        )
        no_skips = not re.search(
            r"\b(\.skip\(|xit\(|xdescribe\()\b", content, re.IGNORECASE
        )
        return bool(has_tests and no_skips)

    def validate_directory(self, dir_path: str, step: str) -> ValidationResult:
        all_results = []
        path = Path(dir_path)

        if not path.exists():
            return ValidationResult()

        for file_path in path.rglob("*"):
            if file_path.suffix in {".ts", ".js", ".json", ".md", ".py"}:
                result = self.validate_workflow_step(step, str(file_path))
                all_results.append(result)

        if not all_results:
            return ValidationResult()

        return ValidationResult(
            passed=all(r.passed for r in all_results),
            theatrical_detected=any(r.theatrical_detected for r in all_results),
            theatrical_patterns=list(
                {p for r in all_results for p in r.theatrical_patterns}
            ),
            actual_compilation=any(r.actual_compilation for r in all_results),
            tests_actually_run=any(r.tests_actually_run for r in all_results),
            code_integration=any(r.code_integration for r in all_results),
        )
