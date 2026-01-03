import prettier from 'prettier/standalone';
// @ts-ignore - prettier plugins may not have types
import prettierCss from 'prettier/plugins/postcss';
// @ts-ignore - prettier plugins may not have types
import prettierMarkdown from 'prettier/plugins/markdown';

/**
 * 格式化 Markdown 文档
 * @param content - 文档内容
 */
export async function formatDoc(content: string): Promise<string> {
  try {
    const result = await prettier.format(content, {
      parser: 'markdown',
      plugins: [prettierMarkdown],
    });
    return typeof result === 'string' ? result : content;
  } catch (error) {
    console.error('Format markdown error:', error);
    return content;
  }
}

/**
 * 格式化 CSS
 * @param content - css内容
 */
export async function formatCss(content: string): Promise<string> {
  try {
    const result = await prettier.format(content, {
      parser: 'css',
      plugins: [prettierCss],
    });
    return typeof result === 'string' ? result : content;
  } catch (error) {
    console.error('Format CSS error:', error);
    return content;
  }
}

/**
 * 导出原始 Markdown 文档
 * @param doc - 文档内容
 */
export function downloadMD(doc: string): void {
  const downLink = document.createElement('a');
  downLink.download = 'content.md';
  downLink.style.display = 'none';
  const blob = new Blob([doc], { type: 'text/markdown' });
  downLink.href = URL.createObjectURL(blob);
  document.body.appendChild(downLink);
  downLink.click();
  document.body.removeChild(downLink);
}

/**
 * 导出 HTML 生成内容
 * @param htmlContent - HTML 内容
 */
export function exportHTML(htmlContent: string): void {
  const downLink = document.createElement('a');
  downLink.download = 'content.html';
  downLink.style.display = 'none';
  const blob = new Blob(
    [
      `<html><head><meta charset="utf-8" /></head><body><div style="width: 750px; margin: auto;">${htmlContent}</div></body></html>`,
    ],
    { type: 'text/html' }
  );
  downLink.href = URL.createObjectURL(blob);
  document.body.appendChild(downLink);
  downLink.click();
  document.body.removeChild(downLink);
}

/**
 * 生成表格字符串
 * @param data - 对应内容集合
 * @param rows - 行数
 * @param cols - 列数
 */
export function createTable({
  data,
  rows,
  cols,
}: {
  data: Record<string, string>;
  rows: number;
  cols: number;
}): string {
  let table = '';
  for (let i = 0; i < rows + 2; ++i) {
    table += '| ';
    const currRow: string[] = [];
    for (let j = 0; j < cols; ++j) {
      const rowIdx = i > 1 ? i - 1 : i;
      currRow.push(i === 1 ? '---' : data[`k_${rowIdx}_${j}`] || '     ');
    }
    table += currRow.join(' | ');
    table += ' |\n';
  }
  return table;
}

/**
 * 移除左边多余空格
 * @param str - 字符串
 */
export function removeLeft(str: string): string {
  const lines = str.split('\n');
  // 获取应该删除的空白符数量
  const minSpaceNum = lines
    .filter((item) => item.trim())
    .map((item) => {
      const match = item.match(/(^\s+)?/);
      return match ? match[0].length : 0;
    })
    .sort((a, b) => a - b)[0] || 0;
  // 删除空白符
  return lines.map((item) => item.slice(minSpaceNum)).join('\n');
}

