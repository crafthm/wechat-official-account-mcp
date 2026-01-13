import { useState, useEffect, useRef, useCallback } from 'react';
import { Transition } from '@headlessui/react';
import {
  CaseSensitive,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Regex,
  Replace,
  ReplaceAll,
  WholeWord,
  X,
} from 'lucide-react';
import type { EditorView } from '@codemirror/view';
import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView as EditorViewClass } from '@codemirror/view';

interface SearchTabProps {
  editorView: EditorView | null;
  visible: boolean;
  onClose: () => void;
  initialSearch?: string;
  showReplace?: boolean;
}

interface MatchPosition {
  from: number;
  to: number;
}

/**
 * 搜索和替换组件
 * 从 3rd/md SearchTab.vue 转换而来
 */
export function SearchTab({
  editorView,
  visible,
  onClose,
  initialSearch = '',
  showReplace: initialShowReplace = false,
}: SearchTabProps) {
  const [searchWord, setSearchWord] = useState(initialSearch);
  const [isRegex, setIsRegex] = useState(false);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [findInSelection, setFindInSelection] = useState(false);
  const [indexOfMatch, setIndexOfMatch] = useState(0);
  const [showReplace, setShowReplace] = useState(initialShowReplace);
  const [replaceWord, setReplaceWord] = useState('');
  const [matchPositions, setMatchPositions] = useState<MatchPosition[]>([]);
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 定义高亮样式的 StateEffect
  const setSearchHighlights = StateEffect.define<DecorationSet>();

  // 创建搜索高亮的 StateField
  const searchHighlightField = StateField.define<DecorationSet>({
    create() {
      return Decoration.none;
    },
    update(highlights, tr) {
      for (const effect of tr.effects) {
        if (effect.is(setSearchHighlights)) {
          return effect.value;
        }
      }
      return highlights;
    },
    provide: f => EditorViewClass.decorations.from(f),
  });

  // 在编辑器初始化时添加 searchHighlightField
  useEffect(() => {
    if (editorView && !editorView.state.field(searchHighlightField, false)) {
      editorView.dispatch({
        effects: StateEffect.appendConfig.of(searchHighlightField),
      });
    }
  }, [editorView]);

  // 清除所有高亮
  const clearAllMarks = useCallback(() => {
    if (!editorView) return;
    editorView.dispatch({
      effects: setSearchHighlights.of(Decoration.none),
    });
  }, [editorView]);

  // 标记匹配项
  const markMatch = useCallback(() => {
    if (!editorView || matchPositions.length === 0) {
      clearAllMarks();
      return;
    }

    const decorations: any[] = [];

    matchPositions.forEach((match, idx) => {
      const isCurrentMatch = idx === indexOfMatch;
      const mark = Decoration.mark({
        class: isCurrentMatch ? 'cm-searchMatch-selected' : 'cm-searchMatch',
      });
      decorations.push(mark.range(match.from, match.to));
    });

    const decorationSet = Decoration.set(decorations, true);
    editorView.dispatch({
      effects: setSearchHighlights.of(decorationSet),
    });

    // 滚动到当前匹配位置
    if (matchPositions[indexOfMatch]) {
      const pos = matchPositions[indexOfMatch].from;
      editorView.dispatch({
        selection: { anchor: pos, head: pos },
        scrollIntoView: true,
      });
    }
  }, [editorView, matchPositions, indexOfMatch, clearAllMarks]);

  // 查找所有匹配项
  const findAllMatches = useCallback(() => {
    if (!editorView || !searchWord || !visible) {
      setMatchPositions([]);
      return;
    }

    // 确定搜索范围
    let searchFrom = 0;
    let searchTo = editorView.state.doc.length;
    if (findInSelection && selectionRange) {
      searchFrom = selectionRange.from;
      searchTo = selectionRange.to;
    }

    const content = editorView.state.sliceDoc(searchFrom, searchTo);
    const _matchPositions: MatchPosition[] = [];

    if (searchWord) {
      if (isRegex) {
        try {
          const flags = `gm${isCaseSensitive ? '' : 'i'}`;
          const regex = new RegExp(searchWord, flags);
          let match;
          while ((match = regex.exec(content)) !== null) {
            if (match[0].length === 0) {
              regex.lastIndex++;
              continue;
            }
            const startPos = match.index + searchFrom;
            const endPos = match.index + match[0].length + searchFrom;
            _matchPositions.push({ from: startPos, to: endPos });
          }
        } catch (e) {
          console.warn('Invalid Regex', e);
        }
      } else {
        const searchTermForCompare = isCaseSensitive ? searchWord : searchWord.toLowerCase();
        let startIndex = 0;
        let index = (isCaseSensitive ? content : content.toLowerCase()).indexOf(searchTermForCompare, startIndex);

        while (index !== -1) {
          const startPos = index + searchFrom;
          const endPos = index + searchWord.length + searchFrom;
          _matchPositions.push({ from: startPos, to: endPos });
          startIndex = index + 1;
          index = (isCaseSensitive ? content : content.toLowerCase()).indexOf(searchTermForCompare, startIndex);
        }
      }
    }

    setMatchPositions(_matchPositions);
    if (_matchPositions.length > 0 && indexOfMatch >= _matchPositions.length) {
      setIndexOfMatch(_matchPositions.length - 1);
    }
  }, [editorView, searchWord, isRegex, isCaseSensitive, findInSelection, selectionRange, visible, indexOfMatch]);

  // 监听搜索条件变化
  useEffect(() => {
    if (!visible) {
      clearAllMarks();
      return;
    }

    const timer = setTimeout(() => {
      if (searchWord === '') {
        clearAllMarks();
        setMatchPositions([]);
      } else {
        setIndexOfMatch(0);
        findAllMatches();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchWord, isRegex, isCaseSensitive, findInSelection, visible, findAllMatches, clearAllMarks]);

  // 监听匹配位置变化，更新高亮
  useEffect(() => {
    if (visible) {
      markMatch();
    }
  }, [indexOfMatch, matchPositions, visible, markMatch]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearAllMarks();
    };
  }, [clearAllMarks]);

  // 当 visible 变为 true 时，聚焦输入框
  useEffect(() => {
    if (visible) {
      // 如果有选中文本，自动启用 find in selection
      if (editorView) {
        const selection = editorView.state.selection.main;
        if (!selection.empty) {
          setFindInSelection(true);
          setSelectionRange({ from: selection.from, to: selection.to });
        }
      }

      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 0);
    } else {
      clearAllMarks();
      setFindInSelection(false);
      setSelectionRange(null);
    }
  }, [visible, editorView, clearAllMarks]);

  // 下一个匹配
  const nextMatch = () => {
    if (matchPositions.length === 0) return;
    setIndexOfMatch((indexOfMatch + 1) % matchPositions.length);
  };

  // 上一个匹配
  const prevMatch = () => {
    if (matchPositions.length === 0) return;
    setIndexOfMatch((indexOfMatch - 1 + matchPositions.length) % matchPositions.length);
  };

  // 替换
  const handleReplace = () => {
    if (!editorView || matchPositions.length === 0 || !matchPositions[indexOfMatch]) return;

    const match = matchPositions[indexOfMatch];
    let insertText = replaceWord;
    if (isRegex) {
      try {
        const matchedText = editorView.state.sliceDoc(match.from, match.to);
        insertText = matchedText.replace(new RegExp(searchWord, 'gm'), replaceWord);
      } catch (e) {
        console.warn('Invalid Regex Replacement', e);
      }
    }

    editorView.dispatch({
      changes: { from: match.from, to: match.to, insert: insertText },
      selection: { anchor: match.from + insertText.length },
    });
    findAllMatches();
  };

  // 全部替换
  const handleReplaceAll = () => {
    if (!editorView || matchPositions.length === 0) return;

    // 从后往前替换，避免位置偏移
    const sortedPositions = [...matchPositions].sort((a, b) => b.from - a.from);

    const changes = sortedPositions.map((match) => {
      let insertText = replaceWord;
      if (isRegex) {
        try {
          const matchedText = editorView.state.sliceDoc(match.from, match.to);
          insertText = matchedText.replace(new RegExp(searchWord, 'gm'), replaceWord);
        } catch (e) {
          console.warn('Invalid Regex Replacement', e);
        }
      }
      return { from: match.from, to: match.to, insert: insertText };
    });

    editorView.dispatch({ changes });
    findAllMatches();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      nextMatch();
      e.preventDefault();
    }
  };

  const handleReplaceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleReplace();
      e.preventDefault();
    }
  };

  const toggleFindInSelection = () => {
    if (!findInSelection && editorView) {
      const selection = editorView.state.selection.main;
      if (!selection.empty) {
        setSelectionRange({ from: selection.from, to: selection.to });
      } else {
        setSelectionRange({ from: 0, to: editorView.state.doc.length });
      }
    } else {
      setSelectionRange(null);
    }
    setFindInSelection(!findInSelection);
  };

  if (!visible) return null;

  return (
    <Transition
      show={visible}
      enter="transition ease-out duration-200"
      enterFrom="transform -translate-y-full opacity-0"
      enterTo="transform translate-y-0 opacity-100"
      leave="transition ease-in duration-150"
      leaveFrom="transform translate-y-0 opacity-100"
      leaveTo="transform -translate-y-full opacity-0"
    >
      <div
        className={`bg-white dark:bg-gray-800 absolute right-0 top-0 z-50 min-w-[300px] w-fit flex gap-1 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 shadow-md ${
          showReplace ? 'items-start' : 'items-center'
        }`}
      >
        {/* 折叠/展开按钮 */}
        <button
          onClick={() => setShowReplace(!showReplace)}
          className="h-7 w-5 flex items-center justify-center p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          title="切换替换"
        >
          {showReplace ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        {/* 查找 / 替换主体 */}
        <div className="flex flex-col gap-0.5">
          {/* 查找行 */}
          <div className="flex items-center gap-1">
            <input
              ref={searchInputRef}
              type="text"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="查找"
              className="h-7 w-40 text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={() => setIsCaseSensitive(!isCaseSensitive)}
              className={`h-6 w-6 p-0 flex items-center justify-center rounded ${
                isCaseSensitive
                  ? 'bg-gray-200 dark:bg-gray-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              } text-gray-600 dark:text-gray-400`}
              title="区分大小写"
            >
              <CaseSensitive className="h-3 w-3" />
            </button>
            <button
              onClick={() => setIsRegex(!isRegex)}
              className={`h-6 w-6 p-0 flex items-center justify-center rounded ${
                isRegex
                  ? 'bg-gray-200 dark:bg-gray-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              } text-gray-600 dark:text-gray-400`}
              title="正则表达式"
            >
              <Regex className="h-3 w-3" />
            </button>
            <button
              onClick={toggleFindInSelection}
              className={`h-6 w-6 p-0 flex items-center justify-center rounded ${
                findInSelection
                  ? 'bg-gray-200 dark:bg-gray-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              } text-gray-600 dark:text-gray-400`}
              title="在选区内查找"
            >
              <WholeWord className="h-3 w-3" />
            </button>
            <span className="w-10 select-none text-center text-xs text-gray-600 dark:text-gray-400">
              {matchPositions.length ? indexOfMatch + 1 : 0}/{matchPositions.length}
            </span>
            <button
              onClick={prevMatch}
              className="h-6 w-6 p-0 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              title="上一处"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              onClick={nextMatch}
              className="h-6 w-6 p-0 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              title="下一处"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
            <button
              onClick={onClose}
              className="h-6 w-6 p-0 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              title="关闭"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* 替换行（可折叠） */}
          {showReplace && (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={replaceWord}
                onChange={(e) => setReplaceWord(e.target.value)}
                onKeyDown={handleReplaceKeyDown}
                placeholder="替换"
                className="h-7 w-40 text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={handleReplace}
                className="h-6 w-6 p-0 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                title="替换"
              >
                <Replace className="h-3 w-3" />
              </button>
              <button
                onClick={handleReplaceAll}
                className="h-6 w-6 p-0 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                title="全部替换"
              >
                <ReplaceAll className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Transition>
  );
}

// 添加搜索高亮样式（需要在全局 CSS 中）
// 这里通过 style 标签添加
const searchStyles = `
.cm-searchMatch {
  background-color: rgba(255, 237, 100, 0.4);
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(255, 193, 7, 0.3);
}

.cm-searchMatch-selected {
  background-color: rgba(255, 152, 0, 0.6);
  border-radius: 2px;
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.8);
  font-weight: 500;
}

.dark .cm-searchMatch {
  background-color: rgba(255, 235, 59, 0.3);
  box-shadow: 0 0 0 1px rgba(255, 235, 59, 0.4);
}

.dark .cm-searchMatch-selected {
  background-color: rgba(255, 152, 0, 0.5);
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.7);
}
`;

// 注入样式
if (typeof document !== 'undefined') {
  const styleId = 'md-editor-search-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = searchStyles;
    document.head.appendChild(style);
  }
}
