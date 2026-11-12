---
title: "TPS Bench：别用感觉判断模型速度"
description: "如何用 TTFT、解码 TPS 和端到端吞吐，把 LLM API 的快慢变成可重复比较的数据。"
date: 2026-11-10
category: 开发工具
tags: [LLM, Benchmark, CC Switch]
featured: true
---

“这个模型很快”通常不是结论，只是一种体感。模型是否第一次响应慢、吐字是否稳定、长上下文下会不会突然卡住，光看一次对话很难分清。

`tps-bench` 解决的就是这个问题：连续发起 5 轮流式请求，把一次响应拆成三个可以分别观察的指标。

## 三个指标分别代表什么

| 指标 | 关注点 | 什么时候最重要 |
| --- | --- | --- |
| TTFT | 从发请求到第一个 token | 交互式对话、代码补全 |
| Decode TPS | 首 token 之后平均每秒输出多少 token | 长回答、推理输出 |
| E2E TPS | 整段请求的总 token / 总耗时 | 批处理、任务吞吐 |

只看 E2E TPS 会把排队、网络和首字延迟混在一起；只看 TTFT 又可能忽略长输出的解码效率。因此三个数字必须同时看。

多轮测试后，页面会给出 p50、p95、最小值和最大值，也会记录成功率。p95 比平均值更接近真实使用中的“偶发慢一次”。

## 为什么做成 CC Switch 配套

CC Switch 已经保存了供应商、Base URL、模型目录和凭据。TPS Bench 不重复维护一套配置，而是以只读方式打开本机的 `cc-switch.db`，读取这些信息后再发起真实请求。

边界因此很清楚：

- 数据库只执行 `SELECT`；
- 凭据只在本地代理进程内使用；
- key 不返回浏览器、不写日志；
- 代理默认只监听 `127.0.0.1`；
- 历史记录只存在当前浏览器的 `localStorage`。

没有 CC Switch 时，也可以切换到 Anthropic 或 OpenAI 兼容协议，手动填写端点。

## 运行方式

项目没有 npm 运行时依赖：

```bash
git clone https://github.com/YHHD/tps-bench.git
cd tps-bench
npm start
```

打开 `http://127.0.0.1:8787/` 即可。测速会消耗真实的 API 配额，所以开始之前应该先明确轮数、输入长度和输出上限。

测量不会替你做供应商选择，但它至少能把选择从“凭感觉”变成“有数据，也知道数据测的是什么”。

项目地址：[YHHD/tps-bench](https://github.com/YHHD/tps-bench)
