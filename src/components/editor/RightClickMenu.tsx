import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';

interface RightClickMenuProps {
  visible: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onMenuClick: (action: string) => void;
}

const menuItems = [
  { id: 'insertPic', label: '插入图片' },
  { id: 'insertTable', label: '插入表格' },
  { id: 'formatMarkdown', label: '格式化 Markdown' },
  { id: 'download', label: '下载 .md' },
  { id: 'export', label: '导出 .html' },
];

export function RightClickMenu({
  visible,
  x,
  y,
  onClose,
  onMenuClick,
}: RightClickMenuProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed z-50"
      style={{ left: `${x}px`, top: `${y}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      <Menu as="div" className="relative">
        <Transition
          show={visible}
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {menuItems.map((item) => (
                <Menu.Item key={item.id}>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        onMenuClick(item.id);
                        onClose();
                      }}
                      className={`${
                        active
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : 'text-gray-900 dark:text-gray-100'
                      } w-full text-left px-4 py-2 text-sm`}
                    >
                      {item.label}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}

