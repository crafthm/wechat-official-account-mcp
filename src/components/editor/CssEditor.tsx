import { useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { css } from '@codemirror/lang-css';
import { EditorView } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import { useEditorStore } from '@/stores/editor-store';
import { formatCss } from '@/lib/utils/formatter';

interface CssEditorProps {
  visible: boolean;
  onClose: () => void;
}

export function CssEditor({ visible, onClose }: CssEditorProps) {
  const { cssContent, setCssContent, nightMode } = useEditorStore();

  const extensions = [
    css(),
    EditorView.lineWrapping,
    EditorView.theme({
      '&': {
        fontSize: '14px',
        height: '100%',
      },
      '.cm-content': {
        padding: '12px',
        minHeight: '100%',
      },
      '.cm-scroller': {
        overflow: 'auto',
      },
    }),
  ];

  if (nightMode) {
    extensions.push(oneDark);
  }

  const handleFormat = () => {
    formatCss(cssContent).then((formatted) => {
      setCssContent(formatted);
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            CSS 编辑器
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleFormat}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="格式化 CSS (Ctrl+F)"
            >
              格式化
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              关闭
            </button>
          </div>
        </div>

        {/* 编辑器 */}
        <div className="flex-1 overflow-hidden">
          <CodeMirror
            value={cssContent}
            onChange={setCssContent}
            theme={nightMode ? oneDark : undefined}
            extensions={extensions}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              dropCursor: false,
              allowMultipleSelections: false,
            }}
          />
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            提示：按 Ctrl+F (Mac: Cmd+F) 可以格式化 CSS
          </p>
        </div>
      </div>
    </div>
  );
}

