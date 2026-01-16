/**
 * 导出功能工具函数
 * 从 3rd/md utils/index.ts 转换而来
 */

import juice from 'juice';
import { Marked } from 'marked';
import markedKatex from 'marked-katex-extension';

/**
 * 清理标题，移除非法字符
 */
export function sanitizeTitle(title: string): string {
  return title
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 导出 Markdown 文件
 */
export function downloadMD(doc: string, title: string = 'untitled'): void {
  const safeTitle = sanitizeTitle(title);
  downloadFile(doc, `${safeTitle}.md`, 'text/markdown;charset=utf-8');
}

/**
 * 获取 HTML 内容（从 #output 元素）
 */
export function getHtmlContent(): string {
  const element = document.querySelector('#output');
  if (!element) {
    console.warn('未找到 #output 元素');
    return '';
  }
  return element.innerHTML;
}

/**
 * 获取主题样式
 */
function getThemeStyles(): string {
  const themeStyle = document.querySelector('#md-theme') as HTMLStyleElement;

  if (!themeStyle || !themeStyle.textContent) {
    console.warn('[getThemeStyles] 未找到主题样式');
    return '';
  }

  // 移除 #output 作用域前缀
  let cssContent = themeStyle.textContent;

  // 处理 #output {} 为 body {}
  cssContent = cssContent.replace(/#output\s*\{/g, 'body {');

  // 将 "#output h1" 替换为 "h1" 等
  cssContent = cssContent.replace(/#output\s+/g, '');
  cssContent = cssContent.replace(/^#output\s*/gm, '');

  const styleContent = `<style>${cssContent}</style>`;
  return styleContent;
}

/**
 * 获取 highlight.js 样式
 */
async function getHljsStyles(): Promise<string> {
  const hljsLink = document.querySelector('#hljs') as HTMLLinkElement;
  if (!hljsLink) {
    return '';
  }

  try {
    const response = await fetch(hljsLink.href);
    const cssText = await response.text();
    return `<style>${cssText}</style>`;
  } catch (error) {
    console.warn('Failed to fetch highlight.js styles:', error);
    return '';
  }
}

/**
 * 获取需要添加的样式
 */
async function getStylesToAdd(): Promise<string> {
  const themeStyles = getThemeStyles();
  const hljsStyles = await getHljsStyles();
  return [themeStyles, hljsStyles].filter(Boolean).join('');
}

/**
 * 导出 HTML 文件（带样式）
 */
export async function exportHTML(title: string = 'untitled'): Promise<void> {
  const htmlStr = getHtmlContent();
  const stylesToAdd = await getStylesToAdd();

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${sanitizeTitle(title)}</title>
  ${stylesToAdd}
</head>
<body>
  <div style="width: 750px; margin: auto; padding: 20px;">
    ${htmlStr}
  </div>
</body>
</html>`;

  downloadFile(fullHtml, `${sanitizeTitle(title)}.html`, 'text/html');
}

/**
 * 生成无样式 HTML
 */
export async function generatePureHTML(raw: string): Promise<string> {
  const markedInstance = new Marked();
  // 使用 marked-katex-extension（简化版本，不包含 alert 扩展）
  try {
    markedInstance.use(markedKatex({
      output: 'html',
      throwOnError: false,
    }));
  } catch (error) {
    console.warn('Failed to load marked-katex-extension:', error);
  }
  const pureHtml = await markedInstance.parse(raw);
  return pureHtml as string;
}

/**
 * 导出无样式 HTML 文件
 */
export async function exportPureHTML(raw: string, title: string = 'untitled'): Promise<void> {
  const safeTitle = sanitizeTitle(title);
  const pureHtml = await generatePureHTML(raw);
  downloadFile(pureHtml, `${safeTitle}.html`, 'text/html');
}

/**
 * 导出 PDF 文档
 */
export async function exportPDF(title: string = 'untitled'): Promise<void> {
  const htmlStr = getHtmlContent();
  const stylesToAdd = await getStylesToAdd();
  const safeTitle = sanitizeTitle(title);

  // 创建新窗口用于打印
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('无法打开打印窗口');
    return;
  }

  // 写入HTML内容，包含主题样式和自定义页眉页脚
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${safeTitle}</title>
      ${stylesToAdd}
      <style>
        /* 强制打印背景颜色和图片 */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        /* 打印页面设置 */
        @page {
          @top-center {
            content: "${safeTitle}";
            font-size: 12px;
            color: #666;
          }
          @bottom-left {
            content: "微信 Markdown 编辑器";
            font-size: 10px;
            color: #999;
          }
          @bottom-right {
            content: "第 " counter(page) " 页，共 " counter(pages) " 页";
            font-size: 10px;
            color: #999;
          }
        }

        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div style="width: 100%; max-width: 750px; margin: auto;">
        ${htmlStr}
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();

  // 等待内容加载完成后自动打开打印对话框
  printWindow.onload = () => {
    printWindow.print();
    // 打印完成后关闭窗口
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };
}
