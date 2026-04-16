#!/usr/bin/env python3
"""
Path Update Tool for Agents
Updates file references from old paths to new workspace paths
"""

import json
import os
import re
import sys
from pathlib import Path

WORKSPACE = Path("/home/leviathan/OPENCODE_WORKSPACE")
MAPPING_FILE = WORKSPACE / "configs" / "path-mapping.json"


def load_mappings():
    """Load path mappings from JSON file"""
    with open(MAPPING_FILE, "r") as f:
        return json.load(f)


def update_file_paths(file_path, mappings):
    """Update paths in a single file"""
    try:
        with open(file_path, "r") as f:
            content = f.read()

        old_base = mappings["old_base"]
        new_base = mappings["new_base"]

        # Replace old base path with new base path
        updated = content.replace(old_base, new_base)

        # Apply specific mappings
        for key, mapping in mappings["mappings"].items():
            updated = updated.replace(mapping["old"], mapping["new"])

        if updated != content:
            with open(file_path, "w") as f:
                f.write(updated)
            return True
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False


def main():
    """Main migration function"""
    print("🔄 Path Update Tool")
    print("===================")

    if not MAPPING_FILE.exists():
        print(f"❌ Mapping file not found: {MAPPING_FILE}")
        sys.exit(1)

    try:
        mappings = load_mappings()
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing mapping file: {e}")
        sys.exit(1)

    # Get list of files to update
    files_to_update = []

    if len(sys.argv) > 1:
        files_to_update = [Path(f) for f in sys.argv[1:]]
    else:
        print("⚠️  No files specified. Use: update-paths.py <file1> <file2> ...")
        print("   Or to update all files in workspace, run without arguments.")
        return

    updated_count = 0
    for file_path in files_to_update:
        if file_path.exists() and file_path.is_file():
            try:
                if update_file_paths(file_path, mappings):
                    print(f"✅ Updated: {file_path}")
                    updated_count += 1
                else:
                    print(f"ℹ️  No changes needed: {file_path}")
            except Exception as e:
                print(f"❌ Error updating {file_path}: {e}")
        else:
            print(f"⚠️  File not found: {file_path}")

    print(f"\n🎯 Updated {updated_count} file(s)")
    print(f"New workspace: {WORKSPACE}")


if __name__ == "__main__":
    main()
