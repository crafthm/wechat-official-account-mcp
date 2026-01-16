/**
 * CSS 编辑器组件
 * 从 3rd/md CssEditor.vue 转换而来
 * 简化版本，保留核心功能
 */

import { Download, Edit3, Eye, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMdCssEditorStore } from '../stores/cssEditor-store';
import { useMdEditorStore } from '../stores/editor-store';
import { useMdRenderStore } from '../stores/render-store';
import { useMdThemeStore } from '../stores/theme-store';
import { useMdUIStore } from '../stores/ui-store';
import { useEffect as useEffectCss, useRef as useRefCss } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { css } from '@codemirror/lang-css';

export function CssEditor() {
  const cssEditorStore = useMdCssEditorStore();
  const uiStore = useMdUIStore();
  const renderStore = useMdRenderStore();
  const editorStore = useMdEditorStore();
  const themeStore = useMdThemeStore();

  const { isMobile, isShowCssEditor } = uiStore;
  const { cssContentConfig } = cssEditorStore;

  // 控制是否启用动画
  const [enableAnimation, setEnableAnimation] = useState(false);
  const [isOpenEditDialog, setIsOpenEditDialog] = useState(false);
  const [isOpenAddDialog, setIsOpenAddDialog] = useState(false);
  const [isOpenDelTabConfirmDialog, setIsOpenDelTabConfirmDialog] = useState(false);
  const [isOpenViewThemeDialog, setIsOpenViewThemeDialog] = useState(false);
  const [editInputVal, setEditInputVal] = useState('');
  const [addInputVal, setAddInputVal] = useState('');
  const [delTargetName, setDelTargetName] = useState('');
  const [selectedViewTheme, setSelectedViewTheme] = useState<'default' | 'grace' | 'simple'>('default');
  const [baseThemeForNew, setBaseThemeForNew] = useState<'blank' | 'default' | 'grace' | 'simple'>('blank');

  // 监听 CssEditor 开关状态变化
  useEffect(() => {
    if (isMobile) {
      setEnableAnimation(true);
    }
  }, [isShowCssEditor, isMobile]);

  // 监听设备类型变化，重置动画状态
  useEffect(() => {
    setEnableAnimation(false);
  }, [isMobile]);

  // 初始化 CSS 编辑器
  useEffect(() => {
    const handleCssUpdate = () => {
      themeStore.applyCurrentTheme();
      themeStore.updateCodeTheme();
      const raw = editorStore.getContent();
      renderStore.render(raw);
    };

    cssEditorStore.setOnTabChangedCallback(handleCssUpdate);
    cssEditorStore.initCssEditor(handleCssUpdate);
  }, []);

  const handleTabChange = (name: string) => {
    cssEditorStore.tabChanged(name);
  };

  const handleRename = (name: string) => {
    setEditInputVal(name);
    setIsOpenEditDialog(true);
  };

  const handleEditTabName = () => {
    if (!editInputVal.trim()) {
      alert('新建失败，方案名不可为空');
      return;
    }

    if (!cssEditorStore.validatorTabName(editInputVal)) {
      alert('不能与现有方案重名');
      return;
    }
    cssEditorStore.renameTab(editInputVal);
    setIsOpenEditDialog(false);
  };

  const handleAdd = () => {
    setAddInputVal(`方案${cssContentConfig.tabs.length + 1}`);
    setBaseThemeForNew('blank');
    setIsOpenAddDialog(true);
  };

  const handleAddTab = () => {
    if (!addInputVal.trim()) {
      alert('新建失败，方案名不可为空');
      return;
    }

    if (!cssEditorStore.validatorTabName(addInputVal)) {
      alert('不能与现有方案重名');
      return;
    }

    // TODO: 根据 baseThemeForNew 获取初始内容
    const initialContent = baseThemeForNew === 'blank' ? '' : '/* TODO: 加载主题内容 */';
    cssEditorStore.addCssContentTab(addInputVal, initialContent);

    setIsOpenAddDialog(false);
    setBaseThemeForNew('blank');
  };

  const handleRemove = (targetName: string) => {
    setDelTargetName(targetName);
    setIsOpenDelTabConfirmDialog(true);
  };

  const handleDelTab = () => {
    const tabs = cssContentConfig.tabs;
    if (tabs.length === 1) {
      alert('至少保留一个方案');
      return;
    }

    let activeName = cssContentConfig.active;
    if (activeName === delTargetName) {
      tabs.forEach((tab, index) => {
        if (tab.name === delTargetName) {
          const nextTab = tabs[index + 1] || tabs[index - 1];
          if (nextTab) {
            activeName = nextTab.name;
          }
        }
      });
    }

    cssEditorStore.tabChanged(activeName);
    // TODO: 更新 tabs，删除目标 tab
    setIsOpenDelTabConfirmDialog(false);
  };

  const handleOpenViewThemeDialog = () => {
    setSelectedViewTheme('default');
    setIsOpenViewThemeDialog(true);
  };

  const handleCopyThemeCSS = async () => {
    // TODO: 获取主题 CSS
    const css = '/* TODO: 获取主题 CSS */';
    await navigator.clipboard.writeText(css);
    alert('已复制到剪贴板');
  };

  const handleCreateFromViewTheme = () => {
    setIsOpenViewThemeDialog(false);
    setBaseThemeForNew(selectedViewTheme);
    setAddInputVal(`基于${selectedViewTheme}主题`);
    setIsOpenAddDialog(true);
  };

  const handleExportCurrentTheme = () => {
    const currentTab = cssContentConfig.tabs.find(
      (tab) => tab.name === cssContentConfig.active
    );
    if (!currentTab) {
      alert('未找到当前方案');
      return;
    }

    // TODO: 实现导出功能
    console.log('导出主题:', currentTab);
    alert('主题导出成功');
  };

  const handleCssChange = (content: string) => {
    const tab = cssEditorStore.getCurrentTab();
    if (tab) {
      // 更新当前 tab 的内容
      const newTabs = cssContentConfig.tabs.map((t) =>
        t.name === tab.name ? { ...t, content } : t
      );
      cssEditorStore.cssContentConfig.tabs = newTabs;
      
      // 触发更新
      if (cssEditorStore.onTabChangedCallback) {
        cssEditorStore.onTabChangedCallback(content);
      }
    }
  };

  if (!isShowCssEditor) {
    return null;
  }

  return (
    <>
      {/* 移动端遮罩层 */}
      {isMobile && isShowCssEditor && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => uiStore.toggleShowCssEditor()}
        />
      )}

      <div
        className={`cssEditor-wrapper h-full flex flex-col mobile-css-editor overflow-y-auto ${
          isMobile
            ? `fixed top-0 right-0 w-full h-full z-100 bg-white dark:bg-gray-900 border-l shadow-lg ${
                enableAnimation ? 'animate' : ''
              }`
            : 'border-l-2 flex-1 order-2 border-gray-200 dark:border-gray-700 min-w-0'
        }`}
        style={{
          transform: isMobile
            ? isShowCssEditor
              ? 'translateX(0)'
              : 'translateX(100%)'
            : 'none',
        }}
      >
        {/* 移动端标题栏 */}
        {isMobile && (
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b mb-2 bg-white dark:bg-gray-900">
            <h2 className="text-lg font-semibold">自定义 CSS</h2>
            <button
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              onClick={() => uiStore.toggleShowCssEditor()}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center border-b bg-gray-100 dark:bg-gray-800">
          <div className="flex-1 overflow-x-auto flex border-0 bg-transparent h-auto p-0">
            {cssContentConfig.tabs.map((item) => (
              <button
                key={item.name}
                className={`flex-1 px-4 py-2 text-sm border-b-2 ${
                  cssContentConfig.active === item.name
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400'
                } hover:text-gray-900 dark:hover:text-gray-200`}
                onClick={() => handleTabChange(item.name)}
              >
                <span className="flex items-center gap-2">
                  {item.title}
                  {cssContentConfig.active === item.name && (
                    <>
                      <Edit3
                        className="h-4 w-4 cursor-pointer rounded-full p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(item.name);
                        }}
                      />
                      <X
                        className="h-4 w-4 cursor-pointer rounded-full p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(item.name);
                        }}
                      />
                    </>
                  )}
                </span>
              </button>
            ))}
          </div>
          <button
            className="h-9 w-9 shrink-0 hover:bg-gray-200 dark:hover:bg-gray-700 p-2"
            onClick={handleAdd}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* CSS编辑器内容区域 */}
        <div className="flex-1 min-h-0">
          <CssCodeEditor
            value={cssEditorStore.getCurrentTabContent()}
            onChange={handleCssChange}
            isDark={uiStore.isDark}
          />
        </div>
      </div>

      {/* 操作按钮 */}
      {isShowCssEditor && (
        <>
          <button
            className={`fixed z-100 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-shadow bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm ${
              isMobile ? 'bottom-16 right-4' : 'bottom-22 right-4'
            }`}
            onClick={handleOpenViewThemeDialog}
          >
            <Eye className="h-4 w-4 mr-2 inline" />
            内置主题
          </button>
          <button
            className={`fixed z-100 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-shadow bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm ${
              isMobile ? 'bottom-4 right-4' : 'bottom-10 right-4'
            }`}
            onClick={handleExportCurrentTheme}
          >
            <Download className="h-4 w-4 mr-2 inline" />
            导出主题
          </button>
        </>
      )}

      {/* 对话框组件 - 简化版本，使用原生 alert/confirm */}
      {/* TODO: 使用 Dialog 组件替换 */}
      
      <style>{`
        .mobile-css-editor.animate {
          transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}

/**
 * CSS CodeMirror 编辑器组件
 */
function CssCodeEditor({
  value,
  onChange,
  isDark = false,
}: {
  value: string;
  onChange: (content: string) => void;
  isDark?: boolean;
}) {
  const cssEditorStore = useMdCssEditorStore();
  const editorRef = useRefCss<HTMLDivElement>(null);
  const viewRef = useRefCss<EditorView | null>(null);

  useEffectCss(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        css(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const content = update.state.doc.toString();
            onChange(content);
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
    cssEditorStore.setCssEditor(view);

    return () => {
      view.destroy();
    };
  }, [cssEditorStore]);

  // 更新内容
  useEffectCss(() => {
    if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return <div ref={editorRef} className="h-full w-full" />;
}
