"""
Tests for MechanicalValidator - matches actual implementation.
"""

import pytest
import tempfile
import os
from pathlib import Path
from kraken.validators.mechanical_validator import MechanicalValidator, ValidationResult


class TestMechanicalValidator:
    """Test mechanical validator functionality."""

    def setup_method(self):
        """Create test directory for sandbox operations."""
        self.test_dir = tempfile.mkdtemp(prefix="kraken-test-")
        self.validator = MechanicalValidator(sandbox_dir=self.test_dir)

    def teardown_method(self):
        """Clean up test directory."""
        import shutil

        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_detect_theatrical_mock_typescript(self):
        """Test detection of mock code in TypeScript."""
        code = "const mockResult = mock.success(); return true;"
        patterns = self.validator.detect_theatrical(code)
        assert len(patterns) > 0
        assert any("mock" in p.lower() for p in patterns)

    def test_detect_theatrical_todo_placeholders(self):
        """Test detection of TODO placeholders."""
        code = "// TODO: implement actual processing"
        patterns = self.validator.detect_theatrical(code)
        assert len(patterns) > 0
        assert any("placeholder" in p.lower() for p in patterns)

    def test_detect_theatrical_skipped_tests(self):
        """Test detection of skipped tests."""
        code = "it.skip('should do something', () => {});"
        patterns = self.validator.detect_theatrical(code)
        assert len(patterns) > 0
        assert any("skip" in p.lower() for p in patterns)

    def test_detect_theatrical_empty_try_catch(self):
        """Test detection of empty try-catch blocks."""
        code = "try {} catch (e) {}"
        patterns = self.validator.detect_theatrical(code)
        assert len(patterns) > 0
        assert any("empty" in p.lower() for p in patterns)

    def test_cross_validation_with_matching_evidence(self):
        """Test cross-validation with matching evidence."""
        claim = "This function encrypts data securely"
        evidence = ["function encryptData() { return encrypted; }", "data encryption is used"]
        result = self.validator.cross_validate(claim, evidence)
        assert result is True

    def test_cross_validation_no_matching_evidence(self):
        """Test cross-validation without matching evidence."""
        claim = "This module handles quantum cryptography correctly"
        evidence = ["function calculateTotal() { return 0; }", "const math = require('math')"]
        result = self.validator.cross_validate(claim, evidence)
        assert result is False

    def test_cross_validation_empty_claim(self):
        """Test cross-validation with empty claim."""
        claim = ""
        evidence = ["some evidence"]
        result = self.validator.cross_validate(claim, evidence)
        assert result is False

    def test_cross_validation_empty_evidence(self):
        """Test cross-validation with empty evidence."""
        claim = "Some claim"
        evidence = []
        result = self.validator.cross_validate(claim, evidence)
        assert result is False

    def test_validate_workflow_step_build(self):
        """Test validation of BUILD workflow step."""
        test_file = Path(self.test_dir) / "test.ts"
        test_file.write_text("""
        import * as fs from 'fs';
        export function process() {
            return fs.readFileSync('test.txt', 'utf-8');
        }
        """)

        result = self.validator.validate_workflow_step("BUILD", str(test_file))
        assert isinstance(result, ValidationResult)
        assert result.actual_compilation is True
        assert result.code_integration is True

    def test_validate_workflow_step_test(self):
        """Test validation of TEST workflow step."""
        test_file = Path(self.test_dir) / "test.test.ts"
        test_file.write_text("""
        import { describe, it, expect } from 'vitest';
        describe('test suite', () => {
            it('should work', () => {
                expect(1 + 1).toBe(2);
            });
        });
        """)

        result = self.validator.validate_workflow_step("TEST", str(test_file))
        assert isinstance(result, ValidationResult)
        assert result.tests_actually_run is True

    def test_validate_workflow_step_with_theatrical(self):
        """Test validation with theatrical code."""
        test_file = Path(self.test_dir) / "theatrical.ts"
        test_file.write_text("""
        // TODO: implement this
        function fakeTest() {
            return true;
        }
        """)

        result = self.validator.validate_workflow_step("BUILD", str(test_file))
        assert isinstance(result, ValidationResult)
        assert result.theatrical_detected is True
        assert len(result.theatrical_patterns) > 0

    def test_validate_directory(self):
        """Test directory validation."""
        dir_path = Path(self.test_dir) / "test-dir"
        dir_path.mkdir()

        (dir_path / "valid.ts").write_text("export const x = 1;")
        (dir_path / "theatrical.ts").write_text("// TODO: fix this")

        result = self.validator.validate_directory(str(dir_path), "BUILD")
        assert isinstance(result, ValidationResult)
        assert result.theatrical_detected is True

    def test_validate_nonexistent_directory(self):
        """Test validation of non-existent directory."""
        result = self.validator.validate_directory("/nonexistent/path", "BUILD")
        assert isinstance(result, ValidationResult)
        assert result.passed is False

    @pytest.mark.asyncio
    async def test_run_in_sandbox_python(self):
        """Test running Python code in sandbox."""
        code = "print('Hello, World!')"
        result = await self.validator.run_in_sandbox(code, "python")
        assert isinstance(result.success, bool)

    def test_check_compilation_valid(self):
        """Test compilation check with valid code."""
        content = "function test() { return 1; }"
        result = self.validator._check_compilation(content)
        assert result is True

    def test_check_compilation_with_todo(self):
        """Test compilation check with TODO."""
        content = "// TODO: implement this"
        result = self.validator._check_compilation(content)
        assert result is False

    def test_check_imports_with_imports(self):
        """Test import check with imports."""
        content = "import * as fs from 'fs';"
        result = self.validator._check_imports(content)
        assert result is True

    def test_check_imports_without_imports(self):
        """Test import check without imports."""
        content = "const x = 1;"
        result = self.validator._check_imports(content)
        assert result is True

    def test_check_test_execution_with_tests(self):
        """Test test execution check with actual tests."""
        content = "it('should work', () => {});"
        result = self.validator._check_test_execution(content)
        assert result is True

    def test_check_test_execution_with_skipped_tests(self):
        """Test test execution check with skipped tests."""
        content = "it.skip('should work', () => {});"
        result = self.validator._check_test_execution(content)
        assert result is False

    def test_check_test_execution_without_tests(self):
        """Test test execution check without tests."""
        content = "const x = 1;"
        result = self.validator._check_test_execution(content)
        assert result is False
