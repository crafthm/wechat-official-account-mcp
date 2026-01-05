import { useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { RefreshCw } from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';
import { config } from '@/lib/markdown/config';
import { formatDoc } from '@/lib/utils/formatter';
import { downloadMD, exportHTML } from '@/lib/utils/formatter';

interface EditorHeaderProps {
  onImportMD: () => void;
  onUploadImage: () => void;
  onInsertTable: () => void;
  onShowCssEditor: () => void;
  onCopy?: () => void;
  onSave?: () => void;
  onPublish?: () => void;
  onRefresh?: () => void;
  isImportedFromLocal?: boolean;
  autoRefreshEnabled?: boolean;
  editorContent: string;
  outputHtml: string;
}

export function EditorHeader({
  onImportMD,
  onUploadImage,
  onInsertTable,
  onShowCssEditor,
  onCopy,
  onSave,
  onPublish,
  onRefresh,
  isImportedFromLocal = false,
  autoRefreshEnabled = false,
  editorContent,
  outputHtml,
}: EditorHeaderProps) {
  const {
    currentFont,
    currentSize,
    currentColor,
    codeTheme,
    legend,
    citeStatus,
    nightMode,
    isEditOnLeft,
    setCurrentFont,
    setCurrentSize,
    setCurrentColor,
    setCodeTheme,
    setLegend,
    setCiteStatus,
    toggleNightMode,
    setIsEditOnLeft,
    setEditorContent,
  } = useEditorStore();

  const handleFormat = () => {
    formatDoc(editorContent).then((formatted) => {
      setEditorContent(formatted);
    });
  };

  const handleDownload = () => {
    downloadMD(editorContent);
  };

  const handleExport = () => {
    exportHTML(outputHtml);
  };

  const formatItems = [
    { label: '加粗', kbd: 'Ctrl+B', action: () => {} },
    { label: '斜体', kbd: 'Ctrl+I', action: () => {} },
    { label: '删除线', kbd: 'Ctrl+D', action: () => {} },
    { label: '链接', kbd: 'Ctrl+K', action: () => {} },
    { label: '代码', kbd: 'Ctrl+L', action: () => {} },
  ];

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-2">
        {/* 文件菜单 */}
        <Menu as="div" className="relative">
          <Menu.Button className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            文件
          </Menu.Button>
          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onImportMD}
                    className={`${
                      active ? 'bg-gray-100 dark:bg-gray-700' : ''
                    } w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                  >
                    导入 .md
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleDownload}
                    className={`${
                      active ? 'bg-gray-100 dark:bg-gray-700' : ''
                    } w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                  >
                    导出 .md
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleExport}
                    className={`${
                      active ? 'bg-gray-100 dark:bg-gray-700' : ''
                    } w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                  >
                    导出 .html
                  </button>
                )}
              </Menu.Item>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={toggleNightMode}
                    className={`${
                      active ? 'bg-gray-100 dark:bg-gray-700' : ''
                    } w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between`}
                  >
                    <span>暗黑模式</span>
                    {nightMode && <span className="text-green-500">✓</span>}
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setIsEditOnLeft(!isEditOnLeft)}
                    className={`${
                      active ? 'bg-gray-100 dark:bg-gray-700' : ''
                    } w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between`}
                  >
                    <span>左侧编辑</span>
                    {isEditOnLeft && <span className="text-green-500">✓</span>}
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>

        {/* 格式菜单 */}
        <Menu as="div" className="relative">
          <Menu.Button className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            格式
          </Menu.Button>
          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
              {formatItems.map((item) => (
                <Menu.Item key={item.label}>
                  {({ active }) => (
                    <button
                      onClick={item.action}
                      className={`${
                        active ? 'bg-gray-100 dark:bg-gray-700' : ''
                      } w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between`}
                    >
                      <span>{item.label}</span>
                      <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 rounded">
                        {item.kbd}
                      </kbd>
                    </button>
                  )}
                </Menu.Item>
              ))}
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setCiteStatus(!citeStatus)}
                    className={`${
                      active ? 'bg-gray-100 dark:bg-gray-700' : ''
                    } w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between`}
                  >
                    <span>微信外链转底部引用</span>
                    {citeStatus && <span className="text-green-500">✓</span>}
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>

        {/* 编辑菜单 */}
        <Menu as="div" className="relative">
          <Menu.Button className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            编辑
          </Menu.Button>
          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onUploadImage}
                    className={`${
                      active ? 'bg-gray-100 dark:bg-gray-700' : ''
                    } w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                  >
                    上传图片
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onInsertTable}
                    className={`${
                      active ? 'bg-gray-100 dark:bg-gray-700' : ''
                    } w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                  >
                    插入表格
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>

        {/* 样式菜单 */}
        <Menu as="div" className="relative">
          <Menu.Button className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            样式
          </Menu.Button>
          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 max-h-96 overflow-y-auto">
              {/* 字体 */}
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  字体
                </div>
                {config.builtinFonts.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => setCurrentFont(font.value)}
                    className={`w-full text-left px-2 py-1 text-sm rounded ${
                      currentFont === font.value
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {font.label}
                  </button>
                ))}
              </div>

              {/* 字号 */}
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  字号
                </div>
                {config.sizeOption.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setCurrentSize(size.value)}
                    className={`w-full text-left px-2 py-1 text-sm rounded ${
                      currentSize === size.value
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>

              {/* 颜色 */}
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  颜色
                </div>
                {config.colorOption.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setCurrentColor(color.value)}
                    className={`w-full text-left px-2 py-1 text-sm rounded flex items-center ${
                      currentColor === color.value
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded mr-2"
                      style={{ backgroundColor: color.value }}
                    />
                    {color.label}
                  </button>
                ))}
              </div>

              {/* 代码主题 */}
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  代码主题
                </div>
                {config.codeThemeOption.map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => setCodeTheme(theme.value)}
                    className={`w-full text-left px-2 py-1 text-sm rounded ${
                      codeTheme === theme.value
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>

              {/* 图片说明 */}
              <div className="px-4 py-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  图片说明
                </div>
                {config.legendOption.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setLegend(opt.value)}
                    className={`w-full text-left px-2 py-1 text-sm rounded ${
                      legend === opt.value
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

        {/* 格式化按钮 */}
        <button
          onClick={handleFormat}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="格式化文档 (Ctrl+F)"
        >
          格式化
        </button>

        {/* CSS 编辑器按钮 */}
        <button
          onClick={onShowCssEditor}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          CSS
        </button>

        {/* 刷新按钮（仅当从本地导入时显示） */}
        {isImportedFromLocal && onRefresh && (
          <button
            onClick={onRefresh}
            className={`px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-1 ${
              autoRefreshEnabled ? 'text-green-600 dark:text-green-400' : ''
            }`}
            title={autoRefreshEnabled ? '自动刷新已启用（每3秒）' : '手动刷新文件'}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefreshEnabled ? 'animate-spin' : ''}`} />
            {autoRefreshEnabled ? '自动刷新' : '刷新'}
          </button>
        )}
      </div>

      {/* 右侧按钮组 */}
      <div className="flex items-center space-x-2">
        {/* 复制按钮 */}
        <button
          onClick={onCopy}
          className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          复制
        </button>
        
        {/* 保存按钮 */}
        <button
          onClick={onSave}
          className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          保存
        </button>
        
        {/* 发布按钮 */}
        <button
          onClick={onPublish}
          className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        >
          发布
        </button>
      </div>
    </div>
  );
}

