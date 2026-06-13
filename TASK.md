# 修复 OpenClaw Windows 客户端

## 背景
当前客户端无法正常使用，需要修复以下问题。

## 要修复的问题（按优先级）

### P0 — 必须先修（否则完全不能用）
1. **端口默认值**：`src/components/ConnectionSettings.tsx` 中默认端口从 `18789` 改为 `18188`
2. **动态模型列表**：`src/components/ChatInterface.tsx` 中模型选择器硬编码了 GPT-3.5/4/4-turbo，需要：
   - 连接成功后调用 `GET /v1/models` 获取模型列表
   - 动态填充下拉框
   - 如果 API 失败，保留一个默认选项

### P1 — 重要功能补全
3. **会话管理**：
   - 左侧栏显示会话列表
   - 新建会话 / 切换会话 / 删除会话
   - 每个会话独立保存消息历史（本地存储即可）
4. **消息格式优化**：
   - Markdown 渲染（用 react-markdown）
   - 代码块语法高亮
   - 消息时间戳显示
5. **连接状态指示**：顶部显示连接状态（已连接/断开/重连中）

### P2 — 体验优化
6. **自动重连**：断线后自动尝试重连，间隔递增（1s/2s/4s/8s...最大30s）
7. **系统托盘**：最小化到托盘，托盘右键菜单（显示/退出）
8. **Windows 通知**：新消息时系统通知（Tauri notification API）
9. **配置持久化**：连接配置保存到本地，下次启动自动填充

## 技术约束
- 前端：React 18 + TypeScript + Vite
- 后端：Rust + Tauri 2
- 样式：纯 CSS（不引入 UI 框架）
- Gateway HTTP API 已开启（`/v1/chat/completions` + `/v1/models`）
- Gateway 地址：`http://<host>:18188`，认证：`Bearer <token>`

## 注意事项
- **不要改动 `src-tauri/` 下的 Rust 代码**（HTTP 通信部分已能正常工作）
- 修改后确保 `npm run tauri build` 能通过
- 每完成一个功能，说明改了哪些文件
