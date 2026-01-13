import { create } from 'zustand';
import type { EditorView } from '@codemirror/view';
import { formatDoc } from '../lib/utils/fileHelpers';

/**
 * 编辑器 Store（隔离版本）
 * 负责管理 CodeMirror 编辑器实例和基础操作
 * 从 Pinia editor.ts 转换而来
 */
export interface MdEditorStore {
  // 内容编辑器实例
  editor: EditorView | null;

  // Actions
  setEditor: (editor: EditorView | null) => void;
  formatContent: () => Promise<string | undefined>;
  importContent: (content: string) => void;
  clearContent: () => void;
  getContent: () => string;
  getSelection: () => string;
  replaceSelection: (text: string) => void;
  insertAtCursor: (text: string) => void;
}

export const useMdEditorStore = create<MdEditorStore>((set, get) => ({
  // 初始状态
  editor: null,

  // Actions
  setEditor: (editor) => {
    set({ editor });
  },

  // 格式化文档
  formatContent: async () => {
    const { editor } = get();
    if (!editor) {
      return;
    }

    const doc = await formatDoc(editor.state.doc.toString());
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: doc },
    });
    return doc;
  },

  // 导入内容
  importContent: (content: string) => {
    const { editor } = get();
    if (!editor) {
      return;
    }

    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: content },
    });
  },

  // 清空内容
  clearContent: () => {
    const { editor } = get();
    if (!editor) {
      return;
    }

    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: '' },
    });
    // TODO: 添加 toast 通知
    console.log('内容已清空');
  },

  // 获取当前内容
  getContent: () => {
    const { editor } = get();
    return editor?.state.doc.toString() ?? '';
  },

  // 获取选中的文本
  getSelection: () => {
    const { editor } = get();
    if (!editor) {
      return '';
    }

    const selection = editor.state.selection.main;
    return editor.state.doc.sliceString(selection.from, selection.to);
  },

  // 替换选中的文本
  replaceSelection: (text: string) => {
    const { editor } = get();
    if (!editor) {
      return;
    }

    editor.dispatch(editor.state.replaceSelection(text));
  },

  // 在光标位置插入文本
  insertAtCursor: (text: string) => {
    const { editor } = get();
    if (!editor) {
      return;
    }

    const selection = editor.state.selection.main;
    editor.dispatch({
      changes: { from: selection.from, to: selection.to, insert: text },
      selection: { anchor: selection.from + text.length },
    });
    editor.focus();
  },
}));
