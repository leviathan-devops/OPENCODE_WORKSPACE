"""
Tests for EvidenceChecker - matches actual implementation.
"""

import pytest
import json
from pathlib import Path
from kraken.validators.evidence_checker import EvidenceChecker, EvidenceResult


class TestEvidenceChecker:
    """Test evidence checker functionality."""

    def setup_method(self):
        """Create test checker."""
        self.checker = EvidenceChecker()
        self.test_dir = Path("/tmp/evidence-checker-test")
        self.test_dir.mkdir(exist_ok=True)

    def test_verify_plan_evidence_valid(self):
        """Test verifying valid plan evidence."""
        plan_file = self.test_dir / "plan.md"
        plan_file.write_text(
            "# Plan\n\ntitle: Test\ndescription: Test description\nsteps:\n  - step 1\n  - step 2"
        )

        result = self.checker.verify_plan_evidence(str(plan_file))
        assert isinstance(result, EvidenceResult)
        assert result.valid is True
        assert result.step == "PLAN"

    def test_verify_plan_evidence_missing_fields(self):
        """Test verifying plan evidence with missing fields."""
        plan_file = self.test_dir / "plan.md"
        plan_file.write_text("# Plan\n\nThis is just a title")

        result = self.checker.verify_plan_evidence(str(plan_file))
        assert isinstance(result, EvidenceResult)
        assert result.valid is False
        assert len(result.issues) > 0

    def test_verify_plan_evidence_nonexistent(self):
        """Test verifying nonexistent plan evidence."""
        result = self.checker.verify_plan_evidence("/nonexistent/plan.md")
        assert result.valid is False
        assert "does not exist" in result.issues[0]

    def test_verify_build_evidence_valid(self):
        """Test verifying valid build evidence."""
        build_file = self.test_dir / "package.json"
        build_file.write_text('{"name": "test", "version": "1.0.0"}')

        result = self.checker.verify_build_evidence(str(build_file))
        assert isinstance(result, EvidenceResult)
        assert result.valid is True
        assert result.step == "BUILD"

    def test_verify_build_evidence_invalid_json(self):
        """Test verifying invalid JSON build evidence."""
        build_file = self.test_dir / "package.json"
        build_file.write_text("not valid json {")

        result = self.checker.verify_build_evidence(str(build_file))
        assert result.valid is False
        assert "Invalid JSON" in result.issues[0]

    def test_verify_test_evidence_valid(self):
        """Test verifying valid test evidence."""
        test_file = self.test_dir / "test-results.json"
        test_file.write_text('{"tests": 10, "passed": 9, "failed": 1, "duration": 1.5}')

        result = self.checker.verify_test_evidence(str(test_file))
        assert isinstance(result, EvidenceResult)
        assert result.valid is True
        assert result.step == "TEST"

    def test_verify_test_evidence_missing_fields(self):
        """Test verifying test evidence with missing fields."""
        test_file = self.test_dir / "test-results.json"
        test_file.write_text('{"tests": 10}')

        result = self.checker.verify_test_evidence(str(test_file))
        assert result.valid is False

    def test_verify_verify_evidence_valid(self):
        """Test verifying valid verify evidence."""
        verify_file = self.test_dir / "gates.json"
        verify_file.write_text(
            '{"gates": [{"name": "gate1", "status": "passed"}], "status": "verified"}'
        )

        result = self.checker.verify_verify_evidence(str(verify_file))
        assert isinstance(result, EvidenceResult)
        assert result.valid is True
        assert result.step == "VERIFY"

    def test_verify_ship_evidence_valid(self):
        """Test verifying valid ship evidence."""
        ship_file = self.test_dir / "ship.json"
        ship_file.write_text('{"version": "1.0.0", "artifacts": ["a.jar"], "deployed": true}')

        result = self.checker.verify_ship_evidence(str(ship_file))
        assert isinstance(result, EvidenceResult)
        assert result.valid is True
        assert result.step == "SHIP"

    def test_verify_empty_file(self):
        """Test verifying empty file."""
        empty_file = self.test_dir / "empty.md"
        empty_file.write_text("")

        result = self.checker.verify_plan_evidence(str(empty_file))
        assert result.valid is False
        assert "empty" in result.issues[0].lower()

    def test_verify_non_json_file(self):
        """Test verifying non-JSON file with text matching."""
        text_file = self.test_dir / "readme.md"
        text_file.write_text(
            "# Readme\n\ntitle: My Project\ndescription: A project\nsteps:\n  - step 1"
        )

        result = self.checker.verify_plan_evidence(str(text_file))
        assert result.checks.parseable is True
        assert result.checks.has_required_fields is True
        assert result.valid is True

    def test_verify_glob_pattern(self):
        """Test verifying glob pattern."""
        (self.test_dir / "file1.json").write_text('{"name": "test"}')
        (self.test_dir / "file2.json").write_text('{"name": "test2"}')

        results = self.checker.verify_glob_pattern(str(self.test_dir / "*.json"))
        assert len(results) == 2
        assert all(isinstance(r, EvidenceResult) for r in results)

    def test_verify_unknown_extension(self):
        """Test verifying file with unknown extension."""
        unknown_file = self.test_dir / "data.txt"
        unknown_file.write_text("some text content")

        result = self.checker.verify_build_evidence(str(unknown_file))
        assert result.checks.parseable is True

    def teardown_method(self):
        """Clean up test files."""
        import shutil

        if self.test_dir.exists():
            shutil.rmtree(self.test_dir)
