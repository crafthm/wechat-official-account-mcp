import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Italic,
  Link,
  Link2,
  List,
  ListOrdered,
  Palette,
  Strikethrough,
  Clock,
} from 'lucide-react';
import { useMdEditorStore } from '../../stores/editor-store';
import { useMdRenderStore } from '../../stores/render-store';
import {
  formatBold,
  formatItalic,
  formatStrikethrough,
  formatLink,
  formatCode,
  applyHeading,
  formatUnorderedList,
  formatOrderedList,
} from '../../lib/editor/format';
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

interface FormatDropdownProps {
  asSub?: boolean;
}

/**
 * 格式菜单下拉组件
 * 从 3rd/md FormatDropdown.vue 转换而来
 * 使用 Radix UI Menubar，原生支持鼠标悬停切换
 */
export function FormatDropdown({ asSub = false }: FormatDropdownProps) {
  const { editor } = useMdEditorStore();
  const { render: renderContent } = useMdRenderStore();

  // 获取快捷键符号
  const ctrlSign = navigator.platform.includes('Mac') ? '⌘' : 'Ctrl';

  // 编辑器刷新
  const editorRefresh = () => {
    const raw = editor?.state.doc.toString() || '';
    if (raw) {
      renderContent(raw);
    }
  };

  // 添加格式
  const addFormat = (cmd: string) => {
    if (!editor) return;

    switch (cmd) {
      case 'Mod-B':
        formatBold(editor);
        break;
      case 'Mod-I':
        formatItalic(editor);
        break;
      case 'Mod-D':
        formatStrikethrough(editor);
        break;
      case 'Mod-K':
        formatLink(editor);
        break;
      case 'Mod-E':
        formatCode(editor);
        break;
      case 'Mod-1':
        applyHeading(editor, 1);
        break;
      case 'Mod-2':
        applyHeading(editor, 2);
        break;
      case 'Mod-3':
        applyHeading(editor, 3);
        break;
      case 'Mod-4':
        applyHeading(editor, 4);
        break;
      case 'Mod-5':
        applyHeading(editor, 5);
        break;
      case 'Mod-6':
        applyHeading(editor, 6);
        break;
      case 'Mod-U':
        formatUnorderedList(editor);
        break;
      case 'Mod-O':
        formatOrderedList(editor);
        break;
    }
    editor.focus();
  };

  // 文字颜色（暂时占位）
  const handleTextColor = () => {
    // TODO: 实现颜色选择器
    console.log('设置文字颜色');
  };

  // 微信外链转引用（暂时占位）
  const handleCiteStatus = () => {
    // TODO: 实现外链转引用
    console.log('切换外链转引用');
    editorRefresh();
  };

  // 统计字数时间（暂时占位）
  const handleCountStatus = () => {
    // TODO: 实现字数统计
    console.log('切换字数统计');
    editorRefresh();
  };

  const headingIcons = [Heading1, Heading2, Heading3, Heading4, Heading5, Heading6];

  return (
    <MenubarMenu>
      <MenubarTrigger>格式</MenubarTrigger>
      <MenubarContent className="w-64">
        {/* 文本格式化 */}
        <MenubarItem onClick={() => addFormat('Mod-B')}>
          <Bold className="mr-2 h-4 w-4" />
          加粗
          <MenubarShortcut>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              {ctrlSign}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              B
            </kbd>
          </MenubarShortcut>
        </MenubarItem>
        <MenubarItem onClick={() => addFormat('Mod-I')}>
          <Italic className="mr-2 h-4 w-4" />
          斜体
          <MenubarShortcut>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              {ctrlSign}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              I
            </kbd>
          </MenubarShortcut>
        </MenubarItem>
        <MenubarItem onClick={() => addFormat('Mod-D')}>
          <Strikethrough className="mr-2 h-4 w-4" />
          删除线
          <MenubarShortcut>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              {ctrlSign}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              D
            </kbd>
          </MenubarShortcut>
        </MenubarItem>
        <MenubarItem onClick={() => addFormat('Mod-K')}>
          <Link className="mr-2 h-4 w-4" />
          超链接
          <MenubarShortcut>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              {ctrlSign}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              K
            </kbd>
          </MenubarShortcut>
        </MenubarItem>
        <MenubarItem onClick={() => addFormat('Mod-E')}>
          <Code className="mr-2 h-4 w-4" />
          行内代码
          <MenubarShortcut>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              {ctrlSign}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              E
            </kbd>
          </MenubarShortcut>
        </MenubarItem>
        <MenubarItem onClick={handleTextColor}>
          <Palette className="mr-2 h-4 w-4" />
          文字颜色
        </MenubarItem>

        <MenubarSeparator />

        {/* 标题子菜单 */}
        <MenubarSub>
          <MenubarSubTrigger>
            <Heading1 className="mr-2 h-4 w-4" />
            标题
          </MenubarSubTrigger>
          <MenubarSubContent className="w-48">
            {[1, 2, 3, 4, 5, 6].map((level) => {
              const HeadingIcon = headingIcons[level - 1];
              return (
                <MenubarItem key={level} onClick={() => addFormat(`Mod-${level}`)}>
                  <HeadingIcon className="mr-2 h-4 w-4" />
                  标题 {level}
                  <MenubarShortcut>
                    <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
                      {ctrlSign}
                    </kbd>
                    <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
                      {level}
                    </kbd>
                  </MenubarShortcut>
                </MenubarItem>
              );
            })}
          </MenubarSubContent>
        </MenubarSub>

        <MenubarItem onClick={() => addFormat('Mod-U')}>
          <List className="mr-2 h-4 w-4" />
          无序列表
          <MenubarShortcut>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              {ctrlSign}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              U
            </kbd>
          </MenubarShortcut>
        </MenubarItem>
        <MenubarItem onClick={() => addFormat('Mod-O')}>
          <ListOrdered className="mr-2 h-4 w-4" />
          有序列表
          <MenubarShortcut>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              {ctrlSign}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded">
              O
            </kbd>
          </MenubarShortcut>
        </MenubarItem>

        <MenubarSeparator />

        <MenubarItem onClick={handleCiteStatus}>
          <Link2 className="mr-2 h-4 w-4" />
          微信外链转引用
        </MenubarItem>
        <MenubarItem onClick={handleCountStatus}>
          <Clock className="mr-2 h-4 w-4" />
          统计字数时间
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  );
}
