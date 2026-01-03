import { Dialog, Transition } from '@headlessui/react';

interface AboutDialogProps {
  visible: boolean;
  onClose: () => void;
}

export function AboutDialog({ visible, onClose }: AboutDialogProps) {
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
              <Dialog.Title className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 text-lg font-semibold text-gray-900 dark:text-white">
                关于
              </Dialog.Title>

              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      微信 Markdown 编辑器
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      基于 md2wechat 项目移植，使用 React + TypeScript 重构。
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      功能特性
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                      <li>支持 Markdown 所有基础语法</li>
                      <li>实时预览微信格式</li>
                      <li>自定义 CSS 样式</li>
                      <li>图片上传（微信 API）</li>
                      <li>主题切换（浅色/暗黑）</li>
                      <li>文档导入/导出</li>
                    </ul>
                  </div>
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

