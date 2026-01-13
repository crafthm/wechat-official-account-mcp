import { useEffect, useRef } from 'react';
import type { EditorView } from '@codemirror/view';

/**
 * 编辑器滚动同步 Hook
 * 实现编辑器与预览面板的滚动同步
 */
export function useEditorSync(
  editorView: EditorView | null,
  previewElement: HTMLDivElement | null,
) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isScrollingRef = useRef(false);

  useEffect(() => {
    // 延迟初始化，等待 DOM 准备好
    const timer = setTimeout(() => {
      if (!editorView || !previewElement) {
        return;
      }

    // 查找 CodeMirror 滚动容器
    const findCodeMirrorScroller = (): HTMLElement | null => {
      return document.querySelector<HTMLElement>('.cm-scroller')
        || document.querySelector<HTMLElement>('.CodeMirror-scroll');
    };

    const scrollCB = (source: 'editor' | 'preview') => {
      if (isScrollingRef.current) {
        return;
      }

      let sourceEl: HTMLElement | null;
      let targetEl: HTMLElement | null;

      clearTimeout(timeoutRef.current);

      if (source === 'preview') {
        sourceEl = previewElement;
        targetEl = findCodeMirrorScroller();
      } else {
        sourceEl = findCodeMirrorScroller();
        targetEl = previewElement;
      }

      if (!sourceEl || !targetEl) {
        return;
      }

      const sourceHeight = sourceEl.scrollHeight - sourceEl.offsetHeight;
      const targetHeight = targetEl.scrollHeight - targetEl.offsetHeight;

      if (sourceHeight <= 0 || targetHeight <= 0) {
        return;
      }

      const percentage = sourceEl.scrollTop / sourceHeight;
      const height = percentage * targetHeight;

      isScrollingRef.current = true;
      targetEl.scrollTo(0, height);

      timeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
    };

    const editorScrollCB = () => {
      scrollCB('editor');
    };

    const previewScrollCB = () => {
      scrollCB('preview');
    };

    // 添加事件监听
    const scrollEl = findCodeMirrorScroller();
    if (scrollEl) {
      scrollEl.addEventListener('scroll', editorScrollCB);
    }
    previewElement.addEventListener('scroll', previewScrollCB, false);

      // 清理函数
      return () => {
        clearTimeout(timeoutRef.current);
        if (scrollEl) {
          scrollEl.removeEventListener('scroll', editorScrollCB);
        }
        previewElement.removeEventListener('scroll', previewScrollCB, false);
      };
    }, 300);

    return () => {
      clearTimeout(timer);
      clearTimeout(timeoutRef.current);
    };
  }, [editorView, previewElement]);
}
