# 微信公众号 API 概览

> 更新时间：2025-12-28 13:58:47

## 快速参考

本项目提供了 6 个 MCP 工具，封装了微信公众号的主要 API 功能。

### 工具列表

| 工具名称 | 功能描述 | 主要操作 |
|---------|---------|---------|
| `wechat_auth` | 认证管理 | configure, get_token, refresh_token, get_config |
| `wechat_draft` | 草稿管理 | add, get, delete, list, count |
| `wechat_publish` | 发布管理 | submit, get, delete, list |
| `wechat_media_upload` | 临时素材 | upload, get, list |
| `wechat_permanent_media` | 永久素材 | add, get, delete, list, count |
| `wechat_upload_img` | 图文图片上传 | upload |

## API 端点映射

### 认证相关
- `GET /cgi-bin/token` - 获取 Access Token（自动处理）

### 素材相关
- `POST /cgi-bin/media/upload` - 上传临时素材
- `GET /cgi-bin/media/get` - 获取临时素材
- `POST /cgi-bin/media/uploadimg` - 上传图文消息图片
- `POST /cgi-bin/material/add_material` - 添加永久素材
- `POST /cgi-bin/material/get_material` - 获取永久素材
- `POST /cgi-bin/material/del_material` - 删除永久素材
- `POST /cgi-bin/material/batchget_material` - 获取永久素材列表
- `GET /cgi-bin/material/get_materialcount` - 获取永久素材统计

### 草稿相关
- `POST /cgi-bin/draft/add` - 新增草稿
- `POST /cgi-bin/draft/get` - 获取草稿
- `POST /cgi-bin/draft/delete` - 删除草稿
- `POST /cgi-bin/draft/batchget` - 获取草稿列表
- `POST /cgi-bin/draft/count` - 获取草稿统计

### 发布相关
- `POST /cgi-bin/freepublish/submit` - 提交发布
- `POST /cgi-bin/freepublish/get` - 查询发布状态
- `POST /cgi-bin/freepublish/delete` - 删除发布
- `POST /cgi-bin/freepublish/batchget` - 获取发布列表

## 典型工作流程

### 1. 发布文章流程

```
配置认证 → 上传封面图 → 创建草稿 → 提交发布 → 查询发布状态
```

**步骤**:
1. `wechat_auth` - configure（配置 AppID 和 AppSecret）
2. `wechat_permanent_media` - add（上传封面图片，获取 thumbMediaId）
3. `wechat_draft` - add（创建草稿，使用 thumbMediaId）
4. `wechat_publish` - submit（提交发布）
5. `wechat_publish` - get（查询发布状态）

### 2. 上传图片到文章内容

```
上传图文消息图片 → 在文章内容中使用返回的 URL
```

**步骤**:
1. `wechat_upload_img` - upload（上传图片）
2. 在草稿的 `content` 字段中使用返回的 `url`

## 数据流

```
MCP 工具调用
    ↓
WechatMcpTool.callTool()
    ↓
工具处理器 (handler)
    ↓
WechatApiClient
    ↓
AuthManager.getAccessToken() (自动)
    ↓
微信公众号 API
```

## 关键限制

### 素材限制

| 类型 | 大小限制 | 格式 | 有效期 |
|------|---------|------|--------|
| 临时图片 | 2MB | JPG/PNG | 3天 |
| 临时语音 | 2MB | AMR/MP3 | 3天 |
| 临时视频 | 10MB | MP4 | 3天 |
| 临时缩略图 | 64KB | JPG | 3天 |
| 永久图片 | 2MB | JPG/PNG | 永久 |
| 永久语音 | 2MB | AMR/MP3 | 永久 |
| 永久视频 | 10MB | MP4 | 永久 |
| 永久缩略图 | 64KB | JPG | 永久 |
| 图文消息图片 | 1MB | JPG/PNG | 永久 |

### 其他限制

- Access Token 有效期：7200秒（2小时），自动刷新
- 草稿列表：每次最多返回20条
- 发布列表：每次最多返回20条
- 永久素材列表：每次最多返回20条

## 错误处理

所有 API 调用失败时返回：
```json
{
  "content": [{
    "type": "text",
    "text": "错误信息"
  }],
  "isError": true
}
```

常见错误：
- `40001`: AppSecret 错误或 access_token 无效
- `40013`: 不合法的 AppID
- `42001`: access_token 超时（会自动刷新）
- `61024`: 不是认证的服务号
- `85079`: 没有开通原创声明功能

## 相关文档

详细 API 文档请参考：[API.md](./API.md)

