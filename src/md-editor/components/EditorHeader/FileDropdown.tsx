import {
  Download,
  FileCode,
  FileCog,
  FileText,
  FolderKanban,
  FolderOpen,
  Package,
  Upload,
} from 'lucide-react';
import { useMdEditorStore } from '../../stores/editor-store';
import {
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from '../ui/Menubar';

interface FileDropdownProps {
  asSub?: boolean;
  onOpenEditorState?: () => void;
  onOpenTemplateDialog?: () => void;
  onToggleFolderPanel?: () => void;
  onTogglePostSlider?: () => void;
}

/**
 * 文件菜单下拉组件
 * 从 3rd/md FileDropdown.vue 转换而来
 * 使用 Radix UI Menubar，原生支持鼠标悬停切换
 */
export function FileDropdown({
  asSub = false,
  onOpenEditorState,
  onOpenTemplateDialog,
  onToggleFolderPanel,
  onTogglePostSlider,
}: FileDropdownProps) {
  const { getContent } = useMdEditorStore();

  // 导入 Markdown
  const handleImportMarkdown = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          // TODO: 实现导入功能
          console.log('导入 Markdown:', content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // 导出功能
  const handleExportMD = () => {
    const content = getContent();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportHTML = () => {
    // TODO: 实现 HTML 导出
    console.log('导出 HTML');
  };

  const handleExportPureHTML = () => {
    // TODO: 实现纯 HTML 导出
    console.log('导出纯 HTML');
  };

  const handleExportPDF = () => {
    // TODO: 实现 PDF 导出
    console.log('导出 PDF');
  };

  const handleDownloadAsImage = () => {
    // TODO: 实现图片导出
    console.log('导出为图片');
  };

  return (
    <MenubarMenu>
      <MenubarTrigger>文件</MenubarTrigger>
      <MenubarContent className="w-56">
        {/* 本地文件夹 */}
        <MenubarItem onClick={onToggleFolderPanel}>
          <FolderOpen className="mr-2 h-4 w-4" />
          本地文件夹
        </MenubarItem>

        <MenubarSeparator />

        {/* 导入子菜单 */}
        <MenubarSub>
          <MenubarSubTrigger>
            <Upload className="mr-2 h-4 w-4" />
            导入
          </MenubarSubTrigger>
          <MenubarSubContent className="w-56">
            <MenubarItem onClick={handleImportMarkdown}>
              <FileText className="mr-2 h-4 w-4" />
              导入 Markdown
            </MenubarItem>
          </MenubarSubContent>
        </MenubarSub>

        {/* 导出子菜单 */}
        <MenubarSub>
          <MenubarSubTrigger>
            <Download className="mr-2 h-4 w-4" />
            导出
          </MenubarSubTrigger>
          <MenubarSubContent className="w-56">
            <MenubarItem onClick={handleExportMD}>
              <FileText className="mr-2 h-4 w-4" />
              Markdown 文件
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={handleExportHTML}>
              <FileCode className="mr-2 h-4 w-4" />
              HTML 文件
            </MenubarItem>
            <MenubarItem onClick={handleExportPureHTML}>
              <FileCode className="mr-2 h-4 w-4" />
              HTML（无样式）
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              PDF 文档
            </MenubarItem>
            <MenubarItem onClick={handleDownloadAsImage}>
              <Download className="mr-2 h-4 w-4" />
              PNG 图片
            </MenubarItem>
          </MenubarSubContent>
        </MenubarSub>

        <MenubarSeparator />

        {/* 模板管理 */}
        <MenubarItem onClick={onOpenTemplateDialog}>
          <Package className="mr-2 h-4 w-4" />
          模板管理
        </MenubarItem>

        {/* 内容管理 */}
        <MenubarItem onClick={onTogglePostSlider}>
          <FolderKanban className="mr-2 h-4 w-4" />
          内容管理
        </MenubarItem>

        <MenubarSeparator />

        {/* 项目配置 */}
        <MenubarItem onClick={onOpenEditorState}>
          <FileCog className="mr-2 h-4 w-4" />
          项目配置
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  );
}
