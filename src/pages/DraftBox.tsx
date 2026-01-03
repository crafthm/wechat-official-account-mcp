import { useState, useEffect } from "react";
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
} from "lucide-react";

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

export default function DraftBox({ onEditDraft, onNewArticle }: DraftBoxProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
                共 {totalCount} 个草稿
              </div>
              
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
          {loading && drafts.length === 0 ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">加载中...</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-500 dark:text-gray-400">暂无草稿</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {drafts.map((draft) => (
                  <div
                    key={draft.mediaId}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* 封面图占位 */}
                      <div className="flex-shrink-0 w-32 h-24 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        <FileImage className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      
                      {/* 内容区域 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {draft.title}
                          </h3>
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
                ))}
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

