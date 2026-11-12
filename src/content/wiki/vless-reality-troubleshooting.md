---
title: VLESS + REALITY 节点故障排查
date: 2026-04-19
tags: [VPN, x-ui, VLESS, REALITY, 排障]
source: raw/a.md
category: "技术手册"
description: "从 x-ui 面板与 xray 日志定位 REALITY 配置错误的排障记录。"
---

> 记录一次 x-ui 面板中 VLESS + REALITY 节点失效的完整排查过程。**根因：`target` 字段配置错误，导致 xray-core 启动失败。**

---

## 故障现象

| 层级 | 表现 |
|------|------|
| 客户端（V2rayU） | Ping 节点报错，显示 `-1 ms`，`NSURLErrorDomain Code=-1011` |
| 面板（x-ui / 3x-ui） | 面板服务正常运行，但 xray 显示 `not running` |
| 系统日志 | `failed to build REALITY config. please fill in a valid value for "target"` |

---

## 诊断链路

```
客户端 ping 失败
    ↓
服务端：x-ui 面板在线，但 xray-core 未运行
    ↓
systemctl status x-ui -l --no-pager
    ↓
找到关键报错：inbound-XXXX 的 REALITY target 字段无效
    ↓
修改 target 为合法地址
    ↓
重启 xray → 恢复正常
```

**关键命令：**
```bash
systemctl status x-ui -l --no-pager
# 或
journalctl -u x-ui -n 50 --no-pager
```

---

## 根因说明

xray 启动时会加载所有入站（inbound）配置。REALITY 对字段要求严格——只要 `target` 非法，整个 xray-core 加载失败，所有节点均不可用。

---

## REALITY 配置易错字段

| 字段 | 正确格式 | 常见错误 |
|------|---------|---------|
| `target` / `dest` | `www.example.com:443`（含端口，域名需可访问） | 缺 `www` 子域名；域名不可访问；缺端口 |
| `serverNames` | 与 target 域名一致 | 填了裸域名但 target 是 `www.` 前缀 |
| `publicKey` | 与私钥配对生成 | 手动修改导致不匹配 |
| `shortIds` | 任意合法 hex 字符串 | 留空或格式错误 |
| `flow` | `xtls-rprx-vision`（推荐）或留空 | 客户端服务端不一致 |

---

## 经验总结

1. **面板 running ≠ xray running**：x-ui 面板服务正常不代表 xray-core 在跑，需分开检查。
2. **客户端 `-1ms` 只是结果**：根因在服务端，先看系统日志再改客户端配置。
3. **一处配置错误拖垮全部节点**：REALITY 配置问题会导致 xray 整体启动失败，影响同面板的所有节点。
4. **target 不能随便填**：必须是真实可访问的 HTTPS 站点，格式 `host:port`，port 通常为 443。
