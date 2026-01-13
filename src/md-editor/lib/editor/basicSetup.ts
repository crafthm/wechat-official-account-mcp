import type { Extension } from '@codemirror/state';
import { EditorState } from '@codemirror/state';
import { crosshairCursor, drawSelection, dropCursor, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, keymap, rectangularSelection } from '@codemirror/view';

// 使用函数来延迟加载可选依赖
function getOptionalImports() {
  let acceptCompletion: any, autocompletion: any, closeBrackets: any, closeBracketsKeymap: any = [], completionKeymap: any = [];
  let defaultKeymap: any = [], history: any, historyKeymap: any = [], indentWithTab: any;
  let bracketMatching: any, defaultHighlightStyle: any, foldGutter: any, foldKeymap: any = [], indentOnInput: any, syntaxHighlighting: any;
  let lintKeymap: any = [];
  let highlightSelectionMatches: any, searchKeymap: any = [];

  try {
    // @ts-ignore
    const autocomplete = require('@codemirror/autocomplete');
    acceptCompletion = autocomplete.acceptCompletion;
    autocompletion = autocomplete.autocompletion;
    closeBrackets = autocomplete.closeBrackets;
    closeBracketsKeymap = autocomplete.closeBracketsKeymap || [];
    completionKeymap = autocomplete.completionKeymap || [];
  } catch (e) {
    // 包不存在时使用空函数
  }

  try {
    // @ts-ignore
    const commands = require('@codemirror/commands');
    defaultKeymap = commands.defaultKeymap || [];
    history = commands.history;
    historyKeymap = commands.historyKeymap || [];
    indentWithTab = commands.indentWithTab;
  } catch (e) {
    history = () => [];
  }

  try {
    // @ts-ignore
    const language = require('@codemirror/language');
    bracketMatching = language.bracketMatching;
    defaultHighlightStyle = language.defaultHighlightStyle;
    foldGutter = language.foldGutter;
    foldKeymap = language.foldKeymap || [];
    indentOnInput = language.indentOnInput;
    syntaxHighlighting = language.syntaxHighlighting;
  } catch (e) {
    // 包不存在
  }

  try {
    // @ts-ignore
    const lint = require('@codemirror/lint');
    lintKeymap = lint.lintKeymap || [];
  } catch (e) {
    // 包不存在
  }

  try {
    // @ts-ignore
    const search = require('@codemirror/search');
    highlightSelectionMatches = search.highlightSelectionMatches;
    searchKeymap = search.searchKeymap || [];
  } catch (e) {
    highlightSelectionMatches = () => [];
  }

  return {
    acceptCompletion, autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap,
    defaultKeymap, history, historyKeymap, indentWithTab,
    bracketMatching, defaultHighlightStyle, foldGutter, foldKeymap, indentOnInput, syntaxHighlighting,
    lintKeymap,
    highlightSelectionMatches, searchKeymap,
  };
}

/**
 * CodeMirror 基础设置
 * 包含行号、历史记录、括号匹配等基础功能
 * 
 * 注意：如果需要缩进标记，需要安装 @replit/codemirror-indentation-markers
 * 当前版本不包含缩进标记功能
 */
export const basicSetup: Extension = (() => {
  const imports = getOptionalImports();
  const {
    acceptCompletion, autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap,
    defaultKeymap, history, historyKeymap, indentWithTab,
    bracketMatching, defaultHighlightStyle, foldGutter, foldKeymap, indentOnInput, syntaxHighlighting,
    lintKeymap,
    highlightSelectionMatches, searchKeymap,
  } = imports;

  const extensions: any[] = [];

  // 基础功能（如果可用）
  extensions.push(highlightActiveLineGutter());
  extensions.push(highlightSpecialChars());
  
  if (history && typeof history === 'function') {
    extensions.push(history());
  }
  if (foldGutter && typeof foldGutter === 'function') {
    extensions.push(foldGutter());
  }
  
  extensions.push(drawSelection());
  extensions.push(dropCursor());
  extensions.push(EditorState.allowMultipleSelections.of(true));
  
  if (indentOnInput && typeof indentOnInput === 'function') {
    extensions.push(indentOnInput());
  }
  if (syntaxHighlighting && defaultHighlightStyle && typeof syntaxHighlighting === 'function') {
    extensions.push(syntaxHighlighting(defaultHighlightStyle, { fallback: true }));
  }
  if (bracketMatching && typeof bracketMatching === 'function') {
    extensions.push(bracketMatching());
  }
  if (closeBrackets && typeof closeBrackets === 'function') {
    extensions.push(closeBrackets());
  }
  if (autocompletion && typeof autocompletion === 'function') {
    extensions.push(autocompletion());
  }
  
  extensions.push(rectangularSelection());
  extensions.push(crosshairCursor());
  extensions.push(highlightActiveLine());
  
  if (highlightSelectionMatches && typeof highlightSelectionMatches === 'function') {
    extensions.push(highlightSelectionMatches());
  }
  
  // indentationMarkers(), // 需要 @replit/codemirror-indentation-markers
  
  // 快捷键映射
  const keymaps: any[] = [];
  if (closeBracketsKeymap && Array.isArray(closeBracketsKeymap) && closeBracketsKeymap.length > 0) {
    keymaps.push(...closeBracketsKeymap);
  }
  if (defaultKeymap && Array.isArray(defaultKeymap) && defaultKeymap.length > 0) {
    keymaps.push(...defaultKeymap);
  }
  if (searchKeymap && Array.isArray(searchKeymap) && searchKeymap.length > 0) {
    keymaps.push(...searchKeymap);
  }
  if (historyKeymap && Array.isArray(historyKeymap) && historyKeymap.length > 0) {
    keymaps.push(...historyKeymap);
  }
  if (foldKeymap && Array.isArray(foldKeymap) && foldKeymap.length > 0) {
    keymaps.push(...foldKeymap);
  }
  if (completionKeymap && Array.isArray(completionKeymap) && completionKeymap.length > 0) {
    keymaps.push(...completionKeymap);
  }
  if (lintKeymap && Array.isArray(lintKeymap) && lintKeymap.length > 0) {
    keymaps.push(...lintKeymap);
  }
  if (acceptCompletion && typeof acceptCompletion === 'function') {
    keymaps.push({ key: 'Tab', run: acceptCompletion }); // use tab to completion
  }
  if (indentWithTab) {
    keymaps.push(indentWithTab);
  }
  
  if (keymaps.length > 0) {
    extensions.push(keymap.of(keymaps));
  }

  return extensions;
})();

/**
 * 最小化设置
 * 只包含基础功能：默认快捷键、撤销历史、特殊字符高亮、选择绘制、默认高亮样式
 */
export const minimalSetup: Extension = (() => {
  const imports = getOptionalImports();
  const { history, defaultKeymap, historyKeymap, syntaxHighlighting, defaultHighlightStyle } = imports;
  
  const extensions: any[] = [
    highlightSpecialChars(),
    drawSelection(),
  ];
  
  if (history && typeof history === 'function') {
    extensions.push(history());
  }
  
  if (syntaxHighlighting && defaultHighlightStyle && typeof syntaxHighlighting === 'function') {
    extensions.push(syntaxHighlighting(defaultHighlightStyle, { fallback: true }));
  }
  
  const keymaps: any[] = [];
  if (defaultKeymap && Array.isArray(defaultKeymap) && defaultKeymap.length > 0) {
    keymaps.push(...defaultKeymap);
  }
  if (historyKeymap && Array.isArray(historyKeymap) && historyKeymap.length > 0) {
    keymaps.push(...historyKeymap);
  }
  
  if (keymaps.length > 0) {
    extensions.push(keymap.of(keymaps));
  }
  
  return extensions;
})();

export { EditorView } from '@codemirror/view';
