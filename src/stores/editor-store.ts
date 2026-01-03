import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { config } from '@/lib/markdown/config';
import { DEFAULT_MARKDOWN_CONTENT, DEFAULT_CSS_CONTENT } from '@/lib/markdown/default-content';

export interface WxRenderer {
  getRenderer: (citeStatus: boolean) => any;
  setOptions: (options: any) => void;
  buildFootnotes: () => string;
  buildAddition: () => string;
}

export interface EditorStore {
  // 编辑器内容
  editorContent: string;
  cssContent: string;
  output: string;
  
  // 主题配置
  currentFont: string;
  currentSize: string;
  currentColor: string;
  codeTheme: string;
  legend: string;
  
  // 编辑器设置
  citeStatus: boolean;
  nightMode: boolean;
  isMacCodeBlock: boolean;
  isEditOnLeft: boolean;
  previewMode: 'pc' | 'mobile'; // 预览模式：PC 或 手机
  
  // 渲染器实例（稍后初始化）
  wxRenderer: WxRenderer | null;
  
  // Actions
  setEditorContent: (content: string) => void;
  setCssContent: (content: string) => void;
  setOutput: (output: string) => void;
  setCurrentFont: (font: string) => void;
  setCurrentSize: (size: string) => void;
  setCurrentColor: (color: string) => void;
  setCodeTheme: (theme: string) => void;
  setLegend: (legend: string) => void;
  setCiteStatus: (status: boolean) => void;
  toggleNightMode: () => void;
  setIsMacCodeBlock: (value: boolean) => void;
  setIsEditOnLeft: (value: boolean) => void;
  setPreviewMode: (mode: 'pc' | 'mobile') => void;
  setWxRenderer: (renderer: WxRenderer | null) => void;
  setWxRendererOptions: (options: any) => void;
  initEditorState: () => void;
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      editorContent: DEFAULT_MARKDOWN_CONTENT,
      cssContent: DEFAULT_CSS_CONTENT,
      output: '',
      currentFont: config.builtinFonts[0].value,
      currentSize: config.sizeOption[2].value,
      currentColor: config.colorOption[0].value,
      codeTheme: config.codeThemeOption[2].value,
      legend: config.legendOption[3].value,
      citeStatus: false,
      nightMode: false,
      isMacCodeBlock: true,
      isEditOnLeft: true,
      previewMode: 'pc',
      wxRenderer: null,
      
      // Actions
      setEditorContent: (content) => {
        set({ editorContent: content });
        localStorage.setItem('__editor_content', content);
      },
      
      setCssContent: (content) => {
        set({ cssContent: content });
        localStorage.setItem('__css_content', content);
      },
      
      setOutput: (output) => set({ output }),
      
      setCurrentFont: (font) => {
        set({ currentFont: font });
        localStorage.setItem('fonts', font);
      },
      
      setCurrentSize: (size) => {
        set({ currentSize: size });
        localStorage.setItem('size', size);
      },
      
      setCurrentColor: (color) => {
        set({ currentColor: color });
        localStorage.setItem('color', color);
      },
      
      setCodeTheme: (theme) => {
        set({ codeTheme: theme });
        localStorage.setItem('codeTheme', theme);
      },
      
      setLegend: (legend) => {
        set({ legend });
        localStorage.setItem('legend', legend);
      },
      
      setCiteStatus: (status) => {
        set({ citeStatus: status });
        localStorage.setItem('citeStatus', String(status));
      },
      
      toggleNightMode: () => {
        const nightMode = !get().nightMode;
        set({ nightMode });
        localStorage.setItem('nightMode', String(nightMode));
      },
      
      setIsMacCodeBlock: (value) => {
        set({ isMacCodeBlock: value });
        localStorage.setItem('isMacCodeBlock', String(value));
      },
      
      setIsEditOnLeft: (value) => {
        set({ isEditOnLeft: value });
        localStorage.setItem('isEditOnLeft', String(value));
      },
      
      setPreviewMode: (mode) => {
        set({ previewMode: mode });
        localStorage.setItem('previewMode', mode);
      },
      
      setWxRenderer: (renderer) => set({ wxRenderer: renderer }),
      
      setWxRendererOptions: (options) => {
        const renderer = get().wxRenderer;
        if (renderer) {
          renderer.setOptions(options);
        }
      },
      
      initEditorState: () => {
        // 从 localStorage 加载状态
        const savedFont = localStorage.getItem('fonts');
        const savedColor = localStorage.getItem('color');
        const savedSize = localStorage.getItem('size');
        const savedCodeTheme = localStorage.getItem('codeTheme');
        const savedLegend = localStorage.getItem('legend');
        const savedCiteStatus = localStorage.getItem('citeStatus');
        const savedNightMode = localStorage.getItem('nightMode');
        const savedIsMacCodeBlock = localStorage.getItem('isMacCodeBlock');
        const savedIsEditOnLeft = localStorage.getItem('isEditOnLeft');
        const savedPreviewMode = localStorage.getItem('previewMode');
        const savedEditorContent = localStorage.getItem('__editor_content');
        const savedCssContent = localStorage.getItem('__css_content');
        
        set({
          currentFont: savedFont || config.builtinFonts[0].value,
          currentColor: savedColor || config.colorOption[0].value,
          currentSize: savedSize || config.sizeOption[2].value,
          codeTheme: savedCodeTheme || config.codeThemeOption[2].value,
          legend: savedLegend || config.legendOption[3].value,
          citeStatus: savedCiteStatus === 'true',
          nightMode: savedNightMode === 'true',
          isMacCodeBlock: savedIsMacCodeBlock !== 'false',
          isEditOnLeft: savedIsEditOnLeft !== 'false',
          previewMode: (savedPreviewMode === 'mobile' || savedPreviewMode === 'pc') ? savedPreviewMode : 'pc',
          editorContent: savedEditorContent || DEFAULT_MARKDOWN_CONTENT,
          cssContent: savedCssContent || DEFAULT_CSS_CONTENT,
        });
      },
    }),
    {
      name: 'editor-storage',
      partialize: (state) => ({
        currentFont: state.currentFont,
        currentSize: state.currentSize,
        currentColor: state.currentColor,
        codeTheme: state.codeTheme,
        legend: state.legend,
        citeStatus: state.citeStatus,
        nightMode: state.nightMode,
        isMacCodeBlock: state.isMacCodeBlock,
        isEditOnLeft: state.isEditOnLeft,
        previewMode: state.previewMode,
        editorContent: state.editorContent,
        cssContent: state.cssContent,
      }),
    }
  )
);

