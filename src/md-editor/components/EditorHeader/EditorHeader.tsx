import { useState } from 'react';
import { Copy, Menu as MenuIcon, Palette, Send } from 'lucide-react';
import { EditDropdown } from './EditDropdown';
import { FileDropdown } from './FileDropdown';
import { FormatDropdown } from './FormatDropdown';
import { InsertDropdown } from './InsertDropdown';
import { StyleDropdown } from './StyleDropdown';
import { ViewDropdown } from './ViewDropdown';
import { HelpDropdown } from './HelpDropdown';
import { UploadImgDialog, InsertTableDialog, InsertMpCardDialog, TemplateDialog, AboutDialog } from '../dialogs';
import { useMdEditorStore } from '../../stores/editor-store';
import { useMdRenderStore } from '../../stores/render-store';
import { Menubar } from '../ui/Menubar';

interface EditorHeaderProps {
  onCopy?: () => void;
  onInsertImage?: () => void;
  onInsertTable?: () => void;
  onInsertMpCard?: () => void;
  onToggleCssEditor?: () => void;
  onToggleRightSlider?: () => void;
  isOpenRightSlider?: boolean;
  isDark?: boolean;
  isEditOnLeft?: boolean;
  previewWidth?: string;
  onToggleDark?: (dark?: boolean) => void;
  onToggleEditOnLeft?: (left?: boolean) => void;
  onSetPreviewWidth?: (width: string) => void;
}

/**
 * 编辑器头部组件
 * 从 3rd/md editor-header/index.vue 转换而来
 */
function EditorHeader({
  onCopy,
  onInsertImage,
  onInsertTable,
  onInsertMpCard,
  onToggleCssEditor,
  onToggleRightSlider,
  isOpenRightSlider = false,
  isDark = false,
  isEditOnLeft = false,
  previewWidth = 'w-full',
  onToggleDark,
  onToggleEditOnLeft,
  onSetPreviewWidth,
}: EditorHeaderProps) {
  const { editor, getContent } = useMdEditorStore();
  const { output, render } = useMdRenderStore();
  const [copyMode, setCopyMode] = useState<'txt' | 'html' | 'html-without-style' | 'html-and-style' | 'md'>('txt');

  // 对话框状态
  const [aboutDialogVisible, setAboutDialogVisible] = useState(false);
  const [fundDialogVisible, setFundDialogVisible] = useState(false);
  const [editorStateDialogVisible, setEditorStateDialogVisible] = useState(false);
  const [uploadImgDialogVisible, setUploadImgDialogVisible] = useState(false);
  const [insertTableDialogVisible, setInsertTableDialogVisible] = useState(false);
  const [insertMpCardDialogVisible, setInsertMpCardDialogVisible] = useState(false);
  const [templateDialogVisible, setTemplateDialogVisible] = useState(false);

  // 编辑器刷新
  const editorRefresh = () => {
    const raw = getContent();
    if (raw) {
      render(raw);
    }
  };

  // 复制到微信公众号
  const handleCopy = async (mode: string) => {
    setCopyMode(mode as any);
    
    // 如果是 Markdown 源码，直接复制
    if (mode === 'md') {
      const mdContent = getContent();
      try {
        await navigator.clipboard.writeText(mdContent);
        console.log('已复制 Markdown 源码到剪贴板');
      } catch (error) {
        console.error('复制失败:', error);
      }
      return;
    }

    // 处理 HTML 复制模式
    const clipboardDiv = document.getElementById('output');
    if (!clipboardDiv) {
      console.error('未找到复制输出区域');
      return;
    }

    try {
      const temp = clipboardDiv.innerHTML;
      const plainText = clipboardDiv.textContent || '';

      if (mode === 'txt') {
        // 复制为 HTML 和纯文本（微信公众号格式）
        if (typeof ClipboardItem !== 'undefined') {
          const clipboardItem = new ClipboardItem({
            'text/html': new Blob([temp], { type: 'text/html' }),
            'text/plain': new Blob([plainText], { type: 'text/plain' }),
          });
          await navigator.clipboard.write([clipboardItem]);
        } else {
          // 降级方案：使用 execCommand
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            range.selectNodeContents(clipboardDiv);
            selection.removeAllRanges();
            selection.addRange(range);
            document.execCommand('copy');
            selection.removeAllRanges();
          }
        }
        console.log('已复制渲染后的内容到剪贴板，可直接到公众号后台粘贴');
      } else if (mode === 'html') {
        await navigator.clipboard.writeText(temp);
        console.log('已复制 HTML 源码到剪贴板');
      }
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleCopyToWeChat = async () => {
    await handleCopy('txt');
  };

  return (
    <header className="header-container h-15 flex flex-wrap items-center justify-between px-5 relative bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm z-50" style={{ zIndex: 50 }}>
      {/* 桌面端左侧菜单 */}
      <div className="hidden md:flex">
        <Menubar className="border-0">
          <FileDropdown
            onOpenEditorState={() => setEditorStateDialogVisible(true)}
            onOpenTemplateDialog={() => setTemplateDialogVisible(true)}
            onToggleFolderPanel={() => console.log('切换文件夹面板')}
            onTogglePostSlider={() => console.log('切换文章滑块')}
          />
          <EditDropdown onCopy={handleCopy} />
          <FormatDropdown />
          <InsertDropdown
            onInsertImage={() => setUploadImgDialogVisible(true)}
            onInsertTable={() => setInsertTableDialogVisible(true)}
            onInsertMpCard={() => setInsertMpCardDialogVisible(true)}
          />
          <StyleDropdown
            onToggleCssEditor={onToggleCssEditor}
            onResetStyle={() => console.log('重置样式')}
          />
          <ViewDropdown
            isDark={isDark}
            isEditOnLeft={isEditOnLeft}
            previewWidth={previewWidth}
            onToggleDark={onToggleDark}
            onToggleEditOnLeft={onToggleEditOnLeft}
            onSetPreviewWidth={onSetPreviewWidth}
            onToggleCssEditor={onToggleCssEditor}
            onToggleRightSlider={onToggleRightSlider}
            onToggleFloatingToc={(show, pin) => console.log('切换浮动目录', show, pin)}
          />
          <HelpDropdown
            onOpenAbout={() => setAboutDialogVisible(true)}
            onOpenFund={() => setFundDialogVisible(true)}
          />
        </Menubar>
      </div>

      {/* 移动端汉堡菜单按钮 */}
      <div className="md:hidden">
        {/* TODO: 实现移动端菜单 */}
        <button className="p-2 text-gray-700 dark:text-gray-300">
          <MenuIcon className="h-5 w-5" />
        </button>
      </div>

      {/* 右侧操作区 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 复制按钮 */}
        <button
          onClick={handleCopyToWeChat}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
        >
          <Copy className="mr-2 h-4 w-4" />
          <span>复制</span>
        </button>

        {/* 发布按钮（桌面端显示） */}
        <button
          onClick={() => console.log('发布功能待实现')}
          className="hidden md:flex px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 items-center"
        >
          <Send className="mr-2 h-4 w-4" />
          <span>发布</span>
        </button>

        {/* 样式面板 */}
        <button
          onClick={() => onToggleRightSlider?.()}
          className={`px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center ${
            isOpenRightSlider ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'
          }`}
        >
          <Palette className="mr-2 h-4 w-4" />
          <span>样式</span>
        </button>
      </div>

      {/* 对话框组件 */}
      <UploadImgDialog
        visible={uploadImgDialogVisible}
        onClose={() => setUploadImgDialogVisible(false)}
      />
      <InsertTableDialog
        visible={insertTableDialogVisible}
        onClose={() => setInsertTableDialogVisible(false)}
      />
      <InsertMpCardDialog
        visible={insertMpCardDialogVisible}
        onClose={() => setInsertMpCardDialogVisible(false)}
      />
      <TemplateDialog
        visible={templateDialogVisible}
        onClose={() => setTemplateDialogVisible(false)}
      />
      <AboutDialog
        visible={aboutDialogVisible}
        onClose={() => setAboutDialogVisible(false)}
      />
      {/* TODO: FundDialog 和 EditorStateDialog */}
    </header>
  );
}

export { EditorHeader };
