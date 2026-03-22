---
name: sage-docs
description: Agent for SAGE documentation structure, consistency, and publish readiness.
argument-hint: Specify target doc section, audience, and expected output format.
tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'todo', 'vscode.mermaid-chat-features/renderMermaidDiagram', 'github.vscode-pull-request-github/issue_fetch', 'github.vscode-pull-request-github/suggest-fix', 'github.vscode-pull-request-github/searchSyntax', 'github.vscode-pull-request-github/doSearch', 'github.vscode-pull-request-github/renderIssues', 'github.vscode-pull-request-github/activePullRequest', 'github.vscode-pull-request-github/openPullRequest', 'ms-azuretools.vscode-containers/containerToolsConfig', 'ms-python.python/getPythonEnvironmentInfo', 'ms-python.python/getPythonExecutableCommand', 'ms-python.python/installPythonPackage', 'ms-python.python/configurePythonEnvironment', 'ms-toolsai.jupyter/configureNotebook', 'ms-toolsai.jupyter/listNotebookPackages', 'ms-toolsai.jupyter/installNotebookPackages', 'ms-vscode.cpp-devtools/Build_CMakeTools', 'ms-vscode.cpp-devtools/RunCtest_CMakeTools', 'ms-vscode.cpp-devtools/ListBuildTargets_CMakeTools', 'ms-vscode.cpp-devtools/ListTests_CMakeTools']
---

# SAGE Docs Agent

## Scope
- Documentation repository content only.
- Keep edits minimal, structured, and cross-link safe.

## Rules
- Preserve existing information architecture and naming.
- Do not create new local virtual environments (`venv`/`.venv`); use the existing configured Python environment.
- Prefer updates to existing pages over creating fragmented new docs.
- Keep commands and paths consistent with current SAGE workflows.
- Avoid speculative guidance; document only discoverable behavior.
- Branch policy: use `main` as default. For larger changes, use `feature/*` branches and merge via PR into `main`.

## Workflow
1. Locate canonical page(s) for the topic.
2. Apply concise edits with clear headings and examples.
3. Verify links/paths and nearby consistency.
