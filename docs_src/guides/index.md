# 用户指南

深入了解 SAGE 各个组件的使用方法和最佳实践。

## 📚 本章内容

用户指南按照 SAGE 的 **L1-L5 分层架构**组织，帮助您从底层基础设施到上层应用全面了解系统。

## 🏗️ SAGE 分层架构

```
┌─────────────────────────────────────────┐
│  L5: 接口层 (Interface Layer)           │
│  sage-cli, sage-tools                   │
├─────────────────────────────────────────┤
│  L4: 中间件层 (Middleware Layer)        │
│  sage-middleware                        │
├─────────────────────────────────────────┤
│  L3: 核心层 (Core Layer)                │
│  sage-kernel, sage-libs                │
├─────────────────────────────────────────┤
│  L2: 平台服务层 (Platform Layer)        │
│  sage-platform                          │
├─────────────────────────────────────────┤
│  L1: 基础设施层 (Foundation Layer)      │
│  sage-common                            │
└─────────────────────────────────────────┘
```

**依赖规则**: L5 → L4 → L3 → L2 → L1 (单向向下依赖)

!!! note "独立仓库"
    以下组件已迁移到独立仓库：
    
    - **sage-examples** (原 sage-apps): [intellistream/sage-examples](https://github.com/intellistream/sage-examples)
    - **sage-benchmark**: [intellistream/sage-benchmark](https://github.com/intellistream/sage-benchmark)
    - **sage-studio**: [intellistream/sage-studio](https://github.com/intellistream/sage-studio)
    - **sageLLM**: [intellistream/sageLLM](https://github.com/intellistream/sageLLM) (PyPI: `isagellm`)

______________________________________________________________________

## 📦 各层详细介绍

### 🔹 L1: 基础设施层

#### [sage-common](packages/sage-common/overview.md)

基础工具库，为所有上层包提供通用功能。

**核心功能**：

- 📝 配置管理 - 统一的配置系统
- 📊 日志系统 - 结构化日志
- 🔧 工具函数 - 通用工具集
- 🎯 核心类型 - 基础数据结构

👉 [查看文档](packages/sage-common/overview.md)

______________________________________________________________________

### 🔹 L2: 平台服务层

#### [sage-platform](packages/sage-platform/overview.md)

平台抽象层，提供队列、存储、服务等基础设施抽象。

**核心功能**：

- 📬 **队列抽象** - Python Queue, RPC Queue
- 💾 **存储抽象** - Key-Value 存储后端
- 🔌 **服务基类** - 统一的服务接口

**设计原则**：

- 解耦基础设施与业务逻辑
- 支持多种实现方式
- 使用工厂模式处理跨层依赖

👉 [查看文档](packages/sage-platform/overview.md)

______________________________________________________________________

### 🔹 L3: 核心层

#### [Kernel 执行引擎](packages/sage-kernel/readme.md)

SAGE 的流式处理核心，提供 DataStream API 和执行运行时。

**核心功能**：

- 🌊 **DataStream API** - 声明式数据流编程
- ⚙️ **执行引擎** - 本地和分布式执行
- 🔧 **算子系统** - Map、Filter、Join 等数据转换
- 📡 **运行时服务** - 通信、任务管理、状态管理

**适合场景**：

- 构建流式数据处理应用
- 实现实时数据转换和分析
- 开发复杂的数据处理 Pipeline

👉 [查看 Kernel 文档](packages/sage-kernel/readme.md)

______________________________________________________________________

#### [Libs AI 组件库](packages/sage-libs/readme.md)

高级 AI 算法库，包含 RAG、Agents、Embeddings 等开箱即用的组件。

**核心功能**：

- 🤖 **Agents** - 智能 Agent 框架，支持 ReAct、Plan-Execute 等模式
- 📚 **RAG** - 检索增强生成，包含完整的 RAG Pipeline
- 🔍 **Embeddings** - 向量嵌入和相似度搜索
- 🛠️ **Tools** - 预置工具集（搜索、图像识别、文本提取等）
- 💾 **Context** - 上下文管理和记忆系统

**适合场景**：

- 构建 AI Agent 应用
- 实现 RAG 问答系统
- 集成 LLM 能力到数据流

👉 [查看 Libs 文档](packages/sage-libs/readme.md)

______________________________________________________________________

### 🔹 L4: 中间件层

#### [Middleware 中间件](packages/sage-middleware/overview.md)

领域特定的算子和中间件服务，提供数据库、向量存储等能力。

**核心功能**：

- 🧠 **NeuroMem** - 向量数据库和记忆管理
- 💾 **SageDB** - 时序数据库
- 🚀 **SageFlow** - 高性能流式算子（C++ 实现）
- 🎯 **GPU 加速** - CUDA 加速的向量操作

**适合场景**：

- 需要高性能向量检索
- 时序数据存储和查询
- GPU 加速的数据处理

👉 [查看 Middleware 文档](packages/sage-middleware/overview.md)

______________________________________________________________________

### 🔹 L5: 接口层

#### [CLI 工具](packages/sage-tools/cli_reference.md)

命令行管理工具，提供便捷的开发和运维命令。

👉 [查看 CLI 文档](packages/sage-tools/cli_reference.md)

______________________________________________________________________

#### [Pipeline Builder](packages/sage-tools/pipeline_builder.md)

可视化 Pipeline 构建工具。

👉 [查看文档](packages/sage-tools/pipeline_builder.md)

______________________________________________________________________

#### sage-studio 可视化 (独立仓库)

Web 界面管理工具，提供可视化的系统管理能力。

🔗 [sage-studio 仓库](https://github.com/intellistream/sage-studio)

______________________________________________________________________

## 📖 部署运维

### [部署指南](deployment/index.md)

生产环境部署和运维最佳实践：

- 🚀 部署架构设计
- 🔒 安全性配置
- 📊 监控和日志
- 🔄 持续集成/部署

### [最佳实践](best-practices/index.md)

SAGE 开发的最佳实践和常见模式：

- ✅ 代码组织规范
- 🎯 性能优化技巧
- 🐛 常见问题解决
- 🔧 调试和测试

______________________________________________________________________

## 🗺️ 学习路径

### 初学者路径（自下而上）

1. **理解基础架构**

   - [L1: sage-common](packages/sage-common/overview.md) - 了解基础工具
   - [L2: sage-platform](packages/sage-platform/overview.md) - 理解平台抽象

1. **掌握核心功能**

   - [L3: Kernel 快速开始](packages/sage-kernel/guides/quickstart.md)
   - [L3: Kernel 基本操作](packages/sage-kernel/guides/operations.md)
   - [L3: Libs 概览](packages/sage-libs/readme.md)

1. **探索高级能力**

   - [L4: Middleware 组件](packages/sage-middleware/overview.md)
   - [L3: RAG 入门](packages/sage-libs/rag.md)
   - [L3: Agent 示例](packages/sage-libs/agents.md)

1. **构建实际应用**

   - [L5: 应用示例](applications.md)
   - [L6: CLI 工具](packages/sage-tools/cli_reference.md)

### 进阶路径（按需深入）

#### 深入 L3 核心层

1. **Kernel 深度学习**

   - [架构设计](packages/sage-kernel/architecture.md)
   - [核心概念](packages/sage-kernel/concepts.md)
   - [性能优化](packages/sage-kernel/guides/improvements.md)

1. **Libs 高级功能**

   - [设计哲学](packages/sage-libs/philosophy.md)
   - [自定义 Agents](packages/sage-libs/agents.md)
   - [算子参考](packages/sage-libs/operators_reference.md)

#### 扩展与优化

3. **L4 中间件和服务**

   - [NeuroMem 深入](packages/sage-middleware/components/neuromem.md)
   - [GPU 加速](packages/sage-middleware/hardware/gpu_acceleration.md)
   - [自定义服务](packages/sage-middleware/service/service_intro.md)

1. **平台抽象理解**

   - [L2 平台层设计](../concepts/architecture/design-decisions/l2-platform-layer.md)
   - [工厂模式应用](../concepts/architecture/design-decisions/rpc-queue-refactoring.md)

______________________________________________________________________

## 📊 快速参考

### 常用操作

| 任务                | 参考文档                                                         | 层级 |
| ------------------- | ---------------------------------------------------------------- | ---- |
| 创建数据流 Pipeline | [Kernel 快速开始](packages/sage-kernel/guides/quickstart.md)     | L3   |
| 实现 RAG 应用       | [RAG 指南](packages/sage-libs/rag.md)                            | L3   |
| 构建 AI Agent       | [Agents 文档](packages/sage-libs/agents.md)                      | L3   |
| 使用向量数据库      | [NeuroMem 文档](packages/sage-middleware/components/neuromem.md) | L4   |
| 配置基础设施        | [sage-common 文档](packages/sage-common/overview.md)             | L1   |
| 管理平台服务        | [sage-platform 文档](packages/sage-platform/overview.md)         | L2   |
| 部署到生产环境      | [部署指南](deployment/)                                          | -    |
| 性能优化            | [性能优化](packages/sage-kernel/guides/improvements.md)          | L3   |

### API 快速入口

| 层级 | API 文档                                                          | 说明                               |
| ---- | ----------------------------------------------------------------- | ---------------------------------- |
| L1   | [Common API](../api-reference/common/index.md)                    | 基础类型和工具                     |
| L2   | [Platform API](../api-reference/platform/index.md)                | 队列、存储、服务                   |
| L3   | [Kernel API](packages/sage-kernel/api/datastreams.md)             | DataStream、Environment、Functions |
| L3   | [Libs API](packages/sage-libs/operators_reference.md)             | Agents、RAG、Embeddings 算子       |
| L4   | [Middleware API](packages/sage-middleware/service/service_api.md) | 中间件服务接口                     |

______________________________________________________________________

## 💡 使用建议

### 按使用场景选择

**构建数据处理应用**\
→ 重点学习 [L3: Kernel](packages/sage-kernel/readme.md)

**开发 AI Agent**\
→ 重点学习 [L3: Libs - Agents](packages/sage-libs/agents.md)

**实现 RAG 系统**\
→ 学习 [L3: Libs - RAG](packages/sage-libs/rag.md) +
[L4: Middleware - NeuroMem](packages/sage-middleware/components/neuromem.md)

**高性能需求**\
→ 学习 [L4: Middleware](packages/sage-middleware/overview.md) +
[GPU 加速](packages/sage-middleware/hardware/gpu_acceleration.md)

**理解系统架构**\
→ 从 L1 到 L5 逐层学习，理解依赖关系

### 按角色选择

**应用开发者**\
→ 重点：L3 (Kernel + Libs) + [sage-examples](https://github.com/intellistream/sage-examples)

**平台工程师**\
→ 重点：L1 (Common) + L2 (Platform) + L4 (Middleware)

**算法工程师**\
→ 重点：L3 (Libs) + L4 (Middleware)

**DevOps 工程师**\
→ 重点：L5 (CLI/Tools) + 部署运维

______________________________________________________________________

## 🆘 获取帮助

- 📖 查看 [常见问题](packages/sage-kernel/faq.md)
- 💬 访问 [GitHub Discussions](https://github.com/intellistream/SAGE/discussions)
- 🐛 报告 [GitHub Issues](https://github.com/intellistream/SAGE/issues)
- 👥 加入 [社区](../community/readme.md)
- 📚 阅读 [包架构文档](../concepts/architecture/package-structure.md)

______________________________________________________________________

## 🚀 下一步

选择您感兴趣的层级开始学习：

<div class="grid cards" markdown>

- :material-layers-triple:{ .lg .middle } __L1: 基础设施层__

  ______________________________________________________________________

  sage-common - 基础工具和配置

  [:octicons-arrow-right-24: 查看文档](packages/sage-common/overview.md)

- :material-server:{ .lg .middle } __L2: 平台服务层__

  ______________________________________________________________________

  sage-platform - 队列、存储、服务抽象

  [:octicons-arrow-right-24: 查看文档](packages/sage-platform/overview.md)

- :material-engine-outline:{ .lg .middle } __L3: 核心层__

  ______________________________________________________________________

  Kernel 执行引擎 + Libs AI 组件库

  [:octicons-arrow-right-24: Kernel](packages/sage-kernel/readme.md) |
  [:octicons-arrow-right-24: Libs](packages/sage-libs/readme.md)

- :material-database-outline:{ .lg .middle } __L4: 中间件层__

  ______________________________________________________________________

  向量数据库、时序数据库、GPU 加速

  [:octicons-arrow-right-24: 查看文档](packages/sage-middleware/overview.md)

- :material-monitor-dashboard:{ .lg .middle } __L5: 接口层__

  ______________________________________________________________________

  CLI 工具、开发工具

  [:octicons-arrow-right-24: 查看工具](packages/sage-tools/cli_reference.md)

</div>
