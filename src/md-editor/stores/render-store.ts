import { create } from 'zustand';
import { marked } from 'marked';

/**
 * 渲染 Store（隔离版本）
 * 负责 Markdown 渲染、HTML 输出、标题提取等
 * 从 Pinia render.ts 转换而来
 * 
 * 注意：当前使用简化的渲染逻辑，后续可以集成 @md/core 的完整渲染器
 */
export interface ReadingTime {
  chars: number;
  words: number;
  minutes: number;
}

export interface TitleItem {
  url: string;
  title: string;
  level: number;
}

export interface MdRenderStore {
  // 输出的 HTML
  output: string;

  // 阅读时间统计
  readingTime: ReadingTime;

  // 文章标题列表（用于生成目录）
  titleList: TitleItem[];

  // Actions
  setOutput: (output: string) => void;
  setReadingTime: (readingTime: ReadingTime) => void;
  setTitleList: (titleList: TitleItem[]) => void;
  render: (content: string) => string;
  extractTitles: () => void;
  reset: () => void;
}

export const useMdRenderStore = create<MdRenderStore>((set, get) => ({
  // 初始状态
  output: '',
  readingTime: {
    chars: 0,
    words: 0,
    minutes: 0,
  },
  titleList: [],

  // Actions
  setOutput: (output) => {
    set({ output });
  },

  setReadingTime: (readingTime) => {
    set({ readingTime });
  },

  setTitleList: (titleList) => {
    set({ titleList });
  },

  // 渲染内容（简化版本）
  // TODO: 集成完整的渲染器逻辑
  render: (content: string) => {
    if (!content || content.trim() === '') {
      set({ output: '' });
      return '';
    }

    try {
      // 配置 marked 选项
      marked.setOptions({
        breaks: true, // 启用换行支持
        gfm: true, // 启用 GitHub Flavored Markdown
      });

      // 使用 marked 解析 Markdown
      const html = marked.parse(content) as string;
      set({ output: html });
      return html;
    } catch (error) {
      console.error('Render error:', error);
      set({ output: '<p>渲染错误：' + String(error) + '</p>' });
      return '';
    }
  },

  // 提取标题
  extractTitles: () => {
    const { output } = get();
    const div = document.createElement('div');
    div.innerHTML = output;
    const list = div.querySelectorAll<HTMLElement>('[data-heading]');

    const titleList: TitleItem[] = [];
    let i = 0;
    for (const item of list) {
      item.setAttribute('id', `${i}`);
      titleList.push({
        url: `#${i}`,
        title: `${item.textContent}`,
        level: Number(item.tagName.slice(1)),
      });
      i++;
    }
    set({ titleList });
  },

  // 重置状态
  reset: () => {
    set({
      output: '',
      readingTime: { chars: 0, words: 0, minutes: 0 },
      titleList: [],
    });
  },
}));
