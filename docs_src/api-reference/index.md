# API 参考

SAGE 0.3 之后，公开 API 以单一主仓 `isage` 为中心组织。

## 核心模块

- `sage.foundation`：配置、端口、日志、共享契约
- `sage.stream`：流式 DSL、数据流拼装与变换
- `sage.runtime`：`LocalEnvironment`、`FluttyEnvironment`、调度与执行生命周期
- `sage.serving`：服务接入与网关边界
- `sage.cli`：`sage` 命令行入口
- `sage.edge`：边缘服务壳层

## 端口与环境配置

所有端口常量统一从 `sage.foundation.SagePorts` 获取，避免硬编码。

```python
from sage.foundation import SagePorts

gateway_port = SagePorts.GATEWAY_DEFAULT
llm_port = SagePorts.get_recommended_llm_port()
```

## 推荐阅读顺序

1. 入门：`sage.foundation`
2. 流式建模：`sage.stream`
3. 执行环境：`sage.runtime`
4. 服务接入：`sage.serving` / `sage.edge`
5. 工具入口：`sage.cli`

## 可选能力适配器

以下能力保持为可选扩展，不属于主仓默认核心表面：

- `isagellm`：推理引擎与网关
- `isage-rag`：RAG / 检索增强
- `isage-neuromem`：记忆与持久化
- `isage-libs-intent`：意图识别
- `isage-sias`：tool-use / continual-learning

## 示例

```python
from sage.runtime import LocalEnvironment

env = LocalEnvironment("demo")

(
    env
    .from_source(data_source)
    .map(transform_fn)
    .filter(predicate)
    .sink(output_sink)
)

env.submit()
```

## 相关文档

- [入门文档](../getting-started/index.md)
- [用户指南](../guides/index.md)
- [教程总览](../tutorials/index.md)
