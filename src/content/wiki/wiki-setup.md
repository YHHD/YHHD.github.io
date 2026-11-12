---
title: 个人 Wiki 搭建
date: 2026-04
tags: [Wiki, VitePress, GitHub Pages]
source: 内部整理
category: "项目与方案"
description: "从 VitePress 到 Astro：个人 Wiki 的搭建与演进记录。"
---

## 技术栈

- **存储**：GitHub 私有仓库（`YHHD/my-wiki`）
- **编辑器**：VS Code + Markdown All in One
- **框架**：VitePress 1.3.4
- **发布**：GitHub Pages（自动部署）

## 目录结构（PARA）

```
wiki/
├── projects/   # 进行中的项目
├── areas/      # 长期关注的领域
├── resources/  # 参考资料
└── archive/    # 归档内容
```

## 工作流

```bash
# 本地写笔记
code ~/Desktop/A/my-wiki

# 推送即自动发布
git add . && git commit -m "docs: 更新笔记" && git push
```

## 踩过的坑

- `package.json` 通过 API 写入时换行符被双重转义，导致 JSON 解析失败
- `resources/index.md` 里的 `localhost` 链接被 VitePress 当死链，需在 config 加 `ignoreDeadLinks: true`
- GitHub Actions 需手动在 Settings → Pages 里将 Source 改为 GitHub Actions
