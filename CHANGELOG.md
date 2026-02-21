# CHANGELOG

All notable changes to this repository are documented in this file.

## PyPI Release Status

Checked package name `isage-docs` on PyPI (`https://pypi.org/pypi/isage-docs/json`) on 2026-02-14.

- No published package was found (HTTP 404).

## [Unreleased]

### Changed
- Added repository-level changelog governance for versioned doc updates.
- Replaced `dev-notes` links in MkDocs navigation and documentation pages with stable references.
- Consolidated documentation retention policy: aggressively trim non-critical markdown while preserving `README*.md` and Copilot/agent instruction metadata.
- Preserved key architecture summary in changelog: SAGE migration boundary keeps declaration/API/protocol contracts in SAGE while runtime core execution internals stay in Flownet.
- Simplified `mkdocs.yml` navigation to a minimal structure aligned with retained entry pages.

### Removed
- Removed dedicated `docs_src/dev-notes/` content and directory tree.
- Removed root auxiliary markdown `SUBMODULE.md`.
- Removed most markdown under `docs_src/`; retained only:
	- `docs_src/index.md`
	- `docs_src/about.md`
	- `docs_src/getting-started/index.md`
	- `docs_src/guides/index.md`
	- `docs_src/api-reference/index.md`
- Markdown footprint reduced from 126 files to 9 files in this repository.
