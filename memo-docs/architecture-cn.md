# 架构说明

本文档说明 NextChat 的主要架构、模块边界、运行时数据流和新增功能时的改动路径。

## 1. 总体架构

NextChat 可以分为五层：

1. **UI 层**：`app/components`，负责页面、交互、表单和消息展示。
2. **状态层**：`app/store`，负责会话、配置、面具、插件、同步、授权等状态。
3. **客户端模型层**：`app/client`，把统一聊天请求转换成不同供应商请求。
4. **服务端 API 层**：`app/api`，处理代理、鉴权、签名、服务端环境变量和云同步。
5. **平台 / 部署层**：Next.js、Docker、Vercel、Tauri、PWA。

简化结构：

```text
用户界面 app/components
        ↓
状态管理 app/store
        ↓
客户端适配 app/client
        ↓
Next.js API app/api 或供应商直连
        ↓
OpenAI / Azure / Google / Anthropic / DeepSeek / 其他模型供应商
```

## 2. 前端页面组织

NextChat 使用 Next.js App Router，但主要是一个单页式聊天应用：

- `app/page.tsx` 是页面入口。
- `app/components/home.tsx` 是主容器，负责根据内部路径或状态渲染聊天、设置、面具、插件、SD、Artifacts 等页面。
- `app/constant.ts` 中的 `Path` 枚举定义应用内部页面路径。

由于应用有 PWA 和桌面端需求，很多页面逻辑偏客户端侧，状态也更多存储在浏览器本地。

## 3. 聊天请求数据流

### 3.1 用户发送消息

核心参与模块：

- `app/components/chat.tsx`
- `app/store/chat.ts`
- `app/store/config.ts`
- `app/store/access.ts`
- `app/client/controller.ts`
- `app/client/platforms/*.ts`
- `app/api/*`

流程：

1. 用户在 `chat.tsx` 输入消息并提交。
2. 组件读取当前会话和模型配置。
3. `chat.ts` 将用户消息写入当前会话，并设置发送中的状态。
4. 聊天 Store 根据配置决定是否附带历史消息、系统提示词、记忆压缩内容等。
5. `controller.ts` 根据 `providerName` 创建供应商客户端。
6. 平台客户端生成请求。
7. 请求可能有两种路径：
   - 直接请求供应商 API；
   - 请求 Next.js API，由服务端代理到供应商。
8. 流式响应回到客户端后，逐步追加到助手消息。
9. 发送结束后状态持久化到本地。

### 3.2 服务端代理的作用

服务端代理主要解决：

- 隐藏服务端 API Key；
- 统一供应商 API 差异；
- 处理 CORS；
- 处理供应商特殊签名；
- 支持 Docker / Vercel 环境变量配置；
- 转发 WebDAV / Upstash 等同步请求。

`next.config.mjs` 还定义了一些 rewrite，例如：

- `/api/proxy/openai/:path*` → `https://api.openai.com/:path*`
- `/api/proxy/google/:path*` → `https://generativelanguage.googleapis.com/:path*`
- `/api/proxy/anthropic/:path*` → `https://api.anthropic.com/:path*`
- `/api/proxy/azure/:resource_name/deployments/:deploy_name/:path*` → Azure OpenAI 地址

这些 rewrite 只在非 `export` 模式启用。

## 4. 配置系统

### 4.1 服务端配置

`app/config/server.ts` 从 `process.env` 中读取：

- 模型供应商密钥；
- Base URL；
- 功能开关；
- 访问码；
- 云同步配置；
- Vercel / 构建模式信息。

该文件是 Node.js 服务端专用模块，不应被纯客户端组件直接引入。

### 4.2 客户端配置

`app/config/client.ts` 提供浏览器侧可读取的配置，例如：

- 是否为桌面 App；
- 默认输入模板；
- 构建期注入的安全配置。

### 4.3 用户配置

`app/store/config.ts` 管理用户在设置页中修改的配置：

- 主题；
- 字体；
- 提交快捷键；
- 默认模型；
- temperature、top_p、max_tokens 等模型参数；
- TTS 配置；
- 实时聊天配置；
- Artifacts、代码折叠等 UI 开关。

## 5. 状态持久化

项目使用 Zustand 管理状态，通过 `app/utils/store.ts` 封装持久化逻辑。

典型 Store：

- `StoreKey.Chat`：聊天会话；
- `StoreKey.Config`：应用设置；
- `StoreKey.Access`：访问、API Key；
- `StoreKey.Mask`：面具；
- `StoreKey.Prompt`：Prompt；
- `StoreKey.Plugin`：插件；
- `StoreKey.Sync`：同步配置；
- `StoreKey.SdList`：图像生成列表；
- `StoreKey.Mcp`：MCP 状态。

这也是“隐私优先”的基础：默认情况下，用户数据主要保存在本地浏览器环境中。

## 6. 模型供应商适配

供应商适配分为三部分：

1. **常量与模型列表**：`app/constant.ts`、模型定义相关文件。
2. **客户端请求适配**：`app/client/platforms/*.ts`。
3. **服务端代理 / 签名**：`app/api/*.ts`、`app/api/[provider]/[...path]/route.ts`。

不同供应商差异可能包括：

- 请求 URL；
- Header 名称；
- 鉴权方式；
- 是否支持流式响应；
- 请求体格式；
- 响应体格式；
- 多模态图片格式；
- 工具调用或函数调用格式；
- 错误结构。

因此新增供应商时，不应只改一处，需要从配置、UI、客户端、服务端和测试完整接入。

## 7. Markdown 与渲染能力

`app/components/markdown.tsx` 是消息内容展示的重要组件，支持：

- GitHub Flavored Markdown；
- 数学公式；
- 代码高亮；
- Mermaid 图表；
- 换行处理；
- 安全渲染和样式控制。

如果修改消息展示、代码块复制、Mermaid 预览、LaTeX 样式，应优先检查该组件。

## 8. Mask / Prompt 系统

面具是预设对话模板，通常包含：

- 名称；
- 头像；
- 上下文消息；
- 模型配置；
- 描述或标签。

相关目录：

- `app/masks/`：内置面具源数据和构建脚本；
- `app/store/mask.ts`：用户面具状态；
- `app/components/mask.tsx`：面具 UI；
- `public/prompts.json`：静态 Prompt 数据。

开发时需要运行 `yarn mask` 或通过 `yarn dev` 自动 watch。

## 9. 插件与 MCP

插件能力与 MCP 能力相对独立：

- 插件数据可来自 `public/plugins.json` 或远程插件市场。
- MCP 代码在 `app/mcp/`，默认配置为 `app/mcp/mcp_config.default.json`。
- Docker 镜像启动时会将默认 MCP 配置复制为运行时配置。
- 启用 MCP 需要设置 `ENABLE_MCP=true`。

排查 MCP 问题时，需要同时检查：

- 环境变量；
- Docker 容器中的 `/app/app/mcp/mcp_config.json`；
- 浏览器控制台；
- 服务端日志；
- `app/mcp/logger.ts` 相关输出。

## 10. 同步系统

同步能力包含 WebDAV、Upstash 等方式。

相关模块：

- `app/store/sync.ts`：同步配置和状态；
- `app/utils/cloud/webdav.ts`：WebDAV 工具；
- `app/utils/cloud/upstash.ts`：Upstash 工具；
- `app/api/webdav/[...path]/route.ts`：WebDAV 服务端代理；
- `app/api/upstash/[action]/[...key]/route.ts`：Upstash 服务端接口。

## 11. Web、Docker、Tauri 的差异

| 场景               | 构建方式                    | 说明                                     |
| ------------------ | --------------------------- | ---------------------------------------- |
| 本地 Web 开发      | `yarn dev`                  | Next.js dev server + mask watch。        |
| Node.js 服务端部署 | `yarn build` + `yarn start` | `BUILD_MODE=standalone`。                |
| Docker             | `Dockerfile`                | 多阶段构建，最终运行 standalone server。 |
| 静态导出           | `yarn export`               | `BUILD_MODE=export BUILD_APP=1`。        |
| Tauri 开发         | `yarn app:dev`              | Tauri 启动前运行静态导出开发流程。       |
| Tauri 打包         | `yarn app:build`            | 生成桌面端安装包。                       |

## 12. 新增功能推荐改动顺序

开发新功能时建议按以下顺序：

1. 明确数据是否需要持久化：如需要，先设计 `app/store/*`。
2. 明确是否需要后端接口：如需要，新增 `app/api/*`。
3. 明确是否需要环境变量：如需要，更新 `app/config/server.ts` 和文档。
4. 开发 UI：新增或修改 `app/components/*`。
5. 补充多语言：更新 `app/locales/*`。
6. 补充工具函数：放到 `app/utils/*`。
7. 补充测试：放到 `test/*`。
8. 检查构建模式：确认 `standalone`、`export`、Tauri 场景不会被破坏。
