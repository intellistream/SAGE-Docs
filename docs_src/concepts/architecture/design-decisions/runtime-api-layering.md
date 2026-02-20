# Runtime API Layering: Facade + Advanced Environments

**GitHub Issue:** [intellistream/SAGE-Docs#54](https://github.com/intellistream/SAGE-Docs/issues/54)  
**Related:** [intellistream/SAGE#1446](https://github.com/intellistream/SAGE/issues/1446), [intellistream/SAGE#1447](https://github.com/intellistream/SAGE/issues/1447), [intellistream/sageFlownet#14](https://github.com/intellistream/sageFlownet/issues/14), [intellistream/sageFlownet#15](https://github.com/intellistream/sageFlownet/issues/15)

---

## Background

SAGE runtime programming now follows a dual-tier public API model:

1. **Facade tier (default)**
2. **Advanced environment tier (expert)**

This clarifies user experience and architecture boundaries while preserving low-level control.

---

## Positioning

### Tier A — Facade (Default)

Use for most users and most production app code:

```python
from sage.kernel.facade import create, submit, run, call
```

Characteristics:

- SAGE-owned stable public contract
- Backend details hidden behind protocol adapter
- Recommended first choice for new code

### Tier B — Advanced Environments (Expert)

Use when environment-level runtime control is required:

```python
from sage.kernel.api import LocalEnvironment, FlownetEnvironment
```

Characteristics:

- Public and supported advanced APIs
- **Not** deprecated/legacy APIs
- May expose runtime-specific controls

---

## Semantic Consistency Contract

Facade and advanced environments must keep shared semantics aligned on:

- submit/call lifecycle
- completion/result retrieval
- cancel behavior and terminal states
- error propagation behavior
- resource handoff semantics

Conformance is enforced by contract tests in SAGE and sageFlownet.

---

## Capability Boundary

Allowed differences are runtime-specific advanced controls (for expert usage), not core semantics.

Examples:

- explicit runtime attach/init controls
- node/runtime inspection and orchestration hooks
- advanced topic/service/source controls

---

## Architecture Ownership

- SAGE owns declaration/API/protocol abstraction layers.
- Flownet owns runtime core implementation.
- Runtime core must not be moved into SAGE via compatibility shims.

See also: [Flownet→SAGE 迁移边界](flownet-migration-boundary.md).