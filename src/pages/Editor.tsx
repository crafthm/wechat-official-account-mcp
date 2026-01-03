import { useEffect, useState, useRef, useCallback } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { CodeMirrorEditor } from '@/components/editor/CodeMirrorEditor';
import { Preview } from '@/components/editor/Preview';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { CssEditor } from '@/components/editor/CssEditor';
import { UploadImageDialog } from '@/components/editor/UploadImageDialog';
import { InsertTableDialog } from '@/components/editor/InsertTableDialog';
import { AboutDialog } from '@/components/editor/AboutDialog';
import { RightClickMenu } from '@/components/editor/RightClickMenu';
import { PublishDialog } from '@/components/editor/PublishDialog';
import { SaveDraftDialog } from '@/components/editor/SaveDraftDialog';
import { uploadImage } from '@/lib/image/upload';
import { formatDoc } from '@/lib/utils/formatter';
import { downloadMD, exportHTML } from '@/lib/utils/formatter';
import { WxRenderer } from '@/lib/markdown/wx-renderer';
import { setFontSize, setColorWithCustomTemplate } from '@/lib/markdown/themes';
import { DEFAULT_MARKDOWN_CONTENT, DEFAULT_CSS_CONTENT } from '@/lib/markdown/default-content';
import { solveWeChatImage, mergeCss, modifyHtmlStructure, processWeChatHtml } from '@/lib/utils/converter';

interface EditorProps {
  draftData?: {
    mediaId: string;
    title: string;
    content: string;
    author?: string;
    digest?: string;
  } | null;
  shouldClear?: boolean;
  onClearComplete?: () => void;
}

export default function Editor({ draftData, shouldClear, onClearComplete }: EditorProps = {}) {
  const {
    editorContent,
    cssContent,
    output,
    currentFont,
    currentSize,
    currentColor,
    nightMode,
    isEditOnLeft,
    setEditorContent,
    setCssContent,
    setOutput,
    initEditorState,
    setWxRenderer,
  } = useEditorStore();

  const [showCssEditor, setShowCssEditor] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false);
  const [isImportedFromLocal, setIsImportedFromLocal] = useState(false);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [lastContentHash, setLastContentHash] = useState<string>('');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [rightClickMenu, setRightClickMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });

  const editorRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // 初始化编辑器状态（只在组件挂载时执行一次，且不在清空时）
  useEffect(() => {
    // 如果 shouldClear 为 true，说明需要清空，不执行初始化
    // 或者如果已经初始化过，也不执行
    if (!shouldClear && !hasInitialized.current) {
      initEditorState();
      hasInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 计算字符串哈希（支持 Unicode）
  const calculateHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为 32 位整数
    }
    // 转换为正数并转为十六进制
    return Math.abs(hash).toString(16).padStart(8, '0');
  };

  // 读取文件内容（使用 useCallback 确保稳定引用）
  const readFileContent = useCallback(async (file: File | FileSystemFileHandle): Promise<string> => {
    let actualFile: File;
    if (file instanceof File) {
      actualFile = file;
    } else {
      // FileSystemFileHandle
      actualFile = await file.getFile();
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        const formatted = await formatDoc(content);
        resolve(formatted);
      };
      reader.onerror = reject;
      reader.readAsText(actualFile);
    });
  }, []);

  // 刷新文件内容（使用 useCallback 避免重复创建）
  const refreshFileContent = useCallback(async () => {
    const currentFileHandle = fileHandle;
    if (!currentFileHandle) return;
    
    try {
      const file = await currentFileHandle.getFile();
      const content = await readFileContent(file);
      
      // 计算内容哈希，避免不必要的更新（使用支持 Unicode 的哈希方法）
      const contentHash = calculateHash(content);
      
      // 使用函数式更新来获取最新的 lastContentHash
      setLastContentHash((prevHash) => {
        if (contentHash !== prevHash) {
          setEditorContent(content);
          return contentHash;
        }
        return prevHash;
      });
    } catch (error) {
      console.error('刷新文件内容失败:', error);
      // 如果文件无法访问（可能被删除或移动），停止自动刷新
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        setAutoRefreshEnabled(false);
        setFileHandle(null);
        setIsImportedFromLocal(false);
      }
    }
  }, [fileHandle, setEditorContent, readFileContent]);

  // 处理清空内容时重置导入标记
  useEffect(() => {
    if (shouldClear) {
      setIsImportedFromLocal(false);
      setFileHandle(null);
      setFileName('');
      setAutoRefreshEnabled(false);
      setLastContentHash('');
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [shouldClear, refreshInterval]);

  // 定时刷新文件内容
  useEffect(() => {
    if (isImportedFromLocal && fileHandle && autoRefreshEnabled) {
      // 每3秒刷新一次
      const interval = setInterval(() => {
        refreshFileContent();
      }, 3000);
      
      setRefreshInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [isImportedFromLocal, fileHandle, autoRefreshEnabled, refreshFileContent]);

  // 处理草稿数据加载
  useEffect(() => {
    if (draftData) {
      // 加载草稿时，不是从本地导入的
      setIsImportedFromLocal(false);
      // 将HTML内容转换为Markdown（简单处理：提取文本内容）
      // 这里可以后续优化为更完善的HTML到Markdown转换
      const htmlToMarkdown = (html: string): string => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        let markdown = '';
        
        // 添加标题
        if (draftData.title) {
          markdown = `# ${draftData.title}\n\n`;
        }
        
        // 遍历所有子节点，保持结构
        const processNode = (node: Node): string => {
          let result = '';
          
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text) {
              result += text + ' ';
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const tagName = element.tagName.toLowerCase();
            
            switch (tagName) {
              case 'h1':
                result += `# ${element.textContent?.trim() || ''}\n\n`;
                break;
              case 'h2':
                result += `## ${element.textContent?.trim() || ''}\n\n`;
                break;
              case 'h3':
                result += `### ${element.textContent?.trim() || ''}\n\n`;
                break;
              case 'p':
                const pText = Array.from(element.childNodes)
                  .map(processNode)
                  .join('')
                  .trim();
                if (pText) {
                  result += pText + '\n\n';
                }
                break;
              case 'img':
                const src = element.getAttribute('src');
                const alt = element.getAttribute('alt') || '';
                if (src) {
                  result += `![${alt}](${src})\n\n`;
                }
                break;
              case 'ul':
              case 'ol':
                const items = element.querySelectorAll('li');
                items.forEach((item) => {
                  const itemText = Array.from(item.childNodes)
                    .map(processNode)
                    .join('')
                    .trim();
                  if (itemText) {
                    result += `- ${itemText}\n`;
                  }
                });
                result += '\n';
                break;
              case 'strong':
              case 'b':
                result += `**${element.textContent?.trim() || ''}**`;
                break;
              case 'em':
              case 'i':
                result += `*${element.textContent?.trim() || ''}*`;
                break;
              case 'code':
                result += `\`${element.textContent?.trim() || ''}\``;
                break;
              case 'a':
                const href = element.getAttribute('href');
                const linkText = element.textContent?.trim();
                if (href && linkText) {
                  result += `[${linkText}](${href})`;
                } else {
                  result += Array.from(element.childNodes)
                    .map(processNode)
                    .join('');
                }
                break;
              case 'br':
                result += '\n';
                break;
              default:
                // 对于其他标签，递归处理子节点
                result += Array.from(element.childNodes)
                  .map(processNode)
                  .join('');
                break;
            }
          }
          
          return result;
        };
        
        markdown += Array.from(tempDiv.childNodes)
          .map(processNode)
          .join('')
          .trim();
        
        return markdown || html;
      };
      
      const markdownContent = htmlToMarkdown(draftData.content);
      setEditorContent(markdownContent);
    }
  }, [draftData, setEditorContent]);

  // 处理清空内容（优先级最高，在其他 useEffect 之前执行）
  useEffect(() => {
    if (shouldClear) {
      // 先清除 localStorage，防止 initEditorState 加载内容
      localStorage.removeItem('__editor_content');
      localStorage.removeItem('__css_content');
      // 清空文章内容（强制设置为空字符串）
      setEditorContent('');
      // 清空CSS内容（强制设置为空字符串）
      setCssContent('');
      // 清空预览区域
      setOutput('');
      // 标记为已初始化，防止 initEditorState 再次执行
      hasInitialized.current = true;
      if (onClearComplete) {
        onClearComplete();
      }
    }
  }, [shouldClear, onClearComplete, setEditorContent, setCssContent, setOutput]);

  // 确保有默认内容（在初始化后，但不在清空时）
  // 这个 useEffect 已经被禁用，因为清空操作应该保持内容为空
  // 只有在首次加载且不是清空操作时才设置默认内容
  useEffect(() => {
    // 如果 shouldClear 为 true，不设置默认内容
    if (shouldClear) {
      return;
    }
    
    // 检查 localStorage，如果被清空（null），说明是清空操作，保持为空
    const savedContent = localStorage.getItem('__editor_content');
    const savedCss = localStorage.getItem('__css_content');
    
    // 如果 localStorage 被明确清空（removeItem），保持为空，不设置默认内容
    if (savedContent === null || savedCss === null) {
      return;
    }
    
    // 只有在 localStorage 中有内容且当前内容为空时，才使用保存的内容
    // 注意：这里不应该设置默认内容，因为 initEditorState 已经处理了
    // 如果 initEditorState 没有执行（shouldClear 为 true），这里也不应该设置默认内容
  }, [editorContent, cssContent, shouldClear]);

  // 初始化渲染器（在状态加载后）
  useEffect(() => {
    if (!currentSize || !currentColor || !currentFont) {
      console.warn('Editor state not ready:', { currentSize, currentColor, currentFont });
      return;
    }

    try {
      const fontSize = parseInt(currentSize.replace('px', ''), 10);
      if (isNaN(fontSize)) {
        console.warn('Invalid font size:', currentSize);
        return;
      }

      const theme = setFontSize(fontSize);
      const coloredTheme = setColorWithCustomTemplate(theme, currentColor);

      const renderer = new WxRenderer({
        theme: coloredTheme,
        fonts: currentFont,
        size: currentSize,
      });

      setWxRenderer(renderer);
    } catch (error) {
      console.error('Failed to initialize renderer:', error);
    }
  }, [currentSize, currentColor, currentFont, setWxRenderer]);

  // 处理图片上传
  const handleImageUploaded = async (url: string) => {
    // 在光标位置插入图片 Markdown
    const imageMarkdown = `\n![](${url})\n`;
    setEditorContent(editorContent + imageMarkdown);
  };

  // 处理粘贴图片
  const handlePasteImage = async (file: File) => {
    try {
      const url = await uploadImage({ file, host: 'wechat' });
      handleImageUploaded(url);
    } catch (error) {
      console.error('Upload image error:', error);
      alert(error instanceof Error ? error.message : '图片上传失败');
    }
  };

  // 处理插入表格
  const handleInsertTable = (table: string) => {
    setEditorContent(editorContent + '\n' + table + '\n');
  };

  // 处理导入 Markdown
  const handleImportMD = async () => {
    // 优先尝试使用 File System Access API
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [{
            description: 'Markdown files',
            accept: {
              'text/markdown': ['.md'],
              'text/plain': ['.txt'],
            },
          }],
          multiple: false,
        });
        
        const file = await handle.getFile();
        const content = await readFileContent(file);
        setEditorContent(content);
        setIsImportedFromLocal(true);
        setFileHandle(handle);
        // 保存文件名（FileSystemFileHandle 有 name 属性）
        setFileName(file.name);
        
        // 计算初始内容哈希（使用支持 Unicode 的哈希方法）
        const contentHash = calculateHash(content);
        setLastContentHash(contentHash);
        setAutoRefreshEnabled(true);
      } catch (error) {
        // 用户取消选择或其他错误，回退到传统方式
        if ((error as any).name !== 'AbortError') {
          console.error('使用 File System Access API 失败:', error);
        }
        // 继续使用传统文件选择
        useTraditionalFileInput();
      }
    } else {
      // 浏览器不支持 File System Access API，使用传统方式
      useTraditionalFileInput();
    }
  };

  // 传统文件输入方式
  const useTraditionalFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const content = await readFileContent(file);
        setEditorContent(content);
        setIsImportedFromLocal(true);
        setFileHandle(null); // 传统方式无法获取文件句柄
        setFileName(file.name); // 保存文件名
        setAutoRefreshEnabled(false); // 传统方式无法自动刷新
      }
    };
    input.click();
  };

  // 处理右键菜单
  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setRightClickMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'insertPic':
        setShowUploadDialog(true);
        break;
      case 'insertTable':
        setShowTableDialog(true);
        break;
      case 'formatMarkdown':
        formatDoc(editorContent).then((formatted) => {
          setEditorContent(formatted);
        });
        break;
      case 'download':
        downloadMD(editorContent);
        break;
      case 'export':
        exportHTML(output);
        break;
    }
  };

  // 处理复制到剪贴板
  const handleCopy = () => {
    const outputElement = document.getElementById('output');
    if (!outputElement || !output) {
      alert('没有可复制的内容');
      return;
    }

    // 保存原始内容
    const originalHtml = outputElement.innerHTML;

    try {
      // 处理图片
      solveWeChatImage(outputElement);
      
      // 合并 CSS
      outputElement.innerHTML = mergeCss(outputElement.innerHTML);
      
      // 修改 HTML 结构
      outputElement.innerHTML = modifyHtmlStructure(outputElement.innerHTML);
      
      // 处理微信公众号兼容性
      outputElement.innerHTML = processWeChatHtml(outputElement.innerHTML);

      // 选中所有内容
      outputElement.focus();
      window.getSelection()?.removeAllRanges();
      const range = document.createRange();
      if (outputElement.firstChild && outputElement.lastChild) {
        range.setStartBefore(outputElement.firstChild);
        range.setEndAfter(outputElement.lastChild);
        window.getSelection()?.addRange(range);
      }

      // 复制到剪贴板
      document.execCommand('copy');
      window.getSelection()?.removeAllRanges();

      // 恢复原始内容
      outputElement.innerHTML = originalHtml;

      alert('已复制渲染后的文章到剪贴板，可直接到公众号后台粘贴');
    } catch (error) {
      console.error('复制失败:', error);
      alert('复制失败，请重试');
      // 恢复原始内容
      outputElement.innerHTML = originalHtml;
    }
  };

  // 处理保存草稿
  const handleSave = () => {
    setShowSaveDraftDialog(true);
  };

  // 保存草稿成功回调
  const handleSaveSuccess = (mediaId: string) => {
    alert(`草稿保存成功！\n草稿ID: ${mediaId}\n\n您可以在"草稿箱"中查看和管理此草稿。`);
  };

  // 处理发布
  const handlePublish = () => {
    setShowPublishDialog(true);
  };

  // 发布成功回调
  const handlePublishSuccess = (publishId: string, msgDataId: string) => {
    alert(`发布成功！\n发布ID: ${publishId}\n消息数据ID: ${msgDataId}\n\n注意：发布结果将通过事件推送通知，请关注推送消息。`);
  };

  // 滚动同步
  useEffect(() => {
    const editorEl = editorRef.current;
    const previewEl = previewRef.current;

    if (!editorEl || !previewEl) return;

    const handleEditorScroll = () => {
      // 实现滚动同步逻辑
    };

    const handlePreviewScroll = () => {
      // 实现滚动同步逻辑
    };

    // 这里可以添加滚动同步逻辑
    // editorEl.addEventListener('scroll', handleEditorScroll);
    // previewEl.addEventListener('scroll', handlePreviewScroll);

    return () => {
      // editorEl.removeEventListener('scroll', handleEditorScroll);
      // previewEl.removeEventListener('scroll', handlePreviewScroll);
    };
  }, []);

  return (
    <div
      className={`h-full flex flex-col ${
        nightMode ? 'dark bg-gray-900' : 'bg-gray-50'
      }`}
    >
      {/* 头部工具栏 */}
      <EditorHeader
        onImportMD={handleImportMD}
        onUploadImage={() => setShowUploadDialog(true)}
        onInsertTable={() => setShowTableDialog(true)}
        onShowCssEditor={() => setShowCssEditor(true)}
        onCopy={handleCopy}
        onSave={handleSave}
        onPublish={handlePublish}
        onRefresh={refreshFileContent}
        isImportedFromLocal={isImportedFromLocal}
        autoRefreshEnabled={autoRefreshEnabled && !!fileHandle}
        editorContent={editorContent}
        outputHtml={output}
      />

      {/* 主编辑区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 编辑器 */}
        <div
          ref={editorRef}
          className={`w-1/2 h-full border-r border-gray-200 dark:border-gray-700 flex flex-col ${
            isEditOnLeft ? 'order-0' : 'order-1'
          }`}
          onContextMenu={handleRightClick}
        >
          <div className="flex-1 overflow-hidden">
            <CodeMirrorEditor
              value={editorContent}
              onChange={setEditorContent}
              nightMode={nightMode}
              onPaste={handlePasteImage}
            />
          </div>
          {/* 状态栏 */}
          {isImportedFromLocal && fileName && (
            <div className="h-6 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 flex items-center text-xs text-gray-600 dark:text-gray-400">
              <span className="truncate" title={fileName}>
                本地文件: {fileName}
              </span>
            </div>
          )}
        </div>

        {/* 预览 */}
        <div
          ref={previewRef}
          className={`w-1/2 h-full overflow-hidden ${
            nightMode && !isEditOnLeft ? 'bg-white' : ''
          }`}
        >
          <Preview
            content={editorContent}
            cssContent={cssContent || ''}
            className={nightMode ? 'dark:bg-white' : ''}
          />
        </div>
      </div>

      {/* CSS 编辑器 */}
      <CssEditor
        visible={showCssEditor}
        onClose={() => setShowCssEditor(false)}
      />

      {/* 图片上传对话框 */}
      <UploadImageDialog
        visible={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUploaded={handleImageUploaded}
      />

      {/* 插入表格对话框 */}
      <InsertTableDialog
        visible={showTableDialog}
        onClose={() => setShowTableDialog(false)}
        onInsert={handleInsertTable}
      />

      {/* 关于对话框 */}
      <AboutDialog
        visible={showAboutDialog}
        onClose={() => setShowAboutDialog(false)}
      />

      {/* 右键菜单 */}
      <RightClickMenu
        visible={rightClickMenu.visible}
        x={rightClickMenu.x}
        y={rightClickMenu.y}
        onClose={() => setRightClickMenu({ ...rightClickMenu, visible: false })}
        onMenuClick={handleMenuClick}
      />

      {/* 保存草稿对话框 */}
      <SaveDraftDialog
        visible={showSaveDraftDialog}
        onClose={() => setShowSaveDraftDialog(false)}
        onSuccess={handleSaveSuccess}
        htmlContent={output || ''}
        markdownContent={editorContent}
        isImportedFromLocal={isImportedFromLocal}
      />

      {/* 发布对话框 */}
      <PublishDialog
        visible={showPublishDialog}
        onClose={() => setShowPublishDialog(false)}
        onSuccess={handlePublishSuccess}
        htmlContent={output || ''}
      />
    </div>
  );
}

