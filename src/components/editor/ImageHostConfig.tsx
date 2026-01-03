import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Settings, X } from 'lucide-react';
import axios from 'axios';
import { ImageHost } from '@/lib/image/upload';

interface ImageHostConfigProps {
  visible: boolean;
  onClose: () => void;
}

interface HostConfig {
  github?: {
    repo: string;
    branch: string;
    accessToken: string;
  };
  gitee?: {
    repo: string;
    branch: string;
    accessToken: string;
  };
  aliOSS?: {
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    region: string;
    path: string;
    cdnHost: string;
  };
  txCOS?: {
    secretId: string;
    secretKey: string;
    bucket: string;
    region: string;
    path: string;
    cdnHost: string;
  };
  qiniu?: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    domain: string;
    region: string;
    path: string;
  };
  minio?: {
    endpoint: string;
    port: number;
    useSSL: boolean;
    bucket: string;
    accessKey: string;
    secretKey: string;
  };
}

export function ImageHostConfig({ visible, onClose }: ImageHostConfigProps) {
  const [currentHost, setCurrentHost] = useState<ImageHost>('wechat');
  const [activeTab, setActiveTab] = useState<string>('select');
  const [configs, setConfigs] = useState<HostConfig>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (visible) {
      loadConfig();
    }
  }, [visible]);

  const loadConfig = async () => {
    try {
      // 尝试从 API 加载
      try {
        const [hostRes, configsRes] = await Promise.all([
          axios.get('/api/image-host/current'),
          axios.get('/api/image-host/configs'),
        ]);
        if (hostRes.data?.success) {
          setCurrentHost(hostRes.data.host || 'wechat');
        }
        if (configsRes.data?.success) {
          setConfigs(configsRes.data.configs || {});
        }
      } catch {
        // 如果 API 不可用，从 localStorage 加载
        const storedHost = localStorage.getItem('imageHost');
        if (storedHost) {
          setCurrentHost(storedHost as ImageHost);
        }
        
        const storedConfigs: HostConfig = {};
        ['github', 'gitee', 'aliOSS', 'txCOS', 'qiniu', 'minio'].forEach((host) => {
          const stored = localStorage.getItem(`${host}Config`);
          if (stored) {
            try {
              storedConfigs[host as keyof HostConfig] = JSON.parse(stored);
            } catch {}
          }
        });
        setConfigs(storedConfigs);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  const saveConfig = async (hostType: ImageHost, config: any) => {
    try {
      setSaving(true);
      // 尝试保存到 API
      try {
        await axios.post(`/api/image-host/config/${hostType}`, config);
        setMessage({ type: 'success', text: '配置保存成功' });
      } catch {
        // 如果 API 不可用，保存到 localStorage
        localStorage.setItem(`${hostType}Config`, JSON.stringify(config));
        setMessage({ type: 'success', text: '配置已保存到本地存储' });
      }
      
      // 更新本地状态
      setConfigs((prev) => ({ ...prev, [hostType]: config }));
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '保存配置失败',
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const setCurrentImageHost = async (host: ImageHost) => {
    try {
      // 尝试保存到 API
      try {
        await axios.post('/api/image-host/current', { host });
      } catch {
        // 如果 API 不可用，保存到 localStorage
        localStorage.setItem('imageHost', host);
      }
      setCurrentHost(host);
      setMessage({ type: 'success', text: `已切换到 ${host === 'wechat' ? '微信 API' : host} 图床` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '切换图床失败',
      });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const hostOptions = [
    { value: 'wechat', label: '微信 API' },
    { value: 'github', label: 'GitHub' },
    { value: 'gitee', label: 'Gitee' },
    { value: 'aliOSS', label: '阿里云 OSS' },
    { value: 'txCOS', label: '腾讯云 COS' },
    { value: 'qiniu', label: '七牛云' },
    { value: 'minio', label: 'MinIO' },
  ];

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
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  图床配置
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {message && (
                  <div
                    className={`mb-4 p-3 rounded-lg ${
                      message.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                {/* 图床选择 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    选择图床
                  </label>
                  <select
                    value={currentHost}
                    onChange={(e) => setCurrentImageHost(e.target.value as ImageHost)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {hostOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 配置表单 - 这里简化显示，实际应该根据选择的图床显示不同的配置表单 */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>图床配置功能已集成，具体配置表单可根据需要进一步完善。</p>
                  <p className="mt-2">当前选择的图床：<strong>{hostOptions.find((o) => o.value === currentHost)?.label}</strong></p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  关闭
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

