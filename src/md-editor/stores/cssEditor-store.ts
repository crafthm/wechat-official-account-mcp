/**
 * CSS 编辑器 Store
 * 负责管理自定义 CSS 编辑器及其配置
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EditorView } from '@codemirror/view';

export interface CssTab {
  title: string;
  name: string;
  content: string;
}

export interface CssContentConfig {
  active: string;
  tabs: CssTab[];
}

export interface CssEditorStore {
  // CSS 编辑器实例
  cssEditor: EditorView | null;
  // CSS 内容配置
  cssContentConfig: CssContentConfig;
  // 切换 Tab 的回调
  onTabChangedCallback: ((content: string) => void) | null;

  // Actions
  setCssEditor: (editor: EditorView | null) => void;
  getCurrentTab: () => CssTab | undefined;
  getCurrentTabContent: () => string;
  setCssEditorValue: (content: string) => void;
  setOnTabChangedCallback: (callback: (content: string) => void) => void;
  tabChanged: (name: string) => void;
  renameTab: (name: string) => void;
  addCssContentTab: (name: string, initialContent?: string) => void;
  validatorTabName: (val: string) => boolean;
  resetCssConfig: () => void;
  initCssEditor: (onUpdate: (content: string) => void) => void;
}

const DEFAULT_CSS_CONTENT = `/* 自定义 CSS 样式 */
/* 在这里编写你的自定义样式 */`;

const defaultConfig: CssContentConfig = {
  active: '方案1',
  tabs: [
    {
      title: '方案1',
      name: '方案1',
      content: DEFAULT_CSS_CONTENT,
    },
  ],
};

export const useMdCssEditorStore = create<CssEditorStore>()(
  persist(
    (set, get) => ({
      cssEditor: null,
      cssContentConfig: defaultConfig,
      onTabChangedCallback: null,

      setCssEditor: (editor) => {
        set({ cssEditor: editor });
      },

      getCurrentTab: () => {
        const { cssContentConfig } = get();
        return cssContentConfig.tabs.find(
          (tab) => tab.name === cssContentConfig.active
        );
      },

      getCurrentTabContent: () => {
        const tab = get().getCurrentTab();
        return tab?.content || DEFAULT_CSS_CONTENT;
      },

      setCssEditorValue: (content) => {
        const { cssEditor } = get();
        if (cssEditor) {
          cssEditor.dispatch({
            changes: {
              from: 0,
              to: cssEditor.state.doc.length,
              insert: content,
            },
          });
        }
      },

      setOnTabChangedCallback: (callback) => {
        set({ onTabChangedCallback: callback });
      },

      tabChanged: (name) => {
        const state = get();
        const newConfig = {
          ...state.cssContentConfig,
          active: name,
        };
        set({ cssContentConfig: newConfig });

        const tab = newConfig.tabs.find((t) => t.name === name);
        if (tab) {
          state.setCssEditorValue(tab.content);
          if (state.onTabChangedCallback) {
            state.onTabChangedCallback(tab.content);
          }
        }
      },

      renameTab: (name) => {
        const state = get();
        const tab = state.getCurrentTab();
        if (tab) {
          const newTabs = state.cssContentConfig.tabs.map((t) =>
            t.name === tab.name ? { ...t, title: name, name } : t
          );
          set({
            cssContentConfig: {
              ...state.cssContentConfig,
              active: name,
              tabs: newTabs,
            },
          });
        }
      },

      addCssContentTab: (name, initialContent) => {
        const state = get();
        const content = initialContent || DEFAULT_CSS_CONTENT;
        const newTabs = [
          ...state.cssContentConfig.tabs,
          {
            name,
            title: name,
            content,
          },
        ];
        const newConfig = {
          ...state.cssContentConfig,
          active: name,
          tabs: newTabs,
        };
        set({ cssContentConfig: newConfig });
        state.setCssEditorValue(content);
        if (state.onTabChangedCallback) {
          state.onTabChangedCallback(content);
        }
      },

      validatorTabName: (val) => {
        const { cssContentConfig } = get();
        return cssContentConfig.tabs.every(({ name }) => name !== val);
      },

      resetCssConfig: () => {
        const state = get();
        const newConfig = {
          active: '方案1',
          tabs: [
            {
              title: '方案1',
              name: '方案1',
              content: DEFAULT_CSS_CONTENT,
            },
          ],
        };
        set({ cssContentConfig: newConfig });
        state.setCssEditorValue(DEFAULT_CSS_CONTENT);
      },

      initCssEditor: (onUpdate) => {
        const state = get();
        state.setOnTabChangedCallback(onUpdate);
        // 初始化时应用当前 CSS
        const content = state.getCurrentTabContent();
        onUpdate(content);
      },
    }),
    {
      name: 'md-editor-cssEditor-storage',
      partialize: (state) => ({
        cssContentConfig: state.cssContentConfig,
      }),
    }
  )
);
