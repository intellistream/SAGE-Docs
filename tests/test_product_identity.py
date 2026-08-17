from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_sage_is_presented_as_the_shared_ecosystem_product() -> None:
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    about = (ROOT / "docs_src" / "about.md").read_text(encoding="utf-8")
    homepage = (ROOT / "theme" / "index.html").read_text(encoding="utf-8")

    assert "Streaming-Augmented Generative Execution" in readme
    assert "共同旗舰产品" in readme
    assert "共同旗舰产品" in about
    assert "shared flagship product" in homepage
    assert "RIDE Lab stewards SAGE core" in homepage


def test_retired_sage_owner_is_absent_from_public_sources() -> None:
    violations: list[str] = []
    for path in ROOT.rglob("*"):
        if (
            not path.is_file()
            or path.resolve() == Path(__file__).resolve()
            or ".git" in path.parts
            or "site" in path.parts
        ):
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        if "SAGE-Research" in content or "github.com/intellistream/SAGE" in content:
            violations.append(str(path.relative_to(ROOT)))

    assert not violations, f"retired SAGE owner references: {sorted(violations)}"
