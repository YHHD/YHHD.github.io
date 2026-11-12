---
title: Hermes Agent 架构解析
date: 2026-04-19
tags: [AI, Agent, 架构, 开源]
source: raw/hermes-agent-architecture.md
category: "AI 与 Agent"
description: "自我进化 Agent 的技能系统、记忆分层与 RL 训练集成。"
---

> Nous Research 开发的自我进化 AI Agent，核心特色：内置学习闭环，从经验中自动创建技能（Skill），跨会话搜索历史，持续自我改进。

## 与 Claude Code 的定位差异

| 维度 | Claude Code | Hermes Agent |
|------|-------------|--------------|
| 使命 | 软件工程助手 | 通用个人 Agent |
| 接入方式 | CLI / IDE 插件 | CLI + 6 大消息平台 |
| 技能系统 | 无 | 内置，可学习可分享 |
| RL 训练 | 无 | 内置（Atropos 集成） |
| 上下文压缩 | 三级压缩（microcompact/autocompact/full） | 滚动摘要 |
| 工具数量 | ~40 个 | 40+ 个 |

---

## 架构分层（五层）

```
入口层        run_agent.py / gateway/run.py（CLI + 消息平台）
Agent 核心层  agent/（提示词构建、记忆、路由、上下文压缩）
LLM 层        OpenAI-spec API（OpenRouter / OpenAI / Anthropic / 本地）
工具分发层    model_tools.py → handle_function_call()
执行环境层    tools/environments/（local / docker / ssh / modal / daytona）
```

---

## 核心机制

### Agent 主循环（environments/agent_loop.py）

`HermesAgentLoop` 实现标准 OpenAI 工具调用协议：

```
初始化 messages
  └── for turn in range(max_turns):
        ├── chat_completion → 获取 tool_calls
        ├── 若无 tool_calls → return（自然结束）
        └── 若有 → ThreadPoolExecutor(128) 并发执行
              └── handle_function_call() → 追加结果 → 下一轮
```

关键设计：工具在独立事件循环中运行（防异步死锁）；超长工具输出走持久化存储而非直接塞入 messages。

### 记忆系统（分层）

```
SOUL.md       Agent 人格定义（每轮注入系统提示）
USER.md       用户画像（自动更新）
MEMORY.md     持久化文字记忆
~/.hermes/sessions/  对话历史 JSONL + FTS5 全文检索
```

外部记忆后端（可选）：Honcho，实现辩证式用户建模（dialectic user modeling）。

`memory_manager.py` 协调：pre-turn 预取 + post-turn 同步，最多一个外部插件后端。

### 技能系统（Skills）

技能 = 用 Markdown 写的"程序性记忆"，兼容 [agentskills.io](https://agentskills.io) 标准：

```
~/.hermes/skills/my-skill/
├── SKILL.md        # YAML frontmatter（name/description/prerequisites）+ 正文
├── references/
├── templates/
└── assets/
```

加载策略采用**渐进式披露**：`skills_list` 只返回元数据（省 token）→ `skill_view` 按需加载完整内容。

Agent 完成任务后会主动提示用户将经验沉淀为技能。

### 子 Agent 委托（delegate_task）

```
parent Agent
  ├── delegate_task(task1) → child Agent 1（隔离上下文，受限工具集）
  └── delegate_task(task2) → child Agent 2（并行）
```

深度上限：2 层。子 Agent 禁止的操作：递归委托、用户交互（clarify）、写共享记忆（memory）、发消息（send_message）。

### 智能模型路由（smart_model_routing.py）

按任务关键词自动切换"廉价模型"与"强模型"：`debug/analyze/implement` 等触发强模型，日常对话走廉价模型。

---

## 多平台消息网关

`GatewayRunner` 统一管理 6 大平台接入：Telegram、Discord、Slack、WhatsApp、Signal、CLI。

所有平台共享同一 Agent 逻辑，通过 `delivery.py` 统一输出投递。

---

## RL 训练集成

Hermes 是目前少数内置强化学习训练管道的开源 Agent：

- `environments/agent_loop.py`：可复用工具调用引擎，同时服务于推理和训练
- `batch_runner.py`：批量生成轨迹数据
- `trajectory_compressor.py`：将长轨迹压缩至 token 预算内
- 对接 Atropos 框架，支持自定义奖励环境（web research / OPD 等）

---

## 安全设计

| 机制 | 位置 |
|------|------|
| Prompt Injection 扫描（含隐形 Unicode） | `agent/prompt_builder.py` |
| 高风险命令白名单 | `tools/approval.py` |
| 文件路径边界限制 | `tools/path_security.py` |
| URL 合法性检查 | `tools/url_safety.py` |
| 依赖漏洞扫描（OSV） | `tools/osv_check.py` |
| DM 用户绑定配对 | `gateway/pairing.py` |

---

## 核心取向

> **靠自我进化降低重复操作成本**：Claude Code 靠工程纪律约束模型行为，Hermes 靠技能积累和用户画像让模型持续变得"更懂你"。两者都选择了不依赖模型自觉的路线，但机制化的方向不同。
