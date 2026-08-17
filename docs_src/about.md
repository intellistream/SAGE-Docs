# SAGE - Streaming-Augmented Generative Execution

> 以流计算思维赋能大模型推理与智能体执行

**SAGE**（Streaming-Augmented Generative Execution）是 IntelliStream 研究生态的共同旗舰产品，也是围绕 `isage` 主包构建的流式 AI 应用框架。RIDE Lab 负责核心仓库的主要工程维护；DataSys 与 vLLM-HUST 分别保有数据系统和推理底座的技术所有权。当前产品边界集中在单一主仓，重点放在：

- `sage.foundation`：共享配置、端口、日志与契约
- `sage.stream`：流式抽象、组合与变换
- `sage.runtime`：本地执行与可选分布式运行时接入
- `sage.serving` / `sage.edge`：服务化接入边界
- `sage.cli`：命令行与开发者工作流入口

## 设计原则

### 流优先

SAGE 的核心不是把所有能力堆进单个黑盒应用，而是把工作流显式表示为数据流图。这样可以让变换、调度、背压和服务接入保持透明。

### 分布式是可选能力

SAGE 默认支持本地执行；需要扩展时，再接入可选的分布式运行环境。主仓不再把分布式能力和核心 API 强绑定。

### 推理引擎外置

LLM / embedding 推理继续由外部能力提供，主仓负责编排与集成边界。当前推荐的外部引擎族是 `isagellm`。

## 可选能力

以下能力继续作为可选适配器按需安装：

- `isage-rag`
- `isage-neuromem`
- `isage-libs-intent`
- `isage-sias`

## 快速开始

```bash
pip install isage
pip install 'isage[dev]'
pip install 'isage[full]'
```

```python
from sage.runtime import LocalEnvironment

env = LocalEnvironment("hello")
```

## 当前 CLI

```bash
sage version
sage status
sage doctor
sage verify
sage runtime nodes
sage serve gateway --json
```

## 仓库角色

SAGE 主仓是核心实现与发布面。

主仓位于 `RIDE-Lab` GitHub namespace，表示 RIDE Lab 是核心工程 steward，不表示 SAGE 是某个单一组织的排他性产品。跨组织协作仍遵守各自的实现边界。

示例、教程、benchmark、文档站点等仓库都应围绕单一主仓 `isage` 构建，而不是重新依赖历史 split-package 布局。
