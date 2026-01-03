import { useState, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Settings } from 'lucide-react';
import { uploadImage, ImageHost } from '@/lib/image/upload';
import { checkImage } from '@/lib/image/validators';
import { ImageHostConfig } from './ImageHostConfig';
import axios from 'axios';

interface UploadImageDialogProps {
  visible: boolean;
  onClose: () => void;
  onUploaded: (url: string) => void;
}

export function UploadImageDialog({
  visible,
  onClose,
  onUploaded,
}: UploadImageDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentHost, setCurrentHost] = useState<ImageHost>('wechat');
  const [showConfig, setShowConfig] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible) {
      loadCurrentHost();
    }
  }, [visible]);

  const loadCurrentHost = async () => {
    try {
      // 尝试从 API 获取
      try {
        const response = await axios.get('/api/image-host/current');
        if (response.data?.success && response.data?.host) {
          setCurrentHost(response.data.host);
          return;
        }
      } catch {
        // 如果 API 不可用，从 localStorage 获取
      }
      
      // 从 localStorage 获取
      const stored = localStorage.getItem('imageHost');
      if (stored) {
        setCurrentHost(stored as ImageHost);
      }
    } catch (error) {
      console.error('加载当前图床失败:', error);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validation = checkImage(file);
    
    if (!validation.ok) {
      setError(validation.msg);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const url = await uploadImage({
        file,
        host: currentHost,
        onProgress: (progress) => {
          console.log('Upload progress:', progress);
        },
      });
      onUploaded(url);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
            <Dialog.Panel className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
              <Dialog.Title className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                <span>上传图片</span>
                <button
                  onClick={() => setShowConfig(true)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="图床配置"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </Dialog.Title>

              <div className="px-6 py-4">
                {/* 当前图床显示 */}
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  当前图床: <span className="font-medium text-gray-900 dark:text-white">
                    {currentHost === 'wechat' ? '微信 API' : currentHost}
                  </span>
                </div>

                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                  
                  {uploading ? (
                    <div className="text-gray-600 dark:text-gray-400">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p>上传中...</p>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                        拖拽图片到此处，或
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                        >
                          点击选择
                        </button>
                      </p>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                        支持 JPG、PNG、GIF 格式，最大 10MB
                      </p>
                    </>
                  )}
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={onClose}
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  取消
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>

      {/* 图床配置对话框 */}
      <ImageHostConfig
        visible={showConfig}
        onClose={() => {
          setShowConfig(false);
          loadCurrentHost(); // 重新加载当前图床
        }}
      />
    </Transition>
  );
}

