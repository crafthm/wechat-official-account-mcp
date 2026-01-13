import { useEffect, useRef, useState, useCallback } from 'react';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { markdownSetup, theme } from '../lib/editor';
import { useMdEditorStore } from '../stores/editor-store';
import { useMdRenderStore } from '../stores/render-store';
import { Preview } from './Preview';
import { useEditorSync } from '../hooks/useEditorSync';

interface CodemirrorEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  nightMode?: boolean;
  showPreview?: boolean;
  isEditOnLeft?: boolean;
}

/**
 * 主编辑器组件（隔离版本）
 * 从 3rd/md CodemirrorEditor.vue 转换而来
 */
export function CodemirrorEditor({
  initialContent = '',
  onContentChange,
  nightMode = false,
  showPreview = true,
  isEditOnLeft = false,
}: CodemirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const themeCompartment = useRef(new Compartment());
  const [content, setContent] = useState(initialContent);
  
  // 调试：监听 content 变化
  useEffect(() => {
    console.log('[CodemirrorEditor] Content changed:', content?.substring(0, 50));
  }, [content]);
  const changeTimerRef = useRef<NodeJS.Timeout>();

  const { setEditor, getContent } = useMdEditorStore();
  const { render } = useMdRenderStore();

  // 滚动同步（延迟初始化，等待 ref 准备好）
  useEditorSync(editorViewRef.current, previewRef.current);

  // 编辑器刷新函数
  const editorRefresh = useCallback(() => {
    const raw = getContent();
    if (raw) {
      render(raw);
    }
  }, [getContent, render]);

  // 初始化编辑器
  useEffect(() => {
    const editorDom = editorRef.current;
    if (!editorDom) {
      return;
    }

    // 创建编辑器状态
    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        markdownSetup({
          // TODO: 实现搜索回调
          // onSearch: openSearchWithSelection,
          // onReplace: openReplaceWithSelection,
        }),
        themeCompartment.current.of(theme(nightMode)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const value = update.state.doc.toString();
            setContent(value);
            
            if (onContentChange) {
              onContentChange(value);
            }

            // 注意：预览渲染由 Preview 组件通过 content prop 自动处理
            // 这里不需要手动调用 render，因为 Preview 组件会监听 content 变化
          }
        }),
      ],
    });

    // 创建编辑器视图
    const view = new EditorView({
      state,
      parent: editorDom,
    });

    editorViewRef.current = view;
    setEditor(view);

    // 注意：初始渲染由 Preview 组件通过 content prop 自动处理
    // 不需要手动调用 editorRefresh

    // 清理函数
    return () => {
      clearTimeout(changeTimerRef.current);
      view.destroy();
      setEditor(null);
    };
  }, []); // 只在挂载时初始化

  // 监听内容变化（外部更新）
  useEffect(() => {
    if (editorViewRef.current && initialContent !== content) {
      const currentContent = editorViewRef.current.state.doc.toString();
      if (currentContent !== initialContent) {
        editorViewRef.current.dispatch({
          changes: {
            from: 0,
            to: editorViewRef.current.state.doc.length,
            insert: initialContent,
          },
        });
        setContent(initialContent);
      }
    }
  }, [initialContent, content]);

  // 监听主题变化
  useEffect(() => {
    if (editorViewRef.current) {
      editorViewRef.current.dispatch({
        effects: themeCompartment.current.reconfigure(theme(nightMode)),
      });
      editorRefresh();
    }
  }, [nightMode, editorRefresh]);

  return (
    <div className="codemirror-editor-container h-full w-full flex">
      {/* 编辑器区域 */}
      <div
        className={`codeMirror-wrapper relative flex-1 ${
          isEditOnLeft ? 'order-1 border-r' : 'border-l'
        }`}
      >
        <div ref={editorRef} className="codemirror-container h-full w-full" />
      </div>

      {/* 预览区域 */}
      {showPreview && (
        <div className="relative flex-1 overflow-x-hidden">
          <Preview ref={previewRef} content={content} />
        </div>
      )}
    </div>
  );
}
