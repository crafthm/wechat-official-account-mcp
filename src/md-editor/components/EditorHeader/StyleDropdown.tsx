import { useMdEditorStore } from '../../stores/editor-store';
import { useMdRenderStore } from '../../stores/render-store';
import { config } from '@/lib/markdown/config';
import {
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  MenubarCheckboxItem,
} from '../ui/Menubar';

interface StyleDropdownProps {
  asSub?: boolean;
  onToggleCssEditor?: () => void;
  onResetStyle?: () => void;
}

/**
 * 样式菜单下拉组件
 * 从 3rd/md StyleDropdown.vue 转换而来
 * 使用 Radix UI Menubar，原生支持鼠标悬停切换
 */
export function StyleDropdown({
  asSub = false,
  onToggleCssEditor,
  onResetStyle,
}: StyleDropdownProps) {
  const { editor } = useMdEditorStore();
  const { render } = useMdRenderStore();

  // 编辑器刷新
  const editorRefresh = () => {
    const raw = editor?.state.doc.toString() || '';
    if (raw) {
      render(raw);
    }
  };

  // 主题切换（暂时占位）
  const handleThemeChange = (theme: string) => {
    // TODO: 实现主题切换
    console.log('切换主题:', theme);
    editorRefresh();
  };

  // 字体切换（暂时占位）
  const handleFontChange = (font: string) => {
    // TODO: 实现字体切换
    console.log('切换字体:', font);
    editorRefresh();
  };

  // 字号切换（暂时占位）
  const handleSizeChange = (size: string) => {
    // TODO: 实现字号切换
    console.log('切换字号:', size);
    editorRefresh();
  };

  // 主题色切换（暂时占位）
  const handleColorChange = (color: string) => {
    // TODO: 实现主题色切换
    console.log('切换主题色:', color);
    editorRefresh();
  };

  // 代码块主题切换（暂时占位）
  const handleCodeBlockThemeChange = (theme: string) => {
    // TODO: 实现代码块主题切换
    console.log('切换代码块主题:', theme);
    editorRefresh();
  };

  // 图注格式切换（暂时占位）
  const handleLegendChange = (legend: string) => {
    // TODO: 实现图注格式切换
    console.log('切换图注格式:', legend);
    editorRefresh();
  };

  // Mac 代码块切换（暂时占位）
  const handleMacCodeBlockChange = (checked: boolean) => {
    // TODO: 实现 Mac 代码块切换
    console.log('切换 Mac 代码块:', checked);
    editorRefresh();
  };

  return (
    <MenubarMenu>
      <MenubarTrigger>样式</MenubarTrigger>
      <MenubarContent className="w-56 max-h-96 overflow-y-auto">
        {/* 字体 */}
        <MenubarSub>
          <MenubarSubTrigger>字体</MenubarSubTrigger>
          <MenubarSubContent>
            {config.builtinFonts.map((font) => (
              <MenubarItem key={font.value} onClick={() => handleFontChange(font.value)}>
                {font.label}
              </MenubarItem>
            ))}
          </MenubarSubContent>
        </MenubarSub>

        {/* 字号 */}
        <MenubarSub>
          <MenubarSubTrigger>字号</MenubarSubTrigger>
          <MenubarSubContent>
            {config.sizeOption.map((size) => (
              <MenubarItem key={size.value} onClick={() => handleSizeChange(size.value)}>
                {size.label}
              </MenubarItem>
            ))}
          </MenubarSubContent>
        </MenubarSub>

        {/* 主题色 */}
        <MenubarSub>
          <MenubarSubTrigger>主题色</MenubarSubTrigger>
          <MenubarSubContent>
            {config.colorOption.map((color) => (
              <MenubarItem key={color.value} onClick={() => handleColorChange(color.value)}>
                {color.label}
              </MenubarItem>
            ))}
          </MenubarSubContent>
        </MenubarSub>

        <MenubarSeparator />

        {/* 自定义 CSS */}
        <MenubarItem onClick={onToggleCssEditor}>自定义 CSS</MenubarItem>

        <MenubarSeparator />

        {/* Mac 代码块 */}
        <MenubarCheckboxItem
          checked={false}
          onCheckedChange={handleMacCodeBlockChange}
        >
          Mac 代码块
        </MenubarCheckboxItem>

        <MenubarSeparator />

        {/* 重置 */}
        <MenubarItem onClick={onResetStyle}>重置</MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  );
}
