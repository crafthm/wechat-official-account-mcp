# md-editor 测试指南

## 快速开始

### 1. 安装可选依赖（推荐，以获得完整功能）

```bash
npm install @codemirror/autocomplete@^6.18.0 @codemirror/commands@^6.5.0 @codemirror/language-data@^6.1.0 @codemirror/search@^6.5.7 @codemirror/language@^6.10.0
```

**注意**：即使不安装这些依赖，编辑器也能运行，只是部分功能（如历史记录、自动补全等）会被禁用。

### 2. 启动开发服务器

```bash
npm run dev:web
```

### 3. 访问测试页面

打开浏览器访问：`http://localhost:5173/editor-v2`

## 测试功能清单

### 基础功能
- [x] 编辑器可以正常显示
- [x] 可以输入和编辑 Markdown 文本
- [x] 预览面板可以正常显示
- [x] 暗黑模式切换功能
- [x] 布局切换功能（左侧/右侧编辑）
- [ ] 滚动同步功能（编辑器和预览面板）

### 快捷键测试
- [ ] Ctrl/Cmd + B - 加粗
- [ ] Ctrl/Cmd + I - 斜体
- [ ] Ctrl/Cmd + D - 删除线
- [ ] Ctrl/Cmd + K - 插入链接
- [ ] Ctrl/Cmd + E - 插入代码
- [ ] Ctrl/Cmd + 1-6 - 标题级别
- [ ] Ctrl/Cmd + U - 无序列表
- [ ] Ctrl/Cmd + O - 有序列表
- [ ] Shift + Alt + F - 格式化文档

## 已知问题

1. **渲染功能**：目前是简化版本，使用基础的 marked 解析，不支持完整的主题系统
2. **搜索功能**：尚未实现
3. **对话框组件**：尚未转换（上传图片、插入表格等）
4. **滚动同步**：已实现框架，但可能需要调试

## 文件结构

```
src/md-editor/
├── components/
│   ├── CodemirrorEditor.tsx  # 主编辑器组件
│   ├── Preview.tsx            # 预览组件
│   └── index.ts
├── stores/
│   ├── editor-store.ts        # 编辑器状态管理
│   ├── render-store.ts        # 渲染状态管理
│   └── index.ts
├── lib/
│   ├── editor/
│   │   ├── markdown.ts        # Markdown 编辑器配置
│   │   ├── format.ts         # 格式化功能
│   │   ├── themes.ts         # 主题配置
│   │   ├── basicSetup.ts     # 基础设置
│   │   └── index.ts
│   └── utils/
│       └── fileHelpers.ts    # 文件工具函数
├── hooks/
│   └── useEditorSync.ts      # 滚动同步 Hook
└── index.ts
```

## 下一步

1. ✅ 测试基础功能是否正常工作
2. ✅ 如果发现问题，记录并修复
3. 🔄 **第二阶段迁移**：开始实现核心功能组件
   - 编辑器头部菜单（EditorHeader）
   - 对话框组件（上传图片、插入表格等）
   - 右键菜单（EditorContextMenu）
   - 搜索功能（SearchTab）
   - 浮动目录（FloatingToc）

详细计划请参考：`doc/MD_EDITOR_PHASE2_PLAN.md`
