# md-editor 第二阶段迁移计划

> 更新时间：2025-01-XX

## 概述

第二阶段主要移植 3rd/md 中的**基础功能组件**，包括对话框、菜单、搜索等核心 UI 组件。

## 第一阶段完成情况 ✅

- [x] 核心编辑器功能（CodemirrorEditor）
- [x] 预览面板（Preview）
- [x] 编辑器状态管理（editor-store）
- [x] 渲染状态管理（render-store）
- [x] 滚动同步（useEditorSync）
- [x] 基础主题支持（暗黑模式）
- [x] 中文粗体/斜体显示修复

## 第二阶段功能清单

### 1. 编辑器头部菜单（EditorHeader）🔴 高优先级

**功能**：完整的菜单栏，包含文件、编辑、格式、插入、样式、视图等菜单

**需要转换的组件**：
- `3rd/md/apps/web/src/components/editor/editor-header/index.vue` → `src/md-editor/components/EditorHeader.tsx`
- `EditDropdown.vue` → `EditorHeader/EditDropdown.tsx`
- `FileDropdown.vue` → `EditorHeader/FileDropdown.tsx`
- `FormatDropdown.vue` → `EditorHeader/FormatDropdown.tsx`
- `InsertDropdown.vue` → `EditorHeader/InsertDropdown.tsx`
- `StyleDropdown.vue` → `EditorHeader/StyleDropdown.tsx`
- `ViewDropdown.vue` → `EditorHeader/ViewDropdown.tsx`

**主要功能**：
- 文件操作（新建、打开、保存、导出）
- 编辑操作（撤销、重做、查找、替换）
- 格式操作（加粗、斜体、标题等）
- 插入操作（图片、链接、表格等）
- 样式设置（字体、字号、颜色等）
- 视图切换（预览、全屏等）

**依赖**：
- 需要转换 UI 组件库（Dialog, DropdownMenu 等）

### 2. 对话框组件 🔴 高优先级

#### 2.1 上传图片对话框（UploadImgDialog）
- **位置**：`3rd/md/apps/web/src/components/editor/UploadImgDialog.vue`
- **功能**：上传图片到图床，插入图片到编辑器
- **转换**：`src/md-editor/components/dialogs/UploadImgDialog.tsx`

#### 2.2 插入表格对话框（InsertFormDialog）
- **位置**：`3rd/md/apps/web/src/components/editor/InsertFormDialog.vue`
- **功能**：插入表格到编辑器
- **转换**：`src/md-editor/components/dialogs/InsertTableDialog.tsx`

#### 2.3 插入小程序卡片对话框（InsertMpCardDialog）
- **位置**：`3rd/md/apps/web/src/components/editor/InsertMpCardDialog.vue`
- **功能**：插入微信小程序卡片
- **转换**：`src/md-editor/components/dialogs/InsertMpCardDialog.tsx`

#### 2.4 模板对话框（TemplateDialog）
- **位置**：`3rd/md/apps/web/src/components/editor/TemplateDialog.vue`
- **功能**：选择和使用模板
- **转换**：`src/md-editor/components/dialogs/TemplateDialog.tsx`

#### 2.5 关于对话框（AboutDialog）
- **位置**：`3rd/md/apps/web/src/components/editor/editor-header/AboutDialog.vue`
- **功能**：显示关于信息
- **转换**：`src/md-editor/components/dialogs/AboutDialog.tsx`

### 3. 右键菜单（EditorContextMenu）🟡 中优先级

**位置**：`3rd/md/apps/web/src/components/editor/EditorContextMenu.vue`

**功能**：
- 复制/粘贴
- 格式化文档
- 导入/导出
- 重置样式
- 清空内容

**转换**：`src/md-editor/components/EditorContextMenu.tsx`

**依赖**：
- 需要转换 ContextMenu UI 组件

### 4. 搜索功能（SearchTab）🟡 中优先级

**位置**：`3rd/md/apps/web/src/components/ui/search-tab/SearchTab.vue`

**功能**：
- 在编辑器中搜索文本
- 替换文本
- 跳转到匹配位置

**转换**：`src/md-editor/components/SearchTab.tsx`

**依赖**：
- CodeMirror 的搜索扩展（`@codemirror/search`）

### 5. 浮动目录（FloatingToc）🟡 中优先级

**位置**：`3rd/md/apps/web/src/components/editor/FloatingToc.vue`

**功能**：
- 显示文章标题列表
- 点击跳转到对应位置
- 浮动显示在预览面板

**转换**：`src/md-editor/components/FloatingToc.tsx`

**依赖**：
- 需要从 render-store 获取标题列表

### 6. 右侧面板（RightSlider）🟢 低优先级

**位置**：`3rd/md/apps/web/src/components/editor/RightSlider.vue`

**功能**：
- 字体设置
- 字号设置
- 主题颜色
- 代码块主题
- 预览宽度

**转换**：`src/md-editor/components/RightSlider.tsx`

**依赖**：
- 需要扩展 theme-store

### 7. 主题定制器（ThemeCustomizer）🟢 低优先级

**位置**：`3rd/md/apps/web/src/components/editor/ThemeCustomizer.vue`

**功能**：
- 自定义主题样式
- 预览主题效果

**转换**：`src/md-editor/components/ThemeCustomizer.tsx`

### 8. CSS 编辑器（CssEditor）🟢 低优先级

**位置**：`3rd/md/apps/web/src/components/editor/CssEditor.vue`

**功能**：
- 编辑自定义 CSS
- 实时预览效果

**转换**：`src/md-editor/components/CssEditor.tsx`

## 需要转换的 UI 组件库

3rd/md 使用了自定义的 UI 组件库（基于 Radix Vue），需要转换为 React 版本：

### 高优先级组件
- [ ] Dialog（对话框）
- [ ] DropdownMenu（下拉菜单）
- [ ] ContextMenu（右键菜单）
- [ ] Button（按钮）
- [ ] Input（输入框）
- [ ] Select（选择器）

### 中优先级组件
- [ ] Tabs（标签页）
- [ ] Popover（弹出框）
- [ ] Tooltip（提示）
- [ ] Switch（开关）

### 低优先级组件
- [ ] Alert（警告）
- [ ] Progress（进度条）
- [ ] Separator（分隔符）

**方案**：
1. 使用现有的 React UI 库（如 shadcn/ui React 版本）
2. 或手动转换关键组件

## 需要扩展的 Store

### 1. UI Store（新增）
- 对话框显示状态
- 面板显示状态
- 移动端适配

### 2. Theme Store（扩展）
- 字体配置
- 字号配置
- 主题颜色
- 代码块主题
- 预览宽度

### 3. Export Store（新增）
- 导出 HTML
- 导出 Markdown
- 导出图片

## 实施建议

### 优先级排序

1. **第一阶段**（已完成）✅
   - 核心编辑器
   - 预览面板
   - 基础状态管理

2. **第二阶段 - 核心功能**（当前阶段）🔴
   - EditorHeader（菜单栏）
   - UploadImgDialog（上传图片）
   - InsertTableDialog（插入表格）
   - EditorContextMenu（右键菜单）
   - SearchTab（搜索功能）

3. **第二阶段 - 增强功能**（后续）🟡
   - FloatingToc（浮动目录）
   - RightSlider（右侧面板）
   - ThemeCustomizer（主题定制）

4. **第三阶段**（未来）
   - 文件夹管理
   - 文章管理
   - AI 功能
   - 其他高级功能

### 技术要点

1. **UI 组件转换**
   - 优先使用现有的 React UI 库
   - 或参考 shadcn/ui React 版本
   - 保持与 3rd/md 相同的交互体验

2. **状态管理**
   - 继续使用 Zustand
   - 保持隔离的 store 结构
   - 逐步扩展功能

3. **代码组织**
   - 保持 `src/md-editor` 目录结构
   - 组件按功能分类
   - 便于后续合并到主代码库

## 下一步行动

1. **选择 UI 组件库**
   - 评估 shadcn/ui React 版本
   - 或使用项目现有的 UI 组件

2. **开始转换 EditorHeader**
   - 先转换主组件
   - 再逐个转换下拉菜单

3. **转换对话框组件**
   - 从最常用的开始（UploadImgDialog）
   - 逐步完成其他对话框

4. **测试和优化**
   - 确保功能完整性
   - 优化用户体验

## 参考文件

- 3rd/md 源码：`3rd/md/apps/web/src/components/editor/`
- 当前项目：`src/md-editor/`
- 测试页面：`src/pages/EditorV2.tsx`
