/**
 * 右侧样式设置面板
 * 从 3rd/md RightSlider.vue 转换而来
 */

import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMdEditorStore } from '../stores/editor-store';
import { useMdRenderStore } from '../stores/render-store';
import { useMdThemeStore } from '../stores/theme-store';
import { useMdUIStore } from '../stores/ui-store';
import { config } from '@/lib/markdown/config';

export function RightSlider() {
  const themeStore = useMdThemeStore();
  const uiStore = useMdUIStore();
  const editorStore = useMdEditorStore();
  const renderStore = useMdRenderStore();

  const {
    theme,
    fontFamily,
    fontSize,
    primaryColor,
    codeBlockTheme,
    legend,
    isMacCodeBlock,
    isShowLineNumber,
    isCiteStatus,
    isUseIndent,
    isUseJustify,
  } = themeStore;

  const { isMobile, isOpenRightSlider, isDark } = uiStore;

  // 控制是否启用动画
  const [enableAnimation, setEnableAnimation] = useState(false);

  // 监听 RightSlider 开关状态变化
  useEffect(() => {
    if (isMobile) {
      setEnableAnimation(true);
    }
  }, [isOpenRightSlider, isMobile]);

  // 监听设备类型变化，重置动画状态
  useEffect(() => {
    setEnableAnimation(false);
  }, [isMobile]);

  // 编辑器刷新
  const editorRefresh = () => {
    themeStore.updateCodeTheme();
    const raw = editorStore.getContent();
    renderStore.render(raw);
  };

  // 主题切换处理
  const handleThemeChange = (newTheme: 'default' | 'grace' | 'simple') => {
    themeStore.setTheme(newTheme);
    editorRefresh();
  };

  const handleFontChange = (fonts: string) => {
    themeStore.setFontFamily(fonts);
    editorRefresh();
  };

  const handleSizeChange = (size: string) => {
    themeStore.setFontSize(size);
    editorRefresh();
  };

  const handleColorChange = (newColor: string) => {
    themeStore.setPrimaryColor(newColor);
    editorRefresh();
  };

  const handleCodeBlockThemeChange = (newTheme: string) => {
    themeStore.setCodeBlockTheme(newTheme);
    editorRefresh();
  };

  const handleLegendChange = (newVal: string) => {
    themeStore.setLegend(newVal);
    editorRefresh();
  };

  const handleMacCodeBlockChange = () => {
    themeStore.toggleMacCodeBlock();
    editorRefresh();
  };

  const handleShowLineNumberChange = () => {
    themeStore.toggleShowLineNumber();
    editorRefresh();
  };

  const handleCiteStatusChange = () => {
    themeStore.toggleCiteStatus();
    editorRefresh();
  };

  const handleUseIndentChange = () => {
    themeStore.toggleUseIndent();
    editorRefresh();
  };

  const handleUseJustifyChange = () => {
    themeStore.toggleUseJustify();
    editorRefresh();
  };

  const handleResetStyle = () => {
    uiStore.setOpenConfirmDialog(true);
  };

  return (
    <>
      {/* 移动端遮罩层 */}
      {isMobile && isOpenRightSlider && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => uiStore.toggleRightSlider()}
        />
      )}

      <div
        className={`overflow-hidden mobile-right-drawer ${
          isMobile
            ? `fixed top-0 right-0 w-full h-full z-55 bg-white dark:bg-gray-900 border-l shadow-lg ${
                enableAnimation ? 'animate' : ''
              }`
            : `border-l-2 order-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-width duration-300 ${
                isOpenRightSlider ? 'w-100' : 'w-0 border-l-0'
              }`
        }`}
        style={{
          transform: isMobile
            ? isOpenRightSlider
              ? 'translateX(0)'
              : 'translateX(100%)'
            : 'none',
        }}
      >
        <div
          className={`space-y-4 h-full overflow-auto p-4 ${
            isMobile ? 'pt-0' : ''
          }`}
        >
          {/* 移动端标题栏 */}
          {isMobile && (
            <div className="sticky top-0 z-10 flex items-center justify-between -mx-4 px-4 py-3 border-b mb-4 bg-white dark:bg-gray-900">
              <h2 className="text-lg font-semibold">样式设置</h2>
              <button
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                onClick={() => uiStore.toggleRightSlider()}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* 主题 */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium">主题</h2>
            <div className="grid grid-cols-3 justify-items-center gap-2">
              {config.themeOptions.map(({ label, value }) => (
                <button
                  key={value}
                  className={`w-full px-3 py-2 text-sm border rounded ${
                    theme === value
                      ? 'border-black dark:border-white border-2'
                      : 'border-gray-300 dark:border-gray-600'
                  } hover:bg-gray-100 dark:hover:bg-gray-700`}
                  onClick={() => handleThemeChange(value as 'default' | 'grace' | 'simple')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 字体 */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium">字体</h2>
            <div className="grid grid-cols-3 justify-items-center gap-2">
              {config.builtinFonts.map(({ label, value }) => (
                <button
                  key={value}
                  className={`w-full px-3 py-2 text-sm border rounded ${
                    fontFamily === value
                      ? 'border-black dark:border-white border-2'
                      : 'border-gray-300 dark:border-gray-600'
                  } hover:bg-gray-100 dark:hover:bg-gray-700`}
                  onClick={() => handleFontChange(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 字号 */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium">字号</h2>
            <div className="grid grid-cols-5 justify-items-center gap-2">
              {config.sizeOption.map(({ value, desc }) => (
                <button
                  key={value}
                  className={`w-full px-3 py-2 text-sm border rounded ${
                    fontSize === value
                      ? 'border-black dark:border-white border-2'
                      : 'border-gray-300 dark:border-gray-600'
                  } hover:bg-gray-100 dark:hover:bg-gray-700`}
                  onClick={() => handleSizeChange(value)}
                >
                  {desc}
                </button>
              ))}
            </div>
          </div>

          {/* 主题色 */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium">主题色</h2>
            <div className="grid grid-cols-3 justify-items-center gap-2">
              {config.colorOption.map(({ label, value }) => (
                <button
                  key={value}
                  className={`w-full px-3 py-2 text-sm border rounded flex items-center justify-center gap-2 ${
                    primaryColor === value
                      ? 'border-black dark:border-white border-2'
                      : 'border-gray-300 dark:border-gray-600'
                  } hover:bg-gray-100 dark:hover:bg-gray-700`}
                  onClick={() => handleColorChange(value)}
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full"
                    style={{ background: value }}
                  />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 代码块主题 */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium">代码块主题</h2>
            <div>
              <select
                className="w-full px-3 py-2 text-sm border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                value={codeBlockTheme}
                onChange={(e) => handleCodeBlockThemeChange(e.target.value)}
              >
                {config.codeThemeOption.map(({ label, value }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 图注格式 */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium">图注格式</h2>
            <div className="grid grid-cols-3 justify-items-center gap-2">
              {config.legendOption.map(({ label, value }) => (
                <button
                  key={value}
                  className={`w-full px-3 py-2 text-sm border rounded ${
                    legend === value
                      ? 'border-black dark:border-white border-2'
                      : 'border-gray-300 dark:border-gray-600'
                  } hover:bg-gray-100 dark:hover:bg-gray-700`}
                  onClick={() => handleLegendChange(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mac 代码块 */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium">Mac 代码块</h2>
            <div className="grid grid-cols-5 justify-items-center gap-2">
              <button
                className={`w-full px-3 py-2 text-sm border rounded ${
                  isMacCodeBlock
                    ? 'border-black dark:border-white border-2'
                    : 'border-gray-300 dark:border-gray-600'
                } hover:bg-gray-100 dark:hover:bg-gray-700`}
                onClick={() => !isMacCodeBlock && handleMacCodeBlockChange()}
              >
                开启
              </button>
              <button
                className={`w-full px-3 py-2 text-sm border rounded ${
                  !isMacCodeBlock
                    ? 'border-black dark:border-white border-2'
                    : 'border-gray-300 dark:border-gray-600'
                } hover:bg-gray-100 dark:hover:bg-gray-700`}
                onClick={() => isMacCodeBlock && handleMacCodeBlockChange()}
              >
                关闭
              </button>
            </div>
          </div>

          {/* 代码块行号 */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium">代码块行号</h2>
            <div className="grid grid-cols-5 justify-items-center gap-2">
              <button
                className={`w-full px-3 py-2 text-sm border rounded ${
                  isShowLineNumber
                    ? 'border-black dark:border-white border-2'
                    : 'border-gray-300 dark:border-gray-600'
                } hover:bg-gray-100 dark:hover:bg-gray-700`}
                onClick={() => !isShowLineNumber && handleShowLineNumberChange()}
              >
                开启
              </button>
              <button
                className={`w-full px-3 py-2 text-sm border rounded ${
                  !isShowLineNumber
                    ? 'border-black dark:border-white border-2'
                    : 'border-gray-300 dark:border-gray-600'
                } hover:bg-gray-100 dark:hover:bg-gray-700`}
                onClick={() => isShowLineNumber && handleShowLineNumberChange()}
              >
                关闭
              </button>
            </div>
          </div>

          {/* 微信外链转底部引用 */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium">微信外链转底部引用</h2>
            <div className="grid grid-cols-5 justify-items-center gap-2">
              <button
                className={`w-full px-3 py-2 text-sm border rounded ${
                  isCiteStatus
                    ? 'border-black dark:border-white border-2'
                    : 'border-gray-300 dark:border-gray-600'
                } hover:bg-gray-100 dark:hover:bg-gray-700`}
                onClick={() => !isCiteStatus && handleCiteStatusChange()}
              >
                开启
              </button>
              <button
                className={`w-full px-3 py-2 text-sm border rounded ${
                  !isCiteStatus
                    ? 'border-black dark:border-white border-2'
                    : 'border-gray-300 dark:border-gray-600'
                } hover:bg-gray-100 dark:hover:bg-gray-700`}
                onClick={() => isCiteStatus && handleCiteStatusChange()}
              >
                关闭
              </button>
            </div>
          </div>

          {/* 段落首行缩进 */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium">段落首行缩进</h2>
            <div className="grid grid-cols-5 justify-items-center gap-2">
              <button
                className={`w-full px-3 py-2 text-sm border rounded ${
                  isUseIndent
                    ? 'border-black dark:border-white border-2'
                    : 'border-gray-300 dark:border-gray-600'
                } hover:bg-gray-100 dark:hover:bg-gray-700`}
                onClick={() => !isUseIndent && handleUseIndentChange()}
              >
                开启
              </button>
              <button
                className={`w-full px-3 py-2 text-sm border rounded ${
                  !isUseIndent
                    ? 'border-black dark:border-white border-2'
                    : 'border-gray-300 dark:border-gray-600'
                } hover:bg-gray-100 dark:hover:bg-gray-700`}
                onClick={() => isUseIndent && handleUseIndentChange()}
              >
                关闭
              </button>
            </div>
          </div>

          {/* 段落两端对齐 */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium">段落两端对齐</h2>
            <div className="grid grid-cols-5 justify-items-center gap-2">
              <button
                className={`w-full px-3 py-2 text-sm border rounded ${
                  isUseJustify
                    ? 'border-black dark:border-white border-2'
                    : 'border-gray-300 dark:border-gray-600'
                } hover:bg-gray-100 dark:hover:bg-gray-700`}
                onClick={() => !isUseJustify && handleUseJustifyChange()}
              >
                开启
              </button>
              <button
                className={`w-full px-3 py-2 text-sm border rounded ${
                  !isUseJustify
                    ? 'border-black dark:border-white border-2'
                    : 'border-gray-300 dark:border-gray-600'
                } hover:bg-gray-100 dark:hover:bg-gray-700`}
                onClick={() => isUseJustify && handleUseJustifyChange()}
              >
                关闭
              </button>
            </div>
          </div>

          {/* 样式配置 */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium">样式配置</h2>
            <button
              className="w-full px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              onClick={handleResetStyle}
            >
              重置
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .mobile-right-drawer.animate {
          transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}
