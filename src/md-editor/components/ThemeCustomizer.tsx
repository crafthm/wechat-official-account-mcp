/**
 * 主题定制器组件
 * 从 3rd/md ThemeCustomizer.vue 转换而来
 */

import { Moon, Sun } from 'lucide-react';
import { useMdEditorStore } from '../stores/editor-store';
import { useMdRenderStore } from '../stores/render-store';
import { useMdThemeStore } from '../stores/theme-store';
import { useMdUIStore } from '../stores/ui-store';
import { config } from '@/lib/markdown/config';

export function ThemeCustomizer() {
  const themeStore = useMdThemeStore();
  const uiStore = useMdUIStore();
  const editorStore = useMdEditorStore();
  const renderStore = useMdRenderStore();

  const { previewWidth } = themeStore;
  const { isDark, isEditOnLeft, toggleDark, toggleEditOnLeft, toggleShowCssEditor } = uiStore;

  const editorRefresh = () => {
    themeStore.updateCodeTheme();
    const raw = editorStore.getContent();
    renderStore.render(raw);
  };

  const handlePreviewWidthChange = (newWidth: string) => {
    themeStore.setPreviewWidth(newWidth);
    editorRefresh();
  };

  const handleCustomStyle = () => {
    toggleShowCssEditor();
  };

  return (
    <div className="theme-customizer space-y-4">
      {/* 编辑区位置 */}
      <div className="space-y-2 hidden sm:block">
        <h2 className="text-sm font-medium">编辑区位置</h2>
        <div className="grid grid-cols-2 justify-items-center gap-2">
          <button
            className={`w-full px-3 py-2 text-sm border rounded ${
              isEditOnLeft
                ? 'border-black dark:border-white border-2'
                : 'border-gray-300 dark:border-gray-600'
            } hover:bg-gray-100 dark:hover:bg-gray-700`}
            onClick={() => !isEditOnLeft && toggleEditOnLeft(true)}
          >
            左侧
          </button>
          <button
            className={`w-full px-3 py-2 text-sm border rounded ${
              !isEditOnLeft
                ? 'border-black dark:border-white border-2'
                : 'border-gray-300 dark:border-gray-600'
            } hover:bg-gray-100 dark:hover:bg-gray-700`}
            onClick={() => isEditOnLeft && toggleEditOnLeft(false)}
          >
            右侧
          </button>
        </div>
      </div>

      {/* 预览模式 */}
      <div className="space-y-2 hidden sm:block">
        <h2 className="text-sm font-medium">预览模式</h2>
        <div className="grid grid-cols-2 justify-items-center gap-2">
          {config.widthOptions.map(({ label, value }) => (
            <button
              key={value}
              className={`w-full px-3 py-2 text-sm border rounded ${
                previewWidth === value
                  ? 'border-black dark:border-white border-2'
                  : 'border-gray-300 dark:border-gray-600'
              } hover:bg-gray-100 dark:hover:bg-gray-700`}
              onClick={() => handlePreviewWidthChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 自定义 CSS 面板 */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium">自定义 CSS 面板</h2>
        <div className="grid grid-cols-2 justify-items-center gap-2">
          <button
            className={`w-full px-3 py-2 text-sm border rounded ${
              uiStore.isShowCssEditor
                ? 'border-black dark:border-white border-2'
                : 'border-gray-300 dark:border-gray-600'
            } hover:bg-gray-100 dark:hover:bg-gray-700`}
            onClick={() => !uiStore.isShowCssEditor && handleCustomStyle()}
          >
            开启
          </button>
          <button
            className={`w-full px-3 py-2 text-sm border rounded ${
              !uiStore.isShowCssEditor
                ? 'border-black dark:border-white border-2'
                : 'border-gray-300 dark:border-gray-600'
            } hover:bg-gray-100 dark:hover:bg-gray-700`}
            onClick={() => uiStore.isShowCssEditor && handleCustomStyle()}
          >
            关闭
          </button>
        </div>
      </div>

      {/* 浮动目录 */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium">浮动目录</h2>
        <div className="grid grid-cols-2 justify-items-center gap-2">
          <button
            className={`w-full px-3 py-2 text-sm border rounded ${
              uiStore.isPinFloatingToc
                ? 'border-black dark:border-white border-2'
                : 'border-gray-300 dark:border-gray-600'
            } hover:bg-gray-100 dark:hover:bg-gray-700`}
            onClick={() => !uiStore.isPinFloatingToc && uiStore.togglePinFloatingToc()}
          >
            常驻显示
          </button>
          <button
            className={`w-full px-3 py-2 text-sm border rounded ${
              !uiStore.isPinFloatingToc
                ? 'border-black dark:border-white border-2'
                : 'border-gray-300 dark:border-gray-600'
            } hover:bg-gray-100 dark:hover:bg-gray-700`}
            onClick={() => uiStore.isPinFloatingToc && uiStore.togglePinFloatingToc()}
          >
            移入触发
          </button>
        </div>
      </div>

      {/* 模式 */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium">模式</h2>
        <div className="grid grid-cols-2 justify-items-center gap-2">
          <button
            className={`w-full px-3 py-2 text-sm border rounded flex items-center justify-center ${
              !isDark
                ? 'border-black dark:border-white border-2'
                : 'border-gray-300 dark:border-gray-600'
            } hover:bg-gray-100 dark:hover:bg-gray-700`}
            onClick={() => toggleDark(false)}
          >
            <Sun className="h-4 w-4" />
          </button>
          <button
            className={`w-full px-3 py-2 text-sm border rounded flex items-center justify-center ${
              isDark
                ? 'border-black dark:border-white border-2'
                : 'border-gray-300 dark:border-gray-600'
            } hover:bg-gray-100 dark:hover:bg-gray-700`}
            onClick={() => toggleDark(true)}
          >
            <Moon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
