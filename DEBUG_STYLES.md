# 调试预览样式指南

## 在浏览器开发者工具中检查样式

### 方法一：使用元素检查器（推荐）

1. **打开开发者工具**
   - 按 `F12` 或 `Ctrl+Shift+I`（Windows/Linux）
   - 或 `Cmd+Option+I`（Mac）
   - 或右键页面 → 选择"检查"/"Inspect"

2. **选择元素**
   - 点击左上角的"选择元素"图标（或按 `Ctrl+Shift+C` / `Cmd+Option+C`）
   - 在预览面板中点击粗体或斜体文本
   - 或直接在 Elements/元素面板中查找 `<strong>` 或 `<em>` 标签

3. **查看样式**
   - 右侧面板会显示该元素的所有样式规则
   - 查看 `font-weight` 和 `font-style` 的值
   - **注意**：如果有删除线（~~），表示该样式被其他规则覆盖了

4. **查看计算样式（Computed）**
   - 在右侧样式面板中，找到"Computed"（计算样式）标签页
   - 搜索 `font-weight` 和 `font-style`
   - 这里显示的是**最终应用的值**

### 方法二：使用控制台检查

在控制台（Console）中运行以下命令：

```javascript
// 检查所有 strong 元素
document.querySelectorAll('#output strong, .markdown-preview strong').forEach((el, i) => {
  const styles = window.getComputedStyle(el);
  console.log(`Strong ${i + 1}:`, {
    element: el,
    text: el.textContent,
    fontWeight: styles.fontWeight,
    fontStyle: styles.fontStyle,
    display: styles.display
  });
});

// 检查所有 em 元素
document.querySelectorAll('#output em, .markdown-preview em').forEach((el, i) => {
  const styles = window.getComputedStyle(el);
  console.log(`Em ${i + 1}:`, {
    element: el,
    text: el.textContent,
    fontWeight: styles.fontWeight,
    fontStyle: styles.fontStyle,
    display: styles.display
  });
});
```

### 方法三：检查样式来源

在 Elements 面板中选中元素后，在右侧 Styles 面板中：

1. **查看所有应用的规则**
   - 每个规则都会显示文件名和行号
   - 例如：`Preview.tsx:183` 表示来自 Preview.tsx 文件的第 183 行

2. **查看被覆盖的样式**
   - 有删除线的样式表示被其他规则覆盖
   - 点击删除线可以查看是哪个规则覆盖了它

3. **临时修改样式测试**
   - 双击样式值可以临时修改
   - 这样可以测试不同的值是否有效

### 常见问题排查

#### 问题 1：font-weight 显示为 400（正常）而不是 700（粗体）

**检查步骤：**
1. 在 Computed 面板查看 `font-weight` 的实际值
2. 在 Styles 面板查看是否有规则覆盖了 `font-weight: 700`
3. 检查是否有 Tailwind 的 reset 样式（通常在 `index.css` 中）

**解决方案：**
- 确保 CSS 选择器优先级足够高
- 使用 `!important`（已在代码中应用）
- 检查是否有内联样式覆盖

#### 问题 2：font-style 显示为 normal 而不是 italic

**检查步骤：**
1. 在 Computed 面板查看 `font-style` 的实际值
2. 检查是否有父元素设置了 `font-style: normal`

**解决方案：**
- 确保 `em` 和 `i` 标签的样式使用了 `!important`
- 检查 JavaScript 强制设置的代码是否执行

#### 问题 3：样式在控制台显示正确，但页面显示不对

这可能是字体本身的问题：
- 某些字体可能没有粗体或斜体变体
- 浏览器可能会使用 faux bold/italic（模拟粗体/斜体）

**检查方法：**
```javascript
// 检查字体族
const el = document.querySelector('#output strong');
const styles = window.getComputedStyle(el);
console.log('Font family:', styles.fontFamily);
console.log('Font weight:', styles.fontWeight);
console.log('Font style:', styles.fontStyle);
```

### 快速测试命令

在控制台中运行这个命令，可以快速检查所有样式问题：

```javascript
(function() {
  const output = document.querySelector('#output');
  if (!output) {
    console.error('找不到 #output 元素');
    return;
  }
  
  const strongs = output.querySelectorAll('strong, b');
  const ems = output.querySelectorAll('em, i');
  
  console.group('📊 样式检查报告');
  
  console.group('粗体元素 (' + strongs.length + ' 个)');
  strongs.forEach((el, i) => {
    const styles = window.getComputedStyle(el);
    const isBold = parseInt(styles.fontWeight) >= 600;
    console.log(`${i + 1}. "${el.textContent.substring(0, 20)}"`, {
      fontWeight: styles.fontWeight,
      fontStyle: styles.fontStyle,
      isBold: isBold ? '✅' : '❌',
      inlineStyle: el.style.cssText
    });
  });
  console.groupEnd();
  
  console.group('斜体元素 (' + ems.length + ' 个)');
  ems.forEach((el, i) => {
    const styles = window.getComputedStyle(el);
    const isItalic = styles.fontStyle === 'italic';
    console.log(`${i + 1}. "${el.textContent.substring(0, 20)}"`, {
      fontStyle: styles.fontStyle,
      fontWeight: styles.fontWeight,
      isItalic: isItalic ? '✅' : '❌',
      inlineStyle: el.style.cssText
    });
  });
  console.groupEnd();
  
  console.groupEnd();
})();
```

### 截图位置参考

在开发者工具中，你应该能看到类似这样的结构：

```
Elements 面板：
└── <section id="output" class="markdown-preview">
    └── <p>
        ├── <strong>粗体文本</strong>  ← 选中这个
        └── <em>斜体文本</em>        ← 或这个

Styles 面板（右侧）：
├── element.style { ... }           ← 内联样式
├── .markdown-preview strong { ... } ← 我们的 CSS
└── Computed 标签页                ← 最终计算值
```

### 如果样式仍然不对

1. **检查是否有其他 CSS 文件覆盖**
   - 在 Styles 面板中查看所有应用的规则
   - 查找是否有其他文件（如 `index.css`）设置了冲突的样式

2. **检查 JavaScript 是否执行**
   - 在控制台运行：`document.querySelectorAll('#output strong').length`
   - 如果返回 0，说明元素还没有渲染

3. **清除缓存并硬刷新**
   - `Ctrl+Shift+R`（Windows/Linux）
   - `Cmd+Shift+R`（Mac）
