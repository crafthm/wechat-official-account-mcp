import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import juice from 'juice';
import { useEditorStore } from '@/stores/editor-store';
import { WxRenderer } from '@/lib/markdown/wx-renderer';
import { setFontSize, setColorWithCustomTemplate, customCssWithTemplate } from '@/lib/markdown/themes';
import { css2json } from '@/lib/utils/css-parser';
import { defaultTheme } from '@/lib/markdown/themes';

interface PreviewProps {
  content: string;
  cssContent: string;
  className?: string;
}

export function Preview({ content, cssContent, className = '' }: PreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const {
    currentFont,
    currentSize,
    currentColor,
    codeTheme,
    citeStatus,
    isMacCodeBlock,
    previewMode,
    setOutput,
    setPreviewMode,
  } = useEditorStore();

  useEffect(() => {
    // 初始化渲染器
    const fontSize = parseInt(currentSize.replace('px', ''), 10);
    const theme = setFontSize(fontSize);
    const coloredTheme = setColorWithCustomTemplate(theme, currentColor);

    // 解析自定义 CSS
    const cssJson = css2json(cssContent);
    const finalTheme = customCssWithTemplate(cssJson, currentColor, coloredTheme);

    const renderer = new WxRenderer({
      theme: finalTheme,
      fonts: currentFont,
      size: currentSize,
    });

    // 获取渲染器实例
    const wxRenderer = renderer.getRenderer(citeStatus);
    marked.setOptions({ 
      renderer: wxRenderer,
      breaks: true, // 启用换行支持，单个换行符也会转换为 <br>
    });

    // 渲染 Markdown
    const parseResult = marked.parse(content);
    let output = typeof parseResult === 'string' ? parseResult : String(parseResult);

    // 去除第一行的 margin-top
    output = output.replace(/(style=".*?)"/, '$1;margin-top: 0"');

    // 添加脚注
    if (citeStatus) {
      output += renderer.buildFootnotes();
      output += renderer.buildAddition();
    }

    // 添加 Mac 代码块样式
    if (isMacCodeBlock) {
      output += `
        <style>
          .hljs.code__pre::before {
            position: initial;
            padding: initial;
            content: '';
            display: block;
            height: 25px;
            background-color: transparent;
            background-image: url("https://doocs.oss-cn-shenzhen.aliyuncs.com/img/123.svg");
            background-position: 14px 10px!important;
            background-repeat: no-repeat;
            background-size: 40px!important;
          }
          .hljs.code__pre {
            padding: 0!important;
          }
          .hljs.code__pre code {
            display: -webkit-box;
            padding: 0.5em 1em 1em;
            overflow-x: auto;
            text-indent: 0;
          }
        </style>
      `;
    }

    // 内联 CSS（使用 juice）
    const inlinedHtml = juice(output, {
      inlinePseudoElements: true,
      preserveImportant: true,
    });

    setHtmlContent(inlinedHtml);
    // 更新 store 中的 output
    setOutput(inlinedHtml);
  }, [content, cssContent, currentFont, currentSize, currentColor, citeStatus, isMacCodeBlock, setOutput]);

  // 加载代码主题样式
  useEffect(() => {
    let linkElement = document.getElementById('hljs-theme') as HTMLLinkElement;
    
    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.id = 'hljs-theme';
      linkElement.rel = 'stylesheet';
      document.head.appendChild(linkElement);
    }

    linkElement.href = codeTheme;
  }, [codeTheme]);

  // 处理图片样式（移除 width/height 属性，使用 style）
  useEffect(() => {
    if (previewRef.current) {
      const images = previewRef.current.querySelectorAll('img');
      images.forEach((img) => {
        const width = img.getAttribute('width');
        const height = img.getAttribute('height');
        if (width || height) {
          img.removeAttribute('width');
          img.removeAttribute('height');
          if (width) img.style.width = width;
          if (height) img.style.height = height;
        }
      });
    }
  }, [htmlContent]);

  return (
    <div className="h-full flex flex-col">
      {/* 预览模式切换按钮 */}
      <div className="flex items-center justify-center border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2">
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setPreviewMode('pc')}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
              previewMode === 'pc'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            PC 预览
          </button>
          <button
            onClick={() => setPreviewMode('mobile')}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
              previewMode === 'mobile'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            手机预览
          </button>
        </div>
      </div>

      {/* 预览内容 */}
      <div
        ref={previewRef}
        className={`preview-wrapper flex-1 overflow-y-auto ${className}`}
        style={{
          padding: previewMode === 'mobile' ? '20px' : '20px',
          backgroundColor: previewMode === 'mobile' ? '#f5f5f5' : '#fff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: previewMode === 'mobile' ? 'flex-start' : 'flex-start',
        }}
      >
        {previewMode === 'mobile' ? (
          // 手机预览模式
          <div
            className="mobile-preview-container"
            style={{
              width: '375px',
              minHeight: '100%',
              backgroundColor: '#fff',
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
              position: 'relative',
            }}
          >
            {/* 手机状态栏 */}
            <div
              style={{
                height: '44px',
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                color: '#fff',
                fontSize: '14px',
              }}
            >
              <span>9:41</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '12px' }}>📶</span>
                <span style={{ fontSize: '12px' }}>📶</span>
                <span style={{ fontSize: '12px' }}>🔋</span>
              </div>
            </div>
            
            {/* 手机内容区域 */}
            <div
              id="output"
              className="preview-content"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              style={{
                padding: '15px',
                maxWidth: '100%',
              }}
            />
          </div>
        ) : (
          // PC 预览模式
          <div
            id="output"
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            style={{
              maxWidth: '750px',
              margin: '0 auto',
            }}
          />
        )}
      </div>
    </div>
  );
}

