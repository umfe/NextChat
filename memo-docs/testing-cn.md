# 测试指南

本文档说明 NextChat 的测试配置、运行方式和新增测试建议。

## 1. 测试技术栈

项目使用：

- Jest；
- `next/jest`；
- jsdom；
- Testing Library；
- TypeScript；
- `jest.setup.ts` 作为测试初始化文件。

配置文件：

- `jest.config.ts`
- `jest.setup.ts`

测试目录：

- `test/`

## 2. 运行测试

### 2.1 Watch 模式

```text
yarn test
```

适合本地开发时持续运行。

### 2.2 CI 模式

```text
yarn test:ci
```

适合提交前或 CI 环境执行。

## 3. 当前测试文件

| 文件                                | 说明                     |
| ----------------------------------- | ------------------------ |
| `test/model-available.test.ts`      | 检查模型可用性相关逻辑。 |
| `test/model-provider.test.ts`       | 检查模型与供应商映射。   |
| `test/vision-model-checker.test.ts` | 检查视觉模型判断逻辑。   |
| `test/sum-module.test.ts`           | 基础示例测试。           |

## 4. Jest 配置说明

`jest.config.ts` 通过 `next/jest` 创建配置：

- `dir: "./"`：让 Jest 加载 Next.js 配置和环境变量；
- `testEnvironment: "jsdom"`：模拟浏览器环境；
- `testMatch`：匹配 `.test.ts`、`.test.tsx` 等测试文件；
- `setupFilesAfterEnv`：加载 `jest.setup.ts`；
- `moduleNameMapper`：将 `@/` 映射到项目根目录；
- `extensionsToTreatAsEsm`：将 `.ts`、`.tsx` 作为 ESM 处理。

## 5. 新增测试建议

### 5.1 新增模型供应商

建议补充：

- 模型是否出现在默认列表；
- 模型和供应商映射是否正确；
- 视觉模型、图像模型、特殊模型判断是否正确；
- 平台客户端是否生成正确 URL 和请求参数；
- 环境变量开关是否影响可用性。

### 5.2 新增 Store 功能

建议测试：

- 默认状态；
- 状态更新；
- 持久化 merge；
- 版本迁移 migrate；
- 重置逻辑。

### 5.3 新增工具函数

建议测试：

- 正常输入；
- 空输入；
- 边界值；
- 异常输入；
- 多语言或 Unicode 输入。

### 5.4 新增组件

建议测试：

- 是否正确渲染；
- 用户交互；
- Store 状态联动；
- 异常状态；
- 多语言文案。

## 6. 提交前检查清单

提交前建议至少执行：

```text
yarn test:ci
yarn build
```

如果修改 Tauri 或静态导出相关逻辑，再执行：

```text
yarn export
```

如果修改面具：

```text
yarn mask
```

## 7. 常见测试问题

### 7.1 模块路径无法解析

检查：

- `jest.config.ts` 的 `moduleNameMapper`；
- import 路径是否使用 `@/` 或相对路径；
- 文件名大小写是否一致。

### 7.2 浏览器 API 不存在

虽然使用 jsdom，但不是所有浏览器 API 都完整实现。可以在 `jest.setup.ts` 中 mock。

### 7.3 环境变量影响测试

测试中如果依赖环境变量，应在测试开始前显式设置，并在测试后清理，避免污染其他测试。

### 7.4 ESM / CJS 问题

本项目依赖中有 ESM 包。若出现解析错误，需要检查 Jest transform、Next.js Jest 配置和具体依赖导入方式。
