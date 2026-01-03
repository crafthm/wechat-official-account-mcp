import { StyleObject } from '@/lib/markdown/themes';

/**
 * 将CSS形式的字符串转换为JSON
 * @param css - css字符串
 */
export function css2json(css: string): Record<string, StyleObject> {
  // 移除CSS所有注释
  let processedCss = css;
  let open: number;
  let close: number;
  
  while (
    (open = processedCss.indexOf('/*')) !== -1 &&
    (close = processedCss.indexOf('*/')) !== -1
  ) {
    processedCss = processedCss.substring(0, open) + processedCss.substring(close + 2);
  }

  // 初始化返回值
  const json: Record<string, StyleObject> = {};

  while (
    processedCss.length > 0 &&
    processedCss.indexOf('{') !== -1 &&
    processedCss.indexOf('}') !== -1
  ) {
    // 存储第一个左/右花括号的下标
    const lbracket = processedCss.indexOf('{');
    const rbracket = processedCss.indexOf('}');

    // 辅助方法：将array转为object
    function toObject(array: string[]): StyleObject {
      const ret: StyleObject = {};
      array.forEach((e) => {
        const index = e.indexOf(':');
        if (index !== -1) {
          const property = e.substring(0, index).trim();
          ret[property] = e.substring(index + 1).trim();
        }
      });
      return ret;
    }

    // 切割声明块并移除空白符，然后放入数组中
    let declarations = processedCss
      .substring(lbracket + 1, rbracket)
      .split(';')
      .map((e) => e.trim())
      .filter((e) => e.length > 0); // 移除所有""空值

    // 转为Object对象
    const declarationsObj = toObject(declarations);

    // 第二步：选择器处理，每个选择器会与它对应的声明相关联
    const selectors = processedCss
      .substring(0, lbracket)
      .split(',')
      .map((selector) => selector.trim());

    // 迭代赋值
    selectors.forEach((selector) => {
      // 若不存在，则先初始化
      if (!json[selector]) {
        json[selector] = {};
      }
      // 赋值到JSON
      Object.keys(declarationsObj).forEach((key) => {
        json[selector][key] = declarationsObj[key];
      });
    });

    // 继续下个声明块
    processedCss = processedCss.slice(rbracket + 1).trim();
  }

  // 返回JSON形式的结果串
  return json;
}

