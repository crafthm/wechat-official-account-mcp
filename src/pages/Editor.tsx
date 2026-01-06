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
  isViewMode?: boolean; // 是否为查看模式
}

export default function Editor({ draftData, shouldClear, onClearComplete, isViewMode: initialViewMode = false }: EditorProps = {}) {
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

  // 内部状态控制查看/编辑模式切换（如果有 draftData，初始为查看模式；否则为编辑模式）
  const [isViewMode, setIsViewMode] = useState(initialViewMode || (draftData ? true : false));
  
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
  
  // 保存目标状态
  const [saveTargets, setSaveTargets] = useState<{
    local: boolean;
    wechat: boolean;
  }>({
    local: false,
    wechat: true, // 默认只保存到公众号
  });

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

  // 使用 ref 来跟踪已加载的 draftData，避免重复加载
  const loadedDraftMediaIdRef = useRef<string | null>(null);

  // 当 draftData 变化时，重置查看模式（如果有草稿数据，默认进入查看模式）
  useEffect(() => {
    if (draftData) {
      // 只有当 mediaId 真正变化时，才重置状态
      if (draftData.mediaId !== loadedDraftMediaIdRef.current) {
        // 如果有草稿数据且是新的草稿，默认进入查看模式
        setIsViewMode(true);
      }
      // 如果 mediaId 相同，不改变查看/编辑模式
    } else {
      // 如果没有草稿数据，进入编辑模式
      setIsViewMode(false);
    }
  }, [draftData]);

  // 处理草稿数据加载
  useEffect(() => {
    // 简化逻辑：只在查看模式中同步草稿内容，编辑模式不允许同步
    if (!isViewMode) {
      // 编辑模式：不允许同步，直接返回
      // 如果 mediaId 变化了，更新 loadedDraftMediaIdRef 避免重复检查
      if (draftData && draftData.mediaId !== loadedDraftMediaIdRef.current) {
        loadedDraftMediaIdRef.current = draftData.mediaId;
      }
      return;
    }
    
    // 查看模式：允许同步草稿内容
    if (draftData && draftData.mediaId !== loadedDraftMediaIdRef.current) {
      // 记录已加载的 mediaId
      loadedDraftMediaIdRef.current = draftData.mediaId;
      
      // 加载草稿时，不是从本地导入的
      setIsImportedFromLocal(false);
      // 将HTML内容转换为Markdown（简单处理：提取文本内容）
      // 这里可以后续优化为更完善的HTML到Markdown转换
      const htmlToMarkdown = (html: string): string => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        let markdown = '';
        
        // 检查HTML内容是否以标题开头（h1, h2, h3）
        const firstElement = tempDiv.firstElementChild;
        const isFirstElementHeading = firstElement && 
          (firstElement.tagName === 'H1' || 
           firstElement.tagName === 'H2' || 
           firstElement.tagName === 'H3');
        
        // 如果内容不是以标题开头，才添加标题
        if (draftData.title && !isFirstElementHeading) {
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
    } else if (!draftData) {
      // 如果 draftData 变为 null，重置已加载的 mediaId
      loadedDraftMediaIdRef.current = null;
    }
    // 注意：editorContent 不应该作为依赖项，因为每次用户输入都会触发这个 useEffect
    // 我们只关心 draftData 和 isViewMode 的变化
    // 但是我们需要在 useEffect 内部读取 editorContent 的当前值来判断是否有内容
  }, [draftData, setEditorContent, isViewMode]);

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
      // 重置已加载的草稿 mediaId
      loadedDraftMediaIdRef.current = null;
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

  // 从HTML内容中提取标题和第一张图片，并移除第二个标题元素（如果存在）
  const extractContentInfo = (htmlContent: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // 提取标题（优先使用h1，然后是h2、h3）
    const headings = tempDiv.querySelectorAll('h1, h2, h3');
    const firstHeading = headings[0];
    const title = firstHeading?.textContent?.trim() || '未命名文章';
    
    // 如果存在第二个标题（隔一行后的标题），移除它
    let contentWithoutSecondTitle = htmlContent;
    if (headings.length > 1) {
      // 移除第二个标题（索引为1）
      headings[1].remove();
      contentWithoutSecondTitle = tempDiv.innerHTML;
    }
    
    // 提取第一张图片
    const firstImage = tempDiv.querySelector('img');
    const imageSrc = firstImage?.getAttribute('src') || '';
    
    return { title, imageSrc, content: contentWithoutSecondTitle };
  };

  // 创建一个默认的占位符图片（使用canvas创建640x640像素的白色PNG）
  // 微信公众号要求封面图片至少为640x640像素
  const createDefaultThumbImage = (): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      // 创建640x640像素的正方形图片（符合微信要求）
      canvas.width = 640;
      canvas.height = 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // 填充浅灰色背景（比纯白色更友好）
        ctx.fillStyle = '#F5F5F5';
        ctx.fillRect(0, 0, 640, 640);
        
        // 添加一个简单的文字提示（可选）
        ctx.fillStyle = '#CCCCCC';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('默认封面', 320, 320);
        
        // 转换为base64（使用JPEG格式，文件更小）
        const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        resolve(base64);
      } else {
        // 如果canvas不支持，抛出错误
        throw new Error('浏览器不支持Canvas，无法创建默认封面图片');
      }
    });
  };

  // 调整图片尺寸以符合微信要求（至少640x640像素）
  const resizeImageToFit = (imageSrc: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('浏览器不支持Canvas'));
          return;
        }
        
        // 微信要求封面图片至少为640x640像素
        const minSize = 640;
        let width = img.width;
        let height = img.height;
        
        // 如果图片尺寸小于640x640，需要放大
        if (width < minSize || height < minSize) {
          // 保持宽高比，确保最小边至少为640
          const scale = minSize / Math.min(width, height);
          width = Math.max(width * scale, minSize);
          height = Math.max(height * scale, minSize);
        }
        
        // 如果是正方形，直接使用；否则裁剪为正方形
        const size = Math.max(width, height);
        canvas.width = size;
        canvas.height = size;
        
        // 填充白色背景
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        
        // 居中绘制图片
        const x = (size - width) / 2;
        const y = (size - height) / 2;
        ctx.drawImage(img, x, y, width, height);
        
        // 转换为base64（使用JPEG格式，质量0.9）
        const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        resolve(base64);
      };
      
      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
      
      img.src = imageSrc;
    });
  };

  // 上传图片并获取mediaId
  const uploadImageAsThumb = async (imageSrc: string): Promise<string> => {
    try {
      // 如果是base64格式，先调整尺寸
      if (imageSrc.startsWith('data:image/')) {
        // 调整图片尺寸以符合微信要求
        const resizedBase64 = await resizeImageToFit(imageSrc);
        const fileName = 'cover.jpg';
        
        const response = await fetch('/api/publish/upload-thumb', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileData: resizedBase64,
            fileName,
          }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          return result.data.mediaId;
        } else {
          throw new Error(result.message || '上传封面图失败');
        }
      } else {
        // 如果是外部URL，需要先下载并转换为base64
        // 这里简化处理：提示用户需要先上传封面图片
        throw new Error('无法从外部URL自动上传封面图片，请点击"发布"按钮手动上传封面图片');
      }
    } catch (error) {
      throw error;
    }
  };

  // 上传默认占位符图片
  const uploadDefaultThumb = async (): Promise<string> => {
    const base64Content = await createDefaultThumbImage();
    // 使用jpg格式，文件更小
    const fileName = 'default-cover.jpg';
    
    const response = await fetch('/api/publish/upload-thumb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileData: base64Content,
        fileName,
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data.mediaId;
    } else {
      throw new Error(result.message || '上传默认封面图失败');
    }
  };

  // 保存到本地
  const saveToLocal = async (title: string, content: string, author?: string, digest?: string) => {
    try {
      // 生成唯一的 mediaId（使用时间戳+随机数）
      const mediaId = draftData?.mediaId || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();

      // 尝试从现有草稿获取创建时间
      let createTime = now;
      if (draftData?.mediaId) {
        const draftKey = `local_draft_${draftData.mediaId}`;
        const existingDraft = localStorage.getItem(draftKey);
        if (existingDraft) {
          try {
            const parsed = JSON.parse(existingDraft);
            createTime = parsed.createTime || now;
          } catch (e) {
            // 解析失败，使用当前时间
          }
        }
      }

      // 保存草稿详情到 localStorage
      const draftKey = `local_draft_${mediaId}`;
      localStorage.setItem(draftKey, JSON.stringify({
        title,
        content,
        author: author || '',
        digest: digest || '',
        createTime,
        updateTime: now,
      }));

      // 更新导入标记列表
      const importedDrafts = JSON.parse(localStorage.getItem('imported_drafts') || '[]');
      const normalizedDrafts = Array.isArray(importedDrafts) && importedDrafts.length > 0 && typeof importedDrafts[0] === 'string'
        ? importedDrafts.map((id: string) => ({ mediaId: id, filePath: '' }))
        : importedDrafts;
      
      const existingIndex = normalizedDrafts.findIndex((item: any) => 
        (typeof item === 'string' ? item : item.mediaId) === mediaId
      );
      
      if (existingIndex >= 0) {
        if (typeof normalizedDrafts[existingIndex] === 'object') {
          normalizedDrafts[existingIndex].filePath = fileName || '';
        } else {
          normalizedDrafts[existingIndex] = { mediaId, filePath: fileName || '' };
        }
      } else {
        normalizedDrafts.push({ mediaId, filePath: fileName || '' });
      }
      localStorage.setItem('imported_drafts', JSON.stringify(normalizedDrafts));

      return mediaId;
    } catch (error) {
      console.error('保存到本地失败:', error);
      throw error;
    }
  };

  // 处理保存草稿（直接保存，不弹出对话框）
  const handleSave = async () => {
    // 检查是否至少选择了一个保存目标
    if (!saveTargets.local && !saveTargets.wechat) {
      alert('请至少选择一个保存目标（本地或公众号）');
      return;
    }
    try {
      // 从HTML内容中提取信息（会移除标题元素）
      const { title, imageSrc, content: contentWithoutTitle } = extractContentInfo(output);
      
      let thumbMediaId = '';
      
      // 如果需要保存到公众号，上传封面图片
      if (saveTargets.wechat) {
        if (imageSrc) {
          try {
            thumbMediaId = await uploadImageAsThumb(imageSrc);
          } catch (error) {
            // 如果上传失败，使用默认占位符图片
            console.warn('上传封面图失败，使用默认占位符:', error);
            try {
              thumbMediaId = await uploadDefaultThumb();
            } catch (defaultError) {
              throw new Error('无法上传封面图片，请稍后重试');
            }
          }
        } else {
          // 如果没有图片，使用默认占位符图片
          try {
            thumbMediaId = await uploadDefaultThumb();
          } catch (error) {
            throw new Error('无法上传默认封面图片，请稍后重试');
          }
        }
        
        if (!thumbMediaId) {
          throw new Error('无法获取封面图片');
        }
      }
      
      const savePromises: Promise<string>[] = [];
      const saveResults: string[] = [];

      // 保存到本地
      if (saveTargets.local) {
        savePromises.push(
          saveToLocal(
            title,
            contentWithoutTitle,
            draftData?.author,
            draftData?.digest
          ).then(mediaId => {
            saveResults.push(`本地: ${mediaId}`);
            return mediaId;
          }).catch(error => {
            saveResults.push(`本地保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
            throw error;
          })
        );
      }

      // 保存到公众号
      if (saveTargets.wechat) {
        // 如果是编辑已有草稿，调用更新接口
        if (draftData?.mediaId) {
          const updatePromise = fetch('/api/draft/update', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              mediaId: draftData.mediaId,
              index: 0,
              title,
              content: contentWithoutTitle,
              thumbMediaId,
              author: draftData?.author || '',
              digest: draftData?.digest || '',
              showCoverPic: 1,
              needOpenComment: 0,
              onlyFansCanComment: 0,
              isOriginal: 0,
            }),
          }).then(async (response) => {
            const result = await response.json();
            if (result.success) {
              // 如果是从本地导入的，确保标记已记录
              if (isImportedFromLocal) {
                try {
                  const importedDrafts = JSON.parse(localStorage.getItem('imported_drafts') || '[]');
                  const normalizedDrafts = Array.isArray(importedDrafts) && importedDrafts.length > 0 && typeof importedDrafts[0] === 'string'
                    ? importedDrafts.map((id: string) => ({ mediaId: id, filePath: '' }))
                    : importedDrafts;
                  
                  const existingIndex = normalizedDrafts.findIndex((item: any) => 
                    (typeof item === 'string' ? item : item.mediaId) === draftData.mediaId
                  );
                  
                  if (existingIndex >= 0) {
                    if (typeof normalizedDrafts[existingIndex] === 'object') {
                      normalizedDrafts[existingIndex].filePath = fileName || '';
                    } else {
                      normalizedDrafts[existingIndex] = { mediaId: draftData.mediaId, filePath: fileName || '' };
                    }
                  } else {
                    normalizedDrafts.push({ mediaId: draftData.mediaId, filePath: fileName || '' });
                  }
                  localStorage.setItem('imported_drafts', JSON.stringify(normalizedDrafts));
                } catch (error) {
                  console.error('保存导入标记失败:', error);
                }
              }
              saveResults.push(`公众号: ${draftData.mediaId}`);
              return draftData.mediaId;
            } else {
              throw new Error(result.message || '更新失败');
            }
          });
          savePromises.push(updatePromise);
        } else {
          // 新建草稿的逻辑
          const createPromise = fetch('/api/draft/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title,
              content: contentWithoutTitle,
              thumbMediaId,
              author: '',
              digest: '',
              showCoverPic: 1,
              needOpenComment: 0,
              onlyFansCanComment: 0,
              isOriginal: 0,
            }),
          }).then(async (response) => {
            const result = await response.json();
            if (result.success) {
              const mediaId = result.data.mediaId;
              // 如果是从本地导入的，记录到 localStorage
              if (isImportedFromLocal) {
                try {
                  const importedDrafts = JSON.parse(localStorage.getItem('imported_drafts') || '[]');
                  const normalizedDrafts = Array.isArray(importedDrafts) && importedDrafts.length > 0 && typeof importedDrafts[0] === 'string'
                    ? importedDrafts.map((id: string) => ({ mediaId: id, filePath: '' }))
                    : importedDrafts;
                  
                  const existingIndex = normalizedDrafts.findIndex((item: any) => 
                    (typeof item === 'string' ? item : item.mediaId) === mediaId
                  );
                  
                  if (existingIndex >= 0) {
                    if (typeof normalizedDrafts[existingIndex] === 'object') {
                      normalizedDrafts[existingIndex].filePath = fileName || '';
                    } else {
                      normalizedDrafts[existingIndex] = { mediaId, filePath: fileName || '' };
                    }
                  } else {
                    normalizedDrafts.push({ mediaId, filePath: fileName || '' });
                  }
                  localStorage.setItem('imported_drafts', JSON.stringify(normalizedDrafts));
                } catch (error) {
                  console.error('保存导入标记失败:', error);
                }
              }
              saveResults.push(`公众号: ${mediaId}`);
              return mediaId;
            } else {
              throw new Error(result.message || '保存失败');
            }
          });
          savePromises.push(createPromise);
        }
      }

      // 等待所有保存操作完成
      await Promise.all(savePromises);
      
      alert(`保存成功！\n${saveResults.join('\n')}\n\n您可以在"草稿箱"中查看和管理此草稿。`);
    } catch (error) {
      console.error('保存草稿失败:', error);
      alert(`保存失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 保存草稿成功回调
  const handleSaveSuccess = (mediaId: string) => {
    // 如果是从本地导入的，记录到 localStorage
    if (isImportedFromLocal) {
      try {
        const importedDrafts = JSON.parse(localStorage.getItem('imported_drafts') || '[]');
        // 兼容旧格式：如果是数组，转换为对象数组
        const normalizedDrafts = Array.isArray(importedDrafts) && importedDrafts.length > 0 && typeof importedDrafts[0] === 'string'
          ? importedDrafts.map((id: string) => ({ mediaId: id, filePath: '' }))
          : importedDrafts;
        
        const existingIndex = normalizedDrafts.findIndex((item: any) => 
          (typeof item === 'string' ? item : item.mediaId) === mediaId
        );
        
        if (existingIndex >= 0) {
          // 更新现有记录的文件路径
          if (typeof normalizedDrafts[existingIndex] === 'object') {
            normalizedDrafts[existingIndex].filePath = fileName || '';
          } else {
            normalizedDrafts[existingIndex] = { mediaId, filePath: fileName || '' };
          }
        } else {
          // 添加新记录
          normalizedDrafts.push({ mediaId, filePath: fileName || '' });
        }
        localStorage.setItem('imported_drafts', JSON.stringify(normalizedDrafts));
      } catch (error) {
        console.error('保存导入标记失败:', error);
      }
    }
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
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
          </div>
          <div className="flex-1">
            <EditorHeader
              onImportMD={handleImportMD}
              onUploadImage={() => setShowUploadDialog(true)}
              onInsertTable={() => setShowTableDialog(true)}
              onShowCssEditor={() => setShowCssEditor(true)}
              onCopy={handleCopy}
              onSave={isViewMode ? undefined : handleSave}
              onPublish={isViewMode ? undefined : handlePublish}
              onRefresh={refreshFileContent}
              isImportedFromLocal={isImportedFromLocal}
              autoRefreshEnabled={autoRefreshEnabled && !!fileHandle}
              editorContent={editorContent}
              outputHtml={output}
              isViewMode={isViewMode}
              onToggleViewMode={() => setIsViewMode(!isViewMode)}
              showViewModeToggle={!!draftData}
              saveTargets={saveTargets}
              onSaveTargetsChange={setSaveTargets}
            />
          </div>
        </div>
      </div>

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
              onChange={(content) => {
                // 只在非查看模式下允许编辑
                if (!isViewMode) {
                  setEditorContent(content);
                }
              }}
              nightMode={nightMode}
              onPaste={handlePasteImage}
              readOnly={isViewMode}
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

