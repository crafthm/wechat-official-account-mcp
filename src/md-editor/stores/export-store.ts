/**
 * 导出功能 Store
 * 负责处理各种导出功能：HTML、PDF、MD、图片等
 */

import { create } from 'zustand';
import { useMdRenderStore } from './render-store';
import { useMdUIStore } from './ui-store';
import {
  downloadMD,
  exportHTML,
  exportPDF,
  exportPureHTML,
  getHtmlContent,
  sanitizeTitle,
} from '../lib/utils/export-helpers';

export interface ExportStore {
  // 将编辑器内容转换为 HTML
  editorContent2HTML: () => string;
  // 导出编辑器内容为 HTML，并且下载到本地
  exportEditorContent2HTML: (title?: string) => Promise<void>;
  // 导出编辑器内容为无样式 HTML
  exportEditorContent2PureHTML: (content: string, title?: string) => Promise<void>;
  // 下载卡片图片
  downloadAsCardImage: (title?: string) => Promise<void>;
  // 导出编辑器内容为 PDF
  exportEditorContent2PDF: (title?: string) => Promise<void>;
  // 导出编辑器内容到本地（Markdown）
  exportEditorContent2MD: (content: string, title?: string) => void;
}

export const useMdExportStore = create<ExportStore>(() => ({
  // 将编辑器内容转换为 HTML
  editorContent2HTML: () => {
    const temp = getHtmlContent();
    // 确保 #output 元素存在并更新内容
    const outputElement = document.querySelector('#output');
    if (outputElement) {
      const { output } = useMdRenderStore.getState();
      outputElement.innerHTML = output;
    }
    return temp;
  },

  // 导出编辑器内容为 HTML，并且下载到本地
  exportEditorContent2HTML: async (title = 'untitled') => {
    // 确保输出已更新
    const outputElement = document.querySelector('#output');
    if (outputElement) {
      const { output } = useMdRenderStore.getState();
      outputElement.innerHTML = output;
    }
    await exportHTML(title);
    // 恢复输出内容
    if (outputElement) {
      const { output } = useMdRenderStore.getState();
      outputElement.innerHTML = output;
    }
  },

  // 导出编辑器内容为无样式 HTML
  exportEditorContent2PureHTML: async (content: string, title = 'untitled') => {
    await exportPureHTML(content, title);
  },

  // 下载卡片图片
  downloadAsCardImage: async (title = 'untitled') => {
    // 动态导入 html-to-image
    const { toPng } = await import('html-to-image');
    const uiStore = useMdUIStore.getState();

    // 查找预览元素
    const el = document.querySelector<HTMLElement>('#output');
    if (!el) {
      console.warn('未找到 #output 元素');
      return;
    }

    // 添加临时样式：禁用代码块滚动，启用换行
    const style = document.createElement('style');
    style.textContent = `
      #output pre.code__pre,
      #output .hljs.code__pre,
      #output pre.code__pre > code,
      #output .hljs.code__pre > code,
      #output .code-scroll,
      #output pre section,
      #output code section {
        overflow: visible !important;
      }
      #output pre.code__pre > code,
      #output .code-scroll,
      #output .code-scroll > div {
        white-space: pre-wrap !important;
        word-break: break-all !important;
        min-width: auto !important;
      }
    `;
    document.head.appendChild(style);

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const url = await toPng(el, {
        backgroundColor: uiStore.isDark ? '' : '#fff',
        skipFonts: true,
        pixelRatio: Math.max(window.devicePixelRatio || 1, 2),
        style: { margin: '0' },
      });

      // 下载图片
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizeTitle(title)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      style.remove();
    }
  },

  // 导出编辑器内容为 PDF
  exportEditorContent2PDF: async (title = 'untitled') => {
    // 确保输出已更新
    const outputElement = document.querySelector('#output');
    if (outputElement) {
      const { output } = useMdRenderStore.getState();
      outputElement.innerHTML = output;
    }
    await exportPDF(title);
    // 恢复输出内容
    if (outputElement) {
      const { output } = useMdRenderStore.getState();
      outputElement.innerHTML = output;
    }
  },

  // 导出编辑器内容到本地（Markdown）
  exportEditorContent2MD: (content: string, title = 'untitled') => {
    downloadMD(content, title);
  },
}));
