import juice from 'juice';

/**
 * 处理微信公众号图片（移除 width/height 属性，使用 style）
 */
export function solveWeChatImage(element: HTMLElement | null = null) {
  const targetElement = element || document.getElementById('output');
  if (!targetElement) return;

  const images = targetElement.getElementsByTagName('img');
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const width = image.getAttribute('width');
    const height = image.getAttribute('height');
    image.removeAttribute('width');
    image.removeAttribute('height');
    if (width) image.style.width = width;
    if (height) image.style.height = height;
  }
}

/**
 * 合并 CSS 到 HTML（内联样式）
 */
export function mergeCss(html: string): string {
  return juice(html, {
    inlinePseudoElements: true,
    preserveImportant: true,
  });
}

/**
 * 修改 HTML 结构以兼容微信公众号
 */
export function modifyHtmlStructure(htmlString: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;

  const originalItems = tempDiv.querySelectorAll('li > ul, li > ol');

  originalItems.forEach((originalItem) => {
    const parent = originalItem.parentElement;
    if (parent) {
      parent.insertAdjacentElement('afterend', originalItem);
    }
  });

  return tempDiv.innerHTML;
}

/**
 * 处理微信公众号兼容性问题
 */
export function processWeChatHtml(html: string): string {
  let processed = html;
  
  // 调整 katex 公式元素为行内标签
  processed = processed.replace(
    /class="base"( style="display: inline")*/g,
    'class="base" style="display: inline"'
  );
  
  // 公众号不支持 position，转换为等价的 translateY
  processed = processed.replace(/top:(.*?)em/g, 'transform: translateY($1em)');
  
  return processed;
}

