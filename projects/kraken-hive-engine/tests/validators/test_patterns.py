"""
Tests for PatternDetector - matches actual implementation.
"""

import pytest
from kraken.validators.patterns import PatternDetector, THEATRICAL_PATTERNS


class TestPatternDetector:
    """Test pattern detector functionality."""

    def setup_method(self):
        self.detector = PatternDetector()

    def test_detect_theatrical_mock_pattern(self):
        """Test detection of mock patterns."""
        code = "const mockResult = mock.success();"
        patterns = self.detector.detect_theatrical(code)
        assert len(patterns) > 0
        assert any("mock" in p.lower() for p in patterns)

    def test_detect_theatrical_todo_pattern(self):
        """Test detection of TODO patterns."""
        code = "// TODO: Implement this function"
        patterns = self.detector.detect_theatrical(code)
        assert len(patterns) > 0
        assert any("placeholder" in p.lower() for p in patterns)

    def test_detect_theatrical_fixme_pattern(self):
        """Test detection of FIXME patterns."""
        code = "// FIXME: This needs to be fixed"
        patterns = self.detector.detect_theatrical(code)
        assert len(patterns) > 0
        assert any("placeholder" in p.lower() for p in patterns)

    def test_detect_theatrical_fake_test_results(self):
        """Test detection of fake test results."""
        code = "return { passed: true } // simulated result"
        patterns = self.detector.detect_theatrical(code)
        assert len(patterns) > 0

    def test_detect_theatrical_documentation_only(self):
        """Test detection of documentation-only code."""
        code = "// This is just a comment\n// Another comment"
        patterns = self.detector.detect_theatrical(code)
        assert len(patterns) > 0
        assert any("documentation" in p.lower() for p in patterns)

    def test_detect_theatrical_skipped_tests(self):
        """Test detection of skipped tests."""
        code = "it.skip('skipped test', () => {});"
        patterns = self.detector.detect_theatrical(code)
        assert len(patterns) > 0
        assert any("skip" in p.lower() for p in patterns)

    def test_detect_theatrical_commented_out_code(self):
        """Test detection of commented-out code."""
        code = "// function oldImplementation() {"
        patterns = self.detector.detect_theatrical(code)
        assert len(patterns) > 0
        assert any("commented" in p.lower() for p in patterns)

    def test_detect_theatrical_multiple_patterns(self):
        """Test detection of multiple theatrical patterns."""
        code = "// TODO: Implement this\nit.skip('skipped', () => {});"
        patterns = self.detector.detect_theatrical(code)
        assert len(patterns) >= 2

    def test_detect_theatrical_clean_code(self):
        """Test detection on clean, non-theatrical code."""
        code = "function calculateSum(a, b) { return a + b; }"
        patterns = self.detector.detect_theatrical(code)
        assert len(patterns) == 0

    def test_detect_theatrical_with_mock_fake(self):
        """Test detection of mock, fake, stub patterns."""
        code = "const fakeImplementation = stub.test();"
        patterns = self.detector.detect_theatrical(code)
        assert len(patterns) > 0

    def test_detect_theatrical_placeholder_marker(self):
        """Test detection of [placeholder] markers."""
        code = "// [placeholder] not implemented yet"
        patterns = self.detector.detect_theatrical(code)
        assert len(patterns) > 0

    def test_get_patterns_by_category(self):
        """Test getting patterns by category."""
        patterns = self.detector.get_patterns_by_category("mock")
        assert len(patterns) > 0

    def test_get_all_patterns(self):
        """Test getting all patterns."""
        all_patterns = self.detector.get_all_patterns()
        assert len(all_patterns) == len(THEATRICAL_PATTERNS)

    def test_pattern_matching_case_insensitive(self):
        """Test pattern matching is case-insensitive."""
        code_lower = "// todo: fix this"
        code_upper = "// TODO: FIX THIS"

        patterns_lower = self.detector.detect_theatrical(code_lower)
        patterns_upper = self.detector.detect_theatrical(code_upper)

        assert len(patterns_lower) > 0
        assert len(patterns_upper) > 0

    def test_empty_code(self):
        """Test detection on empty code."""
        patterns = self.detector.detect_theatrical("")
        assert len(patterns) == 0

    def test_whitespace_only(self):
        """Test detection on whitespace-only code."""
        patterns = self.detector.detect_theatrical("   \n\t  \n")
        assert len(patterns) == 0
