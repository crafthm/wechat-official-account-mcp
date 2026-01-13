import { useState, useEffect, useRef } from 'react';
import { CodemirrorEditor } from '@/md-editor/components/CodemirrorEditor';
import { EditorHeader } from '@/md-editor/components/EditorHeader';
import { SearchTab } from '@/md-editor/components/SearchTab';
import { FloatingToc } from '@/md-editor/components/FloatingToc';
import { EditorContextMenu } from '@/md-editor/components/EditorContextMenu';
import { useMdEditorStore } from '@/md-editor/stores/editor-store';
import { useMdRenderStore } from '@/md-editor/stores/render-store';

/**
 * EditorV2 - 使用隔离的 md-editor 组件的新编辑器页面
 * 用于测试和验证迁移代码
 */
export default function EditorV2() {
  const [content, setContent] = useState('');
  const [nightMode, setNightMode] = useState(false);
  const [isEditOnLeft, setIsEditOnLeft] = useState(false);
  const [previewWidth, setPreviewWidth] = useState('w-full');
  const [showSearchTab, setShowSearchTab] = useState(false);
  const [searchWord, setSearchWord] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showFloatingToc, setShowFloatingToc] = useState(true);
  const [pinFloatingToc, setPinFloatingToc] = useState(false);
  const [isOpenRightSlider, setIsOpenRightSlider] = useState(false);
  const [showCssEditor, setShowCssEditor] = useState(false);
  
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const { editor, getContent } = useMdEditorStore();
  const { output } = useMdRenderStore();

  // 初始化内容
  useEffect(() => {
    setContent('# 欢迎使用新编辑器\n\n这是从 3rd/md 移植的编辑器。\n\n## 功能特性\n\n- ✅ 核心编辑器功能\n- ✅ 预览面板\n- ✅ 中文粗体/斜体支持\n- ✅ 编辑器头部菜单\n- ✅ 对话框组件\n- ✅ 搜索功能\n- ✅ 浮动目录\n\n**这是粗体** 和 *这是斜体*\n\n1. 有序列表\n2. 列表项\n\n- 无序列表\n- 列表项');
  }, []);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuVisible(true);
  };

  // 处理复制
  const handleCopy = () => {
    // TODO: 实现复制功能
    console.log('复制到剪贴板');
  };

  // 处理导出
  const handleExportHTML = () => {
    const html = output;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMD = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 处理导入
  const handleImportMD = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setContent(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className={`h-full flex flex-col ${nightMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-900`}>
      {/* 编辑器头部 */}
      <EditorHeader
        onCopy={handleCopy}
        onInsertImage={() => console.log('插入图片')}
        onInsertTable={() => console.log('插入表格')}
        onInsertMpCard={() => console.log('插入小程序卡片')}
        onToggleCssEditor={() => setShowCssEditor(!showCssEditor)}
        onToggleRightSlider={() => setIsOpenRightSlider(!isOpenRightSlider)}
        isOpenRightSlider={isOpenRightSlider}
        isDark={nightMode}
        isEditOnLeft={isEditOnLeft}
        previewWidth={previewWidth}
        onToggleDark={() => setNightMode(!nightMode)}
        onToggleEditOnLeft={(left) => setIsEditOnLeft(left ?? !isEditOnLeft)}
        onSetPreviewWidth={(width) => setPreviewWidth(width)}
      />

      {/* 编辑器主体 */}
      <div
        ref={editorContainerRef}
        className="flex-1 overflow-hidden relative"
        onContextMenu={handleContextMenu}
        onClick={() => setContextMenuVisible(false)}
      >
        {/* 搜索面板 */}
        {showSearchTab && editor && (
          <div className="absolute top-0 right-0 z-50">
            <SearchTab
              editorView={editor}
              visible={showSearchTab}
              onClose={() => setShowSearchTab(false)}
              initialSearch={searchWord}
              showReplace={showReplace}
            />
          </div>
        )}

        <CodemirrorEditor
          initialContent={content}
          onContentChange={handleContentChange}
          nightMode={nightMode}
          showPreview={true}
          isEditOnLeft={isEditOnLeft}
        />

        {/* 浮动目录 */}
        <FloatingToc
          visible={showFloatingToc}
          pinned={pinFloatingToc}
        />
      </div>

      {/* 右键菜单 */}
      {contextMenuVisible && (
        <EditorContextMenu
          visible={contextMenuVisible}
          onClose={() => setContextMenuVisible(false)}
          position={contextMenuPosition}
          onCopy={handleCopy}
          onExportHTML={handleExportHTML}
          onExportMD={handleExportMD}
          onImportMD={handleImportMD}
          onFormatContent={() => console.log('格式化文档')}
          onClearContent={() => setContent('')}
          onResetStyle={() => console.log('重置样式')}
        />
      )}
    </div>
  );
}
