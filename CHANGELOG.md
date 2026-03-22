# CHANGELOG

All notable changes to this repository are documented in this file.

## PyPI Release Status

Checked package name `isage-docs` on PyPI (`https://pypi.org/pypi/isage-docs/json`) on 2026-02-14.

- No published package was found (HTTP 404).

## [Unreleased]

### Changed
- Compressed historical `dev-notes` maintenance context into changelog summary notes.
- Kept MkDocs navigation focused on stable, user-facing entry pages.
- Simplified `README.md` to concise user-facing scope and maintainer build instructions.
- Fixed `mkdocs.yml` navigation to remove references to non-existent pages and keep only valid entries.
- Repaired broken links in `docs_src/about.md` and `docs_src/api-reference/index.md` to match current docs structure.
- Replaced `docs_src/getting-started/index.md` and `docs_src/guides/index.md` with minimal valid entry pages to avoid stale links.
- Normalized `docs_src/404.md` links to relative targets to remove build-time absolute-link diagnostics.
- Migrated docs toolchain dependency from MkDocs/Material to `zensical` and updated build/serve commands accordingly.
- Updated homepage template links in `theme/index.html` to current valid routes (`/guides/`, `/getting-started/`, `/api-reference/`) after docs route consolidation.
- Updated bottom terminal demo wording/content to Flownet-aligned distributed runtime (`theme/index.html`, `docs_src/assets/demo-distributed.cast`) and removed Ray-specific demo text.
- Corrected local RAG terminal demo import in `docs_src/assets/demo-local.cast` to current `TerminalSink` path (`sage.libs.foundation.io.sink`) for API consistency.
- Updated install terminal demo in `docs_src/assets/demo-install.cast` to show conda env prompt (`(base)` before activation) and use `python -m pip install isage`.
- Added explicit conda-context line in `docs_src/assets/demo-gateway.cast` to clarify the demo runs in activated `(sage)` environment.
- Added the same activated conda-context hint to `docs_src/assets/demo-local.cast` and `docs_src/assets/demo-distributed.cast` for consistent bottom-demo presentation.
- Performed one more API-consistency pass on `docs_src/assets/demo-distributed.cast`: replaced legacy `sage.libs.io` imports with `sage.libs.foundation.io.*` and updated `FlownetEnvironment` initialization to current config style.

### Removed
- Removed legacy `dev-notes` document set and related low-signal auxiliary markdown.
- Removed unreferenced `devtools/website-demo-kit` artifacts after consolidating documentation scope.
