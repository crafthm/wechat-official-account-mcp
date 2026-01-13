import { Heart, HelpCircle, MessageSquare, Tag } from 'lucide-react';
import {
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
} from '../ui/Menubar';

interface HelpDropdownProps {
  asSub?: boolean;
  onOpenAbout?: () => void;
  onOpenFund?: () => void;
}

/**
 * 帮助菜单下拉组件
 * 从 3rd/md HelpDropdown.vue 转换而来
 * 使用 Radix UI Menubar，原生支持鼠标悬停切换
 */
export function HelpDropdown({ asSub = false, onOpenAbout, onOpenFund }: HelpDropdownProps) {
  const handleFeedback = () => {
    window.open('https://github.com/doocs/md/issues', '_blank');
  };

  const handleReleases = () => {
    window.open('https://github.com/doocs/md/releases', '_blank');
  };

  return (
    <MenubarMenu>
      <MenubarTrigger>帮助</MenubarTrigger>
      <MenubarContent className="min-w-[180px]">
        <MenubarItem onClick={handleFeedback}>
          <MessageSquare className="mr-2 h-4 w-4" />
          反馈
        </MenubarItem>
        <MenubarItem onClick={handleReleases}>
          <Tag className="mr-2 h-4 w-4" />
          版本历史
        </MenubarItem>
        <MenubarItem onClick={onOpenAbout}>
          <HelpCircle className="mr-2 h-4 w-4" />
          关于
        </MenubarItem>
        <MenubarItem onClick={onOpenFund}>
          <Heart className="mr-2 h-4 w-4" />
          赞赏
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  );
}
