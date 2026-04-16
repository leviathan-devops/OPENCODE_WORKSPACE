"""
Kraken validators module - Anti-hallucination validation system.
"""

from .patterns import (
    TheatricalPattern,
    THEATRICAL_PATTERNS,
    REQUIRED_EVIDENCE,
    PATTERN_DESCRIPTIONS,
    get_pattern_count,
    get_pattern_description,
    validate_pattern_exists,
    PatternDetector,
)
from .mechanical_validator import MechanicalValidator, ValidationResult, SandboxResult
from .evidence_checker import EvidenceChecker, EvidenceResult, EvidenceChecks
from .validator_hook import ValidatorHook, InterceptResult

__all__ = [
    "TheatricalPattern",
    "THEATRICAL_PATTERNS",
    "REQUIRED_EVIDENCE",
    "PATTERN_DESCRIPTIONS",
    "get_pattern_count",
    "get_pattern_description",
    "validate_pattern_exists",
    "PatternDetector",
    "MechanicalValidator",
    "ValidationResult",
    "SandboxResult",
    "EvidenceChecker",
    "EvidenceResult",
    "EvidenceChecks",
    "ValidatorHook",
    "InterceptResult",
]
