#!/usr/bin/env python3
"""
Test Shark Agent GLM Integration for OpenCode
This script verifies that GLM is properly integrated and working with OpenCode.
"""

import os
import sys
import json
import subprocess
import time


def test_glm_models():
    """Test all GLM models configured in opencode"""
    print("Testing GLM Models in OpenCode...")
    print("=" * 60)

    models = [
        "0-glm-coding/glm-4.5",
        "0-glm-coding/glm-4.5-flash",
        "0-glm-coding/glm-4.6",
        "0-glm-coding/glm-4.7",
        "0-glm-coding/glm-4.7-flash",
        "0-glm-coding/glm-5",
    ]

    results = {}

    for model in models:
        print(f"\nTesting {model}...")
        try:
            # Run opencode with a simple query
            cmd = [
                "opencode",
                "run",
                "--model",
                model,
                "What is 2+2? Answer with just the number.",
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)

            if result.returncode == 0:
                # Check if we got a response
                output = result.stdout.strip()
                if "4" in output or "four" in output.lower():
                    print(f"  ✓ Success: Model responded correctly")
                    results[model] = "PASS"
                else:
                    print(f"  ⚠ Warning: Model responded but answer not found")
                    print(f"    Output: {output[:100]}...")
                    results[model] = "WARN"
            else:
                print(f"  ✗ Error: Command failed with return code {result.returncode}")
                print(f"    Stderr: {result.stderr[:200]}")
                results[model] = "FAIL"

        except subprocess.TimeoutExpired:
            print(f"  ✗ Error: Timeout after 15 seconds")
            results[model] = "TIMEOUT"
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
            results[model] = "ERROR"

    return results


def test_shark_agent_skill():
    """Test if Shark Agent skill is loaded"""
    print("\n\nTesting Shark Agent Skill...")
    print("=" * 60)

    # Check if skill directory exists
    skill_dir = os.path.expanduser("~/.config/opencode/skills/shark-agent")
    if os.path.exists(skill_dir):
        print(f"✓ Shark Agent skill directory exists: {skill_dir}")

        # Check if SKILL.md exists
        skill_file = os.path.join(skill_dir, "SKILL.md")
        if os.path.exists(skill_file):
            print(f"✓ SKILL.md file exists")
            with open(skill_file, "r") as f:
                content = f.read()
                if "shark-agent" in content:
                    print(f"✓ Skill contains 'shark-agent' identifier")
                else:
                    print(f"⚠ Warning: Skill doesn't contain 'shark-agent' identifier")
        else:
            print(f"✗ Error: SKILL.md file not found")
            return False
    else:
        print(f"✗ Error: Shark Agent skill directory not found")
        return False

    return True


def test_opencode_config():
    """Test OpenCode configuration for GLM"""
    print("\n\nTesting OpenCode Configuration...")
    print("=" * 60)

    config_path = os.path.expanduser("~/.config/opencode/opencode.json")
    if os.path.exists(config_path):
        print(f"✓ OpenCode config exists: {config_path}")

        with open(config_path, "r") as f:
            config = json.load(f)

        # Check for GLM provider
        if "provider" in config and "0-glm-coding" in config["provider"]:
            print(f"✓ GLM provider (0-glm-coding) is configured")

            glm_config = config["provider"]["0-glm-coding"]

            # Check base URL
            if "options" in glm_config and "baseURL" in glm_config["options"]:
                base_url = glm_config["options"]["baseURL"]
                print(f"✓ Base URL: {base_url}")

                # Check if it's the coding plan endpoint
                if "api.z.ai/api/coding/paas/v4" in base_url:
                    print(f"✓ Correct GLM Coding Plan endpoint")
                else:
                    print(f"⚠ Warning: Base URL doesn't match GLM Coding Plan endpoint")
            else:
                print(f"⚠ Warning: Base URL not found in GLM config")

            # Check models
            if "models" in glm_config:
                models = list(glm_config["models"].keys())
                print(f"✓ Configured GLM models: {', '.join(models)}")

                # Check for reasoning configuration
                for model_name, model_config in glm_config["models"].items():
                    if (
                        "options" in model_config
                        and "reasoning" in model_config["options"]
                    ):
                        print(f"  ✓ {model_name} has reasoning configured")
                    else:
                        print(f"  ⚠ {model_name} missing reasoning configuration")
            else:
                print(f"✗ Error: No models configured for GLM")
        else:
            print(f"✗ Error: GLM provider not found in config")
            return False
    else:
        print(f"✗ Error: OpenCode config file not found")
        return False

    return True


def test_shark_agent_config():
    """Test Shark Agent configuration"""
    print("\n\nTesting Shark Agent Configuration...")
    print("=" * 60)

    config_path = os.path.expanduser("~/.shark-agent/config.json")
    if os.path.exists(config_path):
        print(f"✓ Shark Agent config exists: {config_path}")

        with open(config_path, "r") as f:
            config = json.load(f)

        # Check mode
        if "mode" in config:
            mode = config["mode"]
            print(f"✓ Mode: {mode}")

            if mode == "macro":
                # Check GLM config
                if "macro" in config and "glm_api_key" in config["macro"]:
                    glm_key = config["macro"]["glm_api_key"]
                    if glm_key and glm_key != "your-glm-coding-plan-key-here":
                        print(f"✓ GLM API key is set")
                    else:
                        print(f"⚠ Warning: GLM API key needs to be set")
                else:
                    print(f"✗ Error: GLM configuration missing in macro mode")
            elif mode == "micro":
                print(f"✓ Micro mode configured")
            else:
                print(f"⚠ Warning: Unknown mode: {mode}")
        else:
            print(f"✗ Error: Mode not specified in config")
            return False
    else:
        print(f"✗ Error: Shark Agent config file not found")
        return False

    return True


def main():
    """Run all tests"""
    print("Shark Agent GLM Integration Test")
    print("=" * 60)

    # Run tests
    config_ok = test_opencode_config()
    skill_ok = test_shark_agent_skill()
    shark_config_ok = test_shark_agent_config()

    print("\n\nGLM Model Performance Test")
    print("=" * 60)
    model_results = test_glm_models()

    # Summary
    print("\n\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    print(f"\nConfiguration Tests:")
    print(f"  OpenCode Config: {'✓ PASS' if config_ok else '✗ FAIL'}")
    print(f"  Shark Agent Skill: {'✓ PASS' if skill_ok else '✗ FAIL'}")
    print(f"  Shark Agent Config: {'✓ PASS' if shark_config_ok else '✗ FAIL'}")

    print(f"\nGLM Model Tests:")
    for model, result in model_results.items():
        status = "✓ PASS" if result == "PASS" else f"⚠ {result}"
        print(f"  {model}: {status}")

    # Overall status
    all_passed = (
        config_ok
        and skill_ok
        and shark_config_ok
        and all(r == "PASS" for r in model_results.values())
    )

    print(
        f"\nOverall Status: {'✓ ALL TESTS PASSED' if all_passed else '⚠ SOME TESTS FAILED'}"
    )

    if all_passed:
        print("\n🎉 GLM is fully integrated and working with OpenCode!")
        print("You can now use GLM models with the Shark Agent skill.")
        print("\nExample usage:")
        print("  opencode --model 0-glm-coding/glm-4.5-flash")
        print("  opencode run --model 0-glm-coding/glm-5 'Write a Python function'")
    else:
        print("\n⚠ Some issues need to be addressed.")
        print("Check the test output above for details.")


if __name__ == "__main__":
    main()
