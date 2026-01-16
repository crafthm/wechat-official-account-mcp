/**
 * UI 状态 Store
 * 负责管理全局 UI 状态，包括深色模式、侧边栏、对话框等
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UIStore {
  // 是否开启深色模式
  isDark: boolean;
  // 是否在左侧编辑
  isEditOnLeft: boolean;
  // 是否打开右侧滑块
  isOpenRightSlider: boolean;
  // 是否打开文章列表滑块
  isOpenPostSlider: boolean;
  // 是否打开本地文件夹面板
  isOpenFolderPanel: boolean;
  // 是否为移动端
  isMobile: boolean;
  // 是否固定显示浮动目录
  isPinFloatingToc: boolean;
  // 是否显示浮动目录
  isShowFloatingToc: boolean;
  // 是否展示 CSS 编辑器
  isShowCssEditor: boolean;
  // 是否展示插入表格对话框
  isShowInsertFormDialog: boolean;
  // 是否展示插入公众号名片对话框
  isShowInsertMpCardDialog: boolean;
  // 是否展示上传图片对话框
  isShowUploadImgDialog: boolean;
  // 是否展示模板对话框
  isShowTemplateDialog: boolean;
  // 是否打开确认对话框
  isOpenConfirmDialog: boolean;

  // Actions
  toggleDark: (dark?: boolean) => void;
  toggleEditOnLeft: (left?: boolean) => void;
  toggleRightSlider: () => void;
  togglePostSlider: () => void;
  toggleFolderPanel: () => void;
  setIsMobile: (mobile: boolean) => void;
  togglePinFloatingToc: () => void;
  toggleShowFloatingToc: () => void;
  toggleShowCssEditor: () => void;
  toggleShowInsertFormDialog: () => void;
  toggleShowInsertMpCardDialog: () => void;
  toggleShowUploadImgDialog: () => void;
  toggleShowTemplateDialog: () => void;
  setOpenConfirmDialog: (open: boolean) => void;
}

const defaultState = {
  isDark: false,
  isEditOnLeft: true,
  isOpenRightSlider: false,
  isOpenPostSlider: false,
  isOpenFolderPanel: false,
  isMobile: false,
  isPinFloatingToc: false,
  isShowFloatingToc: true,
  isShowCssEditor: false,
  isShowInsertFormDialog: false,
  isShowInsertMpCardDialog: false,
  isShowUploadImgDialog: false,
  isShowTemplateDialog: false,
  isOpenConfirmDialog: false,
};

export const useMdUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...defaultState,

      toggleDark: (dark) => {
        if (dark !== undefined) {
          set({ isDark: dark });
        } else {
          set((state) => ({ isDark: !state.isDark }));
        }
      },

      toggleEditOnLeft: (left) => {
        if (left !== undefined) {
          set({ isEditOnLeft: left });
        } else {
          set((state) => ({ isEditOnLeft: !state.isEditOnLeft }));
        }
      },

      toggleRightSlider: () => {
        set((state) => ({ isOpenRightSlider: !state.isOpenRightSlider }));
      },

      togglePostSlider: () => {
        set((state) => ({ isOpenPostSlider: !state.isOpenPostSlider }));
      },

      toggleFolderPanel: () => {
        set((state) => ({ isOpenFolderPanel: !state.isOpenFolderPanel }));
      },

      setIsMobile: (mobile) => {
        set({ isMobile: mobile });
      },

      togglePinFloatingToc: () => {
        set((state) => ({ isPinFloatingToc: !state.isPinFloatingToc }));
      },

      toggleShowFloatingToc: () => {
        set((state) => ({ isShowFloatingToc: !state.isShowFloatingToc }));
      },

      toggleShowCssEditor: () => {
        set((state) => ({ isShowCssEditor: !state.isShowCssEditor }));
      },

      toggleShowInsertFormDialog: () => {
        set((state) => ({ isShowInsertFormDialog: !state.isShowInsertFormDialog }));
      },

      toggleShowInsertMpCardDialog: () => {
        set((state) => ({ isShowInsertMpCardDialog: !state.isShowInsertMpCardDialog }));
      },

      toggleShowUploadImgDialog: () => {
        set((state) => ({ isShowUploadImgDialog: !state.isShowUploadImgDialog }));
      },

      toggleShowTemplateDialog: () => {
        set((state) => ({ isShowTemplateDialog: !state.isShowTemplateDialog }));
      },

      setOpenConfirmDialog: (open) => {
        set({ isOpenConfirmDialog: open });
      },
    }),
    {
      name: 'md-editor-ui-storage',
      partialize: (state) => ({
        isDark: state.isDark,
        isEditOnLeft: state.isEditOnLeft,
        isOpenRightSlider: state.isOpenRightSlider,
        isPinFloatingToc: state.isPinFloatingToc,
        isShowFloatingToc: state.isShowFloatingToc,
      }),
    }
  )
);
