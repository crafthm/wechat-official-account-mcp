import {
  ClipboardPaste,
  Copy,
  Redo2,
  Replace,
  Search,
  Undo2,
  WandSparkles,
} from 'lucide-react';
import { useMdEditorStore } from '../../stores/editor-store';
import {
  formatBold,
  formatItalic,
  formatStrikethrough,
  formatLink,
  formatCode,
  applyHeading,
  formatUnorderedList,
  formatOrderedList,
  undoAction,
  redoAction,
} from '../../lib/editor/format';
import type { EditorView } from '@codemirror/view';
import {
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from '../ui/Menubar';

interface EditDropdownProps {
  asSub?: boolean;
  onCopy?: (mode: string) => void;
}

/**
 * 编辑菜单下拉组件
 * 从 3rd/md EditDropdown.vue 转换而来
 * 使用 Radix UI Menubar，原生支持鼠标悬停切换
 */
export function EditDropdown({ asSub = false, onCopy }: EditDropdownProps) {
  const { editor, formatContent, getSelection, replaceSelection } = useMdEditorStore();

  // 格式化文档
  const handleFormatContent = async () => {
    await formatContent();
  };

  // 复制到剪贴板
  const handleCopyToClipboard = () => {
    const selectedText = getSelection();
    if (selectedText) {
      navigator.clipboard.writeText(selectedText).catch(console.error);
    }
  };

  // 从剪贴板粘贴
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      replaceSelection(text);
    } catch (error) {
      console.log('粘贴失败', error);
    }
  };

  // 撤销/重做
  const handleUndo = () => {
    if (!editor) return;
    try {
      undoAction(editor);
      editor.focus();
    } catch (error) {
      console.error('Undo failed:', error);
    }
  };

  const handleRedo = () => {
    if (!editor) return;
    try {
      redoAction(editor);
      editor.focus();
    } catch (error) {
      console.error('Redo failed:', error);
    }
  };

  // 获取快捷键符号（Mac/Windows）
  const ctrlSign = navigator.platform.includes('Mac') ? '⌘' : 'Ctrl';
  const altSign = navigator.platform.includes('Mac') ? '⌥' : 'Alt';
  const shiftSign = navigator.platform.includes('Mac') ? '⇧' : 'Shift';

  // 搜索/替换 - 暂时占位
  const handleOpenSearch = () => {
    // TODO: 实现搜索功能
    console.log('打开搜索');
  };

  const handleOpenReplace = () => {
    // TODO: 实现替换功能
    console.log('打开替换');
  };

  // 使用 Radix UI Menubar
  return (
    <MenubarMenu>
      <MenubarTrigger>编辑</MenubarTrigger>
      <MenubarContent className="min-w-[200px]">
        {/* 历史操作 */}
        <MenubarItem onClick={handleUndo}>
          <Undo2 className="mr-2 h-4 w-4" />
          <span className="flex-1">撤销</span>
          <MenubarShortcut>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              {ctrlSign}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              Z
            </kbd>
          </MenubarShortcut>
        </MenubarItem>
        <MenubarItem onClick={handleRedo}>
          <Redo2 className="mr-2 h-4 w-4" />
          <span className="flex-1">重做</span>
          <MenubarShortcut>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              {ctrlSign}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              Y
            </kbd>
          </MenubarShortcut>
        </MenubarItem>

        <MenubarSeparator />

        {/* 复制子菜单 */}
        <MenubarSub>
          <MenubarSubTrigger>
            <Copy className="mr-2 h-4 w-4" />
            复制
          </MenubarSubTrigger>
          <MenubarSubContent className="min-w-[180px]">
            <MenubarItem onClick={() => onCopy?.('txt')}>公众号格式</MenubarItem>
            <MenubarItem onClick={() => onCopy?.('html')}>HTML 格式</MenubarItem>
            <MenubarItem onClick={() => onCopy?.('html-without-style')}>
              HTML 格式（无样式）
            </MenubarItem>
            <MenubarItem onClick={() => onCopy?.('html-and-style')}>
              HTML 格式（兼容样式）
            </MenubarItem>
            <MenubarItem onClick={() => onCopy?.('md')}>MD 格式</MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={handleCopyToClipboard}>
              复制选中内容
              <MenubarShortcut>
                <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
                  {ctrlSign}
                </kbd>
                <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
                  C
                </kbd>
              </MenubarShortcut>
            </MenubarItem>
          </MenubarSubContent>
        </MenubarSub>

        <MenubarItem onClick={handlePasteFromClipboard}>
          <ClipboardPaste className="mr-2 h-4 w-4" />
          粘贴
          <MenubarShortcut>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              {ctrlSign}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              V
            </kbd>
          </MenubarShortcut>
        </MenubarItem>

        <MenubarSeparator />

        {/* 格式化文档 */}
        <MenubarItem onClick={handleFormatContent}>
          <WandSparkles className="mr-2 h-4 w-4" />
          格式化文档
          <MenubarShortcut>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              {altSign}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              {shiftSign}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              F
            </kbd>
          </MenubarShortcut>
        </MenubarItem>

        <MenubarSeparator />

        {/* 查找替换 */}
        <MenubarItem onClick={handleOpenSearch}>
          <Search className="mr-2 h-4 w-4" />
          查找
          <MenubarShortcut>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              {ctrlSign}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              F
            </kbd>
          </MenubarShortcut>
        </MenubarItem>
        <MenubarItem onClick={handleOpenReplace}>
          <Replace className="mr-2 h-4 w-4" />
          替换
          <MenubarShortcut>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              {ctrlSign}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              H
            </kbd>
          </MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  );
}
