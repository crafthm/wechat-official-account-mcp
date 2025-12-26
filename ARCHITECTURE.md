# 项目架构分析文档

**项目名称**: 微信公众号 MCP 服务 (wechat-official-account-mcp)  
**版本**: v1.1.0  
**分析日期**: 2025年1月27日

---

## 📋 目录

1. [项目概述](#项目概述)
2. [功能架构](#功能架构)
3. [技术架构](#技术架构)
4. [系统架构图](#系统架构图)
5. [核心模块详解](#核心模块详解)
6. [数据流](#数据流)
7. [安全机制](#安全机制)

---

## 项目概述

本项目是一个基于 **MCP (Model Context Protocol)** 协议的微信公众号 API 集成服务，为 AI 应用（如 Claude Desktop、Cursor、Trae AI 等）提供标准化的微信公众号管理工具接口。

### 核心价值

- **标准化接口**: 基于 MCP 协议，提供统一的工具接口
- **完整功能**: 覆盖认证、素材、草稿、发布等微信公众号核心功能
- **安全可靠**: 支持敏感数据加密存储、日志脱敏、跨域白名单
- **易于集成**: 支持 stdio 和 SSE 两种传输模式，适配不同 AI 应用

---

## 功能架构

### 1. 核心功能模块

#### 1.1 认证管理模块 (`wechat_auth`)
- **功能**: 管理微信公众号 AppID、AppSecret 和 Access Token
- **操作**:
  - `configure`: 配置 AppID 和 AppSecret
  - `get_token`: 获取当前 Access Token
  - `refresh_token`: 刷新 Access Token
  - `get_config`: 查看当前配置
- **实现位置**: `src/mcp-tool/tools/auth-tool.ts`
- **依赖**: `AuthManager`、`StorageManager`

#### 1.2 素材管理模块

##### 临时素材 (`wechat_media_upload`)
- **功能**: 上传和管理临时素材（有效期 3 天）
- **操作**:
  - `upload`: 上传素材（图片、语音、视频、缩略图）
  - `get`: 获取素材信息
- **支持格式**:
  - 图片：JPG、PNG（≤10MB）
  - 语音：MP3、WMA、WAV、AMR（≤10MB，≤60s）
  - 视频：MP4（≤10MB）
  - 缩略图：JPG（≤64KB）

##### 永久素材 (`wechat_permanent_media`)
- **功能**: 管理永久素材（不自动过期）
- **操作**:
  - `add`: 上传永久素材
  - `get`: 获取永久素材
  - `delete`: 删除永久素材
  - `list`: 获取素材列表
  - `count`: 获取素材总数统计

##### 图文消息图片 (`wechat_upload_img`)
- **功能**: 上传图文消息内图片（不占用素材库限制）
- **操作**:
  - `upload`: 上传图片（支持文件路径或 base64）
- **特点**: 不占用公众号素材库的 100000 个图片限制

#### 1.3 草稿管理模块 (`wechat_draft`)
- **功能**: 管理微信公众号图文草稿
- **操作**:
  - `add`: 新建草稿
  - `get`: 获取草稿详情
  - `delete`: 删除草稿
  - `list`: 获取草稿列表
  - `count`: 获取草稿总数

#### 1.4 发布管理模块 (`wechat_publish`)
- **功能**: 管理微信公众号文章发布
- **操作**:
  - `submit`: 发布草稿
  - `get`: 获取发布状态
  - `delete`: 删除发布
  - `list`: 获取发布列表

### 2. 数据存储模块

#### 2.1 存储管理器 (`StorageManager`)
- **数据库**: SQLite
- **存储内容**:
  - 配置信息（AppID、AppSecret、Token、EncodingAESKey）
  - Access Token（带过期时间）
  - 临时素材元数据
  - 永久素材元数据
  - 草稿信息
  - 发布记录
- **安全特性**:
  - 支持 AES 加密存储敏感字段
  - 加密字段标识：`enc:` 前缀

### 3. 前端界面模块（可选）

- **技术栈**: React + TypeScript + Vite + Tailwind CSS
- **路由**: React Router
- **状态管理**: Zustand
- **主要页面**: Home 页面（管理界面）

---

## 技术架构

### 1. 技术栈

#### 1.1 运行时环境
- **Node.js**: ≥18.0.0
- **TypeScript**: ~5.8.3
- **模块系统**: ESM (ES Modules)

#### 1.2 核心依赖

##### MCP 协议
- `@modelcontextprotocol/sdk`: ^1.0.0
  - 提供 MCP 服务器和传输层实现

##### HTTP 客户端
- `axios`: ^1.6.0
  - 用于调用微信公众号 API

##### 数据验证
- `zod`: ^3.22.0
  - 工具参数验证和类型安全

##### 数据库
- `sqlite3`: ^5.1.6
  - 本地数据持久化

##### 加密
- `crypto-js`: ^4.2.0
  - AES 加密敏感数据

##### CLI 工具
- `commander`: ^12.1.0
  - 命令行参数解析

##### 文件上传
- `form-data`: ^4.0.0
  - 处理 multipart/form-data 请求

#### 1.3 前端技术栈

##### UI 框架
- `react`: ^18.3.1
- `react-dom`: ^18.3.1
- `react-router-dom`: ^7.3.0

##### 构建工具
- `vite`: ^6.3.5
- `@vitejs/plugin-react`: ^4.4.1
- `typescript`: ~5.8.3

##### 样式
- `tailwindcss`: ^3.4.17
- `postcss`: ^8.5.3
- `autoprefixer`: ^10.4.21

##### 状态管理
- `zustand`: ^5.0.3

##### 工具库
- `clsx`: ^2.1.1
- `tailwind-merge`: ^3.0.2
- `lucide-react`: ^0.511.0

#### 1.4 开发工具

##### 代码质量
- `eslint`: ^9.25.0
- `typescript-eslint`: ^8.30.1

##### 开发服务器
- `tsx`: ^4.20.3
- `nodemon`: ^3.1.10
- `concurrently`: ^9.2.0

### 2. 项目结构

```
wechat-official-account-mcp/
├── src/                          # 源代码目录
│   ├── cli.ts                    # CLI 入口（命令行工具）
│   ├── index.ts                  # 模块导出入口
│   ├── main.tsx                  # 前端入口
│   │
│   ├── mcp-server/               # MCP 服务器实现
│   │   ├── index.ts              # 导出
│   │   ├── shared/               # 共享组件
│   │   │   ├── init.ts           # 服务器初始化
│   │   │   ├── logger.ts         # 日志工具
│   │   │   └── types.ts          # 类型定义
│   │   └── transport/            # 传输层
│   │       ├── index.ts          # 导出
│   │       ├── stdio.ts          # stdio 传输实现
│   │       └── sse.ts            # SSE 传输实现
│   │
│   ├── mcp-tool/                 # MCP 工具实现
│   │   ├── index.ts              # 工具管理器
│   │   ├── types.ts              # 类型定义
│   │   └── tools/                # 具体工具
│   │       ├── index.ts          # 工具导出
│   │       ├── auth-tool.ts      # 认证工具
│   │       ├── media-upload-tool.ts      # 临时素材工具
│   │       ├── upload-img-tool.ts        # 图文图片工具
│   │       ├── permanent-media-tool.ts   # 永久素材工具
│   │       ├── draft-tool.ts     # 草稿工具
│   │       └── publish-tool.ts   # 发布工具
│   │
│   ├── auth/                      # 认证管理
│   │   └── auth-manager.ts        # 认证管理器
│   │
│   ├── wechat/                    # 微信 API 客户端
│   │   └── api-client.ts         # API 客户端封装
│   │
│   ├── storage/                   # 数据存储
│   │   └── storage-manager.ts    # 存储管理器
│   │
│   ├── utils/                     # 工具函数
│   │   ├── logger.ts             # 日志工具
│   │   └── db-init.ts            # 数据库初始化
│   │
│   ├── pages/                     # 前端页面
│   │   └── Home.tsx              # 首页
│   │
│   ├── components/                # 前端组件
│   │   └── Empty.tsx             # 空状态组件
│   │
│   ├── hooks/                     # React Hooks
│   │   └── useTheme.ts           # 主题 Hook
│   │
│   └── lib/                       # 前端工具库
│       └── utils.ts              # 工具函数
│
├── api/                           # API 服务器（可选）
│   ├── app.ts                    # Express 应用
│   ├── server.ts                 # 服务器入口
│   ├── index.ts                  # 导出
│   └── routes/                   # 路由
│       └── auth.ts               # 认证路由
│
├── data/                          # 数据目录
│   └── wechat-mcp.db             # SQLite 数据库
│
├── public/                        # 静态资源
│   └── favicon.svg               # 网站图标
│
├── scripts/                       # 构建脚本
│   └── build.sh                  # 构建脚本
│
├── package.json                   # 项目配置
├── tsconfig.json                  # TypeScript 配置
├── vite.config.ts                # Vite 配置
├── tailwind.config.js            # Tailwind 配置
├── eslint.config.js              # ESLint 配置
└── README.md                      # 项目说明

```

### 3. 架构层次

#### 3.1 传输层 (Transport Layer)
- **职责**: 处理 MCP 协议的传输
- **实现**:
  - **stdio 模式**: 标准输入输出，适用于 CLI 和本地集成
  - **SSE 模式**: Server-Sent Events，适用于 Web 应用
- **位置**: `src/mcp-server/transport/`

#### 3.2 MCP 服务器层 (MCP Server Layer)
- **职责**: 
  - 初始化 MCP 服务器
  - 注册工具
  - 处理工具调用
- **位置**: `src/mcp-server/`

#### 3.3 工具层 (Tool Layer)
- **职责**: 
  - 定义 MCP 工具
  - 参数验证（Zod）
  - 工具执行逻辑
- **位置**: `src/mcp-tool/`

#### 3.4 业务逻辑层 (Business Logic Layer)
- **职责**: 
  - 认证管理（AuthManager）
  - API 调用封装（WechatApiClient）
  - 数据存储（StorageManager）
- **位置**: `src/auth/`, `src/wechat/`, `src/storage/`

#### 3.5 数据层 (Data Layer)
- **职责**: 
  - SQLite 数据库操作
  - 数据加密/解密
  - 数据持久化
- **位置**: `src/storage/`

---

## 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    AI 应用 (Claude/Cursor/Trae)              │
└──────────────────────┬──────────────────────────────────────┘
                       │ MCP Protocol
                       │ (stdio / SSE)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP 传输层                                │
│  ┌──────────────┐              ┌──────────────┐            │
│  │  stdio.ts    │              │   sse.ts     │            │
│  └──────────────┘              └──────────────┘            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP 服务器层                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         McpServer (@modelcontextprotocol/sdk)       │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                        │                                     │
│  ┌─────────────────────▼─────────────────────────────────┐ │
│  │            WechatMcpTool (工具管理器)                │ │
│  └─────────────────────┬─────────────────────────────────┘ │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    工具层                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ auth-tool   │  │ draft-tool   │  │ publish-tool │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ media-upload │  │ permanent-   │  │ upload-img   │     │
│  │    -tool     │  │  media-tool  │  │    -tool     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ AuthManager  │ │WechatApiClient│ │StorageManager│
│              │ │               │ │              │
│ - 配置管理   │ │ - API 封装    │ │ - SQLite     │
│ - Token管理  │ │ - 请求拦截    │ │ - 加密存储   │
└──────┬───────┘ └───────┬───────┘ └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │    微信公众号 API              │
        │  (api.weixin.qq.com)          │
        └───────────────────────────────┘
```

---

## 核心模块详解

### 1. MCP 服务器初始化流程

```typescript
// 初始化流程
1. CLI 解析参数 (cli.ts)
   ↓
2. 创建服务器选项 (McpServerOptions)
   ↓
3. 初始化传输层 (initMcpServerWithTransport)
   ↓
4. 创建 MCP 服务器 (initWechatMcpServer)
   ├── 创建 McpServer 实例
   ├── 初始化 AuthManager
   ├── 创建 WechatMcpTool
   └── 注册工具到服务器
   ↓
5. 连接传输层 (stdio/sse)
```

### 2. 工具调用流程

```typescript
// 工具调用流程
1. AI 应用发送工具调用请求
   ↓
2. MCP 服务器接收请求
   ↓
3. WechatMcpTool.callTool()
   ├── 参数验证 (Zod)
   ├── 查找工具定义
   └── 执行工具处理器
   ↓
4. 工具处理器执行
   ├── 调用 WechatApiClient
   ├── 使用 AuthManager 获取 Token
   └── 使用 StorageManager 存储数据
   ↓
5. 返回结果给 AI 应用
```

### 3. 认证流程

```typescript
// Access Token 获取流程
1. WechatApiClient 发起请求
   ↓
2. 请求拦截器检查 Token
   ↓
3. AuthManager.getAccessToken()
   ├── 检查内存中的 Token
   ├── 检查数据库中的 Token
   └── 如果过期，调用 refreshAccessToken()
   ↓
4. refreshAccessToken()
   ├── 调用微信 API 获取新 Token
   ├── 保存到数据库（加密）
   └── 返回 Token 信息
   ↓
5. 将 Token 添加到请求参数
```

### 4. 数据存储流程

```typescript
// 数据存储流程
1. 工具执行完成，需要存储数据
   ↓
2. StorageManager.saveXXX()
   ├── 检查是否启用加密 (WECHAT_MCP_SECRET_KEY)
   ├── 加密敏感字段（如有）
   └── 写入 SQLite 数据库
   ↓
3. 读取数据时
   ├── 从数据库读取
   ├── 检查是否有 enc: 前缀
   └── 解密敏感字段（如有）
```

---

## 数据流

### 1. 工具调用数据流

```
AI 应用
  │
  │ JSON-RPC 请求
  │ {
  │   "method": "tools/call",
  │   "params": {
  │     "name": "wechat_draft",
  │     "arguments": { "action": "add", ... }
  │   }
  │ }
  ▼
MCP 服务器
  │
  │ 解析请求
  ▼
WechatMcpTool
  │
  │ 参数验证 (Zod)
  │ 查找工具定义
  ▼
工具处理器 (draft-tool.ts)
  │
  │ 调用 WechatApiClient
  ▼
WechatApiClient
  │
  │ 请求拦截器：添加 Access Token
  │ POST https://api.weixin.qq.com/cgi-bin/draft/add
  ▼
微信公众号 API
  │
  │ 响应
  │ { "media_id": "...", "errcode": 0 }
  ▼
WechatApiClient
  │
  │ 响应拦截器：错误处理
  ▼
工具处理器
  │
  │ 保存到数据库（可选）
  │ 格式化结果
  ▼
WechatMcpTool
  │
  │ 返回结果
  ▼
MCP 服务器
  │
  │ JSON-RPC 响应
  │ {
  │   "result": {
  │     "content": [{ "type": "text", "text": "..." }]
  │   }
  │ }
  ▼
AI 应用
```

### 2. Token 刷新数据流

```
WechatApiClient 请求
  │
  │ 检查 Token 是否过期
  ▼
AuthManager.getAccessToken()
  │
  │ Token 过期
  ▼
AuthManager.refreshAccessToken()
  │
  │ GET https://api.weixin.qq.com/cgi-bin/token
  │ ?grant_type=client_credential
  │ &appid=xxx
  │ &secret=xxx
  ▼
微信公众号 API
  │
  │ 响应
  │ {
  │   "access_token": "...",
  │   "expires_in": 7200
  │ }
  ▼
AuthManager
  │
  │ 计算过期时间
  │ 加密 Token（如有）
  │ 保存到数据库
  ▼
StorageManager.saveAccessToken()
  │
  │ SQLite INSERT
  ▼
数据库
```

---

## 安全机制

### 1. 数据加密

#### 加密字段
- `app_secret`: 应用密钥
- `token`: 服务器配置 Token
- `encoding_aes_key`: 消息加解密密钥
- `access_token`: 访问令牌

#### 加密方式
- **算法**: AES (CryptoJS)
- **密钥**: 环境变量 `WECHAT_MCP_SECRET_KEY`
- **标识**: 加密值以 `enc:` 前缀标识

#### 实现位置
```typescript
// src/storage/storage-manager.ts
private encryptValue(value: string): string {
  if (!this.secretKey) return value;
  const cipher = CryptoJS.AES.encrypt(value, this.secretKey).toString();
  return `enc:${cipher}`;
}

private decryptValue(value: string): string {
  if (!value.startsWith('enc:')) return value;
  const cipher = value.slice(4);
  const bytes = CryptoJS.AES.decrypt(cipher, this.secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

### 2. 日志脱敏

#### 脱敏策略
- **错误日志**: 仅记录状态码或错误消息，不记录响应体
- **敏感信息**: AppSecret、Token 等不在日志中完整显示

#### 实现位置
```typescript
// src/wechat/api-client.ts
this.httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    logger.error('Wechat API request failed:', status ? String(status) : error?.message);
    // 不记录 error.response.data（可能包含敏感信息）
    throw error;
  }
);
```

### 3. 跨域安全

#### CORS 配置
- **环境变量**: `CORS_ORIGIN`
- **格式**: 逗号分隔的域名列表
- **示例**: `https://a.example.com,https://b.example.com`
- **默认**: `*`（仅开发环境，生产环境应设置白名单）

#### 实现位置
```typescript
// src/mcp-server/transport/sse.ts
'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
```

### 4. 参数验证

#### 验证工具
- **Zod**: 所有工具参数都使用 Zod Schema 验证
- **类型安全**: TypeScript 类型定义

#### 示例
```typescript
// src/mcp-tool/tools/auth-tool.ts
const authToolSchema = z.object({
  action: z.enum(['configure', 'get_token', 'refresh_token', 'get_config']),
  appId: z.string().optional(),
  appSecret: z.string().optional(),
  // ...
});
```

---

## 总结

### 架构特点

1. **分层清晰**: 传输层、服务器层、工具层、业务层、数据层职责明确
2. **模块化设计**: 每个功能模块独立，易于维护和扩展
3. **类型安全**: 全面使用 TypeScript 和 Zod 验证
4. **安全可靠**: 支持数据加密、日志脱敏、跨域白名单
5. **灵活部署**: 支持 stdio 和 SSE 两种传输模式

### 技术亮点

1. **MCP 协议**: 标准化接口，易于 AI 应用集成
2. **自动 Token 管理**: 自动刷新，无需手动处理
3. **数据持久化**: SQLite 本地存储，支持加密
4. **错误处理**: 完善的错误处理和日志记录
5. **参数验证**: Zod Schema 确保参数安全

### 适用场景

- AI 应用集成微信公众号管理功能
- 自动化内容发布和管理
- 素材批量上传和管理
- 草稿和发布流程管理

---

**文档维护**: 本文档应随项目更新而更新，建议在重大架构变更时同步更新。

