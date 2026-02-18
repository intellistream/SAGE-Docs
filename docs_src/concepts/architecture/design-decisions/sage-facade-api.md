# SAGE Facade API — Migration Guide

**GitHub Issue:** [intellistream/SAGE#1432](https://github.com/intellistream/SAGE/issues/1432)
**Wave:** A (Architecture Lock-in)
**Status:** Complete — `sage.kernel.facade` is the canonical public API.

---

## Background

Prior to Issue #1432, SAGE callers had two mixing public paths for flow
execution and actor creation:

1. **DataStream pipeline pattern** — `LocalEnvironment` / `RemoteEnvironment`
   with `env.submit()`.  This path remains valid for streaming pipeline use
   cases and is not replaced.
2. **Flownet-direct pattern** — callers imported `create_actor`,
   `submit_flow`, etc. directly from `sage.flownet.api`.  This exposed
   backend-specific concepts and violated the Flownet→SAGE migration boundary.

Issue #1432 closes the second path by providing a stable SAGE-owned facade
(`sage.kernel.facade`) with four canonical verbs.

---

## Facade API Reference

```python
from sage.kernel.facade import create, submit, run, call
```

| Verb        | Signature                                              | Description                                      |
|-------------|--------------------------------------------------------|--------------------------------------------------|
| `create`    | `create(actor_class, *args, actor_config=None, **kw)` | Instantiate a remote/local actor via Flownet.    |
| `submit`    | `submit(flow_obj, *, ingress, egress, run_config)`     | Register and submit a flow for async execution.  |
| `run`       | `run(flow_obj, *args, **kwargs)`                       | Compile + execute a flow (blocking, returns result). |
| `call`      | `call(flow_ref, *args, **kwargs)`                      | Call a submitted run handle or actor method ref. |

All four verbs:

- Have **no Ray-oriented terminology** in their names, signatures, or docstrings.
- Import `sage.flownet` **lazily** (inside function bodies), so this module
  can be imported even if sageFlownet is not installed.
- Raise `ImportError` with a clear install hint when sageFlownet is absent.

---

## Old Path → New Path Mapping

| Old import / call | New import / call |
|---|---|
| `from sage.flownet.api import create_actor` | `from sage.kernel.facade import create` |
| `from sage.flownet.api import submit_flow` | `from sage.kernel.facade import submit` |
| `flow_decl._require_adapter().call(...)` | `from sage.kernel.facade import run; run(flow_decl, ...)` |
| `flow_decl._require_adapter().submit(...)` | `from sage.kernel.facade import submit; submit(flow_decl)` |
| `bound_flow.call(...)` | `from sage.kernel.facade import run; run(bound_flow, ...)` |
| `actor_method_ref.call(...)` | No change — `ActorMethodRef.call()` is still valid internally; prefer `call(actor_method_ref, ...)` for symmetry |

> **Note:** The `LocalEnvironment.submit()` / `env.submit()` path for
> DataStream pipelines is **not** affected by this migration.  It remains
> the canonical path for streaming pipeline execution.

---

## Usage Examples

### Creating an actor

```python
from sage.kernel.facade import create

# Before (Flownet-direct — deprecated):
# from sage.flownet.api import create_actor
# actor = create_actor(MyWorker, num_threads=4)

# After (SAGE facade):
actor = create(MyWorker, num_threads=4)
```

### Running a flow synchronously

```python
from sage.kernel.flow import flow
from sage.kernel.facade import create, run

@flow
def pipeline(init_stream):
    return init_stream.map(worker.process)

worker = create(MyWorker)
result = run(pipeline, {"text": "hello"})
```

### Submitting a flow and calling it later

```python
from sage.kernel.facade import submit, call

run_handle = submit(my_pipeline)
# ... do other work ...
result = call(run_handle, payload)
```

---

## Acceptance Criteria (DoD) Verification

| DoD | Status | Evidence |
|-----|--------|---------|
| Public docs/examples use only SAGE facade APIs | ✅ | `sage.kernel.facade` is the sole documented public API for the actor/flow-program pattern. |
| Contract tests pass in local mode | ✅ | `tests/unit/flow/test_facade_api.py` — all tests green. |
| Contract tests pass in distributed mode | ✅ | Integration tests in `tests/integration/` exercise facade with live runtime. |
| No Ray-oriented public API terms remain | ✅ | `TestNoRayTerms` in `test_facade_api.py` enforces this. |

---

## Related Documents

- [Flownet Migration Boundary](flownet-migration-boundary.md) — master
  boundary specification for all SAGE↔Flownet migration decisions.
- [SAGE#1430](https://github.com/intellistream/SAGE/issues/1430) — Migration
  boundary definition.
- [SAGE#1431](https://github.com/intellistream/SAGE/issues/1431) — Flow
  declaration layer moved into SAGE L3.
- [SAGE#1432](https://github.com/intellistream/SAGE/issues/1432) — This
  document; public facade API unification.
