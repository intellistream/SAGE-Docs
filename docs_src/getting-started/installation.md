# SAGE 安装指南

本文档将指导您如何 **安装 SAGE** 及其相关依赖。请根据您的需求选择合适的安装方式。

______________________________________________________________________

## *A*. 前置要求 (Prerequisites)

在开始安装之前，请确保您的开发环境满足以下要求：

- **操作系统 (OS)**：Ubuntu 22.04 及以上版本（推荐）/ macOS / Windows (WSL2)
- **Python 版本**：Python 3.10 或更高版本（推荐 3.11）
- **可选依赖**：[Anaconda/Miniconda](https://www.anaconda.com/)（推荐用于环境管理）

### 使用 Conda 创建虚拟环境（推荐）

```bash
conda create -n sage python=3.11
conda activate sage
```

<small>*温馨提示：若 Conda 创建失败，可能是网络问题导致，请及时更换 Conda 源。*</small>

### 使用系统 Python

如果不使用 Conda，确保您的系统 Python 版本 ≥ 3.10：

```bash
python --version  # 应显示 Python 3.10.x 或更高版本
```

______________________________________________________________________

## *B*. 快速安装（推荐）

### 方式 1：使用 quickstart.sh（开发者推荐）

从源码安装可以获得最新功能和完整的开发环境配置：

```bash
# 克隆仓库
git clone https://github.com/intellistream/SAGE.git
cd SAGE

# 切换到开发分支（推荐）
git checkout main-dev

# 交互式安装（推荐初次使用）
./quickstart.sh

# 或直接指定安装模式
./quickstart.sh --dev --yes      # 开发模式（完整功能 + 开发工具）
./quickstart.sh --standard --yes # 标准模式（完整功能）
./quickstart.sh --core --yes     # 核心模式（仅核心组件）
```

**quickstart.sh 模式矩阵**：

| 选项         | 包含内容                      | 典型用途                   |
| ------------ | ----------------------------- | -------------------------- |
| `--core`     | `sage-common` + `sage-kernel` | 精简运行/CI 快速验证       |
| `--standard` | 全量运行时（L1-L5）           | 生产近似部署               |
| `--full`     | 运行时 + examples/docs        | 需要教程与样例资产         |
| `--dev`      | `--full` + 开发工具链         | 贡献者开发、`sage-dev` CLI |

附加参数：

- `--pip` / `--conda`：显式指定使用系统 Python 或自动创建 Conda 环境（默认 Conda）。
- `--yes`：跳过交互确认，适合脚本/CI。
- `--vllm`：在 GPU 主机上额外安装 vLLM 依赖。

**quickstart.sh 特性**：

- 🎯 交互式菜单（首次使用友好）
- 🤖 可选 vLLM 集成（使用 `--vllm` 标志）
- 🐍 支持 Conda 或系统 Python（使用 `--pip` 跳过 Conda）
- ⚡ 四种安装模式：core / standard / full / dev
- 🔧 自动配置环境和依赖
- 🪝 默认执行 `./manage.sh`：同步子模块并安装 Git hooks
- 📏 运行 `./tools/install/check_tool_versions.sh`，保持 `tools/pre-commit-config.yaml` 与
  `packages/sage-tools/pyproject.toml` 中 Ruff 版本一致

### 方式 2：使用 PyPI（快速部署）

通过 pip 直接安装（适合生产环境快速部署）：

```bash
# 最小安装 - 仅核心组件
pip install isage[minimal]

# 标准安装 - 完整功能（推荐）
pip install isage[standard]

# 开发者安装 - 完整功能 + 开发工具
pip install isage[dev]

# 默认安装（包含数据科学基础库）
pip install isage
```

**安装模式说明**：

- `core`：仅包含 sage-common 和 sage-kernel（核心流处理引擎）
- `standard`：包含所有运行时组件（middleware、libs、tools）
- `full`：包含完整功能 + 示例
- `dev`：full 模式 + 开发工具（pytest、pre-commit 等）（默认）

> **注意**：PyPI 安装可能不包含所有系统依赖（如 C++ 编译工具）。如需完整的开发环境，建议使用 quickstart.sh。

______________________________________________________________________

## *C*. 验证安装 (Verify Installation)

安装完成后，您可以通过以下方式验证 SAGE 是否成功安装。

### 方法 1：检查系统状态（推荐）

```bash
sage doctor
```

该命令会检查：

- ✅ Python 版本
- ✅ SAGE 包安装状态
- ✅ C++ 扩展编译状态
- ✅ 环境变量配置
- ✅ 系统依赖

### 方法 2：查看包信息

```bash
pip show isage
```

您将看到类似输出：

```
Name: isage
Version: 0.1.5
Summary: SAGE - Streaming-Augmented Generative Execution
Home-page: https://github.com/intellistream/SAGE
Author: SAGE Team
License: MIT
Location: /path/to/your/python/site-packages
Requires: isage-tools, numpy, pandas, matplotlib, scipy, jupyter, ipykernel
Required-by:
```

### 方法 3：运行 Hello World 示例

创建 `hello_world.py` 文件：

```python
from sage.core.api.local_environment import LocalEnvironment
from sage.core.api.function.sink_function import SinkFunction
from sage.core.api.function.batch_function import BatchFunction
from sage.core.api.function.map_function import MapFunction


# 批处理数据源：生成 10 条 "Hello, World!" 字符串
class HelloBatch(BatchFunction):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.counter = 0
        self.max_count = 10  # 生成 10 个数据包后返回 None

    def execute(self):
        if self.counter >= self.max_count:
            return None  # 返回 None 表示批处理完成
        self.counter += 1
        return f"Hello, World! #{self.counter}"


# MapFunction：将内容转为大写
class UpperCaseMap(MapFunction):
    def execute(self, data):
        return data.upper()


# SinkFunction：打印结果
class PrintSink(SinkFunction):
    def execute(self, data):
        print(data)


def main():
    env = LocalEnvironment("Hello_World")

    # 构建数据流 Pipeline：批处理源 -> map -> sink
    env.from_batch(HelloBatch).map(UpperCaseMap).sink(PrintSink)

    # 提交执行（autostop=True 表示批处理完成后自动停止）
    env.submit(autostop=True)
    print("Hello World 批处理示例结束")


if __name__ == "__main__":
    main()
```

运行示例：

```bash
python hello_world.py
```

预期输出：

```
HELLO, WORLD! #1
HELLO, WORLD! #2
HELLO, WORLD! #3
HELLO, WORLD! #4
HELLO, WORLD! #5
HELLO, WORLD! #6
HELLO, WORLD! #7
HELLO, WORLD! #8
HELLO, WORLD! #9
HELLO, WORLD! #10
Hello World 批处理示例结束
```

至此，您已成功安装 SAGE！

______________________________________________________________________

## *D*. 构建 C++ 扩展（可选，推荐）

SAGE 提供高性能的 C++ 扩展，包括：

- **sage_db**：向量数据库（用于 RAG、Embedding 检索）
- **sage_flow**：高性能流式算子（加速数据处理）

### 安装扩展

```bash
# 安装所有扩展（推荐）
sage extensions install all

# 按需安装单个扩展
sage extensions install sage_db
sage extensions install sage_flow
```

### 检查扩展状态

```bash
sage extensions status
```

该命令会显示：

- ✅ 已编译的扩展
- ⚠️ 未编译的扩展
- ❌ 缺失的系统依赖（如 cmake、gcc）

### 系统依赖

C++ 扩展需要以下工具（quickstart.sh 会自动安装）：

**Ubuntu/Debian**:

```bash
sudo apt-get update
sudo apt-get install -y build-essential cmake git
```

**macOS**:

```bash
brew install cmake
xcode-select --install
```

**Windows (WSL2)**:

```bash
sudo apt-get update
sudo apt-get install -y build-essential cmake git
```

### 重新编译扩展

如果需要重新编译（例如更新代码后）：

```bash
sage extensions install all --force
```

______________________________________________________________________

## *E*. 环境配置

安装完成后，配置 API 密钥和环境变量以使用完整功能。

### 交互式配置（推荐）

```bash
sage config env setup
```

该命令会引导您配置：

- OpenAI API Key（用于 GPT 模型）
- HuggingFace Token（用于模型下载）
- 其他第三方服务密钥

### 手动配置

```bash
# 复制环境模板
cp .env.template .env

# 编辑 .env 文件，添加您的 API 密钥
nano .env  # 或使用您喜欢的编辑器
```

**.env 文件示例**：

```bash
# OpenAI API（用于大多数 LLM 示例）
OPENAI_API_KEY=sk-your-openai-api-key-here

# HuggingFace Token（用于模型下载）
HF_TOKEN=hf_your-huggingface-token-here

# 其他可选服务
JINA_API_KEY=your-jina-key
ALIBABA_API_KEY=your-alibaba-key
```

### 验证配置

```bash
# 检查环境配置
sage config env show

# 测试 API 连接
sage doctor
```

> **版本提示**：若手动升级 `ruff` 或 pre-commit，请运行 `./tools/install/check_tool_versions.sh --fix`，确保
> `tools/pre-commit-config.yaml` 与 `packages/sage-tools/pyproject.toml` 中的版本保持一致，再次执行
> `sage-dev quality --check-only` 验证结果。

______________________________________________________________________

## *F*. 常见问题与解决方案

### 问题 1：Python 版本不兼容

**错误信息**：

```
Building wheel for faiss-cpu (pyproject.toml) ... error
ERROR: Failed building wheel for faiss-cpu
```

**原因分析**：Faiss 官方包支持 Python 3.8-3.12，不支持 Python 3.13+

**解决方案**：

```bash
# 使用 Python 3.11（推荐）
conda create -n sage python=3.11
conda activate sage
pip install isage
```

### 问题 2：C++ 扩展编译失败

**错误信息**：

```
CMake Error: CMake was unable to find a build program
```

**原因分析**：缺少 C++ 编译工具

**解决方案**：

```bash
# Ubuntu/Debian
sudo apt-get install -y build-essential cmake

# macOS
brew install cmake
xcode-select --install
```

### 问题 3：pip 安装超时

**错误信息**：

```
ERROR: Operation cancelled by user
ReadTimeoutError: HTTPSConnectionPool
```

**原因分析**：网络连接问题或下载源速度慢

**解决方案**：

```bash
# 使用国内镜像源
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple isage

# 或配置永久镜像源
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

### 问题 4：导入 SAGE 失败

**错误信息**：

```python
ModuleNotFoundError: No module named 'sage'
```

**原因分析**：

1. SAGE 未正确安装
1. Python 环境不正确

**解决方案**：

```bash
# 检查安装状态
pip show isage

# 确认 Python 环境
which python
python --version

# 重新安装
pip install --force-reinstall isage
```

## *G*. 下一步

安装完成后，您可以：

1. **学习基础教程**：[快速开始](./quickstart.md) 查看示例代码
1. **浏览完整示例**：[Examples 目录](https://github.com/intellistream/SAGE/tree/main-dev/examples)
1. **阅读开发指南**：[开发环境配置](../developers/development-setup.md)
1. **加入社区**：[社区指南](../community/community.md) 获取帮助

祝您使用愉快！🎉
