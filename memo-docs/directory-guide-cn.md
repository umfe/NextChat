# 目录与文件说明

本文档按目录介绍 NextChat 仓库中各部分的职责，帮助新开发者快速定位代码。

## 根目录

| 文件 / 目录                     | 说明                                                                  |
| ------------------------------- | --------------------------------------------------------------------- |
| `package.json`                  | 项目脚本、依赖和包管理器声明。使用 Yarn 1.x。                         |
| `yarn.lock`                     | Yarn 依赖锁文件，保证依赖版本一致。                                   |
| `next.config.mjs`               | Next.js 配置，包含 SVG loader、构建输出模式、CORS 头和 API rewrites。 |
| `tsconfig.json`                 | TypeScript 配置，定义路径别名和编译选项。                             |
| `jest.config.ts`                | Jest 测试配置，通过 `next/jest` 加载 Next.js 环境。                   |
| `jest.setup.ts`                 | Jest 测试启动前的全局配置。                                           |
| `Dockerfile`                    | 多阶段 Docker 构建，用于 standalone 服务端镜像。                      |
| `docker-compose.yml`            | Docker Compose 运行模板，包含普通模式和代理模式。                     |
| `vercel.json`                   | Vercel 部署相关配置。                                                 |
| `README*.md`                    | 多语言项目介绍文档。                                                  |
| `CODE_OF_CONDUCT.md`、`LICENSE` | 开源社区规范与许可证。                                                |

## `app/` 主应用目录

`app/` 是 Next.js App Router 应用主体。它既包含页面与组件，也包含 API 路由、状态管理、模型客户端、工具函数和样式。

### `app/page.tsx`

首页页面。它渲染 `Home` 组件，并根据服务端配置决定是否启用 Vercel Analytics。

### `app/layout.tsx`

应用根布局。通常负责：

- 加载全局样式；
- 设置页面元信息；
- 包裹所有页面内容；
- 注入全局 HTML 结构。

### `app/constant.ts`

全局常量集中定义文件，包含：

- GitHub 仓库地址；
- 各模型供应商默认 Base URL；
- 页面路由枚举 `Path`；
- API 路径枚举 `ApiPath`；
- 本地存储键 `StoreKey`；
- 模型供应商 `ServiceProvider` / `ModelProvider`；
- 请求超时、侧边栏宽度、上传路径等常量；
- 各供应商 API path 构造逻辑。

修改供应商、默认路径或全局配置时，经常需要先看这里。

### `app/typing.ts`、`app/global.d.ts`

项目级 TypeScript 类型定义，包括聊天消息、模型参数、文件、图像、TTS、DALL·E / SD 等领域类型。

### `app/polyfill.ts`

浏览器或运行时兼容补丁。

### `app/command.ts`

命令相关逻辑，通常服务于快捷命令、命令面板或聊天输入命令。

## `app/api/` 服务端接口

该目录包含 Next.js Route Handler 和供应商代理逻辑。

| 路径                                         | 说明                                                                              |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| `app/api/[provider]/[...path]/route.ts`      | 通用动态供应商代理入口，根据 provider 和 path 转发请求。                          |
| `app/api/config/route.ts`                    | 暴露客户端需要的安全配置，例如模型可用性、功能开关等。                            |
| `app/api/artifacts/route.ts`                 | Artifacts 相关接口。                                                              |
| `app/api/webdav/[...path]/route.ts`          | WebDAV 同步代理。                                                                 |
| `app/api/upstash/[action]/[...key]/route.ts` | Upstash 云同步相关接口。                                                          |
| `app/api/tencent/route.ts`                   | 腾讯混元供应商特殊签名或请求逻辑。                                                |
| `app/api/*.ts`                               | 各模型供应商的 API 适配工具，例如 OpenAI、Google、Anthropic、Azure、DeepSeek 等。 |
| `app/api/common.ts`                          | API 层通用工具，如响应处理、请求构造、错误处理等。                                |
| `app/api/proxy.ts`                           | 代理请求相关逻辑。                                                                |
| `app/api/auth.ts`                            | 访问码和授权校验逻辑。                                                            |

## `app/client/` 客户端模型适配层

| 路径                        | 说明                                           |
| --------------------------- | ---------------------------------------------- |
| `app/client/api.ts`         | 定义统一的模型客户端接口、请求参数和响应结构。 |
| `app/client/controller.ts`  | 根据当前模型供应商选择具体平台客户端。         |
| `app/client/platforms/*.ts` | 每个供应商的浏览器侧请求适配器。               |

当新增模型供应商时，通常需要修改：

1. `app/constant.ts` 增加供应商枚举和路径；
2. `app/client/platforms/` 增加客户端适配；
3. `app/client/controller.ts` 注册适配器；
4. `app/api/` 增加服务端代理或特殊签名逻辑；
5. `app/config/server.ts` 增加环境变量读取；
6. 相关模型列表、设置页和测试。

## `app/components/` 组件层

组件采用 `.tsx` + `.module.scss` 的组织方式。

| 组件               | 说明                                                     |
| ------------------ | -------------------------------------------------------- |
| `home.tsx`         | 应用主容器，组织不同页面和路由状态。                     |
| `sidebar.tsx`      | 左侧侧边栏，展示会话列表、导航和入口。                   |
| `chat.tsx`         | 聊天主界面，负责消息展示、输入、发送、停止、重试等交互。 |
| `chat-list.tsx`    | 会话列表组件。                                           |
| `new-chat.tsx`     | 新建聊天入口和模板选择。                                 |
| `mask.tsx`         | 面具 / Prompt 模板页面。                                 |
| `settings.tsx`     | 设置页面，包括模型、主题、同步、访问等配置。             |
| `model-config.tsx` | 单个会话或全局模型参数配置。                             |
| `markdown.tsx`     | Markdown、代码高亮、LaTeX、Mermaid 等渲染。              |
| `exporter.tsx`     | 导出聊天内容或分享相关 UI。                              |
| `plugin.tsx`       | 插件配置和插件能力展示。                                 |
| `mcp-market.tsx`   | MCP 市场界面。                                           |
| `artifacts.tsx`    | Artifacts 预览和交互。                                   |
| `sd/`              | Stable Diffusion / 图像生成相关组件。                    |
| `realtime-chat/`   | 实时聊天配置和聊天 UI。                                  |
| `voice-print/`     | 声纹或语音相关 UI。                                      |
| `ui-lib.tsx`       | 通用 UI 基础组件。                                       |

## `app/store/` 状态管理

该目录使用 Zustand 管理前端状态，并通过自定义持久化工具保存到浏览器。

| 文件        | 说明                                                       |
| ----------- | ---------------------------------------------------------- |
| `chat.ts`   | 会话、消息、发送状态、上下文压缩、标题生成等核心聊天状态。 |
| `config.ts` | 全局设置、默认模型、主题、TTS、实时聊天配置等。            |
| `access.ts` | API Key、访问码、授权相关状态。                            |
| `mask.ts`   | 面具模板状态。                                             |
| `prompt.ts` | 自定义 Prompt 状态。                                       |
| `plugin.ts` | 插件配置和插件列表。                                       |
| `sync.ts`   | WebDAV、Upstash 等同步配置。                               |
| `sd.ts`     | 图像生成相关状态。                                         |
| `update.ts` | 应用更新检查状态。                                         |
| `index.ts`  | Store 统一导出。                                           |

## `app/config/` 配置层

| 文件        | 说明                                                                                 |
| ----------- | ------------------------------------------------------------------------------------ |
| `server.ts` | 服务端读取环境变量，生成供应商密钥、Base URL、功能开关等配置。不要在客户端直接引入。 |
| `client.ts` | 客户端可用配置，例如是否是桌面 App、默认模板等。                                     |
| `build.ts`  | 构建期配置。                                                                         |

## `app/masks/` 面具模板

| 文件                      | 说明                                         |
| ------------------------- | -------------------------------------------- |
| `cn.ts`、`tw.ts`、`en.ts` | 内置中文、繁中、英文面具数据。               |
| `typing.ts`               | 面具数据类型。                               |
| `index.ts`                | 面具统一导出。                               |
| `build.ts`                | 将面具构建为运行时可读取的 JSON 或静态资源。 |

`package.json` 中的 `mask` 和 `mask:watch` 脚本会调用这里。

## `app/mcp/` MCP 功能

MCP 相关能力默认需要通过环境变量 `ENABLE_MCP=true` 启用。

| 文件                      | 说明               |
| ------------------------- | ------------------ |
| `mcp_config.default.json` | MCP 默认配置模板。 |
| `client.ts`               | MCP 客户端逻辑。   |
| `actions.ts`              | MCP 操作封装。     |
| `types.ts`                | MCP 类型定义。     |
| `utils.ts`                | MCP 工具函数。     |
| `logger.ts`               | MCP 日志。         |

## `app/locales/`

多语言文案目录。新增页面或文案时应同步维护多个语言文件，避免界面显示缺失 key。

## `app/styles/`、`app/icons/`

- `styles/`：全局样式、主题变量、动画或基础布局样式。
- `icons/`：SVG 或 React 图标资源。项目通过 `@svgr/webpack` 支持将 SVG 作为组件引入。

## `app/utils/`

通用工具目录：

| 文件 / 子目录                       | 说明                                   |
| ----------------------------------- | -------------------------------------- |
| `store.ts`                          | Zustand 持久化封装。                   |
| `indexedDB-storage.ts`              | IndexedDB 存储适配。                   |
| `stream.ts`                         | 流式响应解析与处理。                   |
| `model.ts`                          | 模型名称、供应商、视觉模型等判断工具。 |
| `chat.ts`                           | 聊天相关工具。                         |
| `sync.ts`                           | 同步相关工具。                         |
| `cloud/`                            | WebDAV、Upstash 等云同步工具。         |
| `auth-settings-events.ts`           | 授权和设置事件同步。                   |
| `audio.ts`、`ms_edge_tts.ts`        | 音频与 TTS 工具。                      |
| `format.ts`                         | 格式化工具。                           |
| `hmac.ts`、`tencent.ts`、`baidu.ts` | 签名或供应商辅助工具。                 |
| `hooks.ts`                          | React Hooks 工具。                     |

## `public/`

静态资源目录，构建后会原样发布。

| 文件                                                       | 说明                     |
| ---------------------------------------------------------- | ------------------------ |
| `prompts.json`                                             | 内置 prompts 数据。      |
| `plugins.json`                                             | 插件市场或内置插件数据。 |
| `serviceWorker.js`、`serviceWorkerRegister.js`             | PWA / 离线相关脚本。     |
| `audio-processor.js`                                       | 浏览器音频处理脚本。     |
| `site.webmanifest`                                         | PWA manifest。           |
| `favicon*`、`apple-touch-icon.png`、`android-chrome-*.png` | 图标资源。               |
| `robots.txt`                                               | 搜索引擎抓取配置。       |

## `src-tauri/`

Tauri 桌面端工程。

| 文件 / 目录                | 说明                                             |
| -------------------------- | ------------------------------------------------ |
| `tauri.conf.json`          | Tauri 应用窗口、权限、打包、更新、构建命令配置。 |
| `Cargo.toml`、`Cargo.lock` | Rust 依赖和锁文件。                              |
| `build.rs`                 | Tauri 构建脚本。                                 |
| `src/`                     | Rust 侧入口代码。                                |
| `icons/`                   | 桌面端应用图标。                                 |

Tauri 开发会执行 `yarn export:dev`，桌面端打包会执行 `yarn export`。

## `scripts/`

| 脚本                           | 说明                            |
| ------------------------------ | ------------------------------- |
| `fetch-prompts.mjs`            | 拉取或更新 prompts 数据。       |
| `init-proxy.sh`                | 根据模板生成 proxychains 配置。 |
| `proxychains.template.conf`    | 代理配置模板。                  |
| `setup.sh`                     | 环境初始化脚本。                |
| `delete-deployment-preview.sh` | 删除部署预览相关脚本。          |

## `test/`

Jest 测试目录：

- `model-available.test.ts`：模型可用性相关测试。
- `model-provider.test.ts`：模型与供应商映射测试。
- `vision-model-checker.test.ts`：视觉模型判断测试。
- `sum-module.test.ts`：基础示例测试。

## `docs/`

文档目录。既包含官方已有的部署、FAQ、用户手册，也包含本次新增的中文开发说明文档。
