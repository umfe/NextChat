# 本地开发指南

本文档说明如何在本地运行、开发和构建 NextChat。

## 1. 前置要求

建议环境：

- Node.js 18 或更高版本；
- Yarn 1.x，本项目声明为 `yarn@1.22.19`；
- Git；
- 如需桌面端开发：Rust、Cargo、Tauri 相关依赖；
- 如需 Docker 调试：Docker Desktop。

检查 Yarn：

```text
yarn --version
```

如果没有 Yarn 1.x，可根据本机 Node 版本选择 Corepack 或全局安装 Yarn。

## 2. 安装依赖

在项目根目录执行：

```text
yarn install
```

项目使用 `yarn.lock` 锁定依赖版本，尽量不要混用 npm、pnpm 和 Yarn，以免产生多套锁文件。

## 3. 配置环境变量

本地开发可以创建 `.env.local`。常用配置示例：

```text
OPENAI_API_KEY=你的 OpenAI Key
CODE=本地访问码
BASE_URL=https://api.openai.com
GOOGLE_API_KEY=你的 Gemini Key
ANTHROPIC_API_KEY=你的 Claude Key
DEEPSEEK_API_KEY=你的 DeepSeek Key
ENABLE_MCP=true
```

不是所有变量都必须设置。只需要设置你本地要调试的供应商即可。

完整环境变量说明见 `docs/env-vars-cn.md`。

## 4. 启动 Web 开发服务

```text
yarn dev
```

该命令会并行执行：

- `yarn mask:watch`：监听并构建内置面具；
- `next dev`：启动 Next.js 开发服务。

默认访问：

```text
http://localhost:3000
```

## 5. 常用脚本

| 命令              | 作用                                                     |
| ----------------- | -------------------------------------------------------- |
| `yarn dev`        | 启动本地 Web 开发环境。                                  |
| `yarn build`      | 构建 standalone 版本，适合 Node.js / Docker 服务端运行。 |
| `yarn start`      | 启动 Next.js 生产服务。通常在 `yarn build` 后执行。      |
| `yarn export`     | 静态导出，适合 Tauri 或静态托管。                        |
| `yarn export:dev` | 静态导出模式的开发服务。                                 |
| `yarn app:dev`    | 启动 Tauri 桌面端开发。                                  |
| `yarn app:build`  | 构建 Tauri 桌面端安装包。                                |
| `yarn mask`       | 构建内置面具。                                           |
| `yarn mask:watch` | 监听 `app/masks` 变化并重新构建。                        |
| `yarn prompts`    | 执行 `scripts/fetch-prompts.mjs` 更新 prompts。          |
| `yarn test`       | 以 watch 模式运行 Jest。                                 |
| `yarn test:ci`    | 以 CI 模式运行 Jest。                                    |
| `yarn proxy-dev`  | 使用 proxychains 启动带代理的开发环境。                  |

## 6. 开发聊天相关功能

常用入口：

- UI：`app/components/chat.tsx`
- 会话状态：`app/store/chat.ts`
- 模型配置：`app/store/config.ts`
- API Key / 访问配置：`app/store/access.ts`
- 模型客户端：`app/client/controller.ts`
- 供应商适配：`app/client/platforms/*.ts`
- 服务端 API：`app/api/*`

建议先确认问题发生在哪一层：

1. 输入框和按钮问题：看 `chat.tsx`。
2. 消息没写入或状态异常：看 `chat.ts`。
3. 模型参数不对：看 `config.ts` 和 `model-config.tsx`。
4. 请求路径不对：看 `controller.ts` 和 `platforms`。
5. 服务端报错：看 `app/api` 和 `server.ts`。

## 7. 开发设置页

设置页主要涉及：

- `app/components/settings.tsx`
- `app/components/model-config.tsx`
- `app/store/config.ts`
- `app/store/access.ts`
- `app/store/sync.ts`
- `app/locales/*`

新增设置项时，一般需要：

1. 在 Store 中增加默认值；
2. 增加持久化版本迁移逻辑；
3. 在设置页添加表单控件；
4. 在使用处读取配置；
5. 补充多语言文案；
6. 如影响服务端，更新 `app/config/server.ts` 和文档。

## 8. 开发模型供应商

新增供应商建议改动：

1. `app/constant.ts`：新增 Base URL、`ApiPath`、`ServiceProvider`、`ModelProvider`。
2. 模型列表文件：增加模型定义和默认可用性。
3. `app/client/platforms/新供应商.ts`：实现统一客户端接口。
4. `app/client/controller.ts`：注册供应商客户端。
5. `app/api/新供应商.ts` 或动态 route：增加服务端代理逻辑。
6. `app/config/server.ts`：读取环境变量。
7. `app/components/settings.tsx` / `model-config.tsx`：确保 UI 可选。
8. `test/`：补充供应商和模型可用性测试。
9. `docs/env-vars-cn.md`：补充变量说明。

## 9. 开发 Tauri 桌面端

启动：

```text
yarn app:dev
```

打包：

```text
yarn app:build
```

关键文件：

- `src-tauri/tauri.conf.json`：窗口、权限、打包、更新配置；
- `src-tauri/src/`：Rust 入口；
- `app/config/client.ts`：客户端判断是否为 App；
- `next.config.mjs`：`export` 模式配置。

注意：Tauri 构建依赖静态导出，因此服务端 API 和 rewrites 在 `export` 模式下不可用，相关能力需要走浏览器直连或 Tauri HTTP 能力。

## 10. 开发 MCP

启用 MCP：

```text
ENABLE_MCP=true
```

相关代码：

- `app/mcp/actions.ts`
- `app/mcp/client.ts`
- `app/mcp/types.ts`
- `app/mcp/utils.ts`
- `app/mcp/mcp_config.default.json`
- `app/components/mcp-market.tsx`
- `app/store/plugin.ts` 或相关 MCP Store

Docker 中会复制默认配置到运行时配置：

```text
/app/app/mcp/mcp_config.json
```

## 11. 开发样式

项目主要使用 SCSS Modules：

- 组件样式与组件同名，例如 `chat.tsx` 对应 `chat.module.scss`；
- 全局样式在 `app/styles/`；
- 图标在 `app/icons/`，SVG 可作为 React 组件使用。

修改样式时注意：

- 响应式布局；
- 暗色 / 亮色主题；
- 窄屏移动端；
- 桌面端窗口尺寸。

## 12. 本地开发常见问题

### 依赖安装失败

可能原因：

- Node 版本过低；
- 网络访问 npm registry 失败；
- 混用了 npm / pnpm / Yarn；
- 本地缓存损坏。

建议保持 Yarn 1.x，并优先使用 `yarn install`。

### 页面打开后要求访问码

说明设置了 `CODE`。输入 `.env.local` 中配置的访问码即可。

### 模型请求 401

检查：

- API Key 是否正确；
- 是否配置到了正确供应商变量；
- 是否被 `HIDE_USER_API_KEY` 或访问控制影响；
- 是否走错 Base URL。

### 本地没有模型列表

检查：

- `app/constant.ts` 的默认模型；
- `CUSTOM_MODELS` 是否禁用了某些模型；
- `DISABLE_GPT4` 是否开启；
- 设置页中是否隐藏或自定义了模型。
