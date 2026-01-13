# 3rd/md 预览面板 Markdown 渲染技术方案分析

## 概述

本文档分析了 `3rd/md` 项目中预览面板如何正确显示 Markdown 内容（特别是中文粗体和斜体）的技术方案。

## 核心技术方案

### 1. 字体配置策略

**关键发现：3rd/md 通过配置支持中文粗体/斜体的字体族来解决中文显示问题。**

#### 字体族配置位置
- **文件**：`3rd/md/packages/shared/src/configs/style.ts`
- **默认字体族**（无衬线）：
  ```typescript
  `-apple-system-font,BlinkMacSystemFont, Helvetica Neue, PingFang SC, Hiragino Sans GB , Microsoft YaHei UI , Microsoft YaHei ,Arial,sans-serif`
  ```

#### 字体族特点
1. **PingFang SC**（macOS/iOS）
   - 支持粗体（font-weight: 700）
   - 支持斜体（font-style: italic）
   - 专为中文设计

2. **Microsoft YaHei**（Windows）
   - 支持粗体
   - 斜体支持有限

3. **Hiragino Sans GB**（macOS）
   - 支持粗体和斜体

4. **系统字体回退**
   - `-apple-system`、`BlinkMacSystemFont` 等系统字体作为后备

### 2. CSS 变量系统

#### CSS 变量定义
- **文件**：`3rd/md/packages/core/src/theme/cssVariables.ts`
- **变量**：`--md-font-family` 用于设置字体族

```css
:root {
  --md-font-family: ${config.fontFamily};
  --md-font-size: ${config.fontSize};
  --md-primary-color: ${config.primaryColor};
}
```

#### 基础样式应用
- **文件**：`3rd/md/packages/shared/src/configs/theme-css/base.css`
- **关键代码**：
  ```css
  #output {
    font-family: var(--md-font-family);
    font-size: var(--md-font-size);
    line-height: 1.75;
    text-align: left;
  }
  ```

### 3. 主题系统架构

#### 主题应用流程
1. **CSS 变量生成** → `generateCSSVariables()`
2. **主题 CSS 加载** → 从 `themeMap` 加载主题样式
3. **作用域包装** → `wrapCSSWithScope()` 限制样式作用域到 `#output`
4. **CSS 注入** → 通过 `ThemeInjector` 注入到页面 `<style>` 标签

#### 关键文件
- `3rd/md/packages/core/src/theme/themeApplicator.ts` - 主题应用器
- `3rd/md/packages/core/src/theme/cssScopeWrapper.ts` - CSS 作用域包装
- `3rd/md/packages/core/src/theme/themeInjector.ts` - CSS 注入器

### 4. 渲染流程

#### Markdown 渲染
1. **解析**：使用 `marked` 解析 Markdown
2. **后处理**：`postProcessHtml()` 处理 HTML
3. **输出**：通过 `v-html` 渲染到 `<section id="output">`

#### 关键代码位置
- **渲染 Store**：`3rd/md/apps/web/src/stores/render.ts`
- **渲染器初始化**：`3rd/md/packages/core/src/renderer/renderer-impl.ts`
- **预览组件**：`3rd/md/apps/web/src/views/CodemirrorEditor.vue` (第 745 行)

```vue
<section id="output" class="w-full" v-html="output" />
```

### 5. 粗体和斜体处理

#### 重要发现
**3rd/md 没有为 `strong` 和 `em` 标签设置特殊的 CSS 样式！**

- 没有在主题 CSS 中定义 `strong` 或 `em` 的样式
- 完全依赖：
  1. **浏览器默认样式**：`<strong>` 默认 `font-weight: bold`，`<em>` 默认 `font-style: italic`
  2. **字体文件支持**：字体文件本身包含粗体和斜体变体

#### 为什么中文粗体/斜体能正确显示？
1. **字体选择**：使用了支持中文粗体/斜体的字体（PingFang SC、Microsoft YaHei）
2. **字体回退机制**：字体栈按优先级回退，确保至少有一个字体支持粗体/斜体
3. **浏览器渲染**：现代浏览器能正确识别并使用字体的粗体/斜体变体

### 6. 样式作用域

#### CSS 作用域限制
- 所有主题样式都通过 `wrapCSSWithScope()` 添加 `#output` 前缀
- 确保样式只影响预览区域，不影响编辑器

#### 示例
```css
/* 原始 CSS */
h1 { font-weight: bold; }

/* 作用域包装后 */
#output h1 { font-weight: bold; }
```

## 技术方案总结

### 核心策略
1. **字体优先**：使用支持中文粗体/斜体的字体族
2. **CSS 变量**：通过 CSS 变量统一管理字体配置
3. **主题系统**：模块化的主题系统，支持自定义
4. **作用域隔离**：样式限制在预览区域，避免污染

### 与当前项目的差异

| 特性 | 3rd/md | 当前项目 |
|------|--------|----------|
| 字体配置 | 通过 CSS 变量 `--md-font-family` | 直接在组件中设置 |
| 粗体/斜体处理 | 依赖字体和浏览器默认样式 | 使用 `!important` 强制设置 |
| 主题系统 | 完整的主题系统，支持自定义 | 简单的内联样式 |
| 样式作用域 | 通过 `#output` 限制作用域 | 通过 `.markdown-preview` 类 |

## 建议的改进方案

### 1. 采用 3rd/md 的字体配置
```typescript
const chineseFontFamily = `-apple-system-font,BlinkMacSystemFont, Helvetica Neue, PingFang SC, Hiragino Sans GB , Microsoft YaHei UI , Microsoft YaHei ,Arial,sans-serif`
```

### 2. 简化 CSS 样式
- 移除 `strong` 和 `em` 的 `!important` 强制样式
- 依赖浏览器默认样式和字体支持
- 只在字体族中确保包含支持中文粗体/斜体的字体

### 3. 使用 CSS 变量
- 将字体配置提取为 CSS 变量
- 便于统一管理和主题切换

### 4. 参考代码结构
```css
/* 基础样式 */
#output {
  font-family: var(--md-font-family);
}

/* 不需要为 strong/em 设置特殊样式，依赖浏览器默认和字体支持 */
```

## 关键文件清单

1. **字体配置**：`3rd/md/packages/shared/src/configs/style.ts`
2. **CSS 变量**：`3rd/md/packages/core/src/theme/cssVariables.ts`
3. **基础样式**：`3rd/md/packages/shared/src/configs/theme-css/base.css`
4. **主题应用**：`3rd/md/packages/core/src/theme/themeApplicator.ts`
5. **渲染 Store**：`3rd/md/apps/web/src/stores/render.ts`
6. **预览组件**：`3rd/md/apps/web/src/views/CodemirrorEditor.vue`

## 结论

3rd/md 的技术方案核心是：
- **选择合适的字体**：使用支持中文粗体/斜体的字体族
- **依赖浏览器默认行为**：不强制设置样式，让浏览器和字体自然处理
- **统一的配置管理**：通过 CSS 变量和主题系统统一管理样式

这种方案比强制使用 `!important` 更优雅，也更符合 Web 标准。
