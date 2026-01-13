/**
 * 字体检测工具
 * 用于检测系统中哪些字体支持中文粗体和斜体
 */

export interface FontTestResult {
  fontFamily: string;
  supportsBold: boolean;
  supportsItalic: boolean;
  actualFontWeight: string;
  actualFontStyle: string;
  actualFontFamily: string;
}

/**
 * 测试单个字体是否支持粗体和斜体
 */
export function testFontSupport(fontFamily: string): FontTestResult {
  // 创建测试容器
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.visibility = 'hidden';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  // 测试文本（包含中文）
  const testText = '测试Test';

  // 测试粗体
  const boldTest = document.createElement('span');
  boldTest.style.fontFamily = fontFamily;
  boldTest.style.fontWeight = 'bold';
  boldTest.style.fontSize = '20px';
  boldTest.textContent = testText;
  container.appendChild(boldTest);

  // 测试斜体
  const italicTest = document.createElement('span');
  italicTest.style.fontFamily = fontFamily;
  italicTest.style.fontStyle = 'italic';
  italicTest.style.fontSize = '20px';
  italicTest.textContent = testText;
  container.appendChild(italicTest);

  // 测试正常
  const normalTest = document.createElement('span');
  normalTest.style.fontFamily = fontFamily;
  normalTest.style.fontSize = '20px';
  normalTest.textContent = testText;
  container.appendChild(normalTest);

  // 获取计算样式
  const boldStyle = window.getComputedStyle(boldTest);
  const italicStyle = window.getComputedStyle(italicTest);
  const normalStyle = window.getComputedStyle(normalTest);

  // 检查粗体支持
  const boldWeight = parseInt(boldStyle.fontWeight);
  const normalWeight = parseInt(normalStyle.fontWeight);
  const supportsBold = boldWeight >= 600 && boldWeight > normalWeight;

  // 检查斜体支持
  const supportsItalic = italicStyle.fontStyle === 'italic' && normalStyle.fontStyle === 'normal';

  // 清理
  document.body.removeChild(container);

  return {
    fontFamily,
    supportsBold,
    supportsItalic,
    actualFontWeight: boldStyle.fontWeight,
    actualFontStyle: italicStyle.fontStyle,
    actualFontFamily: boldStyle.fontFamily,
  };
}

/**
 * 测试多个字体
 */
export function testMultipleFonts(fontFamilies: string[]): FontTestResult[] {
  return fontFamilies.map(font => testFontSupport(font));
}

/**
 * 查找支持中文粗体/斜体的最佳字体
 */
export function findBestFont(fontFamilies: string[]): {
  bestForBold: string | null;
  bestForItalic: string | null;
  results: FontTestResult[];
} {
  const results = testMultipleFonts(fontFamilies);
  
  const bestForBold = results.find(r => r.supportsBold)?.fontFamily || null;
  const bestForItalic = results.find(r => r.supportsItalic)?.fontFamily || null;

  return {
    bestForBold,
    bestForItalic,
    results,
  };
}

/**
 * 常用的中文字体列表
 */
export const CHINESE_FONTS = [
  'PingFang SC',
  'PingFang TC',
  'Hiragino Sans GB',
  'Microsoft YaHei',
  'Microsoft YaHei UI',
  'SimHei',
  'SimSun',
  'KaiTi',
  'FangSong',
  'Source Han Sans SC',
  'Noto Sans SC',
  'WenQuanYi Micro Hei',
  'WenQuanYi Zen Hei',
  'Droid Sans Fallback',
  'STHeiti',
  'STSong',
  'STKaiti',
  'STFangsong',
  '-apple-system',
  'BlinkMacSystemFont',
  'Helvetica Neue',
  'Arial',
  'sans-serif',
];
