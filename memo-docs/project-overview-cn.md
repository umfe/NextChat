# NextChat 项目总览

本文档用于快速理解 NextChat 代码仓库的整体用途、技术栈、核心模块和运行方式。更细的目录说明、开发、部署、调试和测试说明请参考同目录下的其他文档。

## 1. 项目定位

NextChat 是一个基于 Next.js 的轻量 AI 助手应用，支持 Web、PWA、Docker 部署和 Tauri 桌面端打包。项目核心目标是提供一个可私有化部署、可配置多模型供应商、支持本地会话存储和扩展能力的聊天客户端。

主要能力包括：

- 多模型供应商：OpenAI、Azure OpenAI、Google Gemini、Anthropic Claude、DeepSeek、Moonshot、通义千问、腾讯混元、文心一言、讯飞星火、xAI、智谱、SiliconFlow、302.AI 等。
- 流式聊天：通过客户端平台适配层和服务端代理路由完成不同供应商的流式响应处理。
- 本地优先：聊天记录、配置、面具、插件等状态主要持久化在浏览器本地存储或 IndexedDB 中。
- Prompt / Mask：内置提示词与面具模板，支持构建和导入。
- 插件与 MCP：支持插件市场和 MCP 功能，MCP 需要通过环境变量启用。
- Artifacts：支持将生成内容以独立窗口或预览区展示、复制与分享。
- Stable Diffusion / 图像生成：通过 Stability 或模型接口支持图像能力。
- TTS / 实时语音：包含文本转语音、实时聊天和语音相关配置。
- 多语言：`app/locales` 下维护多语言文案。
- 桌面端：`src-tauri` 提供 Tauri 桌面应用配置与 Rust 壳。

## 2. 技术栈

| 层级          | 技术                                                                             |
| ------------- | -------------------------------------------------------------------------------- |
| 前端框架      | Next.js 14、React 18、TypeScript                                                 |
| 样式          | Sass / SCSS Modules                                                              |
| 状态管理      | Zustand + 自定义持久化工具                                                       |
| Markdown 渲染 | react-markdown、remark-gfm、remark-math、rehype-katex、rehype-highlight、mermaid |
| API 请求      | fetch、axios、fetch-event-source、各平台适配器                                   |
| 测试          | Jest、Testing Library、jsdom                                                     |
| 桌面端        | Tauri                                                                            |
| 容器化        | Docker、docker-compose                                                           |
| 包管理        | Yarn 1.x                                                                         |

## 3. 顶层运行入口

- `app/layout.tsx`：Next.js App Router 根布局，注入全局样式、元信息和基础页面结构。
- `app/page.tsx`：首页入口，渲染 `Home` 组件，并在 Vercel 环境中启用 Analytics。
- `app/components/home.tsx`：主界面容器，组合侧边栏、聊天页、设置页、插件页、面具页等界面。
- `app/constant.ts`：全局常量、路径、供应商枚举、默认端点、存储键、模型常量等。
- `app/config/server.ts`：服务端环境变量读取和服务端配置生成。
- `app/config/client.ts`：客户端运行环境配置。

## 4. 数据流概览

典型聊天请求流程：

1. 用户在聊天输入框输入内容。
2. `app/components/chat.tsx` 读取当前会话、模型配置和用户输入。
3. `app/store/chat.ts` 管理会话消息、上下文压缩、标题生成、发送状态等。
4. `app/client/controller.ts` 根据模型供应商选择具体平台客户端。
5. `app/client/platforms/*.ts` 将统一的聊天参数转换为供应商 API 请求。
6. 如果需要服务端代理，调用 `app/api/[provider]/[...path]/route.ts` 或具体供应商 API 路由。
7. `app/api/*.ts` 读取 `app/config/server.ts` 中的密钥、Base URL 和供应商配置，请求真实模型服务。
8. 流式响应回到客户端，逐步更新 Zustand Store。
9. 会话和配置通过 `app/utils/store.ts`、`app/utils/indexedDB-storage.ts` 等工具持久化到本地。

## 5. 核心目录快速索引

| 路径              | 作用                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| `app/`            | Next.js 主应用，包含页面、组件、API、客户端适配、状态、样式、工具等。 |
| `app/api/`        | 服务端 API 路由和模型供应商代理。                                     |
| `app/client/`     | 浏览器侧模型客户端抽象和供应商请求适配。                              |
| `app/components/` | React UI 组件和对应 SCSS Module。                                     |
| `app/store/`      | Zustand 状态管理，包括聊天、配置、鉴权、面具、插件、同步、SD 等。     |
| `app/config/`     | 服务端、客户端和构建配置。                                            |
| `app/masks/`      | 内置面具数据和构建脚本。                                              |
| `app/mcp/`        | MCP 功能的类型、客户端、操作和配置模板。                              |
| `app/locales/`    | 多语言文案。                                                          |
| `app/utils/`      | 存储、流处理、模型判断、云同步、鉴权事件、音频、格式化等工具。        |
| `public/`         | 静态资源、PWA 文件、Service Worker、内置 prompts/plugins JSON。       |
| `src-tauri/`      | Tauri 桌面端工程配置。                                                |
| `scripts/`        | 辅助脚本，例如拉取 prompts、代理初始化、部署预览删除。                |
| `test/`           | Jest 测试用例。                                                       |
| `docs/`           | 项目文档、部署文档、FAQ、图片和本次新增说明文档。                     |

## 6. 构建模式

`next.config.mjs` 通过 `BUILD_MODE` 控制输出模式：

- `standalone`：默认模式，用于 Node.js 服务端运行和 Docker 镜像。
- `export`：静态导出模式，用于 Tauri 桌面端和静态托管场景。

当 `BUILD_MODE=export` 或设置 `DISABLE_CHUNK` 时，会通过 webpack 限制 chunk 数量，便于静态或桌面端加载。

## 7. 推荐阅读顺序

1. `docs/project-overview-cn.md`：先了解项目全貌。
2. `docs/directory-guide-cn.md`：逐个目录理解代码组织。
3. `docs/architecture-cn.md`：理解前后端数据流和模块协作。
4. `docs/local-development-cn.md`：本地启动和常见开发流程。
5. `docs/env-vars-cn.md`：配置模型密钥、访问码和功能开关。
6. `docs/debugging-cn.md`：定位聊天、接口、构建、Docker 和 Tauri 问题。
7. `docs/deployment-cn.md`：选择 Vercel、Docker、静态导出或桌面端部署。
8. `docs/testing-cn.md`：运行和补充测试。
