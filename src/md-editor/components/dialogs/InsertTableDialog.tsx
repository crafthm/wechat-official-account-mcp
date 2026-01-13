import { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { useMdEditorStore } from '../../stores/editor-store';
import { createTable } from '@/lib/utils/formatter';

interface InsertTableDialogProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * 插入表格对话框
 * 从 3rd/md InsertFormDialog.vue 转换而来
 */
export function InsertTableDialog({
  visible,
  onClose,
}: InsertTableDialogProps) {
  const { insertAtCursor } = useMdEditorStore();
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [data, setData] = useState<Record<string, string>>({});

  const handleInsert = () => {
    const table = createTable({ data, rows, cols });
    insertAtCursor(`\n${table}\n`);
    // 重置
    setRows(3);
    setCols(3);
    setData({});
    onClose();
  };

  const updateCellData = (row: number, col: number, value: string) => {
    const key = `k_${row}_${col}`;
    setData(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const getCellValue = (row: number, col: number): string => {
    const key = `k_${row}_${col}`;
    return data[key] || '';
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
                <span>插入表格</span>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Title>

              <div className="px-6 py-4 overflow-y-auto flex-1">
                <div className="space-y-4">
                  {/* 行数和列数设置 */}
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        行数
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setRows(Math.max(1, rows - 1))}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={rows}
                          onChange={(e) => setRows(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                        />
                        <button
                          onClick={() => setRows(Math.min(100, rows + 1))}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        列数
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCols(Math.max(1, cols - 1))}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={cols}
                          onChange={(e) => setCols(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                        />
                        <button
                          onClick={() => setCols(Math.min(100, cols + 1))}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 表格数据输入 */}
                  <div className="border border-gray-300 dark:border-gray-600 rounded p-2 space-y-1">
                    {Array.from({ length: rows + 1 }).map((_, rowIndex) => (
                      <div
                        key={rowIndex}
                        className={`flex space-x-1 ${
                          rowIndex === 0 ? 'bg-gray-100 dark:bg-gray-900' : ''
                        }`}
                      >
                        {Array.from({ length: cols }).map((_, colIndex) => (
                          <input
                            key={`${rowIndex}-${colIndex}`}
                            type="text"
                            value={getCellValue(rowIndex, colIndex)}
                            onChange={(e) => updateCellData(rowIndex, colIndex, e.target.value)}
                            placeholder={rowIndex === 0 ? '表头' : ''}
                            className={`flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded ${
                              rowIndex === 0
                                ? 'bg-gray-100 dark:bg-gray-900 font-semibold'
                                : 'bg-white dark:bg-gray-800'
                            } text-gray-900 dark:text-white`}
                          />
                        ))}
                      </div>
                    ))}
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
                  确定
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
