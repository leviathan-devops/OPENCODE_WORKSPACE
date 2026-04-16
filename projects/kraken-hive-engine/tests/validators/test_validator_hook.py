"""
Tests for ValidatorHook - matches actual implementation.
"""

import pytest
import tempfile
import os
from pathlib import Path
from kraken.validators.validator_hook import ValidatorHook, InterceptResult


class TestValidatorHook:
    """Test validator hook functionality."""

    def setup_method(self):
        """Create test directory for hook operations."""
        self.test_dir = tempfile.mkdtemp(prefix="hook-test-")
        self.hook = ValidatorHook(sandbox_dir=self.test_dir)

    def teardown_method(self):
        """Clean up test directory."""
        import shutil

        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_intercept_output_valid(self):
        """Test intercept with valid output."""
        result = self.hook.intercept_output("agent1", "def real_function():\n    return 42")
        assert isinstance(result, InterceptResult)
        assert result.valid is True
        assert result.blocked is False

    def test_intercept_output_theatrical(self):
        """Test intercept with theatrical patterns."""
        result = self.hook.intercept_output("agent1", "# TODO: implement this later")
        assert isinstance(result, InterceptResult)
        assert result.blocked is True
        assert result.reason is not None
        assert "theatrical" in result.reason.lower() or "placeholder" in result.reason.lower()

    def test_intercept_output_with_mock(self):
        """Test intercept with mock without execution."""
        result = self.hook.intercept_output("agent1", "mockImplementation(); // fake test")
        assert isinstance(result, InterceptResult)
        assert result.blocked is True

    def test_validate_agent_output_valid(self):
        """Test validating agent output."""
        from kraken.validators.mechanical_validator import ValidationResult

        result = self.hook.validate_agent_output("agent1", "def add(a, b):\n    return a + b")
        assert isinstance(result, ValidationResult)

    def test_validate_agent_output_with_patterns(self):
        """Test validating agent output with theatrical patterns."""
        from kraken.validators.mechanical_validator import ValidationResult

        result = self.hook.validate_agent_output("agent1", "# FIXME: fix this later")
        assert isinstance(result, ValidationResult)
        assert result.passed is False
        assert result.theatrical_detected is True

    def test_validate_evidence_plan(self):
        """Test validating plan evidence."""
        plan_dir = Path(self.test_dir) / ".shark"
        plan_dir.mkdir(parents=True, exist_ok=True)
        (plan_dir / "plan.md").write_text(
            "# Plan\n\ntitle: Test Plan\ndescription: A test plan\nsteps:\n  - step 1\n  - step 2"
        )

        result = self.hook.validate_evidence("PLAN", str(plan_dir / "plan.md"))
        assert result.valid is True

    def test_validate_evidence_build(self):
        """Test validating build evidence."""
        build_dir = Path(self.test_dir)
        (build_dir / "package.json").write_text('{"name": "test"}')
        (build_dir / "tsconfig.json").write_text('{"compilerOptions": {}}')

        result = self.hook.validate_evidence("BUILD", str(build_dir))
        assert result.step == "BUILD"

    def test_validate_workflow(self):
        """Test validating full workflow."""
        workflow_dir = Path(self.test_dir)
        (workflow_dir / ".shark").mkdir(exist_ok=True)
        (workflow_dir / ".shark" / "plan.md").write_text("# Plan")
        (workflow_dir / "package.json").write_text('{"name": "test"}')
        (workflow_dir / ".shark" / "test-results").mkdir(exist_ok=True)
        (workflow_dir / ".shark" / "verification-gates.md").write_text("# Verification")
        (workflow_dir / ".shark" / "SHIP_REPORT.md").write_text("# Ship Report")

        results = self.hook.validate_workflow(str(workflow_dir))
        assert len(results) == 5
        assert results[0]["step"] == "PLAN"

    def test_enable_disable(self):
        """Test enabling and disabling hook."""
        assert self.hook.is_enabled() is True
        self.hook.disable()
        assert self.hook.is_enabled() is False
        self.hook.enable()
        assert self.hook.is_enabled() is True

    def test_disabled_hook_allows_all(self):
        """Test that disabled hook allows all output."""
        self.hook.disable()
        result = self.hook.intercept_output("agent1", "# TODO: implement this")
        assert result.valid is True
        assert result.blocked is False

    def test_block_theatrical_callback(self):
        """Test block theatrical callback."""
        calls = []

        def callback(agent_id, error):
            calls.append((agent_id, error))

        self.hook.register_intercept_callback(callback)
        self.hook.block_theatrical("agent1", ["placeholderCode"])
        assert len(calls) == 1
        assert calls[0][0] == "agent1"

    def test_get_validator(self):
        """Test getting validator."""
        validator = self.hook.get_validator()
        assert validator is not None

    def test_get_checker(self):
        """Test getting evidence checker."""
        checker = self.hook.get_checker()
        assert checker is not None
