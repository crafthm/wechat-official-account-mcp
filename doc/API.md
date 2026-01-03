# 微信公众号 API 文档

> 更新时间：2025-12-28 23:25:51

## 目录

- [概述](#概述)
- [API 客户端](#api-客户端)
- [认证管理 API](#认证管理-api)
- [草稿管理 API](#草稿管理-api)
- [发布管理 API](#发布管理-api)
- [临时素材 API](#临时素材-api)
- [永久素材 API](#永久素材-api)
- [图文消息图片上传 API](#图文消息图片上传-api)
- [错误处理](#错误处理)

## 概述

本项目提供了完整的微信公众号 API 封装，通过 MCP (Model Context Protocol) 工具的形式对外提供服务。所有 API 调用都通过 `WechatApiClient` 统一管理，自动处理 Access Token 的获取和刷新。

### 基础信息

- **API 基础地址**: `https://api.weixin.qq.com`
- **超时时间**: 30秒
- **认证方式**: Access Token（自动管理）

### 支持的 API 类型

1. **认证管理** - 配置和管理微信公众号认证信息
2. **草稿管理** - 创建、查询、删除草稿
3. **发布管理** - 提交发布、查询状态、删除发布
4. **临时素材** - 上传和管理临时素材（有效期3天）
5. **永久素材** - 上传和管理永久素材
6. **图文消息图片上传** - 上传图文消息内所需的图片

## API 客户端

### WechatApiClient

核心 API 客户端类，封装了所有微信公众号 API 调用。

**位置**: `src/wechat/api-client.ts`

**主要功能**:
- 自动添加 Access Token 到请求
- 统一的错误处理
- 请求/响应拦截器

**核心方法**:

#### `uploadMedia(params)`

上传临时素材。

**参数**:
- `type`: `'image' | 'voice' | 'video' | 'thumb'` - 素材类型
- `media`: `Buffer` - 文件数据
- `fileName`: `string` - 文件名
- `title?`: `string` - 视频标题（仅视频类型）
- `introduction?`: `string` - 视频描述（仅视频类型）

**返回**:
```typescript
{
  mediaId: string;
  type: string;
  createdAt: number;
  url?: string;
}
```

**API 端点**: `POST /cgi-bin/media/upload?type={type}`

#### `getMedia(mediaId)`

获取临时素材。

**参数**:
- `mediaId`: `string` - 素材ID

**返回**: `Buffer` - 文件数据

**API 端点**: `GET /cgi-bin/media/get?media_id={mediaId}`

#### `addNews(articles)`

新增永久图文素材。

**参数**:
- `articles`: `Array<Article>` - 文章列表

**Article 结构**:
```typescript
{
  title: string;
  author?: string;
  digest?: string;
  content: string;
  contentSourceUrl?: string;
  thumbMediaId: string;
  showCoverPic?: number;
  needOpenComment?: number;
  onlyFansCanComment?: number;
  isOriginal?: number;              // 是否声明原创（0/1）
  originalSourceUrl?: string;       // 原文链接（声明原创时可能需要）
}
```

**返回**:
```typescript
{
  mediaId: string;
}
```

**API 端点**: `POST /cgi-bin/material/add_news`

#### `addDraft(articles)`

新增草稿。

**参数**: 同 `addNews`

**返回**:
```typescript
{
  mediaId: string;
}
```

**API 端点**: `POST /cgi-bin/draft/add`

#### `publishDraft(mediaId)`

发布草稿。

**参数**:
- `mediaId`: `string` - 草稿ID

**返回**:
```typescript
{
  publishId: string;
  msgDataId: string;
}
```

**API 端点**: `POST /cgi-bin/freepublish/submit`

#### `uploadImg(formData)`

上传图文消息图片。

**参数**:
- `formData`: `FormData` - 包含图片的表单数据

**返回**:
```typescript
{
  url: string;
  errcode?: number;
  errmsg?: string;
}
```

**API 端点**: `POST /cgi-bin/media/uploadimg`

**限制**:
- 文件大小不超过 1MB
- 仅支持 JPG/PNG 格式

## 认证管理 API

**工具名称**: `wechat_auth`

**描述**: 管理微信公众号认证配置和 Access Token

### 操作类型

#### 1. configure - 配置微信公众号

**参数**:
- `action`: `"configure"`
- `appId`: `string` (必需) - 微信公众号 AppID
- `appSecret`: `string` (必需) - 微信公众号 AppSecret
- `token?`: `string` - 微信公众号 Token（可选，用于消息验证）
- `encodingAESKey?`: `string` - 微信公众号 EncodingAESKey（可选，用于消息加密）

**示例**:
```json
{
  "action": "configure",
  "appId": "wx1234567890abcdef",
  "appSecret": "your_app_secret",
  "token": "your_token",
  "encodingAESKey": "your_encoding_aes_key"
}
```

**返回**: 配置成功信息

#### 2. get_token - 获取 Access Token

**参数**:
- `action`: `"get_token"`

**返回**: Access Token 信息，包括：
- Token 值
- 剩余有效时间（秒）
- 过期时间

#### 3. refresh_token - 刷新 Access Token

**参数**:
- `action`: `"refresh_token"`

**返回**: 刷新后的 Access Token 信息

#### 4. get_config - 获取配置信息

**参数**:
- `action`: `"get_config"`

**返回**: 当前微信公众号配置信息（AppSecret 会被部分隐藏）

## 草稿管理 API

**工具名称**: `wechat_draft`

**描述**: 管理微信公众号草稿

### 操作类型

#### 1. add - 创建草稿

**参数**:
- `action`: `"add"`
- `articles`: `Array<Article>` (必需) - 文章列表

**Article 结构**:
```typescript
{
  title: string;                    // 标题（必需）
  author?: string;                  // 作者
  digest?: string;                   // 摘要
  content: string;                  // 文章内容（必需）
  contentSourceUrl?: string;        // 原文链接
  thumbMediaId: string;             // 封面图片媒体ID（必需）
  showCoverPic?: number;            // 是否显示封面图片（0/1）
  needOpenComment?: number;         // 是否开启评论（0/1）
  onlyFansCanComment?: number;      // 是否仅粉丝可评论（0/1）
  isOriginal?: number;              // 是否声明原创（0/1，需要公众号已开通原创声明功能）
  originalSourceUrl?: string;       // 原文链接（声明原创时可能需要）
}
```

**原创声明功能说明**:
- `isOriginal`: 设置为 `1` 表示声明原创，`0` 表示不声明（默认）
- `originalSourceUrl`: 如果文章在其他平台首发，可填写原文链接
- **重要**: 使用原创声明功能需要公众号已开通原创声明功能，否则会返回错误码 `85079`
- 开通条件：通常需要持续发布原创内容，近3个月发布至少5篇原创文章

**赞赏功能说明**:
- 赞赏功能**无法通过API直接配置**
- 需要在微信公众平台后台开通赞赏功能
- 开通条件：完成微信认证，签署《微信公众号赞赏协议》，绑定收款账户
- 开通后，如果文章满足条件，会自动支持赞赏功能

**API 端点**: `POST /cgi-bin/draft/add`

**返回**: 草稿ID和文章数量

#### 2. get - 获取草稿

**参数**:
- `action`: `"get"`
- `mediaId`: `string` (必需) - 草稿ID

**API 端点**: `POST /cgi-bin/draft/get`

**返回**: 草稿详细信息，包括：
- 草稿ID
- 创建时间
- 更新时间
- 文章列表（标题、作者、摘要、内容预览等）

#### 3. delete - 删除草稿

**参数**:
- `action`: `"delete"`
- `mediaId`: `string` (必需) - 草稿ID

**API 端点**: `POST /cgi-bin/draft/delete`

**返回**: 删除成功信息

#### 4. list - 获取草稿列表

**参数**:
- `action`: `"list"`
- `offset?`: `number` - 偏移量（默认0）
- `count?`: `number` - 数量（默认20）

**API 端点**: `POST /cgi-bin/draft/batchget`

**返回**: 草稿列表，包括：
- 草稿ID
- 标题
- 作者
- 创建时间
- 更新时间
- 文章数量

#### 5. count - 获取草稿统计

**参数**:
- `action`: `"count"`

**API 端点**: `POST /cgi-bin/draft/count`

**返回**: 草稿总数

## 发布管理 API

**工具名称**: `wechat_publish`

**描述**: 管理微信公众号文章发布

### 操作类型

#### 1. submit - 提交发布

**参数**:
- `action`: `"submit"`
- `mediaId`: `string` (必需) - 草稿ID

**API 端点**: `POST /cgi-bin/freepublish/submit`

**返回**: 
- 发布ID (`publishId`)
- 草稿ID
- 提示：发布结果将通过事件推送通知

**注意**: 发布是异步操作，需要通过事件推送或查询接口获取最终结果。

#### 2. get - 查询发布状态

**参数**:
- `action`: `"get"`
- `publishId`: `string` (必需) - 发布ID

**API 端点**: `POST /cgi-bin/freepublish/get`

**返回**: 发布状态信息，包括：
- 发布ID
- 发布状态（成功/发布失败/发布成功/发布中/原创失败）
- 文章数量
- 首篇标题和作者
- 文章链接
- 发布时间

**发布状态码**:
- `0`: 成功
- `1`: 发布失败
- `2`: 发布成功
- `3`: 发布中
- `4`: 原创失败

#### 3. delete - 删除发布

**参数**:
- `action`: `"delete"`
- `publishId`: `string` (必需) - 发布ID

**API 端点**: `POST /cgi-bin/freepublish/delete`

**返回**: 删除成功信息

**注意**: 删除发布不会删除草稿，如需删除草稿请使用草稿管理工具。

#### 4. list - 获取发布列表

**参数**:
- `action`: `"list"`
- `offset?`: `number` - 偏移量（默认0）
- `count?`: `number` - 数量（默认20）

**API 端点**: `POST /cgi-bin/freepublish/batchget`

**返回**: 发布列表，包括：
- 发布ID
- 发布状态
- 标题
- 作者
- 发布时间
- 文章链接
- 文章数量

## 临时素材 API

**工具名称**: `wechat_media_upload`

**描述**: 上传和管理微信公众号临时素材（图片、语音、视频、缩略图）

**有效期**: 3天

### 操作类型

#### 1. upload - 上传临时素材

**参数**:
- `action`: `"upload"`
- `type`: `"image" | "voice" | "video" | "thumb"` (必需) - 素材类型
- `filePath?`: `string` - 本地文件路径（与 fileData 二选一）
- `fileData?`: `string` - Base64编码的文件数据（与 filePath 二选一）
- `fileName?`: `string` - 文件名
- `title?`: `string` - 视频素材的标题（仅视频类型）
- `introduction?`: `string` - 视频素材的描述（仅视频类型）

**API 端点**: `POST /cgi-bin/media/upload?type={type}`

**返回**: 
- 素材ID (`mediaId`)
- 类型
- 创建时间

**限制**:
- 图片：2MB，支持 JPG/PNG
- 语音：2MB，播放长度不超过60秒，支持 AMR/MP3
- 视频：10MB，支持 MP4
- 缩略图：64KB，支持 JPG

#### 2. get - 获取临时素材

**参数**:
- `action`: `"get"`
- `mediaId`: `string` (必需) - 素材ID

**API 端点**: `GET /cgi-bin/media/get?media_id={mediaId}`

**返回**: 素材已下载到本地的提示信息

#### 3. list - 获取临时素材列表

**参数**:
- `action`: `"list"`

**返回**: 提示信息（暂不支持，建议使用永久素材功能）

## 永久素材 API

**工具名称**: `wechat_permanent_media`

**描述**: 管理微信公众号永久素材，支持添加、获取、删除、列表和统计操作

### 操作类型

#### 1. add - 添加永久素材

**参数**:
- `action`: `"add"`
- `type`: `"image" | "voice" | "video" | "thumb"` (必需) - 素材类型
- `filePath?`: `string` - 本地文件路径（与 fileData 二选一）
- `fileData?`: `string` - Base64编码的文件数据（与 filePath 二选一）
- `fileName?`: `string` - 文件名
- `title?`: `string` - 视频素材的标题（视频类型必需）
- `introduction?`: `string` - 视频素材的描述（视频类型必需）

**API 端点**: `POST /cgi-bin/material/add_material?type={type}`

**返回**: 
- 素材ID (`mediaId`)
- 素材URL（如果适用）

**限制**:
- 图片：2MB，支持 JPG/PNG
- 语音：2MB，播放长度不超过60秒，支持 AMR/MP3
- 视频：10MB，支持 MP4（需要标题和描述）
- 缩略图：64KB，支持 JPG

#### 2. get - 获取永久素材

**参数**:
- `action`: `"get"`
- `mediaId`: `string` (必需) - 素材ID

**API 端点**: `POST /cgi-bin/material/get_material`

**返回**: 
- 图文素材：返回文章列表详细信息
- 其他素材：返回素材ID、创建时间、URL等信息

#### 3. delete - 删除永久素材

**参数**:
- `action`: `"delete"`
- `mediaId`: `string` (必需) - 素材ID

**API 端点**: `POST /cgi-bin/material/del_material`

**返回**: 删除成功信息

#### 4. list - 获取永久素材列表

**参数**:
- `action`: `"list"`
- `type`: `"image" | "voice" | "video" | "thumb" | "news"` (必需) - 素材类型
- `offset?`: `number` - 偏移量（默认0）
- `count?`: `number` - 数量（默认20，最大20）

**API 端点**: `POST /cgi-bin/material/batchget_material`

**返回**: 
- 图文素材：返回素材ID、更新时间、文章列表
- 其他素材：返回素材ID、文件名、更新时间、URL

#### 5. count - 获取永久素材统计

**参数**:
- `action`: `"count"`

**API 端点**: `GET /cgi-bin/material/get_materialcount`

**返回**: 各类素材的统计信息：
- 图片素材数量
- 语音素材数量
- 视频素材数量
- 图文素材数量

## 图文消息图片上传 API

**工具名称**: `wechat_upload_img`

**描述**: 上传图文消息内所需的图片，不占用素材库限制

### 参数

- `filePath?`: `string` - 图片文件路径（与 fileData 二选一）
- `fileData?`: `string` - Base64编码的图片数据（与 filePath 二选一）
- `fileName?`: `string` - 文件名（可选，默认从路径提取或使用 image.jpg）

**API 端点**: `POST /cgi-bin/media/uploadimg`

**限制**:
- 文件大小不超过 1MB
- 仅支持 JPG/PNG 格式

**返回**: 
- 图片URL (`url`)
- 文件名
- 文件大小
- 格式

**用途**: 此接口上传的图片可以直接在图文消息的 content 字段中使用，不需要先上传到素材库。

## 错误处理

### 错误响应格式

所有 API 调用失败时，会返回包含 `isError: true` 的结果：

```typescript
{
  content: [{
    type: 'text',
    text: '错误信息描述'
  }],
  isError: true
}
```

### 常见错误码

微信公众号 API 返回的错误码（`errcode`）：

- `0`: 成功
- `40001`: 获取 access_token 时 AppSecret 错误，或者 access_token 无效
- `40013`: 不合法的 AppID
- `40014`: 不合法的 access_token
- `42001`: access_token 超时
- `45009`: 接口调用超过限制
- `61024`: 不是认证的服务号
- `85079`: 没有开通原创声明功能
- `85080`: 没有开通付费功能

### 错误处理机制

1. **自动 Token 刷新**: `WechatApiClient` 会自动处理 Access Token 的获取和刷新
2. **请求拦截**: 所有请求自动添加 `access_token` 参数
3. **响应拦截**: 统一处理错误响应
4. **日志记录**: 所有错误都会记录到日志中

### 最佳实践

1. **配置管理**: 使用 `wechat_auth` 工具的 `configure` 操作先配置 AppID 和 AppSecret
2. **Token 管理**: Token 会自动管理，无需手动刷新（除非需要强制刷新）
3. **错误重试**: 对于网络错误，建议实现重试机制
4. **素材管理**: 
   - 临时素材有效期3天，适合临时使用
   - 永久素材无有效期限制，适合长期使用
   - 图文消息图片上传不占用素材库，适合文章内图片

## API 端点汇总

| 功能 | 方法 | 端点 | 工具名称 |
|------|------|------|----------|
| 获取 Access Token | GET | `/cgi-bin/token` | 自动处理 |
| 上传临时素材 | POST | `/cgi-bin/media/upload` | `wechat_media_upload` |
| 获取临时素材 | GET | `/cgi-bin/media/get` | `wechat_media_upload` |
| 上传图文消息图片 | POST | `/cgi-bin/media/uploadimg` | `wechat_upload_img` |
| 新增永久图文素材 | POST | `/cgi-bin/material/add_news` | - |
| 新增永久素材 | POST | `/cgi-bin/material/add_material` | `wechat_permanent_media` |
| 获取永久素材 | POST | `/cgi-bin/material/get_material` | `wechat_permanent_media` |
| 删除永久素材 | POST | `/cgi-bin/material/del_material` | `wechat_permanent_media` |
| 获取永久素材列表 | POST | `/cgi-bin/material/batchget_material` | `wechat_permanent_media` |
| 获取永久素材统计 | GET | `/cgi-bin/material/get_materialcount` | `wechat_permanent_media` |
| 新增草稿 | POST | `/cgi-bin/draft/add` | `wechat_draft` |
| 获取草稿 | POST | `/cgi-bin/draft/get` | `wechat_draft` |
| 删除草稿 | POST | `/cgi-bin/draft/delete` | `wechat_draft` |
| 获取草稿列表 | POST | `/cgi-bin/draft/batchget` | `wechat_draft` |
| 获取草稿统计 | POST | `/cgi-bin/draft/count` | `wechat_draft` |
| 提交发布 | POST | `/cgi-bin/freepublish/submit` | `wechat_publish` |
| 查询发布状态 | POST | `/cgi-bin/freepublish/get` | `wechat_publish` |
| 删除发布 | POST | `/cgi-bin/freepublish/delete` | `wechat_publish` |
| 获取发布列表 | POST | `/cgi-bin/freepublish/batchget` | `wechat_publish` |

## 使用示例

### 1. 配置认证信息

```json
{
  "tool": "wechat_auth",
  "args": {
    "action": "configure",
    "appId": "wx1234567890abcdef",
    "appSecret": "your_app_secret"
  }
}
```

### 2. 创建草稿

```json
{
  "tool": "wechat_draft",
  "args": {
    "action": "add",
    "articles": [
      {
        "title": "文章标题",
        "author": "作者名",
        "content": "<p>文章内容</p>",
        "thumbMediaId": "封面图片媒体ID"
      }
    ]
  }
}
```

### 3. 提交发布

```json
{
  "tool": "wechat_publish",
  "args": {
    "action": "submit",
    "mediaId": "草稿ID"
  }
}
```

### 4. 上传永久素材

```json
{
  "tool": "wechat_permanent_media",
  "args": {
    "action": "add",
    "type": "image",
    "filePath": "/path/to/image.jpg"
  }
}
```

### 5. 上传图文消息图片

```json
{
  "tool": "wechat_upload_img",
  "args": {
    "filePath": "/path/to/image.jpg"
  }
}
```

## 注意事项

1. **Access Token**: 所有 API 调用都需要 Access Token，系统会自动管理
2. **素材限制**: 注意各类素材的大小和格式限制
3. **发布流程**: 发布是异步操作，需要通过事件推送或查询接口获取结果
4. **草稿与发布**: 草稿和发布是分开管理的，删除发布不会删除草稿
5. **素材类型**: 临时素材和永久素材是不同的接口，注意区分使用场景
6. **图文消息图片**: 使用 `wechat_upload_img` 上传的图片可以直接在文章内容中使用

## 相关文件

- API 客户端: `src/wechat/api-client.ts`
- 认证管理器: `src/auth/auth-manager.ts`
- MCP 工具: `src/mcp-tool/tools/`
- 类型定义: `src/mcp-tool/types.ts`

