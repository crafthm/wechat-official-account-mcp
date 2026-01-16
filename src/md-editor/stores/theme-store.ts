/**
 * 主题和样式配置 Store
 * 负责管理所有与主题、字体、颜色相关的配置
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { config } from '@/lib/markdown/config';

export type ThemeName = 'default' | 'grace' | 'simple';

export interface ThemeStore {
  // 文本主题
  theme: ThemeName;
  // 文本字体
  fontFamily: string;
  // 文本大小
  fontSize: string;
  // 主色
  primaryColor: string;
  // 代码块主题
  codeBlockTheme: string;
  // 图注格式
  legend: string;
  // 是否开启 Mac 代码块
  isMacCodeBlock: boolean;
  // 是否开启代码块行号显示
  isShowLineNumber: boolean;
  // 是否开启微信外链接底部引用
  isCiteStatus: boolean;
  // 是否统计字数和阅读时间
  isCountStatus: boolean;
  // 是否开启段落首行缩进
  isUseIndent: boolean;
  // 是否开启两端对齐
  isUseJustify: boolean;
  // 预览宽度
  previewWidth: string;

  // Actions
  setTheme: (theme: ThemeName) => void;
  setFontFamily: (fontFamily: string) => void;
  setFontSize: (fontSize: string) => void;
  setPrimaryColor: (color: string) => void;
  setCodeBlockTheme: (theme: string) => void;
  setLegend: (legend: string) => void;
  toggleMacCodeBlock: () => void;
  toggleShowLineNumber: () => void;
  toggleCiteStatus: () => void;
  toggleCountStatus: () => void;
  toggleUseIndent: () => void;
  toggleUseJustify: () => void;
  setPreviewWidth: (width: string) => void;
  resetStyle: () => void;
  updateCodeTheme: () => void;
  applyCurrentTheme: () => Promise<void>;
}

const defaultConfig = {
  theme: 'default' as ThemeName,
  fontFamily: config.builtinFonts[0].value,
  fontSize: config.sizeOption[2].value, // 14px
  primaryColor: config.colorOption[0].value,
  codeBlockTheme: config.codeThemeOption[0]?.value || '',
  legend: config.legendOption[3]?.value || 'none',
  isMacCodeBlock: true,
  isShowLineNumber: false,
  isCiteStatus: false,
  isCountStatus: false,
  isUseIndent: false,
  isUseJustify: false,
  previewWidth: 'w-full',
};

export const useMdThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      ...defaultConfig,

      setTheme: (theme) => {
        set({ theme });
        get().applyCurrentTheme();
      },

      setFontFamily: (fontFamily) => {
        set({ fontFamily });
        get().applyCurrentTheme();
      },

      setFontSize: (fontSize) => {
        set({ fontSize });
        get().applyCurrentTheme();
      },

      setPrimaryColor: (color) => {
        set({ primaryColor: color });
        get().applyCurrentTheme();
      },

      setCodeBlockTheme: (theme) => {
        set({ codeBlockTheme: theme });
        get().updateCodeTheme();
      },

      setLegend: (legend) => {
        set({ legend });
      },

      toggleMacCodeBlock: () => {
        set((state) => ({ isMacCodeBlock: !state.isMacCodeBlock }));
      },

      toggleShowLineNumber: () => {
        set((state) => ({ isShowLineNumber: !state.isShowLineNumber }));
      },

      toggleCiteStatus: () => {
        set((state) => ({ isCiteStatus: !state.isCiteStatus }));
      },

      toggleCountStatus: () => {
        set((state) => ({ isCountStatus: !state.isCountStatus }));
      },

      toggleUseIndent: () => {
        set((state) => ({ isUseIndent: !state.isUseIndent }));
        get().applyCurrentTheme();
      },

      toggleUseJustify: () => {
        set((state) => ({ isUseJustify: !state.isUseJustify }));
        get().applyCurrentTheme();
      },

      setPreviewWidth: (width) => {
        set({ previewWidth: width });
      },

      resetStyle: () => {
        set(defaultConfig);
        get().applyCurrentTheme();
      },

      updateCodeTheme: () => {
        // 更新代码块主题（加载 highlight.js 样式）
        const { codeBlockTheme } = get();
        if (codeBlockTheme) {
          // 移除旧的样式
          const existingLink = document.querySelector('link[data-code-theme]');
          if (existingLink) {
            existingLink.remove();
          }

          // 添加新的样式
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = codeBlockTheme;
          link.setAttribute('data-code-theme', 'true');
          document.head.appendChild(link);
        }
      },

      applyCurrentTheme: async () => {
        // TODO: 实现主题应用逻辑
        // 这里需要应用 CSS 变量和自定义样式
        const { theme, fontFamily, fontSize, primaryColor, isUseIndent, isUseJustify } = get();
        
        // 应用 CSS 变量到根元素
        const root = document.documentElement;
        root.style.setProperty('--md-font-family', fontFamily);
        root.style.setProperty('--md-font-size', fontSize);
        root.style.setProperty('--md-primary-color', primaryColor);
        
        // 应用段落样式
        if (isUseIndent) {
          root.style.setProperty('--md-text-indent', '2em');
        } else {
          root.style.setProperty('--md-text-indent', '0');
        }
        
        if (isUseJustify) {
          root.style.setProperty('--md-text-align', 'justify');
        } else {
          root.style.setProperty('--md-text-align', 'left');
        }
      },
    }),
    {
      name: 'md-editor-theme-storage',
      partialize: (state) => ({
        theme: state.theme,
        fontFamily: state.fontFamily,
        fontSize: state.fontSize,
        primaryColor: state.primaryColor,
        codeBlockTheme: state.codeBlockTheme,
        legend: state.legend,
        isMacCodeBlock: state.isMacCodeBlock,
        isShowLineNumber: state.isShowLineNumber,
        isCiteStatus: state.isCiteStatus,
        isCountStatus: state.isCountStatus,
        isUseIndent: state.isUseIndent,
        isUseJustify: state.isUseJustify,
        previewWidth: state.previewWidth,
      }),
    }
  )
);
