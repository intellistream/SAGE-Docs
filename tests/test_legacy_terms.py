from __future__ import annotations

import re
from pathlib import Path

DOCS_DIR = Path(__file__).resolve().parents[1] / "docs_src"

ALLOWLIST = {
    Path("getting-started/flownet-migration-guide.md"),
}

FORBIDDEN_PATTERNS: dict[str, re.Pattern[str]] = {
    "import ray": re.compile(r"\bimport\s+ray\b"),
    "from ray": re.compile(r"\bfrom\s+ray\b"),
    "ray.init()": re.compile(r"\bray\.init\s*\("),
    "ray.remote": re.compile(r"\bray\.remote\b"),
    "RayQueueDescriptor": re.compile(r"\bRayQueueDescriptor\b"),
    "RayServiceTask": re.compile(r"\bRayServiceTask\b"),
    "ray_task.py": re.compile(r"\bray_task\.py\b"),
    "use_ray=True": re.compile(r"\buse_ray\s*=\s*True\b"),
}


def test_legacy_ray_terms_are_confined_to_migration_guide() -> None:
    violations: list[str] = []

    for path in DOCS_DIR.rglob("*.md"):
        rel_path = path.relative_to(DOCS_DIR)
        if rel_path in ALLOWLIST:
            continue

        content = path.read_text(encoding="utf-8")
        for term_name, pattern in FORBIDDEN_PATTERNS.items():
            for match in pattern.finditer(content):
                line_number = content.count("\n", 0, match.start()) + 1
                violations.append(f"{rel_path}:{line_number}: {term_name}")

    assert not violations, "Legacy Ray terms found outside migration guide:\n" + "\n".join(
        sorted(violations)
    )
