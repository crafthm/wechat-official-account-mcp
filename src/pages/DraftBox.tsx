import { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Trash2, 
  Edit, 
  RefreshCw,
  Calendar,
  User,
  FileImage,
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  Cloud,
  FolderOpen,
} from "lucide-react";
import { marked } from "marked";

interface Draft {
  mediaId: string;
  title: string;
  author: string;
  digest: string;
  articleCount: number;
  createTime: number;
  updateTime: number;
  thumbMediaId: string;
}

interface DraftListResponse {
  totalCount: number;
  itemCount: number;
  drafts: Draft[];
}

interface DraftBoxProps {
  onEditDraft?: (data: { mediaId: string; title: string; content: string; author?: string; digest?: string }) => void;
  onNewArticle?: () => void;
}

// 本地导入的草稿接口
interface LocalDraft {
  mediaId: string;
  title: string;
  content: string;
  author?: string;
  digest?: string;
  createTime: number;
  updateTime: number;
  filePath: string;
}

export default function DraftBox({ onEditDraft, onNewArticle }: DraftBoxProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [localDrafts, setLocalDrafts] = useState<LocalDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 从 localStorage 加载本地草稿
  const loadLocalDrafts = () => {
    try {
      const importedDrafts = JSON.parse(localStorage.getItem('imported_drafts') || '[]');
      // 兼容旧格式：如果是字符串数组，转换为对象数组
      if (Array.isArray(importedDrafts) && importedDrafts.length > 0) {
        if (typeof importedDrafts[0] === 'string') {
          // 旧格式，无法恢复完整信息，返回空数组
          return [];
        } else {
          // 新格式，从 localStorage 读取草稿详情
          const drafts: LocalDraft[] = [];
          importedDrafts.forEach((item: any) => {
            if (item.mediaId && item.filePath) {
              // 尝试从 localStorage 读取草稿详情
              const draftKey = `local_draft_${item.mediaId}`;
              const draftData = localStorage.getItem(draftKey);
              if (draftData) {
                try {
                  const parsed = JSON.parse(draftData);
                  drafts.push({
                    mediaId: item.mediaId,
                    title: parsed.title || '未命名文章',
                    content: parsed.content || '',
                    author: parsed.author,
                    digest: parsed.digest,
                    createTime: parsed.createTime || Date.now(),
                    updateTime: parsed.updateTime || Date.now(),
                    filePath: item.filePath || '',
                  });
                } catch (e) {
                  console.error('解析草稿数据失败:', e);
                }
              }
            }
          });
          return drafts;
        }
      }
      return [];
    } catch (error) {
      console.error('读取本地草稿失败:', error);
      return [];
    }
  };

  // 判断草稿是否来自本地导入
  const isImportedDraft = (mediaId: string): boolean => {
    return localDrafts.some(draft => draft.mediaId === mediaId);
  };

  // 获取草稿的文件路径
  const getDraftFilePath = (mediaId: string): string => {
    const localDraft = localDrafts.find(draft => draft.mediaId === mediaId);
    return localDraft?.filePath || '';
  };

  // 获取草稿列表
  const fetchDrafts = async (offset: number = 0) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/draft/list?offset=${offset}&count=${pageSize}`);
      const result = await response.json();
      
      if (result.success) {
        setDrafts(result.data.drafts || []);
        setTotalCount(result.data.totalCount || 0);
      } else {
        const errorMsg = result.message || '获取草稿列表失败';
        // 检查是否是 IP 白名单错误
        if (errorMsg.includes('IP 白名单') || errorMsg.includes('not in whitelist')) {
          alert(errorMsg);
        } else {
          alert(errorMsg);
        }
      }
    } catch (error) {
      console.error('获取草稿列表失败:', error);
      const errorMessage = error instanceof Error ? error.message : '获取草稿列表失败，请检查网络连接';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 获取草稿统计
  const fetchCount = async () => {
    try {
      const response = await fetch('/api/draft/count');
      const result = await response.json();
      
      if (result.success) {
        setTotalCount(result.data.totalCount || 0);
      } else {
        // 统计失败不影响列表显示，只记录错误
        console.error('获取草稿统计失败:', result.message);
      }
    } catch (error) {
      console.error('获取草稿统计失败:', error);
    }
  };

  // 删除草稿
  const handleDelete = async (mediaId: string) => {
    if (!confirm('确定要删除这个草稿吗？删除后无法恢复。')) {
      return;
    }

    // 检查是否是本地草稿
    const localDraft = localDrafts.find(draft => draft.mediaId === mediaId);
    if (localDraft) {
      // 删除本地草稿
      setDeletingId(mediaId);
      try {
        // 从 state 中移除
        setLocalDrafts(prev => prev.filter(draft => draft.mediaId !== mediaId));
        
        // 从 localStorage 中删除
        const draftKey = `local_draft_${mediaId}`;
        localStorage.removeItem(draftKey);
        
        // 从导入标记列表中移除
        const importedDrafts = JSON.parse(localStorage.getItem('imported_drafts') || '[]');
        const normalizedDrafts = Array.isArray(importedDrafts) && importedDrafts.length > 0 && typeof importedDrafts[0] === 'string'
          ? importedDrafts.map((id: string) => ({ mediaId: id, filePath: '' }))
          : importedDrafts;
        
        const filtered = normalizedDrafts.filter((item: any) => 
          (typeof item === 'string' ? item : item.mediaId) !== mediaId
        );
        localStorage.setItem('imported_drafts', JSON.stringify(filtered));
      } catch (error) {
        console.error('删除本地草稿失败:', error);
        alert('删除失败');
      } finally {
        setDeletingId(null);
      }
      return;
    }

    // 公众号草稿，调用 API 删除
    setDeletingId(mediaId);
    try {
      const response = await fetch(`/api/draft/delete?mediaId=${mediaId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        // 重新获取列表
        await fetchDrafts(currentPage * pageSize);
        await fetchCount();
      } else {
        alert(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除草稿失败:', error);
      alert('删除失败，请检查网络连接');
    } finally {
      setDeletingId(null);
    }
  };

  // 编辑草稿
  const handleEdit = async (mediaId: string) => {
    // 检查是否是本地草稿
    const localDraft = localDrafts.find(draft => draft.mediaId === mediaId);
    if (localDraft) {
      // 本地草稿，直接调用 onEditDraft
      if (onEditDraft) {
        onEditDraft({
          mediaId: localDraft.mediaId,
          title: localDraft.title,
          content: localDraft.content,
          author: localDraft.author,
          digest: localDraft.digest,
        });
      }
      return;
    }

    // 公众号草稿，从 API 获取
    try {
      const response = await fetch(`/api/draft/get?mediaId=${mediaId}`);
      const result = await response.json();
      
      if (result.success) {
        const draft = result.data;
        // 取第一篇文章的内容
        const firstArticle = draft.articles[0];
        if (firstArticle && onEditDraft) {
          onEditDraft({
            mediaId: draft.mediaId,
            title: firstArticle.title,
            content: firstArticle.content,
            author: firstArticle.author,
            digest: firstArticle.digest,
          });
        }
      } else {
        alert(result.message || '获取草稿详情失败');
      }
    } catch (error) {
      console.error('获取草稿详情失败:', error);
      alert('获取草稿详情失败，请检查网络连接');
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchDrafts(0);
    fetchCount();
    // 加载本地草稿
    setLocalDrafts(loadLocalDrafts());
  }, []);

  // 分页处理
  const totalPages = Math.ceil(totalCount / pageSize);
  const handlePrevPage = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      fetchDrafts(newPage * pageSize);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      fetchDrafts(newPage * pageSize);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 解析markdown文件，提取标题和内容
  const parseMarkdown = (content: string, fileName: string) => {
    // 提取标题：优先使用第一个一级标题（#），否则使用文件名
    let title = '';
    let markdownContent = content;
    
    // 匹配第一个一级标题（# 开头，不是 ## 或 ###）
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      title = titleMatch[1].trim();
      // 移除第一个一级标题行
      markdownContent = content.replace(/^#\s+.+$/m, '').trim();
    } else {
      // 如果没有一级标题，使用文件名（去掉扩展名）
      title = fileName.replace(/\.(md|markdown)$/i, '');
    }

    // 使用marked将markdown转换为HTML
    const htmlContent = marked.parse(markdownContent) as string;

    return {
      title: title || '未命名文章',
      content: htmlContent,
    };
  };

  // 处理文件导入
  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // 检查文件类型
    if (!file.name.match(/\.(md|markdown)$/i)) {
      alert('请选择Markdown文件（.md或.markdown）');
      return;
    }

    try {
      // 读取文件内容
      const text = await file.text();
      
      // 解析markdown
      const { title, content } = parseMarkdown(text, file.name);

      // 生成唯一的 mediaId（使用时间戳+随机数）
      const mediaId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();

      // 创建本地草稿对象
      const localDraft: LocalDraft = {
        mediaId,
        title,
        content,
        createTime: now,
        updateTime: now,
        filePath: file.name,
      };

      // 添加到本地草稿列表
      setLocalDrafts(prev => [...prev, localDraft]);

      // 保存到 localStorage
      try {
        // 保存草稿详情
        const draftKey = `local_draft_${mediaId}`;
        localStorage.setItem(draftKey, JSON.stringify({
          title,
          content,
          createTime: now,
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
            normalizedDrafts[existingIndex].filePath = file.name;
          } else {
            normalizedDrafts[existingIndex] = { mediaId, filePath: file.name };
          }
        } else {
          normalizedDrafts.push({ mediaId, filePath: file.name });
        }
        localStorage.setItem('imported_drafts', JSON.stringify(normalizedDrafts));
      } catch (error) {
        console.error('保存导入标记失败:', error);
      }

      // 清空文件选择，以便可以重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('导入文件失败:', error);
      alert('导入文件失败，请检查文件格式');
    }
  };

  // 触发文件选择
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 顶部标题和操作区 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              草稿箱
            </h1>
            
            {/* 右侧操作区 */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                共 {totalCount + localDrafts.length} 个草稿
              </div>
              
              {/* 导入按钮 */}
              <button
                onClick={handleImportClick}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                title="从本地导入Markdown文件"
              >
                <Upload className="w-4 h-4" />
                导入
              </button>
              
              {/* 隐藏的文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown"
                onChange={handleImportFile}
                className="hidden"
              />
              
              {/* 新的创作按钮 */}
              {onNewArticle && (
                <button
                  onClick={onNewArticle}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  新的创作
                </button>
              )}
              
              {/* 刷新按钮 */}
              <button
                onClick={() => {
                  fetchDrafts(currentPage * pageSize);
                  fetchCount();
                  // 重新加载本地草稿
                  setLocalDrafts(loadLocalDrafts());
                }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>
            </div>
          </div>
        </div>

        {/* 草稿列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {loading && drafts.length === 0 && localDrafts.length === 0 ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">加载中...</p>
            </div>
          ) : drafts.length === 0 && localDrafts.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-500 dark:text-gray-400">暂无草稿</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* 显示本地草稿 */}
                {localDrafts.map((draft) => {
                  const filePath = draft.filePath;
                  
                  return (
                    <div
                      key={draft.mediaId}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* 封面图占位 */}
                        <div className="flex-shrink-0 w-32 h-24 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center relative">
                          <FileImage className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                          {/* 来源标识图标（右上角） */}
                          <div className="absolute top-1 right-1">
                            <div 
                              className="bg-green-500 rounded-full p-1.5 shadow-sm" 
                              title="本地导入的文章"
                            >
                              <FolderOpen className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        </div>
                        
                        {/* 内容区域 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                {draft.title}
                              </h3>
                              {/* 来源标识（文字标签） */}
                              <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded whitespace-nowrap">
                                <FolderOpen className="w-3 h-3" />
                                本地导入
                              </span>
                            </div>
                          </div>
                        
                        {draft.digest && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {draft.digest}
                          </p>
                        )}

                        {/* 文件路径显示 */}
                        {filePath && (
                          <div className="mb-3">
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <FolderOpen className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate" title={filePath}>
                                文件路径: {filePath}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          {draft.author && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{draft.author}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>更新: {formatDate(draft.updateTime)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(draft.mediaId)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(draft.mediaId)}
                          disabled={deletingId === draft.mediaId}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="删除"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
                
                {/* 显示公众号草稿 */}
                {drafts.map((draft) => {
                  const isImported = isImportedDraft(draft.mediaId);
                  const filePath = getDraftFilePath(draft.mediaId);
                  
                  return (
                    <div
                      key={draft.mediaId}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* 封面图占位 */}
                        <div className="flex-shrink-0 w-32 h-24 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center relative">
                          <FileImage className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                          {/* 来源标识图标（右上角） */}
                          <div className="absolute top-1 right-1">
                            {isImported ? (
                              <div 
                                className="bg-green-500 rounded-full p-1.5 shadow-sm" 
                                title="本地导入的文章"
                              >
                                <FolderOpen className="w-3.5 h-3.5 text-white" />
                              </div>
                            ) : (
                              <div 
                                className="bg-blue-500 rounded-full p-1.5 shadow-sm" 
                                title="公众号草稿箱的文章"
                              >
                                <Cloud className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* 内容区域 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                {draft.title}
                              </h3>
                              {/* 来源标识（文字标签） */}
                              {isImported ? (
                                <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded whitespace-nowrap">
                                  <FolderOpen className="w-3 h-3" />
                                  本地导入
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded whitespace-nowrap">
                                  <Cloud className="w-3 h-3" />
                                  公众号草稿
                                </span>
                              )}
                            </div>
                            {draft.articleCount > 1 && (
                              <span className="flex-shrink-0 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded">
                                共{draft.articleCount}篇
                              </span>
                            )}
                          </div>
                        
                        {draft.digest && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {draft.digest}
                          </p>
                        )}

                        {/* 文件路径显示 */}
                        {filePath && (
                          <div className="mb-3">
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <FolderOpen className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate" title={filePath}>
                                文件路径: {filePath}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          {draft.author && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{draft.author}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>更新: {formatDate(draft.updateTime)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(draft.mediaId)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(draft.mediaId)}
                          disabled={deletingId === draft.mediaId}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="删除"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
              
              {/* 分页 */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    第 {currentPage + 1} 页，共 {totalPages} 页
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 0 || loading}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages - 1 || loading}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

