# 环境变量说明

本文档整理 NextChat 中常见环境变量。实际读取逻辑主要在 `app/config/server.ts`，构建逻辑也会使用 `next.config.mjs` 中的 `BUILD_MODE`。

## 1. 基础变量

| 变量             | 必填                | 说明                                                        |
| ---------------- | ------------------- | ----------------------------------------------------------- |
| `CODE`           | 否                  | 访问密码，多个密码用逗号分隔。服务端会对密码做 MD5 后匹配。 |
| `BASE_URL`       | 否                  | OpenAI 兼容接口 Base URL，默认 `https://api.openai.com`。   |
| `OPENAI_API_KEY` | 使用 OpenAI 时必填  | OpenAI API Key，多个 Key 用逗号分隔，会随机选择。           |
| `OPENAI_ORG_ID`  | 否                  | OpenAI Organization ID。                                    |
| `PROXY_URL`      | Docker 代理模式可选 | Docker 启动时用于生成 proxychains 配置。                    |

## 2. 构建变量

| 变量            | 说明                                                                 |
| --------------- | -------------------------------------------------------------------- |
| `BUILD_MODE`    | Next.js 输出模式，常用 `standalone` 或 `export`。默认 `standalone`。 |
| `BUILD_APP`     | 标记是否构建桌面 App。`yarn export` 中会设置为 `1`。                 |
| `DISABLE_CHUNK` | 禁用 chunk 拆分。`BUILD_MODE=export` 时也会禁用。                    |

## 3. 功能开关

| 变量                     | 说明                                   |
| ------------------------ | -------------------------------------- |
| `HIDE_USER_API_KEY`      | 隐藏用户在前端输入 API Key 的能力。    |
| `DISABLE_GPT4`           | 禁用 GPT-4 类模型。                    |
| `ENABLE_BALANCE_QUERY`   | 启用余额查询能力。                     |
| `DISABLE_FAST_LINK`      | 禁用从 URL 快速导入设置。              |
| `CUSTOM_MODELS`          | 自定义模型列表，可用于添加或禁用模型。 |
| `DEFAULT_MODEL`          | 新会话默认模型。                       |
| `VISION_MODELS`          | 自定义视觉模型列表。                   |
| `DEFAULT_INPUT_TEMPLATE` | 用户输入预处理模板。                   |
| `ENABLE_MCP`             | 启用 MCP 功能，通常设置为 `true`。     |

## 4. OpenAI

| 变量             | 说明                                 |
| ---------------- | ------------------------------------ |
| `OPENAI_API_KEY` | OpenAI Key。                         |
| `BASE_URL`       | OpenAI 或 OpenAI 兼容接口 Base URL。 |
| `OPENAI_ORG_ID`  | OpenAI 组织 ID。                     |

## 5. Azure OpenAI

| 变量                | 说明                                                                   |
| ------------------- | ---------------------------------------------------------------------- |
| `AZURE_URL`         | Azure OpenAI 地址，例如 `https://{resource}.openai.azure.com/openai`。 |
| `AZURE_API_KEY`     | Azure API Key。                                                        |
| `AZURE_API_VERSION` | Azure API 版本。                                                       |

## 6. Google Gemini

| 变量             | 说明                                                                           |
| ---------------- | ------------------------------------------------------------------------------ |
| `GOOGLE_API_KEY` | Google Gemini API Key。                                                        |
| `GOOGLE_URL`     | Gemini API Base URL。默认通常是 `https://generativelanguage.googleapis.com/`。 |

## 7. Anthropic Claude

| 变量                    | 说明                     |
| ----------------------- | ------------------------ |
| `ANTHROPIC_API_KEY`     | Anthropic API Key。      |
| `ANTHROPIC_URL`         | Anthropic API Base URL。 |
| `ANTHROPIC_API_VERSION` | Anthropic API Version。  |

## 8. Stability / 图像生成

| 变量                | 说明                                                      |
| ------------------- | --------------------------------------------------------- |
| `STABILITY_API_KEY` | Stability API Key。                                       |
| `STABILITY_URL`     | Stability API Base URL，默认 `https://api.stability.ai`。 |

## 9. 百度文心一言

| 变量               | 说明                |
| ------------------ | ------------------- |
| `BAIDU_API_KEY`    | 百度 API Key。      |
| `BAIDU_SECRET_KEY` | 百度 Secret Key。   |
| `BAIDU_URL`        | 百度 API Base URL。 |

## 10. 字节 Doubao

| 变量                | 说明                        |
| ------------------- | --------------------------- |
| `BYTEDANCE_API_KEY` | 火山方舟 / Doubao API Key。 |
| `BYTEDANCE_URL`     | ByteDance API Base URL。    |

## 11. 阿里通义千问

| 变量              | 说明                 |
| ----------------- | -------------------- |
| `ALIBABA_API_KEY` | DashScope API Key。  |
| `ALIBABA_URL`     | DashScope Base URL。 |

## 12. 腾讯混元

| 变量                 | 说明                    |
| -------------------- | ----------------------- |
| `TENCENT_SECRET_ID`  | 腾讯云 Secret ID。      |
| `TENCENT_SECRET_KEY` | 腾讯云 Secret Key。     |
| `TENCENT_URL`        | 腾讯混元 API Base URL。 |

> 代码中也存在 `TENCENT_API_KEY` 可用性判断相关逻辑，调试腾讯供应商时应同时检查具体实现和接口期望。

## 13. Moonshot

| 变量               | 说明                |
| ------------------ | ------------------- |
| `MOONSHOT_API_KEY` | Moonshot API Key。  |
| `MOONSHOT_URL`     | Moonshot Base URL。 |

## 14. 讯飞星火

| 变量                 | 说明                |
| -------------------- | ------------------- |
| `IFLYTEK_API_KEY`    | 讯飞 API Key。      |
| `IFLYTEK_API_SECRET` | 讯飞 API Secret。   |
| `IFLYTEK_URL`        | 讯飞 API Base URL。 |

## 15. DeepSeek

| 变量               | 说明                |
| ------------------ | ------------------- |
| `DEEPSEEK_API_KEY` | DeepSeek API Key。  |
| `DEEPSEEK_URL`     | DeepSeek Base URL。 |

## 16. xAI

| 变量          | 说明           |
| ------------- | -------------- |
| `XAI_API_KEY` | xAI API Key。  |
| `XAI_URL`     | xAI Base URL。 |

## 17. 智谱 ChatGLM

| 变量              | 说明            |
| ----------------- | --------------- |
| `CHATGLM_API_KEY` | 智谱 API Key。  |
| `CHATGLM_URL`     | 智谱 Base URL。 |

## 18. SiliconFlow

| 变量                  | 说明                   |
| --------------------- | ---------------------- |
| `SILICONFLOW_API_KEY` | SiliconFlow API Key。  |
| `SILICONFLOW_URL`     | SiliconFlow Base URL。 |

## 19. 302.AI

| 变量            | 说明              |
| --------------- | ----------------- |
| `AI302_API_KEY` | 302.AI API Key。  |
| `AI302_URL`     | 302.AI Base URL。 |

## 20. Cloudflare KV / 缓存

`app/config/server.ts` 中读取了以下变量，用于 Cloudflare KV 或缓存相关能力：

| 变量                         | 说明                    |
| ---------------------------- | ----------------------- |
| `CLOUDFLARE_ACCOUNT_ID`      | Cloudflare Account ID。 |
| `CLOUDFLARE_KV_NAMESPACE_ID` | KV Namespace ID。       |
| `CLOUDFLARE_KV_API_KEY`      | Cloudflare KV API Key。 |
| `CLOUDFLARE_KV_TTL`          | KV 缓存 TTL。           |

## 21. WebDAV 白名单

| 变量                     | 说明                                          |
| ------------------------ | --------------------------------------------- |
| `WHITE_WEBDAV_ENDPOINTS` | 允许的 WebDAV endpoint 列表，多个用逗号分隔。 |

## 22. 统计分析

| 变量     | 说明                                      |
| -------- | ----------------------------------------- |
| `GTM_ID` | Google Tag Manager ID。                   |
| `GA_ID`  | Google Analytics ID。未设置时使用默认值。 |

## 23. 本地 `.env.local` 示例

```text
CODE=dev-pass
OPENAI_API_KEY=sk-xxx
BASE_URL=https://api.openai.com
GOOGLE_API_KEY=xxx
ANTHROPIC_API_KEY=xxx
DEEPSEEK_API_KEY=xxx
ENABLE_MCP=true
```

## 24. Docker `.env` 示例

```text
OPENAI_API_KEY=sk-xxx
GOOGLE_API_KEY=xxx
CODE=prod-pass
BASE_URL=https://api.openai.com
PROXY_URL=socks5://host.docker.internal:7890
ENABLE_MCP=true
```

## 25. 安全注意事项

- 不要提交 `.env.local`、`.env` 或任何真实 API Key。
- 生产环境建议设置 `CODE`。
- 如果部署为公开站点，应限制上游 API 额度。
- 修改环境变量后需要重启本地服务或重新部署。
- 多个 API Key 用逗号分隔时，注意不要包含中文逗号。
