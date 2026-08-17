# sage-docs

本仓库用于发布和维护 [SAGE](https://github.com/RIDE-Lab/SAGE) 的对外文档。

SAGE（Streaming-Augmented Generative Execution）是 IntelliStream 研究生态的共同旗舰产品，核心主张是以流计算思维赋能大模型推理与智能体执行。核心仓库托管在 `RIDE-Lab`，表示 RIDE Lab 承担主要工程维护责任，不代表 SAGE 是 RIDE Lab 的排他性产品。

## 文档入口

- 在线文档：https://sage.org.ai/

入口约定：

- `sage.org.ai` 是 SAGE 产品与文档主入口
- `github.com/RIDE-Lab` 是 SAGE 核心代码的托管与主要维护入口
- `ride-lab.github.io` 是 RIDE Lab 的 agent-native systems 研究入口
- `datasys.sage.org.ai` 是 DataSys 数据系统主页
- `vllm-hust.sage.org.ai` 是 vLLM-HUST 推理底座主页
- `lab.sage.org.ai` 是 IntelliStream 研究孵化器主页

## 内容范围

- 快速开始与教程
- 架构与模块说明
- 用户指南与公开 API 文档
- 社区与贡献信息

## 源码访问说明

本仓库仅包含文档内容，不包含 SAGE 核心源码。

## 本地构建（维护者）

```bash
# 一键构建
./build.sh

# 本地预览
zensical serve -a 127.0.0.1:9000

# 手动构建
zensical build --clean
```

## 引用

如需学术引用，请以在线文档中的最新引用说明为准。
