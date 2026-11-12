---
title: AI 工具：MCP 服务与知识管理
date: 2026-04-09
tags: [AI, MCP, 工具, 知识管理]
source: 内部整理
category: "AI 与 Agent"
description: "对比 Archon、Browser-Use、Obsidian 与 Notion 在 Agent 知识管理中的工作流和边界。"
---

> 重要的是每个项目的应用场景、工作流、局限性，以及与其他系统的差异性。

## MCP 服务

### Archon

**应用场景**
- 为 AI Coding Agent 提供知识库支持（RAG 检索）
- 项目、任务、文档的结构化管理
- 爬取文档网站并向量化存储，供 Claude Code 查询

**工作流**
1. 在 Archon UI（`http://localhost:3737`）配置 LLM Provider 和 API Key
2. 通过 UI 爬取目标文档站点
3. Claude Code 通过 MCP 工具 `rag_search_knowledge_base` 检索

**局限性**
- 需要 OpenAI 或兼容 API 才能生成 Embedding（OpenRouter 不支持 Embedding）
- 本地 Docker 服务，换电脑需重新启动
- 爬取内容质量依赖目标网站结构

**与其他系统的差异**
| 对比 | Archon | Obsidian | Notion |
|------|--------|----------|--------|
| 存储格式 | 向量数据库 | MD 文件 | 专有格式 |
| AI 集成 | 原生 MCP | 插件 | 有限 |
| 适合场景 | AI Agent 知识库 | 个人笔记 | 团队协作 |

---

### Browser-Use

**应用场景**
- 让 Claude Code 控制浏览器执行网页操作
- 自动化表单填写、数据抓取、页面交互

**工作流**
- 通过 `run_session` 启动任务，自然语言描述操作目标
- 云端执行，无需本地浏览器

**局限性**
- 按 API 调用计费
- 复杂交互成功率不稳定
- 不适合需要登录态的私有系统

---

## 知识管理工具对比

| 工具 | 存储格式 | 云端 | AI 集成 | 适合人群 |
|------|----------|------|---------|---------|
| 本 Wiki (VitePress) | MD + GitHub | ✅ | 手动 | 技术人员 |
| Obsidian | MD + 本地 | 需插件 | 插件 | 重度笔记用户 |
| Notion | 专有 | ✅ | 内置 | 团队协作 |
| Archon | 向量数据库 | 本地 | 原生 MCP | AI 工作流 |
