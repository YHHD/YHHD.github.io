---
title: Archon 国内服务商扩展方案
date: 2026-04-09
tags: [AI, Archon, MCP, 服务商]
source: 内部整理
category: "项目与方案"
description: "让 Archon 接入国内 LLM 与 Embedding 服务商的扩展方案。"
---

**目标**：让 Archon 支持国内 LLM 和词嵌入服务商，消除对 OpenAI 的硬依赖

## 背景

Archon 使用 OpenAI Python SDK 作为统一客户端，通过 `base_url` 切换 LLM 服务商。词嵌入部分有适配器架构（`OpenAICompatibleEmbeddingAdapter` / `GoogleEmbeddingAdapter`），但目前没有国内服务商的原生适配器。

配置通过 Archon UI（Settings 页）写入数据库，不依赖 `.env`。

---

## 阶段一：零代码接入（LLM + 部分 Embedding）

### 适用范围

凡提供 OpenAI 兼容接口的服务商，直接在 Archon UI 填写 `base_url` + `api_key` 即可使用。

### 国内兼容服务商清单

| 服务商 | base_url | 支持 LLM | 支持 Embedding |
|--------|----------|----------|---------------|
| DeepSeek | `https://api.deepseek.com/v1` | ✅ deepseek-chat / reasoner | ❌ |
| 硅基流动 SiliconFlow | `https://api.siliconflow.cn/v1` | ✅ Qwen / DeepSeek 等 | ✅ BAAI/bge-m3 等 |
| 月之暗面 Moonshot | `https://api.moonshot.cn/v1` | ✅ moonshot-v1-* | ❌ |
| 智谱 AI | `https://open.bigmodel.cn/api/paas/v4` | ✅ GLM-4 | ⚠️ 部分兼容 |
| 豆包 (火山引擎) | `https://ark.cn-beijing.volces.com/api/v3` | ✅ | ❌ |

**最优推荐（阶段一）**：
- LLM：DeepSeek（性价比最高）
- Embedding：硅基流动 + `BAAI/bge-m3`（OpenAI 兼容，中文效果好）

### 配置步骤

1. 打开 Archon UI → Settings → LLM Provider
2. 选择 `openai`，填入国内服务商的 `base_url` 和 `api_key`
3. Embedding 同理，选择 `openai`，填入硅基流动的地址和模型名

---

## 阶段二：代码扩展（非兼容服务商原生适配器）

### 目标服务商

| 服务商 | Embedding API | 原因 |
|--------|--------------|------|
| 阿里云 DashScope | `text-embedding-v3` | 企业级，阿里生态用户 |
| 智谱 AI | `embedding-3` | 中文专优，非标准接口 |
| 百度文心 | `Embedding-V1` | 百度生态 |

### 实现路径

参考 Archon 现有架构（`embedding_service.py`），新增适配器类：

```python
# python/src/server/services/embeddings/dashscope_adapter.py
class DashScopeEmbeddingAdapter:
    """阿里云 DashScope 词嵌入适配器"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"

    async def embed(self, texts: list[str], model: str = "text-embedding-v3") -> list[list[float]]:
        # DashScope 有 OpenAI 兼容模式，可复用 OpenAICompatibleEmbeddingAdapter
        ...
```

> 注：DashScope 已提供 OpenAI 兼容端点，优先复用现有适配器，仅需注册新 provider 名称。

### 需修改的文件

```
python/src/server/services/embeddings/
├── embedding_service.py       # 注册新 provider
├── dashscope_adapter.py       # 新增
├── zhipu_adapter.py           # 新增（如需）
└── baidu_adapter.py           # 新增（如需）
```

---

## 阶段三：Docker 自定义镜像部署

### 方案

Fork `coleam00/archon` → 添加适配器代码 → 构建自定义镜像 → 替换原镜像。

### Dockerfile 修改点

```dockerfile
# 基于官方镜像，仅叠加修改
FROM coleam00/archon:latest

# 复制自定义适配器
COPY python/src/server/services/embeddings/ \
     /app/python/src/server/services/embeddings/

# 安装额外依赖（如有）
RUN pip install dashscope
```

### docker-compose 接入

```yaml
services:
  archon:
    build: .                          # 使用自定义 Dockerfile
    # image: coleam00/archon:latest   # 注释掉官方镜像
    env_file: .env
    ports:
      - "3737:3737"
      - "8080:8080"
```

### 部署流程

```bash
# 1. Fork 并克隆
git clone https://github.com/YOUR_NAME/archon
cd archon

# 2. 添加适配器代码（见阶段二）

# 3. 构建镜像
docker build -t my-archon:latest .

# 4. 启动
docker-compose up -d
```

---

## 踩坑预判

- **DashScope Embedding 维度**：`text-embedding-v3` 默认 1536 维，与 Supabase 中 pgvector 列定义需匹配（`vector(1536)`）
- **智谱 Embedding**：`embedding-3` 为 2048 维，若已有 OpenAI 1536 维数据，需重建向量表
- **Rate Limit**：国内服务商 RPM 限制各异，DeepSeek 高峰期限流明显，建议配置重试逻辑

---

## 进度

- [ ] 阶段一：在 Archon UI 配置硅基流动 Embedding
- [ ] 阶段一：验证 RAG 检索可用
- [ ] 阶段二：实现 DashScope 适配器
- [ ] 阶段三：构建自定义 Docker 镜像
