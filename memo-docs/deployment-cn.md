# 部署指南

本文档说明 NextChat 的常见部署方式：Vercel、Node.js、Docker、Docker Compose、静态导出、Cloudflare Pages 和 Tauri 桌面端。

## 1. 部署模式选择

| 方式               | 适合场景                  | 特点                              |
| ------------------ | ------------------------- | --------------------------------- |
| Vercel             | 最快上线、Serverless 部署 | 配置环境变量即可，适合 Web 访问。 |
| Node.js standalone | 自有服务器                | `yarn build` 后运行 Node 服务。   |
| Docker             | 容器化部署                | 环境一致，适合服务器、NAS、K8s。  |
| Docker Compose     | 快速本地或服务器编排      | 支持普通模式和代理模式。          |
| 静态导出           | 静态托管 / 桌面端前置产物 | 没有 Next.js 服务端 API。         |
| Cloudflare Pages   | 静态或边缘托管            | 需关注静态导出和 API 能力限制。   |
| Tauri              | 桌面客户端                | 打包 Windows、macOS、Linux 应用。 |

## 2. Vercel 部署

### 2.1 基本步骤

1. Fork 或导入仓库到 Vercel。
2. 在 Vercel 项目中配置环境变量。
3. 触发部署。
4. 访问生成的域名。

### 2.2 常用环境变量

至少配置一个模型供应商 Key，例如：

```text
OPENAI_API_KEY=sk-xxx
CODE=your-password
BASE_URL=https://api.openai.com
```

如果使用其他供应商：

```text
GOOGLE_API_KEY=xxx
ANTHROPIC_API_KEY=xxx
DEEPSEEK_API_KEY=xxx
MOONSHOT_API_KEY=xxx
ALIBABA_API_KEY=xxx
```

更多变量见 `docs/env-vars-cn.md`。

### 2.3 Vercel 注意事项

- 修改环境变量后需要重新部署。
- Serverless 函数有执行时间限制，长响应或大文件可能受影响。
- 如果从模板直接部署而不是 Fork，可能无法正常跟踪上游更新。
- 如果使用自定义域名，需要在 Vercel 中配置域名和 DNS。

## 3. Node.js standalone 部署

### 3.1 构建

```text
yarn install
yarn build
```

默认 `yarn build` 会执行：

```text
yarn mask && cross-env BUILD_MODE=standalone next build
```

### 3.2 启动

```text
yarn start
```

默认端口通常是 3000。

### 3.3 生产环境建议

- 使用进程管理器守护 Node 进程；
- 使用 Nginx / Caddy 做 HTTPS 和反向代理；
- 将 API Key 放在系统环境变量中，不要写入代码；
- 配置访问码 `CODE`；
- 定期更新依赖和镜像。

## 4. Docker 部署

项目根目录提供 `Dockerfile`。它采用多阶段构建：

1. `deps` 阶段安装依赖；
2. `builder` 阶段执行 `yarn build`；
3. `runner` 阶段只复制 standalone 运行所需文件。

### 4.1 构建镜像

```text
docker build -t nextchat .
```

### 4.2 运行容器

```text
docker run -d \
  --name nextchat \
  -p 3000:3000 \
  -e OPENAI_API_KEY=sk-xxx \
  -e CODE=your-password \
  nextchat
```

访问：

```text
http://localhost:3000
```

### 4.3 Docker 环境变量

Dockerfile 中默认声明：

- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- `CODE`
- `PROXY_URL`
- `ENABLE_MCP`

但实际还可以传入 `app/config/server.ts` 支持的更多变量。

### 4.4 Docker 代理模式

如果设置 `PROXY_URL`，容器启动命令会自动生成 `/etc/proxychains.conf`，并通过 proxychains 启动 Node 服务。

示例：

```text
docker run -d \
  --name nextchat \
  -p 3000:3000 \
  -e OPENAI_API_KEY=sk-xxx \
  -e CODE=your-password \
  -e PROXY_URL=socks5://host.docker.internal:7890 \
  nextchat
```

## 5. Docker Compose 部署

`docker-compose.yml` 包含两个 profile：

- `no-proxy`：普通模式；
- `proxy`：带 `PROXY_URL` 的代理模式。

### 5.1 普通模式

```text
docker compose --profile no-proxy up -d
```

### 5.2 代理模式

```text
docker compose --profile proxy up -d
```

### 5.3 Compose 变量

Compose 会读取宿主机环境变量或 `.env` 文件，例如：

```text
OPENAI_API_KEY=sk-xxx
GOOGLE_API_KEY=xxx
CODE=your-password
BASE_URL=https://api.openai.com
PROXY_URL=socks5://host.docker.internal:7890
```

## 6. 静态导出部署

执行：

```text
yarn export
```

该命令会设置：

```text
BUILD_MODE=export
BUILD_APP=1
```

输出目录通常为：

```text
out/
```

注意：

- `export` 模式不会启用 Next.js 服务端 API route；
- `next.config.mjs` 中的 headers 和 rewrites 在 export 模式不启用；
- 需要客户端直连模型供应商或依赖桌面端能力；
- 某些需要服务端代理的功能可能不可用。

## 7. Cloudflare Pages

仓库已有 Cloudflare Pages 相关文档：

- `docs/cloudflare-pages-cn.md`
- `docs/cloudflare-pages-en.md`
- `docs/cloudflare-pages-es.md`
- `docs/cloudflare-pages-ja.md`
- `docs/cloudflare-pages-ko.md`

部署前重点确认：

- 构建命令；
- 输出目录；
- 环境变量；
- 是否依赖服务端 API；
- Cloudflare 对 Node.js API 的兼容性。

## 8. Tauri 桌面端打包

### 8.1 开发

```text
yarn app:dev
```

### 8.2 打包

```text
yarn app:build
```

### 8.3 关键配置

`src-tauri/tauri.conf.json` 中包含：

- 应用名称和版本；
- 窗口大小；
- 权限 allowlist；
- 打包图标；
- 更新地址；
- 构建前命令：`yarn export`；
- 开发前命令：`yarn export:dev`。

### 8.4 Tauri 注意事项

- 需要安装 Rust 工具链；
- Windows / macOS / Linux 打包依赖不同系统工具；
- 静态导出模式下没有 Next.js 服务端代理；
- HTTP 权限在 `tauri.conf.json` 的 allowlist 中配置。

## 9. 生产环境安全建议

- 设置 `CODE`，避免公开站点被滥用。
- 不要把 API Key 写进前端代码或提交到 Git。
- 优先使用服务端环境变量。
- 如果允许用户自填 API Key，理解其浏览器本地存储风险。
- 对公开部署配置速率限制或上游额度限制。
- 使用 HTTPS。
- 定期升级依赖，关注 Next.js、React、Tauri 和模型 SDK 的安全公告。
