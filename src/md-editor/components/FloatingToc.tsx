import { useState, useEffect, useRef } from 'react';
import { List } from 'lucide-react';
import { useMdRenderStore } from '../stores/render-store';

interface FloatingTocProps {
  visible?: boolean;
  pinned?: boolean;
}

interface TitleItem {
  url: string;
  title: string;
  level: number;
}

/**
 * 浮动目录组件
 * 从 3rd/md FloatingToc.vue 转换而来
 */
export function FloatingToc({ visible = true, pinned = false }: FloatingTocProps) {
  const { titleList } = useMdRenderStore();
  const [isHovered, setIsHovered] = useState(false);
  const tocRef = useRef<HTMLDivElement>(null);

  // 点击标题跳转
  const handleTitleClick = (url: string) => {
    const element = document.querySelector(url);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 如果没有标题列表或不可见，不渲染
  if (!visible || titleList.length === 0) {
    return null;
  }

  // 如果不是固定显示，需要鼠标悬停才显示
  const shouldShow = pinned || isHovered;

  return (
    <div
      ref={tocRef}
      className={`fixed right-4 top-20 z-40 transition-opacity duration-200 ${
        shouldShow ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onMouseEnter={() => !pinned && setIsHovered(true)}
      onMouseLeave={() => !pinned && setIsHovered(false)}
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-xs max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="flex items-center mb-3">
          <List className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">目录</h3>
        </div>
        <nav className="space-y-1">
          {titleList.map((item: TitleItem, index: number) => (
            <a
              key={index}
              href={item.url}
              onClick={(e) => {
                e.preventDefault();
                handleTitleClick(item.url);
              }}
              className={`block text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                item.level === 1 ? 'font-semibold' : item.level === 2 ? 'font-medium' : ''
              }`}
              style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}
            >
              {item.title}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
