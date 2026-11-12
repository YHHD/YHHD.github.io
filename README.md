# YHHD Notes

个人技术博客与知识库，使用 Astro 构建并发布到 GitHub Pages。

## 内容结构

```text
src/content/posts/   长文与工程札记
src/content/wiki/    长期维护的知识词条
src/content.config.ts 内容字段校验
src/pages/            页面与路由
src/styles/           Notion 风格视觉系统
DESIGN.md             视觉设计契约
docs/                 构建后的静态产物（GitHub Pages 发布目录）
```

文章和词条都使用 Markdown frontmatter：

```yaml
---
title: "标题"
description: "摘要"
date: 2026-11-12
category: "工程实践"
tags: [Astro, 设计系统]
featured: false
draft: false
---
```

## 本地开发

需要 Node.js 24.22.3+（版本记录在 `.nvmrc`）：

```bash
nvm use
npm install
npm run dev
```

默认地址为 <http://127.0.0.1:4321/>。

## 校验与构建

```bash
npm run check
npm run build
npm run preview
```

`npm run build` 会把静态站点输出到 `docs/`。该目录必须提交，GitHub Pages 使用 `main` 分支的 `/docs` 目录发布。

## 发布

```bash
git add -A
git commit -m "content: 更新文章"
git push origin main
```

GitHub Pages 发布源应为：

```text
Branch: main
Folder: /docs
```

`docs/.nojekyll` 已保留，避免 GitHub Pages 处理 `_astro/` 目录。

## 设计约定

页面 UI 以根目录 `DESIGN.md` 为视觉基线：暖灰纸面、近黑正文、单一蓝色主操作，彩色仅用于小面积装饰。该文件由以下命令生成并作为快照提交：

```bash
npx getdesign@latest add notion
```
