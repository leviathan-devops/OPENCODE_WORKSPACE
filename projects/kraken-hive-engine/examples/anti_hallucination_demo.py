#!/usr/bin/env python3
"""
Anti-Hallucination Demo - Kraken Hive Integration

This demo shows how Kraken Ultra's anti-hallucination validators
integrate with the Hive framework to detect theatrical code and
ensure evidence-based claims.

Usage:
    python anti_hallucination_demo.py
"""

import asyncio
import sys
from pathlib import Path

# Add project root to path for imports
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from kraken.validators import MechanicalValidator, EvidenceChecker, PatternDetector, ValidatorHook
from kraken.integration import KrakenEnhancedJudge


async def demo_mechanical_validator():
    """Demo mechanical validation."""
    print("🧪 1. Mechanical Validator")
    print("   " + "=" * 40)

    validator = MechanicalValidator()

    # Test 1: Code with TODO (should fail)
    todo_code = """
    function processData(data) {
        // TODO: implement actual processing
        return null;
    }
    """
    print("\n   Test 1: Code with TODO placeholder")
    result = validator.validate_workflow_step("BUILD", todo_code)
    print(f"     Passed: {result.passed}")
    print(f"     Theatrical: {result.theatrical_detected}")
    if result.theatrical_patterns:
        print(f"     Patterns: {', '.join(result.theatrical_patterns)}")

    # Test 2: Actual code (should pass)
    actual_code = """
    function add(a: number, b: number): number {
        return a + b;
    }
    """
    print("\n   Test 2: Actual implementation")
    result = validator.validate_workflow_step("BUILD", actual_code)
    print(f"     Passed: {result.passed}")
    print(f"     Theatrical: {result.theatrical_detected}")

    # Test 3: Cross-validation
    print("\n   Test 3: Cross-validation")
    claim = "The function encrypts user data"
    evidence = ["function encryptData()", "const crypto = require('crypto')"]
    has_evidence = validator.cross_validate(claim, evidence)
    print(f"     Claim: '{claim}'")
    print(f"     Evidence: {evidence}")
    print(f"     Validated: {has_evidence}")


async def demo_evidence_checker():
    """Demo evidence checking."""
    print("\n🔍 2. Evidence Checker")
    print("   " + "=" * 40)

    checker = EvidenceChecker()

    # Test 1: Claim with evidence
    print("\n   Test 1: Technical claim with evidence")
    technical_output = """
    The system implements OAuth 2.0 authentication with JWT tokens.
    Tokens are signed with RS256 and have 1-hour expiration.
    Refresh tokens are stored in HTTP-only cookies.
    """
    context = {
        "files": ["auth.py", "tokens.py"],
        "imports": ["import jwt", "from datetime import datetime"],
        "code_snippets": [
            "token = jwt.encode(payload, private_key, algorithm='RS256')",
            "response.set_cookie('refresh_token', token, httponly=True)",
        ],
    }
    result = checker.check(technical_output, context)
    print(f"     Sufficient evidence: {result.sufficient}")
    print(f"     Confidence score: {result.score:.2f}")

    # Test 2: Vague claim without evidence
    print("\n   Test 2: Vague claim without evidence")
    vague_output = "The system is highly secure and uses advanced algorithms."
    empty_context = {"files": [], "imports": [], "code_snippets": []}
    result = checker.check(vague_output, empty_context)
    print(f"     Sufficient evidence: {result.sufficient}")
    print(f"     Confidence score: {result.score:.2f}")
    if result.missing_evidence:
        print(f"     Missing: {result.missing_evidence}")


async def demo_pattern_detector():
    """Demo pattern detection."""
    print("\n🎭 3. Pattern Detector")
    print("   " + "=" * 40)

    detector = PatternDetector()

    # Test theatrical code
    theatrical_code = """
    // TODO: implement this properly
    function fakeImplementation() {
        try {
            // Simulate processing
        } catch (e) {
            // Ignore errors
        }
        return true; // Always succeeds
    }
    
    describe('fake tests', () => {
        it.skip('should work', () => {
            expect(true).toBe(true);
        });
    });
    """

    patterns = detector.detect_theatrical(theatrical_code)
    print(f"\n   Found {len(patterns)} theatrical patterns:")
    for i, pattern in enumerate(patterns, 1):
        print(f"     {i}. {pattern}")

    # Show pattern categories
    print("\n   Available pattern categories:")
    all_patterns = detector.get_all_patterns()
    categories = set(p.category for p in all_patterns)
    for category in sorted(categories):
        category_patterns = detector.get_patterns_by_category(category)
        print(f"     • {category}: {len(category_patterns)} patterns")


async def demo_validator_hook():
    """Demo validator hook."""
    print("\n🪝 4. Validator Hook")
    print("   " + "=" * 40)

    hook = ValidatorHook()

    # Test interception
    print("\n   Test: Intercept theatrical plan")
    from kraken.validators.validator_hook import ValidationContext

    theatrical_context = ValidationContext(
        operation="plan",
        agent_output="We'll use AI magic to solve everything automatically",
        files=[],
        metadata={"complexity": "high"},
    )

    result = hook.intercept(theatrical_context)
    print(f"     Intercepted: {result.intercepted}")
    print(f"     Reason: {result.reason}")
    if result.suggestions:
        print(f"     Suggestions: {result.suggestions}")


async def demo_integrated_judge():
    """Demo integrated judge."""
    print("\n⚖️  5. Integrated Judge (Hive Extension)")
    print("   " + "=" * 40)

    judge = KrakenEnhancedJudge()

    # Test 1: Theatrical code evaluation
    print("\n   Test 1: Evaluating theatrical code")
    theatrical_output = """
    I've implemented a revolutionary algorithm that solves all problems.
    The code uses quantum-inspired techniques and neural networks.
    """
    context = {"files": ["main.py"], "imports": ["print('Hello')"], "code_snippets": ["x = 1 + 1"]}

    result = judge.evaluate(theatrical_output, context)
    print(f"     Reject: {result['reject']}")
    print(f"     Reason: {result['reason']}")

    # Test 2: Valid code with evidence
    print("\n   Test 2: Evaluating valid code with evidence")
    valid_output = """
    Implemented user authentication with bcrypt password hashing.
    Passwords are hashed with 12 rounds and stored securely.
    """
    valid_context = {
        "files": ["auth.py", "security.py"],
        "imports": ["import bcrypt", "from datetime import datetime"],
        "code_snippets": [
            "hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))",
            "db.store_password(user_id, hashed)",
        ],
    }

    result = judge.evaluate(valid_output, valid_context)
    print(f"     Reject: {result['reject']}")
    print(f"     Reason: {result['reason']}")

    # Show validation stats
    print("\n   Judge Statistics:")
    stats = judge.get_validation_stats()
    for key, value in stats.items():
        print(f"     {key}: {value}")


async def main():
    """Run all demos."""
    print("=" * 60)
    print("KRAKEN HIVE - ANTI-HALLUCINATION DEMO")
    print("=" * 60)
    print("Demonstrating Kraken Ultra integration with Hive framework")
    print()

    await demo_mechanical_validator()
    await demo_evidence_checker()
    await demo_pattern_detector()
    await demo_validator_hook()
    await demo_integrated_judge()

    print("\n" + "=" * 60)
    print("✅ DEMO COMPLETE")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Integrate with Hive Judge: from kraken.integration import KrakenEnhancedJudge")
    print("2. Use in Hive agents: judge = KrakenEnhancedJudge()")
    print("3. Validate agent output: result = judge.evaluate(output, context)")
    print("4. Reject theatrical code: if result['reject']: return error")
    print("\nRun: kraken-hive demo  # For interactive demo")
    print("Run: kraken-hive test   # To run all tests")


if __name__ == "__main__":
    asyncio.run(main())
