# sage-docs

本仓库用于发布和维护 [SAGE](https://github.com/intellistream/SAGE) 的对外文档。

## 文档入口

- 在线文档：https://sage.org.ai/

入口约定：

- `sage.org.ai` 是 SAGE 产品与文档主入口
- `intellistream.github.io` 是 IntelliStream 组织门户
- `github.com/intellistream` 是代码与仓库入口

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
