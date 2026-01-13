import { formatDoc as formatDocUtil } from '@/lib/utils/formatter';

/**
 * 格式化文档内容
 * @param content - 要格式化的内容
 * @param type - 内容类型，决定使用的解析器，默认为 'markdown'
 * @returns 格式化后的内容
 */
export async function formatDoc(content: string, type: 'markdown' | 'css' | 'javascript' = 'markdown'): Promise<string> {
  // 当前项目的 formatDoc 只支持 markdown，其他类型暂时返回原内容
  if (type === 'markdown') {
    return await formatDocUtil(content);
  }
  // TODO: 实现 CSS 和 JavaScript 格式化
  return content;
}
