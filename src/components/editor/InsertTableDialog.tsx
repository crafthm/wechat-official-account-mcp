import { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { createTable } from '@/lib/utils/formatter';

interface InsertTableDialogProps {
  visible: boolean;
  onClose: () => void;
  onInsert: (table: string) => void;
}

export function InsertTableDialog({
  visible,
  onClose,
  onInsert,
}: InsertTableDialogProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [data, setData] = useState<Record<string, string>>({});

  const handleInsert = () => {
    const table = createTable({ data, rows, cols });
    onInsert(table);
    onClose();
    // 重置
    setRows(3);
    setCols(3);
    setData({});
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
              <Dialog.Title className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 text-lg font-semibold text-gray-900 dark:text-white">
                插入表格
              </Dialog.Title>

              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      行数
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={rows}
                      onChange={(e) => setRows(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      列数
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={cols}
                      onChange={(e) => setCols(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  取消
                </button>
                <button
                  onClick={handleInsert}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  插入
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

