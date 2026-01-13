import { EditorView } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';

const customStyles = EditorView.theme({
  // 垂直居中
  '.cm-gutterElement': {
    display: 'flex',
    justifyContent: 'right',
    alignItems: 'center',
  },
});

/**
 * 浅色主题
 * 注意：如果需要使用 VS Code 主题，需要安装 @fsegurai/codemirror-theme-vscode-light
 * 当前使用 CodeMirror 内置的 oneDark 作为暗色主题，浅色主题使用默认样式
 */
export function lightTheme() {
  return [customStyles];
}

/**
 * 暗色主题
 * 使用 CodeMirror 内置的 oneDark 主题
 */
export function darkTheme() {
  return [oneDark, customStyles];
}

/**
 * 根据主题模式获取主题扩展
 * @param isDark - 是否为暗色模式
 */
export function theme(isDark: boolean) {
  return isDark ? darkTheme() : lightTheme();
}
