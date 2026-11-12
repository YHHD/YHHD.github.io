---
title: Claude Code 源码架构解析
date: 2026-04-08
tags: [Claude Code, AI, 架构, Agent]
source: raw/一文读懂：Claude Code框架解析-无代码.md
category: "AI 与 Agent"
description: "从入口、QueryEngine、工具系统到权限管道，拆解 Claude Code 的六层架构。"
---

> 2026年3月31日，`@anthropic-ai/claude-code` npm 包的 source map 意外暴露了未混淆的 TypeScript 源码，才使这份解析成为可能。

## 整体架构：六层分层

| 层 | 内容 |
|----|------|
| 入口层 | `main.tsx` 启动，`setup.ts` 初始化环境 |
| 展示层 | React + Ink 构建的终端 UI |
| 核心引擎 | `QueryEngine`（约4.6万行），处理所有 LLM 对话逻辑 |
| 执行层 | Tool System + Command System |
| 协作层 | 多 Agent 系统 + 远程桥接 |
| 管理层 | 权限、配置、状态管理 |

---

## 启动时序：极致并行

```
T1（导入阶段）→ 并行触发 macOS Keychain 预取 + API 预连接
T2（解析阶段）→ Commander.js 确定会话类型，GrowthBook 加载功能开关
T3（挂载阶段）→ 激活终端备用屏幕，渲染信任对话框或新手引导
T4（启动阶段）→ 建立 MCP 连接，加载 CLAUDE.md，渲染 REPL
```

目的：降低每日高频加载的启动延迟。

---

## 标准请求流

```
用户输入 → 输入处理 → 核心引擎 → 工具调度 → 结果渲染
```

1. 获取用户按键 / `-p` 打印模式指令
2. 整合 `CLAUDE.md` 规范、工具定义、对话历史
3. QueryEngine 发起流式请求，解析工具调用指令
4. 工具分发器检查权限，调用 `ripgrep`（搜索）或 `Bash`（执行）
5. 将执行结果回传模型，如有递归调用则重入引擎
6. Ink 渲染最终 Markdown，同步更新费用追踪并提取记忆

---

## Prompt 体系：上下文装配工程

`getSystemPrompt()` 不是返回一个大字符串，而是按 section 组织后拼装：

- `SYSTEM_PROMPT_DYNAMIC_BOUNDARY`：明确切分静态前缀（走缓存）和动态部分（每轮装配）
- `fetchSystemPromptParts()`：并行准备 `defaultSystemPrompt`、`userContext`、`systemContext`
- 每个工具目录有独立 `prompt.ts`，写给 AI 看的行为准则（如 BashTool 的 Git Safety Protocol）
- 工具排序固定，保持 Prompt Cache 的字节级前缀稳定

> **缓存不是省钱手段，而是约束整个上下文组织方式的底层纪律。**

---

## QueryEngine + query.ts：胖核心设计

三个核心文件：
- `src/QueryEngine.ts`（约4.6万行）
- `src/utils/processUserInput/processUserInput.ts`
- `src/query.ts`

`QueryEngine.submitMessage()` 负责：管理流式 API 调用、工具分发循环、自动重试、上下文窗口压缩、Token 计数与思考模式。

`processUserInput()` 在发给模型前执行：处理 slash command / attachments / 图片 / IDE selection / 粘贴内容，然后执行 `executeUserPromptSubmitHooks()`。

`query.ts` 是 Agent Loop 核心，汇聚：消息准备、工具调用、结果回填、token budget、stop hooks、continue 状态、compact 判断。其"大"是刻意的——跨轮次状态管理不适合分散。

---

## 工具系统

内置约 40 个工具，Zod 强类型驱动。每个工具必须声明安全属性：

```typescript
isReadOnly          // 默认 false
isConcurrencySafe   // 默认 false（保守）
isDestructive
needsUserInteraction
checkPermissions
```

**设计哲学**：先声明边界，再暴露给模型。没写清楚安全属性 = 系统默认视为"可能写入、可能不安全并发"。

### FileEditTool 的约束

- 工具层硬约束：没读过文件就直接调编辑 → 系统报错拦截（`先读再改`不只是提醒）
- 路径规范化（防 `~`、相对路径绕过）、权限校验在修改前执行
- 旧字符串不唯一、超大文件、文件不存在等情况分开处理

---

## 权限系统：决策管道

`hasPermissionsToUseToolInner()` 执行顺序：

1. deny tool 检查
2. ask tool 检查
3. 工具自身 `checkPermissions`
4. 内容级 ask rule + safety check
5. 当前 mode（如 `bypassPermissions`）
6. always allow
7. `passthrough` 收敛为 ask

权限系统是**可持续治理、持续插入规则的管道**，而非弹窗确认。

---

## 长任务：三级压缩 + 状态续写

| 机制 | 触发条件 | 行为 |
|------|----------|------|
| microcompact | 按需 | 只清理旧工具调用结果，保留对话主线 |
| autocompact | Token 消耗达上下文窗口 87% | 自动触发摘要 |
| 完全压缩 | 手动或超限 | AI 生成完整摘要替换历史，**禁止调用工具** |

完全压缩阶段前置指令：`CRITICAL: Respond with TEXT ONLY. Do NOT call any tools.`

**历史压缩** 和 **当前状态续写** 是两个分开的问题。状态续写维护固定区块：`Current State`、`Task specification`、`Files and Functions`、`Errors & Corrections`、`Worklog`。

---

## 核心设计取向

> **不要太依赖模型自觉，能提前机制化的地方，尽量机制化。**

Claude Code 反复将易错点推入系统约束：先声明安全属性再暴露工具、先读再改的硬拦截、提示词缓存作为上下文组织的约束纪律、权限管道而非弹窗……靠的是工程纪律，不是某个神奇技巧。
