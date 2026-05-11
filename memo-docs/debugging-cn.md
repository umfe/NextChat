# 调试指南

本文档总结 NextChat 常见问题的定位方式，覆盖本地开发、模型请求、服务端代理、状态持久化、构建、Docker 和 Tauri。

## 1. 基本调试思路

遇到问题时先判断属于哪一层：

| 现象                      | 优先检查                                                 |
| ------------------------- | -------------------------------------------------------- |
| 页面打不开                | 依赖安装、`yarn dev` 输出、Next.js 编译错误。            |
| 按钮没反应                | 浏览器控制台、对应组件事件、Store 状态。                 |
| 消息没发送                | `app/components/chat.tsx`、`app/store/chat.ts`。         |
| 请求失败                  | Network 面板、`app/client/platforms/*`、`app/api/*`。    |
| 401 / 403                 | API Key、访问码、供应商权限、Base URL。                  |
| CORS                      | 是否走服务端代理、`next.config.mjs` rewrites / headers。 |
| 流式输出中断              | 上游模型、代理、超时、`app/utils/stream.ts`。            |
| 配置不生效                | Zustand 持久化、本地存储、`app/store/config.ts`。        |
| Docker 正常构建但运行失败 | 容器日志、环境变量、端口、代理。                         |
| Tauri 异常                | `src-tauri/tauri.conf.json`、静态导出限制、Rust 日志。   |

## 2. 浏览器侧调试

打开浏览器 DevTools：

- Console：查看前端异常、React 报错、日志。
- Network：查看 API 请求 URL、Header、请求体、响应体和状态码。
- Application：查看 LocalStorage、IndexedDB、Service Worker、PWA 缓存。
- Performance：分析卡顿和长任务。

### 2.1 查看本地存储

常见 Store Key 在 `app/constant.ts` 中定义：

- `chat-next-web-store`
- `app-config`
- `access-control`
- `mask-store`
- `prompt-store`
- `chat-next-web-plugin`
- `sync`
- `sd-list`
- `mcp-store`

如果配置异常，可以尝试备份后清理相关 LocalStorage / IndexedDB。

### 2.2 调试聊天消息

优先检查：

- `app/components/chat.tsx`：输入、发送按钮、消息渲染。
- `app/store/chat.ts`：消息写入、更新、删除、重试、停止。
- `app/components/markdown.tsx`：消息渲染异常、Markdown 错误。

### 2.3 调试模型配置

检查：

- `app/store/config.ts` 的 `DEFAULT_CONFIG`；
- 当前会话是否覆盖了全局模型配置；
- 设置页是否保存成功；
- `CUSTOM_MODELS`、`DEFAULT_MODEL`、`DISABLE_GPT4` 是否影响模型列表。

## 3. 服务端 API 调试

服务端配置入口：

- `app/config/server.ts`

API 入口：

- `app/api/[provider]/[...path]/route.ts`
- `app/api/config/route.ts`
- `app/api/webdav/[...path]/route.ts`
- `app/api/upstash/[action]/[...key]/route.ts`
- `app/api/tencent/route.ts`
- `app/api/*.ts`

### 3.1 API Key 不生效

检查：

1. 环境变量名称是否正确。
2. 本地 `.env.local` 是否在项目根目录。
3. 修改环境变量后是否重启 dev server。
4. Docker / Vercel 是否重新部署。
5. 多 Key 使用逗号分隔时是否有多余空格。

### 3.2 Base URL 不正确

不同供应商变量不同：

- OpenAI：`BASE_URL`
- Azure：`AZURE_URL`
- Google：`GOOGLE_URL`
- Anthropic：`ANTHROPIC_URL`
- DeepSeek：`DEEPSEEK_URL`
- Moonshot：`MOONSHOT_URL`
- Alibaba：`ALIBABA_URL`
- Stability：`STABILITY_URL`

如果供应商返回 404，通常是 Base URL 或 path 拼接错误。

### 3.3 CORS 问题

`next.config.mjs` 在非 `export` 模式下为 `/api/:path*` 添加 CORS 头，并配置部分 rewrites。

如果是静态导出模式：

- 没有 Next.js API route；
- 没有这些 headers / rewrites；
- 需要供应商本身支持浏览器直连，或通过其他后端代理。

## 4. 流式响应调试

相关文件：

- `app/utils/stream.ts`
- `app/client/platforms/*.ts`
- `app/api/common.ts`

常见问题：

- 上游不支持 stream；
- 请求体中 stream 参数不正确；
- 代理缓冲导致不能实时输出；
- 网络中断；
- 响应格式不是 SSE；
- 供应商错误被包装成非预期结构。

排查建议：

1. 在 Network 面板查看响应是否分块返回。
2. 对比供应商官方 API 文档的 stream 格式。
3. 查看平台适配器是否正确解析 delta。
4. 检查服务端代理是否改变了响应体。

## 5. Mask / Prompt 调试

相关文件：

- `app/masks/*.ts`
- `app/masks/build.ts`
- `app/store/mask.ts`
- `app/components/mask.tsx`
- `public/prompts.json`

常见问题：

- 新增面具后页面没有显示：运行 `yarn mask` 或重启 `yarn dev`。
- 文案缺失：检查 `app/locales/*`。
- 面具导入失败：检查 JSON 格式和类型定义。

## 6. 插件 / MCP 调试

插件相关：

- `public/plugins.json`
- `app/components/plugin.tsx`
- `app/store/plugin.ts`

MCP 相关：

- `app/mcp/*`
- `app/components/mcp-market.tsx`
- `app/mcp/mcp_config.default.json`
- 环境变量 `ENABLE_MCP=true`

排查 MCP：

1. 确认环境变量已启用。
2. 确认配置文件存在。
3. 查看浏览器控制台。
4. 查看服务端日志。
5. Docker 中检查 `/app/app/mcp/mcp_config.json`。

## 7. 构建调试

### 7.1 Web 构建

```text
yarn build
```

如果构建失败：

- 查看 TypeScript 错误；
- 查看 ESLint 或 Next.js 编译错误；
- 检查是否引入了 Node-only 模块到客户端；
- 检查是否在客户端组件中引用 `app/config/server.ts`；
- 检查 SVG、SCSS、动态 import。

### 7.2 静态导出

```text
yarn export
```

常见问题：

- 使用了必须依赖服务端的 API；
- 页面中访问了 Node.js API；
- 动态路由无法静态生成；
- rewrites / headers 不生效。

### 7.3 Tauri 构建

```text
yarn app:build
```

如果失败：

- 先确认 `yarn export` 是否成功；
- 检查 Rust / Cargo 环境；
- 检查 `src-tauri/tauri.conf.json`；
- 检查系统依赖和打包签名配置。

## 8. Docker 调试

常见检查：

- 镜像是否成功构建；
- 容器是否运行；
- 端口是否映射；
- 环境变量是否传入；
- 容器内是否能访问模型供应商；
- `PROXY_URL` 是否正确。

查看容器日志：

```text
docker logs nextchat
```

进入容器：

```text
docker exec -it nextchat sh
```

代理模式下重点检查：

- `/etc/proxychains.conf`；
- `PROXY_URL` 协议、host、port；
- 容器是否能访问宿主机代理。

## 9. 测试调试

运行测试：

```text
yarn test:ci
```

Watch 模式：

```text
yarn test
```

测试配置：

- `jest.config.ts`
- `jest.setup.ts`
- `test/*.test.ts`

如果测试无法解析路径，检查 `moduleNameMapper` 中的 `^@/(.*)$` 是否匹配。

## 10. 常见错误速查

### `window is not defined`

说明浏览器对象被服务端代码执行了。解决：

- 将逻辑放到客户端组件；
- 使用 `typeof window !== "undefined"` 判断；
- 避免在服务端模块顶层访问浏览器 API。

### `process is not defined`

说明客户端代码访问了 Node.js `process`。解决：

- 只在服务端读取敏感环境变量；
- 将可公开变量通过安全配置接口传给客户端。

### 模型一直转圈

可能原因：

- 请求未返回；
- stream 解析失败；
- stop 状态未更新；
- 上游代理缓冲；
- 浏览器网络断开。

### 访问码正确但仍无法进入

检查：

- `CODE` 是否包含多个逗号分隔值；
- 输入是否有空格；
- 修改 `CODE` 后是否重启或重新部署；
- 浏览器是否缓存旧授权状态。
