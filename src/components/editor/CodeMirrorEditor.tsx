import { useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import { useEditorStore } from '@/stores/editor-store';
import { formatDoc } from '@/lib/utils/formatter';

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  nightMode?: boolean;
  onPaste?: (file: File) => void;
}

export function CodeMirrorEditor({
  value,
  onChange,
  nightMode = false,
  onPaste,
}: CodeMirrorEditorProps) {
  const editorRef = useRef<EditorView | null>(null);
  const { isEditOnLeft } = useEditorStore();

  useEffect(() => {
    // 处理粘贴事件
    const handlePaste = (e: ClipboardEvent) => {
      if (!onPaste || !e.clipboardData) return;

      const items = Array.from(e.clipboardData.items);
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            onPaste(file);
            return;
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [onPaste]);

  const extensions = [
    markdown(),
    EditorView.lineWrapping,
    EditorView.theme({
      '&': {
        fontSize: '14px',
        height: '100%',
      },
      '.cm-editor': {
        height: '100%',
      },
      '.cm-scroller': {
        height: '100%',
        overflow: 'auto',
      },
      '.cm-content': {
        padding: '12px',
        minHeight: '100%',
      },
    }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        // 防抖处理
        const timeoutId = setTimeout(() => {
          onChange(update.state.doc.toString());
        }, 300);
        return () => clearTimeout(timeoutId);
      }
    }),
    // 快捷键支持
    EditorView.contentAttributes.of({
      'data-gramm': 'false', // 禁用 Grammarly
    }),
  ];

  // 添加暗黑主题
  if (nightMode) {
    extensions.push(oneDark);
  }

  // 快捷键通过 CodeMirror 的 keymap 处理
  extensions.push(
    EditorView.domEventHandlers({
      keydown: (event: KeyboardEvent, view: EditorView) => {
        // Ctrl/Cmd + F: 格式化
        if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
          event.preventDefault();
          formatDoc(value).then((formatted) => {
            onChange(formatted);
          });
          return true;
        }

        // Ctrl/Cmd + B: 加粗
        if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
          event.preventDefault();
          const selection = view.state.sliceDoc(
            view.state.selection.main.from,
            view.state.selection.main.to
          );
          if (selection) {
            const newText = `**${selection}**`;
            view.dispatch({
              changes: {
                from: view.state.selection.main.from,
                to: view.state.selection.main.to,
                insert: newText,
              },
            });
          }
          return true;
        }

        // Ctrl/Cmd + I: 斜体
        if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
          event.preventDefault();
          const selection = view.state.sliceDoc(
            view.state.selection.main.from,
            view.state.selection.main.to
          );
          if (selection) {
            const newText = `*${selection}*`;
            view.dispatch({
              changes: {
                from: view.state.selection.main.from,
                to: view.state.selection.main.to,
                insert: newText,
              },
            });
          }
          return true;
        }

        // Ctrl/Cmd + D: 删除线
        if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
          event.preventDefault();
          const selection = view.state.sliceDoc(
            view.state.selection.main.from,
            view.state.selection.main.to
          );
          if (selection) {
            const newText = `~~${selection}~~`;
            view.dispatch({
              changes: {
                from: view.state.selection.main.from,
                to: view.state.selection.main.to,
                insert: newText,
              },
            });
          }
          return true;
        }

        // Ctrl/Cmd + K: 插入链接
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
          event.preventDefault();
          const selection = view.state.sliceDoc(
            view.state.selection.main.from,
            view.state.selection.main.to
          );
          const newText = selection ? `[${selection}]()` : '[]()';
          view.dispatch({
            changes: {
              from: view.state.selection.main.from,
              to: view.state.selection.main.to,
              insert: newText,
            },
            selection: {
              anchor: view.state.selection.main.from + newText.length - 1,
            },
          });
          return true;
        }

        // Ctrl/Cmd + L: 插入代码
        if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
          event.preventDefault();
          const selection = view.state.sliceDoc(
            view.state.selection.main.from,
            view.state.selection.main.to
          );
          if (selection) {
            const newText = `\`${selection}\``;
            view.dispatch({
              changes: {
                from: view.state.selection.main.from,
                to: view.state.selection.main.to,
                insert: newText,
              },
            });
          }
          return true;
        }

        return false;
      },
    })
  );

  return (
    <div className="h-full w-full" style={{ display: 'flex', flexDirection: 'column' }}>
      <CodeMirror
        value={value || ''}
        onChange={onChange}
        theme={nightMode ? oneDark : undefined}
        extensions={extensions}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
        }}
        onUpdate={(view) => {
          editorRef.current = view.view;
        }}
      />
    </div>
  );
}

