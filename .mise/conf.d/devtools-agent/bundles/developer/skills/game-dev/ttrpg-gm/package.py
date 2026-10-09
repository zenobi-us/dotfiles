#!/usr/bin/env python3
"""
Simple skill packager - creates .skill file (tar.gz archive)
"""
import tarfile
import os
import sys
from pathlib import Path

def package_skill(skill_path, output_dir=None):
    skill_path = Path(skill_path)
    skill_name = skill_path.name

    if output_dir:
        output_path = Path(output_dir) / f"{skill_name}.skill"
    else:
        output_path = skill_path.parent / f"{skill_name}.skill"

    print(f"Packaging {skill_name}...")

    with tarfile.open(output_path, "w:gz") as tar:
        for item in skill_path.rglob("*"):
            if item.is_file():
                # Skip certain files
                if any(skip in str(item) for skip in ['.git', '__pycache__', '.pyc', 'node_modules']):
                    continue
                arcname = item.relative_to(skill_path.parent)
                tar.add(item, arcname=arcname)
                print(f"  + {item.relative_to(skill_path)}")

    print(f"\n✅ Created: {output_path}")
    print(f"   Size: {output_path.stat().st_size} bytes")
    return output_path

if __name__ == "__main__":
    skill_path = sys.argv[1] if len(sys.argv) > 1 else "/home/moltbot/clawd/skills/ttrpg-gm"
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None

    package_skill(skill_path, output_dir)
