# OpenClaw Windows LAN Client

一个基于 Tauri (Rust + React/TypeScript) 的 OpenClaw Windows 客户端，用于通过局域网连接 OpenClaw Gateway。

## 功能特性

- 连接配置 - 配置 Gateway 的 IP:Port 和 API Token
- 对话界面 - 聊天 UI，Markdown 渲染、代码高亮
- 实时流式响应 - SSE/WebSocket 流式逐字显示
- 会话管理 - 新建/切换/查看历史会话
- 文件支持 - 发送/接收文件和图片
- 系统通知 - Windows 原生 Toast 通知
- 托盘常驻 - 最小化到系统托盘
- 自动重连 - 网络断开后自动恢复
- 设备配对 - 首次连接的配对引导流程

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **后端**: Rust + Tauri 2
- **样式**: CSS (无框架依赖)
- **Markdown**: react-markdown + react-syntax-highlighter

## 开发环境要求

- Node.js >= 18
- Rust >= 1.70
- Tauri CLI

## 安装依赖

```bash
# 安装前端依赖
npm install

# 安装 Tauri CLI (如果未安装)
cargo install tauri-cli
```

## 开发运行

```bash
# 启动开发服务器
npm run tauri dev
```

## 构建生产版本

```bash
# 构建 Windows 安装包
npm run tauri build
```

## 项目结构

```
openclaw-client/
├── src-tauri/           # Rust 后端
│   ├── src/
│   │   ├── main.rs      # 入口点
│   │   └── lib.rs       # 主要逻辑
│   ├── Cargo.toml       # Rust 依赖配置
│   └── tauri.conf.json  # Tauri 配置
├── src/                 # React 前端
│   ├── components/      # React 组件
│   ├── types/           # TypeScript 类型定义
│   ├── styles/          # CSS 样式
│   └── App.tsx          # 主应用组件
├── package.json         # 前端依赖配置
└── README.md
```

## 配置说明

### 连接配置

- **服务器地址**: OpenClaw Gateway 的 IP 地址
- **端口**: 默认 18789
- **API Token**: 用于认证的 Token 或密码

### API 端点

- `POST /v1/chat/completions` - Chat Completions 格式
- `POST /v1/responses` - OpenResponses 格式（支持 SSE 流式）
- `GET /v1/models` - 模型列表

## 许可证

MIT License
