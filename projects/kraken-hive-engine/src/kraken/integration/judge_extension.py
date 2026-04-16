"""
Hive Judge extension with Kraken anti-hallucination validators.
"""

from typing import Any, Dict, Optional
from kraken.validators import MechanicalValidator, EvidenceChecker, PatternDetector


class KrakenEnhancedJudge:
    """
    Hive Judge enhanced with Kraken validation capabilities.

    This class extends Hive's Judge system with:
    1. Mechanical validation - checks for executable code
    2. Evidence checking - verifies claims against context
    3. Pattern detection - identifies theatrical code patterns

    Integration Point: Hive Judge system for agent output evaluation.
    """

    def __init__(self, sandbox_dir: Optional[str] = None):
        """
        Initialize the enhanced judge with Kraken validators.

        Args:
            sandbox_dir: Directory for sandboxed code execution (optional)
        """
        self.mechanical_validator = MechanicalValidator(sandbox_dir=sandbox_dir)
        self.evidence_checker = EvidenceChecker()
        self.pattern_detector = PatternDetector()

    def evaluate(self, agent_output: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate agent output with Kraken validators.

        This method implements the validation pipeline:
        1. Mechanical validation - is the code actually runnable?
        2. Evidence checking - are claims supported by evidence?
        3. Pattern detection - does the code contain theatrical patterns?

        Args:
            agent_output: The output from the agent to evaluate
            context: Additional context including files, imports, metadata

        Returns:
            Dict with evaluation results including:
            - reject: Whether to reject the output
            - reason: Reason for rejection (if any)
            - details: Detailed validation results
        """
        results = {
            "reject": False,
            "reason": "",
            "details": {},
            "mechanical_validation": None,
            "evidence_check": None,
            "pattern_detection": None,
        }

        # Step 1: Mechanical validation
        mechanical_result = self.mechanical_validator.validate_workflow_step(
            "VALIDATE", agent_output
        )
        results["mechanical_validation"] = {
            "passed": mechanical_result.passed,
            "theatrical_detected": mechanical_result.theatrical_detected,
            "theatrical_patterns": mechanical_result.theatrical_patterns,
            "actual_compilation": mechanical_result.actual_compilation,
        }

        if not mechanical_result.passed:
            results["reject"] = True
            results["reason"] = "Mechanical validation failed"
            if mechanical_result.theatrical_patterns:
                results["reason"] += f": {', '.join(mechanical_result.theatrical_patterns)}"
            return results

        # Step 2: Evidence checking
        evidence_result = self.evidence_checker.check(agent_output, context)
        results["evidence_check"] = {
            "sufficient": evidence_result.sufficient,
            "score": evidence_result.score,
            "missing_evidence": evidence_result.missing_evidence,
        }

        if not evidence_result.sufficient:
            results["reject"] = True
            results["reason"] = "Insufficient evidence"
            if evidence_result.missing_evidence:
                results["reason"] += f": {evidence_result.missing_evidence}"
            return results

        # Step 3: Pattern detection
        patterns = self.pattern_detector.detect_theatrical(agent_output)
        results["pattern_detection"] = {
            "patterns_found": patterns,
            "count": len(patterns),
        }

        if patterns:
            results["reject"] = True
            results["reason"] = f"Theatrical patterns detected: {', '.join(patterns[:3])}"
            if len(patterns) > 3:
                results["reason"] += f" and {len(patterns) - 3} more"
            return results

        # All validations passed
        results["reject"] = False
        results["reason"] = "All validations passed"
        return results

    def evaluate_with_files(
        self, agent_output: str, file_paths: list, context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate agent output with file-based validation.

        This method extends the basic evaluation by also validating
        against actual files referenced in the output.

        Args:
            agent_output: The output from the agent
            file_paths: List of file paths referenced in the output
            context: Additional context

        Returns:
            Enhanced evaluation results including file validation
        """
        # First do basic evaluation
        results = self.evaluate(agent_output, context)

        # Add file validation if we have files
        if file_paths:
            file_results = []
            for file_path in file_paths:
                try:
                    file_result = self.mechanical_validator.validate_workflow_step(
                        "BUILD", file_path
                    )
                    file_results.append(
                        {
                            "file": file_path,
                            "passed": file_result.passed,
                            "theatrical": file_result.theatrical_detected,
                        }
                    )
                except Exception as e:
                    file_results.append(
                        {
                            "file": file_path,
                            "passed": False,
                            "error": str(e),
                        }
                    )

            results["file_validation"] = file_results

            # Check if any files failed validation
            failed_files = [f for f in file_results if not f.get("passed", False)]
            if failed_files and not results["reject"]:
                results["reject"] = True
                results["reason"] = f"File validation failed for {len(failed_files)} files"

        return results

    def batch_evaluate(self, evaluations: list) -> Dict[str, Any]:
        """
        Evaluate multiple agent outputs in batch.

        Useful for evaluating entire workflows or multiple agent steps.

        Args:
            evaluations: List of dicts with 'output' and 'context' keys

        Returns:
            Batch evaluation results with statistics
        """
        batch_results = {
            "total": len(evaluations),
            "passed": 0,
            "failed": 0,
            "reasons": {},
            "details": [],
        }

        for i, eval_data in enumerate(evaluations):
            result = self.evaluate(eval_data.get("output", ""), eval_data.get("context", {}))

            batch_results["details"].append(
                {
                    "index": i,
                    "reject": result["reject"],
                    "reason": result["reason"],
                }
            )

            if result["reject"]:
                batch_results["failed"] += 1
                reason = (
                    result["reason"].split(":")[0] if ":" in result["reason"] else result["reason"]
                )
                batch_results["reasons"][reason] = batch_results["reasons"].get(reason, 0) + 1
            else:
                batch_results["passed"] += 1

        return batch_results

    def get_validation_stats(self) -> Dict[str, Any]:
        """
        Get statistics about validation performance.

        Returns:
            Statistics including total evaluations, pass/fail rates, etc.
        """
        # This would track statistics over time
        # For now, return basic structure
        return {
            "validators_loaded": True,
            "mechanical_validator": self.mechanical_validator.__class__.__name__,
            "evidence_checker": self.evidence_checker.__class__.__name__,
            "pattern_detector": self.pattern_detector.__class__.__name__,
            "sandbox_available": hasattr(self.mechanical_validator, "sandbox_dir"),
        }


# Factory function for Hive integration
def create_enhanced_judge(config: Optional[Dict[str, Any]] = None) -> KrakenEnhancedJudge:
    """
    Factory function to create a KrakenEnhancedJudge instance.

    This function is designed to be called from Hive's configuration
    to integrate Kraken validators into the Judge system.

    Args:
        config: Configuration dictionary (optional)

    Returns:
        Configured KrakenEnhancedJudge instance
    """
    if config is None:
        config = {}

    sandbox_dir = config.get("sandbox_dir")
    return KrakenEnhancedJudge(sandbox_dir=sandbox_dir)
