# Test Taxonomy: Flownet Migration 3-Layer Model

**Status**: Active  
**Owner**: SAGE Core Team  
**Related**: intellistream/SAGE#1440, intellistream/SAGE#1430  

---

## Overview

SAGE's test suite for the Flownet→SAGE migration is organised into **three
independent layers**, each with its own CI job and failure signal.  This
ensures boundary regressions are detectable before runtime integration is
in scope.

```
Layer 1 — Declaration        Layer 2 — API Contract       Layer 3 — Adapter Integration
─────────────────────────    ─────────────────────────    ───────────────────────────────
tests/unit/flow/             tests/unit/flow/             tests/integration/flow/
  test_flow_declaration.py     test_facade_api.py           test_flownet_adapter.py
  (+ type / schema tests)      test_flow_exceptions.py      (+ end-to-end bridge tests)
No runtime dependency        No runtime dependency         May import sageFlownet
```

---

## Layer 1 — Declaration Unit Tests

**Directory**: `packages/sage-kernel/tests/unit/flow/`  
**File pattern**: `test_flow_declaration*.py`, `test_*_declaration*.py`  
**CI job**: `test-layer-declaration`  

### What goes here

- Tests for `sage.kernel.flow.declaration` (FlowDeclaration, FlowFunctionMeta).
- Tests for `sage.kernel.flow.decorator` (@flow decorator semantics).
- Graph building, validation, and serialisation contract tests.
- Any test that must pass **without sageFlownet installed**.
- Exception type / enum contract tests for `sage.kernel.flow` layer.

### What does NOT go here

- Any test that imports `sage.flownet.*` (even lazily inside helpers).
- Tests that require a live runtime or an actor to execute.

### Rule of thumb

> If the test can run in a fresh Python environment with only `isage-common`
> and `isage-kernel` installed, it belongs in Layer 1.

### Example

```python
# test_flow_declaration.py
from sage.kernel.flow.declaration import FlowDeclaration

def test_basic_creation():
    def my_flow(init_stream): pass
    decl = FlowDeclaration(my_flow)
    assert decl.name.endswith("my_flow")
    assert decl.is_method is False
```

---

## Layer 2 — Facade / API Contract Tests

**Directory**: `packages/sage-kernel/tests/unit/flow/`  
**File pattern**: `test_facade_api*.py`, `test_*_contract*.py`, `test_flow_exceptions*.py`  
**CI job**: `test-layer-contract`  

### What goes here

- Tests for `sage.kernel.facade` (create, submit, run, call verbs).
- Tests that the public API contains no Ray-oriented terminology.
- Tests that `ImportError` messages correctly reference sageFlownet, not Ray.
- Exception handler API contract tests (`sage.kernel.flow.exception_handler`).
- Tests that the facade is importable from canonical locations.
- Error classification / action enum contracts (`sage.common.core.flow_exceptions`).

### What does NOT go here

- Tests that require a live sageFlownet runtime.
- Adapter-internal wiring tests.

### Rule of thumb

> If the test validates a **stable user-visible signature or error message**,
> it belongs in Layer 2.

### Example

```python
# test_facade_api.py
def test_import_from_sage_kernel_top_level():
    from sage.kernel import call, create, run, submit  # noqa: F401

def test_no_ray_in_function_names():
    from sage.kernel.facade import create, submit, run, call
    for fn in (create, submit, run, call):
        assert "ray" not in fn.__name__.lower()
```

---

## Layer 3 — Adapter Integration Tests

**Directory**: `packages/sage-kernel/tests/integration/flow/`  
**File pattern**: `test_flownet_adapter*.py`, `test_*_adapter*.py`  
**CI job**: `test-layer-adapter`  

### What goes here

- Tests that verify the `FlownetRuntimeAdapter` conforms to
  `RuntimeBackendProtocol` (structural / typing contract).
- Tests that `FlowDeclaration._require_adapter()` returns something the facade
  can execute.
- Tests that the SAGE→Flownet bridge produces the correct result when
  sageFlownet IS available (skipped when it is not).
- Boundary regression tests: ensure SAGE code never calls Flownet internals
  directly (only via the protocol interface).

### What does NOT go here

- Pure declaration/schema tests (those go to Layer 1).
- Broad system performance / benchmark tests.

### Skipping when sageFlownet is absent

Tests in this layer should be decorated with:

```python
import pytest
pytest.importorskip("sage.flownet", reason="sageFlownet (isage-flow) not installed")
```

or use the `requires_sageflownet` fixture defined in `tests/conftest.py`.

### Example

```python
# test_flownet_adapter.py
def test_adapter_conforms_to_protocol():
    from sage.platform.runtime.adapters.flownet_adapter import FlownetRuntimeAdapter
    from sage.platform.runtime.protocol import RuntimeBackendProtocol
    assert issubclass(FlownetRuntimeAdapter, RuntimeBackendProtocol)
```

---

## CI Jobs

The three layer-specific jobs are defined in
`.github/workflows/ci-flownet-layer-tests.yml`.

| Job name                  | Paths covered                                  | Depends on Flownet? |
|---------------------------|------------------------------------------------|---------------------|
| `test-layer-declaration`  | `tests/unit/flow/test_flow_declaration*.py` + `tests/unit/runtime/context/test_context_propagation.py` | No |
| `test-layer-contract`     | `tests/unit/flow/test_facade_api*.py` + `test_flow_exceptions*.py` | No  |
| `test-layer-adapter`      | `tests/integration/flow/`                     | Optional (skipped)  |
| `report`                  | Aggregates pass/fail from all three layers     | —                   |

Each job produces an independent exit code, so a Layer 1 regression is
visible even if Layers 2 and 3 are green.

---

## Where to Add Future Tests

| New test type                                          | Layer | Directory                                      |
|--------------------------------------------------------|-------|------------------------------------------------|
| New `@flow` decorator parameter                        | 1     | `tests/unit/flow/test_flow_declaration.py`     |
| New public facade verb or change to existing signature | 2     | `tests/unit/flow/test_facade_api.py`           |
| New exception class in `sage.common.core`              | 2     | `tests/unit/flow/test_flow_exceptions.py`      |
| New adapter method / Flownet API change                | 3     | `tests/integration/flow/test_flownet_adapter.py` |
| Context propagation utils (Issue #1435) ✅ Done        | 1     | `tests/unit/runtime/context/test_context_propagation.py` |
| Scheduling schema (Issue #1437)                        | 1     | `tests/unit/kernel/scheduler/`                 |

---

## Enforcement

- **Layer 1 and Layer 2** must pass on every PR targeting `main` or
  `main-dev`, regardless of whether sageFlownet is available.
- **Layer 3** runs but may skip individual tests when sageFlownet is absent;
  the job itself must not fail due to missing optional dependency.
- Any PR that introduces a `from sage.flownet` top-level import in a Layer 1
  or Layer 2 test file will be blocked by the `test-layer-declaration` /
  `test-layer-contract` jobs (which assert no static Flownet imports).
- **Duplicate symbol check (Issue #1435)**: Layer 1 CI runs a `find` check to
  ensure `sage/flownet/utils/context_vars.py` does not exist. If the file
  re-appears (e.g. via a stale merge), the `test-layer-declaration` job
  fails immediately, blocking the PR.

---

*See also: [flownet-migration-boundary.md](../concepts/architecture/design-decisions/flownet-migration-boundary.md)*
