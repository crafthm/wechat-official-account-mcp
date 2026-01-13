import { Menu, Transition } from '@headlessui/react';
import {
  Copy,
  ClipboardPaste,
  Undo2,
  Redo2,
  WandSparkles,
  Download,
  Upload,
  FileCode,
  Trash2,
} from 'lucide-react';
import { useMdEditorStore } from '../stores/editor-store';
import {
  undoAction,
  redoAction,
} from '../lib/editor/format';

interface EditorContextMenuProps {
  visible: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
  onCopy?: (mode: string) => void;
  onExportHTML?: () => void;
  onExportMD?: () => void;
  onImportMD?: () => void;
  onFormatContent?: () => void;
  onClearContent?: () => void;
  onResetStyle?: () => void;
}

/**
 * 编辑器右键菜单
 * 从 3rd/md EditorContextMenu.vue 转换而来
 */
export function EditorContextMenu({
  visible,
  onClose,
  position = { x: 0, y: 0 },
  onCopy,
  onExportHTML,
  onExportMD,
  onImportMD,
  onFormatContent,
  onClearContent,
  onResetStyle,
}: EditorContextMenuProps) {
  const { editor, getSelection, replaceSelection, formatContent, clearContent } = useMdEditorStore();

  // 获取快捷键符号
  const ctrlSign = navigator.platform.includes('Mac') ? '⌘' : 'Ctrl';

  // 撤销
  const handleUndo = () => {
    if (!editor) return;
    try {
      undoAction(editor);
      editor.focus();
    } catch (error) {
      console.error('Undo failed:', error);
    }
    onClose();
  };

  // 重做
  const handleRedo = () => {
    if (!editor) return;
    try {
      redoAction(editor);
      editor.focus();
    } catch (error) {
      console.error('Redo failed:', error);
    }
    onClose();
  };

  // 复制到剪贴板
  const handleCopyToClipboard = async () => {
    const selectedText = getSelection();
    if (selectedText) {
      try {
        await navigator.clipboard.writeText(selectedText);
      } catch (error) {
        console.error('复制失败:', error);
      }
    }
    onClose();
  };

  // 从剪贴板粘贴
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      replaceSelection(text);
    } catch (error) {
      console.error('粘贴失败:', error);
    }
    onClose();
  };

  // 格式化文档
  const handleFormatContent = async () => {
    await formatContent();
    onFormatContent?.();
    onClose();
  };

  // 清空内容
  const handleClearContent = () => {
    clearContent();
    onClearContent?.();
    onClose();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed z-50"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      <Menu>
        <Menu.Items
          static
          className="w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          {/* 历史操作 */}
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleUndo}
                className={`${
                  active ? 'bg-gray-100 dark:bg-gray-700' : ''
                } group flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                撤销
                <span className="ml-auto flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">{ctrlSign}</kbd>
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">Z</kbd>
                </span>
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleRedo}
                className={`${
                  active ? 'bg-gray-100 dark:bg-gray-700' : ''
                } group flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
              >
                <Redo2 className="mr-2 h-4 w-4" />
                重做
                <span className="ml-auto flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">{ctrlSign}</kbd>
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">Y</kbd>
                </span>
              </button>
            )}
          </Menu.Item>

          <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

          {/* 剪贴板操作 */}
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleCopyToClipboard}
                className={`${
                  active ? 'bg-gray-100 dark:bg-gray-700' : ''
                } group flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
              >
                <Copy className="mr-2 h-4 w-4" />
                复制
                <span className="ml-auto flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">{ctrlSign}</kbd>
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">C</kbd>
                </span>
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handlePasteFromClipboard}
                className={`${
                  active ? 'bg-gray-100 dark:bg-gray-700' : ''
                } group flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
              >
                <ClipboardPaste className="mr-2 h-4 w-4" />
                粘贴
                <span className="ml-auto flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">{ctrlSign}</kbd>
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">V</kbd>
                </span>
              </button>
            )}
          </Menu.Item>

          <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

          {/* 格式化文档 */}
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleFormatContent}
                className={`${
                  active ? 'bg-gray-100 dark:bg-gray-700' : ''
                } group flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
              >
                <WandSparkles className="mr-2 h-4 w-4" />
                格式化文档
              </button>
            )}
          </Menu.Item>

          <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

          {/* 导入/导出 */}
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={onImportMD}
                className={`${
                  active ? 'bg-gray-100 dark:bg-gray-700' : ''
                } group flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
              >
                <Upload className="mr-2 h-4 w-4" />
                导入 Markdown
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={onExportMD}
                className={`${
                  active ? 'bg-gray-100 dark:bg-gray-700' : ''
                } group flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
              >
                <Download className="mr-2 h-4 w-4" />
                导出 Markdown
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={onExportHTML}
                className={`${
                  active ? 'bg-gray-100 dark:bg-gray-700' : ''
                } group flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
              >
                <FileCode className="mr-2 h-4 w-4" />
                导出 HTML
              </button>
            )}
          </Menu.Item>

          <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

          {/* 清空内容 */}
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleClearContent}
                className={`${
                  active ? 'bg-gray-100 dark:bg-gray-700' : ''
                } group flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400`}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                清空内容
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Menu>
    </div>
  );
}
