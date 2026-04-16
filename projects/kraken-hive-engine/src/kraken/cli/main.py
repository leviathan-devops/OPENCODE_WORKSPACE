"""
Kraken Hive CLI - Integrated AI Agent Platform
"""

import click
import subprocess
import sys
from pathlib import Path
from typing import Optional

KRAKEN_AVAILABLE = False
try:
    from kraken.validators import (
        MechanicalValidator,
        EvidenceChecker,
        PatternDetector,
        ValidatorHook,
    )
    from kraken.integration import KrakenEnhancedJudge

    # Test that imports actually work
    _ = MechanicalValidator
    _ = EvidenceChecker
    _ = PatternDetector
    _ = ValidatorHook
    _ = KrakenEnhancedJudge
    KRAKEN_AVAILABLE = True
except ImportError as e:
    KRAKEN_AVAILABLE = False
    # Don't print error - just mark as unavailable
except Exception as e:
    KRAKEN_AVAILABLE = False
    # Other errors during import


@click.group()
def cli():
    """Kraken Hive - Integrated AI Agent Platform

    Hive becomes the UI/host platform, Kraken becomes the engine OS.
    Launch Hive in a fresh terminal with Kraken Ultra fully integrated.
    """
    pass


@cli.command()
def start():
    """Launch Hive with Kraken Ultra integration"""
    click.echo("🚀 Starting Kraken Hive...")

    # Check if Hive is available
    hive_path = Path("/home/leviathan/OPENCODE_WORKSPACE/projects/hive")
    if not hive_path.exists():
        click.echo("❌ Hive framework not found. Please run setup first.", err=True)
        click.echo(f"Expected at: {hive_path}")
        sys.exit(1)

    # Check if Kraken components are available
    if not KRAKEN_AVAILABLE:
        click.echo(
            "⚠️  Kraken components not fully installed. Running Hive without Kraken integration."
        )

    click.echo("✅ Hive framework detected")
    click.echo("✅ Kraken components: " + ("AVAILABLE" if KRAKEN_AVAILABLE else "NOT AVAILABLE"))

    # Launch Hive (placeholder - actual implementation would start Hive process)
    click.echo("\n📋 Launch sequence:")
    click.echo("  1. Starting Hive core...")
    click.echo("  2. Loading Kraken validators...")
    click.echo("  3. Initializing Judge extension...")
    click.echo("  4. Starting Event Bus with Nemotron...")
    click.echo("  5. Launching agent orchestration...")

    click.echo("\n🎯 To actually launch Hive with Kraken integration:")
    click.echo(f"  cd {hive_path}")
    click.echo("  source .venv/bin/activate")
    click.echo("  ./hive --help")

    if KRAKEN_AVAILABLE:
        click.echo("\n🧪 Kraken integration ready!")
        click.echo("   Use: from kraken.integration import KrakenEnhancedJudge")
        click.echo("   Use: from kraken.validators import MechanicalValidator")
    else:
        click.echo("\n⚠️  Install Kraken components first:")
        click.echo("   cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-hive-engine")
        click.echo("   pip install -e .")


@cli.command()
def test():
    """Run integration tests"""
    click.echo("🧪 Running Kraken Hive tests...")

    # Run pytest
    result = subprocess.run(
        [sys.executable, "-m", "pytest", "tests/", "-v"],
        cwd=Path(__file__).parent.parent.parent.parent,
    )

    if result.returncode == 0:
        click.echo("✅ All tests passed!")
    else:
        click.echo("❌ Some tests failed")
        sys.exit(result.returncode)


@cli.command()
def validate():
    """Validate Kraken components"""
    click.echo("🔍 Validating Kraken components...")

    if not KRAKEN_AVAILABLE:
        click.echo("❌ Kraken components not available. Please install first.")
        click.echo("   Run: pip install -e .")
        sys.exit(1)

    # Test each component
    components = [
        ("MechanicalValidator", MechanicalValidator),
        ("EvidenceChecker", EvidenceChecker),
        ("PatternDetector", PatternDetector),
        ("ValidatorHook", ValidatorHook),
    ]

    all_valid = True
    for name, component in components:
        try:
            instance = component() if name != "ValidatorHook" else component("/tmp/test-hook")
            click.echo(f"  ✅ {name}: OK")
        except Exception as e:
            click.echo(f"  ❌ {name}: FAILED - {e}")
            all_valid = False

    # Test integration
    try:
        judge = KrakenEnhancedJudge()
        click.echo(f"  ✅ KrakenEnhancedJudge: OK")
    except Exception as e:
        click.echo(f"  ❌ KrakenEnhancedJudge: FAILED - {e}")
        all_valid = False

    if all_valid:
        click.echo("\n🎉 All Kraken components validated successfully!")
    else:
        click.echo("\n⚠️  Some components failed validation")
        sys.exit(1)


@cli.command()
@click.option("--code", help="Code to validate for theatrical patterns")
@click.option("--file", type=click.Path(exists=True), help="File to validate")
def check(code: Optional[str], file: Optional[str]):
    """Check code for theatrical patterns"""
    if not KRAKEN_AVAILABLE:
        click.echo("❌ Kraken components not available")
        sys.exit(1)

    from kraken.validators import PatternDetector

    detector = PatternDetector()

    if file:
        with open(file, "r") as f:
            content = f.read()
        source = f"file: {file}"
    elif code:
        content = code
        source = "provided code"
    else:
        click.echo("❌ Please provide either --code or --file")
        sys.exit(1)

    patterns = detector.detect_theatrical(content)

    if patterns:
        click.echo(f"🔍 Found {len(patterns)} theatrical patterns in {source}:")
        for pattern in patterns:
            click.echo(f"  • {pattern}")
    else:
        click.echo(f"✅ No theatrical patterns found in {source}")


@cli.command()
def status():
    """Show Kraken Hive status"""
    click.echo("📊 Kraken Hive Status")
    click.echo("=" * 40)

    # Check Hive
    hive_path = Path("/home/leviathan/OPENCODE_WORKSPACE/projects/hive")
    hive_exists = hive_path.exists()
    click.echo(f"Hive Framework: {'✅ INSTALLED' if hive_exists else '❌ NOT FOUND'}")

    if hive_exists:
        hive_venv = hive_path / ".venv"
        click.echo(
            f"Hive Virtual Environment: {'✅ EXISTS' if hive_venv.exists() else '❌ MISSING'}"
        )

    # Check Kraken
    click.echo(f"Kraken Components: {'✅ AVAILABLE' if KRAKEN_AVAILABLE else '❌ NOT INSTALLED'}")

    # Check project structure
    project_root = Path(__file__).parent.parent.parent.parent
    structure = {
        "src/kraken/": "Kraken source code",
        "tests/": "Test files",
        "examples/": "Example scripts",
        "pyproject.toml": "Build configuration",
        "Makefile": "Build commands",
    }

    click.echo("\n📁 Project Structure:")
    for path, desc in structure.items():
        full_path = project_root / path
        exists = full_path.exists() if not path.endswith("/") else full_path.is_dir()
        status = "✅" if exists else "❌"
        click.echo(f"  {status} {path:20} {desc}")

    click.echo("\n🚀 Next Steps:")
    if not hive_exists:
        click.echo("  1. Clone Hive: git clone https://github.com/aden-hive/hive")
    elif not KRAKEN_AVAILABLE:
        click.echo("  1. Install Kraken: pip install -e .")
    else:
        click.echo("  1. Run tests: kraken-hive test")
        click.echo("  2. Validate: kraken-hive validate")
        click.echo("  3. Launch: kraken-hive start")


@cli.command()
def demo():
    """Run anti-hallucination demo"""
    if not KRAKEN_AVAILABLE:
        click.echo("❌ Kraken components not available")
        sys.exit(1)

    click.echo("🧪 Running Anti-Hallucination Demo")
    click.echo("=" * 40)

    # Import here to avoid startup delay
    import asyncio
    from kraken.validators import MechanicalValidator, EvidenceChecker, PatternDetector
    from kraken.integration import KrakenEnhancedJudge

    async def run_demo():
        click.echo("\n1. Testing Mechanical Validator...")
        validator = MechanicalValidator()
        test_code = """
        function test() {
            // TODO: implement this
            return true; // Hardcoded result
        }
        """
        result = validator.validate_workflow_step("TEST", test_code)
        click.echo(f"   Result: {'PASS' if result.passed else 'FAIL'}")
        if result.theatrical_patterns:
            click.echo(f"   Patterns: {', '.join(result.theatrical_patterns)}")

        click.echo("\n2. Testing Evidence Checker...")
        checker = EvidenceChecker()
        claim = "The function processes user data securely"
        evidence = ["function encryptData()", "const security = require('crypto')"]
        has_evidence = checker.cross_validate(claim, evidence)
        click.echo(f"   Claim: '{claim}'")
        click.echo(f"   Evidence: {evidence}")
        click.echo(f"   Validation: {'PASS' if has_evidence else 'FAIL'}")

        click.echo("\n3. Testing Pattern Detector...")
        detector = PatternDetector()
        patterns = detector.detect_theatrical(test_code)
        click.echo(f"   Found {len(patterns)} theatrical patterns")

        click.echo("\n4. Testing Integrated Judge...")
        judge = KrakenEnhancedJudge()
        evaluation = judge.evaluate(test_code, {"context": "demo"})
        click.echo(f"   Evaluation: {evaluation}")

        click.echo("\n✅ Demo complete!")

    asyncio.run(run_demo())


def main():
    """Main entry point"""
    cli()


if __name__ == "__main__":
    main()
