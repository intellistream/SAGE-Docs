# Flownet → SAGE 迁移边界与层级归属

!!! abstract "文档状态"
    - **优先级**: P0（架构锁定）
    - **Wave**: Wave A（Architecture Lock-in）
    - **关联 Issue**: [intellistream/SAGE#1430](https://github.com/intellistream/SAGE/issues/1430)
    - **最后更新**: 2026-02-19

本文档是 Flownet → SAGE 迁移的**唯一权威边界定义**。所有迁移 PR 必须引用本文档并通过本文中的合规检查清单方可合并。

---

## 1. 核心原则

| 原则 | 说明 |
|-----|------|
| **SAGE 吸收声明层** | SAGE 只接收声明/API/协议抽象层（DSL、接口、类型契约） |
| **Flownet 保留运行时核心** | 执行循环、传输层、集群编排等运行时核心实现留在 Flownet |
| **迁移即删除** | 代码迁移后立即从源仓库删除，不保留兼容 shim 或重导出层 |
| **边界违规即拒绝** | 任何违反本边界的 PR 必须被拒绝，直到修正为止 |

---

## 2. 迁移矩阵（权威版本）

下表定义了每个能力域的归属与迁移策略。

| 能力域 | 制品类型 | 目标归属 | 迁移策略 |
|--------|---------|---------|---------|
| 声明式 DSL（`@flow`、图声明、组合 API 语义） | 声明 + API 接口 | SAGE L3（`sage-kernel` 接口/DSL 层） | **迁移** |
| 共享基础类型（payload/事件信封原语，跨层可用） | 数据类型（稳定 schema） | SAGE L1（`sage-common`） | **迁移** |
| Flow 特定引用类型（flow 程序引用、无状态 op 引用元数据契约） | 数据类型 + 验证 | SAGE L3 | **迁移** |
| 异常模型（分类、决策语义：传播/终止/降级） | API + 类型契约 | SAGE L1（通用信封）/ L3（flow 语义） | **迁移** |
| 上下文传播工具（上下文槽、保留上下文的执行辅助工具） | 工具 API | SAGE L1 | **迁移** |
| 运行时协议契约（submit/call/result/cancel/stop/节点信息接口） | 协议/ABC 仅 | SAGE L2（`sage-platform`） | **迁移（仅 ABC）** |
| 运行时协议实现（数据包路由、分发器接线、远程调用管理器集成） | 运行时实现 | Flownet 运行时核心 | **不迁移** |
| 调度声明 schema（资源/放置表达式） | Schema 契约 | SAGE L3（生产方）+ Flownet 运行时核心（消费方） | **迁移 schema，实现不迁移** |

---

## 3. 不迁移列表（必须留在 Flownet 运行时核心）

以下制品**永远不应**迁移到 SAGE，原因是它们与运行时性能/一致性紧耦合：

| 制品 | 原因 |
|-----|------|
| 运行时执行循环与请求推进引擎 | 执行路径关键，强耦合于运行时状态机 |
| Actor 运行时生命周期/分发实现 | 与线程池、事件循环、序列化深度耦合 |
| 传输栈实现（TCP/UDS/SHM、传输选择器/Hub） | 平台相关，高性能路径 |
| 集群 gossip/成员/节点控制内部实现 | 集群一致性协议，属于 Flownet 专有能力 |
| 运行时状态后端实现与运行时 kernel 接线 | 运行时内部状态，不属于 SAGE 声明语义 |

---

## 4. 层级归属详细说明

### SAGE L1（`sage-common`）接收

- **共享基础类型**：`PayloadEnvelope`、事件信封、跨层可用的原语类型
- **通用异常类型**：`SageException` 基类、错误分类枚举
- **上下文传播 API**：`ContextSlot`、上下文保留执行器辅助工具

### SAGE L2（`sage-platform`）接收

- **运行时协议 ABC**（仅接口，不含实现）：
  - `RuntimeProtocol`：`submit()`, `call()`, `cancel()`, `stop()`, `node_info()`
  - `ResultHandle`：结果句柄抽象
  - `RuntimeAdapter`：Flownet 适配器接口

### SAGE L3（`sage-kernel` 接口/DSL 层）接收

- **Flow 声明 DSL**：`@flow` 装饰器语义、`FlowDef`/`FlowMethod` 风格 API、图声明验证
- **Flow 特定引用类型**：flow 程序引用、无状态 op 引用元数据契约
- **调度声明 schema**：资源规格（`cpu/gpu/memory/affinity`）、放置决策 schema
- **Flow 级异常处理 API**：传播/终止/降级策略声明

### Flownet 运行时核心保留

- 所有[不迁移列表](#3-不迁移列表必须留在-flownet-运行时核心)中的制品
- 运行时协议的**实现**（消费 SAGE L2 定义的 ABC）
- 调度声明 schema 的**消费方**（放置算法实现）

---

## 5. 执行规则

### 5.1 迁移即删除（Move-Then-Delete）

```
✅ 正确流程：
  1. 在 SAGE 目标层创建新模块
  2. 迁移代码
  3. 更新所有调用方的 import 路径
  4. 从 Flownet 源位置删除旧代码
  5. CI 验证无 broken import

❌ 禁止操作：
  - 在源位置保留重导出 shim（from flownet.x import y）
  - 创建向后兼容层
  - "临时"兼容 wrapper
```

### 5.2 无 shim 规则

迁移期间和迁移后，**不得**在源仓库保留任何形式的：

- 重导出 shim：`from sage.kernel.flow import FlowDef  # 向后兼容`
- 空模块占位
- 废弃警告转发层

原因：shim 层隐藏了 import 路径的真实依赖关系，延迟了调用方更新，制造技术债务。

---

## 6. PR 合规检查清单

每个迁移相关的 PR 描述中必须包含以下部分：

```markdown
## 迁移边界合规检查（引用 intellistream/SAGE#1430）

### 本 PR 迁移了什么
- [ ] 列出迁移的模块/类/函数

### 本 PR 中什么留在 Flownet
- [ ] 列出保留在 Flownet 的制品及原因

### 边界验证
- [ ] 已对照迁移矩阵验证，迁移制品属于声明/API/协议抽象层
- [ ] 迁移制品不包含任何运行时核心实现
- [ ] 源位置旧代码已删除，无 shim/重导出层
- [ ] 所有调用方 import 路径已更新
- [ ] 单元测试在无运行时核心依赖的情况下通过
```

---

## 7. 具体示例：合规 vs 违规

### ✅ 合规迁移示例

```python
# 迁移前（Flownet）
# sageFlownet/src/sage/flownet/compiler/flow_def.py
class FlowDef:
    """Flow 程序声明。"""
    def __init__(self, name: str, ...): ...

# 迁移后（SAGE L3）
# packages/sage-kernel/src/sage/kernel/flow/declaration/flow_def.py
class FlowDef:
    """Flow 程序声明。"""
    def __init__(self, name: str, ...): ...

# Flownet 中原文件已删除，调用方更新 import：
# from sage.kernel.flow.declaration import FlowDef  # ✅
```

### ❌ 违规迁移示例（禁止）

```python
# sageFlownet/src/sage/flownet/compiler/flow_def.py
# 向后兼容 shim —— 禁止！
from sage.kernel.flow.declaration import FlowDef  # ❌ shim 层

# 禁止原因：shim 层制造两个"真实"定义，破坏唯一信息源
```

### ❌ 边界违规示例（禁止迁移）

```python
# 以下代码属于运行时核心，不得迁移到 SAGE：

# sageFlownet/src/sage/flownet/runtime/runtime.py
class FlownetRuntime:
    def handle(self, request: FlowRequest):
        # 执行循环、请求推进 —— 运行时核心，永远留在 Flownet
        ...
```

---

## 8. 依赖与执行波次

本文档是所有迁移波次的前提条件：

```
Wave A（架构锁定）：本文档 → Issue #2（声明层）→ Issue #4（协议接口）→ Issue #3（门面 API）
Wave B（能力迁移）：Issue #6（上下文）→ Issue #5（异常）→ Issue #7（引用）→ Issue #8（调度）→ Issue #9（CLI）
Wave C（收敛）：Issue #10（去重）→ Issue #11（测试）→ Issue #12（文档）
```

**执行规则**：后续波次的编码不得在前序波次验收标准满足之前开始。

---

## 9. 风险与缓解

| 风险 | 缓解措施 |
|-----|---------|
| 边界语言过于抽象，难以执行 | 本文档第 6 节提供具体 PR 检查清单；第 7 节提供合规/违规示例 |
| 团队成员对边界理解不一致 | 所有迁移 PR 必须引用本文档编号的具体条目 |
| 迁移过程中 Flownet 调用方 import 路径过期 | 迁移 PR 必须同时更新所有调用方，CI 通过（无 broken import）才可合并 |
| shim 层悄悄创建 | pre-commit hook `libs-middleware-import-check` 类型的 CI 检查可扩展覆盖此场景 |
