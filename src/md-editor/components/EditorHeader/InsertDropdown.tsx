import { Contact, Image, Table } from 'lucide-react';
import {
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
} from '../ui/Menubar';

interface InsertDropdownProps {
  asSub?: boolean;
  onInsertImage?: () => void;
  onInsertTable?: () => void;
  onInsertMpCard?: () => void;
}

/**
 * 插入菜单下拉组件
 * 从 3rd/md InsertDropdown.vue 转换而来
 * 使用 Radix UI Menubar，原生支持鼠标悬停切换
 */
export function InsertDropdown({
  asSub = false,
  onInsertImage,
  onInsertTable,
  onInsertMpCard,
}: InsertDropdownProps) {
  return (
    <MenubarMenu>
      <MenubarTrigger>插入</MenubarTrigger>
      <MenubarContent className="w-52">
        <MenubarItem onClick={onInsertImage}>
          <Image className="mr-2 h-4 w-4" />
          插入图片
        </MenubarItem>
        <MenubarItem onClick={onInsertTable}>
          <Table className="mr-2 h-4 w-4" />
          插入表格
        </MenubarItem>
        <MenubarItem onClick={onInsertMpCard}>
          <Contact className="mr-2 h-4 w-4" />
          公众号名片
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  );
}
