from __future__ import annotations

import re
from pathlib import Path

DOCS_DIR = Path(__file__).resolve().parents[1] / "docs_src"

INLINE_LINK_RE = re.compile(r"!?\[[^\]]+\]\(([^)]+)\)")
REF_DEF_RE = re.compile(r"^\s*\[[^\]]+\]:\s+(\S+)")

EXTERNAL_PREFIXES = (
    "http://",
    "https://",
    "mailto:",
    "tel:",
    "javascript:",
)


def _strip_title(target: str) -> str:
    if target.startswith("<") and target.endswith(">"):
        return target[1:-1].strip()
    return target.split(maxsplit=1)[0].strip()


def _normalize_target(target: str) -> str | None:
    target = target.strip()
    if not target:
        return None
    if target.startswith("#"):
        return None
    if target.startswith(EXTERNAL_PREFIXES):
        return None
    target = target.split("#", 1)[0].split("?", 1)[0].strip()
    if not target:
        return None
    return target


def _resolve_path(source: Path, target: str) -> Path:
    if target.startswith("/"):
        return DOCS_DIR / target.lstrip("/")
    return source.parent / target


def _candidate_paths(path: Path) -> list[Path]:
    if path.suffix:
        if path.suffix == ".html":
            return [path, path.with_suffix(".md")]
        return [path]

    candidates = [path]
    candidates.append(path.with_suffix(".md"))
    candidates.append(path / "index.md")
    return candidates


def _iter_links(markdown: str) -> list[str]:
    links: list[str] = []
    in_fence = False
    fence_re = re.compile(r"^\s*```")

    for line in markdown.splitlines():
        if fence_re.match(line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        for match in INLINE_LINK_RE.findall(line):
            links.append(_strip_title(match))
        ref_match = REF_DEF_RE.match(line)
        if ref_match:
            links.append(_strip_title(ref_match.group(1)))

    return links


def test_docs_links_exist() -> None:
    missing: list[str] = []
    for path in DOCS_DIR.rglob("*.md"):
        content = path.read_text(encoding="utf-8")
        for raw_target in _iter_links(content):
            target = _normalize_target(raw_target)
            if not target:
                continue
            resolved = _resolve_path(path, target)
            candidates = _candidate_paths(resolved)
            if any(candidate.exists() for candidate in candidates):
                continue
            display = ", ".join(str(candidate) for candidate in candidates)
            missing.append(f"{path}:{display}")

    assert not missing, "Missing linked files:\n" + "\n".join(sorted(missing))
