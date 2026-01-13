import { FileCode, Monitor, Moon, Palette, PanelLeft, Smartphone, Sun } from 'lucide-react';
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

interface ViewDropdownProps {
  asSub?: boolean;
  isDark?: boolean;
  isEditOnLeft?: boolean;
  previewWidth?: string;
  isShowCssEditor?: boolean;
  isOpenRightSlider?: boolean;
  onToggleDark?: (dark?: boolean) => void;
  onToggleEditOnLeft?: (left?: boolean) => void;
  onSetPreviewWidth?: (width: string) => void;
  onToggleCssEditor?: () => void;
  onToggleRightSlider?: () => void;
  onToggleFloatingToc?: (show: boolean, pin?: boolean) => void;
  isShowFloatingToc?: boolean;
  isPinFloatingToc?: boolean;
}

/**
 * 视图菜单下拉组件
 * 从 3rd/md ViewDropdown.vue 转换而来
 * 使用 Radix UI Menubar，原生支持鼠标悬停切换
 */
export function ViewDropdown({
  asSub = false,
  isDark = false,
  isEditOnLeft = false,
  previewWidth = 'w-full',
  isShowCssEditor = false,
  isOpenRightSlider = false,
  onToggleDark,
  onToggleEditOnLeft,
  onSetPreviewWidth,
  onToggleCssEditor,
  onToggleRightSlider,
  onToggleFloatingToc,
  isShowFloatingToc = false,
  isPinFloatingToc = false,
}: ViewDropdownProps) {
  const mobileWidth = 'w-[375px]';
  const desktopWidth = 'w-full';

  return (
    <MenubarMenu>
      <MenubarTrigger>视图</MenubarTrigger>
      <MenubarContent className="min-w-[200px]">
        {/* 外观子菜单 */}
        <MenubarSub>
          <MenubarSubTrigger>
            {isDark ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
            外观
          </MenubarSubTrigger>
          <MenubarSubContent className="w-40">
            <MenubarCheckboxItem
              checked={!isDark}
              onCheckedChange={(checked) => onToggleDark?.(!checked)}
            >
              浅色模式
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
              checked={isDark}
              onCheckedChange={(checked) => onToggleDark?.(checked)}
            >
              深色模式
            </MenubarCheckboxItem>
          </MenubarSubContent>
        </MenubarSub>

        {/* 编辑模式子菜单 */}
        <MenubarSub>
          <MenubarSubTrigger>
            <PanelLeft className="mr-2 h-4 w-4" />
            编辑模式
          </MenubarSubTrigger>
          <MenubarSubContent className="w-40">
            <MenubarCheckboxItem
              checked={isEditOnLeft}
              onCheckedChange={(checked) => onToggleEditOnLeft?.(checked)}
            >
              左侧编辑
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
              checked={!isEditOnLeft}
              onCheckedChange={(checked) => onToggleEditOnLeft?.(!checked)}
            >
              右侧编辑
            </MenubarCheckboxItem>
          </MenubarSubContent>
        </MenubarSub>

        {/* 预览模式子菜单 */}
        <MenubarSub>
          <MenubarSubTrigger>
            {previewWidth === mobileWidth ? (
              <Smartphone className="mr-2 h-4 w-4" />
            ) : (
              <Monitor className="mr-2 h-4 w-4" />
            )}
            预览模式
          </MenubarSubTrigger>
          <MenubarSubContent className="w-40">
            <MenubarCheckboxItem
              checked={previewWidth === mobileWidth}
              onCheckedChange={(checked) => {
                if (checked) {
                  onSetPreviewWidth?.(mobileWidth);
                }
              }}
            >
              移动端
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
              checked={previewWidth === desktopWidth}
              onCheckedChange={(checked) => {
                if (checked) {
                  onSetPreviewWidth?.(desktopWidth);
                }
              }}
            >
              电脑端
            </MenubarCheckboxItem>
          </MenubarSubContent>
        </MenubarSub>

        {/* 浮动目录子菜单 */}
        <MenubarSub>
          <MenubarSubTrigger>
            <PanelLeft className="mr-2 h-4 w-4" />
            浮动目录
          </MenubarSubTrigger>
          <MenubarSubContent className="w-40">
            <MenubarCheckboxItem
              checked={isShowFloatingToc && isPinFloatingToc}
              onCheckedChange={(checked) => {
                if (checked) {
                  onToggleFloatingToc?.(true, true);
                }
              }}
            >
              常驻显示
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
              checked={isShowFloatingToc && !isPinFloatingToc}
              onCheckedChange={(checked) => {
                if (checked) {
                  onToggleFloatingToc?.(true, false);
                }
              }}
            >
              移入触发
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
              checked={!isShowFloatingToc}
              onCheckedChange={(checked) => {
                if (checked) {
                  onToggleFloatingToc?.(false);
                }
              }}
            >
              隐藏
            </MenubarCheckboxItem>
          </MenubarSubContent>
        </MenubarSub>

        <MenubarSeparator />

        <MenubarItem onClick={onToggleRightSlider}>
          <Palette className="mr-2 h-4 w-4" />
          样式面板
        </MenubarItem>
        <MenubarItem onClick={onToggleCssEditor}>
          <FileCode className="mr-2 h-4 w-4" />
          CSS 编辑器
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  );
}
