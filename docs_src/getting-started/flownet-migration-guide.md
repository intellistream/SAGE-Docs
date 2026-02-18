# Flownet → SAGE 迁移指南

!!! abstract "文档状态"
    - **优先级**: P2（Wave C — Convergence）
    - **关联 Issue**: [intellistream/SAGE#1441](https://github.com/intellistream/SAGE/issues/1441)
    - **依赖完成**: Issues 1430–1440
    - **最后更新**: 2026-02-19

本指南为从旧 Ray/Flownet 直接调用风格迁移到 SAGE 当前 API 模型提供权威参考。
完成本指南后，新用户可仅依赖当前文档完成完整工作流；旧用户可按照映射表逐步替换废弃路径。

---

## 1. 总体迁移策略

SAGE 已建立稳定的分层架构（L1–L5）与统一运行时协议，**取代**此前直接调用 Ray / sageFlownet 内部接口的方式。
迁移遵循以下三条规则：

1. **使用 SAGE Facade API** — 所有 flow 执行与 actor 创建均通过 `sage.kernel.facade` 的四个规范动词（`create / submit / run / call`）完成。参见 [Facade API 文档](../concepts/architecture/design-decisions/sage-facade-api.md)。
2. **使用 Flownet 运行时、而非 Ray** — 分布式执行后端已迁移到 *sageFlownet*；禁止在新代码中引入 `import ray`。
3. **边界见 Migration Matrix** — 什么属于 SAGE、什么留在 Flownet，以迁移矩阵为准。参见 [Flownet→SAGE 迁移边界](../concepts/architecture/design-decisions/flownet-migration-boundary.md)。

---

## 2. API 映射表

### 2.1 Flow 执行 API

| 旧路径（Ray/Flownet 直调）                    | 新路径（SAGE Facade）                                         |
|----------------------------------------------|--------------------------------------------------------------|
| `from sage.flownet.api import create_actor`  | `from sage.kernel.facade import create`                      |
| `create_actor(MyActor, ...)`                 | `create(MyActor, ...)`                                       |
| `from sage.flownet.api import submit_flow`   | `from sage.kernel.facade import submit`                      |
| `submit_flow(flow_def, ...)`                 | `submit(flow_def, ...)`                                      |
| `flow_decl._require_adapter().call(...)`     | `from sage.kernel.facade import run; run(flow_decl, ...)`    |
| `flow_decl._require_adapter().submit(...)`   | `from sage.kernel.facade import submit; submit(flow_decl)`   |
| `bound_flow.call(...)`                       | `from sage.kernel.facade import run; run(bound_flow, ...)`   |

### 2.2 运行时后端选择

| 旧做法                                | 新做法                                                      |
|--------------------------------------|-------------------------------------------------------------|
| `import ray; ray.init()`             | **无需手动初始化** — sageFlownet 运行时自动管理             |
| `ray.remote` 装饰器                  | `from sage.kernel.facade import create` 创建远程 actor      |
| `@ray.remote class MyActor`          | 普通 Python 类 + `create(MyActor, ...)` 提交至 sageFlownet  |
| `RayQueueDescriptor`                 | `FlownetQueueDescriptor`（或默认 `PythonQueueDescriptor`）  |
| `RayServiceTask` / `ray_task.py`     | `LocalServiceTask` + sageFlownet 分布式调度                 |
| `RemoteEnvironment(use_ray=True)`    | `RemoteEnvironment()` — 后端由 sageFlownet 提供             |

### 2.3 Pipeline / DataStream API（保持稳定，无需迁移）

`LocalEnvironment.submit()` / `env.submit()` 的 DataStream 流水线路径**不受本次迁移影响**，是流式 pipeline 执行的规范路径。

```python
# 无需修改 — DataStream pipeline 路径保持不变
from sage.kernel import LocalEnvironment

env = LocalEnvironment("my-pipeline")
env.from_source(source).map(operator).sink(sink)
env.submit()
```

### 2.4 异常处理 API

| 旧做法                                          | 新做法（SAGE L3 异常 API）                              |
|------------------------------------------------|--------------------------------------------------------|
| 手动捕获 Ray 远程异常（`ray.exceptions.*`）    | `from sage.kernel.flow import FlowException`（L3 声明） |
| `RayActorError` / `RayTaskError` 判断          | `FlowExceptionType.ACTOR_ERROR` / `TASK_ERROR`         |
| 在 Ray actor 内部 try-except 上报              | 注册 `@flow.on_error(handler)` 声明式处理器             |

---

## 3. 逐步迁移流程

### 步骤 0：检查遗留导入

```bash
# 扫描代码库中的 Ray 遗留导入
grep -rn "import ray\|from ray\|ray\.init\|ray\.remote\|RayQueueDescriptor\|RayServiceTask\|ray_task" \
    packages/ --include="*.py" | grep -v __pycache__
```

如果搜索结果为空，说明你的代码库已完成迁移，无需进一步操作。

### 步骤 1：替换 actor 创建

```python
# ❌ 旧写法（Flownet 直调 / Ray 风格）
from sage.flownet.api import create_actor
worker = create_actor(MyWorker, num_threads=4)

# ✅ 新写法（SAGE Facade）
from sage.kernel.facade import create
worker = create(MyWorker, num_threads=4)
```

### 步骤 2：替换 flow 同步/异步执行

```python
# ❌ 旧写法
result = my_flow._require_adapter().call(input_data)

# ✅ 新写法
from sage.kernel.facade import run
result = run(my_flow, input_data)
```

```python
# ❌ 旧写法（异步提交）
from sage.flownet.api import submit_flow
handle = submit_flow(my_flow, ingress=source, egress=sink)

# ✅ 新写法
from sage.kernel.facade import submit
handle = submit(my_flow, ingress=source, egress=sink)
```

### 步骤 3：替换队列描述符

```python
# ❌ 旧写法（Ray 依赖）
from sage.kernel.runtime.communication import RayQueueDescriptor
qd = RayQueueDescriptor("my-queue")

# ✅ 新写法（sageFlownet 原生 / 默认本地模式）
from sage.platform.queue import FlownetQueueDescriptor  # 分布式模式
# 或者
from sage.platform.queue import PythonQueueDescriptor   # 本地单进程模式（默认）
qd = PythonQueueDescriptor("my-queue")
```

### 步骤 4：删除手动 `ray.init()` 调用

sageFlownet 运行时在需要时自动初始化，**无需**在应用代码中调用 `ray.init()`。
直接删除这些调用即可。

### 步骤 5：移除 `ray` 依赖声明

```toml
# ❌ 旧 pyproject.toml
dependencies = [
    "ray>=2.0",
]

# ✅ 新 pyproject.toml（用 sageFlownet 替代）
dependencies = [
    "isage-flownet>=0.1.0",  # 如需显式声明运行时依赖
]
```

---

## 4. 典型使用示例（当前规范写法）

### 4.1 本地流式 Pipeline

```python
from sage.kernel import LocalEnvironment
from sage.kernel.operators import MapOperator, SinkOperator

env = LocalEnvironment("text-pipeline")


class Uppercase(MapOperator):
    def execute(self, record):
        return record.upper()


env.from_batch(["hello", "world"]).map(Uppercase()).sink(print)
env.submit()
```

### 4.2 远程 Actor（Flownet 后端）

```python
from sage.kernel.facade import create, call


class EmbeddingWorker:
    def embed(self, text: str) -> list[float]:
        # ... embedding logic ...
        return [0.1, 0.2, 0.3]


# 创建远程 actor（sageFlownet 管理生命周期）
worker = create(EmbeddingWorker)
result = call(worker.embed, "hello world")
print(result)
```

### 4.3 Flow 函数（声明式 DSL）

```python
from sage.kernel import flow
from sage.kernel import DataStream


@flow
def preprocess_pipeline(init_stream: DataStream) -> DataStream:
    return init_stream.map(lambda x: x.strip()).filter(lambda x: len(x) > 0)


# 同步执行
from sage.kernel.facade import run

result = run(preprocess_pipeline, "  hello world  ")
print(result)
```

### 4.4 Flow 级异常处理

```python
from sage.kernel import flow
from sage.kernel.flow import FlowExceptionType


@flow
def risky_pipeline(init_stream):
    return init_stream.map(some_risky_operation)


@risky_pipeline.on_error(FlowExceptionType.TASK_ERROR)
def handle_task_error(exc, ctx):
    ctx.log.warning(f"Task failed: {exc}, falling back to default")
    return ctx.default_value
```

---

## 5. 废弃 API 一览

以下 API 已废弃，将在后续版本中移除。请立即迁移：

| 废弃 API | 状态 | 替代方案 |
|---------|------|---------|
| `sage.flownet.api.create_actor` | **已废弃** | `sage.kernel.facade.create` |
| `sage.flownet.api.submit_flow` | **已废弃** | `sage.kernel.facade.submit` |
| `sage.kernel.runtime.communication.RayQueueDescriptor` | **已废弃** | `sage.platform.queue.FlownetQueueDescriptor` |
| `sage.kernel.runtime.service.ray_service_task` | **已废弃** | `LocalServiceTask` + sageFlownet 调度 |
| `sage.kernel.runtime.task.ray_task` | **已废弃** | `LocalTask` + sageFlownet 调度 |
| `RemoteEnvironment(use_ray=True)` 参数 | **已废弃** | `RemoteEnvironment()` 默认使用 sageFlownet |

---

## 6. 文档扫描与 CI 验证

为防止废弃术语回流，可在 CI 中加入以下扫描：

```bash
# 检查代码中是否仍有 Ray 直接依赖
grep -rn "import ray\b\|from ray\b" packages/ --include="*.py" | grep -v "__pycache__" | \
    grep -v "# noqa: ray-legacy" && echo "❌ Found legacy ray imports!" && exit 1

# 检查文档中的遗留 Ray 术语
grep -rn "ray\.init\|ray\.remote\|RayServiceTask\|ray_task\.py" docs_src/ --include="*.md" && \
    echo "❌ Found legacy Ray docs!" && exit 1

echo "✅ No legacy Ray terms found"
```

---

## 7. 参考文档

| 文档 | 说明 |
|-----|------|
| [Flownet→SAGE 迁移边界](../concepts/architecture/design-decisions/flownet-migration-boundary.md) | P0 权威边界定义（Issue #1430） |
| [SAGE Facade API](../concepts/architecture/design-decisions/sage-facade-api.md) | Facade 四动词详细说明（Issue #1432） |
| [L2 Platform Layer](../concepts/architecture/design-decisions/l2-platform-layer.md) | 运行时协议 ABC（Issue #1434） |
| [RPC 队列重构](../concepts/architecture/design-decisions/rpc-queue-refactoring.md) | 队列描述符迁移（Issue #1436） |
| [sage-libs 重构](../concepts/architecture/design-decisions/sage-libs-restructuring.md) | 独立算法库结构（Issue #1440） |
| [架构总览](../concepts/architecture/overview.md) | SAGE L1–L5 层级全景 |
| [测试分类](../developers/test-taxonomy.md) | 三层测试模型（Issue #1439） |
