# OpenClaw Windows LAN Client

## 背景
OpenClaw 是一个运行在 Linux 服务器上的 AI 助手平台，目前通过 webchat（浏览器）访问。
需要一个 Windows 原生客户端，通过局域网连接 OpenClaw Gateway。

## 技术选型
优先 Tauri (Rust + WebView2)，轻量、安装包小。
备选 Electron (Node.js + Chromium)。

## OpenClaw Gateway API 说明

### 连接方式
OpenClaw Gateway 在同一端口上同时提供 HTTP 和 WebSocket 服务。
默认端口：18789

### WebSocket（Control UI 方式）
Control UI 是一个 Vite + Lit SPA，通过 Gateway WebSocket 通信。
连接地址：ws://<host>:18789/
认证方式：
- connect.params.auth.token（共享密钥）
- connect.params.auth.password（密码）
- 首次连接需要设备配对（device pairing）

### HTTP API（OpenAI 兼容）
需要在配置中启用。端点：
- POST /v1/chat/completions — Chat Completions 格式
- POST /v1/responses — OpenResponses 格式（支持 SSE 流式）
- GET /v1/models — 模型列表
认证：Authorization: Bearer <token-or-password>
流式：设置 stream:true，返回 SSE 事件流

### 设备配对流程
1. 客户端连接 WebSocket，发送 hello + token
2. 如果未配对，Gateway 返回 error (NOT_PAIRED)
3. 客户端发送 pair-request
4. 用户在 Gateway 端批准：openclaw devices approve <requestId>
5. Gateway 返回 pair-ok + hello-ok

## 核心功能
1. 连接管理 - 配置 Gateway 的 IP:Port 和 API Token
2. 对话界面 - 聊天 UI，Markdown 渲染、代码高亮
3. 实时流式响应 - SSE/WebSocket 流式逐字显示
4. 会话管理 - 新建/切换/查看历史会话
5. 文件支持 - 发送/接收文件和图片
6. 系统通知 - Windows 原生 Toast 通知
7. 托盘常驻 - 最小化到系统托盘
8. 自动重连 - 网络断开后自动恢复
9. 设备配对 - 首次连接的配对引导流程

## 参考资源
- OpenClaw GitHub: https://github.com/openclaw/openclaw
- 文档: https://docs.openclaw.ai
- 现有 Control UI 源码在 OpenClaw 包内

## 要求
- 界面中文友好
- 安装包小于 30MB
- 支持 Windows 10/11
- 开源 MIT 协议
