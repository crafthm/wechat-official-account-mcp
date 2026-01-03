import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Upload, Loader2, Info } from 'lucide-react';
import axios from 'axios';

interface PublishDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (publishId: string, msgDataId: string) => void;
  htmlContent: string;
}

export function PublishDialog({
  visible,
  onClose,
  onSuccess,
  htmlContent,
}: PublishDialogProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [digest, setDigest] = useState('');
  const [contentSourceUrl, setContentSourceUrl] = useState('');
  const [thumbMediaId, setThumbMediaId] = useState('');
  const [showCoverPic, setShowCoverPic] = useState(true);
  const [needOpenComment, setNeedOpenComment] = useState(false);
  const [onlyFansCanComment, setOnlyFansCanComment] = useState(false);
  const [isOriginal, setIsOriginal] = useState(false);
  const [originalSourceUrl, setOriginalSourceUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      // 从 HTML 内容中提取标题（如果有的话）
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const firstHeading = tempDiv.querySelector('h1, h2, h3');
      if (firstHeading && !title) {
        setTitle(firstHeading.textContent || '');
      }
    }
  }, [visible, htmlContent, title]);

  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError('封面图片大小不能超过 2MB');
        return;
      }
      setCoverImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const uploadCoverImage = async (): Promise<string> => {
    if (!coverImage) {
      throw new Error('请先选择封面图片');
    }

    setUploading(true);
    try {
      // 转换为 base64
      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // 移除 data:image/...;base64, 前缀
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(coverImage);
      });

      // 上传封面图到永久素材库
      const uploadResponse = await axios.post('/api/publish/upload-thumb', {
        fileData: base64Content,
        fileName: coverImage.name,
      });

      if (!uploadResponse.data.success) {
        throw new Error(uploadResponse.data.message || '上传封面图失败');
      }

      return uploadResponse.data.data.mediaId;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '上传封面图失败');
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      setError('请输入文章标题');
      return;
    }

    if (!coverImage && !thumbMediaId) {
      setError('请选择封面图片');
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      let finalThumbMediaId = thumbMediaId;
      
      // 如果没有 thumbMediaId，需要先上传封面图
      if (!finalThumbMediaId && coverImage) {
        finalThumbMediaId = await uploadCoverImage();
      }

      // 调用发布 API
      const response = await axios.post('/api/publish/submit', {
        title,
        author: author || '',
        digest: digest || '',
        contentSourceUrl: contentSourceUrl || '',
        content: htmlContent,
        thumbMediaId: finalThumbMediaId,
        showCoverPic: showCoverPic ? 1 : 0,
        needOpenComment: needOpenComment ? 1 : 0,
        onlyFansCanComment: onlyFansCanComment ? 1 : 0,
        isOriginal: isOriginal ? 1 : 0,
        originalSourceUrl: originalSourceUrl || '',
      });

      if (response.data.success) {
        onSuccess(response.data.data.publishId, response.data.data.msgDataId);
        onClose();
      } else {
        throw new Error(response.data.message || '发布失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Transition show={visible} as="div">
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
              <Dialog.Title className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                <span>发布文章</span>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Title>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                {/* 封面图和摘要区域 */}
                <div className="grid grid-cols-2 gap-4">
                  {/* 封面图 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      封面图片 <span className="text-red-500">*</span>
                    </label>
                    {coverImagePreview ? (
                      <div className="relative">
                        <img
                          src={coverImagePreview}
                          alt="封面预览"
                          className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                        />
                        <button
                          onClick={() => {
                            setCoverImage(null);
                            setCoverImagePreview(null);
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          disabled={publishing}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverImageSelect}
                          className="hidden"
                          id="cover-image-input"
                          disabled={publishing}
                        />
                        <label
                          htmlFor="cover-image-input"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <Upload className="w-6 h-6 text-gray-400 mb-2" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            拖拽或选择封面
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* 摘要 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      摘要
                    </label>
                    <textarea
                      value={digest}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 120) {
                          setDigest(value);
                        }
                      }}
                      rows={4}
                      maxLength={120}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      placeholder="选填,不填写则默认抓取正文开头部分文字,摘要会在转发卡片和公众号会话展示。"
                      disabled={publishing}
                    />
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
                      {digest.length}/120
                    </div>
                  </div>
                </div>

                {/* 标题 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="请输入文章标题"
                    disabled={publishing}
                  />
                </div>

                {/* 作者 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    作者
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="请输入作者名称（可选）"
                    disabled={publishing}
                  />
                </div>

                {/* 原文链接 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    原文链接
                  </label>
                  <input
                    type="url"
                    value={contentSourceUrl}
                    onChange={(e) => setContentSourceUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="请输入原文链接（可选）"
                    disabled={publishing}
                  />
                </div>

                {/* 分隔线 */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">其他设置</h3>
                  
                  {/* 显示封面 */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <label className="text-sm text-gray-700 dark:text-gray-300">显示封面</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">在文章中显示封面图片</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showCoverPic}
                        onChange={(e) => setShowCoverPic(e.target.checked)}
                        className="sr-only peer"
                        disabled={publishing}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* 留言设置 */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <label className="text-sm text-gray-700 dark:text-gray-300">开启留言</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">允许读者对文章进行评论</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={needOpenComment}
                        onChange={(e) => setNeedOpenComment(e.target.checked)}
                        className="sr-only peer"
                        disabled={publishing}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {needOpenComment && (
                    <div className="flex items-center justify-between py-2 pl-4">
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300">仅粉丝可评论</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">限制只有粉丝才能评论</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={onlyFansCanComment}
                          onChange={(e) => setOnlyFansCanComment(e.target.checked)}
                          className="sr-only peer"
                          disabled={publishing}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  )}

                  {/* 原创声明 */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <label className="text-sm text-gray-700 dark:text-gray-300">声明原创</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">需要公众号已开通原创声明功能</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOriginal}
                        onChange={(e) => setIsOriginal(e.target.checked)}
                        className="sr-only peer"
                        disabled={publishing}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {isOriginal && (
                    <div className="pl-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        原文链接（可选）
                      </label>
                      <input
                        type="url"
                        value={originalSourceUrl}
                        onChange={(e) => setOriginalSourceUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="如果文章在其他平台首发，请填写原文链接"
                        disabled={publishing}
                      />
                    </div>
                  )}
                </div>

                {/* 提示信息：需要在后台设置的功能 */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start">
                      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-2">功能说明：</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>原创声明：可通过上方开关设置，但需要公众号已开通原创声明功能（错误码85079表示未开通）</li>
                          <li>赞赏设置：需要在后台配置赞赏功能，无法通过API设置</li>
                          <li>合集：需要在后台创建和管理合集</li>
                          <li>创作来源：需要在后台设置</li>
                          <li>平台推荐：由平台自动推荐</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  disabled={publishing || uploading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing || uploading || !title.trim() || (!coverImage && !thumbMediaId)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {(publishing || uploading) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {uploading ? '上传中...' : publishing ? '发布中...' : '发布'}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

