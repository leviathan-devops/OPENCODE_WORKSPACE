"""
Theatrical code pattern detection for anti-hallucination validation.
Ported from Kraken Ultra TypeScript to Python.
"""

import re
from typing import Dict, List, Pattern
from enum import Enum


class TheatricalPattern(str, Enum):
    MOCK_WITHOUT_EXECUTION = "mockWithoutExecution"
    PLACEHOLDER_CODE = "placeholderCode"
    NEVER_CALLED_CODE = "neverCalledCode"
    FAKE_TEST_RESULTS = "fakeTestResults"
    DOCUMENTATION_ONLY = "documentationOnly"
    SKIPPED_TESTS = "skippedTests"
    HARDCODED_RETURN_VALUES = "hardcodedReturnValues"
    COMMENTED_OUT_CODE = "commentedOutCode"
    EMPTY_TRY_CATCH = "emptyTryCatch"
    INFINITE_LOOPS_WITH_BREAKS = "infiniteLoopsWithBreaks"
    NO_OP_FUNCTIONS = "noOpFunctions"
    ALWAYS_TRUE_CONDITIONS = "alwaysTrueConditions"
    UNUSED_IMPORTS = "unusedImports"
    FAKE_ASYNC_PATTERNS = "fakeAsyncPatterns"
    EMPTY_INTERFACES = "emptyInterfaces"
    EMPTY_CLASSES = "emptyClasses"
    UNUSED_PARAMETERS = "unusedParameters"
    MAGIC_NUMBERS = "magicNumbers"


THEATRICAL_PATTERNS: Dict[TheatricalPattern, Pattern] = {
    TheatricalPattern.MOCK_WITHOUT_EXECUTION: re.compile(
        r"mock|simulate|stub|fake.*test|dummy", re.IGNORECASE
    ),
    TheatricalPattern.PLACEHOLDER_CODE: re.compile(
        r"TODO|FIXME|HACK|XXX|\[placeholder\]|not implemented", re.IGNORECASE
    ),
    TheatricalPattern.NEVER_CALLED_CODE: re.compile(
        r"function\s+\w+\s*\(\s*\)\s*\{\s*\}|export\s+\w+;\s*$", re.MULTILINE
    ),
    TheatricalPattern.FAKE_TEST_RESULTS: re.compile(
        r'"passed".*true|"success".*true.*\/\/\s*(simulated|fake|mock)', re.IGNORECASE
    ),
    TheatricalPattern.DOCUMENTATION_ONLY: re.compile(
        r"^\s*\/\/.*$|^\s*\/\*[\s\S]*?\*\/\s*$", re.MULTILINE
    ),
    TheatricalPattern.SKIPPED_TESTS: re.compile(
        r"\.skip\(|\.only\(|xit\(|xdescribe\(|xtest\(", re.IGNORECASE
    ),
    TheatricalPattern.HARDCODED_RETURN_VALUES: re.compile(
        r"return\s+(true|false|null|undefined|\"\")\s*;\s*$", re.MULTILINE
    ),
    TheatricalPattern.COMMENTED_OUT_CODE: re.compile(
        r"^\s*\/\/.*function|^\s*\/\/.*import|^\s*\/\/.*export", re.MULTILINE
    ),
    TheatricalPattern.EMPTY_TRY_CATCH: re.compile(
        r"try\s*\{\s*\}\s*catch\s*\(\s*\w+\s*\)\s*\{\s*\}"
    ),
    TheatricalPattern.INFINITE_LOOPS_WITH_BREAKS: re.compile(
        r"while\s*\(\s*true\s*\)\s*\{[^}]*break"
    ),
    TheatricalPattern.NO_OP_FUNCTIONS: re.compile(
        r"function\s*\(\s*\)\s*\{\s*console\.log\s*\([^)]*\)\s*;?\}"
    ),
    TheatricalPattern.ALWAYS_TRUE_CONDITIONS: re.compile(
        r"if\s*\(\s*true\s*\)|if\s*\(\s*false\s*\)"
    ),
    TheatricalPattern.UNUSED_IMPORTS: re.compile(
        r"import\s+.*\s+from\s+['\"][^'\"]+['\"];?\s*(\/\/.*|$)", re.MULTILINE
    ),
    TheatricalPattern.FAKE_ASYNC_PATTERNS: re.compile(
        r"await\s+new\s+Promise\s*\(\s*resolve\s*=>\s*resolve\s*\("
    ),
    TheatricalPattern.EMPTY_INTERFACES: re.compile(r"interface\s+\w+\s*\{\s*\}"),
    TheatricalPattern.EMPTY_CLASSES: re.compile(r"class\s+\w+\s*\{\s*\}"),
    TheatricalPattern.UNUSED_PARAMETERS: re.compile(r"function\s+\w+\([^)]*\)_?unused"),
    TheatricalPattern.MAGIC_NUMBERS: re.compile(r"\b\d{3,}\b(?![a-zA-Z])"),
}

REQUIRED_EVIDENCE = {
    "PLAN": [".shark/plan.md", ".shark/claims.json"],
    "BUILD": ["package.json", "tsconfig.json", "src/**/*.ts"],
    "TEST": [".shark/test-results/stage1.json", ".shark/test-results/stage2.json"],
    "VERIFY": [".shark/verification-gates.md"],
    "SHIP": [".shark/SHIP_REPORT.md"],
}

PATTERN_DESCRIPTIONS = {
    TheatricalPattern.MOCK_WITHOUT_EXECUTION: "Code uses mocks without actual execution",
    TheatricalPattern.PLACEHOLDER_CODE: "Contains TODO/FIXME/HACK placeholders indicating incomplete implementation",
    TheatricalPattern.NEVER_CALLED_CODE: "Functions or exports defined but never invoked",
    TheatricalPattern.FAKE_TEST_RESULTS: "Test results appear to be hardcoded or simulated",
    TheatricalPattern.DOCUMENTATION_ONLY: "File contains only comments, no actual code",
    TheatricalPattern.SKIPPED_TESTS: "Tests are marked as skipped (.skip, xit, xdescribe)",
    TheatricalPattern.HARDCODED_RETURN_VALUES: "Functions return hardcoded values instead of real logic",
    TheatricalPattern.COMMENTED_OUT_CODE: "Large blocks of code are commented out",
    TheatricalPattern.EMPTY_TRY_CATCH: "Empty try-catch blocks that mask errors",
    TheatricalPattern.INFINITE_LOOPS_WITH_BREAKS: "Suspicious infinite loop patterns",
    TheatricalPattern.NO_OP_FUNCTIONS: "Console.log used instead of real implementation",
    TheatricalPattern.ALWAYS_TRUE_CONDITIONS: "Conditions with hardcoded true/false",
    TheatricalPattern.UNUSED_IMPORTS: "Imported modules that are never used",
    TheatricalPattern.FAKE_ASYNC_PATTERNS: "Fake async patterns using immediate Promise resolution",
    TheatricalPattern.EMPTY_INTERFACES: "Empty interfaces with no properties",
    TheatricalPattern.EMPTY_CLASSES: "Empty classes with no members",
    TheatricalPattern.UNUSED_PARAMETERS: "Parameters marked as unused",
    TheatricalPattern.MAGIC_NUMBERS: "Unexplained numeric literals",
}


def get_pattern_count() -> int:
    return len(THEATRICAL_PATTERNS)


def get_pattern_description(pattern: TheatricalPattern) -> str:
    return PATTERN_DESCRIPTIONS.get(pattern, "Unknown pattern")


def validate_pattern_exists(pattern_name: str) -> bool:
    """Validate that a pattern name exists in THEATRICAL_PATTERNS."""
    try:
        TheatricalPattern(pattern_name)
        return True
    except ValueError:
        return False


class PatternDetector:
    """Detects theatrical code patterns in source code."""

    def __init__(self):
        """Initialize pattern detector with theatrical patterns."""
        self.patterns = THEATRICAL_PATTERNS

    def detect_theatrical(self, code: str) -> List[str]:
        """
        Detect theatrical patterns in code.

        Args:
            code: Source code to analyze

        Returns:
            List of detected pattern names
        """
        if not code or not code.strip():
            return []

        detected = []
        for pattern_name, pattern_regex in self.patterns.items():
            if pattern_regex.search(code):
                detected.append(pattern_name.value)

        return detected

    def get_patterns_by_category(self, category: str) -> List[TheatricalPattern]:
        """
        Get all patterns in a specific category.

        Args:
            category: Category name to filter by

        Returns:
            List of patterns in the category
        """
        return [p for p in TheatricalPattern if category.lower() in p.value.lower()]

    def get_all_patterns(self) -> List[TheatricalPattern]:
        """
        Get all theatrical patterns.

        Returns:
            List of all patterns
        """
        return list(TheatricalPattern)
