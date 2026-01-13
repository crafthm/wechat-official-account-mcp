import { useEffect, useRef, forwardRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { useMdRenderStore } from '../stores/render-store';

interface PreviewProps {
  content: string;
  className?: string;
}

/**
 * 预览组件（隔离版本）
 * 从 3rd/md 转换而来
 */
export const Preview = forwardRef<HTMLDivElement, PreviewProps>(
  ({ content, className = '' }, ref) => {
    const previewRef = useRef<HTMLDivElement>(null);
    const { output, setOutput } = useMdRenderStore();
    
    // 合并外部 ref 和内部 ref
    const mergedRef = (node: HTMLDivElement | null) => {
      previewRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    // 渲染 Markdown 内容
    useEffect(() => {
      // 如果 content 为空，清空输出
      if (!content || content.trim() === '') {
        setOutput('');
        return;
      }

      // 使用 marked 解析 Markdown
      try {
        // 配置 marked 选项
        marked.setOptions({
          breaks: true, // 启用换行支持
          gfm: true, // 启用 GitHub Flavored Markdown
        });

        // 使用自定义渲染器来添加标题 ID
        const renderer = new marked.Renderer();
        let headingIndex = 0;
        
        // 重写标题渲染器，添加 ID 和 data-heading 属性
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach((tag, level) => {
          const originalRenderer = (renderer as any)[tag];
          (renderer as any)[tag] = (text: string) => {
            const id = `heading-${headingIndex++}`;
            return `<${tag} id="${id}" data-heading="true">${text}</${tag}>`;
          };
        });
        
        marked.setOptions({
          breaks: true,
          gfm: true,
          renderer,
        });
        
        const html = marked.parse(content) as string;
        setOutput(html);
        
        // 提取标题（用于目录）
        const div = document.createElement('div');
        div.innerHTML = html;
        const headings = div.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        const titleList: Array<{ url: string; title: string; level: number }> = [];
        headings.forEach((heading) => {
          const level = parseInt(heading.tagName.slice(1));
          const title = heading.textContent || '';
          const id = heading.getAttribute('id') || '';
          const url = id ? `#${id}` : '';
          if (url) {
            titleList.push({ url, title, level });
          }
        });
        
        // 更新标题列表到 store
        const { setTitleList } = useMdRenderStore.getState();
        setTitleList(titleList);
      } catch (error) {
        console.error('Render error:', error);
        setOutput('<p style="color: red;">渲染错误：' + String(error) + '</p>');
      }
    }, [content, setOutput]);

    // 代码高亮和字体检测
    useEffect(() => {
      if (previewRef.current) {
        const codeBlocks = previewRef.current.querySelectorAll('pre code');
        codeBlocks.forEach((block) => {
          if (block instanceof HTMLElement && !block.classList.contains('hljs')) {
            hljs.highlightElement(block);
          }
        });
        
        // 检测字体支持并应用
        const detectAndApplyFonts = () => {
          // 测试常用中文字体
          const fontsToTest = [
            'PingFang SC',
            'Hiragino Sans GB',
            'Microsoft YaHei',
            'Microsoft YaHei UI',
            'Source Han Sans SC',
            'Noto Sans SC',
            'SimHei',
            '-apple-system',
            'BlinkMacSystemFont',
            'Arial',
            'sans-serif',
          ];
          
          // 测试每个字体
          const fontResults: Array<{ font: string; supportsBold: boolean; supportsItalic: boolean }> = [];
          
          fontsToTest.forEach(font => {
            const testEl = document.createElement('span');
            testEl.style.position = 'absolute';
            testEl.style.visibility = 'hidden';
            testEl.style.fontFamily = font;
            testEl.style.fontSize = '20px';
            testEl.textContent = '测试';
            document.body.appendChild(testEl);
            
            // 测试粗体
            const boldEl = document.createElement('span');
            boldEl.style.position = 'absolute';
            boldEl.style.visibility = 'hidden';
            boldEl.style.fontFamily = font;
            boldEl.style.fontWeight = 'bold';
            boldEl.style.fontSize = '20px';
            boldEl.textContent = '测试';
            document.body.appendChild(boldEl);
            
            // 测试斜体
            const italicEl = document.createElement('span');
            italicEl.style.position = 'absolute';
            italicEl.style.visibility = 'hidden';
            italicEl.style.fontFamily = font;
            italicEl.style.fontStyle = 'italic';
            italicEl.style.fontSize = '20px';
            italicEl.textContent = '测试';
            document.body.appendChild(italicEl);
            
            const normalStyle = window.getComputedStyle(testEl);
            const boldStyle = window.getComputedStyle(boldEl);
            const italicStyle = window.getComputedStyle(italicEl);
            
            const normalWeight = parseInt(normalStyle.fontWeight);
            const boldWeight = parseInt(boldStyle.fontWeight);
            const supportsBold = boldWeight >= 600 && boldWeight > normalWeight;
            const supportsItalic = italicStyle.fontStyle === 'italic';
            
            fontResults.push({ font, supportsBold, supportsItalic });
            
            // 清理
            document.body.removeChild(testEl);
            document.body.removeChild(boldEl);
            document.body.removeChild(italicEl);
          });
          
          // 输出检测结果到控制台
          console.group('🔍 字体支持检测结果');
          fontResults.forEach(result => {
            console.log(`${result.font}:`, {
              '支持粗体': result.supportsBold ? '✅' : '❌',
              '支持斜体': result.supportsItalic ? '✅' : '❌',
            });
          });
          
          // 找到最佳字体
          const bestBoldFont = fontResults.find(r => r.supportsBold)?.font || null;
          const bestItalicFont = fontResults.find(r => r.supportsItalic)?.font || null;
          
          console.log('最佳粗体字体:', bestBoldFont || '未找到');
          console.log('最佳斜体字体:', bestItalicFont || '未找到');
          console.groupEnd();
          
          // 使用检测到的最佳字体（PingFang SC）
          const bestFontFamily = bestBoldFont && bestItalicFont 
            ? `"${bestBoldFont}", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif`
            : '-apple-system-font, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif';
          
          console.log('使用字体族:', bestFontFamily);
          
          // 检测字体是否真的能渲染中文粗体/斜体
          // 创建一个测试元素来比较正常和粗体/斜体的实际宽度
          const testNormal = document.createElement('span');
          testNormal.style.position = 'absolute';
          testNormal.style.visibility = 'hidden';
          testNormal.style.fontFamily = bestFontFamily;
          testNormal.style.fontSize = '20px';
          testNormal.textContent = '测试';
          document.body.appendChild(testNormal);
          
          const testBold = document.createElement('span');
          testBold.style.position = 'absolute';
          testBold.style.visibility = 'hidden';
          testBold.style.fontFamily = bestFontFamily;
          testBold.style.fontWeight = 'bold';
          testBold.style.fontSize = '20px';
          testBold.textContent = '测试';
          document.body.appendChild(testBold);
          
          const testItalic = document.createElement('span');
          testItalic.style.position = 'absolute';
          testItalic.style.visibility = 'hidden';
          testItalic.style.fontFamily = bestFontFamily;
          testItalic.style.fontStyle = 'italic';
          testItalic.style.fontSize = '20px';
          testItalic.textContent = '测试';
          document.body.appendChild(testItalic);
          
          // 获取实际宽度（如果字体真的支持粗体/斜体，宽度应该不同）
          const normalWidth = testNormal.offsetWidth;
          const boldWidth = testBold.offsetWidth;
          const italicWidth = testItalic.offsetWidth;
          
          // 清理测试元素
          document.body.removeChild(testNormal);
          document.body.removeChild(testBold);
          document.body.removeChild(testItalic);
          
          // 判断：如果粗体宽度和正常宽度相同，说明字体可能不支持真正的粗体字形
          const reallySupportsBold = Math.abs(boldWidth - normalWidth) > 0.5;
          const reallySupportsItalic = Math.abs(italicWidth - normalWidth) > 0.5;
          
          console.log('实际渲染检测:', {
            normalWidth,
            boldWidth,
            italicWidth,
            reallySupportsBold: reallySupportsBold ? '✅' : '❌',
            reallySupportsItalic: reallySupportsItalic ? '✅' : '❌',
          });
          
          // 处理 strong 元素
          const strongElements = previewRef.current.querySelectorAll('strong, b');
          strongElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              const hasChinese = /[\u4e00-\u9fa5]/.test(el.textContent || '');
              if (hasChinese) {
                // 强制使用最佳字体
                el.style.fontFamily = bestFontFamily;
                el.style.fontWeight = 'bold';
                
                // 如果字体文件本身不支持中文粗体字形，使用 text-shadow 模拟
                if (!reallySupportsBold) {
                  console.log('💡 对中文粗体应用 text-shadow 模拟:', el.textContent?.substring(0, 10));
                  // 使用多层 text-shadow 创建更明显的粗体效果
                  el.style.textShadow = `
                    0.02em 0 0 currentColor,
                    -0.02em 0 0 currentColor,
                    0 0.02em 0 currentColor,
                    0 -0.02em 0 currentColor,
                    0.01em 0.01em 0 currentColor,
                    -0.01em -0.01em 0 currentColor,
                    0.01em -0.01em 0 currentColor,
                    -0.01em 0.01em 0 currentColor
                  `.replace(/\s+/g, ' ').trim();
                  // 稍微增加字间距，让粗体效果更明显
                  el.style.letterSpacing = '0.01em';
                }
              }
            }
          });
          
          // 处理 em 元素
          const emElements = previewRef.current.querySelectorAll('em, i');
          emElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              const hasChinese = /[\u4e00-\u9fa5]/.test(el.textContent || '');
              if (hasChinese) {
                // 强制使用最佳字体
                el.style.fontFamily = bestFontFamily;
                el.style.fontStyle = 'italic';
                
                // 如果字体文件本身不支持中文斜体字形，使用 transform 模拟
                if (!reallySupportsItalic) {
                  console.log('💡 对中文斜体应用 transform 模拟:', el.textContent?.substring(0, 10));
                  // 使用更自然的倾斜角度
                  el.style.transform = 'skew(-10deg)';
                  el.style.display = 'inline-block';
                  el.style.transformOrigin = 'center';
                  // 稍微调整位置，减少视觉偏移
                  el.style.verticalAlign = 'baseline';
                }
              }
            }
          });
        };
        
        // 延迟执行，确保 DOM 已完全渲染
        setTimeout(detectAndApplyFonts, 100);
      }
    }, [output]);

    return (
      <div
        ref={mergedRef}
        id="preview"
        className={`preview-wrapper w-full p-5 flex justify-center overflow-auto ${className}`}
      >
        <div
          id="output-wrapper"
          className="w-full max-w-full"
        >
          <div
            className="preview border-x shadow-xl mx-auto w-full bg-white dark:bg-gray-800"
            style={{ minHeight: '100%' }}
          >
            {output ? (
              <section
                id="output"
                className="w-full p-4 text-gray-900 dark:text-gray-100 markdown-preview"
                dangerouslySetInnerHTML={{ __html: output }}
              />
            ) : (
              <div className="w-full p-4 text-gray-500 dark:text-gray-400 text-center">
                预览内容将在这里显示...
              </div>
            )}
          </div>
        </div>
        
        {/* Markdown 预览样式 - 采用 3rd/md 的方案：依赖浏览器默认样式和字体支持 */}
        <style>{`
          /* 重置可能影响样式的属性 */
          .markdown-preview * {
            box-sizing: border-box;
          }
          /* 基础样式 - 使用与 3rd/md 相同的字体配置 */
          .markdown-preview,
          #output {
            font-family: -apple-system-font, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif;
            font-size: 14px;
            line-height: 1.75;
            text-align: left;
          }
          /* 段落样式 */
          .markdown-preview p,
          #output p {
            margin: 1.5em 8px;
            line-height: 1.75;
          }
          /* 注意：不设置 strong/em 的特殊样式，依赖浏览器默认样式和字体支持 */
          .markdown-preview h1 {
            font-size: 1.5em;
            font-weight: bold;
            margin: 1em 0 0.5em 0;
            padding-bottom: 0.3em;
            border-bottom: 2px solid #eaecef;
          }
          .markdown-preview h2 {
            font-size: 1.3em;
            font-weight: bold;
            margin: 1em 0 0.5em 0;
            padding-bottom: 0.3em;
            border-bottom: 1px solid #eaecef;
          }
          .markdown-preview h3 {
            font-size: 1.1em;
            font-weight: bold;
            margin: 1em 0 0.5em 0;
          }
          .markdown-preview h4 {
            font-size: 1em;
            font-weight: bold;
            margin: 1em 0 0.5em 0;
          }
          .markdown-preview h5 {
            font-size: 0.9em;
            font-weight: bold;
            margin: 1em 0 0.5em 0;
          }
          .markdown-preview h6 {
            font-size: 0.85em;
            font-weight: bold;
            margin: 1em 0 0.5em 0;
            color: #6a737d;
          }
          /* 无序列表 */
          .markdown-preview ul,
          #output ul {
            list-style-type: disc;
            list-style-position: outside;
            padding-left: 2em;
            margin: 0.5em 0;
          }
          /* 有序列表 */
          .markdown-preview ol,
          #output ol {
            list-style-type: decimal;
            list-style-position: outside;
            padding-left: 2em;
            margin: 0.5em 0;
          }
          /* 列表项 */
          .markdown-preview li,
          #output li {
            display: list-item;
            margin: 0.2em 0;
            line-height: 1.75;
          }
          /* 嵌套列表 */
          .markdown-preview ul ul,
          .markdown-preview ol ol,
          .markdown-preview ul ol,
          .markdown-preview ol ul,
          #output ul ul,
          #output ol ol,
          #output ul ol,
          #output ol ul {
            margin-top: 0.2em;
            margin-bottom: 0.2em;
          }
          /* 粗体和斜体：确保正确显示 */
          /* 需要显式设置以确保不被 Tailwind reset 覆盖，并使用支持中文的字体 */
          .markdown-preview strong,
          .markdown-preview b,
          #output strong,
          #output b,
          .markdown-preview p strong,
          .markdown-preview p b,
          #output p strong,
          #output p b {
            font-weight: bold;
            font-style: normal;
            font-family: -apple-system-font, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif;
            /* 对于不支持粗体的字体，使用 text-shadow 作为后备（由 JS 检测后应用） */
            /* 注意：text-shadow 模拟效果由 JavaScript 动态应用 */
          }
          .markdown-preview em,
          .markdown-preview i,
          #output em,
          #output i,
          .markdown-preview p em,
          .markdown-preview p i,
          #output p em,
          #output p i {
            font-style: italic;
            font-weight: inherit;
            font-family: -apple-system-font, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif;
            /* 对于不支持斜体的字体，使用 transform 作为后备（由 JS 检测后应用） */
          }
          /* 粗体+斜体组合 */
          .markdown-preview strong em,
          .markdown-preview em strong,
          .markdown-preview b i,
          .markdown-preview i b,
          #output strong em,
          #output em strong,
          #output b i,
          #output i b,
          .markdown-preview p strong em,
          .markdown-preview p em strong,
          #output p strong em,
          #output p em strong {
            font-weight: bold;
            font-style: italic;
            font-family: -apple-system-font, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif;
          }
          .markdown-preview blockquote {
            margin: 1em 0;
            padding: 0.5em 1em;
            border-left: 4px solid #dfe2e5;
            background-color: #f6f8fa;
            color: #6a737d;
          }
          .markdown-preview code {
            padding: 0.2em 0.4em;
            margin: 0;
            font-size: 85%;
            background-color: rgba(175, 184, 193, 0.2);
            border-radius: 3px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          }
          .markdown-preview pre {
            padding: 1em;
            overflow: auto;
            background-color: #f6f8fa;
            border-radius: 6px;
            line-height: 1.45;
          }
          .markdown-preview pre code {
            padding: 0;
            margin: 0;
            background-color: transparent;
            border-radius: 0;
            font-size: 100%;
          }
          .markdown-preview table {
            border-collapse: collapse;
            margin: 1em 0;
            width: 100%;
          }
          .markdown-preview table th,
          .markdown-preview table td {
            padding: 0.5em 1em;
            border: 1px solid #dfe2e5;
          }
          .markdown-preview table th {
            background-color: #f6f8fa;
            font-weight: bold;
          }
          .markdown-preview a {
            color: #0366d6;
            text-decoration: none;
          }
          .markdown-preview a:hover {
            text-decoration: underline;
          }
          .markdown-preview img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
          }
          .markdown-preview hr {
            height: 0.25em;
            padding: 0;
            margin: 1.5em 0;
            background-color: #e1e4e8;
            border: 0;
          }
          .dark .markdown-preview h1,
          .dark .markdown-preview h2 {
            border-bottom-color: #30363d;
          }
          .dark .markdown-preview blockquote {
            border-left-color: #30363d;
            background-color: #161b22;
            color: #8b949e;
          }
          .dark .markdown-preview code {
            background-color: rgba(110, 118, 129, 0.4);
          }
          .dark .markdown-preview pre {
            background-color: #161b22;
          }
          .dark .markdown-preview table th,
          .dark .markdown-preview table td {
            border-color: #30363d;
          }
          .dark .markdown-preview table th {
            background-color: #161b22;
          }
          .dark .markdown-preview a {
            color: #58a6ff;
          }
          .dark .markdown-preview hr {
            background-color: #30363d;
          }
        `}</style>
      </div>
    );
  }
);

Preview.displayName = 'Preview';
